-- Extend polished_get_shared so the public /shared/:token page can render a
-- proper marketplace listing (title hero, price, category, provenance, reach)
-- instead of a bare document viewer. Additive, backward-compatible: existing
-- callers keep the original keys; new keys are surfaced only when present.
-- Still gated on shared = true; org provenance comes from the documents.org_id
-- join, author_verified from creator_profiles (same source as polished_catalog).
create or replace function public.polished_get_shared(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'polished'
as $function$
declare v jsonb;
begin
  select jsonb_build_object(
    'kind', d.kind,
    'title', d.title,
    'template', d.template,
    'payload', d.payload,
    'author_name', d.author_name,
    'author_verified', coalesce((select bool_or(pr.verified) from polished.creator_profiles pr where pr.display_name = d.author_name), false),
    'license', d.license,
    'listed', d.listed,
    'category', d.category,
    'price_cents', d.price_cents,
    'view_count', d.view_count,
    'download_count', d.download_count,
    'edition_language', d.edition_language,
    'created_at', d.created_at,
    'org_slug', o.slug,
    'org_name', o.name,
    'org_verified', o.verified
  )
  into v
  from polished.documents d
  left join polished.organizations o on o.id = d.org_id
  where d.share_token = p_token and d.shared = true;
  return v;
end; $function$;
