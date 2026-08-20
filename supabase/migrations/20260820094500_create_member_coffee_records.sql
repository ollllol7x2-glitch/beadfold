-- BEANFOLD member records
--
-- The application owns IDs so a record can be created offline and later
-- uploaded without a server-generated identifier.  Every row is scoped to the
-- authenticated owner; the browser only ever uses the Supabase publishable key.

create table if not exists public.user_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create table if not exists public.user_equipment (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('grinder', 'dripper', 'filter', 'kettle', 'scale', 'water')),
  name text not null,
  brand text not null default '',
  is_primary boolean not null default false,
  is_custom boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.beans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  roaster text not null default '',
  country text not null default '',
  region text not null default '',
  farm text not null default '',
  variety text not null default '',
  process text not null default '',
  altitude text not null default '',
  roast_date date,
  roast_level text not null default 'unknown',
  initial_weight_g numeric not null check (initial_weight_g >= 0),
  remaining_weight_g numeric not null check (remaining_weight_g >= 0),
  storage_type text not null default '',
  state text not null default 'unspecified',
  tasting_notes jsonb not null default '[]'::jsonb,
  description text not null default '',
  image_uri text,
  archived_from_state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  bean_id text references public.beans(id) on delete set null,
  recipe jsonb not null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brew_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  bean_id text not null references public.beans(id) on delete cascade,
  recipe_id text references public.recipes(id) on delete set null,
  status text not null check (status in ('ready', 'active', 'paused', 'completed', 'abandoned')),
  recipe_snapshot jsonb not null,
  bean_snapshot jsonb not null,
  started_at bigint not null,
  step_index integer not null default 0,
  step_started_at bigint not null,
  paused_at bigint,
  paused_duration_ms bigint not null default 0,
  completed_at bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.cups (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  brew_session_id text unique references public.brew_sessions(id) on delete set null,
  bean_id text references public.beans(id) on delete set null,
  kind text not null check (kind in ('home', 'cafe')),
  bean_name text not null,
  bean_snapshot jsonb,
  recipe_snapshot jsonb,
  satisfaction text check (satisfaction in ('not_for_me', 'good', 'loved')),
  flavor_tags jsonb not null default '[]'::jsonb,
  taste jsonb not null default '{}'::jsonb,
  memo text not null default '',
  image_uri text,
  cafe_name text not null default '',
  drink_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  bean_id text not null references public.beans(id) on delete cascade,
  cup_id text references public.cups(id) on delete set null,
  kind text not null check (kind in ('brew', 'adjustment')),
  delta_g numeric not null,
  remaining_weight_g numeric not null check (remaining_weight_g >= 0),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists user_equipment_owner_category_idx on public.user_equipment(user_id, category, is_primary desc, name);
create index if not exists beans_owner_updated_idx on public.beans(user_id, state, updated_at desc);
create index if not exists recipes_owner_updated_idx on public.recipes(user_id, archived, updated_at desc);
create index if not exists brew_sessions_owner_status_idx on public.brew_sessions(user_id, status, started_at desc);
create index if not exists cups_owner_created_idx on public.cups(user_id, created_at desc);
create index if not exists cups_owner_bean_created_idx on public.cups(user_id, bean_id, created_at desc);
create index if not exists inventory_events_owner_bean_created_idx on public.inventory_events(user_id, bean_id, created_at desc);

-- Tables in the exposed public schema must remain inaccessible to anon users.
revoke all on public.user_settings, public.user_equipment, public.beans, public.recipes,
  public.brew_sessions, public.cups, public.inventory_events from anon;
grant select, insert, update, delete on public.user_settings, public.user_equipment, public.beans,
  public.recipes, public.brew_sessions, public.cups, public.inventory_events to authenticated;

alter table public.user_settings enable row level security;
alter table public.user_equipment enable row level security;
alter table public.beans enable row level security;
alter table public.recipes enable row level security;
alter table public.brew_sessions enable row level security;
alter table public.cups enable row level security;
alter table public.inventory_events enable row level security;

create policy "Members manage their own settings" on public.user_settings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Members manage their own equipment" on public.user_equipment for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Members manage their own beans" on public.beans for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Members manage their own recipes" on public.recipes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Members manage their own brew sessions" on public.brew_sessions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Members manage their own cups" on public.cups for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Members manage their own inventory events" on public.inventory_events for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
