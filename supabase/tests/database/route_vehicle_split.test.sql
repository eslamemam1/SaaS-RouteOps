-- A route's split of its shift price between an optional management margin
-- and its company-owned vehicle, carried on each trip like its price.
-- Amounts are in piasters. 2026-02-01 is a Sunday; the route runs Sunday to Thursday.
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
  ('12000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'NORTH 1', 'bus');
insert into public.vehicles (id, organization_id, plate_number, vehicle_type, ownership, owner_name, rent_type, monthly_rent) values
  ('12000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'RENT 1', 'bus', 'rented', 'Office', 'monthly', 100000);
insert into public.drivers (id, organization_id, full_name) values
  ('13000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ahmed');
insert into public.routes (
  id, organization_id, name, customer_id, vehicle_id, driver_id, start_point, end_point,
  outbound_time, outbound_arrival_time, return_time, return_arrival_time,
  operating_days, trip_price, vehicle_share_mode, vehicle_share_percent,
  management_mode, management_percent, created_at
) values (
  '14000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nasr City',
  '11000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001',
  '13000000-0000-0000-0000-000000000001', 'Hegaz Square', 'Factory',
  '07:00', '09:00', '15:00', '17:00', '{0,1,2,3,4}', 100000, 'percent', 70, 'percent', 10,
  '2026-01-01'
);

select results_eq(
  $$select * from public.trip_split(50000, '07:00', '15:00', 'outbound', 'percent', 70, null, 'percent', 10, null)$$,
  $$values (5000::bigint, 31500::bigint)$$,
  'management is taken first and the vehicle share comes from what is left'
);
select results_eq(
  $$select * from public.trip_split(50001, '07:00', '15:00', 'outbound', 'amount', null, 80000, 'none', null, null)$$,
  $$values (null::bigint, 40000::bigint)$$,
  'a fixed amount per shift gives each direction its half'
);
select results_eq(
  $$select * from public.trip_split(50000, '07:00', '15:00', 'return', 'whole', null, null, 'amount', null, 10000)$$,
  $$values (5000::bigint, 45000::bigint)$$,
  'the vehicle may take all that is left after management'
);
select results_eq(
  $$select * from public.trip_split(null, '07:00', '15:00', 'outbound', 'percent', 70, null, 'none', null, null)$$,
  $$values (null::bigint, null::bigint)$$,
  'a trip without a price has no shares'
);

select throws_ok(
  $$update public.routes set vehicle_share_mode = 'amount', vehicle_share_percent = null,
      vehicle_share_amount = 95000, management_mode = 'amount', management_percent = null,
      management_amount = 10000
    where id = '14000000-0000-0000-0000-000000000001'$$,
  '23514', null,
  'fixed shares cannot add up to more than the shift price'
);
select throws_ok(
  $$update public.routes set vehicle_share_percent = 120
    where id = '14000000-0000-0000-0000-000000000001'$$,
  '23514', null,
  'a percent cannot pass 100'
);

select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-01');
select results_eq(
  $$select direction, trip_price, management_share, vehicle_share from public.daily_trips
    where service_date = '2026-02-01' order by direction$$,
  $$values ('outbound', 50000::bigint, 5000::bigint, 31500::bigint),
           ('return', 50000::bigint, 5000::bigint, 31500::bigint)$$,
  'each planned trip keeps its shares of its price'
);

update public.routes set vehicle_share_percent = 50 where id = '14000000-0000-0000-0000-000000000001';
select is(
  (select array_agg(vehicle_share order by direction) from public.daily_trips where service_date = '2026-02-01'),
  array[31500, 31500]::bigint[],
  'a past trip keeps the shares it had'
);

select results_eq(
  $$select sum(revenue)::bigint, sum(vehicle_share)::bigint, sum(management_share)::bigint
    from public.trip_report('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-01', '2026-03-01')$$,
  $$values (100000::bigint, 63000::bigint, 10000::bigint)$$,
  'the report adds up the vehicle shares and the management margin of done trips'
);
select results_eq(
  $$select direction, vehicle_share, management_share
    from public.trip_log('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-01', '2026-03-01',
      p_vehicle_id => '12000000-0000-0000-0000-000000000001')$$,
  $$values ('outbound', 31500::bigint, 5000::bigint), ('return', 31500::bigint, 5000::bigint)$$,
  'the trip log gives each trip its shares'
);

update public.daily_trips set vehicle_id = '12000000-0000-0000-0000-000000000002'
where service_date = '2026-02-01' and direction = 'return';
select results_eq(
  $$select sum(vehicle_share)::bigint, sum(management_share)::bigint
    from public.trip_report('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-01', '2026-03-01')$$,
  $$values (31500::bigint, 5000::bigint)$$,
  'a trip run by a rented vehicle has no shares'
);

select * from finish();
rollback;
