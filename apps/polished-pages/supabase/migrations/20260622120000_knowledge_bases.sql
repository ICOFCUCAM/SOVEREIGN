-- Reusable, optionally org-shared Knowledge Bases (Author Memory templates).
-- Access only via SECURITY DEFINER RPCs (RLS on, no direct policies). Enterprise
-- Plus to create/edit; org sharing requires manage rights.
create table if not exists polished.knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references polished.organizations(id) on delete cascade,
  name text not null,
  rules text not null default '',
  terminology text not null default '',
  forbidden text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table polished.knowledge_bases enable row level security;
create index if not exists knowledge_bases_user_idx on polished.knowledge_bases(user_id);
create index if not exists knowledge_bases_org_idx on polished.knowledge_bases(org_id);

create or replace function public.polished_knowledge_list()
returns table(id uuid, name text, rules text, terminology text, forbidden text, org_id uuid, org_name text, updated_at timestamptz)
language sql security definer set search_path to 'public', 'polished'
as $function$
  select k.id, k.name, k.rules, k.terminology, k.forbidden, k.org_id, o.name as org_name, k.updated_at
  from polished.knowledge_bases k
  left join polished.organizations o on o.id = k.org_id
  where k.user_id = auth.uid() or (k.org_id is not null and polished.org_is_member(k.org_id))
  order by k.updated_at desc limit 200;
$function$;

create or replace function public.polished_knowledge_save(p_id uuid, p_name text, p_rules text, p_terminology text, p_forbidden text, p_org uuid default null::uuid)
returns uuid language plpgsql security definer set search_path to 'public', 'polished'
as $function$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if polished.plan_rank(coalesce((select plan from polished.entitlements where user_id = v_uid), 'free')) < polished.plan_rank('enterprise-plus') then
    raise exception 'Knowledge bases require the Enterprise Plus plan.';
  end if;
  if p_org is not null and not polished.org_can_manage(p_org) then
    raise exception 'You can''t manage that organization.';
  end if;
  if p_id is null then
    insert into polished.knowledge_bases(user_id, org_id, name, rules, terminology, forbidden)
      values (v_uid, p_org, coalesce(nullif(btrim(p_name), ''), 'Untitled'), coalesce(p_rules, ''), coalesce(p_terminology, ''), coalesce(p_forbidden, ''))
      returning id into v_id;
  else
    update polished.knowledge_bases set
      name = coalesce(nullif(btrim(p_name), ''), 'Untitled'), rules = coalesce(p_rules, ''),
      terminology = coalesce(p_terminology, ''), forbidden = coalesce(p_forbidden, ''), org_id = p_org, updated_at = now()
      where id = p_id and (user_id = v_uid or (org_id is not null and polished.org_can_manage(org_id)))
      returning id into v_id;
    if v_id is null then raise exception 'knowledge base not found'; end if;
  end if;
  return v_id;
end; $function$;

create or replace function public.polished_knowledge_delete(p_id uuid)
returns void language plpgsql security definer set search_path to 'public', 'polished'
as $function$
declare v_uid uuid := auth.uid();
begin
  delete from polished.knowledge_bases where id = p_id and (user_id = v_uid or (org_id is not null and polished.org_can_manage(org_id)));
end; $function$;
