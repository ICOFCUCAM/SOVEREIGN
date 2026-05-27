-- Sovereign OS — add the four-class taxonomy to the pipeline.
-- cinematic | operational | strategic | crisis

alter table public.pipeline_jobs
  add column if not exists media_class text;

create index if not exists pipeline_jobs_media_class_idx
  on public.pipeline_jobs (media_class);
