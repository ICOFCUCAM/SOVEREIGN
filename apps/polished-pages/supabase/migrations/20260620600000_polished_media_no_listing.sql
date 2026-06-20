-- Security: the polished-media bucket is public, so images are served by their
-- public object URL (the app reads only via getPublicUrl). The broad SELECT
-- policy additionally let anyone LIST/enumerate every file in the bucket
-- (including images from unpublished drafts). Public URL access does not need
-- it, so drop it to stop enumeration without affecting image display or upload.
drop policy if exists "polished_media_read" on storage.objects;
