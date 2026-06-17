-- migration_v2.sql
-- Update profiles table for Stripe subscription and credit limits
alter table public.profiles 
add column if not exists stripe_customer_id text,
add column if not exists stripe_subscription_id text,
add column if not exists plan_type text default 'free' check (plan_type in ('free', 'basic', 'pro', 'business', 'enterprise')),
add column if not exists optimization_limit integer default 10,
add column if not exists optimizations_used integer default 0;

-- Create indexes for performance
create index if not exists idx_profiles_stripe_customer on public.profiles(stripe_customer_id);
