-- Emergency AI subscription state.
-- Webhooks (stripe-webhook) and checkout (subscription-checkout) read/write here.

create extension if not exists "pgcrypto";

create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  plan                    text not null,
  status                  text not null,
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  metadata                jsonb not null default '{}'::jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists subscriptions_user_idx        on public.subscriptions (user_id, created_at desc);
create index if not exists subscriptions_status_idx      on public.subscriptions (status);
create index if not exists subscriptions_customer_idx    on public.subscriptions (stripe_customer_id);

alter table public.subscriptions enable row level security;

-- Owners may read their own subscription rows.
drop policy if exists "subscriptions read own" on public.subscriptions;
create policy "subscriptions read own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Inserts/updates flow only through the service role (webhooks, edge functions).
-- No anon write policies are defined; anything without service-role bypass is denied.

-- Touch updated_at on every change.
create or replace function public.touch_subscriptions_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_touch on public.subscriptions;
create trigger subscriptions_touch
  before update on public.subscriptions
  for each row execute procedure public.touch_subscriptions_updated_at();
