-- A route is the standing plan: which vehicle and driver carry which
-- customer's staff, between which points, at which times, on which days.
-- Members read, add, and edit their own organization's routes.
-- There is no delete grant: a route is marked inactive instead.
--
-- Foreign keys include organization_id, so a route can reference only a
-- customer, vehicle, or driver of its own organization. Foreign key checks
-- ignore row level security, so this cannot be left to the policies.

alter table public.customers
  add constraint customers_organization_id_id_key unique (organization_id, id);
alter table public.vehicles
  add constraint vehicles_organization_id_id_key unique (organization_id, id);
alter table public.drivers
  add constraint drivers_organization_id_id_key unique (organization_id, id);

create table public.routes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  customer_id uuid not null,
  vehicle_id uuid,
  driver_id uuid,
  start_point text not null,
  end_point text not null,
  outbound_time time,
  return_time time,
  -- Days as PostgreSQL day-of-week numbers: 0 is Sunday, 6 is Saturday.
  operating_days smallint[] not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint routes_customer_fkey foreign key (organization_id, customer_id)
    references public.customers (organization_id, id),
  constraint routes_vehicle_fkey foreign key (organization_id, vehicle_id)
    references public.vehicles (organization_id, id),
  constraint routes_driver_fkey foreign key (organization_id, driver_id)
    references public.drivers (organization_id, id),
  constraint routes_name_length check (char_length(btrim(name)) between 1 and 200),
  constraint routes_start_point_length check (char_length(btrim(start_point)) between 1 and 300),
  constraint routes_end_point_length check (char_length(btrim(end_point)) between 1 and 300),
  constraint routes_trip_time check (outbound_time is not null or return_time is not null),
  constraint routes_operating_days check (
    cardinality(operating_days) between 1 and 7
    and operating_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
  ),
  constraint routes_notes_length check (char_length(notes) <= 2000)
);

create index routes_organization_id_name_idx
  on public.routes (organization_id, name);
create index routes_organization_id_customer_id_idx
  on public.routes (organization_id, customer_id);
create index routes_organization_id_vehicle_id_idx
  on public.routes (organization_id, vehicle_id);
create index routes_organization_id_driver_id_idx
  on public.routes (organization_id, driver_id);

create trigger routes_set_updated_at
before update on public.routes
for each row
execute function public.set_updated_at();

revoke all on table public.routes from public, anon, authenticated;

grant select on table public.routes to authenticated;
grant insert (organization_id, name, customer_id, vehicle_id, driver_id, start_point, end_point, outbound_time, return_time, operating_days, notes, is_active)
  on table public.routes to authenticated;
grant update (name, customer_id, vehicle_id, driver_id, start_point, end_point, outbound_time, return_time, operating_days, notes, is_active)
  on table public.routes to authenticated;

grant select, insert, update, delete on table public.routes to service_role;

alter table public.routes enable row level security;

create policy "members read routes"
on public.routes
for select
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members add routes"
on public.routes
for insert
to authenticated
with check (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members edit routes"
on public.routes
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
