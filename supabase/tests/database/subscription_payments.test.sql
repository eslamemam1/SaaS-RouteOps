-- Only the site operator records and reads the subscriptions companies pay;
-- a company login cannot see or add any, even its own.
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000aa', 'operator@example.com'),
  ('a0000000-0000-0000-0000-000000000001', 'north@example.com');
insert into public.platform_operators (user_id) values
  ('00000000-0000-0000-0000-0000000000aa');
insert into public.organizations (id, name, currency, is_active) values
  ('10000000-0000-0000-0000-000000000001', 'North Transport', 'EGP', true),
  ('20000000-0000-0000-0000-000000000001', 'South Transport', 'SAR', false);
insert into public.organization_memberships (organization_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');

-- Signed in as the operator.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000aa", "role": "authenticated"}';

select lives_ok(
  $$insert into public.subscription_payments (organization_id, paid_on, covers_month, amount, note)
    values
      ('10000000-0000-0000-0000-000000000001', '2026-10-03', '2026-10-01', 150000, 'Bank transfer'),
      ('20000000-0000-0000-0000-000000000001', '2026-09-28', '2026-09-01', 50000, null)$$,
  'the operator records payments, also for a stopped company'
);

select results_eq(
  $$select organization_id::text, amount, recorded_by::text
    from public.subscription_payments order by covers_month$$,
  $$values
    ('20000000-0000-0000-0000-000000000001', 50000::bigint, '00000000-0000-0000-0000-0000000000aa'),
    ('10000000-0000-0000-0000-000000000001', 150000::bigint, '00000000-0000-0000-0000-0000000000aa')$$,
  'the operator reads every payment, each recorded under the operator'
);

select throws_ok(
  $$insert into public.subscription_payments (organization_id, paid_on, covers_month, amount)
    values ('10000000-0000-0000-0000-000000000001', '2026-10-03', '2026-10-01', 0)$$,
  '23514', null,
  'a payment has an amount above zero'
);

select throws_ok(
  $$insert into public.subscription_payments (organization_id, paid_on, covers_month, amount)
    values ('10000000-0000-0000-0000-000000000001', '2026-10-03', '2026-10-15', 100)$$,
  '23514', null,
  'a payment covers a whole month'
);

select throws_ok(
  $$insert into public.subscription_payments (organization_id, paid_on, covers_month, amount, recorded_by)
    values ('10000000-0000-0000-0000-000000000001', '2026-10-03', '2026-10-01', 100,
      'a0000000-0000-0000-0000-000000000001')$$,
  '42501', null,
  'the operator cannot record a payment under another login'
);

-- Signed in as the North login.
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is_empty(
  $$select * from public.subscription_payments$$,
  'a company login does not see any payment, not even its own'
);

select throws_ok(
  $$insert into public.subscription_payments (organization_id, paid_on, covers_month, amount)
    values ('10000000-0000-0000-0000-000000000001', '2026-10-03', '2026-10-01', 100)$$,
  '42501', null,
  'a company login cannot record a payment'
);

delete from public.subscription_payments;

-- Back as the operator, the company login deleted nothing.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000aa", "role": "authenticated"}';

select is(
  (select count(*) from public.subscription_payments),
  2::bigint,
  'a company login cannot delete payments'
);

select lives_ok(
  $$delete from public.subscription_payments where amount = 50000$$,
  'the operator deletes a payment recorded by mistake'
);

select is(
  (select count(*) from public.subscription_payments),
  1::bigint,
  'only that payment is gone'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.subscription_payments$$,
  '42501', null,
  'a visitor who is not signed in cannot read payments'
);

select * from finish();
rollback;
