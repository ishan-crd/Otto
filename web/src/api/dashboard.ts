import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { runConcierge } from "../agent/concierge";
import { getTask, listTasks, startTask } from "../agent/taskStore";
import { payAndFetch } from "../client/x402Client";
import { config, microToUsdc } from "../config";
import { simulateIncomingPayment } from "../earn/earn";
import { getPolicy, updatePolicy } from "../guard/policy";
import { spendGuard } from "../guard/spendGuard";
import { wallet } from "../guard/wallet";
import { type LedgerEntry, ledger } from "../ledger/ledger";
import { MARKETPLACE_AGENTS, SERVICES, serviceById } from "../services/registry";

/**
 * Everything the (hackathon-built) frontend needs. Money values are returned
 * in BOTH micro-USDC (integer, authoritative) and usdc (float, for display).
 */
export const dashboard = new Hono();

const withUsdc = (micro: number) => ({ micro, usdc: microToUsdc(micro) });

dashboard.get("/api/health", (c) =>
  c.json({ ok: true, rail: config.RAIL, time: new Date().toISOString() }),
);

dashboard.get("/api/wallet", (c) => {
  const s = wallet.snapshot();
  return c.json({
    rail: config.RAIL,
    balance: withUsdc(s.balanceMicro),
    toppedUp: withUsdc(s.toppedUpMicro),
    earned: withUsdc(s.earnedMicro),
    spent: withUsdc(s.spentMicro),
  });
});

dashboard.get("/api/ledger", (c) => {
  const entries = ledger.all().map(decorate);
  return c.json({ totals: ledger.totals(), entries });
});

dashboard.get("/api/services", (c) =>
  c.json({
    services: SERVICES.map((s) => ({
      id: s.id,
      path: s.path,
      description: s.description,
      price: withUsdc(s.priceMicroUsdc),
    })),
  }),
);

/** Run a goal. Body: { goal: string, budgetUsdc?: number } */
dashboard.post("/api/run", async (c) => {
  const body = await c.req.json<{ goal?: string; budgetUsdc?: number }>();
  const goal = body.goal?.trim();
  if (!goal) return c.json({ error: "goal_required" }, 400);
  const budgetMicro =
    body.budgetUsdc != null
      ? Math.round(body.budgetUsdc * 1_000_000)
      : config.defaultTaskBudgetMicro;
  const result = await runConcierge(goal, budgetMicro);
  return c.json(result);
});

/**
 * Start a task in the background. Otto plans it, then hires + pays each agent
 * over x402 while the client polls GET /api/tasks/:id to watch it live.
 * Body: { goal: string, budgetUsdc?: number }
 */
dashboard.post("/api/tasks", async (c) => {
  const body = await c.req.json<{ goal?: string; budgetUsdc?: number }>();
  const goal = body.goal?.trim();
  if (!goal) return c.json({ error: "goal_required" }, 400);
  const policy = getPolicy();
  if (!policy.autoHire)
    return c.json(
      {
        error: "policy_blocked",
        detail: "Autonomy is off: 'Hire agents autonomously' is disabled in Rules & limits.",
      },
      403,
    );
  const task = startTask(goal, body.budgetUsdc ?? policy.taskBudgetUsdc);
  return c.json(task, 201);
});

dashboard.get("/api/tasks", (c) => c.json({ tasks: listTasks() }));

dashboard.get("/api/tasks/:id", (c) => {
  const task = getTask(c.req.param("id"));
  return task ? c.json(task) : c.json({ error: "not_found" }, 404);
});

/**
 * The agent marketplace: every service is a hireable agent with a per-task
 * price. "Hiring" one is a REAL x402 purchase — Otto's client pays the agent's
 * endpoint (402 → sign → settle) and returns the work + the payment receipt.
 */
dashboard.get("/api/marketplace", (c) =>
  c.json({
    agents: SERVICES.map((s) => {
      const meta = MARKETPLACE_AGENTS[s.id];
      return {
        id: s.id,
        title: meta?.title ?? s.description,
        agent: meta?.agent ?? "Unknown",
        initials: meta?.initials ?? "??",
        meta: meta?.meta ?? "",
        rating: meta?.rating ?? "4.80",
        unit: meta?.unit ?? "per task",
        sell: meta?.sell ?? false,
        description: s.description,
        price: withUsdc(s.priceMicroUsdc),
      };
    }),
  }),
);

dashboard.post("/api/marketplace/hire", async (c) => {
  const body = await c.req.json<{ serviceId?: string; input?: Record<string, unknown> }>();
  const service = body.serviceId ? serviceById(body.serviceId) : undefined;
  if (!service) return c.json({ error: "unknown_service" }, 400);
  if (!getPolicy().autoPay)
    return c.json(
      {
        error: "policy_blocked",
        detail: "Autonomy is off: 'Pay without approval' is disabled in Rules & limits.",
      },
      403,
    );
  try {
    const { data, receipt } = await payAndFetch(`${config.selfUrl}${service.path}`, {
      taskId: `hire-${randomUUID()}`,
      body: body.input ?? {},
    });
    return c.json({
      serviceId: service.id,
      paid: withUsdc(receipt.amountMicroUsdc),
      txId: receipt.txId,
      explorerUrl: receipt.explorerUrl,
      result: (data as { result?: unknown }).result ?? data,
    });
  } catch (err) {
    return c.json({ error: "hire_failed", detail: String(err) }, 402);
  }
});

/** Simulate an external agent paying Otto (earnings tick up). */
dashboard.post("/api/earn/simulate", async (c) => {
  if (!getPolicy().sellSkills)
    return c.json(
      {
        error: "policy_blocked",
        detail: "Autonomy is off: “Sell Otto's skills” is disabled in Rules & limits.",
      },
      403,
    );
  const entry = await simulateIncomingPayment();
  return c.json(decorate(entry));
});

/** Otto's autonomy policy — real gates over hire/pay/sell + the firewall budgets. */
dashboard.get("/api/policy", (c) => {
  const fw = spendGuard.snapshot();
  return c.json({
    policy: getPolicy(),
    firewall: {
      taskBudget: withUsdc(fw.taskBudgetMicro),
      sessionBudget: withUsdc(fw.sessionBudgetMicro),
      sessionSpent: withUsdc(fw.sessionSpentMicro),
    },
  });
});
dashboard.put("/api/policy", async (c) => {
  const patch = await c.req.json<Record<string, unknown>>().catch(() => ({}));
  const policy = updatePolicy(patch);
  const fw = spendGuard.snapshot();
  return c.json({
    policy,
    firewall: {
      taskBudget: withUsdc(fw.taskBudgetMicro),
      sessionBudget: withUsdc(fw.sessionBudgetMicro),
      sessionSpent: withUsdc(fw.sessionSpentMicro),
    },
  });
});

/**
 * Live aggregates for the dashboards — every number computed from the real
 * ledger / tasks / firewall, nothing invented.
 */
dashboard.get("/api/stats", (c) => {
  const entries = ledger.all(); // newest first
  const tasks = listTasks();
  const running = tasks.filter((t) => t.status === "running");

  // Escrow = money committed to steps Otto has queued but not yet settled.
  const escrowMicro = running.reduce(
    (sum, t) =>
      sum +
      t.steps
        .filter((s) => s.status === "queued" || s.status === "running")
        .reduce((x, s) => x + (s.priceMicroUsdc ?? 0), 0),
    0,
  );

  // 8 time buckets (2 min each) of earned vs spent for the chart.
  const BUCKETS = 8;
  const SPAN = 2 * 60 * 1000;
  const now = Date.now();
  const chart = Array.from({ length: BUCKETS }, () => ({ earnedMicro: 0, spentMicro: 0 }));
  for (const e of entries) {
    const age = now - Date.parse(e.ts);
    const idx = Math.max(0, BUCKETS - 1 - Math.floor(age / SPAN));
    const b = chart[idx];
    if (!b) continue;
    if (e.direction === "in") b.earnedMicro += e.amountMicroUsdc;
    else b.spentMicro += e.amountMicroUsdc;
  }

  // Where the money goes: outgoing totals grouped by service/resource.
  const bySvc = new Map<string, number>();
  for (const e of entries)
    if (e.direction === "out")
      bySvc.set(e.resource, (bySvc.get(e.resource) ?? 0) + e.amountMicroUsdc);
  const moneyGoes = [...bySvc.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, micro]) => {
      const meta = MARKETPLACE_AGENTS[label];
      return { label: meta ? `${meta.agent} · ${meta.title}` : label, ...withUsdc(micro) };
    });

  const totals = ledger.totals();
  const fw = spendGuard.snapshot();
  return c.json({
    counts: { agents: SERVICES.length, runningTasks: running.length, receipts: totals.count },
    chart,
    moneyGoes,
    escrow: withUsdc(escrowMicro),
    month: {
      paymentsOut: entries.filter((e) => e.direction === "out").length,
      paymentsIn: entries.filter((e) => e.direction === "in").length,
      net: withUsdc(totals.earnedMicro - totals.spentMicro),
      netMicro: totals.earnedMicro - totals.spentMicro,
    },
    firewall: {
      sessionBudget: withUsdc(fw.sessionBudgetMicro),
      sessionSpent: withUsdc(fw.sessionSpentMicro),
    },
    rail: config.RAIL,
    network: config.RAIL === "algorand" ? "USDC · Algorand TestNet" : "USDC · mock rail",
  });
});

/** Live stream of every payment (Server-Sent Events) for the animated dashboard. */
dashboard.get("/api/stream", (c) =>
  streamSSE(c, async (stream) => {
    const onEntry = (entry: LedgerEntry) =>
      stream.writeSSE({ event: "payment", data: JSON.stringify(decorate(entry)) });
    const onWallet = (snap: unknown) =>
      stream.writeSSE({ event: "wallet", data: JSON.stringify(snap) });

    ledger.on("entry", onEntry);
    wallet.on("change", onWallet);
    // keep-alive until the client disconnects
    while (!stream.closed) {
      await stream.writeSSE({ event: "ping", data: "1" });
      await stream.sleep(15_000);
    }
    ledger.off("entry", onEntry);
    wallet.off("change", onWallet);
  }),
);

function decorate(e: LedgerEntry) {
  return { ...e, usdc: microToUsdc(e.amountMicroUsdc) };
}
