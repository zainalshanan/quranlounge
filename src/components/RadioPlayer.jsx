import { useEffect, useRef, useState } from 'react';
import { X, SkipForward } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import './RadioPlayer.css';

const HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
const MIN_W = 280;
const MIN_H = 160;

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
  const frameWrapperRef = useRef(null);
  const resizeRef = useRef(null);

  const activeSlotRef = useRef('a');
  const slotsRef = useRef({ a: null, b: null });
  const isBlinkingRef = useRef(false);
  const advanceFnRef = useRef(null);

  const [activeSlot, setActiveSlot] = useState('a');
  const [isBlinking, setIsBlinking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [size, setSize] = useState(null); // { width, height } in px — null = CSS defaults

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

    if (!nextClip) return;

    isBlinkingRef.current = true;
    setIsBlinking(true);

    setTimeout(() => {
      const prevEl = getVideoEl(currentSlot);
      const nextEl = getVideoEl(nextSlot);
      if (prevEl) { prevEl.muted = true; prevEl.pause(); }
      if (nextEl) { nextEl.muted = false; nextEl.currentTime = 0; nextEl.play().catch(() => {}); }

      activeSlotRef.current = nextSlot;
      slotsRef.current[currentSlot] = null;
      setActiveSlot(nextSlot);

      fetchRandomClip(nextClip.id)
        .then(clip => loadClipIntoSlot(currentSlot, clip))
        .catch(() => {});
    }, 350);

    setTimeout(() => {
      setIsBlinking(false);
      isBlinkingRef.current = false;
    }, 700);
  }

  advanceFnRef.current = advance;

  function startResize(e, dir) {
    e.preventDefault();
    e.stopPropagation();
    const rect = frameWrapperRef.current.getBoundingClientRect();
    resizeRef.current = { dir, startX: e.clientX, startY: e.clientY, startW: rect.width, startH: rect.height };

    function onMove(ev) {
      const { dir, startX, startY, startW, startH } = resizeRef.current;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let w = startW, h = startH;
      if (dir.includes('e')) w = Math.max(MIN_W, startW + dx);
      if (dir.includes('w')) w = Math.max(MIN_W, startW - dx);
      if (dir.includes('s')) h = Math.max(MIN_H, startH + dy);
      if (dir.includes('n')) h = Math.max(MIN_H, startH - dy);
      setSize({ width: w, height: h });
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // Pause recitation, hide verse text, close sidebar, clear backdrop, force clean style. Restore on exit.
  useEffect(() => {
    const store = usePlayerStore.getState();
    const prevDisplayLanguages = store.displayLanguages;
    const prevSidebarOpen = store.sidebarOpen;
    const prevShowTextBackdrop = store.showTextBackdrop;
    const prevContainerStyle = store.containerStyle;

    store.setIsPlaying(false);
    usePlayerStore.setState({
      displayLanguages: [],
      sidebarOpen: false,
      showTextBackdrop: false,
      containerStyle: 'clean',
    });

    return () => {
      usePlayerStore.setState({
        displayLanguages: prevDisplayLanguages,
        sidebarOpen: prevSidebarOpen,
        showTextBackdrop: prevShowTextBackdrop,
        containerStyle: prevContainerStyle,
      });
    };
  }, []);

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
        setLoading(false);
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

  return (
    <div className="radio-overlay">
      <div
        ref={frameWrapperRef}
        className="radio-frame-wrapper"
        style={size ? { width: size.width, height: size.height } : {}}
      >
        {HANDLES.map(dir => (
          <div
            key={dir}
            className={`radio-resize-handle radio-resize-handle--${dir}`}
            onMouseDown={e => startResize(e, dir)}
          />
        ))}

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

          <div className={`radio-blink${isBlinking ? ' radio-blink--active' : ''}`} />

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
        </div>
      </div>

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
  );
}
