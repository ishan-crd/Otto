import type { Context, Hono } from "hono";
import { config } from "../config";

/**
 * Real auth + per-user data, backed by Supabase (GoTrue + Postgres). The server
 * proxies the publishable-key Auth API, so accounts persist in your Supabase
 * project's database and survive restarts/deploys:
 *
 *   POST /api/auth/signup  → create account (may require email confirmation,
 *                            depending on the project's auth settings)
 *   POST /api/auth/login   → password grant → { token, user }
 *   GET  /api/auth/me      → verify a bearer token
 *   POST /api/auth/logout  → revoke the session
 *
 * Purchase history is stored per-user in Supabase user metadata (auth.users),
 * written with the USER'S OWN token — no service-role key needed.
 */

export interface SupaUser {
  id: string;
  email: string;
  name: string;
  purchases: PurchaseRecord[];
}

export interface PurchaseRecord {
  prompt: string;
  model: string;
  priceUsdc: number;
  outputTokens: number;
  txId: string;
  explorerUrl: string;
  at: string;
}

const base = () => config.supabaseUrl.replace(/\/$/, "");
export const supaEnabled = () => Boolean(config.supabaseUrl && config.supabaseKey);

async function gotrue<T = Record<string, unknown>>(
  path: string,
  init: RequestInit = {},
  bearer?: string,
): Promise<{ status: number; body: T }> {
  const res = await fetch(`${base()}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: config.supabaseKey,
      "content-type": "application/json",
      ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, body };
}

interface GoTrueUser {
  id?: string;
  email?: string;
  confirmation_sent_at?: string;
  user_metadata?: { name?: string; purchases?: PurchaseRecord[] };
}
interface GoTrueSession {
  access_token?: string;
  user?: GoTrueUser;
  error_code?: string;
  msg?: string;
}

const toUser = (u: GoTrueUser): SupaUser => ({
  id: u.id ?? "",
  email: u.email ?? "",
  name: u.user_metadata?.name ?? (u.email ?? "").split("@")[0] ?? "User",
  purchases: u.user_metadata?.purchases ?? [],
});

/** Resolve the caller from Authorization: Bearer <supabase access token>. */
export async function getSupaUser(c: Context): Promise<SupaUser | null> {
  if (!supaEnabled()) return null;
  const auth = c.req.header("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const { status, body } = await gotrue<GoTrueUser>("/user", { method: "GET" }, token);
  return status === 200 && body.id ? toUser(body) : null;
}

/** Append a purchase to the user's history (kept in their Supabase metadata). */
export async function recordPurchase(token: string, entry: PurchaseRecord): Promise<void> {
  const { status, body } = await gotrue<GoTrueUser>("/user", { method: "GET" }, token);
  if (status !== 200 || !body.id) return;
  const purchases = [entry, ...(body.user_metadata?.purchases ?? [])].slice(0, 25);
  await gotrue("/user", { method: "PUT", body: JSON.stringify({ data: { purchases } }) }, token);
}

export function mountSupaAuth(app: Hono) {
  app.get("/api/auth/status", (c) => c.json({ enabled: supaEnabled() }));

  app.post("/api/auth/signup", async (c) => {
    if (!supaEnabled()) return c.json({ error: "auth not configured" }, 503);
    const b = await c.req
      .json<{ email?: string; password?: string; name?: string }>()
      .catch(() => ({}) as never);
    const email = String(b.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(b.password ?? "");
    if (!email || password.length < 6)
      return c.json({ error: "email and a 6+ char password required" }, 400);
    const { status, body } = await gotrue<GoTrueSession>("/signup", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        data: { name: String(b.name ?? "").trim() || email.split("@")[0] },
      }),
    });
    if (status >= 400)
      return c.json({ error: body.msg ?? body.error_code ?? "signup failed" }, 400);
    if (body.access_token && body.user)
      return c.json({ ok: true, token: body.access_token, user: toUser(body.user) });
    // Project has "Confirm email" on — account created, session comes after the link.
    return c.json({ ok: true, confirmEmail: true });
  });

  app.post("/api/auth/login", async (c) => {
    if (!supaEnabled()) return c.json({ error: "auth not configured" }, 503);
    const b = await c.req.json<{ email?: string; password?: string }>().catch(() => ({}) as never);
    const { status, body } = await gotrue<GoTrueSession>("/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({
        email: String(b.email ?? "")
          .trim()
          .toLowerCase(),
        password: String(b.password ?? ""),
      }),
    });
    if (status >= 400 || !body.access_token || !body.user) {
      const msg =
        body.error_code === "email_not_confirmed"
          ? "Email not confirmed yet — click the link in your inbox first."
          : (body.msg ?? "Wrong email or password");
      return c.json({ error: msg }, 401);
    }
    return c.json({ ok: true, token: body.access_token, user: toUser(body.user) });
  });

  app.get("/api/auth/me", async (c) => {
    const user = await getSupaUser(c);
    if (!user) return c.json({ error: "not_authenticated" }, 401);
    return c.json({ user });
  });

  app.get("/api/prompt/history", async (c) => {
    const user = await getSupaUser(c);
    if (!user) return c.json({ error: "not_authenticated" }, 401);
    return c.json({ purchases: user.purchases });
  });

  app.post("/api/auth/logout", async (c) => {
    const auth = c.req.header("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token) await gotrue("/logout", { method: "POST" }, token).catch(() => {});
    return c.json({ ok: true });
  });
}
