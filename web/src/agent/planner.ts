import { SERVICES, type ServiceDef, serviceById } from "../services/registry";

export interface PlanStep {
  service: ServiceDef;
  input: Record<string, unknown>;
}

/**
 * Deterministic goal -> plan mapper. Reliable on stage (no LLM flakiness), and
 * trivially swappable for an LLM planner during the hackathon: just have the
 * model emit a list of {serviceId, input} and feed it through serviceById().
 *
 * The plan is the set of paid services Otto will call (and pay for) to satisfy
 * the goal — this is the "Entry Management Framework" aggregator in action.
 */
export function planForGoal(goal: string): PlanStep[] {
  const g = goal.toLowerCase();
  const steps: PlanStep[] = [];
  const add = (id: string, input: Record<string, unknown>) => {
    const service = serviceById(id);
    if (service) steps.push({ service, input });
  };

  const isTrip = /trip|travel|holiday|vacation|goa|flight|getaway|weekend/.test(g);
  const isLegal = /contract|legal|clause|agreement|nda/.test(g);

  if (isTrip) {
    add("flights", { to: pickCity(g) });
    add("hotels", { city: pickCity(g) });
    add("weather", { city: pickCity(g) });
    add("summarize", { query: `the best-value ${pickCity(g)} trip` });
  } else if (isLegal) {
    add("legal", { document: goal });
    add("summarize", { query: "the contract's risk profile" });
  } else {
    // default: a research pipeline
    add("search", { query: goal });
    add("summarize", { query: goal });
  }

  if (steps.length === 0) add("search", { query: goal });
  return steps;
}

function pickCity(g: string): string {
  const cities = ["goa", "manali", "jaipur", "kerala", "udaipur", "shimla"];
  return (cities.find((c) => g.includes(c)) ?? "goa").replace(/^\w/, (m) => m.toUpperCase());
}

export const allServiceIds = SERVICES.map((s) => s.id);
