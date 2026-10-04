-- Daily operations as a company uses them: preparing days from the routes,
-- one-day changes, permanent route changes, done marks, holidays,
-- the recording choice, extra trips, and route names per client company.
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Seed as the database owner, which bypasses row level security.
create schema tests;
grant usage on schema tests to authenticated;
-- The Sunday p_weeks weeks from the start of this week.
create function tests.sunday(p_weeks integer)
returns date
language sql
stable
as $$
  select current_date - extract(dow from current_date)::integer + 7 * p_weeks
$$;
grant execute on function tests.sunday(integer) to authenticated;
-- The trip of a route on a day in one direction, ignoring extra trips.
create function tests.trip(p_route uuid, p_day date, p_direction text)
returns public.daily_trips
language sql
stable
as $$
  select * from public.daily_trips
  where route_id = p_route and service_date = p_day and direction = p_direction and not is_extra
$$;
grant execute on function tests.trip(uuid, date, text) to authenticated;

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
  ('12000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'BUS 1', 'bus'),
  ('12000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'BUS 2', 'minibus');
insert into public.drivers (id, organization_id, full_name) values
  ('13000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ahmed'),
  ('13000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Mahmoud');
-- Nasr City for Delta runs Sunday to Thursday, outbound and return.
-- Nasr City for Nour runs on Sundays only, outbound only, with its own vehicle and driver.
insert into public.routes (id, organization_id, name, customer_id, vehicle_id, driver_id, start_point, end_point, outbound_time, return_time, operating_days) values
  ('14000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nasr City',
   '11000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001',
   '13000000-0000-0000-0000-000000000001', 'Hegaz Square', 'Delta gate', '07:00', '16:00', '{0,1,2,3,4}'),
  ('14000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Nasr City',
   '11000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000002',
   '13000000-0000-0000-0000-000000000002', 'Abbas El Akkad', 'Nour office', '08:00', null, '{0}');

-- Signed in as the North login for the rest of the file.
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- Route names: unique per client company, shared across companies.
-- These routes are inactive so they add no trips below.
select lives_ok(
  $$insert into public.routes (organization_id, name, customer_id, driver_id, start_point, end_point, outbound_time, operating_days, is_active)
    values ('10000000-0000-0000-0000-000000000001', 'Heliopolis', '11000000-0000-0000-0000-000000000001',
            '13000000-0000-0000-0000-000000000001', 'A', 'B', '07:00', '{0}', false)$$,
  'a member adds a route'
);
select lives_ok(
  $$insert into public.routes (organization_id, name, customer_id, driver_id, start_point, end_point, outbound_time, operating_days, is_active)
    values ('10000000-0000-0000-0000-000000000001', 'Heliopolis', '11000000-0000-0000-0000-000000000002',
            '13000000-0000-0000-0000-000000000001', 'C', 'D', '09:00', '{1}', false)$$,
  'the same route name serves another client company with its own points, time, and days'
);
select throws_ok(
  $$insert into public.routes (organization_id, name, customer_id, driver_id, start_point, end_point, outbound_time, operating_days, is_active)
    values ('10000000-0000-0000-0000-000000000001', 'Heliopolis', '11000000-0000-0000-0000-000000000001',
            '13000000-0000-0000-0000-000000000001', 'E', 'F', '10:00', '{2}', false)$$,
  '23505', null,
  'one client company cannot have two routes with the same name'
);
select throws_ok(
  $$insert into public.routes (organization_id, name, customer_id, driver_id, start_point, end_point, operating_days)
    values ('10000000-0000-0000-0000-000000000001', 'No times', '11000000-0000-0000-0000-000000000001',
            '13000000-0000-0000-0000-000000000001', 'A', 'B', '{0}')$$,
  '23514', null,
  'a route needs an outbound or a return time'
);
select throws_ok(
  $$insert into public.routes (organization_id, name, customer_id, start_point, end_point, outbound_time, operating_days)
    values ('10000000-0000-0000-0000-000000000001', 'No driver', '11000000-0000-0000-0000-000000000001',
            'A', 'B', '07:00', '{0}')$$,
  '23502', null,
  'a route needs a driver'
);

-- A past day is prepared first, to check later that route changes leave it alone.
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(-1));
select is(
  (select count(*)::integer from public.daily_trips where service_date = tests.sunday(-1)),
  3,
  'a past day can be prepared to record what happened'
);

-- Preparing a coming day.
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(2));
select is(
  (select count(*)::integer from public.daily_trips where service_date = tests.sunday(2)),
  3,
  'a Sunday gets outbound and return for the first route and outbound for the second'
);
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(2));
select is(
  (select count(*)::integer from public.daily_trips where service_date = tests.sunday(2)),
  3,
  'preparing the same day twice adds no duplicates'
);
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(2) + 1);
select is(
  (select count(*)::integer from public.daily_trips where service_date = tests.sunday(2) + 1),
  2,
  'a Monday gets only the route that runs on Mondays'
);
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(2) + 5);
select is(
  (select count(*)::integer from public.daily_trips where service_date = tests.sunday(2) + 5),
  0,
  'a Friday off has no trips'
);
select results_eq(
  $$select departure_time, vehicle_id, driver_id, customer_id
    from tests.trip('14000000-0000-0000-0000-000000000001', tests.sunday(2), 'outbound')$$,
  $$values ('07:00'::time, '12000000-0000-0000-0000-000000000001'::uuid,
            '13000000-0000-0000-0000-000000000001'::uuid, '11000000-0000-0000-0000-000000000001'::uuid)$$,
  'a trip copies the time, vehicle, driver, and client company of its route'
);
select is_empty(
  $$insert into public.daily_trips (organization_id, route_id, service_date, direction, departure_time, customer_id, driver_id)
    values ('10000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', tests.sunday(2),
            'outbound', '07:00', '11000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001')
    on conflict do nothing returning id$$,
  'a route keeps one planned trip per day and direction'
);

-- A one-day change: the driver is absent on the return trip.
select lives_ok(
  $$update public.daily_trips
    set driver_id = '13000000-0000-0000-0000-000000000002', change_reason = 'driver_absent'
    where id = (tests.trip('14000000-0000-0000-0000-000000000001', tests.sunday(2), 'return')).id$$,
  'a member swaps the driver of one trip with a reason'
);
-- A done mark on the second route's trip.
select lives_ok(
  $$update public.daily_trips set is_done = true
    where id = (tests.trip('14000000-0000-0000-0000-000000000002', tests.sunday(2), 'outbound')).id$$,
  'a member marks a trip done'
);

-- Permanent route changes.
update public.routes
set outbound_time = '07:30', vehicle_id = '12000000-0000-0000-0000-000000000002'
where id = '14000000-0000-0000-0000-000000000001';
update public.routes set outbound_time = '09:00' where id = '14000000-0000-0000-0000-000000000002';
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(2));
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(-1));

select results_eq(
  $$select departure_time, vehicle_id
    from tests.trip('14000000-0000-0000-0000-000000000001', tests.sunday(2), 'outbound')$$,
  $$values ('07:30'::time, '12000000-0000-0000-0000-000000000002'::uuid)$$,
  'a coming trip nobody changed follows the edited route'
);
select results_eq(
  $$select vehicle_id, driver_id, change_reason
    from tests.trip('14000000-0000-0000-0000-000000000001', tests.sunday(2), 'return')$$,
  $$values ('12000000-0000-0000-0000-000000000001'::uuid, '13000000-0000-0000-0000-000000000002'::uuid, 'driver_absent'::text)$$,
  'a trip changed for one day keeps its change after the route is edited'
);
select is(
  (tests.trip('14000000-0000-0000-0000-000000000002', tests.sunday(2), 'outbound')).departure_time,
  '08:00'::time,
  'a trip marked done keeps what happened after the route is edited'
);
select results_eq(
  $$select departure_time, vehicle_id
    from tests.trip('14000000-0000-0000-0000-000000000001', tests.sunday(-1), 'outbound')$$,
  $$values ('07:00'::time, '12000000-0000-0000-0000-000000000001'::uuid)$$,
  'editing a route never rewrites a past day'
);

-- The route stops running on Sundays.
update public.routes set operating_days = '{1,2,3,4}' where id = '14000000-0000-0000-0000-000000000001';
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(2));
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(-1));
select is(
  (tests.trip('14000000-0000-0000-0000-000000000001', tests.sunday(2), 'outbound')).id,
  null,
  'a coming trip nobody changed is removed when its route stops running that day'
);
select isnt(
  (tests.trip('14000000-0000-0000-0000-000000000001', tests.sunday(2), 'return')).id,
  null,
  'a changed trip stays when its route stops running that day'
);
select is(
  (select count(*)::integer from public.daily_trips where service_date = tests.sunday(-1)),
  3,
  'past trips stay when a route stops running that day'
);

-- An inactive route prepares no new trips.
update public.routes set is_active = false where id = '14000000-0000-0000-0000-000000000002';
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(3));
select is(
  (select count(*)::integer from public.daily_trips
   where service_date = tests.sunday(3) and route_id = '14000000-0000-0000-0000-000000000002'),
  0,
  'a route marked inactive gets no new trips'
);

-- Rules every trip follows.
select throws_ok(
  $$update public.daily_trips set is_cancelled = true
    where id = (tests.trip('14000000-0000-0000-0000-000000000001', tests.sunday(2) + 1, 'outbound')).id$$,
  '23514', null,
  'a cancellation needs a reason'
);
select throws_ok(
  $$update public.daily_trips set change_reason = 'other'
    where id = (tests.trip('14000000-0000-0000-0000-000000000001', tests.sunday(2) + 1, 'outbound')).id$$,
  '23514', null,
  'the reason "other" needs a note'
);
select lives_ok(
  $$update public.daily_trips set change_reason = 'other', notes = 'Road closed'
    where id = (tests.trip('14000000-0000-0000-0000-000000000001', tests.sunday(2) + 1, 'outbound')).id$$,
  'the reason "other" with a note is accepted'
);
select throws_ok(
  $$update public.daily_trips set is_cancelled = true, change_reason = 'holiday'
    where id = (tests.trip('14000000-0000-0000-0000-000000000002', tests.sunday(2), 'outbound')).id$$,
  '23514', null,
  'a trip cannot be done and cancelled at once'
);
select is_empty(
  $$delete from public.daily_trips
    where id = (tests.trip('14000000-0000-0000-0000-000000000001', tests.sunday(2), 'return')).id
    returning id$$,
  'a member cannot delete a trip of a route; it is cancelled instead'
);
select is_empty(
  $$delete from public.daily_trips where service_date = tests.sunday(-1) returning id$$,
  'a member cannot delete past trips'
);

-- A holiday for one client company.
select lives_ok(
  $$update public.daily_trips set is_cancelled = true, is_done = false, change_reason = 'holiday'
    where service_date = tests.sunday(2) and customer_id = '11000000-0000-0000-0000-000000000002'$$,
  'a holiday cancels a client company''s trips, done ones included'
);
select is(
  (select count(*)::integer from public.daily_trips
   where service_date = tests.sunday(2) and customer_id = '11000000-0000-0000-0000-000000000001' and not is_cancelled),
  1,
  'a holiday for one client company leaves the other company''s trips running'
);

-- How trips are recorded.
select is_empty('select 1 from public.operations_settings', 'a company records trips automatically until it chooses');
select public.set_trip_recording('10000000-0000-0000-0000-000000000001', 'manual');
select is((select trip_recording from public.operations_settings), 'manual', 'a company switches to manual recording');
select public.set_trip_recording('10000000-0000-0000-0000-000000000001', 'automatic');
select results_eq(
  'select trip_recording from public.operations_settings',
  $$values ('automatic'::text)$$,
  'switching back updates the one setting'
);
select throws_ok(
  $$select public.set_trip_recording('10000000-0000-0000-0000-000000000001', 'sometimes')$$,
  '23514', null,
  'only automatic and manual are accepted'
);

-- Extra trips.
select lives_ok(
  $$insert into public.daily_trips (organization_id, service_date, direction, departure_time, customer_id, vehicle_id, driver_id, notes, is_extra)
    values ('10000000-0000-0000-0000-000000000001', tests.sunday(2), 'outbound', '21:00',
            '11000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000001',
            '13000000-0000-0000-0000-000000000002', 'Airport run', true)$$,
  'an extra trip may belong to a client company without a route'
);
select lives_ok(
  $$insert into public.daily_trips (organization_id, route_id, service_date, direction, departure_time, customer_id, vehicle_id, driver_id, notes, is_extra)
    values ('10000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001',
            tests.sunday(2) + 1, 'outbound', '20:00', '11000000-0000-0000-0000-000000000001',
            '12000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000002', 'Evening 1', true),
           ('10000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001',
            tests.sunday(2) + 1, 'outbound', '22:00', '11000000-0000-0000-0000-000000000001',
            '12000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000001', 'Evening 2', true)$$,
  'a route can have several extra trips on a day next to its planned trip, with any vehicle and driver'
);
select throws_ok(
  $$insert into public.daily_trips (organization_id, service_date, direction, departure_time, customer_id, driver_id)
    values ('10000000-0000-0000-0000-000000000001', tests.sunday(2), 'outbound', '21:00', '11000000-0000-0000-0000-000000000002',
            '13000000-0000-0000-0000-000000000001')$$,
  '23514', null,
  'a trip that is not extra needs a route'
);
select throws_ok(
  $$insert into public.daily_trips (organization_id, service_date, direction, departure_time, customer_id, notes, is_extra)
    values ('10000000-0000-0000-0000-000000000001', tests.sunday(2), 'outbound', '23:00', '11000000-0000-0000-0000-000000000002',
            'No driver', true)$$,
  '23502', null,
  'an extra trip needs a driver'
);
select throws_ok(
  $$update public.daily_trips set driver_id = null where notes = 'Airport run'$$,
  '23502', null,
  'a trip cannot lose its driver'
);
update public.routes set driver_id = '13000000-0000-0000-0000-000000000001', outbound_time = '06:45'
where id = '14000000-0000-0000-0000-000000000001';
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(2) + 1);
select results_eq(
  $$select notes, departure_time, driver_id from public.daily_trips where is_extra order by notes$$,
  $$values ('Airport run'::text, '21:00'::time, '13000000-0000-0000-0000-000000000002'::uuid),
           ('Evening 1'::text, '20:00'::time, '13000000-0000-0000-0000-000000000002'::uuid),
           ('Evening 2'::text, '22:00'::time, '13000000-0000-0000-0000-000000000001'::uuid)$$,
  'preparing a day never changes or removes extra trips'
);
select lives_ok(
  $$update public.daily_trips set is_done = true where is_extra and notes = 'Evening 1'$$,
  'an extra trip can be marked done'
);

-- Another company's login cannot touch these extra trips.
set local request.jwt.claims = '{"sub": "b0000000-0000-0000-0000-000000000001", "role": "authenticated"}';
select is_empty(
  $$delete from public.daily_trips where is_extra and notes = 'Airport run' returning id$$,
  'another company''s member cannot delete an extra trip'
);

set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';
select results_eq(
  $$delete from public.daily_trips where is_extra and notes = 'Airport run' returning notes$$,
  $$values ('Airport run'::text)$$,
  'a member deletes an extra trip added by mistake'
);
select is(
  (select count(*)::integer from public.daily_trips where is_extra),
  2,
  'the other extra trips stay'
);

select * from finish();
rollback;
