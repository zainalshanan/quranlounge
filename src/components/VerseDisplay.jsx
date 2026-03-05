import { useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/usePlayerStore';
import './VerseDisplay.css';

export default function VerseDisplay() {
  const verses = usePlayerStore(s => s.verses);
  const currentVerseIndex = usePlayerStore(s => s.currentVerseIndex);
  const activeWordIds = usePlayerStore(s => s.activeWordIds);
  const displayLanguages = usePlayerStore(s => s.displayLanguages);
  const highlightArabic = usePlayerStore(s => s.highlightArabic);
  const highlightEnglish = usePlayerStore(s => s.highlightEnglish);
  const highlightWordBg = usePlayerStore(s => s.highlightWordBg);
  const showTextBackdrop = usePlayerStore(s => s.showTextBackdrop);
  const activeTextStyle = usePlayerStore(s => s.activeTextStyle);
  const customTextStyle = usePlayerStore(s => s.customTextStyle);
  const fontSizeScale = usePlayerStore(s => s.fontSizeScale);
  const viewAreaHeight = usePlayerStore(s => s.viewAreaHeight);
  const isLoadingChapter = usePlayerStore(s => s.isLoadingChapter);

  const contentRef = useRef(null);
  const containerRef = useRef(null);


  const currentVerse = verses[currentVerseIndex];
  const ts = customTextStyle || activeTextStyle;

  // Base font sizes
  const arabicBaseSize = 2.4 * fontSizeScale;
  const englishBaseSize = 1.0 * fontSizeScale;

  if (isLoadingChapter) {
    return (
      <div className={`verse-display-container ${showTextBackdrop ? '' : 'no-backdrop'}`}>
        <div className="loading-pulse">Loading surah...</div>
      </div>
    );
  }

  if (!currentVerse) {
    return (
      <div className={`verse-display-container ${showTextBackdrop ? '' : 'no-backdrop'}`}>
        <div className="loading-pulse">Preparing verses...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`verse-display-container ${showTextBackdrop ? '' : 'no-backdrop'}`}
      style={{ height: `${viewAreaHeight}vh`, maxHeight: 'unset' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentVerseIndex}
          ref={contentRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="verse-content"
        >


          {displayLanguages.includes('arabic') && (
            <div
              className="verse-arabic"
              style={{
                fontSize: `${arabicBaseSize}rem`,
                direction: 'rtl',
                color: ts.arabicColor,
                textShadow: ts.textShadow,
              }}
            >
              {currentVerse.words?.map((word) => {
                const isActive = highlightArabic && activeWordIds.includes(word.id);
                return (
                  <span
                    key={word.id}
                    className={`quran-word ${isActive ? 'active-word' : ''} ${isActive && highlightWordBg ? 'active-word-bg' : ''}`}
                    style={isActive ? {
                      color: ts.highlightColor,
                      textShadow: ts.highlightGlow,
                    } : undefined}
                    dangerouslySetInnerHTML={{ __html: word.textUthmani || word.text }}
                  />
                );
              })}
            </div>
          )}

          {displayLanguages.includes('english') && (
            <div
              className="verse-english"
              style={{
                fontSize: `${englishBaseSize}rem`,
                direction: 'ltr',
                color: ts.englishColor,
                textShadow: ts.textShadow,
              }}
            >
              {currentVerse.words?.map((word, idx) => {
                if (!word.translation?.text) return null;
                const isActive = highlightEnglish && activeWordIds.includes(word.id);
                return (
                  <span
                    key={`en-${word.id}-${idx}`}
                    className={`en-word ${isActive ? 'active-word' : ''} ${isActive && highlightWordBg ? 'active-word-bg' : ''}`}
                    style={isActive ? {
                      color: ts.highlightColor,
                      textShadow: ts.highlightGlow,
                    } : undefined}
                    dangerouslySetInnerHTML={{ __html: word.translation.text }}
                  />
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
