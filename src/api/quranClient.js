/**
 * Quran Foundation Content API Client
 * Direct fetch through /api-proxy (Cloudflare Worker handles auth).
 * No @quranjs/api library — it was stripping data and crashing on edge cases.
 */

const API = '/api-proxy/content/api/v4';

async function apiFetch(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function getReciters() {
  try {
    const data = await apiFetch('/resources/recitations');
    return (data.recitations || [])
      .map(r => {
        let name = r.translated_name?.name || r.reciter_name || 'Unknown Reciter';
        const style = r.style || '';
        if (style) name = `${name} (${style})`;
        return { id: `qcom:${r.id}`, originalId: r.id, name, style, source: 'qcom' };
      })
      .filter(r => r.name !== 'Unknown Reciter')
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Reciters fetch failed:', error);
    return [];
  }
}

export async function getChapters() {
  try {
    const data = await apiFetch('/chapters');
    return (data.chapters || []).map(c => ({
      id: c.id,
      nameSimple: c.name_simple,
      nameArabic: c.name_arabic,
      nameComplex: c.name_complex,
      versesCount: c.verses_count,
      revelationPlace: c.revelation_place,
    }));
  } catch {
    return [];
  }
}

export async function getChapterVerses(chapterId, translationId = 131) {
  try {
    const data = await apiFetch(`/verses/by_chapter/${chapterId}?translations=${translationId}&words=true&per_page=300&word_fields=text_uthmani`);
    return (data.verses || []).map(v => ({
      ...v,
      // Map word IDs to match existing component expectations
      words: (v.words || []).map(w => ({
        ...w,
        id: w.id,
        textUthmani: w.text_uthmani,
        text: w.text,
        translation: w.translation,
        transliteration: w.transliteration,
        charTypeName: w.char_type_name,
        position: w.position,
      })),
      translationText: v.translations?.[0]?.text || '',
      translationResourceId: v.translations?.[0]?.resource_id || translationId,
    }));
  } catch {
    return [];
  }
}

export async function getTranslations() {
  try {
    const data = await apiFetch('/resources/translations');
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

export async function getChapterAudio(chapterId, reciterId = 'qcom:7') {
  try {
    const [, id] = typeof reciterId === 'string' && reciterId.includes(':')
      ? reciterId.split(':')
      : ['qcom', reciterId];

    const data = await apiFetch(`/recitations/${id}/by_chapter/${chapterId}?fields=segments,format,id`);
    const files = data.audio_files || [];

    return files.map(file => {
      // Normalize segment format: [verseKey, verseKey, startMs, endMs]
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
    console.error('[Audio Fetch Error]', error);
    return [];
  }
}
