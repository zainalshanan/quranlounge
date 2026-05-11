import { useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/usePlayerStore';
import { useShallow } from 'zustand/react/shallow';
import './VerseDisplay.css';

// ─── Memoized Word Component ───
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

// Word-by-word: Arabic word with its translation directly below
const WordPair = memo(({ word, isActive, highlightWordBg, highlightColor, highlightGlow, englishColor }) => {
  return (
    <span
      className={`word-pair ${isActive ? 'active-word' : ''} ${isActive && highlightWordBg ? 'active-word-bg' : ''}`}
      style={isActive ? { color: highlightColor, textShadow: highlightGlow } : undefined}
    >
      <span className="wp-arabic" dangerouslySetInnerHTML={{ __html: word.textUthmani || word.text }} />
      {word.translation?.text && (
        <span className="wp-translation" style={{ color: isActive ? highlightColor : englishColor }} dangerouslySetInnerHTML={{ __html: word.translation.text }} />
      )}
    </span>
  );
});

export default function VerseDisplay() {
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
    verseLayout,
    containerStyle,
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
    verseLayout: s.verseLayout,
    containerStyle: s.containerStyle,
  })));

  const containerRef = useRef(null);
  const showArabic = displayLanguages.includes('arabic');
  const showTranslation = displayLanguages.includes('english');

  // Reset scroll on verse change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentVerseIndex]);

  // Auto-scroll to keep active word visible for hands-free study.
  useEffect(() => {
    if (activeWordIds.length > 0 && containerRef.current) {
      const activeElement = containerRef.current.querySelector('.active-word');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeWordIds]);

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
      <div className={`verse-display-container container-${containerStyle} loading-state ${showTextBackdrop ? '' : 'no-backdrop'}`}>
        <div className="verse-loader">
          <div className="verse-loader-spinner" />
          <span className="verse-loader-text">{isLoadingChapter ? 'Loading surah...' : 'Preparing verses...'}</span>
        </div>
      </div>
    );
  }

  // ─── Layout Renderers ───

  const renderStacked = () => (
    <div className="verse-content">
      {showArabic && (
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
      {showTranslation && (
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
    </div>
  );

  const renderSideBySide = () => (
    <div className="verse-content verse-side-by-side">
      {showArabic && (
        <div className="verse-arabic verse-side" style={arabicStyle}>
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
      {showTranslation && (
        <div className="verse-english verse-side" style={englishStyle}>
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
    </div>
  );

  const renderWordByWord = () => (
    <div className="verse-content verse-word-by-word" style={{ direction: 'rtl' }}>
      {currentVerse.words?.map((word, idx) => (
        <WordPair
          key={`wbw-${word.id}-${idx}`}
          word={word}
          isActive={(highlightArabic || highlightEnglish) && activeWordIds.includes(word.id)}
          highlightWordBg={highlightWordBg}
          highlightColor={ts.highlightColor}
          highlightGlow={ts.highlightGlow}
          englishColor={ts.englishColor}
        />
      ))}
    </div>
  );

  const layoutRenderer = {
    stacked: renderStacked,
    sideBySide: renderSideBySide,
    wordByWord: renderWordByWord,
  };

  return (
    <div ref={containerRef} className={`verse-display-container container-${containerStyle} ${showTextBackdrop ? '' : 'no-backdrop'}`} role="region" aria-label="Quran verse display" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentVerseIndex}-${verseLayout}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {(layoutRenderer[verseLayout] || renderStacked)()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
