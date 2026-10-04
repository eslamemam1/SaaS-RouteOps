-- A daily trip records what one route did on one day in one direction.
-- prepare_daily_trips copies the day's trips from the routes; a member then
-- swaps the vehicle or driver, or cancels a trip, with a reason.
--
-- A trip counts as done unless it is cancelled.
-- A trip without a reason still follows its route until its day has passed,
-- so editing a route updates the coming days but never rewrites history.
-- customer_id, vehicle_id, and driver_id are copied onto the trip so that
-- later route edits do not change what happened.

alter table public.routes
  add constraint routes_organization_id_id_key unique (organization_id, id);

create table public.daily_trips (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  route_id uuid not null,
  service_date date not null,
  direction text not null,
  departure_time time not null,
  customer_id uuid not null,
  vehicle_id uuid,
  driver_id uuid,
  is_cancelled boolean not null default false,
  change_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_trips_route_fkey foreign key (organization_id, route_id)
    references public.routes (organization_id, id),
  constraint daily_trips_customer_fkey foreign key (organization_id, customer_id)
    references public.customers (organization_id, id),
  constraint daily_trips_vehicle_fkey foreign key (organization_id, vehicle_id)
    references public.vehicles (organization_id, id),
  constraint daily_trips_driver_fkey foreign key (organization_id, driver_id)
    references public.drivers (organization_id, id),
  constraint daily_trips_route_day_direction_key unique (route_id, service_date, direction),
  constraint daily_trips_direction_known check (direction in ('outbound', 'return')),
  constraint daily_trips_change_reason_known check (
    change_reason in ('holiday', 'vehicle_breakdown', 'driver_absent', 'customer_request', 'other')
  ),
  constraint daily_trips_cancel_needs_reason check (not is_cancelled or change_reason is not null),
  constraint daily_trips_other_needs_notes check (
    change_reason is distinct from 'other' or coalesce(char_length(btrim(notes)), 0) > 0
  ),
  constraint daily_trips_notes_length check (char_length(notes) <= 2000)
);

create index daily_trips_organization_id_service_date_idx
  on public.daily_trips (organization_id, service_date);
create index daily_trips_organization_id_customer_id_idx
  on public.daily_trips (organization_id, customer_id);
create index daily_trips_organization_id_vehicle_id_idx
  on public.daily_trips (organization_id, vehicle_id);
create index daily_trips_organization_id_driver_id_idx
  on public.daily_trips (organization_id, driver_id);

create trigger daily_trips_set_updated_at
before update on public.daily_trips
for each row
execute function public.set_updated_at();

revoke all on table public.daily_trips from public, anon, authenticated;

grant select on table public.daily_trips to authenticated;
grant insert (organization_id, route_id, service_date, direction, departure_time, customer_id, vehicle_id, driver_id)
  on table public.daily_trips to authenticated;
grant update (departure_time, customer_id, vehicle_id, driver_id, is_cancelled, change_reason, notes)
  on table public.daily_trips to authenticated;
grant delete on table public.daily_trips to authenticated;

grant select, insert, update, delete on table public.daily_trips to service_role;

alter table public.daily_trips enable row level security;

create policy "members read daily trips"
on public.daily_trips
for select
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members add daily trips"
on public.daily_trips
for insert
to authenticated
with check (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members edit daily trips"
on public.daily_trips
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

-- Only unchanged trips of today or later may be removed, which happens when
-- their route stops running that day. Recorded and changed trips stay.
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
  and service_date >= current_date
);

-- Runs with the caller's rights, so row level security limits it to the
-- caller's own organization.
create function public.prepare_daily_trips(p_organization_id uuid, p_service_date date)
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

revoke execute on function public.prepare_daily_trips(uuid, date) from public, anon;
grant execute on function public.prepare_daily_trips(uuid, date) to authenticated;
