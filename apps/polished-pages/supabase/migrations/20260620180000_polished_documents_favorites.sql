alter table polished.documents add column if not exists favorite boolean not null default false;

-- list now includes the favorite flag and orders favourites first.
drop function if exists public.polished_list_documents();
create function public.polished_list_documents()
returns table(id uuid, kind text, title text, template text, preview text, favorite boolean, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.id, d.kind, d.title, d.template, d.preview, d.favorite, d.created_at
  from polished.documents d
  where d.user_id = auth.uid()
  order by d.favorite desc, d.created_at desc
  limit 300;
$$;
revoke all on function public.polished_list_documents() from public, anon;
grant execute on function public.polished_list_documents() to authenticated;

create or replace function public.polished_toggle_favorite(p_id uuid, p_fav boolean)
returns void
language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  update polished.documents set favorite = coalesce(p_fav, false), updated_at = now()
  where id = p_id and user_id = v_uid;
end; $$;
revoke all on function public.polished_toggle_favorite(uuid, boolean) from public, anon;
grant execute on function public.polished_toggle_favorite(uuid, boolean) to authenticated;
