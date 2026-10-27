-- AI Teacher course model (docs/ai-teacher/BLUEPRINT.md §0.1, §2a, build step 1).
-- The course is the teaching unit. A course authorises sources (published books
-- or private documents) as required, supplementary or excluded. Sources are
-- indexed as immutable, content-hashed versions whose chunks carry exact
-- locations. Indexing never makes a source available to any tutor or student by
-- itself: nothing here grants read access beyond the owner; the Teacher Runtime
-- (server side) resolves course, enrolment and permitted versions in later steps.

create table if not exists polished.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  org_id uuid references polished.organizations(id) on delete cascade,
  mode text not null default 'author' check (mode in ('author', 'course', 'institution')),
  title text not null check (length(title) between 1 and 300),
  -- Structured teaching rules with scope and precedence (blueprint §8.2), and settings such as learner level and budgets.
  rules jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists courses_owner_idx on polished.courses(owner_id);
create index if not exists courses_org_idx on polished.courses(org_id);

create table if not exists polished.course_sources (
  course_id uuid not null references polished.courses(id) on delete cascade,
  document_id uuid not null references polished.documents(id) on delete cascade,
  source_type text not null check (source_type in ('published_book', 'private_document')),
  role text not null default 'required' check (role in ('required', 'supplementary', 'excluded')),
  -- The exact version learners use; null until the owner approves one (foreign key added below).
  version_id uuid,
  added_at timestamptz not null default now(),
  primary key (course_id, document_id)
);

create table if not exists polished.source_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references polished.documents(id) on delete cascade,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'indexed', 'failed', 'superseded')),
  -- The author's preview: chapters as detected, counts and structure issues.
  structure jsonb not null default '{}'::jsonb,
  approved_by uuid, approved_at timestamptz,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (document_id, content_hash)
);
alter table polished.course_sources add constraint course_sources_version_fk foreign key (version_id) references polished.source_versions(id) on delete set null;

-- A version's identity never changes once written.
create function polished.source_versions_immutable() returns trigger language plpgsql set search_path to 'polished' as $$
begin
  if new.document_id is distinct from old.document_id or new.content_hash is distinct from old.content_hash or new.created_by is distinct from old.created_by then
    raise exception 'source versions are immutable';
  end if;
  return new;
end $$;
create trigger source_versions_immutable before update on polished.source_versions for each row execute function polished.source_versions_immutable();

create table if not exists polished.source_chunks (
  version_id uuid not null references polished.source_versions(id) on delete cascade,
  -- Stable across versions for unchanged text: "<source>:<chapter>:<hash12>".
  chunk_id text not null,
  ordinal integer not null,
  chapter_id text not null,
  chapter_number integer,
  heading_path text[] not null default '{}',
  paragraph_start integer not null, paragraph_end integer not null,
  char_start integer not null, char_end integer not null check (char_end >= char_start),
  chunk_text text not null,
  tokens integer not null,
  embedding public.vector(1536),
  scripture_refs jsonb not null default '[]'::jsonb,
  source_type text not null check (source_type in ('published_book', 'private_document')),
  source_location text not null,
  content_hash text not null,
  tsv tsvector generated always as (to_tsvector('simple', chunk_text)) stored,
  primary key (version_id, chunk_id)
);
create index if not exists source_chunks_chapter_idx on polished.source_chunks(version_id, chapter_id, ordinal);
create index if not exists source_chunks_tsv_idx on polished.source_chunks using gin (tsv);
create index if not exists source_chunks_vec_idx on polished.source_chunks using hnsw (embedding public.vector_cosine_ops);
create index if not exists source_chunks_scripture_idx on polished.source_chunks using gin (scripture_refs jsonb_path_ops);

-- Row-level security: owners only in this step. No student, course member or
-- other author can read a source or its chunks through these tables.
alter table polished.courses enable row level security;
alter table polished.course_sources enable row level security;
alter table polished.source_versions enable row level security;
alter table polished.source_chunks enable row level security;

create or replace function polished.owns_document(p_doc uuid) returns boolean language sql stable security definer set search_path to 'polished', 'public' as $$
  select exists(select 1 from polished.documents where id = p_doc and user_id = auth.uid());
$$;
create or replace function polished.owns_course(p_course uuid) returns boolean language sql stable security definer set search_path to 'polished', 'public' as $$
  select exists(select 1 from polished.courses where id = p_course and owner_id = auth.uid());
$$;
create or replace function polished.owns_version(p_version uuid) returns boolean language sql stable security definer set search_path to 'polished', 'public' as $$
  select exists(select 1 from polished.source_versions v join polished.documents d on d.id = v.document_id where v.id = p_version and d.user_id = auth.uid());
$$;
revoke all on function polished.owns_document(uuid), polished.owns_course(uuid), polished.owns_version(uuid) from public;
grant execute on function polished.owns_document(uuid), polished.owns_course(uuid), polished.owns_version(uuid) to authenticated;

create policy courses_owner on polished.courses for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid() and (org_id is null or polished.org_is_member(org_id)));

-- A course may only list documents its owner owns (published books by other authors arrive later through licensing).
create policy course_sources_owner on polished.course_sources for all to authenticated
  using (polished.owns_course(course_id)) with check (polished.owns_course(course_id) and polished.owns_document(document_id));

create policy source_versions_owner on polished.source_versions for all to authenticated
  using (polished.owns_document(document_id)) with check (polished.owns_document(document_id) and created_by = auth.uid());

create policy source_chunks_owner on polished.source_chunks for all to authenticated
  using (polished.owns_version(version_id)) with check (polished.owns_version(version_id));

grant select, insert, update, delete on polished.courses, polished.course_sources, polished.source_versions, polished.source_chunks to authenticated;
