import { createClient } from 'npm:@supabase/supabase-js@2';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const messages = {
  organizationName: 'Enter an organization name.',
  organizationNameLength: 'Use a shorter organization name.',
  email: 'Enter an email address.',
  emailFormat: 'Use a valid email address.',
  password: 'Use at least 6 characters for the password.',
  emailTaken: 'An account with that email already exists.',
  operatorOnly: 'Only the site operator can create a company.',
  signedOut: 'Sign in to continue.',
  create: 'Could not create the company.',
} as const;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    return await provisionCompany(request);
  } catch {
    return json({ error: messages.create }, 500);
  }
});

async function provisionCompany(request: Request): Promise<Response> {
  const url = Deno.env.get('SUPABASE_URL');
  const publishableKey =
    Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !publishableKey || !serviceRoleKey) {
    return json({ error: messages.create }, 500);
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
    return json({ error: messages.signedOut }, 401);
  }

  const admin = createClient(url, serviceRoleKey);
  const { data: operator, error: operatorError } = await admin
    .from('platform_operators')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (operatorError || !operator) {
    return json({ error: messages.operatorOnly }, 403);
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
      { error: taken ? messages.emailTaken : messages.create },
      taken ? 400 : 500,
    );
  }

  const { data: organization, error: organizationError } = await admin
    .from('organizations')
    .insert({ name: parsed.organizationName })
    .select('id, name')
    .single();
  if (organizationError || !organization) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: messages.create }, 500);
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
    return json({ error: messages.create }, 500);
  }

  return json({ organizationName: organization.name }, 200);
}

function parseBody(
  body: unknown,
): { organizationName: string; email: string; password: string } | { error: string } {
  if (typeof body !== 'object' || body === null) {
    return { error: messages.create };
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

  if (organizationName.length === 0) {
    return { error: messages.organizationName };
  }
  if (organizationName.length > 200) {
    return { error: messages.organizationNameLength };
  }
  if (email.length === 0) {
    return { error: messages.email };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: messages.emailFormat };
  }
  if (password.length < 6) {
    return { error: messages.password };
  }
  return { organizationName, email, password };
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers });
}
