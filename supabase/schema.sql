-- Money Tracker schema for Supabase (Postgres)
-- Apply in Supabase SQL editor, or via migrations tooling.

create extension if not exists "pgcrypto";

-- Users (1:1 with auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  base_currency text not null default 'USD',
  created_at timestamptz not null default now()
);

-- Categories (income/expense)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text,
  icon text,
  created_at timestamptz not null default now(),
  unique (user_id, type, name)
);

create index if not exists categories_user_id_idx on public.categories(user_id);

-- Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null,
  category_id uuid references public.categories(id) on delete set null,
  description text,
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on public.transactions(user_id, date desc);
create index if not exists transactions_user_type_date_idx on public.transactions(user_id, type, date desc);

-- Exchange rates for conversions to user base currency
create table if not exists public.exchange_rates (
  from_currency text not null,
  to_currency text not null,
  rate numeric(18, 8) not null check (rate > 0),
  updated_at timestamptz not null default now(),
  primary key (from_currency, to_currency)
);

-- Trigger to keep public.users in sync with auth.users
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.exchange_rates enable row level security;

-- users: only self can read/update. Inserts only happen via trigger.
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- categories: owner-only CRUD
drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own"
  on public.categories
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own"
  on public.categories
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own"
  on public.categories
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own"
  on public.categories
  for delete
  to authenticated
  using (user_id = auth.uid());

-- transactions: owner-only CRUD
drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
  on public.transactions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
  on public.transactions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own"
  on public.transactions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own"
  on public.transactions
  for delete
  to authenticated
  using (user_id = auth.uid());

-- exchange_rates: readable to authenticated users; writes should be service-role/admin only
drop policy if exists "exchange_rates_read_authenticated" on public.exchange_rates;
create policy "exchange_rates_read_authenticated"
  on public.exchange_rates
  for select
  to authenticated
  using (true);

