# Event Day — Otto quick reference

Everything below is already built and verified in mock mode. This is your
ordered runbook for Aug 10.

## The night before / first 30 min

```bash
cd ~/Desktop/otto
pnpm install && pnpm install:all   # if on a fresh machine (root + web + mobile)
pnpm typecheck && pnpm test && pnpm dry-run   # all green = base is intact
```

Go real (the one thing that needs your wallet). Your `.env` lives in `web/`:

```bash
pnpm gen-wallet          # mint a TestNet account (or export from Pera)
#  → put RAIL=algorand + PAYER_MNEMONIC in web/.env
#  → fund ALGO:  https://bank.testnet.algorand.network/
#  → get USDC :  https://faucet.circle.com/  (Algorand TestNet)
pnpm check-wallet        # must be all ✅
pnpm dry-run             # prints a REAL tx id + explorer link = x402 is GO
```

If `dry-run` shows a real tx id, screenshot it. That's your proof the 30%
protocol criterion is fully satisfied.

## Running it during the build

```bash
pnpm dev                 # ▶ starts BOTH web + mobile
pnpm dev:web             # ▶ just the backend
pnpm dev:mob             # ▶ just the Expo app
# open http://localhost:8787/        (the dashboard)
# open http://localhost:8787/api     (API index)
pnpm demo                # scripted earn → spend → firewall (another terminal)
```

## What you build tomorrow (the fun part)
- Your polished frontend and/or the Expo app — wire to the same API
  (`/api/wallet`, `/api/ledger`, `/api/run`, `/api/earn/simulate`, `/api/stream`).
- CORS is open; money comes back as both `micro` (int) and `usdc` (float).
- Nothing else in the backend needs to change.

## Demo checklist (see DEMO_SCRIPT.md for the full script)
- [ ] `RAIL=algorand`, `check-wallet` green, explorer tab open
- [ ] Rehearse: Run Otto (spends) → Simulate earning (earns) → low budget = 🛑 firewall
- [ ] Backup: if testnet is down, `RAIL=mock` gives an identical-looking demo instantly

## If something breaks
| Problem | Do this |
|---|---|
| dry-run fails on chain | `pnpm check-wallet` — fix the ❌ items |
| server won't start | check nothing else is on `:8787` (change `PORT` in .env) |
| facilitator settle errors | fall back to direct algod (default) — it already satisfies the rubric |
| totally stuck on-chain | `RAIL=mock` — the whole product still demos end-to-end |

## Bring (from the participant guide)
Valid ID · laptop + charger · **extension board** · phone + charger · water · be on time.
