import { config, fmtUsdc } from "../config";
import { wallet } from "./wallet";

export interface SpendDecision {
  allowed: boolean;
  reason: string;
}

/**
 * The Spend Firewall — the "never a rupee over budget" guarantee.
 *
 * Runs BEFORE every outgoing payment. It enforces three walls:
 *   1. a per-task budget (the ceiling on a single goal),
 *   2. a per-session budget (the ceiling across everything Otto does),
 *   3. never spend below-zero balance.
 *
 * On stage: set a tiny task budget, ask Otto for something expensive, and the
 * firewall blocks a payment mid-pipeline — the emergency-brake moment.
 */
export class SpendGuard {
  private taskSpent = new Map<string, number>();
  private sessionSpentMicro = 0;

  constructor(
    private taskBudgetMicro = config.defaultTaskBudgetMicro,
    private sessionBudgetMicro = config.sessionBudgetMicro,
  ) {}

  setTaskBudget(micro: number) {
    this.taskBudgetMicro = micro;
  }

  setSessionBudget(micro: number) {
    this.sessionBudgetMicro = micro;
  }

  /** Rehydrate session spend from the database at boot. */
  restoreSessionSpent(micro: number) {
    this.sessionSpentMicro = micro;
  }

  /** Live limits + usage — surfaced on the dashboard's autonomy panels. */
  snapshot() {
    return {
      taskBudgetMicro: this.taskBudgetMicro,
      sessionBudgetMicro: this.sessionBudgetMicro,
      sessionSpentMicro: this.sessionSpentMicro,
    };
  }

  authorize(taskId: string, amountMicro: number): SpendDecision {
    const taskSoFar = this.taskSpent.get(taskId) ?? 0;

    if (taskSoFar + amountMicro > this.taskBudgetMicro) {
      return {
        allowed: false,
        reason: `Task budget exceeded: ${fmtUsdc(taskSoFar)} + ${fmtUsdc(
          amountMicro,
        )} > ${fmtUsdc(this.taskBudgetMicro)} cap. Payment blocked by firewall.`,
      };
    }
    if (this.sessionSpentMicro + amountMicro > this.sessionBudgetMicro) {
      return {
        allowed: false,
        reason: `Session budget exceeded (${fmtUsdc(
          this.sessionBudgetMicro,
        )} cap). Payment blocked by firewall.`,
      };
    }
    if (amountMicro > wallet.balanceMicro()) {
      return {
        allowed: false,
        reason: `Insufficient balance: need ${fmtUsdc(amountMicro)}, have ${fmtUsdc(
          wallet.balanceMicro(),
        )}.`,
      };
    }
    return { allowed: true, reason: "ok" };
  }

  /** Call only after a payment actually settled. */
  commit(taskId: string, amountMicro: number) {
    this.taskSpent.set(taskId, (this.taskSpent.get(taskId) ?? 0) + amountMicro);
    this.sessionSpentMicro += amountMicro;
  }
}

export const spendGuard = new SpendGuard();
