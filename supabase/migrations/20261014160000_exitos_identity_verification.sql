-- ExitOS · identity verification before listing a company.
--
-- A founder proves who they are once, with Stripe Identity (document + selfie, worldwide) or a
-- national eID through an OIDC broker (BankID Norway and Sweden, MitID, Finnish Trust Network,
-- itsme, iDIN, ...). The edge function exit-identity runs the provider flow and writes the result
-- here with the service role; clients can read their own rows and cannot write any.
--
-- Listing is gated in the database: a signed-in account can create or change its listing only while
-- it holds a current verification, and the listing is stamped by the server with the method and
-- date (data.verification), overwriting anything a client sent. Withdrawing is never gated.
-- ExitOS stores no document image, personal number or date of birth: the provider keeps those. Only
-- the method, the country it reports, a hash of the provider's subject (to spot one person behind
-- several accounts) and the dates are kept.
--
-- Rollback:
--   drop trigger exitos_listings_identity_gate on public.exitos_listings; drop function public.exitos_listings_identity_gate();
--   drop function public.exitos_identity_of(uuid); drop table public.exitos_identity_verifications;

create table if not exists public.exitos_identity_verifications (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null,
  provider      text not null check (provider in (
                  'stripe_identity', 'no_bankid', 'se_bankid', 'dk_mitid', 'fi_ftn', 'be_itsme',
                  'nl_idin', 'de_eid', 'fr_franceconnect', 'ee_smartid')),
  status        text not null default 'pending' check (status in ('pending', 'verified', 'failed', 'canceled')),
  provider_ref  text,            -- Stripe VerificationSession id, or the OIDC state
  nonce         text,            -- OIDC nonce (eID flows)
  country       text,            -- as the provider reports it
  subject_hash  text,            -- sha256(issuer | subject); never the subject itself
  failure       text,
  created_at    timestamptz not null default now(),
  verified_at   timestamptz,
  expires_at    timestamptz,
  constraint exitos_idv_verified_has_dates check (status <> 'verified' or (verified_at is not null and expires_at is not null))
);
create index if not exists exitos_idv_account on public.exitos_identity_verifications (account_id, status);
create unique index if not exists exitos_idv_ref on public.exitos_identity_verifications (provider, provider_ref) where provider_ref is not null;

alter table public.exitos_identity_verifications enable row level security;
-- reads: one's own rows, and only the columns that describe the result (not the flow secrets)
revoke all on public.exitos_identity_verifications from anon, authenticated;
grant select (id, account_id, provider, status, country, failure, created_at, verified_at, expires_at)
  on public.exitos_identity_verifications to authenticated;
create policy exitos_idv_read on public.exitos_identity_verifications for select to authenticated using (account_id = auth.uid());
-- no insert / update / delete policy: only the service role (the edge function) writes

/** The account's current verification as the public stamp a listing carries, or null. */
create or replace function public.exitos_identity_of(p_account uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('provider', v.provider, 'verifiedAt', v.verified_at)
    from public.exitos_identity_verifications v
   where v.account_id = p_account and v.status = 'verified' and v.expires_at > now()
   order by v.verified_at desc limit 1;
$$;
revoke all on function public.exitos_identity_of(uuid) from public, anon, authenticated;

create or replace function public.exitos_listings_identity_gate()
returns trigger language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  -- a client write (a signed-in account): the account must be verified, and the server stamps the listing
  if auth.uid() is not null then
    v := public.exitos_identity_of(auth.uid());
    if v is null then
      raise exception 'verify your identity before listing a company' using errcode = '42501';
    end if;
    new.data := jsonb_set(coalesce(new.data, '{}'::jsonb), '{verification}', v);
  end if;
  return new;
end;
$$;
create or replace trigger exitos_listings_identity_gate before insert or update on public.exitos_listings
  for each row execute function public.exitos_listings_identity_gate();
