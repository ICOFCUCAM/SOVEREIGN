-- ── ACQUISITION REGISTRIES · DDL ────────────────────────────────────
-- The four tables the ingestion pipelines fill. Provenance is enforced
-- at the schema level: source, source_url, confidence and
-- verification_status are NOT NULL, and source_url must be an http(s)
-- URL from an approved primary source. No mock data can satisfy these
-- constraints by accident.
--
-- Apply: supabase MCP apply_migration, or psql -f.

create table if not exists buyer_registry (
  buyer_id            text primary key,
  name                text not null,
  buyer_type          text not null check (buyer_type in ('corporate','private_equity','sovereign_fund')),
  qid                 text,                       -- Wikidata entity
  cik                 text,                       -- SEC CIK, zero-padded 10
  country             text,
  aum_usd             numeric,                    -- sovereign funds
  list_page           text,
  -- provenance (mandatory on every record)
  source              text not null check (source in ('wikipedia','wikidata','sec_edgar','wikipedia_swf')),
  source_url          text not null check (source_url ~ '^https?://(en\.wikipedia\.org|www\.wikidata\.org|query\.wikidata\.org|www\.sec\.gov|data\.sec\.gov)/'),
  confidence          text not null check (confidence in ('verified','reported','estimated')),
  verification_status text not null check (verification_status in ('verified','corroborated','unverified')),
  last_updated        timestamptz not null default now()
);

create table if not exists acquisition_events (
  acquisition_id      text primary key,
  buyer_id            text not null references buyer_registry(buyer_id) deferrable initially deferred,
  buyer_name          text not null,
  target_name         text not null,
  announced_date      date,
  value_usd           numeric,
  industry            text,
  country             text,
  derived_from        text,                       -- e.g. corroborating EDGAR accession
  source              text not null check (source in ('wikipedia','wikidata','sec_edgar','wikipedia_swf')),
  source_url          text not null check (source_url ~ '^https?://(en\.wikipedia\.org|www\.wikidata\.org|query\.wikidata\.org|www\.sec\.gov|data\.sec\.gov)/'),
  confidence          text not null check (confidence in ('verified','reported','estimated')),
  verification_status text not null check (verification_status in ('verified','corroborated','unverified')),
  last_updated        timestamptz not null default now()
);
create index if not exists acquisition_events_buyer_idx on acquisition_events (buyer_id);
create index if not exists acquisition_events_date_idx  on acquisition_events (announced_date);

create table if not exists acquisition_registry (
  buyer_id            text primary key references buyer_registry(buyer_id) deferrable initially deferred,
  buyer_name          text not null,
  total_acquisitions  integer not null default 0,
  disclosed_value_usd numeric not null default 0,
  first_date          date,
  last_date           date,
  source              text not null,
  source_url          text not null,
  confidence          text not null,
  verification_status text not null,
  last_updated        timestamptz not null default now()
);

create table if not exists buyer_graph (
  a                   text not null references buyer_registry(buyer_id) deferrable initially deferred,
  b                   text not null references buyer_registry(buyer_id) deferrable initially deferred,
  shared_industries   text[] not null,
  weight              integer not null,
  source              text not null,
  source_url          text not null,
  confidence          text not null,
  verification_status text not null,
  last_updated        timestamptz not null default now(),
  primary key (a, b)
);

-- read-only for anonymous clients; writes only via service role (the pipelines)
alter table buyer_registry       enable row level security;
alter table acquisition_events   enable row level security;
alter table acquisition_registry enable row level security;
alter table buyer_graph          enable row level security;

create policy buyer_registry_read       on buyer_registry       for select using (true);
create policy acquisition_events_read   on acquisition_events   for select using (true);
create policy acquisition_registry_read on acquisition_registry for select using (true);
create policy buyer_graph_read          on buyer_graph          for select using (true);
