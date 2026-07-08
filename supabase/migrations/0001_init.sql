-- ============================================================
-- routdiary — initial schema
-- Phase 1: private route journaling. Phase 2: public feed + social.
-- RLS is ON for every table. A route is visible if it is public OR
-- owned by the requester; child rows inherit the parent's visibility.
-- ============================================================

-- ---------- enums ----------
create type visibility as enum ('private', 'public');
create type transport_mode as enum (
  'walk', 'bus', 'subway', 'car', 'taxi', 'bike', 'train', 'other'
);

-- ---------- profiles (1:1 with auth.users) ----------
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  handle       text unique not null,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- ---------- routes ----------
create table routes (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references profiles (id) on delete cascade,
  title           text not null,
  region          text not null,
  theme           text,
  mood            text,
  recommended_for text,
  best_season     text,
  est_cost_krw    integer,
  visibility      visibility not null default 'private',
  cover_photo_url text,
  like_count      integer not null default 0,
  bookmark_count  integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index routes_author_idx on routes (author_id, created_at desc);
create index routes_public_idx on routes (created_at desc) where visibility = 'public';

-- ---------- spots (ordered places within a route) ----------
create table spots (
  id          uuid primary key default gen_random_uuid(),
  route_id    uuid not null references routes (id) on delete cascade,
  order_index integer not null,
  title       text not null,
  body        text not null default '',
  address     text not null default '',
  lat         double precision,
  lng         double precision,
  created_at  timestamptz not null default now(),
  unique (route_id, order_index)
);
create index spots_route_idx on spots (route_id, order_index);

-- ---------- spot photos ----------
create table spot_photos (
  id           uuid primary key default gen_random_uuid(),
  spot_id      uuid not null references spots (id) on delete cascade,
  storage_path text not null,
  order_index  integer not null default 0,
  alt          text
);
create index spot_photos_spot_idx on spot_photos (spot_id, order_index);

-- ---------- legs (movement between consecutive spots) ----------
create table legs (
  id           uuid primary key default gen_random_uuid(),
  route_id     uuid not null references routes (id) on delete cascade,
  from_spot_id uuid not null references spots (id) on delete cascade,
  to_spot_id   uuid not null references spots (id) on delete cascade,
  transport    transport_mode not null default 'walk',
  duration_min integer,
  caution      text
);
create index legs_route_idx on legs (route_id);

-- ---------- social (phase 2) ----------
create table likes (
  user_id  uuid not null references profiles (id) on delete cascade,
  route_id uuid not null references routes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, route_id)
);

create table bookmarks (
  user_id  uuid not null references profiles (id) on delete cascade,
  route_id uuid not null references routes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, route_id)
);

create table follows (
  follower_id uuid not null references profiles (id) on delete cascade,
  followee_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

-- ============================================================
-- helper: can the current user see this route?
-- ============================================================
create or replace function can_read_route(r_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from routes r
    where r.id = r_id
      and (r.visibility = 'public' or r.author_id = auth.uid())
  );
$$;

create or replace function owns_route(r_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from routes r where r.id = r_id and r.author_id = auth.uid()
  );
$$;

-- ============================================================
-- RLS
-- ============================================================
alter table profiles    enable row level security;
alter table routes      enable row level security;
alter table spots       enable row level security;
alter table spot_photos enable row level security;
alter table legs        enable row level security;
alter table likes       enable row level security;
alter table bookmarks   enable row level security;
alter table follows     enable row level security;

-- profiles: world-readable, self-writable
create policy profiles_read on profiles for select using (true);
create policy profiles_insert on profiles for insert with check (id = auth.uid());
create policy profiles_update on profiles for update using (id = auth.uid());

-- routes: read public-or-own; write own
create policy routes_read on routes for select
  using (visibility = 'public' or author_id = auth.uid());
create policy routes_insert on routes for insert with check (author_id = auth.uid());
create policy routes_update on routes for update using (author_id = auth.uid());
create policy routes_delete on routes for delete using (author_id = auth.uid());

-- spots / legs / photos: inherit route access
create policy spots_read on spots for select using (can_read_route(route_id));
create policy spots_write on spots for all using (owns_route(route_id)) with check (owns_route(route_id));

create policy legs_read on legs for select using (can_read_route(route_id));
create policy legs_write on legs for all using (owns_route(route_id)) with check (owns_route(route_id));

create policy spot_photos_read on spot_photos for select
  using (can_read_route((select route_id from spots where id = spot_id)));
create policy spot_photos_write on spot_photos for all
  using (owns_route((select route_id from spots where id = spot_id)))
  with check (owns_route((select route_id from spots where id = spot_id)));

-- social: read on visible routes; write own rows
create policy likes_read on likes for select using (can_read_route(route_id));
create policy likes_write on likes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy bookmarks_read on bookmarks for select using (user_id = auth.uid());
create policy bookmarks_write on bookmarks for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy follows_read on follows for select using (true);
create policy follows_write on follows for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());

-- ============================================================
-- auto-create a profile row when a new auth user signs up
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'handle', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- like/bookmark counters kept in sync via triggers
-- ============================================================
create or replace function bump_route_counter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  col text := tg_argv[0];
  delta int := case when tg_op = 'INSERT' then 1 else -1 end;
  rid uuid := case when tg_op = 'INSERT' then new.route_id else old.route_id end;
begin
  if col = 'like_count' then
    update routes set like_count = like_count + delta where id = rid;
  elsif col = 'bookmark_count' then
    update routes set bookmark_count = bookmark_count + delta where id = rid;
  end if;
  return null;
end;
$$;

create trigger likes_counter
  after insert or delete on likes
  for each row execute function bump_route_counter('like_count');

create trigger bookmarks_counter
  after insert or delete on bookmarks
  for each row execute function bump_route_counter('bookmark_count');
