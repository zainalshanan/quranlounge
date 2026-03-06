import { describe, it, expect } from 'vitest';
import { getChapterVerses, getChapterAudio } from './quranClient';

describe('Highlight Synchronization Debug', () => {
  it('should verify timing segments match word positions for Chapter 1', async () => {
    const chapterId = 1;
    const verses = await getChapterVerses(chapterId);
    const audioFiles = await getChapterAudio(chapterId, 7); // Alafasy

    // Check Verse 1:1
    const verse1 = verses[0];
    const audio1 = audioFiles[0];

    console.log(`Verse ${verse1.verseKey} has ${verse1.words.length} words.`);
    console.log(`Verse ${verse1.verseKey} has ${audio1.segments?.length || 0} timing segments.`);

    // Check word positions
    const wordPositions = verse1.words.map(w => w.position);
    console.log('Word Positions:', wordPositions);

    if (audio1.segments) {
      console.log('Testing Range Logic (Hypothesis: 0-indexed segments to 1-indexed words)');
      
      audio1.segments.forEach((seg, i) => {
        const [wordFrom, wordTo] = seg;
        // Shift to 1-based
        const posFrom = wordFrom + 1;
        const posTo = wordTo + 1;
        
        const matchedWords = verse1.words.filter(w => w.position >= posFrom && w.position <= posTo);
        console.log(`Segment ${i} [${wordFrom}-${wordTo}]: matches word positions [${matchedWords.map(w => w.position).join(', ')}]`);
      });
    }

    expect(verse1.words.length).toBeGreaterThan(0);
  });
});
