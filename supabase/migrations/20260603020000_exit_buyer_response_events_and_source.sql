-- ExitOS data moat · Bundle C
--
-- 1) New table: exit_buyer_response_events
--    Granular stage-transition log per (buyer, listing, run). Drives
--    the per-buyer response-time / close-rate analytics the user
--    described — "Vista: NDA 2d, LOI 14d, DD 47d, Closed".
--
-- 2) New enum: exit_event_source
--    Tags every telemetry row with where the data came from. Quoted
--    stats can refuse to mix tiers — a verified_filing close beats
--    a founder_reported one for calibration weight.
--
-- 3) Backfill: existing rows on exit_offer_events / exit_close_events /
--    exit_telemetry_events get source='system_generated'. Default
--    going forward is 'system_generated' for SPA-emitted events; the
--    edge function passes through whatever the client specifies.

-- ── exit_event_source ──────────────────────────────────────────────
do $$ begin
  create type public.exit_event_source as enum (
    'founder_reported',
    'broker_reported',
    'verified_filing',
    'legal_doc',
    'system_generated'
  );
exception
  when duplicate_object then null;
end $$;

-- ── source column on existing tables ───────────────────────────────
alter table public.exit_offer_events
  add column if not exists source public.exit_event_source not null default 'system_generated';
alter table public.exit_close_events
  add column if not exists source public.exit_event_source not null default 'system_generated';
alter table public.exit_telemetry_events
  add column if not exists source public.exit_event_source not null default 'system_generated';

-- ── exit_buyer_response_events ─────────────────────────────────────
create table if not exists public.exit_buyer_response_events (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.exit_tenants(id) on delete cascade,
  run_id          uuid references public.exit_runs(id) on delete set null,
  buyer_id        text not null,
  buyer_name      text not null,
  listing_id      text,
  stage           text not null check (stage in (
    'outreach',
    'nda_issued',
    'nda_signed',
    'teaser_sent',
    'cim_requested',
    'cim_sent',
    'loi_received',
    'loi_countered',
    'diligence_started',
    'diligence_complete',
    'closed',
    'walked',
    'declined'
  )),
  occurred_at     timestamptz not null,
  latency_days    numeric,
  source          public.exit_event_source not null default 'system_generated',
  metadata        jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists exit_buyer_response_tenant_idx on public.exit_buyer_response_events (tenant_id, occurred_at desc);
create index if not exists exit_buyer_response_buyer_idx  on public.exit_buyer_response_events (buyer_id, occurred_at desc);
create index if not exists exit_buyer_response_listing_idx on public.exit_buyer_response_events (listing_id) where listing_id is not null;
comment on table public.exit_buyer_response_events is 'Stage-transition log per (buyer, listing). Rolls up into per-buyer response-time + close-rate analytics. After enough deals: "Vista 64% close rate, avg 112d, avg +19% premium" with verified-filing weight.';

alter table public.exit_buyer_response_events enable row level security;

-- ── exit_buyer_funnel view ─────────────────────────────────────────
create or replace view public.exit_buyer_funnel as
with stage_counts as (
  select
    tenant_id,
    buyer_id,
    buyer_name,
    count(*) filter (where stage = 'outreach')        as outreach_n,
    count(*) filter (where stage = 'nda_issued')      as nda_issued_n,
    count(*) filter (where stage = 'nda_signed')      as nda_signed_n,
    count(*) filter (where stage = 'cim_sent')        as cim_sent_n,
    count(*) filter (where stage = 'loi_received')    as loi_received_n,
    count(*) filter (where stage = 'diligence_started') as dd_started_n,
    count(*) filter (where stage = 'closed')          as closed_n,
    count(*) filter (where stage = 'walked')          as walked_n,
    avg(latency_days) filter (where stage = 'nda_signed' and latency_days is not null) as avg_days_to_nda_signed,
    avg(latency_days) filter (where stage = 'loi_received' and latency_days is not null) as avg_days_to_loi,
    avg(latency_days) filter (where stage = 'closed' and latency_days is not null) as avg_days_to_close
  from public.exit_buyer_response_events
  group by tenant_id, buyer_id, buyer_name
)
select
  tenant_id, buyer_id, buyer_name,
  outreach_n, nda_issued_n, nda_signed_n, cim_sent_n, loi_received_n, dd_started_n, closed_n, walked_n,
  case when (closed_n + walked_n) > 0
       then closed_n::numeric / (closed_n + walked_n)::numeric
       else null
  end as close_rate_pct,
  avg_days_to_nda_signed,
  avg_days_to_loi,
  avg_days_to_close
from stage_counts;
alter view public.exit_buyer_funnel set (security_invoker = true);
comment on view public.exit_buyer_funnel is 'Per-buyer funnel rollup: outreach → NDA → CIM → LOI → diligence → close/walk, with average latencies between stages and close-rate over resolved attempts.';
