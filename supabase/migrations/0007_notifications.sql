-- ============================================================
-- Notifications (phase 2 social): like / comment / follow events.
-- Inserted by SECURITY DEFINER triggers; recipients read/update/delete
-- only their own rows.
-- ============================================================
create type notification_type as enum ('like', 'comment', 'follow');

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles (id) on delete cascade,
  actor_id uuid not null references profiles (id) on delete cascade,
  type notification_type not null,
  route_id uuid references routes (id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on notifications (recipient_id, created_at desc);

alter table notifications enable row level security;
create policy notifications_read on notifications for select using (recipient_id = auth.uid());
create policy notifications_update on notifications for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy notifications_delete on notifications for delete using (recipient_id = auth.uid());

create or replace function private.notify_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner_id uuid;
begin
  select author_id into owner_id from routes where id = new.route_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into notifications (recipient_id, actor_id, type, route_id)
    values (owner_id, new.user_id, 'like', new.route_id);
  end if;
  return null;
end $$;
revoke execute on function private.notify_like() from public, anon, authenticated;
create trigger likes_notify after insert on likes for each row execute function private.notify_like();

create or replace function private.notify_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner_id uuid;
begin
  select author_id into owner_id from routes where id = new.route_id;
  if owner_id is not null and owner_id <> new.author_id then
    insert into notifications (recipient_id, actor_id, type, route_id)
    values (owner_id, new.author_id, 'comment', new.route_id);
  end if;
  return null;
end $$;
revoke execute on function private.notify_comment() from public, anon, authenticated;
create trigger comments_notify after insert on comments for each row execute function private.notify_comment();

create or replace function private.notify_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (recipient_id, actor_id, type)
  values (new.followee_id, new.follower_id, 'follow');
  return null;
end $$;
revoke execute on function private.notify_follow() from public, anon, authenticated;
create trigger follows_notify after insert on follows for each row execute function private.notify_follow();
