create extension if not exists citext;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nick citext unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.app_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  admin_state jsonb not null,
  restaurant_state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.app_states enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can read own app state" on public.app_states;
create policy "Users can read own app state"
on public.app_states
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own app state" on public.app_states;
create policy "Users can create own app state"
on public.app_states
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own app state" on public.app_states;
create policy "Users can update own app state"
on public.app_states
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
