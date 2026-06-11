-- Pipeline jobs · row security for the public render queue.
--
-- The Films page, Channel hero and Emergency AI landing surface the live
-- production feed (processing/done counts and titles) to anonymous
-- visitors. Failed jobs and their error payloads stay operator-only.
-- Edge functions use the service role and are unaffected.

alter table public.pipeline_jobs enable row level security;

drop policy if exists "pipeline public read" on public.pipeline_jobs;
create policy "pipeline public read" on public.pipeline_jobs
  for select using (status in ('processing', 'done'));

drop policy if exists "pipeline authenticated read" on public.pipeline_jobs;
create policy "pipeline authenticated read" on public.pipeline_jobs
  for select to authenticated using (true);
