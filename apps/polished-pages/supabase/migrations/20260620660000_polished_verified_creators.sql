-- Marketplace trust: verified-creator badge, curated by an admin (polished.admins).
alter table polished.creator_profiles add column if not exists verified boolean not null default false;

create or replace function public.polished_admin_verify_creator(p_display_name text, p_verified boolean)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if not exists (select 1 from polished.admins where user_id = auth.uid()) then raise exception 'not authorized'; end if;
  update polished.creator_profiles set verified = coalesce(p_verified, false), updated_at = now()
    where display_name = p_display_name;
end; $$;

create or replace function public.polished_get_author_profile(p_name text)
returns jsonb language sql security definer set search_path to 'public','polished' as $$
  select jsonb_build_object(
    'display_name', p_name,
    'bio', (select pr.bio from polished.creator_profiles pr where pr.display_name = p_name and pr.bio is not null order by pr.updated_at desc limit 1),
    'verified', coalesce((select bool_or(pr.verified) from polished.creator_profiles pr where pr.display_name = p_name), false),
    'works', coalesce(count(*), 0),
    'views', coalesce(sum(d.view_count), 0),
    'downloads', coalesce(sum(d.download_count), 0)
  )
  from polished.documents d
  where d.author_name = p_name and d.listed = true and d.shared = true and d.share_token is not null;
$$;

revoke all on function public.polished_admin_verify_creator(text, boolean) from public, anon;
grant execute on function public.polished_admin_verify_creator(text, boolean) to authenticated;
grant execute on function public.polished_get_author_profile(text) to anon, authenticated;
