-- Series: a shared universe for a set of books (premise, setting, educational
-- objective, language, culture). Books link to a series with an order index, so
-- the Children's Studio becomes a series-publishing system, not single books.
create table if not exists polished.series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  premise text,
  setting text,
  educational_objective text,
  language text,
  culture text,
  created_at timestamptz not null default now()
);
create index if not exists series_user_idx on polished.series(user_id, created_at desc);
alter table polished.series enable row level security;

alter table polished.documents add column if not exists series_id uuid;
alter table polished.documents add column if not exists series_index int;

create or replace function public.polished_create_series(p_title text, p_premise text default null, p_setting text default null, p_objective text default null, p_language text default null, p_culture text default null)
returns uuid language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_title),'') = '' then raise exception 'a series title is required'; end if;
  insert into polished.series(user_id, title, premise, setting, educational_objective, language, culture)
    values (v_uid, btrim(p_title), nullif(btrim(p_premise),''), nullif(btrim(p_setting),''),
            nullif(btrim(p_objective),''), nullif(btrim(p_language),''), nullif(btrim(p_culture),''))
    returning id into v_id;
  return v_id;
end; $$;

create or replace function public.polished_list_series()
returns table(id uuid, title text, premise text, setting text, educational_objective text, language text, culture text, book_count bigint, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select s.id, s.title, s.premise, s.setting, s.educational_objective, s.language, s.culture,
    (select count(*) from polished.documents d where d.series_id = s.id and d.user_id = s.user_id) as book_count,
    s.created_at
  from polished.series s where s.user_id = auth.uid()
  order by s.created_at desc limit 200;
$$;

create or replace function public.polished_get_series(p_id uuid)
returns jsonb language sql security definer set search_path to 'public','polished' as $$
  select case when s.id is null then null else jsonb_build_object(
    'id', s.id, 'title', s.title, 'premise', s.premise, 'setting', s.setting,
    'educational_objective', s.educational_objective, 'language', s.language, 'culture', s.culture,
    'books', coalesce((
      select jsonb_agg(jsonb_build_object('id', d.id, 'title', d.title, 'kind', d.kind, 'series_index', d.series_index, 'created_at', d.created_at)
        order by coalesce(d.series_index, 9999), d.created_at)
      from polished.documents d where d.series_id = s.id and d.user_id = s.user_id), '[]'::jsonb)
  ) end
  from polished.series s where s.id = p_id and s.user_id = auth.uid();
$$;

create or replace function public.polished_delete_series(p_id uuid)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  update polished.documents set series_id = null, series_index = null where series_id = p_id and user_id = auth.uid();
  delete from polished.series where id = p_id and user_id = auth.uid();
end; $$;

create or replace function public.polished_set_document_series(p_document_id uuid, p_series_id uuid, p_index int default null)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_series_id is not null and not exists (select 1 from polished.series where id = p_series_id and user_id = v_uid) then
    raise exception 'series not found';
  end if;
  update polished.documents set series_id = p_series_id, series_index = p_index, updated_at = now()
    where id = p_document_id and user_id = v_uid;
end; $$;

revoke all on function public.polished_create_series(text, text, text, text, text, text) from public, anon;
revoke all on function public.polished_list_series() from public, anon;
revoke all on function public.polished_get_series(uuid) from public, anon;
revoke all on function public.polished_delete_series(uuid) from public, anon;
revoke all on function public.polished_set_document_series(uuid, uuid, int) from public, anon;
grant execute on function public.polished_create_series(text, text, text, text, text, text) to authenticated;
grant execute on function public.polished_list_series() to authenticated;
grant execute on function public.polished_get_series(uuid) to authenticated;
grant execute on function public.polished_delete_series(uuid) to authenticated;
grant execute on function public.polished_set_document_series(uuid, uuid, int) to authenticated;
