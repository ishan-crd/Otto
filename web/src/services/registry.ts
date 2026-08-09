import { usdcToMicro } from "../config";
import {
  flightPrices,
  hotelSearch,
  legalSummary,
  summarize,
  weather,
  webSearch,
} from "./handlers";

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
