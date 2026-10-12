-- A member may add the trips of chosen routes to past days, such as routes
-- recorded today for trips that ran since the first of the month. A past day
-- opened on its own gets only the routes that existed on it, so each day is
-- opened first and then gets the chosen routes' trips on the weekdays each
-- route runs, at the route's current driver, vehicle, and price. Trips the day
-- already has stay as they are.
create function public.add_route_trips(
  p_organization_id uuid,
  p_route_ids uuid[],
  p_from date,
  p_to date
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_today date := public.organization_today(p_organization_id);
  v_day date;
  v_count integer;
  v_added integer := 0;
begin
  if coalesce(cardinality(p_route_ids), 0) = 0 then
    raise exception 'no_routes' using errcode = 'P0001';
  end if;
  if p_from is null or p_to is null or p_from > p_to or p_to >= v_today then
    raise exception 'past_days' using errcode = 'P0001';
  end if;
  if p_to - p_from >= 93 then
    raise exception 'too_many_days' using errcode = 'P0001';
  end if;

  for v_day in
    select day::date from generate_series(p_from, p_to, interval '1 day') as day
  loop
    perform public.prepare_daily_trips(p_organization_id, v_day);

    insert into public.daily_trips (
      organization_id, route_id, service_date, direction, departure_time,
      customer_id, vehicle_id, driver_id, planned_driver_id, trip_price
    )
    select route.organization_id, route.id, v_day, planned.direction,
      planned.departure_time, route.customer_id, route.vehicle_id, route.driver_id,
      route.driver_id,
      public.route_trip_share(route.trip_price, route.outbound_time, route.return_time, planned.direction)
    from public.routes as route
    cross join lateral (
      values ('outbound', route.outbound_time), ('return', route.return_time)
    ) as planned (direction, departure_time)
    where route.organization_id = p_organization_id
      and route.id = any (p_route_ids)
      and planned.departure_time is not null
      and extract(dow from v_day)::smallint = any (route.operating_days)
    on conflict (route_id, service_date, direction) where not is_extra do nothing;

    get diagnostics v_count = row_count;
    v_added := v_added + v_count;
  end loop;

  return v_added;
end;
$$;

revoke execute on function public.add_route_trips(uuid, uuid[], date, date) from public, anon;
grant execute on function public.add_route_trips(uuid, uuid[], date, date) to authenticated;
