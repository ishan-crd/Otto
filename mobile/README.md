# Otto — mobile app (Expo)

The phone app for Otto: watch your agent's balance, live earn/spend feed, give it
a goal, and see the Spend Firewall in action. Talks to the Otto backend
(`~/Desktop/otto`) over its REST API.

## Run it

```bash
# 1. start the backend first (in ~/Desktop/otto)
cd ~/Desktop/otto && npm run dev        # http://localhost:8787

# 2. start the app (in ~/Desktop/otto/mobile)
cd ~/Desktop/otto/mobile && npm start
#   press  i  -> iOS simulator   (localhost works here)
#   press  w  -> web
```

### On a real phone (Expo Go)
Your phone can't reach your computer's `localhost`. Point the app at your
computer's LAN IP:

```bash
export EXPO_PUBLIC_OTTO_API=http://$(ipconfig getifaddr en0):8787   # then: npm start
```

## What's here (the base — extend this tomorrow)
- `App.tsx` — the single screen: wallet hero (balance + earned/spent flow bar),
  goal control, and the **live payment stream** (the signature element).
- `src/theme.ts` — design tokens. Premium dark "financial instrument" look:
  calm + trustworthy, with monospace tabular numbers + directional money color
  as the one crypto-native signature. Change the palette here in one place.
- `src/api.ts` — typed Otto backend client + the localhost gotcha note.

Updates poll every 1.5s (simple + reliable). To go real-time, swap polling for
SSE against `GET /api/stream` with `react-native-sse`.

## Ideas to build on event day
- Per-run report screen (the backend already returns `report` + `steps`).
- A budget slider that writes to the firewall live.
- Tabs: Wallet · Marketplace (`/api/services`) · Activity.
- Fonts: add Space Grotesk (display) + JetBrains Mono (numbers) via `expo-font`
  for a more distinctive identity than system fonts.
