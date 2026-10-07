-- Expenses stay inside their organization, add up per category and vehicle,
-- and a driver's pay comes from the trips the driver did and missed.
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
insert into public.drivers (id, organization_id, full_name, pay_type, monthly_salary, salary_trips, outbound_pay, return_pay) values
  ('13000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ahmed', 'salary', 500000, 1, 5000, 4000),
  ('13000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Karim', 'per_trip', null, null, 6000, 3000),
  ('13000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Samy', 'none', null, null, null, null);
insert into public.routes (id, organization_id, name, customer_id, vehicle_id, driver_id, start_point, end_point, outbound_time, return_time, operating_days, created_at) values
  ('14000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nasr City', '11000000-0000-0000-0000-000000000001',
   '12000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Hegaz Square', 'Factory', '07:00', '16:00', '{0,1,2,3,4}',
   '2026-01-01');
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-01');
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-02');
insert into public.daily_trips (organization_id, service_date, direction, departure_time, customer_id, vehicle_id, driver_id, is_extra) values
  ('10000000-0000-0000-0000-000000000001', '2026-02-02', 'outbound', '20:00', '11000000-0000-0000-0000-000000000001',
   '12000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', true);
-- Ahmed was absent for the return trip of 2026-02-02, so Karim drove it.
update public.daily_trips
set driver_id = '13000000-0000-0000-0000-000000000002', change_reason = 'driver_absent'
where service_date = '2026-02-02' and direction = 'return' and not is_extra;

select throws_ok(
  $$update public.drivers set monthly_salary = null where full_name = 'Ahmed'$$,
  '23514', null,
  'a salaried driver has a salary'
);
select throws_ok(
  $$update public.drivers set outbound_pay = null, return_pay = null where full_name = 'Ahmed'$$,
  '23514', null,
  'a salary that covers a number of trips has the amounts for the trips beyond them'
);
select throws_ok(
  $$update public.drivers set monthly_salary = 100000 where full_name = 'Karim'$$,
  '23514', null,
  'a driver paid per trip has no salary'
);
select lives_ok(
  $$update public.drivers set salary_trips = null, outbound_pay = null, return_pay = null where full_name = 'Ahmed'$$,
  'a salary may be fixed whatever the driver does'
);
update public.drivers set salary_trips = 1, outbound_pay = 5000, return_pay = 4000 where full_name = 'Ahmed';

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

-- Recording automatically, the two opened days give Ahmed two route outbound
-- trips, the extra outbound trip, and one return trip, and the return he
-- missed. Karim earns the return he covered. Samy has no pay terms.
select results_eq(
  $$select driver_id, pay_type, monthly_salary, salary_trips, outbound_pay, return_pay,
      done_outbound, done_return, absent_outbound, absent_return, recorded
    from public.driver_pay('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-15')
    order by driver_id$$,
  $$values
    ('13000000-0000-0000-0000-000000000001'::uuid, 'salary', 500000::bigint, 1, 5000::bigint, 4000::bigint, 3, 1, 0, 1, 0::bigint),
    ('13000000-0000-0000-0000-000000000002'::uuid, 'per_trip', null::bigint, null::integer, 6000::bigint, 3000::bigint, 0, 1, 0, 0, 0::bigint)$$,
  'drivers with pay terms are listed with the trips they did and missed'
);

insert into public.expenses (organization_id, spent_on, category, amount, driver_id)
values ('10000000-0000-0000-0000-000000000001', '2026-02-28', 'salaries', 510000, '13000000-0000-0000-0000-000000000001');

select is(
  (select recorded
   from public.driver_pay('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-15')
   where driver_id = '13000000-0000-0000-0000-000000000001'),
  510000::bigint,
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
