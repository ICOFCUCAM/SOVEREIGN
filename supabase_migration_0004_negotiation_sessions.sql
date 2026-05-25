-- SOVEREIGN migration 0004 — Phase 2 negotiation sessions (Module 3)
-- Applied to Supabase project qvjdivcdefuprnenedje.
--
-- Persists AI broker negotiation sessions. The reserve price and acceptance
-- threshold live only inside the ai-broker edge function and are never stored
-- or returned to the client. Public read/insert/update mirror the marketplace's
-- existing permissive lead-capture posture so anonymous buyers can run a session.

CREATE TABLE public.negotiation_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  domain_id uuid REFERENCES public.domains(id) ON DELETE CASCADE,
  domain_name text NOT NULL,
  buyer_name text,
  buyer_email text,
  intent text DEFAULT 'inquiry',
  asking_price numeric(12,2),
  current_offer numeric(12,2),
  current_counter numeric(12,2),
  stage text DEFAULT 'opening',
  status text DEFAULT 'active',
  rounds integer DEFAULT 0,
  buyer_score integer DEFAULT 50,
  urgency_score integer DEFAULT 40,
  confidence integer DEFAULT 40,
  messages jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT negotiation_sessions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'accepted'::text, 'escalated'::text, 'abandoned'::text])))
);

CREATE INDEX idx_negotiation_sessions_domain ON public.negotiation_sessions USING btree (domain_id);
CREATE INDEX idx_negotiation_sessions_status ON public.negotiation_sessions USING btree (status);
CREATE INDEX idx_negotiation_sessions_created ON public.negotiation_sessions USING btree (created_at DESC);

ALTER TABLE public.negotiation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read negotiations" ON public.negotiation_sessions FOR SELECT USING (true);
CREATE POLICY "Public insert negotiations" ON public.negotiation_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update negotiations" ON public.negotiation_sessions FOR UPDATE USING (true) WITH CHECK (true);
