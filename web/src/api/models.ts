import type { Hono } from "hono";

/**
 * OpenRouter model catalog for the dashboard. GET /api/models returns real
 * models with live per-million-token pricing, fetched from
 * https://openrouter.ai/api/v1/models (cached for an hour). This is what makes
 * the Agent Economy concrete: Otto "goes through OpenRouter models", pays one
 * per role over x402, and shows exactly which model did the work.
 *
 * No baked fallback — the list is always live. If OpenRouter is unreachable the
 * endpoint returns an empty list and the Agent Economy simply falls back to its
 * generic specialist agents.
 */
export interface ModelInfo {
  id: string;
  name: string;
  ctx: number | null;
  perMIn: number; // USD per 1M input tokens
  perMOut: number; // USD per 1M output tokens
}

const PROVIDERS = [
  "openai/",
  "anthropic/",
  "google/",
  "meta-llama/",
  "mistralai/",
  "deepseek/",
  "qwen/",
  "x-ai/",
  "cohere/",
  "microsoft/",
  "nousresearch/",
];

interface RawModel {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
}

let cache: { at: number; models: ModelInfo[] } | null = null;
const TTL_MS = 60 * 60 * 1000;

async function loadModels(): Promise<{ source: string; models: ModelInfo[] }> {
  if (cache && Date.now() - cache.at < TTL_MS) return { source: "cached", models: cache.models };
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      signal: ctrl.signal,
      headers: { "user-agent": "otto-x402/1.0" },
    }).finally(() => clearTimeout(timer));
    if (!res.ok) throw new Error(`openrouter ${res.status}`);
    const json = (await res.json()) as { data?: RawModel[] };
    const models = (json.data ?? [])
      .filter(
        (m) =>
          m.pricing && Number(m.pricing.prompt) > 0 && PROVIDERS.some((p) => m.id.startsWith(p)),
      )
      .map((m) => ({
        id: m.id,
        name: m.name ?? m.id,
        ctx: m.context_length ?? null,
        perMIn: Number(m.pricing?.prompt) * 1e6,
        perMOut: Number(m.pricing?.completion) * 1e6,
      }))
      .slice(0, 48);
    cache = { at: Date.now(), models };
    return { source: "live", models };
  } catch {
    return { source: "unavailable", models: [] };
  }
}

export function mountModels(app: Hono) {
  app.get("/api/models", async (c) => {
    const { source, models } = await loadModels();
    return c.json({ source, count: models.length, models });
  });
}
