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
  | 'organizationName'
  | 'organizationNameLength'
  | 'email'
  | 'emailFormat'
  | 'password'
  | 'currency'
  | 'emailTaken'
  | 'operatorOnly'
  | 'signedOut'
  | 'create';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    return await provisionCompany(request);
  } catch {
    return json({ error: 'create' }, 500);
  }
});

async function provisionCompany(request: Request): Promise<Response> {
  const url = Deno.env.get('SUPABASE_URL');
  const publishableKey =
    Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !publishableKey || !serviceRoleKey) {
    return json({ error: 'create' }, 500);
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

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: parsed.email,
      password: parsed.password,
      email_confirm: true,
    });
  if (createError || !created.user) {
    const taken = createError?.message.toLowerCase().includes('already');
    return json(
      { error: taken ? 'emailTaken' : 'create' },
      taken ? 400 : 500,
    );
  }

  const { data: organization, error: organizationError } = await admin
    .from('organizations')
    .insert({ name: parsed.organizationName, currency: parsed.currency })
    .select('id, name')
    .single();
  if (organizationError || !organization) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: 'create' }, 500);
  }

  const { error: membershipError } = await admin
    .from('organization_memberships')
    .insert({
      organization_id: organization.id,
      user_id: created.user.id,
    });
  if (membershipError) {
    await admin.from('organizations').delete().eq('id', organization.id);
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: 'create' }, 500);
  }

  return json({ organizationName: organization.name }, 200);
}

// Keep in sync with currencies in libs/shared/money and the
// organizations_currency_known check.
const currencies = ['EGP', 'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD'];

function parseBody(
  body: unknown,
):
  | { organizationName: string; email: string; password: string; currency: string }
  | { error: Problem } {
  if (typeof body !== 'object' || body === null) {
    return { error: 'create' };
  }
  const record = body as Record<string, unknown>;
  const organizationName =
    typeof record['organizationName'] === 'string'
      ? record['organizationName'].trim()
      : '';
  const email =
    typeof record['email'] === 'string' ? record['email'].trim() : '';
  const password =
    typeof record['password'] === 'string' ? record['password'] : '';
  const currency = record['currency'] ?? 'EGP';

  if (organizationName.length === 0) {
    return { error: 'organizationName' };
  }
  if (organizationName.length > 200) {
    return { error: 'organizationNameLength' };
  }
  if (email.length === 0) {
    return { error: 'email' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'emailFormat' };
  }
  if (password.length < 6) {
    return { error: 'password' };
  }
  if (typeof currency !== 'string' || !currencies.includes(currency)) {
    return { error: 'currency' };
  }
  return { organizationName, email, password, currency };
}

function json(
  body: { error: Problem } | { organizationName: string },
  status: number,
): Response {
  return new Response(JSON.stringify(body), { status, headers });
}
