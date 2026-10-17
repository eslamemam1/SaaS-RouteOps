-- A fixed salary with trip amounts: driver_pay counts the extra trips the
-- driver drove, so each can be paid on top of the salary.
-- 2026-02-01 is a Sunday.
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
insert into public.drivers (id, organization_id, full_name, pay_type, monthly_salary, outbound_pay, return_pay) values
  ('13000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ahmed', 'salary', 600000, 10000, 8000);
insert into public.routes (
  id, organization_id, name, customer_id, driver_id, start_point, end_point,
  outbound_time, outbound_arrival_time, return_time, return_arrival_time, operating_days, created_at
) values (
  '14000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Nasr City',
  '11000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001',
  'Hegaz Square', 'Factory', '07:00', '09:00', '15:00', '17:00', '{0,1,2,3,4}', '2026-01-01'
);

select throws_ok(
  $$update public.drivers set salary_trips = 26, outbound_pay = null, return_pay = null
    where id = '13000000-0000-0000-0000-000000000001'$$,
  '23514', null,
  'a salary that covers a number of trips still needs the trip amounts'
);

select public.prepare_daily_trips('10000000-0000-0000-0000-000000000001', '2026-02-01');
insert into public.daily_trips (
  organization_id, service_date, direction, departure_time, arrival_time,
  customer_id, driver_id, is_extra
) values
  ('10000000-0000-0000-0000-000000000001', '2026-02-01', 'outbound', '18:00', '19:00',
   '11000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', true),
  ('10000000-0000-0000-0000-000000000001', '2026-02-01', 'outbound', '20:00', '21:00',
   '11000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', true),
  ('10000000-0000-0000-0000-000000000001', '2026-02-01', 'return', '21:30', '22:30',
   '11000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', true);

select results_eq(
  $$select salary_trips, outbound_pay, done_outbound, done_return, extra_outbound, extra_return
    from public.driver_pay('10000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', '2026-03-01')$$,
  $$values (null::integer, 10000::bigint, 3, 2, 2, 1)$$,
  'driver_pay counts the extra trips the driver drove in each direction'
);

select * from finish();
rollback;
