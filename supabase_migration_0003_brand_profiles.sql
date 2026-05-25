-- SOVEREIGN migration 0003 — Phase 2 brand profiles
-- Applied to Supabase project qvjdivcdefuprnenedje.
--
-- Persists AI-generated brand packages (Module 2 / Branding Studio). Public
-- read + insert mirror the permissive marketplace pattern used by
-- valuation_reports, since the studio runs for anonymous visitors.

CREATE TABLE public.brand_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  domain_id uuid REFERENCES public.domains(id) ON DELETE CASCADE,
  domain_name text NOT NULL,
  overall_score integer,
  slogan text,
  brand_tone text,
  typography_direction text,
  ui_style text,
  logo_concept text,
  market_positioning text,
  elevator_pitch text,
  investor_narrative text,
  primary_color text,
  accent_color text,
  neutral_color text,
  monetization jsonb DEFAULT '[]'::jsonb,
  startup_concepts jsonb DEFAULT '[]'::jsonb,
  landing_copy jsonb DEFAULT '{}'::jsonb,
  industry_category text,
  model_used text,
  saved_by text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_brand_profiles_domain ON public.brand_profiles USING btree (domain_id);
CREATE INDEX idx_brand_profiles_name ON public.brand_profiles USING btree (domain_name);
CREATE INDEX idx_brand_profiles_created ON public.brand_profiles USING btree (created_at DESC);

ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read brand profiles" ON public.brand_profiles FOR SELECT USING (true);
CREATE POLICY "Public insert brand profiles" ON public.brand_profiles FOR INSERT WITH CHECK (true);
