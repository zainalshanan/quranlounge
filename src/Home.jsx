import { useEffect, useState, lazy, Suspense } from 'react';
import { usePlayerStore } from './store/usePlayerStore';
import { useShallow } from 'zustand/react/shallow';
import { getChapters, getReciters, getTranslations } from './api/quranClient';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import './backgrounds.css';
import Clock from './components/Clock';
import VerseDisplay from './components/VerseDisplay';
import { Eye, Play } from 'lucide-react';

// ─── Lazy Loaded Components ───
const Sidebar = lazy(() => import('./components/Sidebar'));
const CanvasBackground = lazy(() => import('./components/CanvasBackground'));
const NowPlayingBar = lazy(() => import('./components/NowPlayingBar'));
const FloatingPomodoro = lazy(() => import('./components/FloatingPomodoro'));
const FloatingTodo = lazy(() => import('./components/FloatingTodo'));

export default function Home() {
  const {
    currentChapterId,
    reciterId,
    loadChapterData,
    setChapters,
    setReciters,
    setTranslations,
    activeBackground,
    activeTheme,
    sidebarOpen,
    zenMode,
    toggleZenMode,
    setZenMode,
    skipNext,
    skipPrev,
    toggleSidebar,
    toggleFullscreen,
    floatingPomodoro,
    floatingTodo,
    performanceMode,
    isStarted,
    setIsStarted
  } = usePlayerStore(useShallow(s => ({
    currentChapterId: s.currentChapterId,
    reciterId: s.reciterId,
    loadChapterData: s.loadChapterData,
    setChapters: s.setChapters,
    setReciters: s.setReciters,
    setTranslations: s.setTranslations,
    activeBackground: s.activeBackground,
    activeTheme: s.activeTheme,
    sidebarOpen: s.sidebarOpen,
    zenMode: s.zenMode,
    toggleZenMode: s.toggleZenMode,
    setZenMode: s.setZenMode,
    skipNext: s.skipNext,
    skipPrev: s.skipPrev,
    toggleSidebar: s.toggleSidebar,
    toggleFullscreen: s.toggleFullscreen,
    floatingPomodoro: s.floatingPomodoro,
    floatingTodo: s.floatingTodo,
    performanceMode: s.performanceMode,
    isStarted: s.isStarted,
    setIsStarted: s.setIsStarted
  })));

  const initAuth = usePlayerStore(s => s.initAuth);
  const [loading, setLoading] = useState(true);

  // Handle OAuth callback & initialize auth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId) {
      localStorage.setItem("ql_session", sessionId);
      window.history.replaceState({}, "", window.location.pathname);
    }
    initAuth();
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    async function init() {
      const [chaps, recs, trans] = await Promise.all([getChapters(), getReciters(), getTranslations()]);
      setChapters(chaps);
      setReciters(recs);
      setTranslations(trans);
      await loadChapterData(currentChapterId, reciterId);
      setLoading(false);
    }
    init();
  }, []);

  // Only run audio hook once the user clicks "Start"
  useAudioPlayer(isStarted);

  useEffect(() => {
    if (activeTheme?.colors) {
      Object.entries(activeTheme.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }
  }, [activeTheme]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isStarted) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      switch (e.code) {
        case 'Space': e.preventDefault(); usePlayerStore.getState().setIsPlaying(!usePlayerStore.getState().isPlaying); break;
        case 'ArrowRight': e.preventDefault(); skipNext(); break;
        case 'ArrowLeft': e.preventDefault(); skipPrev(); break;
        case 'KeyS': e.preventDefault(); toggleSidebar(); break;
        case 'KeyF': e.preventDefault(); toggleFullscreen(); break;
        case 'KeyZ': e.preventDefault(); toggleZenMode(); break;
        case 'Escape': if (zenMode) setZenMode(false); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zenMode, isStarted]);

  // ─── Welcome Screen (User Gesture Required) ───
  if (!isStarted) {
    return (
      <div className="app loading-screen welcome-screen">
        <div className="loading-content">
          <div className="welcome-logo">☪</div>
          <h2>Quran Lounge</h2>
          <p>{loading ? 'Loading Quran data...' : 'Ready to begin your session'}</p>
          
          {!loading && (
            <button 
              className="start-btn" 
              onClick={() => setIsStarted(true)}
              autoFocus
            >
              <Play size={20} fill="currentColor" />
              Start Lounge
            </button>
          )}
          
          {loading && <div className="loading-spinner" style={{ marginTop: '20px' }} />}
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${zenMode ? 'zen-active' : ''} ${performanceMode ? 'perf-mode' : ''}`}>
      <a href="#verse-content" className="skip-link">Skip to content</a>
      {/* Background Section */}
      <Suspense fallback={<div className="background" style={{ backgroundColor: '#0a0a0a' }} />}>
        {activeBackground.type === 'video' ? (
          <video
            key={activeBackground.id}
            className="background background-video"
            src={activeBackground.url}
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
          />
        ) : activeBackground.type === 'canvas' ? (
          <CanvasBackground key={activeBackground.id} id={activeBackground.id} />
        ) : activeBackground.type === 'css' ? (
          <div key={activeBackground.id} className={`bg-css bg-css-${activeBackground.id}`}>
            {activeBackground.id === 'starfield' && <div className="stars-layer" />}
            {activeBackground.id === 'ember' && (
              <div className="ember-particles">
                <span /><span /><span /><span /><span /><span />
                <span /><span /><span /><span /><span /><span />
              </div>
            )}
          </div>
        ) : (
          <div
            className="background"
            style={{
              backgroundImage: activeBackground.url ? `url(${activeBackground.url})` : 'none',
              backgroundColor: activeBackground.url ? 'transparent' : '#0a0a0a',
            }}
          />
        )}
      </Suspense>
      
      <div className="background-overlay" />

      {!zenMode && (
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
      )}

      <main className={`main-content ${sidebarOpen && !zenMode ? 'sidebar-open' : ''} ${zenMode ? 'zen-main' : ''}`}>
        <Clock />
        <div id="verse-content" className="verse-area">
          <VerseDisplay />
        </div>
      </main>

      <Suspense fallback={null}>
        {floatingPomodoro && <FloatingPomodoro />}
        {floatingTodo && <FloatingTodo />}
        {!zenMode && <NowPlayingBar />}
      </Suspense>

      {zenMode && (
        <button className="zen-exit-btn" onClick={() => setZenMode(false)} title="Exit Zen Mode (Z or Esc)" aria-label="Exit zen mode">
          <Eye size={18} />
        </button>
      )}
    </div>
  );
}
