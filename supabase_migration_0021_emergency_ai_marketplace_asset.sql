-- Surface Emergency AI as a deployable infrastructure asset inside the
-- Sovereign marketplace. The platform itself is operational; this row
-- positions it alongside other featured infrastructure (TreasuryOS,
-- National Shell, Veritas Operations, EmergencyOS, USA Relocation).

insert into public.ecosystem_products (
  slug,
  name,
  category,
  tagline,
  description,
  accent,
  status,
  is_featured,
  sort_order,
  url,
  capabilities,
  metrics
) values (
  'emergency-ai-platform',
  'Emergency AI',
  'Media, Distribution & Intelligence Infrastructure',
  'The cinematic intelligence layer of the sovereign platform — owned, audited, operator-ready.',
  'Emergency AI is the institutional substrate for media production, multi-channel distribution and strategic intelligence. Three sovereign layers, four media classes, eleven distribution surfaces, seven named intelligence agents — under one console with row-level isolation and a single audit trail.',
  '#d4a86a',
  'deployable',
  true,
  10,
  'https://emergency.ai',
  array[
    'Cinematic film, image, narration & editorial production',
    'Multi-channel publish across 11 surfaces (3 live, 8 activating)',
    'Seven named intelligence agents (Strategos, Sentinel, Cartographer, Pulse, Architect, Liaison, Forge)',
    'Stripe-backed subscription billing with Customer Portal',
    'Owner-scoped tenancy + single-tenant institutional deployments',
    'Queued · audited · retried pipeline with exponential backoff'
  ],
  '[
    {"label": "Estimated Infrastructure Value", "value": "$8M–$15M"},
    {"label": "Status",                          "value": "Deployable"},
    {"label": "Distribution surfaces",           "value": "11"},
    {"label": "Intelligence agents",             "value": "7"}
  ]'::jsonb
)
on conflict (slug) do update set
  name        = excluded.name,
  category    = excluded.category,
  tagline     = excluded.tagline,
  description = excluded.description,
  accent      = excluded.accent,
  status      = excluded.status,
  is_featured = excluded.is_featured,
  sort_order  = excluded.sort_order,
  url         = excluded.url,
  capabilities = excluded.capabilities,
  metrics      = excluded.metrics;
