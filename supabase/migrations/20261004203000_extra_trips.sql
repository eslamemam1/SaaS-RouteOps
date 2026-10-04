-- An extra trip is one a member adds to a day by hand, on top of the trips
-- copied from the routes, such as an evening trip or a one-off airport run.
-- It belongs to a customer and may belong to one of its routes.
-- prepare_daily_trips never changes or removes extra trips, and a member may
-- remove an extra trip that was added by mistake.

alter table public.daily_trips
  add column is_extra boolean not null default false,
  alter column route_id drop not null,
  add constraint daily_trips_planned_needs_route check (is_extra or route_id is not null);

-- A route still has one planned trip per day and direction; extra trips may repeat.
alter table public.daily_trips
  drop constraint daily_trips_route_day_direction_key;

create unique index daily_trips_route_day_direction_key
  on public.daily_trips (route_id, service_date, direction)
  where not is_extra;

grant insert (is_extra, notes) on table public.daily_trips to authenticated;

create policy "members remove extra trips"
on public.daily_trips
for delete
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
  and is_extra
);

-- Same as before, except that extra trips are left alone.
create or replace function public.prepare_daily_trips(p_organization_id uuid, p_service_date date)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_service_date >= current_date then
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
        driver_id = route.driver_id
    from public.routes as route
    where route.id = trip.route_id
      and trip.organization_id = p_organization_id
      and trip.service_date = p_service_date
      and not trip.is_extra
      and trip.change_reason is null
      and not trip.is_cancelled
      and not trip.is_done
      and (trip.departure_time, trip.customer_id, trip.vehicle_id, trip.driver_id)
        is distinct from (
          case trip.direction when 'outbound' then route.outbound_time else route.return_time end,
          route.customer_id,
          route.vehicle_id,
          route.driver_id
        );
  end if;

  insert into public.daily_trips (
    organization_id, route_id, service_date, direction, departure_time,
    customer_id, vehicle_id, driver_id
  )
  select route.organization_id, route.id, p_service_date, planned.direction,
    planned.departure_time, route.customer_id, route.vehicle_id, route.driver_id
  from public.routes as route
  cross join lateral (
    values ('outbound', route.outbound_time), ('return', route.return_time)
  ) as planned (direction, departure_time)
  where route.organization_id = p_organization_id
    and route.is_active
    and planned.departure_time is not null
    and extract(dow from p_service_date)::smallint = any (route.operating_days)
  on conflict (route_id, service_date, direction) where not is_extra do nothing;
end;
$$;
