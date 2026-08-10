import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { money, otto, shortTx, type Task, type TaskStep } from "../../src/api";
import { LiveDot, Mono, PrimaryButton, Screen } from "../../src/components/ui";
import { STEPS, type Step } from "../../src/data";
import { c, font, grad, tabular } from "../../src/theme";

/** Map a live task step onto the design's Step shape. */
function toStep(st: TaskStep): Step {
  const status =
    st.status === "paid"
      ? "PAID"
      : st.status === "running"
        ? "RUNNING"
        : st.status === "blocked"
          ? "HOLD"
          : "QUEUED";
  return {
    title: st.description,
    detail: st.txId ? `settled · tx ${shortTx(st.txId)}` : `${st.status} · x402`,
    status,
    cost: st.priceMicroUsdc != null ? `−${money(st.priceMicroUsdc / 1e6)}` : "—",
    state: st.status === "paid" ? "done" : st.status === "running" ? "active" : "wait",
  };
}

interface Outcome {
  flight?: { airline: string; priceUsd: number };
  hotel?: { name: string; perNightUsd: number };
  forecast?: string;
}
function outcomeOf(task: Task): Outcome {
  const out: Outcome = {};
  for (const st of task.steps) {
    const o = st.output as Record<string, unknown> | null;
    if (!o) continue;
    if (st.serviceId === "flights") out.flight = (o.cheapest as Outcome["flight"]) ?? undefined;
    if (st.serviceId === "hotels") out.hotel = (o.cheapest as Outcome["hotel"]) ?? undefined;
    if (st.serviceId === "weather") out.forecast = (o.forecast as string) ?? undefined;
  }
  return out;
}

export default function ActiveTask() {
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);

  const poll = useCallback(async () => {
    try {
      const t = await otto.tasks();
      setTask(t.tasks[0] ?? null);
    } catch {
      setTask(null);
    }
  }, []);
  useEffect(() => {
    poll();
    const p = setInterval(poll, 1200);
    return () => clearInterval(p);
  }, [poll]);

  const total = task ? task.steps.length || 1 : 6;
  const paid = task ? task.steps.filter((st) => st.status === "paid").length : 3;
  const runLab = !task
    ? "IDLE · NO TASK YET"
    : task.status === "running"
      ? `RUNNING · STEP ${Math.min(paid + 1, total)} OF ${total}`
      : task.status === "done"
        ? `COMPLETE · ${total} AGENTS PAID`
        : task.status === "blocked"
          ? "STOPPED BY SPEND FIREWALL"
          : "FAILED";
  const steps = task ? task.steps.map(toStep) : STEPS;
  const outcome = task ? outcomeOf(task) : null;

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
        <LiveDot />
        <Text style={s.run}>{runLab}</Text>
      </View>
      <Text style={s.title} numberOfLines={1}>
        {task ? (task.destination ? `Book ${task.destination} trip` : task.goal) : "No task yet"}
      </Text>
      <Text style={s.sub}>
        {task
          ? "Otto hires specialist agents and pays each one per task · x402 · USDC"
          : "Start one from Home — Otto will hire and pay agents for you."}
      </Text>

      {/* Outcome — Otto's pick, from the real step outputs */}
      <LinearGradient
        colors={grad.heroLav}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.itin}
      >
        <LinearGradient
          colors={grad.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.itinOrb}
          pointerEvents="none"
        />
        <Text style={s.itinLabel}>
          {task && task.status === "done" ? "OTTO'S PICK" : "WORKING DRAFT"}
        </Text>
        {outcome?.flight && (
          <View style={s.kvRow}>
            <Text style={s.kvKey}>Flight · {outcome.flight.airline}</Text>
            <Mono style={{ fontSize: 14, ...tabular }}>${outcome.flight.priceUsd}</Mono>
          </View>
        )}
        {outcome?.hotel && (
          <View style={s.kvRow}>
            <Text style={s.kvKey} numberOfLines={1}>
              Hotel · {outcome.hotel.name}
            </Text>
            <Mono style={{ fontSize: 14, ...tabular }}>${outcome.hotel.perNightUsd}/n</Mono>
          </View>
        )}
        {outcome?.forecast && (
          <View style={s.kvRow}>
            <Text style={s.kvKey}>Weather</Text>
            <Text style={[s.kvKey, { color: c.text }]}>{outcome.forecast}</Text>
          </View>
        )}
        {!outcome?.flight && !outcome?.hotel && (
          <Text style={[s.kvKey, { marginTop: 12 }]}>
            {task ? "Otto is buying results…" : "Waiting for a goal."}
          </Text>
        )}
        <View style={s.itinTotal}>
          <Text style={s.itinTotalLabel}>Agent fees (x402)</Text>
          <Mono color={c.accentBright} style={{ fontSize: 19, ...tabular }}>
            {task ? money(task.spentMicroUsdc / 1e6) : "$0.00"}
          </Mono>
        </View>
      </LinearGradient>

      {task?.blocked ? (
        <View style={s.blocked}>
          <Text style={s.blockedText}>🛑 {task.blocked}</Text>
        </View>
      ) : null}

      {/* Steps */}
      <View style={{ marginTop: 22 }}>
        {steps.map((step, i) => (
          <StepRow key={step.title} step={step} last={i === steps.length - 1} />
        ))}
      </View>

      <PrimaryButton
        label="Approve final booking"
        onPress={() => router.push("/sheet/approve")}
        style={s.approve}
      />
      <Text style={s.auto}>
        {task && task.status === "running"
          ? "Otto is paying per task…"
          : "Escrow releases on delivery"}
      </Text>
    </Screen>
  );
}

function pillStyle(status: Step["status"]): { color: string; bg: string; border: string } {
  if (status === "RUNNING")
    return {
      color: c.accentBright,
      bg: "rgba(169,160,255,0.12)",
      border: "rgba(169,160,255,0.24)",
    };
  if (status === "PAID" || status === "DONE")
    return { color: c.earn, bg: "rgba(143,227,180,0.08)", border: "rgba(143,227,180,0.18)" };
  return {
    color: "rgba(242,241,246,0.46)",
    bg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.08)",
  };
}

function StepRow({ step, last }: { step: Step; last: boolean }) {
  const done = step.state === "done";
  const active = step.state === "active";
  const wait = step.state === "wait";
  const pill = pillStyle(step.status);
  const lineColor = last
    ? "transparent"
    : done
      ? "rgba(143,227,180,0.28)"
      : "rgba(255,255,255,0.08)";

  return (
    <View style={s.step}>
      <View style={{ alignItems: "center", width: 24 }}>
        {active ? (
          <View style={s.activeRing}>
            <LinearGradient
              colors={["#DAD5FF", "#8F87F1"]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={s.node}
            />
          </View>
        ) : (
          <LinearGradient
            colors={
              done ? ["#A9EFC8", "#5DA582"] : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.05)"]
            }
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[s.node, s.nodeBorder]}
          >
            {done && <Text style={s.check}>✓</Text>}
          </LinearGradient>
        )}
        <View style={[s.line, { backgroundColor: lineColor }]} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[s.stepTitle, wait && { color: c.muted }]}>{step.title}</Text>
          <View style={[s.pill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
            <Text
              style={{
                color: pill.color,
                fontSize: 9.5,
                letterSpacing: 0.5,
                fontFamily: font.medium,
              }}
            >
              {step.status}
            </Text>
          </View>
        </View>
        <Text style={s.stepDetail}>{step.detail}</Text>
      </View>

      <Mono color={step.cost === "—" ? c.dim : c.accentBright} style={{ fontSize: 12 }}>
        {step.cost}
      </Mono>
    </View>
  );
}

const s = StyleSheet.create({
  run: { color: c.faint, fontSize: 10.5, letterSpacing: 0.9, fontFamily: font.regular },
  title: {
    color: c.text,
    fontSize: 22,
    fontFamily: font.semibold,
    letterSpacing: -0.5,
    marginTop: 10,
  },
  sub: { color: c.faint, fontSize: 12.5, marginTop: 4, fontFamily: font.regular },

  itin: {
    marginTop: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    overflow: "hidden",
  },
  itinOrb: {
    position: "absolute",
    right: -60,
    top: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.4,
  },
  itinLabel: { color: c.faint, fontSize: 11, letterSpacing: 0.9, fontFamily: font.medium },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  kvKey: { color: c.muted, fontSize: 12, fontFamily: font.regular, flexShrink: 1 },
  blocked: {
    marginTop: 14,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,190,110,0.28)",
    backgroundColor: "rgba(255,190,110,0.07)",
  },
  blockedText: { color: "#FFD08A", fontSize: 12.5, fontFamily: font.regular, lineHeight: 18 },
  itinRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  itinTime: { color: c.faint, fontSize: 10.5, marginTop: 3, fontFamily: font.regular },
  itinLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.16)" },
  itinDot: {
    position: "absolute",
    right: -3,
    top: -4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: c.accentSoft,
  },
  itinTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.09)",
  },
  itinTotalLabel: { color: c.muted, fontSize: 12, fontFamily: font.regular },

  step: {
    flexDirection: "row",
    gap: 13,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: c.hairline,
  },
  node: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  nodeBorder: { borderWidth: 1, borderColor: "rgba(255,255,255,0.11)" },
  activeRing: { padding: 5, borderRadius: 15, backgroundColor: "rgba(143,135,241,0.14)" },
  check: { color: "#0F1712", fontSize: 10, fontFamily: font.bold },
  line: { width: 1, flex: 1, marginTop: 6 },
  stepTitle: { color: c.text, fontSize: 13, fontFamily: font.medium },
  stepDetail: {
    color: "rgba(242,241,246,0.34)",
    fontSize: 11,
    marginTop: 5,
    fontFamily: font.regular,
  },
  pill: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },

  approve: { marginTop: 20, height: 54 },
  auto: {
    color: c.dim,
    fontSize: 11.5,
    textAlign: "center",
    marginTop: 11,
    fontFamily: font.regular,
  },
});
