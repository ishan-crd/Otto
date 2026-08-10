import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { SheetScreen, sheetStyles as ss } from "../../src/components/GlassSheet";
import { Mono } from "../../src/components/ui";
import { c, font, tabular } from "../../src/theme";

export default function ReceiptSheet() {
  const p = useLocalSearchParams<{
    label: string;
    amount: string;
    dir: string;
    tx: string;
    time: string;
  }>();
  const inbound = p.dir === "in";

  return (
    <SheetScreen>
      <View style={{ alignItems: "center" }}>
        <View
          style={[
            ss.receiptGlyph,
            inbound
              ? { backgroundColor: "rgba(143,227,180,0.09)", borderColor: "rgba(143,227,180,0.2)" }
              : { backgroundColor: "rgba(169,160,255,0.09)", borderColor: "rgba(169,160,255,0.2)" },
          ]}
        >
          <Text style={{ color: inbound ? c.earn : c.accent2, fontSize: 20 }}>
            {inbound ? "↑" : "↓"}
          </Text>
        </View>
        <Mono
          color={inbound ? c.earnBright : c.accentBright}
          style={{ fontSize: 32, marginTop: 14, ...tabular }}
        >
          {p.amount}
        </Mono>
        <Text style={{ color: c.muted, fontSize: 13.5, marginTop: 6, fontFamily: font.regular }}>
          {p.label}
        </Text>
      </View>
      <View style={ss.receiptCard}>
        <Line label="Status" value="Settled" valueColor={c.earnBright} />
        <Line label="Receipt" value={p.tx} mono />
        <Line label="Time" value={p.time} mono />
        <Line label="Network" value="USDC · Base" mono last />
      </View>
    </SheetScreen>
  );
}

function Line({
  label,
  value,
  valueColor,
  mono,
  last,
}: {
  label: string;
  value: string;
  valueColor?: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[ss.receiptLine, last && { borderBottomWidth: 0 }]}>
      <Text style={ss.rowLabel}>{label}</Text>
      {mono ? (
        <Mono style={{ fontSize: 12.5 }}>{value}</Mono>
      ) : (
        <Text style={{ color: valueColor ?? c.text, fontSize: 12.5, fontFamily: font.regular }}>
          {value}
        </Text>
      )}
    </View>
  );
}
