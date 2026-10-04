# RouteOps

Multi-tenant operations app for staff transportation companies.

## Layout

- `apps/routeops` is the only Angular application.
- `apps/routeops-e2e` is the Playwright project.
- `libs/organizations` signs users in and creates companies.
- `libs/customers` keeps each organization's customers.
- `libs/vehicles` keeps each organization's vehicles.
- `libs/shared/supabase` holds the single Supabase client and the signed-in route guard.
- `libs/shared/i18n` holds the Arabic and English language switch.
- Tag feature libraries `scope:<feature>` and `type:feature`.
- `supabase/migrations` is the database source of truth. Local Supabase needs Docker.

## Tasks

```sh
npx nx serve routeops
npx nx test routeops
npx nx lint routeops
npx nx build routeops
```
