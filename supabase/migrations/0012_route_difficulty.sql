-- ============================================================
-- Course difficulty (걷기/이동 강도) — a course-native field that helps people
-- decide whether a course fits them (가볍게 / 보통 / 많이 걸어요). Nullable so
-- existing courses stay valid; constrained to a small key set.
-- ============================================================
alter table routes
  add column difficulty text check (difficulty in ('easy', 'normal', 'hard'));
