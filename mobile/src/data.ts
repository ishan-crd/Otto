/**
 * Hardcoded content for the Otto mobile app, transcribed 1:1 from the canonical
 * design (claude.ai/design → "Otto Mobile.dc.html"). The home wallet balance and
 * money-moving feed opportunistically upgrade to live backend data (see
 * app/(tabs)/index.tsx); everything else is fixture data to match the design.
 */

export type Dir = "in" | "out";

export interface Row {
  label: string;
  amount: string; // pre-formatted, e.g. "−$0.40"
  dir: Dir;
  tx: string;
  time: string;
}

export interface Gig {
  title: string;
  agent: string;
  meta: string;
  initials: string;
  price: string;
  unit: string;
  tag: string;
  rating: string;
  cta: string;
  sell: boolean;
}

export interface Step {
  title: string;
  detail: string;
  status: "DONE" | "PAID" | "RUNNING" | "HOLD" | "QUEUED";
  cost: string;
  state: "done" | "active" | "wait";
}

export interface Rule {
  title: string;
  detail: string;
}

export const HERO = {
  balance: "$4,182.90",
  earned: "$1,284.60",
  spent: "$742.18",
} as const;

/** Home "money moving" feed — rotates by tick; also the live-feed fallback. */
export const FEED: Row[] = [
  {
    label: "Skyscout · fare search",
    amount: "−$0.40",
    dir: "out",
    tx: "0x7f21…a4c9",
    time: "12s ago",
  },
  {
    label: "Acme Corp · itinerary opt.",
    amount: "+$0.35",
    dir: "in",
    tx: "0x3bd8…10f2",
    time: "48s ago",
  },
  {
    label: "VeriFly · fare check",
    amount: "−$0.12",
    dir: "out",
    tx: "0xc042…9e77",
    time: "1m ago",
  },
  {
    label: "Halcyon · expense recon.",
    amount: "+$0.06",
    dir: "in",
    tx: "0x91aa…22b1",
    time: "2m ago",
  },
  {
    label: "Nomad · hotel shortlist",
    amount: "−$0.55",
    dir: "out",
    tx: "0x5e63…7ab0",
    time: "3m ago",
  },
  {
    label: "Bluefin AI · negotiation",
    amount: "+$1.20",
    dir: "in",
    tx: "0x2c90…ef54",
    time: "6m ago",
  },
];

export const HIRES: Gig[] = [
  {
    title: "Hotel shortlist · Lisbon",
    agent: "Nomad Concierge",
    meta: "2.4k tasks",
    initials: "NC",
    price: "$0.55",
    unit: "per shortlist",
    tag: "RUNNING",
    rating: "4.96",
    cta: "Watch",
    sell: false,
  },
  {
    title: "Multi-city fare search",
    agent: "Skyscout",
    meta: "18k tasks",
    initials: "SK",
    price: "$0.40",
    unit: "per search",
    tag: "HIRED",
    rating: "4.91",
    cta: "Rehire",
    sell: false,
  },
  {
    title: "Visa & entry rules",
    agent: "Border Oracle",
    meta: "910 tasks",
    initials: "BO",
    price: "$0.18",
    unit: "per country",
    tag: "OPEN",
    rating: "4.88",
    cta: "Hire",
    sell: false,
  },
  {
    title: "Restaurant booking",
    agent: "Maître",
    meta: "5.1k tasks",
    initials: "MT",
    price: "$0.22",
    unit: "per booking",
    tag: "OPEN",
    rating: "4.79",
    cta: "Hire",
    sell: false,
  },
  {
    title: "Receipt OCR & VAT",
    agent: "Ledgerly",
    meta: "31k tasks",
    initials: "LG",
    price: "$0.04",
    unit: "per doc",
    tag: "OPEN",
    rating: "4.97",
    cta: "Hire",
    sell: false,
  },
];

export const SELLS: Gig[] = [
  {
    title: "Itinerary optimisation",
    agent: "Otto",
    meta: "1.2k sold / mo",
    initials: "OT",
    price: "$0.35",
    unit: "per itinerary",
    tag: "TOP 3%",
    rating: "4.99",
    cta: "Edit",
    sell: true,
  },
  {
    title: "Expense reconciliation",
    agent: "Otto",
    meta: "6.4k sold / mo",
    initials: "OT",
    price: "$0.06",
    unit: "per receipt",
    tag: "LISTED",
    rating: "4.94",
    cta: "Edit",
    sell: true,
  },
  {
    title: "Vendor negotiation",
    agent: "Otto",
    meta: "84 sold / mo",
    initials: "OT",
    price: "$1.20",
    unit: "per deal",
    tag: "LISTED",
    rating: "4.87",
    cta: "Edit",
    sell: true,
  },
  {
    title: "Calendar defrag",
    agent: "Otto",
    meta: "2.9k sold / mo",
    initials: "OT",
    price: "$0.09",
    unit: "per week",
    tag: "LISTED",
    rating: "4.90",
    cta: "Edit",
    sell: true,
  },
  {
    title: "Subscription audit",
    agent: "Otto",
    meta: "410 sold / mo",
    initials: "OT",
    price: "$0.75",
    unit: "per audit",
    tag: "NEW",
    rating: "4.81",
    cta: "Edit",
    sell: true,
  },
];

export const CHIPS = ["All", "Available", "Engaged", "Under $0.25"] as const;
export type Chip = (typeof CHIPS)[number];

/** Filter a gig against a marketplace chip. */
export function chipMatch(chip: Chip, g: Gig): boolean {
  if (chip === "All") return true;
  if (chip === "Available") return ["OPEN", "LISTED", "NEW"].includes(g.tag);
  if (chip === "Engaged") return ["RUNNING", "HIRED", "TOP 3%"].includes(g.tag);
  return parseFloat(g.price.replace("$", "")) < 0.25;
}

/** The Lisbon trip pipeline shown on Active task + the home "running" card. */
export const STEPS: Step[] = [
  {
    title: "Parse request & budget",
    detail: "Otto · nonstop, ≤$900",
    status: "DONE",
    cost: "—",
    state: "done",
  },
  {
    title: "Fare search",
    detail: "Skyscout · 34 fares, 3 in policy",
    status: "PAID",
    cost: "−$0.40",
    state: "done",
  },
  {
    title: "Fare & bag verification",
    detail: "VeriFly · TAP 1046 confirmed",
    status: "PAID",
    cost: "−$0.12",
    state: "done",
  },
  {
    title: "Hotel shortlist",
    detail: "Nomad Concierge · scoring 18…",
    status: "RUNNING",
    cost: "−$0.55",
    state: "active",
  },
  {
    title: "Charge card & confirm",
    detail: "Awaiting your approval",
    status: "HOLD",
    cost: "—",
    state: "wait",
  },
  {
    title: "Itinerary & calendar",
    detail: "Chronos · 6 events queued",
    status: "QUEUED",
    cost: "−$0.09",
    state: "wait",
  },
];

/** Receipts list on the Wallet screen. */
export const RECEIPTS: Row[] = [
  {
    label: "Skyscout · fare search",
    amount: "−$0.40",
    dir: "out",
    tx: "0x7f21…a4c9",
    time: "09:41",
  },
  {
    label: "Acme Corp · itinerary opt.",
    amount: "+$0.35",
    dir: "in",
    tx: "0x3bd8…10f2",
    time: "09:39",
  },
  { label: "VeriFly · fare check", amount: "−$0.12", dir: "out", tx: "0xc042…9e77", time: "09:41" },
  { label: "Nomad · escrow hold", amount: "−$0.55", dir: "out", tx: "0x5e63…7ab0", time: "09:43" },
  {
    label: "Refund · duplicate call",
    amount: "+$0.04",
    dir: "in",
    tx: "0x1f77…c2e0",
    time: "09:43",
  },
];

/** 8-week earnings vs spend bars (earned/spend px) for the wallet chart. */
export interface ChartBar {
  wk: string;
  earn: number;
  spend: number;
}
export const CHART: ChartBar[] = [
  { wk: "W23", earn: 38, spend: 26 },
  { wk: "W24", earn: 48, spend: 20 },
  { wk: "W25", earn: 32, spend: 36 },
  { wk: "W26", earn: 58, spend: 16 },
  { wk: "W27", earn: 43, spend: 30 },
  { wk: "W28", earn: 68, spend: 22 },
  { wk: "W29", earn: 53, spend: 34 },
  { wk: "W30", earn: 78, spend: 18 },
];

/** Autonomy toggles on the Otto (profile) screen. Order matches DEFAULT_RULES. */
export const RULES: Rule[] = [
  { title: "Hire agents autonomously", detail: "Rated 4.7★ and above, ≤ $2.00 / task" },
  { title: "Pay without approval", detail: "Micropayments under $1.00 settle instantly" },
  { title: "Charge card for bookings", detail: "Always ask before a real-money purchase" },
  { title: "Sell Otto's skills", detail: "Accept inbound gigs from other agents" },
];
export const DEFAULT_RULES = [true, true, false, true];

export const FUND_AMOUNTS = [100, 500, 1000, 2500] as const;

export interface WalletRail {
  key: string;
  name: string;
  note: string;
  glyph: string;
}
export const WALLETS: WalletRail[] = [
  { key: "base", name: "Base wallet", note: "USDC · 0x4c…9f2", glyph: "◈" },
  { key: "coinbase", name: "Coinbase", note: "Exchange account", glyph: "◉" },
  { key: "ledger", name: "Ledger hardware", note: "Cold storage · read-only", glyph: "⛁" },
];

export interface AgentDetail {
  about: string;
  skills: string[];
  speed: string;
  success: string;
}

const DETAILS: Record<string, AgentDetail> = {
  "Hotel shortlist · Lisbon": {
    about:
      "Scores every bookable property against your stated constraints — walkability, noise, cancellation terms, breakfast — and returns a ranked shortlist of five with reasons attached. Otto pays only for shortlists that pass its own verification pass.",
    skills: [
      "Neighbourhood scoring",
      "Rate parity check",
      "Cancellation terms",
      "Noise & walkability",
    ],
    speed: "38s",
    success: "99.1%",
  },
  "Multi-city fare search": {
    about:
      "Sweeps 640 carriers and consolidator inventories in parallel, then filters to fares that survive your travel policy. Returns fare families with baggage, seat and change fees resolved so nothing surprises you at checkout.",
    skills: ["640 carriers", "Policy filtering", "Fare families", "Hidden fee resolve"],
    speed: "11s",
    success: "98.4%",
  },
  "Visa & entry rules": {
    about:
      "Checks passport, residency and transit rules for every leg of an itinerary against current government sources, and flags anything that would stop you at the gate.",
    skills: ["Transit rules", "Passport validity", "Vaccination", "eTA filing"],
    speed: "9s",
    success: "99.6%",
  },
  "Restaurant booking": {
    about:
      "Holds and confirms tables across reservation networks, retrying cancellations for hard-to-get rooms and honouring your dietary notes in the booking record.",
    skills: ["Cancellation sniping", "Dietary notes", "Group tables"],
    speed: "2m 10s",
    success: "97.2%",
  },
  "Receipt OCR & VAT": {
    about:
      "Turns any receipt image or PDF into structured line items with VAT split out per jurisdiction, ready to post straight into your accounting ledger.",
    skills: ["42 languages", "VAT split", "Line items", "Duplicate detection"],
    speed: "1.4s",
    success: "99.8%",
  },
  "Itinerary optimisation": {
    about:
      "Otto rebuilds a draft itinerary around real travel times, opening hours and your energy pattern — fewer crosstown hops, no dead afternoons, buffers where things usually slip.",
    skills: ["Travel-time aware", "Opening hours", "Buffer insertion"],
    speed: "22s",
    success: "99.4%",
  },
  "Expense reconciliation": {
    about:
      "Otto matches receipts to card lines, splits shared charges and flags anything that breaks policy — sold per receipt to finance teams and other agents.",
    skills: ["Card matching", "Policy flags", "Multi-currency"],
    speed: "0.8s",
    success: "99.7%",
  },
  "Vendor negotiation": {
    about:
      "Otto negotiates rates with supplier agents on your behalf, working from your walk-away price and past settlements. Paid only on a closed deal.",
    skills: ["Rate benchmarks", "Counter-offers", "Contract summary"],
    speed: "6m",
    success: "94.0%",
  },
  "Calendar defrag": {
    about:
      "Otto compacts a fragmented week into deep-work blocks, moving only the meetings whose owners have granted reschedule rights.",
    skills: ["Deep-work blocks", "Consent-aware moves", "Timezone safe"],
    speed: "4s",
    success: "98.1%",
  },
  "Subscription audit": {
    about:
      "Otto finds duplicate, dormant and overpriced subscriptions across your statements, and prepares the cancellations for one-tap approval.",
    skills: ["Dormancy detection", "Price-rise alerts", "Cancel drafts"],
    speed: "48s",
    success: "96.6%",
  },
};

const FALLBACK: AgentDetail = {
  about:
    "This agent sells a single well-scoped skill and is paid per completed task, settled in USDC the moment delivery is verified.",
  skills: ["Per-task pricing", "Escrowed", "Verified delivery"],
  speed: "20s",
  success: "98.0%",
};

export function agentDetail(title: string): AgentDetail {
  return DETAILS[title] ?? FALLBACK;
}

export function findGig(title: string): Gig | undefined {
  return [...HIRES, ...SELLS].find((g) => g.title === title);
}
