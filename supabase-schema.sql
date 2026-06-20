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

create table if not exists public.restaurants (
  id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  login citext unique not null,
  password text not null,
  menu_state jsonb not null default '{"nick":"Restaurante","name":"Cardapio","categories":[],"items":[]}'::jsonb,
  orders jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.restaurants add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table public.restaurants add column if not exists name text;
alter table public.restaurants add column if not exists login citext;
alter table public.restaurants add column if not exists password text;
alter table public.restaurants add column if not exists menu_state jsonb not null default '{"nick":"Restaurante","name":"Cardapio","categories":[],"items":[]}'::jsonb;
alter table public.restaurants add column if not exists orders jsonb not null default '[]'::jsonb;
alter table public.restaurants add column if not exists created_at timestamptz not null default now();
alter table public.restaurants add column if not exists updated_at timestamptz not null default now();

create unique index if not exists restaurants_login_unique_idx on public.restaurants (lower(login::text));
create index if not exists restaurants_owner_user_id_idx on public.restaurants (owner_user_id);

alter table public.profiles enable row level security;
alter table public.app_states enable row level security;
alter table public.restaurants enable row level security;

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

drop policy if exists "Users can read own restaurants" on public.restaurants;
create policy "Users can read own restaurants"
on public.restaurants
for select
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists "Users can create own restaurants" on public.restaurants;
create policy "Users can create own restaurants"
on public.restaurants
for insert
to authenticated
with check (auth.uid() = owner_user_id);

drop policy if exists "Users can update own restaurants" on public.restaurants;
create policy "Users can update own restaurants"
on public.restaurants
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists "Users can delete own restaurants" on public.restaurants;
create policy "Users can delete own restaurants"
on public.restaurants
for delete
to authenticated
using (auth.uid() = owner_user_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.app_states to authenticated;
grant select, insert, update, delete on public.restaurants to authenticated;

create or replace function public.login_restaurant(p_login text, p_password text)
returns table (
  id text,
  name text,
  login citext,
  owner_user_id uuid,
  menu_state jsonb,
  orders jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    restaurants.id,
    restaurants.name,
    restaurants.login,
    restaurants.owner_user_id,
    restaurants.menu_state,
    restaurants.orders
  from public.restaurants
  where lower(restaurants.login::text) = lower(p_login)
    and restaurants.password = p_password
  limit 1;
$$;

create or replace function public.save_restaurant_menu(
  p_restaurant_id text,
  p_password text,
  p_menu_state jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.restaurants
  set
    menu_state = p_menu_state,
    updated_at = now()
  where id = p_restaurant_id
    and password = p_password;
$$;

grant execute on function public.login_restaurant(text, text) to anon, authenticated;
grant execute on function public.save_restaurant_menu(text, text, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
