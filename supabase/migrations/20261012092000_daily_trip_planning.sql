-- Keeps the daily trips a faithful record:
-- * A day before the organization's today is a record. Once it has trips it
--   never changes; opened late, it gets the trips of the routes that existed
--   that day only.
-- * Each planned trip keeps the driver its route planned, planned_driver_id,
--   so an absence counts against the driver who was absent even after the
--   route changes driver.
-- * Changing a route updates the coming days that were already opened, so a
--   day opened in advance does not miss a new route or keep an old driver.
-- * An extra trip may name only a route of its own customer.

alter table public.daily_trips
  add column planned_driver_id uuid,
  add constraint daily_trips_planned_driver_fkey foreign key (organization_id, planned_driver_id)
    references public.drivers (organization_id, id);

-- An unchanged trip was planned for the driver who drove it. For a changed
-- trip the route's driver is the best that is known.
update public.daily_trips as trip
set planned_driver_id = case
    when trip.change_reason is null and not trip.is_cancelled then trip.driver_id
    else route.driver_id
  end
from public.routes as route
where route.id = trip.route_id
  and not trip.is_extra;

create index daily_trips_organization_id_planned_driver_id_idx
  on public.daily_trips (organization_id, planned_driver_id);

-- prepare_daily_trips runs with the caller's rights and sets it.
grant insert (planned_driver_id) on table public.daily_trips to authenticated;
grant update (planned_driver_id) on table public.daily_trips to authenticated;

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
    set trip_price = route.trip_price
    from public.routes as route
    where route.id = trip.route_id
      and trip.organization_id = p_organization_id
      and trip.service_date = p_service_date
      and not trip.is_extra
      and not trip.is_done
      and trip.trip_price is distinct from route.trip_price;
  end if;

  insert into public.daily_trips (
    organization_id, route_id, service_date, direction, departure_time,
    customer_id, vehicle_id, driver_id, planned_driver_id, trip_price
  )
  select route.organization_id, route.id, p_service_date, planned.direction,
    planned.departure_time, route.customer_id, route.vehicle_id, route.driver_id,
    route.driver_id, route.trip_price
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

-- Runs with the caller's rights, like prepare_daily_trips.
create function public.prepare_opened_coming_days()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_day date;
begin
  for v_day in
    select distinct trip.service_date
    from public.daily_trips as trip
    where trip.organization_id = new.organization_id
      and trip.service_date >= public.organization_today(new.organization_id)
      and not trip.is_extra
  loop
    perform public.prepare_daily_trips(new.organization_id, v_day);
  end loop;
  return null;
end;
$$;

revoke all on function public.prepare_opened_coming_days() from public, anon, authenticated;

create trigger routes_prepare_opened_coming_days
after insert or update of customer_id, vehicle_id, driver_id, outbound_time, return_time, operating_days, is_active, trip_price
on public.routes
for each row
execute function public.prepare_opened_coming_days();

create function public.check_extra_trip_route()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.routes as route
    where route.id = new.route_id
      and route.organization_id = new.organization_id
      and route.customer_id = new.customer_id
  ) then
    raise exception 'an extra trip may name only a route of its own customer'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.check_extra_trip_route() from public, anon, authenticated;

create trigger daily_trips_check_extra_trip_route
before insert or update of route_id, customer_id
on public.daily_trips
for each row
when (new.is_extra and new.route_id is not null)
execute function public.check_extra_trip_route();
