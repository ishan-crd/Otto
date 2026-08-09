import { config, fmtUsdc } from "../src/config";

/**
 * Scripted demo driver — hits the running server the way the frontend will, so
 * you can rehearse the pitch from the terminal. Start the server first:
 *   npm run dev      (in one terminal)
 *   npm run demo     (in another)
 */
const BASE = config.selfUrl;

async function post(path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}
const get = (path: string) => fetch(`${BASE}${path}`).then((r) => r.json());

async function main() {
  console.log("\n🎬 OTTO DEMO\n");

  console.log("① Otto earns — 3 external agents pay Otto for its legal skill:");
  for (let i = 0; i < 3; i++) {
    const e: any = await post("/api/earn/simulate");
    console.log(`   + ${fmtUsdc(e.amountMicroUsdc)}  from ${e.counterparty}  (tx ${e.txId})`);
  }

  console.log("\n② Otto works — you give it a goal + a healthy budget:");
  const ok: any = await post("/api/run", { goal: "plan a weekend trip to Goa", budgetUsdc: 0.1 });
  for (const s of ok.steps)
    console.log(`   - paid ${fmtUsdc(s.priceMicroUsdc)} to ${s.serviceId}  (tx ${s.txId})`);
  console.log(`   total spent: ${fmtUsdc(ok.totalSpentMicroUsdc)} — goal complete ✅`);

  console.log("\n③ The firewall — same goal, but budget set to almost nothing:");
  const blocked: any = await post("/api/run", { goal: "plan a weekend trip to Goa", budgetUsdc: 0.015 });
  console.log(`   completed ${blocked.steps.length} step(s), then:`);
  console.log(`   🛑 ${blocked.blocked}`);

  const w: any = await get("/api/wallet");
  console.log(`\n④ Wallet now — earned ${fmtUsdc(w.earned.micro)}, spent ${fmtUsdc(w.spent.micro)}, balance ${fmtUsdc(w.balance.micro)}\n`);
  console.log("An AI with income, expenses, and a hard budget it cannot break. That's Otto.\n");
}

main().catch((e) => {
  console.error("Demo failed — is the server running? (npm run dev)\n", e);
  process.exit(1);
});
