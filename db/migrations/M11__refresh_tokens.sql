-- M11 — refresh tokens with rotation + reuse detection (human SSO sessions).
--
-- After SSO the API issues its OWN Dispatch session: a short-lived access JWT
-- (signed with DISPATCH_TOKEN_SECRET, authoritative claims baked in) plus a
-- long-lived ROTATING refresh token. Each refresh returns a new refresh token
-- and revokes the one presented (rotation). A whole "family" (chain of
-- rotations from one login) shares a family_id; if an ALREADY-ROTATED token is
-- presented again (theft/replay), the entire family is revoked — standard
-- refresh-token reuse detection.
--
-- Only the SHA-256 of the token is stored, never the token itself. Lookups run
-- as a SECURITY DEFINER function (the presenter has no session yet, so this
-- cannot be tenant-RLS-scoped) — mirrors lookup_service_client / lookup_membership.

create table dispatch.refresh_tokens (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null,                 -- shared across one login's rotation chain
  token_hash   text not null unique,          -- sha256 hex of the opaque token
  tenant_id    uuid not null references dispatch.tenants(id) on delete cascade,
  user_id      uuid not null,                 -- membership subject
  rotated_to   uuid references dispatch.refresh_tokens(id) on delete set null,
  revoked      boolean not null default false,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

create index on dispatch.refresh_tokens (family_id);
create index on dispatch.refresh_tokens (tenant_id, user_id);
create index on dispatch.refresh_tokens (expires_at);

-- RLS: enable + force, but the table is only ever touched via the SECURITY
-- DEFINER functions below (the holder of a refresh token has no tenant claim
-- yet). No app policies → direct access is denied; functions are the only path.
alter table dispatch.refresh_tokens enable row level security;
alter table dispatch.refresh_tokens force row level security;

-- Look up a refresh token by hash (pre-session; cannot be RLS-scoped).
create or replace function dispatch.lookup_refresh_token(p_hash text)
returns table (id uuid, family_id uuid, tenant_id uuid, user_id uuid, rotated_to uuid, revoked boolean, expires_at timestamptz)
language sql security definer stable
set search_path = dispatch as $$
  select id, family_id, tenant_id, user_id, rotated_to, revoked, expires_at
    from dispatch.refresh_tokens where token_hash = p_hash
$$;

-- Issue a new refresh token row (login or rotation). Returns the new id.
create or replace function dispatch.issue_refresh_token(
  p_family uuid, p_hash text, p_tenant uuid, p_user uuid, p_expires timestamptz)
returns uuid
language sql security definer
set search_path = dispatch as $$
  insert into dispatch.refresh_tokens (family_id, token_hash, tenant_id, user_id, expires_at)
  values (p_family, p_hash, p_tenant, p_user, p_expires)
  returning id
$$;

-- Mark a token rotated to a successor (and stamp last_used_at).
create or replace function dispatch.rotate_refresh_token(p_id uuid, p_to uuid)
returns void
language sql security definer
set search_path = dispatch as $$
  update dispatch.refresh_tokens set rotated_to = p_to, last_used_at = now() where id = p_id
$$;

-- Revoke a single token (logout).
create or replace function dispatch.revoke_refresh_token(p_id uuid)
returns void
language sql security definer
set search_path = dispatch as $$
  update dispatch.refresh_tokens set revoked = true where id = p_id
$$;

-- Revoke an entire family (reuse detected, or "log out everywhere").
create or replace function dispatch.revoke_refresh_family(p_family uuid)
returns void
language sql security definer
set search_path = dispatch as $$
  update dispatch.refresh_tokens set revoked = true where family_id = p_family
$$;

grant execute on function dispatch.lookup_refresh_token(text) to dispatch_app;
grant execute on function dispatch.issue_refresh_token(uuid, text, uuid, uuid, timestamptz) to dispatch_app;
grant execute on function dispatch.rotate_refresh_token(uuid, uuid) to dispatch_app;
grant execute on function dispatch.revoke_refresh_token(uuid) to dispatch_app;
grant execute on function dispatch.revoke_refresh_family(uuid) to dispatch_app;
-- the table itself: app role needs base privileges for the SECURITY DEFINER
-- functions' owner check to pass under FORCE RLS is not required (definer owns
-- it), but grant select/insert/update so the owner (migration role) === app in
-- this single-role dev setup still works.
grant select, insert, update on dispatch.refresh_tokens to dispatch_app;
