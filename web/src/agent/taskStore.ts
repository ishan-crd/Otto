import { randomUUID } from "node:crypto";
import { config, usdcToMicro } from "../config";
import { type ConciergeStep, runConcierge } from "./concierge";
import { extractDestination, planForGoal } from "./planner";

export type TaskStepStatus = "queued" | "running" | "paid" | "blocked";

export interface TaskStep {
  serviceId: string;
  description: string;
  status: TaskStepStatus;
  priceMicroUsdc: number | null;
  txId: string | null;
  explorerUrl: string | null;
  output: unknown;
}

export interface Task {
  id: string;
  goal: string;
  destination: string | null;
  budgetMicroUsdc: number;
  status: "running" | "done" | "blocked" | "failed";
  steps: TaskStep[];
  spentMicroUsdc: number;
  blocked: string | null;
  report: string | null;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

/**
 * In-memory registry of Otto's task runs. `startTask` kicks the concierge off in
 * the background and streams per-step progress into the task object, so the
 * dashboard can poll `getTask` and watch Otto hire + pay agents live — on the
 * real Algorand rail each step genuinely takes a few seconds to settle.
 */
const tasks = new Map<string, Task>();
const order: string[] = [];
const KEEP = 20;

export function startTask(goal: string, budgetUsdc?: number): Task {
  const id = randomUUID();
  const budgetMicroUsdc =
    budgetUsdc != null ? usdcToMicro(budgetUsdc) : config.defaultTaskBudgetMicro;

  const plan = planForGoal(goal);
  const task: Task = {
    id,
    goal,
    destination: plan.kind === "trip" ? extractDestination(goal) : null,
    budgetMicroUsdc,
    status: "running",
    steps: plan.steps.map((p) => ({
      serviceId: p.service.id,
      description: p.service.description,
      status: "queued",
      priceMicroUsdc: p.service.priceMicroUsdc,
      txId: null,
      explorerUrl: null,
      output: null,
    })),
    spentMicroUsdc: 0,
    blocked: null,
    report: null,
    error: null,
    createdAt: new Date().toISOString(),
    finishedAt: null,
  };
  tasks.set(id, task);
  order.unshift(id);
  while (order.length > KEEP) {
    const drop = order.pop();
    if (drop) tasks.delete(drop);
  }

  // Fire and track — the run mutates `task` as steps settle.
  void runConcierge(goal, budgetMicroUsdc, {
    onStepStart: (_serviceId, _description, index) => {
      const s = task.steps[index];
      if (s) s.status = "running";
    },
    onStepDone: (step: ConciergeStep, index) => {
      const s = task.steps[index];
      if (s) {
        s.status = "paid";
        s.priceMicroUsdc = step.priceMicroUsdc;
        s.txId = step.txId;
        s.explorerUrl = step.explorerUrl;
        s.output = step.output;
      }
      task.spentMicroUsdc += step.priceMicroUsdc;
    },
  })
    .then((result) => {
      task.blocked = result.blocked;
      task.report = result.report;
      task.status = result.blocked ? "blocked" : "done";
      // Anything still queued when the firewall tripped is marked blocked.
      if (result.blocked) for (const s of task.steps) if (s.status !== "paid") s.status = "blocked";
      task.finishedAt = new Date().toISOString();
    })
    .catch((err: unknown) => {
      task.status = "failed";
      task.error = String(err);
      task.finishedAt = new Date().toISOString();
    });

  return task;
}

export function getTask(id: string): Task | null {
  return tasks.get(id) ?? null;
}

export function listTasks(): Task[] {
  return order.map((id) => tasks.get(id)).filter((t): t is Task => Boolean(t));
}
