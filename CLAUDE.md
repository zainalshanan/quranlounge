# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server only (port 5173)
npm run dev:full     # Full stack: Wrangler + Vite (port 8788) — use this for proxy testing
npm run build        # Production build
npm run deploy       # Build + deploy to Cloudflare Pages
npm run lint         # ESLint
npm run test         # Vitest (all tests)
```

To run a single test file:
```bash
npx vitest run src/api/qul.test.js
```

**Important:** Always use port **8788** (Wrangler) for local dev, not 5173, so the API and audio proxies work.

## Architecture

QuranLounge is a lofi-aesthetic Quran recitation web app. It runs as a React SPA with a Cloudflare Pages Function acting as a backend proxy.

### Data Flow

1. **App init** (`Home.jsx`): Fetches chapters and reciters in parallel, then loads the current chapter's verse and audio data via `usePlayerStore.loadChapterData()`.
2. **API layer** (`src/api/quranClient.js`): Merges two reciter sources:
   - **`qcom` (Quran.com)**: Uses `@quranjs/api` routed through `/api-proxy`. Returns per-verse `.mp3` files with word-level segment timestamps.
   - **`local` (QUL)**: Reads `public/data/QUL/<folder>/surah.json` and `segments.json`. Returns a single surah-level `.mp3` with verse-level timestamps.
3. **Store** (`src/store/usePlayerStore.js`): Single Zustand store for all state — playback, UI, themes, ambient mixer, todos, pomodoro config. Persists most state to `localStorage` with `ql_` prefix. Constants (THEMES, BACKGROUNDS, AMBIENT_TRACKS, PRESETS, TEXT_STYLE_PRESETS) are also exported from this file.
4. **Audio engine** (`src/hooks/useAudioPlayer.js`): Uses Howler.js. Two playback modes:
   - **qcom**: Verse-by-verse `.mp3` files; `onend` triggers `advanceVerse()`.
   - **local/QUL**: Single surah `.mp3` audio sprite; a `requestAnimationFrame` loop reads `howl.seek()` to drive `currentVerseIndex` and word highlighting (audio clock drives React state, not the reverse).
5. **Cloudflare Worker** (`functions/[[path]].js`): Proxies `/api-proxy/*` and `/audio-proxy/*`. Handles OAuth2 with Quran Foundation, caches tokens in Cloudflare KV (`QURAN_CACHE`), and caches API/audio responses at the edge.

### Reciter ID Format

Reciters use prefixed IDs: `qcom:<number>` for Quran.com reciters, `local:<slug>` for QUL reciters. Never use bare numeric IDs — always use the prefixed format.

### Key Patterns

- **Stutter prevention**: `isTransitioningRef` in `useAudioPlayer.js` prevents the `useEffect` from redundantly seeking when the rAF loop already advanced the verse.
- **Abort controller**: `loadChapterData` cancels in-flight requests and synchronously destroys the current Howl (via `_requestAudioDestroy` registered from the hook) before starting a new load.
- **Data cache**: `dataCache` in the store (keyed `chapterId_reciterId`) avoids redundant API calls for previously loaded chapters.
- **Theme CSS vars**: Theme colors are applied as CSS custom properties on `document.documentElement` (e.g., `--theme-accent`, `--theme-bg`). Use these variables in CSS rather than hardcoded colors.

### Sidebar Panels

The sidebar (`src/components/Sidebar.jsx`) renders different panels based on `activeSidebarPanel` in the store: `presets`, `quran`, `ambient`, `display`, `style`, `settings`, `pomodoro`, `todo`.

### Adding Content

- **New background**: Add to `BACKGROUNDS` array in `usePlayerStore.js`.
- **New ambient sound**: Add to `AMBIENT_TRACKS` array in `usePlayerStore.js`.
- **New QUL reciter**: Add entry to `src/api/localReciters.json`; place audio data in `public/data/QUL/<folder>/`.

## Environment Variables

- `.env.local` — pre-production/test Quran Foundation credentials (git-ignored)
- `.env` — production credentials
- Cloudflare secrets (`QURAN_CLIENT_ID`, `QURAN_CLIENT_SECRET`) must be set via `wrangler pages secret put` or Cloudflare dashboard.

## Proxy Rules

- Never call Quran Foundation APIs (`apis.quran.foundation`, `verses.quran.com`) directly from the browser — always go through `/api-proxy` or `/audio-proxy`.
- All new audio logic must use the `destroyRecitation` pattern in `useAudioPlayer.js` to prevent memory leaks.
