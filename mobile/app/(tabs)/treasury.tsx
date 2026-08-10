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
  who: string;
  detail: string;
  qty: number;
  rating: number;
  amt: number;
  bal: number;
  tx: string;
  onchain: boolean;
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

// Skills Otto sells (revenue) + the client agents that buy them.
const SKILLS = [
  "Itinerary optimisation",
  "Expense reconciliation",
  "Vendor negotiation",
  "Calendar defrag",
  "Subscription audit",
  "Smart Regex Builder",
  "Git Diff Explainer",
  "Travel policy compliance",
  "Receipt OCR & VAT",
  "Roast My Commit",
];
const CLIENTS = [
  "Acme Ledger Bot",
  "Halcyon Ops",
  "Bluefin AI",
  "Northwind Travel",
  "VeriFly",
  "Chronos",
  "Meridian Finance",
  "Cobalt CRM",
  "Stratus Air",
  "Orbit Assistant",
  "Sable Legal",
  "Kestrel Data",
];
// Sub-agents Otto hires (cost) + what each delivered.
const HIRES: { agent: string; task: string }[] = [
  { agent: "Skyscout", task: "multi-city fare search" },
  { agent: "Nomad Concierge", task: "hotel shortlist" },
  { agent: "Ledgerly", task: "receipt OCR batch" },
  { agent: "Reelcraft AI", task: "AI creator video" },
  { agent: "Wordsmith", task: "ad copy variants" },
  { agent: "Border Oracle", task: "visa & entry check" },
  { agent: "Quant Lens", task: "metrics analysis" },
  { agent: "Sentinel QA", task: "test & verify build" },
  { agent: "Autopost AI", task: "schedule recurring posts" },
  { agent: "Corepath", task: "API integration" },
  { agent: "Aurora UX", task: "UI polish pass" },
  { agent: "DeepScan", task: "market research" },
];
const r2 = (x: number) => Math.round(x * 100) / 100;
const rand = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
function hex() {
  const h = "0123456789abcdef";
  let a = "";
  for (let i = 0; i < 4; i++) a += h[Math.floor(Math.random() * 16)];
  return `0x${a}…${h[Math.floor(Math.random() * 16)]}${h[Math.floor(Math.random() * 16)]}`;
}
function split(total: number, n: number): number[] {
  if (n <= 1) return [r2(total)];
  const a = r2(total * (0.45 + Math.random() * 0.2));
  return [a, r2(total - a)];
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
  const R = r2(0.55 * st.capacity * (0.85 + Math.random() * 0.3) * (dud ? 0.4 : 1));
  const C = r2(dud ? R * 1.15 : R * (0.42 + Math.random() * 0.16));
  let bal = st.balance;
  const fresh: TEvent[] = [];
  for (const amt of split(R, R > 1 && Math.random() < 0.7 ? 2 : 1)) {
    bal = r2(bal + amt);
    fresh.push({
      k: "in",
      who: rand(CLIENTS),
      detail: rand(SKILLS),
      qty: 1 + Math.floor(Math.random() * 5),
      rating: 0,
      amt,
      bal,
      tx: hex(),
      onchain: st.cycles % 3 === 0,
    });
  }
  for (const amt of split(C, C > 0.9 && Math.random() < 0.6 ? 2 : 1)) {
    const h = rand(HIRES);
    bal = r2(bal - amt);
    fresh.push({
      k: "out",
      who: h.agent,
      detail: h.task,
      qty: 1,
      rating: r2(4.7 + Math.random() * 0.29),
      amt,
      bal,
      tx: hex(),
      onchain: false,
    });
  }
  const capacity = st.capacity + Math.max(0, r2(R - C)) * (reinvestPct / 100) * 0.16;
  return {
    balance: bal,
    capacity,
    revenue: r2(st.revenue + R),
    cost: r2(st.cost + C),
    cycles: st.cycles + 1,
    history: [...st.history, bal].slice(-30),
    events: [...fresh.reverse(), ...st.events].slice(0, 14),
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
        {st.events[0] && (
          <Text style={s.heroNow}>
            {st.events[0].k === "in"
              ? `▸ ${st.events[0].who} just paid Otto ${usd(st.events[0].amt)} for ${st.events[0].detail}`
              : `▸ Otto hired ${st.events[0].who} (${usd(st.events[0].amt)}) for a ${st.events[0].detail}`}
          </Text>
        )}
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

      {/* Detailed ledger */}
      <Text style={s.section}>Detailed ledger</Text>
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={s.feedWho} numberOfLines={1}>
                    {e.who}
                  </Text>
                  {e.onchain && (
                    <View style={s.onchain}>
                      <Text style={s.onchainText}>ON-CHAIN</Text>
                    </View>
                  )}
                </View>
                <Text style={s.feedWhat} numberOfLines={1}>
                  {e.k === "in"
                    ? `bought ${e.detail}${e.qty > 1 ? ` ×${e.qty}` : ""}`
                    : `delivered: ${e.detail} · ★${e.rating.toFixed(2)}`}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Mono color={e.k === "in" ? c.earnBright : c.spend} style={{ fontSize: 13 }}>
                  {e.k === "in" ? "+" : "−"}
                  {usd(e.amt)}
                </Mono>
                <Mono style={s.feedBal}>{usd(e.bal)}</Mono>
              </View>
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
  heroNow: {
    color: "rgba(242,241,246,0.66)",
    fontSize: 12.5,
    marginTop: 10,
    fontFamily: font.regular,
    lineHeight: 17,
  },

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
  feedWho: { color: c.text, fontSize: 12.5, fontFamily: font.medium, flexShrink: 1 },
  feedWhat: { color: c.faint, fontSize: 11, marginTop: 3, fontFamily: font.regular },
  feedBal: { color: "rgba(242,241,246,0.5)", fontSize: 10.5, marginTop: 3 },
  onchain: {
    backgroundColor: "rgba(143,227,180,0.1)",
    borderWidth: 1,
    borderColor: "rgba(143,227,180,0.24)",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  onchainText: { color: c.earn, fontSize: 7.5, letterSpacing: 0.4, fontFamily: font.medium },
  note: {
    color: c.dim,
    fontSize: 11.5,
    marginTop: 16,
    lineHeight: 17,
    fontFamily: font.regular,
    textAlign: "center",
  },
});
