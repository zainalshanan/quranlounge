import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getTafsirByVerse } from '../api/quranClient';

export default function FloatingTafsir() {
  const tafsirId = usePlayerStore(s => s.tafsirId);
  const setTafsirId = usePlayerStore(s => s.setTafsirId);
  const tafsirs = usePlayerStore(s => s.tafsirs);
  const currentChapterId = usePlayerStore(s => s.currentChapterId);
  const currentVerseIndex = usePlayerStore(s => s.currentVerseIndex);
  const chapters = usePlayerStore(s => s.chapters);
  const setFloatingTafsir = usePlayerStore(s => s.setFloatingTafsir);
  const widgetStyle = usePlayerStore(s => s.widgetStyle);

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const verseKey = `${currentChapterId}:${currentVerseIndex + 1}`;
  const currentChapter = chapters.find(c => c.id === currentChapterId);
  const currentTafsir = tafsirs.find(t => t.id === tafsirId);

  useEffect(() => {
    if (!tafsirId) return;
    let cancelled = false;
    setLoading(true);
    setText('');

    getTafsirByVerse(tafsirId, verseKey).then(data => {
      if (cancelled) return;
      setText(data?.text || '');
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [tafsirId, verseKey]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.92, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`floating-widget floating-tafsir widget-${widgetStyle}`}
    >
      <div className="fw-header">
        <div className="fw-tafsir-meta">
          <span className="fw-title">{currentChapter?.nameSimple || `Surah ${currentChapterId}`}</span>
          <span className="fw-tafsir-key">{verseKey}</span>
        </div>
        <button className="fw-close" onClick={() => setFloatingTafsir(false)} aria-label="Close tafsir">
          <X size={14} />
        </button>
      </div>

      {tafsirs.length > 0 && (
        <select
          className="fw-tafsir-source-select"
          value={tafsirId}
          onChange={e => setTafsirId(parseInt(e.target.value))}
          aria-label="Select tafsir source"
        >
          {tafsirs.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}{t.languageName ? ` (${t.languageName})` : ''}
            </option>
          ))}
        </select>
      )}

      {!tafsirs.length && currentTafsir && (
        <div className="fw-tafsir-source-name">{currentTafsir.name}</div>
      )}

      <div className="fw-tafsir-body">
        {loading && <span className="fw-tafsir-placeholder">Loading...</span>}
        {!loading && text && <div dangerouslySetInnerHTML={{ __html: text }} />}
        {!loading && !text && <span className="fw-tafsir-placeholder">No tafsir available for this verse.</span>}
      </div>
    </motion.div>
  );
}
