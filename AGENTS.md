# Transport SaaS

## Product

This is a multi-tenant SaaS platform for small and medium staff transportation companies.

The product is expected to cover organizations, customers, vehicles, drivers, routes, shifts, daily operations, expenses, revenue and payments, and reports.

Workflows and validation for those areas are not specified yet. Do not invent roles, a permission matrix, or a money representation.

## Stack

The initial stack is Angular, TypeScript, Nx, Supabase, PostgreSQL, Vercel, and Cloudflare.

A later version may move the API to NestJS and host PostgreSQL independently. Add Redis, background workers, or object storage only when a feature needs them.

## Workspace

The Angular application is `apps/routeops`, tagged `type:app`. Browser checks are `apps/routeops-e2e`, tagged `type:e2e`. `libs/organizations` is tagged `scope:organizations` and `type:feature`. `libs/customers` is tagged `scope:customers` and `type:feature`. `libs/vehicles` is tagged `scope:vehicles` and `type:feature`. `libs/drivers` is tagged `scope:drivers` and `type:feature`. `libs/shared/supabase` is tagged `scope:shared` and `type:infrastructure`; it holds the one browser Supabase client and the signed-in route guard, and only a feature's `infrastructure` folder and route file may import it. `libs/shared/i18n` is tagged `scope:shared` and `type:ui`; it holds the current language, the language switch, and `injectText`. Add another `libs/<feature>/` only when that feature is implemented, and tag it `scope:<feature>` and `type:feature`. `@nx/enforce-module-boundaries` allows the app to depend on `type:feature` and `scope:shared`. A feature depends only on `scope:shared`.

Domain and application code stay independent of Supabase and of the hosting providers. The only port to introduce now is a repository for data access.

## Assumptions

- The tenant boundary is an organization. A user may belong to more than one organization through a membership. The active organization is one of those memberships.
- Until an application backend exists, PostgreSQL row level security enforces that boundary.
- Role names and permissions are not decided.
- How money is stored and rounded is not decided. Do not choose a column type or a money library yet.
- The Nx workspace will have one Angular application under `apps/` and libraries under `libs/`. Do not add a NestJS application in the initial setup.
- The site operator provisions each company. There is no public self-signup. The operator creates the organization and one email-and-password login, and that login is a membership of that organization. Creating those credentials happens on a server-side path, because the service-role key must stay out of the Angular build.
- The operator is the person who provisions tenants. That is not an in-company permission role. Do not invent roles inside a customer organization.
- The interface is in Arabic and English, for Egypt and other Arab countries. Arabic is the default and is written right to left; English is written left to right. A button in the header switches language without a reload, and the browser remembers the choice. `libs/shared/i18n` holds the current language and `injectText`. Each feature keeps its own `ui/<feature>-text.ts` with an `ar` and an `en` entry of the same shape. Domain rules and errors return codes, never sentences; the `ui` layer turns a code into text. Server functions also return codes. Use Modern Standard Arabic for Arabic screen text and user-facing messages. Write screen text so a transport company understands it without help: plain words, a short hint under each section and unclear field, and optional fields marked "(اختياري)". In the interface, customers are "الشركات المتعاقدة" (the companies whose staff the transport company carries). Code, identifiers, and database names stay English.
- In-app payment collection is a later feature library. Until that feature starts, a company pays the operator outside the product. Do not add a payment provider, checkout, or payment columns on organization or operations tables. Transport expenses, revenue, and payments still wait on a recorded money representation.

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
