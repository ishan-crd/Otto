/**
 * Otto's shared UI kit — the glass/lavender primitives every screen is built
 * from. Mirrors the desktop dashboard's language (web/src/api/webPage.ts):
 * gradient glass cards, conic-ish orb glows, mono tabular money, a pulsing
 * "live" dot, and shimmering progress bars.
 */
import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode, useEffect, useRef } from "react";
import {
  Animated,
  type ColorValue,
  Easing,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Row } from "../data";
import { c, font, grad, radius, tabular } from "../theme";

/* ----------------------------------------------------------------- Text --- */

export function Label({
  children,
  style,
  spaced = true,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  spaced?: boolean;
}) {
  return <Text style={[styles.label, spaced && { letterSpacing: 1 }, style]}>{children}</Text>;
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Sub({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.sub, style]}>{children}</Text>;
}

/** Mono tabular figures — money, tx ids, metrics. */
export function Mono({
  children,
  style,
  color,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  color?: string;
}) {
  return <Text style={[styles.mono, color ? { color } : null, style]}>{children}</Text>;
}

/* ---------------------------------------------------------------- Glass --- */

export function GlassCard({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return (
    <LinearGradient
      colors={grad.card}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.glassCard, padded && styles.cardPad, style]}
    >
      {children}
    </LinearGradient>
  );
}

/** Hero surface — brighter glass, optional lavender wash + an orb glow. */
export function Hero({
  children,
  style,
  lav = false,
  orb = "topRight",
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  lav?: boolean;
  orb?: "topRight" | "bottomLeft" | "none";
}) {
  return (
    <LinearGradient
      colors={lav ? grad.heroLav : grad.hero}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.hero, style]}
    >
      {orb !== "none" && <Orb position={orb} />}
      {children}
    </LinearGradient>
  );
}

/** Soft lavender glow behind hero cards (a flat stand-in for the CSS conic orb). */
export function Orb({ position = "topRight" }: { position?: "topRight" | "bottomLeft" }) {
  const pos = position === "topRight" ? { right: -90, top: -110 } : { left: -110, bottom: -150 };
  return (
    <LinearGradient
      colors={grad.orb}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      pointerEvents="none"
      style={[styles.orb, pos]}
    />
  );
}

/* --------------------------------------------------------------- Chips ---- */

export type TagKind = "running" | "hired" | "open" | "accent";

export function Tag({ label, kind = "accent" }: { label: string; kind?: TagKind }) {
  const map: Record<TagKind, ViewStyle> = {
    running: { backgroundColor: "rgba(143,227,180,0.09)", borderColor: "rgba(143,227,180,0.2)" },
    open: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" },
    hired: { backgroundColor: "rgba(169,160,255,0.1)", borderColor: "rgba(169,160,255,0.22)" },
    accent: { backgroundColor: "rgba(169,160,255,0.1)", borderColor: "rgba(169,160,255,0.22)" },
  };
  const color = kind === "running" ? c.earn : kind === "open" ? c.muted : c.accentBright;
  return (
    <View style={[styles.tag, map[kind]]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

/** Lavender pill (trusted counterparties, tags). `dashed` renders an "+ Add". */
export function Pill({ label, dashed = false }: { label: string; dashed?: boolean }) {
  return (
    <View style={[styles.pill, dashed && styles.pillDashed]}>
      <Text style={[styles.pillText, dashed && { color: c.muted }]}>{label}</Text>
    </View>
  );
}

/* --------------------------------------------------------------- Buttons -- */

export function PrimaryButton({
  label,
  onPress,
  style,
  loading = false,
}: {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={style}>
      {({ pressed }) => (
        <LinearGradient
          colors={grad.primary}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.btn, styles.btnPri, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.btnPriText}>{loading ? "…" : label}</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  style,
  danger = false,
}: {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        danger ? styles.btnDanger : styles.btnGhost,
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Text style={[styles.btnGhostText, danger && { color: c.danger }]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------- Segmented -- */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  style,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.seg, style]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segItem, on && styles.segItemOn]}
          >
            <Text style={[styles.segText, on && { color: c.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------- Progress -- */

/** Thin progress bar. `shimmer` sweeps a highlight across the fill (live tasks). */
export function ProgressBar({
  pct,
  height = 5,
  colors = grad.progress,
  track = "rgba(255,255,255,0.07)",
  shimmer = false,
  style,
}: {
  pct: number; // 0..100
  height?: number;
  colors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
  track?: string;
  shimmer?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const x = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    if (!shimmer) return;
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer, x]);

  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View
      style={[{ height, borderRadius: height, backgroundColor: track, overflow: "hidden" }, style]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: `${clamped}%`, height: "100%", borderRadius: height, overflow: "hidden" }}
      >
        {shimmer && (
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "40%",
              backgroundColor: "rgba(255,255,255,0.55)",
              transform: [
                {
                  translateX: x.interpolate({ inputRange: [-1, 1], outputRange: [-40, 260] }),
                },
              ],
            }}
          />
        )}
      </LinearGradient>
    </View>
  );
}

/* -------------------------------------------------------------- Live dot -- */

export function LiveDot({ color = c.earn, size = 6 }: { color?: string; size?: number }) {
  const a = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, {
          toValue: 0.35,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(a, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: color,
        opacity: a,
        transform: [{ scale: a.interpolate({ inputRange: [0.35, 1], outputRange: [0.82, 1] }) }],
      }}
    />
  );
}

/* -------------------------------------------------------------- Avatars --- */

export function AgentAvatar({ initials, sell = false }: { initials: string; sell?: boolean }) {
  return (
    <LinearGradient
      colors={sell ? grad.avatarSell : grad.avatarHire}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.avatar}
    >
      <Text style={[styles.avatarText, { color: sell ? "#1A1826" : c.accentBright }]}>
        {initials}
      </Text>
    </LinearGradient>
  );
}

/** Otto's brand mark — a lavender-metal rounded square with a dark inner ring. */
export function OttoMark({ size = 42, ring = 12 }: { size?: number; ring?: number }) {
  return (
    <LinearGradient
      colors={grad.logoMark}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.36,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: ring,
          height: ring,
          borderRadius: ring,
          borderWidth: ring * 0.22,
          borderColor: "#131320",
        }}
      />
    </LinearGradient>
  );
}

/** Directional in/out glyph badge used by feed + ledger rows. */
export function DirIcon({ dir }: { dir: "in" | "out" }) {
  const inbound = dir === "in";
  return (
    <View
      style={[
        styles.dirIcon,
        inbound
          ? { backgroundColor: "rgba(143,227,180,0.08)", borderColor: "rgba(143,227,180,0.16)" }
          : { backgroundColor: "rgba(169,160,255,0.08)", borderColor: "rgba(169,160,255,0.18)" },
      ]}
    >
      <Text style={{ color: inbound ? c.earn : c.accent2, fontSize: 13 }}>
        {inbound ? "↑" : "↓"}
      </Text>
    </View>
  );
}

/* --------------------------------------------------------------- Screen --- */

/** Standard tab screen: safe-area top + scroll with room for the floating nav. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Big screen heading (+ optional subtitle), matching the design's 22px title. */
export function ScreenTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <View>
      <Text style={styles.screenTitle}>{title}</Text>
      {sub && <Text style={styles.screenSub}>{sub}</Text>}
    </View>
  );
}

/** A money-moving / receipt row: direction badge · label · tx·time · amount. */
export function MoneyRow({
  row,
  onPress,
  last,
}: {
  row: Row;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.moneyRow,
        last && { borderBottomWidth: 0 },
        pressed && { opacity: 0.6 },
      ]}
    >
      <DirIcon dir={row.dir} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={styles.moneyLabel}>
          {row.label}
        </Text>
        <Mono style={styles.moneyMeta}>
          {row.tx} · {row.time}
        </Mono>
      </View>
      <Mono color={row.dir === "in" ? c.earnBright : c.spend} style={styles.moneyAmt}>
        {row.amount}
      </Mono>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 130 },
  screenTitle: { color: c.text, fontSize: 22, fontFamily: font.semibold, letterSpacing: -0.5 },
  screenSub: { color: c.faint, fontSize: 12.5, marginTop: 4, fontFamily: font.regular },

  moneyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: c.hairline,
  },
  moneyLabel: { color: c.text, fontSize: 12.5, fontFamily: font.regular },
  moneyMeta: { color: c.dim, fontSize: 10, marginTop: 3 },
  moneyAmt: { fontSize: 13 },

  label: { color: c.faint, fontSize: 10.5, fontFamily: font.medium },
  title: { color: c.text, fontSize: 14, fontFamily: font.medium },
  sub: { color: c.faint, fontSize: 12, fontFamily: font.regular, marginTop: 3, lineHeight: 17 },
  mono: { color: c.text, fontFamily: font.mono, ...tabular },

  glassCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardPad: { padding: 20 },
  hero: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
    padding: 22,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },

  tag: {
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tagText: { fontSize: 9.5, fontFamily: font.medium, letterSpacing: 0.5 },

  pill: {
    borderWidth: 1,
    borderColor: "rgba(169,160,255,0.22)",
    backgroundColor: "rgba(169,160,255,0.1)",
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillDashed: {
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "transparent",
  },
  pillText: { color: c.accentBright, fontSize: 12, fontFamily: font.medium },

  btn: {
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    flexDirection: "row",
  },
  btnPri: { borderWidth: 1, borderColor: "rgba(211,206,255,0.4)" },
  btnPriText: { color: "#14121F", fontSize: 14, fontFamily: font.semibold },
  btnGhost: { backgroundColor: c.glass2, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  btnDanger: { backgroundColor: c.dangerBg, borderWidth: 1, borderColor: c.dangerBorder },
  btnGhostText: { color: c.text, fontSize: 13.5, fontFamily: font.medium },

  seg: {
    flexDirection: "row",
    gap: 5,
    padding: 4,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.glass,
  },
  segItem: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  segItemOn: { backgroundColor: "rgba(169,160,255,0.16)", borderColor: "rgba(169,160,255,0.22)" },
  segText: { fontSize: 12.5, fontFamily: font.medium, color: c.muted },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.border,
  },
  avatarText: { fontSize: 12, fontFamily: font.semibold },

  dirIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
