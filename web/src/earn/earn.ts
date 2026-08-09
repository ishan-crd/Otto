import { randomUUID } from "node:crypto";
import { microToUsdcStr, PAYMENT_TTL_SECONDS, usdcToMicro } from "../config";
import { wallet } from "../guard/wallet";
import { ledger } from "../ledger/ledger";
import { getRail } from "../rails";
import type { PaymentRequirements } from "../rails/types";

/**
 * The "Otto earns its keep" side of the economy.
 *
 * Otto's legal-clause skill is a real paid endpoint (registry `legal`), so
 * external agents CAN pay it for real. For the demo we also expose a one-click
 * simulator that spins up a fake customer agent paying Otto — so on stage the
 * wallet ticks UP from other agents while it spends DOWN on your errand.
 *
 * On the real rail this settles an actual on-chain tx (a self-transfer standing
 * in for the external customer, unless you fund a separate "customer" wallet).
 */
const CUSTOMERS = [
  "agent://acme-legal-bot",
  "agent://finmark-research",
  "agent://hiretech-screening",
  "agent://dealflow-ai",
];

export async function simulateIncomingPayment() {
  const rail = getRail();
  const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)] ?? CUSTOMERS[0];
  const priceMicro = usdcToMicro(0.03);

  const req: PaymentRequirements = {
    scheme: "exact",
    network: rail.kind,
    resource: "legal-summary (sold by Otto)",
    description: "Otto's contract-clause review skill",
    payTo: rail.receiverAddress(),
    asset: rail.assetId(),
    assetType: rail.assetType(),
    maxAmountRequired: microToUsdcStr(priceMicro),
    amountMicroUsdc: priceMicro,
    nonce: randomUUID(),
    paymentId: randomUUID(),
    expiresAt: new Date(Date.now() + PAYMENT_TTL_SECONDS * 1000).toISOString(),
  };

  const payload = await rail.pay(req);
  payload.from = customer; // label the payer as the external agent
  await rail.verify(req, payload);
  const receipt = await rail.settle(req, payload);

  wallet.credit(receipt.amountMicroUsdc);
  return ledger.record("in", receipt, `earned from ${customer}`);
}
