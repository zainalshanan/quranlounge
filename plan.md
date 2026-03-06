# Integration Plan: Local Reciters & Timings (QUL)

## Goal
Add reciters from the `/Users/zain/Desktop/QUL` collection into the QuranLounge system with verse-level highlighting, ensuring logical separation from the Quran.com API.

## 1. Data Structure & Mapping
The local data format differs from Quran.com. We will adapt it as follows:
- **Reciter ID**: Prefixed with `local:` (e.g., `local:abdullah-ali-jabir`).
- **Timings**: `timestamp_from` and `timestamp_to` (ms) will be mapped to the `audioFiles` format used by the player.
- **Segments**: Since the local data has empty `segments` arrays, we will support **Verse-level highlighting** only for these reciters (word-level will be disabled).

## 2. Audio Hosting Strategy
**Recommendation: Cloudflare R2 + Custom Domain**
- **Why?** Git repositories and standard web hosts aren't built for GBs of audio. Cloudflare R2 is cost-effective, and using a CDN ensures fast delivery.
- **Short-term**: We will continue using the `audio-proxy` to stream from the original source (e.g., `download.quranicaudio.com`) to avoid CORS issues.
- **Long-term**: Upload the `.mp3` files to R2 and update the `audio_url` in our mapping.

## 3. Implementation Steps

### Phase 1: Local Indexing
Create `src/api/localReciters.json` to act as the registry for these reciters.
```json
[
  {
    "id": "local:abdullah-ali-jabir",
    "name": "Abdullah Ali Jabir",
    "folder": "surah-recitation-abdullah-ali-jabir",
    "source": "local"
  },
  ...
]
```

### Phase 2: API Client Updates (`src/api/quranClient.js`)
- **`getReciters()`**: Merge the local registry with the Quran.com list.
- **`getChapterAudio(chapterId, reciterId)`**: 
  - If `reciterId` starts with `local:`, fetch the corresponding `surah.json` and `segments.json` from the local file system (or a hosted JSON endpoint).
  - Transform the data into the internal `audioFiles` format.

### Phase 3: Player Store Updates (`src/store/usePlayerStore.js`)
- Ensure `reciterId` can handle string IDs (e.g., `local:ali-jabir`).
- Update `loadChapterData` to handle the new return format from `getChapterAudio`.

### Phase 4: UI Enhancements
- Update `QuranPanel.jsx` to display a "Local" or "Enhanced" badge next to these reciters.

## 4. Verification
- Verify that selecting a local reciter loads the correct `.mp3`.
- Verify that the verse highlights accurately as the audio plays.
- Ensure skipping and looping still work.
