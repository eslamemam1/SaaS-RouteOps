-- A trip occupies its driver and vehicle from departure until arrival.
-- Two non-cancelled trips of the same driver or vehicle on the same day must
-- not overlap. Active routes must not schedule overlapping legs for the same
-- driver or vehicle on shared operating days. Arrival is required whenever
-- that direction has a departure; staff trips stay on one calendar day.

-- Same-day provisional arrival: two hours later, or 23:59:59 when that
-- would wrap past midnight (time + interval wraps within the day).
create function public.provisional_arrival(p_departure time)
returns time
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when p_departure is null then null
    when (p_departure + interval '2 hours')::time > p_departure
      then (p_departure + interval '2 hours')::time
    when p_departure < time '23:59:59' then time '23:59:59'
    else null
  end;
$$;

revoke all on function public.provisional_arrival(time)
  from public, anon, authenticated;
grant execute on function public.provisional_arrival(time)
  to authenticated, service_role;

alter table public.routes
  add column outbound_arrival_time time,
  add column return_arrival_time time;

update public.routes
set outbound_arrival_time = public.provisional_arrival(outbound_time)
where outbound_time is not null;

update public.routes
set return_arrival_time = public.provisional_arrival(return_time)
where return_time is not null;

alter table public.routes
  add constraint routes_outbound_arrival check (
    (outbound_time is null and outbound_arrival_time is null)
    or (
      outbound_time is not null
      and outbound_arrival_time is not null
      and outbound_arrival_time > outbound_time
    )
  ),
  add constraint routes_return_arrival check (
    (return_time is null and return_arrival_time is null)
    or (
      return_time is not null
      and return_arrival_time is not null
      and return_arrival_time > return_time
    )
  );

grant insert (outbound_arrival_time, return_arrival_time)
  on table public.routes to authenticated;
grant update (outbound_arrival_time, return_arrival_time)
  on table public.routes to authenticated;

alter table public.daily_trips
  add column arrival_time time;

-- Prefer the route's arrival when it is still after this trip's departure;
-- otherwise give the trip its own two-hour window (trips can leave later
-- than the route after a one-day change).
update public.daily_trips as trip
set arrival_time = case
  when trip.direction = 'outbound'
    and route.outbound_arrival_time is not null
    and route.outbound_arrival_time > trip.departure_time
    then route.outbound_arrival_time
  when trip.direction = 'return'
    and route.return_arrival_time is not null
    and route.return_arrival_time > trip.departure_time
    then route.return_arrival_time
  else public.provisional_arrival(trip.departure_time)
end
from public.routes as route
where route.id = trip.route_id
  and trip.arrival_time is null;

update public.daily_trips
set arrival_time = public.provisional_arrival(departure_time)
where arrival_time is null;

alter table public.daily_trips
  alter column arrival_time set not null,
  add constraint daily_trips_arrival_after_departure check (
    arrival_time > departure_time
  );

grant insert (arrival_time) on table public.daily_trips to authenticated;
grant update (arrival_time) on table public.daily_trips to authenticated;

-- Half-open intervals [start, end): ending when another starts is allowed.
create function public.times_overlap(
  p_start_a time,
  p_end_a time,
  p_start_b time,
  p_end_b time
)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select p_start_a < p_end_b and p_start_b < p_end_a;
$$;

revoke all on function public.times_overlap(time, time, time, time)
  from public, anon, authenticated;
grant execute on function public.times_overlap(time, time, time, time)
  to authenticated, service_role;

create function public.check_daily_trip_overlap()
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

revoke all on function public.check_daily_trip_overlap() from public, anon, authenticated;

create trigger daily_trips_check_overlap
before insert or update of
  departure_time, arrival_time, driver_id, vehicle_id, is_cancelled, service_date
on public.daily_trips
for each row
execute function public.check_daily_trip_overlap();

create function public.check_route_schedule_overlap()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_kind text;
  v_leg record;
begin
  if not new.is_active then
    return new;
  end if;

  -- Outbound and return of the same active route must not overlap.
  if new.outbound_time is not null
    and new.return_time is not null
    and public.times_overlap(
      new.outbound_time, new.outbound_arrival_time,
      new.return_time, new.return_arrival_time
    )
  then
    raise exception 'driver_overlap' using errcode = 'P0001';
  end if;

  for v_leg in
    select * from (
      values
        ('outbound', new.outbound_time, new.outbound_arrival_time),
        ('return', new.return_time, new.return_arrival_time)
    ) as leg (direction, departure_time, arrival_time)
    where leg.departure_time is not null
  loop
    v_kind := null;
    select case
      when other.driver_id = new.driver_id then 'driver_overlap'
      when new.vehicle_id is not null
        and other.vehicle_id is not null
        and other.vehicle_id = new.vehicle_id then 'vehicle_overlap'
    end
    into v_kind
    from public.routes as other
    cross join lateral (
      values
        ('outbound', other.outbound_time, other.outbound_arrival_time),
        ('return', other.return_time, other.return_arrival_time)
    ) as other_leg (direction, departure_time, arrival_time)
    where other.organization_id = new.organization_id
      and other.id is distinct from new.id
      and other.is_active
      and other.operating_days && new.operating_days
      and other_leg.departure_time is not null
      and public.times_overlap(
        v_leg.departure_time, v_leg.arrival_time,
        other_leg.departure_time, other_leg.arrival_time
      )
      and (
        other.driver_id = new.driver_id
        or (
          new.vehicle_id is not null
          and other.vehicle_id is not null
          and other.vehicle_id = new.vehicle_id
        )
      )
    order by case
      when other.driver_id = new.driver_id then 0
      else 1
    end
    limit 1;

    if v_kind is not null then
      raise exception '%', v_kind using errcode = 'P0001';
    end if;
  end loop;

  return new;
end;
$$;

revoke all on function public.check_route_schedule_overlap()
  from public, anon, authenticated;

create trigger routes_check_schedule_overlap
before insert or update of
  driver_id, vehicle_id, outbound_time, outbound_arrival_time,
  return_time, return_arrival_time, operating_days, is_active
on public.routes
for each row
when (new.is_active)
execute function public.check_route_schedule_overlap();

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
    on conflict (route_id, service_date, direction) where not is_extra do nothing;

    get diagnostics v_count = row_count;
    v_added := v_added + v_count;
  end loop;

  return v_added;
end;
$$;

create or replace function public.restore_omitted_trip(
  p_organization_id uuid,
  p_route_id uuid,
  p_service_date date,
  p_direction text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_departure time;
  v_arrival time;
  v_customer_id uuid;
  v_vehicle_id uuid;
  v_driver_id uuid;
  v_trip_price bigint;
  v_trip_id uuid;
  v_removed integer;
begin
  if p_direction is distinct from 'outbound'
    and p_direction is distinct from 'return'
  then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  select
    case p_direction
      when 'outbound' then route.outbound_time
      else route.return_time
    end,
    case p_direction
      when 'outbound' then route.outbound_arrival_time
      else route.return_arrival_time
    end,
    route.customer_id,
    route.vehicle_id,
    route.driver_id,
    public.route_trip_share(
      route.trip_price, route.outbound_time, route.return_time, p_direction
    )
  into
    v_departure, v_arrival, v_customer_id, v_vehicle_id, v_driver_id,
    v_trip_price
  from public.routes as route
  where route.id = p_route_id
    and route.organization_id = p_organization_id;

  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if v_departure is null or v_arrival is null or v_driver_id is null then
    raise exception 'no_trip' using errcode = 'P0001';
  end if;

  delete from public.daily_trip_omissions as omitted
  where omitted.organization_id = p_organization_id
    and omitted.route_id = p_route_id
    and omitted.service_date = p_service_date
    and omitted.direction = p_direction;

  get diagnostics v_removed = row_count;
  if v_removed = 0 then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  insert into public.daily_trips (
    organization_id, route_id, service_date, direction, departure_time,
    arrival_time, customer_id, vehicle_id, driver_id, planned_driver_id,
    trip_price
  )
  values (
    p_organization_id, p_route_id, p_service_date, p_direction, v_departure,
    v_arrival, v_customer_id, v_vehicle_id, v_driver_id, v_driver_id,
    v_trip_price
  )
  on conflict (route_id, service_date, direction) where not is_extra do nothing
  returning id into v_trip_id;

  if v_trip_id is null then
    select trip.id into v_trip_id
    from public.daily_trips as trip
    where trip.organization_id = p_organization_id
      and trip.route_id = p_route_id
      and trip.service_date = p_service_date
      and trip.direction = p_direction
      and not trip.is_extra;
  end if;

  return v_trip_id;
end;
$$;
