import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getChapterVerses, getChapterAudio } from '../api/quranClient';

// ─── Constants (Stable) ───
export const THEMES = [
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

export const TEXT_STYLE_PRESETS = [
  { id: 'default-glow', name: 'Soft Glow', emoji: '✨', arabicColor: '#ffffff', englishColor: 'rgba(255,255,255,0.8)', highlightColor: '#34d399', textShadow: '0 0 20px rgba(255,255,255,0.3)', highlightGlow: '0 0 24px rgba(52, 211, 153, 0.5)', showBackdrop: true },
  { id: 'neon-accent', name: 'Neon Accent', emoji: '💜', arabicColor: '#e0e0ff', englishColor: 'rgba(224,224,255,0.75)', highlightColor: '#a78bfa', textShadow: '0 0 30px rgba(167, 139, 250, 0.4)', highlightGlow: '0 0 32px rgba(167, 139, 250, 0.7)', showBackdrop: true },
  { id: 'golden-classic', name: 'Golden Classic', emoji: '🌟', arabicColor: '#fde68a', englishColor: 'rgba(253, 230, 138, 0.7)', highlightColor: '#f59e0b', textShadow: '0 2px 10px rgba(0,0,0,0.6)', highlightGlow: '0 0 20px rgba(245, 158, 11, 0.5)', showBackdrop: true },
  { id: 'clean-white', name: 'Clean White', emoji: '⬜', arabicColor: '#ffffff', englishColor: '#ffffff', highlightColor: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.3)', highlightGlow: '0 0 25px rgba(255, 255, 255, 1.0), 0 0 45px rgba(255, 255, 255, 0.6)', showBackdrop: false },
  { id: 'ocean-blue', name: 'Ocean Blue', emoji: '🌊', arabicColor: '#bae6fd', englishColor: 'rgba(186,230,253,0.7)', highlightColor: '#38bdf8', textShadow: '0 0 16px rgba(56, 189, 248, 0.3)', highlightGlow: '0 0 24px rgba(56, 189, 248, 0.6)', showBackdrop: true },
  { id: 'ember-fire', name: 'Ember Fire', emoji: '🔥', arabicColor: '#fecaca', englishColor: 'rgba(254,202,202,0.7)', highlightColor: '#ef4444', textShadow: '0 0 20px rgba(239, 68, 68, 0.3)', highlightGlow: '0 0 28px rgba(239, 68, 68, 0.6)', showBackdrop: true },
  { id: 'minimal-none', name: 'No Effects', emoji: '📝', arabicColor: '#ffffff', englishColor: 'rgba(255,255,255,0.7)', highlightColor: '#34d399', textShadow: 'none', highlightGlow: 'none', showBackdrop: false },
  { id: 'desert-sand', name: 'Desert Sand', emoji: '🏜️', arabicColor: '#f5e6d3', englishColor: 'rgba(245,230,211,0.65)', highlightColor: '#d97706', textShadow: '0 3px 12px rgba(0,0,0,0.7)', highlightGlow: '0 0 20px rgba(217,119,6,0.45)', showBackdrop: true },
  { id: 'frosted-glass', name: 'Frosted Glass', emoji: '❄️', arabicColor: 'rgba(255,255,255,0.85)', englishColor: 'rgba(255,255,255,0.5)', highlightColor: '#67e8f9', textShadow: '0 0 40px rgba(103,232,249,0.15)', highlightGlow: '0 0 30px rgba(103,232,249,0.5)', showBackdrop: true },
  { id: 'neon-pink', name: 'Neon Pink', emoji: '💗', arabicColor: '#fce7f3', englishColor: 'rgba(252,231,243,0.6)', highlightColor: '#ec4899', textShadow: '0 0 24px rgba(236,72,153,0.3)', highlightGlow: '0 0 36px rgba(236,72,153,0.7), 0 0 72px rgba(236,72,153,0.3)', showBackdrop: false },
  { id: 'aurora', name: 'Aurora', emoji: '🌌', arabicColor: '#d1fae5', englishColor: 'rgba(209,250,229,0.6)', highlightColor: '#a78bfa', textShadow: '0 0 20px rgba(52,211,153,0.3), 0 0 40px rgba(167,139,250,0.15)', highlightGlow: '0 0 28px rgba(167,139,250,0.6), 0 0 56px rgba(52,211,153,0.2)', showBackdrop: true },
  { id: 'moonlit-ivory', name: 'Moonlit Ivory', emoji: '🌙', arabicColor: '#fffbeb', englishColor: 'rgba(255,251,235,0.6)', highlightColor: '#fde68a', textShadow: '0 1px 6px rgba(0,0,0,0.4)', highlightGlow: '0 0 16px rgba(253,230,138,0.4)', showBackdrop: false },
  { id: 'radio-retro', name: 'Radio Station', emoji: '📻', arabicColor: '#fbbf24', englishColor: 'rgba(251,191,36,0.6)', highlightColor: '#f97316', textShadow: '0 0 8px rgba(251,191,36,0.3)', highlightGlow: '0 0 20px rgba(249,115,22,0.5)', showBackdrop: true },
];

export const BACKGROUNDS = [
  { id: 'campfire', name: 'Campfire', type: 'video', url: '/assets/Stock Processed/campfire.mp4', thumbnail: '/assets/thumbnails/campfire.jpg', category: 'nature' },
  { id: 'mosque', name: 'Mosque', type: 'video', url: '/assets/Stock Processed/mosque.mp4', thumbnail: '/assets/thumbnails/mosque.jpg', category: 'indoor' },
  { id: 'rain-window', name: 'Rain on Window', type: 'video', url: '/assets/Stock Processed/rain-window.mp4', thumbnail: '/assets/thumbnails/rain-window.jpg', category: 'indoor' },
  { id: 'sunset-sea', name: 'Sunset Sea', type: 'video', url: '/assets/Stock Processed/sunset-sea.mp4', thumbnail: '/assets/thumbnails/sunset-sea.jpg', category: 'nature' },
  { id: 'sunset-waves', name: 'Sunset Waves', type: 'video', url: '/assets/Stock Processed/sunset-waves.mp4', thumbnail: '/assets/thumbnails/sunset-waves.jpg', category: 'nature' },
  { id: 'film-autumn-leaves', name: 'Autumn Leaves', type: 'video', url: '/assets/Stock Processed/film-autumn-leaves.mp4', thumbnail: '/assets/thumbnails/film-autumn-leaves.jpg', category: 'nature' },
  { id: 'grass-field-evening', name: 'Grass Field', type: 'video', url: '/assets/Stock Processed/grass-field-evening.mp4', thumbnail: '/assets/thumbnails/grass-field-evening.jpg', category: 'nature' },
  { id: 'lofi-sky-transition', name: 'Lofi Sky', type: 'video', url: '/assets/Stock Processed/lofi-sky-transition.mp4', thumbnail: '/assets/thumbnails/lofi-sky-transition.jpg', category: 'sky' },
  { id: 'river-flowing-forest', name: 'River Forest', type: 'video', url: '/assets/Stock Processed/river-flowing-forest.mp4', thumbnail: '/assets/thumbnails/river-flowing-forest.jpg', category: 'nature' },
  { id: 'telephone-booth-night', name: 'Phone Booth', type: 'video', url: '/assets/Stock Processed/telephone-booth-night.mp4', thumbnail: '/assets/thumbnails/telephone-booth-night.jpg', category: 'indoor' },
  { id: 'lofi-campfire', name: 'Lofi Campfire', type: 'video', url: '/assets/Stock Processed/lofi-campfire.mp4', thumbnail: '/assets/thumbnails/lofi-campfire.jpg', category: 'nature' },
  { id: 'thunderstorm-field', name: 'Thunderstorm', type: 'video', url: '/assets/Stock Processed/thunderstorm-field.mp4', thumbnail: '/assets/thumbnails/thunderstorm-field.jpg', category: 'nature' },
  { id: 'lofi-room', name: 'Lofi Room', type: 'gif', url: '/assets/gifs/1.gif', category: 'indoor' },
  { id: 'space', name: 'Space', type: 'gif', url: '/assets/gifs/2.gif', category: 'sky' },
  { id: 'aurora', name: 'Aurora', type: 'css', url: '', category: 'sky' },
  { id: 'sunset-glow', name: 'Sunset Glow', type: 'css', url: '', category: 'sky' },
  { id: 'ocean-deep', name: 'Ocean Deep', type: 'css', url: '', category: 'nature' },
  { id: 'starfield', name: 'Starfield', type: 'css', url: '', category: 'sky' },
  { id: 'desert-night', name: 'Desert Night', type: 'css', url: '', category: 'nature' },
  { id: 'ember', name: 'Ember Drift', type: 'css', url: '', category: 'nature' },
  { id: 'fireflies', name: 'Fireflies', type: 'canvas', url: '', category: 'nature' },
  { id: 'rain', name: 'Rain', type: 'canvas', url: '', category: 'nature' },
  { id: 'nebula', name: 'Nebula', type: 'canvas', url: '', category: 'sky' },
  { id: 'waves', name: 'Ocean Waves', type: 'canvas', url: '', category: 'nature' },
  { id: 'dark-minimal', name: 'Dark Minimal', type: 'minimal', url: '', category: 'minimal' },
];

export const AMBIENT_TRACKS = [
  { id: 'rain', name: 'Rain', icon: '🌧️', url: '/assets/ambient/RainSounds.m4a', category: 'nature' },
  { id: 'fire', name: 'Campfire', icon: '🔥', url: '/assets/ambient/campfire.m4a', category: 'nature' },
  { id: 'forest', name: 'Forest Birds', icon: '🌲', url: '/assets/ambient/forest-birds.m4a', category: 'nature' },
  { id: 'waves', name: 'Ocean Waves', icon: '🌊', url: '/assets/ambient/ocean-waves.m4a', category: 'nature' },
  { id: 'wind', name: 'Wind', icon: '💨', url: '/assets/ambient/wind.m4a', category: 'nature' },
  { id: 'thunder', name: 'Thunder', icon: '⛈️', url: '/assets/ambient/thunderstorm.m4a', category: 'nature' },
  { id: 'stream', name: 'Stream', icon: '🏞️', url: '/assets/ambient/stream.m4a', category: 'nature' },
  { id: 'crickets', name: 'Night Crickets', icon: '🦗', url: '/assets/ambient/crickets.m4a', category: 'nature' },
];

export const PRESETS = [
  { id: 'campfire', name: 'Campfire', emoji: '🔥', description: 'Crackling flames under the stars', ambientIds: ['fire'], ambientVolumes: { fire: 1.0 }, bgId: 'campfire', themeId: 'minimal-dark', textStyleId: 'clean-white' },
  { id: 'rainy-window', name: 'Rainy Window', emoji: '🌧️', description: 'Gentle rain on a quiet evening', ambientIds: ['rain'], ambientVolumes: { rain: 1.0 }, bgId: 'rain-window', themeId: 'minimal-dark', textStyleId: 'clean-white' },
  { id: 'forest-retreat', name: 'Forest Retreat', emoji: '🌲', description: 'Bird songs and flowing streams', ambientIds: ['forest'], ambientVolumes: { forest: 1.0 }, bgId: 'river-flowing-forest', themeId: 'minimal-dark', textStyleId: 'clean-white' },
  { id: 'ocean-calm', name: 'Ocean Calm', emoji: '🌊', description: 'Waves lapping on a peaceful shore', ambientIds: ['waves'], ambientVolumes: { waves: 1.0 }, bgId: 'sunset-sea', themeId: 'minimal-dark', textStyleId: 'clean-white' },
  { id: 'night-study', name: 'Night Study', emoji: '🌙', description: 'Starry skies and soft crickets', ambientIds: ['crickets'], ambientVolumes: { crickets: 1.0 }, bgId: 'lofi-sky-transition', themeId: 'minimal-dark', textStyleId: 'clean-white' },
  { id: 'cozy-cafe', name: 'Cozy Cafe', emoji: '☕', description: 'Warm ambiance of a quiet café', ambientIds: ['rain'], ambientVolumes: { rain: 1.0 }, bgId: 'telephone-booth-night', themeId: 'minimal-dark', textStyleId: 'clean-white' },
  { id: 'minimalist', name: 'Minimalist', emoji: '🕌', description: 'Pure recitation, no distractions', ambientIds: [], ambientVolumes: {}, bgId: 'dark-minimal', themeId: 'minimal-dark', textStyleId: 'clean-white' },
  { id: 'deep-focus', name: 'Deep Focus', emoji: '📖', description: 'Lofi room with gentle rain', ambientIds: ['rain'], ambientVolumes: { rain: 1.0 }, bgId: 'lofi-room', themeId: 'minimal-dark', textStyleId: 'clean-white' },
  { id: 'stormy-night', name: 'Stormy Night', emoji: '⛈️', description: 'Thunder and wind in the wild', ambientIds: ['thunder'], ambientVolumes: { thunder: 1.0 }, bgId: 'thunderstorm-field', themeId: 'minimal-dark', textStyleId: 'clean-white' },
  { id: 'river-meditation', name: 'River Meditation', emoji: '🏞️', description: 'Soft river sounds in the forest', ambientIds: ['stream'], ambientVolumes: { stream: 1.0 }, bgId: 'river-flowing-forest', themeId: 'minimal-dark', textStyleId: 'clean-white' }
];

// ─── Storage Helpers ───
const loadFromStorage = (k, f) => { try { const v = localStorage.getItem(`ql_${k}`); return v !== null ? JSON.parse(v) : f; } catch { return f; } };
const saveToStorage = (k, v) => { try { localStorage.setItem(`ql_${k}`, JSON.stringify(v)); } catch { } };

// ─── Slices ───

const createUISlice = (set, get) => ({
  sidebarOpen: false,
  setSidebarOpen: (val) => set({ sidebarOpen: val }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  activeSidebarPanel: 'presets',
  setActiveSidebarPanel: (panel) => set({ activeSidebarPanel: panel, sidebarOpen: true }),

  isStarted: false,
  setIsStarted: (val) => set({ isStarted: val }),

  zenMode: false,
  setZenMode: (val) => set({ zenMode: val }),
  toggleZenMode: () => set((s) => ({ zenMode: !s.zenMode })),

  performanceMode: loadFromStorage('performanceMode', false),
  setPerformanceMode: (val) => { saveToStorage('performanceMode', val); set({ performanceMode: val }); },

  showClock: loadFromStorage('showClock', true),
  setShowClock: (val) => { saveToStorage('showClock', val); set({ showClock: val }); },
  clockFormat: loadFromStorage('clockFormat', '12'),
  setClockFormat: (fmt) => { saveToStorage('clockFormat', fmt); set({ clockFormat: fmt }); },
  showDate: loadFromStorage('showDate', true),
  setShowDate: (val) => { saveToStorage('showDate', val); set({ showDate: val }); },
  showSeconds: loadFromStorage('showSeconds', false),
  setShowSeconds: (val) => { saveToStorage('showSeconds', val); set({ showSeconds: val }); },

  floatingPomodoro: loadFromStorage('floatingPomodoro', false),
  setFloatingPomodoro: (val) => { saveToStorage('floatingPomodoro', val); set({ floatingPomodoro: val }); },
  floatingTodo: loadFromStorage('floatingTodo', false),
  setFloatingTodo: (val) => { saveToStorage('floatingTodo', val); set({ floatingTodo: val }); },
  widgetStyle: loadFromStorage('widgetStyle', 'glass'),
  setWidgetStyle: (style) => { saveToStorage('widgetStyle', style); set({ widgetStyle: style }); },
  showShortcuts: loadFromStorage('showShortcuts', true),
  setShowShortcuts: (val) => { saveToStorage('showShortcuts', val); set({ showShortcuts: val }); },
  showBottomBar: true,
  setShowBottomBar: (val) => set({ showBottomBar: val }),
  
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
});

const createSettingsSlice = (set, get) => ({
  activeTheme: THEMES.find(t => t.id === loadFromStorage('themeId', 'minimal-dark')) || THEMES[0],
  setActiveTheme: (id) => {
    const theme = THEMES.find(t => t.id === id) || THEMES[0];
    saveToStorage('themeId', id);
    set({ activeTheme: theme });
  },

  activeBackground: BACKGROUNDS.find(b => b.id === loadFromStorage('bgId', 'campfire')) || BACKGROUNDS[0],
  setActiveBackground: (id) => {
    const bg = BACKGROUNDS.find(b => b.id === id) || BACKGROUNDS[0];
    saveToStorage('bgId', id);
    set({ activeBackground: bg });
  },

  activeTextStyle: TEXT_STYLE_PRESETS.find(t => t.id === loadFromStorage('textStyleId', 'clean-white')) || TEXT_STYLE_PRESETS[0],
  setActiveTextStyle: (id) => {
    const style = TEXT_STYLE_PRESETS.find(s => s.id === id) || TEXT_STYLE_PRESETS[0];
    saveToStorage('textStyleId', id);
    set({ activeTextStyle: style, customTextStyle: null });
    saveToStorage('customTextStyle', null);
  },
  customTextStyle: loadFromStorage('customTextStyle', null),
  setCustomTextStyle: (overrides) => {
    const current = get().customTextStyle || { ...get().activeTextStyle };
    const next = { ...current, ...overrides, id: 'custom' };
    saveToStorage('customTextStyle', next);
    set({ customTextStyle: next });
  },

  displayLanguages: loadFromStorage('displayLanguages', ['arabic', 'english']),
  toggleDisplayLanguage: (lang) => {
    const next = get().displayLanguages.includes(lang)
      ? get().displayLanguages.filter(l => l !== lang)
      : [...get().displayLanguages, lang];
    if (next.length > 0) { saveToStorage('displayLanguages', next); set({ displayLanguages: next }); }
  },

  highlightArabic: loadFromStorage('highlightArabic', true),
  setHighlightArabic: (val) => { saveToStorage('highlightArabic', val); set({ highlightArabic: val }); },
  highlightEnglish: loadFromStorage('highlightEnglish', false),
  setHighlightEnglish: (val) => { saveToStorage('highlightEnglish', val); set({ highlightEnglish: val }); },
  showTextBackdrop: loadFromStorage('showTextBackdrop', true),
  setShowTextBackdrop: (val) => { saveToStorage('showTextBackdrop', val); set({ showTextBackdrop: val }); },
  highlightWordBg: loadFromStorage('highlightWordBg', true),
  setHighlightWordBg: (val) => { saveToStorage('highlightWordBg', val); set({ highlightWordBg: val }); },
  fontSizeScale: loadFromStorage('fontSizeScale', 1.0),
  setFontSizeScale: (scale) => { saveToStorage('fontSizeScale', scale); set({ fontSizeScale: scale }); },
});

const createAudioSlice = (set, get) => ({
  isPlaying: loadFromStorage('isPlaying', true),
  setIsPlaying: (val) => { saveToStorage('isPlaying', val); set({ isPlaying: val }); },
  masterVolume: loadFromStorage('masterVolume', 0.5),
  setMasterVolume: (val) => { saveToStorage('masterVolume', val); set({ masterVolume: val }); },
  recitationVolume: loadFromStorage('recitationVolume', 1.0),
  setRecitationVolume: (val) => { saveToStorage('recitationVolume', val); set({ recitationVolume: val }); },

  activeAmbientTracks: loadFromStorage('activeAmbientTracks', { rain: 1.0 }),
  setAmbientTrackVolume: (trackId, volume) => {
    const next = volume <= 0 ? {} : { [trackId]: volume };
    saveToStorage('activeAmbientTracks', next);
    set({ activeAmbientTracks: next });
  },
  toggleAmbientTrack: (trackId) => {
    const current = get().activeAmbientTracks;
    const next = current[trackId] !== undefined ? {} : { [trackId]: 1.0 };
    saveToStorage('activeAmbientTracks', next);
    set({ activeAmbientTracks: next });
  },

  loopMode: loadFromStorage('loopMode', 'none'),
  setLoopMode: (mode) => { saveToStorage('loopMode', mode); set({ loopMode: mode }); },
  
  reciterId: loadFromStorage('reciterId', 'qcom:7'),
  setReciterId: (id) => {
    saveToStorage('reciterId', id);
    set({ reciterId: id });
    get().loadChapterData(get().currentChapterId, id);
  },

  _requestAudioDestroy: null,
});

const createContentSlice = (set, get) => ({
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

  setCurrentVerseIndex: (idx) => set({ currentVerseIndex: idx }),
  setActiveWordIds: (ids) => set({ activeWordIds: ids }),

  loadChapterData: async (chapterId, reciterIdArg) => {
    const cacheKey = `${chapterId}_${reciterIdArg}`;
    const { dataCache, _abortController, _requestAudioDestroy } = get();

    if (_abortController) _abortController.abort();
    if (_requestAudioDestroy) _requestAudioDestroy();

    saveToStorage('currentChapterId', chapterId);

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
      set({ isLoadingChapter: false, _abortController: null });
    }
  },

  setCurrentChapterId: (id) => {
    set({ currentChapterId: id, currentVerseIndex: 0, activeWordIds: [] });
    get().loadChapterData(id, get().reciterId);
  },

  advanceVerse: () => {
    const { currentVerseIndex, audioFiles, currentChapterId, loopMode, reciters, reciterId } = get();
    if (loopMode === 'verse') return;
    if (currentVerseIndex < audioFiles.length - 1) {
      set({ currentVerseIndex: currentVerseIndex + 1 });
    } else if (loopMode === 'surah') {
      set({ currentVerseIndex: 0 });
    } else {
      if (currentChapterId < 114) {
        get().setCurrentChapterId(currentChapterId + 1);
      } else {
        get().setCurrentChapterId(1);
      }
    }
  },
  
  skipNext: () => {
    const { chapters, currentChapterId, loopMode } = get();
    if (loopMode === 'surah') { set({ currentVerseIndex: 0 }); return; }
    const nextId = currentChapterId < 114 ? currentChapterId + 1 : 1;
    get().setCurrentChapterId(nextId);
  },

  skipPrev: () => {
    const { currentChapterId } = get();
    const prevId = currentChapterId > 1 ? currentChapterId - 1 : 114;
    get().setCurrentChapterId(prevId);
  },
});

// ─── Unified Store ───
export const usePlayerStore = create(subscribeWithSelector((set, get) => ({
  ...createUISlice(set, get),
  ...createSettingsSlice(set, get),
  ...createAudioSlice(set, get),
  ...createContentSlice(set, get),

  applyPreset: (preset) => {
    const theme = THEMES.find(t => t.id === preset.themeId) || THEMES[0];
    const bg = BACKGROUNDS.find(b => b.id === preset.bgId) || BACKGROUNDS[0];
    const textStyle = TEXT_STYLE_PRESETS.find(s => s.id === preset.textStyleId) || TEXT_STYLE_PRESETS[0];
    
    const rId = preset.reciterId || get().reciterId;
    const currentReciterId = get().reciterId;

    saveToStorage('themeId', preset.themeId);
    saveToStorage('bgId', preset.bgId);
    saveToStorage('reciterId', rId);
    saveToStorage('activeAmbientTracks', preset.ambientVolumes || {});
    saveToStorage('textStyleId', preset.textStyleId || 'default-glow');
    
    set({
      activeTheme: theme,
      activeBackground: bg,
      reciterId: rId,
      activeAmbientTracks: preset.ambientVolumes || {},
      activeTextStyle: textStyle,
      customTextStyle: null,
    });
    if (rId !== currentReciterId) {
      get().loadChapterData(get().currentChapterId, rId);
    }
  },
})));
