-- The site operator stops a company's account when the company has not paid
-- its monthly subscription, and turns it back on once it pays. The payment
-- itself happens outside the product; only the account's state is recorded.
-- A stopped company keeps all its data. Its logins can still sign in and see
-- that the account is stopped, but they can neither read nor change any of the
-- company's records until the operator turns the account back on.

alter table public.organizations
  add column is_active boolean not null default true;

-- A restrictive policy is combined with every member policy of its table, so
-- the reports and the daily trip functions, which run with the caller's
-- rights, stop as well.
create policy "only active organizations"
on public.customers
as restrictive
for all
to authenticated
using (organization_id in (select id from public.organizations where is_active))
with check (organization_id in (select id from public.organizations where is_active));

create policy "only active organizations"
on public.vehicles
as restrictive
for all
to authenticated
using (organization_id in (select id from public.organizations where is_active))
with check (organization_id in (select id from public.organizations where is_active));

create policy "only active organizations"
on public.drivers
as restrictive
for all
to authenticated
using (organization_id in (select id from public.organizations where is_active))
with check (organization_id in (select id from public.organizations where is_active));

create policy "only active organizations"
on public.routes
as restrictive
for all
to authenticated
using (organization_id in (select id from public.organizations where is_active))
with check (organization_id in (select id from public.organizations where is_active));

create policy "only active organizations"
on public.daily_trips
as restrictive
for all
to authenticated
using (organization_id in (select id from public.organizations where is_active))
with check (organization_id in (select id from public.organizations where is_active));

create policy "only active organizations"
on public.operations_settings
as restrictive
for all
to authenticated
using (organization_id in (select id from public.organizations where is_active))
with check (organization_id in (select id from public.organizations where is_active));

-- Clients cannot write organizations, so this runs with its owner's rights
-- after checking that the caller is an operator.
create function public.set_organization_active(
  p_organization_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  ) then
    raise exception 'only the site operator can change an account'
      using errcode = '42501';
  end if;

  update public.organizations
  set is_active = p_is_active
  where id = p_organization_id;

  if not found then
    raise exception 'organization not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.set_organization_active(uuid, boolean) from public, anon;
grant execute on function public.set_organization_active(uuid, boolean) to authenticated;

-- Same list as before, plus whether each account is active.
drop function public.operator_accounts();

create function public.operator_accounts()
returns table (
  organization_id uuid,
  organization_name text,
  currency text,
  is_active boolean,
  created_at timestamptz,
  login_emails text[],
  last_sign_in_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select organization.id,
    organization.name,
    organization.currency,
    organization.is_active,
    organization.created_at,
    coalesce(
      array_agg(login.email::text order by login.email)
        filter (where login.email is not null),
      '{}'
    ),
    max(login.last_sign_in_at)
  from public.organizations as organization
  left join public.organization_memberships as membership
    on membership.organization_id = organization.id
  left join auth.users as login on login.id = membership.user_id
  where exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
  group by organization.id
  order by organization.created_at desc, organization.name
$$;

revoke execute on function public.operator_accounts() from public, anon;
grant execute on function public.operator_accounts() to authenticated;
