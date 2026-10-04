-- The same route name, such as "Nasr City", may serve several customers with
-- different vehicles, drivers, and times. Within one customer it must be
-- unique, so the two routes can be told apart.

create unique index routes_organization_id_customer_id_name_key
  on public.routes (organization_id, customer_id, name);

-- The unique index above also serves lookups by customer.
drop index public.routes_organization_id_customer_id_idx;
