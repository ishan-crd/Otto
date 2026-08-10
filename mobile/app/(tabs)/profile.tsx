import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { money, otto, type Policy, type PolicyResponse } from "../../src/api";
import { useAppState } from "../../src/components/AppState";
import { Mono, ProgressBar, Screen } from "../../src/components/ui";

import { c, font, grad, tabular } from "../../src/theme";

/** The three enforced autonomy gates, mapped onto policy keys. */
const POLICY_RULES: { key: keyof Policy; title: string; detail: string }[] = [
  {
    key: "autoHire",
    title: "Hire agents autonomously",
    detail: "Otto may plan tasks and contract marketplace agents on its own",
  },
  {
    key: "autoPay",
    title: "Pay without approval",
    detail: "x402 micropayments settle instantly, inside the firewall budgets",
  },
  {
    key: "sellSkills",
    title: "Sell Otto's skills",
    detail: "Accept inbound paid gigs from other agents",
  },
];

export default function Profile() {
  const { toast } = useAppState();

  const [policy, setPolicy] = useState<PolicyResponse | null>(null);

  const load = useCallback(async () => {
    try {
      setPolicy(await otto.policy());
    } catch {
      setPolicy(null);
    }
  }, []);
  useEffect(() => {
    load();
    const p = setInterval(load, 4000);
    return () => clearInterval(p);
  }, [load]);

  const togglePolicy = async (key: keyof Policy) => {
    if (!policy) return;
    const next = !policy.policy[key];
    try {
      setPolicy(await otto.updatePolicy({ [key]: next }));
      toast(next ? "✓ Autonomy granted" : "✕ Autonomy revoked — Otto is blocked at that gate");
    } catch (err) {
      toast(String(err instanceof Error ? err.message : err));
    }
  };

  const killSwitch = async () => {
    try {
      setPolicy(await otto.updatePolicy({ autoHire: false, autoPay: false, sellSkills: false }));
      toast("🛑 Otto stopped — hiring, paying and selling all revoked");
    } catch (err) {
      toast(String(err instanceof Error ? err.message : err));
    }
  };

  const budget = policy?.firewall.sessionBudget.usdc ?? 50;
  const used = policy?.firewall.sessionSpent.usdc ?? 11.4;
  const pct = Math.min(100, Math.round((100 * used) / Math.max(budget, 0.0001)));

  return (
    <Screen>
      {/* Agent header */}
      <View style={s.head}>
        <View>
          <LinearGradient
            colors={grad.logoMark}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={s.avatar}
          >
            <View style={s.avatarRing} />
          </LinearGradient>
          <View style={s.status} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>Otto</Text>
          <Text style={s.role}>Autonomous agent · pays per task over x402</Text>
          <Mono color={c.accentBright} style={{ fontSize: 11, marginTop: 5 }}>
            USDC · Algorand TestNet
          </Mono>
        </View>
      </View>

      {/* Daily spend ceiling */}
      <LinearGradient
        colors={grad.heroLav}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.ceiling}
      >
        <LinearGradient
          colors={grad.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.ceilingOrb}
          pointerEvents="none"
        />
        <Text style={s.ceilingLabel}>SESSION SPEND CEILING</Text>
        <Mono style={{ fontSize: 30, marginTop: 8, ...tabular }}>{money(budget)}</Mono>
        <ProgressBar pct={pct} height={5} style={{ marginTop: 14 }} />
        <View style={s.ceilingMeta}>
          <Mono style={s.ceilingMetaText}>{money(used)} used</Mono>
          <Mono style={s.ceilingMetaText}>Spend Firewall · live</Mono>
        </View>
      </LinearGradient>

      {/* Autonomy */}
      <Text style={s.section}>Autonomy</Text>
      <LinearGradient
        colors={grad.card}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.rulesCard}
      >
        {policy ? (
          POLICY_RULES.map((r, i) => (
            <Pressable
              key={r.key}
              onPress={() => void togglePolicy(r.key)}
              style={[s.rule, i === POLICY_RULES.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.ruleTitle}>{r.title}</Text>
                <Text style={s.ruleDetail}>{r.detail}</Text>
              </View>
              <Toggle on={Boolean(policy.policy[r.key])} />
            </Pressable>
          ))
        ) : (
          <Text
            style={{
              color: c.faint,
              fontSize: 12,
              paddingVertical: 18,
              textAlign: "center",
              fontFamily: font.regular,
            }}
          >
            Loading policy…
          </Text>
        )}
      </LinearGradient>

      <Pressable
        onPress={() => void killSwitch()}
        style={({ pressed }) => [s.stop, pressed && { transform: [{ scale: 0.98 }] }]}
      >
        <Text style={s.stopText}>Stop Otto now</Text>
      </Pressable>
    </Screen>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <View style={[s.track, { justifyContent: on ? "flex-end" : "flex-start" }]}>
      {on ? (
        <LinearGradient
          colors={["#B3AAFF", "#7E76D6"]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={[s.knob, { backgroundColor: on ? "#15131F" : "rgba(242,241,246,0.55)" }]} />
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 15, marginTop: 8 },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: { width: 20, height: 20, borderRadius: 10, borderWidth: 4, borderColor: "#131320" },
  status: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: c.earn,
    borderWidth: 3,
    borderColor: c.bg,
  },
  name: { color: c.text, fontSize: 20, fontFamily: font.semibold, letterSpacing: -0.4 },
  role: { color: c.faint, fontSize: 12, marginTop: 3, fontFamily: font.regular },

  ceiling: {
    marginTop: 20,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    overflow: "hidden",
  },
  ceilingOrb: {
    position: "absolute",
    right: -60,
    top: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.4,
  },
  ceilingLabel: { color: c.faint, fontSize: 11, letterSpacing: 0.9, fontFamily: font.medium },
  ceilingMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 9 },
  ceilingMetaText: { color: c.faint, fontSize: 10.5 },

  section: {
    color: c.text,
    fontSize: 16,
    fontFamily: font.semibold,
    letterSpacing: -0.3,
    marginTop: 24,
    marginBottom: 12,
  },
  rulesCard: { borderRadius: 24, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16 },
  rule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: c.hairline,
  },
  ruleTitle: { color: c.text, fontSize: 13.5, fontFamily: font.medium },
  ruleDetail: {
    color: "rgba(242,241,246,0.34)",
    fontSize: 11,
    marginTop: 4,
    fontFamily: font.regular,
  },

  track: {
    width: 40,
    height: 23,
    borderRadius: 99,
    padding: 2,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.09)",
    overflow: "hidden",
  },
  knob: { width: 17, height: 17, borderRadius: 9 },

  stop: {
    height: 50,
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,140,130,0.3)",
    backgroundColor: "rgba(255,120,110,0.11)",
    alignItems: "center",
    justifyContent: "center",
  },
  stopText: { color: "#FFC2BB", fontSize: 14, fontFamily: font.medium },
});
