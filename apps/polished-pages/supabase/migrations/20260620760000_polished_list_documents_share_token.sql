-- Expose share_token in polished_list_documents so the library UI
-- can render persistent copy-link strips on shared cards without an
-- extra RPC round-trip.

DROP FUNCTION IF EXISTS public.polished_list_documents();

CREATE FUNCTION public.polished_list_documents()
RETURNS TABLE (
  id uuid, kind text, title text, template text, preview text,
  favorite boolean, shared boolean, share_token uuid, listed boolean,
  category text, price_cents int, tags text[], is_template boolean,
  view_count int, download_count int, created_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public, polished
AS $$
  SELECT d.id, d.kind, d.title, d.template, d.preview, d.favorite,
         d.shared, d.share_token, d.listed, d.category, d.price_cents,
         d.tags, d.is_template, d.view_count, d.download_count, d.created_at
  FROM polished.documents d
  WHERE d.user_id = auth.uid()
  ORDER BY d.favorite DESC, d.created_at DESC
  LIMIT 300;
$$;
