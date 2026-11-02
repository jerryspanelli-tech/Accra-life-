alter table public.player_profiles
  add column if not exists age integer;

alter table public.player_profiles
  drop constraint if exists player_profiles_age_check;

alter table public.player_profiles
  add constraint player_profiles_age_check
  check (age is null or age between 1 and 120);
