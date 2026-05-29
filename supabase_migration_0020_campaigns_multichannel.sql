-- Multi-channel campaign fan-out + extended fields.
-- Adds campaigns.channels (text[]) so a single campaign can target several
-- platforms simultaneously, while leaving the legacy single `channel` column
-- intact for backward compatibility (post-campaign resolves whichever is set).

alter table public.campaigns
  add column if not exists channels  text[],
  add column if not exists name      text,
  add column if not exists asset_ref text;

create index if not exists campaigns_channels_idx on public.campaigns using gin (channels);
