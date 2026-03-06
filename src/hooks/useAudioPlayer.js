import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { usePlayerStore, AMBIENT_TRACKS } from '../store/usePlayerStore';

/**
 * Enhanced Audio Hook — Performance-Optimised v2
 *
 * Key improvements:
 * - Registers destroyRecitation in store so surah/reciter changes kill audio instantly
 * - Generation counter prevents stale Howls from playing after rapid switching
 * - onloaderror retry with cache-bust for expired audio URLs
 * - Decoupled isPlaying from Howl creation (no rebuild on play/pause)
 */
// Industry Standard: Slight negative offset (ms) to account for human perception 
// and ensure highlighting doesn't "lead" the audio.
const SYNC_OFFSET_MS = 100;

export function useAudioPlayer() {
  const recitationHowlRef = useRef(null);
  const ambientHowlsRef = useRef({});
  const animationFrameRef = useRef(null);
  const sleepTimerRef = useRef(null);
  const isPlayingRef = useRef(false);
  const currentVerseIndexRef = useRef(0);
  const generationRef = useRef(0); // tracks which load generation is current
  const isTransitioningRef = useRef(false); // Flag for loop-driven transitions
  const consecutiveErrorsRef = useRef(0); // Track sequential failures to stop "rapid fire"

  // Subscribe to individual state slices to avoid unnecessary rerenders
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const audioFiles = usePlayerStore(s => s.audioFiles);
  const currentVerseIndex = usePlayerStore(s => s.currentVerseIndex);
  const masterVolume = usePlayerStore(s => s.masterVolume);
  const recitationVolume = usePlayerStore(s => s.recitationVolume);
  const activeAmbientTracks = usePlayerStore(s => s.activeAmbientTracks);
  const sleepTimerEnd = usePlayerStore(s => s.sleepTimerEnd);
  const isLoadingChapter = usePlayerStore(s => s.isLoadingChapter);

  // Keep refs updated for high-performance loop access
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentVerseIndexRef.current = currentVerseIndex; }, [currentVerseIndex]);

  // Helper: destroy howl immediately
  const destroyRecitation = useCallback(() => {
    if (recitationHowlRef.current) {
      try {
        recitationHowlRef.current.off(); // remove all event listeners
        recitationHowlRef.current.stop();
        recitationHowlRef.current.unload();
      } catch { /* ignore */ }
      recitationHowlRef.current = null;
    }
  }, []);

  // Register destroyRecitation in the store so loadChapterData can call it synchronously
  useEffect(() => {
    usePlayerStore.setState({ _requestAudioDestroy: destroyRecitation });
    return () => {
      usePlayerStore.setState({ _requestAudioDestroy: null });
    };
  }, [destroyRecitation]);

  // --- 1. Ambient Audio Management ---
  useEffect(() => {
    const currentIds = Object.keys(activeAmbientTracks);
    const existingIds = Object.keys(ambientHowlsRef.current);
    const ambientRefs = ambientHowlsRef.current;

    // Remove tracks no longer active
    existingIds.forEach(id => {
      if (!currentIds.includes(id)) {
        const howl = ambientRefs[id];
        if (howl) { howl.stop(); howl.unload(); }
        delete ambientRefs[id];
      }
    });

    // Add or update
    currentIds.forEach(trackId => {
      const trackDef = AMBIENT_TRACKS.find(t => t.id === trackId);
      if (!trackDef?.url) return;
      const vol = (activeAmbientTracks[trackId] || 0) * masterVolume;

      if (ambientRefs[trackId]) {
        ambientRefs[trackId].volume(vol);
      } else {
        const howl = new Howl({
          src: [trackDef.url],
          loop: true,
          volume: vol,
          html5: true,
          onloaderror: () => {
            // Release the pool slot immediately on failure — don't let 404s exhaust the HTML5 pool
            howl.unload();
            delete ambientRefs[trackId];
          },
        });
        ambientRefs[trackId] = howl;
        howl.play();
      }
    });
    // No cleanup return here — track removal is handled above in the effect body.
    // Destroying all Howls on every deps change would re-create them and leak pool slots
    // for any tracks with failing URLs. Unmount cleanup is handled in the effect below.
  }, [activeAmbientTracks, masterVolume]);

  // Destroy all ambient Howls only on unmount
  useEffect(() => {
    return () => {
      Object.values(ambientHowlsRef.current).forEach(h => { h.stop(); h.unload(); });
      ambientHowlsRef.current = {};
    };
  }, []);

  // Ambient always plays when a track is active (independent of recitation)
  // No sync with isPlaying — ambient runs on its own.

  // --- 2. Recitation Audio (verse-by-verse) ---
  useEffect(() => {
    const currentAudioFile = audioFiles[currentVerseIndex];
    if (!currentAudioFile?.url) return;

    let rawUrl = currentAudioFile.url.trim();
    let finalUrl = rawUrl;

    // Industry Standard: If it's a full URL (starting with http), try it directly first.
    // This is most reliable for external mirrors like download.quranicaudio.com (QUL).
    // If it's relative or protocol-relative (//), route through our proxy.
    if (rawUrl.startsWith('//')) {
      finalUrl = `/audio-proxy/${rawUrl.substring(2)}`;
    } else if (!rawUrl.startsWith('http')) {
      const cleanPath = rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl;
      finalUrl = `/audio-proxy/${cleanPath}`;
    }
    // Note: absolute http(s) URLs are passed through as-is to Howler. 
    // If CORS becomes an issue in prod, we can add them to the proxy whitelist.

    // Optimization: If the Howl already exists and has the same source, just seek.
    // This is CRITICAL for surah-level files (QUL) to prevent stutter/reloads.
    const currentHowl = recitationHowlRef.current;
    if (currentHowl && currentHowl._src.includes(finalUrl)) {
      // IF the loop drove this transition, don't seek again (prevent stutter)
      if (isTransitioningRef.current) {
        isTransitioningRef.current = false;
        return;
      }
      
      const startTime = currentAudioFile.startTimeMs ? (currentAudioFile.startTimeMs / 1000) : 0;
      if (currentHowl.state() === 'loaded') {
        currentHowl.seek(startTime);
        usePlayerStore.getState().setActiveWordIds([]); // Clear highlight on jump
        if (isPlayingRef.current && !currentHowl.playing()) {
          currentHowl.play();
        }
      }
      return;
    }

    // Increment generation — any Howl from a previous generation is stale
    const thisGeneration = ++generationRef.current;

    // Destroy previous immediately
    destroyRecitation();

    function createHowl(url, isRetry = false) {
      const { masterVolume: mv, recitationVolume: rv } = usePlayerStore.getState();
      const startTime = currentAudioFile.startTimeMs ? (currentAudioFile.startTimeMs / 1000) : 0;
      
      const howl = new Howl({
        src: [url],
        volume: mv * rv,
        onload: () => {
          // Only auto-play if this generation is still current and we're in playing state
          if (generationRef.current !== thisGeneration) {
            howl.off();
            howl.unload();
            return;
          }
          
          // SUCCESS: Reset error counter
          consecutiveErrorsRef.current = 0;

          if (startTime > 0) {
            howl.seek(startTime);
          }

          // Only auto-play if verses have finished loading
          const { isLoadingChapter: stillLoading } = usePlayerStore.getState();
          if (isPlayingRef.current && recitationHowlRef.current === howl && !stillLoading) {
            howl.play();
          }
        },
        onloaderror: (_id, err) => {
          console.warn(`[Audio] Load error${isRetry ? ' (retry)' : ''}:`, err);
          if (generationRef.current !== thisGeneration) return;

          if (!isRetry) {
            // Retry once with cache-bust — handles expired CDN URLs
            console.log('[Audio] Retrying with cache-bust...');
            destroyRecitation();
            const retryUrl = url + (url.includes('?') ? '&' : '?') + `_cb=${Date.now()}`;
            const retryHowl = createHowl(retryUrl, true);
            recitationHowlRef.current = retryHowl;
          } else {
            // Both attempts failed — handle sequential error limiting
            consecutiveErrorsRef.current++;
            
            if (consecutiveErrorsRef.current >= 3) {
              console.error('[Audio] Multiple consecutive 404s detected. Skipping surah.');
              usePlayerStore.getState().handleAudioError();
              consecutiveErrorsRef.current = 0; // Reset after handling
              return;
            }

            // Skip to next verse gracefully
            console.warn('[Audio] Both attempts failed, advancing verse');
            const state = usePlayerStore.getState();
            if (state.currentVerseIndex < state.audioFiles.length - 1) {
              state.advanceVerse();
            }
          }
        },
        onend: () => {
          if (generationRef.current !== thisGeneration) return;
          const state = usePlayerStore.getState();
          
          if (state.loopMode === 'verse') {
            howl.play();
          } else {
            state.advanceVerse();
          }
        },
      });
      return howl;
    }

    const howl = createHowl(finalUrl);
    recitationHowlRef.current = howl;

    return () => destroyRecitation();
  }, [currentVerseIndex, audioFiles, destroyRecitation]);

  // Sync play/pause state without recreating Howl
  useEffect(() => {
    const howl = recitationHowlRef.current;
    if (!howl) return;

    if (isPlaying) {
      if (howl.state() === 'loaded' && !howl.playing()) {
        howl.play();
      }
    } else {
      if (howl.playing()) {
        howl.pause();
      }
    }
  }, [isPlaying]);

  // Resume playback when chapter data finishes loading (audio may have loaded first)
  useEffect(() => {
    if (!isLoadingChapter && isPlaying) {
      const howl = recitationHowlRef.current;
      if (howl && howl.state() === 'loaded' && !howl.playing()) {
        howl.play();
      }
    }
  }, [isLoadingChapter, isPlaying]);

  // Sync recitation volume
  useEffect(() => {
    if (recitationHowlRef.current) {
      recitationHowlRef.current.volume(masterVolume * recitationVolume);
    }
  }, [masterVolume, recitationVolume]);

  // --- 3. High-Performance Sync Loop (requestAnimationFrame) ---
  useEffect(() => {
    const loop = () => {
      const state = usePlayerStore.getState();
      const howl = recitationHowlRef.current;
      
      if (isPlayingRef.current && howl && howl.playing()) {
        const seek = howl.seek();
        if (typeof seek === 'number') {
          const currentTimeMs = seek * 1000;

          // 2. Word Highlighting logic
          const activeAudioFile = state.audioFiles[currentVerseIndexRef.current];
          if (activeAudioFile?.segments) {
            const segments = activeAudioFile.segments;
            
            // Industry Standard: Light up the word exactly when it starts (no delay).
            // Use SYNC_OFFSET_MS only to extend the "end" of the highlight, 
            // making it feel smoother and preventing early clearing.
            let seg = segments.find((s, idx) => {
              const isLast = idx === segments.length - 1;
              const hasStarted = currentTimeMs >= s[2];
              const hasNotEnded = isLast ? true : (currentTimeMs <= s[3] + SYNC_OFFSET_MS);
              return hasStarted && hasNotEnded;
            });

            if (seg) {
              const currentVerse = state.verses[currentVerseIndexRef.current];
              if (!currentVerse?.words) return;

              // Word-level highlight (Quran.com)
              // seg[0] is the 0-based word index
              const wordIndex = seg[0]; 
              const targetWord = currentVerse.words[wordIndex];
              
              if (targetWord) {
                const ids = [targetWord.id];
                // Only update if IDs changed (performance)
                if (JSON.stringify(ids) !== JSON.stringify(state.activeWordIds)) {
                  usePlayerStore.setState({ activeWordIds: ids });
                }
              }
            } else if (state.activeWordIds.length > 0) {
              usePlayerStore.setState({ activeWordIds: [] });
            }
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []); // Run once, reads state from refs/getState

  // --- 4. Sleep Timer ---
  useEffect(() => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);

    if (sleepTimerEnd && isPlaying) {
      sleepTimerRef.current = setInterval(() => {
        if (Date.now() >= sleepTimerEnd) {
          usePlayerStore.getState().setIsPlaying(false);
          usePlayerStore.getState().clearSleepTimer();
          clearInterval(sleepTimerRef.current);
        }
      }, 1000);
    }

    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [sleepTimerEnd, isPlaying]);
}
