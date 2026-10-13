-- ExitOS · the transaction record: signing, closing and post-closing (deliverable 6; C-5, 6C, 6D).
--
--   negotiating ──(both parties confirm signing on the same agreement hash, and every required
--   │              signing condition is satisfied or waived)──► signed
--   │                                                              │
--   │      (both parties confirm the same funds amount at completion, and every required
--   │       closing condition is satisfied or waived)──────────────┴──► closed
--   └──► terminated (either party, before closing)
--
-- Transaction   created by the listing owner from an offer it accepted, only when that buyer's NDA
--               is executed and inside its access term. It snapshots the accepted price and terms, and
--               binds the NDA to it (exitos_nda_agreements.transaction_id), so the buyer's data-room
--               access is transaction-scoped from then on: every earlier check still applies, and a
--               terminated transaction ends access.
-- Items         one table for signing conditions, closing conditions and post-closing obligations.
--               Each has an owning party. The owner records evidence; the counterparty confirms it
--               (or rejects it, which reopens the item). A waiver needs both parties. A standard set
--               is created with the transaction; either party adds more. Post-closing obligations are
--               created at closing from the snapshot (escrow release, earn-out end, confidentiality
--               survival) and can be added later.
-- Milestones    signing and closing are each confirmed by both parties with evidence: signing with the
--               signatory and the SHA-256 of the signed agreement (both must name the same document);
--               closing with the amount and a payment reference (both must state the same amount).
-- What it is    a shared record of what the parties say happened, each statement confirmed by the
--               other party. ExitOS does not hold funds, check bank records or legal documents, or
--               judge whether a condition is legally satisfied; counsel does that.
--
-- Rollback (in order):
--   restore exitos_buyer_room_files / exitos_buyer_file_path from 20261014120000;
--   drop function public.exitos_txn_create(text, uuid), public.exitos_txn_add_item(uuid, text, text, text, date, boolean),
--     public.exitos_txn_evidence_item(uuid, jsonb), public.exitos_txn_confirm_item(uuid, text, text),
--     public.exitos_txn_waive_item(uuid, text), public.exitos_txn_confirm_milestone(uuid, text, jsonb),
--     public.exitos_txn_terminate(uuid, text), public.exitos_txn_party(uuid), public.exitos_txn_log(uuid, text, jsonb),
--     public.exitos_txn_try_advance(uuid);
--   drop table public.exitos_transaction_events, public.exitos_transaction_confirmations,
--     public.exitos_transaction_items, public.exitos_transactions;
--   update public.exitos_nda_agreements set transaction_id = null where transaction_id is not null;

create table if not exists public.exitos_transactions (
  id                 uuid primary key default gen_random_uuid(),
  listing_id         text not null,
  company_id         text not null check (company_id ~ '^co-[0-9a-f-]{36}$'),
  seller_account_id  text not null,
  buyer_account_id   text not null,
  offer_id           text not null,
  nda_agreement_id   uuid not null references public.exitos_nda_agreements (id),
  price_usd          numeric not null check (price_usd > 0),
  terms              jsonb not null default '{}',
  state              text not null default 'negotiating' check (state in ('negotiating', 'signed', 'closed', 'terminated')),
  created_at         timestamptz not null default now(),
  signed_at          timestamptz,
  closed_at          timestamptz,
  ended_at           timestamptz,
  ended_by           text,
  end_reason         text,
  check (seller_account_id <> buyer_account_id)
);
create unique index if not exists exitos_transactions_one_live on public.exitos_transactions (listing_id) where state in ('negotiating', 'signed');
alter table public.exitos_transactions enable row level security;

create table if not exists public.exitos_transaction_items (
  id                    uuid primary key default gen_random_uuid(),
  transaction_id        uuid not null references public.exitos_transactions (id) on delete cascade,
  gate                  text not null check (gate in ('signing', 'closing', 'post_closing')),
  title                 text not null check (length(trim(title)) > 0),
  owner_party           text not null check (owner_party in ('seller', 'buyer', 'both')),
  required              boolean not null default true,
  due_date              date,
  source                text not null default 'added' check (source in ('standard', 'added', 'from_terms')),
  status                text not null default 'open' check (status in ('open', 'evidenced', 'satisfied', 'waived')),
  evidence              jsonb,
  evidenced_by          text,
  evidenced_at          timestamptz,
  confirmed_by          text,
  confirmed_at          timestamptz,
  waiver_requested_by   text,
  note                  text,
  created_by            text,
  created_at            timestamptz not null default now(),
  check (confirmed_by is null or confirmed_by <> evidenced_by)
);
create index if not exists exitos_transaction_items_txn on public.exitos_transaction_items (transaction_id, gate);
alter table public.exitos_transaction_items enable row level security;

create table if not exists public.exitos_transaction_confirmations (
  transaction_id  uuid not null references public.exitos_transactions (id) on delete cascade,
  milestone       text not null check (milestone in ('signing', 'closing')),
  party           text not null check (party in ('seller', 'buyer')),
  account_id      text not null,
  evidence        jsonb not null,
  confirmed_at    timestamptz not null default now(),
  primary key (transaction_id, milestone, party)
);
alter table public.exitos_transaction_confirmations enable row level security;

create table if not exists public.exitos_transaction_events (
  id              bigserial primary key,
  transaction_id  uuid not null references public.exitos_transactions (id) on delete cascade,
  at              timestamptz not null default now(),
  actor           text,
  action          text not null,
  details         jsonb not null default '{}'
);
create index if not exists exitos_transaction_events_txn on public.exitos_transaction_events (transaction_id, at);
alter table public.exitos_transaction_events enable row level security;

-- ── reads: the two parties only ─────────────────────────────────────
create policy exitos_transactions_read on public.exitos_transactions for select to authenticated
  using (seller_account_id = auth.uid()::text or buyer_account_id = auth.uid()::text);
create policy exitos_transaction_items_read on public.exitos_transaction_items for select to authenticated
  using (exists (select 1 from public.exitos_transactions t where t.id = transaction_id and (t.seller_account_id = auth.uid()::text or t.buyer_account_id = auth.uid()::text)));
create policy exitos_transaction_confirmations_read on public.exitos_transaction_confirmations for select to authenticated
  using (exists (select 1 from public.exitos_transactions t where t.id = transaction_id and (t.seller_account_id = auth.uid()::text or t.buyer_account_id = auth.uid()::text)));
create policy exitos_transaction_events_read on public.exitos_transaction_events for select to authenticated
  using (exists (select 1 from public.exitos_transactions t where t.id = transaction_id and (t.seller_account_id = auth.uid()::text or t.buyer_account_id = auth.uid()::text)));

-- ── helpers ─────────────────────────────────────────────────────────
create or replace function public.exitos_txn_log(p_txn uuid, p_action text, p_details jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.exitos_transaction_events (transaction_id, actor, action, details) values (p_txn, auth.uid()::text, p_action, coalesce(p_details, '{}')) $$;

-- the caller's party in a transaction: seller, buyer, or null
create or replace function public.exitos_txn_party(p_txn uuid) returns text
language sql stable security definer set search_path = public as $$
  select case when t.seller_account_id = auth.uid()::text then 'seller' when t.buyer_account_id = auth.uid()::text then 'buyer' end
    from public.exitos_transactions t where t.id = p_txn $$;

-- ── creation ────────────────────────────────────────────────────────
create or replace function public.exitos_txn_create(p_offer text, p_nda uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare me text := auth.uid()::text; o public.exitos_offers; a public.exitos_nda_agreements; v_id uuid;
begin
  select * into o from public.exitos_offers where id = p_offer;
  if not found or not public.exitos_owns_listing(o.listing_id) then raise exception 'only the listing owner opens a transaction on its offer'; end if;
  if coalesce(o.data->>'status', 'submitted') <> 'accepted' then raise exception 'a transaction starts from an accepted offer'; end if;
  select * into a from public.exitos_nda_agreements where id = p_nda;
  if not found or a.listing_id <> o.listing_id or a.buyer_account_id <> o.buyer_account_id or a.owner_account_id <> me then
    raise exception 'the NDA must be between you and this buyer, on this listing';
  end if;
  if not public.exitos_nda_active(p_nda) then raise exception 'the buyer''s NDA must be executed and inside its access term'; end if;
  if a.transaction_id is not null then raise exception 'this NDA is already bound to a transaction'; end if;
  insert into public.exitos_transactions (listing_id, company_id, seller_account_id, buyer_account_id, offer_id, nda_agreement_id, price_usd, terms)
  values (o.listing_id, a.company_id, me, o.buyer_account_id, o.id, p_nda, (o.data->>'amountUsd')::numeric, coalesce(o.data->'terms', '{}'))
  returning id into v_id;
  update public.exitos_nda_agreements set transaction_id = v_id::text where id = p_nda;
  insert into public.exitos_transaction_items (transaction_id, gate, title, owner_party, source, created_by) values
    (v_id, 'signing', 'Definitive agreement in agreed form, approved by both parties'' counsel', 'both', 'standard', me),
    (v_id, 'signing', 'Disclosure letter or schedules delivered against the warranties', 'seller', 'standard', me),
    (v_id, 'signing', 'Shareholder approvals at the thresholds the company''s documents require', 'seller', 'standard', me),
    (v_id, 'signing', 'Buyer board or investment committee approval', 'buyer', 'standard', me),
    (v_id, 'closing', 'Regulatory clearances and third-party consents required for completion', 'both', 'standard', me),
    (v_id, 'closing', 'Bring-down of warranties at completion', 'seller', 'standard', me),
    (v_id, 'closing', 'Funds flow agreed, including escrow and any holdback', 'both', 'standard', me),
    (v_id, 'closing', 'Completion deliverables exchanged (resignations, share transfer forms, board minutes)', 'both', 'standard', me),
    (v_id, 'closing', 'Escrow agent engaged and escrow account opened', 'buyer', 'standard', me);
  perform public.exitos_txn_log(v_id, 'created', jsonb_build_object('offer', p_offer, 'nda', p_nda, 'priceUsd', o.data->>'amountUsd'));
  return v_id;
end $$;

-- ── items ───────────────────────────────────────────────────────────
create or replace function public.exitos_txn_add_item(p_txn uuid, p_gate text, p_title text, p_owner text, p_due date, p_required boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare t public.exitos_transactions; v_id uuid;
begin
  select * into t from public.exitos_transactions where id = p_txn;
  if not found or public.exitos_txn_party(p_txn) is null then raise exception 'no such transaction for you'; end if;
  if t.state = 'terminated' then raise exception 'this transaction has ended'; end if;
  if (p_gate = 'signing' and t.state <> 'negotiating') or (p_gate = 'closing' and t.state not in ('negotiating', 'signed')) then
    raise exception 'a % condition can no longer be added (the transaction is %)', p_gate, t.state;
  end if;
  insert into public.exitos_transaction_items (transaction_id, gate, title, owner_party, due_date, required, created_by)
  values (p_txn, p_gate, trim(p_title), p_owner, p_due, coalesce(p_required, true), auth.uid()::text) returning id into v_id;
  perform public.exitos_txn_log(p_txn, 'item_added', jsonb_build_object('item', v_id, 'gate', p_gate, 'title', p_title));
  return v_id;
end $$;

-- the owning party records evidence that an item is done; it then waits for the counterparty
create or replace function public.exitos_txn_evidence_item(p_item uuid, p_evidence jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare i public.exitos_transaction_items; t public.exitos_transactions; me text := auth.uid()::text; party text;
begin
  select * into i from public.exitos_transaction_items where id = p_item;
  if not found then raise exception 'no such item'; end if;
  select * into t from public.exitos_transactions where id = i.transaction_id;
  party := public.exitos_txn_party(t.id);
  if party is null then raise exception 'no such item for you'; end if;
  if i.owner_party <> 'both' and i.owner_party <> party then raise exception 'this item is the %''s to evidence', i.owner_party; end if;
  if t.state = 'terminated' or (i.gate = 'signing' and t.state <> 'negotiating') or (i.gate = 'closing' and t.state = 'closed') then
    raise exception 'this item can no longer change (the transaction is %)', t.state;
  end if;
  if i.status in ('satisfied', 'waived') then raise exception 'this item is already %', i.status; end if;
  if length(trim(coalesce(p_evidence->>'description', ''))) = 0 then raise exception 'describe the evidence (what was done, by whom, which document)'; end if;
  if p_evidence ? 'documentSha256' and coalesce(p_evidence->>'documentSha256', '') !~ '^[0-9a-f]{64}$' then raise exception 'a document hash must be a SHA-256'; end if;
  update public.exitos_transaction_items set status = 'evidenced', evidence = p_evidence || jsonb_build_object('party', party), evidenced_by = me, evidenced_at = now(),
         confirmed_by = null, confirmed_at = null where id = p_item;
  perform public.exitos_txn_log(t.id, 'item_evidenced', jsonb_build_object('item', p_item, 'party', party));
end $$;

-- the counterparty confirms (or rejects) evidence; it never confirms its own
create or replace function public.exitos_txn_confirm_item(p_item uuid, p_decision text, p_note text)
returns text language plpgsql security definer set search_path = public as $$
declare i public.exitos_transaction_items; me text := auth.uid()::text; party text; t public.exitos_transactions;
begin
  if p_decision not in ('confirm', 'reject') then raise exception 'confirm or reject'; end if;
  select * into i from public.exitos_transaction_items where id = p_item;
  if not found then raise exception 'no such item'; end if;
  select * into t from public.exitos_transactions where id = i.transaction_id;
  party := public.exitos_txn_party(t.id);
  if party is null then raise exception 'no such item for you'; end if;
  if i.status <> 'evidenced' then raise exception 'there is no evidence to review on this item'; end if;
  if i.evidenced_by = me then raise exception 'the counterparty confirms evidence, never the party that recorded it'; end if;
  if t.state = 'terminated' then raise exception 'this transaction has ended'; end if;
  if p_decision = 'confirm' then
    update public.exitos_transaction_items set status = 'satisfied', confirmed_by = me, confirmed_at = now(), note = nullif(trim(coalesce(p_note, '')), '') where id = p_item;
  else
    update public.exitos_transaction_items set status = 'open', note = nullif(trim(coalesce(p_note, '')), '') where id = p_item;
  end if;
  perform public.exitos_txn_log(t.id, 'item_' || p_decision || 'ed', jsonb_build_object('item', p_item, 'note', p_note));
  perform public.exitos_txn_try_advance(t.id);
  return p_decision;
end $$;

-- a waiver needs both parties: the first call asks, the other party's call grants
create or replace function public.exitos_txn_waive_item(p_item uuid, p_note text)
returns text language plpgsql security definer set search_path = public as $$
declare i public.exitos_transaction_items; me text := auth.uid()::text; t public.exitos_transactions;
begin
  select * into i from public.exitos_transaction_items where id = p_item;
  if not found then raise exception 'no such item'; end if;
  select * into t from public.exitos_transactions where id = i.transaction_id;
  if public.exitos_txn_party(t.id) is null then raise exception 'no such item for you'; end if;
  if t.state = 'terminated' then raise exception 'this transaction has ended'; end if;
  if i.status in ('satisfied', 'waived') then raise exception 'this item is already %', i.status; end if;
  if length(trim(coalesce(p_note, ''))) = 0 then raise exception 'state why the item is waived'; end if;
  if i.waiver_requested_by is null then
    update public.exitos_transaction_items set waiver_requested_by = me, note = trim(p_note) where id = p_item;
    perform public.exitos_txn_log(t.id, 'waiver_requested', jsonb_build_object('item', p_item, 'note', p_note));
    return 'requested';
  end if;
  if i.waiver_requested_by = me then raise exception 'a waiver needs the other party''s agreement'; end if;
  update public.exitos_transaction_items set status = 'waived', confirmed_by = me, confirmed_at = now(), note = coalesce(i.note, '') || ' / ' || trim(p_note) where id = p_item;
  perform public.exitos_txn_log(t.id, 'item_waived', jsonb_build_object('item', p_item));
  perform public.exitos_txn_try_advance(t.id);
  return 'waived';
end $$;

-- ── milestones ──────────────────────────────────────────────────────
create or replace function public.exitos_txn_confirm_milestone(p_txn uuid, p_milestone text, p_evidence jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare t public.exitos_transactions; v_party text := public.exitos_txn_party(p_txn); ev jsonb := coalesce(p_evidence, '{}');
begin
  select * into t from public.exitos_transactions where id = p_txn;
  if not found or v_party is null then raise exception 'no such transaction for you'; end if;
  if p_milestone = 'signing' then
    if t.state <> 'negotiating' then raise exception 'signing is confirmed while the transaction is negotiating (it is %)', t.state; end if;
    if length(trim(coalesce(ev->>'signatoryName', ''))) = 0 or coalesce(ev->>'documentSha256', '') !~ '^[0-9a-f]{64}$' then
      raise exception 'confirm signing with the signatory and the SHA-256 of the signed agreement';
    end if;
  elsif p_milestone = 'closing' then
    if t.state <> 'signed' then raise exception 'completion is confirmed after signing (the transaction is %)', t.state; end if;
    if coalesce(ev->>'amountUsd', '') !~ '^[0-9]+(\.[0-9]+)?$' or length(trim(coalesce(ev->>'reference', ''))) = 0 then
      raise exception 'confirm completion with the amount and a payment reference';
    end if;
  else raise exception 'the milestones are signing and closing'; end if;
  insert into public.exitos_transaction_confirmations (transaction_id, milestone, party, account_id, evidence)
  values (p_txn, p_milestone, v_party, auth.uid()::text, ev)
  on conflict (transaction_id, milestone, party) do update set evidence = excluded.evidence, account_id = excluded.account_id, confirmed_at = now();
  perform public.exitos_txn_log(p_txn, p_milestone || '_confirmed', jsonb_build_object('party', v_party));
  return public.exitos_txn_try_advance(p_txn);
end $$;

-- move the transaction on when everything a milestone needs is in place
create or replace function public.exitos_txn_try_advance(p_txn uuid) returns text
language plpgsql security definer set search_path = public as $$
declare t public.exitos_transactions; s jsonb; b jsonb; open_items int; ms text;
begin
  select * into t from public.exitos_transactions where id = p_txn for update;
  if t.state not in ('negotiating', 'signed') then return t.state; end if;
  ms := case t.state when 'negotiating' then 'signing' else 'closing' end;
  select evidence into s from public.exitos_transaction_confirmations where transaction_id = p_txn and milestone = ms and party = 'seller';
  select evidence into b from public.exitos_transaction_confirmations where transaction_id = p_txn and milestone = ms and party = 'buyer';
  if s is null or b is null then return t.state; end if;
  select count(*) into open_items from public.exitos_transaction_items
   where transaction_id = p_txn and gate = ms and required and status not in ('satisfied', 'waived');
  if open_items > 0 then return t.state; end if;
  if ms = 'signing' then
    if s->>'documentSha256' <> b->>'documentSha256' then
      perform public.exitos_txn_log(p_txn, 'signing_mismatch', jsonb_build_object('reason', 'the parties confirmed different agreement documents'));
      return t.state;
    end if;
    update public.exitos_transactions set state = 'signed', signed_at = now() where id = p_txn;
    perform public.exitos_txn_log(p_txn, 'signed', jsonb_build_object('documentSha256', s->>'documentSha256'));
    return 'signed';
  end if;
  if (s->>'amountUsd')::numeric <> (b->>'amountUsd')::numeric then
    perform public.exitos_txn_log(p_txn, 'closing_mismatch', jsonb_build_object('reason', 'the parties confirmed different amounts'));
    return t.state;
  end if;
  update public.exitos_transactions set state = 'closed', closed_at = now() where id = p_txn;
  -- post-closing obligations that follow from the accepted terms
  insert into public.exitos_transaction_items (transaction_id, gate, title, owner_party, due_date, source)
  select p_txn, 'post_closing', x.title, x.owner, x.due, 'from_terms' from (values
    (case when (t.terms->>'escrowPct') is not null then format('Release of the escrow (%s%% of the price) unless claims are notified', round((t.terms->>'escrowPct')::numeric * 100, 1)) end,
     'both', case when (t.terms->>'escrowMonths') is not null then (now() + make_interval(months => (t.terms->>'escrowMonths')::int))::date end),
    (case when (t.terms->>'earnoutPct') is not null then format('Earn-out measurement and payment (%s%% of the price)', round((t.terms->>'earnoutPct')::numeric * 100, 1)) end,
     'buyer', case when (t.terms->>'earnoutMonths') is not null then (now() + make_interval(months => (t.terms->>'earnoutMonths')::int))::date end),
    ('Confidentiality obligations under the NDA continue for its survival period', 'both',
     (select (now() + make_interval(months => a.survival_months))::date from public.exitos_nda_agreements a where a.id = t.nda_agreement_id))
  ) as x(title, owner, due) where x.title is not null;
  perform public.exitos_txn_log(p_txn, 'closed', jsonb_build_object('amountUsd', s->>'amountUsd'));
  return 'closed';
end $$;

create or replace function public.exitos_txn_terminate(p_txn uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.exitos_txn_party(p_txn) is null then raise exception 'no such transaction for you'; end if;
  if length(trim(coalesce(p_reason, ''))) = 0 then raise exception 'state why the transaction ends'; end if;
  update public.exitos_transactions set state = 'terminated', ended_at = now(), ended_by = auth.uid()::text, end_reason = p_reason
   where id = p_txn and state in ('negotiating', 'signed');
  if not found then raise exception 'only a transaction that has not closed can be terminated'; end if;
  perform public.exitos_txn_log(p_txn, 'terminated', jsonb_build_object('reason', p_reason));
end $$;

-- ── buyer access becomes transaction-scoped once a transaction exists ──
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
  if a.transaction_id is not null and not exists (select 1 from public.exitos_transactions t where t.id::text = a.transaction_id
       and t.buyer_account_id = a.buyer_account_id and t.state in ('negotiating', 'signed', 'closed')) then
    raise exception 'the transaction this NDA belongs to has ended';
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
  if a.transaction_id is not null and not exists (select 1 from public.exitos_transactions t where t.id::text = a.transaction_id
       and t.buyer_account_id = a.buyer_account_id and t.state in ('negotiating', 'signed', 'closed')) then
    raise exception 'the transaction this NDA belongs to has ended';
  end if;
  select d.storage_path into v_path from public.exit_data_room_documents d
   where d.id = p_file and d.tenant_id::text = a.owner_account_id and d.company_id = a.company_id and d.disclosure = 'post_nda'
     and d.review_state <> 'rejected' and (a.scope_room_kinds is null or d.room_kind = any (a.scope_room_kinds));
  if v_path is null then raise exception 'this file is not disclosed to you under this NDA'; end if;
  perform public.exitos_nda_log(p_agreement, 'file_downloaded', jsonb_build_object('file', p_file));
  return v_path;
end $$;

-- ── privileges ──────────────────────────────────────────────────────
revoke all on public.exitos_transactions, public.exitos_transaction_items, public.exitos_transaction_confirmations, public.exitos_transaction_events from anon, authenticated;
grant select on public.exitos_transactions, public.exitos_transaction_items, public.exitos_transaction_confirmations, public.exitos_transaction_events to authenticated;
revoke all on sequence public.exitos_transaction_events_id_seq from anon, authenticated;
revoke all on function public.exitos_txn_log(uuid, text, jsonb), public.exitos_txn_try_advance(uuid) from public, anon, authenticated;
revoke all on function public.exitos_txn_party(uuid), public.exitos_txn_create(text, uuid), public.exitos_txn_add_item(uuid, text, text, text, date, boolean),
  public.exitos_txn_evidence_item(uuid, jsonb), public.exitos_txn_confirm_item(uuid, text, text), public.exitos_txn_waive_item(uuid, text),
  public.exitos_txn_confirm_milestone(uuid, text, jsonb), public.exitos_txn_terminate(uuid, text) from public, anon;
grant execute on function public.exitos_txn_party(uuid), public.exitos_txn_create(text, uuid), public.exitos_txn_add_item(uuid, text, text, text, date, boolean),
  public.exitos_txn_evidence_item(uuid, jsonb), public.exitos_txn_confirm_item(uuid, text, text), public.exitos_txn_waive_item(uuid, text),
  public.exitos_txn_confirm_milestone(uuid, text, jsonb), public.exitos_txn_terminate(uuid, text) to authenticated;
