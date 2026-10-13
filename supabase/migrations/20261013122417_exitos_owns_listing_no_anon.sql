-- exitos_owns_listing is for the authenticated role's read policies only; Supabase's default
-- privileges also granted it to anon, which has no use for it (flagged by the security advisor).
revoke execute on function public.exitos_owns_listing(text) from anon;
revoke execute on function public.exitos_listings_public_only() from anon, authenticated;
