import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from "@expo-google-fonts/jetbrains-mono";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppStateProvider } from "../src/components/AppState";
import { c } from "../src/theme";

// iOS: transparent so Apple's Liquid Glass shows THROUGH the sheet (that's the
// glassmorphism). Android has no glass, so fall back to an opaque surface.
const sheetContentBg = Platform.OS === "ios" ? "transparent" : c.surface;
const sheetOptions = {
  presentation: "formSheet" as const,
  headerShown: false,
  sheetGrabberVisible: true,
  sheetCornerRadius: 34,
  sheetAllowedDetents: "fitToContents" as const,
  contentStyle: { backgroundColor: sheetContentBg },
};

const SHEETS = ["fund", "withdraw", "connect", "hire", "approve", "receipt"];

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  // Hold the near-black background until fonts are ready — avoids a flash of
  // system font, and text mounts already in Space Grotesk / JetBrains Mono.
  if (!loaded) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppStateProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: c.bg },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="agent/[title]" options={{ animation: "slide_from_right" }} />
          {SHEETS.map((name) => (
            <Stack.Screen key={name} name={`sheet/${name}`} options={sheetOptions} />
          ))}
        </Stack>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
