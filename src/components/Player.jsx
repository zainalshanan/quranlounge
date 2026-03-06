import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Settings, Maximize2, Minimize2, 
  Layers, Volume2, Image as ImageIcon,
  Clock, Timer, Type, Layout, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { usePlayerStore, AMBIENT_TRACKS, BACKGROUNDS, PRESETS } from '../store/usePlayerStore';
import './Player.css';

export default function Player() {
  const {
    isPlaying, setIsPlaying,
    isZenMode, setZenMode,
    showClock, setShowClock,
    showPomodoro, setShowPomodoro,
    activeBackground, setActiveBackground,
    highlightingEnabled, setHighlightingEnabled,
    applyPreset,
    showPlayer, togglePlayer,
    masterVolume, setMasterVolume,
    textMode, setTextMode,
    reciterId, setReciterId,
    reciters,
    ambientTrack, setAmbientTrack,
    chapters, currentChapterId, setCurrentChapterId,
    skipNext, skipPrev,
    playerMode, setPlayerMode,
    playerPos, setPlayerPos
  } = usePlayerStore();

  const [activeTab, setActiveTab] = useState('settings');
  const constraintsRef = useRef(null);

  const currentChapter = chapters.find(c => c.id === currentChapterId);

  if (!showPlayer) {
    return (
      <button className="player-fab" onClick={togglePlayer}>
        <Play size={24} />
      </button>
    );
  }

  const toggleMode = () => {
    setPlayerMode(playerMode === 'full' ? 'mini' : 'full');
  };

  return (
    <motion.div 
      initial={false}
      animate={{ 
        width: playerMode === 'full' ? 420 : 340,
        height: playerMode === 'full' ? 'auto' : 80
      }}
      drag
      dragMomentum={false}
      onDragEnd={(e, info) => {
        // Optional: save position if needed
      }}
      className={`player-shell glass-morphism ${playerMode} ${isZenMode ? 'zen-active' : ''}`}
    >
      {/* Drag Handle Area */}
      <div className="drag-handle">
        <div className="handle-dots" />
      </div>

      <div className="player-inner">
        {playerMode === 'mini' ? (
          <div className="mini-player">
            <div className="mini-controls">
              <button className="icon-btn-ghost" onClick={skipPrev}><SkipBack size={18} /></button>
              <button className="icon-btn-primary" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              <button className="icon-btn-ghost" onClick={skipNext}><SkipForward size={18} /></button>
            </div>
            
            <div className="mini-info">
              <span className="chapter-name">{currentChapter?.nameSimple || 'Loading...'}</span>
              <span className="reciter-name-mini">{reciters.find(r => r.id === reciterId)?.name || 'Reciter'}</span>
            </div>

            <div className="mini-actions">
              <button className="icon-btn-ghost" onClick={toggleMode} title="Expand"><Maximize2 size={16} /></button>
              <button className="icon-btn-ghost close-x" onClick={togglePlayer}><X size={16} /></button>
            </div>
          </div>
        ) : (
          <div className="full-player">
            <div className="full-header">
              <div className="chapter-info-large">
                <h3>{currentChapter?.nameSimple}</h3>
                <p>{reciters.find(r => r.id === reciterId)?.name}</p>
              </div>
              <div className="header-actions">
                <button className="icon-btn-ghost" onClick={toggleMode} title="Minimize"><Minimize2 size={18} /></button>
                <button className="icon-btn-ghost" onClick={() => setZenMode(!isZenMode)} title="Zen Mode">
                  <Layout size={18} />
                </button>
                <button className="icon-btn-ghost close-x" onClick={togglePlayer}><X size={18} /></button>
              </div>
            </div>

            <div className="main-playback">
              <button className="icon-btn-ghost lg" onClick={skipPrev}><SkipBack size={24} /></button>
              <button className="play-pause-main" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
              </button>
              <button className="icon-btn-ghost lg" onClick={skipNext}><SkipForward size={24} /></button>
            </div>

            <div className="player-tabs">
              <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
                <Settings size={14} /> Settings
              </button>
              <button className={activeTab === 'presets' ? 'active' : ''} onClick={() => setActiveTab('presets')}>
                <Layers size={14} /> Presets
              </button>
              <button className={activeTab === 'scene' ? 'active' : ''} onClick={() => setActiveTab('scene')}>
                <ImageIcon size={14} /> Scene
              </button>
            </div>

            <div className="tab-viewport">
              {activeTab === 'settings' && (
                <div className="settings-panel">
                  <div className="control-group">
                    <label><Type size={12} /> Chapter</label>
                    <select value={currentChapterId} onChange={(e) => setCurrentChapterId(Number(e.target.value))}>
                      {chapters.map(c => (
                        <option key={c.id} value={c.id}>{c.id}. {c.nameSimple}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-group">
                    <label><Volume2 size={12} /> Volume</label>
                    <input type="range" min="0" max="1" step="0.01" value={masterVolume} onChange={(e) => setMasterVolume(parseFloat(e.target.value))} />
                  </div>

                  <div className="control-group">
                    <label><Layers size={12} /> Reciter</label>
                    <select value={reciterId} onChange={(e) => setReciterId(Number(e.target.value))}>
                      {reciters.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="toggles">
                    <button className={showClock ? 'on' : ''} onClick={() => setShowClock(!showClock)}><Clock size={14} /> Clock</button>
                    <button className={showPomodoro ? 'on' : ''} onClick={() => setShowPomodoro(!showPomodoro)}><Timer size={14} /> Pomo</button>
                    <button className={highlightingEnabled ? 'on' : ''} onClick={() => setHighlightingEnabled(!highlightingEnabled)}><Type size={14} /> Highlight</button>
                  </div>
                </div>
              )}

              {activeTab === 'presets' && (
                <div className="grid-list">
                  {PRESETS.map(p => (
                    <button key={p.id} className="grid-item" onClick={() => applyPreset(p)}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'scene' && (
                <div className="grid-list scrollable">
                  {BACKGROUNDS.map(b => (
                    <button key={b.id} className={`grid-item ${activeBackground.id === b.id ? 'active' : ''}`} onClick={() => setActiveBackground(b.id)}>
                      {b.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
