-- ============================================================
-- Route copy lineage ("이 루트 따라가기").
-- Tracks when a visible public route becomes another user's private draft,
-- including whether the user intends to plan a future trip or write up a
-- trip they already took.
-- ============================================================
create type route_copy_purpose as enum ('plan', 'record');

create table route_copies (
  id uuid primary key default gen_random_uuid(),
  original_route_id uuid not null references routes (id) on delete cascade,
  copied_route_id uuid not null references routes (id) on delete cascade unique,
  copier_id uuid not null references profiles (id) on delete cascade,
  purpose route_copy_purpose not null,
  created_at timestamptz not null default now(),
  check (original_route_id <> copied_route_id)
);
create index route_copies_original_idx on route_copies (original_route_id, created_at desc);
create index route_copies_copier_idx on route_copies (copier_id, created_at desc);

alter table route_copies enable row level security;

-- Copiers can see their own copy context; original authors can see aggregate
-- lineage rows for routes they own. Copied private route details are still
-- protected by routes RLS and are not exposed through this policy.
create policy route_copies_read on route_copies
  for select using (copier_id = auth.uid() or private.owns_route(original_route_id));

create policy route_copies_insert on route_copies
  for insert with check (
    copier_id = auth.uid()
    and private.can_read_route(original_route_id)
    and private.owns_route(copied_route_id)
  );

create policy route_copies_delete on route_copies
  for delete using (copier_id = auth.uid() or private.owns_route(original_route_id));
