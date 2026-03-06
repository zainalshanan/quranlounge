import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/usePlayerStore';

export default function Clock() {
  const [time, setTime] = useState(new Date());
  const { showClock, clockFormat, showDate, showSeconds } = usePlayerStore();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!showClock) return null;

  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(showSeconds && { second: '2-digit' }),
    hour12: clockFormat === '12',
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="clock-overlay"
      whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
    >
      <div className="clock-time-display">
        {time.toLocaleTimeString([], timeOptions)}
      </div>
      {showDate && (
        <div className="clock-date-display">
          {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      )}
    </motion.div>
  );
}
