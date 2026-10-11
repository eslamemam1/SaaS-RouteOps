-- Each trip of a period with the status it counts under, for the pages of one
-- driver or one vehicle. A trip is 'done' exactly when trip_report counts it:
-- marked done, or not cancelled, its day come, and recorded automatically on
-- that day. Otherwise it is 'cancelled', 'planned' before its day, or
-- 'unrecorded' while waiting to be marked done.
-- p_driver_id keeps the trips the driver drove and the trips planned for the
-- driver that another driver took; p_vehicle_id keeps the vehicle's trips.
-- price is the trip's price, or its route's when it has none.
create function public.trip_log(
  p_organization_id uuid,
  p_from date,
  p_to date,
  p_today date,
  p_driver_id uuid default null,
  p_vehicle_id uuid default null
)
returns table (
  id uuid,
  service_date date,
  departure_time time,
  direction text,
  customer_id uuid,
  route_id uuid,
  vehicle_id uuid,
  driver_id uuid,
  planned_driver_id uuid,
  is_extra boolean,
  status text,
  change_reason text,
  notes text,
  price bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select trip.id,
    trip.service_date,
    trip.departure_time,
    trip.direction,
    trip.customer_id,
    trip.route_id,
    trip.vehicle_id,
    trip.driver_id,
    trip.planned_driver_id,
    trip.is_extra,
    case
      when trip.is_cancelled then 'cancelled'
      when trip.is_done then 'done'
      when trip.service_date > p_today then 'planned'
      when public.trip_recording_on(p_organization_id, trip.service_date) = 'automatic' then 'done'
      else 'unrecorded'
    end,
    trip.change_reason,
    trip.notes,
    coalesce(trip.trip_price, route.trip_price)
  from public.daily_trips as trip
  left join public.routes as route on route.id = trip.route_id
  where trip.organization_id = p_organization_id
    and trip.service_date between p_from and p_to
    and (
      p_driver_id is null
      or trip.driver_id = p_driver_id
      or trip.planned_driver_id = p_driver_id
    )
    and (p_vehicle_id is null or trip.vehicle_id = p_vehicle_id)
  order by trip.service_date, trip.departure_time, trip.direction
$$;

revoke execute on function public.trip_log(uuid, date, date, date, uuid, uuid) from public, anon;
grant execute on function public.trip_log(uuid, date, date, date, uuid, uuid) to authenticated;
