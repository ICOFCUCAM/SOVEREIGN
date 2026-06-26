-- M23: Public Official Record identity + verification — what a copied PDF can't carry.
--
-- A file can always be copied; the institutional PROOF cannot. When a record is
-- published it receives a permanent, never-reused public identifier, and becomes
-- publicly VERIFIABLE by that id: anyone holding a copy can confirm it is genuine,
-- which institution issued it, its governance/preservation certificates, its
-- integrity hash, and whether it is still current or has been revoked.
--
-- Verification is cross-tenant by id (anyone may verify any institution's record),
-- so it goes through a SECURITY DEFINER function that bypasses RLS but returns ONLY
-- institutional-proof fields (never the document body), and only for records that
-- have actually become official (published / preserved / withdrawn).

create sequence if not exists dispatch.record_seq;
grant usage on sequence dispatch.record_seq to dispatch_app;

alter table dispatch.documents add column if not exists public_id text;
create unique index if not exists documents_public_id_idx
  on dispatch.documents (public_id) where public_id is not null;

-- Allocate a permanent identifier: SD-<YEAR>-<8-digit global sequence>. Never reused.
create or replace function dispatch.next_record_id()
returns text language sql as $$
  select 'SD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('dispatch.record_seq')::text, 8, '0');
$$;
grant execute on function dispatch.next_record_id() to dispatch_app;

-- Public verification lookup. Cross-tenant, no RLS; returns institutional proof
-- only. The document body is NEVER returned; the title is returned to the API,
-- which withholds it for classified records. Matches the public id OR the uuid.
create or replace function dispatch.verify_record(p_id text)
returns table (
  public_id text, tenant_id uuid, institution text, title text, doc_type text,
  lifecycle_state text, classification jsonb,
  published_at timestamptz, archived_at timestamptz, withdrawn_at timestamptz,
  governance_sha256 text, preservation_sha256 text, governance_certificate jsonb,
  retention_until timestamptz
)
language sql security definer set search_path = dispatch, pg_temp as $$
  select d.public_id, d.tenant_id, t.name, d.title, d.doc_type,
         d.lifecycle_state, d.classification,
         d.published_at, d.archived_at, d.withdrawn_at,
         d.governance_sha256, d.preservation_sha256, d.governance_certificate,
         d.retention_until
    from dispatch.documents d
    join dispatch.tenants t on t.id = d.tenant_id
   where (d.public_id = p_id or d.id::text = p_id)
     and d.lifecycle_state in ('published', 'withdrawn', 'archived')
     and d.deleted_at is null
   limit 1;
$$;
grant execute on function dispatch.verify_record(text) to dispatch_app;
