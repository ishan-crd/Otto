import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE, type LedgerEntry, otto, type WalletSnapshot } from "../src/api";
import { c, mono, radius, space, tabular, usd } from "../src/theme";

export default function Home() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletSnapshot | null>(null);
  const [feed, setFeed] = useState<LedgerEntry[]>([]);
  const [goal, setGoal] = useState("plan a weekend trip to Goa");
  const [budget, setBudget] = useState("0.10");
  const [running, setRunning] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const seen = useRef(new Set<string>());

  const poll = useCallback(async () => {
    try {
      const [w, l] = await Promise.all([otto.wallet(), otto.ledger()]);
      setWallet(w);
      setFeed(l.entries);
      for (const e of l.entries) seen.current.add(e.id);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 1500);
    return () => clearInterval(t);
  }, [poll]);

  const runOtto = async () => {
    setRunning(true);
    setBlocked(null);
    try {
      const r = await otto.run(goal, Number(budget) || 0);
      setBlocked(r.blocked);
    } catch {
      setOffline(true);
    } finally {
      setRunning(false);
      poll();
    }
  };

  const earnOnce = async () => {
    try {
      await otto.earn();
      poll();
    } catch {
      setOffline(true);
    }
  };

  const earned = wallet?.earned.usdc ?? 0;
  const spent = wallet?.spent.usdc ?? 0;
  const flow = earned + spent;
  const earnPct = flow > 0 ? (earned / flow) * 100 : 50;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.logo}>Otto</Text>
          <Text style={s.tagline}>the AI that earns its keep</Text>
          <View style={s.railChip}>
            <Text style={s.railText}>{wallet ? `rail · ${wallet.rail}` : "…"}</Text>
          </View>
        </View>

        {offline && (
          <View style={s.offline}>
            <Text style={s.offlineText}>
              Can't reach Otto at {API_BASE}. Start the server (pnpm dev) and, on a real phone, set
              EXPO_PUBLIC_OTTO_API to your computer's IP.
            </Text>
          </View>
        )}

        {/* Hero — balance + the income/expense thesis */}
        <View style={s.hero}>
          <Text style={s.heroLabel}>WALLET BALANCE</Text>
          <Text style={s.balance}>{usd(wallet?.balance.usdc ?? 0)}</Text>
          <View style={s.flowBar}>
            <View style={[s.flowEarn, { flex: earnPct }]} />
            <View style={[s.flowSpend, { flex: 100 - earnPct }]} />
          </View>
          <View style={s.flowLegend}>
            <Text style={[s.legend, { color: c.earn }]}>↑ earned {usd(earned)}</Text>
            <Text style={[s.legend, { color: c.spend }]}>↓ spent {usd(spent)}</Text>
          </View>
          <Pressable onPress={() => router.push("/breakdown")} hitSlop={8}>
            <Text style={s.breakdownLink}>view breakdown ›</Text>
          </Pressable>
        </View>

        {/* Control — give Otto a goal */}
        <View style={s.card}>
          <Text style={s.cardTitle}>GIVE OTTO A GOAL</Text>
          <TextInput
            style={s.input}
            value={goal}
            onChangeText={setGoal}
            placeholder="e.g. plan a weekend trip to Goa"
            placeholderTextColor={c.muted}
            keyboardAppearance="dark"
          />
          <Text style={s.hint}>Budget (USDC) — set low to trip the firewall</Text>
          <TextInput
            style={s.input}
            value={budget}
            onChangeText={setBudget}
            keyboardType="decimal-pad"
            placeholderTextColor={c.muted}
            keyboardAppearance="dark"
          />
          <View style={s.row}>
            <Pressable style={[s.btn, s.primary]} onPress={runOtto} disabled={running}>
              {running ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.primaryText}>Run Otto</Text>
              )}
            </Pressable>
            <Pressable style={[s.btn, s.ghost]} onPress={earnOnce}>
              <Text style={s.ghostText}>Simulate a client paying Otto</Text>
            </Pressable>
          </View>
          {blocked && (
            <View style={s.blocked}>
              <Text style={s.blockedText}>🛑 {blocked}</Text>
            </View>
          )}
        </View>

        {/* Test the native glass bottom sheet */}
        <Pressable style={s.sheetBtn} onPress={() => router.push("/test-sheet")}>
          <Text style={s.sheetBtnText}>Open bottom sheet</Text>
        </Pressable>

        {/* Signature — the live payment stream */}
        <View style={s.card}>
          <Text style={s.cardTitle}>LIVE PAYMENTS</Text>
          {feed.length === 0 && (
            <Text style={s.empty}>No payments yet. Run Otto to watch money move.</Text>
          )}
          {feed.map((p) => (
            <Pressable
              key={p.id}
              style={s.pay}
              onPress={() => p.explorerUrl && Linking.openURL(p.explorerUrl)}
            >
              <Text style={[s.amt, { color: p.direction === "in" ? c.earn : c.spend }]}>
                {p.direction === "in" ? "+" : "−"}
                {usd(p.usdc)}
              </Text>
              <View style={s.payMid}>
                <Text style={s.payWho} numberOfLines={1}>
                  {p.direction === "in" ? "earned from" : "paid"} {p.counterparty}
                </Text>
                <Text style={s.payRes} numberOfLines={1}>
                  {p.resource}
                </Text>
              </View>
              <Text style={s.payTx}>{p.txId.slice(0, 8)}…</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.footer}>Otto · autonomous x402 micropayments on Algorand</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  scroll: { padding: space.md, paddingBottom: space.xl },

  header: { flexDirection: "row", alignItems: "baseline", marginBottom: space.md },
  logo: { color: c.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  tagline: { color: c.muted, fontSize: 12, marginLeft: space.sm, flex: 1 },
  railChip: {
    backgroundColor: c.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  railText: { color: c.accent, fontSize: 11, fontFamily: mono },

  offline: {
    backgroundColor: "#2A1520",
    borderColor: c.spend,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.sm,
    marginBottom: space.md,
  },
  offlineText: { color: "#FBC0CB", fontSize: 12, lineHeight: 17 },

  hero: {
    backgroundColor: c.surface,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.md,
  },
  heroLabel: { color: c.muted, fontSize: 11, letterSpacing: 1.5, marginBottom: 6 },
  balance: {
    color: c.text,
    fontSize: 44,
    fontWeight: "800",
    fontFamily: mono,
    letterSpacing: -1,
    ...tabular,
  },
  flowBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: radius.pill,
    overflow: "hidden",
    marginTop: space.md,
    backgroundColor: c.surface2,
  },
  flowEarn: { backgroundColor: c.earn },
  flowSpend: { backgroundColor: c.spend },
  flowLegend: { flexDirection: "row", justifyContent: "space-between", marginTop: space.sm },
  legend: { fontSize: 12, fontFamily: mono, ...tabular },
  breakdownLink: { color: c.accent, fontSize: 12, marginTop: space.sm },

  card: {
    backgroundColor: c.surface,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.md,
  },
  cardTitle: { color: c.muted, fontSize: 11, letterSpacing: 1.5, marginBottom: space.sm },
  input: {
    backgroundColor: c.bg,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    color: c.text,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: space.sm,
  },
  hint: { color: c.muted, fontSize: 12, marginBottom: 6 },
  row: { flexDirection: "row", gap: space.sm, marginTop: 4 },
  btn: {
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: c.accent, flex: 1 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  ghost: { backgroundColor: c.surface2, flex: 1.4, paddingHorizontal: 10 },
  ghostText: { color: c.text, fontWeight: "600", fontSize: 13, textAlign: "center" },

  blocked: {
    backgroundColor: "#2A2410",
    borderColor: "#FBBF24",
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: space.sm,
    marginTop: space.sm,
  },
  blockedText: { color: "#FBBF24", fontSize: 13, fontWeight: "600" },

  sheetBtn: {
    backgroundColor: c.surface,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: space.md,
  },
  sheetBtnText: { color: c.accent, fontWeight: "700", fontSize: 15 },

  empty: { color: c.muted, fontSize: 13, paddingVertical: space.sm },
  pay: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingVertical: 10,
    borderTopColor: c.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  amt: { fontFamily: mono, fontSize: 15, fontWeight: "700", width: 92, ...tabular },
  payMid: { flex: 1 },
  payWho: { color: c.text, fontSize: 13.5 },
  payRes: { color: c.muted, fontSize: 11.5, marginTop: 1 },
  payTx: { color: c.accent, fontSize: 11, fontFamily: mono },

  footer: { color: c.muted, fontSize: 11, textAlign: "center", marginTop: space.sm },
});
