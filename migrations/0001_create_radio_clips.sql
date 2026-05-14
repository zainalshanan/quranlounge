CREATE TABLE IF NOT EXISTS clips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  r2_key TEXT NOT NULL,
  title TEXT,
  speaker TEXT,
  category TEXT DEFAULT 'general',
  duration_seconds INTEGER,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Example insert (run after creating a clip):
-- INSERT INTO clips (r2_key, title, speaker, category, duration_seconds)
-- VALUES ('clip-001.mp4', 'Surah Al-Fatiha', 'Sheikh Mishary', 'recitation', 47);
