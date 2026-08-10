import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAppState } from "../../src/components/AppState";
import { SheetScreen, SheetTitle, sheetStyles as ss } from "../../src/components/GlassSheet";
import { WALLETS } from "../../src/data";
import { c, font } from "../../src/theme";

export default function ConnectSheet() {
  const router = useRouter();
  const { connected, connect } = useAppState();

  return (
    <SheetScreen>
      <SheetTitle title="Connect a wallet" sub="Otto settles agent-to-agent payments in USDC." />
      <View style={{ gap: 9, marginTop: 16 }}>
        {WALLETS.map((w) => {
          const on = connected.includes(w.key);
          return (
            <Pressable
              key={w.key}
              onPress={() => {
                connect(w.key, w.name);
                router.back();
              }}
              style={[ss.railRow, { marginTop: 0 }]}
            >
              <View
                style={[
                  ss.railGlyph,
                  on ? {} : { backgroundColor: "rgba(255,255,255,0.05)", borderColor: c.border },
                ]}
              >
                <Text style={{ color: on ? c.accentBright : c.muted, fontSize: 14 }}>
                  {w.glyph}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ss.railName}>{w.name}</Text>
                <Text style={ss.railNote}>{w.note}</Text>
              </View>
              <View
                style={[
                  ss.statePill,
                  on
                    ? {
                        backgroundColor: "rgba(143,227,180,0.08)",
                        borderColor: "rgba(143,227,180,0.18)",
                      }
                    : {
                        backgroundColor: "rgba(169,160,255,0.1)",
                        borderColor: "rgba(169,160,255,0.22)",
                      },
                ]}
              >
                <Text
                  style={{
                    color: on ? c.earn : c.accentBright,
                    fontSize: 9.5,
                    fontFamily: font.medium,
                    letterSpacing: 0.5,
                  }}
                >
                  {on ? "CONNECTED" : "CONNECT"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text style={ss.finePrint}>
        Otto can only spend inside the limits you set. You keep the keys.
      </Text>
    </SheetScreen>
  );
}
