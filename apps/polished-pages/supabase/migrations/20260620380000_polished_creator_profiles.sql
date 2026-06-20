-- Creator profiles: an editable display name + bio, and a public author profile
-- (bio + aggregate reach) powering richer author pages.
create table if not exists polished.creator_profiles (
  user_id uuid primary key,
  display_name text not null,
  bio text,
  updated_at timestamptz not null default now()
);

-- The owner reads/edits their own profile.
create or replace function public.polished_get_my_profile()
returns table(display_name text, bio text)
language sql security definer set search_path to 'public','polished' as $$
  select p.display_name, p.bio from polished.creator_profiles p where p.user_id = auth.uid();
$$;

create or replace function public.polished_upsert_profile(p_display_name text, p_bio text)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_display_name), '') = '' then raise exception 'display name required'; end if;
  insert into polished.creator_profiles(user_id, display_name, bio, updated_at)
    values (auth.uid(), btrim(p_display_name), nullif(btrim(p_bio), ''), now())
  on conflict (user_id) do update set display_name = excluded.display_name, bio = excluded.bio, updated_at = now();
end; $$;

-- Public author profile: bio (if a creator with that display name exists) plus
-- aggregate reach computed from their publicly listed documents.
create or replace function public.polished_get_author_profile(p_name text)
returns jsonb language sql security definer set search_path to 'public','polished' as $$
  select jsonb_build_object(
    'display_name', p_name,
    'bio', (select pr.bio from polished.creator_profiles pr
            where pr.display_name = p_name and pr.bio is not null
            order by pr.updated_at desc limit 1),
    'works', coalesce(count(*), 0),
    'views', coalesce(sum(d.view_count), 0),
    'downloads', coalesce(sum(d.download_count), 0)
  )
  from polished.documents d
  where d.author_name = p_name and d.listed = true and d.shared = true and d.share_token is not null;
$$;

revoke all on function public.polished_get_my_profile() from public, anon;
revoke all on function public.polished_upsert_profile(text, text) from public, anon;
revoke all on function public.polished_get_author_profile(text) from public;
grant execute on function public.polished_get_my_profile() to authenticated;
grant execute on function public.polished_upsert_profile(text, text) to authenticated;
grant execute on function public.polished_get_author_profile(text) to anon, authenticated;
