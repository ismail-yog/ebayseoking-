-- promo_code_setup.sql
-- 1. Add expiration date tracking to user profiles
alter table public.profiles 
add column if not exists plan_expires_at timestamp with time zone;

-- 2. Create Promo Codes Table
create table if not exists public.promo_codes (
    id uuid default gen_random_uuid() primary key,
    code text not null unique,
    plan_type text not null check (plan_type in ('basic', 'pro', 'business', 'enterprise')),
    duration_months integer not null default 1,
    is_used boolean default false not null,
    used_by uuid references auth.users(id) on delete set null,
    used_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (No public read/write policies. Bypassed securely via Admin/Service Role client)
alter table public.promo_codes enable row level security;
