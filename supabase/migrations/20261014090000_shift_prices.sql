-- A route's trip_price is what its customer pays for one day of it. A route
-- with an outbound and a return time is a full trip, a shift, priced as one;
-- a route that runs one direction is priced for that one trip.
-- Each planned trip carries its direction's share of the price, so a day where
-- only one direction of a shift ran earns half of it, and revenue still adds
-- up the done trips' prices.

-- The shares are whole minor units that add up to the price; the outbound trip
-- takes the odd one. A route that runs one direction keeps its whole price for
-- any trip, extra trips in the other direction included.
create function public.route_trip_share(
  p_trip_price bigint,
  p_outbound_time time,
  p_return_time time,
  p_direction text
)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select case
    when p_outbound_time is null or p_return_time is null then p_trip_price
    when p_direction = 'outbound' then p_trip_price - p_trip_price / 2
    else p_trip_price / 2
  end
$$;

revoke execute on function public.route_trip_share(bigint, time, time, text) from public, anon;
grant execute on function public.route_trip_share(bigint, time, time, text) to authenticated;

-- Same as before, except that a trip takes its direction's share of the route
-- price.
create or replace function public.prepare_daily_trips(p_organization_id uuid, p_service_date date)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_today date := public.organization_today(p_organization_id);
begin
  if p_service_date < v_today then
    if exists (
      select 1
      from public.daily_trips as trip
      where trip.organization_id = p_organization_id
        and trip.service_date = p_service_date
        and not trip.is_extra
    ) then
      return;
    end if;
  else
    delete from public.daily_trips as trip
    where trip.organization_id = p_organization_id
      and trip.service_date = p_service_date
      and not trip.is_extra
      and trip.change_reason is null
      and not trip.is_cancelled
      and not trip.is_done
      and not exists (
        select 1
        from public.routes as route
        where route.id = trip.route_id
          and route.is_active
          and extract(dow from p_service_date)::smallint = any (route.operating_days)
          and (case trip.direction when 'outbound' then route.outbound_time else route.return_time end) is not null
      );

    update public.daily_trips as trip
    set departure_time = case trip.direction when 'outbound' then route.outbound_time else route.return_time end,
        customer_id = route.customer_id,
        vehicle_id = route.vehicle_id,
        driver_id = route.driver_id,
        planned_driver_id = route.driver_id
    from public.routes as route
    where route.id = trip.route_id
      and trip.organization_id = p_organization_id
      and trip.service_date = p_service_date
      and not trip.is_extra
      and trip.change_reason is null
      and not trip.is_cancelled
      and not trip.is_done
      and (trip.departure_time, trip.customer_id, trip.vehicle_id, trip.driver_id, trip.planned_driver_id)
        is distinct from (
          case trip.direction when 'outbound' then route.outbound_time else route.return_time end,
          route.customer_id,
          route.vehicle_id,
          route.driver_id,
          route.driver_id
        );

    update public.daily_trips as trip
    set trip_price = public.route_trip_share(route.trip_price, route.outbound_time, route.return_time, trip.direction)
    from public.routes as route
    where route.id = trip.route_id
      and trip.organization_id = p_organization_id
      and trip.service_date = p_service_date
      and not trip.is_extra
      and not trip.is_done
      and trip.trip_price is distinct from
        public.route_trip_share(route.trip_price, route.outbound_time, route.return_time, trip.direction);
  end if;

  insert into public.daily_trips (
    organization_id, route_id, service_date, direction, departure_time,
    customer_id, vehicle_id, driver_id, planned_driver_id, trip_price
  )
  select route.organization_id, route.id, p_service_date, planned.direction,
    planned.departure_time, route.customer_id, route.vehicle_id, route.driver_id,
    route.driver_id,
    public.route_trip_share(route.trip_price, route.outbound_time, route.return_time, planned.direction)
  from public.routes as route
  cross join lateral (
    values ('outbound', route.outbound_time), ('return', route.return_time)
  ) as planned (direction, departure_time)
  where route.organization_id = p_organization_id
    and route.is_active
    and planned.departure_time is not null
    and extract(dow from p_service_date)::smallint = any (route.operating_days)
    and (
      p_service_date >= v_today
      or public.organization_date(p_organization_id, route.created_at) <= p_service_date
    )
  on conflict (route_id, service_date, direction) where not is_extra do nothing;
end;
$$;

-- Same as before, except that a trip without a price counts at its
-- direction's share of its route's price.
create or replace function public.trip_report(
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
    coalesce(sum(price.amount), 0)::bigint,
    (count(*) filter (where price.amount is null))::integer
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

-- Same as before, except that price falls back to the direction's share of
-- the route's price.
create or replace function public.trip_log(
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
    coalesce(
      trip.trip_price,
      public.route_trip_share(route.trip_price, route.outbound_time, route.return_time, trip.direction)
    )
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

-- The prices so far were for one direction, so a full route's shift costs
-- twice that. Each of its trips keeps the same share, and no revenue changes.
update public.routes
set trip_price = trip_price * 2
where trip_price is not null
  and outbound_time is not null
  and return_time is not null;
