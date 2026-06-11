-- Channel media · real video assets.
--
-- The film pipeline (render-video / orchestrate-film / poll-video-jobs)
-- finalizes renders into storage and records the public URL on
-- pipeline_jobs.result_url — but the public Channel could only play
-- manually-entered YouTube ids. This migration makes public.media a
-- first-class video asset table so generated films flow to the site:
--
--   pipeline_jobs (done) ──publish──▶ media.video_url ──▶ Channel / homepage
--
-- Idempotent: creates the table when absent, otherwise only adds columns.

create table if not exists public.media (
  id           uuid primary key default gen_random_uuid(),
  media_class  text not null,                 -- cinematic | operational | strategic | crisis
  kind         text not null default 'episode', -- feature | episode
  title        text not null,
  meta         text,
  length       text,                          -- display duration, e.g. "2:40"
  youtube_id   text,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.media add column if not exists video_url        text;
alter table public.media add column if not exists poster_url       text;
alter table public.media add column if not exists duration_seconds int;
alter table public.media add column if not exists source_job_id    uuid;
alter table public.media add column if not exists published        boolean not null default true;
alter table public.media add column if not exists updated_at       timestamptz not null default now();

create index if not exists media_class_kind_idx
  on public.media (media_class, kind, sort_order);
create index if not exists media_published_idx
  on public.media (published, created_at desc);

-- Public surfaces read published rows anonymously; writes stay key-holder only.
alter table public.media enable row level security;

drop policy if exists "media public read" on public.media;
create policy "media public read" on public.media
  for select using (published = true);

drop policy if exists "media authenticated read" on public.media;
create policy "media authenticated read" on public.media
  for select to authenticated using (true);

drop policy if exists "media authenticated write" on public.media;
create policy "media authenticated write" on public.media
  for all to authenticated using (true) with check (true);
