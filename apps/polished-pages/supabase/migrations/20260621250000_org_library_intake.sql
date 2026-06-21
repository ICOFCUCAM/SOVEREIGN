-- Library → Organization intake. The simplest path from personal creation to
-- organizational ownership: move a document into an org, or copy it as an
-- org-owned draft, optionally filing it into a repository. Permission-checked
-- server-side (must own the document AND be able to edit the organization).
-- "Move" reuses polished_org_set_document (already audited).

-- Copy a personal document into an organization as a fresh, unlisted draft.
-- Publish-state and share tokens are intentionally not copied; the org decides
-- what to list. The original stays in the creator's library untouched.
create or replace function public.polished_org_copy_document(p_doc uuid, p_org uuid)
returns uuid language plpgsql security definer set search_path to 'public','polished' as $$
declare v_new uuid; v_title text;
begin
  if (select user_id from polished.documents where id = p_doc) <> auth.uid() then raise exception 'Not your document'; end if;
  if not polished.org_can_edit(p_org) then raise exception 'Not allowed in this organization'; end if;
  insert into polished.documents
    (user_id, kind, title, template, preview, payload, category, author_name, license, tags,
     org_id, edition_language, edition_culture, listed, shared, share_token, favorite, is_template, featured, price_cents)
  select user_id, kind, title, template, preview, payload, category, author_name, license, tags,
     p_org, edition_language, edition_culture, false, false, null, false, false, false, 0
  from polished.documents where id = p_doc
  returning id, title into v_new, v_title;
  perform polished.org_log(p_org, 'content.copied', v_title);
  return v_new;
end; $$;

-- Add an org-owned document to one of the organization's repositories.
create or replace function public.polished_org_collection_add(p_collection uuid, p_doc uuid)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
declare v_org uuid;
begin
  select org_id into v_org from polished.organization_collections where id = p_collection;
  if v_org is null then raise exception 'Collection not found'; end if;
  if not polished.org_can_edit(v_org) then raise exception 'Not allowed'; end if;
  if (select org_id from polished.documents where id = p_doc) is distinct from v_org then
    raise exception 'Move the document into this organization first';
  end if;
  insert into polished.organization_collection_items(collection_id, document_id)
    values (p_collection, p_doc) on conflict do nothing;
  perform polished.org_log(v_org, 'collection.item_added', (select title from polished.documents where id = p_doc));
end; $$;

grant execute on function public.polished_org_copy_document(uuid,uuid) to authenticated;
grant execute on function public.polished_org_collection_add(uuid,uuid) to authenticated;
