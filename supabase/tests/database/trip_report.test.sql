-- The monthly report counts done trips per customer, vehicle, and driver, and
-- lists the days nobody opened. North and South are two companies.
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
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Delta Factory'),
  ('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Nour Company');
insert into public.vehicles (id, organization_id, plate_number, vehicle_type) values
  ('12000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'NORTH 1', 'bus');
insert into public.drivers (id, organization_id, full_name) values
  ('13000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ahmed');
insert into public.routes (id, organization_id, name, customer_id, vehicle_id, driver_id, start_point, end_point, outbound_time, return_time, operating_days, created_at) values
  ('14000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nasr City', '11000000-0000-0000-0000-000000000001',
   '12000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Hegaz Square', 'Factory', '07:00', '16:00', '{0,1,2,3,4}',
   '2026-01-01');

select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-01');
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-02');
update public.daily_trips
set is_cancelled = true, change_reason = 'holiday'
where service_date = '2026-02-02' and direction = 'return';
insert into public.drivers (id, organization_id, full_name) values
  ('13000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Karim');
insert into public.daily_trips (organization_id, customer_id, vehicle_id, driver_id, service_date, direction, departure_time, is_extra, notes) values
  ('10000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000001',
   '13000000-0000-0000-0000-000000000002', '2026-02-05', 'outbound', '21:00', true, 'Airport run');

-- Signed in as the North login.
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select results_eq(
  $$select customer_id, vehicle_id, driver_id, sum(done_trips)::integer, sum(extra_trips)::integer
    from public.trip_report('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-15')
    group by customer_id, vehicle_id, driver_id
    order by customer_id$$,
  $$values
    ('11000000-0000-0000-0000-000000000001'::uuid, '12000000-0000-0000-0000-000000000001'::uuid, '13000000-0000-0000-0000-000000000001'::uuid, 3, 0),
    ('11000000-0000-0000-0000-000000000002'::uuid, '12000000-0000-0000-0000-000000000001'::uuid, '13000000-0000-0000-0000-000000000002'::uuid, 1, 1)$$,
  'recording automatically, every trip that is not cancelled counts once its day has come'
);
select is(
  (select sum(done_trips)::integer
   from public.trip_report('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-02-01')),
  2,
  'a trip whose day has not come yet does not count'
);
select is(
  (select sum(done_trips)::integer
   from public.trip_report('10000000-0000-0000-0000-000000000001', '2026-03-01', '2026-03-31', '2026-03-15')),
  null,
  'a month without trips has no rows'
);

select results_eq(
  $$select * from public.unopened_days('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-07')$$,
  $$values ('2026-02-03'::date), ('2026-02-04'::date), ('2026-02-05'::date)$$,
  'lists the working days nobody opened, even one with only an extra trip'
);
select is_empty(
  $$select * from public.unopened_days('10000000-0000-0000-0000-000000000001', '2025-12-28', '2025-12-31')$$,
  'a day before the route was created is not missing'
);

select lives_ok(
  $$select public.set_trip_recording('10000000-0000-0000-0000-000000000001', 'manual')$$,
  'the company switches to recording by hand'
);
update public.daily_trips set is_done = true
where service_date = '2026-02-01' and direction = 'outbound';
select is(
  (select sum(done_trips)::integer
   from public.trip_report('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-15')),
  1,
  'recording by hand, only the trips marked done count'
);

-- Signed in as the South login.
set local request.jwt.claims = '{"sub": "b0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is_empty(
  $$select * from public.trip_report('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-15')$$,
  'a member cannot count another organization''s trips'
);
select is_empty(
  $$select * from public.unopened_days('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-07')$$,
  'a member cannot see another organization''s missing days'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.trip_report('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-15')$$,
  '42501', null,
  'a visitor who is not signed in cannot run the report'
);

select * from finish();
rollback;
