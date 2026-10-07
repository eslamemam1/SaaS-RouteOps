-- The owner of a rented or contractor vehicle is paid a monthly rent or for
-- each trip the vehicle made, and vehicle_pay lists what is due and recorded.
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
insert into public.vehicles (id, organization_id, plate_number, vehicle_type, ownership, owner_name, rent_type, monthly_rent, outbound_rent, return_rent) values
  ('12000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'OWNED 1', 'bus', 'owned', null, 'none', null, null, null),
  ('12000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'RENTED 1', 'bus', 'rented', 'Nour Office', 'monthly', 1200000, null, null),
  ('12000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'CONTRACTOR 1', 'microbus', 'contractor', 'Mohamed Ali', 'per_trip', null, 30000, 25000);
insert into public.drivers (id, organization_id, full_name) values
  ('13000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ahmed');
insert into public.routes (id, organization_id, name, customer_id, vehicle_id, driver_id, start_point, end_point, outbound_time, return_time, operating_days, created_at) values
  ('14000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nasr City', '11000000-0000-0000-0000-000000000001',
   '12000000-0000-0000-0000-000000000003', '13000000-0000-0000-0000-000000000001', 'Hegaz Square', 'Factory', '07:00', '16:00', '{0,1,2,3,4}',
   '2026-01-01');
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-01');
select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-02');
update public.daily_trips
set is_cancelled = true, change_reason = 'holiday'
where service_date = '2026-02-02' and direction = 'return';

select throws_ok(
  $$update public.vehicles set rent_type = 'monthly', monthly_rent = 100000 where plate_number = 'OWNED 1'$$,
  '23514', null,
  'a vehicle the company owns has no rent'
);
select throws_ok(
  $$update public.vehicles set monthly_rent = null where plate_number = 'RENTED 1'$$,
  '23514', null,
  'a monthly rent has its amount'
);
select throws_ok(
  $$update public.vehicles set return_rent = null where plate_number = 'CONTRACTOR 1'$$,
  '23514', null,
  'a vehicle paid per trip has both trip amounts'
);
select throws_ok(
  $$update public.vehicles set monthly_rent = 100000 where plate_number = 'CONTRACTOR 1'$$,
  '23514', null,
  'a vehicle paid per trip has no monthly rent'
);

-- Signed in as the North login.
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$update public.vehicles set rent_type = 'monthly', monthly_rent = 1300000 where plate_number = 'RENTED 1'$$,
  'a member changes a vehicle''s rent'
);
update public.vehicles set monthly_rent = 1200000 where plate_number = 'RENTED 1';

insert into public.expenses (organization_id, spent_on, category, amount, vehicle_id) values
  ('10000000-0000-0000-0000-000000000001', '2026-02-27', 'contractors', 50000, '12000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000001', '2026-02-27', 'fuel', 70000, '12000000-0000-0000-0000-000000000003');

-- Recording automatically, the contractor vehicle made two outbound trips and
-- one return trip; the other return was cancelled for a holiday. Only rent and
-- contractor expenses count as its pay.
select results_eq(
  $$select vehicle_id, ownership, rent_type, monthly_rent, outbound_rent, return_rent,
      done_outbound, done_return, recorded
    from public.vehicle_pay('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-15')
    order by vehicle_id$$,
  $$values
    ('12000000-0000-0000-0000-000000000002'::uuid, 'rented', 'monthly', 1200000::bigint, null::bigint, null::bigint, 0, 0, 0::bigint),
    ('12000000-0000-0000-0000-000000000003'::uuid, 'contractor', 'per_trip', null::bigint, 30000::bigint, 25000::bigint, 2, 1, 50000::bigint)$$,
  'vehicles with rent terms are listed with their trips and the pay recorded'
);

-- Signed in as the South login.
set local request.jwt.claims = '{"sub": "b0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is_empty(
  $$select * from public.vehicle_pay('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-15')$$,
  'a member cannot see another organization''s vehicle pay'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.vehicle_pay('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-15')$$,
  '42501', null,
  'a visitor who is not signed in cannot read vehicle pay'
);

select * from finish();
rollback;
