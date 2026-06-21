-- Batch read of the caller's external listings across all their documents, so
-- the library can show per-document store status in one query instead of one
-- per card. Owner-scoped by auth.uid(); mirrors polished_external_listings but
-- for the whole library.
create or replace function public.polished_external_listings_all()
returns table(document_id uuid, channel text, external_id text, external_url text, status text, updated_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select e.document_id, e.channel, e.external_id, e.external_url, e.status, e.updated_at
  from polished.external_listings e
  where e.user_id = auth.uid();
$$;

revoke all on function public.polished_external_listings_all() from public, anon;
grant execute on function public.polished_external_listings_all() to authenticated;
