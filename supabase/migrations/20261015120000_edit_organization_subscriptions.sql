-- The operator may correct a subscription recorded with a mistake instead of
-- deleting it and recording it again. The company it belongs to, who recorded
-- it, and when stay as they were. A change runs the same preparation as a new
-- subscription, so the plan must still be priced in the company's currency and
-- the end follows the start and the months.

grant update (plan_id, months, starts_on, vehicle_limit, price, note)
  on table public.organization_subscriptions to authenticated;

create policy "operators change subscriptions"
on public.organization_subscriptions
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

create trigger organization_subscriptions_prepare_on_update
before update on public.organization_subscriptions
for each row
execute function public.prepare_organization_subscription();
