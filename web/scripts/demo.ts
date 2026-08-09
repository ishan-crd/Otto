import { config, fmtUsdc } from "../src/config";

/**
 * Scripted demo driver — hits the running server the way the frontend will, so
 * you can rehearse the pitch from the terminal. Start the server first:
 *   pnpm dev:web     (in one terminal, from the repo root)
 *   pnpm demo        (in another)
 */
const BASE = config.selfUrl;

type Entry = { amountMicroUsdc: number; counterparty: string; txId: string };
type RunResult = {
  steps: { priceMicroUsdc: number; serviceId: string; txId: string }[];
  totalSpentMicroUsdc: number;
  blocked: string | null;
};
type Wallet = {
  earned: { micro: number };
  spent: { micro: number };
  balance: { micro: number };
};

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<T>;
}
const get = <T>(path: string) => fetch(`${BASE}${path}`).then((r) => r.json() as Promise<T>);

async function main() {
  console.log("\n🎬 OTTO DEMO\n");

  console.log("① Otto earns — 3 external agents pay Otto for its legal skill:");
  for (let i = 0; i < 3; i++) {
    const e = await post<Entry>("/api/earn/simulate");
    console.log(`   + ${fmtUsdc(e.amountMicroUsdc)}  from ${e.counterparty}  (tx ${e.txId})`);
  }

  console.log("\n② Otto works — you give it a goal + a healthy budget:");
  const ok = await post<RunResult>("/api/run", {
    goal: "plan a weekend trip to Goa",
    budgetUsdc: 0.1,
  });
  for (const s of ok.steps)
    console.log(`   - paid ${fmtUsdc(s.priceMicroUsdc)} to ${s.serviceId}  (tx ${s.txId})`);
  console.log(`   total spent: ${fmtUsdc(ok.totalSpentMicroUsdc)} — goal complete ✅`);

  console.log("\n③ The firewall — same goal, but budget set to almost nothing:");
  const blocked = await post<RunResult>("/api/run", {
    goal: "plan a weekend trip to Goa",
    budgetUsdc: 0.015,
  });
  console.log(`   completed ${blocked.steps.length} step(s), then:`);
  console.log(`   🛑 ${blocked.blocked}`);

  const w = await get<Wallet>("/api/wallet");
  console.log(
    `\n④ Wallet now — earned ${fmtUsdc(w.earned.micro)}, spent ${fmtUsdc(w.spent.micro)}, balance ${fmtUsdc(w.balance.micro)}\n`,
  );
  console.log("An AI with income, expenses, and a hard budget it cannot break. That's Otto.\n");
}

main().catch((e) => {
  console.error("Demo failed — is the server running? (pnpm dev:web)\n", e);
  process.exit(1);
});
