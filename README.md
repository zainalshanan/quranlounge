
# Quran Lounge

A lofi-aesthetic Quran recitation web app. Listen to high-quality recitations with synchronized Arabic/English text, ambient soundscapes, and beautiful animated backgrounds.

**Live:** [quranlounge.pages.dev](https://quranlounge.pages.dev)

## Features

- **100+ Reciters** — sourced from the Quran Foundation API
- **Word-level highlighting** — synchronized with audio for Quran.com reciters
- **Ambient mixer** — rain, campfire, ocean waves, and more, with per-track volume
- **Themes & backgrounds** — video loops, CSS animations, canvas generative art
- **Bookmarks & notes** — save verses with personal annotations (requires Quran Foundation account)
- **Tafsir viewer** — inline and floating tafsir for any verse
- **Pomodoro timer & todo list** — built-in focus tools
- **Zen mode** — distraction-free fullscreen recitation
- **PWA-ready** — installable on mobile

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Zustand, Framer Motion, Howler.js |
| Backend | Cloudflare Pages Functions (Worker) |
| Caching | Cloudflare KV (tokens + API responses) |
| Storage | Cloudflare R2 (video/audio assets) |
| Database | Cloudflare D1 (radio clips) |
| Build | Vite 6 |

## Development

### Prerequisites

- Node.js ≥ 22.7
- A Cloudflare account with KV, R2, and D1 configured (see `wrangler.toml`)
- Quran Foundation OAuth credentials (see Environment Variables below)

### Setup

```bash
npm install

# Full-stack dev (Wrangler proxy + Vite) — use this for audio/API to work
npm run dev:full     # http://localhost:8788

# Frontend only
npm run dev          # http://localhost:5173
```

> Always use port **8788** for local dev — the audio and API proxies only work through Wrangler.

### Other Commands

```bash
npm run build        # Production build
npm run deploy       # Build + deploy to Cloudflare Pages
npm run lint         # ESLint
npm run test         # Vitest unit tests
```

## Environment Variables

Credentials are **never** committed. Set them once:

```bash
# Cloudflare Pages secrets (production)
npx wrangler pages secret put QURAN_CLIENT_ID
npx wrangler pages secret put QURAN_CLIENT_SECRET

# Local dev — create .env.local (git-ignored)
QURAN_CLIENT_ID=your_client_id
QURAN_CLIENT_SECRET=your_client_secret
```

OAuth credentials are issued by the [Quran Foundation](https://quran.foundation).

## Adding Content

- **Background video/animation** — add an entry to `BACKGROUNDS` in `src/store/usePlayerStore.js`
- **Ambient sound** — add an entry to `AMBIENT_TRACKS` in `src/store/usePlayerStore.js`, place the file in `public/assets/ambient/`
- **Radio clip** — upload `.mp4` to R2 under `radio/<file>`, insert a row into the D1 `clips` table

## Architecture Notes

See [`CLAUDE.md`](./CLAUDE.md) for a detailed architecture overview including the audio sync strategy, proxy design, and key patterns.

## License

Free to use, modify, and share. The Quran belongs to everyone.

## Contact

[zainalshanan@gmail.com](mailto:zainalshanan@gmail.com)
