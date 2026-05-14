// Sidebar component — performance-optimised
import { memo } from 'react';
import {
  Layers, BookOpen, Bookmark, Headphones, Settings, X, Menu, Eye,
  Timer, ListTodo, Paintbrush, LogIn, User, ScrollText, Radio
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import PresetsPanel from './panels/PresetsPanel';
import QuranPanel from './panels/QuranPanel';
import BookmarksPanel from './panels/BookmarksPanel';
import TafsirPanel from './panels/TafsirPanel';
import StylePanel from './panels/StylePanel';
import AmbientMixerPanel from './panels/AmbientMixerPanel';
import SettingsPanel from './panels/SettingsPanel';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'presets', icon: Layers, label: 'Presets' },
  { id: 'quran', icon: BookOpen, label: 'Quran' },
  { id: 'bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { id: 'tafsir', icon: ScrollText, label: 'Tafsir' },
  { id: 'style', icon: Paintbrush, label: 'Style' },
  { id: 'mixer', icon: Headphones, label: 'Mixer' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

const PANELS = {
  presets: PresetsPanel,
  quran: QuranPanel,
  bookmarks: BookmarksPanel,
  tafsir: TafsirPanel,
  style: StylePanel,
  mixer: AmbientMixerPanel,
  settings: SettingsPanel,
};

function Sidebar() {
  const sidebarOpen = usePlayerStore(s => s.sidebarOpen);
  const setSidebarOpen = usePlayerStore(s => s.setSidebarOpen);
  const activeSidebarPanel = usePlayerStore(s => s.activeSidebarPanel);
  const setActiveSidebarPanel = usePlayerStore(s => s.setActiveSidebarPanel);
  const toggleZenMode = usePlayerStore(s => s.toggleZenMode);
  const floatingPomodoro = usePlayerStore(s => s.floatingPomodoro);
  const setFloatingPomodoro = usePlayerStore(s => s.setFloatingPomodoro);
  const floatingTodo = usePlayerStore(s => s.floatingTodo);
  const setFloatingTodo = usePlayerStore(s => s.setFloatingTodo);
  const isAuthenticated = usePlayerStore(s => s.isAuthenticated);
  const login = usePlayerStore(s => s.login);
  const radioMode = usePlayerStore(s => s.radioMode);
  const toggleRadioMode = usePlayerStore(s => s.toggleRadioMode);

  const ActivePanel = PANELS[activeSidebarPanel] || PresetsPanel;

  const handleNavClick = (panelId) => {
    if (activeSidebarPanel === panelId && sidebarOpen) {
      setSidebarOpen(false);
    } else {
      setActiveSidebarPanel(panelId);
    }
  };

  return (
    <>
      {/* Mobile toggle */}
      <button className="sidebar-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        {/* Icon rail */}
        <nav className="sidebar-rail">
          <div className="rail-top">
            <button className="rail-brand" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
              <span className="brand-icon">☪</span>
            </button>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`rail-btn ${activeSidebarPanel === item.id && sidebarOpen ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon size={18} />
                  <span className="rail-label">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="rail-bottom">
            {!isAuthenticated && (
              <button
                className="rail-btn small rail-login"
                onClick={login}
                title="Sign in with Quran.com"
                aria-label="Sign in with Quran.com"
              >
                <LogIn size={16} />
              </button>
            )}
            {isAuthenticated && (
              <button
                className="rail-btn small active"
                onClick={() => handleNavClick('settings')}
                title="Account"
                aria-label="Account settings"
              >
                <User size={16} />
              </button>
            )}
            <button
              className={`rail-btn small ${floatingPomodoro ? 'active' : ''}`}
              onClick={() => setFloatingPomodoro(!floatingPomodoro)}
              title="Float Timer"
              aria-label="Toggle floating timer"
            >
              <Timer size={16} />
            </button>
            <button
              className={`rail-btn small ${floatingTodo ? 'active' : ''}`}
              onClick={() => setFloatingTodo(!floatingTodo)}
              title="Float Tasks"
              aria-label="Toggle floating tasks"
            >
              <ListTodo size={16} />
            </button>
            <button
              className={`rail-btn ${radioMode ? 'active' : ''}`}
              onClick={toggleRadioMode}
              title="Radio Mode"
              aria-label="Toggle radio mode"
            >
              <Radio size={18} />
              <span className="rail-label">Radio</span>
            </button>
            <button
              className="rail-btn zen-btn"
              onClick={toggleZenMode}
              title="Zen Mode (Z)"
              aria-label="Toggle zen mode"
            >
              <Eye size={18} />
              <span className="rail-label">Zen</span>
            </button>
          </div>
        </nav>

        {/* Panel area — CSS transition */}
        <div className={`sidebar-panel ${sidebarOpen ? 'panel-open' : ''}`}>
          <div className="sidebar-panel-inner">
            <button className="panel-close" onClick={() => setSidebarOpen(false)} aria-label="Close panel">
              <X size={16} />
            </button>
            <ActivePanel />
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
    </>
  );
}

export default memo(Sidebar);
