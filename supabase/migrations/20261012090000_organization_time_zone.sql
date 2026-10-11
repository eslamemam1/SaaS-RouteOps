-- Each organization works in its own time zone, chosen by the operator when
-- the company is provisioned; Cairo is the default. "Today" for a company is
-- its local date, never the server's UTC date, so a day does not end at 2 or
-- 3 in the morning for an Egyptian company.

alter table public.organizations
  add column time_zone text not null default 'Africa/Cairo',
  -- Keep in sync with timeZones in libs/organizations and the provision-company
  -- function.
  add constraint organizations_time_zone_known check (
    time_zone in (
      'Africa/Cairo',
      'Asia/Riyadh',
      'Asia/Dubai',
      'Asia/Qatar',
      'Asia/Kuwait',
      'Asia/Bahrain',
      'Asia/Muscat',
      'Asia/Amman'
    )
  );

-- The organization's local date now. Runs with the caller's rights, so a
-- caller who is not a member gets Cairo's date and nothing about the
-- organization.
create function public.organization_today(p_organization_id uuid)
returns date
language sql
stable
security invoker
set search_path = ''
as $$
  select (now() at time zone coalesce(
    (
      select organization.time_zone
      from public.organizations as organization
      where organization.id = p_organization_id
    ),
    'Africa/Cairo'
  ))::date
$$;

revoke execute on function public.organization_today(uuid) from public, anon;
grant execute on function public.organization_today(uuid) to authenticated;

-- The local date of a moment for an organization, such as the day a route was
-- created.
create function public.organization_date(p_organization_id uuid, p_moment timestamptz)
returns date
language sql
stable
security invoker
set search_path = ''
as $$
  select (p_moment at time zone coalesce(
    (
      select organization.time_zone
      from public.organizations as organization
      where organization.id = p_organization_id
    ),
    'Africa/Cairo'
  ))::date
$$;

revoke execute on function public.organization_date(uuid, timestamptz) from public, anon;
grant execute on function public.organization_date(uuid, timestamptz) to authenticated;

-- Same as before, with the organization's own date.
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
  and service_date >= public.organization_today(organization_id)
);

-- Same as before, with a route counting from its creation day in the
-- organization's time zone.
create or replace function public.unopened_days(
  p_organization_id uuid,
  p_from date,
  p_to date
)
returns setof date
language sql
stable
security invoker
set search_path = ''
as $$
  select day::date
  from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') as day
  where exists (
      select 1
      from public.routes as route
      where route.organization_id = p_organization_id
        and route.is_active
        and public.organization_date(p_organization_id, route.created_at) <= day::date
        and extract(dow from day)::smallint = any (route.operating_days)
        and (route.outbound_time is not null or route.return_time is not null)
    )
    and not exists (
      select 1
      from public.daily_trips as trip
      where trip.organization_id = p_organization_id
        and trip.service_date = day::date
        and not trip.is_extra
    )
  order by 1
$$;
