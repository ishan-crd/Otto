import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { money, otto, shortTx } from "../../src/api";
import { useAppState } from "../../src/components/AppState";
import { SheetScreen, SheetTitle, sheetStyles as ss } from "../../src/components/GlassSheet";
import { Mono, PrimaryButton } from "../../src/components/ui";
import { findGig } from "../../src/data";
import { c, font, tabular } from "../../src/theme";

/**
 * Hire sheet. With a `svc` param (a live marketplace agent) the CTA executes a
 * REAL x402 purchase — Otto's client pays the agent's endpoint (402 → pay →
 * verify → settle) and the toast carries the real tx id. For an "Otto sells"
 * listing it simulates an inbound client paying Otto instead. Without `svc`
 * (design-fixture gigs) it keeps the original mock escrow flow.
 */
export default function HireSheet() {
  const router = useRouter();
  const { toast } = useAppState();
  const params = useLocalSearchParams<{
    title?: string;
    svc?: string;
    agent?: string;
    price?: string;
    unit?: string;
    sell?: string;
  }>();
  const [qty, setQty] = useState(5);
  const [busy, setBusy] = useState(false);

  const isLive = Boolean(params.svc);
  const isSell = params.sell === "1";
  const gig = !isLive && params.title ? findGig(params.title) : undefined;
  const name = params.agent ?? gig?.agent ?? "Agent";
  const price = params.price ?? gig?.price ?? "$0.00";
  const unit = params.unit ?? gig?.unit ?? "per task";
  const rate = Number.parseFloat(price.replace("$", "")) || 0;
  const total = isLive ? price : `$${(rate * qty).toFixed(2)}`;

  const confirmLive = async () => {
    if (busy || !params.svc) return;
    setBusy(true);
    try {
      if (isSell) {
        const entry = await otto.earn();
        toast(`✓ A client paid Otto ${money(entry.usdc)} · tx ${shortTx(entry.txId)}`);
      } else {
        const res = await otto.hire(params.svc, {});
        toast(`✓ Paid ${money(res.paid.usdc)} to ${name} · tx ${shortTx(res.txId)}`);
      }
      router.back();
    } catch (err) {
      toast(String(err instanceof Error ? err.message : err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SheetScreen>
      <SheetTitle
        title={isSell ? `Sell via ${name}` : `Hire ${name}`}
        sub={
          isSell
            ? "Simulate an external agent buying this skill from Otto."
            : "Otto pays per completed task over x402, settled in USDC."
        }
      />
      <View style={ss.card}>
        <View style={ss.spread}>
          <Text style={ss.rowLabel}>Rate</Text>
          <Mono style={{ fontSize: 15 }}>
            {price} {isLive ? unit : ""}
          </Mono>
        </View>
        {!isLive && (
          <>
            <View style={ss.hairline} />
            <Text style={ss.miniLabel}>TASKS TO BUY</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12 }}>
              <Pressable onPress={() => setQty((n) => Math.max(1, n - 1))} style={ss.stepper}>
                <Text style={ss.stepperText}>−</Text>
              </Pressable>
              <Mono style={{ flex: 1, textAlign: "center", fontSize: 26, ...tabular }}>{qty}</Mono>
              <Pressable onPress={() => setQty((n) => Math.min(50, n + 1))} style={ss.stepper}>
                <Text style={ss.stepperText}>+</Text>
              </Pressable>
            </View>
          </>
        )}
        <View style={ss.hairline} />
        <View style={ss.spread}>
          <Text style={[ss.strong, { fontFamily: font.regular }]}>
            {isSell ? "Otto earns" : "Total"}
          </Text>
          <Mono color={isSell ? c.earnBright : c.accentBright} style={{ fontSize: 20, ...tabular }}>
            {total}
          </Mono>
        </View>
      </View>
      <View style={ss.escrowNote}>
        <View style={ss.escrowGlyph}>
          <Text style={{ color: c.earn, fontSize: 13 }}>⛨</Text>
        </View>
        <Text style={ss.escrowText}>
          {isLive
            ? "Settles as a real x402 micropayment — 402 challenge, signed payment, on-chain receipt."
            : "Funds release only on verified delivery. Unused tasks refund automatically."}
        </Text>
      </View>
      <PrimaryButton
        label={
          busy
            ? "Settling…"
            : isSell
              ? "Simulate a client purchase"
              : isLive
                ? `Pay ${total} & hire`
                : `Escrow ${total} & hire`
        }
        onPress={() => {
          if (isLive) {
            void confirmLive();
          } else {
            router.back();
            toast(`${name} hired · ${total} escrowed`);
          }
        }}
        style={ss.cta}
      />
    </SheetScreen>
  );
}
