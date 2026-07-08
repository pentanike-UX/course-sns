-- ============================================================
-- Comments on routes (phase 2 social).
-- Readable by anyone who can read the route; insert by the author;
-- delete by the comment author OR the route owner. comment_count on
-- routes is kept in sync via a trigger (mirrors like/bookmark counters).
-- ============================================================
create table comments (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index comments_route_created_idx on comments (route_id, created_at);

alter table comments enable row level security;

create policy comments_read on comments
  for select using (private.can_read_route(route_id));
create policy comments_insert on comments
  for insert with check (author_id = auth.uid() and private.can_read_route(route_id));
create policy comments_delete on comments
  for delete using (author_id = auth.uid() or private.owns_route(route_id));

alter table routes add column comment_count integer not null default 0;

create or replace function private.bump_comment_counter()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update routes set comment_count = comment_count + 1 where id = new.route_id;
  elsif tg_op = 'DELETE' then
    update routes set comment_count = comment_count - 1 where id = old.route_id;
  end if;
  return null;
end $$;
revoke execute on function private.bump_comment_counter() from public, anon, authenticated;

create trigger comments_counter
  after insert or delete on comments
  for each row execute function private.bump_comment_counter();
