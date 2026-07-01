create extension if not exists citext;
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
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

create table if not exists public.restaurant_customers (
  id text primary key,
  restaurant_id text not null references public.restaurants(id) on delete cascade,
  name text not null,
  login citext unique not null,
  password text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists name text;

alter table public.restaurants add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table public.restaurants add column if not exists name text;
alter table public.restaurants add column if not exists login citext;
alter table public.restaurants add column if not exists password text;
alter table public.restaurants add column if not exists menu_state jsonb not null default '{"nick":"Restaurante","name":"Cardapio","categories":[],"items":[]}'::jsonb;
alter table public.restaurants add column if not exists orders jsonb not null default '[]'::jsonb;
alter table public.restaurants add column if not exists created_at timestamptz not null default now();
alter table public.restaurants add column if not exists updated_at timestamptz not null default now();

alter table public.restaurant_customers add column if not exists restaurant_id text references public.restaurants(id) on delete cascade;
alter table public.restaurant_customers add column if not exists name text;
alter table public.restaurant_customers add column if not exists login citext;
alter table public.restaurant_customers add column if not exists password text;
alter table public.restaurant_customers add column if not exists created_at timestamptz not null default now();

create unique index if not exists restaurants_login_unique_idx on public.restaurants (lower(login::text));
create index if not exists restaurants_owner_user_id_idx on public.restaurants (owner_user_id);
create unique index if not exists restaurant_customers_login_unique_idx on public.restaurant_customers (lower(login::text));
create index if not exists restaurant_customers_restaurant_id_idx on public.restaurant_customers (restaurant_id);

alter table public.profiles enable row level security;
alter table public.app_states enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_customers enable row level security;

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
grant select, insert, update, delete on public.restaurant_customers to authenticated;

drop function if exists public.login_restaurant(text, text);
drop function if exists public.save_restaurant_menu(text, text, jsonb);
drop function if exists public.create_restaurant_customer(text, text, text, text, text);
drop function if exists public.list_restaurant_customers(text, text);
drop function if exists public.login_customer(text, text);
drop function if exists public.delete_restaurant_customer(text, text, text);
drop function if exists public.get_public_restaurant(text);
drop function if exists public.submit_restaurant_order(text, jsonb);

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

create or replace function public.create_restaurant_customer(
  p_restaurant_id text,
  p_restaurant_password text,
  p_name text,
  p_login text,
  p_password text
)
returns table (
  id text,
  name text,
  login citext,
  password text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.restaurants
    where restaurants.id = p_restaurant_id
      and restaurants.password = p_restaurant_password
  ) then
    raise exception 'Restaurante ou senha inválidos.';
  end if;

  return query
  insert into public.restaurant_customers (id, restaurant_id, name, login, password)
  values ('customer-' || replace(gen_random_uuid()::text, '-', ''), p_restaurant_id, p_name, p_login, p_password)
  returning
    restaurant_customers.id,
    restaurant_customers.name,
    restaurant_customers.login,
    restaurant_customers.password,
    restaurant_customers.created_at;
end;
$$;

create or replace function public.list_restaurant_customers(
  p_restaurant_id text,
  p_password text
)
returns table (
  id text,
  name text,
  login citext,
  password text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    restaurant_customers.id,
    restaurant_customers.name,
    restaurant_customers.login,
    restaurant_customers.password,
    restaurant_customers.created_at
  from public.restaurant_customers
  join public.restaurants
    on restaurants.id = restaurant_customers.restaurant_id
  where restaurant_customers.restaurant_id = p_restaurant_id
    and restaurants.password = p_password
  order by restaurant_customers.created_at desc;
$$;

create or replace function public.login_customer(
  p_login text,
  p_password text
)
returns table (
  customer_id text,
  customer_name text,
  customer_login citext,
  restaurant_id text,
  restaurant_name text,
  restaurant_login citext,
  menu_state jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    restaurant_customers.id as customer_id,
    restaurant_customers.name as customer_name,
    restaurant_customers.login as customer_login,
    restaurants.id as restaurant_id,
    restaurants.name as restaurant_name,
    restaurants.login as restaurant_login,
    restaurants.menu_state
  from public.restaurant_customers
  join public.restaurants
    on restaurants.id = restaurant_customers.restaurant_id
  where lower(restaurant_customers.login::text) = lower(p_login)
    and restaurant_customers.password = p_password
  limit 1;
$$;

create or replace function public.delete_restaurant_customer(
  p_restaurant_id text,
  p_password text,
  p_customer_id text
)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.restaurant_customers
  using public.restaurants
  where restaurant_customers.id = p_customer_id
    and restaurant_customers.restaurant_id = p_restaurant_id
    and restaurants.id = restaurant_customers.restaurant_id
    and restaurants.password = p_password;
$$;

grant execute on function public.login_restaurant(text, text) to anon, authenticated;
grant execute on function public.save_restaurant_menu(text, text, jsonb) to anon, authenticated;
grant execute on function public.create_restaurant_customer(text, text, text, text, text) to anon, authenticated;
grant execute on function public.list_restaurant_customers(text, text) to anon, authenticated;
grant execute on function public.login_customer(text, text) to anon, authenticated;
grant execute on function public.delete_restaurant_customer(text, text, text) to anon, authenticated;

create or replace function public.get_public_restaurant(p_login text)
returns table (
  id text,
  name text,
  login citext,
  menu_state jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    restaurants.id,
    restaurants.name,
    restaurants.login,
    restaurants.menu_state
  from public.restaurants
  where lower(restaurants.login::text) = lower(p_login)
  limit 1;
$$;

create or replace function public.submit_restaurant_order(
  p_restaurant_id text,
  p_order jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.restaurants
  set
    orders = coalesce(orders, '[]'::jsonb) || jsonb_build_array(p_order),
    updated_at = now()
  where id = p_restaurant_id;
$$;

grant execute on function public.get_public_restaurant(text) to anon, authenticated;
grant execute on function public.submit_restaurant_order(text, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
