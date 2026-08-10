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

import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { type AuthUser, type LiveInfo, type LiveStatus, otto, setAuthToken } from "../api";
import { c, font } from "../theme";

interface AppStateApi {
  user: AuthUser | null;
  authReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>; // true = confirm email
  signOut: () => Promise<void>;
  walletConnected: boolean;
  liveInfo: LiveInfo | null;
  liveStatus: LiveStatus | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshWallet: () => Promise<void>;
  toast: (text: string) => void;
}

const TOKEN_KEY = "otto_token";

const Ctx = createContext<AppStateApi | null>(null);

export function useAppState(): AppStateApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState must be used within AppStateProvider");
  return v;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
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

  // Restore the Supabase session from storage on launch.
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          const me = await otto.me();
          setUser(me.user);
        }
      } catch {
        setAuthToken(null);
        await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const r = await otto.login(email, password);
    if (!r.token || !r.user) throw new Error("login failed");
    setAuthToken(r.token);
    await AsyncStorage.setItem(TOKEN_KEY, r.token);
    setUser(r.user);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const r = await otto.signup(name, email, password);
    if (r.confirmEmail) return true;
    if (!r.token || !r.user) throw new Error("signup failed");
    setAuthToken(r.token);
    await AsyncStorage.setItem(TOKEN_KEY, r.token);
    setUser(r.user);
    return false;
  }, []);

  const signOut = useCallback(async () => {
    await otto.logout().catch(() => {});
    setAuthToken(null);
    await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
    setUser(null);
  }, []);

  const refreshWallet = useCallback(async () => {
    try {
      const [info, status] = await Promise.all([otto.liveInfo(), otto.liveStatus()]);
      setLiveInfo(info);
      setLiveStatus(status);
    } catch {
      /* server unreachable — leave the last known snapshot */
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setWalletConnected(true);
    await refreshWallet();
    toast("✓ Wallet connected — Otto's TestNet account is live");
  }, [refreshWallet, toast]);

  const disconnectWallet = useCallback(() => {
    setWalletConnected(false);
    setLiveStatus(null);
  }, []);

  // Poll the on-chain status while connected so funded/opted-in/balance stay live.
  useEffect(() => {
    if (!walletConnected) return;
    const p = setInterval(() => {
      if (connectedRef.current) void refreshWallet();
    }, 6000);
    return () => clearInterval(p);
  }, [walletConnected, refreshWallet]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const api = useMemo<AppStateApi>(
    () => ({
      user,
      authReady,
      signIn,
      signUp,
      signOut,
      walletConnected,
      liveInfo,
      liveStatus,
      connectWallet,
      disconnectWallet,
      refreshWallet,
      toast,
    }),
    [
      user,
      authReady,
      signIn,
      signUp,
      signOut,
      walletConnected,
      liveInfo,
      liveStatus,
      connectWallet,
      disconnectWallet,
      refreshWallet,
      toast,
    ],
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
