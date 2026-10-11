-- Route prices, the prices copied onto daily trips, and monthly revenue.
-- Amounts are in piasters. 2026-02-01 is a Sunday; the routes run Sunday to Thursday.
-- Nasr City is a full trip, priced per shift; Airport Road runs outbound only.
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

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

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'north@example.com');
insert into public.organizations (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'North Transport');
insert into public.organization_memberships (organization_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');
insert into public.customers (id, organization_id, name) values
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Delta Factory');
insert into public.vehicles (id, organization_id, plate_number, vehicle_type) values
  ('12000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'NORTH 1', 'bus');
insert into public.drivers (id, organization_id, full_name) values
  ('13000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ahmed'),
  ('13000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Karim');
insert into public.routes (id, organization_id, name, customer_id, vehicle_id, driver_id, start_point, end_point, outbound_time, return_time, operating_days, created_at) values
  ('14000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nasr City', '11000000-0000-0000-0000-000000000001',
   '12000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Hegaz Square', 'Factory', '07:00', '16:00', '{0,1,2,3,4}',
   '2026-01-01');
insert into public.routes (id, organization_id, name, customer_id, driver_id, start_point, end_point, outbound_time, operating_days, trip_price) values
  ('14000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Airport Road', '11000000-0000-0000-0000-000000000001',
   '13000000-0000-0000-0000-000000000002', 'Ring Road', 'Airport', '05:00', '{0,1,2,3,4}', 4000);

select throws_ok(
  $$insert into public.organizations (name, currency) values ('Dollar Transport', 'USD')$$,
  '23514', null,
  'an organization works in a supported currency'
);

-- A day recorded before the route had a price, then a day with the first price.
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-01');
update public.routes set trip_price = 5000 where id = '14000000-0000-0000-0000-000000000001';
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-02');
update public.routes set trip_price = 6000 where id = '14000000-0000-0000-0000-000000000001';

-- Signed in as the North login.
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is(
  (select currency from public.organizations),
  'EGP',
  'an organization works in Egyptian pounds unless the operator chose another currency'
);
select throws_ok(
  $$update public.organizations set currency = 'SAR'$$,
  '42501', null,
  'a member cannot change the organization currency'
);
select throws_ok(
  $$update public.routes set trip_price = -1 where id = '14000000-0000-0000-0000-000000000001'$$,
  '23514', null,
  'a price cannot be negative'
);

select is(
  (select array_agg(trip_price order by direction) from public.daily_trips where service_date = '2026-02-02'),
  array[2500, 2500]::bigint[],
  'each direction of a shift copies half the price its route had on its day'
);
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-02');
select is(
  (select array_agg(trip_price order by direction) from public.daily_trips where service_date = '2026-02-02'),
  array[2500, 2500]::bigint[],
  'a new route price does not change a past trip'
);

select lives_ok(
  $$insert into public.daily_trips (organization_id, route_id, customer_id, vehicle_id, driver_id, service_date, direction, departure_time, is_extra, notes)
    values ('10000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001',
            '12000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '2026-02-03', 'outbound', '20:00', true, 'Evening'),
           ('10000000-0000-0000-0000-000000000001', null, '11000000-0000-0000-0000-000000000001',
            '12000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '2026-02-03', 'outbound', '21:00', true, 'Airport')$$,
  'a member adds extra trips without a price'
);
update public.daily_trips set trip_price = 12000 where notes = 'Airport';
select lives_ok(
  $$insert into public.daily_trips (organization_id, customer_id, vehicle_id, driver_id, service_date, direction, departure_time, is_extra, notes)
    values ('10000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001',
            '12000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '2026-02-04', 'outbound', '21:00', true, 'Unpriced')$$,
  'an extra trip without a route may have no price'
);

-- February: day 1 at today's shift price 6000, day 2 at 5000, the evening
-- extra at the outbound half of 6000, the airport run at 12000, and one trip
-- without a price. Airport Road did not exist in February.
select results_eq(
  $$select sum(done_trips)::integer, sum(revenue)::bigint, sum(unpriced_trips)::integer
    from public.trip_report('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-01')$$,
  $$values (7, 26000::bigint, 1)$$,
  'revenue adds up the price of every done trip and counts the trips without a price'
);
-- Four directions of Nasr City are two full trips, the evening extra on it is
-- half of one, and the two extra trips without a route are a full trip each.
select results_eq(
  $$select sum(done_halves)::integer, sum(extra_halves)::integer
    from public.trip_report('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-01')$$,
  $$values (9, 5)$$,
  'trips are counted in halves of a full trip'
);
select results_eq(
  $$select direction, halves
    from public.trip_log('10000000-0000-0000-0000-000000000001', '2026-02-03', '2026-02-03', '2026-03-01')
    where is_extra$$,
  $$values ('outbound', 1)$$,
  'the trip log gives each trip its halves of a full trip'
);
select results_eq(
  $$select direction, price
    from public.trip_log('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-01', '2026-03-01',
      p_driver_id => '13000000-0000-0000-0000-000000000001')$$,
  $$values ('outbound', 3000::bigint), ('return', 3000::bigint)$$,
  'a trip without a price shows its direction''s share of the shift price'
);

-- A coming day follows its route's price, even after a one-day change.
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(2));
update public.daily_trips
set driver_id = '13000000-0000-0000-0000-000000000002', change_reason = 'driver_absent'
where service_date = tests.sunday(2) and direction = 'return';
update public.routes set trip_price = 7000 where id = '14000000-0000-0000-0000-000000000001';
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', tests.sunday(2));
select is(
  (select array_agg(trip_price order by direction) from public.daily_trips
   where service_date = tests.sunday(2) and route_id = '14000000-0000-0000-0000-000000000001'),
  array[3500, 3500]::bigint[],
  'a coming trip takes its share of the new route price, even after its driver was changed'
);
select is(
  (select driver_id from public.daily_trips
   where service_date = tests.sunday(2) and route_id = '14000000-0000-0000-0000-000000000001' and direction = 'return'),
  '13000000-0000-0000-0000-000000000002'::uuid,
  'the new price keeps the one-day change'
);

update public.routes set trip_price = 7001 where id = '14000000-0000-0000-0000-000000000001';
select is(
  (select array_agg(trip_price order by direction) from public.daily_trips
   where service_date = tests.sunday(2) and route_id = '14000000-0000-0000-0000-000000000001'),
  array[3501, 3500]::bigint[],
  'the halves of a shift add up to its price, the outbound trip taking the odd piaster'
);
select is(
  (select array_agg(trip_price) from public.daily_trips
   where service_date = tests.sunday(2) and route_id = '14000000-0000-0000-0000-000000000002'),
  array[4000]::bigint[],
  'a route that runs one direction keeps its whole price for that trip'
);

select * from finish();
rollback;
