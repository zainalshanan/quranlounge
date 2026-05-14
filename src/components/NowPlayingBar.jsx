import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, Repeat, Repeat1, ChevronUp, ChevronDown, Keyboard, Bookmark,
  LogIn, User
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import './NowPlayingBar.css';

export default function NowPlayingBar() {
  const {
    isPlaying, setIsPlaying,
    skipNext, skipPrev,
    chapters, currentChapterId,
    reciters, reciterId,
    currentVerseIndex, audioFiles,
    masterVolume, setMasterVolume,
    loopMode, setLoopMode,
    showShortcuts, setShowShortcuts,
    showBottomBar, setShowBottomBar,
    bookmarks, addBookmark, removeBookmark,
    isAuthenticated, userInfo, login,
    setActiveSidebarPanel,
  } = usePlayerStore();

  const currentChapter = chapters.find(c => c.id === currentChapterId);
  const currentReciter = reciters.find(r => r.id === reciterId);
  const totalVerses = audioFiles.length;
  const verseNum = currentVerseIndex + 1;
  const verseKey = `${currentChapterId}:${verseNum}`;
  const isBookmarked = bookmarks.some(b => b.verseKey === verseKey);

  const cycleLoop = () => {
    const modes = ['none', 'surah', 'verse'];
    const idx = modes.indexOf(loopMode);
    setLoopMode(modes[(idx + 1) % modes.length]);
  };

  // Minimized state — show just a thin strip to bring it back
  if (!showBottomBar) {
    return (
      <button className="npb-minimized" onClick={() => setShowBottomBar(true)} title="Show Player" aria-label="Show player">
        <ChevronUp size={16} />
      </button>
    );
  }

  return (
    <div className="now-playing-bar">
      {/* Left: Track Info */}
      <div className="npb-info">
        <div className="npb-surah-row">
          <span className="npb-surah">{currentChapter?.nameSimple || 'Loading...'}</span>
          <button
            className={`npb-bookmark ${isBookmarked ? 'active' : ''}`}
            onClick={() => isBookmarked ? removeBookmark(verseKey) : addBookmark(verseKey)}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this verse'}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
          >
            <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="npb-meta">
          {currentReciter?.name || 'Reciter'} · Verse {verseNum}/{totalVerses || '—'}
        </div>
      </div>

      {/* Center: Playback Controls */}
      <div className="npb-center">
        <div className="npb-controls">
          <button className="npb-btn" onClick={skipPrev} title="Previous Surah" aria-label="Previous surah">
            <SkipBack size={15} />
          </button>
          <button className="npb-play" onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button className="npb-btn" onClick={skipNext} title="Next Surah" aria-label="Next surah">
            <SkipForward size={15} />
          </button>
        </div>

        {/* Shortcuts strip */}
        {showShortcuts && (
          <div className="npb-shortcuts">
            <kbd>Space</kbd> Play
            <span className="sc-sep">·</span>
            <kbd>←→</kbd> Surah
            <span className="sc-sep">·</span>
            <kbd>S</kbd> Sidebar
            <span className="sc-sep">·</span>
            <kbd>Z</kbd> Zen
            <span className="sc-sep">·</span>
            <kbd>F</kbd> Full
          </div>
        )}
      </div>

      {/* Right: Volume, Loop, & Bar controls */}
      <div className="npb-right">
        <button
          className={`npb-btn loop-btn ${loopMode !== 'none' ? 'active' : ''}`}
          onClick={cycleLoop}
          title={`Loop: ${loopMode}`}
          aria-label={loopMode === 'none' ? 'Loop off' : loopMode === 'surah' ? 'Loop surah' : 'Loop verse'}
        >
          {loopMode === 'verse' ? <Repeat1 size={16} /> : <Repeat size={16} />}
        </button>
        <div className="npb-volume">
          <Volume2 size={16} aria-hidden="true" />
          <input
            type="range"
            min="0" max="1" step="0.01"
            value={masterVolume}
            onChange={e => setMasterVolume(parseFloat(e.target.value))}
            aria-label="Master volume"
          />
        </div>
        <button
          className="npb-btn shortcut-toggle"
          onClick={() => setShowShortcuts(!showShortcuts)}
          title={showShortcuts ? 'Hide Shortcuts' : 'Show Shortcuts'}
          aria-label={showShortcuts ? 'Hide shortcuts' : 'Show shortcuts'}
        >
          <Keyboard size={14} />
        </button>
        <button
          className={`npb-btn npb-user-btn ${isAuthenticated ? 'authenticated' : ''}`}
          onClick={() => isAuthenticated ? setActiveSidebarPanel('settings') : login()}
          title={isAuthenticated ? (userInfo?.name || userInfo?.email || 'Account') : 'Sign in with Quran.com'}
          aria-label={isAuthenticated ? 'Account' : 'Sign in'}
        >
          {isAuthenticated ? <User size={14} /> : <LogIn size={14} />}
        </button>
        <button
          className="npb-btn minimize-btn"
          onClick={() => setShowBottomBar(false)}
          title="Minimize Player"
          aria-label="Minimize player"
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
}
