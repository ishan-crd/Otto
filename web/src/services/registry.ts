import { usdcToMicro } from "../config";
import { flightPrices, hotelSearch, legalSummary, summarize, weather, webSearch } from "./handlers";

export interface ServiceDef {
  id: string;
  path: string;
  priceMicroUsdc: number;
  description: string;
  handler: (input: Record<string, unknown>) => unknown;
}

/**
 * The marketplace of paid capabilities. Each becomes an x402-gated POST
 * endpoint at `path`. Otto's concierge BUYS from these; external agents can
 * buy too. Prices are deliberately tiny — this is a pay-per-sip economy.
 */
export const SERVICES: ServiceDef[] = [
  {
    id: "flights",
    path: "/services/flights",
    priceMicroUsdc: usdcToMicro(0.01),
    description: "Live flight fares between two cities",
    handler: (i) => flightPrices(i),
  },
  {
    id: "hotels",
    path: "/services/hotels",
    priceMicroUsdc: usdcToMicro(0.01),
    description: "Hotel availability and nightly prices for a city",
    handler: (i) => hotelSearch(i),
  },
  {
    id: "weather",
    path: "/services/weather",
    priceMicroUsdc: usdcToMicro(0.005),
    description: "Weekend weather forecast for a city",
    handler: (i) => weather(i),
  },
  {
    id: "search",
    path: "/services/search",
    priceMicroUsdc: usdcToMicro(0.02),
    description: "Web search over a query",
    handler: (i) => webSearch(i),
  },
  {
    id: "summarize",
    path: "/services/summarize",
    priceMicroUsdc: usdcToMicro(0.015),
    description: "Summarize text / search results into an executive brief",
    handler: (i) => summarize(i),
  },
  {
    id: "legal",
    path: "/services/legal-summary",
    priceMicroUsdc: usdcToMicro(0.03),
    description: "Otto's own skill: flag risky clauses in a contract",
    handler: (i) => legalSummary(i),
  },
];

export const serviceById = (id: string) => SERVICES.find((s) => s.id === id);

export interface AgentMeta {
  /** Card title on the marketplace. */
  title: string;
  /** The agent selling this skill. */
  agent: string;
  initials: string;
  meta: string;
  rating: string;
  unit: string;
  /** true = Otto sells this skill; false = Otto hires it. */
  sell: boolean;
}

/**
 * Marketplace personas for each service — who sells the skill, at what unit,
 * with what track record. The freelance-marketplace layer over the registry:
 * "hiring" any of these is a real x402 purchase against its endpoint.
 */
export const MARKETPLACE_AGENTS: Record<string, AgentMeta> = {
  flights: {
    title: "Multi-city fare search",
    agent: "Skyscout",
    initials: "SK",
    meta: "18k tasks · 98.4%",
    rating: "4.91",
    unit: "per search",
    sell: false,
  },
  hotels: {
    title: "Hotel shortlist",
    agent: "Nomad Concierge",
    initials: "NC",
    meta: "2.4k tasks · 99.1%",
    rating: "4.96",
    unit: "per shortlist",
    sell: false,
  },
  weather: {
    title: "Weather intelligence",
    agent: "Stratus",
    initials: "ST",
    meta: "9.1k tasks · 99.5%",
    rating: "4.89",
    unit: "per forecast",
    sell: false,
  },
  search: {
    title: "Deep web search",
    agent: "Border Oracle",
    initials: "BO",
    meta: "910 tasks · 99.6%",
    rating: "4.88",
    unit: "per query",
    sell: false,
  },
  summarize: {
    title: "Executive briefing",
    agent: "Otto",
    initials: "OT",
    meta: "1.2k sold this month",
    rating: "4.99",
    unit: "per brief",
    sell: true,
  },
  legal: {
    title: "Contract clause review",
    agent: "Otto",
    initials: "OT",
    meta: "410 sold this month",
    rating: "4.94",
    unit: "per contract",
    sell: true,
  },
};
