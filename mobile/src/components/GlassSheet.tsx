import type { ReactNode } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { c, radius } from "../theme";

/**
 * Bottom sheet — ported from clip-merged's `ui/sheet.tsx`, minus the blur.
 *
 * The sheet body is TRANSPARENT on iOS (no BlurView / frosted fill) and OPAQUE
 * on Android (blur isn't dependable there). It keeps the sheet's shape DNA —
 * 34px top corners, grabber, the light top-edge highlight — and a controlled
 * `Modal` (transparent) so it slides up over a dimmed backdrop. No external
 * deps.
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <GlassBottomSheet visible={open} onClose={() => setOpen(false)}>
 *     <SheetHeader title="…" subtitle="…" onClose={() => setOpen(false)} />
 *     <View style={{ paddingHorizontal: SHEET_PADDING_X }}>…</View>
 *   </GlassBottomSheet>
 */

export const SHEET_PADDING_X = 20;
export const SHEET_HEADER_TOP = 20;
export const SHEET_TITLE_GAP = 8;
export const SHEET_BOTTOM = 32;
export const SHEET_CORNER_RADIUS = 34;

/** The sheet body: transparent on iOS, opaque fallback on Android. */
function SheetBody({
  children,
  fallback = false,
}: {
  children: ReactNode;
  fallback?: boolean;
}) {
  const opaque = Platform.OS !== "ios" || fallback;
  const rootStyle: StyleProp<ViewStyle> = {
    borderTopLeftRadius: SHEET_CORNER_RADIUS,
    borderTopRightRadius: SHEET_CORNER_RADIUS,
    overflow: "hidden",
    maxHeight: "88%",
    backgroundColor: opaque ? c.surface : "transparent",
  };

  return (
    <View style={rootStyle}>
      {/* grabber */}
      <View style={s.grabberWrap} pointerEvents="none">
        <View style={s.grabber} />
      </View>
      {/* top-edge highlight — the light rim that reads as a pane's edge */}
      <View pointerEvents="none" style={s.topHighlight} />
      {children}
    </View>
  );
}

export function GlassBottomSheet({
  visible,
  onClose,
  children,
  scroll = false,
  fallback = false,
  contentStyle,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Scroll the body (long sheets). Default false = fit-to-content. */
  scroll?: boolean;
  /** Force the opaque look on iOS too. */
  fallback?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const body =
    scroll === true ? (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[{ paddingBottom: SHEET_BOTTOM }, contentStyle]}
      >
        {children}
      </ScrollView>
    ) : (
      <View style={[{ paddingBottom: SHEET_BOTTOM }, contentStyle]}>{children}</View>
    );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close sheet" />
        <SheetBody fallback={fallback}>{body}</SheetBody>
      </View>
    </Modal>
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
      <Text style={s.close}>✕</Text>
    </Pressable>
  ) : null;

  const titleText = title ? (
    <Text
      style={[
        s.title,
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
        <View style={s.rowCenter}>
          {titleText}
          {closeBtn && <View style={s.closeRight}>{closeBtn}</View>}
        </View>
      ) : title ? (
        <View style={s.rowBetween}>
          {titleText}
          {closeBtn}
        </View>
      ) : (
        closeBtn && <View style={s.rowEnd}>{closeBtn}</View>
      )}

      {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
    </View>
  );
}

/** Hairline divider for sheet lists. */
export function SheetDivider({ inset = SHEET_PADDING_X }: { inset?: number }) {
  return <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: inset }} />;
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  grabberWrap: { alignItems: "center", paddingTop: 8 },
  grabber: { width: 40, height: 5, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.22)" },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    borderTopLeftRadius: SHEET_CORNER_RADIUS,
    borderTopRightRadius: SHEET_CORNER_RADIUS,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  rowCenter: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowEnd: { flexDirection: "row", justifyContent: "flex-end" },
  closeRight: { position: "absolute", right: 0 },
  close: { color: c.muted, fontSize: 18, fontWeight: "600" },
  title: { color: c.text, fontSize: 20, fontWeight: "700" },
  subtitle: { color: c.muted, fontSize: 14, lineHeight: 20, marginTop: SHEET_TITLE_GAP, textAlign: "center" },
});
