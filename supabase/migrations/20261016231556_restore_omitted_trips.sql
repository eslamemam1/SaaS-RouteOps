-- A member may put back a route trip they deleted from a day by clearing its
-- omission and inserting the trip from the route again. This works for today
-- and past days, unlike add_route_trips which is only for past ranges.
create function public.restore_omitted_trip(
  p_organization_id uuid,
  p_route_id uuid,
  p_service_date date,
  p_direction text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_departure time;
  v_customer_id uuid;
  v_vehicle_id uuid;
  v_driver_id uuid;
  v_trip_price bigint;
  v_trip_id uuid;
  v_removed integer;
begin
  if p_direction is distinct from 'outbound' and p_direction is distinct from 'return' then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  select
    case p_direction when 'outbound' then route.outbound_time else route.return_time end,
    route.customer_id,
    route.vehicle_id,
    route.driver_id,
    public.route_trip_share(
      route.trip_price, route.outbound_time, route.return_time, p_direction
    )
  into v_departure, v_customer_id, v_vehicle_id, v_driver_id, v_trip_price
  from public.routes as route
  where route.id = p_route_id
    and route.organization_id = p_organization_id;

  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if v_departure is null or v_driver_id is null then
    raise exception 'no_trip' using errcode = 'P0001';
  end if;

  delete from public.daily_trip_omissions as omitted
  where omitted.organization_id = p_organization_id
    and omitted.route_id = p_route_id
    and omitted.service_date = p_service_date
    and omitted.direction = p_direction;

  get diagnostics v_removed = row_count;
  if v_removed = 0 then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  insert into public.daily_trips (
    organization_id, route_id, service_date, direction, departure_time,
    customer_id, vehicle_id, driver_id, planned_driver_id, trip_price
  )
  values (
    p_organization_id, p_route_id, p_service_date, p_direction, v_departure,
    v_customer_id, v_vehicle_id, v_driver_id, v_driver_id, v_trip_price
  )
  on conflict (route_id, service_date, direction) where not is_extra do nothing
  returning id into v_trip_id;

  if v_trip_id is null then
    select trip.id into v_trip_id
    from public.daily_trips as trip
    where trip.organization_id = p_organization_id
      and trip.route_id = p_route_id
      and trip.service_date = p_service_date
      and trip.direction = p_direction
      and not trip.is_extra;
  end if;

  return v_trip_id;
end;
$$;

revoke execute on function public.restore_omitted_trip(uuid, uuid, date, text)
  from public, anon;
grant execute on function public.restore_omitted_trip(uuid, uuid, date, text)
  to authenticated;
