-- Guest data remains on-device. Only a non-anonymous signed-in member may
-- access cloud-stored bean label photos.
drop policy if exists "Users can read their bean label photos" on public.bean_label_photos;
drop policy if exists "Users can add their bean label photos" on public.bean_label_photos;
drop policy if exists "Users can remove their bean label photos" on public.bean_label_photos;

create policy "Members can read their bean label photos"
on public.bean_label_photos for select to authenticated
using (
  (select auth.uid()) = owner_id
  and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false
);

create policy "Members can add their bean label photos"
on public.bean_label_photos for insert to authenticated
with check (
  (select auth.uid()) = owner_id
  and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false
);

create policy "Members can remove their bean label photos"
on public.bean_label_photos for delete to authenticated
using (
  (select auth.uid()) = owner_id
  and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false
);

drop policy if exists "Users can read their bean label objects" on storage.objects;
drop policy if exists "Users can add their bean label objects" on storage.objects;
drop policy if exists "Users can update their bean label objects" on storage.objects;
drop policy if exists "Users can remove their bean label objects" on storage.objects;

create policy "Members can read their bean label objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'bean-labels'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false
);

create policy "Members can add their bean label objects"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'bean-labels'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false
);

create policy "Members can remove their bean label objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'bean-labels'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false
);
