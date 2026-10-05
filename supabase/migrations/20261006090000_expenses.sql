-- Expenses: what a transport company spends, such as fuel, maintenance, driver
-- salaries, the rent of rented vehicles, and what contractors are paid.
-- An expense may name the vehicle and the driver it was spent on, so the
-- monthly report can show the profit of each vehicle.
-- Amounts are whole numbers of the currency's smallest unit, like trip prices.
-- A driver may carry a fixed monthly salary and an amount per done trip. The
-- expenses screen suggests each driver's pay for a month from them, but pay
-- counts as an expense only once a member records it, so it is never counted
-- twice.

alter table public.drivers
  add column monthly_salary bigint,
  add column trip_pay bigint,
  add constraint drivers_monthly_salary_positive check (monthly_salary >= 0),
  add constraint drivers_trip_pay_positive check (trip_pay >= 0);

grant insert (monthly_salary, trip_pay) on table public.drivers to authenticated;
grant update (monthly_salary, trip_pay) on table public.drivers to authenticated;

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  spent_on date not null,
  category text not null,
  amount bigint not null,
  vehicle_id uuid,
  driver_id uuid,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_category_known check (
    category in (
      'fuel', 'maintenance', 'salaries', 'rent', 'contractors',
      'licenses', 'tolls', 'office', 'other'
    )
  ),
  constraint expenses_amount_positive check (amount > 0),
  constraint expenses_description_length check (char_length(description) <= 500),
  constraint expenses_other_described check (
    category <> 'other' or char_length(btrim(coalesce(description, ''))) > 0
  ),
  constraint expenses_vehicle_same_organization
    foreign key (organization_id, vehicle_id)
    references public.vehicles (organization_id, id),
  constraint expenses_driver_same_organization
    foreign key (organization_id, driver_id)
    references public.drivers (organization_id, id)
);

create index expenses_organization_id_spent_on_idx
  on public.expenses (organization_id, spent_on);

create trigger expenses_set_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();

revoke all on table public.expenses from public, anon, authenticated;

grant select, delete on table public.expenses to authenticated;
grant insert (organization_id, spent_on, category, amount, vehicle_id, driver_id, description)
  on table public.expenses to authenticated;
grant update (spent_on, category, amount, vehicle_id, driver_id, description)
  on table public.expenses to authenticated;

grant select, insert, update, delete on table public.expenses to service_role;

alter table public.expenses enable row level security;

create policy "members read expenses"
on public.expenses
for select
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members add expenses"
on public.expenses
for insert
to authenticated
with check (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members edit expenses"
on public.expenses
for update
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
)
with check (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "members remove expenses"
on public.expenses
for delete
to authenticated
using (
  organization_id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid())
  )
);

create policy "only active organizations"
on public.expenses
as restrictive
for all
to authenticated
using (organization_id in (select id from public.organizations where is_active))
with check (organization_id in (select id from public.organizations where is_active));

-- Expense totals between two days, per category and vehicle. vehicle_id is
-- null for expenses that name no vehicle, such as office costs.
create function public.expense_totals(
  p_organization_id uuid,
  p_from date,
  p_to date
)
returns table (
  category text,
  vehicle_id uuid,
  total bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select expense.category,
    expense.vehicle_id,
    sum(expense.amount)::bigint
  from public.expenses as expense
  where expense.organization_id = p_organization_id
    and expense.spent_on between p_from and p_to
  group by expense.category, expense.vehicle_id
$$;

revoke execute on function public.expense_totals(uuid, date, date) from public, anon;
grant execute on function public.expense_totals(uuid, date, date) to authenticated;

-- For each driver with a salary or a trip amount: the done trips between two
-- days, counted by trip_report under the same done rule, the driver's pay
-- terms, and the salary already recorded for the driver in those days.
-- A driver who stopped working is listed only if the period still has trips
-- or salary for them.
create function public.driver_pay(
  p_organization_id uuid,
  p_from date,
  p_to date,
  p_today date
)
returns table (
  driver_id uuid,
  done_trips integer,
  monthly_salary bigint,
  trip_pay bigint,
  recorded bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select driver.id,
    coalesce(trips.done, 0)::integer,
    driver.monthly_salary,
    driver.trip_pay,
    coalesce(paid.total, 0)::bigint
  from public.drivers as driver
  left join (
    select report.driver_id, sum(report.done_trips) as done
    from public.trip_report(p_organization_id, p_from, p_to, p_today) as report
    group by report.driver_id
  ) as trips on trips.driver_id = driver.id
  left join (
    select expense.driver_id, sum(expense.amount) as total
    from public.expenses as expense
    where expense.organization_id = p_organization_id
      and expense.category = 'salaries'
      and expense.spent_on between p_from and p_to
    group by expense.driver_id
  ) as paid on paid.driver_id = driver.id
  where driver.organization_id = p_organization_id
    and (driver.monthly_salary is not null or driver.trip_pay is not null)
    and (driver.is_active or trips.done > 0 or paid.total > 0)
$$;

revoke execute on function public.driver_pay(uuid, date, date, date) from public, anon;
grant execute on function public.driver_pay(uuid, date, date, date) to authenticated;
