-- A customer, driver, or vehicle that an active route uses cannot be marked
-- inactive; the route must first get another one or stop. Otherwise its trips
-- would keep being prepared and counted for a customer no longer served or a
-- driver no longer working. Likewise an active route may only use a customer,
-- driver, and vehicle that are active.
-- The error message is a code for the app; the detail lists the routes, one
-- per line.

create function public.check_unused_by_active_routes()
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
  where route.organization_id = new.organization_id
    and route.is_active
    and case tg_table_name
      when 'customers' then route.customer_id = new.id
      when 'drivers' then route.driver_id = new.id
      else route.vehicle_id = new.id
    end;

  if v_routes is not null then
    raise exception 'active_routes' using errcode = 'P0001', detail = v_routes;
  end if;
  return new;
end;
$$;

revoke all on function public.check_unused_by_active_routes() from public, anon, authenticated;

create trigger customers_check_unused_by_active_routes
before update of is_active on public.customers
for each row
when (old.is_active and not new.is_active)
execute function public.check_unused_by_active_routes();

create trigger drivers_check_unused_by_active_routes
before update of is_active on public.drivers
for each row
when (old.is_active and not new.is_active)
execute function public.check_unused_by_active_routes();

create trigger vehicles_check_unused_by_active_routes
before update of is_active on public.vehicles
for each row
when (old.is_active and not new.is_active)
execute function public.check_unused_by_active_routes();

create function public.check_route_uses_active()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
      select 1 from public.customers as customer
      where customer.id = new.customer_id and customer.is_active
    )
    or not exists (
      select 1 from public.drivers as driver
      where driver.id = new.driver_id and driver.is_active
    )
    or (
      new.vehicle_id is not null
      and not exists (
        select 1 from public.vehicles as vehicle
        where vehicle.id = new.vehicle_id and vehicle.is_active
      )
    )
  then
    raise exception 'inactive_choice' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.check_route_uses_active() from public, anon, authenticated;

create trigger routes_check_uses_active
before insert or update of customer_id, driver_id, vehicle_id, is_active on public.routes
for each row
when (new.is_active)
execute function public.check_route_uses_active();
