-- Trips are counted as full trips, as they are priced: one direction of a
-- route with an outbound and a return time is half a full trip, and any other
-- trip, a one-direction route's or an extra trip without a route, is a full
-- trip. Counts are kept in halves so they stay whole numbers; the screens
-- divide by two. Driver pay still counts each direction, from done_trips.

create function public.trip_halves(p_outbound_time time, p_return_time time)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case when p_outbound_time is not null and p_return_time is not null then 1 else 2 end
$$;

revoke execute on function public.trip_halves(time, time) from public, anon;
grant execute on function public.trip_halves(time, time) to authenticated;

-- Same as before, with done_halves and extra_halves, the done and extra trips
-- in halves of a full trip.
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
  unpriced_trips integer,
  done_halves integer,
  extra_halves integer
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
    coalesce(sum(price.amount), 0)::bigint,
    (count(*) filter (where price.amount is null))::integer,
    coalesce(sum(public.trip_halves(route.outbound_time, route.return_time)), 0)::integer,
    coalesce(sum(public.trip_halves(route.outbound_time, route.return_time)) filter (where trip.is_extra), 0)::integer
  from public.daily_trips as trip
  left join public.routes as route on route.id = trip.route_id
  cross join lateral (
    select coalesce(
      trip.trip_price,
      public.route_trip_share(route.trip_price, route.outbound_time, route.return_time, trip.direction)
    ) as amount
  ) as price
  where trip.organization_id = p_organization_id
    and trip.service_date between p_from and p_to
    and (
      trip.is_done
      or (
        not trip.is_cancelled
        and trip.service_date <= p_today
        and public.trip_recording_on(p_organization_id, trip.service_date) = 'automatic'
      )
    )
  group by trip.customer_id, trip.route_id, trip.vehicle_id, trip.driver_id, trip.direction
$$;

revoke execute on function public.trip_report(uuid, date, date, date) from public, anon;
grant execute on function public.trip_report(uuid, date, date, date) to authenticated;

-- Same as before, with halves, how many halves of a full trip the trip is.
drop function public.trip_log(uuid, date, date, date, uuid, uuid);

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
  price bigint,
  halves integer
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
    coalesce(
      trip.trip_price,
      public.route_trip_share(route.trip_price, route.outbound_time, route.return_time, trip.direction)
    ),
    public.trip_halves(route.outbound_time, route.return_time)
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
