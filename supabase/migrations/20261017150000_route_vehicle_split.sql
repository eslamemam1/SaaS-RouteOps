-- A route whose vehicle is company-owned may split its shift price: an
-- optional management margin is taken first, as a percent of the price or a
-- fixed amount per shift, and the vehicle's share then comes from what is
-- left, as a percent of it, a fixed amount per shift, or all of it.
-- What remains after both is for the driver and the company.
-- Each route trip keeps its shares like its price, so a later change of the
-- split leaves past trips alone; a trip saved without shares counts at its
-- route's split. Shares count only while the trip's vehicle is company-owned.

alter table public.routes
  add column vehicle_share_mode text not null default 'none',
  add column vehicle_share_percent numeric(5, 2),
  add column vehicle_share_amount bigint,
  add column management_mode text not null default 'none',
  add column management_percent numeric(5, 2),
  add column management_amount bigint,
  add constraint routes_vehicle_share_mode_known
    check (vehicle_share_mode in ('none', 'percent', 'amount', 'whole')),
  add constraint routes_management_mode_known
    check (management_mode in ('none', 'percent', 'amount')),
  add constraint routes_vehicle_share_value check (
    case vehicle_share_mode
      when 'percent' then vehicle_share_percent between 0 and 100
        and vehicle_share_amount is null
      when 'amount' then vehicle_share_amount >= 0
        and vehicle_share_percent is null
      else vehicle_share_percent is null and vehicle_share_amount is null
    end
  ),
  add constraint routes_management_value check (
    case management_mode
      when 'percent' then management_percent between 0 and 100
        and management_amount is null
      when 'amount' then management_amount >= 0
        and management_percent is null
      else management_percent is null and management_amount is null
    end
  ),
  add constraint routes_split_within_price check (
    trip_price is null
    or (
      coalesce(management_amount, 0) <= trip_price
      and coalesce(vehicle_share_amount, 0) + coalesce(management_amount, 0) <= trip_price
    )
  );

grant insert (
  vehicle_share_mode, vehicle_share_percent, vehicle_share_amount,
  management_mode, management_percent, management_amount
) on table public.routes to authenticated;
grant update (
  vehicle_share_mode, vehicle_share_percent, vehicle_share_amount,
  management_mode, management_percent, management_amount
) on table public.routes to authenticated;

alter table public.daily_trips
  add column vehicle_share bigint,
  add column management_share bigint,
  add constraint daily_trips_vehicle_share_positive check (vehicle_share >= 0),
  add constraint daily_trips_management_share_positive check (management_share >= 0);

grant insert (vehicle_share, management_share) on table public.daily_trips to authenticated;
grant update (vehicle_share, management_share) on table public.daily_trips to authenticated;

-- One trip's shares of its price p_amount, which is already its direction's
-- part of the shift price. Fixed amounts are per shift, so each direction of a
-- shift takes its part of them as route_trip_share gives it. Whole minor
-- units, rounded down; neither share goes past what is left of the price.
create function public.trip_split(
  p_amount bigint,
  p_outbound_time time,
  p_return_time time,
  p_direction text,
  p_vehicle_mode text,
  p_vehicle_percent numeric,
  p_vehicle_amount bigint,
  p_management_mode text,
  p_management_percent numeric,
  p_management_amount bigint
)
returns table (management_share bigint, vehicle_share bigint)
language sql
immutable
set search_path = ''
as $$
  with management as (
    select case
      when p_amount is null then null
      when p_management_mode = 'percent'
        then floor(p_amount * p_management_percent / 100)::bigint
      when p_management_mode = 'amount' then least(
        p_amount,
        public.route_trip_share(p_management_amount, p_outbound_time, p_return_time, p_direction)
      )
    end as amount
  )
  select management.amount,
    case
      when p_amount is null then null
      when p_vehicle_mode = 'percent'
        then floor((p_amount - coalesce(management.amount, 0)) * p_vehicle_percent / 100)::bigint
      when p_vehicle_mode = 'amount' then least(
        p_amount - coalesce(management.amount, 0),
        public.route_trip_share(p_vehicle_amount, p_outbound_time, p_return_time, p_direction)
      )
      when p_vehicle_mode = 'whole' then p_amount - coalesce(management.amount, 0)
    end
  from management
$$;

revoke execute on function public.trip_split(
  bigint, time, time, text, text, numeric, bigint, text, numeric, bigint
) from public, anon;
grant execute on function public.trip_split(
  bigint, time, time, text, text, numeric, bigint, text, numeric, bigint
) to authenticated;

-- A trip's shares under its route's split today. No row when the route names
-- no company-owned vehicle.
create function public.route_trip_split(
  p_route_id uuid,
  p_amount bigint,
  p_direction text
)
returns table (management_share bigint, vehicle_share bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select split.management_share, split.vehicle_share
  from public.routes as route
  join public.vehicles as vehicle
    on vehicle.id = route.vehicle_id and vehicle.ownership = 'owned'
  cross join lateral public.trip_split(
    p_amount, route.outbound_time, route.return_time, p_direction,
    route.vehicle_share_mode, route.vehicle_share_percent, route.vehicle_share_amount,
    route.management_mode, route.management_percent, route.management_amount
  ) as split
  where route.id = p_route_id
$$;

revoke execute on function public.route_trip_split(uuid, bigint, text) from public, anon;
grant execute on function public.route_trip_split(uuid, bigint, text) to authenticated;

-- A route trip takes its shares when it is added and whenever its price is
-- set again, which prepare_daily_trips does for coming trips only.
create function public.set_daily_trip_split()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.is_extra or new.route_id is null then
    return new;
  end if;
  if tg_op = 'INSERT' and (new.vehicle_share is not null or new.management_share is not null) then
    return new;
  end if;
  select split.management_share, split.vehicle_share
  into new.management_share, new.vehicle_share
  from public.route_trip_split(new.route_id, new.trip_price, new.direction) as split;
  if not found then
    new.management_share := null;
    new.vehicle_share := null;
  end if;
  return new;
end;
$$;

revoke all on function public.set_daily_trip_split() from public, anon, authenticated;

create trigger daily_trips_set_split
before insert or update of trip_price on public.daily_trips
for each row
execute function public.set_daily_trip_split();

-- A change of a route's split, price, or vehicle reaches its trips on coming
-- days already opened that are not done, as other route changes do.
create function public.refresh_route_trip_split()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.daily_trips as trip
  set (management_share, vehicle_share) = (
    select split.management_share, split.vehicle_share
    from public.route_trip_split(trip.route_id, trip.trip_price, trip.direction) as split
  )
  where trip.route_id = new.id
    and trip.organization_id = new.organization_id
    and not trip.is_extra
    and not trip.is_done
    and trip.service_date >= public.organization_today(new.organization_id);
  return new;
end;
$$;

revoke all on function public.refresh_route_trip_split() from public, anon, authenticated;

create trigger routes_refresh_trip_split
after update of
  vehicle_share_mode, vehicle_share_percent, vehicle_share_amount,
  management_mode, management_percent, management_amount, vehicle_id, trip_price
on public.routes
for each row
execute function public.refresh_route_trip_split();

-- Same as before, with vehicle_share and management_share: the done trips'
-- shares of their price while their vehicle is company-owned.
drop function public.trip_report(uuid, date, date, date);

create function public.trip_report(
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
  unpriced_trips integer,
  done_halves integer,
  extra_halves integer,
  vehicle_share bigint,
  management_share bigint
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
    coalesce(sum(price.amount), 0)::bigint,
    (count(*) filter (where price.amount is null))::integer,
    coalesce(sum(public.trip_halves(route.outbound_time, route.return_time)), 0)::integer,
    coalesce(sum(public.trip_halves(route.outbound_time, route.return_time)) filter (where trip.is_extra), 0)::integer,
    coalesce(sum(shares.vehicle_amount), 0)::bigint,
    coalesce(sum(shares.management_amount), 0)::bigint
  from public.daily_trips as trip
  left join public.routes as route on route.id = trip.route_id
  left join public.vehicles as vehicle on vehicle.id = trip.vehicle_id
  cross join lateral (
    select coalesce(
      trip.trip_price,
      public.route_trip_share(route.trip_price, route.outbound_time, route.return_time, trip.direction)
    ) as amount
  ) as price
  left join lateral public.route_trip_split(trip.route_id, price.amount, trip.direction) as fallback
    on trip.vehicle_share is null and trip.management_share is null
  cross join lateral (
    select
      case when vehicle.ownership = 'owned'
        then coalesce(trip.vehicle_share, fallback.vehicle_share) end as vehicle_amount,
      case when vehicle.ownership = 'owned'
        then coalesce(trip.management_share, fallback.management_share) end as management_amount
  ) as shares
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

revoke execute on function public.trip_report(uuid, date, date, date) from public, anon;
grant execute on function public.trip_report(uuid, date, date, date) to authenticated;

-- Same as before, with each trip's vehicle_share and management_share under
-- the same rule.
drop function public.trip_log(uuid, date, date, date, uuid, uuid);

create function public.trip_log(
  p_organization_id uuid,
  p_from date,
  p_to date,
  p_today date,
  p_driver_id uuid default null,
  p_vehicle_id uuid default null
)
returns table (
  id uuid,
  service_date date,
  departure_time time,
  direction text,
  customer_id uuid,
  route_id uuid,
  vehicle_id uuid,
  driver_id uuid,
  planned_driver_id uuid,
  is_extra boolean,
  status text,
  change_reason text,
  notes text,
  price bigint,
  halves integer,
  vehicle_share bigint,
  management_share bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select trip.id,
    trip.service_date,
    trip.departure_time,
    trip.direction,
    trip.customer_id,
    trip.route_id,
    trip.vehicle_id,
    trip.driver_id,
    trip.planned_driver_id,
    trip.is_extra,
    case
      when trip.is_cancelled then 'cancelled'
      when trip.is_done then 'done'
      when trip.service_date > p_today then 'planned'
      when public.trip_recording_on(p_organization_id, trip.service_date) = 'automatic' then 'done'
      else 'unrecorded'
    end,
    trip.change_reason,
    trip.notes,
    price.amount,
    public.trip_halves(route.outbound_time, route.return_time),
    case when vehicle.ownership = 'owned'
      then coalesce(trip.vehicle_share, fallback.vehicle_share) end,
    case when vehicle.ownership = 'owned'
      then coalesce(trip.management_share, fallback.management_share) end
  from public.daily_trips as trip
  left join public.routes as route on route.id = trip.route_id
  left join public.vehicles as vehicle on vehicle.id = trip.vehicle_id
  cross join lateral (
    select coalesce(
      trip.trip_price,
      public.route_trip_share(route.trip_price, route.outbound_time, route.return_time, trip.direction)
    ) as amount
  ) as price
  left join lateral public.route_trip_split(trip.route_id, price.amount, trip.direction) as fallback
    on trip.vehicle_share is null and trip.management_share is null
  where trip.organization_id = p_organization_id
    and trip.service_date between p_from and p_to
    and (
      p_driver_id is null
      or trip.driver_id = p_driver_id
      or trip.planned_driver_id = p_driver_id
    )
    and (p_vehicle_id is null or trip.vehicle_id = p_vehicle_id)
  order by trip.service_date, trip.departure_time, trip.direction
$$;

revoke execute on function public.trip_log(uuid, date, date, date, uuid, uuid) from public, anon;
grant execute on function public.trip_log(uuid, date, date, date, uuid, uuid) to authenticated;
