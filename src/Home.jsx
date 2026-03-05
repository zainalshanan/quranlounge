import { useEffect, useState } from 'react';
import { usePlayerStore } from './store/usePlayerStore';
import { getChapters, getReciters } from './api/quranClient';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import Sidebar from './components/Sidebar';
import VerseDisplay from './components/VerseDisplay';
import Clock from './components/Clock';
import NowPlayingBar from './components/NowPlayingBar';
import FloatingPomodoro from './components/FloatingPomodoro';
import FloatingTodo from './components/FloatingTodo';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const {
    setChapters,
    setReciters,
    currentChapterId,
    reciterId,
    loadChapterData,
    activeBackground,
    activeTheme,
    sidebarOpen,
    zenMode, toggleZenMode, setZenMode,
    skipNext,
    skipPrev,
    toggleSidebar,
    toggleFullscreen,
    floatingPomodoro,
    floatingTodo,
    showBottomBar,
  } = usePlayerStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const [chaps, recs] = await Promise.all([
        getChapters(),
        getReciters()
      ]);
      setChapters(chaps);
      setReciters(recs);
      await loadChapterData(currentChapterId, reciterId);
      setLoading(false);
    }
    init();
  }, []);

  useAudioPlayer();

  // Apply theme CSS variables
  useEffect(() => {
    if (activeTheme?.colors) {
      Object.entries(activeTheme.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }
  }, [activeTheme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          usePlayerStore.getState().setIsPlaying(!usePlayerStore.getState().isPlaying);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipPrev();
          break;
        case 'KeyS':
          e.preventDefault();
          toggleSidebar();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyZ':
          e.preventDefault();
          toggleZenMode();
          break;
        case 'Escape':
          if (zenMode) setZenMode(false);
          break;
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
    <div className={`app ${zenMode ? 'zen-active' : ''}`}>
      {/* Background */}
      <div
        className="background"
        style={{
          backgroundImage: activeBackground.url ? `url(${activeBackground.url})` : 'none',
          backgroundColor: activeBackground.url ? 'transparent' : '#0a0a0a',
        }}
      />
      <div className="background-overlay" />

      {/* Sidebar — hidden in zen mode */}
      {!zenMode && <Sidebar />}

      {/* Main content area */}
      <main className={`main-content ${sidebarOpen && !zenMode ? 'sidebar-open' : ''} ${zenMode ? 'zen-main' : ''}`}>
        <Clock />
        <div className="verse-area">
          <VerseDisplay />
        </div>
      </main>

      {/* Floating widgets */}
      {floatingPomodoro && <FloatingPomodoro />}
      {floatingTodo && <FloatingTodo />}

      {/* Bottom bar — hidden in zen mode, minimizable */}
      {!zenMode && <NowPlayingBar />}

      {/* Zen mode exit button */}
      {zenMode && (
        <button className="zen-exit-btn" onClick={() => setZenMode(false)} title="Exit Zen Mode (Z or Esc)">
          <Eye size={18} />
        </button>
      )}

      {/* Footer */}
      {!zenMode && (
        <footer className="app-footer">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </footer>
      )}
    </div>
  );
}
