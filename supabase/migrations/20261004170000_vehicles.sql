-- A vehicle belongs to one organization's fleet.
-- Members read, add, and edit their own organization's vehicles.
-- There is no delete grant: a vehicle is marked inactive instead, so later
-- routes and daily operations keep a valid reference.

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plate_number text not null,
  vehicle_type text not null,
  model text,
  model_year smallint,
  seats smallint,
  license_expires_on date,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_plate_number_length check (char_length(btrim(plate_number)) between 1 and 20),
  constraint vehicles_vehicle_type_known check (vehicle_type in ('bus', 'minibus', 'microbus', 'car')),
  constraint vehicles_model_length check (char_length(model) <= 100),
  constraint vehicles_model_year_range check (model_year between 1950 and 2100),
  constraint vehicles_seats_range check (seats between 1 and 100),
  constraint vehicles_notes_length check (char_length(notes) <= 2000)
);

create unique index vehicles_organization_id_plate_number_key
  on public.vehicles (organization_id, plate_number);

create trigger vehicles_set_updated_at
before update on public.vehicles
for each row
execute function public.set_updated_at();

revoke all on table public.vehicles from public, anon, authenticated;

grant select on table public.vehicles to authenticated;
grant insert (organization_id, plate_number, vehicle_type, model, model_year, seats, license_expires_on, notes, is_active)
  on table public.vehicles to authenticated;
grant update (plate_number, vehicle_type, model, model_year, seats, license_expires_on, notes, is_active)
  on table public.vehicles to authenticated;

grant select, insert, update, delete on table public.vehicles to service_role;

alter table public.vehicles enable row level security;

create policy "members read vehicles"
on public.vehicles
for select
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members add vehicles"
on public.vehicles
for insert
to authenticated
with check (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members edit vehicles"
on public.vehicles
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
