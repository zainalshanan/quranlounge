import React, { useState, useEffect, useRef } from 'react';
import SurahAudioPlayer from './SurahAudioPlayer';
import './App.css';

import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaVolumeUp,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

import reciterData from './AbdulBasetAbdulSamadRecitation.json';
import reciterData2 from './yasseraldossari.json';
const ALL_RECITERS = [reciterData,reciterData2];

import transcriptionData from './Uthmani.json';
import translationData from './English.json';

// Helper: pick a random item
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function App() {
  const [currentSurahAyahs, setCurrentSurahAyahs] = useState([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // Show/hide the entire text area
  const [showTranscription, setShowTranscription] = useState(true);

  // Arabic + English lines (set by the child)
  const [currentArabic, setCurrentArabic] = useState('');
  const [currentEnglish, setCurrentEnglish] = useState('');

  const [backgroundImageSrc, setBackgroundImageSrc] = useState('/assets/gifs/1.gif');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Text display mode: 'arabic', 'english', or 'both'
  const [textMode, setTextMode] = useState('arabic');

  // Draggable player states
  const playerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Starting position near bottom-left
  const [playerPos, setPlayerPos] = useState({
    x: 20,
    y: window.innerHeight * 0.1
  });

  useEffect(() => {
    setDataLoaded(true);
    pickRandomSurah();
  }, []);

  function pickRandomSurah() {
    const chosenReciter = getRandomItem(ALL_RECITERS);

    const surahNumbers = Array.from(
      new Set(chosenReciter.map((item) => item.surah_number))
    );
    const randomSurah = getRandomItem(surahNumbers);

    const filtered = chosenReciter
      .filter((item) => item.surah_number === randomSurah)
      .sort((a, b) => a.ayah_number - b.ayah_number);

    const withLocalAyahs = filtered.map((item, i) => ({
      ...item,
      localAyahNumber: i + 1
    }));

    setCurrentSurahAyahs(withLocalAyahs);
    setCurrentAyahIndex(0);
    setCurrentArabic('');
    setCurrentEnglish('');

    const randomBG = `/assets/gifs/${Math.floor(Math.random() * 5) + 1}.gif`;
    setBackgroundImageSrc(randomBG);

    setIsPlaying(true);
    console.log(
      `Random Surah #${randomSurah}, total ayahs = ${withLocalAyahs.length}, BG = ${randomBG}`
    );
  }

  function handleNextAyah() {
    setCurrentAyahIndex((prev) => {
      const next = prev + 1;
      if (next >= currentSurahAyahs.length) {
        pickRandomSurah();
        return 0;
      }
      return next;
    });
  }

  function skipToNextSurah() {
    pickRandomSurah();
  }

  const currentAyah = currentSurahAyahs[currentAyahIndex];

  // DRAG: on mouse down
  function onPlayerMouseDown(e) {
    // If user clicked volume slider, do NOT drag
    if (e.target.classList.contains('volume-slider')) {
      return;
    }
    setIsDragging(true);
    const rect = playerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }

  // DRAG: on mouse move
  function onMouseMove(e) {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // CLAMP to keep player on screen
    // We'll clamp so it never goes off the left or top
    // and doesn't exceed window width/height minus 50 px margin
    const margin = 50;
    const maxX = window.innerWidth - margin;
    const maxY = window.innerHeight - margin;
    const clampedX = Math.min(Math.max(newX, 0), maxX);
    const clampedY = Math.min(Math.max(newY, 0), maxY);

    setPlayerPos({ x: clampedX, y: clampedY });
  }

  // DRAG: on mouse up
  function onMouseUp() {
    setIsDragging(false);
  }

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Combine Arabic + English depending on textMode
  let textContent = null;
  if (!showTranscription) {
    textContent = null; // user hid everything
  } else {
    if (textMode === 'arabic') {
      if (currentArabic) {
        textContent = (
          <div style={{ fontSize: '2rem', textAlign: 'center' }}>{currentArabic}</div>
        );
      }
    } else if (textMode === 'english') {
      if (currentEnglish) {
        // Single large size if only English
        textContent = (
          <div style={{ fontSize: '2rem', textAlign: 'center' }}>{currentEnglish}</div>
        );
      }
    } else {
      // both
      if (currentArabic || currentEnglish) {
        // Arabic bigger, English smaller, stacked
        textContent = (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {currentArabic}
            </div>
            <div style={{ fontSize: '1.3rem' }}>{currentEnglish}</div>
          </div>
        );
      }
    }
  }

  return (
    <div className="app">
      <div className="background">
        <img src={backgroundImageSrc} alt="Background" className="background-gif" />
      </div>

      {/* Transcription in the center */}
      {textContent && <div className="transcription">{textContent}</div>}

      {/* Draggable Player */}
      <div
        className="player"
        ref={playerRef}
        style={{
          transform: `translate(${playerPos.x}px, ${playerPos.y}px)`,
          direction: 'ltr'
        }}
        onMouseDown={onPlayerMouseDown}
      >
        {dataLoaded && currentAyah ? (
          <SurahAudioPlayer
            key={currentAyah.surah_number + '-' + currentAyah.localAyahNumber}
            ayah={currentAyah}
            isPlaying={isPlaying}
            volume={volume}
            arabicData={transcriptionData}
            englishData={translationData}
            setCurrentArabic={setCurrentArabic}
            setCurrentEnglish={setCurrentEnglish}
            onAyahEnded={handleNextAyah}
          />
        ) : (
          <div>Loading...</div>
        )}

        <div className="controls" style={{ display: 'flex', justifyContent: 'center' }}>
          {/* Play/Pause */}
          <button onClick={() => setIsPlaying((prev) => !prev)}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>

          {/* Skip entire surah */}
          <button onClick={skipToNextSurah}>
            <FaStepForward />
          </button>

          {/* Toggle show/hide all text */}
          <button onClick={() => setShowTranscription((prev) => !prev)}>
            {showTranscription ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Mode Switch */}
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '5px' }}>
          <label>
            <input
              type="radio"
              name="textMode"
              value="arabic"
              checked={textMode === 'arabic'}
              onChange={() => setTextMode('arabic')}
            />
            Arabic
          </label>
          <label>
            <input
              type="radio"
              name="textMode"
              value="english"
              checked={textMode === 'english'}
              onChange={() => setTextMode('english')}
            />
            English
          </label>
          <label>
            <input
              type="radio"
              name="textMode"
              value="both"
              checked={textMode === 'both'}
              onChange={() => setTextMode('both')}
            />
            Both
          </label>
        </div>

        {/* Volume */}
        <div style={{ marginTop: '10px', width: '80%' }}>
          <FaVolumeUp style={{ marginRight: '0.5rem' }} />
          <input
            type="range"
            className="volume-slider"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
