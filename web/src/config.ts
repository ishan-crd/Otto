import "dotenv/config";
import { z } from "zod";

/** 1 USDC = 1_000_000 micro-USDC. All money inside Otto is integer micro-USDC. */
export const MICRO = 1_000_000;
export const usdcToMicro = (usdc: number) => Math.round(usdc * MICRO);
export const microToUsdc = (micro: number) => micro / MICRO;
export const fmtUsdc = (micro: number) => `$${microToUsdc(micro).toFixed(4)}`;
/** Canonical wire format: decimal USDC string, e.g. 10000 -> "0.01". */
export const microToUsdcStr = (micro: number) =>
  (micro / MICRO).toFixed(6).replace(/\.?0+$/, "") || "0";
export const usdcStrToMicro = (s: string) => Math.round(parseFloat(s) * MICRO);

/** Seconds a 402 payment challenge stays valid before it expires. */
export const PAYMENT_TTL_SECONDS = 120;

const Env = z.object({
  PORT: z.coerce.number().default(8787),
  RAIL: z.enum(["mock", "algorand"]).default("mock"),
  DEFAULT_TASK_BUDGET_USDC: z.coerce.number().default(0.1),
  SESSION_BUDGET_USDC: z.coerce.number().default(25.0),

  ALGOD_SERVER: z.string().default("https://testnet-api.algonode.cloud"),
  ALGOD_PORT: z.coerce.number().default(443),
  ALGOD_TOKEN: z.string().default(""),
  USDC_ASSET_ID: z.coerce.number().default(10458941),
  PAYER_MNEMONIC: z.string().default(""),
  RECEIVER_ADDRESS: z.string().default(""),
  FACILITATOR_URL: z.string().default("https://facilitator.goplausible.xyz"),
  EXPLORER_TX_BASE: z.string().default("https://lora.algokit.io/testnet/transaction/"),

  // Real work behind the paywall: paid endpoints call OpenRouter (cheap per
  // call) so paying delivers a genuine AI result. Optional — the price/weather
  // endpoints use free, no-key public APIs and always work without this.
  OPENROUTER_API_KEY: z.string().default(""),
  OPENROUTER_MODEL: z.string().default("openai/gpt-4o-mini"),
});

const parsed = Env.parse(process.env);

export const config = {
  ...parsed,
  selfUrl: `http://localhost:${parsed.PORT}`,
  defaultTaskBudgetMicro: usdcToMicro(parsed.DEFAULT_TASK_BUDGET_USDC),
  sessionBudgetMicro: usdcToMicro(parsed.SESSION_BUDGET_USDC),
};

export type Config = typeof config;
