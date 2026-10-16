-- A member may delete any daily trip that was recorded by mistake, including
-- a route trip marked done. Deleting a route trip records an omission so
-- prepare_daily_trips does not put it back. Prepare's own cleanup deletes do
-- not record omissions. add_route_trips clears omissions for the routes it
-- adds so a mistaken delete can be undone on past days.

create table public.daily_trip_omissions (
  organization_id uuid not null references public.organizations (id),
  route_id uuid not null references public.routes (id) on delete cascade,
  service_date date not null,
  direction text not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, route_id, service_date, direction),
  constraint daily_trip_omissions_direction_check
    check (direction in ('outbound', 'return')),
  constraint daily_trip_omissions_route_organization
    foreign key (organization_id, route_id)
    references public.routes (organization_id, id)
);

create index daily_trip_omissions_day_idx
  on public.daily_trip_omissions (organization_id, service_date);

revoke all on table public.daily_trip_omissions from public, anon, authenticated;
grant select, insert, delete on table public.daily_trip_omissions to authenticated;
grant select, insert, update, delete on table public.daily_trip_omissions to service_role;

alter table public.daily_trip_omissions enable row level security;

create policy "members read trip omissions"
on public.daily_trip_omissions
for select
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members add trip omissions"
on public.daily_trip_omissions
for insert
to authenticated
with check (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members remove trip omissions"
on public.daily_trip_omissions
for delete
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "only active organizations"
on public.daily_trip_omissions
as restrictive
for all
to authenticated
using (organization_id in (select id from public.organizations where is_active))
with check (organization_id in (select id from public.organizations where is_active));

-- When a member deletes a route trip on purpose, record the omission.
-- prepare_daily_trips deletes without this setting, so those stay eligible
-- to come back if the route runs that day again.
create function public.record_daily_trip_omission()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if coalesce(nullif(current_setting('routeops.omit_trip', true), ''), '') = '1'
    and not old.is_extra
    and old.route_id is not null
  then
    insert into public.daily_trip_omissions (
      organization_id, route_id, service_date, direction
    )
    values (
      old.organization_id, old.route_id, old.service_date, old.direction
    )
    on conflict do nothing;
  end if;
  return old;
end;
$$;

create trigger daily_trips_record_omission
after delete on public.daily_trips
for each row
execute function public.record_daily_trip_omission();

-- Members delete any trip of their organization; the omission trigger runs
-- only when remove_daily_trip sets the session flag.
drop policy if exists "members remove unchanged coming trips" on public.daily_trips;
drop policy if exists "members remove extra trips" on public.daily_trips;

create policy "members remove daily trips"
on public.daily_trips
for delete
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create function public.remove_daily_trip(
  p_organization_id uuid,
  p_trip_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  perform set_config('routeops.omit_trip', '1', true);

  delete from public.daily_trips as trip
  where trip.id = p_trip_id
    and trip.organization_id = p_organization_id;

  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.remove_daily_trip(uuid, uuid) from public, anon;
grant execute on function public.remove_daily_trip(uuid, uuid) to authenticated;

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
      customer_id, vehicle_id, driver_id, planned_driver_id, trip_price
    )
    select route.organization_id, route.id, v_day, planned.direction,
      planned.departure_time, route.customer_id, route.vehicle_id, route.driver_id,
      route.driver_id,
      public.route_trip_share(route.trip_price, route.outbound_time, route.return_time, planned.direction)
    from public.routes as route
    cross join lateral (
      values ('outbound', route.outbound_time), ('return', route.return_time)
    ) as planned (direction, departure_time)
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
