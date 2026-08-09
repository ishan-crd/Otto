import { randomUUID } from "node:crypto";
import { config, fmtUsdc } from "../config";
import { PaymentBlockedError, payAndFetch } from "../client/x402Client";
import { spendGuard } from "../guard/spendGuard";
import { planForGoal } from "./planner";

export interface ConciergeStep {
  serviceId: string;
  description: string;
  priceMicroUsdc: number;
  txId: string;
  explorerUrl: string;
  output: unknown;
}

export interface ConciergeResult {
  taskId: string;
  goal: string;
  budgetMicroUsdc: number;
  steps: ConciergeStep[];
  totalSpentMicroUsdc: number;
  blocked: string | null; // firewall reason if a payment was denied
  report: string;
}

/**
 * Otto's brain. Given a goal and a budget, it:
 *   1. plans which paid services to call,
 *   2. pays each one over x402 (spend firewall gates every payment),
 *   3. stops cleanly if the firewall blocks a payment,
 *   4. synthesizes a final report from what it bought.
 *
 * This is the aggregator the x402 brief calls the "Entry Management Framework".
 */
export async function runConcierge(
  goal: string,
  budgetMicroUsdc = config.defaultTaskBudgetMicro,
): Promise<ConciergeResult> {
  const taskId = randomUUID();
  spendGuard.setTaskBudget(budgetMicroUsdc);

  const plan = planForGoal(goal);
  const steps: ConciergeStep[] = [];
  let blocked: string | null = null;

  for (const { service, input } of plan) {
    try {
      const { data, receipt } = await payAndFetch(
        `${config.selfUrl}${service.path}`,
        { taskId, body: input },
      );
      steps.push({
        serviceId: service.id,
        description: service.description,
        priceMicroUsdc: receipt.amountMicroUsdc,
        txId: receipt.txId,
        explorerUrl: receipt.explorerUrl,
        output: (data as { result?: unknown }).result ?? data,
      });
    } catch (err) {
      if (err instanceof PaymentBlockedError) {
        blocked = err.message; // firewall stopped Otto — the emergency brake
        break;
      }
      throw err;
    }
  }

  const totalSpentMicroUsdc = steps.reduce((s, x) => s + x.priceMicroUsdc, 0);
  return {
    taskId,
    goal,
    budgetMicroUsdc,
    steps,
    totalSpentMicroUsdc,
    blocked,
    report: synthesize(goal, steps, blocked, totalSpentMicroUsdc),
  };
}

function synthesize(
  goal: string,
  steps: ConciergeStep[],
  blocked: string | null,
  spentMicro: number,
): string {
  const lines: string[] = [];
  lines.push(`# Otto's report`);
  lines.push(`**Goal:** ${goal}`);
  lines.push("");
  lines.push(
    `Otto autonomously hired ${steps.length} paid service${steps.length === 1 ? "" : "s"} and spent ${fmtUsdc(spentMicro)} of its own funds.`,
  );
  lines.push("");
  for (const s of steps) {
    lines.push(`## ${s.serviceId} — ${fmtUsdc(s.priceMicroUsdc)} (tx ${s.txId})`);
    lines.push("```json");
    lines.push(JSON.stringify(s.output, null, 2));
    lines.push("```");
  }
  if (blocked) {
    lines.push("");
    lines.push(`> 🛑 **Spend Firewall stopped Otto:** ${blocked}`);
    lines.push(`> Otto could not complete the goal within budget — by design.`);
  }
  return lines.join("\n");
}
