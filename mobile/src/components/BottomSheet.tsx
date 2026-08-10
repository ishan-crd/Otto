/**
 * Otto's bottom-sheet layer — a single app-wide glass sheet host plus a toast,
 * driven by React context so any screen can call `sheet.open(...)`. Faithful to
 * the design's custom blurred sheet (rounded top, grabber, slide-up), rather
 * than the OS formSheet, so the glassmorphism matches on iOS and Android.
 *
 * Sheets: fund · withdraw · connect · hire · approve · receipt.
 */
import { BlurView } from "expo-blur";
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
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { FUND_AMOUNTS, findGig, type Row, WALLETS } from "../data";
import { c, font, tabular } from "../theme";
import { Mono, PrimaryButton } from "./ui";

type SheetKind = "fund" | "withdraw" | "connect" | "hire" | "approve" | "receipt";
interface Payload {
  row?: Row;
  agentTitle?: string;
}

interface SheetApi {
  open: (kind: SheetKind, payload?: Payload) => void;
  close: () => void;
  toast: (text: string) => void;
}

const Ctx = createContext<SheetApi | null>(null);

export function useSheet(): SheetApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSheet must be used within SheetProvider");
  return v;
}

export function SheetProvider({ children }: { children: ReactNode }) {
  const [kind, setKind] = useState<SheetKind | null>(null);
  const [payload, setPayload] = useState<Payload>({});
  const [toastText, setToastText] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sheet-local state that survives across opens (matches the design).
  const [fundAmount, setFundAmount] = useState<number>(500);
  const [qty, setQty] = useState(5);
  const [connected, setConnected] = useState<string[]>(["base"]);

  const open = useCallback((k: SheetKind, p: Payload = {}) => {
    setPayload(p);
    setKind(k);
    if (k === "hire") setQty(5);
  }, []);
  const close = useCallback(() => setKind(null), []);

  const toast = useCallback((text: string) => {
    setToastText(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastText(""), 2600);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const api = useMemo<SheetApi>(() => ({ open, close, toast }), [open, close, toast]);

  const connect = (key: string, name: string) => {
    if (!connected.includes(key)) {
      setConnected((cs) => [...cs, key]);
      toast(`${name} connected`);
    }
    close();
  };

  return (
    <Ctx.Provider value={api}>
      <View style={{ flex: 1 }}>{children}</View>
      <SheetHost
        kind={kind}
        payload={payload}
        onClose={close}
        fundAmount={fundAmount}
        setFundAmount={setFundAmount}
        qty={qty}
        setQty={setQty}
        connected={connected}
        connect={connect}
        toast={toast}
      />
      <Toast text={toastText} />
    </Ctx.Provider>
  );
}

/* ------------------------------------------------------------------ Host --- */

interface HostProps {
  kind: SheetKind | null;
  payload: Payload;
  onClose: () => void;
  fundAmount: number;
  setFundAmount: (n: number) => void;
  qty: number;
  setQty: (fn: (n: number) => number) => void;
  connected: string[];
  connect: (key: string, name: string) => void;
  toast: (t: string) => void;
}

function SheetHost(props: HostProps) {
  const { kind, onClose } = props;
  const y = useRef(new Animated.Value(60)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (kind) {
      y.setValue(60);
      fade.setValue(0);
      Animated.parallel([
        Animated.spring(y, { toValue: 0, useNativeDriver: true, tension: 70, friction: 11 }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [kind, y, fade]);

  return (
    <Modal
      visible={kind !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
          <Pressable style={styles.backdrop} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: y }] }]}>
          <BlurView intensity={38} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(22,22,27,0.72)" }]} />
          <View style={styles.grabber} />
          <SheetBody {...props} />
        </Animated.View>
      </View>
    </Modal>
  );
}

function SheetBody(props: HostProps) {
  switch (props.kind) {
    case "fund":
      return <FundSheet {...props} />;
    case "withdraw":
      return <WithdrawSheet onClose={props.onClose} />;
    case "connect":
      return <ConnectSheet connected={props.connected} connect={props.connect} />;
    case "hire":
      return <HireSheet {...props} />;
    case "approve":
      return <ApproveSheet onClose={props.onClose} />;
    case "receipt":
      return <ReceiptSheet row={props.payload.row} />;
    default:
      return null;
  }
}

/* ---------------------------------------------------------------- Sheets --- */

function SheetTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={styles.sheetTitle}>{title}</Text>
      {sub && <Text style={styles.sheetSub}>{sub}</Text>}
    </View>
  );
}

function FundSheet({ fundAmount, setFundAmount, onClose }: HostProps) {
  const amountStr = `$${fundAmount.toLocaleString("en-US")}.00`;
  return (
    <View>
      <SheetTitle title="Add funds" sub="Otto draws from this balance to pay other agents." />
      <View style={{ alignItems: "center", marginVertical: 22 }}>
        <Mono style={{ fontSize: 38, ...tabular }}>{amountStr}</Mono>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {FUND_AMOUNTS.map((v) => {
          const on = fundAmount === v;
          return (
            <Pressable
              key={v}
              onPress={() => setFundAmount(v)}
              style={[styles.amountChip, on && styles.amountChipOn]}
            >
              <Mono color={on ? c.text : c.muted} style={{ fontSize: 13 }}>
                ${v.toLocaleString("en-US")}
              </Mono>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.railRow}>
        <View style={styles.railGlyph}>
          <Text style={{ color: c.accentBright, fontSize: 14 }}>⌁</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.railName}>Mercury ···8821</Text>
          <Text style={styles.railNote}>ACH · arrives instantly</Text>
        </View>
        <Text style={styles.link}>Change</Text>
      </View>
      <PrimaryButton label={`Add ${amountStr}`} onPress={onClose} style={styles.cta} />
    </View>
  );
}

function WithdrawSheet({ onClose }: { onClose: () => void }) {
  return (
    <View>
      <SheetTitle title="Withdraw earnings" sub="Available now — escrowed funds stay with Otto." />
      <View style={styles.withdrawCard}>
        <Text style={styles.miniLabel}>WITHDRAWABLE</Text>
        <Mono color={c.earnBright} style={{ fontSize: 34, marginTop: 7, ...tabular }}>
          $1,266.20
        </Mono>
        <Text style={styles.railNote}>$18.40 held in open escrows</Text>
      </View>
      <View style={{ gap: 9 }}>
        <View
          style={[
            styles.railRow,
            {
              marginTop: 0,
              borderColor: "rgba(169,160,255,0.22)",
              backgroundColor: "rgba(169,160,255,0.08)",
            },
          ]}
        >
          <View style={styles.railGlyph}>
            <Text style={{ color: c.accentBright, fontSize: 14 }}>⌁</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.railName}>Mercury ···8821</Text>
            <Text style={styles.railNote}>1–2 business days · no fee</Text>
          </View>
          <View style={styles.check}>
            <Text style={{ color: "#15131F", fontSize: 10 }}>✓</Text>
          </View>
        </View>
        <View style={[styles.railRow, { marginTop: 0 }]}>
          <View
            style={[
              styles.railGlyph,
              { backgroundColor: "rgba(255,255,255,0.06)", borderColor: c.border },
            ]}
          >
            <Text style={{ color: c.muted, fontSize: 14 }}>◈</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.railName}>Base wallet 0x4c…9f2</Text>
            <Text style={styles.railNote}>USDC · ~2s · $0.01 network fee</Text>
          </View>
        </View>
      </View>
      <PrimaryButton label="Withdraw $1,266.20" onPress={onClose} style={styles.cta} />
    </View>
  );
}

function ConnectSheet({
  connected,
  connect,
}: {
  connected: string[];
  connect: (k: string, n: string) => void;
}) {
  return (
    <View>
      <SheetTitle title="Connect a wallet" sub="Otto settles agent-to-agent payments in USDC." />
      <View style={{ gap: 9, marginTop: 16 }}>
        {WALLETS.map((w) => {
          const on = connected.includes(w.key);
          return (
            <Pressable
              key={w.key}
              onPress={() => connect(w.key, w.name)}
              style={[styles.railRow, { marginTop: 0 }]}
            >
              <View
                style={[
                  styles.railGlyph,
                  on ? {} : { backgroundColor: "rgba(255,255,255,0.05)", borderColor: c.border },
                ]}
              >
                <Text style={{ color: on ? c.accentBright : c.muted, fontSize: 14 }}>
                  {w.glyph}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.railName}>{w.name}</Text>
                <Text style={styles.railNote}>{w.note}</Text>
              </View>
              <View
                style={[
                  styles.statePill,
                  on
                    ? {
                        backgroundColor: "rgba(143,227,180,0.08)",
                        borderColor: "rgba(143,227,180,0.18)",
                      }
                    : {
                        backgroundColor: "rgba(169,160,255,0.1)",
                        borderColor: "rgba(169,160,255,0.22)",
                      },
                ]}
              >
                <Text
                  style={{
                    color: on ? c.earn : c.accentBright,
                    fontSize: 9.5,
                    fontFamily: font.medium,
                    letterSpacing: 0.5,
                  }}
                >
                  {on ? "CONNECTED" : "CONNECT"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.finePrint}>
        Otto can only spend inside the limits you set. You keep the keys.
      </Text>
    </View>
  );
}

function HireSheet({ payload, qty, setQty, onClose, toast }: HostProps) {
  const gig = payload.agentTitle ? findGig(payload.agentTitle) : undefined;
  const rate = gig ? parseFloat(gig.price.replace("$", "")) : 0;
  const total = `$${(rate * qty).toFixed(2)}`;
  const name = gig?.agent ?? "Agent";
  return (
    <View>
      <SheetTitle
        title={`Hire ${name}`}
        sub="Otto pays per completed task, held in escrow until delivery."
      />
      <View style={styles.hireCard}>
        <View style={styles.spread}>
          <Text style={styles.rowLabel}>Rate</Text>
          <Mono style={{ fontSize: 15 }}>{gig?.price ?? "$0.00"}</Mono>
        </View>
        <View style={styles.hairline} />
        <Text style={styles.miniLabel}>TASKS TO BUY</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12 }}>
          <Pressable onPress={() => setQty((n) => Math.max(1, n - 1))} style={styles.stepper}>
            <Text style={styles.stepperText}>−</Text>
          </Pressable>
          <Mono style={{ flex: 1, textAlign: "center", fontSize: 26, ...tabular }}>{qty}</Mono>
          <Pressable onPress={() => setQty((n) => Math.min(50, n + 1))} style={styles.stepper}>
            <Text style={styles.stepperText}>+</Text>
          </Pressable>
        </View>
        <View style={styles.hairline} />
        <View style={styles.spread}>
          <Text style={{ color: c.text, fontSize: 13, fontFamily: font.regular }}>
            Escrow total
          </Text>
          <Mono color={c.accentBright} style={{ fontSize: 20, ...tabular }}>
            {total}
          </Mono>
        </View>
      </View>
      <View style={styles.escrowNote}>
        <View style={styles.escrowGlyph}>
          <Text style={{ color: c.earn, fontSize: 13 }}>⛨</Text>
        </View>
        <Text style={styles.escrowText}>
          Funds release only on verified delivery. Unused tasks refund automatically.
        </Text>
      </View>
      <PrimaryButton
        label={`Escrow ${total} & hire`}
        onPress={() => {
          onClose();
          toast(`${name} hired · ${total} escrowed`);
        }}
        style={styles.cta}
      />
    </View>
  );
}

function ApproveSheet({ onClose }: { onClose: () => void }) {
  const rows: [string, string, boolean][] = [
    ["Flights · TAP 1046", "$842.00", false],
    ["Hotel · Casa Amalia, 5n", "$441.05", false],
    ["Agent fees", "$1.15", true],
  ];
  return (
    <View>
      <SheetTitle
        title="Approve booking"
        sub="Otto will charge your card and confirm with the airline and hotel."
      />
      <View style={[styles.hireCard, { gap: 11 }]}>
        {rows.map(([label, val, lav]) => (
          <View key={label} style={styles.spread}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Mono color={lav ? c.accentBright : c.text} style={{ fontSize: 13 }}>
              {val}
            </Mono>
          </View>
        ))}
        <View style={[styles.hairline, { marginVertical: 0 }]} />
        <View style={styles.spread}>
          <Text style={{ color: c.text, fontSize: 13, fontFamily: font.regular }}>Total</Text>
          <Mono style={{ fontSize: 21, ...tabular }}>$1,284.20</Mono>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 9, marginTop: 16 }}>
        <Pressable onPress={onClose} style={[styles.secondaryBtn, { flex: 1 }]}>
          <Text style={styles.secondaryText}>Not yet</Text>
        </Pressable>
        <PrimaryButton label="Confirm & pay" onPress={onClose} style={{ flex: 1.4 }} />
      </View>
    </View>
  );
}

function ReceiptSheet({ row }: { row?: Row }) {
  if (!row) return null;
  const inbound = row.dir === "in";
  return (
    <View>
      <View style={{ alignItems: "center" }}>
        <View
          style={[
            styles.receiptGlyph,
            inbound
              ? { backgroundColor: "rgba(143,227,180,0.09)", borderColor: "rgba(143,227,180,0.2)" }
              : { backgroundColor: "rgba(169,160,255,0.09)", borderColor: "rgba(169,160,255,0.2)" },
          ]}
        >
          <Text style={{ color: inbound ? c.earn : c.accent2, fontSize: 20 }}>
            {inbound ? "↑" : "↓"}
          </Text>
        </View>
        <Mono
          color={inbound ? c.earnBright : c.accentBright}
          style={{ fontSize: 32, marginTop: 14, ...tabular }}
        >
          {row.amount}
        </Mono>
        <Text style={{ color: c.muted, fontSize: 13.5, marginTop: 6, fontFamily: font.regular }}>
          {row.label}
        </Text>
      </View>
      <View style={styles.receiptCard}>
        <ReceiptLine label="Status" value="Settled" valueColor={c.earnBright} />
        <ReceiptLine label="Receipt" value={row.tx} mono />
        <ReceiptLine label="Time" value={row.time} mono />
        <ReceiptLine label="Network" value="USDC · Base" mono last />
      </View>
    </View>
  );
}

function ReceiptLine({
  label,
  value,
  valueColor,
  mono,
  last,
}: {
  label: string;
  value: string;
  valueColor?: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.receiptLine, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {mono ? (
        <Mono style={{ fontSize: 12.5 }}>{value}</Mono>
      ) : (
        <Text style={{ color: valueColor ?? c.text, fontSize: 12.5, fontFamily: font.regular }}>
          {value}
        </Text>
      )}
    </View>
  );
}

/* ----------------------------------------------------------------- Toast --- */

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
      <View style={styles.toastCheck}>
        <Text style={{ color: "#0F1712", fontSize: 12 }}>✓</Text>
      </View>
      <Text style={styles.toastText}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(4,4,6,0.6)" },
  sheet: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
    overflow: "hidden",
  },
  grabber: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetTitle: { color: c.text, fontSize: 20, fontFamily: font.semibold, letterSpacing: -0.3 },
  sheetSub: {
    color: c.muted,
    fontSize: 12.5,
    marginTop: 5,
    fontFamily: font.regular,
    lineHeight: 18,
  },

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

  hireCard: {
    marginTop: 20,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  spread: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { color: c.muted, fontSize: 12.5, fontFamily: font.regular },
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
  toastCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: c.earn,
    alignItems: "center",
    justifyContent: "center",
  },
  toastText: { color: "rgba(242,241,246,0.8)", fontSize: 12.5, fontFamily: font.regular, flex: 1 },
});
