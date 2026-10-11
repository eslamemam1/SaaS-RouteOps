-- A driver photo belongs to the driver's organization: its members read,
-- add, and delete it while the company is active, and nobody else can.
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'north@example.com'),
  ('b0000000-0000-0000-0000-000000000001', 'south@example.com');
insert into public.organizations (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'North Transport'),
  ('20000000-0000-0000-0000-000000000001', 'South Transport');
insert into public.organization_memberships (organization_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001');
insert into public.drivers (id, organization_id, full_name) values
  ('d1000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ahmed Ali'),
  ('d2000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Omar Hassan');

select results_eq(
  $$select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'driver-photos'$$,
  $$values (false, 102400::bigint, array['image/webp', 'image/jpeg'])$$,
  'the photo bucket is private, small, and takes only WebP or JPEG'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('driver-photos', '10000000-0000-0000-0000-000000000001/d1000000-0000-0000-0000-000000000001/e1000000-0000-0000-0000-000000000001.webp', 'a0000000-0000-0000-0000-000000000001')$$,
  'a member adds a photo of their own driver'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('driver-photos', '20000000-0000-0000-0000-000000000001/d2000000-0000-0000-0000-000000000001/e2000000-0000-0000-0000-000000000001.webp', 'a0000000-0000-0000-0000-000000000001')$$,
  '42501', null,
  'a member cannot add a photo to another company'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('driver-photos', '10000000-0000-0000-0000-000000000001/d2000000-0000-0000-0000-000000000001/e3000000-0000-0000-0000-000000000001.webp', 'a0000000-0000-0000-0000-000000000001')$$,
  '42501', null,
  'a member cannot file a photo under another company''s driver'
);
select lives_ok(
  $$update public.drivers
    set photo_path = '10000000-0000-0000-0000-000000000001/d1000000-0000-0000-0000-000000000001/e1000000-0000-0000-0000-000000000001.webp'
    where id = 'd1000000-0000-0000-0000-000000000001'$$,
  'a member links the photo to the driver'
);
select throws_ok(
  $$update public.drivers
    set photo_path = '20000000-0000-0000-0000-000000000001/d2000000-0000-0000-0000-000000000001/e1000000-0000-0000-0000-000000000001.webp'
    where id = 'd1000000-0000-0000-0000-000000000001'$$,
  '23514', null,
  'a driver cannot point at a photo outside its own folder'
);

set local request.jwt.claims = '{"sub": "b0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is_empty(
  $$select name from storage.objects where bucket_id = 'driver-photos'$$,
  'another company cannot see the photo'
);

reset role;
update public.organizations set is_active = false
where id = '10000000-0000-0000-0000-000000000001';
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is_empty(
  $$select name from storage.objects where bucket_id = 'driver-photos'$$,
  'a stopped company cannot see its photos'
);

select * from finish();
rollback;
