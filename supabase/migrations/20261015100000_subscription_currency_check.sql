-- The operator is not a member of the companies it sells to, so row level
-- security hid their organization row from the check and every subscription
-- was refused as priced in another currency. The check now reads the company's
-- currency as the table owner; only an operator may insert a subscription.
create or replace function public.prepare_organization_subscription()
returns trigger
language plpgsql
security definer
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
