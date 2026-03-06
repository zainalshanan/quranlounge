import { useRef, useEffect } from 'react';
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
  const isLoadingChapter = usePlayerStore(s => s.isLoadingChapter);

  const contentRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll logic: keep active content in focus
  useEffect(() => {
    if (activeWordIds.length > 0 && containerRef.current) {
      const activeElement = containerRef.current.querySelector('.active-word');
      if (activeElement) {
        // Industry Standard: Word-by-word, center the active word
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }, [activeWordIds]);

  const currentVerse = verses[currentVerseIndex];
  const ts = customTextStyle || activeTextStyle;
  // Arabic and English font sizes scale based on user setting, but base is fluid in CSS
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

  if (isLoadingChapter) {
    return (
      <div className={`verse-display-container loading-state ${showTextBackdrop ? '' : 'no-backdrop'}`}>
        <div className="verse-loader">
          <div className="verse-loader-spinner" />
          <span className="verse-loader-text">Loading surah...</span>
        </div>
      </div>
    );
  }

  if (!currentVerse) {
    return (
      <div className={`verse-display-container loading-state ${showTextBackdrop ? '' : 'no-backdrop'}`}>
        <div className="verse-loader">
          <div className="verse-loader-spinner" />
          <span className="verse-loader-text">Preparing verses...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`verse-display-container ${showTextBackdrop ? '' : 'no-backdrop'}`}
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
              style={arabicStyle}
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
              style={englishStyle}
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
