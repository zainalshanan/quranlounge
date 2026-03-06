import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getChapterAudio, getReciters } from './quranClient';

// Mock fetch for local data
global.fetch = vi.fn();

const mockLocalReciters = [
  {
    "id": "local:abdullah-ali-jabir",
    "name": "Abdullah Ali Jabir",
    "folder": "surah-recitation-abdullah-ali-jabir",
    "source": "local"
  }
];

const mockSurahJson = {
  "1": { "surah_number": 1, "audio_url": "https://example.com/001.mp3", "duration": 63 }
};

const mockSegmentsJson = {
  "1:1": { "timestamp_from": 0, "timestamp_to": 5000, "duration_ms": 5000 },
  "1:2": { "timestamp_from": 5000, "timestamp_to": 10000, "duration_ms": 5000 }
};

describe('QUL Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch and transform local reciter data correctly', async () => {
    fetch.mockImplementation((url) => {
      if (url.includes('surah.json')) return Promise.resolve({ json: () => Promise.resolve(mockSurahJson) });
      if (url.includes('segments.json')) return Promise.resolve({ json: () => Promise.resolve(mockSegmentsJson) });
      return Promise.reject(new Error('Unknown URL'));
    });

    const audioFiles = await getChapterAudio(1, 'local:abdullah-ali-jabir');

    expect(audioFiles).toHaveLength(2);
    expect(audioFiles[0]).toMatchObject({
      verseKey: '1:1',
      startTimeMs: 0,
      endTimeMs: 5000,
      url: 'https://example.com/001.mp3'
    });

    // Check segment mapping (verse-level highlighting)
    expect(audioFiles[0].segments[0]).toEqual([0, 999, 0, 5000]);
  });

  it('should include QUL label in reciter list', async () => {
    // This test assumes getReciters merges localReciters.json which we can't easily mock import
    // But we can check if it returns them
    const reciters = await getReciters();
    const qulReciter = reciters.find(r => r.id.startsWith('local:'));
    expect(qulReciter).toBeDefined();
    expect(qulReciter.source).toBe('local');
  });
});
