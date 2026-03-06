import React from 'react';
import { PRESETS, usePlayerStore } from '../../store/usePlayerStore';

export default function PresetsPanel() {
  const applyPreset = usePlayerStore(s => s.applyPreset);

  return (
    <div className="panel-content">
      <h3 className="panel-title">Presets</h3>
      <p className="panel-subtitle">One-click mood setups</p>
      <div className="preset-grid">
        {PRESETS.map(preset => (
          <button
            key={preset.id}
            type="button"
            className="preset-card"
            onClick={() => applyPreset(preset)}
          >
            <span className="preset-emoji">{preset.emoji}</span>
            <div className="preset-info">
              <span className="preset-name">{preset.name}</span>
              <span className="preset-desc">{preset.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
