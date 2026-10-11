-- The rules that keep a month's figures right: the company's own date, past
-- days prepared only from the routes that existed then, the driver a trip was
-- planned for, pay terms kept per month, no active route left on an inactive
-- customer, driver, or vehicle, and extra trips on their own customer's routes.
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Seed as the database owner, which bypasses row level security.
create schema tests;
grant usage on schema tests to authenticated;
-- The Sunday p_weeks weeks from the start of this week in Cairo.
create function tests.sunday(p_weeks integer)
returns date
language sql
stable
as $$
  select public.organization_today('10000000-0000-0000-0000-000000000001')
    - extract(dow from public.organization_today('10000000-0000-0000-0000-000000000001'))::integer
    + 7 * p_weeks
$$;
grant execute on function tests.sunday(integer) to authenticated;

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'north@example.com'),
  ('b0000000-0000-0000-0000-000000000001', 'south@example.com');
insert into public.organizations (id, name, time_zone) values
  ('10000000-0000-0000-0000-000000000001', 'North Transport', 'Africa/Cairo'),
  ('20000000-0000-0000-0000-000000000001', 'South Transport', 'Asia/Riyadh');
insert into public.organization_memberships (organization_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001');
insert into public.customers (id, organization_id, name) values
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Delta Factory'),
  ('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Nour Company');
insert into public.vehicles (id, organization_id, plate_number, vehicle_type) values
  ('12000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'BUS 1', 'bus');
insert into public.drivers (id, organization_id, full_name, pay_type, monthly_salary) values
  ('13000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ahmed', 'salary', 500000),
  ('13000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Karim', 'none', null);
-- Nasr City has run every day for a month; Heliopolis is added today.
insert into public.routes (id, organization_id, name, customer_id, vehicle_id, driver_id, start_point, end_point, outbound_time, return_time, operating_days, created_at) values
  ('14000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nasr City',
   '11000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001',
   '13000000-0000-0000-0000-000000000001', 'Hegaz Square', 'Delta gate', '07:00', null, '{0,1,2,3,4,5,6}',
   tests.sunday(-4)),
  ('14000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Heliopolis',
   '11000000-0000-0000-0000-000000000002', null,
   '13000000-0000-0000-0000-000000000001', 'Korba', 'Nour office', '08:00', null, '{0,1,2,3,4,5,6}',
   now());

-- The company's own date.
select is(
  public.organization_today('10000000-0000-0000-0000-000000000001'),
  (now() at time zone 'Africa/Cairo')::date,
  'a Cairo company''s today is the date in Cairo'
);
select is(
  public.organization_today('20000000-0000-0000-0000-000000000001'),
  (now() at time zone 'Asia/Riyadh')::date,
  'a Riyadh company''s today is the date in Riyadh'
);
select throws_ok(
  $$update public.organizations set time_zone = 'Europe/London' where id = '10000000-0000-0000-0000-000000000001'$$,
  '23514', null,
  'only the supported time zones are accepted'
);

-- Signed in as the North login for the rest of the file.
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- A past day gets only the routes that existed that day.
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(-1));
select results_eq(
  $$select route_id from public.daily_trips where service_date = tests.sunday(-1)$$,
  $$values ('14000000-0000-0000-0000-000000000001'::uuid)$$,
  'opening a past day late adds no trip for a route added after it'
);
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(2));
select is(
  (select count(*)::integer from public.daily_trips where service_date = tests.sunday(2)),
  2,
  'a coming day gets every running route'
);

-- The driver a trip was planned for.
select is(
  (select planned_driver_id from public.daily_trips
   where service_date = tests.sunday(2) and route_id = '14000000-0000-0000-0000-000000000001'),
  '13000000-0000-0000-0000-000000000001'::uuid,
  'a prepared trip keeps the driver it was planned for'
);
update public.routes set driver_id = '13000000-0000-0000-0000-000000000002'
where id = '14000000-0000-0000-0000-000000000001';
select results_eq(
  $$select driver_id, planned_driver_id from public.daily_trips
    where service_date = tests.sunday(2) and route_id = '14000000-0000-0000-0000-000000000001'$$,
  $$values ('13000000-0000-0000-0000-000000000002'::uuid, '13000000-0000-0000-0000-000000000002'::uuid)$$,
  'an opened coming day follows the route''s new driver at once'
);
select is(
  (select driver_id from public.daily_trips
   where service_date = tests.sunday(-1) and route_id = '14000000-0000-0000-0000-000000000001'),
  '13000000-0000-0000-0000-000000000001'::uuid,
  'a past day keeps the driver who drove it'
);

-- An extra trip names only a route of its own customer.
select throws_ok(
  $$insert into public.daily_trips (organization_id, route_id, service_date, direction, departure_time, customer_id, driver_id, is_extra)
    values ('10000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', tests.sunday(2),
            'outbound', '21:00', '11000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000001', true)$$,
  '23514', null,
  'an extra trip cannot name another customer''s route'
);
select lives_ok(
  $$insert into public.daily_trips (organization_id, route_id, service_date, direction, departure_time, customer_id, driver_id, is_extra)
    values ('10000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000002', tests.sunday(2),
            'outbound', '21:00', '11000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000001', true)$$,
  'an extra trip may name a route of its own customer'
);

-- Pay terms kept per month.
select results_eq(
  $$select starts_on, monthly_salary from public.driver_pay_terms
    where driver_id = '13000000-0000-0000-0000-000000000001'$$,
  $$values (date_trunc('month', public.organization_today('10000000-0000-0000-0000-000000000001')::timestamp)::date, 500000::bigint)$$,
  'a driver''s pay terms start in the month they were saved'
);
reset role;
insert into public.driver_pay_terms (organization_id, driver_id, starts_on, pay_type, monthly_salary)
values ('10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '2026-01-01', 'salary', 400000);
set local role authenticated;
update public.drivers set monthly_salary = 600000 where id = '13000000-0000-0000-0000-000000000001';
select is(
  (select monthly_salary from public.driver_pay(
     '10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-15')
   where driver_id = '13000000-0000-0000-0000-000000000001'),
  400000::bigint,
  'a raise today does not change what a past month''s salary was'
);
select is(
  (select monthly_salary from public.driver_pay(
     '10000000-0000-0000-0000-000000000001',
     date_trunc('month', public.organization_today('10000000-0000-0000-0000-000000000001')::timestamp)::date,
     public.organization_today('10000000-0000-0000-0000-000000000001'),
     public.organization_today('10000000-0000-0000-0000-000000000001'))
   where driver_id = '13000000-0000-0000-0000-000000000001'),
  600000::bigint,
  'the month of the raise uses the new salary'
);
select is(
  (select monthly_salary from public.driver_pay(
     '10000000-0000-0000-0000-000000000001', '2025-11-01', '2025-11-30', '2025-12-15')
   where driver_id = '13000000-0000-0000-0000-000000000001'),
  400000::bigint,
  'a month before the first saved terms uses those first terms'
);
select throws_ok(
  $$insert into public.driver_pay_terms (organization_id, driver_id, starts_on, pay_type, monthly_salary)
    values ('10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '2026-02-01', 'salary', 1)$$,
  '42501', null,
  'a member cannot rewrite pay terms directly'
);

-- No active route on an inactive customer, driver, or vehicle.
select throws_ok(
  $$update public.drivers set is_active = false where id = '13000000-0000-0000-0000-000000000002'$$,
  'P0001', 'active_routes',
  'a driver of an active route cannot be made inactive'
);
select throws_ok(
  $$update public.customers set is_active = false where id = '11000000-0000-0000-0000-000000000001'$$,
  'P0001', 'active_routes',
  'a customer with an active route cannot be made inactive'
);
select throws_ok(
  $$update public.vehicles set is_active = false where id = '12000000-0000-0000-0000-000000000001'$$,
  'P0001', 'active_routes',
  'a vehicle of an active route cannot be made inactive'
);
update public.routes set is_active = false where id = '14000000-0000-0000-0000-000000000001';
select lives_ok(
  $$update public.drivers set is_active = false where id = '13000000-0000-0000-0000-000000000002'$$,
  'a driver is made inactive once no active route uses them'
);
select throws_ok(
  $$update public.routes set is_active = true where id = '14000000-0000-0000-0000-000000000001'$$,
  'P0001', 'inactive_choice',
  'a route cannot run again with an inactive driver'
);
select lives_ok(
  $$update public.routes set driver_id = '13000000-0000-0000-0000-000000000001', is_active = true
    where id = '14000000-0000-0000-0000-000000000001'$$,
  'a route runs again with an active driver'
);

-- Changing how trips are recorded starts today.
select public.set_trip_recording('10000000-0000-0000-0000-000000000001', 'manual');
select results_eq(
  $$select starts_on, trip_recording from public.trip_recording_periods$$,
  $$values (public.organization_today('10000000-0000-0000-0000-000000000001'), 'manual'::text)$$,
  'switching to recording by hand starts a period today'
);
select is(
  public.trip_recording_on('10000000-0000-0000-0000-000000000001', tests.sunday(-1)),
  'automatic',
  'the days before the switch stay recorded automatically'
);

-- Signed in as the South login.
set local request.jwt.claims = '{"sub": "b0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is_empty(
  $$select * from public.driver_pay_terms$$,
  'a member cannot read another organization''s pay terms'
);
select is_empty(
  $$select * from public.trip_recording_periods where organization_id = '10000000-0000-0000-0000-000000000001'$$,
  'a member cannot read how another organization records trips'
);

select * from finish();
rollback;
