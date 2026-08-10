import { config, microToUsdc, usdcToMicro } from "../config";
import { spendGuard } from "./spendGuard";

/**
 * Otto's autonomy policy — the boundaries the owner sets. These are REAL gates,
 * not decoration: the routes check them before Otto is allowed to hire, pay, or
 * sell. The budgets write straight into the Spend Firewall.
 */
export interface Policy {
  /** Otto may start tasks and contract agents on its own. */
  autoHire: boolean;
  /** Micropayments settle without a per-payment approval. */
  autoPay: boolean;
  /** Otto accepts inbound gigs (sells its skills) from other agents. */
  sellSkills: boolean;
  /** Default per-task budget (USDC). */
  taskBudgetUsdc: number;
  /** Session/daily ceiling (USDC) — the Spend Firewall's hard cap. */
  sessionBudgetUsdc: number;
}

const policy: Policy = {
  autoHire: true,
  autoPay: true,
  sellSkills: true,
  taskBudgetUsdc: microToUsdc(config.defaultTaskBudgetMicro),
  sessionBudgetUsdc: microToUsdc(config.sessionBudgetMicro),
};

export function getPolicy(): Policy {
  return { ...policy };
}

export function updatePolicy(patch: Partial<Policy>): Policy {
  if (typeof patch.autoHire === "boolean") policy.autoHire = patch.autoHire;
  if (typeof patch.autoPay === "boolean") policy.autoPay = patch.autoPay;
  if (typeof patch.sellSkills === "boolean") policy.sellSkills = patch.sellSkills;
  if (typeof patch.taskBudgetUsdc === "number" && patch.taskBudgetUsdc > 0)
    policy.taskBudgetUsdc = patch.taskBudgetUsdc;
  if (typeof patch.sessionBudgetUsdc === "number" && patch.sessionBudgetUsdc > 0) {
    policy.sessionBudgetUsdc = patch.sessionBudgetUsdc;
    spendGuard.setSessionBudget(usdcToMicro(patch.sessionBudgetUsdc));
  }
  return getPolicy();
}
