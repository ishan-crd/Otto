/**
 * Otto backend client. Points at the Node server in `web/`. All money comes
 * back as both `micro` (int) and `usdc` (float); the app displays usdc.
 *
 * ⚠️ localhost gotcha: a physical phone can't reach your computer's "localhost".
 *   - iOS Simulator / web  → http://localhost:8787 works as-is.
 *   - Real phone via Expo Go → set your computer's LAN IP, e.g.
 *       EXPO_PUBLIC_OTTO_API=http://192.168.1.23:8787   (find it: `ipconfig getifaddr en0`)
 */
export const API_BASE = process.env.EXPO_PUBLIC_OTTO_API ?? "http://localhost:8787";

/** The live wallet-payment page (Pera/Lute sign real testnet USDC). */
export const PAY_URL = `${API_BASE}/pay`;

export interface Money {
  micro: number;
  usdc: number;
}

export interface WalletSnapshot {
  rail: string;
  balance: Money;
  toppedUp: Money;
  earned: Money;
  spent: Money;
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

export interface TaskStep {
  serviceId: string;
  description: string;
  status: "queued" | "running" | "paid" | "blocked";
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
  createdAt: string;
  finishedAt: string | null;
}

export interface MarketAgent {
  id: string;
  title: string;
  agent: string;
  initials: string;
  meta: string;
  rating: string;
  unit: string;
  sell: boolean;
  description: string;
  price: Money;
}

export interface HireResult {
  serviceId: string;
  paid: Money;
  txId: string;
  explorerUrl: string;
  result: unknown;
}

export interface Policy {
  autoHire: boolean;
  autoPay: boolean;
  sellSkills: boolean;
  taskBudgetUsdc: number;
  sessionBudgetUsdc: number;
}

export interface PolicyResponse {
  policy: Policy;
  firewall: { taskBudget: Money; sessionBudget: Money; sessionSpent: Money };
}

export interface Stats {
  counts: { agents: number; runningTasks: number; receipts: number };
  chart: { earnedMicro: number; spentMicro: number }[];
  moneyGoes: { label: string; micro: number; usdc: number }[];
  escrow: Money;
  month: { paymentsOut: number; paymentsIn: number; net: Money; netMicro: number };
  firewall: { sessionBudget: Money; sessionSpent: Money };
  rail: string;
  network: string;
}

export interface LiveInfo {
  enabled: boolean;
  network: string;
  chainId?: number;
  assetId: number;
  receiver: string | null;
  algodServer?: string;
  algodPort?: number;
  explorerBase: string;
}

/** Live readiness of Otto's on-chain account (GET /api/live/status). */
export interface LiveStatus {
  address: string;
  algo: number;
  funded: boolean;
  optedIn: boolean;
  usdc: number;
}

/** A live pay-per-call service Otto sells (GET /api/live/services). */
export interface LiveService {
  id: string;
  path: string;
  priceMicro: number;
  priceUsdc: number;
  price: string;
  description: string;
}

export interface OptinResult {
  ok: boolean;
  txId?: string;
  explorerUrl?: string;
  detail?: string;
}

export interface SelfPayResult {
  ok: boolean;
  serviceId?: string;
  settle?: Record<string, unknown>;
  result?: unknown;
  detail?: string;
}

/** Testnet account explorer (AlgoKit lora) — append an address. */
export const ACCOUNT_EXPLORER = "https://lora.algokit.io/testnet/account/";

async function jget<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}
async function jsend<T>(method: "POST" | "PUT", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { detail?: string; error?: string };
  if (!res.ok) throw new Error(data.detail ?? data.error ?? `${path} → ${res.status}`);
  return data;
}

export const otto = {
  wallet: () => jget<WalletSnapshot>("/api/wallet"),
  ledger: () => jget<{ entries: LedgerEntry[] }>("/api/ledger"),
  stats: () => jget<Stats>("/api/stats"),
  liveInfo: () => jget<LiveInfo>("/api/live/info"),
  liveStatus: () => jget<LiveStatus>("/api/live/status"),
  liveServices: () => jget<{ services: LiveService[] }>("/api/live/services"),
  optin: () => jsend<OptinResult>("POST", "/api/live/optin"),
  selfPay: (serviceId: string, text?: string) =>
    jsend<SelfPayResult>("POST", "/api/live/self-pay", { serviceId, text }),

  tasks: () => jget<{ tasks: Task[] }>("/api/tasks"),
  task: (id: string) => jget<Task>(`/api/tasks/${id}`),
  startTask: (goal: string, budgetUsdc?: number) =>
    jsend<Task>("POST", "/api/tasks", { goal, budgetUsdc }),

  marketplace: () => jget<{ agents: MarketAgent[] }>("/api/marketplace"),
  hire: (serviceId: string, input?: Record<string, unknown>) =>
    jsend<HireResult>("POST", "/api/marketplace/hire", { serviceId, input }),

  earn: () => jsend<LedgerEntry>("POST", "/api/earn/simulate"),

  policy: () => jget<PolicyResponse>("/api/policy"),
  updatePolicy: (patch: Partial<Policy>) => jsend<PolicyResponse>("PUT", "/api/policy", patch),
};

/** "$1.23" for a usdc float (4dp under a cent). */
export const money = (usdc: number) => `$${usdc.toFixed(usdc > 0 && usdc < 0.01 ? 4 : 2)}`;
/** Short tx id, e.g. "MOCK-A…12F0". */
export const shortTx = (id: string | null) => {
  const s = id ?? "";
  return s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s || "—";
};
