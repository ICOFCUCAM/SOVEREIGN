-- ExitOS · the company story, and independent verification of its claims.
--
-- 1. exitos_company_stories — one row per owner and company: the founder's
--    history, products, customers, market, people, ownership, financial history
--    and sources, saved as they go (partial is fine). Owner-only, plus read
--    access for a reviewer the owner has engaged. A story can never mark its
--    own figures "verified": that status exists only as a verification record.
--
-- 2. Verification model (owner decision, 14 October 2026):
--    - a founder submits, amends and attaches evidence, but cannot verify their own claims;
--    - an authorised professional reviewer verifies specific claims within their
--      competence (financial, legal, commercial), for a company that engaged them;
--    - ExitOS's own format, calculation and consistency checks are not verification;
--    - counsel review of legal matters does not verify financial or commercial claims;
--    - a platform administrator (operator grant) manages reviewer authorisations but
--      does not thereby gain authority to verify, and cannot authorise themselves.
--    exitos_reviewer_authorizations  who may verify, in which competence, until when (operator-managed)
--    exitos_review_engagements       which reviewer a company has engaged, for which competence (owner-managed)
--    exitos_verifications            one record per verified claim: reviewer, role, evidence, scope,
--                                    limitations, timestamp, expiry, revalidation trigger, and a snapshot
--                                    of the claim's value; marked stale automatically when the value changes
--    Records are written only through exitos_record_verification(), which checks all of the above.
--
-- Rollback (nothing else depends on these objects):
--   drop function public.exitos_record_verification(text, text, text, text, text, jsonb, text, text, timestamptz, text);
--   drop function public.exitos_revoke_verification(uuid, text);
--   drop function public.exitos_authorize_reviewer(text, text, timestamptz, text);
--   drop function public.exitos_revoke_reviewer(text, text); drop function public.exitos_reviewer_by_email(text);
--   drop trigger exitos_company_stories_guard on public.exitos_company_stories;
--   drop trigger exitos_company_stories_staleness on public.exitos_company_stories;
--   drop function public.exitos_company_stories_guard(); drop function public.exitos_company_stories_staleness();
--   drop function public.exitos_story_claim(jsonb, text); drop function public.exitos_claim_competence(text);
--   drop table public.exitos_verifications; drop table public.exitos_review_engagements;
--   drop table public.exitos_reviewer_authorizations; drop table public.exitos_company_stories;

-- ── stories ─────────────────────────────────────────────────────────
create table if not exists public.exitos_company_stories (
  owner_account_id  text not null default auth.uid()::text,
  company_id        text not null check (company_id ~ '^co-[0-9a-f-]{36}$'),
  revision          integer not null default 1 check (revision >= 1),
  updated_at        timestamptz not null default now(),
  data              jsonb not null check (jsonb_typeof(data) = 'object' and data->>'version' = '1'),
  primary key (owner_account_id, company_id)
);
alter table public.exitos_company_stories enable row level security;

-- ── reviewers and engagements ───────────────────────────────────────
create table if not exists public.exitos_reviewer_authorizations (
  account_id     text not null,
  competence     text not null check (competence in ('financial', 'legal', 'commercial')),
  reviewer_name  text not null check (length(trim(reviewer_name)) > 0),
  reviewer_role  text not null check (length(trim(reviewer_role)) > 0),   -- e.g. "Chartered accountant, Example LLP"
  authorized_by  text not null,
  authorized_at  timestamptz not null default now(),
  expires_at     timestamptz,
  revoked_at     timestamptz,
  note           text,
  primary key (account_id, competence),
  check (authorized_by <> account_id)
);
alter table public.exitos_reviewer_authorizations enable row level security;

create table if not exists public.exitos_review_engagements (
  id                   uuid primary key default gen_random_uuid(),
  owner_account_id     text not null default auth.uid()::text,
  company_id           text not null,
  reviewer_account_id  text not null,
  competence           text not null check (competence in ('financial', 'legal', 'commercial')),
  granted_at           timestamptz not null default now(),
  revoked_at           timestamptz,
  check (reviewer_account_id <> owner_account_id)
);
create unique index if not exists exitos_review_engagements_active on public.exitos_review_engagements (owner_account_id, company_id, reviewer_account_id, competence) where revoked_at is null;
alter table public.exitos_review_engagements enable row level security;

create table if not exists public.exitos_verifications (
  id                   uuid primary key default gen_random_uuid(),
  owner_account_id     text not null,
  company_id           text not null,
  claim                text not null check (claim ~ '^(figure|annual|market):.+$' or claim in ('retention:gross', 'cap')),
  claim_value          jsonb not null,
  reviewer_account_id  text not null,
  reviewer_name        text not null,
  reviewer_role        text not null,
  competence           text not null check (competence in ('financial', 'legal', 'commercial')),
  evidence             jsonb not null check (jsonb_typeof(evidence) = 'array' and jsonb_array_length(evidence) >= 1),
  scope                text not null check (length(trim(scope)) > 0),
  limitations          text,
  verified_at          timestamptz not null default now(),
  expires_at           timestamptz,
  revalidate_when      text,
  stale_at             timestamptz,
  revoked_at           timestamptz,
  revoked_reason       text,
  check (reviewer_account_id <> owner_account_id)
);
create index if not exists exitos_verifications_company on public.exitos_verifications (owner_account_id, company_id);
alter table public.exitos_verifications enable row level security;

-- ── helpers ─────────────────────────────────────────────────────────
-- the claim's current value in a story (mirrors exit-engines story.ts claimValue)
create or replace function public.exitos_story_claim(d jsonb, claim text) returns jsonb
language sql immutable set search_path = public as $$
  select case
    when claim like 'figure:%' then d->'figures'->substr(claim, 8)
    when claim like 'annual:%' then (select e - 'meta' from jsonb_array_elements(coalesce(d->'financials'->'annual', '[]')) e where e->>'period' = substr(claim, 8) limit 1)
    when claim like 'market:%' then (select e - 'meta' from jsonb_array_elements(coalesce(d->'market'->'estimates', '[]')) e where e->>'label' = substr(claim, 8) limit 1)
    when claim = 'retention:gross' then d->'customers'->'grossRetentionPct'
    when claim = 'cap' then d->'capitalization'->'holders'
  end $$;

create or replace function public.exitos_claim_competence(claim text) returns text[]
language sql immutable set search_path = public as $$
  select case when claim = 'cap' then array['legal', 'financial'] when claim like 'market:%' then array['commercial'] else array['financial'] end $$;

-- ── policies ────────────────────────────────────────────────────────
-- stories: the owner; and a reviewer the owner has engaged (read only)
create policy exitos_company_stories_read on public.exitos_company_stories for select to authenticated using (
  owner_account_id = auth.uid()::text
  or exists (select 1 from public.exitos_review_engagements g
             where g.owner_account_id = exitos_company_stories.owner_account_id and g.company_id = exitos_company_stories.company_id
               and g.reviewer_account_id = auth.uid()::text and g.revoked_at is null)
);
create policy exitos_company_stories_insert on public.exitos_company_stories for insert to authenticated
  with check (owner_account_id = auth.uid()::text);
create policy exitos_company_stories_update on public.exitos_company_stories for update to authenticated
  using (owner_account_id = auth.uid()::text) with check (owner_account_id = auth.uid()::text);
create policy exitos_company_stories_delete on public.exitos_company_stories for delete to authenticated
  using (owner_account_id = auth.uid()::text);

-- authorisations: the reviewer sees their own; operators see all; writes only through the functions
create policy exitos_reviewer_auth_read on public.exitos_reviewer_authorizations for select to authenticated
  using (account_id = auth.uid()::text or public.exitos_has_role('operator'));

-- engagements: the owner manages their own; the reviewer sees the ones naming them
create policy exitos_engagements_read on public.exitos_review_engagements for select to authenticated
  using (owner_account_id = auth.uid()::text or reviewer_account_id = auth.uid()::text);
create policy exitos_engagements_insert on public.exitos_review_engagements for insert to authenticated
  with check (owner_account_id = auth.uid()::text and revoked_at is null);
create policy exitos_engagements_revoke on public.exitos_review_engagements for update to authenticated
  using (owner_account_id = auth.uid()::text) with check (owner_account_id = auth.uid()::text);

-- verifications: the company owner and the recording reviewer read; nobody writes directly
create policy exitos_verifications_read on public.exitos_verifications for select to authenticated
  using (owner_account_id = auth.uid()::text or reviewer_account_id = auth.uid()::text);

-- ── triggers ────────────────────────────────────────────────────────
create or replace function public.exitos_company_stories_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- "verified" exists only as a verification record, never inside a story — from anyone
  if new.data @? '$.** ? (@.provenance == "verified")' then
    raise exception 'a story cannot mark a figure verified; verification is recorded separately by an authorised reviewer';
  end if;
  new.updated_at := now();
  if tg_op = 'UPDATE' then new.revision := old.revision + 1; end if;
  return new;
end $$;
revoke all on function public.exitos_company_stories_guard() from public, anon, authenticated;
create trigger exitos_company_stories_guard before insert or update on public.exitos_company_stories
  for each row execute function public.exitos_company_stories_guard();

-- a verified claim whose value changes, or whose cited evidence document changes or is removed, is stale: it must be reconsidered
create or replace function public.exitos_company_stories_staleness() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.exitos_verifications v set stale_at = now()
   where v.owner_account_id = new.owner_account_id and v.company_id = new.company_id
     and v.stale_at is null and v.revoked_at is null
     and (public.exitos_story_claim(new.data, v.claim) is distinct from v.claim_value
          or exists (select 1 from jsonb_array_elements(v.evidence) e where e ? 'source'
                     and (select d from jsonb_array_elements(coalesce(new.data->'sources', '[]')) d where d->>'id' = e->>'sourceId' limit 1)
                         is distinct from e->'source'));
  return new;
end $$;
revoke all on function public.exitos_company_stories_staleness() from public, anon, authenticated;
create trigger exitos_company_stories_staleness after update on public.exitos_company_stories
  for each row execute function public.exitos_company_stories_staleness();

-- ── functions ───────────────────────────────────────────────────────
-- operators authorise reviewers (never themselves); authorising does not let the operator verify
create or replace function public.exitos_authorize_reviewer(p_account text, p_competence text, p_expires timestamptz, p_name_role text)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text := split_part(p_name_role, '|', 1); v_role text := split_part(p_name_role, '|', 2);
begin
  if not public.exitos_has_role('operator') then raise exception 'only an operator manages reviewer authorisations'; end if;
  if p_account = auth.uid()::text then raise exception 'an operator cannot authorise themselves as a reviewer'; end if;
  if length(trim(v_name)) = 0 or length(trim(v_role)) = 0 then raise exception 'a reviewer needs a name and a professional role ("Name|Role")'; end if;
  insert into public.exitos_reviewer_authorizations (account_id, competence, reviewer_name, reviewer_role, authorized_by, expires_at)
  values (p_account, p_competence, trim(v_name), trim(v_role), auth.uid()::text, p_expires)
  on conflict (account_id, competence) do update set reviewer_name = excluded.reviewer_name, reviewer_role = excluded.reviewer_role,
    authorized_by = excluded.authorized_by, authorized_at = now(), expires_at = excluded.expires_at, revoked_at = null;
end $$;

create or replace function public.exitos_revoke_reviewer(p_account text, p_competence text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.exitos_has_role('operator') then raise exception 'only an operator manages reviewer authorisations'; end if;
  update public.exitos_reviewer_authorizations set revoked_at = now() where account_id = p_account and competence = p_competence;
end $$;

-- an authorised, engaged reviewer records one verification, with evidence and scope
create or replace function public.exitos_record_verification(
  p_owner text, p_company text, p_claim text, p_competence text, p_scope text,
  p_evidence jsonb, p_limitations text, p_revalidate_when text, p_expires timestamptz, p_note text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare me text := auth.uid()::text; a public.exitos_reviewer_authorizations; v_data jsonb; v_value jsonb; v_evidence jsonb; v_id uuid;
begin
  if me is null then raise exception 'sign in to record a verification'; end if;
  if me = p_owner then raise exception 'a company cannot verify its own claims'; end if;
  if not (p_competence = any (public.exitos_claim_competence(p_claim))) then raise exception 'this claim needs % competence', array_to_string(public.exitos_claim_competence(p_claim), ' or '); end if;
  select * into a from public.exitos_reviewer_authorizations
   where account_id = me and competence = p_competence and revoked_at is null and (expires_at is null or expires_at > now());
  if not found then raise exception 'no current % reviewer authorisation', p_competence; end if;
  if not exists (select 1 from public.exitos_review_engagements where owner_account_id = p_owner and company_id = p_company
                 and reviewer_account_id = me and competence = p_competence and revoked_at is null) then
    raise exception 'the company has not engaged you for % review', p_competence;
  end if;
  if p_evidence is null or jsonb_typeof(p_evidence) <> 'array' or jsonb_array_length(p_evidence) = 0
     or exists (select 1 from jsonb_array_elements(p_evidence) e where length(trim(coalesce(e->>'description', ''))) = 0) then
    raise exception 'a verification must record the evidence reviewed';
  end if;
  if length(trim(coalesce(p_scope, ''))) = 0 then raise exception 'a verification must state its scope'; end if;
  select s.data into v_data from public.exitos_company_stories s where s.owner_account_id = p_owner and s.company_id = p_company;
  v_value := public.exitos_story_claim(v_data, p_claim);
  if v_value is null or v_value = 'null'::jsonb then raise exception 'there is no value for % to verify', p_claim; end if;
  -- evidence citing an attached source document keeps a snapshot of it: if the document changes, the verification goes stale
  if exists (select 1 from jsonb_array_elements(p_evidence) e where e ? 'sourceId'
             and not exists (select 1 from jsonb_array_elements(coalesce(v_data->'sources', '[]')) d where d->>'id' = e->>'sourceId')) then
    raise exception 'the evidence cites a source document that is not attached to the story';
  end if;
  select jsonb_agg(case when e ? 'sourceId'
           then e || jsonb_build_object('source', (select d from jsonb_array_elements(v_data->'sources') d where d->>'id' = e->>'sourceId' limit 1))
           else e end) into v_evidence
    from jsonb_array_elements(p_evidence) e;
  insert into public.exitos_verifications (owner_account_id, company_id, claim, claim_value, reviewer_account_id, reviewer_name, reviewer_role,
    competence, evidence, scope, limitations, expires_at, revalidate_when)
  values (p_owner, p_company, p_claim, v_value, me, a.reviewer_name, a.reviewer_role, p_competence, v_evidence, trim(p_scope),
    nullif(trim(coalesce(p_limitations, '')), ''), p_expires, nullif(trim(coalesce(p_revalidate_when, '')), ''))
  returning id into v_id;
  return v_id;
end $$;

-- the recording reviewer withdraws a verification (the owner cannot erase one)
create or replace function public.exitos_revoke_verification(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.exitos_verifications set revoked_at = now(), revoked_reason = p_reason
   where id = p_id and reviewer_account_id = auth.uid()::text and revoked_at is null;
  if not found then raise exception 'no such verification of yours'; end if;
end $$;

-- an owner looks up an authorised reviewer by e-mail to engage them; only authorised reviewers are found
create or replace function public.exitos_reviewer_by_email(p_email text)
returns table (account_id text, competence text, reviewer_name text, reviewer_role text)
language sql stable security definer set search_path = public, auth as $$
  select a.account_id, a.competence, a.reviewer_name, a.reviewer_role
    from public.exitos_reviewer_authorizations a join auth.users u on u.id::text = a.account_id
   where auth.uid() is not null and lower(u.email) = lower(trim(p_email))
     and a.revoked_at is null and (a.expires_at is null or a.expires_at > now()) $$;

-- table privileges (Supabase grants everything to anon and authenticated by default; RLS is the
-- second line, not the only one): anon gets nothing; verification and authorisation records are
-- written only through the checked functions above
revoke all on public.exitos_company_stories, public.exitos_reviewer_authorizations,
              public.exitos_review_engagements, public.exitos_verifications from anon, authenticated;
grant select, insert, update, delete on public.exitos_company_stories to authenticated;
grant select, insert, update (revoked_at) on public.exitos_review_engagements to authenticated;
grant select on public.exitos_reviewer_authorizations, public.exitos_verifications to authenticated;
revoke all on function public.exitos_story_claim(jsonb, text), public.exitos_claim_competence(text) from anon;
revoke all on function public.exitos_reviewer_by_email(text) from public, anon;
grant execute on function public.exitos_reviewer_by_email(text) to authenticated;
revoke all on function public.exitos_authorize_reviewer(text, text, timestamptz, text) from public, anon;
revoke all on function public.exitos_revoke_reviewer(text, text) from public, anon;
revoke all on function public.exitos_record_verification(text, text, text, text, text, jsonb, text, text, timestamptz, text) from public, anon;
revoke all on function public.exitos_revoke_verification(uuid, text) from public, anon;
grant execute on function public.exitos_authorize_reviewer(text, text, timestamptz, text) to authenticated;
grant execute on function public.exitos_revoke_reviewer(text, text) to authenticated;
grant execute on function public.exitos_record_verification(text, text, text, text, text, jsonb, text, text, timestamptz, text) to authenticated;
grant execute on function public.exitos_revoke_verification(uuid, text) to authenticated;
