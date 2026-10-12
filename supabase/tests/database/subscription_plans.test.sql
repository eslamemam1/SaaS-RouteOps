-- Everyone reads the active plans and the discounts; only the operator changes
-- them and records a company's subscription, and a company cannot add or
-- reactivate a vehicle beyond its limit.
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000aa', 'operator@example.com'),
  ('a0000000-0000-0000-0000-000000000001', 'north@example.com');
insert into public.platform_operators (user_id) values
  ('00000000-0000-0000-0000-0000000000aa');
insert into public.organizations (id, name, currency) values
  ('10000000-0000-0000-0000-000000000001', 'North Transport', 'EGP'),
  ('20000000-0000-0000-0000-000000000001', 'South Transport', 'SAR');
insert into public.organization_memberships (organization_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');
insert into public.subscription_plans (id, currency, name_ar, name_en, vehicle_limit, monthly_price, is_active) values
  ('50000000-0000-0000-0000-000000000001', 'EGP', 'بداية', 'Starter', 2, 75000, true),
  ('50000000-0000-0000-0000-000000000002', 'EGP', 'قديمة', 'Old', 10, 90000, false);

-- A visitor who is not signed in.
set local role anon;

select results_eq(
  $$select name_en from public.subscription_plans$$,
  $$values ('Starter')$$,
  'a visitor sees only the active plans'
);
select results_eq(
  $$select months::integer, discount_percent::integer from public.subscription_periods order by months$$,
  $$values (1, 0), (3, 10), (6, 15), (12, 20)$$,
  'a visitor sees the discount of each period'
);
select throws_ok(
  $$insert into public.subscription_plans (currency, name_ar, name_en) values ('EGP', 'س', 'S')$$,
  '42501', null,
  'a visitor cannot add a plan'
);

-- Signed in as the North login.
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$insert into public.subscription_plans (currency, name_ar, name_en) values ('EGP', 'س', 'S')$$,
  '42501', null,
  'a company login cannot add a plan'
);
select is_empty(
  $$update public.subscription_periods set discount_percent = 50 where months = 12 returning months$$,
  'a company login cannot change a discount'
);
select throws_ok(
  $$insert into public.organization_subscriptions (organization_id, plan_id, months, starts_on, price)
    values ('10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 1, '2020-01-01', 75000)$$,
  '42501', null,
  'a company login cannot give itself a subscription'
);
select lives_ok(
  $$insert into public.vehicles (organization_id, plate_number, vehicle_type)
    values ('10000000-0000-0000-0000-000000000001', 'NO LIMIT 1', 'bus'),
           ('10000000-0000-0000-0000-000000000001', 'NO LIMIT 2', 'bus'),
           ('10000000-0000-0000-0000-000000000001', 'NO LIMIT 3', 'bus')$$,
  'a company without a subscription has no vehicle limit'
);
update public.vehicles set is_active = false where plate_number in ('NO LIMIT 2', 'NO LIMIT 3');

-- Signed in as the operator.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000aa", "role": "authenticated"}';

select results_eq(
  $$select name_en from public.subscription_plans order by name_en$$,
  $$values ('Old'), ('Starter')$$,
  'the operator also sees the plans no longer offered'
);
select lives_ok(
  $$update public.subscription_periods set discount_percent = 12 where months = 3$$,
  'the operator changes a discount'
);
select throws_ok(
  $$update public.subscription_periods set discount_percent = 5 where months = 1$$,
  '23514', null,
  'one month is always at full price'
);
select throws_ok(
  $$insert into public.organization_subscriptions (organization_id, plan_id, months, starts_on, price)
    values ('20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 1, '2020-01-01', 75000)$$,
  'P0001', 'plan_currency',
  'a plan in another currency cannot be sold to the company'
);
select throws_ok(
  $$insert into public.organization_subscriptions (organization_id, plan_id, months, starts_on, price)
    values ('10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 2, '2020-01-01', 75000)$$,
  '23503', null,
  'only the offered periods can be sold'
);
select lives_ok(
  $$insert into public.organization_subscriptions (organization_id, plan_id, months, starts_on, vehicle_limit, price)
    values ('10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 3, '2020-01-15', 2, 198000)$$,
  'the operator records a subscription'
);
select is(
  (select ends_on from public.organization_subscriptions),
  '2020-04-14'::date,
  'a subscription ends the day before the same date months later'
);
select results_eq(
  $$select active_vehicles from public.operator_vehicle_usage()
    where organization_id = '10000000-0000-0000-0000-000000000001'$$,
  $$values (1)$$,
  'the operator sees how many vehicles a company has active'
);

-- Back as the North login, with a limit of two vehicles that has ended.
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is_empty(
  $$select * from public.organization_subscriptions$$,
  'a company login does not see its subscriptions'
);
select is_empty(
  $$select * from public.operator_vehicle_usage()$$,
  'a company login does not see the vehicle usage of companies'
);
select lives_ok(
  $$update public.vehicles set is_active = true where plate_number = 'NO LIMIT 2'$$,
  'a vehicle may be reactivated up to the limit'
);
select throws_ok(
  $$update public.vehicles set is_active = true where plate_number = 'NO LIMIT 3'$$,
  'P0001', 'vehicle_limit',
  'a vehicle cannot be reactivated beyond the limit, even after the subscription ended'
);
select throws_ok(
  $$insert into public.vehicles (organization_id, plate_number, vehicle_type)
    values ('10000000-0000-0000-0000-000000000001', 'OVER 1', 'bus')$$,
  'P0001', 'vehicle_limit',
  'a vehicle cannot be added beyond the limit'
);
select lives_ok(
  $$insert into public.vehicles (organization_id, plate_number, vehicle_type, is_active)
    values ('10000000-0000-0000-0000-000000000001', 'SPARE 1', 'bus', false)$$,
  'an inactive vehicle may still be added'
);
select lives_ok(
  $$update public.vehicles set model = 'Coaster' where plate_number = 'NO LIMIT 1'$$,
  'an active vehicle may still be edited at the limit'
);

-- A subscription that starts later does not change today's limit.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000aa", "role": "authenticated"}';
insert into public.organization_subscriptions (organization_id, plan_id, months, starts_on, vehicle_limit, price)
values ('10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 1, '2999-01-01', null, 75000);
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$insert into public.vehicles (organization_id, plate_number, vehicle_type)
    values ('10000000-0000-0000-0000-000000000001', 'OVER 2', 'bus')$$,
  'P0001', 'vehicle_limit',
  'a subscription that has not started yet does not lift the limit'
);

select * from finish();
rollback;
