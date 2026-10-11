-- The monthly subscriptions companies pay the site operator, recorded by hand
-- once the money arrives outside the product. Only the operator reads or
-- writes them; a company's own logins never see this table.
--
-- The amount is in the smallest unit of the company's own currency, which
-- never changes, so the currency is not repeated here. A payment recorded by
-- mistake is deleted and recorded again, so rows are never updated.
--
-- Unlike the tenant tables, this one has no "only active organizations"
-- policy: the operator must still see what a stopped company has paid.

create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  paid_on date not null,
  covers_month date not null,
  amount bigint not null,
  note text,
  recorded_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint subscription_payments_amount_positive check (amount > 0),
  constraint subscription_payments_month_start
    check (covers_month = date_trunc('month', covers_month)::date),
  constraint subscription_payments_note_length
    check (note is null or char_length(note) <= 500)
);

create index subscription_payments_month_idx
  on public.subscription_payments (covers_month);
create index subscription_payments_organization_idx
  on public.subscription_payments (organization_id, covers_month);

revoke all on table public.subscription_payments from public, anon, authenticated;
grant select, insert, delete on table public.subscription_payments to authenticated;
grant select, insert, update, delete on table public.subscription_payments to service_role;

alter table public.subscription_payments enable row level security;

create policy "operators read subscription payments"
on public.subscription_payments
for select
to authenticated
using (
  exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
);

create policy "operators record subscription payments"
on public.subscription_payments
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

create policy "operators delete subscription payments"
on public.subscription_payments
for delete
to authenticated
using (
  exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
);
