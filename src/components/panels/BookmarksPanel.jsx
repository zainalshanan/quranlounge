import { useState } from 'react';
import { Bookmark, Trash2, LogIn, ScrollText, PenLine } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';

export default function BookmarksPanel() {
  const bookmarks = usePlayerStore(s => s.bookmarks);
  const removeBookmark = usePlayerStore(s => s.removeBookmark);
  const chapters = usePlayerStore(s => s.chapters);
  const setCurrentChapterId = usePlayerStore(s => s.setCurrentChapterId);
  const isAuthenticated = usePlayerStore(s => s.isAuthenticated);
  const login = usePlayerStore(s => s.login);
  const setFloatingTafsir = usePlayerStore(s => s.setFloatingTafsir);
  const notes = usePlayerStore(s => s.notes);
  const setNote = usePlayerStore(s => s.setNote);

  const [openNoteKey, setOpenNoteKey] = useState(null);

  const handleNavigate = (verseKey) => {
    const [chapterId, verseNum] = verseKey.split(':').map(Number);
    if (!chapterId) return;
    setCurrentChapterId(chapterId);
    setTimeout(() => {
      usePlayerStore.getState().setCurrentVerseIndex(verseNum - 1);
    }, 500);
  };

  const handleTafsirJump = (verseKey) => {
    handleNavigate(verseKey);
    setFloatingTafsir(true);
  };

  const getChapterName = (verseKey) => {
    const chapterId = parseInt(verseKey.split(':')[0]);
    return chapters.find(c => c.id === chapterId)?.nameSimple || `Surah ${chapterId}`;
  };

  const toggleNote = (verseKey) => {
    setOpenNoteKey(prev => prev === verseKey ? null : verseKey);
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
          {bookmarks.map(bookmark => {
            const hasNote = !!(notes[bookmark.verseKey]?.trim());
            const noteOpen = openNoteKey === bookmark.verseKey;

            return (
              <div key={bookmark.id} className={`bookmark-card ${noteOpen ? 'note-open' : ''}`}>
                {/* Header row */}
                <div className="bookmark-card-header">
                  <button
                    className="bookmark-navigate"
                    onClick={() => handleNavigate(bookmark.verseKey)}
                    title="Go to verse"
                    aria-label={`Navigate to ${bookmark.verseKey}`}
                  >
                    <span className="bookmark-surah">{getChapterName(bookmark.verseKey)}</span>
                    <span className="bookmark-key">{bookmark.verseKey}</span>
                  </button>

                  <div className="bookmark-actions">
                    <button
                      className="bm-action-btn"
                      onClick={() => handleTafsirJump(bookmark.verseKey)}
                      title="Open tafsir for this verse"
                      aria-label="Open tafsir"
                    >
                      <ScrollText size={13} />
                    </button>
                    <button
                      className={`bm-action-btn ${hasNote ? 'has-note' : ''} ${noteOpen ? 'active' : ''}`}
                      onClick={() => toggleNote(bookmark.verseKey)}
                      title={hasNote ? 'Edit note' : 'Add note'}
                      aria-label={noteOpen ? 'Close note' : 'Add or edit note'}
                    >
                      <PenLine size={13} />
                    </button>
                    <button
                      className="bm-action-btn bm-delete"
                      onClick={() => removeBookmark(bookmark.verseKey)}
                      aria-label={`Remove bookmark ${bookmark.verseKey}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Note preview when closed */}
                {hasNote && !noteOpen && (
                  <p className="bookmark-note-preview">{notes[bookmark.verseKey]}</p>
                )}

                {/* Note editor when open */}
                {noteOpen && (
                  <div className="bookmark-note-editor">
                    <textarea
                      className="bookmark-note-textarea"
                      value={notes[bookmark.verseKey] || ''}
                      onChange={e => setNote(bookmark.verseKey, e.target.value)}
                      placeholder="Write a reflection, word meaning, or study note..."
                      rows={4}
                      autoFocus
                      aria-label="Verse note"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
