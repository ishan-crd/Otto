import type { PaymentRequirements } from "../rails/types";

/**
 * Tracks outstanding 402 challenges the server has issued. This is what makes
 * nonce / expiresAt / paymentId real rather than decorative:
 *   - a payment can only be redeemed against a challenge we actually issued,
 *   - only before it expires,
 *   - and only once (consume() deletes it) — so a replayed X-PAYMENT fails.
 */
const issued = new Map<string, { req: PaymentRequirements; expiresAtMs: number }>();

export function issue(req: PaymentRequirements) {
  issued.set(req.paymentId, { req, expiresAtMs: Date.parse(req.expiresAt) });
}

/** Returns the live challenge for a paymentId, or null if unknown/expired. */
export function lookup(paymentId: string): PaymentRequirements | null {
  const entry = issued.get(paymentId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAtMs) {
    issued.delete(paymentId);
    return null;
  }
  return entry.req;
}

/** Mark a challenge as redeemed so it can never be reused (replay guard). */
export function consume(paymentId: string) {
  issued.delete(paymentId);
}
