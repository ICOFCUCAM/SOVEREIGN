-- Shared content visibility. For the signed-in creator's own documents, expose
-- which organization each one belongs to and which repositories it sits in, so
-- the Library can always show "Owned by / Collection / Published". Scoped to
-- auth.uid()'s own rows.
create or replace function public.polished_doc_orgs()
returns table(document_id uuid, org_id uuid, org_slug text, org_name text, org_type text, listed boolean, collections text[])
language sql security definer set search_path to 'public','polished' as $$
  select d.id, o.id, o.slug, o.name, o.type, d.listed,
    coalesce(array_agg(distinct c.name) filter (where c.name is not null), '{}')
  from polished.documents d
  join polished.organizations o on o.id = d.org_id
  left join polished.organization_collection_items i on i.document_id = d.id
  left join polished.organization_collections c on c.id = i.collection_id and c.org_id = o.id
  where d.user_id = auth.uid() and d.org_id is not null
  group by d.id, o.id, o.slug, o.name, o.type, d.listed;
$$;
grant execute on function public.polished_doc_orgs() to authenticated;
