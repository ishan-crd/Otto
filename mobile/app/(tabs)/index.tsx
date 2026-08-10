import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { type LedgerEntry, money, otto, type Task, type WalletSnapshot } from "../../src/api";
import { useAppState } from "../../src/components/AppState";
import { receiptParams } from "../../src/components/sheet-nav";
import { LiveDot, Mono, ProgressBar, Screen } from "../../src/components/ui";
import { FEED, HERO, type Row } from "../../src/data";
import { c, font, grad, tabular, usd } from "../../src/theme";

const BUDGET_CHIPS = [0.5, 2, 5, 10];

export default function Home() {
  const router = useRouter();
  const { toast, walletConnected, liveStatus } = useAppState();
  const [wallet, setWallet] = useState<WalletSnapshot | null>(null);
  const [live, setLive] = useState<Row[] | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [goal, setGoal] = useState("");
  const [budget, setBudget] = useState(2);
  const [budgetText, setBudgetText] = useState("2.00");
  const [starting, setStarting] = useState(false);
  const [tick, setTick] = useState(0);

  // Poll the backend; upgrade the balance + feed to live data when reachable,
  // otherwise fall through to the design fixtures (rotating on a timer).
  const poll = useCallback(async () => {
    try {
      const [w, l, t] = await Promise.all([otto.wallet(), otto.ledger(), otto.tasks()]);
      setWallet(w);
      setLive(l.entries.length ? l.entries.slice(0, 5).map(toRow) : null);
      setTask(t.tasks[0] ?? null);
    } catch {
      setWallet(null);
      setLive(null);
    }
  }, []);

  const runGoal = useCallback(async () => {
    const g = goal.trim();
    if (!g || starting) return;
    setStarting(true);
    try {
      await otto.startTask(g, budget > 0 ? budget : 2);
      setGoal("");
      router.push("/task");
    } catch (err) {
      toast(String(err instanceof Error ? err.message : err));
    } finally {
      setStarting(false);
    }
  }, [goal, budget, starting, router, toast]);

  const pickChip = useCallback((v: number) => {
    setBudget(v);
    setBudgetText(v.toFixed(2));
  }, []);
  const onBudgetText = useCallback((t: string) => {
    setBudgetText(t);
    const n = Number.parseFloat(t);
    if (Number.isFinite(n) && n > 0) setBudget(n);
  }, []);

  useEffect(() => {
    poll();
    const p = setInterval(poll, 1500);
    const t = setInterval(() => setTick((n) => n + 1), 3800);
    return () => {
      clearInterval(p);
      clearInterval(t);
    };
  }, [poll]);

  const balance = wallet ? usd(wallet.balance.usdc) : HERO.balance;
  const o = tick % FEED.length;
  const feed = live ?? FEED.slice(o).concat(FEED.slice(0, o)).slice(0, 5);

  return (
    <Screen>
      <View style={s.header}>
        <View>
          <Text style={s.hi}>Good morning, Mira</Text>
          <Text style={s.hiBig}>Otto is working</Text>
        </View>
        <Pressable
          onPress={() => router.push("/sheet/connect")}
          style={({ pressed }) => [
            s.walletChip,
            walletConnected && s.walletChipOn,
            pressed && { opacity: 0.7 },
          ]}
        >
          {walletConnected ? (
            <>
              <View
                style={[
                  s.wDot,
                  {
                    backgroundColor: liveStatus?.funded && liveStatus?.optedIn ? c.earn : "#FFCE7A",
                  },
                ]}
              />
              <Mono style={{ fontSize: 12 }}>{liveStatus ? money(liveStatus.usdc) : "· · ·"}</Mono>
            </>
          ) : (
            <>
              <View style={[s.wDot, { backgroundColor: c.accentBright }]} />
              <Text style={s.walletChipText}>Connect</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Agent wallet hero */}
      <LinearGradient
        colors={grad.hero}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.hero}
      >
        <LinearGradient
          colors={grad.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroOrb}
          pointerEvents="none"
        />
        <Text style={s.heroLabel}>AGENT WALLET</Text>
        <View style={s.balanceRow}>
          <Mono style={s.balance}>{balance}</Mono>
          <Text style={s.usdc}>USDC</Text>
        </View>
        <View style={s.pills}>
          <View
            style={[
              s.statPill,
              { borderColor: "rgba(143,227,180,0.16)", backgroundColor: "rgba(143,227,180,0.06)" },
            ]}
          >
            <Text style={s.statLabel}>EARNED ↑</Text>
            <Mono color={c.earnBright} style={s.statVal}>
              {wallet ? money(wallet.earned.usdc) : HERO.earned}
            </Mono>
          </View>
          <View
            style={[
              s.statPill,
              { borderColor: "rgba(169,160,255,0.18)", backgroundColor: "rgba(169,160,255,0.06)" },
            ]}
          >
            <Text style={s.statLabel}>SPENT ↓</Text>
            <Mono color={c.spend} style={s.statVal}>
              {wallet ? money(wallet.spent.usdc) : HERO.spent}
            </Mono>
          </View>
        </View>
      </LinearGradient>

      {/* Make an agent complete something for you */}
      <Text style={s.composerTitle}>Make an agent do something for you</Text>
      <Text style={s.composerSub}>
        Otto plans it, hires specialist agents, and pays each per task — never over your budget.
      </Text>
      <View style={s.goalRow}>
        <TextInput
          value={goal}
          onChangeText={setGoal}
          onSubmitEditing={runGoal}
          placeholder='Try "book a trip to Belgium, cheapest"'
          placeholderTextColor="rgba(242,241,246,0.36)"
          keyboardAppearance="dark"
          returnKeyType="go"
          style={s.goalInput}
        />
        <Pressable
          onPress={runGoal}
          style={({ pressed }) => [s.goalBtn, pressed && { transform: [{ scale: 0.96 }] }]}
        >
          <LinearGradient
            colors={grad.primary}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={s.goalBtnBg}
          >
            <Text style={s.goalBtnText}>{starting ? "…" : "Run"}</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Budget chooser — enforced by the spend firewall */}
      <View style={s.budgetRow}>
        <Text style={s.budgetLabel}>BUDGET</Text>
        {BUDGET_CHIPS.map((v) => {
          const on = budget === v;
          return (
            <Pressable key={v} onPress={() => pickChip(v)} style={[s.bChip, on && s.bChipOn]}>
              <Mono color={on ? c.text : c.muted} style={{ fontSize: 12 }}>
                ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}
              </Mono>
            </Pressable>
          );
        })}
        <View style={s.bCustom}>
          <Text style={s.bCustomDollar}>$</Text>
          <TextInput
            value={budgetText}
            onChangeText={onBudgetText}
            keyboardType="decimal-pad"
            keyboardAppearance="dark"
            style={s.bCustomInput}
            selectTextOnFocus
          />
        </View>
      </View>

      {/* Latest task → Active task tab */}
      <Pressable
        onPress={() => router.push("/task")}
        style={({ pressed }) => [pressed && { transform: [{ scale: 0.985 }] }]}
      >
        <LinearGradient
          colors={grad.heroLav}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={s.taskCard}
        >
          {task ? (
            <TaskCard task={task} />
          ) : (
            <>
              <View style={s.taskTop}>
                <LiveDot />
                <Text style={s.taskRun}>IDLE · NO ACTIVE TASK</Text>
              </View>
              <Text style={s.taskTitle}>Give Otto a goal</Text>
              <Text style={s.taskDetail}>
                Otto plans it, hires marketplace agents, and pays each per task over x402.
              </Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      {/* Money moving */}
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>Money moving</Text>
        <Pressable onPress={() => router.push("/wallet")} hitSlop={8}>
          <Text style={s.link}>Ledger</Text>
        </Pressable>
      </View>
      <LinearGradient
        colors={grad.card}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.feedCard}
      >
        {feed.map((r, i) => (
          <FeedRow
            key={`${r.tx}-${r.label}`}
            row={r}
            onPress={() => router.push({ pathname: "/sheet/receipt", params: receiptParams(r) })}
            last={i === feed.length - 1}
          />
        ))}
      </LinearGradient>
    </Screen>
  );
}

function TaskCard({ task }: { task: Task }) {
  const total = task.steps.length || 1;
  const paid = task.steps.filter((st) => st.status === "paid").length;
  const runLab =
    task.status === "running"
      ? `RUNNING · STEP ${Math.min(paid + 1, total)} OF ${total}`
      : task.status === "done"
        ? `COMPLETE · ${total} AGENTS PAID`
        : task.status === "blocked"
          ? "STOPPED BY SPEND FIREWALL"
          : "FAILED";
  const active = task.steps.find((st) => st.status === "running");
  const detail = active
    ? `${active.description}…`
    : task.blocked
      ? task.blocked
      : "All agents delivered · settled in USDC";
  return (
    <>
      <View style={s.taskTop}>
        <LiveDot />
        <Text style={s.taskRun}>{runLab}</Text>
        <Mono color={c.accentBright} style={{ fontSize: 12 }}>
          −{money(task.spentMicroUsdc / 1e6)}
        </Mono>
      </View>
      <Text style={s.taskTitle} numberOfLines={1}>
        {task.destination ? `Book ${task.destination} trip` : task.goal}
      </Text>
      <Text style={s.taskDetail} numberOfLines={1}>
        {detail}
      </Text>
      <ProgressBar
        pct={Math.max(6, Math.round((100 * paid) / total))}
        height={4}
        shimmer={task.status === "running"}
        style={{ marginTop: 15 }}
      />
    </>
  );
}

function FeedRow({ row, onPress, last }: { row: Row; onPress: () => void; last: boolean }) {
  const inbound = row.dir === "in";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.feedRow,
        last && { borderBottomWidth: 0 },
        pressed && { opacity: 0.6 },
      ]}
    >
      <View
        style={[
          s.feedIcon,
          inbound
            ? { backgroundColor: "rgba(143,227,180,0.08)", borderColor: "rgba(143,227,180,0.16)" }
            : { backgroundColor: "rgba(169,160,255,0.08)", borderColor: "rgba(169,160,255,0.18)" },
        ]}
      >
        <Text style={{ color: inbound ? c.earn : c.accent2, fontSize: 12 }}>
          {inbound ? "↑" : "↓"}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={s.feedLabel}>
          {row.label}
        </Text>
        <Mono style={s.feedMeta}>
          {row.tx} · {row.time}
        </Mono>
      </View>
      <Mono color={inbound ? c.earnBright : c.spend} style={{ fontSize: 13 }}>
        {row.amount}
      </Mono>
    </Pressable>
  );
}

function toRow(e: LedgerEntry): Row {
  const id = e.txId || "";
  const short = id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id || "—";
  return {
    label: `${e.counterparty} · ${e.resource}`,
    amount: `${e.direction === "in" ? "+" : "−"}$${Number(e.usdc).toFixed(2)}`,
    dir: e.direction,
    tx: short,
    time: "live",
  };
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  hi: { color: c.faint, fontSize: 12, fontFamily: font.regular },
  hiBig: {
    color: c.text,
    fontSize: 22,
    fontFamily: font.semibold,
    letterSpacing: -0.5,
    marginTop: 3,
  },

  hero: {
    marginTop: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 22,
    overflow: "hidden",
  },
  heroOrb: {
    position: "absolute",
    right: -70,
    top: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.55,
  },
  heroLabel: { color: c.faint, fontSize: 11, letterSpacing: 1.1, fontFamily: font.medium },
  balanceRow: { flexDirection: "row", alignItems: "flex-end", gap: 9, marginTop: 9 },
  balance: { fontSize: 36, letterSpacing: -1, ...tabular },
  usdc: { color: c.faint, fontSize: 11, paddingBottom: 6, fontFamily: font.regular },
  pills: { flexDirection: "row", gap: 9, marginTop: 18 },
  statPill: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1 },
  statLabel: { color: c.faint, fontSize: 10, letterSpacing: 0.4, fontFamily: font.regular },
  statVal: { fontSize: 15, marginTop: 4, ...tabular },

  walletChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  walletChipOn: {
    borderColor: "rgba(143,227,180,0.24)",
    backgroundColor: "rgba(143,227,180,0.06)",
  },
  walletChipText: { color: c.text, fontSize: 12.5, fontFamily: font.medium },
  wDot: { width: 7, height: 7, borderRadius: 4 },

  composerTitle: {
    color: c.text,
    fontSize: 16,
    fontFamily: font.semibold,
    letterSpacing: -0.3,
    marginTop: 22,
  },
  composerSub: {
    color: c.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
    fontFamily: font.regular,
  },

  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    flexWrap: "wrap",
  },
  budgetLabel: { color: c.faint, fontSize: 10.5, letterSpacing: 0.8, fontFamily: font.medium },
  bChip: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  bChipOn: {
    borderColor: "rgba(169,160,255,0.34)",
    backgroundColor: "rgba(169,160,255,0.16)",
  },
  bCustom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,10,11,0.5)",
  },
  bCustomDollar: { color: c.faint, fontSize: 12.5, fontFamily: font.mono },
  bCustomInput: {
    minWidth: 44,
    color: c.text,
    fontSize: 12.5,
    fontFamily: font.mono,
    padding: 0,
    ...tabular,
  },

  goalRow: { flexDirection: "row", gap: 9, marginTop: 14 },
  goalInput: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.045)",
    color: c.text,
    paddingHorizontal: 15,
    fontSize: 13.5,
    fontFamily: font.regular,
  },
  goalBtn: { borderRadius: 15, overflow: "hidden" },
  goalBtnBg: { height: 46, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  goalBtnText: { color: "#14121F", fontSize: 14, fontFamily: font.semibold },

  taskCard: {
    marginTop: 14,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
    padding: 19,
  },
  taskTop: { flexDirection: "row", alignItems: "center", gap: 9 },
  taskRun: {
    color: c.faint,
    fontSize: 10.5,
    letterSpacing: 0.9,
    fontFamily: font.regular,
    flex: 1,
  },
  taskTitle: {
    color: c.text,
    fontSize: 16.5,
    fontFamily: font.semibold,
    letterSpacing: -0.3,
    marginTop: 11,
  },
  taskDetail: { color: c.muted, fontSize: 12, marginTop: 5, fontFamily: font.regular },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: { color: c.text, fontSize: 16, fontFamily: font.semibold, letterSpacing: -0.3 },
  link: { color: c.accent2, fontSize: 12, fontFamily: font.medium },

  feedCard: { borderRadius: 24, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16 },
  feedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: c.hairline,
  },
  feedIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  feedLabel: { color: c.text, fontSize: 12.5, fontFamily: font.regular },
  feedMeta: { color: c.dim, fontSize: 10, marginTop: 3 },
});
