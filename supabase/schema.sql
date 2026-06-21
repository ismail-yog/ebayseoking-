-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users Table (extending Supabase Auth user)
create table if not exists public.users (
    id uuid references auth.users on delete cascade primary key,
    email text not null unique,
    full_name text,
    avatar_url text,
    subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'enterprise')),
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    plan_type text default 'free' check (plan_type in ('free', 'basic', 'pro', 'business', 'enterprise')),
    optimization_limit integer default 50,
    optimizations_used integer default 0,
    plan_expires_at timestamp with time zone,
    stripe_customer_id text,
    stripe_subscription_id text
);

-- RLS for Users
alter table public.users enable row level security;

create policy "Users can view their own record" on public.users
    for select using (auth.uid() = id);

create policy "Users can update their own record" on public.users
    for update using (auth.uid() = id);

-- Trigger to automatically create user on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it already exists, then create it
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Store Credentials Table (Stores encrypted eBay OAuth tokens)
create table if not exists public.store_credentials (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    ebay_store_name text,
    ebay_username text,
    encrypted_access_token text not null,
    encrypted_refresh_token text not null,
    token_expires_at timestamp with time zone not null,
    refresh_token_expires_at timestamp with time zone not null,
    iv text not null,          -- Initialization Vector for AES-256-GCM
    auth_tag text not null,    -- Authentication tag for AES-256-GCM
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_user_store unique (user_id)
);

-- RLS for Store Credentials
alter table public.store_credentials enable row level security;

create policy "Users can manage their own credentials" on public.store_credentials
    for all using (auth.uid() = user_id);

-- 3. Product Listings Table
create table if not exists public.product_listings (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    ebay_item_id text not null,
    title text not null,
    optimized_title text,
    description text,
    optimized_description text,
    image_urls text[] default '{}'::text[],
    price numeric(10, 2),
    currency text default 'USD',
    status text default 'Pending' not null, -- 'Pending', 'In Progress', 'Optimized', 'Failed'
    error_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_user_item unique (user_id, ebay_item_id)
);

-- RLS for Product Listings
alter table public.product_listings enable row level security;

create policy "Users can view their own listings" on public.product_listings
    for select using (auth.uid() = user_id);

create policy "Users can modify their own listings" on public.product_listings
    for all using (auth.uid() = user_id);
