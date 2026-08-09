import { Platform } from "react-native";

/**
 * Otto's design tokens — a premium dark "financial instrument" look.
 * Calm and trustworthy (Otto handles money and never overspends), with one
 * crypto-native signature: monospace tabular numbers + directional money color.
 * Spend boldness only on the live payment stream; keep everything else quiet.
 */
export const c = {
  bg: "#0A0B0F", // near-black, faint blue
  surface: "#14161D",
  surface2: "#1C1F28",
  border: "#262A35", // hairline
  text: "#EDF0F5",
  muted: "#8A93A3",
  earn: "#34D399", // money in  (green)
  spend: "#FB7185", // money out (coral)
  accent: "#6D8BFF", // Otto's brand — periwinkle indigo (agent/AI, not web3 purple)
  accentSoft: "#1B2540",
} as const;

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;
export const space = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 } as const;

/** Monospace with tabular figures — "Otto speaks in ledgers." */
export const mono = Platform.select({ ios: "Menlo", default: "monospace" });
export const tabular = { fontVariant: ["tabular-nums" as const] };

export const usd = (n: number) => `$${Number(n).toFixed(4)}`;
