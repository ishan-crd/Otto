import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  SHEET_PADDING_X,
  SheetContainer,
  SheetDivider,
  SheetHeader,
} from "../src/components/GlassSheet";
import { c, mono, radius, space, tabular } from "../src/theme";

export default function TestSheet() {
  const router = useRouter();
  const [rows] = useState(randomRows);

  return (
    <SheetContainer>
      <SheetHeader
        title="Bottom sheet ✨"
        subtitle="Random test content — scroll it, swipe down or ✕ to close"
        onClose={() => router.back()}
      />
      <View style={{ paddingHorizontal: SHEET_PADDING_X, paddingTop: space.md }}>
        {rows.map((r, i) => (
          <View key={r.label}>
            <View style={st.row}>
              <Text style={st.label}>{r.label}</Text>
              <Text style={st.value}>{r.value}</Text>
            </View>
            {i < rows.length - 1 && <SheetDivider />}
          </View>
        ))}

        <Text style={st.para}>{LOREM}</Text>

        <View style={st.tagRow}>
          {["autonomous", "x402", "algorand", "usdc", "agentic", "micropayments"].map((t) => (
            <View key={t} style={st.tag}>
              <Text style={st.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    </SheetContainer>
  );
}

const LOREM =
  "Otto negotiates access to data it doesn't own, pays for exactly what it uses, and stops the moment the budget runs out. This paragraph is filler to test wrapping, line height, and scrolling inside the native glass sheet. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

function randomRows() {
  const rand = (n: number) => Math.floor(Math.random() * n);
  const hex = () => Math.random().toString(16).slice(2, 8).toUpperCase();
  const regions = ["ap-south-1", "us-east-1", "eu-west-2", "sa-east-1"];
  return [
    { label: "Agent ID", value: `otto-${hex()}` },
    { label: "Session", value: `#${rand(99999)}` },
    { label: "Requests today", value: `${rand(500) + 20}` },
    { label: "Avg latency", value: `${rand(180) + 40} ms` },
    { label: "Region", value: regions[rand(regions.length)]! },
    { label: "Trust score", value: `${rand(40) + 60}/100` },
    { label: "Last tx", value: `0x${hex()}${hex()}` },
  ];
}

const st = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  label: { color: c.muted, fontSize: 14 },
  value: { color: c.text, fontFamily: mono, fontSize: 15, fontWeight: "600", ...tabular },
  para: { color: c.muted, fontSize: 13.5, lineHeight: 20, marginTop: space.md },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: space.md },
  tag: { backgroundColor: c.accentSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { color: c.accent, fontSize: 12, fontFamily: mono },
});
