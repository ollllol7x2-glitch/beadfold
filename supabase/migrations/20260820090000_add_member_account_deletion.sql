create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  target_user_id uuid := auth.uid();
begin
  if target_user_id is null then
    raise exception 'You must be signed in to delete your account';
  end if;

  delete from storage.objects
  where bucket_id = 'bean-labels'
    and (storage.foldername(name))[1] = target_user_id::text;

  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
