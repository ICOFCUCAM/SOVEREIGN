-- ExitOS · certified documents. When the owner of an approved deal document (an NDA, a letter of intent,
-- an exclusivity agreement, a bring-down certificate, a funds-flow statement or the post-closing register)
-- certifies it, the exit-dispatch-submit function registers that exact version with Sovereign Dispatch,
-- which gives it a permanent record number, a public verification page, an integrity hash and preservation.
-- This table is ExitOS's record of that: one row per certified version. Only the function (service role)
-- writes it, so no client can mark a document as certified; the version's owner reads it.
--
-- Rollback: drop table public.exitos_document_certificates;

create table if not exists public.exitos_document_certificates (
  version_id            text primary key references public.exitos_document_versions(id),
  owner_account_id      text not null,
  content_hash          text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  state                 text not null default 'requested' check (state in ('requested', 'certified', 'failed')),
  dispatch_document_id  text,
  record_id             text check (record_id is null or record_id ~ '^(SD|EVAL)-[0-9]{4}-[0-9]{8}$'),
  verify_url            text check (verify_url is null or verify_url ~ '^https://'),
  integrity_sha256      text check (integrity_sha256 is null or integrity_sha256 ~ '^[0-9a-f]{64}$'),
  error                 text check (error is null or length(error) <= 500),
  requested_at          timestamptz not null default now(),
  certified_at          timestamptz,
  -- a certified row names its record, and a requested one its Dispatch document
  check (state <> 'certified' or (record_id is not null and certified_at is not null)),
  check (state <> 'requested' or dispatch_document_id is not null)
);
create index if not exists exitos_document_certificates_owner_idx on public.exitos_document_certificates (owner_account_id);

alter table public.exitos_document_certificates enable row level security;
revoke all on public.exitos_document_certificates from anon, authenticated;
grant select on public.exitos_document_certificates to authenticated;

do $p$ begin
  if not exists (select 1 from pg_policies where tablename = 'exitos_document_certificates' and policyname = 'exitos_document_certificates_owner_read') then
    create policy exitos_document_certificates_owner_read on public.exitos_document_certificates for select to authenticated
      using (owner_account_id = (auth.uid())::text);
  end if;
end $p$;
