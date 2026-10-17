-- Driver and vehicle occupancy: trips and active routes must not overlap
-- from departure until arrival. Ending when another starts is allowed.
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'north@example.com');
insert into public.organizations (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'North Transport');
insert into public.organization_memberships (organization_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');
insert into public.customers (id, organization_id, name) values
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Delta Factory');
insert into public.vehicles (id, organization_id, plate_number, vehicle_type) values
  ('12000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'NORTH 1', 'bus'),
  ('12000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'NORTH 2', 'bus');
insert into public.drivers (id, organization_id, full_name) values
  ('13000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ahmed'),
  ('13000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Karim');

insert into public.routes (
  id, organization_id, name, customer_id, vehicle_id, driver_id,
  start_point, end_point, outbound_time, outbound_arrival_time,
  return_time, return_arrival_time, operating_days, created_at
) values (
  '14000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Nasr City',
  '11000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000001',
  '13000000-0000-0000-0000-000000000001',
  'Hegaz Square', 'Factory',
  '07:00', '09:00', '15:00', '17:00',
  '{0,1,2,3,4}', '2026-01-01'
);

select is(
  public.times_overlap('07:00', '09:00', '08:00', '10:00'),
  true,
  'overlapping intervals conflict'
);
select is(
  public.times_overlap('07:00', '09:00', '09:00', '11:00'),
  false,
  'ending when another starts is allowed'
);
select is(
  public.times_overlap('07:00', '09:00', '15:00', '17:00'),
  false,
  'morning and evening shifts do not overlap'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$insert into public.routes (
    organization_id, name, customer_id, vehicle_id, driver_id,
    start_point, end_point, outbound_time, outbound_arrival_time, operating_days
  ) values (
    '10000000-0000-0000-0000-000000000001', 'Conflict Driver',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000002',
    '13000000-0000-0000-0000-000000000001',
    'A', 'B', '08:00', '10:00', '{0,1,2,3,4}'
  )$$,
  'P0001', 'driver_overlap',
  'an active route cannot share a driver with an overlapping trip'
);

select throws_ok(
  $$insert into public.routes (
    organization_id, name, customer_id, vehicle_id, driver_id,
    start_point, end_point, outbound_time, outbound_arrival_time, operating_days
  ) values (
    '10000000-0000-0000-0000-000000000001', 'Conflict Vehicle',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '13000000-0000-0000-0000-000000000002',
    'A', 'B', '08:00', '10:00', '{0,1,2,3,4}'
  )$$,
  'P0001', 'vehicle_overlap',
  'an active route cannot share a vehicle with an overlapping trip'
);

select lives_ok(
  $$insert into public.routes (
    id, organization_id, name, customer_id, vehicle_id, driver_id,
    start_point, end_point, outbound_time, outbound_arrival_time, operating_days
  ) values (
    '14000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001', 'Evening Only',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000002',
    '13000000-0000-0000-0000-000000000001',
    'A', 'B', '18:00', '20:00', '{0,1,2,3,4}'
  )$$,
  'the same driver may run a later non-overlapping trip'
);

select public.prepare_daily_trips(
  '10000000-0000-0000-0000-000000000001',
  '2026-02-01'
);

select throws_ok(
  $$insert into public.daily_trips (
    organization_id, service_date, direction, departure_time, arrival_time,
    customer_id, vehicle_id, driver_id, is_extra
  ) values (
    '10000000-0000-0000-0000-000000000001', '2026-02-01', 'outbound',
    '08:00', '10:00',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000002',
    '13000000-0000-0000-0000-000000000001',
    true
  )$$,
  'P0001', 'driver_overlap',
  'an extra trip cannot put the same driver on an overlapping ride'
);

select throws_ok(
  $$insert into public.daily_trips (
    organization_id, service_date, direction, departure_time, arrival_time,
    customer_id, vehicle_id, driver_id, is_extra
  ) values (
    '10000000-0000-0000-0000-000000000001', '2026-02-01', 'outbound',
    '08:00', '10:00',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '13000000-0000-0000-0000-000000000002',
    true
  )$$,
  'P0001', 'vehicle_overlap',
  'an extra trip cannot put the same vehicle on an overlapping ride'
);

select lives_ok(
  $$insert into public.daily_trips (
    organization_id, service_date, direction, departure_time, arrival_time,
    customer_id, vehicle_id, driver_id, is_extra
  ) values (
    '10000000-0000-0000-0000-000000000001', '2026-02-01', 'outbound',
    '09:00', '10:00',
    '11000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000002',
    '13000000-0000-0000-0000-000000000001',
    true
  )$$,
  'a trip that starts when the outbound ends is allowed'
);

select * from finish();
rollback;
