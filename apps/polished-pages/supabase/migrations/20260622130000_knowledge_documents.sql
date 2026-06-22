-- Knowledge source documents (extracted text) the AI writes in line with.
-- Direct-context grounding (no vector store). Enterprise Plus; org-shareable.
create table if not exists polished.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references polished.organizations(id) on delete cascade,
  name text not null,
  content text not null default '',
  created_at timestamptz not null default now()
);
alter table polished.knowledge_documents enable row level security;
create index if not exists knowledge_documents_user_idx on polished.knowledge_documents(user_id);
create index if not exists knowledge_documents_org_idx on polished.knowledge_documents(org_id);

create or replace function public.polished_knowledge_docs_list()
returns table(id uuid, name text, org_id uuid, org_name text, chars integer, created_at timestamptz)
language sql security definer set search_path to 'public', 'polished'
as $function$
  select d.id, d.name, d.org_id, o.name as org_name, char_length(d.content) as chars, d.created_at
  from polished.knowledge_documents d
  left join polished.organizations o on o.id = d.org_id
  where d.user_id = auth.uid() or (d.org_id is not null and polished.org_is_member(d.org_id))
  order by d.created_at desc limit 300;
$function$;

create or replace function public.polished_knowledge_docs_text(p_ids uuid[])
returns table(id uuid, name text, content text)
language sql security definer set search_path to 'public', 'polished'
as $function$
  select d.id, d.name, d.content from polished.knowledge_documents d
  where d.id = any(p_ids) and (d.user_id = auth.uid() or (d.org_id is not null and polished.org_is_member(d.org_id)));
$function$;

create or replace function public.polished_knowledge_doc_save(p_name text, p_content text, p_org uuid default null::uuid)
returns uuid language plpgsql security definer set search_path to 'public', 'polished'
as $function$
declare v_uid uuid := auth.uid(); v_id uuid; v_cnt int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if polished.plan_rank(coalesce((select plan from polished.entitlements where user_id = v_uid), 'free')) < polished.plan_rank('enterprise-plus') then
    raise exception 'Knowledge documents require the Enterprise Plus plan.';
  end if;
  if p_org is not null and not polished.org_can_manage(p_org) then raise exception 'You can''t manage that organization.'; end if;
  select count(*) into v_cnt from polished.knowledge_documents where user_id = v_uid;
  if v_cnt >= 200 then raise exception 'Document limit reached. Delete some to add more.'; end if;
  insert into polished.knowledge_documents(user_id, org_id, name, content)
    values (v_uid, p_org, coalesce(nullif(btrim(p_name), ''), 'Document'), left(coalesce(p_content, ''), 200000))
    returning id into v_id;
  return v_id;
end; $function$;

create or replace function public.polished_knowledge_doc_delete(p_id uuid)
returns void language plpgsql security definer set search_path to 'public', 'polished'
as $function$
declare v_uid uuid := auth.uid();
begin
  delete from polished.knowledge_documents where id = p_id and (user_id = v_uid or (org_id is not null and polished.org_can_manage(org_id)));
end; $function$;
