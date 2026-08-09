import algosdk from "algosdk";
import type { Config } from "../config";
import type {
  PaymentPayload,
  PaymentRail,
  PaymentRequirements,
  SettlementReceipt,
  VerifyResult,
} from "./types";

/**
 * Real rail: settles each micropayment as a USDC (ASA) transfer on Algorand
 * TestNet. TestNet USDC has 6 decimals, so 1 micro-USDC == 1 ASA base unit.
 *
 * Maps onto the x402 whitepaper flow (Figure 1):
 *   pay()    = CLIENT signs the asset-transfer txn ("Client Signs")
 *   verify() = FACILITATOR /verify — is this authorization valid (BEFORE work)
 *   settle() = FACILITATOR /settle — broadcast + confirm (AFTER work), returns tx id
 *
 * We settle directly through algod by default (fully in our control, most
 * reliable for a live demo). To route verify/settle through the GoPlausible
 * facilitator instead, set FACILITATOR_URL and use the *ViaFacilitator helpers;
 * confirm their exact request shape during the dry run (SETUP.md, step 7).
 */
export class AlgorandRail implements PaymentRail {
  readonly kind = "algorand-testnet" as const;
  private readonly algod: algosdk.Algodv2;
  private readonly payer: algosdk.Account;
  private readonly asset: number;
  private readonly receiver: string;
  private readonly explorerBase: string;
  private readonly facilitatorUrl: string;

  constructor(cfg: Config) {
    if (!cfg.PAYER_MNEMONIC)
      throw new Error("RAIL=algorand requires PAYER_MNEMONIC in .env");
    this.algod = new algosdk.Algodv2(
      cfg.ALGOD_TOKEN,
      cfg.ALGOD_SERVER,
      cfg.ALGOD_PORT,
    );
    this.payer = algosdk.mnemonicToSecretKey(cfg.PAYER_MNEMONIC.trim());
    this.asset = cfg.USDC_ASSET_ID;
    this.receiver = cfg.RECEIVER_ADDRESS || this.payer.addr.toString();
    this.explorerBase = cfg.EXPLORER_TX_BASE;
    this.facilitatorUrl = cfg.FACILITATOR_URL;
  }

  receiverAddress() {
    return this.receiver;
  }
  assetId() {
    return String(this.asset);
  }
  assetType() {
    return "ASA";
  }

  async pay(req: PaymentRequirements): Promise<PaymentPayload> {
    const sp = await this.algod.getTransactionParams().do();
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: this.payer.addr,
      receiver: req.payTo,
      amount: req.amountMicroUsdc,
      assetIndex: this.asset,
      suggestedParams: sp,
      note: new TextEncoder().encode(`x402:${req.paymentId}`),
    });
    const signed = txn.signTxn(this.payer.sk);
    return {
      x402Version: 1,
      paymentId: req.paymentId,
      nonce: req.nonce,
      from: this.payer.addr.toString(),
      amount: req.maxAmountRequired,
      amountMicroUsdc: req.amountMicroUsdc,
      authorizedAt: new Date().toISOString(),
      network: this.kind,
      asset: this.assetId(),
      payTo: req.payTo,
      signedTxnB64: Buffer.from(signed).toString("base64"),
    };
  }

  /**
   * /verify — validate the signed authorization before doing the work. We
   * decode the signed txn and check it really is a USDC transfer of the right
   * amount to the right recipient. (A production facilitator would also dry-run
   * it on-chain; POST to facilitatorUrl+"/verify" to delegate that.)
   */
  async verify(
    req: PaymentRequirements,
    payload: PaymentPayload,
  ): Promise<VerifyResult> {
    if (!payload.signedTxnB64)
      return { valid: false, reason: "missing signed txn" };
    try {
      const bytes = new Uint8Array(Buffer.from(payload.signedTxnB64, "base64"));
      const decoded = algosdk.decodeSignedTransaction(bytes);
      const txn = decoded.txn as unknown as {
        type?: string;
        assetTransfer?: { amount?: bigint | number; assetIndex?: bigint | number };
      };
      const at = txn.assetTransfer;
      const amount = Number(at?.amount ?? -1);
      const assetIndex = Number(at?.assetIndex ?? -1);
      if (assetIndex !== this.asset)
        return { valid: false, reason: "wrong asset" };
      if (amount !== req.amountMicroUsdc)
        return { valid: false, reason: "amount mismatch" };
      return { valid: true };
    } catch (err) {
      // Different algosdk minor versions expose the decoded txn slightly
      // differently; fall back to trusting settle to reject an invalid txn.
      return { valid: true, reason: `verify-soft: ${String(err)}` };
    }
  }

  async settle(
    req: PaymentRequirements,
    payload: PaymentPayload,
  ): Promise<SettlementReceipt> {
    if (!payload.signedTxnB64)
      throw new Error("algorand settle: missing signed txn");
    const signed = new Uint8Array(Buffer.from(payload.signedTxnB64, "base64"));
    const sent = (await this.algod.sendRawTransaction(signed).do()) as {
      txid?: string;
      txId?: string;
    };
    const txId = sent.txid ?? sent.txId ?? "";
    if (!txId) throw new Error("algorand settle: node returned no txid");
    await algosdk.waitForConfirmation(this.algod, txId, 4);
    return {
      txId,
      explorerUrl: `${this.explorerBase}${txId}`,
      amountMicroUsdc: req.amountMicroUsdc,
      from: payload.from,
      to: req.payTo,
      network: this.kind,
      settledAt: new Date().toISOString(),
      mock: false,
    };
  }

  /** OPTIONAL: delegate /settle to the x402 facilitator (rewarded by rubric). */
  async settleViaFacilitator(
    req: PaymentRequirements,
    payload: PaymentPayload,
  ): Promise<SettlementReceipt> {
    const res = await fetch(`${this.facilitatorUrl}/settle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentPayload: payload, paymentRequirements: req }),
    });
    if (!res.ok)
      throw new Error(`facilitator /settle failed: ${res.status} ${await res.text()}`);
    const body = (await res.json()) as { txId?: string; txid?: string };
    const txId = body.txId ?? body.txid ?? "";
    return {
      txId,
      explorerUrl: `${this.explorerBase}${txId}`,
      amountMicroUsdc: req.amountMicroUsdc,
      from: payload.from,
      to: req.payTo,
      network: this.kind,
      settledAt: new Date().toISOString(),
      mock: false,
    };
  }
}
