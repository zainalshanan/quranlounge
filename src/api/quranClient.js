import { QuranClient } from '@quranjs/api';

/**
 * PRODUCTION-READY PROXY CLIENT
 */

export const quranClient = new QuranClient({
  contentBaseUrl: "/api-proxy"
});

// We only need to tell the client we are "authenticated" via the proxy
quranClient.fetcher.getAccessToken = async () => "proxied";

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
  } catch {
    return [];
  }
}

export async function getChapterVerses(chapterId, translationId = 131) {
  try {
    const res = await fetch(`/api-proxy/content/api/v4/verses/by_chapter/${chapterId}?translations=${translationId}&words=true&per_page=300&word_fields=text_uthmani`);
    const data = await res.json();
    return (data.verses || []).map(v => ({
      ...v,
      // Preserve verse-level translation (the selected translation like Khattab, Haleem, etc.)
      translationText: v.translations?.[0]?.text || '',
      translationResourceId: v.translations?.[0]?.resource_id || translationId,
    }));
  } catch {
    return [];
  }
}

export async function getTranslations() {
  try {
    const res = await fetch('/api-proxy/content/api/v4/resources/translations');
    const data = await res.json();
    return (data.translations || [])
      .map(t => ({
        id: t.id,
        name: t.translated_name?.name || t.name || 'Unknown',
        authorName: t.author_name || '',
        languageName: t.language_name || '',
      }))
      .sort((a, b) => a.languageName.localeCompare(b.languageName) || a.name.localeCompare(b.name));
  } catch {
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

    return files.map(file => {
      if (file.segments) {
        file.segments = file.segments.map(s => {
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
