# Quran Lounge — Recommendations & Media Sourcing Guide

## Feature Recommendations

### High Priority

1. **Verse Translations** — Add multi-language translation support (Urdu, French, Turkish, Indonesian). Use [quran.com API](https://api.quran.com) which provides 100+ translations
2. **Bookmarks & History** — Let users bookmark favourite verses and track recently played surahs
3. **Search Quran** — Full-text verse search with highlighting
4. **Offline Mode** — Cache audio/data in IndexedDB for airplane/no-WiFi listening
5. **Mobile PWA** — Add `manifest.json` + service worker for "Add to Home Screen" on mobile

### Medium Priority

6. **Tajweed Highlighting** — Color-code tajweed rules on Arabic words. [Quran.com API](https://api.quran.com/api/v4/quran/verses/uthmani_tajweed) provides tajweed-annotated text
7. **Reading Progress** — Track % of Quran completed, daily streaks, reading goals
8. **Social Sharing** — Share verse cards as images (canvas-rendered) to social media
9. **Schedule / Wird** — Assign portions of the Quran to specific days (like a khatam schedule)
10. **Recitation Speed** — 0.75x / 1x / 1.25x / 1.5x playback speed control

### Nice to Have

11. **Community Presets** — Let users share preset configurations (theme + bg + reciter + text style)
12. **Verse Reflections** — Personal notes/journaling on verses
13. **Desktop App** — Wrap in Electron/Tauri for a native desktop experience
14. **Audio Visualiser** — Waveform or frequency bars synced to recitation

---

## Audio Sourcing

### Quran Recitation Audio

- **Primary**: [Quran.com API](https://api.quran.com/api/v4/recitations) — Free, high-quality, 100+ reciters
- **Alternative**: [Every Ayah](https://everyayah.com/) — Direct MP3 downloads per verse, many reciters
- **Alternative**: [MP3Quran](https://www.mp3quran.net/) — Full surah-level audio, many reciters
- **CDN**: All audio hosted on Quran.com's CDN (`verses.quran.com` / `audio.qurancdn.com`)

### Ambient Sound Effects

| Sound        | Free Source                                               | Format  | License |
| ------------ | --------------------------------------------------------- | ------- | ------- |
| Rain         | [freesound.org/s/243627](https://freesound.org/s/243627/) | MP3/OGG | CC0     |
| Campfire     | [freesound.org/s/180277](https://freesound.org/s/180277/) | MP3/WAV | CC0     |
| Ocean Waves  | [freesound.org/s/398032](https://freesound.org/s/398032/) | MP3/OGG | CC0     |
| Forest Birds | [freesound.org/s/344140](https://freesound.org/s/344140/) | MP3/OGG | CC0     |
| Thunder      | [freesound.org/s/258650](https://freesound.org/s/258650/) | MP3/WAV | CC0     |
| Wind         | [freesound.org/s/215724](https://freesound.org/s/215724/) | MP3/WAV | CC0     |
| Stream       | [freesound.org/s/416961](https://freesound.org/s/416961/) | MP3/OGG | CC0     |
| Cafe Chatter | [freesound.org/s/423881](https://freesound.org/s/423881/) | MP3     | CC BY   |

> **Tip**: For production, download these, trim to ~2-minute loops, compress to 128kbps MP3, and self-host on your CDN.

---

## Background Media: GIF vs MP4

### Recommendation: **Use MP4 (or WebM) for production, GIF for prototyping**

|                  | GIF                   | MP4/WebM                      |
| ---------------- | --------------------- | ----------------------------- |
| **File size**    | 5–30 MB for a 5s loop | 200KB–2MB same quality        |
| **Quality**      | 256 colors, dithering | Full color, smooth            |
| **Performance**  | CPU-heavy decoding    | GPU-accelerated `<video>`     |
| **Looping**      | Native                | `<video loop muted autoplay>` |
| **Transparency** | Supported (rare)      | WebM supports alpha           |

### How to Use MP4 Backgrounds

```html
<video autoplay loop muted playsinline class="background-video">
  <source src="/assets/bg/campfire.mp4" type="video/mp4" />
</video>
```

### Where to Find Background Videos (Free)

| Source      | URL                                                               | License                | Best For                 |
| ----------- | ----------------------------------------------------------------- | ---------------------- | ------------------------ |
| **Pexels**  | [pexels.com/videos](https://www.pexels.com/videos/)               | Free, no attribution   | Nature, rain, fire, city |
| **Pixabay** | [pixabay.com/videos](https://pixabay.com/videos/)                 | Pixabay License (free) | Nature, space, abstract  |
| **Coverr**  | [coverr.co](https://coverr.co/)                                   | Free, commercial use   | Cinematic nature, city   |
| **Videezy** | [videezy.com](https://www.videezy.com/)                           | Mix (check per video)  | Nature, abstract         |
| **Mixkit**  | [mixkit.co/free-stock-video](https://mixkit.co/free-stock-video/) | Free license           | High quality loops       |

### Recommended Search Terms

- **Nature**: `rain window loop`, `campfire loop 4k`, `ocean waves aerial`, `forest fog timelapse`
- **Sky**: `northern lights timelapse`, `starry sky rotation`, `clouds time lapse night`
- **Indoor**: `cozy cafe rain`, `library ambience`, `mosque interior`, `candle flame`
- **Abstract**: `particles dark`, `gradient flow`, `bokeh lights`

### Processing Tips

1. **Trim** to 5–15 second loops using ffmpeg:
   ```bash
   ffmpeg -i input.mp4 -t 10 -c:v libx264 -crf 28 -vf scale=1920:-2 -an output.mp4
   ```
2. **Create WebM** for Chrome (even smaller):
   ```bash
   ffmpeg -i input.mp4 -t 10 -c:v libvpx-vp9 -crf 35 -b:v 0 -vf scale=1920:-2 -an output.webm
   ```
3. **Target size**: Under 2MB per loop for fast loading
4. **Strip audio**: Always use `-an` flag — ambient audio is handled separately
5. **Resolution**: 1920×1080 is sufficient; scale down with `-vf scale=1920:-2`

---

## Architecture Recommendations

### Near-term

- Migrate backgrounds from GIF URLs to self-hosted MP4 with `<video>` element
- Add a `<video>` fallback system: try WebM → MP4 → GIF → solid color
- Host ambient audio files on your own CDN (Cloudflare R2 is free for up to 10GB/month)

### Long-term

- Consider implementing a plugin system for community-contributed presets
- Add WebSocket support for "listen together" feature
- Explore Web Audio API for more advanced mixing (EQ, reverb on recitation)
