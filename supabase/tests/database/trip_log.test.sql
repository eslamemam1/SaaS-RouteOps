-- trip_log lists each trip of one driver or one vehicle with the status it
-- counts under, and always agrees with trip_report. North and South are two
-- companies. 2026-02-01 is a Sunday; the route runs Sunday to Thursday, and
-- today is Monday 2026-02-02.
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
  ('12000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'NORTH 1', 'bus');
insert into public.drivers (id, organization_id, full_name) values
  ('13000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ahmed'),
  ('13000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Karim');
insert into public.routes (id, organization_id, name, customer_id, vehicle_id, driver_id, start_point, end_point, outbound_time, outbound_arrival_time, return_time, return_arrival_time, operating_days, trip_price, created_at) values
  ('14000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nasr City', '11000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Hegaz Square', 'Factory', '07:00', '09:00', '16:00', '18:00', '{0,1,2,3,4}', 10000, '2026-01-01');

select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-01');
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-02');
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-03');
update public.daily_trips
set driver_id = '13000000-0000-0000-0000-000000000002', change_reason = 'driver_absent'
where service_date = '2026-02-02' and direction = 'outbound';
update public.daily_trips
set is_cancelled = true, change_reason = 'holiday'
where service_date = '2026-02-02' and direction = 'return';
insert into public.daily_trips (organization_id, customer_id, driver_id, service_date, direction, departure_time, arrival_time, is_extra, trip_price) values
  ('10000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000002', '2026-02-01', 'outbound', '21:00', '23:00', true, 7000);

-- Signed in as the North login.
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select results_eq(
  $$select service_date, direction, driver_id, status
    from public.trip_log('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-02-02',
      p_driver_id => '13000000-0000-0000-0000-000000000001')$$,
  $$values
    ('2026-02-01'::date, 'outbound', '13000000-0000-0000-0000-000000000001'::uuid, 'done'),
    ('2026-02-01'::date, 'return', '13000000-0000-0000-0000-000000000001'::uuid, 'done'),
    ('2026-02-02'::date, 'outbound', '13000000-0000-0000-0000-000000000002'::uuid, 'done'),
    ('2026-02-02'::date, 'return', '13000000-0000-0000-0000-000000000001'::uuid, 'cancelled'),
    ('2026-02-03'::date, 'outbound', '13000000-0000-0000-0000-000000000001'::uuid, 'planned'),
    ('2026-02-03'::date, 'return', '13000000-0000-0000-0000-000000000001'::uuid, 'planned')$$,
  'a driver sees the trips they drove and the trips planned for them that another driver took'
);
select results_eq(
  $$select direction, is_extra, price
    from public.trip_log('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-01', '2026-02-02',
      p_driver_id => '13000000-0000-0000-0000-000000000002')$$,
  $$values ('outbound', true, 7000::bigint)$$,
  'an extra trip keeps its own price'
);
select is(
  (select count(*)::integer
   from public.trip_log('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-02-02',
     p_vehicle_id => '12000000-0000-0000-0000-000000000001')
   where price = 5000),
  6,
  'a vehicle sees its route trips at half the shift price, and not a trip that names no vehicle'
);
select results_eq(
  $$select driver_id, count(*)::integer
    from public.trip_log('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-02-02')
    where status = 'done'
    group by driver_id
    order by driver_id$$,
  $$select driver_id, sum(done_trips)::integer
    from public.trip_report('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-02-02')
    group by driver_id
    order by driver_id$$,
  'recording automatically, the done trips are the ones the report counts'
);

-- A company that has recorded by hand since February.
reset role;
insert into public.trip_recording_periods (organization_id, starts_on, trip_recording)
values ('10000000-0000-0000-0000-000000000001', '2026-02-01', 'manual');
update public.daily_trips set is_done = true
where service_date = '2026-02-01' and direction = 'outbound' and not is_extra;
set local role authenticated;

select results_eq(
  $$select service_date, direction, status
    from public.trip_log('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-02', '2026-02-02',
      p_driver_id => '13000000-0000-0000-0000-000000000001')$$,
  $$values
    ('2026-02-01'::date, 'outbound', 'done'),
    ('2026-02-01'::date, 'return', 'unrecorded'),
    ('2026-02-02'::date, 'outbound', 'unrecorded'),
    ('2026-02-02'::date, 'return', 'cancelled')$$,
  'recording by hand, a trip nobody marked done waits to be recorded'
);
select results_eq(
  $$select driver_id, count(*)::integer
    from public.trip_log('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-02-02')
    where status = 'done'
    group by driver_id
    order by driver_id$$,
  $$select driver_id, sum(done_trips)::integer
    from public.trip_report('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-02-02')
    group by driver_id
    order by driver_id$$,
  'recording by hand, the done trips are still the ones the report counts'
);

-- Signed in as the South login.
set local request.jwt.claims = '{"sub": "b0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is_empty(
  $$select * from public.trip_log('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-02-02')$$,
  'a member cannot list another organization''s trips'
);

-- North's account is stopped.
reset role;
update public.organizations set is_active = false where id = '10000000-0000-0000-0000-000000000001';
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is_empty(
  $$select * from public.trip_log('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-02-02')$$,
  'a stopped organization cannot list its trips'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.trip_log('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-02-02')$$,
  '42501', null,
  'a visitor who is not signed in cannot list trips'
);

select * from finish();
rollback;
