import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { LiveDot, Mono, PrimaryButton, Screen } from "../../src/components/ui";
import { STEPS, type Step } from "../../src/data";
import { c, font, grad, tabular } from "../../src/theme";

export default function ActiveTask() {
  const router = useRouter();
  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
        <LiveDot />
        <Text style={s.run}>RUNNING · STEP 4 OF 6</Text>
      </View>
      <Text style={s.title}>Book Lisbon trip</Text>
      <Text style={s.sub}>14–19 Sep · Otto is paying each agent per task</Text>

      {/* Itinerary draft */}
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
        <View style={s.itinRow}>
          <View>
            <Mono style={{ fontSize: 22 }}>SFO</Mono>
            <Text style={s.itinTime}>08:15</Text>
          </View>
          <View style={s.itinLine}>
            <View style={s.itinDot} />
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Mono style={{ fontSize: 22 }}>LIS</Mono>
            <Text style={s.itinTime}>21:40</Text>
          </View>
        </View>
        <View style={s.itinTotal}>
          <Text style={s.itinTotalLabel}>Total incl. agent fees</Text>
          <Mono style={{ fontSize: 19, ...tabular }}>$1,284.20</Mono>
        </View>
      </LinearGradient>

      {/* Steps */}
      <View style={{ marginTop: 22 }}>
        {STEPS.map((step, i) => (
          <StepRow key={step.title} step={step} last={i === STEPS.length - 1} />
        ))}
      </View>

      <PrimaryButton
        label="Approve final booking"
        onPress={() => router.push("/sheet/approve")}
        style={s.approve}
      />
      <Text style={s.auto}>Auto-approves in 4m 12s</Text>
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
