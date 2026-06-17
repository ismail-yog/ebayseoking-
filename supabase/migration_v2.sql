-- migration_v2.sql
-- Update users table for Stripe subscription and credit limits
alter table public.users 
add column if not exists stripe_customer_id text,
add column if not exists stripe_subscription_id text,
add column if not exists plan_type text default 'free' check (plan_type in ('free', 'basic', 'pro', 'business', 'enterprise')),
add column if not exists optimization_limit integer default 10,
add column if not exists optimizations_used integer default 0;

-- Create indexes for performance
create index if not exists idx_users_stripe_customer on public.users(stripe_customer_id);
