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

export async function getReciters() {
  try {
    const recitations = await quranClient.resources.findAllRecitations();
    
    return recitations
      .map(r => {
        let name = "Unknown Reciter";
        if (r.reciterName) name = r.reciterName;
        else if (r.translatedName && typeof r.translatedName.name === 'string') name = r.translatedName.name;
        
        const style = r.style || "";
        if (style) name = `${name} (${style})`;

        return {
          id: `qcom:${r.id}`,
          originalId: r.id,
          name: name,
          style: style,
          source: 'qcom'
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

export async function getChapterAudio(chapterId, reciterId = "qcom:7") {
  try {
    const [, id] = typeof reciterId === 'string' && reciterId.includes(':') 
      ? reciterId.split(':') 
      : ['qcom', reciterId];

    const response = await quranClient.audio.findVerseRecitationsByChapter(
      chapterId.toString(),
      id.toString(),
      { fields: { segments: true, format: true, id: true } }
    );

    const files = response.audioFiles || [];

    // Normalize segments to: [wordFrom, wordTo, startTime, endTime]
    // Quran.com provides: [wordIndex, ?, startTime, endTime]
    return files.map(file => {
      if (file.segments) {
        file.segments = file.segments.map(s => {
          // If segment has 4 elements, it's [wordIdx, something, start, end]
          // If 3 elements, it's [wordIdx, start, end]
          if (s.length === 4) {
            return [s[0], s[0], s[2], s[3]];
          } else {
            return [s[0], s[0], s[1], s[2]];
          }
        });
      }
      return file;
    });
  } catch (error) {
    console.error("[Audio Fetch Error]", error);
    return [];
  }
}
