# Demo & Pitch Script (90 seconds)

The goal: judges see **real money moving autonomously**, then see a **hard safety
brake**. That combination is the win.

## The 90-second pitch

> "Today, if you want an AI to actually *do* things on the web, you sign up for
> ten services and enter your credit card ten times. AI agents can't do that.
>
> Meet **Otto** — an AI with its own wallet. Watch."

**[Beat 1 — Otto works, ~25s]**
Type a goal: *"Plan a weekend trip to Goa under budget."* Hit run.
> "Otto doesn't own flight data or hotel data — nobody does, it's behind paywalls.
> So it *pays for what it needs*, per call, in USDC on Algorand."

Point at the dashboard: payments stream out, **real testnet tx ids** appear, each
clickable to the explorer. Otto returns a finished trip plan.

**[Beat 2 — Otto earns, ~20s]**
Trigger the earn simulation.
> "And Otto isn't just spending *your* money. It sells its own skill — contract
> review — to *other* agents. Watch its balance go **up** as strangers' AIs pay
> it. Otto has income and expenses. It funds its own errands."

**[Beat 3 — the firewall, the mic-drop, ~25s]**
Set the budget to almost nothing. Run the same goal.
> "But an AI that spends money on its own is terrifying — unless it *can't*
> overspend."

The dashboard shows it pay for step one… then **🛑 the Spend Firewall blocks the
next payment mid-task**, on stage. Nothing hits the chain.
> "One instruction, real money, real blockchain settlement — and a hard budget it
> physically cannot break. That's Otto: an AI that earns its keep, and never
> spends a rupee you didn't allow."

## The dashboard you're building (event day)
Three live panels, all fed by `GET /api/stream` (SSE):
1. **Wallet** — big number, earned (green ↑) vs spent (red ↓), animating.
2. **Payment feed** — each tx as a row: amount, counterparty, clickable tx id.
3. **Run panel** — goal input + budget slider + the returned report; when
   `blocked` comes back, flash the firewall banner.

## Pre-demo checklist
- [ ] `.env` is `RAIL=algorand` and `pnpm dry-run` passed today
- [ ] Payer wallet has test ALGO **and** test USDC, both opted in
- [ ] A backup: if testnet is down, `RAIL=mock` gives an identical-looking demo
      instantly (say so honestly only if asked — the tx ids are labelled MOCK)
- [ ] Explorer tab open, zoomed in, ready to click a real tx id
- [ ] Budget-block goal rehearsed so the brake fires on cue
