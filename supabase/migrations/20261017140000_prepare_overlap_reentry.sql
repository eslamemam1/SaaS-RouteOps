-- prepare_daily_trips inserts every planned leg and relies on ON CONFLICT to
-- skip ones already there. BEFORE INSERT runs first, so the occupancy check
-- treated the existing twin as a driver_overlap. Ignore that twin, and only
-- select legs that are not already on the day.

create or replace function public.check_daily_trip_overlap()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_kind text;
begin
  if new.is_cancelled then
    return new;
  end if;

  select case
    when new.driver_id is not null
      and other.driver_id = new.driver_id then 'driver_overlap'
    when new.vehicle_id is not null
      and other.vehicle_id = new.vehicle_id then 'vehicle_overlap'
  end
  into v_kind
  from public.daily_trips as other
  where other.organization_id = new.organization_id
    and other.service_date = new.service_date
    and other.id is distinct from new.id
    and not other.is_cancelled
    -- The planned twin that ON CONFLICT would skip is not a real overlap.
    and not (
      not coalesce(new.is_extra, false)
      and not other.is_extra
      and other.route_id is not distinct from new.route_id
      and other.direction = new.direction
    )
    and public.times_overlap(
      new.departure_time, new.arrival_time,
      other.departure_time, other.arrival_time
    )
    and (
      (new.driver_id is not null and other.driver_id = new.driver_id)
      or (
        new.vehicle_id is not null
        and other.vehicle_id is not null
        and other.vehicle_id = new.vehicle_id
      )
    )
  order by case
    when new.driver_id is not null and other.driver_id = new.driver_id then 0
    else 1
  end
  limit 1;

  if v_kind is not null then
    raise exception '%', v_kind using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create or replace function public.prepare_daily_trips(
  p_organization_id uuid,
  p_service_date date
)
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
          and extract(dow from p_service_date)::smallint
            = any (route.operating_days)
          and (
            case trip.direction
              when 'outbound' then route.outbound_time
              else route.return_time
            end
          ) is not null
      );

    update public.daily_trips as trip
    set departure_time = case trip.direction
          when 'outbound' then route.outbound_time
          else route.return_time
        end,
        arrival_time = case trip.direction
          when 'outbound' then route.outbound_arrival_time
          else route.return_arrival_time
        end,
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
      and (
        trip.departure_time,
        trip.arrival_time,
        trip.customer_id,
        trip.vehicle_id,
        trip.driver_id,
        trip.planned_driver_id
      ) is distinct from (
        case trip.direction
          when 'outbound' then route.outbound_time
          else route.return_time
        end,
        case trip.direction
          when 'outbound' then route.outbound_arrival_time
          else route.return_arrival_time
        end,
        route.customer_id,
        route.vehicle_id,
        route.driver_id,
        route.driver_id
      );

    update public.daily_trips as trip
    set trip_price = public.route_trip_share(
      route.trip_price, route.outbound_time, route.return_time, trip.direction
    )
    from public.routes as route
    where route.id = trip.route_id
      and trip.organization_id = p_organization_id
      and trip.service_date = p_service_date
      and not trip.is_extra
      and not trip.is_done
      and trip.trip_price is distinct from public.route_trip_share(
        route.trip_price, route.outbound_time, route.return_time, trip.direction
      );
  end if;

  insert into public.daily_trips (
    organization_id, route_id, service_date, direction, departure_time,
    arrival_time, customer_id, vehicle_id, driver_id, planned_driver_id,
    trip_price
  )
  select route.organization_id, route.id, p_service_date, planned.direction,
    planned.departure_time, planned.arrival_time, route.customer_id,
    route.vehicle_id, route.driver_id, route.driver_id,
    public.route_trip_share(
      route.trip_price, route.outbound_time, route.return_time, planned.direction
    )
  from public.routes as route
  cross join lateral (
    values
      ('outbound', route.outbound_time, route.outbound_arrival_time),
      ('return', route.return_time, route.return_arrival_time)
  ) as planned (direction, departure_time, arrival_time)
  where route.organization_id = p_organization_id
    and route.is_active
    and planned.departure_time is not null
    and extract(dow from p_service_date)::smallint = any (route.operating_days)
    and (
      p_service_date >= v_today
      or public.organization_date(p_organization_id, route.created_at)
        <= p_service_date
    )
    and not exists (
      select 1
      from public.daily_trip_omissions as omitted
      where omitted.organization_id = p_organization_id
        and omitted.route_id = route.id
        and omitted.service_date = p_service_date
        and omitted.direction = planned.direction
    )
    and not exists (
      select 1
      from public.daily_trips as trip
      where trip.route_id = route.id
        and trip.service_date = p_service_date
        and trip.direction = planned.direction
        and not trip.is_extra
    )
  on conflict (route_id, service_date, direction) where not is_extra do nothing;
end;
$$;

create or replace function public.add_route_trips(
  p_organization_id uuid,
  p_route_ids uuid[],
  p_from date,
  p_to date
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_today date := public.organization_today(p_organization_id);
  v_day date;
  v_count integer;
  v_added integer := 0;
begin
  if coalesce(cardinality(p_route_ids), 0) = 0 then
    raise exception 'no_routes' using errcode = 'P0001';
  end if;
  if p_from is null or p_to is null or p_from > p_to or p_to >= v_today then
    raise exception 'past_days' using errcode = 'P0001';
  end if;
  if p_to - p_from >= 93 then
    raise exception 'too_many_days' using errcode = 'P0001';
  end if;

  for v_day in
    select day::date from generate_series(p_from, p_to, interval '1 day') as day
  loop
    delete from public.daily_trip_omissions as omitted
    where omitted.organization_id = p_organization_id
      and omitted.route_id = any (p_route_ids)
      and omitted.service_date = v_day;

    perform public.prepare_daily_trips(p_organization_id, v_day);

    insert into public.daily_trips (
      organization_id, route_id, service_date, direction, departure_time,
      arrival_time, customer_id, vehicle_id, driver_id, planned_driver_id,
      trip_price
    )
    select route.organization_id, route.id, v_day, planned.direction,
      planned.departure_time, planned.arrival_time, route.customer_id,
      route.vehicle_id, route.driver_id, route.driver_id,
      public.route_trip_share(
        route.trip_price, route.outbound_time, route.return_time,
        planned.direction
      )
    from public.routes as route
    cross join lateral (
      values
        ('outbound', route.outbound_time, route.outbound_arrival_time),
        ('return', route.return_time, route.return_arrival_time)
    ) as planned (direction, departure_time, arrival_time)
    where route.organization_id = p_organization_id
      and route.id = any (p_route_ids)
      and planned.departure_time is not null
      and extract(dow from v_day)::smallint = any (route.operating_days)
      and not exists (
        select 1
        from public.daily_trips as trip
        where trip.route_id = route.id
          and trip.service_date = v_day
          and trip.direction = planned.direction
          and not trip.is_extra
      )
    on conflict (route_id, service_date, direction) where not is_extra do nothing;

    get diagnostics v_count = row_count;
    v_added := v_added + v_count;
  end loop;

  return v_added;
end;
$$;
