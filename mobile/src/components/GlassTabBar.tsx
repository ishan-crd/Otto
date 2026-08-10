/**
 * Otto's floating glass bottom nav.
 *
 * Ported from the clip-merged mobile app's GlassTabBar (the exact component the
 * design reuses): a blurred floating pill with an inverting active pill that
 * slides to the *measured* active tab (correct on the first frame, no width
 * math) and can be dragged between tabs. Retinted to Otto's design — a lavender
 * active pill (#DFDBFF→#A79FF0) with a dark glyph — and given the design's five
 * tabs: Home · Marketplace · Active task (bolt) · Wallet · Otto.
 */
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { c, grad } from "../theme";

const NAV_HEIGHT = 66;
const PILL_HEIGHT = 48;
const PILL_RADIUS = 24;
const SIDE_PADDING = 9;
const PILL_INSET = 3;

const INACTIVE = "rgba(242,241,246,0.42)";
const ACTIVE_FG = "#14121F";

// Left-to-right order, matching the tab route filenames. `index` is Home.
const TAB_ORDER = ["index", "marketplace", "treasury", "wallet", "profile"] as const;
const TAB_LABELS: Record<string, string> = {
  index: "Home",
  marketplace: "Marketplace",
  treasury: "Treasury",
  wallet: "Wallet",
  profile: "Otto",
};

type IconProps = { color: string };

function HomeIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function MarketIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 8.5h17L19 20H5z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 8.5V6.5a3.5 3.5 0 017 0v2"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function TreasuryIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20V10M9.5 20V6M15 20v-4M20.5 20V4"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function WalletIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect
        x={2.5}
        y={6}
        width={19}
        height={13}
        rx={4}
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.5 12.5h2.5"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function ProfileIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={8.5}
        r={3.6}
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.8 20a7.4 7.4 0 0114.4 0"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const ICONS: Record<string, (p: IconProps) => ReactElement> = {
  index: HomeIcon,
  marketplace: MarketIcon,
  treasury: TreasuryIcon,
  wallet: WalletIcon,
  profile: ProfileIcon,
};

// Structural subset of expo-router's BottomTabBarProps — the bits this bar uses.
// (expo-router doesn't re-export the type by name, so we describe it locally.)
type TabRoute = { key: string; name: string };
export interface GlassTabBarProps {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: { type: "tabPress"; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
  };
}

export function GlassTabBar({ state, navigation }: GlassTabBarProps) {
  const insets = useSafeAreaInsets();

  const routes = TAB_ORDER.map((name) => state.routes.find((r) => r.name === name)).filter(
    Boolean,
  ) as { key: string; name: string }[];
  const activeName = state.routes[state.index]?.name;

  const layouts = useRef<Record<string, { x: number; width: number }>>({});
  const pillX = useRef(new Animated.Value(0)).current;
  const pillW = useRef(new Animated.Value(0)).current;
  const positioned = useRef(false);

  const placePill = useCallback(
    (l: { x: number; width: number }, animate: boolean) => {
      const toX = l.x + PILL_INSET;
      const toW = l.width - PILL_INSET * 2;
      if (animate) {
        Animated.parallel([
          Animated.spring(pillX, {
            toValue: toX,
            useNativeDriver: false,
            tension: 80,
            friction: 12,
          }),
          Animated.spring(pillW, {
            toValue: toW,
            useNativeDriver: false,
            tension: 80,
            friction: 12,
          }),
        ]).start();
      } else {
        pillX.setValue(toX);
        pillW.setValue(toW);
      }
    },
    [pillX, pillW],
  );

  const onTabLayout = (
    name: string,
    e: { nativeEvent: { layout: { x: number; width: number } } },
  ) => {
    const { x, width } = e.nativeEvent.layout;
    layouts.current[name] = { x, width };
    if (name === activeName) {
      positioned.current = true;
      placePill({ x, width }, false);
    }
  };

  useEffect(() => {
    const l = layouts.current[activeName];
    if (l && positioned.current) placePill(l, true);
  }, [activeName, placePill]);

  // ── Drag-to-switch ──────────────────────────────────────────────────────
  const pillScale = useRef(new Animated.Value(1)).current;
  const pillXNow = useRef(0);
  const pillWNow = useRef(0);
  const dragStartX = useRef(0);
  const hoverRef = useRef<string | null>(null);
  const [hoverName, setHoverName] = useState<string | null>(null);

  useEffect(() => {
    const xId = pillX.addListener(({ value }) => {
      pillXNow.current = value;
    });
    const wId = pillW.addListener(({ value }) => {
      pillWNow.current = value;
    });
    return () => {
      pillX.removeListener(xId);
      pillW.removeListener(wId);
    };
  }, [pillX, pillW]);

  const routesRef = useRef(routes);
  routesRef.current = routes;
  const activeNameRef = useRef(activeName);
  activeNameRef.current = activeName;
  const navigationRef = useRef(navigation);
  navigationRef.current = navigation;

  const nearestName = useCallback((center: number) => {
    let best = Number.POSITIVE_INFINITY;
    let name: string | null = null;
    for (const r of routesRef.current) {
      const l = layouts.current[r.name];
      if (!l) continue;
      const cx = l.x + l.width / 2;
      const d = Math.abs(cx - center);
      if (d < best) {
        best = d;
        name = r.name;
      }
    }
    return name;
  }, []);

  const finishDrag = useCallback(() => {
    Animated.spring(pillScale, {
      toValue: 1,
      useNativeDriver: false,
      tension: 120,
      friction: 12,
    }).start();
    const targetName =
      nearestName(pillXNow.current + pillWNow.current / 2) ?? activeNameRef.current;
    const l = layouts.current[targetName];
    if (l) placePill(l, true);
    hoverRef.current = null;
    setHoverName(null);
    if (targetName !== activeNameRef.current) navigationRef.current.navigate(targetName);
  }, [nearestName, placePill, pillScale]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 2,
        onPanResponderGrant: () => {
          pillX.stopAnimation();
          pillW.stopAnimation();
          dragStartX.current = pillXNow.current;
          hoverRef.current = activeNameRef.current;
          Animated.spring(pillScale, {
            toValue: 1.08,
            useNativeDriver: false,
            tension: 140,
            friction: 10,
          }).start();
        },
        onPanResponderMove: (_e, g) => {
          const rs = routesRef.current;
          const firstL = rs[0] ? layouts.current[rs[0].name] : undefined;
          const lastL = rs[rs.length - 1] ? layouts.current[rs[rs.length - 1].name] : undefined;
          const min = firstL ? firstL.x + PILL_INSET : 0;
          const max = lastL ? lastL.x + PILL_INSET : min;
          const nx = Math.min(max, Math.max(min, dragStartX.current + g.dx));
          pillX.setValue(nx);
          pillXNow.current = nx;
          const name = nearestName(nx + pillWNow.current / 2);
          if (name && name !== hoverRef.current) {
            hoverRef.current = name;
            setHoverName(name);
          }
        },
        onPanResponderRelease: finishDrag,
        onPanResponderTerminate: finishDrag,
      }),
    [pillX, pillW, pillScale, nearestName, finishDrag],
  );

  const highlightName = hoverName ?? activeName;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 16) }]}
    >
      <View style={styles.shadow}>
        <View style={styles.clip}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(18,18,21,0.55)" }]} />

          <View style={styles.inner}>
            {/* Sliding lavender pill (behind the icons) */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pill,
                { width: pillW, transform: [{ translateX: pillX }, { scale: pillScale }] },
              ]}
            >
              <LinearGradient
                colors={grad.primary}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            {routes.map((route) => {
              const isFocused = route.name === activeName;
              const isHighlighted = route.name === highlightName;
              const Icon = ICONS[route.name] ?? HomeIcon;
              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityLabel={TAB_LABELS[route.name] ?? route.name}
                  accessibilityState={{ selected: isFocused }}
                  onLayout={(e) => onTabLayout(route.name, e)}
                  onPress={() => {
                    const event = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
                  }}
                  style={styles.tab}
                >
                  <Icon color={isHighlighted ? ACTIVE_FG : INACTIVE} />
                </Pressable>
              );
            })}

            {/* Invisible drag handle over the active pill: grab + slide to switch. */}
            <Animated.View
              {...pan.panHandlers}
              importantForAccessibility="no"
              style={[styles.pill, { width: pillW, transform: [{ translateX: pillX }] }]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", left: 20, right: 20 },
  shadow: {
    borderRadius: NAV_HEIGHT / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
  },
  clip: {
    height: NAV_HEIGHT,
    borderRadius: NAV_HEIGHT / 2,
    borderWidth: 1,
    borderColor: c.borderStrong,
    overflow: "hidden",
  },
  inner: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: SIDE_PADDING },
  pill: {
    position: "absolute",
    left: 0,
    top: (NAV_HEIGHT - PILL_HEIGHT) / 2,
    height: PILL_HEIGHT,
    borderRadius: PILL_RADIUS,
    overflow: "hidden",
  },
  tab: { flex: 1, height: PILL_HEIGHT, alignItems: "center", justifyContent: "center" },
});
