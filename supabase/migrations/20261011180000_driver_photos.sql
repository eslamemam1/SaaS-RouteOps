-- A driver may have one photo. The browser crops and shrinks it to a small
-- WebP or JPEG before uploading, and the bucket refuses anything larger or of
-- another type, so a client that skips that step cannot fill the storage.
-- A photo lives at <organization_id>/<driver_id>/<photo_id>.<webp|jpg>; a new
-- photo gets a new name and the old file is deleted, so no cached copy of the
-- old photo is shown.

alter table public.drivers
  add column photo_path text,
  add constraint drivers_photo_path_format check (
    photo_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$'
    and split_part(photo_path, '/', 1) = organization_id::text
    and split_part(photo_path, '/', 2) = id::text
  );

grant update (photo_path) on table public.drivers to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('driver-photos', 'driver-photos', false, 102400, array['image/webp', 'image/jpeg']);

-- Members of an active organization read, add, and delete the photos of their
-- own organization's drivers. There is no update policy: a photo is never
-- overwritten.
create policy "members read driver photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'driver-photos'
  and (storage.foldername(name))[1] in (
    select membership.organization_id::text
    from public.organization_memberships as membership
    join public.organizations as organization
      on organization.id = membership.organization_id
    where membership.user_id = (select auth.uid())
      and organization.is_active
  )
);

create policy "members add driver photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'driver-photos'
  and (storage.foldername(name))[1] in (
    select membership.organization_id::text
    from public.organization_memberships as membership
    join public.organizations as organization
      on organization.id = membership.organization_id
    where membership.user_id = (select auth.uid())
      and organization.is_active
  )
  and (storage.foldername(name))[2] in (
    select driver.id::text
    from public.drivers as driver
    where driver.organization_id::text = (storage.foldername(name))[1]
  )
);

create policy "members delete driver photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'driver-photos'
  and (storage.foldername(name))[1] in (
    select membership.organization_id::text
    from public.organization_memberships as membership
    join public.organizations as organization
      on organization.id = membership.organization_id
    where membership.user_id = (select auth.uid())
      and organization.is_active
  )
);
