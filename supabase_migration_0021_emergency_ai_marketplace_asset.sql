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
  'Emergency AI is the institutional substrate for media production, multi-channel distribution and strategic intelligence — under one console with row-level isolation and a single audit trail. Sovereign-grade, mission-critical, owned end to end.',
  '#d4a86a',
  'deployable',
  true,
  10,
  'https://emergency.ai',
  '[
    "Cinematic media production at command speed",
    "Coordinated multi-channel distribution",
    "Strategic Intelligence Layer for decision-makers",
    "Subscription billing with Stripe Customer Portal",
    "Owner-scoped tenancy and single-tenant institutional deployments",
    "Continuously audited, queued and retried operations"
  ]'::jsonb,
  '[
    {"label": "Estimated Infrastructure Value", "value": "$8M–$15M"},
    {"label": "Status",                          "value": "Deployable"},
    {"label": "Operational posture",             "value": "Sovereign-grade"},
    {"label": "Intelligence",                    "value": "Strategic Intelligence Layer"}
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
