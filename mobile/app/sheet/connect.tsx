import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { ACCOUNT_EXPLORER, money, otto, PAY_URL } from "../../src/api";
import { useAppState } from "../../src/components/AppState";
import { SheetScreen, SheetTitle, sheetStyles as ss } from "../../src/components/GlassSheet";
import { GhostButton, Mono, PrimaryButton } from "../../src/components/ui";
import { c, font, tabular } from "../../src/theme";

/**
 * Connect wallet — the mobile twin of the web dashboard's wallet button. Otto's
 * Algorand TestNet account is auto-provisioned server-side; connecting surfaces
 * it here with live status (funded / opted-in / USDC), a one-tap USDC opt-in,
 * faucet + explorer links, and disconnect.
 */
export default function ConnectSheet() {
  const router = useRouter();
  const {
    walletConnected,
    liveInfo,
    liveStatus,
    connectWallet,
    disconnectWallet,
    refreshWallet,
    toast,
  } = useAppState();
  const [busy, setBusy] = useState(false);

  const addr = liveInfo?.receiver ?? "";
  const ready = liveStatus?.funded && liveStatus?.optedIn;

  const optIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await otto.optin();
      toast(`✓ Opted in to USDC · ${res.txId ? res.txId.slice(0, 8) : ""}…`);
      await refreshWallet();
    } catch (err) {
      toast(String(err instanceof Error ? err.message : err));
    } finally {
      setBusy(false);
    }
  };

  if (!walletConnected) {
    return (
      <SheetScreen>
        <SheetTitle
          title="Connect wallet"
          sub="Otto has its own Algorand TestNet account. Connect to see its balance and pay live."
        />
        <View style={[ss.card, { gap: 10 }]}>
          <Text
            style={{ color: c.muted, fontSize: 12.5, lineHeight: 18, fontFamily: font.regular }}
          >
            No browser extension needed — the account is provisioned for you. Once connected you can
            fund it from the faucet, opt in to USDC, and let Otto settle real x402 micropayments.
          </Text>
        </View>
        <PrimaryButton
          label="Connect Otto's wallet"
          onPress={() => {
            void connectWallet();
          }}
          style={ss.cta}
        />
        <Text style={ss.finePrint}>
          Trust Wallet and MetaMask are Ethereum wallets — they can't sign Algorand transactions, so
          they won't work here. Use this account, or Pera / Lute on the live pay page.
        </Text>
      </SheetScreen>
    );
  }

  return (
    <SheetScreen>
      <SheetTitle title="Otto's account" sub="Algorand TestNet · USDC settlement" />

      <View style={[ss.card, { gap: 14 }]}>
        <View>
          <Text style={ss.miniLabel}>ACCOUNT ADDRESS</Text>
          <Mono selectable style={{ fontSize: 12.5, marginTop: 6, lineHeight: 18, color: c.text }}>
            {addr || "resolving…"}
          </Mono>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Tile
            label="USDC BALANCE"
            value={liveStatus ? money(liveStatus.usdc) : "—"}
            accent={c.earnBright}
          />
          <Tile
            label="ALGO (GAS)"
            value={liveStatus ? liveStatus.algo.toFixed(3) : "—"}
            accent={c.text}
          />
        </View>
        <View style={{ gap: 9 }}>
          <StatusRow ok={Boolean(liveStatus?.funded)} label="Funded with test ALGO" />
          <StatusRow ok={Boolean(liveStatus?.optedIn)} label="Opted in to USDC" />
        </View>
      </View>

      {liveStatus?.funded && !liveStatus?.optedIn ? (
        <PrimaryButton
          label={busy ? "Opting in…" : "Opt in to USDC"}
          loading={busy}
          onPress={() => void optIn()}
          style={ss.cta}
        />
      ) : null}

      {!liveStatus?.funded ? (
        <GhostButton
          label="Fund with test ALGO ↗"
          onPress={() => void Linking.openURL("https://bank.testnet.algorand.network/")}
          style={{ marginTop: 12, height: 50 }}
        />
      ) : null}

      <View style={{ flexDirection: "row", gap: 9, marginTop: 12 }}>
        <GhostButton
          label="Explorer ↗"
          onPress={() => void Linking.openURL(ACCOUNT_EXPLORER + addr)}
          style={{ flex: 1, height: 50 }}
        />
        <GhostButton
          label="Pay via Pera / Lute ↗"
          onPress={() => void Linking.openURL(PAY_URL)}
          style={{ flex: 1, height: 50 }}
        />
      </View>

      <GhostButton
        label="Disconnect"
        danger
        onPress={() => {
          disconnectWallet();
          router.back();
        }}
        style={{ marginTop: 12, height: 50 }}
      />

      {ready ? (
        <Text style={[ss.finePrint, { color: c.earn }]}>
          Ready — Otto can settle real USDC micropayments on TestNet.
        </Text>
      ) : null}
    </SheetScreen>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View
      style={{
        flex: 1,
        padding: 13,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      <Text style={{ color: c.faint, fontSize: 9.5, letterSpacing: 0.5, fontFamily: font.medium }}>
        {label}
      </Text>
      <Mono color={accent} style={{ fontSize: 17, marginTop: 5, ...tabular }}>
        {value}
      </Mono>
    </View>
  );
}

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: ok ? c.earn : "#FFCE7A",
        }}
      />
      <Text style={{ color: c.muted, fontSize: 12.5, fontFamily: font.regular }}>
        {ok ? "✓ " : "○ "}
        {label}
      </Text>
    </View>
  );
}
