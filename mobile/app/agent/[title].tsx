import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useSheet } from "../../src/components/BottomSheet";
import { MoneyRow, Mono, PrimaryButton } from "../../src/components/ui";
import { agentDetail, findGig, type Row } from "../../src/data";
import { c, font, grad } from "../../src/theme";

export default function AgentDetail() {
  const router = useRouter();
  const sheet = useSheet();
  const { title } = useLocalSearchParams<{ title: string }>();
  const gig = findGig(title ?? "");

  if (!gig) {
    return (
      <View style={[s.root, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: c.muted, fontFamily: font.regular }}>Agent not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: c.accent2, fontFamily: font.medium }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const det = agentDetail(gig.title);
  const history: Row[] = [
    {
      label: `${gig.title} · completed`,
      amount: `−${gig.price}`,
      dir: "out",
      tx: "0x7f21…a4c9",
      time: "Today 09:41",
    },
    {
      label: `${gig.title} · completed`,
      amount: `−${gig.price}`,
      dir: "out",
      tx: "0x5e63…7ab0",
      time: "Yesterday",
    },
    {
      label: "Partial refund · slow delivery",
      amount: "+$0.04",
      dir: "in",
      tx: "0x1f77…c2e0",
      time: "3 Sep",
    },
  ];
  const terms: [string, string, string][] = [
    ["Per completed task", "Charged only on verified delivery", gig.price],
    ["Escrow hold", "Released automatically on delivery", "100%"],
    ["Failed task", "Auto-refunded within 60s", "$0.00"],
  ];

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero image */}
        <View style={s.hero}>
          <LinearGradient
            colors={gig.sell ? grad.agentCard : ["#101018", "#5F587E", "#26243A"]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={["rgba(10,10,11,0.35)", "rgba(10,10,11,0.1)", c.bg]}
            locations={[0, 0.4, 0.98]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={["top"]} style={s.heroTop}>
            <Pressable onPress={() => router.back()} style={s.circleBtn}>
              <Svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke={c.text}
                strokeWidth={2.3}
                strokeLinecap="round"
              >
                <Path d="M15 5l-7 7 7 7" />
              </Svg>
            </Pressable>
            <Pressable style={s.shareBtn}>
              <Text style={s.shareText}>Share</Text>
            </Pressable>
          </SafeAreaView>
          <View style={s.heroFoot}>
            <LinearGradient
              colors={gig.sell ? grad.avatarSell : grad.avatarHire}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={s.bigAvatar}
            >
              <Text style={[s.bigAvatarText, { color: gig.sell ? "#1A1826" : c.accentBright }]}>
                {gig.initials}
              </Text>
            </LinearGradient>
            <View style={{ flex: 1, paddingBottom: 3 }}>
              <Text style={s.agentName}>{gig.agent}</Text>
              <Text style={s.agentSkill}>{gig.title}</Text>
              <Mono color={c.accentBright} style={{ fontSize: 11.5, marginTop: 4 }}>
                ★ {gig.rating} · {gig.meta}
              </Mono>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Stats */}
          <View style={{ flexDirection: "row", gap: 9 }}>
            <Stat label="PRICE" value={`${gig.price} ${gig.unit}`} />
            <Stat label="MEDIAN TIME" value={det.speed} />
            <Stat label="SUCCESS" value={det.success} color={c.earnBright} />
          </View>

          <Text style={s.section}>What it does</Text>
          <Text style={s.about}>{det.about}</Text>

          <View style={s.chips}>
            {det.skills.map((k) => (
              <View key={k} style={s.chip}>
                <Text style={s.chipText}>{k}</Text>
              </View>
            ))}
          </View>

          <Text style={s.section}>How it charges</Text>
          <LinearGradient
            colors={grad.card}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={s.listCard}
          >
            {terms.map(([label, note, value], i) => (
              <View
                key={label}
                style={[s.termRow, i === terms.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.termLabel}>{label}</Text>
                  <Text style={s.termNote}>{note}</Text>
                </View>
                <Mono color={c.accentBright} style={{ fontSize: 13 }}>
                  {value}
                </Mono>
              </View>
            ))}
          </LinearGradient>

          <Text style={s.section}>Recent work for Otto</Text>
          <LinearGradient
            colors={grad.card}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={s.listCard}
          >
            {history.map((r, i) => (
              <MoneyRow key={`${r.tx}-${r.time}`} row={r} last={i === history.length - 1} />
            ))}
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Fixed CTA */}
      <LinearGradient colors={["rgba(10,10,11,0)", c.bg]} locations={[0, 0.46]} style={s.ctaBar}>
        <SafeAreaView edges={["bottom"]}>
          <PrimaryButton
            label={gig.sell ? "Edit listing" : `Hire ${gig.agent}`}
            onPress={() => sheet.open("hire", { agentTitle: gig.title })}
            style={{ height: 56 }}
          />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statLabel}>{label}</Text>
      <Mono color={color ?? c.text} style={{ fontSize: 15, marginTop: 5 }}>
        {value}
      </Mono>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  hero: { height: 250, overflow: "hidden" },
  heroTop: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(10,10,11,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtn: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 21,
    backgroundColor: "rgba(10,10,11,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  shareText: { color: c.text, fontSize: 12.5, fontFamily: font.medium },
  heroFoot: {
    position: "absolute",
    bottom: 16,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
  },
  bigAvatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  bigAvatarText: { fontSize: 17, fontFamily: font.semibold },
  agentName: { color: c.text, fontSize: 22, fontFamily: font.semibold, letterSpacing: -0.5 },
  agentSkill: { color: c.muted, fontSize: 12.5, marginTop: 4, fontFamily: font.regular },

  statCard: {
    flex: 1,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 13,
  },
  statLabel: { color: c.faint, fontSize: 10, letterSpacing: 0.5, fontFamily: font.regular },

  section: {
    color: c.text,
    fontSize: 16,
    fontFamily: font.semibold,
    letterSpacing: -0.3,
    marginTop: 24,
    marginBottom: 9,
  },
  about: { color: c.muted, fontSize: 13.5, lineHeight: 22, fontFamily: font.regular },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(169,160,255,0.22)",
    backgroundColor: "rgba(169,160,255,0.1)",
  },
  chipText: { color: c.accentBright, fontSize: 12, fontFamily: font.regular },

  listCard: { borderRadius: 24, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16 },
  termRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.hairline,
  },
  termLabel: { color: c.text, fontSize: 13, fontFamily: font.regular },
  termNote: {
    color: "rgba(242,241,246,0.34)",
    fontSize: 11,
    marginTop: 3,
    fontFamily: font.regular,
  },

  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
