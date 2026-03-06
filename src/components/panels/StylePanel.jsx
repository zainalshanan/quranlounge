import { useState } from 'react';
import { THEMES, BACKGROUNDS, TEXT_STYLE_PRESETS, usePlayerStore } from '../../store/usePlayerStore';
import { Palette } from 'lucide-react';

const WIDGET_STYLES = [
  { id: 'glass', name: 'Glass' },
  { id: 'transparent', name: 'Ghost' },
  { id: 'neon', name: 'Neon' },
  { id: 'solid', name: 'Solid' },
  { id: 'radio', name: 'Radio' },
];

export default function StylePanel() {
  const activeTheme = usePlayerStore(s => s.activeTheme);
  const setActiveTheme = usePlayerStore(s => s.setActiveTheme);
  const activeBackground = usePlayerStore(s => s.activeBackground);
  const setActiveBackground = usePlayerStore(s => s.setActiveBackground);
  const activeTextStyle = usePlayerStore(s => s.activeTextStyle);
  const setActiveTextStyle = usePlayerStore(s => s.setActiveTextStyle);
  const customTextStyle = usePlayerStore(s => s.customTextStyle);
  const setCustomTextStyle = usePlayerStore(s => s.setCustomTextStyle);
  const clearCustomTextStyle = usePlayerStore(s => s.clearCustomTextStyle);
  const widgetStyle = usePlayerStore(s => s.widgetStyle);
  const setWidgetStyle = usePlayerStore(s => s.setWidgetStyle);

  const [showCustom, setShowCustom] = useState(false);
  const ts = customTextStyle || activeTextStyle;

  return (
    <div className="panel-content">
      <h3 className="panel-title">Style</h3>

      {/* Theme */}
      <div className="settings-section">
        <label className="section-label">Color Theme</label>
        <div className="theme-grid">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              className={`theme-swatch ${activeTheme.id === theme.id ? 'active' : ''}`}
              onClick={() => setActiveTheme(theme.id)}
              title={theme.name}
            >
              <span className="swatch-color" style={{ background: theme.colors['--theme-accent'] }} />
              <span className="swatch-name">{theme.name}</span>
            </button>
          ))}
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
              {bg.url ? (
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
              <span className="ts-emoji">{style.emoji}</span>
              <span className="ts-name">{style.name}</span>
              <span className="ts-preview" style={{
                color: style.highlightColor,
                textShadow: style.highlightGlow,
              }}>بِسْمِ</span>
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
