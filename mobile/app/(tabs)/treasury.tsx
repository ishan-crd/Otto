import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { otto } from "../../src/api";
import { LiveDot, Mono, Screen, ScreenTitle } from "../../src/components/ui";
import { c, font, grad, tabular, usd } from "../../src/theme";

/**
 * Compounding Autonomous Treasury — Otto's business, live. Each cycle Otto
 * sells a skill (revenue), hires a sub-agent to fulfil it (cost), keeps the
 * profit, and reinvests a share to grow its earning capacity — so the treasury
 * compounds. The loop is a client-side simulation of the economics; real x402
 * settlement runs on /pay, and each cycle also fires a real skill-sale so
 * genuine receipts land in the ledger.
 */

const SEED = 5;
const MAX_CYCLES = 48;

interface TEvent {
  k: "in" | "out";
  label: string;
  amt: number;
  tx: string;
}
interface TState {
  balance: number;
  capacity: number;
  revenue: number;
  cost: number;
  cycles: number;
  history: number[];
  events: TEvent[];
}
const r2 = (x: number) => Math.round(x * 100) / 100;
function hex() {
  const h = "0123456789abcdef";
  let a = "";
  for (let i = 0; i < 4; i++) a += h[Math.floor(Math.random() * 16)];
  return `0x${a}…${h[Math.floor(Math.random() * 16)]}${h[Math.floor(Math.random() * 16)]}`;
}
const initT = (): TState => ({
  balance: SEED,
  capacity: 1,
  revenue: 0,
  cost: 0,
  cycles: 0,
  history: [SEED],
  events: [],
});

function stepT(st: TState, reinvestPct: number): TState {
  const dud = Math.random() < 0.1;
  const revenue = r2(0.55 * st.capacity * (0.85 + Math.random() * 0.3) * (dud ? 0.4 : 1));
  const cost = r2(dud ? revenue * 1.15 : revenue * (0.42 + Math.random() * 0.16));
  const profit = r2(revenue - cost);
  const balance = r2(st.balance + profit);
  const reinvest = Math.max(0, profit) * (reinvestPct / 100);
  const capacity = st.capacity + reinvest * 0.16;
  const events: TEvent[] = [
    { k: "in" as const, label: "Sold skill · client agent", amt: revenue, tx: hex() },
    { k: "out" as const, label: "Hired sub-agent", amt: cost, tx: hex() },
    ...st.events,
  ].slice(0, 8);
  return {
    balance,
    capacity,
    revenue: r2(st.revenue + revenue),
    cost: r2(st.cost + cost),
    cycles: st.cycles + 1,
    history: [...st.history, balance].slice(-30),
    events,
  };
}

const FLYWHEEL = ["EARN", "REINVEST", "HIRE", "GROW"];

export default function Treasury() {
  const [st, setSt] = useState<TState>(initT);
  const [running, setRunning] = useState(false);
  const [reinvest, setReinvest] = useState(70);
  const reinvestRef = useRef(reinvest);
  reinvestRef.current = reinvest;
  const cyclesRef = useRef(0);
  cyclesRef.current = st.cycles;

  const doStep = useCallback(() => {
    setSt((prev) => stepT(prev, reinvestRef.current));
    // best-effort: drop a real skill-sale receipt into the ledger every few cycles
    if (cyclesRef.current % 3 === 0) otto.earn().catch(() => {});
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (cyclesRef.current >= MAX_CYCLES) {
        setRunning(false);
        return;
      }
      doStep();
    }, 750);
    return () => clearInterval(id);
  }, [running, doStep]);

  const net = r2(st.revenue - st.cost);
  const margin = st.revenue > 0 ? Math.round((net / st.revenue) * 100) : 0;
  const grown = r2(st.balance - SEED);
  const max = Math.max(...st.history, SEED * 1.2);
  const min = Math.min(...st.history);
  const activeSpoke = st.cycles % FLYWHEEL.length;

  return (
    <Screen>
      <ScreenTitle
        title="Treasury"
        sub="Otto's autonomous business — earning, reinvesting, compounding."
      />

      {/* Balance hero */}
      <LinearGradient
        colors={grad.hero}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.hero}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <LiveDot color={running ? c.earn : c.faint} />
          <Text style={s.heroLabel}>TREASURY · USDC {running ? "· LIVE" : ""}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 8 }}>
          <Mono style={s.balance}>{usd(st.balance)}</Mono>
          <Mono
            color={grown >= 0 ? c.earnBright : c.danger}
            style={{ fontSize: 13, paddingBottom: 6 }}
          >
            {grown >= 0 ? "+" : "−"}
            {usd(Math.abs(grown))}
          </Mono>
        </View>
        <Text style={s.heroSub}>
          Started at {usd(SEED)} · {st.cycles} business cycles · {margin}% margin
        </Text>
      </LinearGradient>

      {/* P&L */}
      <View style={s.plRow}>
        <PL k="REVENUE" v={usd(st.revenue)} color={c.earnBright} />
        <PL k="AGENT COST" v={usd(st.cost)} color={c.accentBright} />
        <PL
          k="NET PROFIT"
          v={`${net >= 0 ? "" : "−"}${usd(Math.abs(net))}`}
          color={net >= 0 ? c.earnBright : c.danger}
        />
      </View>

      {/* Growth chart */}
      <LinearGradient
        colors={grad.card}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.card}
      >
        <View style={s.spread}>
          <Text style={s.cardTitle}>Treasury growth</Text>
          <Mono style={{ fontSize: 11, color: c.dim }}>compounding</Mono>
        </View>
        <View style={s.chart}>
          {st.history.map((v, i) => {
            const h = 8 + ((v - min) / Math.max(max - min, 0.01)) * 82;
            const isLast = i === st.history.length - 1;
            return (
              <LinearGradient
                // biome-ignore lint/suspicious/noArrayIndexKey: positional bar chart
                key={i}
                colors={
                  isLast ? (["#A9EFC8", "#6FBF97"] as const) : (["#8F87F1", "#4B4681"] as const)
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[s.bar, { height: h }]}
              />
            );
          })}
        </View>
        <Text style={s.chartFoot}>
          Balance per cycle · reinvested profit buys capacity → each cycle earns more
        </Text>
      </LinearGradient>

      {/* Flywheel */}
      <LinearGradient
        colors={grad.heroLav}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.flywheel}
      >
        <Text style={s.cardTitle}>The flywheel</Text>
        <View style={s.spokes}>
          {FLYWHEEL.map((label, i) => (
            <View key={label} style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[s.spoke, i === activeSpoke && running && s.spokeOn]}>
                <Text style={[s.spokeText, i === activeSpoke && running && { color: c.text }]}>
                  {label}
                </Text>
              </View>
              {i < FLYWHEEL.length - 1 && <Text style={s.spokeArrow}>→</Text>}
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Controls */}
      <View style={s.controls}>
        <Pressable
          onPress={() => setRunning((v) => !v)}
          style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }, { flex: 1 }]}
        >
          <LinearGradient
            colors={running ? (["#33304A", "#1B1B26"] as const) : grad.primary}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={s.runBtn}
          >
            <Text style={[s.runText, { color: running ? c.text : "#14121F" }]}>
              {running ? "⏸ Pause" : st.cycles ? "▶ Resume" : "▶ Run Otto's business"}
            </Text>
          </LinearGradient>
        </Pressable>
        <Pressable
          onPress={() => {
            setRunning(false);
            setSt(initT());
          }}
          style={s.resetBtn}
        >
          <Text style={s.resetText}>↺</Text>
        </Pressable>
      </View>
      <View style={s.reinvestRow}>
        <Text style={s.reLabel}>REINVEST</Text>
        {[50, 70, 90].map((v) => (
          <Pressable
            key={v}
            onPress={() => setReinvest(v)}
            style={[s.reChip, reinvest === v && s.reChipOn]}
          >
            <Mono color={reinvest === v ? c.text : c.muted} style={{ fontSize: 12 }}>
              {v}%
            </Mono>
          </Pressable>
        ))}
        <Text style={s.reHint}>of profit → capacity</Text>
      </View>

      {/* Activity */}
      <Text style={s.section}>Business activity</Text>
      <LinearGradient
        colors={grad.card}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.feed}
      >
        {st.events.length === 0 ? (
          <Text style={s.empty}>Press play — watch Otto earn, hire, and compound.</Text>
        ) : (
          st.events.map((e, i) => (
            <View
              key={e.tx}
              style={[s.feedRow, i === st.events.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={[s.feedIco, e.k === "in" ? s.icoIn : s.icoOut]}>
                <Text style={{ color: e.k === "in" ? c.earn : c.accent2, fontSize: 12 }}>
                  {e.k === "in" ? "↑" : "↓"}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.feedLabel}>{e.label}</Text>
                <Mono style={s.feedMeta}>{e.tx} · settled</Mono>
              </View>
              <Mono color={e.k === "in" ? c.earnBright : c.spend} style={{ fontSize: 13 }}>
                {e.k === "in" ? "+" : "−"}
                {usd(e.amt)}
              </Mono>
            </View>
          ))
        )}
      </LinearGradient>
      <Text style={s.note}>
        No human funds this after the {usd(SEED)} seed. Otto pays its own bills — governed by the
        spend firewall.
      </Text>
    </Screen>
  );
}

function PL({ k, v, color }: { k: string; v: string; color: string }) {
  return (
    <View style={s.plCard}>
      <Text style={s.plK}>{k}</Text>
      <Mono color={color} style={{ fontSize: 16, marginTop: 5, ...tabular }}>
        {v}
      </Mono>
    </View>
  );
}

const s = StyleSheet.create({
  hero: {
    marginTop: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 22,
    overflow: "hidden",
  },
  heroLabel: { color: c.faint, fontSize: 11, letterSpacing: 1, fontFamily: font.medium },
  balance: { fontSize: 38, letterSpacing: -1.2, ...tabular },
  heroSub: { color: c.muted, fontSize: 12, marginTop: 12, fontFamily: font.regular },

  plRow: { flexDirection: "row", gap: 9, marginTop: 12 },
  plCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.035)",
    padding: 13,
  },
  plK: { color: c.faint, fontSize: 9.5, letterSpacing: 0.4, fontFamily: font.medium },

  card: { marginTop: 14, borderRadius: 22, borderWidth: 1, borderColor: c.border, padding: 18 },
  spread: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: c.text, fontSize: 14, fontFamily: font.semibold, letterSpacing: -0.2 },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 96, marginTop: 16 },
  bar: { flex: 1, borderRadius: 3, minHeight: 4 },
  chartFoot: {
    color: c.dim,
    fontSize: 10.5,
    marginTop: 12,
    lineHeight: 15,
    fontFamily: font.regular,
  },

  flywheel: {
    marginTop: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(169,160,255,0.2)",
    padding: 18,
  },
  spokes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  spoke: {
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  spokeOn: { borderColor: "rgba(169,160,255,0.4)", backgroundColor: "rgba(169,160,255,0.16)" },
  spokeText: { color: c.muted, fontSize: 10.5, letterSpacing: 0.5, fontFamily: font.medium },
  spokeArrow: { color: c.dim, fontSize: 12, marginHorizontal: 2 },

  controls: { flexDirection: "row", gap: 9, marginTop: 16 },
  runBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  runText: { fontSize: 14.5, fontFamily: font.semibold },
  resetBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: c.glass2,
  },
  resetText: { color: c.text, fontSize: 18 },

  reinvestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    flexWrap: "wrap",
  },
  reLabel: { color: c.faint, fontSize: 10.5, letterSpacing: 0.8, fontFamily: font.medium },
  reChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  reChipOn: { borderColor: "rgba(169,160,255,0.34)", backgroundColor: "rgba(169,160,255,0.16)" },
  reHint: { color: c.dim, fontSize: 11, fontFamily: font.regular },

  section: {
    color: c.text,
    fontSize: 16,
    fontFamily: font.semibold,
    letterSpacing: -0.3,
    marginTop: 24,
    marginBottom: 12,
  },
  feed: { borderRadius: 22, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16 },
  empty: {
    color: c.muted,
    fontSize: 12.5,
    paddingVertical: 20,
    textAlign: "center",
    fontFamily: font.regular,
  },
  feedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: c.hairline,
  },
  feedIco: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icoIn: { backgroundColor: "rgba(143,227,180,0.08)", borderColor: "rgba(143,227,180,0.16)" },
  icoOut: { backgroundColor: "rgba(169,160,255,0.08)", borderColor: "rgba(169,160,255,0.18)" },
  feedLabel: { color: c.text, fontSize: 12.5, fontFamily: font.regular },
  feedMeta: { color: c.dim, fontSize: 10, marginTop: 3 },
  note: {
    color: c.dim,
    fontSize: 11.5,
    marginTop: 16,
    lineHeight: 17,
    fontFamily: font.regular,
    textAlign: "center",
  },
});
