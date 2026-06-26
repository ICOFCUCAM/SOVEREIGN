-- M24: artifact-level integrity — "is THIS file exactly the one the institution
-- issued?". Each produced artifact already stores a SHA-256 of its bytes; the
-- public verification lookup now also returns those hashes, so a recipient can
-- hash their own copy locally and compare. If a single byte differs, it won't
-- match. The hash is one-way, so exposing it leaks nothing about content — it is
-- safe even for classified records (only the title is withheld).
--
-- Changing the function's OUT columns requires a drop + recreate (CREATE OR
-- REPLACE cannot alter a function's result columns).

drop function if exists dispatch.verify_record(text);

create function dispatch.verify_record(p_id text)
returns table (
  public_id text, tenant_id uuid, institution text, title text, doc_type text,
  lifecycle_state text, classification jsonb,
  published_at timestamptz, archived_at timestamptz, withdrawn_at timestamptz,
  governance_sha256 text, preservation_sha256 text, governance_certificate jsonb,
  retention_until timestamptz, document_id uuid, artifacts jsonb
)
language sql security definer set search_path = dispatch, pg_temp as $$
  select d.public_id, d.tenant_id, t.name, d.title, d.doc_type,
         d.lifecycle_state, d.classification,
         d.published_at, d.archived_at, d.withdrawn_at,
         d.governance_sha256, d.preservation_sha256, d.governance_certificate,
         d.retention_until, d.id,
         (select coalesce(jsonb_agg(jsonb_build_object(
                    'format', a.format, 'sha256', a.sha256,
                    'sizeBytes', a.size_bytes, 'pages', a.pages) order by a.format), '[]'::jsonb)
            from dispatch.artifacts a
            join dispatch.document_versions v on v.id = a.version_id
           where v.document_id = d.id and v.version_no = d.current_version) as artifacts
    from dispatch.documents d
    join dispatch.tenants t on t.id = d.tenant_id
   where (d.public_id = p_id or d.id::text = p_id)
     and d.lifecycle_state in ('published', 'withdrawn', 'archived')
     and d.deleted_at is null
   limit 1;
$$;
grant execute on function dispatch.verify_record(text) to dispatch_app;
