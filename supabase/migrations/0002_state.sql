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
