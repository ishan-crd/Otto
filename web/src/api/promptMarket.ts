import { randomUUID } from "node:crypto";
import type { Hono } from "hono";
import { config, microToUsdc, microToUsdcStr, PAYMENT_TTL_SECONDS, usdcToMicro } from "../config";
import { AlgorandRail } from "../rails/algorandRail";
import { loadOttoWallet } from "../rails/ottoWallet";
import type { PaymentPayload, PaymentRequirements } from "../rails/types";
import { consume, issue, lookup } from "../x402/challenges";

/**
 * Sell-a-Prompt marketplace: a buyer submits a prompt, Otto runs it on a real
 * model, prices it by the ACTUAL output size, and only reveals the answer once
 * the buyer pays that exact amount over x402 on Algorand.
 *
 * Output-based pricing means the price isn't known until after generation, so
 * this can't use the fixed-price paid() middleware. Instead it's a two-phase
 * flow that reuses the same x402 primitives (challenge store + rail):
 *   1. POST /api/prompt/quote  → generate, count output tokens, PRICE it, issue a
 *      402 challenge, store the answer, return {jobId, price, preview} (no answer)
 *   2. pay it:
 *      - POST /api/prompt/claim       (buyer's Pera/Lute wallet signs the payment)
 *      - POST /api/prompt/claim-demo  (Otto's own key self-pays — one-click test)
 *   → verify + settle on Algorand → return the full answer + tx receipt.
 */

// Price = base + perToken × output tokens. Tune these to taste.
const BASE_MICRO = usdcToMicro(0.002); // $0.002 to accept any job
const PER_TOKEN_MICRO = 30; // 0.00003 USDC per output token
const priceFor = (outTokens: number) => BASE_MICRO + Math.max(0, outTokens) * PER_TOKEN_MICRO;

// Anthropic aliases so a bare claude id can hit the Anthropic API directly.
const ANTHROPIC_ID: Record<string, string> = {
  "claude-3.5-sonnet": "claude-3-5-sonnet-latest",
  "claude-3-5-sonnet": "claude-3-5-sonnet-latest",
  "claude-3.5-haiku": "claude-3-5-haiku-latest",
  "claude-3-haiku": "claude-3-haiku-20240307",
};

interface Job {
  answer: string;
  model: string;
  via: string;
  inputTokens: number;
  outputTokens: number;
  priceMicro: number;
  createdMs: number;
}
const jobs = new Map<string, Job>();

async function fetchJson<T = unknown>(url: string, init: RequestInit, ms = 40000): Promise<T> {
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

/** Run the prompt on a real model. Bare claude-* ids can use your Anthropic key
 *  directly; anything else (incl. anthropic/… catalog ids) goes via OpenRouter. */
async function callLLM(prompt: string, model: string): Promise<LlmResult> {
  const est = (s: string) => Math.max(1, Math.ceil(s.length / 4));

  if (config.ANTHROPIC_API_KEY && !model.includes("/") && /claude/i.test(model)) {
    const id = ANTHROPIC_ID[model] ?? model;
    const data = await fetchJson<{
      content?: { text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    }>("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": config.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: id,
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const answer = (data.content ?? [])
      .map((b) => b.text ?? "")
      .join("")
      .trim();
    if (!answer) throw new Error("empty answer from Anthropic");
    return {
      answer,
      model: `anthropic/${id}`,
      via: "anthropic",
      inputTokens: data.usage?.input_tokens ?? est(prompt),
      // Price by the DELIVERED answer, not raw completion tokens (which include
      // hidden reasoning on some models) — the buyer pays for what they receive.
      outputTokens: est(answer),
    };
  }

  if (!config.OPENROUTER_API_KEY) {
    throw new Error("No model key — set OPENROUTER_API_KEY (or ANTHROPIC_API_KEY) in web/.env");
  }
  const orModel = model.includes("/") ? model : `anthropic/${model}`;
  const out = await openRouter(prompt, orModel, est);
  if (out.answer) return out;
  // The chosen model returned nothing (credit cap / odd model) — fall back so the
  // buyer always gets a real answer + price.
  const FALLBACK = "openai/gpt-4o-mini";
  if (orModel === FALLBACK) throw new Error("model returned no text");
  const fb = await openRouter(prompt, FALLBACK, est);
  if (!fb.answer) throw new Error("model returned no text");
  return fb;
}

/** One OpenRouter chat call. Returns empty answer instead of throwing on no-text
 *  so callLLM can decide to fall back. Throws only on transport/HTTP errors. */
async function openRouter(
  prompt: string,
  orModel: string,
  est: (s: string) => number,
): Promise<LlmResult> {
  const data = await fetchJson<{
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  }>("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://otto.agent",
      "X-Title": "Otto prompt market",
    },
    body: JSON.stringify({
      model: orModel,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  }).catch(() => null);
  const answer = (data?.choices?.[0]?.message?.content ?? "").trim();
  return {
    answer,
    model: orModel,
    via: "openrouter",
    inputTokens: data?.usage?.prompt_tokens ?? est(prompt),
    // Price by the delivered answer, not raw completion tokens (some models bill
    // hidden reasoning) — the buyer pays for exactly what they receive.
    outputTokens: est(answer),
  };
}

export function mountPromptMarket(app: Hono) {
  const wallet = loadOttoWallet();
  const cfg = {
    ...config,
    PAYER_MNEMONIC: wallet.mnemonic,
    RECEIVER_ADDRESS: config.RECEIVER_ADDRESS || wallet.address,
  };
  const rail = new AlgorandRail(cfg);

  function challengeFor(priceMicro: number, outTokens: number): PaymentRequirements {
    const req: PaymentRequirements = {
      scheme: "exact",
      network: rail.kind,
      resource: "/api/prompt",
      description: `Pay-per-prompt · ${outTokens} output tokens`,
      payTo: rail.receiverAddress(),
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

  // ── Phase 1: generate + price + hold ───────────────────────────────────────
  app.post("/api/prompt/quote", async (c) => {
    const body = await c.req.json<{ prompt?: string; model?: string }>().catch(() => ({}) as never);
    const prompt = String(body.prompt ?? "").trim();
    if (!prompt) return c.json({ error: "empty_prompt" }, 400);
    const model = String(body.model ?? config.OPENROUTER_MODEL);
    try {
      const out = await callLLM(prompt, model);
      const priceMicro = priceFor(out.outputTokens);
      const req = challengeFor(priceMicro, out.outputTokens);
      jobs.set(req.paymentId, { ...out, priceMicro, createdMs: Date.now() });
      // prune expired jobs
      for (const [id, j] of jobs)
        if (Date.now() - j.createdMs > PAYMENT_TTL_SECONDS * 1000) jobs.delete(id);
      const words = out.answer.trim().split(/\s+/).length;
      return c.json({
        jobId: req.paymentId,
        model: out.model,
        via: out.via,
        inputTokens: out.inputTokens,
        outputTokens: out.outputTokens,
        words,
        chars: out.answer.length,
        priceMicroUsdc: priceMicro,
        priceUsdc: microToUsdc(priceMicro),
        price: microToUsdcStr(priceMicro),
        baseUsdc: microToUsdc(BASE_MICRO),
        perTokenUsdc: microToUsdc(PER_TOKEN_MICRO),
        preview: out.answer.slice(0, 180) + (out.answer.length > 180 ? "…" : ""),
        accepts: [req],
      });
    } catch (err) {
      return c.json({ error: "generation_failed", detail: String(err) }, 502);
    }
  });

  // ── Phase 2a: buyer's wallet paid it → verify, settle, reveal ──────────────
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
      return c.json({
        ok: true,
        answer: job.answer,
        model: job.model,
        outputTokens: job.outputTokens,
        priceUsdc: microToUsdc(job.priceMicro),
        txId: receipt.txId,
        explorerUrl: receipt.explorerUrl,
      });
    } catch (err) {
      return c.json({ error: "settlement_failed", detail: String(err) }, 402);
    }
  });

  // ── Phase 2b: Otto self-pays the quote (one-click demo, no browser wallet) ──
  app.post("/api/prompt/claim-demo", async (c) => {
    const body = await c.req.json<{ jobId?: string }>().catch(() => ({}) as never);
    const jobId = String(body.jobId ?? "");
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
      return c.json({
        ok: true,
        answer: job.answer,
        model: job.model,
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
