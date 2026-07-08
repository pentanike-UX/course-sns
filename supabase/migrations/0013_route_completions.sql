-- ============================================================
-- Course completion / review loop (P2).
-- After following a course, visitors can mark "다녀왔어요" with a
-- star rating + tip. Aggregated on the original route so 코스 becomes
-- a reusable guide, not just a diary entry.
-- ============================================================
create table route_completions (
  id uuid primary key default gen_random_uuid(),
  original_route_id uuid not null references routes (id) on delete cascade,
  completer_id uuid not null references profiles (id) on delete cascade,
  route_copy_id uuid references route_copies (id) on delete set null,
  rating smallint check (rating is null or (rating >= 1 and rating <= 5)),
  tip text check (tip is null or char_length(tip) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (original_route_id, completer_id)
);
create index route_completions_route_idx on route_completions (original_route_id, created_at desc);
create index route_completions_completer_idx on route_completions (completer_id, created_at desc);

alter table route_completions enable row level security;

-- Anyone who can read the original route can read completions (public social proof).
create policy route_completions_read on route_completions
  for select using (private.can_read_route(original_route_id));

-- Completer must have copied the route (lineage exists).
create policy route_completions_insert on route_completions
  for insert with check (
    completer_id = auth.uid()
    and private.can_read_route(original_route_id)
    and exists (
      select 1 from route_copies c
      where c.original_route_id = original_route_id
        and c.copier_id = auth.uid()
    )
  );

create policy route_completions_update on route_completions
  for update using (completer_id = auth.uid()) with check (completer_id = auth.uid());

create policy route_completions_delete on route_completions
  for delete using (completer_id = auth.uid());

-- Denormalized counters on routes (mirror copy_count / like_count).
alter table routes add column completion_count integer not null default 0;
alter table routes add column completion_rating_sum integer not null default 0;
alter table routes add column completion_rating_count integer not null default 0;

create or replace function private.bump_completion_counter()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update routes set
      completion_count = completion_count + 1,
      completion_rating_sum = completion_rating_sum + coalesce(new.rating, 0),
      completion_rating_count = completion_rating_count + (case when new.rating is not null then 1 else 0 end)
    where id = new.original_route_id;
  elsif tg_op = 'DELETE' then
    update routes set
      completion_count = completion_count - 1,
      completion_rating_sum = completion_rating_sum - coalesce(old.rating, 0),
      completion_rating_count = completion_rating_count - (case when old.rating is not null then 1 else 0 end)
    where id = old.original_route_id;
  elsif tg_op = 'UPDATE' then
    update routes set
      completion_rating_sum = completion_rating_sum - coalesce(old.rating, 0) + coalesce(new.rating, 0),
      completion_rating_count = completion_rating_count
        - (case when old.rating is not null then 1 else 0 end)
        + (case when new.rating is not null then 1 else 0 end)
    where id = new.original_route_id;
  end if;
  return null;
end $$;
revoke execute on function private.bump_completion_counter() from public, anon, authenticated;

create trigger route_completions_counter
  after insert or update or delete on route_completions
  for each row execute function private.bump_completion_counter();

-- Notify the original author when someone completes their course.
alter type notification_type add value 'completion';

create or replace function private.notify_completion()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner_id uuid;
begin
  select author_id into owner_id from routes where id = new.original_route_id;
  if owner_id is not null and owner_id <> new.completer_id then
    insert into notifications (recipient_id, actor_id, type, route_id)
    values (owner_id, new.completer_id, 'completion', new.original_route_id);
  end if;
  return null;
end $$;
revoke execute on function private.notify_completion() from public, anon, authenticated;
create trigger route_completions_notify
  after insert on route_completions
  for each row execute function private.notify_completion();
