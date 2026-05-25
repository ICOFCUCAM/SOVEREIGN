-- SOVEREIGN migration 0008 — ecosystem card imagery
-- Applied to Supabase project qvjdivcdefuprnenedje.
-- Adds an optional image_url so ecosystem cards can use real imagery;
-- cards fall back to cinematic gradient art when null.
ALTER TABLE public.ecosystem_products ADD COLUMN IF NOT EXISTS image_url text;
