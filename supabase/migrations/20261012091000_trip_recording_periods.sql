-- Changing how trips are recorded applies from the organization's today on.
-- Each change is kept as a period starting that day, and a trip counts under
-- the way of recording in force on its own day, so switching between
-- automatic and manual never changes a past month's figures.
-- An organization without a period records trips automatically.
-- operations_settings keeps the way of recording in force today.

create table public.trip_recording_periods (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  starts_on date not null,
  trip_recording text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, starts_on),
  constraint trip_recording_periods_trip_recording_known check (trip_recording in ('automatic', 'manual'))
);

create trigger trip_recording_periods_set_updated_at
before update on public.trip_recording_periods
for each row
execute function public.set_updated_at();

revoke all on table public.trip_recording_periods from public, anon, authenticated;

grant select on table public.trip_recording_periods to authenticated;
grant insert (organization_id, starts_on, trip_recording) on table public.trip_recording_periods to authenticated;
grant update (trip_recording) on table public.trip_recording_periods to authenticated;

grant select, insert, update, delete on table public.trip_recording_periods to service_role;

alter table public.trip_recording_periods enable row level security;

create policy "members read trip recording periods"
on public.trip_recording_periods
for select
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

-- A member starts a period today, or changes today's period; never a past one.
create policy "members add trip recording periods"
on public.trip_recording_periods
for insert
to authenticated
with check (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
  and starts_on = public.organization_today(organization_id)
);

create policy "members edit trip recording periods"
on public.trip_recording_periods
for update
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
  and starts_on = public.organization_today(organization_id)
)
with check (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
  and starts_on = public.organization_today(organization_id)
);

create policy "only active organizations"
on public.trip_recording_periods
as restrictive
for all
to authenticated
using (organization_id in (select id from public.organizations where is_active))
with check (organization_id in (select id from public.organizations where is_active));

-- The way each organization records today has applied since it was created.
insert into public.trip_recording_periods (organization_id, starts_on, trip_recording)
select settings.organization_id,
  (organization.created_at at time zone organization.time_zone)::date,
  settings.trip_recording
from public.operations_settings as settings
join public.organizations as organization on organization.id = settings.organization_id;

-- How the organization records trips on a day.
create function public.trip_recording_on(p_organization_id uuid, p_day date)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (
      select period.trip_recording
      from public.trip_recording_periods as period
      where period.organization_id = p_organization_id
        and period.starts_on <= p_day
      order by period.starts_on desc
      limit 1
    ),
    'automatic'
  )
$$;

revoke execute on function public.trip_recording_on(uuid, date) from public, anon;
grant execute on function public.trip_recording_on(uuid, date) to authenticated;

-- Same as before, and also starts a period today.
create or replace function public.set_trip_recording(p_organization_id uuid, p_trip_recording text)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.operations_settings (organization_id, trip_recording)
  values (p_organization_id, p_trip_recording)
  on conflict (organization_id) do update
  set trip_recording = excluded.trip_recording;

  insert into public.trip_recording_periods (organization_id, starts_on, trip_recording)
  values (p_organization_id, public.organization_today(p_organization_id), p_trip_recording)
  on conflict (organization_id, starts_on) do update
  set trip_recording = excluded.trip_recording;
$$;

-- Same as before, except that each trip counts under the way of recording in
-- force on its own day.
create or replace function public.trip_report(
  p_organization_id uuid,
  p_from date,
  p_to date,
  p_today date
)
returns table (
  customer_id uuid,
  route_id uuid,
  vehicle_id uuid,
  driver_id uuid,
  direction text,
  done_trips integer,
  extra_trips integer,
  revenue bigint,
  unpriced_trips integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select trip.customer_id,
    trip.route_id,
    trip.vehicle_id,
    trip.driver_id,
    trip.direction,
    count(*)::integer,
    (count(*) filter (where trip.is_extra))::integer,
    coalesce(sum(coalesce(trip.trip_price, route.trip_price)), 0)::bigint,
    (count(*) filter (where coalesce(trip.trip_price, route.trip_price) is null))::integer
  from public.daily_trips as trip
  left join public.routes as route on route.id = trip.route_id
  where trip.organization_id = p_organization_id
    and trip.service_date between p_from and p_to
    and (
      trip.is_done
      or (
        not trip.is_cancelled
        and trip.service_date <= p_today
        and public.trip_recording_on(p_organization_id, trip.service_date) = 'automatic'
      )
    )
  group by trip.customer_id, trip.route_id, trip.vehicle_id, trip.driver_id, trip.direction
$$;
