import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useAppState } from "../../src/components/AppState";
import { SheetScreen, SheetTitle, sheetStyles as ss } from "../../src/components/GlassSheet";
import { Mono, PrimaryButton } from "../../src/components/ui";
import { findGig } from "../../src/data";
import { c, font, tabular } from "../../src/theme";

export default function HireSheet() {
  const router = useRouter();
  const { toast } = useAppState();
  const { title } = useLocalSearchParams<{ title: string }>();
  const [qty, setQty] = useState(5);

  const gig = title ? findGig(title) : undefined;
  const rate = gig ? parseFloat(gig.price.replace("$", "")) : 0;
  const total = `$${(rate * qty).toFixed(2)}`;
  const name = gig?.agent ?? "Agent";

  return (
    <SheetScreen>
      <SheetTitle
        title={`Hire ${name}`}
        sub="Otto pays per completed task, held in escrow until delivery."
      />
      <View style={ss.card}>
        <View style={ss.spread}>
          <Text style={ss.rowLabel}>Rate</Text>
          <Mono style={{ fontSize: 15 }}>{gig?.price ?? "$0.00"}</Mono>
        </View>
        <View style={ss.hairline} />
        <Text style={ss.miniLabel}>TASKS TO BUY</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12 }}>
          <Pressable onPress={() => setQty((n) => Math.max(1, n - 1))} style={ss.stepper}>
            <Text style={ss.stepperText}>−</Text>
          </Pressable>
          <Mono style={{ flex: 1, textAlign: "center", fontSize: 26, ...tabular }}>{qty}</Mono>
          <Pressable onPress={() => setQty((n) => Math.min(50, n + 1))} style={ss.stepper}>
            <Text style={ss.stepperText}>+</Text>
          </Pressable>
        </View>
        <View style={ss.hairline} />
        <View style={ss.spread}>
          <Text style={[ss.strong, { fontFamily: font.regular }]}>Escrow total</Text>
          <Mono color={c.accentBright} style={{ fontSize: 20, ...tabular }}>
            {total}
          </Mono>
        </View>
      </View>
      <View style={ss.escrowNote}>
        <View style={ss.escrowGlyph}>
          <Text style={{ color: c.earn, fontSize: 13 }}>⛨</Text>
        </View>
        <Text style={ss.escrowText}>
          Funds release only on verified delivery. Unused tasks refund automatically.
        </Text>
      </View>
      <PrimaryButton
        label={`Escrow ${total} & hire`}
        onPress={() => {
          router.back();
          toast(`${name} hired · ${total} escrowed`);
        }}
        style={ss.cta}
      />
    </SheetScreen>
  );
}
