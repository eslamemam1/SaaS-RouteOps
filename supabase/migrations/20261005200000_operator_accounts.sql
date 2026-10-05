-- The site operator lists every company account: the company, its currency,
-- when it was created, and its logins with their last sign-in. Only that
-- list: the operator still cannot read a company's customers, routes, or
-- trips.
-- Login emails live in auth.users, which clients cannot read, so the function
-- runs with its owner's rights and returns nothing to a caller who is not an
-- operator.

create function public.operator_accounts()
returns table (
  organization_id uuid,
  organization_name text,
  currency text,
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
