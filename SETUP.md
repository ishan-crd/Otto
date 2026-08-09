# Pre-Hackathon Setup & the Go/No-Go Test

Do this **before** Aug 10. Rule #5 of the participant guide is explicit: finalize
the idea, set up the dev environment, and prepare the project structure in
advance. This file is that preparation. Everything except the wallet funding is
already done for you.

---

## Part A — verify the app (5 minutes, do this today)

```bash
cd ~/Desktop/otto
npm install
npm run typecheck        # should print nothing (clean)
npm test                 # 2 tests pass
npm run dry-run          # MOCK settlement passes, prints a tx id
npm run dev              # server boots on :8787
npm run demo             # (other terminal) full earn→work→block walkthrough
```

If all of that works, **the entire product is proven in mock mode.** You could
demo it today. The only thing left is making the payments real.

---

## Part B — the go/no-go: real Algorand testnet (30–45 min, do this this week)

This is the gate. If it passes, x402 is safe to build on and you commit. If it
fails after a genuine attempt, **pivot to the Corsair track** — do not walk into
12 offline hours on an unproven rail.

> ⚠️ **Not MetaMask.** This track is Algorand, not Ethereum — MetaMask can't sign
> Algorand transactions. Use an Algorand wallet (Pera / Defly / Lute) **or** just
> run `npm run gen-wallet` to mint a testnet account instantly.

### 1. Create the account(s)
Fastest: `npm run gen-wallet` — prints a fresh TestNet address + 25-word
mnemonic. (Or export one from **Pera Wallet**.) You need at least the **payer**
(what Otto spends from). A separate **receiver** is optional — leave
`RECEIVER_ADDRESS` blank and Otto receives into the payer account.

### 2. Fund the payer with test ALGO
Go to the **Algorand TestNet dispenser**: <https://bank.testnet.algorand.network/>
Paste the payer address, get free test ALGO (pays the ~0.001 ALGO tx fees).

### 3. Get test USDC + opt in
- The payer (and receiver) must **opt in** to the USDC asset before they can hold
  it. In your wallet: Add Asset → search the **TestNet USDC asset id** and opt in.
- Fund the payer with test USDC. Circle's testnet faucet:
  <https://faucet.circle.com/> (choose Algorand TestNet), or ask a mentor/other
  team for a small transfer.

### 4. Confirm the USDC asset id
The `.env` default is `10458941`. **Verify it** — look up the asset in
<https://lora.algokit.io/testnet> and confirm it's the 6-decimal USDC ASA. If the
track organizers specify a different test asset, use theirs.

### 5. Fill in `.env`
```bash
cp .env.example .env
```
Set:
```
RAIL=algorand
PAYER_MNEMONIC=word1 word2 ... word25
RECEIVER_ADDRESS=<your receiver address>
USDC_ASSET_ID=<confirmed id>
```

### 6. Run the real dry run
```bash
npm run check-wallet   # confirms ALGO funded + USDC opted-in + USDC balance
npm run dry-run        # only after check-wallet is all ✅
```
**Success** = it prints a real `tx id` and an explorer link. Open the link — if
the transaction is there, **x402 is GO. ✅** You've solved the risky 30% of the
rubric before the event even starts.

### 7. (Optional, +rubric) Route through the facilitator
The rubric rewards the facilitator step. `src/rails/algorandRail.ts` has
`settleViaFacilitator()` stubbed against `FACILITATOR_URL`. During the dry run,
confirm the GoPlausible facilitator's exact request/response shape and wire it
in. Direct-algod settlement already satisfies "USDC settlement + tx id" if the
facilitator proves fiddly.

---

## Troubleshooting the real rail

| Symptom | Fix |
|---|---|
| `PAYER_MNEMONIC` error | 25 words, space-separated, no quotes needed |
| `overspend` / asset error | payer or receiver hasn't **opted in** to USDC (step 3) |
| `account ... below min balance` | payer needs test ALGO (step 2) |
| `no txid` / network error | check `ALGOD_SERVER` is reachable; Algonode testnet is free/public |
| tx id printed but explorer 404 | wrong `EXPLORER_TX_BASE`, or you're on MainNet explorer — use testnet |

---

## Event-day kit (from the participant guide)
Valid ID · laptop + charger · **extension board** · phone + charger · water.
Be on time. Team must match the RSVP (no on-spot changes). Come with `.env`
already working in `algorand` mode so you spend all 12 hours on the frontend.
