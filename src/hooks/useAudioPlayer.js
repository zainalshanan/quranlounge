import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { usePlayerStore, AMBIENT_TRACKS } from '../store/usePlayerStore';

/**
 * Enhanced Audio Hook — Throttled, Optimized & Lazy v4
 */

const SYNC_INTERVAL_MS = 50; 
const SYNC_OFFSET_MS = 100;

export function useAudioPlayer(isStarted) {
  const recitationHowlRef = useRef(null);
  const ambientHowlsRef = useRef({});
  const syncIntervalRef = useRef(null);
  const isPlayingRef = useRef(false);
  const currentVerseIndexRef = useRef(0);
  const generationRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);

  // Selector-based subscription
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const audioFiles = usePlayerStore(s => s.audioFiles);
  const currentVerseIndex = usePlayerStore(s => s.currentVerseIndex);
  const masterVolume = usePlayerStore(s => s.masterVolume);
  const recitationVolume = usePlayerStore(s => s.recitationVolume);
  const activeAmbientTracks = usePlayerStore(s => s.activeAmbientTracks);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentVerseIndexRef.current = currentVerseIndex; }, [currentVerseIndex]);

  // Helper: destroy all audio
  const destroyAll = useCallback(() => {
    if (recitationHowlRef.current) {
      recitationHowlRef.current.unload();
      recitationHowlRef.current = null;
    }
    Object.values(ambientHowlsRef.current).forEach(h => h.unload());
    ambientHowlsRef.current = {};
  }, []);

  const destroyRecitation = useCallback(() => {
    if (recitationHowlRef.current) {
      try {
        recitationHowlRef.current.off();
        recitationHowlRef.current.stop();
        recitationHowlRef.current.unload();
      } catch { /* howl may already be destroyed */ }
      recitationHowlRef.current = null;
    }
  }, []);

  useEffect(() => {
    usePlayerStore.setState({ _requestAudioDestroy: destroyRecitation });
    return () => { usePlayerStore.setState({ _requestAudioDestroy: null }); };
  }, [destroyRecitation]);

  // --- 1. Ambient Audio (Only if started) ---
  useEffect(() => {
    if (!isStarted) return;

    const currentIds = Object.keys(activeAmbientTracks);
    const ambientRefs = ambientHowlsRef.current;

    Object.keys(ambientRefs).forEach(id => {
      if (!currentIds.includes(id)) {
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
          html5: true, // Keep HTML5 for long ambient tracks to save memory
          onloaderror: () => { howl.unload(); delete ambientRefs[trackId]; },
        });
        ambientRefs[trackId] = howl;
        howl.play();
      }
    });
  }, [activeAmbientTracks, masterVolume, isStarted]);

  // --- 2. Recitation Audio (Only if started) ---
  useEffect(() => {
    if (!isStarted) return;

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
        html5: false, // Use Web Audio for recitation to ensure better syncing and pool management
        onload: () => {
          if (generationRef.current !== thisGeneration) { howl.unload(); return; }
          consecutiveErrorsRef.current = 0;
          if (startTime > 0) howl.seek(startTime);
          const { isLoadingChapter: stillLoading } = usePlayerStore.getState();
          if (isPlayingRef.current && recitationHowlRef.current === howl && !stillLoading) howl.play();
        },
        onloaderror: () => {
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
  }, [currentVerseIndex, audioFiles, destroyRecitation, isStarted]);

  // Sync play/pause
  useEffect(() => {
    if (!isStarted) return;
    const howl = recitationHowlRef.current;
    if (!howl) return;
    if (isPlaying) {
      if (howl.state() === 'loaded' && !howl.playing()) howl.play();
    } else {
      if (howl.playing()) howl.pause();
    }
  }, [isPlaying, isStarted]);

  // Handle global volume
  useEffect(() => {
    if (recitationHowlRef.current) {
      recitationHowlRef.current.volume(masterVolume * recitationVolume);
    }
  }, [masterVolume, recitationVolume]);

  // --- 3. Sync Loop ---
  useEffect(() => {
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);

    syncIntervalRef.current = setInterval(() => {
      if (!isStarted) return;
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
              if (targetWord && state.activeWordIds[0] !== targetWord.id) {
                usePlayerStore.setState({ activeWordIds: [targetWord.id] });
              }
            } else if (state.activeWordIds.length > 0) {
              usePlayerStore.setState({ activeWordIds: [] });
            }
          }
        }
      }
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(syncIntervalRef.current);
  }, [isStarted]);

  // --- 4. Cleanup & Global State ---
  useEffect(() => {
    return () => destroyAll();
  }, [destroyAll]);
}
