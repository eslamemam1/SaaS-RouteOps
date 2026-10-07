-- How a driver earns from trips. Some companies pay only a fixed monthly
-- salary; others pay a small salary plus an amount for each extra trip, the
-- trips a member adds on the daily screen outside the routes' schedule; and a
-- contractor driver may earn from every trip.
-- trip_pay_basis is 'none', 'extra' for extra trips only, or 'all' for every
-- done trip. round_trip_pay is what one outbound and return pair earns; one
-- direction alone earns half, so the amount must split evenly in the
-- currency's smallest unit and nothing is rounded.

alter table public.drivers
  add column trip_pay_basis text not null default 'none',
  add column round_trip_pay bigint,
  add constraint drivers_trip_pay_basis_known check (trip_pay_basis in ('none', 'extra', 'all')),
  add constraint drivers_round_trip_pay_even check (round_trip_pay > 0 and round_trip_pay % 2 = 0),
  add constraint drivers_round_trip_pay_with_basis check ((trip_pay_basis = 'none') = (round_trip_pay is null));

-- trip_pay was earned by every done trip, one direction each.
update public.drivers
set trip_pay_basis = 'all',
  round_trip_pay = trip_pay * 2
where trip_pay > 0;

drop function public.driver_pay(uuid, date, date, date);

alter table public.drivers drop column trip_pay;

grant insert (trip_pay_basis, round_trip_pay) on table public.drivers to authenticated;
grant update (trip_pay_basis, round_trip_pay) on table public.drivers to authenticated;

-- For each driver with a salary or trip pay: the done trips and done extra
-- trips between two days, counted by trip_report under the same done rule,
-- the driver's pay terms, and the salary already recorded for the driver in
-- those days. A driver who stopped working is listed only if the period still
-- has trips or salary for them.
create function public.driver_pay(
  p_organization_id uuid,
  p_from date,
  p_to date,
  p_today date
)
returns table (
  driver_id uuid,
  done_trips integer,
  extra_trips integer,
  monthly_salary bigint,
  trip_pay_basis text,
  round_trip_pay bigint,
  recorded bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select driver.id,
    coalesce(trips.done, 0)::integer,
    coalesce(trips.extra, 0)::integer,
    driver.monthly_salary,
    driver.trip_pay_basis,
    driver.round_trip_pay,
    coalesce(paid.total, 0)::bigint
  from public.drivers as driver
  left join (
    select report.driver_id,
      sum(report.done_trips) as done,
      sum(report.extra_trips) as extra
    from public.trip_report(p_organization_id, p_from, p_to, p_today) as report
    group by report.driver_id
  ) as trips on trips.driver_id = driver.id
  left join (
    select expense.driver_id, sum(expense.amount) as total
    from public.expenses as expense
    where expense.organization_id = p_organization_id
      and expense.category = 'salaries'
      and expense.spent_on between p_from and p_to
    group by expense.driver_id
  ) as paid on paid.driver_id = driver.id
  where driver.organization_id = p_organization_id
    and (driver.monthly_salary is not null or driver.trip_pay_basis <> 'none')
    and (driver.is_active or trips.done > 0 or paid.total > 0)
$$;

revoke execute on function public.driver_pay(uuid, date, date, date) from public, anon;
grant execute on function public.driver_pay(uuid, date, date, date) to authenticated;
