import { useState, useRef } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { Search, Repeat, Repeat1, Eye, EyeOff, X, Check } from 'lucide-react';

export default function QuranPanel() {
  const chapters = usePlayerStore(s => s.chapters);
  const currentChapterId = usePlayerStore(s => s.currentChapterId);
  const setCurrentChapterId = usePlayerStore(s => s.setCurrentChapterId);
  const reciters = usePlayerStore(s => s.reciters);
  const reciterId = usePlayerStore(s => s.reciterId);
  const setReciterId = usePlayerStore(s => s.setReciterId);
  const excludedReciters = usePlayerStore(s => s.excludedReciters);
  const toggleExcludedReciter = usePlayerStore(s => s.toggleExcludedReciter);
  const loopMode = usePlayerStore(s => s.loopMode);
  const setLoopMode = usePlayerStore(s => s.setLoopMode);

  const [searchQuery, setSearchQuery] = useState('');
  const [showReciterMgmt, setShowReciterMgmt] = useState(false);
  const searchRef = useRef(null);

  const filteredChapters = searchQuery
    ? chapters.filter(c =>
        c.nameSimple?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nameArabic?.includes(searchQuery) ||
        c.id.toString().includes(searchQuery)
      )
    : chapters;

  const availableReciters = reciters.filter(r => !excludedReciters.includes(r.id));

  const handleSurahClick = (chapterId) => {
    setCurrentChapterId(chapterId);
    setSearchQuery('');
    if (searchRef.current) searchRef.current.blur();
  };

  return (
    <div className="panel-content">
      <h3 className="panel-title">Quran</h3>

      {/* Surah Search */}
      <div className="search-box">
        <Search size={14} />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search surah by name or number..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Clickable Surah List */}
      <div className="surah-list">
        {filteredChapters.length === 0 ? (
          <div className="surah-empty">No surahs found</div>
        ) : (
          filteredChapters.map(c => (
            <button
              key={c.id}
              className={`surah-item ${c.id === currentChapterId ? 'active' : ''}`}
              onClick={() => handleSurahClick(c.id)}
            >
              <span className="surah-number">{c.id}</span>
              <span className="surah-name">{c.nameSimple}</span>
              <span className="surah-arabic">{c.nameArabic}</span>
              {c.id === currentChapterId && <Check size={14} className="surah-check" />}
            </button>
          ))
        )}
      </div>

      {/* Reciter */}
      <div className="control-row">
        <label>Reciter</label>
        <select
          value={reciterId}
          onChange={e => setReciterId(Number(e.target.value))}
        >
          {availableReciters.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button className="inline-link" onClick={() => setShowReciterMgmt(!showReciterMgmt)}>
          {showReciterMgmt ? 'Hide' : 'Manage reciters...'}
        </button>
      </div>

      {/* Reciter Management */}
      {showReciterMgmt && (
        <div className="reciter-management">
          <p className="mgmt-hint">Tap to exclude/include reciters from the dropdown</p>
          <div className="reciter-list">
            {reciters.map(r => {
              const isExcluded = excludedReciters.includes(r.id);
              return (
                <button
                  key={r.id}
                  className={`reciter-chip ${isExcluded ? 'excluded' : ''}`}
                  onClick={() => toggleExcludedReciter(r.id)}
                >
                  {isExcluded ? <EyeOff size={12} /> : <Eye size={12} />}
                  <span>{r.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Loop Mode */}
      <div className="control-row">
        <label>Loop</label>
        <div className="segmented-control">
          <button className={loopMode === 'none' ? 'active' : ''} onClick={() => setLoopMode('none')}>Off</button>
          <button className={loopMode === 'surah' ? 'active' : ''} onClick={() => setLoopMode('surah')}>
            <Repeat size={12} /> Surah
          </button>
          <button className={loopMode === 'verse' ? 'active' : ''} onClick={() => setLoopMode('verse')}>
            <Repeat1 size={12} /> Verse
          </button>
        </div>
      </div>
    </div>
  );
}
