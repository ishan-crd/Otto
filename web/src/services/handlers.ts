/**
 * The actual "work" behind each paid endpoint. These are deterministic mock
 * intelligences — good enough to make the demo concrete and reliable. Swap any
 * one for a real LLM/API call during the hackathon without touching the payment
 * plumbing (that's the point of keeping them isolated here).
 */

export function flightPrices(input: { from?: string; to?: string; date?: string }) {
  const to = input.to ?? "Goa";
  const from = input.from ?? "Delhi";
  const fares = [
    { airline: "IndiGo", price: 4200, depart: "06:15", arrive: "08:40" },
    { airline: "Akasa Air", price: 3890, depart: "12:05", arrive: "14:35" },
    { airline: "Air India Express", price: 5100, depart: "19:20", arrive: "21:55" },
  ];
  const cheapest = fares.reduce((a, b) => (b.price < a.price ? b : a));
  return { from, to, date: input.date ?? "this weekend", fares, cheapest };
}

export function hotelSearch(input: { city?: string; maxPrice?: number }) {
  const city = input.city ?? "Goa";
  const hotels = [
    { name: "Beachside Residency", perNight: 2400, rating: 4.3, area: "Calangute" },
    { name: "Palm Grove Stay", perNight: 1850, rating: 4.1, area: "Baga" },
    { name: "Sunset Villa", perNight: 3200, rating: 4.6, area: "Anjuna" },
  ];
  const pick = hotels.reduce((a, b) => (b.perNight < a.perNight ? b : a));
  return { city, hotels, cheapest: pick };
}

export function weather(input: { city?: string }) {
  return {
    city: input.city ?? "Goa",
    forecast: "Mostly sunny, 29–32°C, low chance of rain",
    good: true,
  };
}

export function webSearch(input: { query?: string }) {
  const q = input.query ?? "topic";
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
    riskyClauses: [
      "Auto-renewal with 90-day notice window",
      "Unlimited liability on data breach",
    ],
    missingProtections: ["No cap on indemnity", "No force majeure clause"],
    verdict: "Medium risk — negotiate clauses 4 and 11 before signing.",
    length: (input.document ?? "").length,
  };
}
