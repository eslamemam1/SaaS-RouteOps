-- The site operator sees every company account and its logins; a company
-- login sees none of them.
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

insert into auth.users (id, email, last_sign_in_at) values
  ('00000000-0000-0000-0000-0000000000aa', 'operator@example.com', null),
  ('a0000000-0000-0000-0000-000000000001', 'north@example.com', '2026-02-03 08:00+02'),
  ('b0000000-0000-0000-0000-000000000001', 'south@example.com', null);
insert into public.platform_operators (user_id) values
  ('00000000-0000-0000-0000-0000000000aa');
insert into public.organizations (id, name, currency, created_at) values
  ('10000000-0000-0000-0000-000000000001', 'North Transport', 'EGP', '2026-01-01'),
  ('20000000-0000-0000-0000-000000000001', 'South Transport', 'SAR', '2026-01-02'),
  ('30000000-0000-0000-0000-000000000001', 'Empty Transport', 'EGP', '2026-01-03');
insert into public.organization_memberships (organization_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001');

-- Signed in as the operator.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000aa", "role": "authenticated"}';

select results_eq(
  $$select organization_name, currency, login_emails, last_sign_in_at
    from public.operator_accounts()$$,
  $$values
    ('Empty Transport', 'EGP', '{}'::text[], null::timestamptz),
    ('South Transport', 'SAR', '{south@example.com}'::text[], null::timestamptz),
    ('North Transport', 'EGP', '{north@example.com}'::text[], '2026-02-03 08:00+02'::timestamptz)$$,
  'the operator sees every company, newest first, with its logins and last sign-in'
);

-- Signed in as the North login.
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is_empty(
  $$select * from public.operator_accounts()$$,
  'a company login does not see the list of companies'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.operator_accounts()$$,
  '42501', null,
  'a visitor who is not signed in cannot list the companies'
);

select * from finish();
rollback;
