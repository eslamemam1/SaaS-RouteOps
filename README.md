# RouteOps

Multi-tenant operations app for staff transportation companies.

## Layout

- `apps/routeops` is the only Angular application.
- `apps/routeops-e2e` is the Playwright project.
- `libs/organizations` signs users in and creates companies.
- `libs/customers` keeps each organization's customers.
- `libs/vehicles` keeps each organization's vehicles.
- `libs/drivers` keeps each organization's drivers.
- `libs/routes` keeps each organization's routes: the customer, vehicle, driver, trip times, working days, and trip price.
- `libs/operations` keeps each day's trips as they happened: swapped vehicles or drivers, cancellations, holidays, and priced extra trips.
- `libs/reports` counts the trips done each month and their revenue per client company, vehicle, and driver, and lists the days nobody opened.
- `libs/shared/supabase` holds the single Supabase client and the signed-in route guard.
- `libs/shared/i18n` holds the Arabic and English language switch.
- `libs/shared/money` holds the supported currencies and converts amounts to and from minor units.
- Tag feature libraries `scope:<feature>` and `type:feature`.
- `supabase/migrations` is the database source of truth. Local Supabase needs Docker.
- `supabase/tests/database` holds pgTAP tests for tenant isolation, daily operations, vehicle ownership, the trip report, and trip prices. They run against the local database only.

## Tasks

```sh
npx nx serve routeops
npx nx test routeops
npx nx lint routeops
npx nx build routeops
npx nx run-many -t lint test build
```

Database tests, with Docker running:

```sh
npx supabase db start
npx supabase test db
npx supabase stop
```
