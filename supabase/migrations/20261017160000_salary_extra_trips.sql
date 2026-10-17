-- A salaried driver whose salary covers no set number of trips may still have
-- outbound and return amounts: then each extra trip the driver drives, one a
-- member added to a day by hand, earns its direction's amount on top of the
-- salary. Without the amounts the salary stays fixed. A salary that covers a
-- number of trips still needs the amounts, as before.

alter table public.drivers
  drop constraint drivers_pay_terms_match_type,
  add constraint drivers_pay_terms_match_type check (
    case pay_type
      when 'none' then monthly_salary is null and salary_trips is null and outbound_pay is null
      when 'salary' then monthly_salary is not null and (salary_trips is null or outbound_pay is not null)
      else monthly_salary is null and salary_trips is null and outbound_pay is not null
    end
  );

-- Same as before, with extra_outbound and extra_return: the done extra trips
-- the driver drove in each direction.
drop function public.driver_pay(uuid, date, date, date);

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
  recorded bigint,
  extra_outbound integer,
  extra_return integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select driver.id,
    terms.pay_type,
    terms.monthly_salary,
    terms.salary_trips,
    terms.outbound_pay,
    terms.return_pay,
    coalesce(trips.outbound_trips, 0)::integer,
    coalesce(trips.return_trips, 0)::integer,
    coalesce(absent.outbound_trips, 0)::integer,
    coalesce(absent.return_trips, 0)::integer,
    coalesce(paid.total, 0)::bigint,
    coalesce(trips.outbound_extra, 0)::integer,
    coalesce(trips.return_extra, 0)::integer
  from public.drivers as driver
  cross join lateral (
    select pay_terms.pay_type,
      pay_terms.monthly_salary,
      pay_terms.salary_trips,
      pay_terms.outbound_pay,
      pay_terms.return_pay
    from public.driver_pay_terms as pay_terms
    where pay_terms.driver_id = driver.id
    order by pay_terms.starts_on <= p_to desc,
      case when pay_terms.starts_on <= p_to then pay_terms.starts_on end desc,
      pay_terms.starts_on
    limit 1
  ) as terms
  left join (
    select report.driver_id,
      sum(report.done_trips) filter (where report.direction = 'outbound') as outbound_trips,
      sum(report.done_trips) filter (where report.direction = 'return') as return_trips,
      sum(report.extra_trips) filter (where report.direction = 'outbound') as outbound_extra,
      sum(report.extra_trips) filter (where report.direction = 'return') as return_extra
    from public.trip_report(p_organization_id, p_from, p_to, p_today) as report
    group by report.driver_id
  ) as trips on trips.driver_id = driver.id
  left join (
    select trip.planned_driver_id as driver_id,
      count(*) filter (where trip.direction = 'outbound') as outbound_trips,
      count(*) filter (where trip.direction = 'return') as return_trips
    from public.daily_trips as trip
    where trip.organization_id = p_organization_id
      and trip.service_date between p_from and p_to
      and trip.service_date <= p_today
      and not trip.is_extra
      and trip.change_reason = 'driver_absent'
      and (trip.is_cancelled or trip.driver_id is distinct from trip.planned_driver_id)
    group by trip.planned_driver_id
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
    and terms.pay_type <> 'none'
    and (
      driver.is_active
      or trips.outbound_trips > 0
      or trips.return_trips > 0
      or paid.total > 0
    )
$$;

revoke execute on function public.driver_pay(uuid, date, date, date) from public, anon;
grant execute on function public.driver_pay(uuid, date, date, date) to authenticated;
