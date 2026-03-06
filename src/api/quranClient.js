import { QuranClient } from '@quranjs/api';

/**
 * PRODUCTION-READY PROXY CLIENT
 */

export const quranClient = new QuranClient({
  contentBaseUrl: "/api-proxy"
});

const fetcher = quranClient.fetcher;
fetcher.getAccessToken = async () => "proxied";

fetcher.fetch = async function(url, params) {
  const fullUrl = this.makeUrl(url, { ...this.config.defaults, ...params });
  
  const res = await fetch(fullUrl, {
    headers: { "Accept": "application/json" }
  });

  if (!res.ok) throw new Error(`Proxy Error: ${res.status}`);
  
  const json = await res.json();
  return camelizeKeys(json);
};

function camelizeKeys(obj) {
  if (Array.isArray(obj)) return obj.map(v => camelizeKeys(v));
  if (obj != null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      result[camelKey] = camelizeKeys(obj[key]);
      return result;
    }, {});
  }
  return obj;
}

/**
 * Optimized API Wrappers
 */

// UNLOCKED & FIXED: Using the full Verse Recitation list but filtering for quality.
export async function getReciters() {
  try {
    const recitations = await quranClient.resources.findAllRecitations();
    
    // 1. Filter out reciters that are known to be incomplete or low-res
    // 2. Fix the name glitch by properly extracting strings
    return recitations
      .map(r => {
        let name = "Unknown Reciter";
        if (r.reciterName) name = r.reciterName;
        else if (r.translatedName && typeof r.translatedName.name === 'string') name = r.translatedName.name;
        
        return {
          id: r.id,
          name: name,
          style: r.style?.name || ""
        };
      })
      .filter(r => r.name !== "Unknown Reciter")
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Reciters fetch failed:", error);
    return [];
  }
}

export async function getChapters() {
  try {
    return await quranClient.chapters.findAll();
  } catch (error) {
    return [];
  }
}

export async function getChapterVerses(chapterId, translationId = 131) {
  try {
    return await quranClient.verses.findByChapter(chapterId.toString(), {
      translations: translationId.toString(), 
      words: true,
      perPage: 300,
      wordFields: { textUthmani: true }
    });
  } catch (error) {
    return [];
  }
}

export async function getChapterAudio(chapterId, reciterId = 7) {
  try {
    // This is the core endpoint for Verse-by-Verse data
    const response = await quranClient.audio.findVerseRecitationsByChapter(
      chapterId.toString(),
      reciterId.toString(),
      { fields: { segments: true, format: true, id: true } }
    );
    return response.audioFiles || [];
  } catch (error) {
    return [];
  }
}
