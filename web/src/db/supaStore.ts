import { config } from "../config";
import { getPolicy, type Policy, updatePolicy } from "../guard/policy";
import { spendGuard } from "../guard/spendGuard";
import { wallet } from "../guard/wallet";
import { type LedgerEntry, ledger } from "../ledger/ledger";

/**
 * Server-state persistence in Supabase Postgres. When the tables from
 * supabase/migrations exist, EVERYTHING the dashboard shows survives restarts
 * and is shared by every client (web + mobile hit the same rows):
 *
 *   ledger     one row per micropayment (in/out) — inserted as they settle
 *   app_state  'wallet' totals, 'policy', 'guard' session-spend snapshots
 *
 * If the tables are missing (migration not applied yet) the app runs exactly
 * as before, in memory, and logs how to enable persistence. All writes are
 *   fire-and-forget with a debounce so payments never wait on the database.
 */

const base = () => config.supabaseUrl.replace(/\/$/, "");
const enabled = () => Boolean(config.supabaseUrl && config.supabaseKey);

async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${base()}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: config.supabaseKey,
      authorization: `Bearer ${config.supabaseKey}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

let dbOn = false;
export const persistenceOn = () => dbOn;

async function tableExists(name: string): Promise<boolean> {
  try {
    const res = await rest(`/${name}?select=*&limit=1`);
    if (res.ok) return true;
    const body = (await res.json().catch(() => ({}))) as { code?: string };
    return body.code !== "PGRST205";
  } catch {
    return false;
  }
}

/* ── saves (debounced snapshots; immediate ledger inserts) ────────────────── */

async function putState(key: string, value: unknown): Promise<void> {
  await rest("/app_state", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
  }).catch(() => {});
}

let snapTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSnapshots() {
  if (!dbOn) return;
  if (snapTimer) clearTimeout(snapTimer);
  snapTimer = setTimeout(() => {
    void putState("wallet", wallet.snapshot());
    void putState("guard", { sessionSpentMicro: spendGuard.snapshot().sessionSpentMicro });
  }, 400);
}

/** Generic persisted key/value for other modules (no-op until the DB is on). */
export async function saveState(key: string, value: unknown): Promise<void> {
  if (dbOn) await putState(key, value);
}

export async function loadState<T>(key: string): Promise<T | null> {
  if (!dbOn) return null;
  try {
    const res = await rest(`/app_state?select=value&key=eq.${encodeURIComponent(key)}&limit=1`);
    if (!res.ok) return null;
    const rows = (await res.json()) as { value: T }[];
    return rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

export function persistPolicy(p: Policy) {
  if (!dbOn) return;
  void putState("policy", p);
}

function insertLedgerRow(e: LedgerEntry) {
  if (!dbOn) return;
  void rest("/ledger", {
    method: "POST",
    body: JSON.stringify({
      id: e.id,
      direction: e.direction,
      amount_micro: e.amountMicroUsdc,
      counterparty: e.counterparty,
      resource: e.resource,
      tx_id: e.txId,
      explorer_url: e.explorerUrl,
      mock: e.mock,
      task_id: e.taskId ?? null,
      ts: e.ts,
    }),
  }).catch(() => {});
}

/* ── boot: load everything back, then subscribe to changes ────────────────── */

interface LedgerRow {
  id: string;
  direction: "in" | "out";
  amount_micro: number | string;
  counterparty: string;
  resource: string;
  tx_id: string;
  explorer_url: string;
  mock: boolean;
  task_id: string | null;
  ts: string;
}

export async function initPersistence(): Promise<"postgres" | "memory"> {
  if (!enabled()) return "memory";
  const [hasLedger, hasState] = await Promise.all([
    tableExists("ledger"),
    tableExists("app_state"),
  ]);
  if (!hasLedger || !hasState) return "memory";
  dbOn = true;

  // 1. Rehydrate the ledger (oldest-first — Ledger.all() reverses for display).
  try {
    const res = await rest("/ledger?select=*&order=ts.asc&limit=1000");
    if (res.ok) {
      const rows = (await res.json()) as LedgerRow[];
      ledger.restore(
        rows.map((r) => ({
          id: r.id,
          direction: r.direction,
          amountMicroUsdc: Number(r.amount_micro),
          counterparty: r.counterparty,
          resource: r.resource,
          txId: r.tx_id,
          explorerUrl: r.explorer_url,
          mock: r.mock,
          ts: r.ts,
          taskId: r.task_id ?? undefined,
        })),
      );
    }
  } catch {
    /* keep empty ledger */
  }

  // 2. Rehydrate wallet totals, policy, and the firewall's session spend.
  try {
    const res = await rest("/app_state?select=key,value");
    if (res.ok) {
      const rows = (await res.json()) as { key: string; value: Record<string, number> }[];
      for (const row of rows) {
        if (row.key === "wallet")
          wallet.restore({
            toppedUpMicro: Number(row.value.toppedUpMicro ?? 0),
            earnedMicro: Number(row.value.earnedMicro ?? 0),
            spentMicro: Number(row.value.spentMicro ?? 0),
          });
        if (row.key === "guard")
          spendGuard.restoreSessionSpent(Number(row.value.sessionSpentMicro ?? 0));
        if (row.key === "policy") updatePolicy(row.value as Partial<Policy>);
      }
    }
  } catch {
    /* fall back to config defaults */
  }

  // 3. From here on, every change flows to Postgres.
  wallet.on("change", scheduleSnapshots);
  ledger.on("entry", (e: LedgerEntry) => {
    insertLedgerRow(e);
    scheduleSnapshots(); // guard commit happens alongside payments
  });
  // Seed current snapshots so fresh databases aren't empty.
  void putState("wallet", wallet.snapshot());
  void putState("policy", getPolicy());
  return "postgres";
}
