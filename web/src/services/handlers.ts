/**
 * The actual "work" behind each paid endpoint. Deterministic mock intelligences:
 * destination-aware and seeded by the input string, so "Belgium" and "Tokyo"
 * return different-but-stable, plausible data on every run — reliable on stage,
 * no LLM flakiness. Swap any one for a real LLM/API call without touching the
 * payment plumbing (that's the point of keeping them isolated here).
 */

/** Small stable string hash → [0, 1). Keeps outputs varied per input but deterministic. */
function seed01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}
const pick = <T>(arr: readonly T[], s: string, salt = 0) =>
  arr[Math.floor(seed01(s, salt) * arr.length) % arr.length] as T;
const vary = (base: number, spread: number, s: string, salt = 0) =>
  Math.round(base + (seed01(s, salt) - 0.5) * 2 * spread);

const AIRLINES = [
  "SkyLink",
  "Aerova",
  "TransGlobal",
  "BlueMeridian",
  "NorthWing",
  "Cirrus Air",
] as const;
const HOTEL_KINDS = ["Grand", "Central", "Riverside", "Old Town", "Garden", "Harbour"] as const;
const AREAS = [
  "city centre",
  "old town",
  "station district",
  "riverside",
  "museum quarter",
] as const;

export function flightPrices(input: { from?: string; to?: string; date?: string }) {
  const to = String(input.to ?? "Goa");
  const from = String(input.from ?? "New Delhi");
  const base = 90 + Math.floor(seed01(to, 7) * 320); // USD, destination-stable
  const fares = [0, 1, 2].map((i) => ({
    airline: pick(AIRLINES, to, i),
    priceUsd: vary(base, 40, to, 10 + i),
    depart: pick(["06:15", "09:40", "12:05", "15:30", "19:20"] as const, to, 20 + i),
    stops: i === 1 ? 0 : Math.floor(seed01(to, 30 + i) * 2),
  }));
  const cheapest = fares.reduce((a, b) => (b.priceUsd < a.priceUsd ? b : a));
  return { from, to, date: input.date ?? "next weekend", fares, cheapest };
}

export function hotelSearch(input: { city?: string; maxPrice?: number }) {
  const city = String(input.city ?? "Goa");
  const base = 55 + Math.floor(seed01(city, 3) * 140); // USD/night
  const hotels = [0, 1, 2].map((i) => ({
    name: `${pick(HOTEL_KINDS, city, i)} ${city} Hotel`,
    perNightUsd: vary(base, 30, city, 40 + i),
    rating: Math.round((3.9 + seed01(city, 50 + i) * 1.0) * 10) / 10,
    area: pick(AREAS, city, 60 + i),
  }));
  const cheapest = hotels.reduce((a, b) => (b.perNightUsd < a.perNightUsd ? b : a));
  return { city, hotels, cheapest };
}

export function weather(input: { city?: string }) {
  const city = String(input.city ?? "Goa");
  const temp = 8 + Math.floor(seed01(city, 5) * 22);
  const skies = pick(["mostly sunny", "partly cloudy", "clear", "light showers"] as const, city, 9);
  return {
    city,
    forecast: `${skies[0].toUpperCase()}${skies.slice(1)}, ${temp}–${temp + 4}°C`,
    good: skies !== "light showers",
  };
}

export function webSearch(input: { query?: string }) {
  const q = String(input.query ?? "topic");
  return {
    query: q,
    results: [
      { title: `Overview of ${q}`, snippet: `Key facts and current state of ${q}.` },
      { title: `${q}: latest developments`, snippet: `Recent notable changes in ${q}.` },
      { title: `${q} — analysis`, snippet: `Expert perspectives and outlook on ${q}.` },
    ],
  };
}

export function summarize(input: { text?: string; query?: string }) {
  const subject = input.query ?? "the provided material";
  return {
    summary: `Concise synthesis of ${subject}: the main points, the current consensus, and the notable open questions — distilled into an executive brief.`,
    bullets: [
      `Core finding on ${subject}`,
      "Supporting evidence and context",
      "Risks / open questions",
    ],
  };
}

export function legalSummary(input: { document?: string }) {
  // Otto's OWN sellable skill — other agents pay Otto for this.
  return {
    riskyClauses: ["Auto-renewal with 90-day notice window", "Unlimited liability on data breach"],
    missingProtections: ["No cap on indemnity", "No force majeure clause"],
    verdict: "Medium risk — negotiate clauses 4 and 11 before signing.",
    length: (input.document ?? "").length,
  };
}
