/**
 * Small app-wide state that must outlive the native formSheet routes:
 *
 *  - Otto's on-chain wallet connection — mirrors the web dashboard's "Connect
 *    wallet" button. The account itself always exists server-side (Otto
 *    auto-provisions it); "connecting" just surfaces it in the app and starts
 *    polling /api/live/status (funded / opted-in / USDC balance).
 *  - A toast for confirmations (connect / hire / opt-in).
 *
 * The sheets themselves are plain routes (app/sheet/*) presented as OS
 * formSheets; this holds the bits they can't own locally.
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
import { type LiveInfo, type LiveStatus, otto } from "../api";
import { c, font } from "../theme";

interface AppStateApi {
  walletConnected: boolean;
  liveInfo: LiveInfo | null;
  liveStatus: LiveStatus | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshWallet: () => Promise<void>;
  toast: (text: string) => void;
}

const Ctx = createContext<AppStateApi | null>(null);

export function useAppState(): AppStateApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState must be used within AppStateProvider");
  return v;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [liveInfo, setLiveInfo] = useState<LiveInfo | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [toastText, setToastText] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectedRef = useRef(false);
  connectedRef.current = walletConnected;

  const toast = useCallback((text: string) => {
    setToastText(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastText(""), 2600);
  }, []);

  const connTouched = useRef(0);

  const refreshWallet = useCallback(async () => {
    try {
      const [info, status] = await Promise.all([otto.liveInfo(), otto.liveStatus()]);
      setLiveInfo(info);
      setLiveStatus(status);
      // Server owns the connection (web ↔ mobile sync) — but never clobber a
      // local connect/disconnect made in the last few seconds.
      if (typeof status.connected === "boolean" && Date.now() - connTouched.current > 5000)
        setWalletConnected(status.connected);
    } catch {
      /* server unreachable — leave the last known snapshot */
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setWalletConnected(true);
    connTouched.current = Date.now();
    await otto.connectLive().catch(() => {});
    await refreshWallet();
    toast("✓ Wallet connected — synced to every device");
  }, [refreshWallet, toast]);

  const disconnectWallet = useCallback(() => {
    setWalletConnected(false);
    connTouched.current = Date.now();
    void otto.disconnectLive().catch(() => {});
  }, []);

  // Always poll: keeps balances fresh AND syncs the connection across devices.
  useEffect(() => {
    void refreshWallet();
    const p = setInterval(() => void refreshWallet(), 6000);
    return () => clearInterval(p);
  }, [refreshWallet]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const api = useMemo<AppStateApi>(
    () => ({
      walletConnected,
      liveInfo,
      liveStatus,
      connectWallet,
      disconnectWallet,
      refreshWallet,
      toast,
    }),
    [walletConnected, liveInfo, liveStatus, connectWallet, disconnectWallet, refreshWallet, toast],
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
