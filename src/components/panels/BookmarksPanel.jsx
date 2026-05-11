import { Bookmark, Trash2, LogIn } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';

export default function BookmarksPanel() {
  const bookmarks = usePlayerStore(s => s.bookmarks);
  const removeBookmark = usePlayerStore(s => s.removeBookmark);
  const chapters = usePlayerStore(s => s.chapters);
  const setCurrentChapterId = usePlayerStore(s => s.setCurrentChapterId);
  const isAuthenticated = usePlayerStore(s => s.isAuthenticated);
  const login = usePlayerStore(s => s.login);

  const handleNavigate = (verseKey) => {
    const [chapterId, verseNum] = verseKey.split(':').map(Number);
    if (chapterId) {
      setCurrentChapterId(chapterId);
      // Set verse index after chapter loads
      setTimeout(() => {
        usePlayerStore.getState().setCurrentVerseIndex(verseNum - 1);
      }, 500);
    }
  };

  const getChapterName = (verseKey) => {
    const chapterId = parseInt(verseKey.split(':')[0]);
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.nameSimple || chapter?.name || `Surah ${chapterId}`;
  };

  return (
    <div className="panel-content">
      <h3 className="panel-title">Bookmarks</h3>
      {bookmarks.length > 0 && (
        <p className="panel-subtitle">{bookmarks.length} saved verse{bookmarks.length !== 1 ? 's' : ''}</p>
      )}

      {!isAuthenticated && (
        <div className="bookmark-signin-hint">
          <button className="bookmark-signin-btn" onClick={login}>
            <LogIn size={14} />
            Sign in to sync bookmarks
          </button>
        </div>
      )}

      {bookmarks.length === 0 ? (
        <div className="bookmarks-empty">
          <Bookmark size={32} />
          <p>No bookmarks yet</p>
          <span>Tap the bookmark icon on any verse to save it here</span>
        </div>
      ) : (
        <div className="bookmarks-list">
          {bookmarks.map(bookmark => (
            <div key={bookmark.id} className="bookmark-item">
              <button className="bookmark-navigate" onClick={() => handleNavigate(bookmark.verseKey)}>
                <div className="bookmark-info">
                  <span className="bookmark-surah">{getChapterName(bookmark.verseKey)}</span>
                  <span className="bookmark-verse">Verse {bookmark.verseKey.split(':')[1]}</span>
                </div>
                <span className="bookmark-key">{bookmark.verseKey}</span>
              </button>
              <button
                className="bookmark-delete"
                onClick={() => removeBookmark(bookmark.verseKey)}
                aria-label={`Remove bookmark ${bookmark.verseKey}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
