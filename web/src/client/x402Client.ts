import { spendGuard } from "../guard/spendGuard";
import { wallet } from "../guard/wallet";
import { ledger } from "../ledger/ledger";
import { getRail } from "../rails";
import type { PaymentRequirements, SettlementReceipt } from "../rails/types";

export class PaymentBlockedError extends Error {
  constructor(
    message: string,
    public readonly requirement: PaymentRequirements,
  ) {
    super(message);
    this.name = "PaymentBlockedError";
  }
}

export interface PaidResult<T> {
  data: T;
  receipt: SettlementReceipt;
}

/**
 * The CLIENT half of the x402 loop (whitepaper Figure 1, left lane):
 *   1. call the resource
 *   2. get 402 + PaymentRequirements
 *   3. ASK THE SPEND FIREWALL FIRST        <-- Otto's guardrail
 *   4. sign the payment, retry with X-PAYMENT
 *   5. read the settlement from X-PAYMENT-RESPONSE, record the spend
 *
 * Throws PaymentBlockedError if the firewall denies the spend — the on-stage
 * "emergency brake" moment, surfaced to the caller.
 */
export async function payAndFetch<T = unknown>(
  url: string,
  opts: { taskId: string; method?: string; body?: unknown },
): Promise<PaidResult<T>> {
  const rail = getRail();
  const init: RequestInit = {
    method: opts.method ?? "POST",
    headers: { "content-type": "application/json" },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  };

  const first = await fetch(url, init);
  if (first.status !== 402) return { data: (await first.json()) as T, receipt: freeReceipt(url) };

  const challenge = (await first.json()) as { accepts: PaymentRequirements[] };
  const requirement = challenge.accepts?.[0];
  if (!requirement) throw new Error(`402 with no requirements from ${url}`);

  // --- The firewall runs BEFORE any money moves. ---
  const decision = spendGuard.authorize(opts.taskId, requirement.amountMicroUsdc);
  if (!decision.allowed) throw new PaymentBlockedError(decision.reason, requirement);

  const payload = await rail.pay(requirement);
  const paymentHeader = Buffer.from(JSON.stringify(payload)).toString("base64");

  const paidRes = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string>),
      "X-PAYMENT": paymentHeader,
    },
  });
  if (!paidRes.ok)
    throw new Error(`paid request failed: ${paidRes.status} ${await paidRes.text()}`);

  const settle = decodeSettlement(paidRes.headers.get("X-PAYMENT-RESPONSE"));
  const data = (await paidRes.json()) as T;

  const receipt: SettlementReceipt = {
    txId: settle?.txId ?? "",
    explorerUrl: settle?.explorerUrl ?? "",
    amountMicroUsdc: requirement.amountMicroUsdc,
    from: payload.from,
    to: requirement.payTo,
    network: rail.kind,
    settledAt: new Date().toISOString(),
    mock: rail.kind === "mock",
  };

  spendGuard.commit(opts.taskId, requirement.amountMicroUsdc);
  wallet.debit(requirement.amountMicroUsdc);
  ledger.record("out", receipt, requirement.resource, opts.taskId);

  return { data, receipt };
}

function decodeSettlement(header: string | null): { txId: string; explorerUrl: string } | null {
  if (!header) return null;
  try {
    return JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function freeReceipt(url: string): SettlementReceipt {
  return {
    txId: "FREE",
    explorerUrl: "",
    amountMicroUsdc: 0,
    from: "otto",
    to: url,
    network: "none",
    settledAt: new Date().toISOString(),
    mock: true,
  };
}
