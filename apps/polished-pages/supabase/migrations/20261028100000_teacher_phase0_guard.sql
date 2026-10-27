-- AI Teacher phase 0 (knowledge-first, cost-minimised; BLUEPRINT.md §12).
-- Every tutor request is recorded (path, model, tokens, timing, outcome; never
-- the question or answer text), rate-limited per user, and paid model work is
-- off by default per course and capped monthly when an owner turns it on.

create table if not exists polished.ai_usage_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  request_id uuid not null,
  user_id uuid not null,
  course_id uuid references polished.courses(id) on delete set null,
  -- request: one row per tutor request; model: one row per paid or hosted model call
  kind text not null check (kind in ('request', 'model')),
  task text not null check (length(task) <= 40),
  -- how the request was answered: not_covered, out_of_scope, evidence_only, model, refused
  path text check (path is null or length(path) <= 40),
  provider text, model text,
  tokens_in integer not null default 0, tokens_out integer not null default 0,
  attempts integer not null default 1,
  ms integer, status text not null check (length(status) <= 40)
);
create index if not exists ai_usage_events_user_idx on polished.ai_usage_events(user_id, at desc);
create index if not exists ai_usage_events_course_idx on polished.ai_usage_events(course_id, at desc);
alter table polished.ai_usage_events enable row level security;
-- No policies: only the security-definer functions below read or write it.

-- Course teaching settings, safe defaults: no AI answers, no meaning search, modest caps when enabled.
create or replace function polished.teacher_settings(p jsonb) returns jsonb language sql immutable set search_path to '' as $$
  select jsonb_build_object(
    'ai_answers', coalesce((p->>'ai_answers')::boolean, false),
    'vector_search', coalesce((p->>'vector_search')::boolean, false),
    'monthly_request_cap', greatest(0, least(coalesce((p->>'monthly_request_cap')::int, 500), 1000000)),
    'monthly_token_cap', greatest(0, least(coalesce((p->>'monthly_token_cap')::int, 2000000), 2000000000)),
    'per_minute', greatest(1, least(coalesce((p->>'per_minute')::int, 8), 120)),
    'per_day', greatest(1, least(coalesce((p->>'per_day')::int, 150), 10000)));
$$;

-- Before any work: may this caller ask now, and may a model be used? (Course owner only until enrolments exist.)
create or replace function public.polished_teacher_guard(p_course_id uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public', 'polished' as $$
declare v_uid uuid := auth.uid(); s jsonb; m_req int; d_req int; mo_req int; mo_tok bigint;
begin
  if v_uid is null then return jsonb_build_object('allowed', false, 'reason', 'Sign in first.'); end if;
  select polished.teacher_settings(c.settings) into s from polished.courses c where c.id = p_course_id and c.owner_id = v_uid;
  if s is null then return jsonb_build_object('allowed', false, 'reason', 'Course not found.'); end if;
  select count(*) filter (where at > now() - interval '1 minute'), count(*) filter (where at > now() - interval '1 day')
    into m_req, d_req from polished.ai_usage_events where user_id = v_uid and kind = 'request' and at > now() - interval '1 day';
  select count(*) filter (where kind = 'request' and path = 'model'), coalesce(sum(tokens_in + tokens_out) filter (where kind = 'model'), 0)
    into mo_req, mo_tok from polished.ai_usage_events where course_id = p_course_id and at >= date_trunc('month', now());
  if m_req >= (s->>'per_minute')::int then return jsonb_build_object('allowed', false, 'reason', 'Too many questions in a minute. Please wait a moment and ask again.', 'settings', s); end if;
  if d_req >= (s->>'per_day')::int then return jsonb_build_object('allowed', false, 'reason', 'You have reached today''s question limit for this course. It resets tomorrow.', 'settings', s); end if;
  return jsonb_build_object('allowed', true, 'settings', s,
    'model_allowed', (s->>'ai_answers')::boolean and mo_req < (s->>'monthly_request_cap')::int and mo_tok < (s->>'monthly_token_cap')::bigint,
    'month', jsonb_build_object('model_requests', mo_req, 'tokens', mo_tok));
end $$;

-- Records one request or one model call for a course the caller owns. Never the question or answer text.
create or replace function public.polished_teacher_record_usage(p_course_id uuid, p_request_id uuid, p_kind text, p_task text, p_path text, p_provider text, p_model text,
  p_tokens_in int, p_tokens_out int, p_attempts int, p_ms int, p_status text)
returns void language plpgsql security definer set search_path to 'public', 'polished' as $$
begin
  if auth.uid() is null or not polished.owns_course(p_course_id) then raise exception 'course not found'; end if;
  insert into polished.ai_usage_events(request_id, user_id, course_id, kind, task, path, provider, model, tokens_in, tokens_out, attempts, ms, status)
  values (p_request_id, auth.uid(), p_course_id, p_kind, left(p_task, 40), left(p_path, 40), left(p_provider, 40), left(p_model, 80),
    greatest(0, coalesce(p_tokens_in, 0)), greatest(0, coalesce(p_tokens_out, 0)), greatest(1, coalesce(p_attempts, 1)), p_ms, left(coalesce(p_status, 'ok'), 40));
end $$;

-- The owner changes a course's teaching settings (only the known keys are kept).
create or replace function public.polished_teacher_set_course_settings(p_course_id uuid, p_settings jsonb)
returns jsonb language plpgsql security definer set search_path to 'public', 'polished' as $$
declare v jsonb;
begin
  update polished.courses set settings = polished.teacher_settings(coalesce(settings, '{}'::jsonb) || coalesce(p_settings, '{}'::jsonb)), updated_at = now()
    where id = p_course_id and owner_id = auth.uid() returning settings into v;
  if v is null then raise exception 'course not found'; end if;
  return v;
end $$;

-- This month's usage for a course the caller owns, by path and by model.
create or replace function public.polished_teacher_usage_summary(p_course_id uuid)
returns jsonb language sql stable security definer set search_path to 'public', 'polished' as $$
  select case when not polished.owns_course(p_course_id) then null else jsonb_build_object(
    'settings', (select polished.teacher_settings(settings) from polished.courses where id = p_course_id),
    'requests', (select count(*) from polished.ai_usage_events where course_id = p_course_id and kind = 'request' and at >= date_trunc('month', now())),
    'by_path', coalesce((select jsonb_object_agg(path, n) from (select path, count(*) n from polished.ai_usage_events where course_id = p_course_id and kind = 'request' and at >= date_trunc('month', now()) group by path) x), '{}'::jsonb),
    'model_calls', coalesce((select jsonb_agg(jsonb_build_object('provider', provider, 'model', model, 'task', task, 'calls', n, 'tokens_in', ti, 'tokens_out', tout)) from (
      select provider, model, task, count(*) n, sum(tokens_in) ti, sum(tokens_out) tout from polished.ai_usage_events
      where course_id = p_course_id and kind = 'model' and at >= date_trunc('month', now()) group by 1, 2, 3) y), '[]'::jsonb)) end;
$$;

-- Indexing writes meaning-search vectors only for a version a course has chosen meaning search for.
create or replace function public.polished_teacher_version_vectors_enabled(p_version_id uuid)
returns jsonb language sql stable security definer set search_path to 'public', 'polished' as $$
  select jsonb_build_object('enabled', coalesce(bool_or((polished.teacher_settings(c.settings)->>'vector_search')::boolean), false), 'course_id', min(c.id::text))
  from polished.course_sources s join polished.courses c on c.id = s.course_id
  where s.version_id = p_version_id and c.owner_id = auth.uid();
$$;

grant execute on function public.polished_teacher_guard(uuid), public.polished_teacher_record_usage(uuid, uuid, text, text, text, text, text, int, int, int, int, text),
  public.polished_teacher_set_course_settings(uuid, jsonb), public.polished_teacher_usage_summary(uuid), public.polished_teacher_version_vectors_enabled(uuid) to authenticated;
