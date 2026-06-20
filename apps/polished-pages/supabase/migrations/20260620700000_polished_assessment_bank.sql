-- Educational leadership: a reusable Assessment Bank. Teachers build up a
-- library of quizzes, exams, worksheets and assessments organized by subject
-- and grade, to reuse and adapt across terms.
create table if not exists polished.assessment_bank (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text, grade text, topic text, doc_type text,
  title text not null, content text not null,
  created_at timestamptz not null default now()
);
create index if not exists assessment_bank_user_idx on polished.assessment_bank(user_id, created_at desc);
alter table polished.assessment_bank enable row level security;

create or replace function public.polished_save_assessment(p_subject text, p_grade text, p_topic text, p_doc_type text, p_title text, p_content text)
returns uuid language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_content),'') = '' then raise exception 'nothing to save'; end if;
  insert into polished.assessment_bank(user_id, subject, grade, topic, doc_type, title, content)
    values (v_uid, nullif(btrim(p_subject),''), nullif(btrim(p_grade),''), nullif(btrim(p_topic),''),
            nullif(btrim(p_doc_type),''), coalesce(nullif(btrim(p_title),''),'Untitled'), p_content)
    returning id into v_id;
  return v_id;
end; $$;

create or replace function public.polished_list_assessments(p_subject text default null, p_grade text default null)
returns table(id uuid, subject text, grade text, topic text, doc_type text, title text, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select a.id, a.subject, a.grade, a.topic, a.doc_type, a.title, a.created_at
  from polished.assessment_bank a
  where a.user_id = auth.uid()
    and (p_subject is null or a.subject = p_subject)
    and (p_grade is null or a.grade = p_grade)
  order by a.created_at desc limit 300;
$$;

create or replace function public.polished_get_assessment(p_id uuid)
returns table(title text, content text, doc_type text, subject text, grade text, topic text)
language sql security definer set search_path to 'public','polished' as $$
  select a.title, a.content, a.doc_type, a.subject, a.grade, a.topic
  from polished.assessment_bank a where a.id = p_id and a.user_id = auth.uid();
$$;

create or replace function public.polished_delete_assessment(p_id uuid)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from polished.assessment_bank where id = p_id and user_id = auth.uid();
end; $$;

revoke all on function public.polished_save_assessment(text, text, text, text, text, text) from public, anon;
revoke all on function public.polished_list_assessments(text, text) from public, anon;
revoke all on function public.polished_get_assessment(uuid) from public, anon;
revoke all on function public.polished_delete_assessment(uuid) from public, anon;
grant execute on function public.polished_save_assessment(text, text, text, text, text, text) to authenticated;
grant execute on function public.polished_list_assessments(text, text) to authenticated;
grant execute on function public.polished_get_assessment(uuid) to authenticated;
grant execute on function public.polished_delete_assessment(uuid) to authenticated;
