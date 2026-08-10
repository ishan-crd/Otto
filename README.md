# Otto — the AI that earns its keep

**HACKNITE Code Royale 2026 · x402 & Algorand track.**

Otto is an autonomous AI agent with its own wallet. Give it a goal and a budget
and it hires paid micro-services, **paying each per use with USDC over x402** —
never over budget — and it **sells its own skill** to other agents to fund
itself. An AI with income, expenses, and a hard budget it can't break.

## Monorepo layout

```
otto/
  web/      backend: Hono x402 server + payment rails + built-in dashboard  (Node/TS)
  mobile/   Expo app: wallet, live payment feed, native glass sheets        (Expo Router)
  package.json   root orchestrator (dev / dev:web / dev:mob)
```

The two apps are **independent installs** (each has its own `node_modules` and
lockfile) — the root just orchestrates them. This sidesteps Expo + pnpm hoisting
headaches; nothing about the working mobile setup is shared or hoisted.

## Getting started

```bash
# one-time: install both apps
pnpm install          # root (installs `concurrently`)
pnpm install:all      # installs web/ and mobile/

# run everything
pnpm dev              # ▶ starts BOTH: web server + Expo, side by side
pnpm dev:web          # ▶ just the backend  → http://localhost:8787  (dashboard at /)
pnpm dev:mob          # ▶ just the Expo app  (press i / w)
```

Quality gates (whole repo): `pnpm typecheck` (web + mobile), `pnpm biomecheck`
(Biome lint + format), `pnpm biomecheck:fix` (auto-fix), and `pnpm check`
(typecheck + biome together). Web passthroughs: `pnpm test`, `pnpm dry-run`,
`pnpm gen-wallet`, `pnpm check-wallet`, `pnpm demo`.

## The web app (`web/`)
- **Dashboard at `/`** (`http://localhost:8787/`) — the live "watch money move" UI.
- **API index at `/api`**; endpoints under `/api/*` (wallet, ledger, run,
  earn/simulate, stream).
- Full backend docs, the x402 rubric mapping, the go/no-go dry run, and the
  architecture are in **`web/README.md`**, **`web/SETUP.md`**,
  **`web/ARCHITECTURE.md`**.

## The mobile app (`mobile/`)
Expo Router app that talks to the web API. Wallet hero, live payment stream, and
**native iOS Liquid Glass** bottom sheets. See **`mobile/README.md`**.

## Before the hackathon
See **`EVENT_DAY.md`** for the ordered runbook, and `web/SETUP.md` for the
Algorand testnet go/no-go test.
# Otto
