-- A driver works for one organization.
-- Members read, add, and edit their own organization's drivers.
-- There is no delete grant: a driver is marked inactive instead, so later
-- routes and daily operations keep a valid reference.

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text not null,
  phone text,
  national_id text,
  license_number text,
  license_expires_on date,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drivers_full_name_length check (char_length(btrim(full_name)) between 1 and 200),
  constraint drivers_phone_length check (char_length(phone) <= 50),
  constraint drivers_national_id_format check (national_id ~ '^[0-9A-Za-z]{1,30}$'),
  constraint drivers_license_number_length check (char_length(license_number) <= 50),
  constraint drivers_notes_length check (char_length(notes) <= 2000)
);

create index drivers_organization_id_full_name_idx
  on public.drivers (organization_id, full_name);

create unique index drivers_organization_id_national_id_key
  on public.drivers (organization_id, national_id)
  where national_id is not null;

create trigger drivers_set_updated_at
before update on public.drivers
for each row
execute function public.set_updated_at();

revoke all on table public.drivers from public, anon, authenticated;

grant select on table public.drivers to authenticated;
grant insert (organization_id, full_name, phone, national_id, license_number, license_expires_on, notes, is_active)
  on table public.drivers to authenticated;
grant update (full_name, phone, national_id, license_number, license_expires_on, notes, is_active)
  on table public.drivers to authenticated;

grant select, insert, update, delete on table public.drivers to service_role;

alter table public.drivers enable row level security;

create policy "members read drivers"
on public.drivers
for select
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members add drivers"
on public.drivers
for insert
to authenticated
with check (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members edit drivers"
on public.drivers
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
