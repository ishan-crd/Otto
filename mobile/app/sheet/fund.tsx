import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SheetScreen, SheetTitle, sheetStyles as ss } from "../../src/components/GlassSheet";
import { Mono, PrimaryButton } from "../../src/components/ui";
import { FUND_AMOUNTS } from "../../src/data";
import { c, tabular } from "../../src/theme";

export default function FundSheet() {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(500);
  const amountStr = `$${amount.toLocaleString("en-US")}.00`;

  return (
    <SheetScreen>
      <SheetTitle title="Add funds" sub="Otto draws from this balance to pay other agents." />
      <View style={{ alignItems: "center", marginVertical: 22 }}>
        <Mono style={{ fontSize: 38, ...tabular }}>{amountStr}</Mono>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {FUND_AMOUNTS.map((v) => {
          const on = amount === v;
          return (
            <Pressable
              key={v}
              onPress={() => setAmount(v)}
              style={[ss.amountChip, on && ss.amountChipOn]}
            >
              <Mono color={on ? c.text : c.muted} style={{ fontSize: 13 }}>
                ${v.toLocaleString("en-US")}
              </Mono>
            </Pressable>
          );
        })}
      </View>
      <View style={ss.railRow}>
        <View style={ss.railGlyph}>
          <Text style={{ color: c.accentBright, fontSize: 14 }}>⌁</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ss.railName}>Mercury ···8821</Text>
          <Text style={ss.railNote}>ACH · arrives instantly</Text>
        </View>
        <Text style={ss.link}>Change</Text>
      </View>
      <PrimaryButton label={`Add ${amountStr}`} onPress={() => router.back()} style={ss.cta} />
    </SheetScreen>
  );
}
