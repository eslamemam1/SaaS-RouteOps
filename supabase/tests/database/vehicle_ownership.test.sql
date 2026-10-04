-- A vehicle is company owned, rented, or a contractor's own vehicle.
-- A rented or contractor vehicle names its owner; a company vehicle has none.
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'north@example.com');
insert into public.organizations (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'North Transport');
insert into public.organization_memberships (organization_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$insert into public.vehicles (organization_id, plate_number, vehicle_type)
    values ('10000000-0000-0000-0000-000000000001', 'OWN 1', 'bus')$$,
  'a new vehicle is company owned unless told otherwise'
);
select is(
  (select ownership from public.vehicles where plate_number = 'OWN 1'),
  'owned',
  'company ownership is the default'
);
select lives_ok(
  $$insert into public.vehicles (organization_id, plate_number, vehicle_type, ownership, owner_name, owner_phone)
    values ('10000000-0000-0000-0000-000000000001', 'RENT 1', 'microbus', 'rented', 'Nour Office', '01001234567')$$,
  'a member adds a rented vehicle with its owner'
);
select lives_ok(
  $$insert into public.vehicles (organization_id, plate_number, vehicle_type, ownership, owner_name)
    values ('10000000-0000-0000-0000-000000000001', 'CON 1', 'car', 'contractor', 'Mohamed Ali')$$,
  'a contractor vehicle needs no owner phone'
);
select throws_ok(
  $$insert into public.vehicles (organization_id, plate_number, vehicle_type, ownership)
    values ('10000000-0000-0000-0000-000000000001', 'RENT 2', 'bus', 'rented')$$,
  '23514', null,
  'a rented vehicle must name its owner'
);
select throws_ok(
  $$insert into public.vehicles (organization_id, plate_number, vehicle_type, ownership, owner_name)
    values ('10000000-0000-0000-0000-000000000001', 'RENT 3', 'bus', 'rented', '   ')$$,
  '23514', null,
  'a blank owner name does not count'
);
select throws_ok(
  $$insert into public.vehicles (organization_id, plate_number, vehicle_type, owner_name)
    values ('10000000-0000-0000-0000-000000000001', 'OWN 2', 'bus', 'Somebody')$$,
  '23514', null,
  'a company vehicle has no outside owner'
);
select throws_ok(
  $$insert into public.vehicles (organization_id, plate_number, vehicle_type, ownership, owner_name)
    values ('10000000-0000-0000-0000-000000000001', 'LEASE 1', 'bus', 'leased', 'Somebody')$$,
  '23514', null,
  'an unknown ownership is refused'
);
select throws_ok(
  $$update public.vehicles set ownership = 'rented' where plate_number = 'OWN 1'$$,
  '23514', null,
  'turning a company vehicle into a rented one needs the owner too'
);
select lives_ok(
  $$update public.vehicles set ownership = 'owned', owner_name = null, owner_phone = null
    where plate_number = 'RENT 1'$$,
  'a rented vehicle bought by the company drops its owner'
);

select * from finish();
rollback;
