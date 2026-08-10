/**
 * Small app-wide state that must outlive the native formSheet routes: which
 * wallets are connected, and a toast for confirmations (connect / hire). The
 * sheets themselves are plain routes (app/sheet/*) presented as OS formSheets;
 * this only holds the bits they can't own locally.
 */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { c, font } from "../theme";

interface AppStateApi {
  connected: string[];
  connect: (key: string, name: string) => void;
  toast: (text: string) => void;
}

const Ctx = createContext<AppStateApi | null>(null);

export function useAppState(): AppStateApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState must be used within AppStateProvider");
  return v;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState<string[]>(["base"]);
  const [toastText, setToastText] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectedRef = useRef(connected);
  connectedRef.current = connected;

  const toast = useCallback((text: string) => {
    setToastText(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastText(""), 2600);
  }, []);

  const connect = useCallback(
    (key: string, name: string) => {
      if (connectedRef.current.includes(key)) return;
      setConnected((cs) => [...cs, key]);
      toast(`${name} connected`);
    },
    [toast],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const api = useMemo<AppStateApi>(
    () => ({ connected, connect, toast }),
    [connected, connect, toast],
  );

  return (
    <Ctx.Provider value={api}>
      <View style={{ flex: 1 }}>{children}</View>
      <Toast text={toastText} />
    </Ctx.Provider>
  );
}

function Toast({ text }: { text: string }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, {
      toValue: text ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [text, a]);
  if (!text) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          opacity: a,
          transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
      ]}
    >
      <View style={styles.check}>
        <Text style={{ color: "#0F1712", fontSize: 12 }}>✓</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 104,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(143,227,180,0.22)",
    backgroundColor: "rgba(20,26,23,0.92)",
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: c.earn,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "rgba(242,241,246,0.8)", fontSize: 12.5, fontFamily: font.regular, flex: 1 },
});
