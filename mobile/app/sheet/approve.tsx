import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SheetScreen, SheetTitle, sheetStyles as ss } from "../../src/components/GlassSheet";
import { Mono, PrimaryButton } from "../../src/components/ui";
import { c, tabular } from "../../src/theme";

const ROWS: [string, string, boolean][] = [
  ["Flights · TAP 1046", "$842.00", false],
  ["Hotel · Casa Amalia, 5n", "$441.05", false],
  ["Agent fees", "$1.15", true],
];

export default function ApproveSheet() {
  const router = useRouter();
  return (
    <SheetScreen>
      <SheetTitle
        title="Approve booking"
        sub="Otto will charge your card and confirm with the airline and hotel."
      />
      <View style={[ss.card, { gap: 11 }]}>
        {ROWS.map(([label, val, lav]) => (
          <View key={label} style={ss.spread}>
            <Text style={ss.rowLabel}>{label}</Text>
            <Mono color={lav ? c.accentBright : c.text} style={{ fontSize: 13 }}>
              {val}
            </Mono>
          </View>
        ))}
        <View style={[ss.hairline, { marginVertical: 0 }]} />
        <View style={ss.spread}>
          <Text style={ss.strong}>Total</Text>
          <Mono style={{ fontSize: 21, ...tabular }}>$1,284.20</Mono>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 9, marginTop: 16 }}>
        <Pressable onPress={() => router.back()} style={[ss.secondaryBtn, { flex: 1 }]}>
          <Text style={ss.secondaryText}>Not yet</Text>
        </Pressable>
        <PrimaryButton label="Confirm & pay" onPress={() => router.back()} style={{ flex: 1.4 }} />
      </View>
    </SheetScreen>
  );
}
