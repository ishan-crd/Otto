import { randomUUID } from "node:crypto";
import type { Context, MiddlewareHandler } from "hono";
import { microToUsdcStr, PAYMENT_TTL_SECONDS } from "../config";
import { getRail } from "../rails";
import type {
  PaymentPayload,
  PaymentRail,
  PaymentRequirements,
  SettlementReceipt,
} from "../rails/types";
import { consume, issue, lookup } from "./challenges";

interface PaidOptions {
  description?: string;
  /** Override the rail (e.g. the real Algorand rail for the live wallet flow). */
  rail?: PaymentRail;
}

/**
 * Turns any Hono route into a paid x402 endpoint, following the whitepaper flow
 * (Figure 1) exactly:
 *
 *   no X-PAYMENT       -> 402 + PaymentRequirements challenge (issued + tracked)
 *   with X-PAYMENT      -> /verify  (is the payment valid?)         ← BEFORE work
 *                       -> run handler  (do the work)               ← the work
 *                       -> /settle  (broadcast + confirm on-chain)  ← AFTER work
 *                       -> respond with X-PAYMENT-RESPONSE header
 *
 * A settled incoming payment is Otto EARNING, so it credits the wallet.
 */
export function paid(
  priceMicroUsdc: number,
  resource: string,
  opts?: PaidOptions,
): MiddlewareHandler {
  const description = opts?.description;
  return async (c: Context, next) => {
    const rail = opts?.rail ?? getRail();
    const header = c.req.header("X-PAYMENT");

    // ── Step 1 & 2: no payment -> 402 challenge ──
    if (!header) {
      const requirements: PaymentRequirements = {
        scheme: "exact",
        network: rail.kind,
        resource,
        description: description ?? resource,
        payTo: rail.receiverAddress(),
        asset: rail.assetId(),
        assetType: rail.assetType(),
        maxAmountRequired: microToUsdcStr(priceMicroUsdc),
        amountMicroUsdc: priceMicroUsdc,
        nonce: randomUUID(),
        paymentId: randomUUID(),
        expiresAt: new Date(Date.now() + PAYMENT_TTL_SECONDS * 1000).toISOString(),
      };
      issue(requirements);
      c.header("WWW-Authenticate", 'x402 scheme="exact"');
      return c.json({ x402Version: 1, error: "payment_required", accepts: [requirements] }, 402);
    }

    // ── Step 3: decode the client's signed authorization ──
    let payload: PaymentPayload;
    try {
      payload = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    } catch {
      return c.json({ error: "bad_payment_header" }, 400);
    }

    // Redeem it against a live challenge we actually issued (nonce/expiry/replay).
    const requirements = lookup(payload.paymentId);
    if (!requirements) return c.json({ error: "expired_or_unknown_payment" }, 402);
    if (payload.nonce !== requirements.nonce) return c.json({ error: "nonce_mismatch" }, 402);
    if (payload.amountMicroUsdc !== requirements.amountMicroUsdc)
      return c.json({ error: "amount_mismatch" }, 402);

    // ── Step 4/5: /verify BEFORE doing the work ──
    const verdict = await rail.verify(requirements, payload);
    if (!verdict.valid) return c.json({ error: "payment_invalid", reason: verdict.reason }, 402);

    // ── Step 6/7: do the work ──
    await next();

    // ── Step 8-11: /settle AFTER the work, then attach the receipt ──
    let receipt: SettlementReceipt;
    try {
      receipt = await rail.settle(requirements, payload);
    } catch (err) {
      c.res = c.json({ error: "settlement_failed", detail: String(err) }, 402);
      return;
    }
    consume(payload.paymentId); // one-time: block replay

    // NOTE: settlement here is the x402 protocol layer only. It does NOT credit
    // Otto's wallet — the paid endpoints stand in for EXTERNAL providers Otto is
    // buying from. Otto's spending is accounted on the client (payAndFetch →
    // debit); Otto's earning only via the earn path (external agents paying it).
    // Crediting here would net against the client debit (self-payment = $0 move).

    const settleResponse = {
      success: true,
      txId: receipt.txId,
      network: receipt.network,
      payer: payload.from,
      amount: requirements.maxAmountRequired,
      explorerUrl: receipt.explorerUrl,
    };
    // Step 12: return response w/ X-PAYMENT-RESPONSE (per spec).
    c.res.headers.set(
      "X-PAYMENT-RESPONSE",
      Buffer.from(JSON.stringify(settleResponse)).toString("base64"),
    );
  };
}
