-- Members may delete a customer that no route and no trip still names. The
-- database raises in_use with the route names when any remain, so the app can
-- show them.
create function public.check_customer_can_delete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_routes text;
begin
  select string_agg(route.name, E'\n' order by route.name)
  into v_routes
  from public.routes as route
  where route.organization_id = old.organization_id
    and route.customer_id = old.id;

  if v_routes is not null then
    raise exception 'in_use' using errcode = 'P0001', detail = v_routes;
  end if;

  if exists (
    select 1
    from public.daily_trips as trip
    where trip.organization_id = old.organization_id
      and trip.customer_id = old.id
  ) then
    raise exception 'in_use' using errcode = 'P0001';
  end if;

  return old;
end;
$$;

revoke all on function public.check_customer_can_delete() from public, anon, authenticated;

create trigger customers_check_can_delete
before delete on public.customers
for each row
execute function public.check_customer_can_delete();

grant delete on table public.customers to authenticated;

create policy "members remove customers"
on public.customers
for delete
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);
