# QuranLounge Developer & Agent Guide

This document outlines the technical architecture, development workflow, and deployment instructions for QuranLounge.

## Architecture Overview

QuranLounge is a high-performance, lofi-aesthetic web application built with **React 19**, **Zustand**, and **Cloudflare Workers**.

### 1. Frontend (React + Vite)
- **State Management:** `zustand` (`src/store/usePlayerStore.js`) manages global state. Reciter IDs use the prefixed format `qcom:<number>` (e.g. `qcom:7`).
- **Audio Engine:** `howler.js` via `src/hooks/useAudioPlayer.js`. Loads individual verse-by-verse `.mp3` files from the Quran Foundation CDN; `onend` triggers the next file.
- **Data Fetching:** `src/api/quranClient.js` handles all Quran Foundation API calls via the `/api-proxy` Cloudflare Worker route.

### 2. Backend Proxy (Cloudflare Pages Functions)
- **Location:** `functions/[[path]].js`
- **Purpose:**
  - Securely handles OAuth2 handshakes with Quran Foundation using `CLIENT_SECRET`.
  - Caches authentication tokens in **Cloudflare KV** (`QURAN_CACHE`).
  - Implements edge caching for API responses and audio.
  - Proxies requests to `apis.quran.foundation` and `verses.quran.com`.
  - Serves **Radio** clips from **Cloudflare R2** (`/assets/radio/<file>.mp4`) and picks a random active clip from the **D1** `clips` table via `/api/radio/random`.

### 3. Radio Feature
- MP4 clips are uploaded to R2 under `radio/<filename>`.
- The D1 database (`clips` table) stores metadata: `r2_key`, `title`, `speaker`, `category`, `duration_seconds`.
- The `RadioPlayer` component (`src/components/RadioPlayer.jsx`) fetches a random clip, plays it full-screen, and preloads the next one using a double-buffer video technique.

---

## Performance & Sync Logic

1. **Audio→State direction:** The Howler `onend` event (not a React timer) drives verse advancement, so React state never races ahead of audio.
2. **Stutter prevention:** `isTransitioningRef` in `useAudioPlayer.js` prevents the `useEffect` from redundantly seeking when the hook already advanced the verse index.
3. **Abort controller:** `loadChapterData` cancels in-flight requests and synchronously destroys the current Howl before starting a new load.

---

## Development Workflow

### Prerequisites
- Node.js ≥ 22.7
- Cloudflare account with KV, R2, and D1 configured (see `wrangler.toml`)

### Local Development
```bash
npm run dev:full   # Full stack: Wrangler + Vite at http://localhost:8788
npm run dev        # Frontend only at http://localhost:5173
```

> Always use port **8788** for local dev — audio and API proxies only work through Wrangler.

---

## Deployment

### Secrets (one-time setup)
```bash
npx wrangler pages secret put QURAN_CLIENT_ID
npx wrangler pages secret put QURAN_CLIENT_SECRET
```

### Build & Deploy
```bash
npm run build
npm run deploy
```

---

## Security Mandates for AI Agents
- **Secrets:** Never log or commit `QURAN_CLIENT_SECRET`.
- **CORS:** Never call Quran Foundation APIs directly from the browser — always use `/api-proxy` or `/audio-proxy`.
- **Memory leaks:** All new audio logic must use the `destroyRecitation` pattern in `useAudioPlayer.js`.
