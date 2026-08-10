-- Otto: complete Supabase setup — paste this ONCE into the SQL editor and Run.
-- (Combines migrations 0001 + 0002; idempotent, safe to re-run.)

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

-- Otto — server state in Postgres so nothing lives only in memory:
--   ledger     append-only record of every micropayment (in + out)
--   app_state  key/value snapshots (wallet totals, autonomy policy, firewall)
--
-- The server writes these with the publishable key (anon role) — fine for a
-- demo/hackathon deployment. For hardened production, switch the policies to
-- the service_role and give the server that key instead.

create table if not exists public.ledger (
  id            uuid primary key,
  direction     text not null check (direction in ('in', 'out')),
  amount_micro  bigint not null,
  counterparty  text not null default '',
  resource      text not null default '',
  tx_id         text not null default '',
  explorer_url  text not null default '',
  mock          boolean not null default true,
  task_id       text,
  ts            timestamptz not null default now()
);

create index if not exists ledger_ts_idx on public.ledger (ts desc);

create table if not exists public.app_state (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.ledger enable row level security;
alter table public.app_state enable row level security;

drop policy if exists "ledger_server_all" on public.ledger;
create policy "ledger_server_all"
  on public.ledger for all
  to anon, authenticated
  using (true) with check (true);

drop policy if exists "app_state_server_all" on public.app_state;
create policy "app_state_server_all"
  on public.app_state for all
  to anon, authenticated
  using (true) with check (true);
