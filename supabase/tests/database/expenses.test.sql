-- Expenses stay inside their organization, add up per category and vehicle,
-- and a driver's suggested pay comes from the done trips.
-- 2026-02-01 is a Sunday; the route runs Sunday to Thursday.
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'north@example.com'),
  ('b0000000-0000-0000-0000-000000000001', 'south@example.com');
insert into public.organizations (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'North Transport'),
  ('20000000-0000-0000-0000-000000000001', 'South Transport');
insert into public.organization_memberships (organization_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001');
insert into public.customers (id, organization_id, name) values
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Delta Factory');
insert into public.vehicles (id, organization_id, plate_number, vehicle_type) values
  ('12000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'NORTH 1', 'bus'),
  ('22000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'SOUTH 1', 'bus');
insert into public.drivers (id, organization_id, full_name, monthly_salary, trip_pay) values
  ('13000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ahmed', 500000, 5000),
  ('13000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Karim', null, null);
insert into public.routes (id, organization_id, name, customer_id, vehicle_id, driver_id, start_point, end_point, outbound_time, return_time, operating_days, created_at) values
  ('14000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nasr City', '11000000-0000-0000-0000-000000000001',
   '12000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Hegaz Square', 'Factory', '07:00', '16:00', '{0,1,2,3,4}',
   '2026-01-01');
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-01');
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-02');

-- Signed in as the North login.
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$insert into public.expenses (organization_id, spent_on, category, amount, vehicle_id) values
      ('10000000-0000-0000-0000-000000000001', '2026-02-03', 'fuel', 150000, '12000000-0000-0000-0000-000000000001'),
      ('10000000-0000-0000-0000-000000000001', '2026-02-10', 'fuel', 50000, '12000000-0000-0000-0000-000000000001'),
      ('10000000-0000-0000-0000-000000000001', '2026-02-11', 'office', 30000, null),
      ('10000000-0000-0000-0000-000000000001', '2026-03-01', 'fuel', 99900, null)$$,
  'a member records expenses with or without a vehicle'
);
select throws_ok(
  $$insert into public.expenses (organization_id, spent_on, category, amount)
    values ('10000000-0000-0000-0000-000000000001', '2026-02-03', 'other', 1000)$$,
  '23514', null,
  'an expense of another kind needs a description'
);
select throws_ok(
  $$insert into public.expenses (organization_id, spent_on, category, amount)
    values ('10000000-0000-0000-0000-000000000001', '2026-02-03', 'fuel', 0)$$,
  '23514', null,
  'an expense has an amount above zero'
);
select throws_ok(
  $$insert into public.expenses (organization_id, spent_on, category, amount, vehicle_id)
    values ('10000000-0000-0000-0000-000000000001', '2026-02-03', 'fuel', 1000, '22000000-0000-0000-0000-000000000001')$$,
  '23503', null,
  'an expense cannot name a vehicle of another organization'
);
select throws_ok(
  $$insert into public.expenses (organization_id, spent_on, category, amount)
    values ('20000000-0000-0000-0000-000000000001', '2026-02-03', 'fuel', 1000)$$,
  '42501', null,
  'a member cannot add an expense to another organization'
);

select results_eq(
  $$select category, vehicle_id, total
    from public.expense_totals('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28')
    order by category$$,
  $$values
    ('fuel', '12000000-0000-0000-0000-000000000001'::uuid, 200000::bigint),
    ('office', null::uuid, 30000::bigint)$$,
  'expenses add up per category and vehicle within the month'
);

-- Recording automatically, the two opened days give Ahmed four done trips.
select results_eq(
  $$select driver_id, done_trips, monthly_salary, trip_pay, recorded
    from public.driver_pay('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-15')$$,
  $$values ('13000000-0000-0000-0000-000000000001'::uuid, 4, 500000::bigint, 5000::bigint, 0::bigint)$$,
  'only drivers with pay terms are listed, with their done trips'
);

insert into public.expenses (organization_id, spent_on, category, amount, driver_id)
values ('10000000-0000-0000-0000-000000000001', '2026-02-28', 'salaries', 520000, '13000000-0000-0000-0000-000000000001');

select is(
  (select recorded
   from public.driver_pay('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-15')),
  520000::bigint,
  'salary recorded for the driver in the month is shown'
);

select lives_ok(
  $$delete from public.expenses where category = 'office'$$,
  'a member removes an expense recorded by mistake'
);

-- Signed in as the South login.
set local request.jwt.claims = '{"sub": "b0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is_empty(
  $$select * from public.expenses$$,
  'a member cannot read another organization''s expenses'
);
select is_empty(
  $$select * from public.driver_pay('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-15')$$,
  'a member cannot see another organization''s driver pay'
);

reset role;
update public.organizations set is_active = false
where id = '10000000-0000-0000-0000-000000000001';
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is_empty(
  $$select * from public.expenses$$,
  'a stopped company cannot read its expenses'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.expense_totals('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28')$$,
  '42501', null,
  'a visitor who is not signed in cannot read expense totals'
);

select * from finish();
rollback;
