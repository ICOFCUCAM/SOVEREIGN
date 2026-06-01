-- Sovereign Infrastructure Stack — canonical seven flagships
--
-- Hierarchy applied in dependency-tier order:
--   Foundational  10  Veritas OS
--   Producer      20  Emergency AI
--   Producer      30  ELECPRO
--   Producer      40  Veritas Financial Sovereign Stack
--   Operating     50  Civicos
--   Operating     60  Veritas Operations
--   Terminal      70  Sovereign Dispatch
--
-- Existing Civicos sub-modules (civicos-national-shell · civicos-treasury ·
-- civicos-health · civicos-justice · civicos-education · civicos-emergency ·
-- civicos-anti-corruption · civicos-police · civicos-transport ·
-- civicos-coordination-engine) keep is_featured=false and surface inside
-- the Civicos system page rather than the canonical flagship rotation.

-- ── 1 · Veritas OS (Foundational layer)
update public.ecosystem_products
   set name        = 'Veritas OS',
       category    = 'Knowledge & Organizational Intelligence Infrastructure',
       tagline     = 'The knowledge substrate of the Sovereign ecosystem — organisational memory, institutional knowledge, search, reference and knowledge governance.',
       is_featured = true,
       sort_order  = 10,
       metrics     = '[
         {"label": "Estimated Infrastructure Value", "value": "$5M–$12M"},
         {"label": "Status",                          "value": "Deployable"},
         {"label": "Layer",                           "value": "Foundational"},
         {"label": "Operational posture",             "value": "Sovereign-grade"}
       ]'::jsonb
 where slug = 'veritas-os';

-- ── 2 · Emergency AI (Producer · Intelligence)
update public.ecosystem_products
   set category    = 'Strategic Intelligence Infrastructure',
       tagline     = 'Intelligence acquisition, strategic analysis and institutional intelligence generation. Briefings and assessments for the principals who must decide.',
       is_featured = true,
       sort_order  = 20,
       metrics     = '[
         {"label": "Estimated Infrastructure Value", "value": "$8M–$15M"},
         {"label": "Status",                          "value": "Deployable"},
         {"label": "Layer",                           "value": "Producer · Intelligence"},
         {"label": "Operational posture",             "value": "Sovereign-grade"}
       ]'::jsonb
 where slug = 'emergency-ai-platform';

-- ── 3 · ELECPRO (Producer · Electoral)
update public.ecosystem_products
   set category    = 'Sovereign Electoral Infrastructure',
       tagline     = 'Registration, ballot, tabulation, observation and electoral-cycle dispatch — operated under sovereign jurisdiction and continuous audit.',
       is_featured = true,
       sort_order  = 30,
       metrics     = '[
         {"label": "Estimated Infrastructure Value", "value": "$20M–$50M"},
         {"label": "Status",                          "value": "Deployable"},
         {"label": "Layer",                           "value": "Producer · Electoral"},
         {"label": "Operational posture",             "value": "Sovereign-grade"}
       ]'::jsonb
 where slug = 'elecpro';

-- ── 4 · Veritas Financial Sovereign Stack (Producer · Financial)
update public.ecosystem_products
   set name        = 'Veritas Financial Sovereign Stack',
       category    = 'Financial Infrastructure for Civilizations',
       tagline     = 'Treasury, monetary, settlement, banking and reserve infrastructure operated at civilisation scale. Sovereign financial integrity, end to end.',
       is_featured = true,
       sort_order  = 40,
       metrics     = '[
         {"label": "Estimated Infrastructure Value", "value": "$50M–$200M"},
         {"label": "Status",                          "value": "Deployable"},
         {"label": "Layer",                           "value": "Producer · Financial"},
         {"label": "Operational posture",             "value": "Civilization-scale"}
       ]'::jsonb
 where slug = 'veritas-banking';

-- ── 5 · Civicos (Operating · Sovereign)
update public.ecosystem_products
   set name        = 'Civicos',
       category    = 'Sovereign Operating Infrastructure',
       tagline     = 'The operating layer for sovereign institutions — composes the other six infrastructures into a unified national runtime.',
       is_featured = true,
       sort_order  = 50,
       metrics     = '[
         {"label": "Estimated Infrastructure Value", "value": "$300M–$500M"},
         {"label": "Status",                          "value": "Deployable"},
         {"label": "Layer",                           "value": "Operating · Sovereign"},
         {"label": "Operational posture",             "value": "Sovereign-grade"}
       ]'::jsonb
 where slug = 'civicos';

-- ── 6 · Veritas Operations (Operating · Enterprise)
update public.ecosystem_products
   set category    = 'Autonomous Company Operations Infrastructure',
       tagline     = 'Operational management, workflow orchestration, accounting intelligence and compliance — a digital operations layer for enterprises.',
       is_featured = true,
       sort_order  = 60,
       metrics     = '[
         {"label": "Estimated Infrastructure Value", "value": "$25M–$80M"},
         {"label": "Status",                          "value": "Deployable"},
         {"label": "Layer",                           "value": "Operating · Enterprise"},
         {"label": "Operational posture",             "value": "Enterprise-grade"}
       ]'::jsonb
 where slug = 'veritas-operations';

-- ── 7 · Sovereign Dispatch (Terminal · Publication) — INSERT
insert into public.ecosystem_products (
  slug, name, category, tagline, description,
  accent, status, is_featured, sort_order, url, capabilities, metrics
) values (
  'sovereign-dispatch',
  'Sovereign Dispatch',
  'Institutional Publication Infrastructure',
  'Receives structured payloads from every producer in the Sovereign Infrastructure Stack and renders the institutional artifact. The publication layer.',
  'Sovereign Dispatch is the publication layer of the Sovereign Infrastructure Stack. PDF and DOCX production, briefing packages, board reports, policy documents, regulatory submissions and institutional artifacts — rendered with chain-of-custody preserved and routed through one defensible audit log.',
  '#d4a86a',
  'deployable',
  true,
  70,
  'https://dispatch.sovereigndo.com',
  '[
    "PDF · DOCX · PPTX rendering for institutional artifacts",
    "Briefing packages, board reports, policy documents, regulatory submissions",
    "Per-tenant institutional letterhead, classification banner, signature block",
    "Chain-of-custody preserved from upstream producer through publication",
    "Single audit-log namespace shared with all Sovereign producers",
    "Engagement-scoped institutional access; no consumer surface"
  ]'::jsonb,
  '[
    {"label": "Estimated Infrastructure Value", "value": "$6M–$15M"},
    {"label": "Status",                          "value": "Deployable"},
    {"label": "Layer",                           "value": "Terminal · Publication"},
    {"label": "Operational posture",             "value": "Sovereign-grade"}
  ]'::jsonb
)
on conflict (slug) do update set
  name         = excluded.name,
  category     = excluded.category,
  tagline      = excluded.tagline,
  description  = excluded.description,
  accent       = excluded.accent,
  status       = excluded.status,
  is_featured  = excluded.is_featured,
  sort_order   = excluded.sort_order,
  url          = excluded.url,
  capabilities = excluded.capabilities,
  metrics      = excluded.metrics;

-- ── Civicos sub-modules — confirm they stay below the flagship rotation
update public.ecosystem_products
   set is_featured = false
 where slug in (
   'civicos-national-shell',
   'civicos-coordination-engine',
   'civicos-treasury',
   'civicos-health',
   'civicos-justice',
   'civicos-education',
   'civicos-transport',
   'civicos-emergency',
   'civicos-police',
   'civicos-anti-corruption'
 );
