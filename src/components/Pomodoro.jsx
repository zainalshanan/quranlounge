import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/usePlayerStore';

export default function Pomodoro() {
  const showPomodoro = usePlayerStore((state) => state.showPomodoro);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
      // alert("Study session complete! Take a break.");
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  if (!showPomodoro) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <motion.div 
      drag
      dragMomentum={false}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="lofi-widget pomo-widget glass-morphism draggable-widget"
    >
      <div className="widget-handle" />
      <div className="pomo-label">Focus Timer</div>
      <div className="pomo-time">
        {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      </div>
      <div className="pomo-controls">
        <button onClick={() => setIsActive(!isActive)}>
          {isActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        </button>
        <button onClick={() => { setIsActive(false); setTimeLeft(25 * 60); }}>
          <RotateCcw size={14} />
        </button>
      </div>
    </motion.div>
  );
}
