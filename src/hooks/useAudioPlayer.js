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
export function useAudioPlayer() {
  const recitationHowlRef = useRef(null);
  const ambientHowlsRef = useRef({});
  const animationFrameRef = useRef(null);
  const sleepTimerRef = useRef(null);
  const isPlayingRef = useRef(false);
  const generationRef = useRef(0); // tracks which load generation is current

  // Subscribe to individual state slices to avoid unnecessary rerenders
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const audioFiles = usePlayerStore(s => s.audioFiles);
  const currentVerseIndex = usePlayerStore(s => s.currentVerseIndex);
  const masterVolume = usePlayerStore(s => s.masterVolume);
  const recitationVolume = usePlayerStore(s => s.recitationVolume);
  const activeAmbientTracks = usePlayerStore(s => s.activeAmbientTracks);
  const sleepTimerEnd = usePlayerStore(s => s.sleepTimerEnd);

  // Keep isPlaying in a ref for stable access in callbacks
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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
        });
        ambientRefs[trackId] = howl;
        if (isPlayingRef.current) howl.play();
      }
    });

    return () => {
      Object.values(ambientRefs).forEach(h => { h.stop(); h.unload(); });
      ambientHowlsRef.current = {};
    };
  }, [activeAmbientTracks, masterVolume]);

  // Sync ambient play/pause
  useEffect(() => {
    Object.values(ambientHowlsRef.current).forEach(howl => {
      if (isPlaying) {
        if (!howl.playing()) howl.play();
      } else {
        howl.pause();
      }
    });
  }, [isPlaying]);

  // --- 2. Recitation Audio (verse-by-verse) ---
  useEffect(() => {
    const currentAudioFile = audioFiles[currentVerseIndex];
    if (!currentAudioFile?.url) return;

    // Increment generation — any Howl from a previous generation is stale
    const thisGeneration = ++generationRef.current;

    // Destroy previous immediately
    destroyRecitation();

    let rawUrl = currentAudioFile.url.trim();
    let finalUrl = rawUrl;

    if (!rawUrl.startsWith('http') && !rawUrl.startsWith('//')) {
      const cleanPath = rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl;
      finalUrl = `/audio-proxy/${cleanPath}`;
    } else if (rawUrl.startsWith('//')) {
      finalUrl = `/audio-proxy/${rawUrl.substring(2)}`;
    }

    function createHowl(url, isRetry = false) {
      const { masterVolume: mv, recitationVolume: rv } = usePlayerStore.getState();
      const howl = new Howl({
        src: [url],
        volume: mv * rv,
        html5: false,
        onload: () => {
          // Only auto-play if this generation is still current and we're in playing state
          if (generationRef.current !== thisGeneration) {
            howl.off();
            howl.unload();
            return;
          }
          if (isPlayingRef.current && recitationHowlRef.current === howl) {
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
            // Both attempts failed — skip to next verse gracefully
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

  // Sync recitation volume
  useEffect(() => {
    if (recitationHowlRef.current) {
      recitationHowlRef.current.volume(masterVolume * recitationVolume);
    }
  }, [masterVolume, recitationVolume]);

  // --- 3. Text Highlighting (requestAnimationFrame) ---
  useEffect(() => {
    const setActiveWordIds = usePlayerStore.getState().setActiveWordIds;

    const loop = () => {
      const howl = recitationHowlRef.current;
      if (isPlayingRef.current && howl && howl.playing()) {
        const seek = howl.seek();
        if (typeof seek === 'number') {
          const currentTimeMs = seek * 1000;
          const state = usePlayerStore.getState();
          const currentAudioFile = state.audioFiles[state.currentVerseIndex];

          if (currentAudioFile?.segments) {
            const seg = currentAudioFile.segments.find(
              s => currentTimeMs >= s[2] && currentTimeMs <= s[3]
            );

            if (seg) {
              const posFrom = seg[0] + 1;
              const posTo = seg[1] + 1;
              const currentVerse = state.verses[state.currentVerseIndex];

              if (currentVerse?.words) {
                const ids = currentVerse.words
                  .filter(w => w.position >= posFrom && w.position <= posTo)
                  .map(w => w.id);
                setActiveWordIds(ids);
              }
            } else {
              setActiveWordIds([]);
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
