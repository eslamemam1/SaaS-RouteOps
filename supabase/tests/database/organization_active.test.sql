-- The site operator stops and restarts a company's account. A stopped company
-- keeps its data but its login can neither read nor change it.
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000aa', 'operator@example.com'),
  ('a0000000-0000-0000-0000-000000000001', 'north@example.com'),
  ('b0000000-0000-0000-0000-000000000001', 'south@example.com');
insert into public.platform_operators (user_id) values
  ('00000000-0000-0000-0000-0000000000aa');
insert into public.organizations (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'North Transport'),
  ('20000000-0000-0000-0000-000000000001', 'South Transport');
insert into public.organization_memberships (organization_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001');
insert into public.customers (organization_id, name) values
  ('10000000-0000-0000-0000-000000000001', 'Delta Factory'),
  ('20000000-0000-0000-0000-000000000001', 'Nile Company');

set local role authenticated;

-- Signed in as the North login.
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is(
  (select count(*)::integer from public.customers),
  1,
  'an active company reads its records'
);
select throws_ok(
  $$select public.set_organization_active('10000000-0000-0000-0000-000000000001', false)$$,
  '42501', null,
  'a company login cannot stop an account'
);

-- Signed in as the operator.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000aa", "role": "authenticated"}';

select lives_ok(
  $$select public.set_organization_active('10000000-0000-0000-0000-000000000001', false)$$,
  'the operator stops an account'
);
select results_eq(
  $$select organization_name, is_active from public.operator_accounts() order by organization_name$$,
  $$values ('North Transport', false), ('South Transport', true)$$,
  'the operator sees which accounts are stopped'
);
select throws_ok(
  $$select public.set_organization_active('99999999-0000-0000-0000-000000000001', false)$$,
  'P0002', null,
  'stopping an unknown account is reported'
);

-- Signed in as the North login.
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select results_eq(
  $$select name, is_active from public.organizations$$,
  $$values ('North Transport', false)$$,
  'a stopped company still sees its own account and that it is stopped'
);
select is_empty(
  $$select * from public.customers$$,
  'a stopped company cannot read its records'
);
select throws_ok(
  $$insert into public.customers (organization_id, name)
    values ('10000000-0000-0000-0000-000000000001', 'Nour Company')$$,
  '42501', null,
  'a stopped company cannot add records'
);
select is_empty(
  $$select * from public.trip_report('10000000-0000-0000-0000-000000000001', '2026-01-01', '2026-12-31', '2026-12-31')$$,
  'a stopped company gets no report'
);

-- Signed in as the South login.
set local request.jwt.claims = '{"sub": "b0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is(
  (select count(*)::integer from public.customers),
  1,
  'stopping one company does not affect another'
);

-- Signed in as the operator.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000aa", "role": "authenticated"}';
select public.set_organization_active('10000000-0000-0000-0000-000000000001', true);

-- Signed in as the North login.
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is(
  (select count(*)::integer from public.customers),
  1,
  'a company turned back on reads all its records again'
);

reset role;
set local role anon;
select throws_ok(
  $$select public.set_organization_active('10000000-0000-0000-0000-000000000001', false)$$,
  '42501', null,
  'a visitor who is not signed in cannot change an account'
);

select * from finish();
rollback;
