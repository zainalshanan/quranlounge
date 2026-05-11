import { usePlayerStore } from '../../store/usePlayerStore';
import { Info } from 'lucide-react';

export default function DisplayPanel() {
  const displayLanguages = usePlayerStore(s => s.displayLanguages);
  const toggleDisplayLanguage = usePlayerStore(s => s.toggleDisplayLanguage);
  const highlightArabic = usePlayerStore(s => s.highlightArabic);
  const setHighlightArabic = usePlayerStore(s => s.setHighlightArabic);
  const highlightEnglish = usePlayerStore(s => s.highlightEnglish);
  const setHighlightEnglish = usePlayerStore(s => s.setHighlightEnglish);
  const highlightWordBg = usePlayerStore(s => s.highlightWordBg);
  const setHighlightWordBg = usePlayerStore(s => s.setHighlightWordBg);
  const showTextBackdrop = usePlayerStore(s => s.showTextBackdrop);
  const setShowTextBackdrop = usePlayerStore(s => s.setShowTextBackdrop);
  const reciterId = usePlayerStore(s => s.reciterId);
  const isQUL = typeof reciterId === 'string' && reciterId.startsWith('local:');

  return (
    <div className="panel-content">
      <h3 className="panel-title">Display</h3>

      {/* Font Size Scale */}
      <div className="control-row">
        <label htmlFor="font-size-slider">Font Size</label>
        <div className="slider-row">
          <span className="slider-label">A</span>
          <input
            id="font-size-slider"
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={usePlayerStore(s => s.fontSizeScale)}
            onChange={e => usePlayerStore.getState().setFontSizeScale(parseFloat(e.target.value))}
            aria-label="Font size scale"
          />
          <span className="slider-label">x{usePlayerStore(s => s.fontSizeScale)}</span>
        </div>
      </div>

      {/* Display Languages */}
      <div className="control-row">
        <label>Languages</label>
        <div className="toggle-group">
          <button
            className={displayLanguages.includes('arabic') ? 'active' : ''}
            onClick={() => toggleDisplayLanguage('arabic')}
          >
            العربية
          </button>
          <button
            className={displayLanguages.includes('english') ? 'active' : ''}
            onClick={() => toggleDisplayLanguage('english')}
          >
            English
          </button>
        </div>
      </div>

      {/* Per-language highlighting */}
      <div className="control-row">
        <label>Highlight Words</label>
        <div className="toggle-group">
          <button
            className={highlightArabic ? 'active' : ''}
            onClick={() => setHighlightArabic(!highlightArabic)}
          >
            Arabic {highlightArabic ? '✦' : '○'}
          </button>
          <button
            className={highlightEnglish ? 'active' : ''}
            onClick={() => setHighlightEnglish(!highlightEnglish)}
          >
            English {highlightEnglish ? '✦' : '○'}
          </button>
        </div>
      </div>

      {/* QUL highlighting note */}
      {isQUL && (
        <div className="highlight-info-note">
          <Info size={12} />
          <span>Word-level highlighting is not available with QUL reciters. The entire verse highlights at once.</span>
        </div>
      )}

      {/* Word Background */}
      <div className="control-row">
        <label>Highlight Background</label>
        <button
          className={`toggle-btn ${highlightWordBg ? 'active' : ''}`}
          onClick={() => setHighlightWordBg(!highlightWordBg)}
        >
          {highlightWordBg ? 'On' : 'Off'}
        </button>
      </div>

      {/* Text Backdrop */}
      <div className="control-row">
        <label>Text Backdrop</label>
        <button
          className={`toggle-btn ${showTextBackdrop ? 'active' : ''}`}
          onClick={() => setShowTextBackdrop(!showTextBackdrop)}
        >
          {showTextBackdrop ? 'Blur On' : 'Blur Off'}
        </button>
      </div>
    </div>
  );
}
