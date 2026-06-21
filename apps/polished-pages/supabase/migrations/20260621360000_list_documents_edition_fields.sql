-- Expose edition relationships in the library list so each book can be shown as
-- one project (source + its language editions) instead of disconnected rows.
-- Return shape changes, so drop + recreate (CREATE OR REPLACE can't alter it).
drop function if exists public.polished_list_documents();
create function public.polished_list_documents()
returns table(
  id uuid, kind text, title text, template text, preview text, favorite boolean,
  shared boolean, share_token uuid, listed boolean, category text, price_cents integer,
  tags text[], is_template boolean, view_count integer, download_count integer, created_at timestamptz,
  parent_document_id uuid, edition_language text, edition_culture text, updated_at timestamptz
)
language sql
security definer
set search_path to 'public', 'polished'
as $function$
  SELECT d.id, d.kind, d.title, d.template, d.preview, d.favorite,
         d.shared, d.share_token, d.listed, d.category, d.price_cents,
         d.tags, d.is_template, d.view_count, d.download_count, d.created_at,
         d.parent_document_id, d.edition_language, d.edition_culture, d.updated_at
  FROM polished.documents d
  WHERE d.user_id = auth.uid()
  ORDER BY d.favorite DESC, d.created_at DESC
  LIMIT 300;
$function$;
