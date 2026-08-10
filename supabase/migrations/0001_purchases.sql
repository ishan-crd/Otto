-- Otto — prompt purchases, one row per paid prompt.
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run),
-- or `supabase db push` if you use the CLI. The server auto-detects this table
-- and switches from user-metadata storage to it — no code change needed.

create table if not exists public.purchases (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  prompt        text not null,
  model         text not null,
  output_tokens integer not null default 0,
  price_usdc    numeric(12, 6) not null default 0,
  tx_id         text not null default '',
  explorer_url  text not null default '',
  created_at    timestamptz not null default now()
);

create index if not exists purchases_user_created_idx
  on public.purchases (user_id, created_at desc);

-- Row-level security: users see and write ONLY their own purchases. This is
-- what lets the app run on the publishable key + each user's JWT — no
-- service-role key anywhere.
alter table public.purchases enable row level security;

drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own"
  on public.purchases for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "purchases_insert_own" on public.purchases;
create policy "purchases_insert_own"
  on public.purchases for insert
  to authenticated
  with check (auth.uid() = user_id);
