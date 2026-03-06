import { usePlayerStore } from '../../store/usePlayerStore';
import { Moon, Maximize, Clock, Eye, Timer, ListTodo, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SettingsPanel() {
  const showClock = usePlayerStore(s => s.showClock);
  const setShowClock = usePlayerStore(s => s.setShowClock);
  const clockFormat = usePlayerStore(s => s.clockFormat);
  const setClockFormat = usePlayerStore(s => s.setClockFormat);
  const showDate = usePlayerStore(s => s.showDate);
  const setShowDate = usePlayerStore(s => s.setShowDate);
  const showSeconds = usePlayerStore(s => s.showSeconds);
  const setShowSeconds = usePlayerStore(s => s.setShowSeconds);
  const masterVolume = usePlayerStore(s => s.masterVolume);
  const setMasterVolume = usePlayerStore(s => s.setMasterVolume);
  const recitationVolume = usePlayerStore(s => s.recitationVolume);
  const setRecitationVolume = usePlayerStore(s => s.setRecitationVolume);
  const sleepTimerMinutes = usePlayerStore(s => s.sleepTimerMinutes);
  const setSleepTimer = usePlayerStore(s => s.setSleepTimer);
  const toggleFullscreen = usePlayerStore(s => s.toggleFullscreen);
  const isFullscreen = usePlayerStore(s => s.isFullscreen);
  const zenMode = usePlayerStore(s => s.zenMode);
  const toggleZenMode = usePlayerStore(s => s.toggleZenMode);
  const floatingPomodoro = usePlayerStore(s => s.floatingPomodoro);
  const setFloatingPomodoro = usePlayerStore(s => s.setFloatingPomodoro);
  const floatingTodo = usePlayerStore(s => s.floatingTodo);
  const setFloatingTodo = usePlayerStore(s => s.setFloatingTodo);
  const performanceMode = usePlayerStore(s => s.performanceMode);
  const setPerformanceMode = usePlayerStore(s => s.setPerformanceMode);

  return (
    <div className="panel-content">
      <h3 className="panel-title">Settings</h3>

      {/* Widgets */}
      <div className="settings-section">
        <label className="section-label">General</label>
        <div className="settings-toggles">
          <div className="setting-row">
            <span><Timer size={14} /> Floating Timer</span>
            <button className={`toggle-pill ${floatingPomodoro ? 'on' : ''}`} onClick={() => setFloatingPomodoro(!floatingPomodoro)}>
              <span className="pill-knob" />
            </button>
          </div>
          <div className="setting-row">
            <span><ListTodo size={14} /> Floating Tasks</span>
            <button className={`toggle-pill ${floatingTodo ? 'on' : ''}`} onClick={() => setFloatingTodo(!floatingTodo)}>
              <span className="pill-knob" />
            </button>
          </div>
          <div className="setting-row">
            <span><Eye size={14} /> Zen Mode</span>
            <button className={`toggle-pill ${zenMode ? 'on' : ''}`} onClick={toggleZenMode}>
              <span className="pill-knob" />
            </button>
          </div>
          <div className="setting-row">
            <span title="Reduces CPU/GPU usage by lowering background resolution and particle counts.">
              <Moon size={14} /> Low Power Mode
            </span>
            <button className={`toggle-pill ${performanceMode ? 'on' : ''}`} onClick={() => setPerformanceMode(!performanceMode)}>
              <span className="pill-knob" />
            </button>
          </div>
        </div>
      </div>

      {/* Clock */}
      <div className="settings-section">
        <label className="section-label"><Clock size={14} /> Clock</label>
        <div className="settings-toggles">
          <div className="setting-row">
            <span>Show Clock</span>
            <button className={`toggle-pill ${showClock ? 'on' : ''}`} onClick={() => setShowClock(!showClock)}>
              <span className="pill-knob" />
            </button>
          </div>
          <div className="setting-row">
            <span>24h Format</span>
            <button className={`toggle-pill ${clockFormat === '24' ? 'on' : ''}`} onClick={() => setClockFormat(clockFormat === '12' ? '24' : '12')}>
              <span className="pill-knob" />
            </button>
          </div>
          <div className="setting-row">
            <span>Show Date</span>
            <button className={`toggle-pill ${showDate ? 'on' : ''}`} onClick={() => setShowDate(!showDate)}>
              <span className="pill-knob" />
            </button>
          </div>
          <div className="setting-row">
            <span>Show Seconds</span>
            <button className={`toggle-pill ${showSeconds ? 'on' : ''}`} onClick={() => setShowSeconds(!showSeconds)}>
              <span className="pill-knob" />
            </button>
          </div>
        </div>
      </div>

      {/* Volume */}
      <div className="settings-section">
        <label className="section-label">Volume</label>
        <div className="volume-controls">
          <div className="volume-row">
            <span>Master</span>
            <input type="range" min="0" max="1" step="0.01" value={masterVolume} onChange={e => setMasterVolume(parseFloat(e.target.value))} />
            <span className="vol-pct">{Math.round(masterVolume * 100)}%</span>
          </div>
          <div className="volume-row">
            <span>Recitation</span>
            <input type="range" min="0" max="1" step="0.01" value={recitationVolume} onChange={e => setRecitationVolume(parseFloat(e.target.value))} />
            <span className="vol-pct">{Math.round(recitationVolume * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Sleep Timer */}
      <div className="settings-section">
        <label className="section-label"><Moon size={14} /> Sleep Timer</label>
        <div className="sleep-timer-options">
          {[0, 15, 30, 45, 60, 90].map(min => (
            <button key={min} className={`sleep-btn ${sleepTimerMinutes === min ? 'active' : ''}`} onClick={() => setSleepTimer(min)}>
              {min === 0 ? 'Off' : `${min}m`}
            </button>
          ))}
        </div>
      </div>

      {/* Fullscreen */}
      <div className="settings-section">
        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          <Maximize size={14} />
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="settings-section">
        <label className="section-label">Shortcuts</label>
        <div className="shortcut-list">
          <div className="shortcut"><kbd>Space</kbd><span>Play / Pause</span></div>
          <div className="shortcut"><kbd>←→</kbd><span>Prev / Next Surah</span></div>
          <div className="shortcut"><kbd>S</kbd><span>Toggle Sidebar</span></div>
          <div className="shortcut"><kbd>F</kbd><span>Fullscreen</span></div>
          <div className="shortcut"><kbd>Z</kbd><span>Zen Mode</span></div>
          <div className="shortcut"><kbd>Esc</kbd><span>Exit Zen</span></div>
        </div>
      </div>

      {/* Legal Links */}
      <div className="settings-section legal-links">
        <Link to="/privacy" className="legal-link">
          <ExternalLink size={12} />
          Privacy Policy
        </Link>
        <Link to="/terms" className="legal-link">
          <ExternalLink size={12} />
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
