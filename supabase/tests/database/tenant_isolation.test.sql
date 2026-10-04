-- Each transport company sees and changes only its own data.
-- North and South are two companies; each has one login.
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Seed as the database owner, which bypasses row level security.
create schema tests;
grant usage on schema tests to authenticated, anon;
-- The Sunday p_weeks weeks from the start of this week.
create function tests.sunday(p_weeks integer)
returns date
language sql
stable
as $$
  select current_date - extract(dow from current_date)::integer + 7 * p_weeks
$$;
grant execute on function tests.sunday(integer) to authenticated, anon;

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
  ('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Nour Company'),
  ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Misr Bank');
insert into public.vehicles (id, organization_id, plate_number, vehicle_type) values
  ('12000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'NORTH 1', 'bus'),
  ('22000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'SOUTH 1', 'bus');
insert into public.drivers (id, organization_id, full_name) values
  ('13000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ahmed'),
  ('23000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Karim');
insert into public.routes (id, organization_id, name, customer_id, vehicle_id, driver_id, start_point, end_point, outbound_time, return_time, operating_days) values
  ('14000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nasr City', '11000000-0000-0000-0000-000000000001',
   '12000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Hegaz Square', 'Factory', '07:00', '16:00', '{0,1,2,3,4}'),
  ('24000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Maadi', '21000000-0000-0000-0000-000000000001',
   '22000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', 'Maadi', 'Bank', '08:00', null, '{0,1,2,3,4}');
select public.prepare_daily_trips('20000000-0000-0000-0000-000000000001', tests.sunday(2));

-- Signed in as the North login.
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select results_eq(
  'select id from public.organizations',
  $$values ('10000000-0000-0000-0000-000000000001'::uuid)$$,
  'a member sees only their own organization'
);
select is((select count(*)::integer from public.customers), 2, 'a member sees only their own client companies');
select is((select count(*)::integer from public.vehicles), 1, 'a member sees only their own vehicles');
select is((select count(*)::integer from public.drivers), 1, 'a member sees only their own drivers');
select is((select count(*)::integer from public.routes), 1, 'a member sees only their own routes');
select is((select count(*)::integer from public.daily_trips), 0, 'a member sees none of another organization''s trips');

select throws_ok(
  $$insert into public.customers (organization_id, name)
    values ('20000000-0000-0000-0000-000000000001', 'Planted customer')$$,
  '42501', null,
  'a member cannot add a client company to another organization'
);
select throws_ok(
  $$insert into public.routes (organization_id, name, customer_id, vehicle_id, driver_id, start_point, end_point, outbound_time, operating_days)
    values ('10000000-0000-0000-0000-000000000001', 'Borrowed bus', '11000000-0000-0000-0000-000000000001',
            '22000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'A', 'B', '07:00', '{0}')$$,
  '23503', null,
  'a route cannot use a vehicle of another organization'
);
select throws_ok(
  $$insert into public.routes (organization_id, name, customer_id, driver_id, start_point, end_point, outbound_time, operating_days)
    values ('10000000-0000-0000-0000-000000000001', 'Borrowed customer', '21000000-0000-0000-0000-000000000001',
            '13000000-0000-0000-0000-000000000001', 'A', 'B', '07:00', '{0}')$$,
  '23503', null,
  'a route cannot serve a client company of another organization'
);
select is_empty(
  $$update public.customers set name = 'Renamed' where id = '21000000-0000-0000-0000-000000000001' returning id$$,
  'a member cannot rename a client company of another organization'
);
select is_empty(
  $$update public.daily_trips set is_done = true
    where organization_id = '20000000-0000-0000-0000-000000000001' returning id$$,
  'a member cannot mark another organization''s trips done'
);
select throws_ok(
  $$delete from public.routes where id = '14000000-0000-0000-0000-000000000001'$$,
  '42501', null,
  'nobody deletes a route; it is marked inactive instead'
);
select throws_ok(
  $$insert into public.daily_trips (organization_id, service_date, direction, departure_time, customer_id, driver_id, is_extra)
    values ('20000000-0000-0000-0000-000000000001', tests.sunday(2), 'outbound', '21:00',
            '21000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', true)$$,
  '42501', null,
  'a member cannot add an extra trip to another organization'
);
select throws_ok(
  $$select public.set_trip_recording('20000000-0000-0000-0000-000000000001', 'manual')$$,
  '42501', null,
  'a member cannot change how another organization records trips'
);
select lives_ok(
  $$select public.prepare_daily_trips('20000000-0000-0000-0000-000000000001', tests.sunday(3))$$,
  'preparing another organization''s day does nothing harmful'
);
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(2));
select is((select count(*)::integer from public.daily_trips), 2, 'a member prepares their own day');

-- Signed in as the South login.
set local request.jwt.claims = '{"sub": "b0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is(
  (select count(*)::integer from public.daily_trips
   where organization_id = '10000000-0000-0000-0000-000000000001'),
  0,
  'another organization''s member sees none of these trips'
);
select is_empty(
  $$delete from public.daily_trips where organization_id = '10000000-0000-0000-0000-000000000001' returning id$$,
  'another organization''s member cannot remove these trips'
);

-- Not signed in.
reset role;
set local role anon;
select throws_ok('select * from public.customers', '42501', null, 'a visitor who is not signed in reads nothing');
select throws_ok('select * from public.daily_trips', '42501', null, 'a visitor who is not signed in reads no trips');

-- Checked as the database owner.
reset role;
select is(
  (select name from public.customers where id = '21000000-0000-0000-0000-000000000001'),
  'Misr Bank',
  'the other organization''s client company kept its name'
);
select is(
  (select count(*)::integer from public.daily_trips where service_date = tests.sunday(3)),
  0,
  'preparing another organization''s day created no trips'
);
select is(
  (select count(*)::integer from public.daily_trips where organization_id = '20000000-0000-0000-0000-000000000001' and is_done),
  0,
  'the other organization''s trips were not marked done'
);
select is(
  (select count(*)::integer from public.daily_trips where organization_id = '10000000-0000-0000-0000-000000000001'),
  2,
  'the trips survived the other organization''s delete'
);
select is(
  (select count(*)::integer from public.operations_settings),
  0,
  'the other organization''s recording choice was not changed'
);

select * from finish();
rollback;
