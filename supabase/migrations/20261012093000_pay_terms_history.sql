-- Pay terms change from the month they are changed in. A driver's pay terms
-- and a vehicle's rent terms are kept per month, starting the first day of
-- the organization's month when they were saved, so a raise in October never
-- changes what September's pay should have been, and a month already paid
-- never shows money still due because the terms changed later.
-- A month before the first saved terms, such as pay recorded late for a
-- driver added this month, uses those first terms.
-- Triggers keep these rows; members only read them.
-- driver_pay and vehicle_pay also count an absence against the driver the
-- trip was planned for, not the driver the route has now.

create table public.driver_pay_terms (
  organization_id uuid not null,
  driver_id uuid not null,
  starts_on date not null,
  pay_type text not null,
  monthly_salary bigint,
  salary_trips integer,
  outbound_pay bigint,
  return_pay bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (driver_id, starts_on),
  constraint driver_pay_terms_driver_fkey foreign key (organization_id, driver_id)
    references public.drivers (organization_id, id) on delete cascade,
  constraint driver_pay_terms_month_start check (extract(day from starts_on) = 1)
);

create index driver_pay_terms_organization_id_idx on public.driver_pay_terms (organization_id);

create table public.vehicle_rent_terms (
  organization_id uuid not null,
  vehicle_id uuid not null,
  starts_on date not null,
  ownership text not null,
  rent_type text not null,
  monthly_rent bigint,
  outbound_rent bigint,
  return_rent bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (vehicle_id, starts_on),
  constraint vehicle_rent_terms_vehicle_fkey foreign key (organization_id, vehicle_id)
    references public.vehicles (organization_id, id) on delete cascade,
  constraint vehicle_rent_terms_month_start check (extract(day from starts_on) = 1)
);

create index vehicle_rent_terms_organization_id_idx on public.vehicle_rent_terms (organization_id);

create trigger driver_pay_terms_set_updated_at
before update on public.driver_pay_terms
for each row
execute function public.set_updated_at();

create trigger vehicle_rent_terms_set_updated_at
before update on public.vehicle_rent_terms
for each row
execute function public.set_updated_at();

revoke all on table public.driver_pay_terms from public, anon, authenticated;
revoke all on table public.vehicle_rent_terms from public, anon, authenticated;

grant select on table public.driver_pay_terms to authenticated;
grant select on table public.vehicle_rent_terms to authenticated;

grant select, insert, update, delete on table public.driver_pay_terms to service_role;
grant select, insert, update, delete on table public.vehicle_rent_terms to service_role;

alter table public.driver_pay_terms enable row level security;
alter table public.vehicle_rent_terms enable row level security;

create policy "members read driver pay terms"
on public.driver_pay_terms
for select
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "only active organizations"
on public.driver_pay_terms
as restrictive
for all
to authenticated
using (organization_id in (select id from public.organizations where is_active))
with check (organization_id in (select id from public.organizations where is_active));

create policy "members read vehicle rent terms"
on public.vehicle_rent_terms
for select
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "only active organizations"
on public.vehicle_rent_terms
as restrictive
for all
to authenticated
using (organization_id in (select id from public.organizations where is_active))
with check (organization_id in (select id from public.organizations where is_active));

-- The terms each driver and vehicle has now have applied since it was added.
insert into public.driver_pay_terms (
  organization_id, driver_id, starts_on, pay_type, monthly_salary, salary_trips, outbound_pay, return_pay
)
select driver.organization_id, driver.id,
  date_trunc('month', driver.created_at at time zone organization.time_zone)::date,
  driver.pay_type, driver.monthly_salary, driver.salary_trips, driver.outbound_pay, driver.return_pay
from public.drivers as driver
join public.organizations as organization on organization.id = driver.organization_id;

insert into public.vehicle_rent_terms (
  organization_id, vehicle_id, starts_on, ownership, rent_type, monthly_rent, outbound_rent, return_rent
)
select vehicle.organization_id, vehicle.id,
  date_trunc('month', vehicle.created_at at time zone organization.time_zone)::date,
  vehicle.ownership, vehicle.rent_type, vehicle.monthly_rent, vehicle.outbound_rent, vehicle.return_rent
from public.vehicles as vehicle
join public.organizations as organization on organization.id = vehicle.organization_id;

-- Runs with its owner's rights because members cannot write the terms
-- tables; it writes only the terms of the row that was just saved.
create function public.keep_driver_pay_terms()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and (old.pay_type, old.monthly_salary, old.salary_trips, old.outbound_pay, old.return_pay)
      is not distinct from (new.pay_type, new.monthly_salary, new.salary_trips, new.outbound_pay, new.return_pay)
  then
    return null;
  end if;

  insert into public.driver_pay_terms (
    organization_id, driver_id, starts_on, pay_type, monthly_salary, salary_trips, outbound_pay, return_pay
  )
  values (
    new.organization_id, new.id,
    date_trunc('month', public.organization_today(new.organization_id)::timestamp)::date,
    new.pay_type, new.monthly_salary, new.salary_trips, new.outbound_pay, new.return_pay
  )
  on conflict (driver_id, starts_on) do update
  set pay_type = excluded.pay_type,
      monthly_salary = excluded.monthly_salary,
      salary_trips = excluded.salary_trips,
      outbound_pay = excluded.outbound_pay,
      return_pay = excluded.return_pay;
  return null;
end;
$$;

revoke all on function public.keep_driver_pay_terms() from public, anon, authenticated;

create trigger drivers_keep_pay_terms
after insert or update on public.drivers
for each row
execute function public.keep_driver_pay_terms();

create function public.keep_vehicle_rent_terms()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and (old.ownership, old.rent_type, old.monthly_rent, old.outbound_rent, old.return_rent)
      is not distinct from (new.ownership, new.rent_type, new.monthly_rent, new.outbound_rent, new.return_rent)
  then
    return null;
  end if;

  insert into public.vehicle_rent_terms (
    organization_id, vehicle_id, starts_on, ownership, rent_type, monthly_rent, outbound_rent, return_rent
  )
  values (
    new.organization_id, new.id,
    date_trunc('month', public.organization_today(new.organization_id)::timestamp)::date,
    new.ownership, new.rent_type, new.monthly_rent, new.outbound_rent, new.return_rent
  )
  on conflict (vehicle_id, starts_on) do update
  set ownership = excluded.ownership,
      rent_type = excluded.rent_type,
      monthly_rent = excluded.monthly_rent,
      outbound_rent = excluded.outbound_rent,
      return_rent = excluded.return_rent;
  return null;
end;
$$;

revoke all on function public.keep_vehicle_rent_terms() from public, anon, authenticated;

create trigger vehicles_keep_rent_terms
after insert or update on public.vehicles
for each row
execute function public.keep_vehicle_rent_terms();

-- Same as before, except that the terms are those in force for the period and
-- absences count against the driver each trip was planned for.
create or replace function public.driver_pay(
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
    terms.pay_type,
    terms.monthly_salary,
    terms.salary_trips,
    terms.outbound_pay,
    terms.return_pay,
    coalesce(trips.outbound_trips, 0)::integer,
    coalesce(trips.return_trips, 0)::integer,
    coalesce(absent.outbound_trips, 0)::integer,
    coalesce(absent.return_trips, 0)::integer,
    coalesce(paid.total, 0)::bigint
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
      sum(report.done_trips) filter (where report.direction = 'return') as return_trips
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

-- Same as before, except that the terms are those in force for the period.
create or replace function public.vehicle_pay(
  p_organization_id uuid,
  p_from date,
  p_to date,
  p_today date
)
returns table (
  vehicle_id uuid,
  ownership text,
  rent_type text,
  monthly_rent bigint,
  outbound_rent bigint,
  return_rent bigint,
  done_outbound integer,
  done_return integer,
  recorded bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select vehicle.id,
    terms.ownership,
    terms.rent_type,
    terms.monthly_rent,
    terms.outbound_rent,
    terms.return_rent,
    coalesce(trips.outbound_trips, 0)::integer,
    coalesce(trips.return_trips, 0)::integer,
    coalesce(paid.total, 0)::bigint
  from public.vehicles as vehicle
  cross join lateral (
    select rent_terms.ownership,
      rent_terms.rent_type,
      rent_terms.monthly_rent,
      rent_terms.outbound_rent,
      rent_terms.return_rent
    from public.vehicle_rent_terms as rent_terms
    where rent_terms.vehicle_id = vehicle.id
    order by rent_terms.starts_on <= p_to desc,
      case when rent_terms.starts_on <= p_to then rent_terms.starts_on end desc,
      rent_terms.starts_on
    limit 1
  ) as terms
  left join (
    select report.vehicle_id,
      sum(report.done_trips) filter (where report.direction = 'outbound') as outbound_trips,
      sum(report.done_trips) filter (where report.direction = 'return') as return_trips
    from public.trip_report(p_organization_id, p_from, p_to, p_today) as report
    where report.vehicle_id is not null
    group by report.vehicle_id
  ) as trips on trips.vehicle_id = vehicle.id
  left join (
    select expense.vehicle_id, sum(expense.amount) as total
    from public.expenses as expense
    where expense.organization_id = p_organization_id
      and expense.category in ('rent', 'contractors')
      and expense.spent_on between p_from and p_to
      and expense.vehicle_id is not null
    group by expense.vehicle_id
  ) as paid on paid.vehicle_id = vehicle.id
  where vehicle.organization_id = p_organization_id
    and terms.rent_type <> 'none'
    and (
      vehicle.is_active
      or trips.outbound_trips > 0
      or trips.return_trips > 0
      or paid.total > 0
    )
$$;
