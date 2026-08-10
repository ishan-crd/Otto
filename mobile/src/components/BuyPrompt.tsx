import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { otto, type PromptClaim, type PromptQuote, shortTx } from "../api";
import { c, font, grad, tabular } from "../theme";
import { useAppState } from "./AppState";
import { Mono } from "./ui";

/**
 * Buy-a-Prompt, native — the mobile twin of web /prompt. Type a prompt, pick a
 * model, get a quote priced by the actual answer size, pay over x402 (Otto's
 * funded account signs — real on-chain settle), and the answer unlocks.
 */
export function BuyPrompt() {
  const { toast } = useAppState();
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [prompt, setPrompt] = useState("");
  const [quote, setQuote] = useState<PromptQuote | null>(null);
  const [result, setResult] = useState<PromptClaim | null>(null);
  const [busy, setBusy] = useState<"quote" | "pay" | null>(null);

  useEffect(() => {
    otto
      .models()
      .then((r) => {
        const claude = r.models.filter((m) => m.id.startsWith("anthropic/")).slice(0, 3);
        const list = [
          ...claude.map((m) => ({ id: m.id, name: m.name })),
          { id: "openai/gpt-4o-mini", name: "GPT-4o mini" },
        ];
        setModels(list);
        if (list[0]) setModel(list[list.length - 1].id);
      })
      .catch(() => setModels([{ id: "openai/gpt-4o-mini", name: "GPT-4o mini" }]));
  }, []);

  const getQuote = async () => {
    const q = prompt.trim();
    if (!q || busy) return;
    setBusy("quote");
    setResult(null);
    setQuote(null);
    try {
      setQuote(await otto.promptQuote(q, model));
    } catch (err) {
      toast(String(err instanceof Error ? err.message : err));
    } finally {
      setBusy(null);
    }
  };

  const pay = async () => {
    if (!quote || busy) return;
    setBusy("pay");
    try {
      const r = await otto.promptClaimDemo(quote.jobId);
      if (!r.ok) throw new Error(r.detail ?? "payment failed");
      setResult(r);
      setQuote(null);
      toast(`✓ Paid $${Number(r.priceUsdc).toFixed(4)} · ${shortTx(r.txId ?? null)}`);
    } catch (err) {
      toast(String(err instanceof Error ? err.message : err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View>
      <Text style={s.big}>Buy a prompt.</Text>
      <Text style={s.lead}>
        Out of AI credits? It runs on a real model, is priced by the actual answer size, and unlocks
        once a USDC micropayment settles over x402.
      </Text>

      <View style={s.card}>
        <Text style={s.label}>MODEL</Text>
        <View style={s.chips}>
          {models.map((m) => {
            const on = m.id === model;
            return (
              <Pressable key={m.id} onPress={() => setModel(m.id)} style={[s.chip, on && s.chipOn]}>
                <Text style={[s.chipText, on && { color: c.text }]} numberOfLines={1}>
                  {m.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[s.label, { marginTop: 14 }]}>YOUR PROMPT</Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="e.g. Write a 6-line pitch for an AI that pays other AIs to do work."
          placeholderTextColor="rgba(242,241,246,0.3)"
          keyboardAppearance="dark"
          multiline
          style={s.input}
        />
        <Pressable
          onPress={() => void getQuote()}
          style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}
        >
          <LinearGradient
            colors={grad.primary}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={s.btn}
          >
            <Text style={s.btnText}>
              {busy === "quote" ? "Running the model…" : "Get quote & run"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {quote && (
        <View style={s.quote}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <View>
              <Text style={s.label}>PRICE FOR THIS ANSWER</Text>
              <Mono style={{ fontSize: 30, marginTop: 5, ...tabular }}>
                ${Number(quote.priceUsdc).toFixed(4)}
              </Mono>
              <Text style={s.breakdown}>
                base ${quote.baseUsdc.toFixed(3)} + {quote.outputTokens} × $
                {quote.perTokenUsdc.toFixed(5)}/token
              </Text>
            </View>
            <Mono style={{ fontSize: 11, color: c.faint }}>
              {quote.outputTokens} tokens · {quote.words} words
            </Mono>
          </View>
          <View style={s.preview}>
            <Text style={s.previewText} numberOfLines={3}>
              {quote.preview}
            </Text>
          </View>
          <Pressable
            onPress={() => void pay()}
            style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <LinearGradient
              colors={grad.primary}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={s.btn}
            >
              <Text style={s.btnText}>
                {busy === "pay" ? "Settling on Algorand…" : "Buy with Otto (demo)"}
              </Text>
            </LinearGradient>
          </Pressable>
          <Text style={s.note}>
            Pays from Otto's funded TestNet account — one tap, real on-chain settlement.
          </Text>
        </View>
      )}

      {result?.answer && (
        <View style={s.result}>
          <Text style={s.resultHead}>✓ Paid — here's your answer</Text>
          <Mono style={s.answer}>{result.answer}</Mono>
          <Pressable
            onPress={() => result.explorerUrl && void Linking.openURL(result.explorerUrl)}
            style={s.meta}
          >
            <Text style={s.metaText}>
              Paid ${Number(result.priceUsdc ?? 0).toFixed(4)} · {result.model} ·{" "}
              {result.outputTokens} tokens · tx {shortTx(result.txId ?? null)} ↗
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  big: {
    color: c.text,
    fontSize: 27,
    fontFamily: font.semibold,
    letterSpacing: -0.7,
    marginTop: 4,
  },
  lead: { color: c.muted, fontSize: 12.5, marginTop: 8, lineHeight: 18, fontFamily: font.regular },
  card: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 16,
  },
  label: { color: c.faint, fontSize: 10.5, letterSpacing: 0.7, fontFamily: font.medium },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 9 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    maxWidth: 180,
  },
  chipOn: { borderColor: "rgba(169,160,255,0.34)", backgroundColor: "rgba(169,160,255,0.16)" },
  chipText: { color: c.muted, fontSize: 12, fontFamily: font.medium },
  input: {
    marginTop: 9,
    minHeight: 92,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(10,10,11,0.5)",
    color: c.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14.5,
    fontFamily: font.regular,
    textAlignVertical: "top",
  },
  btn: {
    marginTop: 14,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#14121F", fontSize: 14, fontFamily: font.semibold },
  quote: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(169,160,255,0.28)",
    backgroundColor: "rgba(169,160,255,0.08)",
    padding: 16,
  },
  breakdown: { color: c.dim, fontSize: 10.5, marginTop: 4, fontFamily: font.regular },
  preview: {
    marginTop: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "rgba(10,10,11,0.45)",
    padding: 12,
  },
  previewText: { color: c.muted, fontSize: 12.5, lineHeight: 18, fontFamily: font.regular },
  note: {
    color: c.dim,
    fontSize: 11,
    marginTop: 10,
    textAlign: "center",
    fontFamily: font.regular,
  },
  result: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(143,227,180,0.28)",
    backgroundColor: "rgba(143,227,180,0.07)",
    padding: 16,
  },
  resultHead: { color: c.earnBright, fontSize: 14, fontFamily: font.semibold },
  answer: { fontSize: 13, lineHeight: 20, marginTop: 10, color: c.text },
  meta: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border },
  metaText: { color: c.muted, fontSize: 11.5, fontFamily: font.regular },
});
