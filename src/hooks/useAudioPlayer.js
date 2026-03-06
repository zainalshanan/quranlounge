import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { usePlayerStore, AMBIENT_TRACKS } from '../store/usePlayerStore';

/**
 * Enhanced Audio Hook — Throttled & Optimized v3
 * 
 * Performance improvements:
 * - Replaced 60fps requestAnimationFrame with a throttled 50ms interval for word syncing.
 * - Optimized state checks to prevent unnecessary store updates.
 * - Better lifecycle management for Howler instances.
 */

const SYNC_INTERVAL_MS = 50; 
const SYNC_OFFSET_MS = 100;

export function useAudioPlayer() {
  const recitationHowlRef = useRef(null);
  const ambientHowlsRef = useRef({});
  const syncIntervalRef = useRef(null);
  const sleepTimerRef = useRef(null);
  const isPlayingRef = useRef(false);
  const currentVerseIndexRef = useRef(0);
  const generationRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);

  // Selector-based subscription (slices)
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const audioFiles = usePlayerStore(s => s.audioFiles);
  const currentVerseIndex = usePlayerStore(s => s.currentVerseIndex);
  const masterVolume = usePlayerStore(s => s.masterVolume);
  const recitationVolume = usePlayerStore(s => s.recitationVolume);
  const activeAmbientTracks = usePlayerStore(s => s.activeAmbientTracks);
  const sleepTimerEnd = usePlayerStore(s => s.sleepTimerEnd);
  const isLoadingChapter = usePlayerStore(s => s.isLoadingChapter);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentVerseIndexRef.current = currentVerseIndex; }, [currentVerseIndex]);

  const destroyRecitation = useCallback(() => {
    if (recitationHowlRef.current) {
      try {
        recitationHowlRef.current.off();
        recitationHowlRef.current.stop();
        recitationHowlRef.current.unload();
      } catch { }
      recitationHowlRef.current = null;
    }
  }, []);

  useEffect(() => {
    usePlayerStore.setState({ _requestAudioDestroy: destroyRecitation });
    return () => { usePlayerStore.setState({ _requestAudioDestroy: null }); };
  }, [destroyRecitation]);

  // --- 1. Ambient Audio ---
  useEffect(() => {
    const currentIds = Object.keys(activeAmbientTracks);
    const ambientRefs = ambientHowlsRef.current;

    Object.keys(ambientRefs).forEach(id => {
      if (!currentIds.includes(id)) {
        ambientRefs[id].stop();
        ambientRefs[id].unload();
        delete ambientRefs[id];
      }
    });

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
          onloaderror: () => { howl.unload(); delete ambientRefs[trackId]; },
        });
        ambientRefs[trackId] = howl;
        howl.play();
      }
    });
  }, [activeAmbientTracks, masterVolume]);

  useEffect(() => {
    return () => {
      Object.values(ambientHowlsRef.current).forEach(h => { h.stop(); h.unload(); });
      ambientHowlsRef.current = {};
    };
  }, []);

  // --- 2. Recitation Audio ---
  useEffect(() => {
    const currentAudioFile = audioFiles[currentVerseIndex];
    if (!currentAudioFile?.url) return;

    let rawUrl = currentAudioFile.url.trim();
    let finalUrl = rawUrl;
    if (rawUrl.startsWith('//')) {
      finalUrl = `/audio-proxy/${rawUrl.substring(2)}`;
    } else if (!rawUrl.startsWith('http')) {
      const cleanPath = rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl;
      finalUrl = `/audio-proxy/${cleanPath}`;
    }

    const currentHowl = recitationHowlRef.current;
    if (currentHowl && currentHowl._src.includes(finalUrl)) {
      if (isTransitioningRef.current) {
        isTransitioningRef.current = false;
        return;
      }
      const startTime = currentAudioFile.startTimeMs ? (currentAudioFile.startTimeMs / 1000) : 0;
      if (currentHowl.state() === 'loaded') {
        currentHowl.seek(startTime);
        usePlayerStore.getState().setActiveWordIds([]);
        if (isPlayingRef.current && !currentHowl.playing()) currentHowl.play();
      }
      return;
    }

    const thisGeneration = ++generationRef.current;
    destroyRecitation();

    function createHowl(url, isRetry = false) {
      const { masterVolume: mv, recitationVolume: rv } = usePlayerStore.getState();
      const startTime = currentAudioFile.startTimeMs ? (currentAudioFile.startTimeMs / 1000) : 0;
      
      const howl = new Howl({
        src: [url],
        volume: mv * rv,
        onload: () => {
          if (generationRef.current !== thisGeneration) { howl.unload(); return; }
          consecutiveErrorsRef.current = 0;
          if (startTime > 0) howl.seek(startTime);
          const { isLoadingChapter: stillLoading } = usePlayerStore.getState();
          if (isPlayingRef.current && recitationHowlRef.current === howl && !stillLoading) howl.play();
        },
        onloaderror: (_id, err) => {
          if (generationRef.current !== thisGeneration) return;
          if (!isRetry) {
            destroyRecitation();
            const retryUrl = url + (url.includes('?') ? '&' : '?') + `_cb=${Date.now()}`;
            recitationHowlRef.current = createHowl(retryUrl, true);
          } else {
            consecutiveErrorsRef.current++;
            if (consecutiveErrorsRef.current >= 3) {
              usePlayerStore.getState().handleAudioError();
              consecutiveErrorsRef.current = 0;
              return;
            }
            usePlayerStore.getState().advanceVerse();
          }
        },
        onend: () => {
          if (generationRef.current !== thisGeneration) return;
          const state = usePlayerStore.getState();
          if (state.loopMode === 'verse') howl.play();
          else state.advanceVerse();
        },
      });
      return howl;
    }

    recitationHowlRef.current = createHowl(finalUrl);
    return () => destroyRecitation();
  }, [currentVerseIndex, audioFiles, destroyRecitation]);

  useEffect(() => {
    const howl = recitationHowlRef.current;
    if (!howl) return;
    if (isPlaying) {
      if (howl.state() === 'loaded' && !howl.playing()) howl.play();
    } else {
      if (howl.playing()) howl.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (recitationHowlRef.current) {
      recitationHowlRef.current.volume(masterVolume * recitationVolume);
    }
  }, [masterVolume, recitationVolume]);

  // --- 3. Optimized Sync Loop (Interval-based) ---
  useEffect(() => {
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);

    syncIntervalRef.current = setInterval(() => {
      const state = usePlayerStore.getState();
      const howl = recitationHowlRef.current;
      
      if (isPlayingRef.current && howl && howl.playing()) {
        const seek = howl.seek();
        if (typeof seek === 'number') {
          const currentTimeMs = seek * 1000;
          const activeAudioFile = state.audioFiles[currentVerseIndexRef.current];
          
          if (activeAudioFile?.segments) {
            const segments = activeAudioFile.segments;
            let foundSeg = segments.find((s, idx) => {
              const isLast = idx === segments.length - 1;
              const hasStarted = currentTimeMs >= s[2];
              const hasNotEnded = isLast ? true : (currentTimeMs <= s[3] + SYNC_OFFSET_MS);
              return hasStarted && hasNotEnded;
            });

            if (foundSeg) {
              const currentVerse = state.verses[currentVerseIndexRef.current];
              const targetWord = currentVerse?.words?.[foundSeg[0]];
              
              if (targetWord) {
                // Efficiency: Only update store if the word actually changed
                if (state.activeWordIds[0] !== targetWord.id) {
                  usePlayerStore.setState({ activeWordIds: [targetWord.id] });
                }
              }
            } else if (state.activeWordIds.length > 0) {
              usePlayerStore.setState({ activeWordIds: [] });
            }
          }
        }
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, []);

  // --- 4. Sleep Timer ---
  useEffect(() => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    if (sleepTimerEnd && isPlaying) {
      sleepTimerRef.current = setInterval(() => {
        if (Date.now() >= sleepTimerEnd) {
          usePlayerStore.getState().setIsPlaying(false);
          usePlayerStore.getState().clearSleepTimer();
        }
      }, 1000);
    }
    return () => { if (sleepTimerRef.current) clearInterval(sleepTimerRef.current); };
  }, [sleepTimerEnd, isPlaying]);
}
