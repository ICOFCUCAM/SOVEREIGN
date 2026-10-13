-- ExitOS · NDA lifecycle with signature evidence, and buyer data-room access bound to it
-- (deliverable 5, findings C-2 and C-3; plan items 8.1-8.3).
--
-- Replaces "the founder marked the request signed". One workflow, enforced on the server:
--
--   issued ──(every required party's signature recorded AND verified by the counterparty)──► executed
--     │                                                                                       │
--     └─► withdrawn (seller, before execution)                 terminated (either party) ◄────┤
--                                                              revoked (seller removes buyer) ◄┤
--                                                              expired (access term elapsed; computed on every check)
--
-- Agreement   the exact document text is fixed at issue with its SHA-256; changing the text means a
--             new agreement. Issued by the listing owner, only to a buyer who requested an NDA on
--             that listing, for one company. transaction_id is reserved for deliverable 6, when access
--             becomes transaction-scoped; until then the company and listing scope access.
--             Both parties sign every NDA, whatever its shape (mutual or one-way): a conservative default.
--             access_term_months (how long the buyer may use the room) is separate from
--             survival_months (how long obligations survive); C-3 had expiry running from execution.
-- Signature   recorded by the signing party's own authenticated account, for the issued document's hash
--             (anything else is an altered document and refused), with method-specific evidence:
--               external_esign  provider, envelopeId, signedCopySha256
--               wet_ink_scan    signedCopySha256
--               in_app_typed    typedName equal to the signatory name (the account is recorded)
--             Verified or rejected by the counterparty, never the signer. "Verified" means a named
--             non-signatory confirmed the evidence matches the issued version. ExitOS does not check
--             e-signature certificates cryptographically and gives no legal opinion on enforceability.
-- Access      a buyer lists and downloads the seller's data-room files only through
--             exitos_buyer_room_files / exitos_buyer_file_path, which re-check on every call: the caller
--             is the agreement's buyer; the agreement is executed and inside its access term; the file
--             belongs to the agreement's seller and company, is marked post_nda by the seller, is not
--             rejected, and is within the agreement's scope. The bucket stays private (no storage
--             policies); downloads are 60-second signed links issued by an edge function.
-- Audit       exitos_nda_events records issue, signatures, verifications, execution, withdrawal,
--             termination, revocation, listings, downloads and denials.
-- Also        exitos_nda_requests can no longer be set "signed" by anyone directly: only execution sets
--             it. The post_nda branch of exitos_docs_read now needs an active executed agreement.
--
-- Rollback (in order):
--   alter policy exitos_docs_read on public.exitos_documents using (public.exitos_owns_listing(listing_id)
--     or data->>'visibility' = 'public' or (data->>'visibility' = 'post_nda' and exists (select 1 from
--     public.exitos_nda_requests r where r.listing_id = exitos_documents.listing_id
--     and r.buyer_account_id = auth.uid()::text and r.data->>'status' = 'signed')));
--   re-apply exitos_nda_request_guard from 20261014100000;
--   drop function public.exitos_nda_issue(text,text,text,text,text,text,text,text,text,integer,integer,text[]),
--     public.exitos_nda_withdraw(uuid,text), public.exitos_nda_sign(uuid,text,text,text,text,text,text,jsonb,timestamptz),
--     public.exitos_nda_verify_signature(uuid,text,text), public.exitos_nda_terminate(uuid,text),
--     public.exitos_nda_revoke_access(uuid,text), public.exitos_nda_active(uuid),
--     public.exitos_nda_effective_state(text,timestamptz), public.exitos_buyer_room_files(uuid),
--     public.exitos_buyer_file_path(uuid,uuid), public.exit_data_room_set_disclosure(uuid,text),
--     public.exitos_nda_log(uuid,text,jsonb);
--   drop table public.exitos_nda_events, public.exitos_nda_signatures, public.exitos_nda_agreements;
--   alter table public.exit_data_room_documents drop column disclosure;

-- ── tables ──────────────────────────────────────────────────────────
create table if not exists public.exitos_nda_agreements (
  id                  uuid primary key default gen_random_uuid(),
  listing_id          text not null,
  company_id          text not null check (company_id ~ '^co-[0-9a-f-]{36}$'),
  transaction_id      text,                                   -- deliverable 6
  owner_account_id    text not null,                          -- the seller (listing owner at issue)
  buyer_account_id    text not null,
  nda_request_id      text not null,
  title               text not null check (length(trim(title)) > 0),
  document_version    text not null check (length(trim(document_version)) > 0),
  document_origin     text not null check (document_origin in ('exitos_template', 'seller_supplied')),
  document_text       text not null check (length(document_text) >= 200),
  document_sha256     text not null check (document_sha256 ~ '^[0-9a-f]{64}$'),
  shape               text not null check (shape in ('mutual', 'one_way_seller_discloses')),
  required_signers    text[] not null,
  access_term_months  integer not null check (access_term_months between 1 and 60),
  survival_months     integer not null check (survival_months between 0 and 120),
  scope_room_kinds    text[],                                 -- null: every post-NDA file of the company
  state               text not null default 'issued' check (state in ('issued', 'executed', 'withdrawn', 'terminated', 'revoked')),
  issued_at           timestamptz not null default now(),
  executed_at         timestamptz,
  access_until        timestamptz,
  ended_at            timestamptz,
  ended_by            text,
  end_reason          text,
  check (owner_account_id <> buyer_account_id),
  check (state <> 'executed' or (executed_at is not null and access_until is not null))
);
create unique index if not exists exitos_nda_one_live on public.exitos_nda_agreements (listing_id, buyer_account_id) where state in ('issued', 'executed');
alter table public.exitos_nda_agreements enable row level security;

create table if not exists public.exitos_nda_signatures (
  id                      uuid primary key default gen_random_uuid(),
  agreement_id            uuid not null references public.exitos_nda_agreements (id) on delete cascade,
  party                   text not null check (party in ('seller', 'buyer')),
  signer_account_id       text not null,
  signatory_name          text not null check (length(trim(signatory_name)) > 0),
  signatory_title         text,
  signatory_email         text,
  method                  text not null check (method in ('external_esign', 'wet_ink_scan', 'in_app_typed')),
  signed_document_sha256  text not null,
  evidence                jsonb not null,
  signed_at               timestamptz not null,
  recorded_at             timestamptz not null default now(),
  verification            text not null default 'pending' check (verification in ('pending', 'verified', 'rejected')),
  verified_by             text,
  verified_at             timestamptz,
  verification_note       text,
  check (verified_by is null or verified_by <> signer_account_id)
);
create unique index if not exists exitos_nda_one_signature on public.exitos_nda_signatures (agreement_id, party) where verification <> 'rejected';
alter table public.exitos_nda_signatures enable row level security;

create table if not exists public.exitos_nda_events (
  id            bigserial primary key,
  agreement_id  uuid not null references public.exitos_nda_agreements (id) on delete cascade,
  at            timestamptz not null default now(),
  actor         text,
  action        text not null,
  details       jsonb not null default '{}'
);
create index if not exists exitos_nda_events_agreement on public.exitos_nda_events (agreement_id, at);
alter table public.exitos_nda_events enable row level security;

alter table public.exit_data_room_documents
  add column if not exists disclosure text not null default 'seller_only' check (disclosure in ('seller_only', 'post_nda'));

-- ── read policies: the two parties; nobody writes directly ──────────
create policy exitos_nda_agreements_read on public.exitos_nda_agreements for select to authenticated
  using (owner_account_id = auth.uid()::text or buyer_account_id = auth.uid()::text);
create policy exitos_nda_signatures_read on public.exitos_nda_signatures for select to authenticated
  using (exists (select 1 from public.exitos_nda_agreements a where a.id = agreement_id
                 and (a.owner_account_id = auth.uid()::text or a.buyer_account_id = auth.uid()::text)));
create policy exitos_nda_events_read on public.exitos_nda_events for select to authenticated
  using (exists (select 1 from public.exitos_nda_agreements a where a.id = agreement_id
                 and (a.owner_account_id = auth.uid()::text or a.buyer_account_id = auth.uid()::text)));

-- ── helpers ─────────────────────────────────────────────────────────
create or replace function public.exitos_nda_effective_state(p_state text, p_access_until timestamptz) returns text
language sql stable set search_path = public as $$
  select case when p_state = 'executed' and p_access_until <= now() then 'expired' else p_state end $$;

create or replace function public.exitos_nda_log(p_agreement uuid, p_action text, p_details jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.exitos_nda_events (agreement_id, actor, action, details) values (p_agreement, auth.uid()::text, p_action, coalesce(p_details, '{}')) $$;

create or replace function public.exitos_nda_active(p_agreement uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.exitos_nda_agreements a where a.id = p_agreement and a.state = 'executed' and a.access_until > now()) $$;

-- ── lifecycle ───────────────────────────────────────────────────────
create or replace function public.exitos_nda_issue(
  p_listing text, p_company text, p_buyer text, p_request text, p_title text, p_version text, p_origin text,
  p_shape text, p_text text, p_access_term_months integer, p_survival_months integer, p_scope text[])
returns uuid language plpgsql security definer set search_path = public as $$
declare me text := auth.uid()::text; v_id uuid;
begin
  if me is null then raise exception 'sign in to issue an NDA'; end if;
  if not public.exitos_owns_listing(p_listing) then raise exception 'only the listing owner issues its NDA'; end if;
  if p_buyer is null or p_buyer = me then raise exception 'an NDA is issued to a buyer, not to yourself'; end if;
  if not exists (select 1 from public.exitos_nda_requests r where r.id = p_request and r.listing_id = p_listing
                 and r.buyer_account_id = p_buyer and coalesce(r.data->>'status', 'requested') = 'requested') then
    raise exception 'the buyer has no open NDA request on this listing';
  end if;
  insert into public.exitos_nda_agreements (listing_id, company_id, owner_account_id, buyer_account_id, nda_request_id, title,
    document_version, document_origin, document_text, document_sha256, shape, required_signers, access_term_months, survival_months, scope_room_kinds)
  values (p_listing, p_company, me, p_buyer, p_request, trim(p_title), trim(p_version), p_origin, p_text,
    encode(sha256(convert_to(p_text, 'UTF8')), 'hex'), p_shape, array['seller', 'buyer'], p_access_term_months, p_survival_months, p_scope)
  returning id into v_id;
  perform public.exitos_nda_log(v_id, 'issued', jsonb_build_object('version', p_version, 'origin', p_origin, 'sha256', encode(sha256(convert_to(p_text, 'UTF8')), 'hex')));
  return v_id;
end $$;

create or replace function public.exitos_nda_withdraw(p_agreement uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.exitos_nda_agreements set state = 'withdrawn', ended_at = now(), ended_by = auth.uid()::text, end_reason = p_reason
   where id = p_agreement and owner_account_id = auth.uid()::text and state = 'issued';
  if not found then raise exception 'only the seller withdraws an NDA that has not been executed'; end if;
  perform public.exitos_nda_log(p_agreement, 'withdrawn', jsonb_build_object('reason', p_reason));
end $$;

create or replace function public.exitos_nda_sign(
  p_agreement uuid, p_party text, p_name text, p_title text, p_email text, p_method text,
  p_signed_sha256 text, p_evidence jsonb, p_signed_at timestamptz)
returns uuid language plpgsql security definer set search_path = public as $$
declare me text := auth.uid()::text; a public.exitos_nda_agreements; v_id uuid; ev jsonb := coalesce(p_evidence, '{}');
begin
  select * into a from public.exitos_nda_agreements where id = p_agreement;
  if not found or me is null or (me <> a.owner_account_id and me <> a.buyer_account_id) then raise exception 'no such NDA for you'; end if;
  if a.state <> 'issued' then raise exception 'this NDA is % and takes no signatures', a.state; end if;
  if not (p_party = any (a.required_signers)) then raise exception 'the % is not a signing party of this NDA', p_party; end if;
  if (p_party = 'seller' and me <> a.owner_account_id) or (p_party = 'buyer' and me <> a.buyer_account_id) then
    raise exception 'a party signs only from its own account';
  end if;
  if p_signed_sha256 is distinct from a.document_sha256 then
    raise exception 'the signed document differs from the issued version (sha256 %); issue a new NDA for a changed text', a.document_sha256;
  end if;
  if length(trim(coalesce(p_name, ''))) = 0 then raise exception 'the signatory''s name is required'; end if;
  if p_signed_at is null or p_signed_at > now() + interval '5 minutes' or p_signed_at < a.issued_at - interval '1 hour' then
    raise exception 'the signing time must fall between issue and now';
  end if;
  if p_method = 'external_esign' and (coalesce(ev->>'provider', '') = '' or coalesce(ev->>'envelopeId', '') = '' or coalesce(ev->>'signedCopySha256', '') !~ '^[0-9a-f]{64}$') then
    raise exception 'an e-signature needs the provider, the envelope id and the SHA-256 of the completed copy';
  elsif p_method = 'wet_ink_scan' and coalesce(ev->>'signedCopySha256', '') !~ '^[0-9a-f]{64}$' then
    raise exception 'a wet-ink signature needs the SHA-256 of the scanned signed copy';
  elsif p_method = 'in_app_typed' and lower(trim(coalesce(ev->>'typedName', ''))) <> lower(trim(p_name)) then
    raise exception 'an in-app signature needs the signatory to type their name';
  elsif p_method not in ('external_esign', 'wet_ink_scan', 'in_app_typed') then
    raise exception 'unknown signing method';
  end if;
  insert into public.exitos_nda_signatures (agreement_id, party, signer_account_id, signatory_name, signatory_title, signatory_email,
    method, signed_document_sha256, evidence, signed_at)
  values (p_agreement, p_party, me, trim(p_name), nullif(trim(coalesce(p_title, '')), ''), nullif(trim(coalesce(p_email, '')), ''),
    p_method, p_signed_sha256, ev || jsonb_build_object('recordedByAccount', me), p_signed_at)
  returning id into v_id;
  perform public.exitos_nda_log(p_agreement, 'signature_recorded', jsonb_build_object('party', p_party, 'method', p_method, 'signature', v_id));
  return v_id;
end $$;

create or replace function public.exitos_nda_verify_signature(p_signature uuid, p_decision text, p_note text)
returns text language plpgsql security definer set search_path = public as $$
declare me text := auth.uid()::text; s public.exitos_nda_signatures; a public.exitos_nda_agreements; v_missing int;
begin
  if p_decision not in ('verified', 'rejected') then raise exception 'a review verifies or rejects the evidence'; end if;
  select * into s from public.exitos_nda_signatures where id = p_signature;
  if not found then raise exception 'no such signature'; end if;
  select * into a from public.exitos_nda_agreements where id = s.agreement_id;
  if me is null or (me <> a.owner_account_id and me <> a.buyer_account_id) then raise exception 'no such signature for you'; end if;
  if me = s.signer_account_id or (s.party = 'seller' and me <> a.buyer_account_id) or (s.party = 'buyer' and me <> a.owner_account_id) then
    raise exception 'a signature is verified by the counterparty, never by the signer';
  end if;
  if s.verification <> 'pending' then raise exception 'this signature has already been %', s.verification; end if;
  if a.state <> 'issued' then raise exception 'this NDA is %', a.state; end if;
  update public.exitos_nda_signatures set verification = p_decision, verified_by = me, verified_at = now(),
         verification_note = nullif(trim(coalesce(p_note, '')), '') where id = p_signature;
  perform public.exitos_nda_log(a.id, 'signature_' || p_decision, jsonb_build_object('party', s.party, 'signature', s.id, 'note', p_note));
  select count(*) into v_missing from unnest(a.required_signers) p
   where not exists (select 1 from public.exitos_nda_signatures x where x.agreement_id = a.id and x.party = p and x.verification = 'verified');
  if v_missing = 0 then
    update public.exitos_nda_agreements set state = 'executed', executed_at = now(), access_until = now() + make_interval(months => a.access_term_months)
     where id = a.id;
    update public.exitos_nda_requests set data = data || jsonb_build_object('status', 'signed', 'resolvedAt', now()) where id = a.nda_request_id;
    perform public.exitos_nda_log(a.id, 'executed', jsonb_build_object('accessUntil', now() + make_interval(months => a.access_term_months)));
    return 'executed';
  end if;
  return 'issued';
end $$;

create or replace function public.exitos_nda_terminate(p_agreement uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(trim(coalesce(p_reason, ''))) = 0 then raise exception 'state why the NDA is terminated'; end if;
  update public.exitos_nda_agreements set state = 'terminated', ended_at = now(), ended_by = auth.uid()::text, end_reason = p_reason
   where id = p_agreement and state = 'executed' and (owner_account_id = auth.uid()::text or buyer_account_id = auth.uid()::text);
  if not found then raise exception 'only a party terminates an executed NDA'; end if;
  perform public.exitos_nda_log(p_agreement, 'terminated', jsonb_build_object('reason', p_reason));
end $$;

create or replace function public.exitos_nda_revoke_access(p_agreement uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(trim(coalesce(p_reason, ''))) = 0 then raise exception 'state why access is revoked'; end if;
  update public.exitos_nda_agreements set state = 'revoked', ended_at = now(), ended_by = auth.uid()::text, end_reason = p_reason
   where id = p_agreement and state = 'executed' and owner_account_id = auth.uid()::text;
  if not found then raise exception 'only the seller revokes a buyer''s access under an executed NDA'; end if;
  perform public.exitos_nda_log(p_agreement, 'access_revoked', jsonb_build_object('reason', p_reason));
end $$;

-- ── buyer access to the seller's data room ──────────────────────────
create or replace function public.exitos_buyer_room_files(p_agreement uuid)
returns table (id uuid, room_kind text, filename text, mime text, bytes integer, artifact_id text, classification text, uploaded_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare a public.exitos_nda_agreements;
begin
  select * into a from public.exitos_nda_agreements x where x.id = p_agreement;
  if not found or auth.uid() is null or a.buyer_account_id <> auth.uid()::text then raise exception 'no such NDA for you'; end if;
  if not public.exitos_nda_active(p_agreement) then
    raise exception 'access needs an executed NDA inside its access term (this one is %)', public.exitos_nda_effective_state(a.state, a.access_until);
  end if;
  perform public.exitos_nda_log(p_agreement, 'files_listed', '{}');
  return query
    select d.id, d.room_kind, d.filename, d.mime, d.bytes, d.artifact_id, d.classification, d.uploaded_at
      from public.exit_data_room_documents d
     where d.tenant_id::text = a.owner_account_id and d.company_id = a.company_id and d.disclosure = 'post_nda'
       and d.review_state <> 'rejected' and (a.scope_room_kinds is null or d.room_kind = any (a.scope_room_kinds))
     order by d.room_kind, d.uploaded_at desc;
end $$;

create or replace function public.exitos_buyer_file_path(p_agreement uuid, p_file uuid)
returns text language plpgsql security definer set search_path = public as $$
declare a public.exitos_nda_agreements; v_path text;
begin
  select * into a from public.exitos_nda_agreements x where x.id = p_agreement;
  if not found or auth.uid() is null or a.buyer_account_id <> auth.uid()::text then raise exception 'no such NDA for you'; end if;
  if not public.exitos_nda_active(p_agreement) then raise exception 'access needs an executed NDA inside its access term'; end if;
  select d.storage_path into v_path from public.exit_data_room_documents d
   where d.id = p_file and d.tenant_id::text = a.owner_account_id and d.company_id = a.company_id and d.disclosure = 'post_nda'
     and d.review_state <> 'rejected' and (a.scope_room_kinds is null or d.room_kind = any (a.scope_room_kinds));
  if v_path is null then raise exception 'this file is not disclosed to you under this NDA'; end if;
  perform public.exitos_nda_log(p_agreement, 'file_downloaded', jsonb_build_object('file', p_file));
  return v_path;
end $$;

-- the seller marks which of its files buyers may see under an executed NDA
create or replace function public.exit_data_room_set_disclosure(p_document uuid, p_disclosure text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_disclosure not in ('seller_only', 'post_nda') then raise exception 'disclosure is seller_only or post_nda'; end if;
  update public.exit_data_room_documents set disclosure = p_disclosure where id = p_document and tenant_id = auth.uid();
  if not found then raise exception 'no such file in your data room'; end if;
end $$;

-- ── the request flag and the old document gate follow the agreement ─
create or replace function public.exitos_nda_request_guard() returns trigger
language plpgsql set search_path = public as $$
declare st_old text; st_new text := coalesce(new.data->>'status', 'requested');
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if tg_op = 'INSERT' then
    if st_new <> 'requested' then raise exception 'an NDA request starts as requested; only the listing owner resolves it'; end if;
    return new;
  end if;
  if new.id <> old.id or new.listing_id is distinct from old.listing_id or new.buyer_account_id is distinct from old.buyer_account_id then
    raise exception 'an NDA request cannot be moved to another listing or buyer';
  end if;
  st_old := coalesce(old.data->>'status', 'requested');
  if st_new <> st_old and not (st_old = 'requested' and st_new = 'rejected' and public.exitos_owns_listing(old.listing_id)) then
    raise exception 'an NDA request becomes signed only when its NDA is executed; the listing owner may reject it (% to % refused)', st_old, st_new;
  end if;
  return new;
end $$;

alter policy exitos_docs_read on public.exitos_documents using (
  public.exitos_owns_listing(listing_id)
  or data->>'visibility' = 'public'
  or (data->>'visibility' = 'post_nda' and exists (
    select 1 from public.exitos_nda_agreements a
     where a.listing_id = exitos_documents.listing_id and a.buyer_account_id = auth.uid()::text
       and a.state = 'executed' and a.access_until > now()))
);

-- ── privileges ──────────────────────────────────────────────────────
revoke all on public.exitos_nda_agreements, public.exitos_nda_signatures, public.exitos_nda_events from anon, authenticated;
grant select on public.exitos_nda_agreements, public.exitos_nda_signatures, public.exitos_nda_events to authenticated;
revoke all on sequence public.exitos_nda_events_id_seq from anon, authenticated;
revoke all on function public.exitos_nda_log(uuid, text, jsonb), public.exitos_nda_active(uuid) from public, anon, authenticated;
revoke all on function public.exitos_nda_issue(text, text, text, text, text, text, text, text, text, integer, integer, text[]),
  public.exitos_nda_withdraw(uuid, text), public.exitos_nda_sign(uuid, text, text, text, text, text, text, jsonb, timestamptz),
  public.exitos_nda_verify_signature(uuid, text, text), public.exitos_nda_terminate(uuid, text), public.exitos_nda_revoke_access(uuid, text),
  public.exitos_buyer_room_files(uuid), public.exitos_buyer_file_path(uuid, uuid), public.exit_data_room_set_disclosure(uuid, text),
  public.exitos_nda_effective_state(text, timestamptz) from public, anon;
grant execute on function public.exitos_nda_issue(text, text, text, text, text, text, text, text, text, integer, integer, text[]),
  public.exitos_nda_withdraw(uuid, text), public.exitos_nda_sign(uuid, text, text, text, text, text, text, jsonb, timestamptz),
  public.exitos_nda_verify_signature(uuid, text, text), public.exitos_nda_terminate(uuid, text), public.exitos_nda_revoke_access(uuid, text),
  public.exitos_buyer_room_files(uuid), public.exitos_buyer_file_path(uuid, uuid), public.exit_data_room_set_disclosure(uuid, text),
  public.exitos_nda_effective_state(text, timestamptz) to authenticated;
