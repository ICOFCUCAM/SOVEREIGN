-- ExitOS · listing-desk promotions: video slides (O-23, part 2)
-- A campaign may carry a short muted video (MP4 or WebM) shown in place of its picture; the picture
-- stays required and is the video's cover frame and its fallback. Videos live in the same private
-- bucket under the same rule: a signed link only for a live campaign's file, or to an operator.

alter table public.exitos_ad_campaigns add column if not exists video_path text;
do $c$ begin
  if not exists (select 1 from pg_constraint where conname = 'exitos_ad_campaigns_video_path_check') then
    alter table public.exitos_ad_campaigns add constraint exitos_ad_campaigns_video_path_check
      check (video_path is null or video_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(mp4|webm)$');
  end if;
end $c$;

-- the bucket takes videos too; 25 MB per file (images are still held to 5 MB by the manager)
update storage.buckets
   set file_size_limit = 26214400,
       allowed_mime_types = array['image/webp','image/jpeg','image/png','image/avif','video/mp4','video/webm']
 where id = 'exitos-ads';

/** A file a live campaign shows, picture or video (so any signed-in viewer may be given a link to it). */
create or replace function public.exitos_ad_image_live(p_path text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.exitos_ad_campaigns c
    where (c.image_path = p_path or c.video_path = p_path) and public.exitos_ad_is_live(c)); $$;

alter policy exitos_ads_write on storage.objects
  with check (bucket_id = 'exitos-ads' and public.exitos_has_role('operator')
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|jpeg|png|avif|mp4|webm)$');
