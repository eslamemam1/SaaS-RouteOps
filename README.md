# RouteOps

Multi-tenant operations app for staff transportation companies.

## Layout

- `apps/routeops` is the only Angular application.
- `apps/routeops-e2e` is the Playwright project.
- `libs/site` holds the public home page (`/`) and contact page (`/contact`). Edit the phone, WhatsApp, and email in `libs/site/src/domain/contact-details.ts`.
- `libs/organizations` signs users in, shows the dashboard at `/dashboard`, and creates companies.
- `libs/customers` keeps each organization's customers.
- `libs/vehicles` keeps each organization's vehicles and how the owner of a rented or contractor vehicle is paid.
- `libs/drivers` keeps each organization's drivers.
- `libs/routes` keeps each organization's routes: the customer, vehicle, driver, trip times, working days, and trip price.
- `libs/operations` keeps each day's trips as they happened: swapped vehicles or drivers, cancellations, holidays, and priced extra trips.
- `libs/expenses` records what each organization spends and suggests each driver's monthly pay and each rented or contractor vehicle's pay from their terms and done trips.
- `libs/reports` counts the trips done each month and their revenue per client company, route, vehicle, and driver, subtracts the month's expenses to show net profit, each vehicle's profit, and each route's driver, vehicle, and company shares, and lists the days nobody opened.
- `libs/shared/supabase` holds the single Supabase client, the signed-in route guard, and the guard that sends a signed-in visitor from a public page to the dashboard.
- `libs/shared/i18n` holds the current language and `injectText`.
- `libs/shared/ui` is the design system: tokens from the Figma file, base styles, and the shared field, button, tag, alert, page states, form drawer, language switch, and public site layout. Run `npm run lint:styles` to check that styles use the tokens.
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
