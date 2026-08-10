import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ACCOUNT_EXPLORER,
  type LiveInfo,
  type LiveService,
  type LiveStatus,
  money,
  otto,
  PAY_URL,
  shortTx,
} from "../src/api";
import { useAppState } from "../src/components/AppState";
import { GhostButton, LiveDot, Mono, PrimaryButton } from "../src/components/ui";
import { c, font, tabular } from "../src/theme";

interface PayResult {
  ok: boolean;
  tx?: string;
  explorerUrl?: string;
  detail?: string;
}

/**
 * The live x402 pay page, native. Mirrors web /pay: Otto's account checklist +
 * one-tap opt-in, and each paid service with an "Otto pays (demo)" button that
 * runs the full 402 → sign → verify → settle loop with Otto's own key and
 * returns the real on-chain tx. Wallet-signing (Pera/Lute) opens the browser
 * page, since Algorand wallet-connect isn't available natively.
 */
export default function PayScreen() {
  const router = useRouter();
  const { toast } = useAppState();
  const [info, setInfo] = useState<LiveInfo | null>(null);
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [services, setServices] = useState<LiveService[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, PayResult>>({});

  const refresh = useCallback(async () => {
    try {
      const s = await otto.liveStatus();
      setStatus(s);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    otto
      .liveInfo()
      .then(setInfo)
      .catch(() => {});
    otto
      .liveServices()
      .then((r) => setServices(r.services))
      .catch(() => {});
    void refresh();
    const p = setInterval(refresh, 5000);
    return () => clearInterval(p);
  }, [refresh]);

  const addr = info?.receiver ?? "";
  const ready = status?.funded && status?.optedIn;

  const optIn = async () => {
    if (busy) return;
    setBusy("optin");
    try {
      const res = await otto.optin();
      toast(`✓ Opted in · ${res.txId ? res.txId.slice(0, 8) : ""}…`);
      await refresh();
    } catch (err) {
      toast(String(err instanceof Error ? err.message : err));
    } finally {
      setBusy(null);
    }
  };

  const pay = async (svc: LiveService) => {
    if (busy) return;
    setBusy(svc.id);
    try {
      const res = await otto.selfPay(svc.id);
      const settle = (res.settle ?? {}) as { txId?: string; explorerUrl?: string };
      setResults((r) => ({
        ...r,
        [svc.id]: { ok: true, tx: settle.txId, explorerUrl: settle.explorerUrl },
      }));
      toast(`✓ Otto paid ${svc.price} · ${settle.txId ? shortTx(settle.txId) : "settled"}`);
      await refresh();
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setResults((r) => ({ ...r, [svc.id]: { ok: false, detail } }));
      toast(`Payment failed — ${detail}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Live x402</Text>
          <Text style={s.sub}>Real USDC micropayments on Algorand TestNet</Text>
        </View>
        <View style={s.netChip}>
          <LiveDot color={ready ? c.earn : "#FFCE7A"} />
          <Text style={s.netText}>TestNet</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
      >
        {/* Otto's account checklist */}
        <View style={s.card}>
          <Text style={s.miniLabel}>OTTO'S ACCOUNT</Text>
          <Mono selectable style={s.addr}>
            {addr || "resolving…"}
          </Mono>
          <View style={s.tiles}>
            <View style={s.tile}>
              <Text style={s.tileLabel}>USDC</Text>
              <Mono color={c.earnBright} style={s.tileVal}>
                {status ? money(status.usdc) : "—"}
              </Mono>
            </View>
            <View style={s.tile}>
              <Text style={s.tileLabel}>ALGO (GAS)</Text>
              <Mono style={s.tileVal}>{status ? status.algo.toFixed(3) : "—"}</Mono>
            </View>
          </View>
          <View style={{ gap: 9, marginTop: 14 }}>
            <Check ok={Boolean(status?.funded)} label="Funded with test ALGO" />
            <Check ok={Boolean(status?.optedIn)} label="Opted in to USDC" />
          </View>

          {status?.funded && !status?.optedIn ? (
            <PrimaryButton
              label={busy === "optin" ? "Opting in…" : "Opt in to USDC"}
              loading={busy === "optin"}
              onPress={() => void optIn()}
              style={{ marginTop: 14, height: 48 }}
            />
          ) : null}
          {!status?.funded ? (
            <GhostButton
              label="Fund with test ALGO ↗"
              onPress={() => void Linking.openURL("https://bank.testnet.algorand.network/")}
              style={{ marginTop: 12, height: 48 }}
            />
          ) : null}
          {!status?.optedIn || !status?.funded ? null : (
            <Text style={s.ready}>Ready — Otto can settle real USDC below.</Text>
          )}
        </View>

        {/* Live services */}
        <Text style={s.section}>Otto's paid skills</Text>
        {services.map((svc) => {
          const r = results[svc.id];
          return (
            <View key={svc.id} style={s.svc}>
              <View style={s.spread}>
                <Text style={s.svcTitle}>{svc.description}</Text>
                <Mono color={c.accentBright} style={{ fontSize: 13 }}>
                  {svc.price}
                </Mono>
              </View>
              <PrimaryButton
                label={busy === svc.id ? "Paying…" : "Otto pays (demo)"}
                loading={busy === svc.id}
                onPress={() => void pay(svc)}
                style={{ marginTop: 13, height: 46 }}
              />
              {r?.ok ? (
                <Pressable
                  onPress={() => r.explorerUrl && void Linking.openURL(r.explorerUrl)}
                  style={s.receipt}
                >
                  <Text style={s.receiptText}>
                    ✓ Settled on-chain{r.tx ? ` · ${shortTx(r.tx)}` : ""} {r.explorerUrl ? "↗" : ""}
                  </Text>
                </Pressable>
              ) : r?.detail ? (
                <Text style={s.err}>{r.detail}</Text>
              ) : null}
            </View>
          );
        })}

        <Text style={s.finePrint}>
          Trust Wallet and MetaMask are Ethereum wallets — they can't sign Algorand transactions.
          Use “Otto pays (demo)” above, or open the browser page to pay with Pera / Lute.
        </Text>
        <GhostButton
          label="Open browser pay page (Pera / Lute) ↗"
          onPress={() => void Linking.openURL(PAY_URL)}
          style={{ marginTop: 12, height: 48 }}
        />
        <Pressable
          onPress={() => addr && void Linking.openURL(ACCOUNT_EXPLORER + addr)}
          style={{ marginTop: 14, alignItems: "center" }}
        >
          <Text style={s.link}>View Otto's account on explorer ↗</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
      <View
        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ok ? c.earn : "#FFCE7A" }}
      />
      <Text style={{ color: c.muted, fontSize: 12.5, fontFamily: font.regular }}>
        {ok ? "✓ " : "○ "}
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
  },
  back: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  backText: { color: c.text, fontSize: 30, fontFamily: font.regular, marginTop: -4 },
  title: { color: c.text, fontSize: 20, fontFamily: font.semibold, letterSpacing: -0.3 },
  sub: { color: c.faint, fontSize: 12, marginTop: 2, fontFamily: font.regular },
  netChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  netText: { color: c.muted, fontSize: 11.5, fontFamily: font.regular },

  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 20,
  },
  miniLabel: { color: c.faint, fontSize: 11, letterSpacing: 0.9, fontFamily: font.medium },
  addr: { fontSize: 12.5, marginTop: 8, lineHeight: 18, color: c.text },
  tiles: { flexDirection: "row", gap: 10, marginTop: 16 },
  tile: {
    flex: 1,
    padding: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  tileLabel: { color: c.faint, fontSize: 9.5, letterSpacing: 0.5, fontFamily: font.medium },
  tileVal: { fontSize: 17, marginTop: 5, ...tabular },
  ready: { color: c.earn, fontSize: 12, marginTop: 14, fontFamily: font.regular },

  section: {
    color: c.text,
    fontSize: 16,
    fontFamily: font.semibold,
    letterSpacing: -0.3,
    marginTop: 24,
    marginBottom: 12,
  },
  svc: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.028)",
    padding: 16,
    marginBottom: 12,
  },
  spread: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  svcTitle: { flex: 1, color: c.text, fontSize: 13, fontFamily: font.medium, lineHeight: 18 },
  receipt: {
    marginTop: 12,
    padding: 11,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(143,227,180,0.2)",
    backgroundColor: "rgba(143,227,180,0.06)",
  },
  receiptText: { color: c.earnBright, fontSize: 11.5, fontFamily: font.mono },
  err: {
    color: "#FFC2BB",
    fontSize: 11.5,
    marginTop: 10,
    fontFamily: font.regular,
    lineHeight: 16,
  },

  finePrint: {
    color: c.dim,
    fontSize: 11.5,
    marginTop: 22,
    lineHeight: 18,
    fontFamily: font.regular,
  },
  link: { color: c.accent2, fontSize: 12.5, fontFamily: font.medium },
});
