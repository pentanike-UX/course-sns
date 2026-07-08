-- ============================================================
-- Course-first default: new courses are meant to be shared, so a fresh
-- profile now defaults to public visibility (the create wizard still shows an
-- explicit visibility step the user can flip). Plans stay private via the
-- create page. Pre-launch backfill flips rows still holding the old 'private'
-- default so existing (demo) accounts follow the new mental model too.
-- ============================================================
alter table profiles alter column default_visibility set default 'public';

update profiles set default_visibility = 'public' where default_visibility = 'private';
