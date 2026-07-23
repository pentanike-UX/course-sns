-- ============================================================
-- Wave E3: transfer subscription delivery
--  - copy: someone followed (copied) your course → notify author
--  - course_publish: followed maker publishes → notify followers
-- ============================================================

alter type notification_type add value 'copy';
alter type notification_type add value 'course_publish';

-- Maker feedback: someone brought your course in via 따라가기.
create or replace function private.notify_copy()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner_id uuid;
begin
  if new.original_route_id is null then
    return null;
  end if;
  select author_id into owner_id from routes where id = new.original_route_id;
  if owner_id is not null and owner_id <> new.copier_id then
    insert into notifications (recipient_id, actor_id, type, route_id)
    values (owner_id, new.copier_id, 'copy', new.original_route_id);
  end if;
  return null;
end $$;
revoke execute on function private.notify_copy() from public, anon, authenticated;
create trigger route_copies_notify
  after insert on route_copies
  for each row execute function private.notify_copy();

-- Subscriber delivery: when a followed maker publishes a course.
create or replace function private.notify_course_publish()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.visibility <> 'public' then
    return null;
  end if;
  if tg_op = 'UPDATE' and old.visibility = 'public' then
    return null;
  end if;

  insert into notifications (recipient_id, actor_id, type, route_id)
  select f.follower_id, new.author_id, 'course_publish', new.id
  from follows f
  where f.followee_id = new.author_id
    and f.follower_id <> new.author_id;

  return null;
end $$;
revoke execute on function private.notify_course_publish() from public, anon, authenticated;
create trigger routes_publish_notify
  after insert or update of visibility on routes
  for each row execute function private.notify_course_publish();
