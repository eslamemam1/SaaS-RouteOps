# Transport SaaS

## Product

This is a multi-tenant SaaS platform for small and medium staff transportation companies.

The product is expected to cover organizations, customers, vehicles, drivers, routes, shifts, daily operations, expenses, revenue and payments, and reports.

Workflows and validation for those areas are not specified yet. Do not invent roles or a permission matrix.

## Stack

The initial stack is Angular, TypeScript, Nx, Supabase, PostgreSQL, Vercel, and Cloudflare.

A later version may move the API to NestJS and host PostgreSQL independently. Add Redis, background workers, or object storage only when a feature needs them.

## Workspace

The Angular application is `apps/routeops`, tagged `type:app`. Browser checks are `apps/routeops-e2e`, tagged `type:e2e`. `libs/site` is tagged `scope:site` and `type:feature`; it holds the public pages: the home page at `/`, which sends a signed-in visitor to `/dashboard`, and the contact page at `/contact`, which links the phone, WhatsApp, and email kept in `domain/contact-details.ts` and stores nothing. `libs/organizations` is tagged `scope:organizations` and `type:feature`; it holds the sign-in page and the signed-in dashboard at `/dashboard`. `libs/customers` is tagged `scope:customers` and `type:feature`. `libs/vehicles` is tagged `scope:vehicles` and `type:feature`; a vehicle is `owned` by the company, `rented`, or a `contractor`'s own vehicle, and a rented or contractor vehicle names its owner, with an optional phone, and may carry a `rent_type` of `monthly` with a `monthly_rent`, or `per_trip` with an `outbound_rent` and a `return_rent`; a company-owned vehicle has no rent. `libs/drivers` is tagged `scope:drivers` and `type:feature`; a driver's `pay_type` is `none`, `salary` for an employee, or `per_trip`; an employee has a `monthly_salary` and may name `salary_trips`, the outbound trips and as many return trips the salary covers each month, and then an `outbound_pay` and a `return_pay`, which may differ; a driver paid per trip has only those two amounts. `libs/routes` is tagged `scope:routes` and `type:feature`; a route links a customer, a vehicle, and a driver of the same organization, and composite foreign keys on `organization_id` enforce that in the database. A route belongs to one customer; the same route name may serve several customers but is unique within one customer. Every route and every daily trip, extra trips included, names its driver; the vehicle may still be set later. A route may carry a `trip_price`, what its customer pays for one outbound or return trip; `prepare_daily_trips` copies it onto each planned trip and keeps a coming trip in step with its route, while a past or done trip keeps its price. `libs/operations` is tagged `scope:operations` and `type:feature`; it keeps one daily trip per route, day, and direction, copied from the routes by `prepare_daily_trips`. A member may also add an extra trip to a day; it belongs to a customer and optionally one of its routes, may carry its own price, `prepare_daily_trips` never changes it, and only an extra trip may be deleted. Trips store only a departure time, so the daily screen warns, without blocking, when the same vehicle or driver has two trips that are not cancelled and leave less than an hour apart on the same day. Each organization chooses in `operations_settings` how trips are recorded: automatically, where a trip counts as done once its day comes unless it is cancelled, or manually, where a trip counts as done only after a member marks it done; a trip marked done always counts as done. A cancellation or change carries a reason, and a trip nobody changed or marked done follows its route until its day has passed. `libs/reports` is tagged `scope:reports` and `type:feature`; it shows a month's done trips per customer, vehicle, and driver, counted in the database by `trip_report` under the same done rule, with their revenue at each trip's price, or its route's price when the trip has none, and how many done trips have no price at all; it warns with `unopened_days` about working days nobody opened, because a day's trips exist only once it was opened. It also subtracts the month's expenses, totalled by `expense_totals`, to show net profit, and the vehicle view shows each vehicle's expenses and profit, with expenses that name no vehicle on their own line. The route view shows each route's revenue less a driver's share and a vehicle's share, and what remains is the company's share: an expense naming a driver is the driver's when it is a salary or names no vehicle, any other expense naming a vehicle is the vehicle's, and each driver's and vehicle's recorded expenses are split over the routes by the done trips on each; expenses no route carries are shown apart, and the view warns, through `driver_pay` and `vehicle_pay`, about pay due with nothing recorded. `libs/expenses` is tagged `scope:expenses` and `type:feature`; an expense has a day, one category of `fuel`, `maintenance`, `salaries`, `rent`, `contractors`, `licenses`, `tolls`, `office`, or `other`, an amount above zero, an optional vehicle and driver of the same organization, and a description that `other` requires. For each driver with pay terms, `driver_pay` returns the month's done outbound and return trips the driver actually drove under the `trip_report` done rule, so a substitute earns the trip, the trips of the driver's own routes cancelled or handed to another driver with the reason `driver_absent`, and the salary already recorded. The screen suggests, per direction, a per-trip driver's amount times the done trips, or an employee's salary plus the amount for each done trip beyond `salary_trips`, less the amount for each trip below it that was missed through absence, so absences first use up extra trips and no other reason costs the driver pay; without `salary_trips` the salary is fixed. The member may change that amount before recording it, and pay counts as an expense only once a member records it, so it is never counted twice. In the same way, `vehicle_pay` returns each vehicle with rent terms, its done outbound and return trips, and the `rent` or `contractors` expenses already recorded for it; the screen suggests the monthly rent or the trips times their amounts, and recording it adds a `rent` expense for a rented vehicle or a `contractors` expense for a contractor's. `libs/shared/supabase` is tagged `scope:shared` and `type:infrastructure`; it holds the one browser Supabase client, the signed-in route guard, and `redirectSignedIn` for public pages, and only a feature's `infrastructure` folder and route file may import it. `libs/shared/i18n` is tagged `scope:shared` and `type:ui`; it holds the current language and `injectText`. `libs/shared/ui` is tagged `scope:shared` and `type:ui`; it is the design system every screen uses: the `--ro-*` design tokens mirrored from the Figma file "RouteOps Design System", the base styles, and the shared field, button, tag, alert, page header, page state, form drawer, language switch, and the public layout that the public pages and the sign-in page share, so no screen repeats that markup. Only `libs/shared/ui/src/styles/tokens.css` may hold raw colors or sizes; `npm run lint:styles` rejects them anywhere else. Its components are built on Angular CDK and the icons come from `@ng-icons/lucide`; do not add a paid or license-key UI library, such as PrimeNG 21 or later. `libs/shared/money` is tagged `scope:shared` and `type:util`; it holds the supported currencies and turns typed amounts into minor units and back, because routes, operations, drivers, expenses, and reports all handle amounts. Add another `libs/<feature>/` only when that feature is implemented, and tag it `scope:<feature>` and `type:feature`. `@nx/enforce-module-boundaries` allows the app to depend on `type:feature` and `scope:shared`. A feature depends only on `scope:shared`.

Domain and application code stay independent of Supabase and of the hosting providers. The only port to introduce now is a repository for data access.

## Assumptions

- The tenant boundary is an organization. A user may belong to more than one organization through a membership. The active organization is one of those memberships.
- Until an application backend exists, PostgreSQL row level security enforces that boundary.
- Role names and permissions are not decided.
- Money is stored as a `bigint` count of the currency's minor unit, such as piasters, and amounts are typed with at most that many decimals, so nothing is rounded. Each organization works in one currency, `organizations.currency`, chosen by the operator at provisioning; Egyptian pounds are the default, and members cannot change it. Do not add a money library.
- The Nx workspace will have one Angular application under `apps/` and libraries under `libs/`. Do not add a NestJS application in the initial setup.
- The site operator provisions each company. There is no public self-signup. The operator creates the organization and one email-and-password login, and that login is a membership of that organization. Creating those credentials happens on a server-side path, because the service-role key must stay out of the Angular build.
- The operator is the person who provisions tenants. That is not an in-company permission role. Do not invent roles inside a customer organization.
- The interface is in Arabic and English, for Egypt and other Arab countries. Arabic is the default and is written right to left; English is written left to right. The app shell has a sidebar with the active organization's sections and a top bar whose button switches language without a reload, and the browser remembers the choice. `libs/shared/i18n` holds the current language and `injectText`. Each feature keeps its own `ui/<feature>-text.ts` with an `ar` and an `en` entry of the same shape. Domain rules and errors return codes, never sentences; the `ui` layer turns a code into text. Server functions also return codes. Use Modern Standard Arabic for Arabic screen text and user-facing messages. Write screen text so a transport company understands it without help: plain words, a short hint under each section and unclear field, and optional fields marked "(اختياري)". In the interface, customers are "الشركات المتعاقدة" (the companies whose staff the transport company carries). Code, identifiers, and database names stay English.
- In-app payment collection is a later feature library. Until that feature starts, a company pays the operator outside the product. The operator stops a company's account, `organizations.is_active`, when its monthly subscription is unpaid and turns it back on once it pays; a stopped company keeps its data, and a restrictive row level security policy "only active organizations" on every tenant table keeps its members from reading or changing it, so every new tenant table needs that policy too. Do not add a payment provider, checkout, or payment columns on organization or operations tables. Trip revenue is recorded from route and extra-trip prices and expenses are entered in `libs/expenses`; customer payments are not recorded yet.

## Workflow

Before a significant feature:

1. Inspect the existing architecture.
2. Identify the affected features and layers.
3. Explain the approach, including any database, security, and test impact.
4. State assumptions when a business rule is still open.
5. Implement the smallest maintainable change.
6. Run the workspace lint, type-check, and tests.
7. Report what changed and any remaining risk.

The agent writes code only. It does not commit, push, or write commit messages; the user reviews, commits, and pushes.

Add a library only when the feature needs it, and say why. Leave unrelated code alone.

## Rules

This file is the global instruction. The files in `.cursor/rules/` apply when a matching file is in context:

| Rule                        | Applies to                                                         |
| --------------------------- | ------------------------------------------------------------------ |
| `project-architecture.mdc`  | `apps/**`, `libs/**`, `nx.json`, `**/project.json`                 |
| `angular-typescript.mdc`    | `apps/**/*.ts`, `apps/**/*.html`, `libs/**/*.ts`, `libs/**/*.html` |
| `database-supabase.mdc`     | `supabase/**`, `**/*.sql`                                          |
| `security-multitenancy.mdc` | `**/*.ts`, `**/*.sql`, `supabase/**`                               |
| `testing-quality.mdc`       | `**/*.spec.ts`, `**/*e2e*/**`, `**/project.json`                   |

## Definition of done

A feature is complete when:

- TypeScript types check and lint passes.
- Tests for the business behavior in the change pass.
- Any schema change is a migration committed to Git.
- Tenant isolation for the change is enforced in the database.
- Data screens cover loading, success, empty, and error.
- No secrets are committed.
- Architecture notes are updated when the module structure changes.
