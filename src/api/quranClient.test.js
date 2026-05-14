import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getChapterAudio, getReciters } from './quranClient';

globalThis.fetch = vi.fn();

const mockRecitationsResponse = {
  recitations: [
    { id: 7, reciter_name: 'Mishari Rashid al-`Afasy', translated_name: { name: 'Mishari Rashid Alafasy' }, style: 'Murattal' },
    { id: 1, reciter_name: 'AbdulBaset AbdulSamad', translated_name: { name: 'Abdul Basit Abdul Samad' }, style: '' },
  ],
};

const mockAudioFilesResponse = {
  audio_files: [
    { verse_key: '1:1', url: '/audio/001001.mp3', segments: [[0, 3, 0, 3500], [4, 6, 3500, 7000]] },
    { verse_key: '1:2', url: '/audio/001002.mp3', segments: [[0, 4, 0, 4000]] },
  ],
};

describe('quranClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  it('getReciters returns prefixed IDs and filters unknowns', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRecitationsResponse),
    });

    const reciters = await getReciters();
    expect(reciters.length).toBe(2);
    expect(reciters.every(r => r.id.startsWith('qcom:'))).toBe(true);
    expect(reciters.find(r => r.id === 'qcom:7')).toBeDefined();
  });

  it('getChapterAudio normalizes segment format', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAudioFilesResponse),
    });

    const files = await getChapterAudio(1, 'qcom:7');
    expect(files).toHaveLength(2);
    // Segments should be normalized to [wordFrom, wordFrom, startMs, endMs]
    expect(files[0].segments[0]).toEqual([0, 0, 0, 3500]);
    expect(files[0].segments[1]).toEqual([4, 4, 3500, 7000]);
  });

  it('getReciters returns empty array on fetch failure', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    const reciters = await getReciters();
    expect(reciters).toEqual([]);
  });
});
