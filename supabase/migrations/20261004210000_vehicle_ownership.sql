-- A vehicle is owned by the company, rented from an owner or an office,
-- or brought by a contractor who works with the company.
-- A vehicle the company does not own records who its owner is.
-- How rent or contractor pay is stored waits on the money representation.

alter table public.vehicles
  add column ownership text not null default 'owned',
  add column owner_name text,
  add column owner_phone text,
  add constraint vehicles_ownership_known check (ownership in ('owned', 'rented', 'contractor')),
  add constraint vehicles_owner_name_length check (char_length(btrim(owner_name)) between 1 and 200),
  add constraint vehicles_owner_phone_length check (char_length(owner_phone) <= 50),
  add constraint vehicles_owner_matches_ownership check (
    case ownership
      when 'owned' then owner_name is null and owner_phone is null
      else owner_name is not null
    end
  );

grant insert (ownership, owner_name, owner_phone) on table public.vehicles to authenticated;
grant update (ownership, owner_name, owner_phone) on table public.vehicles to authenticated;
