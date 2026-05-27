-- Sovereign OS — Layer 1 foundation schema.
-- Defines the job queue + campaign tables the migrated media pipeline writes to.
-- Reconstructed from the column usage in the existing edge functions and worker.

create extension if not exists "pgcrypto";

-- Unified pipeline job queue shared across all three layers.
create table if not exists public.pipeline_jobs (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null,          -- film | video | narration | image | content | scenario | campaign | intelligence
  status      text not null default 'queued',  -- queued | processing | done | failed
  provider    text,
  title       text,
  input       jsonb,
  result      jsonb,
  result_url  text,
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists pipeline_jobs_kind_status_idx
  on public.pipeline_jobs (kind, status, created_at);

-- Layer 2 distribution campaigns.
create table if not exists public.campaigns (
  id           uuid primary key default gen_random_uuid(),
  channel      text not null,         -- linkedin | x | instagram | youtube | ...
  title        text,
  body         text,
  media_url    text,
  status       text not null default 'draft',  -- draft | scheduled | publishing | published | failed
  scheduled_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists campaigns_channel_status_idx
  on public.campaigns (channel, status);
