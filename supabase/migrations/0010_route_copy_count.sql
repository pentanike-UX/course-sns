-- ============================================================
-- Denormalized "따라간 사람 수" (copy_count) on routes.
-- Under the 코스 mental model, "how many people followed this course" is a
-- first-class social signal — but route_copies RLS only exposes aggregate
-- lineage to the original author. Mirror the like/bookmark/comment counter
-- pattern so the count lives on the (publicly readable) routes row and can be
-- shown to every viewer.
-- ============================================================
alter table routes add column copy_count integer not null default 0;

create or replace function private.bump_copy_counter()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update routes set copy_count = copy_count + 1 where id = new.original_route_id;
  elsif tg_op = 'DELETE' then
    update routes set copy_count = copy_count - 1 where id = old.original_route_id;
  end if;
  return null;
end $$;
revoke execute on function private.bump_copy_counter() from public, anon, authenticated;

create trigger route_copies_counter
  after insert or delete on route_copies
  for each row execute function private.bump_copy_counter();

-- backfill any lineage rows created before this counter existed
update routes r
set copy_count = (
  select count(*) from route_copies c where c.original_route_id = r.id
);
