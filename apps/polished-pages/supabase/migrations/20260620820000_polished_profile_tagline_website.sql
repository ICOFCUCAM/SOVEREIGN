-- Author Profiles 2.0: add an optional tagline and website to creator profiles
-- and thread them through the profile RPCs.
ALTER TABLE polished.creator_profiles ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE polished.creator_profiles ADD COLUMN IF NOT EXISTS website text;

DROP FUNCTION IF EXISTS public.polished_get_my_profile();
CREATE FUNCTION public.polished_get_my_profile()
RETURNS TABLE(display_name text, bio text, tagline text, website text)
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public', 'polished'
AS $function$
  select p.display_name, p.bio, p.tagline, p.website
  from polished.creator_profiles p where p.user_id = auth.uid();
$function$;

DROP FUNCTION IF EXISTS public.polished_upsert_profile(text, text);
CREATE FUNCTION public.polished_upsert_profile(p_display_name text, p_bio text, p_tagline text DEFAULT null, p_website text DEFAULT null)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'polished'
AS $function$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_display_name), '') = '' then raise exception 'display name required'; end if;
  insert into polished.creator_profiles(user_id, display_name, bio, tagline, website, updated_at)
    values (auth.uid(), btrim(p_display_name), nullif(btrim(p_bio), ''), nullif(btrim(p_tagline), ''), nullif(btrim(p_website), ''), now())
  on conflict (user_id) do update set
    display_name = excluded.display_name, bio = excluded.bio,
    tagline = excluded.tagline, website = excluded.website, updated_at = now();
end; $function$;

CREATE OR REPLACE FUNCTION public.polished_get_author_profile(p_name text)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public', 'polished'
AS $function$
  select jsonb_build_object(
    'display_name', p_name,
    'bio', (select pr.bio from polished.creator_profiles pr where pr.display_name = p_name and pr.bio is not null order by pr.updated_at desc limit 1),
    'tagline', (select pr.tagline from polished.creator_profiles pr where pr.display_name = p_name and pr.tagline is not null order by pr.updated_at desc limit 1),
    'website', (select pr.website from polished.creator_profiles pr where pr.display_name = p_name and pr.website is not null order by pr.updated_at desc limit 1),
    'verified', coalesce((select bool_or(pr.verified) from polished.creator_profiles pr where pr.display_name = p_name), false),
    'works', coalesce(count(*), 0),
    'views', coalesce(sum(d.view_count), 0),
    'downloads', coalesce(sum(d.download_count), 0)
  )
  from polished.documents d
  where d.author_name = p_name and d.listed = true and d.shared = true and d.share_token is not null;
$function$;
