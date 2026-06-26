-- M25: Evaluation namespace — free-tier records must never be mistaken for official.
--
-- The whole product rests on "a copy can never carry the institutional proof".
-- The free/Evaluation tier therefore must NOT mint real SD-YYYY-NNNNNNNN ids: if
-- it did, anyone could generate official-looking records for free that verify as
-- genuine on /verify. Evaluation records get a clearly-marked EVAL- identifier
-- from a separate sequence, and the public verification lookup flags them as NOT
-- official so the portal (and the in-document stamp) can say so plainly.
-- (ADR-012: "watermarked evaluation environment".)

create sequence if not exists dispatch.eval_record_seq;
grant usage on sequence dispatch.eval_record_seq to dispatch_app;

-- Allocate a permanent identifier for a document's tenant. Paid plans get the
-- official SD- namespace; the free/Evaluation plan gets the EVAL- namespace. The
-- plan is read inside the function (SECURITY DEFINER) so the caller's RLS context
-- cannot affect which namespace is chosen.
drop function if exists dispatch.next_record_id();

create function dispatch.next_record_id(p_tenant uuid)
returns text language sql security definer set search_path = dispatch, pg_temp as $$
  select case
    when coalesce((select plan from dispatch.tenants where id = p_tenant), 'free') = 'free'
      then 'EVAL-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('dispatch.eval_record_seq')::text, 8, '0')
    else  'SD-'   || to_char(now(), 'YYYY') || '-' || lpad(nextval('dispatch.record_seq')::text,      8, '0')
  end;
$$;
grant execute on function dispatch.next_record_id(uuid) to dispatch_app;

-- Re-create the public verification lookup with an explicit `official` flag, so the
-- API/portal never have to sniff the id prefix. Evaluation records still resolve
-- (honest transparency) but are clearly marked official = false.
drop function if exists dispatch.verify_record(text);

create function dispatch.verify_record(p_id text)
returns table (
  public_id text, tenant_id uuid, institution text, title text, doc_type text,
  lifecycle_state text, classification jsonb,
  published_at timestamptz, archived_at timestamptz, withdrawn_at timestamptz,
  governance_sha256 text, preservation_sha256 text, governance_certificate jsonb,
  retention_until timestamptz, document_id uuid, artifacts jsonb, official boolean
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
           where v.document_id = d.id and v.version_no = d.current_version) as artifacts,
         (d.public_id is not null and d.public_id not like 'EVAL-%') as official
    from dispatch.documents d
    join dispatch.tenants t on t.id = d.tenant_id
   where (d.public_id = p_id or d.id::text = p_id)
     and d.lifecycle_state in ('published', 'withdrawn', 'archived')
     and d.deleted_at is null
   limit 1;
$$;
grant execute on function dispatch.verify_record(text) to dispatch_app;
