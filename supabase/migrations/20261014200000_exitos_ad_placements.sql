-- ExitOS · promotions beyond the listing desk: two quiet placements
-- A campaign may now also run at the foot of the console sidebar (every inner page, large screens only)
-- and on the Report hub. Both sit away from decisions: never in the listing, NDA, offer, signing or
-- closing flows, never among listings, never beside valuations. Each placement has its own off switch.
-- Existing campaigns keep their listing-desk stages; nothing appears in a new placement until an
-- operator ticks it.
--
-- Rollback:
--   alter table public.exitos_ad_campaigns drop constraint exitos_ad_campaigns_stages_check;
--   alter table public.exitos_ad_campaigns add constraint exitos_ad_campaigns_stages_check
--     check (cardinality(stages) between 1 and 3 and stages <@ array['identity','profile','review']);
--   alter table public.exitos_ad_settings drop column off_placements;

alter table public.exitos_ad_campaigns drop constraint if exists exitos_ad_campaigns_stages_check;
alter table public.exitos_ad_campaigns add constraint exitos_ad_campaigns_stages_check
  check (cardinality(stages) between 1 and 5 and stages <@ array['identity','profile','review','sidebar','reports']);

alter table public.exitos_ad_settings add column if not exists off_placements text[] not null default '{}';
do $c$ begin
  if not exists (select 1 from pg_constraint where conname = 'exitos_ad_settings_off_placements_check') then
    alter table public.exitos_ad_settings add constraint exitos_ad_settings_off_placements_check
      check (off_placements <@ array['identity','profile','review','sidebar','reports']);
  end if;
end $c$;
grant update (off_placements) on public.exitos_ad_settings to authenticated;
