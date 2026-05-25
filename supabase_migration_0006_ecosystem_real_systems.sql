-- SOVEREIGN migration 0006 — ground ecosystem in real live systems
-- Applied to Supabase project qvjdivcdefuprnenedje.
--
-- Adds url + metrics columns and updates the ecosystem catalog to match the
-- real, deployed systems (with live URLs + their own published stats):
--   VeritasOS (veritasos.vercel.app) — knowledge & intelligence OS
--   Veritas Financial Sovereign Stack — sovereign banking OS
--   ELECPRO (elecpro-xi.vercel.app) — sovereign electoral infrastructure (new)
--   CivicOS (gov-pied-seven.vercel.app) — government OS
--   FlyttGo (flyttgo-qo46.vercel.app) — transport & moving
-- Systems with a live url render as "Live" and link out; others remain
-- "Deployable on acquisition". Full UPDATE/INSERT in git history / DB.

ALTER TABLE public.ecosystem_products ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE public.ecosystem_products ADD COLUMN IF NOT EXISTS metrics jsonb DEFAULT '[]'::jsonb;
