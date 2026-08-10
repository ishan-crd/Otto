import type { Hono } from "hono";
import { config, microToUsdc, microToUsdcStr, usdcToMicro } from "../config";
import { AlgorandRail } from "../rails/algorandRail";
import { paid } from "./middleware";

/**
 * The LIVE x402 flow: a small set of real pay-per-call endpoints that settle on
 * Algorand TestNet with a user's own wallet.
 *
 * These are separate from the mock endpoints that power the design dashboard.
 * Here the browser (Pera Wallet) signs a real USDC-ASA transfer; the server only
 * verifies + submits it. No server key is required — settlement is keyless from
 * the server's side (the wallet is the payer).
 *
 * Enabled only when the Algorand receiver is configured (RECEIVER_ADDRESS, or a
 * PAYER_MNEMONIC whose address doubles as the receiver). Otherwise the /pay page
 * shows a "not configured" state instead of erroring.
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

/** The live flow is available only when an Algorand receiver is configured. */
export function liveEnabled() {
  return Boolean(config.RECEIVER_ADDRESS || config.PAYER_MNEMONIC);
}

export function mountLive(app: Hono) {
  const enabled = liveEnabled();
  const rail = new AlgorandRail(config);

  // Info the /pay page needs to build + submit a transaction.
  app.get("/api/live/info", (c) =>
    c.json({
      enabled,
      network: "algorand-testnet",
      chainId: 416002, // Algorand TestNet
      assetId: config.USDC_ASSET_ID,
      receiver: enabled ? rail.receiverAddress() : null,
      algodServer: config.ALGOD_SERVER,
      algodPort: config.ALGOD_PORT,
      explorerBase: config.EXPLORER_TX_BASE,
    }),
  );

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

  if (!enabled) return; // don't mount paid endpoints that would 500 on a missing receiver

  for (const s of SERVICES) {
    app.post(s.path, paid(s.priceMicro, s.id, { rail, description: s.description }), async (c) => {
      const input = await c.req.json().catch(() => ({}));
      return c.json({ result: s.handler(input) });
    });
  }
}
