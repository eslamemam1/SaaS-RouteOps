-- The plans the site operator sells, the discount for paying several months
-- at once, and the subscription each company is on.
--
-- A plan is priced per month in one currency and allows up to vehicle_limit
-- active vehicles. A plan without a monthly price is agreed per company, and
-- one without a limit has none. Anyone, signed in or not, reads the active
-- plans and the discounts for the public pricing page; only the operator
-- changes them.
--
-- A subscription copies the limit and the price the operator agreed, so a
-- later change to a plan never changes what a company already bought. Rows
-- are never updated: a subscription recorded by mistake is deleted and
-- recorded again. Like subscription_payments, the table has no "only active
-- organizations" policy, so the operator still sees a stopped company's
-- subscriptions, and a company never reads it.
--
-- The limit in force is the one of the latest subscription that has started
-- by the organization's today, even after it ended, so letting a
-- subscription run out never lifts the limit. A company with no subscription
-- has no limit. Lowering a limit keeps the vehicles already active; it only
-- stops adding or reactivating one.

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  currency text not null,
  name_ar text not null,
  name_en text not null,
  vehicle_limit integer,
  monthly_price bigint,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint subscription_plans_currency_known
    check (currency in ('EGP', 'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD')),
  constraint subscription_plans_name_ar_length
    check (char_length(btrim(name_ar)) between 1 and 60),
  constraint subscription_plans_name_en_length
    check (char_length(btrim(name_en)) between 1 and 60),
  constraint subscription_plans_vehicle_limit_positive
    check (vehicle_limit is null or vehicle_limit > 0),
  constraint subscription_plans_price_positive
    check (monthly_price is null or monthly_price > 0)
);

create index subscription_plans_currency_idx
  on public.subscription_plans (currency, vehicle_limit);

create table public.subscription_periods (
  months smallint primary key,
  discount_percent smallint not null default 0,
  constraint subscription_periods_months_known check (months in (1, 3, 6, 12)),
  constraint subscription_periods_discount_range
    check (discount_percent between 0 and 90),
  constraint subscription_periods_one_month_full_price
    check (months <> 1 or discount_percent = 0)
);

insert into public.subscription_periods (months, discount_percent) values
  (1, 0),
  (3, 10),
  (6, 15),
  (12, 20);

create table public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  plan_id uuid not null references public.subscription_plans (id),
  months smallint not null references public.subscription_periods (months),
  starts_on date not null,
  ends_on date not null,
  vehicle_limit integer,
  price bigint not null,
  note text,
  recorded_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint organization_subscriptions_vehicle_limit_positive
    check (vehicle_limit is null or vehicle_limit > 0),
  constraint organization_subscriptions_price_positive check (price > 0),
  constraint organization_subscriptions_note_length
    check (note is null or char_length(note) <= 500)
);

create index organization_subscriptions_organization_idx
  on public.organization_subscriptions (organization_id, starts_on desc);
create index organization_subscriptions_plan_idx
  on public.organization_subscriptions (plan_id);

-- A subscription ends the day before the same date months later, such as
-- 2026-01-15 for three months ending 2026-04-14. The plan must be priced in
-- the company's own currency.
create function public.prepare_organization_subscription()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.subscription_plans as plan
    join public.organizations as organization
      on organization.id = new.organization_id
    where plan.id = new.plan_id
      and plan.currency = organization.currency
  ) then
    raise exception 'plan_currency' using errcode = 'P0001';
  end if;

  new.ends_on := (new.starts_on + make_interval(months => new.months))::date - 1;
  return new;
end;
$$;

revoke all on function public.prepare_organization_subscription() from public, anon, authenticated;

create trigger organization_subscriptions_prepare
before insert on public.organization_subscriptions
for each row
execute function public.prepare_organization_subscription();

revoke all on table public.subscription_plans from public, anon, authenticated;
revoke all on table public.subscription_periods from public, anon, authenticated;
revoke all on table public.organization_subscriptions from public, anon, authenticated;
grant select on table public.subscription_plans to anon, authenticated;
grant insert, update on table public.subscription_plans to authenticated;
grant select on table public.subscription_periods to anon, authenticated;
grant update (discount_percent) on table public.subscription_periods to authenticated;
grant select, insert, delete on table public.organization_subscriptions to authenticated;
grant all on table public.subscription_plans to service_role;
grant all on table public.subscription_periods to service_role;
grant all on table public.organization_subscriptions to service_role;

alter table public.subscription_plans enable row level security;
alter table public.subscription_periods enable row level security;
alter table public.organization_subscriptions enable row level security;

create policy "everyone reads active plans"
on public.subscription_plans
for select
to anon, authenticated
using (
  is_active
  or exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
);

create policy "operators add plans"
on public.subscription_plans
for insert
to authenticated
with check (
  exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
);

create policy "operators change plans"
on public.subscription_plans
for update
to authenticated
using (
  exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
);

create policy "everyone reads period discounts"
on public.subscription_periods
for select
to anon, authenticated
using (true);

create policy "operators change period discounts"
on public.subscription_periods
for update
to authenticated
using (
  exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
);

create policy "operators read subscriptions"
on public.organization_subscriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
);

create policy "operators record subscriptions"
on public.organization_subscriptions
for insert
to authenticated
with check (
  recorded_by = (select auth.uid())
  and exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
);

create policy "operators delete subscriptions"
on public.organization_subscriptions
for delete
to authenticated
using (
  exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
);

-- Stops a company from adding or reactivating a vehicle beyond the limit in
-- force. It runs with its owner's rights because a company cannot read its
-- subscriptions. The organization row is locked so that two vehicles added at
-- the same moment cannot both pass. The detail is the limit, for the app.
create function public.check_vehicle_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_active integer;
begin
  select subscription.vehicle_limit
  into v_limit
  from public.organization_subscriptions as subscription
  where subscription.organization_id = new.organization_id
    and subscription.starts_on <= public.organization_today(new.organization_id)
  order by subscription.starts_on desc, subscription.created_at desc
  limit 1;

  if v_limit is null then
    return new;
  end if;

  perform 1
  from public.organizations as organization
  where organization.id = new.organization_id
  for update;

  select count(*)
  into v_active
  from public.vehicles as vehicle
  where vehicle.organization_id = new.organization_id
    and vehicle.is_active
    and vehicle.id <> new.id;

  if v_active >= v_limit then
    raise exception 'vehicle_limit' using errcode = 'P0001', detail = v_limit::text;
  end if;
  return new;
end;
$$;

revoke all on function public.check_vehicle_limit() from public, anon, authenticated;

create trigger vehicles_check_limit_on_insert
before insert on public.vehicles
for each row
when (new.is_active)
execute function public.check_vehicle_limit();

create trigger vehicles_check_limit_on_activate
before update of is_active on public.vehicles
for each row
when (new.is_active and not old.is_active)
execute function public.check_vehicle_limit();

-- For the operator, each company's active vehicles and its local date, so the
-- operator sees how much of a limit is used and which subscriptions ended
-- without reading anything else of the company.
create function public.operator_vehicle_usage()
returns table (
  organization_id uuid,
  active_vehicles integer,
  today date
)
language sql
stable
security definer
set search_path = ''
as $$
  select organization.id,
    (
      select count(*)::integer
      from public.vehicles as vehicle
      where vehicle.organization_id = organization.id
        and vehicle.is_active
    ),
    public.organization_today(organization.id)
  from public.organizations as organization
  where exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
$$;

revoke execute on function public.operator_vehicle_usage() from public, anon;
grant execute on function public.operator_vehicle_usage() to authenticated;
