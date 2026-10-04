-- Organizations are the tenant boundary. A company login is a membership.
-- The site operator creates both through the provision-company function,
-- which uses the service role. Authenticated clients can only read.

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_length check (char_length(btrim(name)) between 1 and 200)
);

create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

create table public.organization_memberships (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_memberships_user_id_idx
  on public.organization_memberships (user_id);

create trigger organization_memberships_set_updated_at
before update on public.organization_memberships
for each row
execute function public.set_updated_at();

create table public.platform_operators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

revoke all on table public.organizations from public, anon, authenticated;
revoke all on table public.organization_memberships from public, anon, authenticated;
revoke all on table public.platform_operators from public, anon, authenticated;

grant select on table public.organizations to authenticated;
grant select on table public.organization_memberships to authenticated;
grant select on table public.platform_operators to authenticated;

grant select, insert, update, delete on table public.organizations to service_role;
grant select, insert, update, delete on table public.organization_memberships to service_role;
grant select, insert, update, delete on table public.platform_operators to service_role;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.platform_operators enable row level security;

create policy "members read their organizations"
on public.organizations
for select
to authenticated
using (
  id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "users read their memberships"
on public.organization_memberships
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "operators read their own row"
on public.platform_operators
for select
to authenticated
using (user_id = (select auth.uid()));
