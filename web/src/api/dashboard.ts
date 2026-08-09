import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { runConcierge } from "../agent/concierge";
import { config, microToUsdc } from "../config";
import { simulateIncomingPayment } from "../earn/earn";
import { wallet } from "../guard/wallet";
import { type LedgerEntry, ledger } from "../ledger/ledger";
import { SERVICES } from "../services/registry";

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

/** Simulate an external agent paying Otto (earnings tick up). */
dashboard.post("/api/earn/simulate", async (c) => {
  const entry = await simulateIncomingPayment();
  return c.json(decorate(entry));
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
