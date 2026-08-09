/**
 * Otto backend client. Points at the Node server you already built
 * (~/Desktop/otto). All money comes back as both `micro` (int) and `usdc`
 * (float); the app displays usdc.
 *
 * ⚠️ localhost gotcha: a physical phone can't reach your computer's "localhost".
 *   - iOS Simulator / web  → http://localhost:8787 works as-is.
 *   - Real phone via Expo Go → set your computer's LAN IP, e.g.
 *       EXPO_PUBLIC_OTTO_API=http://192.168.1.23:8787   (find it: `ipconfig getifaddr en0`)
 */
export const API_BASE =
  process.env.EXPO_PUBLIC_OTTO_API ?? "http://localhost:8787";

export interface WalletSnapshot {
  rail: string;
  balance: { micro: number; usdc: number };
  toppedUp: { micro: number; usdc: number };
  earned: { micro: number; usdc: number };
  spent: { micro: number; usdc: number };
}

export interface LedgerEntry {
  id: string;
  direction: "in" | "out";
  usdc: number;
  counterparty: string;
  resource: string;
  txId: string;
  explorerUrl: string;
  mock: boolean;
  ts: string;
}

export interface RunResult {
  goal: string;
  steps: { serviceId: string; priceMicroUsdc: number; txId: string }[];
  totalSpentMicroUsdc: number;
  blocked: string | null;
  report: string;
}

async function jget<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}
async function jpost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const otto = {
  wallet: () => jget<WalletSnapshot>("/api/wallet"),
  ledger: () => jget<{ entries: LedgerEntry[] }>("/api/ledger"),
  run: (goal: string, budgetUsdc: number) =>
    jpost<RunResult>("/api/run", { goal, budgetUsdc }),
  earn: () => jpost<LedgerEntry>("/api/earn/simulate"),
};
