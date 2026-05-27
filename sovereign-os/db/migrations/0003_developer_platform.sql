-- Sovereign OS — developer platform (issue API keys/tokens to users, meter usage,
-- vault social tokens, deliver webhooks). The self-owned equivalent of the Ayrshare
-- developer surface.

create extension if not exists "pgcrypto";

-- Users/tenants of OUR API.
create table if not exists public.api_clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_email text not null,
  plan        text not null default 'free',     -- free | basic | pro | enterprise
  status      text not null default 'active',   -- active | suspended
  created_at  timestamptz not null default now()
);

-- Issued API keys. Only the SHA-256 hash is stored; the plaintext is shown once.
create table if not exists public.api_keys (
  id                   uuid primary key default gen_random_uuid(),
  client_id            uuid not null references public.api_clients(id) on delete cascade,
  prefix               text not null,            -- public display, e.g. sov_live_a1b2c3d4
  last4                text not null,
  key_hash             text not null unique,     -- sha256 hex of the full key
  scopes               text[] not null default '{}',
  status               text not null default 'active',  -- active | revoked
  rate_limit_per_month integer not null default 1000,
  created_at           timestamptz not null default now(),
  last_used_at         timestamptz,
  revoked_at           timestamptz
);
create index if not exists api_keys_client_idx on public.api_keys (client_id);
create index if not exists api_keys_hash_idx on public.api_keys (key_hash);

-- Connected social accounts (token vault). Tokens encrypted at rest by the app layer.
create table if not exists public.social_connections (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references public.api_clients(id) on delete cascade,
  platform            text not null,
  access_token        text not null,
  refresh_token       text,
  external_account_id text,
  expires_at          timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists social_connections_client_idx on public.social_connections (client_id, platform);

-- Per-call usage metering.
create table if not exists public.api_usage (
  id        uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.api_clients(id) on delete cascade,
  key_id    uuid references public.api_keys(id) on delete set null,
  metric    text not null,                       -- api_call | post | media_render | intelligence_run | comment
  units     integer not null default 1,
  at        timestamptz not null default now()
);
create index if not exists api_usage_client_at_idx on public.api_usage (client_id, at);

-- Outbound webhooks.
create table if not exists public.webhooks (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.api_clients(id) on delete cascade,
  url        text not null,
  events     text[] not null default '{}',
  secret     text not null,
  status     text not null default 'active',     -- active | paused
  created_at timestamptz not null default now()
);
create index if not exists webhooks_client_idx on public.webhooks (client_id);
