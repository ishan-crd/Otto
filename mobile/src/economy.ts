/**
 * Agent-economy brain (pure, no React) — the mobile twin of the web dashboard's
 * decomposition + budget-aware hiring. Given a goal it composes specialist roles
 * from a capability library, then greedily hires the best-rated agent that still
 * fits the remaining budget, role by role. If a role can't be afforded, the run
 * is marked blocked from there — the spend firewall, visualised.
 */

export interface Role {
  key: string;
  title: string;
  detail: string;
}
export interface Candidate {
  name: string;
  rating: number;
  price: number;
  over: boolean;
}
export interface SubTask {
  key: string;
  title: string;
  detail: string;
  cands: Candidate[];
  pickIdx: number;
  price: number;
  tx: string;
  review: string;
  blocked: boolean;
  trigger: boolean;
}
export interface EconomyPlan {
  subs: SubTask[];
  budget: number;
  blocked: string | null;
}

const POOL: Record<string, string[]> = {
  design: ["Pixel Guild", "Aurora UX", "Nomad Design", "Glassmith", "Formcraft"],
  frontend: ["Stratus FE", "ReactWorks", "Glasslate", "Motionsmith", "Viewport"],
  backend: ["Corepath", "Nimbus API", "Forge Systems", "Bedrock", "Payload"],
  qa: ["Sentinel QA", "Testlab", "Assurely", "Regressor", "Greenlight"],
  research: ["Insight Atlas", "DeepScan", "Corpus AI", "Scholarly", "Factbase"],
  copy: ["Wordsmith", "Prose Foundry", "Sharp Copy", "Inkwell", "Hookline"],
  ads: ["Growthly", "Adcraft", "Funnelworks", "Reachly", "Bidsmith"],
  analyst: ["Quant Lens", "Signal Labs", "Datawright", "Cohort"],
  writer: ["Draftsmith", "Longform AI", "Narrative Co", "Bylined"],
  editor: ["Redline", "Polish AI", "Final Cut", "Proofly"],
  flights: ["Skyscout", "FareHawk", "JetIndex"],
  hotels: ["Nomad Concierge", "StayScore", "Roomly"],
  visa: ["Border Oracle", "EntryCheck", "Passport AI"],
  itin: ["Wayfinder", "DayPlanner", "Routely"],
  venue: ["VenueScout", "HallHunt", "SpaceFinder"],
  catering: ["Tastebud AI", "Plateworks", "Forkful"],
  coord: ["Clockwork", "Cue", "Runsheet"],
  plan: ["Planwright", "Blueprint AI", "Scoper"],
  exec: ["Executor", "Doer AI", "Handiwork", "Shipit"],
  review: ["Referee", "QualityGate", "Second Look"],
  strategy: ["Northstar Strategy", "Vector Growth", "Playbook AI"],
  content: ["Storyforge", "Evergreen", "Narrative Labs"],
  video: ["Reelcraft AI", "Avatarworks", "UGC Studio", "Synthesis Media"],
  social: ["Cadence Social", "Postpilot", "Hivemind"],
  schedule: ["Autopost AI", "Cadence Engine", "Recurly Ops"],
  seo: ["Rankwell", "Serpsmith", "Organic AI"],
  email: ["Inboxly", "Dripworks", "Sendcraft"],
  brand: ["Identity Co", "Marque", "Toneworks"],
  sales: ["Pipeline AI", "Leadhunter", "Closer"],
  support: ["Helpdesk AI", "Careline", "Resolve"],
  legal: ["Clausewise", "Lexguard", "Terms AI"],
  finance: ["Ledgerwise", "Pricepoint", "Fiscal AI"],
  localize: ["Polyglot", "Localize AI", "Lingua"],
  data: ["Quant Lens", "Signal Labs", "Datawright"],
  mobile: ["Expo Guild", "Nativeworks", "Appforge"],
  devops: ["Shipyard", "Helm Ops", "Pipeline Co"],
  photo: ["Shotworks", "Lens AI", "Framecraft"],
  design_ux: ["Aurora UX", "Flowcraft", "Pixelwright"],
};
const BAND: Record<string, [number, number]> = {
  design: [0.55, 1.2],
  frontend: [0.8, 1.6],
  backend: [0.9, 1.75],
  qa: [0.3, 0.7],
  research: [0.4, 0.95],
  copy: [0.35, 0.85],
  ads: [0.5, 1.1],
  analyst: [0.55, 1.15],
  writer: [0.45, 1.0],
  editor: [0.3, 0.65],
  flights: [0.25, 0.6],
  hotels: [0.35, 0.8],
  visa: [0.15, 0.4],
  itin: [0.3, 0.7],
  venue: [0.4, 0.95],
  catering: [0.45, 1.05],
  coord: [0.35, 0.75],
  plan: [0.3, 0.7],
  exec: [0.6, 1.3],
  review: [0.25, 0.6],
  strategy: [0.6, 1.3],
  content: [0.45, 1.0],
  video: [0.8, 1.7],
  social: [0.4, 0.9],
  schedule: [0.3, 0.7],
  seo: [0.5, 1.1],
  email: [0.4, 0.9],
  brand: [0.55, 1.2],
  sales: [0.5, 1.1],
  support: [0.3, 0.7],
  legal: [0.7, 1.5],
  finance: [0.6, 1.3],
  localize: [0.35, 0.8],
  data: [0.55, 1.15],
  mobile: [0.85, 1.7],
  devops: [0.6, 1.3],
  photo: [0.4, 0.9],
  design_ux: [0.55, 1.2],
};
export const REVIEWS = [
  "Clean, on-brief and well documented.",
  "Fast turnaround — matched every constraint.",
  "Exceeded spec, great edge-case handling.",
  "Solid, production-ready work.",
  "Polished and ready to ship.",
  "Thorough and clearly explained.",
];

interface Cap extends Role {
  bucket: string;
  pri: number;
  gate?: "dev";
  kw: string[];
}
const DEV_VERBS = [
  "develop",
  "build",
  "coding",
  " code ",
  "engineer",
  "program",
  "implement",
  "mvp",
  "prototype",
  "ship a",
  "rebuild",
  "refactor",
  "integrate ",
];
const CAPS: Cap[] = [
  {
    key: "strategy",
    bucket: "marketing",
    pri: 1,
    title: "Campaign Strategist",
    detail: "Positioning, channels and a launch plan",
    kw: [
      "campaign",
      "launch",
      "go-to-market",
      "gtm",
      "strategy",
      "positioning",
      "marketing plan",
      "promote",
      "awareness",
    ],
  },
  {
    key: "research",
    bucket: "marketing",
    pri: 1,
    title: "Market Researcher",
    detail: "Audience, competitors and real demand",
    kw: ["research", "audience", "market", "competitor", "persona", "survey", "trend"],
  },
  {
    key: "brand",
    bucket: "marketing",
    pri: 2,
    title: "Brand Strategist",
    detail: "Identity, naming and tone of voice",
    kw: ["brand", "identity", "rebrand", "naming", "tone of voice"],
  },
  {
    key: "content",
    bucket: "marketing",
    pri: 3,
    title: "Content Strategist",
    detail: "Organic, natural content and a calendar",
    kw: ["content", "organic", "natural", "editorial", "storytell", "calendar"],
  },
  {
    key: "copy",
    bucket: "marketing",
    pri: 4,
    title: "Copywriter",
    detail: "Captions, hooks and post copy",
    kw: ["copy", "copywrit", "caption", "headline", "messaging", "script"],
  },
  {
    key: "video",
    bucket: "marketing",
    pri: 4,
    title: "AI Video Creator",
    detail: "AI human / UGC creator videos and reels",
    kw: [
      "video",
      "reel",
      "tiktok",
      "youtube",
      "short",
      "ugc",
      "ai human",
      "ai creator",
      "avatar",
      "talking head",
      "faceless",
      "creator",
    ],
  },
  {
    key: "design",
    bucket: "marketing",
    pri: 5,
    title: "Creative Designer",
    detail: "Ad creative, thumbnails and brand visuals",
    kw: ["creative", "graphic", "visual", "thumbnail", "banner", "illustrat", "poster"],
  },
  {
    key: "photo",
    bucket: "marketing",
    pri: 5,
    title: "Photo & Asset Agent",
    detail: "Product shots and image assets",
    kw: ["photo", "product shot", "imagery"],
  },
  {
    key: "seo",
    bucket: "marketing",
    pri: 6,
    title: "SEO Specialist",
    detail: "Rank for the terms buyers search",
    kw: ["seo", "rank", "keyword", "search engine"],
  },
  {
    key: "email",
    bucket: "marketing",
    pri: 6,
    title: "Email Marketer",
    detail: "Newsletters and lifecycle sequences",
    kw: ["email", "newsletter", "sequence", "lifecycle"],
  },
  {
    key: "schedule",
    bucket: "marketing",
    pri: 7,
    title: "Scheduling & Automation Agent",
    detail: "Recurring posting on a set cadence",
    kw: [
      "recur",
      "schedul",
      "automat",
      "regularly",
      "daily",
      "weekly",
      "cadence",
      "drip",
      "cron",
      "repeatedly",
      "ongoing",
      "auto-post",
      "autopost",
      "post consistently",
    ],
  },
  {
    key: "social",
    bucket: "marketing",
    pri: 7,
    title: "Social Media Manager",
    detail: "Publishing and community across platforms",
    kw: [
      "social",
      "instagram",
      "tiktok",
      "linkedin",
      "facebook",
      "threads",
      "posting",
      "posts",
      "post ",
    ],
  },
  {
    key: "ads",
    bucket: "marketing",
    pri: 8,
    title: "Ads Specialist",
    detail: "Paid acquisition, targeting and optimisation",
    kw: ["ads", "advertis", "paid ", "ppc", "retarget"],
  },
  {
    key: "design_ux",
    bucket: "dev",
    pri: 3,
    gate: "dev",
    title: "UI/UX Designer",
    detail: "Flows, wireframes and a design system",
    kw: ["ui", "ux", "wireframe", "prototype", "design system", "interface"],
  },
  {
    key: "frontend",
    bucket: "dev",
    pri: 4,
    gate: "dev",
    title: "Frontend Engineer",
    detail: "Screens, state and interactions",
    kw: ["frontend", "front-end", "react", "vue", "web app", "website", "client-side"],
  },
  {
    key: "backend",
    bucket: "dev",
    pri: 4,
    gate: "dev",
    title: "Backend Engineer",
    detail: "APIs, data model, auth and payments",
    kw: ["backend", "back-end", "api", "server", "database", "auth", "payment"],
  },
  {
    key: "mobile",
    bucket: "dev",
    pri: 4,
    gate: "dev",
    title: "Mobile Engineer",
    detail: "Native iOS / Android build",
    kw: ["ios", "android", "expo", "react native", "mobile"],
  },
  {
    key: "qa",
    bucket: "dev",
    pri: 8,
    gate: "dev",
    title: "QA & Test Agent",
    detail: "Tests, regressions and a verified build",
    kw: ["qa", "testing", " test ", "bug", "quality assurance"],
  },
  {
    key: "devops",
    bucket: "dev",
    pri: 9,
    gate: "dev",
    title: "DevOps Agent",
    detail: "CI/CD, hosting and deploys",
    kw: ["deploy", "devops", "ci/cd", "infra", "hosting", "pipeline"],
  },
  {
    key: "data",
    bucket: "data",
    pri: 8,
    title: "Data Analyst",
    detail: "Metrics, dashboards and KPIs",
    kw: ["data", "analytics", "metric", "kpi", "track performance", "measure"],
  },
  {
    key: "analyst",
    bucket: "data",
    pri: 6,
    title: "Analyst",
    detail: "Synthesis and insight",
    kw: ["insight", "synthesis", "analyse", "analyze", "analysis"],
  },
  {
    key: "writer",
    bucket: "writing",
    pri: 4,
    title: "Writer",
    detail: "Draft the long-form",
    kw: ["report", "article", "essay", "whitepaper", "blog", "documentation", "write-up"],
  },
  {
    key: "editor",
    bucket: "writing",
    pri: 8,
    title: "Editor",
    detail: "Fact-check, polish and format",
    kw: ["edit", "proofread", "polish", "fact-check"],
  },
  {
    key: "flights",
    bucket: "travel",
    pri: 3,
    title: "Flight Agent",
    detail: "Cheapest policy-safe fares",
    kw: ["flight", "fare", "airline"],
  },
  {
    key: "hotels",
    bucket: "travel",
    pri: 4,
    title: "Hotel Agent",
    detail: "Shortlist by area and price",
    kw: ["hotel", "stay", "accommodation"],
  },
  {
    key: "visa",
    bucket: "travel",
    pri: 5,
    title: "Visa & Entry Agent",
    detail: "Entry rules and documents",
    kw: ["visa", "entry rule", "passport"],
  },
  {
    key: "itin",
    bucket: "travel",
    pri: 6,
    title: "Itinerary Planner",
    detail: "A day-by-day plan",
    kw: ["itinerary", "trip", "travel", "vacation", "holiday"],
  },
  {
    key: "venue",
    bucket: "events",
    pri: 3,
    title: "Venue Scout",
    detail: "Find and price venues",
    kw: ["venue", "hall", " location"],
  },
  {
    key: "catering",
    bucket: "events",
    pri: 4,
    title: "Catering Agent",
    detail: "Menus and quotes",
    kw: ["catering", "food", "menu"],
  },
  {
    key: "coord",
    bucket: "events",
    pri: 7,
    title: "Event Coordinator",
    detail: "Timeline and logistics",
    kw: ["event", "wedding", "conference", "coordinate", "logistics", "party"],
  },
  {
    key: "sales",
    bucket: "commerce",
    pri: 6,
    title: "Sales Agent",
    detail: "Leads, outreach and pipeline",
    kw: ["sales", "lead", "outreach", "crm", "prospect"],
  },
  {
    key: "support",
    bucket: "commerce",
    pri: 8,
    title: "Support Agent",
    detail: "Answer customers and resolve tickets",
    kw: ["support", "customer service", "helpdesk", "ticket"],
  },
  {
    key: "legal",
    bucket: "commerce",
    pri: 7,
    title: "Legal Agent",
    detail: "Contracts, terms and compliance",
    kw: ["legal", "contract", "compliance", "terms", "privacy policy"],
  },
  {
    key: "finance",
    bucket: "commerce",
    pri: 7,
    title: "Finance Agent",
    detail: "Pricing, budget and invoicing",
    kw: ["finance", "pricing", "invoice", "accounting", "budget model"],
  },
  {
    key: "localize",
    bucket: "commerce",
    pri: 6,
    title: "Localization Agent",
    detail: "Translate and localise",
    kw: ["translat", "localis", "localize", "multi-language", "i18n"],
  },
  {
    key: "plan",
    bucket: "generic",
    pri: 2,
    title: "Planning Agent",
    detail: "Break the goal into a concrete plan",
    kw: ["__none__"],
  },
  {
    key: "exec",
    bucket: "generic",
    pri: 5,
    title: "Execution Agent",
    detail: "Do the core work",
    kw: ["__none__"],
  },
  {
    key: "review",
    bucket: "generic",
    pri: 9,
    title: "Review Agent",
    detail: "Verify quality and hand off",
    kw: ["review", "verify", "sign off", "approve", "qa the"],
  },
];
const BUCKET_DEFAULT: Record<string, string[]> = {
  marketing: ["strategy", "research", "content", "copy", "social"],
  dev: ["design_ux", "frontend", "backend", "qa"],
  data: ["research", "data", "analyst"],
  writing: ["research", "writer", "editor"],
  travel: ["flights", "hotels", "visa", "itin"],
  events: ["venue", "catering", "design", "coord"],
  commerce: ["research", "sales", "copy"],
  generic: ["research", "plan", "exec", "review"],
};

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j] as T, b[i] as T];
  }
  return b;
}
export function initials(n: string): string {
  const p = n.split(" ");
  return (p[0].charAt(0) + (p[1] ? p[1].charAt(0) : p[0].charAt(1) || "")).toUpperCase();
}
export function tx(): string {
  const h = "0123456789abcdef";
  let a = "";
  let b = "";
  for (let i = 0; i < 4; i++) {
    a += h[Math.floor(Math.random() * 16)];
    b += h[Math.floor(Math.random() * 16)];
  }
  return `0x${a}…${b}`;
}
export function stars(r: number): string {
  const full = Math.round(r);
  let s = "";
  for (let i = 0; i < 5; i++) s += i < full ? "★" : "☆";
  return s;
}

export function decompose(goal: string): Role[] {
  const g = ` ${goal} `.toLowerCase();
  const hit = (kw: string[]) => kw.some((k) => k !== "__none__" && g.indexOf(k) >= 0);
  const devIntent = DEV_VERBS.some((v) => g.indexOf(v) >= 0);
  const capByKey: Record<string, Cap> = {};
  for (const c of CAPS) capByKey[c.key] = c;
  const matched: Cap[] = [];
  const seen: Record<string, boolean> = {};
  const bucketScore: Record<string, number> = {};
  for (const cap of CAPS) {
    if (cap.gate === "dev" && !devIntent) continue;
    if (hit(cap.kw) && !seen[cap.key]) {
      seen[cap.key] = true;
      matched.push(cap);
      bucketScore[cap.bucket] = (bucketScore[cap.bucket] || 0) + 1;
    }
  }
  let bucket = "generic";
  let bs = -1;
  for (const b in bucketScore) {
    if (bucketScore[b] > bs) {
      bs = bucketScore[b];
      bucket = b;
    }
  }
  if (matched.length === 0) {
    if (devIntent) bucket = "dev";
    else if (hit(["trip", "travel", "flight", "hotel", "vacation", "holiday"])) bucket = "travel";
    else if (hit(["event", "wedding", "party", "conference"])) bucket = "events";
    else if (
      hit(["market", "campaign", "promot", "brand", "ads", "social", "content", "video", "post"])
    )
      bucket = "marketing";
    else if (hit(["report", "research", "write", "article", "essay", "analy"])) bucket = "writing";
    else bucket = "generic";
  }
  const plan = matched.slice();
  const def = BUCKET_DEFAULT[bucket] || BUCKET_DEFAULT.generic;
  for (let k = 0; k < def.length && plan.length < 4; k++) {
    if (!seen[def[k]] && capByKey[def[k]]) {
      seen[def[k]] = true;
      plan.push(capByKey[def[k]]);
    }
  }
  const gen = BUCKET_DEFAULT.generic;
  for (let m = 0; m < gen.length && plan.length < 3; m++) {
    if (!seen[gen[m]]) {
      seen[gen[m]] = true;
      plan.push(capByKey[gen[m]]);
    }
  }
  plan.sort((a, b) => a.pri - b.pri);
  return plan.slice(0, 6).map((x) => ({ key: x.key, title: x.title, detail: x.detail }));
}

export function candidatesFor(key: string): Candidate[] {
  const pool = POOL[key] || ["Otto Partner", "Agent Node", "Specialist Co"];
  const band = BAND[key] || [0.4, 1.0];
  const names = shuffle(pool).slice(0, 3);
  const cands: Candidate[] = names.map((name) => ({
    name,
    price: round2(band[0] + Math.random() * (band[1] - band[0])),
    rating: Math.round((4.62 + Math.random() * 0.37) * 100) / 100,
    over: false,
  }));
  if (Math.random() < 0.5) {
    const pn = shuffle(pool)[0];
    cands.push({
      name: `${pn} Pro`,
      price: round2(band[1] * (1.12 + Math.random() * 0.35)),
      rating: Math.round((4.9 + Math.random() * 0.09) * 100) / 100,
      over: false,
    });
  }
  return cands;
}

/** Build a budget-aware hiring plan for a goal. */
export function planEconomy(goal: string, budget: number): EconomyPlan {
  const roles = decompose(goal);
  const revs = shuffle(REVIEWS);
  const subs: SubTask[] = roles.map((r, i) => ({
    key: r.key,
    title: r.title,
    detail: r.detail,
    cands: candidatesFor(r.key),
    pickIdx: -1,
    price: 0,
    tx: tx(),
    review: revs[i % revs.length],
    blocked: false,
    trigger: false,
  }));

  let realBudget = budget > 0 ? round2(budget) : 0;
  if (!realBudget) {
    let sum = 0;
    for (const s of subs) sum += Math.min(...s.cands.map((c) => c.price));
    realBudget = Math.ceil((sum * 1.6) / 0.5) * 0.5;
  }

  let remaining = realBudget;
  let stopped = false;
  let blocked: string | null = null;
  for (const sub of subs) {
    if (stopped) {
      sub.blocked = true;
      for (const c of sub.cands) c.over = c.price > remaining;
      continue;
    }
    let best = -1;
    let br = -1;
    for (let i = 0; i < sub.cands.length; i++) {
      sub.cands[i].over = sub.cands[i].price > remaining;
      if (!sub.cands[i].over && sub.cands[i].rating > br) {
        br = sub.cands[i].rating;
        best = i;
      }
    }
    if (best < 0) {
      sub.blocked = true;
      sub.trigger = true;
      stopped = true;
      blocked = `Only $${remaining.toFixed(2)} left — no agent for "${sub.title}" fits the budget.`;
      continue;
    }
    sub.pickIdx = best;
    sub.price = sub.cands[best].price;
    remaining = round2(remaining - sub.price);
  }
  return { subs, budget: realBudget, blocked };
}
