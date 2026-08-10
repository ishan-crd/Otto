import { SERVICES, type ServiceDef, serviceById } from "../services/registry";

export interface PlanStep {
  service: ServiceDef;
  input: Record<string, unknown>;
}

export interface Plan {
  steps: PlanStep[];
  /** e.g. "Belgium" for a trip goal, null otherwise. */
  destination: string | null;
  /** true when the goal asks for the cheapest option. */
  budgetConscious: boolean;
  kind: "trip" | "legal" | "research";
}

/**
 * Deterministic goal -> plan mapper. Reliable on stage (no LLM flakiness), and
 * trivially swappable for an LLM planner: have the model emit {serviceId, input}
 * pairs and feed them through serviceById().
 *
 * The plan is the set of paid services Otto will hire (and pay per task) to
 * satisfy the goal — the "Entry Management Framework" aggregator in action.
 */
export function planForGoal(goal: string): Plan {
  const g = goal.toLowerCase();
  const steps: PlanStep[] = [];
  const add = (id: string, input: Record<string, unknown>) => {
    const service = serviceById(id);
    if (service) steps.push({ service, input });
  };

  const isTrip = /trip|travel|holiday|vacation|flight|getaway|weekend|visit|book/.test(g);
  const isLegal = /contract|legal|clause|agreement|nda/.test(g);
  const budgetConscious = /cheap|cheapest|budget|affordable|low.?cost|under \$?\d/.test(g);

  if (isTrip) {
    const destination = extractDestination(goal);
    const tripQuery = budgetConscious
      ? `the cheapest good ${destination} trip`
      : `the best-value ${destination} trip`;
    add("flights", { to: destination });
    add("hotels", { city: destination });
    add("weather", { city: destination });
    add("summarize", { query: tripQuery });
    return { steps, destination, budgetConscious, kind: "trip" };
  }

  if (isLegal) {
    add("legal", { document: goal });
    add("summarize", { query: "the contract's risk profile" });
    return { steps, destination: null, budgetConscious, kind: "legal" };
  }

  // default: a research pipeline
  add("search", { query: goal });
  add("summarize", { query: goal });
  return { steps, destination: null, budgetConscious, kind: "research" };
}

/**
 * Pull the destination out of free text. Prefers "to <place>" / "in <place>"
 * phrases; strips filler words ("the", "cheapest", dates) and title-cases the
 * result. Falls back to "Goa" when nothing usable remains.
 */
const FILLER = new Set([
  "the",
  "a",
  "an",
  "cheapest",
  "cheap",
  "best",
  "budget",
  "affordable",
  "nice",
  "good",
  "next",
  "this",
  "weekend",
  "week",
  "month",
  "trip",
  "flight",
  "flights",
  "hotel",
  "hotels",
  "way",
  "possible",
  "asap",
  "please",
  "for",
  "me",
  "us",
  "and",
  "book",
  "plan",
  "visit",
  "travel",
  "go",
  "going",
  "holiday",
  "vacation",
  "getaway",
  "find",
  "get",
]);

export function extractDestination(goal: string): string {
  const m = goal.match(/\b(?:to|in|for)\s+([a-zA-Z][a-zA-Z\s]{1,40})/i);
  const raw = m ? m[1] : goal;
  const words = (raw ?? "")
    .replace(/[^a-zA-Z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !FILLER.has(w.toLowerCase()))
    .slice(0, 3);
  if (words.length === 0) return "Goa";
  return words.map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export const allServiceIds = SERVICES.map((s) => s.id);
