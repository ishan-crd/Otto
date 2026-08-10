import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { money, otto } from "../../src/api";
import { useAppState } from "../../src/components/AppState";
import { Mono, ProgressBar, Screen } from "../../src/components/ui";
import {
  type EcoModel,
  type EconomyPlan,
  initials,
  planEconomy,
  type SubTask,
  stars,
  tierModels,
} from "../../src/economy";
import { c, font, grad, tabular, usd } from "../../src/theme";

type Phase = "queued" | "sourcing" | "candidates" | "hiring" | "delivering" | "done" | "blocked";
const BUDGET_CHIPS = [2, 5, 10, 25];
const EXAMPLES = [
  "Develop a mobile app for Otto",
  "Launch a marketing campaign with recurring posts and AI creator videos",
  "Write a research report on quantum computing",
];

export default function Home() {
  const router = useRouter();
  const { walletConnected, liveStatus } = useAppState();
  const [mode, setMode] = useState<"intro" | "run">("intro");
  const [goal, setGoal] = useState("");
  const [budgetText, setBudgetText] = useState("10.00");
  const [plan, setPlan] = useState<EconomyPlan | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [spent, setSpent] = useState(0);
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState<"work" | "pay" | "done">("work");
  const [finished, setFinished] = useState(false);
  const [models, setModels] = useState<EcoModel[]>([]);
  const useModels = models.length > 0;

  // Pull the live OpenRouter catalog so Otto hires real models per role.
  useEffect(() => {
    otto
      .models()
      .then((r) => setModels(tierModels(r.models)))
      .catch(() => {});
  }, []);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const planRef = useRef<EconomyPlan | null>(null);
  const clearTimers = useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const t = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  const setPhase = useCallback((i: number, ph: Phase) => {
    setPhases((prev) => prev.map((p, idx) => (idx === i ? ph : p)));
  }, []);

  const finish = useCallback(() => {
    const p = planRef.current;
    setFinished(true);
    if (p?.blocked) setStatusKind("pay");
    else setStatusKind("done");
    setStatus(
      p?.blocked
        ? "Stopped by the spend firewall — within budget."
        : "Task complete — every hire delivered.",
    );
  }, []);

  const runSub = useCallback(
    (i: number) => {
      const p = planRef.current;
      if (!p || i >= p.subs.length) return finish();
      const sub = p.subs[i];
      setPhase(i, "sourcing");
      setStatusKind("work");
      setStatus(
        useModels ? "Going through OpenRouter models…" : `Sourcing agents for ${sub.title}…`,
      );
      t(900, () => {
        setPhase(i, "candidates");
        setStatus(`Comparing models for ${sub.title}…`);
        t(1450, () => {
          if (sub.blocked) {
            setPhases((prev) => prev.map((ph, idx) => (idx >= i ? "blocked" : ph)));
            setStatusKind("pay");
            setStatus(`🛑 Spend firewall — ${p.blocked ?? "budget exhausted"}`);
            t(750, finish);
            return;
          }
          const pick = sub.cands[sub.pickIdx];
          setPhase(i, "hiring");
          setStatusKind("pay");
          setStatus(`${useModels ? "Using" : "Hiring"} ${pick.name} · ${usd(sub.price)}`);
          t(1150, () => {
            setPhase(i, "delivering");
            setStatusKind("work");
            setStatus(`${pick.name} is working…`);
            t(1300, () => {
              setPhase(i, "done");
              setSpent((s) => s + sub.price);
              setStatusKind("done");
              setStatus(`${pick.name} delivered · ★${pick.rating.toFixed(2)}`);
              t(650, () => runSub(i + 1));
            });
          });
        });
      });
    },
    [finish, t, setPhase, useModels],
  );

  const start = useCallback(
    (g: string) => {
      const goalStr = g.trim();
      if (!goalStr) return;
      clearTimers();
      const budget = Number.parseFloat(budgetText);
      const built = planEconomy(
        goalStr,
        Number.isFinite(budget) && budget > 0 ? budget : 0,
        models,
      );
      planRef.current = built;
      setGoal(goalStr);
      setPlan(built);
      setPhases(built.subs.map(() => "queued"));
      setSpent(0);
      setFinished(false);
      setStatusKind("work");
      setStatus(`${built.subs.length} roles · budget ${usd(built.budget)}`);
      setMode("run");
      // fire a real skill-sale in the background so a genuine receipt lands in the ledger
      otto.earn().catch(() => {});
      t(700, () => runSub(0));
    },
    [budgetText, clearTimers, runSub, t, models],
  );

  const reset = () => {
    clearTimers();
    setMode("intro");
    setGoal("");
  };

  const hiredCount = phases.filter((p) => p === "done").length;

  return (
    <Screen>
      <View style={s.header}>
        <View>
          <Text style={s.hi}>Agent Economy</Text>
          <Text style={s.hiBig}>{mode === "intro" ? "Give Otto a goal" : "Otto is hiring"}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/sheet/connect")}
          style={({ pressed }) => [
            s.walletChip,
            walletConnected && s.walletChipOn,
            pressed && { opacity: 0.7 },
          ]}
        >
          {walletConnected ? (
            <>
              <View
                style={[
                  s.wDot,
                  {
                    backgroundColor: liveStatus?.funded && liveStatus?.optedIn ? c.earn : "#FFCE7A",
                  },
                ]}
              />
              <Mono style={{ fontSize: 12 }}>{liveStatus ? money(liveStatus.usdc) : "· · ·"}</Mono>
            </>
          ) : (
            <>
              <View style={[s.wDot, { backgroundColor: c.accentBright }]} />
              <Text style={s.walletChipText}>Connect</Text>
            </>
          )}
        </Pressable>
      </View>

      {mode === "intro" ? (
        <Intro budgetText={budgetText} setBudgetText={setBudgetText} onStart={start} />
      ) : (
        <RunView
          goal={goal}
          plan={plan}
          phases={phases}
          spent={spent}
          status={status}
          statusKind={statusKind}
          finished={finished}
          hiredCount={hiredCount}
          onReset={reset}
        />
      )}
    </Screen>
  );
}

/* ── Intro state ───────────────────────────────────────────────────────────── */
function Intro({
  budgetText,
  setBudgetText,
  onStart,
}: {
  budgetText: string;
  setBudgetText: (s: string) => void;
  onStart: (g: string) => void;
}) {
  const [goal, setGoal] = useState("");
  return (
    <View style={s.intro}>
      <Text style={s.introKicker}>WHAT TASK DO YOU WANT ME TO COMPLETE?</Text>
      <Text style={s.introBig}>Describe it. Otto hires the team.</Text>
      <TextInput
        value={goal}
        onChangeText={setGoal}
        onSubmitEditing={() => onStart(goal)}
        placeholder="e.g. Develop a mobile app for Otto"
        placeholderTextColor="rgba(242,241,246,0.34)"
        keyboardAppearance="dark"
        returnKeyType="go"
        multiline
        style={s.introInput}
      />
      <View style={s.budgetRow}>
        <Text style={s.budgetLabel}>BUDGET</Text>
        {BUDGET_CHIPS.map((v) => {
          const on = Number.parseFloat(budgetText) === v;
          return (
            <Pressable
              key={v}
              onPress={() => setBudgetText(v.toFixed(2))}
              style={[s.bChip, on && s.bChipOn]}
            >
              <Mono color={on ? c.text : c.muted} style={{ fontSize: 12 }}>
                ${v}
              </Mono>
            </Pressable>
          );
        })}
        <View style={s.bCustom}>
          <Text style={s.bDollar}>$</Text>
          <TextInput
            value={budgetText}
            onChangeText={setBudgetText}
            keyboardType="decimal-pad"
            keyboardAppearance="dark"
            style={s.bInput}
            selectTextOnFocus
          />
        </View>
      </View>
      <Pressable
        onPress={() => onStart(goal)}
        style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}
      >
        <LinearGradient
          colors={grad.primary}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={s.goBtn}
        >
          <Text style={s.goBtnText}>Decompose &amp; hire →</Text>
        </LinearGradient>
      </Pressable>
      <Text style={s.tryLabel}>Try one of these</Text>
      <View style={{ gap: 8 }}>
        {EXAMPLES.map((ex) => (
          <Pressable
            key={ex}
            onPress={() => onStart(ex)}
            style={({ pressed }) => [s.exChip, pressed && { opacity: 0.7 }]}
          >
            <Text style={s.exText}>{ex}</Text>
            <Text style={s.exArrow}>→</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* ── Run state ─────────────────────────────────────────────────────────────── */
function RunView({
  goal,
  plan,
  phases,
  spent,
  status,
  statusKind,
  finished,
  hiredCount,
  onReset,
}: {
  goal: string;
  plan: EconomyPlan | null;
  phases: Phase[];
  spent: number;
  status: string;
  statusKind: "work" | "pay" | "done";
  finished: boolean;
  hiredCount: number;
  onReset: () => void;
}) {
  if (!plan) return null;
  const pct = Math.min(100, Math.round((100 * spent) / Math.max(plan.budget, 0.0001)));
  const dotColor =
    statusKind === "pay" ? c.accentBright : statusKind === "done" ? c.earn : c.accentSoft;
  return (
    <View>
      <LinearGradient
        colors={grad.card}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.topCard}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.topKicker}>DECOMPOSED GOAL</Text>
            <Text style={s.topGoal} numberOfLines={2}>
              {goal}
            </Text>
          </View>
          <Pressable onPress={onReset} style={s.restart}>
            <Text style={s.restartText}>↺ New</Text>
          </Pressable>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 16,
            marginBottom: 7,
          }}
        >
          <Text style={s.meterLbl}>SPENT</Text>
          <Mono style={{ fontSize: 12, color: c.accentBright }}>
            {usd(spent)} of {usd(plan.budget)}
          </Mono>
        </View>
        <ProgressBar pct={pct} height={6} />
      </LinearGradient>

      {/* Otto orchestrator */}
      <LinearGradient
        colors={grad.heroLav}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.otto}
      >
        <OttoMarkPulse />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <View style={[s.ottoDot, { backgroundColor: dotColor }]} />
            <Text style={s.ottoLab}>OTTO · ORCHESTRATOR</Text>
          </View>
          <Text style={s.ottoStatus}>{status}</Text>
        </View>
      </LinearGradient>

      {/* Pipeline */}
      <View style={{ gap: 12, marginTop: 14 }}>
        {plan.subs.map((sub, i) => (
          <EconomyCard
            key={sub.key}
            sub={sub}
            index={i}
            phase={phases[i]}
            blockedMsg={plan.blocked}
          />
        ))}
      </View>

      {finished && <DoneSummary plan={plan} spent={spent} hiredCount={hiredCount} />}
    </View>
  );
}

function EconomyCard({
  sub,
  index,
  phase,
  blockedMsg,
}: {
  sub: SubTask;
  index: number;
  phase: Phase;
  blockedMsg: string | null;
}) {
  const active =
    phase === "sourcing" || phase === "candidates" || phase === "hiring" || phase === "delivering";
  const node = phase === "done" ? "✓" : phase === "blocked" ? "!" : String(index + 1);
  const nodeStyle =
    phase === "done"
      ? s.nodeOk
      : phase === "blocked"
        ? s.nodeBlock
        : active
          ? s.nodeRun
          : s.nodeWait;
  const nodeText =
    phase === "done" || active ? "#15131F" : phase === "blocked" ? "#FFC2BB" : c.muted;
  const pick = sub.pickIdx >= 0 ? sub.cands[sub.pickIdx] : null;

  return (
    <View
      style={[
        s.card,
        active && s.cardOn,
        phase === "done" && s.cardOk,
        phase === "blocked" && s.cardBlk,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={[s.node, nodeStyle]}>
          <Text style={{ color: nodeText, fontSize: 12, fontFamily: font.semibold }}>{node}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Text style={s.cardTitle}>{sub.title}</Text>
            <View style={s.roleTag}>
              <Text style={s.roleTagText}>{sub.key.toUpperCase()}</Text>
            </View>
            {pick?.modelId &&
              (phase === "hiring" || phase === "delivering" || phase === "done") && (
                <View style={s.usingTag}>
                  <Text style={s.usingText} numberOfLines={1}>
                    ⚡ {pick.modelId}
                  </Text>
                </View>
              )}
          </View>
        </View>
      </View>

      <View style={{ marginTop: 13 }}>
        {phase === "queued" && (
          <Text style={s.queued}>Queued — waiting for the previous hire…</Text>
        )}

        {phase === "blocked" && !sub.trigger && (
          <Text style={s.skipped}>Skipped — budget already spent.</Text>
        )}

        {phase === "sourcing" && (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
              <SourcingDots />
              <Text style={s.sourcingText}>Otto is sourcing specialist agents…</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 11 }}>
              {["s1", "s2", "s3"].map((id) => (
                <View key={id} style={s.skel} />
              ))}
            </View>
          </>
        )}

        {(phase === "candidates" ||
          phase === "hiring" ||
          phase === "delivering" ||
          phase === "done" ||
          (phase === "blocked" && sub.trigger)) && (
          <View style={{ gap: 8 }}>
            {sub.cands.map((cnd, j) => (
              <FadeIn key={cnd.name} delay={j * 70}>
                <CandidateRow
                  cnd={cnd}
                  picked={
                    j === sub.pickIdx &&
                    (phase === "hiring" || phase === "delivering" || phase === "done")
                  }
                  dim={
                    (phase === "hiring" || phase === "delivering" || phase === "done") &&
                    j !== sub.pickIdx
                      ? true
                      : phase === "blocked" && cnd.over
                  }
                />
              </FadeIn>
            ))}
          </View>
        )}

        {phase === "hiring" && pick && (
          <View style={s.settle}>
            <View style={s.settleIco}>
              <Text style={{ color: c.accentBright, fontSize: 12 }}>⇄</Text>
            </View>
            <Text style={s.settleText}>
              Escrowing {usd(sub.price)} to {pick.name} · x402 · USDC
            </Text>
            <Mono style={s.settleTx}>{sub.tx}</Mono>
          </View>
        )}
        {phase === "delivering" && pick && (
          <View style={{ marginTop: 12 }}>
            <ProgressBar pct={64} height={5} shimmer />
            <Text style={s.deliverText}>{pick.name} is delivering the work…</Text>
          </View>
        )}
        {phase === "done" && pick && (
          <View style={s.review}>
            <Text style={s.reviewStars}>{stars(pick.rating)}</Text>
            <Text style={s.reviewText} numberOfLines={1}>
              {sub.review}
            </Text>
            <Mono style={{ color: c.earnBright, fontSize: 12 }}>−{usd(sub.price)}</Mono>
          </View>
        )}
        {phase === "blocked" && sub.trigger && (
          <View style={s.block}>
            <Text style={s.blockText}>🛑 Spend firewall — {blockedMsg ?? "budget exhausted"}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function CandidateRow({
  cnd,
  picked,
  dim,
}: {
  cnd: {
    name: string;
    rating: number;
    price: number;
    over: boolean;
    modelId?: string;
    tier?: number;
    tierLabel?: string;
  };
  picked: boolean;
  dim: boolean;
}) {
  const tierStyle = cnd.tier === 3 ? s.tier3 : cnd.tier === 1 ? s.tier1 : s.tier2;
  const tierColor = cnd.tier === 3 ? "#FFCE7A" : cnd.tier === 1 ? c.earn : c.accentBright;
  return (
    <View style={[s.cand, picked && s.candPick, dim && { opacity: 0.34 }]}>
      <View style={[s.candAv, cnd.modelId && s.candAvModel]}>
        <Text
          style={{
            color: cnd.modelId ? c.earn : "#C9C3FF",
            fontSize: 10,
            fontFamily: font.semibold,
          }}
        >
          {cnd.modelId ? "OR" : initials(cnd.name)}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.candName} numberOfLines={1}>
          {cnd.name}
        </Text>
        {cnd.modelId ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
            <View style={[s.tierTag, tierStyle]}>
              <Text style={[s.tierText, { color: tierColor }]}>{cnd.tierLabel}</Text>
            </View>
            <Mono style={{ fontSize: 9.5, color: c.dim, flexShrink: 1 }} selectable={false}>
              {cnd.modelId}
            </Mono>
          </View>
        ) : cnd.over ? (
          <Text style={s.over}>over budget</Text>
        ) : null}
      </View>
      {picked && (
        <View style={s.hiredTag}>
          <Text
            style={{
              color: "#0F1712",
              fontSize: 8.5,
              fontFamily: font.semibold,
              letterSpacing: 0.4,
            }}
          >
            HIRED
          </Text>
        </View>
      )}
      <Mono style={{ fontSize: 11, color: c.faint, marginLeft: 6 }}>★{cnd.rating.toFixed(2)}</Mono>
      <Mono color={picked ? c.earnBright : c.text} style={{ fontSize: 12.5, marginLeft: 8 }}>
        {usd(cnd.price)}
      </Mono>
    </View>
  );
}

function DoneSummary({
  plan,
  spent,
  hiredCount,
}: {
  plan: EconomyPlan;
  spent: number;
  hiredCount: number;
}) {
  const blocked = Boolean(plan.blocked);
  const avg = !blocked
    ? plan.subs.reduce((a, sub) => a + (sub.cands[sub.pickIdx]?.rating ?? 0), 0) / plan.subs.length
    : 0;
  return (
    <View style={[s.done, blocked && s.doneBlocked]}>
      <Text style={s.doneHead}>{blocked ? "🛑 Stopped within budget" : "✓ Task delivered"}</Text>
      {blocked && (
        <Text style={s.doneSub}>
          {plan.blocked} Otto stopped rather than overspend — exactly what the spend firewall
          guarantees.
        </Text>
      )}
      <View style={s.doneStats}>
        <Stat k="AGENTS HIRED" v={`${hiredCount}${blocked ? ` / ${plan.subs.length}` : ""}`} />
        <Stat k="SPENT" v={usd(spent)} color={c.accentBright} />
        <Stat k="BUDGET" v={usd(plan.budget)} />
        {!blocked && <Stat k="AVG RATING" v={`★${avg.toFixed(2)}`} color={c.earnBright} />}
      </View>
    </View>
  );
}
function Stat({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <View>
      <Text style={s.statK}>{k}</Text>
      <Mono color={color} style={{ fontSize: 19, marginTop: 4, ...tabular }}>
        {v}
      </Mono>
    </View>
  );
}

/* ── Small animated primitives ─────────────────────────────────────────────── */
function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(a, {
      toValue: 1,
      duration: 320,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [a, delay]);
  return (
    <Animated.View
      style={{
        opacity: a,
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}
function SourcingDots() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(a, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  return (
    <View style={{ flexDirection: "row", gap: 5 }}>
      {["a", "b", "c"].map((id, i) => (
        <Animated.View
          key={id}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: c.accent2,
            opacity: a.interpolate({
              inputRange: [0, (i + 1) / 4, (i + 2) / 4, 1],
              outputRange: [0.3, 1, 0.3, 0.3],
            }),
          }}
        />
      ))}
    </View>
  );
}
function OttoMarkPulse() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(a, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  return (
    <View style={s.ottoMark}>
      <Animated.View
        style={[
          s.ring,
          {
            opacity: a.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.5, 0, 0] }),
            transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.2] }) }],
          },
        ]}
      />
      <LinearGradient
        colors={grad.logoMark}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.ottoCore}
      >
        <View style={s.ottoCoreRing} />
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  hi: { color: c.faint, fontSize: 12, fontFamily: font.regular },
  hiBig: {
    color: c.text,
    fontSize: 22,
    fontFamily: font.semibold,
    letterSpacing: -0.5,
    marginTop: 3,
  },
  walletChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  walletChipOn: {
    borderColor: "rgba(143,227,180,0.24)",
    backgroundColor: "rgba(143,227,180,0.06)",
  },
  walletChipText: { color: c.text, fontSize: 12.5, fontFamily: font.medium },
  wDot: { width: 7, height: 7, borderRadius: 4 },

  intro: { marginTop: 22 },
  introKicker: { color: c.faint, fontSize: 11, letterSpacing: 1.4, fontFamily: font.medium },
  introBig: {
    color: c.text,
    fontSize: 27,
    fontFamily: font.semibold,
    letterSpacing: -0.7,
    marginTop: 10,
    lineHeight: 32,
  },
  introInput: {
    marginTop: 20,
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.045)",
    color: c.text,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15.5,
    fontFamily: font.regular,
    textAlignVertical: "top",
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    flexWrap: "wrap",
  },
  budgetLabel: { color: c.faint, fontSize: 10.5, letterSpacing: 0.8, fontFamily: font.medium },
  bChip: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  bChipOn: { borderColor: "rgba(169,160,255,0.34)", backgroundColor: "rgba(169,160,255,0.16)" },
  bCustom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,10,11,0.5)",
  },
  bDollar: { color: c.faint, fontSize: 12.5, fontFamily: font.mono },
  bInput: {
    minWidth: 46,
    color: c.text,
    fontSize: 12.5,
    fontFamily: font.mono,
    padding: 0,
    ...tabular,
  },
  goBtn: {
    marginTop: 18,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  goBtnText: { color: "#14121F", fontSize: 15, fontFamily: font.semibold },
  tryLabel: {
    color: c.faint,
    fontSize: 11,
    letterSpacing: 0.6,
    fontFamily: font.medium,
    marginTop: 24,
    marginBottom: 11,
  },
  exChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.028)",
  },
  exText: { flex: 1, color: c.muted, fontSize: 13, fontFamily: font.regular },
  exArrow: { color: c.accent2, fontSize: 15 },

  topCard: { marginTop: 18, borderRadius: 22, borderWidth: 1, borderColor: c.border, padding: 18 },
  topKicker: { color: c.faint, fontSize: 10, letterSpacing: 1.1, fontFamily: font.medium },
  topGoal: {
    color: c.text,
    fontSize: 17,
    fontFamily: font.semibold,
    letterSpacing: -0.3,
    marginTop: 6,
  },
  restart: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  restartText: { color: c.muted, fontSize: 12, fontFamily: font.regular },
  meterLbl: { color: c.faint, fontSize: 10.5, letterSpacing: 0.6, fontFamily: font.medium },

  otto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(169,160,255,0.2)",
  },
  ottoMark: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(179,170,255,0.55)",
  },
  ottoCore: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ottoCoreRing: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: "#131320",
  },
  ottoDot: { width: 6, height: 6, borderRadius: 3 },
  ottoLab: { color: c.faint, fontSize: 10, letterSpacing: 1.2, fontFamily: font.medium },
  ottoStatus: {
    color: c.text,
    fontSize: 14,
    fontFamily: font.medium,
    marginTop: 5,
    letterSpacing: -0.2,
  },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.028)",
    padding: 16,
  },
  cardOn: { borderColor: "rgba(169,160,255,0.28)" },
  cardOk: { borderColor: "rgba(143,227,180,0.24)" },
  cardBlk: { borderColor: "rgba(255,140,130,0.3)" },
  node: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  nodeWait: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  nodeRun: { backgroundColor: "#C4BCFF" },
  nodeOk: { backgroundColor: "#8FE3B4" },
  nodeBlock: {
    backgroundColor: "rgba(255,120,110,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,140,130,0.32)",
  },
  cardTitle: { color: c.text, fontSize: 14, fontFamily: font.semibold, letterSpacing: -0.2 },
  roleTag: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(169,160,255,0.22)",
    backgroundColor: "rgba(169,160,255,0.1)",
  },
  roleTagText: {
    color: c.accentBright,
    fontSize: 8.5,
    letterSpacing: 0.4,
    fontFamily: font.medium,
  },
  cardDetail: { color: c.faint, fontSize: 11.5, marginTop: 3, fontFamily: font.regular },
  usingTag: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 190,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(143,227,180,0.2)",
    backgroundColor: "rgba(143,227,180,0.08)",
  },
  usingText: { color: c.earn, fontSize: 10, fontFamily: font.mono },
  tierTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, borderWidth: 1 },
  tierText: {
    fontSize: 8,
    letterSpacing: 0.4,
    fontFamily: font.medium,
    textTransform: "uppercase",
  },
  tier1: {
    color: c.earn,
    borderColor: "rgba(143,227,180,0.24)",
    backgroundColor: "rgba(143,227,180,0.1)",
  },
  tier2: {
    color: c.accentBright,
    borderColor: "rgba(169,160,255,0.24)",
    backgroundColor: "rgba(169,160,255,0.1)",
  },
  tier3: {
    color: "#FFCE7A",
    borderColor: "rgba(255,206,122,0.26)",
    backgroundColor: "rgba(255,206,122,0.1)",
  },
  candAvModel: { backgroundColor: "#14201B", borderColor: "rgba(143,227,180,0.2)" },

  queued: { color: "rgba(242,241,246,0.3)", fontSize: 12, fontFamily: font.regular },
  skipped: {
    color: "rgba(242,241,246,0.4)",
    fontSize: 12,
    fontFamily: font.regular,
    paddingVertical: 4,
  },
  sourcingText: { color: c.muted, fontSize: 12, fontFamily: font.regular },
  skel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  cand: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  candPick: { borderColor: "rgba(143,227,180,0.4)", backgroundColor: "rgba(143,227,180,0.07)" },
  candAv: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22212E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginRight: 10,
  },
  candName: { color: c.text, fontSize: 12.5, fontFamily: font.medium },
  over: { color: c.danger, fontSize: 9, marginTop: 2, fontFamily: font.regular },
  hiredTag: {
    backgroundColor: "#A9EFC8",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  settle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(169,160,255,0.22)",
    backgroundColor: "rgba(169,160,255,0.07)",
  },
  settleIco: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(169,160,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(169,160,255,0.24)",
  },
  settleText: { flex: 1, color: c.muted, fontSize: 11.5, fontFamily: font.regular },
  settleTx: { fontSize: 10, color: c.dim },
  deliverText: { color: c.muted, fontSize: 11.5, marginTop: 8, fontFamily: font.regular },
  review: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(143,227,180,0.2)",
    backgroundColor: "rgba(143,227,180,0.06)",
  },
  reviewStars: { color: c.earnBright, fontSize: 12, letterSpacing: 1 },
  reviewText: { flex: 1, color: c.muted, fontSize: 11.5, fontFamily: font.regular },
  block: {
    marginTop: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,140,130,0.28)",
    backgroundColor: "rgba(255,120,110,0.09)",
  },
  blockText: { color: "#FFD0CA", fontSize: 12, fontFamily: font.regular, lineHeight: 17 },

  done: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(143,227,180,0.24)",
    backgroundColor: "rgba(143,227,180,0.07)",
    padding: 20,
  },
  doneBlocked: { borderColor: "rgba(255,140,130,0.3)", backgroundColor: "rgba(255,120,110,0.08)" },
  doneHead: { color: c.text, fontSize: 16, fontFamily: font.semibold },
  doneSub: { color: c.muted, fontSize: 12, marginTop: 7, lineHeight: 17, fontFamily: font.regular },
  doneStats: { flexDirection: "row", flexWrap: "wrap", gap: 22, marginTop: 16 },
  statK: { color: c.faint, fontSize: 10, letterSpacing: 0.5, fontFamily: font.medium },
});
