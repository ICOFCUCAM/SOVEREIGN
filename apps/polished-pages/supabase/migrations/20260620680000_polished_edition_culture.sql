-- Localization: track the culture/locale of an edition, so a "French · Cameroon"
-- localized edition is distinguishable from a plain French translation.
alter table polished.documents add column if not exists edition_culture text;

drop function if exists public.polished_save_edition(uuid, text, text, text, jsonb, text);
create function public.polished_save_edition(p_parent uuid, p_language text, p_kind text, p_title text, p_payload jsonb, p_preview text, p_culture text default null)
returns uuid language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from polished.documents where id = p_parent and user_id = v_uid) then
    raise exception 'source document not found';
  end if;
  if coalesce(btrim(p_language),'') = '' then raise exception 'a language is required'; end if;
  insert into polished.documents(user_id, kind, title, payload, preview, parent_document_id, edition_language, edition_culture)
    values (v_uid, p_kind, p_title, p_payload, p_preview, p_parent, btrim(p_language), nullif(btrim(p_culture),''))
    returning id into v_id;
  return v_id;
end; $$;

drop function if exists public.polished_list_editions(uuid);
create function public.polished_list_editions(p_parent uuid)
returns table(id uuid, title text, edition_language text, edition_culture text, is_source boolean, listed boolean, shared boolean, share_token uuid, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.id, d.title, d.edition_language, d.edition_culture, (d.id = p_parent) as is_source,
         d.listed, d.shared, d.share_token, d.created_at
  from polished.documents d
  where d.user_id = auth.uid() and (d.id = p_parent or d.parent_document_id = p_parent)
  order by (d.id = p_parent) desc, d.created_at;
$$;

revoke all on function public.polished_save_edition(uuid, text, text, text, jsonb, text, text) from public, anon;
revoke all on function public.polished_list_editions(uuid) from public, anon;
grant execute on function public.polished_save_edition(uuid, text, text, text, jsonb, text, text) to authenticated;
grant execute on function public.polished_list_editions(uuid) to authenticated;
