-- Members may delete a route that no trip still names. The database raises
-- in_use when any remain, so the app can show a clear message.
create function public.check_route_can_delete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.daily_trips as trip
    where trip.organization_id = old.organization_id
      and trip.route_id = old.id
  ) then
    raise exception 'in_use' using errcode = 'P0001';
  end if;

  return old;
end;
$$;

revoke all on function public.check_route_can_delete() from public, anon, authenticated;

create trigger routes_check_can_delete
before delete on public.routes
for each row
execute function public.check_route_can_delete();

grant delete on table public.routes to authenticated;

create policy "members remove routes"
on public.routes
for delete
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);
