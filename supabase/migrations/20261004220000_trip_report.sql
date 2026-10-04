-- Monthly trip counts for the reports screen.
-- The counts are summed in the database, so a month of trips never passes
-- through the API row limit.
-- Both functions run with the caller's rights, so row level security limits
-- them to the caller's own organizations.

-- Trips that count as done between p_from and p_to, per customer, vehicle,
-- and driver. A trip counts as done under the same rule as the daily screen:
-- a member marked it done, or the organization records automatically, the trip
-- is not cancelled, and its day is on or before p_today.
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
  done_trips integer,
  extra_trips integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select trip.customer_id,
    trip.vehicle_id,
    trip.driver_id,
    count(*)::integer,
    (count(*) filter (where trip.is_extra))::integer
  from public.daily_trips as trip
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
  group by trip.customer_id, trip.vehicle_id, trip.driver_id
$$;

revoke execute on function public.trip_report(uuid, date, date, date) from public, anon;
grant execute on function public.trip_report(uuid, date, date, date) to authenticated;

-- Days between p_from and p_to on which an active route runs but no trip was
-- ever prepared, because nobody opened that day on the daily screen.
-- A route only counts from the day it was created.
create function public.unopened_days(
  p_organization_id uuid,
  p_from date,
  p_to date
)
returns setof date
language sql
stable
security invoker
set search_path = ''
as $$
  select day::date
  from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') as day
  where exists (
      select 1
      from public.routes as route
      where route.organization_id = p_organization_id
        and route.is_active
        and route.created_at::date <= day::date
        and extract(dow from day)::smallint = any (route.operating_days)
        and (route.outbound_time is not null or route.return_time is not null)
    )
    and not exists (
      select 1
      from public.daily_trips as trip
      where trip.organization_id = p_organization_id
        and trip.service_date = day::date
        and not trip.is_extra
    )
  order by 1
$$;

revoke execute on function public.unopened_days(uuid, date, date) from public, anon;
grant execute on function public.unopened_days(uuid, date, date) to authenticated;
