import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { dashboard } from "./api/dashboard";
import { DASHBOARD_HTML } from "./api/webPage";
import { config, fmtUsdc } from "./config";
import { SERVICES } from "./services/registry";
import { paid } from "./x402/middleware";

const app = new Hono();

// The frontend runs on its own dev server during the hackathon — allow it.
app.use("*", cors());

// Built-in browser dashboard so you can SEE Otto working — served at root.
app.get("/", (c) => c.html(DASHBOARD_HTML));

// Mount every registry service as a paid x402 endpoint.
for (const service of SERVICES) {
  app.post(service.path, paid(service.priceMicroUsdc, service.id), async (c) => {
    const input = await c.req.json().catch(() => ({}));
    return c.json({ result: service.handler(input) });
  });
}

// Dashboard + control API for the frontend.
app.route("/", dashboard);

// Machine-readable API index (the dashboard lives at `/`).
app.get("/api", (c) =>
  c.json({
    name: "Otto",
    tagline: "the AI that earns its keep",
    rail: config.RAIL,
    endpoints: {
      run: "POST /api/run { goal, budgetUsdc? }",
      wallet: "GET /api/wallet",
      ledger: "GET /api/ledger",
      services: "GET /api/services",
      earn: "POST /api/earn/simulate",
      stream: "GET /api/stream (SSE)",
    },
    paidServices: SERVICES.map((s) => ({ path: s.path, price: fmtUsdc(s.priceMicroUsdc) })),
  }),
);

export function startServer(port = config.PORT) {
  return serve({ fetch: app.fetch, port }, (info) => {
    console.log(`\n  🤖 Otto is live`);
    console.log(`     dashboard: http://localhost:${info.port}/`);
    console.log(`     API index: http://localhost:${info.port}/api`);
    console.log(
      `     rail: ${config.RAIL.toUpperCase()}  |  session budget: ${fmtUsdc(config.sessionBudgetMicro)}\n`,
    );
  });
}

// Auto-start only when this file is run directly (npm run dev/start),
// not when imported (e.g. by tests, which boot their own instance).
import { argv } from "node:process";

if (argv[1] && import.meta.url === `file://${argv[1]}`) startServer();

export { app };
