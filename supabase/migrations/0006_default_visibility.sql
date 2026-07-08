-- Per-user default visibility for newly created routes (Settings → 공개 범위 기본값).
alter table profiles add column default_visibility visibility not null default 'private';
