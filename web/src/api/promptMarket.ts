import { randomUUID } from "node:crypto";
import type { Hono } from "hono";
import { config, microToUsdc, microToUsdcStr, PAYMENT_TTL_SECONDS, usdcToMicro } from "../config";
import { AlgorandRail } from "../rails/algorandRail";
import { loadOttoWallet } from "../rails/ottoWallet";
import type { PaymentPayload, PaymentRequirements } from "../rails/types";
import { consume, issue, lookup } from "../x402/challenges";
import { getUser } from "./auth";

/**
 * Buy-a-Prompt marketplace (two-sided):
 *   - SELLERS connect their own Claude / OpenRouter key and list themselves as a
 *     provider with a price (base + per output token). Their key runs buyers'
 *     prompts; they earn USDC per sale.
 *   - BUYERS pick a provider, get a quote priced by the ACTUAL output size, and
 *     the answer unlocks only after they pay over x402 on Algorand.
 *
 * Output pricing isn't known until after generation, so this can't use the
 * fixed-price paid() middleware — it's a quote → pay → reveal flow reusing the
 * same x402 primitives (challenge store + AlgorandRail).
 */

interface Seller {
  id: string;
  name: string;
  provider: "openrouter" | "anthropic";
  apiKey: string;
  model: string;
  baseMicro: number;
  perTokenMicro: number;
  payTo: string;
  earningsMicro: number;
  sold: number;
  house: boolean;
  ownerEmail: string;
  createdMs: number;
}
const sellers = new Map<string, Seller>();

interface Job {
  answer: string;
  model: string;
  via: string;
  sellerId: string;
  inputTokens: number;
  outputTokens: number;
  priceMicro: number;
  createdMs: number;
}
const jobs = new Map<string, Job>();

const est = (s: string) => Math.max(1, Math.ceil(s.length / 4));

async function fetchJson<T = unknown>(
  url: string,
  init: RequestInit,
  ms = 40000,
): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "user-agent": "otto-x402/1.0", ...(init.headers ?? {}) },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`upstream ${res.status}: ${body.slice(0, 160)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

interface LlmResult {
  answer: string;
  model: string;
  via: string;
  inputTokens: number;
  outputTokens: number;
}

async function anthropicWith(prompt: string, key: string, model: string): Promise<LlmResult> {
  const data = await fetchJson<{
    content?: { text?: string }[];
    usage?: { input_tokens?: number };
  }>("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, max_tokens: 512, messages: [{ role: "user", content: prompt }] }),
  });
  const answer = (data?.content ?? [])
    .map((b) => b.text ?? "")
    .join("")
    .trim();
  return {
    answer,
    model: `anthropic/${model}`,
    via: "anthropic",
    inputTokens: data?.usage?.input_tokens ?? est(prompt),
    outputTokens: est(answer),
  };
}

async function openRouterWith(prompt: string, key: string, model: string): Promise<LlmResult> {
  const data = await fetchJson<{
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number };
  }>("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://otto.agent",
      "X-Title": "Otto prompt market",
    },
    body: JSON.stringify({ model, max_tokens: 512, messages: [{ role: "user", content: prompt }] }),
  }).catch(() => null);
  const answer = (data?.choices?.[0]?.message?.content ?? "").trim();
  return {
    answer,
    model,
    via: "openrouter",
    inputTokens: data?.usage?.prompt_tokens ?? est(prompt),
    outputTokens: est(answer),
  };
}

/** Run the buyer's prompt on the seller's own key + model (their capacity). */
async function runOnSeller(prompt: string, seller: Seller): Promise<LlmResult> {
  if (!seller.apiKey) throw new Error("seller has no API key configured");
  if (seller.provider === "anthropic") {
    const out = await anthropicWith(prompt, seller.apiKey, seller.model);
    if (!out.answer) throw new Error("model returned no text");
    return out;
  }
  const out = await openRouterWith(prompt, seller.apiKey, seller.model);
  if (out.answer) return out;
  // Chosen model returned nothing (credit cap / odd model) — fall back on the
  // seller's own key so the buyer always gets a real answer.
  const fb = await openRouterWith(prompt, seller.apiKey, "openai/gpt-4o-mini");
  if (!fb.answer) throw new Error("model returned no text");
  return fb;
}

const publicSeller = (s: Seller) => ({
  id: s.id,
  name: s.name,
  provider: s.provider,
  model: s.model,
  baseUsdc: microToUsdc(s.baseMicro),
  perTokenUsdc: microToUsdc(s.perTokenMicro),
  sold: s.sold,
  earnedUsdc: microToUsdc(s.earningsMicro),
  house: s.house,
  ownerEmail: s.ownerEmail,
  connected: Boolean(s.apiKey),
});

export function mountPromptMarket(app: Hono) {
  const wallet = loadOttoWallet();
  const cfg = {
    ...config,
    PAYER_MNEMONIC: wallet.mnemonic,
    RECEIVER_ADDRESS: config.RECEIVER_ADDRESS || wallet.address,
  };
  const rail = new AlgorandRail(cfg);
  const platformPayTo = rail.receiverAddress();

  // Seed a reliable house provider so the buy-side works out of the box.
  sellers.set("house", {
    id: "house",
    name: "Otto (house)",
    provider: "openrouter",
    apiKey: config.OPENROUTER_API_KEY,
    model: config.OPENROUTER_MODEL,
    baseMicro: usdcToMicro(0.002),
    perTokenMicro: 30,
    payTo: platformPayTo,
    earningsMicro: 0,
    sold: 0,
    house: true,
    ownerEmail: "",
    createdMs: Date.now(),
  });

  function challengeFor(priceMicro: number, payTo: string, outTokens: number): PaymentRequirements {
    const req: PaymentRequirements = {
      scheme: "exact",
      network: rail.kind,
      resource: "/api/prompt",
      description: `Buy-a-prompt · ${outTokens} output tokens`,
      payTo,
      asset: rail.assetId(),
      assetType: rail.assetType(),
      maxAmountRequired: microToUsdcStr(priceMicro),
      amountMicroUsdc: priceMicro,
      nonce: randomUUID(),
      paymentId: randomUUID(),
      expiresAt: new Date(Date.now() + PAYMENT_TTL_SECONDS * 1000).toISOString(),
    };
    issue(req);
    return req;
  }

  // ── Seller side ────────────────────────────────────────────────────────────
  app.get("/api/prompt/sellers", (c) =>
    c.json({
      sellers: [...sellers.values()].sort((a, b) => a.createdMs - b.createdMs).map(publicSeller),
    }),
  );

  app.post("/api/prompt/sellers", async (c) => {
    const b = await c.req
      .json<{
        name?: string;
        provider?: string;
        apiKey?: string;
        model?: string;
        baseUsdc?: number;
        perTokenUsdc?: number;
        payoutAddress?: string;
      }>()
      .catch(() => ({}) as never);
    const owner = getUser(c);
    const name = String(b.name ?? "").trim() || owner?.name || "";
    const apiKey = String(b.apiKey ?? "").trim();
    const model = String(b.model ?? "").trim();
    const provider = b.provider === "anthropic" ? "anthropic" : "openrouter";
    if (!name || !apiKey || !model)
      return c.json({ error: "name, apiKey and model are required" }, 400);
    const base = Number(b.baseUsdc);
    const perTok = Number(b.perTokenUsdc);
    const id = randomUUID().slice(0, 8);
    sellers.set(id, {
      id,
      name,
      provider,
      apiKey,
      model,
      baseMicro: usdcToMicro(Number.isFinite(base) && base >= 0 ? base : 0.003),
      perTokenMicro: usdcToMicro(Number.isFinite(perTok) && perTok > 0 ? perTok : 0.00004),
      payTo: String(b.payoutAddress ?? "").trim() || platformPayTo,
      earningsMicro: 0,
      sold: 0,
      house: false,
      ownerEmail: owner?.email ?? "",
      createdMs: Date.now(),
    });
    return c.json({ ok: true, seller: publicSeller(sellers.get(id) as Seller) });
  });

  // ── Buyer side: quote (generate + price + hold) ────────────────────────────
  app.post("/api/prompt/quote", async (c) => {
    const b = await c.req.json<{ prompt?: string; sellerId?: string }>().catch(() => ({}) as never);
    const prompt = String(b.prompt ?? "").trim();
    if (!prompt) return c.json({ error: "empty_prompt" }, 400);
    const seller = sellers.get(String(b.sellerId ?? "house")) ?? sellers.get("house");
    if (!seller) return c.json({ error: "no_seller" }, 400);
    try {
      const out = await runOnSeller(prompt, seller);
      const priceMicro = seller.baseMicro + out.outputTokens * seller.perTokenMicro;
      const req = challengeFor(priceMicro, seller.payTo, out.outputTokens);
      jobs.set(req.paymentId, { ...out, sellerId: seller.id, priceMicro, createdMs: Date.now() });
      for (const [id, j] of jobs)
        if (Date.now() - j.createdMs > PAYMENT_TTL_SECONDS * 1000) jobs.delete(id);
      return c.json({
        jobId: req.paymentId,
        seller: seller.name,
        model: out.model,
        via: out.via,
        inputTokens: out.inputTokens,
        outputTokens: out.outputTokens,
        words: out.answer.trim().split(/\s+/).length,
        priceMicroUsdc: priceMicro,
        priceUsdc: microToUsdc(priceMicro),
        price: microToUsdcStr(priceMicro),
        baseUsdc: microToUsdc(seller.baseMicro),
        perTokenUsdc: microToUsdc(seller.perTokenMicro),
        preview: out.answer.slice(0, 180) + (out.answer.length > 180 ? "…" : ""),
        accepts: [req],
      });
    } catch (err) {
      return c.json({ error: "generation_failed", detail: String(err) }, 502);
    }
  });

  function creditSeller(job: Job) {
    const s = sellers.get(job.sellerId);
    if (s) {
      s.earningsMicro += job.priceMicro;
      s.sold += 1;
    }
  }

  // ── Buyer pays with their wallet → verify, settle, reveal ──────────────────
  app.post("/api/prompt/claim", async (c) => {
    const header = c.req.header("X-PAYMENT");
    if (!header) return c.json({ error: "missing_payment" }, 402);
    let payload: PaymentPayload;
    try {
      payload = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    } catch {
      return c.json({ error: "bad_payment_header" }, 400);
    }
    const req = lookup(payload.paymentId);
    if (!req) return c.json({ error: "expired_or_unknown_payment" }, 402);
    if (payload.nonce !== req.nonce) return c.json({ error: "nonce_mismatch" }, 402);
    if (payload.amountMicroUsdc !== req.amountMicroUsdc)
      return c.json({ error: "amount_mismatch" }, 402);
    const job = jobs.get(payload.paymentId);
    if (!job) return c.json({ error: "job_not_found" }, 404);
    const verdict = await rail.verify(req, payload);
    if (!verdict.valid) return c.json({ error: "payment_invalid", reason: verdict.reason }, 402);
    try {
      const receipt = await rail.settle(req, payload);
      consume(payload.paymentId);
      jobs.delete(payload.paymentId);
      creditSeller(job);
      return c.json({
        ok: true,
        answer: job.answer,
        model: job.model,
        seller: sellers.get(job.sellerId)?.name ?? "provider",
        outputTokens: job.outputTokens,
        priceUsdc: microToUsdc(job.priceMicro),
        txId: receipt.txId,
        explorerUrl: receipt.explorerUrl,
      });
    } catch (err) {
      return c.json({ error: "settlement_failed", detail: String(err) }, 402);
    }
  });

  // ── One-click demo: Otto self-pays the quote (no browser wallet needed) ────
  app.post("/api/prompt/claim-demo", async (c) => {
    const b = await c.req.json<{ jobId?: string }>().catch(() => ({}) as never);
    const jobId = String(b.jobId ?? "");
    const req = lookup(jobId);
    const job = jobs.get(jobId);
    if (!req || !job) return c.json({ ok: false, detail: "expired_or_unknown_job" }, 404);
    try {
      const payload = await rail.pay(req);
      const verdict = await rail.verify(req, payload);
      if (!verdict.valid) throw new Error(`verify failed: ${verdict.reason ?? ""}`);
      const receipt = await rail.settle(req, payload);
      consume(jobId);
      jobs.delete(jobId);
      creditSeller(job);
      return c.json({
        ok: true,
        answer: job.answer,
        model: job.model,
        seller: sellers.get(job.sellerId)?.name ?? "provider",
        outputTokens: job.outputTokens,
        priceUsdc: microToUsdc(job.priceMicro),
        txId: receipt.txId,
        explorerUrl: receipt.explorerUrl,
      });
    } catch (err) {
      return c.json({ ok: false, detail: String(err) }, 502);
    }
  });
}
