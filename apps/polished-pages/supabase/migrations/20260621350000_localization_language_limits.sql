-- Per-plan localization allowance: how many ADDITIONAL language editions a
-- project may have (the original language is always free). -1 = unlimited.
-- Mirrors LOCALIZATION_LIMIT in src/lib/plans.ts. Enforced server-side in
-- polished_save_edition so the client can't bypass it.
create or replace function polished.localization_limit(p_plan text)
returns integer
language sql
immutable
set search_path to ''
as $function$
  select case p_plan
    when 'creator' then 1
    when 'professional' then 2 when 'pro' then 2
    when 'publisher' then 5
    when 'business' then 10
    when 'school' then -1
    when 'enterprise' then -1
    else 0 end;
$function$;

-- Enforce the localization allowance when creating a linked edition. Adding a
-- brand-new language beyond the plan's limit is rejected; re-generating an
-- existing language is always allowed.
create or replace function public.polished_save_edition(p_parent uuid, p_language text, p_kind text, p_title text, p_payload jsonb, p_preview text, p_culture text default null::text)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'polished'
as $function$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_plan text;
  v_limit int;
  v_existing int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from polished.documents where id = p_parent and user_id = v_uid) then
    raise exception 'source document not found';
  end if;
  if coalesce(btrim(p_language),'') = '' then raise exception 'a language is required'; end if;

  v_plan := coalesce((select plan from polished.entitlements where user_id = v_uid), 'free');
  v_limit := polished.localization_limit(v_plan);
  if v_limit >= 0 then
    select count(distinct lower(edition_language)) into v_existing
      from polished.documents
      where parent_document_id = p_parent and user_id = v_uid
        and edition_language is not null
        and lower(edition_language) <> lower(btrim(p_language));
    if v_existing >= v_limit then
      raise exception 'Your plan includes % additional language(s) per project. Upgrade to localize into more.', v_limit
        using errcode = 'check_violation';
    end if;
  end if;

  insert into polished.documents(user_id, kind, title, payload, preview, parent_document_id, edition_language, edition_culture)
    values (v_uid, p_kind, p_title, p_payload, p_preview, p_parent, btrim(p_language), nullif(btrim(p_culture),''))
    returning id into v_id;
  return v_id;
end; $function$;
