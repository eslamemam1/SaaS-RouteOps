# RouteOps

Multi-tenant operations app for staff transportation companies.

## Layout

- `apps/routeops` is the only Angular application.
- `apps/routeops-e2e` is the Playwright project.
- `libs/site` holds the public home page (`/`) and contact page (`/contact`). Edit the phone, WhatsApp, and email in `libs/site/src/domain/contact-details.ts`.
- `libs/organizations` signs users in, shows the dashboard at `/dashboard` (today's trips, the month's figures, and what still needs recording), and, for the site operator, lists and creates companies, stops and resumes their accounts, sets a new password for a company login, and records the subscriptions companies pay.
- `libs/customers` keeps each organization's customers.
- `libs/vehicles` keeps each organization's vehicles and how the owner of a rented or contractor vehicle is paid. Each vehicle has a page at `/vehicles/:vehicleId` with a month's trips, done trips, revenue, expenses by category, profit, and the rent still due.
- `libs/drivers` keeps each organization's drivers, with an optional photo that the browser shrinks to a small square before it is stored in the private `driver-photos` bucket. Each driver has a page at `/drivers/:driverId` with a month's trips, done trips, extra trips, absences, revenue, and the pay still due.
- `libs/routes` keeps each organization's routes: the customer, vehicle, driver, trip times, working days, and trip price.
- `libs/operations` keeps each day's trips as they happened: swapped vehicles or drivers, cancellations, holidays, and priced extra trips.
- `libs/expenses` records what each organization spends and suggests each driver's monthly pay and each rented or contractor vehicle's pay from their terms and done trips.
- `libs/reports` counts the trips done each month and their revenue per client company, route, vehicle, and driver, subtracts the month's expenses to show net profit, each vehicle's profit, and each route's driver, vehicle, and company shares, and lists the days nobody opened.
- `libs/notifications` is the bell in the top bar: it reads, without storing anything, licenses that expired or expire within 30 days, unopened days, today's trip conflicts, trips still waiting to be recorded, the past month's unrecorded pay, and done trips with no price, each linking to the page that fixes it.
- `libs/shared/supabase` holds the single Supabase client, the signed-in route guard, the guard that sends a signed-in visitor from a public page to the dashboard, and `allRows`, which reads a list page by page past the 1000-row limit of the API.
- `libs/shared/i18n` holds the current language, `injectText`, `formatDay` for showing a date, `formatDayWithWeekday` for a date with its weekday, `formatWeekdayAndDay` for a weekday and day of the month, `formatMonth` for a month and year, and `formatTime` for a time on a 12-hour clock.
- `libs/shared/ui` is the design system: tokens from the Figma file, base styles, and the shared field, button, tag, alert, page states with a retry button, form drawer, language switch, avatar, table or cards view switch for lists, the pager under every long list, public site layout, the dark public hero that the home, contact, sign-in, and sign-out pages share, and `ShellOrganization`, which remembers the last organization so the sidebar keeps its sections. Run `npm run lint:styles` to check that styles use the tokens.
- `libs/shared/money` holds the supported currencies, converts amounts to and from minor units, and gives the currency's short label.
- `libs/shared/pay` holds the pay rule that expenses, reports, and the dashboard share: what a driver or vehicle earned in a month and what is still not recorded.
- Tag feature libraries `scope:<feature>` and `type:feature`.
- `supabase/migrations` is the database source of truth. Local Supabase needs Docker.
- `supabase/functions` holds the server functions that need the service-role key: `provision-company` creates a company and its login, and `set-company-password` gives a company login a new password. Deploy one with `npx supabase functions deploy <name>`.
- `supabase/tests/database` holds pgTAP tests for tenant isolation, daily operations, vehicle ownership, the trip report, a driver's or vehicle's trip log (`trip_log.test.sql`), trip prices, the operator's company list, subscription payments, and the rules that keep a month's figures right (`month_accuracy.test.sql`). They run against the local database only.

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
