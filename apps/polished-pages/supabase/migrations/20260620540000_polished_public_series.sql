-- Public series pages: a creator can publish a series so anyone can browse its
-- books (a shareable series storefront). Only the series' already-shared books
-- appear publicly.
alter table polished.series add column if not exists share_token uuid;
alter table polished.series add column if not exists listed boolean not null default false;

create or replace function public.polished_set_series_public(p_id uuid, p_public boolean)
returns text language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_token uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_public then
    update polished.series set listed = true, share_token = coalesce(share_token, gen_random_uuid())
      where id = p_id and user_id = v_uid;
  else
    update polished.series set listed = false where id = p_id and user_id = v_uid;
  end if;
  select share_token into v_token from polished.series where id = p_id and user_id = v_uid;
  return v_token::text;
end; $$;

drop function if exists public.polished_list_series();
create function public.polished_list_series()
returns table(id uuid, title text, premise text, setting text, educational_objective text, language text, culture text, book_count bigint, listed boolean, share_token uuid, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select s.id, s.title, s.premise, s.setting, s.educational_objective, s.language, s.culture,
    (select count(*) from polished.documents d where d.series_id = s.id and d.user_id = s.user_id) as book_count,
    s.listed, s.share_token, s.created_at
  from polished.series s where s.user_id = auth.uid()
  order by s.created_at desc limit 200;
$$;
revoke all on function public.polished_list_series() from public, anon;
grant execute on function public.polished_list_series() to authenticated;

create or replace function public.polished_get_public_series(p_token uuid)
returns jsonb language sql security definer set search_path to 'public','polished' as $$
  select case when s.id is null then null else jsonb_build_object(
    'title', s.title, 'premise', s.premise, 'setting', s.setting,
    'objective', s.educational_objective, 'language', s.language, 'culture', s.culture,
    'author', (select pr.display_name from polished.creator_profiles pr where pr.user_id = s.user_id),
    'books', coalesce((
      select jsonb_agg(jsonb_build_object('token', d.share_token, 'title', d.title, 'preview', d.preview, 'series_index', d.series_index)
        order by coalesce(d.series_index, 9999), d.created_at)
      from polished.documents d
      where d.series_id = s.id and d.user_id = s.user_id and d.shared = true and d.share_token is not null), '[]'::jsonb)
  ) end
  from polished.series s where s.share_token = p_token and s.listed = true;
$$;
revoke all on function public.polished_get_public_series(uuid) from public;
grant execute on function public.polished_get_public_series(uuid) to anon, authenticated;

revoke all on function public.polished_set_series_public(uuid, boolean) from public, anon;
grant execute on function public.polished_set_series_public(uuid, boolean) to authenticated;
