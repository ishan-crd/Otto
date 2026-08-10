import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  type LedgerEntry,
  type LiveInfo,
  money,
  otto,
  type PurchaseRecord,
  type Stats,
  shortTx,
  type WalletSnapshot,
} from "../../src/api";
import { receiptParams } from "../../src/components/sheet-nav";
import { MoneyRow, Mono, Screen, ScreenTitle } from "../../src/components/ui";
import type { Row } from "../../src/data";
import { c, font, grad, tabular } from "../../src/theme";

function toRow(e: LedgerEntry): Row {
  return {
    label: `${e.direction === "in" ? e.counterparty : e.resource} · ${e.direction === "in" ? "earned" : "paid"}`,
    amount: `${e.direction === "in" ? "+" : "−"}${money(e.usdc)}`,
    dir: e.direction,
    tx: shortTx(e.txId),
    time: new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function Wallet() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletSnapshot | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [live, setLive] = useState<LiveInfo | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);

  const poll = useCallback(async () => {
    try {
      const [w, st, l] = await Promise.all([otto.wallet(), otto.stats(), otto.ledger()]);
      setWallet(w);
      setStats(st);
      setRows(l.entries.length ? l.entries.slice(0, 6).map(toRow) : null);
    } catch {
      setWallet(null);
      setStats(null);
      setRows(null);
    }
  }, []);
  const pollHistory = useCallback(async () => {
    try {
      const h = await otto.history();
      setPurchases(h.purchases);
    } catch {
      /* not signed in / offline */
    }
  }, []);

  useEffect(() => {
    poll();
    pollHistory();
    otto
      .liveInfo()
      .then(setLive)
      .catch(() => {});
    const p = setInterval(poll, 2500);
    const h = setInterval(pollHistory, 10000);
    return () => {
      clearInterval(p);
      clearInterval(h);
    };
  }, [poll, pollHistory]);

  const chart = stats?.chart.some((b) => b.earnedMicro || b.spentMicro)
    ? (() => {
        const max = Math.max(1, ...stats.chart.flatMap((b) => [b.earnedMicro, b.spentMicro]));
        return stats.chart.map((b, i) => ({
          wk: `B${i + 1}`,
          earn: Math.max(2, Math.round((78 * b.earnedMicro) / max)),
          spend: Math.max(2, Math.round((78 * b.spentMicro) / max)),
        }));
      })()
    : Array.from({ length: 8 }, (_, i) => ({ wk: `B${i + 1}`, earn: 2, spend: 2 }));
  const receipts = rows ?? [];

  return (
    <Screen>
      <ScreenTitle title="Wallet" />

      {/* Agent card */}
      <LinearGradient
        colors={grad.agentCard}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.card}
      >
        <Text style={s.cardLabel}>AGENT ACCOUNT</Text>
        <Mono style={s.cardNumber}>
          {live?.receiver
            ? `${live.receiver.slice(0, 8)}…${live.receiver.slice(-6)}`
            : wallet
              ? money(wallet.balance.usdc)
              : "•••• •••• •••• ••••"}
        </Mono>
        <View style={s.cardFoot}>
          <View>
            <Text style={s.cardMini}>HOLDER</Text>
            <Text style={s.cardHolder}>OTTO · agent</Text>
          </View>
          <Mono style={{ fontSize: 11.5, color: "#15131F" }}>
            {live?.enabled ? "TestNet · live" : "TestNet"}
          </Mono>
        </View>
      </LinearGradient>

      {/* Actions */}
      <View style={s.actions}>
        <ActionButton label="Add funds" onPress={() => router.push("/sheet/fund")}>
          <Path
            d="M12 5v14M5 12h14"
            stroke={c.accentBright}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </ActionButton>
        <ActionButton label="Withdraw" onPress={() => router.push("/sheet/withdraw")}>
          <Path
            d="M12 4v13M6.5 11.5L12 17l5.5-5.5M5 20h14"
            stroke={c.earnBright}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </ActionButton>
        <ActionButton label="Pay live" onPress={() => router.push("/pay")}>
          <Path
            d="M9.5 14.5l5-5M8 12l-2.2 2.2a3.5 3.5 0 004.9 4.9L13 17M16 12l2.2-2.2a3.5 3.5 0 00-4.9-4.9L11 7"
            stroke={c.accentBright}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </ActionButton>
      </View>

      {/* Escrow / pending */}
      <View style={s.statRow}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>IN ESCROW</Text>
          <Mono color={c.accentBright} style={s.statVal}>
            {stats ? money(stats.escrow.usdc) : "$0.00"}
          </Mono>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>EARNED</Text>
          <Mono color={c.earnBright} style={s.statVal}>
            {wallet ? money(wallet.earned.usdc) : "$0.00"}
          </Mono>
        </View>
      </View>

      {/* Earnings vs spend chart */}
      <LinearGradient
        colors={grad.card}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.chartCard}
      >
        <View style={s.spread}>
          <Text style={s.chartTitle}>Earnings vs spend</Text>
          <Text style={s.chartWeeks}>8 weeks</Text>
        </View>
        <View style={s.chart}>
          {chart.map((bar) => (
            <View key={bar.wk} style={s.barCol}>
              <View style={[s.barEarn, { height: bar.earn }]} />
              <View style={[s.barSpend, { height: bar.spend }]} />
            </View>
          ))}
        </View>
        <View style={s.legend}>
          <Legend color={c.earn} label="Earned" />
          <Legend color="#8F87F1" label="Spent" />
        </View>
      </LinearGradient>

      {/* Receipts */}
      <Text style={s.section}>Receipts</Text>
      <LinearGradient
        colors={grad.card}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.receipts}
      >
        {receipts.length === 0 && (
          <Text
            style={{
              color: c.faint,
              fontSize: 12,
              paddingVertical: 18,
              textAlign: "center",
              fontFamily: font.regular,
            }}
          >
            No settled payments yet.
          </Text>
        )}
        {receipts.map((r, i) => (
          <MoneyRow
            key={`${r.tx}-${r.time}-${r.label}`}
            row={r}
            onPress={() => router.push({ pathname: "/sheet/receipt", params: receiptParams(r) })}
            last={i === receipts.length - 1}
          />
        ))}
      </LinearGradient>
      {/* Prompt purchases — the signed-in user's history, synced with the web */}
      {purchases.length > 0 && (
        <>
          <Text style={s.section}>Your prompt purchases</Text>
          <LinearGradient
            colors={grad.card}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={s.receipts}
          >
            {purchases.slice(0, 6).map((pr, i) => (
              <View
                key={`${pr.txId}-${pr.at}`}
                style={[
                  s.purchaseRow,
                  i === Math.min(purchases.length, 6) - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={s.purchasePrompt}>
                    {pr.prompt}
                  </Text>
                  <Mono style={s.purchaseMeta}>
                    {pr.model} · {pr.outputTokens} tokens · {shortTx(pr.txId)}
                  </Mono>
                </View>
                <Mono color={c.accentBright} style={{ fontSize: 12.5 }}>
                  ${Number(pr.priceUsdc).toFixed(4)}
                </Mono>
              </View>
            ))}
          </LinearGradient>
        </>
      )}
    </Screen>
  );
}

function ActionButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.action, pressed && { transform: [{ scale: 0.96 }] }]}
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        {children}
      </Svg>
      <Text style={s.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
      <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: color }} />
      <Text style={s.legendText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginTop: 18,
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
  },
  cardLabel: {
    color: "rgba(21,19,31,0.6)",
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: font.medium,
  },
  cardNumber: { color: "#15131F", fontSize: 15, letterSpacing: 1.4, marginTop: 30 },
  cardFoot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 14,
  },
  cardMini: {
    color: "rgba(21,19,31,0.55)",
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: font.medium,
  },
  cardHolder: { color: "#15131F", fontSize: 12, fontFamily: font.semibold, marginTop: 2 },

  actions: { flexDirection: "row", gap: 9, marginTop: 14 },
  action: {
    flex: 1,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: c.glass2,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionLabel: { color: c.text, fontSize: 11.5, fontFamily: font.regular },

  statRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  statCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.035)",
    padding: 15,
  },
  statLabel: { color: c.faint, fontSize: 10.5, letterSpacing: 0.5, fontFamily: font.regular },
  statVal: { fontSize: 16, marginTop: 5, ...tabular },

  chartCard: {
    marginTop: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.border,
    padding: 18,
  },
  spread: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chartTitle: { color: c.text, fontSize: 14, fontFamily: font.medium },
  chartWeeks: { color: c.dim, fontSize: 11, fontFamily: font.regular },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 9, height: 104, marginTop: 16 },
  barCol: { flex: 1, justifyContent: "flex-end", gap: 3 },
  barEarn: { borderRadius: 4, backgroundColor: "#6FBF97" },
  barSpend: { borderRadius: 4, backgroundColor: "#7B74D9" },
  legend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  legendText: { color: c.muted, fontSize: 11.5, fontFamily: font.regular },

  section: {
    color: c.text,
    fontSize: 16,
    fontFamily: font.semibold,
    letterSpacing: -0.3,
    marginTop: 24,
    marginBottom: 12,
  },
  receipts: { borderRadius: 24, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16 },
  purchaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: c.hairline,
  },
  purchasePrompt: { color: c.text, fontSize: 12.5, fontFamily: font.regular },
  purchaseMeta: { color: c.dim, fontSize: 10, marginTop: 3 },
});
