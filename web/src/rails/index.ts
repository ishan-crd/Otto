import { config } from "../config";
import { AlgorandRail } from "./algorandRail";
import { MockRail } from "./mockRail";
import type { PaymentRail } from "./types";

let singleton: PaymentRail | null = null;

/** Returns the rail selected by RAIL in .env. Mock by default. */
export function getRail(): PaymentRail {
  if (singleton) return singleton;
  singleton =
    config.RAIL === "algorand"
      ? new AlgorandRail(config)
      : new MockRail(config.RECEIVER_ADDRESS || "OTTO-MOCK-RECEIVER");
  return singleton;
}

export * from "./types";
