create table if not exists polished.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  title       text not null default 'Untitled collection',
  description text,
  public      boolean not null default false,
  share_token uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists collections_token_idx on polished.collections(share_token) where share_token is not null;
alter table polished.collections enable row level security;

create table if not exists polished.collection_items (
  collection_id uuid not null references polished.collections(id) on delete cascade,
  document_id   uuid not null references polished.documents(id) on delete cascade,
  added_at      timestamptz not null default now(),
  primary key (collection_id, document_id)
);
alter table polished.collection_items enable row level security;

create or replace function public.polished_create_collection(p_title text, p_description text)
returns uuid language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  insert into polished.collections(user_id, title, description)
  values (v_uid, coalesce(nullif(btrim(p_title), ''), 'Untitled collection'), nullif(btrim(p_description), ''))
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.polished_list_collections()
returns table(id uuid, title text, description text, public boolean, share_token uuid, item_count bigint, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select c.id, c.title, c.description, c.public, c.share_token,
         (select count(*) from polished.collection_items ci where ci.collection_id = c.id) as item_count,
         c.created_at
  from polished.collections c where c.user_id = auth.uid()
  order by c.created_at desc;
$$;

create or replace function public.polished_delete_collection(p_id uuid)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from polished.collections where id = p_id and user_id = auth.uid();
end; $$;

create or replace function public.polished_set_collection_public(p_id uuid, p_public boolean)
returns text language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_token uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_public then
    update polished.collections set public = true, share_token = coalesce(share_token, gen_random_uuid()), updated_at = now()
      where id = p_id and user_id = v_uid;
  else
    update polished.collections set public = false, updated_at = now() where id = p_id and user_id = v_uid;
  end if;
  select share_token into v_token from polished.collections where id = p_id and user_id = v_uid;
  if not p_public then return null; end if;
  return v_token::text;
end; $$;

create or replace function public.polished_collection_set_item(p_collection_id uuid, p_document_id uuid, p_add boolean)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from polished.collections where id = p_collection_id and user_id = v_uid) then raise exception 'not found'; end if;
  if not exists (select 1 from polished.documents where id = p_document_id and user_id = v_uid) then raise exception 'not found'; end if;
  if p_add then
    insert into polished.collection_items(collection_id, document_id) values (p_collection_id, p_document_id) on conflict do nothing;
  else
    delete from polished.collection_items where collection_id = p_collection_id and document_id = p_document_id;
  end if;
end; $$;

create or replace function public.polished_collections_for_document(p_document_id uuid)
returns table(collection_id uuid)
language sql security definer set search_path to 'public','polished' as $$
  select ci.collection_id from polished.collection_items ci
  join polished.collections c on c.id = ci.collection_id
  where ci.document_id = p_document_id and c.user_id = auth.uid();
$$;

create or replace function public.polished_get_collection(p_token uuid)
returns jsonb language plpgsql security definer set search_path to 'public','polished' as $$
declare v jsonb;
begin
  select jsonb_build_object(
    'title', c.title, 'description', c.description,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('token', d.share_token, 'kind', d.kind, 'title', d.title,
                       'category', d.category, 'price_cents', d.price_cents, 'preview', d.preview, 'author_name', d.author_name)
             order by ci.added_at desc)
      from polished.collection_items ci join polished.documents d on d.id = ci.document_id
      where ci.collection_id = c.id and d.shared = true and d.share_token is not null
    ), '[]'::jsonb))
  into v from polished.collections c where c.share_token = p_token and c.public = true;
  return v;
end; $$;

revoke all on function public.polished_create_collection(text, text) from public, anon;
revoke all on function public.polished_list_collections() from public, anon;
revoke all on function public.polished_delete_collection(uuid) from public, anon;
revoke all on function public.polished_set_collection_public(uuid, boolean) from public, anon;
revoke all on function public.polished_collection_set_item(uuid, uuid, boolean) from public, anon;
revoke all on function public.polished_collections_for_document(uuid) from public, anon;
grant execute on function public.polished_create_collection(text, text) to authenticated;
grant execute on function public.polished_list_collections() to authenticated;
grant execute on function public.polished_delete_collection(uuid) to authenticated;
grant execute on function public.polished_set_collection_public(uuid, boolean) to authenticated;
grant execute on function public.polished_collection_set_item(uuid, uuid, boolean) to authenticated;
grant execute on function public.polished_collections_for_document(uuid) to authenticated;
revoke all on function public.polished_get_collection(uuid) from public;
grant execute on function public.polished_get_collection(uuid) to anon, authenticated;
