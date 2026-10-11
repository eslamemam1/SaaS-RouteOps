import { createClient } from 'npm:@supabase/supabase-js@2';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// The app translates these codes. Keep them in sync with
// CompanyAccountProblem in libs/organizations.
type Problem =
  | 'login'
  | 'password'
  | 'operatorOnly'
  | 'signedOut'
  | 'passwordChange';

// Keep in sync with minimumPasswordLength in libs/organizations.
const minimumPasswordLength = 6;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    return await setCompanyPassword(request);
  } catch {
    return json({ error: 'passwordChange' }, 500);
  }
});

// The site operator gives a company login that forgot its password a new
// one. Only a login that belongs to a company can be changed this way, never
// another operator.
async function setCompanyPassword(request: Request): Promise<Response> {
  const url = Deno.env.get('SUPABASE_URL');
  const publishableKey =
    Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !publishableKey || !serviceRoleKey) {
    return json({ error: 'passwordChange' }, 500);
  }

  const parsed = parseBody(await request.json().catch(() => null));
  if ('error' in parsed) {
    return json({ error: parsed.error }, 400);
  }

  const caller = createClient(url, publishableKey, {
    global: {
      headers: {
        Authorization: request.headers.get('Authorization') ?? '',
      },
    },
  });
  const { data: userData, error: userError } = await caller.auth.getUser();
  const userId = userData.user?.id;
  if (userError || !userId) {
    return json({ error: 'signedOut' }, 401);
  }

  const admin = createClient(url, serviceRoleKey);
  const { data: operator, error: operatorError } = await admin
    .from('platform_operators')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (operatorError || !operator) {
    return json({ error: 'operatorOnly' }, 403);
  }

  const [membership, targetOperator] = await Promise.all([
    admin
      .from('organization_memberships')
      .select('user_id')
      .eq('user_id', parsed.loginId)
      .limit(1),
    admin
      .from('platform_operators')
      .select('user_id')
      .eq('user_id', parsed.loginId)
      .maybeSingle(),
  ]);
  if (membership.error || targetOperator.error) {
    return json({ error: 'passwordChange' }, 500);
  }
  if ((membership.data ?? []).length === 0 || targetOperator.data) {
    return json({ error: 'login' }, 400);
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    parsed.loginId,
    { password: parsed.password },
  );
  if (updateError) {
    return json({ error: 'passwordChange' }, 500);
  }

  return json({ changed: true }, 200);
}

function parseBody(
  body: unknown,
): { loginId: string; password: string } | { error: Problem } {
  if (typeof body !== 'object' || body === null) {
    return { error: 'login' };
  }
  const record = body as Record<string, unknown>;
  const loginId = typeof record['loginId'] === 'string' ? record['loginId'] : '';
  const password =
    typeof record['password'] === 'string' ? record['password'] : '';

  if (!uuidPattern.test(loginId)) {
    return { error: 'login' };
  }
  if (password.length < minimumPasswordLength) {
    return { error: 'password' };
  }
  return { loginId, password };
}

function json(
  body: { error: Problem } | { changed: true },
  status: number,
): Response {
  return new Response(JSON.stringify(body), { status, headers });
}
