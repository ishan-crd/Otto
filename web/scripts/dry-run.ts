import { randomUUID } from "node:crypto";
import {
  PAYMENT_TTL_SECONDS,
  config,
  fmtUsdc,
  microToUsdcStr,
  usdcToMicro,
} from "../src/config";
import { getRail } from "../src/rails";
import type { PaymentRequirements } from "../src/rails/types";

/**
 * THE GO / NO-GO TEST. Run this before the hackathon. It exercises the full
 * x402 flow through the active rail: challenge -> sign -> verify -> settle.
 *
 *   RAIL=mock      -> proves the app's payment logic end-to-end (always passes).
 *   RAIL=algorand  -> proves a REAL USDC micropayment settles on Algorand
 *                     testnet and returns a live tx id. THIS is the gate that
 *                     decides whether x402 is safe to build on (see SETUP.md).
 */
async function main() {
  console.log(`\n=== Otto dry run — rail: ${config.RAIL.toUpperCase()} ===\n`);
  const rail = getRail();
  const priceMicro = usdcToMicro(0.001);

  const req: PaymentRequirements = {
    scheme: "exact",
    network: rail.kind,
    resource: "dry-run",
    description: "dry-run payment",
    payTo: rail.receiverAddress(),
    asset: rail.assetId(),
    assetType: rail.assetType(),
    maxAmountRequired: microToUsdcStr(priceMicro),
    amountMicroUsdc: priceMicro,
    nonce: randomUUID(),
    paymentId: randomUUID(),
    expiresAt: new Date(Date.now() + PAYMENT_TTL_SECONDS * 1000).toISOString(),
  };

  console.log(`1. 402 challenge : pay ${fmtUsdc(req.amountMicroUsdc)} to ${req.payTo}`);
  const payload = await rail.pay(req);
  console.log(`2. client signs  : ${payload.signedTxnB64 ? "real signed txn" : "mock payload"}`);
  const verdict = await rail.verify(req, payload);
  console.log(`3. /verify       : ${verdict.valid ? "valid ✅" : `INVALID (${verdict.reason})`}`);
  if (!verdict.valid) throw new Error(`verify failed: ${verdict.reason}`);
  console.log(`4. /settle       : submitting...`);
  const receipt = await rail.settle(req, payload);

  console.log(`5. settled ✅`);
  console.log(`\n   tx id   : ${receipt.txId}`);
  console.log(`   explorer: ${receipt.explorerUrl}`);
  console.log(`   amount  : ${fmtUsdc(receipt.amountMicroUsdc)}`);
  console.log(`   network : ${receipt.network}\n`);

  if (receipt.mock)
    console.log("→ MOCK passed. App logic works. Now set RAIL=algorand and re-run to test the real chain.\n");
  else
    console.log("→ REAL settlement passed. Open the explorer link to confirm. x402 is GO. ✅\n");
}

main().catch((err) => {
  console.error("\n✗ Dry run FAILED:\n", err);
  console.error(
    "\nIf RAIL=algorand: check ALGOD_SERVER, PAYER_MNEMONIC funded with test ALGO + USDC, and USDC_ASSET_ID. See SETUP.md.\n",
  );
  process.exit(1);
});
