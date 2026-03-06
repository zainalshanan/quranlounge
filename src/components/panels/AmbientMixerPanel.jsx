import { AMBIENT_TRACKS, usePlayerStore } from '../../store/usePlayerStore';

export default function AmbientMixerPanel() {
  const {
    activeAmbientTracks,
    setAmbientTrackVolume,
    toggleAmbientTrack,
  } = usePlayerStore();

  return (
    <div className="panel-content">
      <h3 className="panel-title">Ambient Mixer</h3>
      <p className="panel-subtitle">Mix ambient sounds together</p>

      <div className="mixer-tracks">
        {AMBIENT_TRACKS.map(track => {
          const isActive = activeAmbientTracks[track.id] !== undefined;
          const volume = activeAmbientTracks[track.id] || 0;

          return (
            <div key={track.id} className={`mixer-track ${isActive ? 'active' : ''}`}>
              <button
                className="mixer-toggle"
                onClick={() => toggleAmbientTrack(track.id)}
              >
                <span className="mixer-icon">{track.icon}</span>
                <span className="mixer-name">{track.name}</span>
              </button>
              {isActive && (
                <div className="mixer-slider-row">
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={e => setAmbientTrackVolume(track.id, parseFloat(e.target.value))}
                    className="mixer-slider"
                  />
                  <span className="mixer-volume">{Math.round(volume * 100)}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
