# 🤖 Otto — the AI that earns its keep

**HACKNITE Code Royale 2026 · x402 & Algorand track.**

Otto is an autonomous AI agent with its own wallet. Give it a goal and a budget
and it hires paid micro-services across the web, **paying each one per use with
USDC over x402** — never spending a rupee over the budget you set. And it doesn't
only spend: Otto **sells its own skills** to other agents, so it earns money to
fund its own errands. An AI with income, expenses, and a hard budget it cannot
break.

> **One line:** We gave an AI a debit card — then it went and got a job to keep
> it funded.

This repo is the **complete backend + payment infrastructure.** It runs today
with zero config (mock rail) and flips to real Algorand testnet settlement with
one env change. **You build the frontend during the hackathon; this does
everything else.**

---

## Quick start (works right now, no wallet needed)

```bash
npm install
npm run dev          # starts Otto on http://localhost:8787 (mock rail)
```

In another terminal:

```bash
npm run demo         # scripted walk-through: earn → work → firewall block
```

Or drive it directly:

```bash
# Otto runs a goal, paying for each service it needs:
curl -s localhost:8787/api/run -H 'content-type: application/json' \
  -d '{"goal":"plan a weekend trip to Goa","budgetUsdc":0.10}' | jq

# Set the budget too low and watch the Spend Firewall stop it mid-task:
curl -s localhost:8787/api/run -H 'content-type: application/json' \
  -d '{"goal":"plan a weekend trip to Goa","budgetUsdc":0.015}' | jq '.blocked'

# An external agent pays Otto (earnings tick up):
curl -s -X POST localhost:8787/api/earn/simulate | jq
```

---

## What maps to the judging rubric

| Weight | Criterion | Where it lives |
|---|---|---|
| 30% | x402 Protocol Flow | `src/x402/middleware.ts` — spec-exact **402 → verify → work → settle → X-PAYMENT-RESPONSE** (whitepaper Fig. 1) + `src/client/x402Client.ts` (sign + auto-retry). Canonical `PaymentRequirements` body, `X-PAYMENT` header, `nonce`/`expiresAt`/`paymentId` replay+expiry guards. |
| 25% | Real Pay-Per-Call Model | The payer is the **agent itself**; every call is priced, no subscriptions (`src/services/registry.ts`) |
| 20% | Technical Execution & Algorand | `src/rails/algorandRail.ts` — real USDC ASA settlement + tx id |
| 15% | Innovation & Utility | The **Spend Firewall** (`src/guard/`) + the **earn-and-spend economy** (`src/earn/`) — the aggregator/"Entry Management Framework" is `src/agent/concierge.ts` |
| 10% | Documentation & Deployment | This README + `SETUP.md` + `ARCHITECTURE.md` |

---

## Frontend API (what you'll build against during the hackathon)

Base URL `http://localhost:8787`. CORS is open. Money is returned in both
`micro` (integer micro-USDC) and `usdc` (float, for display).

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/run` | `{ goal, budgetUsdc? }` → runs the concierge, returns steps + receipts + report |
| `GET` | `/api/wallet` | balance / earned / spent / topped-up |
| `GET` | `/api/ledger` | every payment (in & out) with tx ids + explorer links |
| `GET` | `/api/services` | the paid-service marketplace + prices |
| `POST` | `/api/earn/simulate` | simulate an external agent paying Otto |
| `GET` | `/api/stream` | **SSE** live stream of every payment + wallet change (for the animated dashboard) |
| `GET` | `/api/health` | health + which rail is active |

The `/api/stream` endpoint emits `payment`, `wallet`, and `ping` events — wire it
straight into your dashboard so money animates live on stage.

---

## Going to real Algorand testnet

See **`SETUP.md`** — the pre-hackathon checklist and the go/no-go dry run. Short
version: fund a testnet wallet, set `RAIL=algorand` + `PAYER_MNEMONIC` in `.env`,
run `npm run dry-run`, confirm a real tx id. That's the gate that says x402 is
safe to build on.

## Layout

```
src/
  config.ts            env + money helpers (all money is integer micro-USDC)
  rails/               THE payment abstraction — mock vs real Algorand
  x402/middleware.ts   server: 402 challenge + settle (Otto earning)
  client/x402Client.ts client: pay + auto-retry (Otto spending) + firewall call
  guard/               the Spend Firewall + wallet
  services/            the paid micro-APIs Otto buys and sells
  agent/               planner + concierge (the aggregator)
  earn/                Otto's income side
  ledger/              append-only record streamed to the dashboard
  api/dashboard.ts     the REST + SSE the frontend consumes
scripts/
  dry-run.ts           the pre-event go/no-go test
  demo.ts              scripted pitch rehearsal
```
