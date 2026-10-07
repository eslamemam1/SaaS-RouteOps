-- How a driver is paid, as transport companies agree it:
-- * 'salary': an employee with a monthly salary. The salary may cover a number
--   of outbound and as many return trips a month, salary_trips. Each done trip
--   beyond them earns outbound_pay or return_pay, and each trip the driver
--   missed through absence below them takes the same amount off. Without
--   salary_trips the salary is fixed whatever the driver does.
-- * 'per_trip': no salary; every done outbound trip earns outbound_pay and
--   every done return trip earns return_pay.
-- * 'none': the driver has no pay terms here.
-- A trip counts for the driver who did it, so whoever covers an absent
-- driver's trip earns it.

drop function public.driver_pay(uuid, date, date, date);

alter table public.drivers
  add column pay_type text not null default 'none',
  add column salary_trips integer,
  add column outbound_pay bigint,
  add column return_pay bigint;

-- The earlier terms had no trip count, so a salaried driver keeps a fixed
-- salary and a driver paid only for trips earns half the round trip amount in
-- each direction.
update public.drivers
set pay_type = case
    when monthly_salary is not null then 'salary'
    when trip_pay_basis <> 'none' then 'per_trip'
    else 'none'
  end,
  outbound_pay = case when monthly_salary is null then round_trip_pay / 2 end,
  return_pay = case when monthly_salary is null then round_trip_pay / 2 end;

alter table public.drivers
  drop column trip_pay_basis,
  drop column round_trip_pay,
  add constraint drivers_pay_type_known check (pay_type in ('none', 'salary', 'per_trip')),
  add constraint drivers_salary_trips_positive check (salary_trips > 0),
  add constraint drivers_outbound_pay_positive check (outbound_pay >= 0),
  add constraint drivers_return_pay_positive check (return_pay >= 0),
  add constraint drivers_trip_pays_together check ((outbound_pay is null) = (return_pay is null)),
  add constraint drivers_pay_terms_match_type check (
    case pay_type
      when 'none' then monthly_salary is null and salary_trips is null and outbound_pay is null
      when 'salary' then monthly_salary is not null and (salary_trips is null) = (outbound_pay is null)
      else monthly_salary is null and salary_trips is null and outbound_pay is not null
    end
  );

grant insert (pay_type, salary_trips, outbound_pay, return_pay) on table public.drivers to authenticated;
grant update (pay_type, salary_trips, outbound_pay, return_pay) on table public.drivers to authenticated;

-- Same counts as before, now also split by direction, so a driver's outbound
-- and return trips can be paid differently.
drop function public.trip_report(uuid, date, date, date);

create function public.trip_report(
  p_organization_id uuid,
  p_from date,
  p_to date,
  p_today date
)
returns table (
  customer_id uuid,
  vehicle_id uuid,
  driver_id uuid,
  direction text,
  done_trips integer,
  extra_trips integer,
  revenue bigint,
  unpriced_trips integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select trip.customer_id,
    trip.vehicle_id,
    trip.driver_id,
    trip.direction,
    count(*)::integer,
    (count(*) filter (where trip.is_extra))::integer,
    coalesce(sum(coalesce(trip.trip_price, route.trip_price)), 0)::bigint,
    (count(*) filter (where coalesce(trip.trip_price, route.trip_price) is null))::integer
  from public.daily_trips as trip
  left join public.routes as route on route.id = trip.route_id
  where trip.organization_id = p_organization_id
    and trip.service_date between p_from and p_to
    and (
      trip.is_done
      or (
        not trip.is_cancelled
        and trip.service_date <= p_today
        and coalesce(
          (
            select settings.trip_recording
            from public.operations_settings as settings
            where settings.organization_id = p_organization_id
          ),
          'automatic'
        ) = 'automatic'
      )
    )
  group by trip.customer_id, trip.vehicle_id, trip.driver_id, trip.direction
$$;

revoke execute on function public.trip_report(uuid, date, date, date) from public, anon;
grant execute on function public.trip_report(uuid, date, date, date) to authenticated;

-- For each driver with pay terms, between two days: the done outbound and
-- return trips the driver did, counted by trip_report under the same done
-- rule; the trips of the driver's own routes that were cancelled or given to
-- another driver because the driver was absent; the pay terms; and the salary
-- already recorded for the driver. A driver who stopped working is listed only
-- if the period still has trips or salary for them.
create function public.driver_pay(
  p_organization_id uuid,
  p_from date,
  p_to date,
  p_today date
)
returns table (
  driver_id uuid,
  pay_type text,
  monthly_salary bigint,
  salary_trips integer,
  outbound_pay bigint,
  return_pay bigint,
  done_outbound integer,
  done_return integer,
  absent_outbound integer,
  absent_return integer,
  recorded bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select driver.id,
    driver.pay_type,
    driver.monthly_salary,
    driver.salary_trips,
    driver.outbound_pay,
    driver.return_pay,
    coalesce(trips.outbound_trips, 0)::integer,
    coalesce(trips.return_trips, 0)::integer,
    coalesce(absent.outbound_trips, 0)::integer,
    coalesce(absent.return_trips, 0)::integer,
    coalesce(paid.total, 0)::bigint
  from public.drivers as driver
  left join (
    select report.driver_id,
      sum(report.done_trips) filter (where report.direction = 'outbound') as outbound_trips,
      sum(report.done_trips) filter (where report.direction = 'return') as return_trips
    from public.trip_report(p_organization_id, p_from, p_to, p_today) as report
    group by report.driver_id
  ) as trips on trips.driver_id = driver.id
  left join (
    select route.driver_id,
      count(*) filter (where trip.direction = 'outbound') as outbound_trips,
      count(*) filter (where trip.direction = 'return') as return_trips
    from public.daily_trips as trip
    join public.routes as route on route.id = trip.route_id
    where trip.organization_id = p_organization_id
      and trip.service_date between p_from and p_to
      and trip.service_date <= p_today
      and not trip.is_extra
      and trip.change_reason = 'driver_absent'
      and (trip.is_cancelled or trip.driver_id <> route.driver_id)
    group by route.driver_id
  ) as absent on absent.driver_id = driver.id
  left join (
    select expense.driver_id, sum(expense.amount) as total
    from public.expenses as expense
    where expense.organization_id = p_organization_id
      and expense.category = 'salaries'
      and expense.spent_on between p_from and p_to
    group by expense.driver_id
  ) as paid on paid.driver_id = driver.id
  where driver.organization_id = p_organization_id
    and driver.pay_type <> 'none'
    and (
      driver.is_active
      or trips.outbound_trips > 0
      or trips.return_trips > 0
      or paid.total > 0
    )
$$;

revoke execute on function public.driver_pay(uuid, date, date, date) from public, anon;
grant execute on function public.driver_pay(uuid, date, date, date) to authenticated;
