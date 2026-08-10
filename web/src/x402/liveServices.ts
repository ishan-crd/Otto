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
  handler: (input: Record<string, unknown>) => unknown;
}

const SERVICES: LiveService[] = [
  {
    id: "regex",
    path: "/live/services/regex",
    priceMicro: PRICE_MICRO,
    description: "Smart Regex Builder — plain English → a production-ready pattern",
    handler: (i) => ({
      input: String(i.text ?? "a US phone number"),
      pattern: "^\\+?1?\\s*\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}$",
      explanation: "Matches optional +1, area code (with or without parens), and 7 digits.",
    }),
  },
  {
    id: "commit",
    path: "/live/services/commit",
    priceMicro: PRICE_MICRO,
    description: "Roast My Commit — reviews a commit message and suggests a better one",
    handler: (i) => ({
      original: String(i.text ?? "fix stuff"),
      verdict: "Too vague — a reader can't tell what changed or why.",
      suggestion: "fix(auth): reject expired tokens before session creation",
    }),
  },
  {
    id: "diff",
    path: "/live/services/diff",
    priceMicro: PRICE_MICRO,
    description: "Git Diff Explainer — plain-language summary of a code change",
    handler: (i) => ({
      input: String(i.text ?? "the provided diff"),
      summary:
        "Adds an early-return guard so the function exits before the network call when input is empty.",
      risk: "low",
    }),
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
      return c.json({ result: s.handler(input) });
    });
  }
}
