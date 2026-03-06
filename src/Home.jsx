import { useEffect, useState, lazy, Suspense } from 'react';
import { usePlayerStore } from './store/usePlayerStore';
import { useShallow } from 'zustand/react/shallow';
import { getChapters, getReciters } from './api/quranClient';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import './backgrounds.css';
import Clock from './components/Clock';
import VerseDisplay from './components/VerseDisplay';
import { Eye } from 'lucide-react';

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
    performanceMode
  } = usePlayerStore(useShallow(s => ({
    currentChapterId: s.currentChapterId,
    reciterId: s.reciterId,
    loadChapterData: s.loadChapterData,
    setChapters: s.setChapters,
    setReciters: s.setReciters,
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
    performanceMode: s.performanceMode
  })));

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const [chaps, recs] = await Promise.all([getChapters(), getReciters()]);
      setChapters(chaps);
      setReciters(recs);
      await loadChapterData(currentChapterId, reciterId);
      setLoading(false);
    }
    init();
  }, []);

  useAudioPlayer();

  useEffect(() => {
    if (activeTheme?.colors) {
      Object.entries(activeTheme.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }
  }, [activeTheme]);

  useEffect(() => {
    const handleKeyDown = (e) => {
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
  }, [zenMode]);

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loading-content">
          <div className="loading-spinner" />
          <h2>Preparing your Lounge...</h2>
          <p>Loading Quran data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${zenMode ? 'zen-active' : ''} ${performanceMode ? 'perf-mode' : ''}`}>
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
        <div className="verse-area">
          <VerseDisplay />
        </div>
      </main>

      <Suspense fallback={null}>
        {floatingPomodoro && <FloatingPomodoro />}
        {floatingTodo && <FloatingTodo />}
        {!zenMode && <NowPlayingBar />}
      </Suspense>

      {zenMode && (
        <button className="zen-exit-btn" onClick={() => setZenMode(false)} title="Exit Zen Mode (Z or Esc)">
          <Eye size={18} />
        </button>
      )}
    </div>
  );
}
