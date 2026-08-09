import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { otto, type WalletSnapshot } from "../src/api";
import {
  SHEET_PADDING_X,
  SheetContainer,
  SheetDivider,
  SheetHeader,
} from "../src/components/GlassSheet";
import { c, mono, space, tabular, usd } from "../src/theme";

export default function Breakdown() {
  const router = useRouter();
  const [w, setW] = useState<WalletSnapshot | null>(null);

  useEffect(() => {
    otto
      .wallet()
      .then(setW)
      .catch(() => {});
  }, []);

  return (
    <SheetContainer scroll={false}>
      <SheetHeader
        title="Wallet breakdown"
        subtitle={`rail · ${w?.rail ?? "…"}`}
        onClose={() => router.back()}
      />
      <View style={{ paddingHorizontal: SHEET_PADDING_X, paddingTop: space.md }}>
        <Row label="Topped up" value={usd(w?.toppedUp.usdc ?? 0)} color={c.text} />
        <SheetDivider />
        <Row label="Earned" value={`+ ${usd(w?.earned.usdc ?? 0)}`} color={c.earn} />
        <SheetDivider />
        <Row label="Spent" value={`− ${usd(w?.spent.usdc ?? 0)}`} color={c.spend} />
        <SheetDivider />
        <Row label="Balance" value={usd(w?.balance.usdc ?? 0)} color={c.text} strong />
      </View>
    </SheetContainer>
  );
}

function Row({
  label,
  value,
  color,
  strong,
}: {
  label: string;
  value: string;
  color: string;
  strong?: boolean;
}) {
  return (
    <View style={st.row}>
      <Text style={[st.label, strong && { color: c.text, fontWeight: "700" }]}>{label}</Text>
      <Text style={[st.value, { color }, strong && { fontSize: 18 }]}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: { color: c.muted, fontSize: 14 },
  value: { fontFamily: mono, fontSize: 15, fontWeight: "600", ...tabular },
});
