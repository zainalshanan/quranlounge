# QuranLounge Developer & Agent Guide

This document outlines the technical architecture, development workflow, and deployment instructions for QuranLounge.

## 🏗 Architecture Overview

QuranLounge is a high-performance, lofi-aesthetic web application built with **React**, **Zustand**, and **Cloudflare Workers**.

### 1. Frontend (React + Vite)
- **State Management:** `zustand` (`src/store/usePlayerStore.js`) manages the global state for audio, UI preferences, widgets (Clock/Pomodoro), and data caching.
- **Audio Engine:** `howler.js` (`src/hooks/useAudioPlayer.js`) handles dual-track playback (Recitation + Ambient Nature Sounds) with Web Audio for recitations to avoid HTML5 pool limits.
- **Data Fetching:** `@quranjs/api` via a custom proxy client (`src/api/quranClient.js`).

### 2. Backend Proxy (Cloudflare Pages Functions)
- **Location:** `functions/[[path]].js`
- **Purpose:** 
    - Securely handles OAuth2 handshakes with Quran Foundation using `CLIENT_SECRET`.
    - Caches authentication tokens in **Cloudflare KV** (`QURAN_CACHE`).
    - Implements **Global Edge Caching** for API responses and audio files to ensure near-instant global performance.
    - Proxies requests to `apis.quran.foundation` and `verses.quran.com`.

---

## 🛠 Development Workflow

### Prerequisites
- Node.js installed.
- Cloudflare account with a KV namespace created.

### Local Development
To test the full stack (Frontend + Backend Proxy) locally:
```bash
npm run dev:full
```
*Note: Always use port **8788** (Wrangler) for testing, NOT 5173 (Vite), to ensure the proxy logic is active.*

### Environment Variables
- **`.env.local`**: Use for **Pre-Production (Test)** credentials. (Ignored by Git).
- **`.env`**: Use for **Production (Live)** credentials.

---

## 🚀 Deployment Instructions

### 1. Secure Secrets
You must upload your Client ID and Secret to Cloudflare. Do this once via terminal:
```bash
npx wrangler pages secret put QURAN_CLIENT_ID
npx wrangler pages secret put QURAN_CLIENT_SECRET
```
*Alternatively, add them in the Cloudflare Dashboard under Settings -> Functions -> Variables.*

### 2. Build & Deploy
To deploy the latest version manually:
```bash
npm run build
npm run deploy
```

---

## 🔄 Updating the App

### To Add a New Background Scene:
1.  Add the GIF/Image URL to the `BACKGROUNDS` array in `src/store/usePlayerStore.js`.
2.  (Optional) Add a corresponding Preset in the `PRESETS` array.

### To Add a New Ambient Sound:
1.  Place the `.mp3` in `public/assets/audio/` or find a high-quality CDN link.
2.  Add the entry to the `AMBIENT_TRACKS` array in `src/store/usePlayerStore.js`.

### To Modify the Lofi Aesthetic:
- **UI Components:** Adjust `src/components/Player.css` (Glassmorphism settings).
- **Text Rendering:** Adjust `src/components/VerseDisplay.css` (Glow and spacing).

---

## 🛡 Security Mandates for AI Agents
- **Secrets:** Never log or commit `QURAN_CLIENT_SECRET`.
- **CORS:** Never attempt to call Quran Foundation APIs directly from the browser; always use the `/api-proxy` or `/audio-proxy` routes via the Worker.
- **Performance:** Ensure all new audio logic uses the `destroyHowl` pattern in `useAudioPlayer.js` to prevent memory leaks.
