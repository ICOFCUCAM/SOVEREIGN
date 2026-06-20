-- Track where a document has been published outside the built-in catalog
-- (e.g. the Wankong store). The Polished Pages catalog stays the primary
-- destination; this records each external channel a title has been pushed to,
-- so the library can show its status and re-publishing updates in place.

create table if not exists polished.external_listings (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references polished.documents(id) on delete cascade,
  user_id      uuid not null,
  channel      text not null,
  external_id  text,
  external_url text,
  status       text not null default 'pending',
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (document_id, channel)
);

create index if not exists external_listings_user_idx on polished.external_listings(user_id);

-- Record (or update) an external listing for a document. Written by the
-- publish edge function under the service role, so the owner is derived from
-- the document row rather than auth.uid().
create or replace function public.polished_record_external_listing(
  p_doc_id uuid,
  p_channel text,
  p_external_id text default null,
  p_external_url text default null,
  p_status text default 'live'
) returns void
language plpgsql security definer set search_path to 'public','polished' as $$
declare v_owner uuid;
begin
  select user_id into v_owner from polished.documents where id = p_doc_id;
  if v_owner is null then raise exception 'document not found'; end if;

  insert into polished.external_listings (document_id, user_id, channel, external_id, external_url, status)
  values (p_doc_id, v_owner, p_channel, p_external_id, p_external_url, coalesce(p_status, 'live'))
  on conflict (document_id, channel) do update
    set external_id  = excluded.external_id,
        external_url = excluded.external_url,
        status       = excluded.status,
        error        = null,
        updated_at   = now();
end; $$;

revoke all on function public.polished_record_external_listing(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.polished_record_external_listing(uuid, text, text, text, text) to service_role;

-- The owner reads the external listings for one of their documents (for the
-- library status UI).
create or replace function public.polished_external_listings(p_doc_id uuid)
returns table(channel text, external_id text, external_url text, status text, updated_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select e.channel, e.external_id, e.external_url, e.status, e.updated_at
  from polished.external_listings e
  join polished.documents d on d.id = e.document_id
  where e.document_id = p_doc_id and d.user_id = auth.uid()
  order by e.updated_at desc;
$$;

revoke all on function public.polished_external_listings(uuid) from public, anon;
grant execute on function public.polished_external_listings(uuid) to authenticated;
