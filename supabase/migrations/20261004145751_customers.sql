-- A customer is a company whose staff the organization transports.
-- Members read, add, and edit their own organization's customers.
-- There is no delete grant: a customer is marked inactive instead, so later
-- routes and shifts keep a valid reference.

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_name_length check (char_length(btrim(name)) between 1 and 200),
  constraint customers_contact_name_length check (char_length(contact_name) <= 200),
  constraint customers_phone_length check (char_length(phone) <= 50),
  constraint customers_email_length check (char_length(email) <= 320),
  constraint customers_address_length check (char_length(address) <= 500),
  constraint customers_notes_length check (char_length(notes) <= 2000)
);

create index customers_organization_id_name_idx
  on public.customers (organization_id, name);

create trigger customers_set_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

revoke all on table public.customers from public, anon, authenticated;

grant select on table public.customers to authenticated;
grant insert (organization_id, name, contact_name, phone, email, address, notes, is_active)
  on table public.customers to authenticated;
grant update (name, contact_name, phone, email, address, notes, is_active)
  on table public.customers to authenticated;

grant select, insert, update, delete on table public.customers to service_role;

alter table public.customers enable row level security;

create policy "members read customers"
on public.customers
for select
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members add customers"
on public.customers
for insert
to authenticated
with check (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members edit customers"
on public.customers
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
