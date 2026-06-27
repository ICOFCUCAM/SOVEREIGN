-- Content Engine — production data model.
--
-- The file-backed store in ../data/* is the runnable reference implementation.
-- This migration is the server-side target: when the publishing platform moves
-- behind an internal CMS UI, topics, versions, rankings and quality scores live
-- here. Mirrors lib/store.cjs one-to-one.

create schema if not exists content;

-- The topic database + editorial workflow.
create table if not exists content.topic (
  id              text primary key,
  title           text not null,
  type            text not null default 'concept',      -- concept | article | industry
  status          text not null default 'idea',         -- see workflow.md state machine
  locale          text not null default 'en',
  priority        int  not null default 3,
  slug            text,                                  -- published slug, once live
  keywords        text[] not null default '{}',
  category        text,
  related         jsonb not null default '{}'::jsonb,    -- seed related slugs
  review_every_days int not null default 180,
  last_reviewed   date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists topic_status_idx on content.topic (status);
create index if not exists topic_locale_idx on content.topic (locale);

-- Editorial transitions — append-only governance trail for each topic.
create table if not exists content.topic_event (
  id        bigserial primary key,
  topic_id  text not null references content.topic(id) on delete cascade,
  from_status text,
  to_status text not null,
  note      text,
  actor     text,                                        -- human or provider
  at        timestamptz not null default now()
);

-- Version history — every draft/publish of a page.
create table if not exists content.version (
  id        bigserial primary key,
  topic_id  text references content.topic(id) on delete set null,
  slug      text not null,
  locale    text not null default 'en',
  stage     text not null,                               -- drafted | published | refreshed
  provider  text,                                        -- authoring model that won
  score     int,                                         -- quality score 0-100
  fact_passed boolean,
  payload   jsonb,                                        -- the authored content snapshot
  at        timestamptz not null default now()
);
create index if not exists version_slug_idx on content.version (slug);

-- Quality scores (also denormalised onto version.score for the latest).
create table if not exists content.quality (
  id        bigserial primary key,
  slug      text not null,
  locale    text not null default 'en',
  score     int not null,
  breakdown jsonb not null,
  fact_flags text[] not null default '{}',
  at        timestamptz not null default now()
);

-- Ranking / Search Console snapshots — analytics + ranking tracking.
create table if not exists content.ranking (
  id          bigserial primary key,
  slug        text not null,
  locale      text not null default 'en',
  query       text,
  position    numeric,
  impressions int,
  clicks      int,
  at          timestamptz not null default now()
);
create index if not exists ranking_slug_idx on content.ranking (slug, at desc);

-- Content relationship edges — the internal-link graph (hubs/orphans queries).
create table if not exists content.edge (
  from_type text not null,
  from_slug text not null,
  to_type   text not null,
  to_slug   text not null,
  kind      text not null,
  primary key (from_type, from_slug, to_type, to_slug)
);
create index if not exists edge_to_idx on content.edge (to_type, to_slug);
