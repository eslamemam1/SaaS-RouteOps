-- Revenue: each route has a price per trip, outbound or return, paid by its
-- customer.
-- Amounts are whole numbers of the currency's smallest unit, such as piasters
-- for the Egyptian pound. Each organization works in one currency, chosen by
-- the operator when the organization is created.
-- A daily trip keeps the price it had on its day, so changing a route's price
-- does not change past trips. A trip saved before it had a price is counted at
-- its route's price.

alter table public.organizations
  add column currency text not null default 'EGP',
  add constraint organizations_currency_known
    check (currency in ('EGP', 'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD'));

alter table public.routes
  add column trip_price bigint,
  add constraint routes_trip_price_positive check (trip_price >= 0);

grant insert (trip_price) on table public.routes to authenticated;
grant update (trip_price) on table public.routes to authenticated;

alter table public.daily_trips
  add column trip_price bigint,
  add constraint daily_trips_trip_price_positive check (trip_price >= 0);

-- Members set the price of an extra trip; prepare_daily_trips, which runs with
-- the caller's rights, copies route prices onto planned trips.
grant insert (trip_price) on table public.daily_trips to authenticated;
grant update (trip_price) on table public.daily_trips to authenticated;

-- Same as before, and also copies the route's price. The price of a coming
-- planned trip follows its route even after a member changed the trip's
-- vehicle or driver, because the price belongs to the route.
create or replace function public.prepare_daily_trips(p_organization_id uuid, p_service_date date)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_service_date >= current_date then
    delete from public.daily_trips as trip
    where trip.organization_id = p_organization_id
      and trip.service_date = p_service_date
      and not trip.is_extra
      and trip.change_reason is null
      and not trip.is_cancelled
      and not trip.is_done
      and not exists (
        select 1
        from public.routes as route
        where route.id = trip.route_id
          and route.is_active
          and extract(dow from p_service_date)::smallint = any (route.operating_days)
          and (case trip.direction when 'outbound' then route.outbound_time else route.return_time end) is not null
      );

    update public.daily_trips as trip
    set departure_time = case trip.direction when 'outbound' then route.outbound_time else route.return_time end,
        customer_id = route.customer_id,
        vehicle_id = route.vehicle_id,
        driver_id = route.driver_id
    from public.routes as route
    where route.id = trip.route_id
      and trip.organization_id = p_organization_id
      and trip.service_date = p_service_date
      and not trip.is_extra
      and trip.change_reason is null
      and not trip.is_cancelled
      and not trip.is_done
      and (trip.departure_time, trip.customer_id, trip.vehicle_id, trip.driver_id)
        is distinct from (
          case trip.direction when 'outbound' then route.outbound_time else route.return_time end,
          route.customer_id,
          route.vehicle_id,
          route.driver_id
        );

    update public.daily_trips as trip
    set trip_price = route.trip_price
    from public.routes as route
    where route.id = trip.route_id
      and trip.organization_id = p_organization_id
      and trip.service_date = p_service_date
      and not trip.is_extra
      and not trip.is_done
      and trip.trip_price is distinct from route.trip_price;
  end if;

  insert into public.daily_trips (
    organization_id, route_id, service_date, direction, departure_time,
    customer_id, vehicle_id, driver_id, trip_price
  )
  select route.organization_id, route.id, p_service_date, planned.direction,
    planned.departure_time, route.customer_id, route.vehicle_id, route.driver_id,
    route.trip_price
  from public.routes as route
  cross join lateral (
    values ('outbound', route.outbound_time), ('return', route.return_time)
  ) as planned (direction, departure_time)
  where route.organization_id = p_organization_id
    and route.is_active
    and planned.departure_time is not null
    and extract(dow from p_service_date)::smallint = any (route.operating_days)
  on conflict (route_id, service_date, direction) where not is_extra do nothing;
end;
$$;

-- Same counts as before, plus the revenue of the done trips and how many of
-- them have no price at all.
drop function public.trip_report(uuid, date, date, date);

create function public.trip_report(
  p_organization_id uuid,
  p_from date,
  p_to date,
  p_today date
)
returns table (
  customer_id uuid,
  vehicle_id uuid,
  driver_id uuid,
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
    trip.vehicle_id,
    trip.driver_id,
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
        and coalesce(
          (
            select settings.trip_recording
            from public.operations_settings as settings
            where settings.organization_id = p_organization_id
          ),
          'automatic'
        ) = 'automatic'
      )
    )
  group by trip.customer_id, trip.vehicle_id, trip.driver_id
$$;

revoke execute on function public.trip_report(uuid, date, date, date) from public, anon;
grant execute on function public.trip_report(uuid, date, date, date) to authenticated;
