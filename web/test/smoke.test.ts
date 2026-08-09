import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { serve } from "@hono/node-server";
import { runConcierge } from "../src/agent/concierge";
import { config, usdcToMicro } from "../src/config";
import { app } from "../src/index";

// The concierge makes real x402 HTTP calls to the paid endpoints, so the tests
// need a server on config.PORT. If a dev server is already running there, reuse
// it; otherwise boot an in-process one. This makes the tests robust whether or
// not `npm run dev` is up.
let server: ReturnType<typeof serve> | undefined;

const healthy = async () => {
  try {
    return (await fetch(`${config.selfUrl}/api/health`)).ok;
  } catch {
    return false;
  }
};

before(async () => {
  if (await healthy()) return; // a dev server is already serving — use it
  server = serve({ fetch: app.fetch, port: config.PORT });
  server.on("error", () => {}); // ignore EADDRINUSE races
  for (let i = 0; i < 50; i++) {
    if (await healthy()) return;
    await new Promise((res) => setTimeout(res, 50));
  }
  throw new Error("server did not start");
});

after(() => {
  try {
    server?.close();
  } catch {
    /* nothing to close */
  }
});

test("concierge completes a trip goal within budget", async () => {
  const r = await runConcierge("plan a weekend trip to Goa", usdcToMicro(0.1));
  assert.equal(r.blocked, null);
  assert.ok(r.steps.length >= 3, "should hire several services");
  assert.ok(r.totalSpentMicroUsdc > 0, "should spend real (mock) money");
  for (const s of r.steps) assert.ok(s.txId.length > 0, "every step has a tx id");
});

test("spend firewall blocks when the task budget is too small", async () => {
  const r = await runConcierge("plan a weekend trip to Goa", usdcToMicro(0.012));
  assert.ok(r.blocked, "firewall should have stopped a payment");
  assert.match(r.blocked ?? "", /budget/i);
});
