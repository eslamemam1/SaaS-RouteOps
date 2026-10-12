-- Offers the operator runs to win companies: a percentage off chosen plans
-- and periods, or a free trial of chosen plans for a number of days, each
-- between two days, the last one optional.
--
-- An offer without a code is public: anyone reads it while it is active, and
-- the pricing and home pages show it in its dates. An offer with a code never
-- reaches a visitor; a company tells the operator the code and the operator
-- applies it. Only the operator adds or changes offers. Offers are never
-- deleted, because subscriptions name them; the operator stops one instead.
--
-- The operator chooses the offer when recording a subscription. A percentage
-- comes off after the period's discount, and the subscription still keeps
-- the price the operator agreed. A trial is a subscription of trial_days days
-- with no months and a price of zero, and a company gets one only before any
-- other subscription. A correction that keeps the offer, plan, months, and
-- start keeps the offer's terms as they were recorded.

create table public.subscription_offers (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  name_ar text not null,
  name_en text not null,
  code text,
  percent_off smallint,
  trial_days smallint,
  plan_ids uuid[] not null,
  months smallint[] not null default '{}',
  starts_on date not null,
  ends_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint subscription_offers_kind_known check (kind in ('percent', 'trial')),
  constraint subscription_offers_name_ar_length
    check (char_length(btrim(name_ar)) between 1 and 60),
  constraint subscription_offers_name_en_length
    check (char_length(btrim(name_en)) between 1 and 60),
  constraint subscription_offers_code_format
    check (code is null or code ~ '^[A-Z0-9-]{3,20}$'),
  constraint subscription_offers_code_unique unique (code),
  constraint subscription_offers_plans_chosen check (cardinality(plan_ids) > 0),
  constraint subscription_offers_dates check (ends_on is null or ends_on >= starts_on),
  constraint subscription_offers_terms check (
    (
      kind = 'percent'
      and percent_off between 1 and 90
      and trial_days is null
      and cardinality(months) > 0
      and months <@ array[1, 3, 6, 12]::smallint[]
    )
    or (
      kind = 'trial'
      and trial_days between 1 and 90
      and percent_off is null
      and cardinality(months) = 0
    )
  )
);

-- Every plan an offer names must exist; the lists are kept without repeats.
create function public.prepare_subscription_offer()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.plan_ids := array(select distinct unnest(new.plan_ids));
  new.months := array(select distinct unnest(new.months) order by 1);
  if (
    select count(*)
    from public.subscription_plans as plan
    where plan.id = any(new.plan_ids)
  ) <> cardinality(new.plan_ids) then
    raise exception 'offer_plans' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.prepare_subscription_offer() from public, anon, authenticated;

create trigger subscription_offers_prepare
before insert or update on public.subscription_offers
for each row
execute function public.prepare_subscription_offer();

revoke all on table public.subscription_offers from public, anon, authenticated;
grant select on table public.subscription_offers to anon, authenticated;
grant insert, update on table public.subscription_offers to authenticated;
grant all on table public.subscription_offers to service_role;

alter table public.subscription_offers enable row level security;

create policy "everyone reads public offers"
on public.subscription_offers
for select
to anon, authenticated
using (is_active and code is null);

create policy "operators read every offer"
on public.subscription_offers
for select
to authenticated
using (
  exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
);

create policy "operators add offers"
on public.subscription_offers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
);

create policy "operators change offers"
on public.subscription_offers
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

alter table public.organization_subscriptions
  add column offer_id uuid references public.subscription_offers (id),
  add column trial_days smallint,
  alter column months drop not null,
  drop constraint organization_subscriptions_price_positive,
  add constraint organization_subscriptions_paid_or_trial check (
    (trial_days is null and months is not null and price > 0)
    or (trial_days between 1 and 90 and months is null and price = 0)
  );

create index organization_subscriptions_offer_idx
  on public.organization_subscriptions (offer_id);

grant update (offer_id) on table public.organization_subscriptions to authenticated;

-- The plan must be priced in the company's currency, and an offer must name
-- the plan and, for a percentage, the months. A trial takes its days from the
-- offer, has no months and no price, and ends after those days; any other
-- subscription ends the day before the same date months later.
create or replace function public.prepare_organization_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer record;
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

  if new.offer_id is null then
    new.trial_days := null;
  elsif tg_op = 'UPDATE'
    and new.offer_id = old.offer_id
    and new.plan_id = old.plan_id
    and new.months is not distinct from old.months
    and new.starts_on = old.starts_on then
    new.trial_days := old.trial_days;
    if old.trial_days is not null then
      new.months := null;
      new.price := 0;
    end if;
  else
    select offer.kind, offer.trial_days, offer.plan_ids, offer.months
    into v_offer
    from public.subscription_offers as offer
    where offer.id = new.offer_id;

    if not found or not (new.plan_id = any(v_offer.plan_ids)) then
      raise exception 'offer_mismatch' using errcode = 'P0001';
    end if;

    if v_offer.kind = 'trial' then
      if exists (
        select 1
        from public.organization_subscriptions as subscription
        where subscription.organization_id = new.organization_id
          and subscription.id <> new.id
          and (
            subscription.trial_days is not null
            or subscription.starts_on <= new.starts_on
          )
      ) then
        raise exception 'trial_used' using errcode = 'P0001';
      end if;
      new.trial_days := v_offer.trial_days;
      new.months := null;
      new.price := 0;
    else
      if new.months is null or not (new.months = any(v_offer.months)) then
        raise exception 'offer_mismatch' using errcode = 'P0001';
      end if;
      new.trial_days := null;
    end if;
  end if;

  if new.trial_days is null then
    if new.months is null then
      raise exception 'offer_mismatch' using errcode = 'P0001';
    end if;
    new.ends_on := (new.starts_on + make_interval(months => new.months))::date - 1;
  else
    new.ends_on := new.starts_on + new.trial_days - 1;
  end if;
  return new;
end;
$$;

revoke all on function public.prepare_organization_subscription() from public, anon, authenticated;
