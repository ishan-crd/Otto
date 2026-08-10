import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { c, font, grad } from "../theme";
import { useAppState } from "./AppState";
import { OttoMark } from "./ui";

/** Full-screen sign-in / sign-up (Supabase-backed via the web backend). */
export function LoginScreen() {
  const { signIn, signUp } = useAppState();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!email.trim() || !password) {
      setMsg({ text: "Enter email and password.", ok: false });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const needsConfirm = await signUp(name.trim(), email.trim(), password);
        if (needsConfirm) {
          setMsg({
            text: "✓ Account created — confirm via the email link, then log in.",
            ok: true,
          });
          setMode("login");
        }
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      setMsg({ text: String(err instanceof Error ? err.message : err), ok: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}
      >
        <View style={{ alignItems: "center", marginBottom: 22 }}>
          <OttoMark size={52} />
          <Text style={s.title}>{mode === "signup" ? "Create your account" : "Welcome back"}</Text>
          <Text style={s.sub}>Sign in to run Otto — accounts live in Supabase.</Text>
        </View>

        <View style={s.card}>
          <View style={s.tabs}>
            {(["login", "signup"] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => {
                  setMode(m);
                  setMsg(null);
                }}
                style={[s.tab, mode === m && s.tabOn]}
              >
                <Text style={[s.tabText, mode === m && { color: c.text }]}>
                  {m === "login" ? "Log in" : "Sign up"}
                </Text>
              </Pressable>
            ))}
          </View>

          {mode === "signup" && (
            <>
              <Text style={s.label}>NAME</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="rgba(242,241,246,0.3)"
                keyboardAppearance="dark"
                style={s.input}
              />
            </>
          )}
          <Text style={s.label}>EMAIL</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="rgba(242,241,246,0.3)"
            autoCapitalize="none"
            keyboardType="email-address"
            keyboardAppearance="dark"
            style={s.input}
          />
          <Text style={s.label}>PASSWORD</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="6+ characters"
            placeholderTextColor="rgba(242,241,246,0.3)"
            secureTextEntry
            keyboardAppearance="dark"
            style={s.input}
            onSubmitEditing={() => void submit()}
          />

          <Pressable
            onPress={() => void submit()}
            style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <LinearGradient
              colors={grad.primary}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={s.btn}
            >
              <Text style={s.btnText}>
                {busy ? "…" : mode === "signup" ? "Create account" : "Log in"}
              </Text>
            </LinearGradient>
          </Pressable>
          {msg && (
            <Text style={[s.msg, { color: msg.ok ? c.earnBright : c.danger }]}>{msg.text}</Text>
          )}
        </View>
        <Text style={s.foot}>
          Auth &amp; purchase history live in Supabase. Payments settle in USDC over x402 on
          Algorand TestNet.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  title: {
    color: c.text,
    fontSize: 22,
    fontFamily: font.semibold,
    letterSpacing: -0.4,
    marginTop: 16,
  },
  sub: { color: c.faint, fontSize: 12.5, marginTop: 6, fontFamily: font.regular },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 20,
  },
  tabs: {
    flexDirection: "row",
    gap: 5,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.03)",
    marginBottom: 14,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: "center" },
  tabOn: { backgroundColor: "rgba(169,160,255,0.16)" },
  tabText: { color: c.muted, fontSize: 13, fontFamily: font.medium },
  label: {
    color: c.faint,
    fontSize: 10.5,
    letterSpacing: 0.7,
    fontFamily: font.medium,
    marginTop: 12,
    marginBottom: 7,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(10,10,11,0.5)",
    color: c.text,
    paddingHorizontal: 14,
    fontSize: 14.5,
    fontFamily: font.regular,
  },
  btn: {
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  btnText: { color: "#14121F", fontSize: 14.5, fontFamily: font.semibold },
  msg: {
    fontSize: 12.5,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
    fontFamily: font.regular,
  },
  foot: {
    color: c.dim,
    fontSize: 11,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 17,
    fontFamily: font.regular,
  },
});
