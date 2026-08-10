import { randomUUID } from "node:crypto";
import { PaymentBlockedError, payAndFetch } from "../client/x402Client";
import { config, fmtUsdc, microToUsdc } from "../config";
import { spendGuard } from "../guard/spendGuard";
import { type Plan, planForGoal } from "./planner";

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

export interface ConciergeProgress {
  /** Fired before Otto pays for a step. */
  onStepStart?: (serviceId: string, description: string, index: number, total: number) => void;
  /** Fired after a step's payment settled and the work came back. */
  onStepDone?: (step: ConciergeStep, index: number, total: number) => void;
  /**
   * Pace between steps (ms) so watchers see the pipeline progress live instead
   * of every step settling in the same instant. 0 (default) = full speed —
   * tests and programmatic callers stay fast.
   */
  stepDelayMs?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Otto's brain. Given a goal and a budget, it:
 *   1. plans which paid services to hire,
 *   2. pays each one over x402 (spend firewall gates every payment),
 *   3. stops cleanly if the firewall blocks a payment,
 *   4. synthesizes a final report from what it bought.
 *
 * This is the aggregator the x402 brief calls the "Entry Management Framework".
 */
export async function runConcierge(
  goal: string,
  budgetMicroUsdc = config.defaultTaskBudgetMicro,
  progress?: ConciergeProgress,
): Promise<ConciergeResult> {
  const taskId = randomUUID();
  spendGuard.setTaskBudget(budgetMicroUsdc);

  const plan = planForGoal(goal);
  const steps: ConciergeStep[] = [];
  let blocked: string | null = null;

  const pace = progress?.stepDelayMs ?? 0;
  for (const [i, { service, input }] of plan.steps.entries()) {
    progress?.onStepStart?.(service.id, service.description, i, plan.steps.length);
    if (pace > 0) await sleep(pace * 0.55); // let the "running" state be seen
    try {
      const { data, receipt } = await payAndFetch(`${config.selfUrl}${service.path}`, {
        taskId,
        body: input,
      });
      const step: ConciergeStep = {
        serviceId: service.id,
        description: service.description,
        priceMicroUsdc: receipt.amountMicroUsdc,
        txId: receipt.txId,
        explorerUrl: receipt.explorerUrl,
        output: (data as { result?: unknown }).result ?? data,
      };
      steps.push(step);
      progress?.onStepDone?.(step, i, plan.steps.length);
      if (pace > 0 && i < plan.steps.length - 1) await sleep(pace * 0.45);
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
    report: synthesize(goal, plan, steps, blocked, totalSpentMicroUsdc),
  };
}

/** Human-readable report; trip goals get a concrete recommendation up top. */
function synthesize(
  goal: string,
  plan: Plan,
  steps: ConciergeStep[],
  blocked: string | null,
  spentMicro: number,
): string {
  const lines: string[] = [];
  lines.push(`# Otto's report`);
  lines.push(`**Goal:** ${goal}`);
  lines.push("");

  if (plan.kind === "trip" && plan.destination) {
    const flights = stepOutput<{ cheapest?: { airline?: string; priceUsd?: number } }>(
      steps,
      "flights",
    );
    const hotels = stepOutput<{ cheapest?: { name?: string; perNightUsd?: number } }>(
      steps,
      "hotels",
    );
    const wx = stepOutput<{ forecast?: string }>(steps, "weather");
    if (flights?.cheapest || hotels?.cheapest) {
      lines.push(
        `**Recommendation${plan.budgetConscious ? " (cheapest)" : ""}:** fly ${
          flights?.cheapest?.airline ?? "—"
        } (~$${flights?.cheapest?.priceUsd ?? "—"}), stay at ${
          hotels?.cheapest?.name ?? "—"
        } (~$${hotels?.cheapest?.perNightUsd ?? "—"}/night). ${wx?.forecast ?? ""}`,
      );
      lines.push("");
    }
  }

  lines.push(
    `Otto autonomously hired ${steps.length} paid agent${steps.length === 1 ? "" : "s"} and spent ${fmtUsdc(spentMicro)} (${microToUsdc(spentMicro).toFixed(4)} USDC) of its own funds.`,
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

function stepOutput<T>(steps: ConciergeStep[], id: string): T | null {
  const s = steps.find((x) => x.serviceId === id);
  return s ? (s.output as T) : null;
}
