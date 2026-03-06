import { create } from 'zustand';
import { getChapterVerses, getChapterAudio } from '../api/quranClient';

// ─── Themes ───
export const THEMES = [
  {
    id: 'emerald-night',
    name: 'Emerald Night',
    colors: {
      '--theme-bg': 'rgba(10, 18, 14, 0.85)',
      '--theme-surface': 'rgba(16, 32, 22, 0.6)',
      '--theme-accent': '#34d399',
      '--theme-accent-glow': 'rgba(52, 211, 153, 0.3)',
      '--theme-text': '#ffffff',
      '--theme-text-secondary': 'rgba(255,255,255,0.55)',
      '--theme-border': 'rgba(52, 211, 153, 0.15)',
      '--theme-hover': 'rgba(52, 211, 153, 0.1)',
      '--theme-active': 'rgba(52, 211, 153, 0.2)',
    }
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    colors: {
      '--theme-bg': 'rgba(8, 12, 24, 0.85)',
      '--theme-surface': 'rgba(15, 23, 42, 0.6)',
      '--theme-accent': '#60a5fa',
      '--theme-accent-glow': 'rgba(96, 165, 250, 0.3)',
      '--theme-text': '#ffffff',
      '--theme-text-secondary': 'rgba(255,255,255,0.55)',
      '--theme-border': 'rgba(96, 165, 250, 0.15)',
      '--theme-hover': 'rgba(96, 165, 250, 0.1)',
      '--theme-active': 'rgba(96, 165, 250, 0.2)',
    }
  },
  {
    id: 'warm-amber',
    name: 'Warm Amber',
    colors: {
      '--theme-bg': 'rgba(24, 16, 8, 0.85)',
      '--theme-surface': 'rgba(45, 30, 15, 0.6)',
      '--theme-accent': '#fbbf24',
      '--theme-accent-glow': 'rgba(251, 191, 36, 0.3)',
      '--theme-text': '#ffffff',
      '--theme-text-secondary': 'rgba(255,255,255,0.55)',
      '--theme-border': 'rgba(251, 191, 36, 0.15)',
      '--theme-hover': 'rgba(251, 191, 36, 0.1)',
      '--theme-active': 'rgba(251, 191, 36, 0.2)',
    }
  },
  {
    id: 'rose-garden',
    name: 'Rose Garden',
    colors: {
      '--theme-bg': 'rgba(24, 10, 16, 0.85)',
      '--theme-surface': 'rgba(40, 18, 28, 0.6)',
      '--theme-accent': '#f472b6',
      '--theme-accent-glow': 'rgba(244, 114, 182, 0.3)',
      '--theme-text': '#ffffff',
      '--theme-text-secondary': 'rgba(255,255,255,0.55)',
      '--theme-border': 'rgba(244, 114, 182, 0.15)',
      '--theme-hover': 'rgba(244, 114, 182, 0.1)',
      '--theme-active': 'rgba(244, 114, 182, 0.2)',
    }
  },
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    colors: {
      '--theme-bg': 'rgba(8, 18, 22, 0.85)',
      '--theme-surface': 'rgba(14, 30, 38, 0.6)',
      '--theme-accent': '#22d3ee',
      '--theme-accent-glow': 'rgba(34, 211, 238, 0.3)',
      '--theme-text': '#ffffff',
      '--theme-text-secondary': 'rgba(255,255,255,0.55)',
      '--theme-border': 'rgba(34, 211, 238, 0.15)',
      '--theme-hover': 'rgba(34, 211, 238, 0.1)',
      '--theme-active': 'rgba(34, 211, 238, 0.2)',
    }
  },
  {
    id: 'minimal-dark',
    name: 'Minimal Dark',
    colors: {
      '--theme-bg': 'rgba(12, 12, 12, 0.85)',
      '--theme-surface': 'rgba(24, 24, 24, 0.6)',
      '--theme-accent': '#a3a3a3',
      '--theme-accent-glow': 'rgba(163, 163, 163, 0.3)',
      '--theme-text': '#ffffff',
      '--theme-text-secondary': 'rgba(255,255,255,0.5)',
      '--theme-border': 'rgba(255, 255, 255, 0.1)',
      '--theme-hover': 'rgba(255, 255, 255, 0.06)',
      '--theme-active': 'rgba(255, 255, 255, 0.12)',
    }
  }
];

// ─── Text Style Presets ───
export const TEXT_STYLE_PRESETS = [
  {
    id: 'default-glow',
    name: 'Soft Glow',
    emoji: '✨',
    arabicColor: '#ffffff',
    englishColor: 'rgba(255,255,255,0.8)',
    highlightColor: '#34d399',
    textShadow: '0 0 20px rgba(255,255,255,0.3)',
    highlightGlow: '0 0 24px rgba(52, 211, 153, 0.5)',
    showBackdrop: true,
  },
  {
    id: 'neon-accent',
    name: 'Neon Accent',
    emoji: '💜',
    arabicColor: '#e0e0ff',
    englishColor: 'rgba(224,224,255,0.75)',
    highlightColor: '#a78bfa',
    textShadow: '0 0 30px rgba(167, 139, 250, 0.4)',
    highlightGlow: '0 0 32px rgba(167, 139, 250, 0.7)',
    showBackdrop: true,
  },
  {
    id: 'golden-classic',
    name: 'Golden Classic',
    emoji: '🌟',
    arabicColor: '#fde68a',
    englishColor: 'rgba(253, 230, 138, 0.7)',
    highlightColor: '#f59e0b',
    textShadow: '0 2px 10px rgba(0,0,0,0.6)',
    highlightGlow: '0 0 20px rgba(245, 158, 11, 0.5)',
    showBackdrop: true,
  },
  {
    id: 'clean-white',
    name: 'Clean White',
    emoji: '⬜',
    arabicColor: '#ffffff',
    englishColor: 'rgba(255,255,255,0.7)',
    highlightColor: '#ffffff',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
    highlightGlow: '0 0 12px rgba(255,255,255,0.4)',
    showBackdrop: false,
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    emoji: '🌊',
    arabicColor: '#bae6fd',
    englishColor: 'rgba(186,230,253,0.7)',
    highlightColor: '#38bdf8',
    textShadow: '0 0 16px rgba(56, 189, 248, 0.3)',
    highlightGlow: '0 0 24px rgba(56, 189, 248, 0.6)',
    showBackdrop: true,
  },
  {
    id: 'ember-fire',
    name: 'Ember Fire',
    emoji: '🔥',
    arabicColor: '#fecaca',
    englishColor: 'rgba(254,202,202,0.7)',
    highlightColor: '#ef4444',
    textShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
    highlightGlow: '0 0 28px rgba(239, 68, 68, 0.6)',
    showBackdrop: true,
  },
  {
    id: 'minimal-none',
    name: 'No Effects',
    emoji: '📝',
    arabicColor: '#ffffff',
    englishColor: 'rgba(255,255,255,0.7)',
    highlightColor: '#34d399',
    textShadow: 'none',
    highlightGlow: 'none',
    showBackdrop: false,
  },
  {
    id: 'desert-sand',
    name: 'Desert Sand',
    emoji: '🏜️',
    arabicColor: '#f5e6d3',
    englishColor: 'rgba(245,230,211,0.65)',
    highlightColor: '#d97706',
    textShadow: '0 3px 12px rgba(0,0,0,0.7)',
    highlightGlow: '0 0 20px rgba(217,119,6,0.45)',
    showBackdrop: true,
  },
  {
    id: 'frosted-glass',
    name: 'Frosted Glass',
    emoji: '❄️',
    arabicColor: 'rgba(255,255,255,0.85)',
    englishColor: 'rgba(255,255,255,0.5)',
    highlightColor: '#67e8f9',
    textShadow: '0 0 40px rgba(103,232,249,0.15)',
    highlightGlow: '0 0 30px rgba(103,232,249,0.5)',
    showBackdrop: true,
  },
  {
    id: 'neon-pink',
    name: 'Neon Pink',
    emoji: '💗',
    arabicColor: '#fce7f3',
    englishColor: 'rgba(252,231,243,0.6)',
    highlightColor: '#ec4899',
    textShadow: '0 0 24px rgba(236,72,153,0.3)',
    highlightGlow: '0 0 36px rgba(236,72,153,0.7), 0 0 72px rgba(236,72,153,0.3)',
    showBackdrop: false,
  },
  {
    id: 'aurora',
    name: 'Aurora',
    emoji: '🌌',
    arabicColor: '#d1fae5',
    englishColor: 'rgba(209,250,229,0.6)',
    highlightColor: '#a78bfa',
    textShadow: '0 0 20px rgba(52,211,153,0.3), 0 0 40px rgba(167,139,250,0.15)',
    highlightGlow: '0 0 28px rgba(167,139,250,0.6), 0 0 56px rgba(52,211,153,0.2)',
    showBackdrop: true,
  },
  {
    id: 'moonlit-ivory',
    name: 'Moonlit Ivory',
    emoji: '🌙',
    arabicColor: '#fffbeb',
    englishColor: 'rgba(255,251,235,0.6)',
    highlightColor: '#fde68a',
    textShadow: '0 1px 6px rgba(0,0,0,0.4)',
    highlightGlow: '0 0 16px rgba(253,230,138,0.4)',
    showBackdrop: false,
  },
  {
    id: 'radio-retro',
    name: 'Radio Station',
    emoji: '📻',
    arabicColor: '#fbbf24',
    englishColor: 'rgba(251,191,36,0.6)',
    highlightColor: '#f97316',
    textShadow: '0 0 8px rgba(251,191,36,0.3)',
    highlightGlow: '0 0 20px rgba(249,115,22,0.5)',
    showBackdrop: true,
  },
];

// ─── Backgrounds ───
export const BACKGROUNDS = [
  { id: 'lofi-room', name: 'Lofi Room', url: '/assets/gifs/1.gif', category: 'indoor' },
  { id: 'forest-rain', name: 'Forest Rain', url: '/assets/gifs/2.gif', category: 'nature' },
  { id: 'pixel-cafe', name: 'Pixel Cafe', url: 'https://media1.giphy.com/media/l0MYyv5BEoG0NMIko/giphy.gif', category: 'indoor' },
  { id: 'starry-night', name: 'Starry Night', url: 'https://media1.giphy.com/media/3o7TKVUn7iM8FMEU24/giphy.gif', category: 'sky' },
  { id: 'campfire', name: 'Campfire', url: 'https://media1.giphy.com/media/xUOwGdA2o7E4TPJICQ/giphy.gif', category: 'nature' },
  { id: 'ocean-sunset', name: 'Ocean Sunset', url: 'https://media1.giphy.com/media/l0HlGEX1ZORa0aIve/giphy.gif', category: 'nature' },
  { id: 'rain-window', name: 'Rain on Window', url: 'https://media1.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif', category: 'indoor' },
  { id: 'northern-lights', name: 'Northern Lights', url: 'https://media1.giphy.com/media/l3vR4aFAkeJFg2HXa/giphy.gif', category: 'sky' },
  { id: 'mosque-interior', name: 'Mosque', url: 'https://media1.giphy.com/media/3oz8xEUr3yyMvVyBYQ/giphy.gif', category: 'indoor' },
  { id: 'desert-dunes', name: 'Desert Dunes', url: 'https://media1.giphy.com/media/l0HlPystfePnAI3G8/giphy.gif', category: 'nature' },
  { id: 'space', name: 'Deep Space', url: 'https://media1.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', category: 'sky' },
  { id: 'rain-city', name: 'Rainy City', url: 'https://media1.giphy.com/media/l1J3G5lf06vi58EIE/giphy.gif', category: 'indoor' },
  { id: 'dark-minimal', name: 'Dark Minimal', url: '', category: 'minimal' },
];

// ─── Ambient Tracks ───
export const AMBIENT_TRACKS = [
  { id: 'rain', name: 'Rain', icon: '🌧️', url: 'https://www.soundjay.com/nature/rain-01.mp3', category: 'nature' },
  { id: 'fire', name: 'Campfire', icon: '🔥', url: 'https://www.soundjay.com/nature/fire-1.mp3', category: 'nature' },
  { id: 'forest', name: 'Forest Birds', icon: '🌲', url: 'https://www.soundjay.com/nature/forest-1.mp3', category: 'nature' },
  { id: 'waves', name: 'Ocean Waves', icon: '🌊', url: 'https://www.soundjay.com/nature/ocean-waves-1.mp3', category: 'nature' },
  { id: 'wind', name: 'Wind', icon: '💨', url: 'https://www.soundjay.com/nature/wind-howl-1.mp3', category: 'nature' },
  { id: 'thunder', name: 'Thunder', icon: '⛈️', url: 'https://www.soundjay.com/nature/thunder-1.mp3', category: 'nature' },
  { id: 'stream', name: 'Stream', icon: '🏞️', url: 'https://www.soundjay.com/nature/stream-1.mp3', category: 'nature' },
  { id: 'crickets', name: 'Night Crickets', icon: '🦗', url: 'https://www.soundjay.com/nature/crickets-1.mp3', category: 'nature' },
];

// ─── Presets ───
export const PRESETS = [
  {
    id: 'campfire',
    name: 'Campfire',
    emoji: '🔥',
    description: 'Crackling flames under the stars',
    reciterId: 7,
    ambientIds: ['fire'],
    ambientVolumes: { fire: 0.4 },
    bgId: 'campfire',
    themeId: 'warm-amber',
    textStyleId: 'ember-fire',
  },
  {
    id: 'rainy-window',
    name: 'Rainy Window',
    emoji: '🌧️',
    description: 'Gentle rain on a quiet evening',
    reciterId: 7,
    ambientIds: ['rain'],
    ambientVolumes: { rain: 0.5 },
    bgId: 'rain-window',
    themeId: 'midnight-blue',
    textStyleId: 'ocean-blue',
  },
  {
    id: 'forest-retreat',
    name: 'Forest Retreat',
    emoji: '🌲',
    description: 'Bird songs and flowing streams',
    reciterId: 7,
    ambientIds: ['forest', 'stream'],
    ambientVolumes: { forest: 0.35, stream: 0.25 },
    bgId: 'forest-rain',
    themeId: 'emerald-night',
    textStyleId: 'default-glow',
  },
  {
    id: 'ocean-calm',
    name: 'Ocean Calm',
    emoji: '🌊',
    description: 'Waves lapping on a peaceful shore',
    reciterId: 7,
    ambientIds: ['waves'],
    ambientVolumes: { waves: 0.45 },
    bgId: 'ocean-sunset',
    themeId: 'ocean-depths',
    textStyleId: 'ocean-blue',
  },
  {
    id: 'night-study',
    name: 'Night Study',
    emoji: '🌙',
    description: 'Starry skies and soft crickets',
    reciterId: 8,
    ambientIds: ['crickets'],
    ambientVolumes: { crickets: 0.3 },
    bgId: 'starry-night',
    themeId: 'midnight-blue',
    textStyleId: 'neon-accent',
  },
  {
    id: 'cozy-cafe',
    name: 'Cozy Cafe',
    emoji: '☕',
    description: 'Warm ambiance of a quiet café',
    reciterId: 7,
    ambientIds: ['rain'],
    ambientVolumes: { rain: 0.2 },
    bgId: 'pixel-cafe',
    themeId: 'warm-amber',
    textStyleId: 'golden-classic',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    emoji: '🕌',
    description: 'Pure recitation, no distractions',
    reciterId: 7,
    ambientIds: [],
    ambientVolumes: {},
    bgId: 'dark-minimal',
    themeId: 'minimal-dark',
    textStyleId: 'clean-white',
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    emoji: '📖',
    description: 'Lofi room with gentle rain',
    reciterId: 7,
    ambientIds: ['rain'],
    ambientVolumes: { rain: 0.3 },
    bgId: 'lofi-room',
    themeId: 'emerald-night',
    textStyleId: 'default-glow',
  }
];

// ─── localStorage helpers ───
function loadFromStorage(key, fallback) {
  try {
    const val = localStorage.getItem(`ql_${key}`);
    return val !== null ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}

function saveToStorage(key, value) {
  try { localStorage.setItem(`ql_${key}`, JSON.stringify(value)); } catch { /* ignore */ }
}

// ─── Store ───
export const usePlayerStore = create((set, get) => ({
  // ── Sidebar ──
  sidebarOpen: false,
  setSidebarOpen: (val) => set({ sidebarOpen: val }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  activeSidebarPanel: 'presets',
  setActiveSidebarPanel: (panel) => set({ activeSidebarPanel: panel, sidebarOpen: true }),

  // ── Zen Mode ──
  zenMode: false,
  toggleZenMode: () => set((s) => ({ zenMode: !s.zenMode })),
  setZenMode: (val) => set({ zenMode: val }),

  // ── Theme ──
  activeTheme: THEMES.find(t => t.id === loadFromStorage('themeId', 'emerald-night')) || THEMES[0],
  setActiveTheme: (themeId) => {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    saveToStorage('themeId', themeId);
    set({ activeTheme: theme });
  },

  // ── Background ──
  activeBackground: BACKGROUNDS.find(b => b.id === loadFromStorage('bgId', 'lofi-room')) || BACKGROUNDS[0],
  setActiveBackground: (id) => {
    const bg = BACKGROUNDS.find(b => b.id === id) || BACKGROUNDS[0];
    saveToStorage('bgId', id);
    set({ activeBackground: bg });
  },

  // ── Clock ──
  showClock: loadFromStorage('showClock', true),
  setShowClock: (val) => { saveToStorage('showClock', val); set({ showClock: val }); },
  clockFormat: loadFromStorage('clockFormat', '12'),
  setClockFormat: (fmt) => { saveToStorage('clockFormat', fmt); set({ clockFormat: fmt }); },
  showDate: loadFromStorage('showDate', true),
  setShowDate: (val) => { saveToStorage('showDate', val); set({ showDate: val }); },
  showSeconds: loadFromStorage('showSeconds', false),
  setShowSeconds: (val) => { saveToStorage('showSeconds', val); set({ showSeconds: val }); },

  // ── Text Style ──
  activeTextStyle: TEXT_STYLE_PRESETS.find(t => t.id === loadFromStorage('textStyleId', 'default-glow')) || TEXT_STYLE_PRESETS[0],
  setActiveTextStyle: (styleId) => {
    const style = TEXT_STYLE_PRESETS.find(s => s.id === styleId) || TEXT_STYLE_PRESETS[0];
    saveToStorage('textStyleId', styleId);
    set({ activeTextStyle: style });
  },
  // Custom overrides (when user tweaks individual settings)
  customTextStyle: loadFromStorage('customTextStyle', null),
  setCustomTextStyle: (overrides) => {
    const current = get().customTextStyle || { ...get().activeTextStyle };
    const next = { ...current, ...overrides, id: 'custom' };
    saveToStorage('customTextStyle', next);
    set({ customTextStyle: next });
  },
  clearCustomTextStyle: () => {
    saveToStorage('customTextStyle', null);
    set({ customTextStyle: null });
  },

  // ── Display Languages ──
  displayLanguages: loadFromStorage('displayLanguages', ['arabic', 'english']),
  setDisplayLanguages: (langs) => { saveToStorage('displayLanguages', langs); set({ displayLanguages: langs }); },
  toggleDisplayLanguage: (lang) => {
    const { displayLanguages } = get();
    const next = displayLanguages.includes(lang)
      ? displayLanguages.filter(l => l !== lang)
      : [...displayLanguages, lang];
    if (next.length === 0) return;
    saveToStorage('displayLanguages', next);
    set({ displayLanguages: next });
  },

  // Per-language highlight settings
  highlightArabic: loadFromStorage('highlightArabic', true),
  setHighlightArabic: (val) => { saveToStorage('highlightArabic', val); set({ highlightArabic: val }); },
  highlightEnglish: loadFromStorage('highlightEnglish', true),
  setHighlightEnglish: (val) => { saveToStorage('highlightEnglish', val); set({ highlightEnglish: val }); },

  // Backdrop blur behind text
  showTextBackdrop: loadFromStorage('showTextBackdrop', true),
  setShowTextBackdrop: (val) => { saveToStorage('showTextBackdrop', val); set({ showTextBackdrop: val }); },

  // Highlight word background (the bg tint behind active word)
  highlightWordBg: loadFromStorage('highlightWordBg', true),
  setHighlightWordBg: (val) => { saveToStorage('highlightWordBg', val); set({ highlightWordBg: val }); },

  // Verse area sizing (0.5 = compact, 1.0 = normal, 1.5 = expanded)
  verseAreaScale: loadFromStorage('verseAreaScale', 1.0),
  setVerseAreaScale: (scale) => { saveToStorage('verseAreaScale', scale); set({ verseAreaScale: scale }); },

  // Font size scale (0.5 = tiny, 1.0 = normal, 2.0 = large)
  fontSizeScale: loadFromStorage('fontSizeScale', 1.0),
  setFontSizeScale: (scale) => { saveToStorage('fontSizeScale', scale); set({ fontSizeScale: scale }); },

  // View area height (vh)
  viewAreaHeight: loadFromStorage('viewAreaHeight', 60),
  setViewAreaHeight: (height) => { saveToStorage('viewAreaHeight', height); set({ viewAreaHeight: height }); },

  // Legacy compat
  highlightingEnabled: loadFromStorage('highlightingEnabled', true),
  setHighlightingEnabled: (val) => { saveToStorage('highlightingEnabled', val); set({ highlightingEnabled: val }); },

  // ── Floating Widgets ──
  floatingPomodoro: loadFromStorage('floatingPomodoro', false),
  setFloatingPomodoro: (val) => { saveToStorage('floatingPomodoro', val); set({ floatingPomodoro: val }); },
  floatingTodo: loadFromStorage('floatingTodo', false),
  setFloatingTodo: (val) => { saveToStorage('floatingTodo', val); set({ floatingTodo: val }); },

  // Widget visual style
  widgetStyle: loadFromStorage('widgetStyle', 'glass'),
  setWidgetStyle: (style) => { saveToStorage('widgetStyle', style); set({ widgetStyle: style }); },

  // Show shortcuts on bottom bar
  showShortcuts: loadFromStorage('showShortcuts', true),
  setShowShortcuts: (val) => { saveToStorage('showShortcuts', val); set({ showShortcuts: val }); },

  // Bottom bar visibility
  showBottomBar: true,
  setShowBottomBar: (val) => set({ showBottomBar: val }),

  // ── Todo List ──
  todos: loadFromStorage('todos', []),
  addTodo: (text) => {
    const todo = { id: Date.now(), text, completed: false };
    const next = [...get().todos, todo];
    saveToStorage('todos', next);
    set({ todos: next });
  },
  toggleTodo: (id) => {
    const next = get().todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveToStorage('todos', next);
    set({ todos: next });
  },
  deleteTodo: (id) => {
    const next = get().todos.filter(t => t.id !== id);
    saveToStorage('todos', next);
    set({ todos: next });
  },

  // ── Pomodoro Config ──
  pomodoroWorkMin: loadFromStorage('pomodoroWorkMin', 25),
  setPomodoroWorkMin: (val) => { saveToStorage('pomodoroWorkMin', val); set({ pomodoroWorkMin: val }); },
  pomodoroBreakMin: loadFromStorage('pomodoroBreakMin', 5),
  setPomodoroBreakMin: (val) => { saveToStorage('pomodoroBreakMin', val); set({ pomodoroBreakMin: val }); },
  pomodoroSessions: loadFromStorage('pomodoroSessions', 4),
  setPomodoroSessions: (val) => { saveToStorage('pomodoroSessions', val); set({ pomodoroSessions: val }); },

  // ── Loop Mode ──
  loopMode: loadFromStorage('loopMode', 'none'),
  setLoopMode: (mode) => { saveToStorage('loopMode', mode); set({ loopMode: mode }); },

  // ── Multi-Reciter ──
  reciterPool: loadFromStorage('reciterPool', []), // IDs of reciters in the rotation
  setReciterPool: (pool) => { saveToStorage('reciterPool', pool); set({ reciterPool: pool }); },
  toggleReciterInPool: (id) => {
    const pool = [...get().reciterPool];
    const idx = pool.indexOf(id);
    if (idx >= 0) {
      pool.splice(idx, 1);
    } else {
      pool.push(id);
    }
    saveToStorage('reciterPool', pool);
    set({ reciterPool: pool });
  },
  excludedReciters: loadFromStorage('excludedReciters', []),
  toggleExcludedReciter: (id) => {
    const list = [...get().excludedReciters];
    const idx = list.indexOf(id);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(id);
    saveToStorage('excludedReciters', list);
    set({ excludedReciters: list });
  },

  // ── Ambient Mixer (multi-track) ──
  activeAmbientTracks: loadFromStorage('activeAmbientTracks', { rain: 0.4 }),
  setAmbientTrackVolume: (trackId, volume) => {
    const current = { ...get().activeAmbientTracks };
    if (volume <= 0) {
      delete current[trackId];
    } else {
      current[trackId] = volume;
    }
    saveToStorage('activeAmbientTracks', current);
    set({ activeAmbientTracks: current });
  },
  toggleAmbientTrack: (trackId) => {
    const current = { ...get().activeAmbientTracks };
    if (current[trackId] !== undefined) {
      delete current[trackId];
    } else {
      current[trackId] = 0.3;
    }
    saveToStorage('activeAmbientTracks', current);
    set({ activeAmbientTracks: current });
  },

  // ── Playback ──
  isPlaying: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  masterVolume: loadFromStorage('masterVolume', 0.5),
  setMasterVolume: (vol) => { saveToStorage('masterVolume', vol); set({ masterVolume: vol }); },
  recitationVolume: loadFromStorage('recitationVolume', 1.0),
  setRecitationVolume: (vol) => { saveToStorage('recitationVolume', vol); set({ recitationVolume: vol }); },

  // ── Data & Caching ──
  chapters: [],
  setChapters: (chapters) => set({ chapters }),
  reciters: [],
  setReciters: (reciters) => set({ reciters }),
  dataCache: {},
  verses: [],
  audioFiles: [],
  currentChapterId: loadFromStorage('currentChapterId', 1),
  currentVerseIndex: 0,
  activeWordIds: [],
  isLoadingChapter: false,
  _abortController: null,
  _requestAudioDestroy: null,
  setCurrentVerseIndex: (idx) => set({ currentVerseIndex: idx }),
  setActiveWordIds: (ids) => set({ activeWordIds: ids }),

  // ── Media Selections ──
  reciterId: loadFromStorage('reciterId', 7),

  // ── Presets ──
  applyPreset: (preset) => {
    const theme = THEMES.find(t => t.id === preset.themeId) || THEMES[0];
    const bg = BACKGROUNDS.find(b => b.id === preset.bgId) || BACKGROUNDS[0];
    const textStyle = TEXT_STYLE_PRESETS.find(s => s.id === preset.textStyleId) || TEXT_STYLE_PRESETS[0];
    saveToStorage('themeId', preset.themeId);
    saveToStorage('bgId', preset.bgId);
    saveToStorage('reciterId', preset.reciterId);
    saveToStorage('activeAmbientTracks', preset.ambientVolumes || {});
    saveToStorage('textStyleId', preset.textStyleId || 'default-glow');
    saveToStorage('customTextStyle', null);
    set({
      activeTheme: theme,
      activeBackground: bg,
      reciterId: preset.reciterId,
      activeAmbientTracks: preset.ambientVolumes || {},
      activeTextStyle: textStyle,
      customTextStyle: null,
    });
    get().loadChapterData(get().currentChapterId, preset.reciterId);
  },

  // ── Load Logic ──
  loadChapterData: async (chapterId, reciterIdArg) => {
    const cacheKey = `${chapterId}_${reciterIdArg}`;
    const { dataCache, _abortController, _requestAudioDestroy } = get();

    // 1. Cancel any in-flight request
    if (_abortController) {
      _abortController.abort();
    }

    // 2. Immediately destroy old audio (synchronous — no overlap)
    if (_requestAudioDestroy) {
      _requestAudioDestroy();
    }

    // 3. Optimistic state update — UI responds instantly
    saveToStorage('currentChapterId', chapterId);

    // 4. Check cache first
    if (dataCache[cacheKey]) {
      const cached = dataCache[cacheKey];
      set({
        currentChapterId: chapterId,
        verses: cached.verses,
        audioFiles: cached.audioFiles,
        currentVerseIndex: 0,
        activeWordIds: [],
        isLoadingChapter: false,
        _abortController: null,
      });
      return;
    }

    // 5. Start async load with new AbortController
    const controller = new AbortController();
    set({
      currentChapterId: chapterId,
      currentVerseIndex: 0,
      activeWordIds: [],
      verses: [],
      audioFiles: [],
      isLoadingChapter: true,
      _abortController: controller,
    });

    try {
      const [v, a] = await Promise.all([
        getChapterVerses(chapterId),
        getChapterAudio(chapterId, reciterIdArg)
      ]);

      // 6. If aborted while fetching, discard results silently
      if (controller.signal.aborted) return;

      set((state) => ({
        verses: v,
        audioFiles: a,
        isLoadingChapter: false,
        _abortController: null,
        dataCache: { ...state.dataCache, [cacheKey]: { verses: v, audioFiles: a } }
      }));
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("[Store] Load Error:", err);
      set({ isLoadingChapter: false, _abortController: null });
    }
  },

  setCurrentChapterId: (id) => {
    const { reciterId } = get();
    // Optimistic: update chapterId immediately so NowPlayingBar reflects it
    set({ currentChapterId: id, currentVerseIndex: 0, activeWordIds: [] });
    get().loadChapterData(id, reciterId);
  },

  setReciterId: (id) => {
    const { currentChapterId } = get();
    saveToStorage('reciterId', id);
    // Optimistic: update reciterId immediately
    set({ reciterId: id });
    get().loadChapterData(currentChapterId, id);
  },

  // Skip to NEXT SURAH (button behavior)
  skipNext: () => {
    const { chapters, currentChapterId, loopMode } = get();
    if (loopMode === 'surah') {
      set({ currentVerseIndex: 0 });
      return;
    }
    const nextId = currentChapterId < chapters.length ? currentChapterId + 1 : 1;
    get().setCurrentChapterId(nextId);
  },

  // Skip to PREV SURAH
  skipPrev: () => {
    const { currentChapterId } = get();
    const prevId = currentChapterId > 1 ? currentChapterId - 1 : 114;
    get().setCurrentChapterId(prevId);
  },

  // Advance verse (called by audio player on verse end)
  advanceVerse: () => {
    const { currentVerseIndex, audioFiles, currentChapterId, loopMode, reciters, reciterId, excludedReciters } = get();
    if (loopMode === 'verse') return; // repeat same verse
    if (currentVerseIndex < audioFiles.length - 1) {
      // Next verse in same surah
      set({ currentVerseIndex: currentVerseIndex + 1 });
    } else if (loopMode === 'surah') {
      // Loop back to first verse of same surah
      set({ currentVerseIndex: 0 });
    } else {
      // Surah finished — autoplay: next surah, or cycle reciter at end of Quran
      if (currentChapterId < 114) {
        get().setCurrentChapterId(currentChapterId + 1);
      } else {
        // Reached end of Quran — try next reciter
        const available = reciters.filter(r => !excludedReciters.includes(r.id));
        if (available.length > 1) {
          const currentIdx = available.findIndex(r => r.id === reciterId);
          const nextReciter = available[(currentIdx + 1) % available.length];
          saveToStorage('reciterId', nextReciter.id);
          set({ reciterId: nextReciter.id });
          get().loadChapterData(1, nextReciter.id);
        } else {
          // Only one reciter, loop whole Quran
          get().setCurrentChapterId(1);
        }
      }
    }
  },

  // ── Sleep Timer ──
  sleepTimerMinutes: 0,
  sleepTimerEnd: null,
  setSleepTimer: (minutes) => {
    if (minutes <= 0) {
      set({ sleepTimerMinutes: 0, sleepTimerEnd: null });
    } else {
      set({ sleepTimerMinutes: minutes, sleepTimerEnd: Date.now() + minutes * 60 * 1000 });
    }
  },
  clearSleepTimer: () => set({ sleepTimerMinutes: 0, sleepTimerEnd: null }),

  // ── Fullscreen ──
  isFullscreen: false,
  toggleFullscreen: () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      set({ isFullscreen: true });
    } else {
      document.exitFullscreen();
      set({ isFullscreen: false });
    }
  },

  // Legacy compat
  isZenMode: false,
  showPlayer: true,
  togglePlayer: () => set((s) => ({ showPlayer: !s.showPlayer })),
  textMode: 'both',
  setTextMode: (mode) => set({ textMode: mode }),
  showPomodoro: false,
  setShowPomodoro: (val) => set({ showPomodoro: val }),
  playerStyle: 'glass',
  playerMode: 'full',
  playerPos: { x: 0, y: 0 },
  ambientTrack: AMBIENT_TRACKS[0],
  ambientVolume: 0.3,
}));
