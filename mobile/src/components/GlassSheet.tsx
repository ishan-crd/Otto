/**
 * Content primitives for the app's native `formSheet` routes (app/sheet/*).
 *
 * The glassmorphism comes from iOS itself: each sheet route is presented as a
 * `formSheet` with transparent content (see app/_layout.tsx), so on iOS 26+
 * Apple's Liquid Glass shows through. That's why SheetScreen is TRANSPARENT on
 * iOS — anything opaque would hide the glass. Android has no glass, so it falls
 * back to an opaque surface. The native sheet draws its own rounded corners and
 * grabber; these primitives are just the content.
 */
import type { ReactNode } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { c, font } from "../theme";

/** Root wrapper for a formSheet route's content. */
export function SheetScreen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const background = Platform.OS === "ios" ? "transparent" : c.surface;
  return (
    <View style={[styles.root, { backgroundColor: background, paddingBottom: 22 + insets.bottom }]}>
      {children}
    </View>
  );
}

/** Sheet heading — title (+ optional subtitle). */
export function SheetTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={styles.sheetTitle}>{title}</Text>
      {sub && <Text style={styles.sheetSub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 20, paddingTop: 28 },
  sheetTitle: { color: c.text, fontSize: 20, fontFamily: font.semibold, letterSpacing: -0.3 },
  sheetSub: {
    color: c.muted,
    fontSize: 12.5,
    marginTop: 5,
    fontFamily: font.regular,
    lineHeight: 18,
  },
});

/** Styles shared across the sheet routes. */
export const sheetStyles = StyleSheet.create({
  amountChip: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: c.border,
  },
  amountChipOn: {
    backgroundColor: "rgba(169,160,255,0.16)",
    borderColor: "rgba(169,160,255,0.24)",
  },

  railRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginTop: 16,
    padding: 15,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  railGlyph: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(169,160,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(169,160,255,0.2)",
  },
  railName: { color: c.text, fontSize: 13, fontFamily: font.regular },
  railNote: { color: c.faint, fontSize: 11, marginTop: 3, fontFamily: font.regular },
  link: { color: c.accent2, fontSize: 12, fontFamily: font.medium },

  withdrawCard: {
    marginVertical: 20,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(143,227,180,0.16)",
    backgroundColor: "rgba(143,227,180,0.06)",
    alignItems: "center",
  },
  miniLabel: { color: c.faint, fontSize: 11, letterSpacing: 0.6, fontFamily: font.medium },
  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: c.accent2,
    alignItems: "center",
    justifyContent: "center",
  },

  statePill: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  finePrint: {
    color: c.dim,
    fontSize: 11.5,
    marginTop: 16,
    lineHeight: 18,
    textAlign: "center",
    fontFamily: font.regular,
  },

  card: {
    marginTop: 20,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  spread: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { color: c.muted, fontSize: 12.5, fontFamily: font.regular },
  strong: { color: c.text, fontSize: 13, fontFamily: font.regular },
  hairline: { height: 1, backgroundColor: c.border, marginVertical: 14 },
  stepper: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: c.glass2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: { color: c.text, fontSize: 19, fontFamily: font.regular },

  escrowNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(143,227,180,0.16)",
    backgroundColor: "rgba(143,227,180,0.05)",
  },
  escrowGlyph: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: "rgba(143,227,180,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  escrowText: { flex: 1, color: c.muted, fontSize: 11.5, lineHeight: 17, fontFamily: font.regular },

  secondaryBtn: {
    height: 54,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: c.glass2,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: c.text, fontSize: 14.5, fontFamily: font.medium },

  receiptGlyph: {
    width: 54,
    height: 54,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  receiptCard: {
    marginTop: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 16,
  },
  receiptLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: c.hairline,
  },

  cta: { marginTop: 16, height: 54 },
});
