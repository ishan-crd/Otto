import { randomUUID } from "node:crypto";
import type {
  PaymentPayload,
  PaymentRail,
  PaymentRequirements,
  SettlementReceipt,
  VerifyResult,
} from "./types";

/**
 * Offline rail. Simulates the full x402 loop (402 -> sign -> verify -> settle)
 * instantly, with fake-but-realistic tx ids, so the whole product + frontend
 * can be built and demoed with no wallet and no network. Its outputs are
 * shape-identical to the real rail, so nothing downstream can tell them apart.
 */
export class MockRail implements PaymentRail {
  readonly kind = "mock" as const;
  constructor(private readonly receiver = "OTTO-MOCK-RECEIVER") {}

  receiverAddress() {
    return this.receiver;
  }
  assetId() {
    return "MOCK-USDC";
  }
  assetType() {
    return "MOCK";
  }

  async pay(req: PaymentRequirements): Promise<PaymentPayload> {
    return {
      x402Version: 1,
      paymentId: req.paymentId,
      nonce: req.nonce,
      from: "OTTO-MOCK-PAYER",
      amount: req.maxAmountRequired,
      amountMicroUsdc: req.amountMicroUsdc,
      authorizedAt: new Date().toISOString(),
      network: this.kind,
      asset: this.assetId(),
      payTo: req.payTo,
      mock: true,
    };
  }

  async verify(
    req: PaymentRequirements,
    payload: PaymentPayload,
  ): Promise<VerifyResult> {
    if (payload.payTo !== req.payTo)
      return { valid: false, reason: "wrong recipient" };
    if (payload.amountMicroUsdc !== req.amountMicroUsdc)
      return { valid: false, reason: "amount mismatch" };
    return { valid: true };
  }

  async settle(
    req: PaymentRequirements,
    payload: PaymentPayload,
  ): Promise<SettlementReceipt> {
    const txId = `MOCK-${randomUUID().replace(/-/g, "").slice(0, 24).toUpperCase()}`;
    return {
      txId,
      explorerUrl: `https://lora.algokit.io/testnet/transaction/${txId}`,
      amountMicroUsdc: req.amountMicroUsdc,
      from: payload.from,
      to: req.payTo,
      network: this.kind,
      settledAt: new Date().toISOString(),
      mock: true,
    };
  }
}
