import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import SurahAudioPlayer from './SurahAudioPlayer';
import RECITER_FADE_CONFIG from './ReciterConfig';
import backgroundURLs from './Backgrounds';
import SURAH_NAMES from './SurahList';
import './App.css';
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaVolumeUp,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';

// Import reciter data
import reciter1Data from './AbdulBasetAbdulSamad.json';
import reciter2Data from './YasserAlDossari.json';
import reciter3Data from './HaniArRifai.json';
import reciter4Data from './MohamedSiddiqAlMinshawi.json';
import reciter5Data from './Mohamedal-Tablawi.json';


// Uthmani Arabic + English
import transcriptionData from './Uthmani.json';
import translationData from './English.json';
/**
 * parseReciterData: Converts the reciter JSON into a standard array of ayahs.
 * If it's already an array, return as-is.
 * If it's an object like { "1:1": {...}, "1:2": {...} }, return Object.values(...).
 */
function parseReciterData(json, reciterName) {
  // 1) Convert JSON to an array of ayahs
  const dataArray = Array.isArray(json) ? json : Object.values(json);

  // 2) Attach the reciter name to the array itself (so we can read it later)
  dataArray.reciterName = reciterName;

  // 3) Return the array
  return dataArray;
}


// Convert each reciter to standard arrays
const reciter1 = parseReciterData(reciter1Data, 'AbdulBasetAbdulSamad');
const reciter2 = parseReciterData(reciter2Data, 'YasserAlDossari');
const reciter3 = parseReciterData(reciter3Data, 'HaniArRifai');
const reciter4 = parseReciterData(reciter4Data, 'MohamedSiddiqAlMinshawi');


// Keep them in separate arrays so we can randomly pick a reciter
const ALL_RECITERS = [reciter2];


// Simple random item picker
function getRandomItem(arr) {
  // Generate a cryptographically secure random index
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);

  // Use the random value to select an item from the array
  const index = randomBuffer[0] % arr.length; // Modulo ensures it's within bounds
  return arr[index];
}


export default function App() {
  const [currentSurahAyahs, setCurrentSurahAyahs] = useState([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showTranscription, setShowTranscription] = useState(true);
  const [currentArabic, setCurrentArabic] = useState('');
  const [currentEnglish, setCurrentEnglish] = useState('');
  const [backgroundImageSrc, setBackgroundImageSrc] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [textMode, setTextMode] = useState('arabic');
  const [currentSurahName, setCurrentSurahName] = useState('');
  
  // NEW: store fadeDurations for the currently chosen reciter
  const [fadeDurations, setFadeDurations] = useState({ fadeIn: 0.15, fadeOut: 0.5 });

  useEffect(() => {
    setDataLoaded(true);
    pickRandomSurah();
  }, []);


  /**
   * pickRandomSurah: picks a random reciter, then a random surah from that reciter
   */
  function pickRandomSurah() {
    const chosenReciter = getRandomItem(ALL_RECITERS);
    // If you added a property reciterName, use it:
    const reciterName = chosenReciter.reciterName || 'default';
    const fadeConfig = RECITER_FADE_CONFIG[reciterName] || RECITER_FADE_CONFIG.default;
    setFadeDurations(fadeConfig);

    const surahNumbers = Array.from(new Set(chosenReciter.map((a) => a.surah_number)));
    const randomSurah = getRandomItem(surahNumbers);

    const filtered = chosenReciter
      .filter((item) => item.surah_number === randomSurah)
      .sort((a, b) => a.ayah_number - b.ayah_number);

    const withLocalAyahs = filtered.map((item, i) => ({
      ...item,
      localAyahNumber: i + 1,
    }));

    setCurrentSurahAyahs(withLocalAyahs);
    setCurrentAyahIndex(0);

    const surahName = SURAH_NAMES[randomSurah] || `Surah #${randomSurah}`;
    setCurrentSurahName(surahName);

    // Force new background
    setBackgroundImageSrc(getRandomItem(backgroundURLs));

    // Attempt to autoplay
    setIsPlaying(true);
  }

  function handleNextAyah() {
    setCurrentAyahIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= currentSurahAyahs.length) {
        pickRandomSurah();
        return 0;
      }
      return nextIndex;
    });
  }

  function skipToNextSurah() {
    pickRandomSurah();
  }

  const currentAyah = currentSurahAyahs[currentAyahIndex];

  // Build text content
  let textContent = null;
  if (showTranscription) {
    if (textMode === 'arabic' && currentArabic) {
      textContent = (
        <div className="text-block">
          <div className="arabic-line" style={{ direction: 'ltr' }}>{currentArabic}</div>
        </div>
      );
    } else if (textMode === 'english' && currentEnglish) {
      textContent = (
        <div className="text-block">
          <div className="english-line" style={{ direction: 'ltr' }}>{currentEnglish}</div>
        </div>
      );
    } else if (textMode === 'both' && (currentArabic || currentEnglish)) {
      textContent = (
        <div className="text-block">
          <div className="arabic-line">{currentArabic}</div>
          <div className="english-line" style={{ direction: 'ltr' }}>{currentEnglish}</div>
        </div>
      );
    }
  }

  return (
    <div className="app">
      <div className="background">
        <img 
          src={backgroundImageSrc} 
          alt="Background" 
          className="background-gif" 
        />
      </div>

      {textContent && <div className="transcription">{textContent}</div>}

      {/* Draggable: entire box is draggable, except the volume slider */}
      <Draggable cancel=".volume-slider">
        <div className="player" style={{ direction: 'ltr' }}>
          <div
            className="drag-handle"
            style={{
              background: 'rgba(0,0,0,0.4)',
              padding: '5px',
              textAlign: 'center',
              borderRadius: '4px',
              width: '100%',
            }}
          >
            <strong>{currentSurahName}</strong>
          </div>

          {/* Audio player or "Loading" */}
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
              fadeInDuration={fadeDurations.fadeIn}
              fadeOutDuration={fadeDurations.fadeOut}
            />
          ) : (
            <div>Loading...</div>
          )}

          {/* Controls row */}
          <div className="controls" style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
            {/* Play/Pause */}
            <button onClick={() => setIsPlaying((prev) => !prev)}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            {/* Skip entire surah */}
            <button onClick={skipToNextSurah}>
              <FaStepForward />
            </button>
            {/* Hide/Show text */}
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
          <div style={{ marginTop: '10px', width: '80%', margin: 'auto' }}>
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
      </Draggable>
    </div>
  );
}