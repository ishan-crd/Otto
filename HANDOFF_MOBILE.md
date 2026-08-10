# Handoff — Build the Otto **mobile app UI**

You are picking up the **mobile app** for **Otto** (HACKNITE x402/Algorand
hackathon). Another agent is actively working on the **`web/`** backend + web
dashboard in parallel. **Your job is the `mobile/` app UI only.** Read the
"Working agreement" section first — it keeps us from colliding.

---

## 0. Working agreement (READ FIRST)

- **Only touch files under `mobile/`.** Do not edit `web/`, root configs, or the
  root `package.json`. The other agent owns those.
- **Work on your own branch.** From the repo root:
  ```bash
  git checkout -b mobile-ui
  ```
  Ideally use a separate **git worktree** so you never share a working copy:
  ```bash
  git worktree add ../otto-mobile mobile-ui && cd ../otto-mobile
  ```
- **Open a PR when done.** If the repo has a GitHub remote, push and
  `gh pr create`. If it has **no remote yet** (likely), tell the user — they need
  to create a GitHub repo and push first, or you just leave the `mobile-ui`
  branch for a local merge.
- **Commit only `mobile/` changes.** End commit messages with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Before committing, run the gates (from repo root): `pnpm -C mobile exec tsc
  --noEmit` and `pnpm exec biome check mobile` — both must be clean.

This will **not** disturb the other agent as long as you stay on your branch and
inside `mobile/`.

---

## 1. What Otto is

Otto is an autonomous AI agent with its own wallet. It **pays other agents
per-task** (x402 micropayments in USDC on Algorand) to get work done — e.g.
booking a trip by hiring specialist agents — and it also **sells its own skills**
to other agents, so it earns and spends. Think "a freelance marketplace where
agents hire agents," with a hard spend budget it can't break.

Monorepo:
```
otto/
  web/      backend (Hono x402 server) + web dashboard   ← other agent
  mobile/   Expo app (YOUR SCOPE)
```

## 2. The mobile app today (`mobile/`)

- **Expo SDK 57 + Expo Router** (file-based routing in `mobile/app/`), pnpm,
  TypeScript, dark mode forced (`app.json` `userInterfaceStyle: "dark"`).
- Talks to the backend over HTTP (`mobile/src/api.ts`). Money comes back as both
  `micro` (int) and `usdc` (float).
- Current screens:
  - `app/_layout.tsx` — Stack + native **formSheet** config (iOS Liquid Glass:
    `contentStyle: transparent`; opaque `c.surface` fallback on Android).
  - `app/index.tsx` — home: wallet hero, goal control, live payment stream.
  - `app/breakdown.tsx`, `app/test-sheet.tsx` — glass sheet routes.
  - `src/components/GlassSheet.tsx` — `SheetContainer` / `SheetHeader` /
    `SheetDivider` primitives for sheet routes.
  - `src/theme.ts` — design tokens (below).

### Run it
```bash
# backend (the other agent's server) — start once, from repo root
pnpm dev:web            # http://localhost:8787
# the app
cd mobile && pnpm start # press i (iOS sim, localhost works) or w (web)
```
On a **physical phone** the app can't reach `localhost`; set
`EXPO_PUBLIC_OTTO_API=http://<your-LAN-IP>:8787` before `pnpm start`.

## 3. The design system (match this exactly)

Otto's look is **premium near-black glassmorphism with lavender accents**. The
canonical desktop reference lives in `web/src/api/webPage.ts` (the web dashboard)
— mirror its language on mobile. Tokens are centralized in `mobile/src/theme.ts`;
**change the palette there in one place.**

### Palette
| Token | Hex | Use |
|---|---|---|
| bg | `#0A0A0B` (mobile `#0A0B0F`) | app background, near-black (NOT blue) |
| surface | `#14161D` | cards |
| surface2 | `#1C1F28` | insets |
| border | `#262A35` / `rgba(255,255,255,0.07)` | hairline borders |
| text | `#F2F1F6` | primary text |
| muted | `#8A93A3` / `rgba(242,241,246,0.4)` | secondary text |
| **accent (lavender)** | `#A9A0FF`, `#C8C1FF`, `#B3AAFF`, `#DAD5FF` | brand, links, primary buttons |
| **earn (green)** | `#8FE3B4`, `#A9EFC8` | money in ↑ |
| **spend (coral/lav)** | `#C8C1FF` (or `#FB7185`) | money out ↓ |

### Type
- **Display/body:** `Space Grotesk` (400–700).
- **Numbers/tx/mono:** `JetBrains Mono` with **tabular figures**
  (`fontVariant: ['tabular-nums']`). All money + tx ids are mono.
- Add both via `expo-font` (currently system fonts) for full fidelity.

### Surfaces & shape
- **Glass card:** `border-radius: 24–28`, `1px` hairline border
  (`rgba(255,255,255,0.07)`), subtle gradient fill
  (`linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.016))`),
  soft shadow. On iOS the native formSheet supplies real Liquid Glass — keep
  sheet content transparent so it shows through; Android falls back to opaque
  `c.surface`.
- **Buttons:** primary = lavender gradient (`#CFC9FF → #9990E8`) on dark text
  `#14121F`; ghost = `surface2` fill, hairline border. Radius ~18.
- **Accents:** conic-gradient "orb" glows behind hero cards; a green pulsing dot
  for "live/running"; thin progress bars with a sweeping shimmer.
- **Money color rule:** earned = green + `↑`; spent = lavender/coral + `↓`;
  always mono, tabular.

## 4. What to build (mobile screens to match the Otto product)

Bring the mobile app up to the desktop design's scope. Suggested tabs/screens
(use Expo Router; sheets as native formSheets):
1. **Marketplace** — Agent wallet header (balance, earned/spent, net margin),
   "Otto hires / Otto sells" toggle, gig cards (avatar, title, tag, price/unit,
   progress bar, rating, CTA), and a live "money moving" feed.
2. **Active task** — the trip-booking pipeline: running step, per-step agent
   payments with tx ids, itinerary summary, approve/pause.
3. **Wallet** — available balance, in-escrow / pending, agent card, funding
   rails, spend breakdown.
4. **Receipts** — settled ledger list with All/Earned/Spent filter.
5. **Rules & limits** — autonomy toggles, daily spend ceiling, kill switch.

Hardcode data to match the design (the desktop reference in
`web/src/api/webPage.ts` has every value + copy you need). Wire the wallet/feed
to the live API (`/api/wallet`, `/api/ledger`, `/api/run`, `/api/earn/simulate`)
where it makes sense; hardcode the rest.

## 5. API reference (backend, already running)
Base `http://localhost:8787` (CORS open):
- `GET /api/wallet` → `{ rail, balance{micro,usdc}, earned, spent, toppedUp }`
- `GET /api/ledger` → `{ entries: [{ direction:'in'|'out', usdc, counterparty, resource, txId, explorerUrl, ts }] }`
- `POST /api/run` `{ goal, budgetUsdc }` → runs the agent, returns steps + report
- `POST /api/earn/simulate` → an external agent pays Otto (earnings tick up)
- `GET /api/stream` → SSE of live payments (RN has no EventSource; poll `/api/ledger` every ~1.5s, as `app/index.tsx` already does)

## 6. Definition of done
- New/updated screens under `mobile/app/` + components under `mobile/src/`.
- `pnpm -C mobile exec tsc --noEmit` clean; `pnpm exec biome check mobile` clean;
  `pnpm dlx expo-doctor` (in `mobile/`) passes.
- Committed on `mobile-ui`; PR opened (or branch left for local merge).
- **Nothing outside `mobile/` modified.**
