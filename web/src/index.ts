import { readFileSync } from "node:fs";
import path from "node:path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { dashboard } from "./api/dashboard";
import { mountModels } from "./api/models";
import { PAY_PAGE_HTML } from "./api/payPage";
import { mountPromptMarket } from "./api/promptMarket";
import { PROMPT_PAGE_HTML } from "./api/promptPage";
import { DASHBOARD_HTML } from "./api/webPage";
import { config, fmtUsdc } from "./config";
import { initPersistence } from "./db/supaStore";
import { SERVICES } from "./services/registry";
import { liveEnabled, mountLive, ottoAddress } from "./x402/liveServices";
import { paid } from "./x402/middleware";

const app = new Hono();

// The frontend runs on its own dev server during the hackathon — allow it.
app.use("*", cors());

// Brand assets (favicon + app icon), read once at boot.
const LOGO_SVG = readFileSync(path.resolve(process.cwd(), "assets/otto-aperture.svg"));
const ICON_PNG = readFileSync(path.resolve(process.cwd(), "assets/otto-app-icon.png"));
app.get("/logo.svg", (c) =>
  c.body(LOGO_SVG, 200, {
    "content-type": "image/svg+xml",
    "cache-control": "public, max-age=86400",
  }),
);
app.get("/icon.png", (c) =>
  c.body(ICON_PNG, 200, { "content-type": "image/png", "cache-control": "public, max-age=86400" }),
);
app.get("/favicon.ico", (c) =>
  c.body(LOGO_SVG, 200, {
    "content-type": "image/svg+xml",
    "cache-control": "public, max-age=86400",
  }),
);

// Built-in browser dashboard so you can SEE Otto working — served at root.
app.get("/", (c) => c.html(DASHBOARD_HTML));

// The LIVE x402 wallet flow — connect Pera Wallet, pay real testnet USDC.
app.get("/pay", (c) => c.html(PAY_PAGE_HTML));
mountLive(app);
mountModels(app);

// Buy-a-Prompt: get an output-priced quote, pay over x402, reveal the answer.
app.get("/prompt", (c) => c.html(PROMPT_PAGE_HTML));
mountPromptMarket(app);

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
      liveInfo: "GET /api/live/info",
      liveServices: "GET /api/live/services",
      pay: "GET /pay (connect wallet + real testnet USDC)",
    },
    paidServices: SERVICES.map((s) => ({ path: s.path, price: fmtUsdc(s.priceMicroUsdc) })),
  }),
);

export async function startServer(port = config.PORT) {
  const store = await initPersistence();
  return serve({ fetch: app.fetch, port }, (info) => {
    console.log(`\n  🤖 Otto is live`);
    console.log(
      `     state: ${store === "postgres" ? "Supabase Postgres (persistent)" : "in-memory (run supabase/setup.sql to persist)"}`,
    );
    console.log(`     dashboard: http://localhost:${info.port}/`);
    console.log(
      `     live x402: http://localhost:${info.port}/pay  (connect wallet, real testnet USDC)`,
    );
    console.log(`     API index: http://localhost:${info.port}/api`);
    console.log(
      `     rail: ${config.RAIL.toUpperCase()}  |  live x402: ${liveEnabled() ? "ON (Algorand TestNet)" : "off"}`,
    );
    console.log(`     Otto's account: ${ottoAddress()}`);
    console.log(`     → fund it (test ALGO):  https://bank.testnet.algorand.network/`);
    console.log(
      `     → then open /pay and click "Opt in to USDC" + get USDC: https://faucet.circle.com/\n`,
    );
  });
}

// Auto-start only when this file is run directly (npm run dev/start),
// not when imported (e.g. by tests, which boot their own instance).
import { argv } from "node:process";

if (argv[1] && import.meta.url === `file://${argv[1]}`) void startServer();

export { app };
