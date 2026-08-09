import type { ReactNode } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { c } from "../theme";

/**
 * Sheet content primitives for Expo Router's native `formSheet` presentation.
 *
 * The glassmorphism comes from iOS itself: the route is presented as a
 * `formSheet` with `contentStyle: { backgroundColor: "transparent" }` (see
 * app/_layout.tsx), so on iOS 26+ Apple's Liquid Glass material shows through.
 * That's why SheetContainer is TRANSPARENT on iOS — anything opaque would hide
 * the glass. On Android (no glass) it falls back to an opaque surface.
 *
 * The native sheet draws its own rounded corners + grabber
 * (`sheetGrabberVisible`), so these primitives are just content styling.
 */

export const SHEET_PADDING_X = 20;
export const SHEET_HEADER_TOP = 14;
export const SHEET_TITLE_GAP = 8;
export const SHEET_BOTTOM = 32;

/** Root wrapper for a formSheet route's content. */
export function SheetContainer({
  children,
  scroll = true,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  // Transparent on iOS so the OS Liquid Glass shows through; opaque on Android.
  const background = Platform.OS === "ios" ? "transparent" : c.surface;

  if (!scroll) {
    return (
      <View style={[styles.root, { backgroundColor: background }]}>
        <View style={[{ paddingBottom: SHEET_BOTTOM }, contentStyle]}>{children}</View>
      </View>
    );
  }
  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[{ paddingBottom: SHEET_BOTTOM }, contentStyle]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** Standard header: centered title (+ optional subtitle) with a close button. */
export function SheetHeader({
  title,
  subtitle,
  onClose,
  align = "center",
  showClose = true,
}: {
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  align?: "center" | "left";
  showClose?: boolean;
}) {
  const closeBtn = showClose ? (
    <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
      <Text style={styles.close}>✕</Text>
    </Pressable>
  ) : null;

  const titleText = title ? (
    <Text
      style={[
        styles.title,
        { textAlign: align === "center" ? "center" : "left" },
        align === "center" ? { flex: 1 } : null,
      ]}
    >
      {title}
    </Text>
  ) : null;

  return (
    <View style={{ paddingTop: SHEET_HEADER_TOP, paddingHorizontal: SHEET_PADDING_X }}>
      {align === "center" && title ? (
        <View style={styles.rowCenter}>
          {titleText}
          {closeBtn && <View style={styles.closeRight}>{closeBtn}</View>}
        </View>
      ) : title ? (
        <View style={styles.rowBetween}>
          {titleText}
          {closeBtn}
        </View>
      ) : (
        closeBtn && <View style={styles.rowEnd}>{closeBtn}</View>
      )}

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

/** Hairline divider for sheet lists. */
export function SheetDivider({ inset = SHEET_PADDING_X }: { inset?: number }) {
  return <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: inset }} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rowCenter: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowEnd: { flexDirection: "row", justifyContent: "flex-end" },
  closeRight: { position: "absolute", right: 0 },
  close: { color: c.muted, fontSize: 18, fontWeight: "600" },
  title: { color: c.text, fontSize: 20, fontWeight: "700" },
  subtitle: { color: c.muted, fontSize: 14, lineHeight: 20, marginTop: SHEET_TITLE_GAP, textAlign: "center" },
});
