import { useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/usePlayerStore';
import { useShallow } from 'zustand/react/shallow';
import './VerseDisplay.css';

// ─── Memoized Word Component ───
// Prevents entire verse re-render when only one word highlights
const QuranWord = memo(({ word, isActive, highlightWordBg, highlightColor, highlightGlow }) => {
  return (
    <span
      className={`quran-word ${isActive ? 'active-word' : ''} ${isActive && highlightWordBg ? 'active-word-bg' : ''}`}
      style={isActive ? { color: highlightColor, textShadow: highlightGlow } : undefined}
      dangerouslySetInnerHTML={{ __html: word.textUthmani || word.text }}
    />
  );
});

const EnglishWord = memo(({ word, isActive, highlightWordBg, highlightColor, highlightGlow }) => {
  if (!word.translation?.text) return null;
  return (
    <span
      className={`en-word ${isActive ? 'active-word' : ''} ${isActive && highlightWordBg ? 'active-word-bg' : ''}`}
      style={isActive ? { color: highlightColor, textShadow: highlightGlow } : undefined}
      dangerouslySetInnerHTML={{ __html: word.translation.text }}
    />
  );
});

export default function VerseDisplay() {
  // Optimized selectors using shallow to prevent re-renders on stable object changes
  const {
    verses,
    currentVerseIndex,
    activeWordIds,
    displayLanguages,
    highlightArabic,
    highlightEnglish,
    highlightWordBg,
    showTextBackdrop,
    fontSizeScale,
    isLoadingChapter,
    activeTextStyle,
    customTextStyle,
  } = usePlayerStore(useShallow(s => ({
    verses: s.verses,
    currentVerseIndex: s.currentVerseIndex,
    activeWordIds: s.activeWordIds,
    displayLanguages: s.displayLanguages,
    highlightArabic: s.highlightArabic,
    highlightEnglish: s.highlightEnglish,
    highlightWordBg: s.highlightWordBg,
    showTextBackdrop: s.showTextBackdrop,
    fontSizeScale: s.fontSizeScale,
    isLoadingChapter: s.isLoadingChapter,
    activeTextStyle: s.activeTextStyle,
    customTextStyle: s.customTextStyle,
  })));

  const containerRef = useRef(null);

  // Scroll to top only when verse changes, not on every word highlight.
  // Word highlighting is visual (color/glow) — no need to scroll chase it.
  // This prevents long verses from hiding the translation below.
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentVerseIndex]);

  const currentVerse = verses[currentVerseIndex];
  const ts = customTextStyle || activeTextStyle;

  const arabicStyle = {
    fontSize: fontSizeScale !== 1 ? `calc(clamp(1.8rem, 4vw + 1rem, 3.5rem) * ${fontSizeScale})` : undefined,
    direction: 'rtl',
    color: ts.arabicColor,
    textShadow: ts.textShadow,
  };

  const englishStyle = {
    fontSize: fontSizeScale !== 1 ? `calc(clamp(0.9rem, 1vw + 0.5rem, 1.2rem) * ${fontSizeScale})` : undefined,
    direction: 'ltr',
    color: ts.englishColor,
    textShadow: ts.textShadow,
  };

  if (isLoadingChapter || !currentVerse) {
    return (
      <div className={`verse-display-container loading-state ${showTextBackdrop ? '' : 'no-backdrop'}`}>
        <div className="verse-loader">
          <div className="verse-loader-spinner" />
          <span className="verse-loader-text">{isLoadingChapter ? 'Loading surah...' : 'Preparing verses...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`verse-display-container ${showTextBackdrop ? '' : 'no-backdrop'}`} role="region" aria-label="Quran verse display" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentVerseIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="verse-content"
        >
          {displayLanguages.includes('arabic') && (
            <div className="verse-arabic" style={arabicStyle}>
              {currentVerse.words?.map((word) => (
                <QuranWord 
                  key={word.id} 
                  word={word} 
                  isActive={highlightArabic && activeWordIds.includes(word.id)}
                  highlightWordBg={highlightWordBg}
                  highlightColor={ts.highlightColor}
                  highlightGlow={ts.highlightGlow}
                />
              ))}
            </div>
          )}

          {displayLanguages.includes('english') && (
            <div className="verse-english" style={englishStyle}>
              {currentVerse.words?.map((word, idx) => (
                <EnglishWord 
                  key={`en-${word.id}-${idx}`} 
                  word={word} 
                  isActive={highlightEnglish && activeWordIds.includes(word.id)}
                  highlightWordBg={highlightWordBg}
                  highlightColor={ts.highlightColor}
                  highlightGlow={ts.highlightGlow}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
