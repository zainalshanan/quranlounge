import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

export default function FloatingPomodoro() {
  const {
    pomodoroWorkMin, pomodoroBreakMin, pomodoroSessions,
    setFloatingPomodoro,
    widgetStyle,
  } = usePlayerStore();

  const [currentSession, setCurrentSession] = useState(1);
  const [isWork, setIsWork] = useState(true);
  const [timeLeft, setTimeLeft] = useState(pomodoroWorkMin * 60);
  const [isActive, setIsActive] = useState(false);

  const totalSeconds = isWork ? pomodoroWorkMin * 60 : pomodoroBreakMin * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (isWork) {
        setIsWork(false);
        setTimeLeft(pomodoroBreakMin * 60);
      } else {
        setIsWork(true);
        setTimeLeft(pomodoroWorkMin * 60);
        if (currentSession < pomodoroSessions) {
          setCurrentSession(s => s + 1);
        } else {
          setCurrentSession(1);
        }
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isWork, pomodoroBreakMin, pomodoroWorkMin, currentSession, pomodoroSessions]);

  const reset = useCallback(() => {
    setIsActive(false);
    setIsWork(true);
    setTimeLeft(pomodoroWorkMin * 60);
    setCurrentSession(1);
  }, [pomodoroWorkMin]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`floating-widget floating-pomo widget-${widgetStyle}`}
    >
      <div className="fw-header">
        <span className="fw-title">{isWork ? 'Focus' : 'Break'} · {currentSession}/{pomodoroSessions}</span>
        <button className="fw-close" onClick={() => setFloatingPomodoro(false)} aria-label="Close floating timer"><X size={14} /></button>
      </div>
      <div className="fw-pomo-display">
        <span className="fw-pomo-time">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
      </div>
      <div className="fw-pomo-bar">
        <div className="fw-pomo-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="fw-pomo-controls">
        <button onClick={() => setIsActive(!isActive)} aria-label={isActive ? 'Pause timer' : 'Start timer'}>
          {isActive ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button onClick={reset} aria-label="Reset timer"><RotateCcw size={14} /></button>
      </div>
    </motion.div>
  );
}
