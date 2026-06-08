# Crew

A React Native (Expo) travel discovery app with a high-performance feed, an **Ask Crew** chat bottom sheet, and a built-in performance overlay for frame-rate monitoring.

## Features

- **Discover feed** — 100+ curated trip bundles rendered with `@shopify/flash-list`
- **Ask Crew chat** — custom Reanimated bottom sheet with half/full snap points, fixed header, `FlatList` message list, and mock streaming responses with simulated token delay
- **Perf overlay** — toggleable FPS / frame-drop monitor with session p50/p95 frame times and scenario tagging (`feed_scroll`, `sheet_open`, etc.)
- **Remote images** — hero images loaded from remote URLs via `expo-image` with blurhash placeholders and memory-disk caching
- **Explore tab** — placeholder screen for saved trips

## Prerequisites

- [Node.js](https://nodejs.org/) 20.19+ (22 LTS recommended)
- [npm](https://www.npmjs.com/) 10+
- For device testing:
  - **Android:** [Android Studio](https://developer.android.com/studio) with an emulator, or a physical device with [Expo Go](https://expo.dev/go)
  - **iOS:** Xcode Simulator (macOS only), or Expo Go on a physical device

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/anirudh9909/crew.git
   cd crew
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   No environment variables or API keys are required — chat uses a local mock stream.

3. **Start the development server**

   ```bash
   npm start
   ```

   Then press `a` for Android, `i` for iOS, or `w` for web.

   Or run a platform directly:

   ```bash
   npm run android   # Android emulator / device
   npm run ios       # iOS simulator (macOS only)
   npm run web       # Web browser
   ```

## Project structure

```
src/
├── app/                 # Expo Router screens (Discover, Explore)
├── components/
│   ├── chat/            # Ask Crew bottom sheet, bubbles, input
│   ├── feed/            # FlashList feed, cards, FAB
│   └── perf/            # FPS overlay and toggle
├── hooks/               # Feature hooks (chat, feed, expanded cards, perf)
├── services/            # Mock streaming
├── constants/           # Layout, theme, stream/perf tuning
├── data/feed.json       # Static feed dataset
└── utils/               # Perf instrumentation, stream batching (+ *.test.ts)
```

Colocated `*.test.ts` files live next to the modules they cover.

## Regenerating feed data

To rebuild the static feed JSON (100+ items):

```bash
npm run generate-feed
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Start and open on Android |
| `npm run ios` | Start and open on iOS |
| `npm run web` | Start and open in browser |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Jest) |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run generate-feed` | Regenerate `src/data/feed.json` |

## State management rationale

This project intentionally avoids Redux, Zustand, or other global state libraries. State is scoped to where it is used, with four patterns chosen for performance and simplicity:

### 1. Colocated React state (`useState` + hooks)

**Chat (`useChat`)** — message list and streaming status live in a hook owned by `AskCrewSheet`. Messages are ephemeral UI state; there is no backend persistence, so lifting them into a global store would add complexity without benefit.

**Screen UI (`index.tsx`)** — sheet open/closed visibility for the FAB uses local `useState`, since only the Discover screen cares about it.

**Perf overlay (`PerfOverlayRoot`)** — overlay on/off is local state. When enabled, `usePerfMonitor` drives the display.

### 2. Split React Context for the chat sheet

**`chat-sheet-context`** uses three providers so streaming tokens do not re-render the whole sheet:

- **`ChatSheetActionsContext`** — stable `onSend` / `onInputFocus` callbacks
- **`ChatSheetStreamingContext`** — `isStreaming` flag (footer updates on start/end only)
- **`ChatSheetMessagesContext`** — message array (list subtree only)

`CrewSheet` (custom Reanimated panel) keeps animations on the UI thread; `useChat` remains the single source of truth for chat data.

### 3. External store for feed card expansion (`useSyncExternalStore`)

Expanded/collapsed card IDs are stored in a module-level `Set` with a lightweight pub/sub listener pattern (`useExpandedCardsStore`).

**Why not `useState` on the feed?** Toggling one card's details would otherwise re-render the parent and risk cascading updates across the FlashList. The external store lets individual cards subscribe to their own expansion state, while FlashList only receives `expandedCount` via `extraData` to invalidate `getItemType` recycling — keeping scroll performance stable on a 100+ item list.

### 4. Module singletons for perf sampling

**`perfFrameStore`** accumulates frame deltas on the JS thread (fed from Reanimated worklets via throttled flushes). A singleton avoids threading perf data through the component tree and keeps the overlay decoupled from feature code. Feature hooks call `perf.tagScenario()` at interaction boundaries without knowing about the overlay.

### Summary

| Concern | Approach | Rationale |
|---------|----------|-----------|
| Chat messages | `useState` in `useChat` | Ephemeral, sheet-scoped |
| Sheet wiring | Split React Context | Isolate list/footer/shell re-renders during streaming |
| Card expand/collapse | `useSyncExternalStore` + module store | Minimize FlashList re-renders |
| Feed data | Static JSON import | No network; predictable perf testing |
| Chat responses | Mock stream with artificial delay | Simulates loading/streaming without a backend |
| Perf metrics | Reanimated shared values + singleton store | UI-thread sampling, throttled React updates |

## Testing the app

After starting on a device or emulator:

1. **Feed** — scroll the Discover list; cards expand/collapse on tap; hero images load from remote URLs and cache on repeat scrolls
2. **Chat** — tap the **Ask Crew** FAB; sheet opens at half height; drag to full; send a message and confirm mock streaming with a loading indicator; scroll message history while pinned or after streaming completes
3. **Perf** — tap the **PERF** button (top-right) to enable the overlay; scroll the feed and open the chat sheet simultaneously; confirm FPS, drop count, scenario labels, and session p50/p95 update. Toggle PERF off and on to reset the session counter
4. **Explore** — switch to the Explore tab; placeholder screen loads

For methodology, bottleneck analysis, and recorded frame-time numbers, see [PERFORMANCE.md](./PERFORMANCE.md).

### Unit tests

Pure-logic tests cover perf sampling, stream batching, mock chat streaming, and feed data contracts. No device or native mocks required.

```bash
npm test
```

| Test file | Covers |
|-----------|--------|
| `src/utils/perf-frame-store.test.ts` | Drop counting, p50/p95, ring buffer |
| `src/utils/stream-batch.test.ts` | Token batching, flush, cancel |
| `src/services/mock-stream.test.ts` | Mock token emission and cancellation |
| `src/data/feed.test.ts` | ≥100 bundles, remote image URLs |

## Demo

**Screen recording:** _[Add your 2–3 minute video URL here]_

Record on a device or simulator showing all of the following **at the same time**:

1. PERF overlay enabled (FPS, drops, session p50/p95 visible)
2. Discover feed scrolling continuously
3. Ask Crew sheet open — send a message and show mock streaming

Static before/after perf screenshots are included in [assets/perf/](assets/perf/) and documented in [PERFORMANCE.md](./PERFORMANCE.md).

## Known limitations

- **Mock chat only** — responses are generated locally in `mock-stream.ts`. There is no real LLM integration, conversation history persistence, or network error handling beyond the mock path.
- **Static feed** — trip data is bundled JSON at build time. There is no pagination, pull-to-refresh, API fetching, or artificial feed load delay.
- **Explore tab is a placeholder** — "Saved Trips" has no bookmarking or navigation yet.
- **No persistence** — chat messages and expanded card state are in-memory only and reset when the app is restarted.
- **Stream batching trade-off** — tokens are batched every 200 ms (`STREAM_BATCH_MS` in `src/constants/stream-config.ts`) before React updates. This reduces jank during streaming but adds slight perceived latency versus unbatched updates. Set to `0` to compare the unbatched baseline.
- **Perf overlay is approximate** — metrics are useful for relative comparison during development, not production-grade profiling. JS-thread busy detection uses a heartbeat heuristic and may not catch every stall.
- **Platform differences** — bottom sheet keyboard behavior and safe-area insets are tuned primarily for iOS/Android; web support is best-effort.
- **Chat auto-scroll** — new tokens scroll to the bottom only while you are pinned there; scrolling up disables auto-scroll until you return to the bottom. Opening the sheet from closed snaps the list to the latest message.

## Tech stack

- [Expo SDK 56](https://docs.expo.dev/) + [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native 0.85](https://reactnative.dev/) + [React 19](https://react.dev/)
- Custom `CrewSheet` (Reanimated + Gesture Handler) — lightweight chat bottom sheet
- [@shopify/flash-list](https://shopify.github.io/flash-list/) — virtualized feed
- [expo-image](https://docs.expo.dev/versions/latest/sdk/image/) — remote image loading and caching
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) — perf frame callbacks and sheet animations

## License

Private submission project.
