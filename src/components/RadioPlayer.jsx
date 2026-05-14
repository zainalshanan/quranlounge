import { useEffect, useRef, useState } from 'react';
import { X, SkipForward } from 'lucide-react';
import usePlayerStore from '../store/usePlayerStore';
import './RadioPlayer.css';

async function fetchRandomClip(excludeId = null) {
  const url = excludeId != null
    ? `/api/radio/random?exclude=${excludeId}`
    : '/api/radio/random';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(res.status === 404 ? 'No clips available yet — upload some videos first.' : 'Failed to load clip');
  }
  return res.json();
}

export default function RadioPlayer({ onExit }) {
  const videoARef = useRef(null);
  const videoBRef = useRef(null);

  // Mutable state accessed inside setTimeout/event handlers without stale closures
  const activeSlotRef = useRef('a');
  const slotsRef = useRef({ a: null, b: null });
  const isBlinkingRef = useRef(false);
  const advanceFnRef = useRef(null);

  // Render state
  const [activeSlot, setActiveSlot] = useState('a');
  const [currentClip, setCurrentClip] = useState(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function getVideoEl(slot) {
    return slot === 'a' ? videoARef.current : videoBRef.current;
  }

  function loadClipIntoSlot(slot, clip) {
    slotsRef.current[slot] = clip;
    const el = getVideoEl(slot);
    if (el && clip) {
      el.src = `/assets/radio/${clip.r2_key}`;
      el.load();
    }
  }

  function advance() {
    if (isBlinkingRef.current) return;

    const currentSlot = activeSlotRef.current;
    const nextSlot = currentSlot === 'a' ? 'b' : 'a';
    const nextClip = slotsRef.current[nextSlot];

    if (!nextClip) return; // preload not ready yet

    isBlinkingRef.current = true;
    setIsBlinking(true);

    // At 350ms — screen is fully black — swap
    setTimeout(() => {
      const prevEl = getVideoEl(currentSlot);
      const nextEl = getVideoEl(nextSlot);
      if (prevEl) { prevEl.muted = true; prevEl.pause(); }
      if (nextEl) { nextEl.muted = false; nextEl.currentTime = 0; nextEl.play().catch(() => {}); }

      activeSlotRef.current = nextSlot;
      slotsRef.current[currentSlot] = null;
      setActiveSlot(nextSlot);
      setCurrentClip(nextClip);
      setShowInfo(true);

      // Preload the next-next clip into the now-idle slot
      fetchRandomClip(nextClip.id)
        .then(clip => loadClipIntoSlot(currentSlot, clip))
        .catch(() => {});
    }, 350);

    // At 700ms — blink done
    setTimeout(() => {
      setIsBlinking(false);
      isBlinkingRef.current = false;
    }, 700);
  }

  // Keep advanceFnRef current so the event listener never goes stale
  advanceFnRef.current = advance;

  // Mount: pause main recitation so both don't play at once
  useEffect(() => {
    usePlayerStore.getState().setIsPlaying(false);
  }, []);

  // Mount: attach ended listeners once, fetch first two clips
  useEffect(() => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    const handleEnded = () => advanceFnRef.current();
    videoA.addEventListener('ended', handleEnded);
    videoB.addEventListener('ended', handleEnded);

    let cancelled = false;

    async function init() {
      try {
        const first = await fetchRandomClip();
        if (cancelled) return;

        loadClipIntoSlot('a', first);
        setCurrentClip(first);
        setLoading(false);
        setShowInfo(true);
        videoA.muted = false;
        videoB.muted = true;
        videoA.play().catch(() => {});

        const second = await fetchRandomClip(first.id);
        if (!cancelled) loadClipIntoSlot('b', second);
      } catch (e) {
        if (!cancelled) { setLoading(false); setError(e.message); }
      }
    }

    init();

    return () => {
      cancelled = true;
      videoA.removeEventListener('ended', handleEnded);
      videoB.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Auto-hide info overlay after 3.5s
  useEffect(() => {
    if (!showInfo) return;
    const t = setTimeout(() => setShowInfo(false), 3500);
    return () => clearTimeout(t);
  }, [showInfo, currentClip]);

  return (
    <div className="radio-overlay">
      <div className="radio-frame">
        <video
          ref={videoARef}
          className={`radio-video ${activeSlot === 'a' ? 'radio-video--active' : ''}`}
          playsInline
          aria-hidden="true"
        />
        <video
          ref={videoBRef}
          className={`radio-video ${activeSlot === 'b' ? 'radio-video--active' : ''}`}
          playsInline
          aria-hidden="true"
        />

        {/* Eye-blink transition overlay */}
        <div className={`radio-blink${isBlinking ? ' radio-blink--active' : ''}`} />

        {/* Loading / error states */}
        {loading && (
          <div className="radio-loading">
            <div className="radio-spinner" />
            <p>Tuning in…</p>
          </div>
        )}
        {error && (
          <div className="radio-loading">
            <p className="radio-error-msg">{error}</p>
          </div>
        )}

        {/* Bottom gradient for text legibility */}
        <div className="radio-gradient" />

        {/* Clip info — fades in on each new clip */}
        <div className={`radio-info${showInfo && currentClip ? ' radio-info--visible' : ''}`}>
          <span className="radio-live">● LIVE</span>
          {currentClip?.speaker && <span className="radio-speaker">{currentClip.speaker}</span>}
          {currentClip?.title && <p className="radio-title">{currentClip.title}</p>}
          {currentClip?.category && <span className="radio-category">{currentClip.category}</span>}
        </div>

        {/* Controls */}
        <div className="radio-controls">
          <button
            className="radio-btn radio-btn--skip"
            onClick={() => advanceFnRef.current()}
            aria-label="Next clip"
            title="Next clip"
          >
            <SkipForward size={16} />
          </button>
          <button
            className="radio-btn radio-btn--exit"
            onClick={onExit}
            aria-label="Exit radio"
          >
            <X size={15} />
            <span>Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
