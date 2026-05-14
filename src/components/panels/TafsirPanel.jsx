import { useState, useEffect } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { getTafsirByVerse } from '../../api/quranClient';

export default function TafsirPanel() {
  const tafsirId = usePlayerStore(s => s.tafsirId);
  const setTafsirId = usePlayerStore(s => s.setTafsirId);
  const tafsirs = usePlayerStore(s => s.tafsirs);
  const currentChapterId = usePlayerStore(s => s.currentChapterId);
  const currentVerseIndex = usePlayerStore(s => s.currentVerseIndex);
  const chapters = usePlayerStore(s => s.chapters);
  const floatingTafsir = usePlayerStore(s => s.floatingTafsir);
  const setFloatingTafsir = usePlayerStore(s => s.setFloatingTafsir);

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verseKey = `${currentChapterId}:${currentVerseIndex + 1}`;
  const currentChapter = chapters.find(c => c.id === currentChapterId);

  useEffect(() => {
    if (!tafsirId) return;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setText('');

    getTafsirByVerse(tafsirId, verseKey).then(data => {
      if (cancelled) return;
      setText(data?.text || '');
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setError('Could not load tafsir. Try a different source.');
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [tafsirId, verseKey]);

  return (
    <div className="panel-content">
      <h3 className="panel-title">Tafsir</h3>

      {/* Float on screen toggle */}
      <div className="tafsir-float-row">
        <span>Show on screen</span>
        <button
          className={`slide-toggle ${floatingTafsir ? 'active' : ''}`}
          onClick={() => setFloatingTafsir(!floatingTafsir)}
          aria-label={floatingTafsir ? 'Hide floating tafsir' : 'Show tafsir on screen'}
          role="switch"
          aria-checked={floatingTafsir}
        >
          <span className="slide-toggle-knob" />
        </button>
      </div>

      {tafsirs.length > 0 && (
        <div className="control-row">
          <label htmlFor="tafsir-select">Source</label>
          <select
            id="tafsir-select"
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
        </div>
      )}

      <div className="tafsir-verse-ref">
        <span className="tafsir-ref-label">
          {currentChapter?.nameSimple || `Surah ${currentChapterId}`}
        </span>
        <span className="tafsir-ref-key">{verseKey}</span>
      </div>

      {loading && (
        <div className="tafsir-status">
          <div className="verse-loader-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          <span>Loading tafsir...</span>
        </div>
      )}

      {error && !loading && (
        <div className="tafsir-status tafsir-error">{error}</div>
      )}

      {!loading && !error && text && (
        <div
          className="tafsir-text"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      )}

      {!loading && !error && !text && tafsirId && (
        <div className="tafsir-status">No tafsir available for this verse.</div>
      )}
    </div>
  );
}
