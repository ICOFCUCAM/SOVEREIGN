-- ============================================================================
-- Phase 1 · Sprint 1.1 — Strategic Intelligence Substrate · Schema & Plumbing
-- ============================================================================
--
-- Establishes the eleven intel_* tables that hold external signals, the
-- entities they reference and the watchlist/alert layer downstream tiers
-- consume. Tenant-scoped via auth.uid() on every row; service_role
-- bypasses for worker ingestion.
--
-- Partitioning is deliberately deferred to Sprint 1.7. The high-volume
-- tables (intel_signals, intel_raw_documents, intel_alerts,
-- intel_signal_embeddings) carry the indexes that make a future
-- ATTACH PARTITION migration straightforward.
--
-- Surfaces created:
--   1.  intel_sources              registered connectors
--   2.  intel_ingest_runs          per-pull metadata
--   3.  intel_raw_documents        immutable raw payloads
--   4.  intel_signals              normalized atomic observations
--   5.  intel_entities             resolved canonical entities
--   6.  intel_signal_entities      junction (signal × entity)
--   7.  intel_relationships        entity ↔ entity edges
--   8.  intel_topics               narrative clusters
--   9.  intel_watchlists           per-tenant subscriptions
--  10.  intel_alerts               triggered watch events
--  11.  intel_signal_embeddings    pgvector index (1024-dim)
--
-- All tables are tenant_id-scoped, RLS-enforced, append-mostly.
-- ============================================================================

-- Extensions
create extension if not exists vector    with schema public;
create extension if not exists pg_trgm   with schema public;
create extension if not exists btree_gin with schema public;

-- ──────────────────────────────────────────────────────────────────────
-- 1. intel_sources — one row per registered connector per tenant
-- ──────────────────────────────────────────────────────────────────────
create table public.intel_sources (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null,
  family                      text not null,
  connector                   text not null,
  display_name                text not null,
  config                      jsonb not null default '{}'::jsonb,
  auth_ref                    text,
  enabled                     boolean not null default true,
  rate_limit_policy           jsonb not null default '{}'::jsonb,
  freshness_sla_minutes       integer not null default 60,
  last_run_at                 timestamptz,
  last_status                 text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  constraint intel_sources_family_check
    check (family in ('news','social','government','regulatory','financial','stakeholder','web','wire','telegram','other'))
);
create index intel_sources_tenant_idx       on public.intel_sources (tenant_id);
create index intel_sources_enabled_idx      on public.intel_sources (tenant_id, enabled);
create index intel_sources_family_idx       on public.intel_sources (tenant_id, family);
alter table public.intel_sources enable row level security;

-- ──────────────────────────────────────────────────────────────────────
-- 2. intel_ingest_runs — one row per connector pull
-- ──────────────────────────────────────────────────────────────────────
create table public.intel_ingest_runs (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null,
  source_id                   uuid not null references public.intel_sources(id) on delete cascade,
  started_at                  timestamptz not null default now(),
  finished_at                 timestamptz,
  pulled_count                integer not null default 0,
  inserted_count              integer not null default 0,
  duplicate_count             integer not null default 0,
  error                       text,
  connector_version           text,
  metadata                    jsonb not null default '{}'::jsonb
);
create index intel_ingest_runs_tenant_started_idx on public.intel_ingest_runs (tenant_id, started_at desc);
create index intel_ingest_runs_source_idx         on public.intel_ingest_runs (source_id, started_at desc);
alter table public.intel_ingest_runs enable row level security;

-- ──────────────────────────────────────────────────────────────────────
-- 3. intel_raw_documents — immutable raw payloads; body in Storage
-- ──────────────────────────────────────────────────────────────────────
create table public.intel_raw_documents (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null,
  source_id                   uuid not null references public.intel_sources(id) on delete cascade,
  ingest_run_id               uuid references public.intel_ingest_runs(id) on delete set null,
  content_hash                bytea not null,
  canonical_url               text,
  mime                        text not null,
  bytes                       integer not null,
  storage_path                text,
  payload_excerpt             text,
  provenance                  jsonb not null default '{}'::jsonb,
  ingested_at                 timestamptz not null default now(),
  constraint intel_raw_documents_hash_uniq
    unique (tenant_id, content_hash)
);
create index intel_raw_documents_tenant_idx     on public.intel_raw_documents (tenant_id, ingested_at desc);
create index intel_raw_documents_source_idx     on public.intel_raw_documents (source_id, ingested_at desc);
create index intel_raw_documents_url_idx        on public.intel_raw_documents (tenant_id, canonical_url);
alter table public.intel_raw_documents enable row level security;

-- ──────────────────────────────────────────────────────────────────────
-- 4. intel_signals — canonical normalized atomic observations
-- ──────────────────────────────────────────────────────────────────────
create table public.intel_signals (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null,
  source_id                   uuid not null references public.intel_sources(id) on delete cascade,
  raw_document_id             uuid references public.intel_raw_documents(id) on delete set null,
  content_hash                bytea not null,
  canonical_url               text,
  signal_class                text not null,
  published_at                timestamptz not null,
  ingested_at                 timestamptz not null default now(),
  language                    text,
  title                       text,
  body_excerpt                text,
  summary                     text,
  geo_focus                   jsonb,
  sentiment                   jsonb,
  influence_score             numeric,
  velocity_at_ingest          numeric,
  narrative_cluster_id        uuid,
  attestations                jsonb not null default '{}'::jsonb,
  provenance                  jsonb not null default '{}'::jsonb,
  constraint intel_signals_dedup_uniq unique (tenant_id, content_hash),
  constraint intel_signals_class_check
    check (signal_class in (
      'news_article','press_release','regulatory_filing','gov_release',
      'political_statement','social_post','financial_disclosure',
      'corporate_announcement','analyst_report','litigation_filing',
      'patent_grant','executive_appointment','policy_document',
      'treaty','protest_event','incident_report'
    ))
);
create index intel_signals_tenant_published_idx  on public.intel_signals (tenant_id, published_at desc);
create index intel_signals_class_idx             on public.intel_signals (tenant_id, signal_class, published_at desc);
create index intel_signals_source_idx            on public.intel_signals (source_id, published_at desc);
create index intel_signals_cluster_idx           on public.intel_signals (narrative_cluster_id) where narrative_cluster_id is not null;
create index intel_signals_title_trgm_idx        on public.intel_signals using gin (title public.gin_trgm_ops);
create index intel_signals_body_trgm_idx         on public.intel_signals using gin (body_excerpt public.gin_trgm_ops);
alter table public.intel_signals enable row level security;

-- ──────────────────────────────────────────────────────────────────────
-- 5. intel_entities — resolved canonical entities
-- ──────────────────────────────────────────────────────────────────────
create table public.intel_entities (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null,
  entity_type                 text not null,
  canonical_name              text not null,
  aliases                     text[] not null default '{}',
  external_ids                jsonb not null default '{}'::jsonb,
  attributes                  jsonb not null default '{}'::jsonb,
  confidence                  numeric not null default 1.0,
  source_diversity_score      numeric not null default 0,
  mention_count               integer not null default 0,
  first_seen_at               timestamptz not null default now(),
  last_seen_at                timestamptz not null default now(),
  merged_into                 uuid references public.intel_entities(id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  constraint intel_entities_type_check
    check (entity_type in ('person','organization','place','product','topic','event','asset','document'))
);
create index intel_entities_tenant_idx         on public.intel_entities (tenant_id);
create index intel_entities_type_idx           on public.intel_entities (tenant_id, entity_type);
create index intel_entities_name_trgm_idx      on public.intel_entities using gin (canonical_name public.gin_trgm_ops);
create index intel_entities_aliases_idx        on public.intel_entities using gin (aliases);
create index intel_entities_external_ids_idx   on public.intel_entities using gin (external_ids);
create index intel_entities_active_idx         on public.intel_entities (tenant_id, last_seen_at desc) where merged_into is null;
alter table public.intel_entities enable row level security;

-- ──────────────────────────────────────────────────────────────────────
-- 6. intel_signal_entities — junction (signal × entity)
-- ──────────────────────────────────────────────────────────────────────
create table public.intel_signal_entities (
  signal_id                   uuid not null references public.intel_signals(id)  on delete cascade,
  entity_id                   uuid not null references public.intel_entities(id) on delete cascade,
  tenant_id                   uuid not null,
  salience                    numeric not null default 0,
  sentiment                   jsonb,
  role                        text,
  primary key (signal_id, entity_id)
);
create index intel_signal_entities_tenant_idx  on public.intel_signal_entities (tenant_id);
create index intel_signal_entities_entity_idx  on public.intel_signal_entities (entity_id);
alter table public.intel_signal_entities enable row level security;

-- ──────────────────────────────────────────────────────────────────────
-- 7. intel_relationships — entity ↔ entity edges with provenance
-- ──────────────────────────────────────────────────────────────────────
create table public.intel_relationships (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null,
  source_entity_id            uuid not null references public.intel_entities(id) on delete cascade,
  target_entity_id            uuid not null references public.intel_entities(id) on delete cascade,
  relationship_type           text not null,
  strength                    numeric not null default 0.5,
  first_observed_at           timestamptz not null default now(),
  last_observed_at            timestamptz not null default now(),
  superseded_at               timestamptz,
  evidence_signal_ids         uuid[] not null default '{}',
  attributes                  jsonb not null default '{}'::jsonb,
  constraint intel_relationships_distinct_check
    check (source_entity_id <> target_entity_id)
);
create index intel_relationships_tenant_idx    on public.intel_relationships (tenant_id);
create index intel_relationships_source_idx    on public.intel_relationships (source_entity_id);
create index intel_relationships_target_idx    on public.intel_relationships (target_entity_id);
create index intel_relationships_type_idx      on public.intel_relationships (tenant_id, relationship_type);
create index intel_relationships_active_idx    on public.intel_relationships (tenant_id, last_observed_at desc) where superseded_at is null;
alter table public.intel_relationships enable row level security;

-- ──────────────────────────────────────────────────────────────────────
-- 8. intel_topics — narrative clusters
-- ──────────────────────────────────────────────────────────────────────
create table public.intel_topics (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid,
  label                       text not null,
  description                 text,
  parent_topic_id             uuid references public.intel_topics(id) on delete set null,
  centroid_embedding          public.vector(1024),
  signal_count                integer not null default 0,
  velocity_24h                numeric not null default 0,
  novelty_score               numeric not null default 0,
  first_seen_at               timestamptz not null default now(),
  last_seen_at                timestamptz not null default now()
);
create index intel_topics_tenant_idx           on public.intel_topics (tenant_id);
create index intel_topics_parent_idx           on public.intel_topics (parent_topic_id);
create index intel_topics_label_trgm_idx       on public.intel_topics using gin (label public.gin_trgm_ops);
alter table public.intel_topics enable row level security;

-- ──────────────────────────────────────────────────────────────────────
-- 9. intel_watchlists — per-tenant subscriptions
-- ──────────────────────────────────────────────────────────────────────
create table public.intel_watchlists (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null,
  name                        text not null,
  description                 text,
  definition                  jsonb not null,
  severity_thresholds         jsonb not null default '{"info":{"min_confidence":0.5}}'::jsonb,
  delivery_channels           jsonb not null default '{"in_app":true}'::jsonb,
  quiet_hours                 jsonb,
  enabled                     boolean not null default true,
  precision_budget_per_day    integer not null default 50,
  created_by                  uuid,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index intel_watchlists_tenant_idx       on public.intel_watchlists (tenant_id);
create index intel_watchlists_enabled_idx      on public.intel_watchlists (tenant_id, enabled);
create index intel_watchlists_definition_idx   on public.intel_watchlists using gin (definition);
alter table public.intel_watchlists enable row level security;

-- ──────────────────────────────────────────────────────────────────────
-- 10. intel_alerts — triggered watch events
-- ──────────────────────────────────────────────────────────────────────
create table public.intel_alerts (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null,
  watchlist_id                uuid not null references public.intel_watchlists(id) on delete cascade,
  signal_id                   uuid references public.intel_signals(id) on delete set null,
  severity                    text not null default 'info',
  state                       text not null default 'open',
  matched_definition          jsonb,
  delivered_to                text[] not null default '{}',
  acknowledged_by             uuid,
  acknowledged_at             timestamptz,
  created_at                  timestamptz not null default now(),
  constraint intel_alerts_severity_check check (severity in ('info','warn','critical')),
  constraint intel_alerts_state_check    check (state in ('open','acknowledged','suppressed','closed'))
);
create index intel_alerts_tenant_created_idx     on public.intel_alerts (tenant_id, created_at desc);
create index intel_alerts_watchlist_idx          on public.intel_alerts (watchlist_id, created_at desc);
create index intel_alerts_open_idx               on public.intel_alerts (tenant_id, severity) where state = 'open';
alter table public.intel_alerts enable row level security;

-- ──────────────────────────────────────────────────────────────────────
-- 11. intel_signal_embeddings — 1024-dim pgvector index
-- ──────────────────────────────────────────────────────────────────────
create table public.intel_signal_embeddings (
  signal_id                   uuid primary key references public.intel_signals(id) on delete cascade,
  tenant_id                   uuid not null,
  embedding                   public.vector(1024) not null,
  model                       text not null default 'voyage-3',
  created_at                  timestamptz not null default now()
);
create index intel_signal_embeddings_tenant_idx on public.intel_signal_embeddings (tenant_id);
-- HNSW index on the vector column. Cosine distance is the canonical
-- similarity for normalized text embeddings.
create index intel_signal_embeddings_hnsw_idx
  on public.intel_signal_embeddings
  using hnsw (embedding public.vector_cosine_ops);
alter table public.intel_signal_embeddings enable row level security;

-- ============================================================================
-- Row Level Security policies
--
-- Pattern: tenant_id is the user's auth.uid() for Sprint 1.1 (one user
-- = one tenant). Service-role JWT bypasses, which is how worker
-- ingestion writes across the substrate. Future sprints introduce the
-- institution → users mapping; the policies tighten in place.
-- ============================================================================

-- Helper: is the caller the service role?
create or replace function public.intel_is_service_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role',
    false
  );
$$;

-- Per-table policies. Same shape on every table; expressed once each
-- to keep the surface explicit.

create policy intel_sources_tenant_read       on public.intel_sources       for select using (auth.uid() = tenant_id or public.intel_is_service_role());
create policy intel_sources_tenant_write      on public.intel_sources       for all    using (auth.uid() = tenant_id or public.intel_is_service_role()) with check (auth.uid() = tenant_id or public.intel_is_service_role());

create policy intel_ingest_runs_tenant_read   on public.intel_ingest_runs   for select using (auth.uid() = tenant_id or public.intel_is_service_role());
create policy intel_ingest_runs_tenant_write  on public.intel_ingest_runs   for all    using (auth.uid() = tenant_id or public.intel_is_service_role()) with check (auth.uid() = tenant_id or public.intel_is_service_role());

create policy intel_raw_documents_tenant_read on public.intel_raw_documents for select using (auth.uid() = tenant_id or public.intel_is_service_role());
create policy intel_raw_documents_tenant_write on public.intel_raw_documents for all   using (auth.uid() = tenant_id or public.intel_is_service_role()) with check (auth.uid() = tenant_id or public.intel_is_service_role());

create policy intel_signals_tenant_read       on public.intel_signals       for select using (auth.uid() = tenant_id or public.intel_is_service_role());
create policy intel_signals_tenant_write      on public.intel_signals       for all    using (auth.uid() = tenant_id or public.intel_is_service_role()) with check (auth.uid() = tenant_id or public.intel_is_service_role());

create policy intel_entities_tenant_read      on public.intel_entities      for select using (auth.uid() = tenant_id or public.intel_is_service_role());
create policy intel_entities_tenant_write     on public.intel_entities      for all    using (auth.uid() = tenant_id or public.intel_is_service_role()) with check (auth.uid() = tenant_id or public.intel_is_service_role());

create policy intel_signal_entities_tenant_read  on public.intel_signal_entities for select using (auth.uid() = tenant_id or public.intel_is_service_role());
create policy intel_signal_entities_tenant_write on public.intel_signal_entities for all    using (auth.uid() = tenant_id or public.intel_is_service_role()) with check (auth.uid() = tenant_id or public.intel_is_service_role());

create policy intel_relationships_tenant_read   on public.intel_relationships   for select using (auth.uid() = tenant_id or public.intel_is_service_role());
create policy intel_relationships_tenant_write  on public.intel_relationships   for all    using (auth.uid() = tenant_id or public.intel_is_service_role()) with check (auth.uid() = tenant_id or public.intel_is_service_role());

-- intel_topics: global rows (tenant_id is null) are world-readable;
-- writes still gated by tenant_id when present.
create policy intel_topics_read              on public.intel_topics for select using (tenant_id is null or auth.uid() = tenant_id or public.intel_is_service_role());
create policy intel_topics_write             on public.intel_topics for all    using (auth.uid() = tenant_id or public.intel_is_service_role()) with check (auth.uid() = tenant_id or public.intel_is_service_role());

create policy intel_watchlists_tenant_read   on public.intel_watchlists   for select using (auth.uid() = tenant_id or public.intel_is_service_role());
create policy intel_watchlists_tenant_write  on public.intel_watchlists   for all    using (auth.uid() = tenant_id or public.intel_is_service_role()) with check (auth.uid() = tenant_id or public.intel_is_service_role());

create policy intel_alerts_tenant_read       on public.intel_alerts       for select using (auth.uid() = tenant_id or public.intel_is_service_role());
create policy intel_alerts_tenant_write      on public.intel_alerts       for all    using (auth.uid() = tenant_id or public.intel_is_service_role()) with check (auth.uid() = tenant_id or public.intel_is_service_role());

create policy intel_signal_embeddings_tenant_read  on public.intel_signal_embeddings for select using (auth.uid() = tenant_id or public.intel_is_service_role());
create policy intel_signal_embeddings_tenant_write on public.intel_signal_embeddings for all    using (auth.uid() = tenant_id or public.intel_is_service_role()) with check (auth.uid() = tenant_id or public.intel_is_service_role());

-- updated_at maintenance for the tables that need it.
create or replace function public.intel_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger intel_sources_touch       before update on public.intel_sources       for each row execute function public.intel_touch_updated_at();
create trigger intel_entities_touch      before update on public.intel_entities      for each row execute function public.intel_touch_updated_at();
create trigger intel_watchlists_touch    before update on public.intel_watchlists    for each row execute function public.intel_touch_updated_at();

-- Pipeline-jobs extension — extend the existing job kinds vocabulary
-- with the intel.* family. Workers use this table to coordinate.
do $$
begin
  if exists (
    select 1 from information_schema.constraint_column_usage
    where table_schema = 'public'
      and table_name   = 'pipeline_jobs'
      and constraint_name = 'pipeline_jobs_kind_check'
  ) then
    alter table public.pipeline_jobs drop constraint pipeline_jobs_kind_check;
  end if;

  -- Re-establish a permissive check that includes the intel.* kinds.
  alter table public.pipeline_jobs
    add constraint pipeline_jobs_kind_check
    check (kind in (
      'film','video','narration','social',
      'intel.ingest','intel.normalize','intel.extract','intel.embed','intel.cluster','intel.evaluate'
    ));
exception
  when undefined_object then null;
end$$;
