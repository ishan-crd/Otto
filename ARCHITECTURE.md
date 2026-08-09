# Architecture

## The one idea: a swappable payment rail

Everything in Otto talks to a single interface, `PaymentRail`
(`src/rails/types.ts`), with two implementations:

- **`MockRail`** — instant, offline, fake-but-realistic tx ids. Lets you build
  and demo the whole product (and the frontend) with no wallet and no network.
- **`AlgorandRail`** — real USDC ASA settlement on Algorand testnet.

`getRail()` picks one from the `RAIL` env var. **No other file knows or cares
which rail is active.** That's what makes the mock→real switch a one-line change,
and what lets the live demo fall back to mock instantly if testnet is flaky.

## The two halves of x402 (matches the whitepaper, Figure 1)

```
        SERVER (Otto earning)                 CLIENT (Otto spending)
        src/x402/middleware.ts                src/client/x402Client.ts
   ┌────────────────────────────────┐    ┌──────────────────────────────┐
   │ no X-PAYMENT → 402 + challenge  │    │ call → get 402 + requirements│
   │ X-PAYMENT →                     │    │ ► SPEND FIREWALL checks first│
   │   /verify   (before the work)   │    │ sign → retry with X-PAYMENT  │
   │   run handler   (the work)      │    │ read X-PAYMENT-RESPONSE       │
   │   /settle   (after the work)    │    │ → debit Otto → record ledger │
   │   credit Otto + X-PAYMENT-RESP  │    │                              │
   └────────────────────────────────┘    └──────────────────────────────┘
```

The **order is load-bearing and spec-exact**: verify → do work → settle. The
server never settles before the work, and never does the work before verifying.
`nonce` + `paymentId` + `expiresAt` are tracked in `src/x402/challenges.ts`, so a
replayed or expired `X-PAYMENT` is rejected. On the real rail, `verify()` and
`settle()` map to the facilitator's `/verify` and `/settle` endpoints
(`AlgorandRail.settleViaFacilitator` shows the delegated form).

The **concierge** (`src/agent/concierge.ts`) is the client calling the server's
own paid endpoints — a genuine end-to-end 402 round-trip per step. That's the
aggregator the brief calls the "Entry Management Framework".

## Money flow

```
                        ┌─────────────┐
  external agents ─$──▶ │             │ ──$──▶ flights / hotels / search / ...
  (POST /earn/simulate) │  OTTO WALLET│        (paid x402 services)
                        │  earned ↑   │
                        │  spent  ↓   │   every payment ──▶ LEDGER ──▶ /api/stream (SSE)
                        └─────────────┘                              (animated dashboard)
                               ▲
                        SPEND FIREWALL gates every outgoing payment
                        (per-task budget · per-session budget · balance)
```

## Design choices that matter for judging

- **All money is integer micro-USDC** (1 USDC = 1e6). No float drift. Display
  floats are derived at the edge only.
- **The payer is the agent**, satisfying "clearly identified paying user, no
  subscriptions" (25%). Each service has a real per-call price.
- **The firewall runs *before* any settlement**, in `payAndFetch` — so a blocked
  spend never touches the chain. That's the innovation beat (15%) and the demo's
  emergency-brake moment.
- **Deterministic planner** (`src/agent/planner.ts`) keeps the stage demo
  reliable; swap in an LLM by emitting `{serviceId, input}` and passing it
  through `serviceById()` — the payment plumbing is untouched.

## Where the frontend plugs in
Consume `src/api/dashboard.ts`: REST for actions + `/api/stream` (SSE) for the
live money animation. Nothing in the backend renders UI — it's all yours to
build on event day.
