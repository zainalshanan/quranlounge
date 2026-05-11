import { useState } from 'react';
import { BACKGROUNDS, TEXT_STYLE_PRESETS, usePlayerStore } from '../../store/usePlayerStore';
import { Palette, Info } from 'lucide-react';

const CSS_BG_PREVIEWS = {
  aurora: 'linear-gradient(135deg, #0d1f2d, #1a0a2e, #0a2a2a)',
  'sunset-glow': 'linear-gradient(160deg, #4a1a1a, #3d1a3d, #1a1a3d)',
  'ocean-deep': 'linear-gradient(180deg, #020810, #0a1628, #051a30)',
  starfield: 'radial-gradient(ellipse, #0d0d1a, #030308)',
  'desert-night': 'linear-gradient(180deg, #050510, #1a1030, #1a1008)',
  ember: 'radial-gradient(ellipse at 50% 100%, #1a0800, #050200)',
  fireflies: 'linear-gradient(180deg, #050510, #0a1a12, #081510)',
  rain: 'linear-gradient(180deg, #0a0a15, #101828, #0a1020)',
  nebula: 'radial-gradient(ellipse, #150220, #020820, #080415)',
  waves: 'linear-gradient(180deg, #050510, #0a0a20, #0a1525)',
};

const WIDGET_STYLES = [
  { id: 'glass', name: 'Glass' },
  { id: 'transparent', name: 'Ghost' },
  { id: 'neon', name: 'Neon' },
  { id: 'solid', name: 'Solid' },
  { id: 'radio', name: 'Radio' },
];

export default function StylePanel() {
  const activeBackground = usePlayerStore(s => s.activeBackground);
  const setActiveBackground = usePlayerStore(s => s.setActiveBackground);
  const activeTextStyle = usePlayerStore(s => s.activeTextStyle);
  const setActiveTextStyle = usePlayerStore(s => s.setActiveTextStyle);
  const customTextStyle = usePlayerStore(s => s.customTextStyle);
  const setCustomTextStyle = usePlayerStore(s => s.setCustomTextStyle);
  const clearCustomTextStyle = usePlayerStore(s => s.clearCustomTextStyle);
  const widgetStyle = usePlayerStore(s => s.widgetStyle);
  const setWidgetStyle = usePlayerStore(s => s.setWidgetStyle);
  // Display controls (merged from Display panel)
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
  const fontSizeScale = usePlayerStore(s => s.fontSizeScale);
  const setFontSizeScale = usePlayerStore(s => s.setFontSizeScale);
  const reciterId = usePlayerStore(s => s.reciterId);
  const isQUL = typeof reciterId === 'string' && reciterId.startsWith('local:');

  const [showCustom, setShowCustom] = useState(false);
  const ts = customTextStyle || activeTextStyle;

  return (
    <div className="panel-content">
      <h3 className="panel-title">Style</h3>

      {/* Text Display */}
      <div className="settings-section">
        <label className="section-label">Text</label>
        <div className="control-row">
          <label htmlFor="font-size-slider">Font Size</label>
          <div className="slider-row">
            <span className="slider-label">A</span>
            <input id="font-size-slider" type="range" min="0.5" max="2.5" step="0.1" value={fontSizeScale} onChange={e => setFontSizeScale(parseFloat(e.target.value))} aria-label="Font size scale" />
            <span className="slider-label">x{fontSizeScale}</span>
          </div>
        </div>
        <div className="control-row">
          <label>Show</label>
          <div className="toggle-group">
            <button className={displayLanguages.includes('arabic') ? 'active' : ''} onClick={() => toggleDisplayLanguage('arabic')}>Arabic</button>
            <button className={displayLanguages.includes('english') ? 'active' : ''} onClick={() => toggleDisplayLanguage('english')}>Translation</button>
          </div>
        </div>
        <div className="control-row">
          <label>Highlight</label>
          <div className="toggle-group">
            <button className={highlightArabic ? 'active' : ''} onClick={() => setHighlightArabic(!highlightArabic)}>Arabic {highlightArabic ? '✦' : '○'}</button>
            <button className={highlightEnglish ? 'active' : ''} onClick={() => setHighlightEnglish(!highlightEnglish)}>Translation {highlightEnglish ? '✦' : '○'}</button>
          </div>
        </div>
        {isQUL && (
          <div className="highlight-info-note">
            <Info size={12} />
            <span>Word-level highlighting is not available with QUL reciters.</span>
          </div>
        )}
        <div className="control-row">
          <label>Word BG</label>
          <button className={`toggle-btn ${highlightWordBg ? 'active' : ''}`} onClick={() => setHighlightWordBg(!highlightWordBg)}>{highlightWordBg ? 'On' : 'Off'}</button>
        </div>
        <div className="control-row">
          <label>Backdrop</label>
          <button className={`toggle-btn ${showTextBackdrop ? 'active' : ''}`} onClick={() => setShowTextBackdrop(!showTextBackdrop)}>{showTextBackdrop ? 'Blur On' : 'Blur Off'}</button>
        </div>
      </div>

      {/* Background */}
      <div className="settings-section">
        <label className="section-label">Background</label>
        <div className="bg-grid">
          {BACKGROUNDS.map(bg => (
            <button
              key={bg.id}
              className={`bg-thumb ${activeBackground.id === bg.id ? 'active' : ''}`}
              onClick={() => setActiveBackground(bg.id)}
            >
              {bg.thumbnail ? (
                <div className="bg-thumb-img" style={{ backgroundImage: `url(${bg.thumbnail})` }} />
              ) : CSS_BG_PREVIEWS[bg.id] ? (
                <div className="bg-thumb-img" style={{ background: CSS_BG_PREVIEWS[bg.id] }} />
              ) : bg.url && bg.type !== 'video' ? (
                <div className="bg-thumb-img" style={{ backgroundImage: `url(${bg.url})` }} />
              ) : (
                <div className="bg-thumb-img bg-thumb-dark" />
              )}
              <span>{bg.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Text Style Presets */}
      <div className="settings-section">
        <label className="section-label">Text Style</label>
        <div className="text-style-grid">
          {TEXT_STYLE_PRESETS.map(style => (
            <button
              key={style.id}
              className={`text-style-card ${activeTextStyle.id === style.id && !customTextStyle ? 'active' : ''}`}
              onClick={() => { setActiveTextStyle(style.id); clearCustomTextStyle(); }}
            >
              <span className="ts-preview" style={{
                color: style.highlightColor,
                textShadow: style.highlightGlow,
              }}>بِسْمِ</span>
              <span className="ts-name">{style.name}</span>
            </button>
          ))}
        </div>
        <button className="inline-link" onClick={() => setShowCustom(!showCustom)}>
          {showCustom ? 'Hide custom' : 'Custom colors...'}
        </button>
      </div>

      {/* Custom Color Tweaks */}
      {showCustom && (
        <div className="custom-tweaks">
          <div className="tweak-row">
            <span>Arabic</span>
            <input type="color" value={ts.arabicColor?.startsWith('#') ? ts.arabicColor : '#ffffff'} onChange={e => setCustomTextStyle({ arabicColor: e.target.value })} />
          </div>
          <div className="tweak-row">
            <span>English</span>
            <input type="color" value={ts.englishColor?.startsWith('#') ? ts.englishColor : '#cccccc'} onChange={e => setCustomTextStyle({ englishColor: e.target.value })} />
          </div>
          <div className="tweak-row">
            <span>Highlight</span>
            <input type="color" value={ts.highlightColor || '#34d399'} onChange={e => setCustomTextStyle({ highlightColor: e.target.value, highlightGlow: `0 0 24px ${e.target.value}80` })} />
          </div>
          {customTextStyle && (
            <button className="reset-btn" onClick={clearCustomTextStyle}>Reset to preset</button>
          )}
        </div>
      )}

      {/* Widget Style */}
      <div className="settings-section">
        <label className="section-label"><Palette size={14} /> Widget Style</label>
        <div className="widget-style-grid">
          {WIDGET_STYLES.map(ws => (
            <button
              key={ws.id}
              className={`theme-swatch ${widgetStyle === ws.id ? 'active' : ''}`}
              onClick={() => setWidgetStyle(ws.id)}
            >
              <span className="swatch-name">{ws.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
