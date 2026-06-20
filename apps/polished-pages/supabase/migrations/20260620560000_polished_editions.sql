-- Multi-language editions: a document can be a language edition of a source
-- document. The Edition Manager creates and tracks all language editions of a
-- book as a linked set.
alter table polished.documents add column if not exists parent_document_id uuid;
alter table polished.documents add column if not exists edition_language text;

create or replace function public.polished_save_edition(p_parent uuid, p_language text, p_kind text, p_title text, p_payload jsonb, p_preview text)
returns uuid language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from polished.documents where id = p_parent and user_id = v_uid) then
    raise exception 'source document not found';
  end if;
  if coalesce(btrim(p_language),'') = '' then raise exception 'a language is required'; end if;
  insert into polished.documents(user_id, kind, title, payload, preview, parent_document_id, edition_language)
    values (v_uid, p_kind, p_title, p_payload, p_preview, p_parent, btrim(p_language))
    returning id into v_id;
  return v_id;
end; $$;

create or replace function public.polished_list_editions(p_parent uuid)
returns table(id uuid, title text, edition_language text, is_source boolean, listed boolean, shared boolean, share_token uuid, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.id, d.title, d.edition_language, (d.id = p_parent) as is_source,
         d.listed, d.shared, d.share_token, d.created_at
  from polished.documents d
  where d.user_id = auth.uid() and (d.id = p_parent or d.parent_document_id = p_parent)
  order by (d.id = p_parent) desc, d.created_at;
$$;

revoke all on function public.polished_save_edition(uuid, text, text, text, jsonb, text) from public, anon;
revoke all on function public.polished_list_editions(uuid) from public, anon;
grant execute on function public.polished_save_edition(uuid, text, text, text, jsonb, text) to authenticated;
grant execute on function public.polished_list_editions(uuid) to authenticated;
