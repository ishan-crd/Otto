import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SheetScreen, SheetTitle, sheetStyles as ss } from "../../src/components/GlassSheet";
import { Mono, PrimaryButton } from "../../src/components/ui";
import { c, tabular } from "../../src/theme";

export default function WithdrawSheet() {
  const router = useRouter();
  return (
    <SheetScreen>
      <SheetTitle title="Withdraw earnings" sub="Available now — escrowed funds stay with Otto." />
      <View style={ss.withdrawCard}>
        <Text style={ss.miniLabel}>WITHDRAWABLE</Text>
        <Mono color={c.earnBright} style={{ fontSize: 34, marginTop: 7, ...tabular }}>
          $1,266.20
        </Mono>
        <Text style={ss.railNote}>$18.40 held in open escrows</Text>
      </View>
      <View style={{ gap: 9 }}>
        <View
          style={[
            ss.railRow,
            {
              marginTop: 0,
              borderColor: "rgba(169,160,255,0.22)",
              backgroundColor: "rgba(169,160,255,0.08)",
            },
          ]}
        >
          <View style={ss.railGlyph}>
            <Text style={{ color: c.accentBright, fontSize: 14 }}>⌁</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ss.railName}>Mercury ···8821</Text>
            <Text style={ss.railNote}>1–2 business days · no fee</Text>
          </View>
          <View style={ss.check}>
            <Text style={{ color: "#15131F", fontSize: 10 }}>✓</Text>
          </View>
        </View>
        <View style={[ss.railRow, { marginTop: 0 }]}>
          <View
            style={[
              ss.railGlyph,
              { backgroundColor: "rgba(255,255,255,0.06)", borderColor: c.border },
            ]}
          >
            <Text style={{ color: c.muted, fontSize: 14 }}>◈</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ss.railName}>Base wallet 0x4c…9f2</Text>
            <Text style={ss.railNote}>USDC · ~2s · $0.01 network fee</Text>
          </View>
        </View>
      </View>
      <PrimaryButton label="Withdraw $1,266.20" onPress={() => router.back()} style={ss.cta} />
    </SheetScreen>
  );
}
