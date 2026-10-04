-- Every route and every daily trip names its driver.
-- Choose a driver for every route before applying this migration. A trip saved
-- without a driver takes the driver of its route.

do $$
begin
  if exists (select 1 from public.routes where driver_id is null) then
    raise exception 'Choose a driver for every route, then apply this migration again.';
  end if;
end;
$$;

update public.daily_trips as trip
set driver_id = route.driver_id
from public.routes as route
where route.id = trip.route_id
  and trip.driver_id is null;

do $$
begin
  if exists (select 1 from public.daily_trips where driver_id is null) then
    raise exception 'Choose a driver for every extra trip without one, then apply this migration again.';
  end if;
end;
$$;

alter table public.routes alter column driver_id set not null;
alter table public.daily_trips alter column driver_id set not null;
