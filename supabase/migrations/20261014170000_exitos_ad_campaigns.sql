-- ExitOS · listing-desk promotions (O-23)
-- The listing desk's sidebar carries promotions for the operator's own products (and, later, approved
-- partners). Operators manage them on the admin console; everyone else only ever sees a campaign that
-- is published and inside its schedule. Content is plain text and an https link; nothing an operator
-- types is rendered as markup. Images live in a private bucket: a signed link is issued only for an
-- image that a live campaign uses, or to an operator. Impressions and clicks are counted per campaign
-- per day, with no account attached.

create table if not exists public.exitos_ad_campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 120),          -- internal only
  eyebrow     text check (eyebrow is null or char_length(eyebrow) <= 60),
  headline    text not null check (char_length(btrim(headline)) between 1 and 120),
  body        text check (body is null or char_length(body) <= 280),
  cta_label   text check (cta_label is null or char_length(btrim(cta_label)) between 1 and 40),
  cta_url     text check (cta_url is null or (char_length(cta_url) <= 500 and cta_url ~ '^https://[A-Za-z0-9.-]+(:[0-9]+)?(/[^[:space:]<>"]*)?$')),
  attribution text check (attribution is null or char_length(attribution) <= 80),
  image_path  text check (image_path is null or image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|jpeg|png|avif)$'),
  image_alt   text check (image_alt is null or char_length(image_alt) <= 200),
  focal_x     smallint not null default 50 check (focal_x between 0 and 100),
  focal_y     smallint not null default 50 check (focal_y between 0 and 100),
  stages      text[] not null default array['identity','profile','review'] check (cardinality(stages) between 1 and 3 and stages <@ array['identity','profile','review']),
  mobile      boolean not null default true,
  priority    smallint not null default 0 check (priority between -100 and 100),
  position    integer not null default 0,
  status      text not null default 'draft' check (status in ('draft','published','paused','archived')),
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_by  text default (auth.uid())::text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check ((cta_label is null) = (cta_url is null)),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index if not exists exitos_ad_campaigns_live on public.exitos_ad_campaigns (status, priority desc, position);

/** Live = published and inside its schedule. The one definition every policy and function uses. */
create or replace function public.exitos_ad_is_live(c public.exitos_ad_campaigns) returns boolean
language sql stable set search_path = public as $$
  select c.status = 'published' and (c.starts_at is null or c.starts_at <= now()) and (c.ends_at is null or c.ends_at > now()); $$;

-- the server stamps authorship and time; a client cannot backdate or reassign a campaign
create or replace function public.exitos_ad_stamp() returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then new.created_by := (auth.uid())::text; new.created_at := now();
  else new.created_by := old.created_by; new.created_at := old.created_at; end if;
  return new;
end $$;
create or replace trigger exitos_ad_stamp before insert or update on public.exitos_ad_campaigns
  for each row execute function public.exitos_ad_stamp();

alter table public.exitos_ad_campaigns enable row level security;
revoke all on public.exitos_ad_campaigns from anon, authenticated;
grant select, insert, update on public.exitos_ad_campaigns to authenticated;   -- no delete: campaigns are archived

do $p$ begin
  if not exists (select 1 from pg_policies where tablename = 'exitos_ad_campaigns' and policyname = 'exitos_ad_live_read') then
    create policy exitos_ad_live_read on public.exitos_ad_campaigns for select to authenticated using (public.exitos_ad_is_live(exitos_ad_campaigns));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'exitos_ad_campaigns' and policyname = 'exitos_ad_operator_read') then
    create policy exitos_ad_operator_read on public.exitos_ad_campaigns for select to authenticated using (public.exitos_has_role('operator'));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'exitos_ad_campaigns' and policyname = 'exitos_ad_operator_insert') then
    create policy exitos_ad_operator_insert on public.exitos_ad_campaigns for insert to authenticated with check (public.exitos_has_role('operator'));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'exitos_ad_campaigns' and policyname = 'exitos_ad_operator_update') then
    create policy exitos_ad_operator_update on public.exitos_ad_campaigns for update to authenticated using (public.exitos_has_role('operator')) with check (public.exitos_has_role('operator'));
  end if;
end $p$;

-- one row of presentation settings
create table if not exists public.exitos_ad_settings (
  id               boolean primary key default true check (id),
  rotation_seconds smallint not null default 7 check (rotation_seconds between 4 and 30),
  mobile_enabled   boolean not null default true,
  updated_at       timestamptz not null default now()
);
insert into public.exitos_ad_settings (id) values (true) on conflict (id) do nothing;
alter table public.exitos_ad_settings enable row level security;
revoke all on public.exitos_ad_settings from anon, authenticated;
grant select, update (rotation_seconds, mobile_enabled, updated_at) on public.exitos_ad_settings to authenticated;
do $p$ begin
  if not exists (select 1 from pg_policies where tablename = 'exitos_ad_settings' and policyname = 'exitos_ad_settings_read') then
    create policy exitos_ad_settings_read on public.exitos_ad_settings for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'exitos_ad_settings' and policyname = 'exitos_ad_settings_operator') then
    create policy exitos_ad_settings_operator on public.exitos_ad_settings for update to authenticated using (public.exitos_has_role('operator')) with check (public.exitos_has_role('operator'));
  end if;
end $p$;

-- counts only: which campaign, which day, how many times shown and clicked; no account, no device
create table if not exists public.exitos_ad_stats (
  campaign_id uuid not null references public.exitos_ad_campaigns (id),
  day         date not null default current_date,
  impressions integer not null default 0,
  clicks      integer not null default 0,
  primary key (campaign_id, day)
);
alter table public.exitos_ad_stats enable row level security;
revoke all on public.exitos_ad_stats from anon, authenticated;
grant select on public.exitos_ad_stats to authenticated;
do $p$ begin
  if not exists (select 1 from pg_policies where tablename = 'exitos_ad_stats' and policyname = 'exitos_ad_stats_operator') then
    create policy exitos_ad_stats_operator on public.exitos_ad_stats for select to authenticated using (public.exitos_has_role('operator'));
  end if;
end $p$;

/** Count one impression or click for a live campaign. Anything else is ignored. */
create or replace function public.exitos_ad_record(p_campaign uuid, p_kind text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('impression','click') or auth.uid() is null then return; end if;
  if not exists (select 1 from public.exitos_ad_campaigns c where c.id = p_campaign and public.exitos_ad_is_live(c)) then return; end if;
  insert into public.exitos_ad_stats as s (campaign_id, day, impressions, clicks)
  values (p_campaign, current_date, (p_kind = 'impression')::int, (p_kind = 'click')::int)
  on conflict (campaign_id, day) do update
    set impressions = s.impressions + (p_kind = 'impression')::int, clicks = s.clicks + (p_kind = 'click')::int;
end $$;
revoke all on function public.exitos_ad_record(uuid, text) from public, anon;
grant execute on function public.exitos_ad_record(uuid, text) to authenticated;

-- images: a private bucket, images only, 5 MB at most
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exitos-ads', 'exitos-ads', false, 5242880, array['image/webp','image/jpeg','image/png','image/avif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

/** An image a live campaign shows (so any signed-in viewer may be given a link to it). */
create or replace function public.exitos_ad_image_live(p_path text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.exitos_ad_campaigns c where c.image_path = p_path and public.exitos_ad_is_live(c)); $$;
revoke all on function public.exitos_ad_image_live(text) from public, anon;
grant execute on function public.exitos_ad_image_live(text) to authenticated;

do $p$ begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'exitos_ads_read') then
    create policy exitos_ads_read on storage.objects for select to authenticated
      using (bucket_id = 'exitos-ads' and (public.exitos_ad_image_live(name) or public.exitos_has_role('operator')));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'exitos_ads_write') then
    create policy exitos_ads_write on storage.objects for insert to authenticated
      with check (bucket_id = 'exitos-ads' and public.exitos_has_role('operator')
        and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|jpeg|png|avif)$');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'exitos_ads_remove') then
    create policy exitos_ads_remove on storage.objects for delete to authenticated
      using (bucket_id = 'exitos-ads' and public.exitos_has_role('operator'));
  end if;
end $p$;
