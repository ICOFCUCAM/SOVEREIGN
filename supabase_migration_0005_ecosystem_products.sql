-- SOVEREIGN migration 0005 — ecosystem products
-- Applied to Supabase project qvjdivcdefuprnenedje.
--
-- Catalog of deployable institutional systems showcased on the homepage
-- ("Infrastructure already in motion"). Each is ship-ready on acquisition.
-- source_project_ref links to the real Supabase project where one is known;
-- Veritas* details are placeholders pending the user's exact definitions
-- (their source projects were paused and could not be introspected).

CREATE TABLE public.ecosystem_products (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  tagline text NOT NULL,
  description text,
  capabilities jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'deployable',
  accent text DEFAULT '#00D9FF',
  source_project_ref text,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 100,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ecosystem_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ecosystem" ON public.ecosystem_products FOR SELECT USING (true);
CREATE POLICY "Anyone manage ecosystem" ON public.ecosystem_products USING (true) WITH CHECK (true);

-- Seed: Veritas OS / Banking / Operations (featured), Mobile Pay, FlyttGo, ACT,
-- CivicOS, EduPro, Deployment Engine, Marketplace Infrastructure.
-- (Full INSERT applied via the apply_migration call; see git history / DB.)
