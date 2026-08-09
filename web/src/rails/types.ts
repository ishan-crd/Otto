/**
 * The payment rail is the ONE abstraction that lets Otto run fully offline
 * today (MockRail) and settle real USDC on Algorand testnet later
 * (AlgorandRail) — with no other code change.
 *
 * The shapes here follow the x402 whitepaper (Coinbase, May 2025):
 *   - PaymentRequirements  = the JSON body of a 402 response
 *   - PaymentPayload       = the signed authorization the client sends in X-PAYMENT
 *   - the rail exposes verify() and settle() as the two facilitator steps
 *     (Figure 1: server -> /verify -> do work -> /settle)
 */

/** Body of an HTTP 402 response (the "accepts" entry). */
export interface PaymentRequirements {
  /** payment scheme. "exact" = pay exactly maxAmountRequired. */
  scheme: "exact";
  network: string;
  /** the API endpoint / resource being purchased. */
  resource: string;
  description: string;
  /** wallet address the payment must be sent to. */
  payTo: string;
  /** asset id (Algorand ASA) or token contract address. */
  asset: string;
  /** token standard: "ASA" on Algorand, "ERC20" on EVM. */
  assetType: string;
  /** max payment, canonical decimal-USDC string e.g. "0.01". */
  maxAmountRequired: string;
  /** same amount as integer micro-USDC (Otto's internal accounting unit). */
  amountMicroUsdc: number;
  /** single-use value to prevent replay. */
  nonce: string;
  /** unique id for THIS challenge. */
  paymentId: string;
  /** ISO timestamp after which this challenge is invalid. */
  expiresAt: string;
}

/** The signed payment authorization the client puts in the X-PAYMENT header. */
export interface PaymentPayload {
  x402Version: 1;
  paymentId: string;
  nonce: string;
  from: string;
  /** amount actually authorized, decimal USDC (must be <= maxAmountRequired). */
  amount: string;
  amountMicroUsdc: number;
  authorizedAt: string;
  network: string;
  asset: string;
  payTo: string;
  /** EIP-712 signature on EVM (unused on Algorand). */
  signature?: string;
  /** base64 signed Algorand txn (the real cryptographic authorization). */
  signedTxnB64?: string;
  mock?: boolean;
}

export interface VerifyResult {
  valid: boolean;
  reason?: string;
}

/** Result of settlement, returned to the client in X-PAYMENT-RESPONSE. */
export interface SettlementReceipt {
  txId: string;
  explorerUrl: string;
  amountMicroUsdc: number;
  from: string;
  to: string;
  network: string;
  settledAt: string;
  mock: boolean;
}

export interface PaymentRail {
  readonly kind: "mock" | "algorand-testnet";
  /** the address this side receives into (Otto's earnings account). */
  receiverAddress(): string;
  /** asset id / contract advertised in the 402 challenge. */
  assetId(): string;
  /** token standard advertised in the 402 challenge. */
  assetType(): string;

  /** CLIENT: sign a payment that satisfies the requirements. */
  pay(req: PaymentRequirements): Promise<PaymentPayload>;
  /** FACILITATOR /verify: is this payment valid? (runs BEFORE the work). */
  verify(req: PaymentRequirements, payload: PaymentPayload): Promise<VerifyResult>;
  /** FACILITATOR /settle: broadcast + confirm (runs AFTER the work). */
  settle(req: PaymentRequirements, payload: PaymentPayload): Promise<SettlementReceipt>;
}
