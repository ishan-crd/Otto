import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type LedgerEntry, otto, type WalletSnapshot } from "../../src/api";
import { useSheet } from "../../src/components/BottomSheet";
import { LiveDot, Mono, OttoMark, ProgressBar, Screen } from "../../src/components/ui";
import { FEED, HERO, type Row } from "../../src/data";
import { c, font, grad, tabular, usd } from "../../src/theme";

export default function Home() {
  const router = useRouter();
  const sheet = useSheet();
  const [wallet, setWallet] = useState<WalletSnapshot | null>(null);
  const [live, setLive] = useState<Row[] | null>(null);
  const [tick, setTick] = useState(0);

  // Poll the backend; upgrade the balance + feed to live data when reachable,
  // otherwise fall through to the design fixtures (rotating on a timer).
  const poll = useCallback(async () => {
    try {
      const [w, l] = await Promise.all([otto.wallet(), otto.ledger()]);
      setWallet(w);
      setLive(l.entries.length ? l.entries.slice(0, 5).map(toRow) : null);
    } catch {
      setWallet(null);
      setLive(null);
    }
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
        <OttoMark size={42} />
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
              {HERO.earned}
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
              {HERO.spent}
            </Mono>
          </View>
        </View>
      </LinearGradient>

      {/* Running task → Active task tab */}
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
          <View style={s.taskTop}>
            <LiveDot />
            <Text style={s.taskRun}>RUNNING · STEP 4 OF 6</Text>
            <Mono color={c.accentBright} style={{ fontSize: 12 }}>
              −$1.15
            </Mono>
          </View>
          <Text style={s.taskTitle}>Book Lisbon trip · 14–19 Sep</Text>
          <Text style={s.taskDetail}>Nomad Concierge is scoring 18 hotels…</Text>
          <ProgressBar pct={58} height={4} shimmer style={{ marginTop: 15 }} />
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
            onPress={() => sheet.open("receipt", { row: r })}
            last={i === feed.length - 1}
          />
        ))}
      </LinearGradient>
    </Screen>
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
