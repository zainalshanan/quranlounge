import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';

export default function PomodoroPanel() {
  const {
    pomodoroWorkMin, setPomodoroWorkMin,
    pomodoroBreakMin, setPomodoroBreakMin,
    pomodoroSessions, setPomodoroSessions,
  } = usePlayerStore();

  const [currentSession, setCurrentSession] = useState(1);
  const [isWork, setIsWork] = useState(true);
  const [timeLeft, setTimeLeft] = useState(pomodoroWorkMin * 60);
  const [isActive, setIsActive] = useState(false);

  const totalSeconds = isWork ? pomodoroWorkMin * 60 : pomodoroBreakMin * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(isWork ? pomodoroWorkMin * 60 : pomodoroBreakMin * 60);
    }
  }, [pomodoroWorkMin, pomodoroBreakMin]);

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
  }, [isActive, timeLeft]);

  const reset = useCallback(() => {
    setIsActive(false);
    setIsWork(true);
    setTimeLeft(pomodoroWorkMin * 60);
    setCurrentSession(1);
  }, [pomodoroWorkMin]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="panel-content">
      <h3 className="panel-title">Focus Timer</h3>
      <p className="panel-subtitle">
        {isWork ? 'Work Session' : 'Break Time'} · {currentSession}/{pomodoroSessions}
      </p>

      {/* Circular Progress */}
      <div className="pomo-circle-wrap">
        <svg className="pomo-circle" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" className="pomo-circle-bg" />
          <circle
            cx="60" cy="60" r="52"
            className="pomo-circle-progress"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
          />
        </svg>
        <div className="pomo-circle-text">
          <span className="pomo-display-time">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="pomo-display-label">{isWork ? 'FOCUS' : 'BREAK'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="pomo-actions">
        <button className="pomo-btn" onClick={() => setIsActive(!isActive)} aria-label={isActive ? 'Pause timer' : 'Start timer'}>
          {isActive ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="pomo-btn secondary" onClick={reset} aria-label="Reset timer">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Config */}
      <div className="pomo-config">
        <div className="config-item">
          <span>Work</span>
          <div className="stepper">
            <button onClick={() => setPomodoroWorkMin(Math.max(5, pomodoroWorkMin - 5))} aria-label="Decrease work time"><ChevronDown size={14} /></button>
            <span>{pomodoroWorkMin}m</span>
            <button onClick={() => setPomodoroWorkMin(Math.min(60, pomodoroWorkMin + 5))} aria-label="Increase work time"><ChevronUp size={14} /></button>
          </div>
        </div>
        <div className="config-item">
          <span>Break</span>
          <div className="stepper">
            <button onClick={() => setPomodoroBreakMin(Math.max(1, pomodoroBreakMin - 1))} aria-label="Decrease break time"><ChevronDown size={14} /></button>
            <span>{pomodoroBreakMin}m</span>
            <button onClick={() => setPomodoroBreakMin(Math.min(30, pomodoroBreakMin + 1))} aria-label="Increase break time"><ChevronUp size={14} /></button>
          </div>
        </div>
        <div className="config-item">
          <span>Sessions</span>
          <div className="stepper">
            <button onClick={() => setPomodoroSessions(Math.max(1, pomodoroSessions - 1))} aria-label="Decrease session count"><ChevronDown size={14} /></button>
            <span>{pomodoroSessions}</span>
            <button onClick={() => setPomodoroSessions(Math.min(10, pomodoroSessions + 1))} aria-label="Increase session count"><ChevronUp size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
