import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { money, otto } from "../../src/api";
import {
  AgentAvatar,
  Mono,
  Screen,
  ScreenTitle,
  Segmented,
  Tag,
  type TagKind,
} from "../../src/components/ui";
import { CHIPS, type Chip, chipMatch, type Gig } from "../../src/data";
import { c, font, grad } from "../../src/theme";

/** A live marketplace agent mapped onto the design's Gig shape (+ serviceId). */
interface LiveGig extends Gig {
  serviceId: string;
}

function tagKind(tag: string): TagKind {
  if (tag === "RUNNING") return "running";
  if (tag === "OPEN") return "open";
  return "accent";
}

export default function Marketplace() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState<"hiring" | "selling">("hiring");
  const [chip, setChip] = useState<Chip>("All");
  const [live, setLive] = useState<LiveGig[]>([]);

  const load = useCallback(async () => {
    try {
      const m = await otto.marketplace();
      setLive(
        m.agents.map((a) => ({
          serviceId: a.id,
          title: a.title,
          agent: a.agent,
          meta: a.meta,
          initials: a.initials,
          price: money(a.price.usdc),
          unit: a.unit,
          tag: a.sell ? "LISTED" : "OPEN",
          rating: a.rating,
          cta: a.sell ? "Simulate sale" : "Hire",
          sell: a.sell,
        })),
      );
    } catch {
      setLive([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const q = query.trim().toLowerCase();
  const source: (Gig | LiveGig)[] = live.length
    ? live.filter((g) => (market === "hiring" ? !g.sell : g.sell))
    : market === "hiring"
      ? []
      : [];
  const gigs = source
    .filter((g) => chipMatch(chip, g))
    .filter((g) => !q || `${g.title} ${g.agent} ${g.unit}`.toLowerCase().includes(q));

  return (
    <Screen>
      <ScreenTitle title="Marketplace" sub="Agents hiring agents" />

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
          placeholder="Search agents and skills"
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

      <Segmented
        style={{ marginTop: 11 }}
        value={market}
        onChange={setMarket}
        options={[
          { value: "hiring", label: "Otto hires" },
          { value: "selling", label: "Otto sells" },
        ]}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 12 }}
        contentContainerStyle={{ gap: 7 }}
      >
        {CHIPS.map((ch) => {
          const on = chip === ch;
          return (
            <Pressable key={ch} onPress={() => setChip(ch)} style={[s.chip, on && s.chipOn]}>
              <Text style={[s.chipText, on && { color: c.text }]}>{ch}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ gap: 11, marginTop: 14 }}>
        {gigs.map((g) => {
          const liveGig = "serviceId" in g ? (g as LiveGig) : null;
          return (
            <GigCard
              key={g.title}
              gig={g}
              onPress={() =>
                liveGig
                  ? router.push({
                      pathname: "/sheet/hire",
                      params: {
                        svc: liveGig.serviceId,
                        agent: liveGig.agent,
                        price: liveGig.price,
                        unit: liveGig.unit,
                        sell: liveGig.sell ? "1" : "0",
                      },
                    })
                  : router.push(`/agent/${encodeURIComponent(g.title)}`)
              }
            />
          );
        })}
        {gigs.length === 0 && <Text style={s.empty}>No agents match “{query}”.</Text>}
      </View>
    </Screen>
  );
}

function GigCard({ gig, onPress }: { gig: Gig; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && { transform: [{ scale: 0.985 }] }}
    >
      <LinearGradient
        colors={grad.card}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.card}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <AgentAvatar initials={gig.initials} sell={gig.sell} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.title}>{gig.title}</Text>
            <Text style={s.meta}>
              {gig.agent} · {gig.meta}
            </Text>
          </View>
          <Tag label={gig.tag} kind={tagKind(gig.tag)} />
        </View>
        <View style={s.cardFoot}>
          <Mono color={gig.sell ? c.earnBright : c.text} style={{ fontSize: 15 }}>
            {gig.price}
          </Mono>
          <Text style={s.unit}>{gig.unit}</Text>
          <View style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Mono style={{ fontSize: 11, color: c.faint }}>★ {gig.rating}</Mono>
            <Text style={s.cta}>{gig.cta}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
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
  title: { color: c.text, fontSize: 14, fontFamily: font.medium, letterSpacing: -0.2 },
  meta: { color: c.faint, fontSize: 11.5, marginTop: 4, fontFamily: font.regular },
  cardFoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: c.hairline,
  },
  unit: { color: c.dim, fontSize: 11, fontFamily: font.regular },
  cta: { color: c.accent2, fontSize: 12, fontFamily: font.medium },

  empty: {
    color: c.faint,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 40,
    fontFamily: font.regular,
  },
});
