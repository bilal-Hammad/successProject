-- ============================================================
-- Momentum – Template Section Management Schema
-- Run this in the Supabase SQL editor (project > SQL Editor)
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. user_template_settings
--    Stores per-user, per-category section order + hidden IDs.
--    One row per (user, category). Upserted on every sync.
-- ──────────────────────────────────────────────────────────
create table if not exists public.user_template_settings (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  category    text        not null check (category in ('good', 'health', 'bad', 'todo')),
  section_order    text[] not null default '{}',
  hidden_section_ids text[] not null default '{}',
  updated_at  timestamptz not null default now(),
  unique (user_id, category)
);

alter table public.user_template_settings enable row level security;

create policy "Users manage own settings"
  on public.user_template_settings
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────
-- 2. custom_sections
--    User-created sections. ID is the client-generated cs_xxx
--    string so we can match local store IDs without translation.
-- ──────────────────────────────────────────────────────────
create table if not exists public.custom_sections (
  id          text        primary key,             -- e.g. cs_lzx3f7_k2a
  user_id     uuid        not null references auth.users(id) on delete cascade,
  category    text        not null check (category in ('good', 'health', 'bad', 'todo')),
  name        text        not null,
  icon        text        not null default '📋',
  habits      jsonb       not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.custom_sections enable row level security;

create policy "Users manage own custom sections"
  on public.custom_sections
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────
-- 3. shared_sections
--    Sections exported via deep-link (momentum://section/<code>).
--    Anyone authenticated can read; only the owner can write.
-- ──────────────────────────────────────────────────────────
create table if not exists public.shared_sections (
  id          uuid        primary key default gen_random_uuid(),
  owner_id    uuid        not null references auth.users(id) on delete cascade,
  category    text        not null check (category in ('good', 'health', 'bad', 'todo')),
  name        text        not null,
  icon        text        not null default '📋',
  habits      jsonb       not null default '[]',
  share_code  text        not null unique,          -- short alphanum used in deep link
  views       integer     not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.shared_sections enable row level security;

-- Any signed-in user can preview a shared section before adding it
create policy "Authenticated users can read shared sections"
  on public.shared_sections
  for select
  using (auth.role() = 'authenticated');

-- Only the owner can insert / update / delete
create policy "Owner manages shared section"
  on public.shared_sections
  for all
  using  (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);


-- ──────────────────────────────────────────────────────────
-- 4. official_sections
--    Curated sections created by admins via the Supabase UI.
--    All authenticated users can read; writes require service role.
-- ──────────────────────────────────────────────────────────
create table if not exists public.official_sections (
  id          text        primary key,             -- e.g. 'official-morning-routine'
  category    text        not null check (category in ('good', 'health', 'bad', 'todo')),
  name        text        not null,
  icon        text        not null,
  description text,
  habits      jsonb       not null default '[]',
  sort_order  integer     not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.official_sections enable row level security;

-- Public read — no login required, useful for unauthenticated previews
create policy "Anyone can read official sections"
  on public.official_sections
  for select
  using (is_active = true);

-- Writes are intentionally blocked at RLS level (use service role in dashboard)


-- ──────────────────────────────────────────────────────────
-- Helpers
-- ──────────────────────────────────────────────────────────

-- Auto-bump updated_at on custom_sections
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger custom_sections_updated_at
  before update on public.custom_sections
  for each row execute procedure public.set_updated_at();

create trigger official_sections_updated_at
  before update on public.official_sections
  for each row execute procedure public.set_updated_at();

create trigger user_template_settings_updated_at
  before update on public.user_template_settings
  for each row execute procedure public.set_updated_at();
