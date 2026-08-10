import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Mono, Screen, ScreenTitle, Tag } from "../../src/components/ui";
import { type CatalogModel, MODEL_CATALOG, MODEL_SPECS } from "../../src/modelsCatalog";
import { c, font, grad } from "../../src/theme";

/**
 * Marketplace — the models Otto can hire, with what each specialises in
 * (mirrors the web /models catalog, shortened for mobile). Otto picks one per
 * job and pays it per call over x402.
 */
export default function Marketplace() {
  const [query, setQuery] = useState("");
  const [spec, setSpec] = useState<string>("All");

  const q = query.trim().toLowerCase();
  const models = MODEL_CATALOG.filter((m) => spec === "All" || m.spec === spec).filter(
    (m) => !q || `${m.name} ${m.id} ${m.spec}`.toLowerCase().includes(q),
  );

  return (
    <Screen>
      <ScreenTitle title="Marketplace" sub="The models Otto hires — paid per call over x402" />

      <View style={s.search}>
        <Svg
          width={17}
          height={17}
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(242,241,246,0.42)"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <Circle cx={11} cy={11} r={6.5} />
          <Path d="M16 16l4 4" />
        </Svg>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search models — try “reasoning”, “video”…"
          placeholderTextColor="rgba(242,241,246,0.4)"
          keyboardAppearance="dark"
          style={s.searchInput}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8} style={s.clear}>
            <Text style={{ color: c.muted, fontSize: 11 }}>✕</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 12 }}
        contentContainerStyle={{ gap: 7 }}
      >
        {MODEL_SPECS.map((sp) => {
          const on = spec === sp;
          return (
            <Pressable key={sp} onPress={() => setSpec(sp)} style={[s.chip, on && s.chipOn]}>
              <Text style={[s.chipText, on && { color: c.text }]}>{sp}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ gap: 11, marginTop: 14 }}>
        {models.map((m) => (
          <ModelCard key={m.id} m={m} />
        ))}
        {models.length === 0 && <Text style={s.empty}>No models match “{query}”.</Text>}
      </View>
    </Screen>
  );
}

const initials = (provider: string) =>
  provider
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const fmtPrice = (n: number) => (n === 0 ? "free" : `$${n < 0.01 ? n.toFixed(3) : n.toFixed(2)}`);
const fmtCtx = (n: number) => (n >= 1000000 ? `${n / 1000000}M` : `${Math.round(n / 1000)}K`);

function ModelCard({ m }: { m: CatalogModel }) {
  return (
    <LinearGradient
      colors={grad.card}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={s.card}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials(m.provider)}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.title} numberOfLines={1}>
            {m.name}
          </Text>
          <Mono style={s.modelId}>{m.id}</Mono>
        </View>
        <Tag label={m.spec.toUpperCase()} kind={m.inM === 0 ? "running" : "accent"} />
      </View>
      <View style={s.cardFoot}>
        <Mono color={m.inM === 0 ? c.earnBright : c.text} style={{ fontSize: 14 }}>
          {fmtPrice(m.inM)}
        </Mono>
        <Text style={s.unit}>/M in</Text>
        <Mono color={c.spend} style={{ fontSize: 14, marginLeft: 8 }}>
          {fmtPrice(m.outM)}
        </Mono>
        <Text style={s.unit}>/M out</Text>
        <Mono style={{ marginLeft: "auto", fontSize: 11, color: c.faint }}>
          {fmtCtx(m.ctx)} ctx
        </Mono>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    height: 46,
    paddingHorizontal: 15,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.045)",
    marginTop: 16,
  },
  searchInput: { flex: 1, color: c.text, fontSize: 13.5, fontFamily: font.regular },
  clear: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  chipOn: { backgroundColor: "rgba(169,160,255,0.16)", borderColor: "rgba(169,160,255,0.24)" },
  chipText: { color: c.muted, fontSize: 12.5, fontFamily: font.regular },

  card: { borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 16 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "#22212E",
  },
  avatarText: { color: c.accentBright, fontSize: 12, fontFamily: font.semibold },
  title: { color: c.text, fontSize: 14, fontFamily: font.medium, letterSpacing: -0.2 },
  modelId: { color: c.dim, fontSize: 9.5, marginTop: 4 },
  cardFoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: c.hairline,
  },
  unit: { color: c.dim, fontSize: 10.5, fontFamily: font.regular },

  empty: {
    color: c.faint,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 40,
    fontFamily: font.regular,
  },
});
