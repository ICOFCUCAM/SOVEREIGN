-- Allow saving audiobooks, and optionally link a saved document to a parent
-- (e.g. an audiobook under its book) so it nests in the project view.
drop function if exists public.polished_save_document(text, text, text, jsonb, text);
create function public.polished_save_document(p_kind text, p_title text, p_template text, p_payload jsonb, p_preview text, p_parent uuid default null)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'polished'
as $function$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_kind not in ('cv','cover-letter','book','tailored','cover','storybook','illustration','audiobook') then raise exception 'invalid kind'; end if;
  if p_parent is not null and not exists (select 1 from polished.documents where id = p_parent and user_id = v_uid) then
    raise exception 'parent document not found';
  end if;
  insert into polished.documents(user_id, kind, title, template, payload, preview, parent_document_id)
  values (v_uid, p_kind, coalesce(nullif(btrim(p_title), ''), 'Untitled'), p_template, p_payload, left(coalesce(p_preview, ''), 400), p_parent)
  returning id into v_id;
  return v_id;
end; $function$;
