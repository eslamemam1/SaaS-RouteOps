-- A visitor cannot read platform_operators, and Postgres may evaluate both
-- sides of an "or", so one policy that also checked for an operator refused
-- every plan to the public pricing page. Visitors and members read the plans
-- on offer, and the operator reads the hidden ones through its own policy.
drop policy "everyone reads active plans" on public.subscription_plans;

create policy "everyone reads active plans"
on public.subscription_plans
for select
to anon, authenticated
using (is_active);

create policy "operators read every plan"
on public.subscription_plans
for select
to authenticated
using (
  exists (
    select 1
    from public.platform_operators as platform_operator
    where platform_operator.user_id = (select auth.uid())
  )
);
