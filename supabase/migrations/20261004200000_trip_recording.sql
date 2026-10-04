-- Each organization chooses how its daily trips are recorded:
--   automatic: a trip counts as done once its day has come, unless it is cancelled.
--   manual: a trip counts as done only after a member marks it done.
-- An organization without a settings row records trips automatically.
-- A trip a member marked done always counts as done, whatever the choice is now.

create table public.operations_settings (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  trip_recording text not null default 'automatic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operations_settings_trip_recording_known check (trip_recording in ('automatic', 'manual'))
);

create trigger operations_settings_set_updated_at
before update on public.operations_settings
for each row
execute function public.set_updated_at();

revoke all on table public.operations_settings from public, anon, authenticated;

grant select on table public.operations_settings to authenticated;
grant insert (organization_id, trip_recording) on table public.operations_settings to authenticated;
grant update (trip_recording) on table public.operations_settings to authenticated;

grant select, insert, update, delete on table public.operations_settings to service_role;

alter table public.operations_settings enable row level security;

create policy "members read operations settings"
on public.operations_settings
for select
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members add operations settings"
on public.operations_settings
for insert
to authenticated
with check (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members edit operations settings"
on public.operations_settings
for update
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
)
with check (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

-- Runs with the caller's rights, so row level security limits it to the
-- caller's own organization.
create function public.set_trip_recording(p_organization_id uuid, p_trip_recording text)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.operations_settings (organization_id, trip_recording)
  values (p_organization_id, p_trip_recording)
  on conflict (organization_id) do update
  set trip_recording = excluded.trip_recording;
$$;

revoke execute on function public.set_trip_recording(uuid, text) from public, anon;
grant execute on function public.set_trip_recording(uuid, text) to authenticated;

alter table public.daily_trips
  add column is_done boolean not null default false,
  add constraint daily_trips_done_not_cancelled check (not (is_done and is_cancelled));

grant update (is_done) on table public.daily_trips to authenticated;

-- A trip marked done is a record too, so it is never removed.
drop policy "members remove unchanged coming trips" on public.daily_trips;

create policy "members remove unchanged coming trips"
on public.daily_trips
for delete
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
  and change_reason is null
  and not is_cancelled
  and not is_done
  and service_date >= current_date
);

-- Same as before, except that a trip marked done no longer follows its route.
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
  on conflict (route_id, service_date, direction) do nothing;
end;
$$;
