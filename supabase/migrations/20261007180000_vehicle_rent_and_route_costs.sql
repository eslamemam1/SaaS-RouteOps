-- How the owner of a rented or contractor vehicle is paid, as agreed with each
-- owner:
-- * 'monthly': a fixed monthly_rent.
-- * 'per_trip': every done outbound trip of the vehicle earns outbound_rent and
--   every done return trip earns return_rent.
-- * 'none': no rent terms here; always the case for a vehicle the company owns.
-- The rent counts as an expense only once a member records it.

alter table public.vehicles
  add column rent_type text not null default 'none',
  add column monthly_rent bigint,
  add column outbound_rent bigint,
  add column return_rent bigint,
  add constraint vehicles_rent_type_known check (rent_type in ('none', 'monthly', 'per_trip')),
  add constraint vehicles_monthly_rent_positive check (monthly_rent >= 0),
  add constraint vehicles_outbound_rent_positive check (outbound_rent >= 0),
  add constraint vehicles_return_rent_positive check (return_rent >= 0),
  add constraint vehicles_rent_terms_match_type check (
    case rent_type
      when 'none' then monthly_rent is null and outbound_rent is null and return_rent is null
      when 'monthly' then ownership <> 'owned'
        and monthly_rent is not null
        and outbound_rent is null
        and return_rent is null
      else ownership <> 'owned'
        and monthly_rent is null
        and outbound_rent is not null
        and return_rent is not null
    end
  );

grant insert (rent_type, monthly_rent, outbound_rent, return_rent) on table public.vehicles to authenticated;
grant update (rent_type, monthly_rent, outbound_rent, return_rent) on table public.vehicles to authenticated;

-- Same counts as before, now also split by route, so a route's revenue and the
-- share of each driver and vehicle working on it can be shown. route_id is
-- null for extra trips that name no route.
drop function public.trip_report(uuid, date, date, date);

create function public.trip_report(
  p_organization_id uuid,
  p_from date,
  p_to date,
  p_today date
)
returns table (
  customer_id uuid,
  route_id uuid,
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
    trip.route_id,
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
  group by trip.customer_id, trip.route_id, trip.vehicle_id, trip.driver_id, trip.direction
$$;

revoke execute on function public.trip_report(uuid, date, date, date) from public, anon;
grant execute on function public.trip_report(uuid, date, date, date) to authenticated;

-- Same totals as before, now also by driver, so a driver's recorded salary can
-- be shared out over the routes the driver worked.
drop function public.expense_totals(uuid, date, date);

create function public.expense_totals(
  p_organization_id uuid,
  p_from date,
  p_to date
)
returns table (
  category text,
  vehicle_id uuid,
  driver_id uuid,
  total bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select expense.category,
    expense.vehicle_id,
    expense.driver_id,
    sum(expense.amount)::bigint
  from public.expenses as expense
  where expense.organization_id = p_organization_id
    and expense.spent_on between p_from and p_to
  group by expense.category, expense.vehicle_id, expense.driver_id
$$;

revoke execute on function public.expense_totals(uuid, date, date) from public, anon;
grant execute on function public.expense_totals(uuid, date, date) to authenticated;

-- For each vehicle with rent terms, between two days: the done outbound and
-- return trips the vehicle made, counted by trip_report under the same done
-- rule; the rent terms; and the rent or contractor pay already recorded for
-- the vehicle. A vehicle no longer in use is listed only if the period still
-- has trips or pay for it.
create function public.vehicle_pay(
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
    vehicle.ownership,
    vehicle.rent_type,
    vehicle.monthly_rent,
    vehicle.outbound_rent,
    vehicle.return_rent,
    coalesce(trips.outbound_trips, 0)::integer,
    coalesce(trips.return_trips, 0)::integer,
    coalesce(paid.total, 0)::bigint
  from public.vehicles as vehicle
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
    and vehicle.rent_type <> 'none'
    and (
      vehicle.is_active
      or trips.outbound_trips > 0
      or trips.return_trips > 0
      or paid.total > 0
    )
$$;

revoke execute on function public.vehicle_pay(uuid, date, date, date) from public, anon;
grant execute on function public.vehicle_pay(uuid, date, date, date) to authenticated;
