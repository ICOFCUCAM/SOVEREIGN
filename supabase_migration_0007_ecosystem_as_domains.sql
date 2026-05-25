-- SOVEREIGN migration 0007 — ecosystem systems as acquirable institutions
-- Applied to Supabase project qvjdivcdefuprnenedje (via execute_sql).
--
-- Adds the real ecosystem systems into the domains registry so each appears in
-- the marketplace / showcase and gets a /d/:name Institution Preview. Each row
-- carries metadata.ecosystem_slug linking back to ecosystem_products.
-- Framing: deployable preview builds that ship in full on acquisition.

INSERT INTO public.domains
  (domain_name, tagline, description, price_usd, currency, status, category, tld,
   is_premium, is_featured, brand_color, accent_color, valuation_score, ssl_verified, ownership_verified, ai_brand_profile, metadata)
VALUES
  ('veritas.financial', 'The sovereign financial operating system for civilizations.', 'Air-gap-capable, zero-trust, AI-native banking infrastructure.', 1200000, 'USD', 'active', 'fintech', '.financial', true, true, '#3B82F6', '#06B6D4', 97, true, true, '{}'::jsonb, '{"ecosystem_slug":"veritas-banking"}'::jsonb),
  ('veritasos.ai', 'Sovereign infrastructure for reading, learning, and intelligence.', 'AI-native knowledge operating system.', 620000, 'USD', 'active', 'ai', '.ai', true, true, '#22D3EE', '#F59E0B', 95, true, true, '{}'::jsonb, '{"ecosystem_slug":"veritas-os"}'::jsonb),
  ('civicos.io', 'The operating system for whole-of-government.', 'Whole-of-government coordination platform.', 850000, 'USD', 'active', 'govtech', '.io', true, true, '#10B981', '#00D9FF', 94, true, true, '{}'::jsonb, '{"ecosystem_slug":"civicos"}'::jsonb),
  ('elecpro.ai', 'The operating system for modern democracies.', 'Sovereign electoral infrastructure.', 480000, 'USD', 'active', 'govtech', '.ai', true, true, '#06B6D4', '#3B82F6', 96, true, true, '{}'::jsonb, '{"ecosystem_slug":"elecpro"}'::jsonb),
  ('flyttgo.no', 'Smart moving & transport, made simple.', 'National moving and transport platform.', 180000, 'USD', 'active', 'logistics', '.no', true, false, '#10B981', '#00D9FF', 88, true, true, '{}'::jsonb, '{"ecosystem_slug":"flyttgo"}'::jsonb)
ON CONFLICT (domain_name) DO NOTHING;
