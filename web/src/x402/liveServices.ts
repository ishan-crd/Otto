import algosdk from "algosdk";
import type { Hono } from "hono";
import { config, microToUsdc, microToUsdcStr, usdcToMicro } from "../config";
import { AlgorandRail } from "../rails/algorandRail";
import { loadOttoWallet } from "../rails/ottoWallet";
import { paid } from "./middleware";

/**
 * The LIVE x402 flow: real pay-per-call endpoints that settle on Algorand
 * TestNet. Otto's account is auto-provisioned at boot (see ottoWallet.ts), so
 * `pnpm dev:web` is the only command needed — the /pay page then guides the two
 * human steps that can't be automated (faucet-funding + opt-in) with live
 * status checks and a one-click server-side opt-in.
 *
 * Two payer paths, both settling real on-chain txns:
 *   - BROWSER wallet (Pera / Lute) signs client-side; server verify()+settle()s.
 *   - SELF-PAY DEMO: Otto's server key signs — the full x402 loop with no
 *     browser wallet at all (the guaranteed live-demo path).
 */

const PRICE_MICRO = usdcToMicro(0.001); // 0.001 USDC per call — pocket change

interface LiveService {
  id: string;
  path: string;
  priceMicro: number;
  description: string;
  handler: (input: Record<string, unknown>) => Promise<unknown> | unknown;
}

const AI_MODEL = config.OPENROUTER_MODEL;
const hasAI = () => Boolean(config.OPENROUTER_API_KEY);

/**
 * fetch → JSON with a timeout that THROWS on any failure. Throwing matters: the
 * x402 middleware only settles after the handler returns (see middleware.ts), so
 * a thrown handler means no on-chain payment — the caller is only charged when a
 * real result comes back (pay-on-success).
 */
async function fetchJson<T = unknown>(url: string, init: RequestInit = {}, ms = 6000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "user-agent": "otto-x402/1.0", ...(init.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`upstream ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** One real OpenRouter chat completion. Throws if no key is configured. */
async function askAI(system: string, user: string): Promise<string> {
  if (!hasAI()) throw new Error("AI not configured — set OPENROUTER_API_KEY in web/.env");
  const data = await fetchJson<{ choices?: { message?: { content?: string } }[] }>(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://otto.agent",
        "X-Title": "Otto x402 agent",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 400,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    },
    15000,
  );
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("AI returned no content");
  return text.trim();
}

/**
 * Real paid endpoints. The AI ones make genuine OpenRouter calls (cheap per
 * call) — real agent work behind the paywall. The price/weather ones use free,
 * no-key public APIs, so the demo always has live results even without a key.
 */
const SERVICES: LiveService[] = [
  {
    id: "ask",
    path: "/live/services/ask",
    priceMicro: PRICE_MICRO,
    description: "Otto AI Agent — ask it anything (real GPT call via OpenRouter)",
    handler: async (i) => {
      const q = String(i.text ?? "In one sentence, what is the x402 payment protocol?");
      const answer = await askAI(
        "You are Otto, a concise, helpful autonomous agent. Answer in 2-4 sentences.",
        q,
      );
      return { model: AI_MODEL, prompt: q, answer };
    },
  },
  {
    id: "translate",
    path: "/live/services/translate",
    priceMicro: PRICE_MICRO,
    description: "AI Translator — 'to <language> | <text>' (OpenRouter)",
    handler: async (i) => {
      const raw = String(i.text ?? "to Spanish | Good morning, welcome to the agent economy");
      const m = raw.match(/^\s*to\s+([a-zA-Z ]+?)\s*[|:]\s*([\s\S]+)$/i);
      const lang = m ? m[1].trim() : "Spanish";
      const text = m ? m[2].trim() : raw;
      const translation = await askAI(
        `Translate the user's text into ${lang}. Reply with ONLY the translation.`,
        text,
      );
      return { model: AI_MODEL, targetLanguage: lang, source: text, translation };
    },
  },
  {
    id: "price",
    path: "/live/services/price",
    priceMicro: PRICE_MICRO,
    description: "Live crypto price — real-time spot from Coinbase (no key)",
    handler: async (i) => {
      let pair = String(i.text ?? "BTC-USD")
        .trim()
        .toUpperCase();
      if (!pair.includes("-")) pair = `${pair}-USD`;
      const data = await fetchJson<{ data?: { amount?: string; currency?: string } }>(
        `https://api.coinbase.com/v2/prices/${encodeURIComponent(pair)}/spot`,
      );
      const amount = data.data?.amount;
      if (!amount) throw new Error(`no price for ${pair}`);
      return {
        pair,
        price: Number(amount),
        currency: data.data?.currency ?? "USD",
        source: "coinbase",
        asOf: new Date().toISOString(),
      };
    },
  },
  {
    id: "weather",
    path: "/live/services/weather",
    priceMicro: PRICE_MICRO,
    description: "Live weather — current conditions for any city (Open-Meteo, no key)",
    handler: async (i) => {
      const city = String(i.text ?? "London").trim();
      const geo = await fetchJson<{
        results?: { latitude: number; longitude: number; name: string; country?: string }[];
      }>(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
      const place = geo.results?.[0];
      if (!place) throw new Error(`unknown city: ${city}`);
      const wx = await fetchJson<{
        current?: {
          temperature_2m?: number;
          wind_speed_10m?: number;
          relative_humidity_2m?: number;
          time?: string;
        };
      }>(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,wind_speed_10m,relative_humidity_2m`,
      );
      const cur = wx.current ?? {};
      return {
        city: place.name,
        country: place.country ?? "",
        tempC: cur.temperature_2m,
        windKph: cur.wind_speed_10m,
        humidityPct: cur.relative_humidity_2m,
        source: "open-meteo",
        asOf: cur.time ?? new Date().toISOString(),
      };
    },
  },
];

/** Config with Otto's auto-provisioned account filled in. */
function effectiveConfig() {
  const wallet = loadOttoWallet();
  return {
    ...config,
    PAYER_MNEMONIC: wallet.mnemonic,
    RECEIVER_ADDRESS: config.RECEIVER_ADDRESS || wallet.address,
  };
}

/** Live x402 is always on — the account exists from first boot. */
export function liveEnabled() {
  return true;
}

export function ottoAddress() {
  return effectiveConfig().RECEIVER_ADDRESS;
}

export function mountLive(app: Hono) {
  const cfg = effectiveConfig();
  const rail = new AlgorandRail(cfg);
  const algod = new algosdk.Algodv2(cfg.ALGOD_TOKEN, cfg.ALGOD_SERVER, cfg.ALGOD_PORT);
  const payer = algosdk.mnemonicToSecretKey(cfg.PAYER_MNEMONIC.trim());

  // Info the /pay page needs to build + submit a transaction.
  app.get("/api/live/info", (c) =>
    c.json({
      enabled: true,
      network: "algorand-testnet",
      chainId: 416002, // Algorand TestNet
      assetId: cfg.USDC_ASSET_ID,
      receiver: cfg.RECEIVER_ADDRESS,
      algodServer: cfg.ALGOD_SERVER,
      algodPort: cfg.ALGOD_PORT,
      explorerBase: cfg.EXPLORER_TX_BASE,
    }),
  );

  /** Live readiness of Otto's account: funded? opted in? USDC balance? */
  app.get("/api/live/status", async (c) => {
    try {
      const info = (await algod.accountInformation(payer.addr).do()) as {
        amount?: number | bigint;
        assets?: {
          assetId?: number | bigint;
          "asset-id"?: number | bigint;
          amount?: number | bigint;
        }[];
      };
      const algo = Number(info.amount ?? 0) / 1e6;
      const usdcAsset = (info.assets ?? []).find(
        (a) => Number(a.assetId ?? a["asset-id"]) === cfg.USDC_ASSET_ID,
      );
      return c.json({
        address: cfg.RECEIVER_ADDRESS,
        algo,
        funded: algo > 0.15,
        optedIn: Boolean(usdcAsset),
        usdc: usdcAsset ? Number(usdcAsset.amount ?? 0) / 1e6 : 0,
      });
    } catch {
      // Unfunded accounts can 404 on some nodes — report a clean zero state.
      return c.json({
        address: cfg.RECEIVER_ADDRESS,
        algo: 0,
        funded: false,
        optedIn: false,
        usdc: 0,
      });
    }
  });

  /** One-click, server-signed USDC opt-in (needs the account faucet-funded). */
  app.post("/api/live/optin", async (c) => {
    try {
      const sp = await algod.getTransactionParams().do();
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: payer.addr,
        receiver: payer.addr,
        amount: 0,
        assetIndex: cfg.USDC_ASSET_ID,
        suggestedParams: sp,
      });
      const sent = (await algod.sendRawTransaction(txn.signTxn(payer.sk)).do()) as {
        txid?: string;
        txId?: string;
      };
      const txId = sent.txid ?? sent.txId ?? "";
      await algosdk.waitForConfirmation(algod, txId, 4);
      return c.json({ ok: true, txId, explorerUrl: `${cfg.EXPLORER_TX_BASE}${txId}` });
    } catch (err) {
      return c.json({ ok: false, detail: String(err) }, 400);
    }
  });

  app.get("/api/live/services", (c) =>
    c.json({
      services: SERVICES.map((s) => ({
        id: s.id,
        path: s.path,
        priceMicro: s.priceMicro,
        priceUsdc: microToUsdc(s.priceMicro),
        price: microToUsdcStr(s.priceMicro),
        description: s.description,
      })),
    }),
  );

  /**
   * SELF-PAY DEMO: Otto pays its own paid endpoint with its server key — the
   * complete real x402 loop (402 → sign → verify → settle on-chain → response)
   * with no browser wallet. Requires the account funded + opted in.
   */
  app.post("/api/live/self-pay", async (c) => {
    const body = await c.req
      .json<{ serviceId?: string; text?: string }>()
      .catch(() => ({}) as never);
    const svc = SERVICES.find((s) => s.id === body.serviceId) ?? SERVICES[0];
    if (!svc) return c.json({ error: "no_service" }, 400);
    try {
      const base = `http://localhost:${cfg.PORT}`;
      const challenge = await fetch(`${base}${svc.path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: body.text ?? "" }),
      });
      if (challenge.status !== 402) throw new Error(`expected 402, got ${challenge.status}`);
      const req = ((await challenge.json()) as { accepts: Parameters<typeof rail.pay>[0][] })
        .accepts[0];
      if (!req) throw new Error("402 carried no payment requirements");
      const payload = await rail.pay(req);
      const paidRes = await fetch(`${base}${svc.path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-PAYMENT": Buffer.from(JSON.stringify(payload)).toString("base64"),
        },
        body: JSON.stringify({ text: body.text ?? "" }),
      });
      if (!paidRes.ok) {
        const err = (await paidRes.json().catch(() => ({}))) as { detail?: string; error?: string };
        throw new Error(err.detail ?? err.error ?? `HTTP ${paidRes.status}`);
      }
      const settleHeader = paidRes.headers.get("X-PAYMENT-RESPONSE");
      const settle = settleHeader
        ? (JSON.parse(Buffer.from(settleHeader, "base64").toString("utf8")) as Record<
            string,
            unknown
          >)
        : {};
      const out = (await paidRes.json()) as { result?: unknown };
      return c.json({ ok: true, serviceId: svc.id, settle, result: out.result ?? out });
    } catch (err) {
      return c.json({ ok: false, detail: String(err) }, 400);
    }
  });

  for (const s of SERVICES) {
    app.post(s.path, paid(s.priceMicro, s.id, { rail, description: s.description }), async (c) => {
      const input = await c.req.json().catch(() => ({}));
      return c.json({ result: await s.handler(input) });
    });
  }
}
