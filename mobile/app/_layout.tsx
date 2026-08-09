import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { c } from "../src/theme";

// iOS: transparent so Apple's Liquid Glass shows THROUGH the sheet (that's the
// glassmorphism). Android has no glass, so fall back to an opaque surface.
const sheetContentBg = Platform.OS === "ios" ? "transparent" : c.surface;

const sheetOptions = {
  presentation: "formSheet" as const,
  headerShown: false,
  sheetGrabberVisible: true,
  sheetCornerRadius: 34,
  contentStyle: { backgroundColor: sheetContentBg },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="test-sheet"
          options={{ ...sheetOptions, sheetAllowedDetents: [0.6, 1], sheetInitialDetentIndex: 0 }}
        />
        <Stack.Screen
          name="breakdown"
          options={{ ...sheetOptions, sheetAllowedDetents: [0.5, 0.9], sheetInitialDetentIndex: 0 }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
