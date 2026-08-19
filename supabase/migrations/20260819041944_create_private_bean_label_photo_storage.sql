create table public.bean_label_photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  local_bean_id text,
  object_path text not null unique,
  source text not null check (source in ('camera', 'gallery')),
  created_at timestamptz not null default now()
);

alter table public.bean_label_photos enable row level security;

grant usage on schema public to authenticated;
grant select, insert, delete on public.bean_label_photos to authenticated;

create policy "Users can read their bean label photos"
on public.bean_label_photos for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "Users can register their bean label photos"
on public.bean_label_photos for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Users can remove their bean label photos"
on public.bean_label_photos for delete to authenticated
using ((select auth.uid()) = owner_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bean-labels',
  'bean-labels',
  false,
  7340032,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "Users can read their bean label objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'bean-labels'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can upload their bean label objects"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'bean-labels'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can update their bean label objects"
on storage.objects for update to authenticated
using (
  bucket_id = 'bean-labels'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'bean-labels'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can remove their bean label objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'bean-labels'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
