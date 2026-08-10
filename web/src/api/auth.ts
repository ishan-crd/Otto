import { randomUUID } from "node:crypto";
import type { Context, Hono } from "hono";

/**
 * Minimal in-memory auth so the marketplace has two role-based experiences.
 * Two accounts are seeded (seller@otto.com / seller, buyer@otto.com / buyer);
 * sign-up creates more. A login returns a bearer token the client stores and
 * sends back; getUser() resolves it. Passwords are plaintext + in-memory — fine
 * for a hackathon demo, not for production.
 */
export type Role = "buyer" | "seller";
export interface User {
  email: string;
  password: string;
  role: Role;
  name: string;
}
export interface PublicUser {
  email: string;
  role: Role;
  name: string;
}

const users = new Map<string, User>();
const sessions = new Map<string, string>(); // token -> email

function seed(email: string, password: string, role: Role, name: string) {
  users.set(email, { email, password, role, name });
}
seed("seller@otto.com", "seller", "seller", "Demo Seller");
seed("buyer@otto.com", "buyer", "buyer", "Demo Buyer");

const publicUser = (u: User): PublicUser => ({ email: u.email, role: u.role, name: u.name });

/** Resolve the caller from the Authorization: Bearer <token> header. */
export function getUser(c: Context): PublicUser | null {
  const auth = c.req.header("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const email = token && sessions.get(token);
  const u = email ? users.get(email) : undefined;
  return u ? publicUser(u) : null;
}

export function mountAuth(app: Hono) {
  app.post("/api/auth/signup", async (c) => {
    const b = await c.req
      .json<{ name?: string; email?: string; password?: string; role?: string }>()
      .catch(() => ({}) as never);
    const email = String(b.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(b.password ?? "");
    const name = String(b.name ?? "").trim() || email.split("@")[0] || "User";
    const role: Role = b.role === "seller" ? "seller" : "buyer";
    if (!email || !password) return c.json({ error: "email and password required" }, 400);
    if (users.has(email)) return c.json({ error: "account already exists — log in instead" }, 409);
    users.set(email, { email, password, role, name });
    const token = randomUUID();
    sessions.set(token, email);
    return c.json({ ok: true, token, user: publicUser(users.get(email) as User) });
  });

  app.post("/api/auth/login", async (c) => {
    const b = await c.req.json<{ email?: string; password?: string }>().catch(() => ({}) as never);
    const email = String(b.email ?? "")
      .trim()
      .toLowerCase();
    const u = users.get(email);
    if (!u || u.password !== String(b.password ?? ""))
      return c.json({ error: "wrong email or password" }, 401);
    const token = randomUUID();
    sessions.set(token, email);
    return c.json({ ok: true, token, user: publicUser(u) });
  });

  app.get("/api/auth/me", (c) => {
    const u = getUser(c);
    if (!u) return c.json({ error: "not_authenticated" }, 401);
    return c.json({ user: u });
  });

  app.post("/api/auth/logout", (c) => {
    const auth = c.req.header("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token) sessions.delete(token);
    return c.json({ ok: true });
  });
}
