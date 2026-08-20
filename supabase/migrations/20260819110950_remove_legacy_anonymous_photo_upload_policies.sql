-- These permissive policies predate the member-only boundary. Keeping them
-- would bypass the non-anonymous checks because RLS permissive policies use OR.
drop policy if exists "Users can register their bean label photos" on public.bean_label_photos;
drop policy if exists "Users can upload their bean label objects" on storage.objects;
