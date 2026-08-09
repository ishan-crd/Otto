# Otto — mobile app (Expo)

The phone app for Otto: watch your agent's balance, live earn/spend feed, give it
a goal, and see the Spend Firewall in action. Talks to the Otto backend
(`~/Desktop/otto`) over its REST API.

## Run it

```bash
# 1. start the backend first (from the monorepo root)
cd ~/Desktop/otto && pnpm dev:web    # http://localhost:8787

# 2. start the app (in ~/Desktop/otto/mobile)
cd ~/Desktop/otto/mobile && pnpm start
#   press  i  -> iOS simulator   (localhost works here)
#   press  w  -> web
```

### On a real phone (Expo Go)
Your phone can't reach your computer's `localhost`. Point the app at your
computer's LAN IP:

```bash
export EXPO_PUBLIC_OTTO_API=http://$(ipconfig getifaddr en0):8787   # then: pnpm start
```

## What's here (the base — extend this tomorrow)

Uses **Expo Router** (file-based routing in `app/`):
- `app/_layout.tsx` — Stack + the native `formSheet` config that produces the
  glass sheets (`contentStyle: transparent` on iOS → Apple Liquid Glass shows
  through; opaque surface on Android).
- `app/index.tsx` — the home screen: wallet hero (balance + earned/spent flow
  bar), goal control, and the **live payment stream** (the signature element).
- `app/breakdown.tsx`, `app/test-sheet.tsx` — the two sheet routes, presented
  natively as glass form sheets.
- `src/theme.ts` — design tokens. Premium dark "financial instrument" look.
  Change the palette here in one place.
- `src/api.ts` — typed Otto backend client + the localhost gotcha note.
- `src/components/GlassSheet.tsx` — `SheetContainer` / `SheetHeader` /
  `SheetDivider` content primitives for the sheet routes.

### Glassmorphism = native, not blur
The glass is Apple's own **Liquid Glass** (iOS 26+), obtained by presenting a
route as a `formSheet` with a **transparent** `contentStyle` so the OS material
shows through — no `expo-blur`. To add a new glass sheet:

```tsx
// app/my-sheet.tsx — the content
export default function MySheet() {
  const router = useRouter();
  return (
    <SheetContainer>
      <SheetHeader title="…" onClose={() => router.back()} />
      <View style={{ paddingHorizontal: SHEET_PADDING_X }}>{/* content */}</View>
    </SheetContainer>
  );
}
```

```tsx
// app/_layout.tsx — register it as a glass form sheet
<Stack.Screen name="my-sheet" options={{ ...sheetOptions,
  sheetAllowedDetents: [0.5, 1], sheetInitialDetentIndex: 0 }} />
```

Open it from anywhere with `router.push("/my-sheet")`.

> ⚠️ Liquid Glass renders on **iOS 26+**. On older iOS a transparent form sheet
> looks plain/dark; Android uses the opaque `c.surface` fallback (set in
> `SheetContainer`). This is the tradeoff for dropping the `expo-blur`
> cross-device fallback.

Updates poll every 1.5s (simple + reliable). To go real-time, swap polling for
SSE against `GET /api/stream` with `react-native-sse`.

## Ideas to build on event day
- Per-run report screen (the backend already returns `report` + `steps`).
- A budget slider that writes to the firewall live.
- Tabs: Wallet · Marketplace (`/api/services`) · Activity.
- Fonts: add Space Grotesk (display) + JetBrains Mono (numbers) via `expo-font`
  for a more distinctive identity than system fonts.
