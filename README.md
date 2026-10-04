# RouteOps

Multi-tenant operations app for staff transportation companies.

## Layout

- `apps/routeops` is the only Angular application.
- `apps/routeops-e2e` is the Playwright project.
- `libs/organizations` is the first feature library. Tag later libraries `scope:<feature>` and `type:feature`.
- `supabase/migrations` is the database source of truth. Local Supabase needs Docker.

## Tasks

```sh
npx nx serve routeops
npx nx test routeops
npx nx lint routeops
npx nx build routeops
```
