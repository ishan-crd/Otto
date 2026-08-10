/**
 * Otto's design tokens — premium near-black glassmorphism with lavender accents.
 *
 * This mirrors the canonical desktop dashboard (web/src/api/webPage.ts): a calm,
 * trustworthy "financial instrument" surface (Otto handles money and never
 * overspends) with one crypto-native signature — monospace tabular numbers and
 * directional money color. Change the palette here, in one place.
 */

/** Palette. Lavender is the brand; green = money in, lavender/coral = money out. */
export const c = {
  bg: "#0A0A0B", // near-black (NOT blue)
  surface: "#14161D", // cards (Android sheet fallback)
  surface2: "#1C1F28", // insets

  // Hairline borders / glass strokes
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.12)",
  hairline: "rgba(255,255,255,0.05)",

  // Text
  text: "#F2F1F6",
  muted: "rgba(242,241,246,0.5)",
  faint: "rgba(242,241,246,0.38)",
  dim: "rgba(242,241,246,0.28)",

  // Lavender accent scale (brand, links, primary buttons)
  accent: "#A9A0FF",
  accent2: "#B3AAFF",
  accentBright: "#C8C1FF",
  accentSoft: "#DAD5FF",

  // Money
  earn: "#8FE3B4", // money in  ↑
  earnBright: "#A9EFC8",
  spend: "#C8C1FF", // money out ↓ (lavender per the desktop reference)

  // Translucent fills
  glass: "rgba(255,255,255,0.03)",
  glassSoft: "rgba(255,255,255,0.028)",
  glass2: "rgba(255,255,255,0.05)",

  // Semantic
  danger: "#FFB3AC",
  dangerBg: "rgba(255,120,110,0.12)",
  dangerBorder: "rgba(255,140,130,0.32)",
} as const;

/** Gradient tuples for expo-linear-gradient (start → end). */
export const grad = {
  primary: ["#CFC9FF", "#9990E8"] as const, // primary button
  earnBar: ["#8FE3B4", "#4E9C77"] as const,
  spendBar: ["#8F87F1", "#4B4681"] as const,
  progress: ["#8F87F1", "#DAD5FF"] as const,
  card: ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.016)"] as const,
  hero: ["rgba(255,255,255,0.062)", "rgba(255,255,255,0.03)"] as const,
  heroLav: ["rgba(169,160,255,0.12)", "rgba(255,255,255,0.02)"] as const,
  orb: ["#5F587E", "#DDD8F2", "#26243A"] as const, // faux-conic orb glow
  logoMark: ["#E7E3FF", "#8F87C9", "#3A3752"] as const,
  agentCard: ["#EFECFF", "#B0A9E6", "#4A4568"] as const,
  avatarSell: ["#E7E3FF", "#8F87C9"] as const,
  avatarHire: ["#33304A", "#16161F"] as const,
} as const;

export const radius = { sm: 11, md: 14, lg: 19, xl: 26, pill: 999 } as const;
export const space = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 } as const;

/**
 * Font families. Loaded in app/_layout.tsx via @expo-google-fonts; the app gates
 * render on load so these names are always available by the time UI paints.
 */
export const font = {
  regular: "SpaceGrotesk_400Regular",
  medium: "SpaceGrotesk_500Medium",
  semibold: "SpaceGrotesk_600SemiBold",
  bold: "SpaceGrotesk_700Bold",
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
  monoSemibold: "JetBrainsMono_600SemiBold",
} as const;

/** Back-compat alias — all money + tx ids are mono. */
export const mono = font.mono;
export const tabular = { fontVariant: ["tabular-nums" as const] };

/** $1,234.56 with grouping — the display format across the app. */
export const usd = (n: number) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Signed money string, e.g. "+$0.35" / "−$0.40" (mono minus U+2212). */
export const signed = (n: number, dir: "in" | "out") =>
  `${dir === "in" ? "+" : "−"}${usd(Math.abs(n))}`;

/** Color for a money direction. */
export const moneyColor = (dir: "in" | "out") => (dir === "in" ? c.earnBright : c.spend);
