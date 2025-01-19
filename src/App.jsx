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
 * Also attach reciterName as an extra property on the array.
 */
function parseReciterData(json, reciterName) {
  // 1) Convert JSON to an array of ayahs
  const dataArray = Array.isArray(json) ? json : Object.values(json);
  // 2) Attach the reciter name to the array itself (so we can read it later)
  dataArray.reciterName = reciterName;
  // 3) Return the array
  return dataArray;
}

// Convert each reciter to standard arrays, attaching their name
const reciter1 = parseReciterData(reciter1Data, 'AbdulBasetAbdulSamad');
const reciter2 = parseReciterData(reciter2Data, 'YasserAlDossari');
const reciter3 = parseReciterData(reciter3Data, 'HaniArRifai');
const reciter4 = parseReciterData(reciter4Data, 'MohamedSiddiqAlMinshawi');
const reciter5 = parseReciterData(reciter5Data, 'Mohamedal-Tablawi');

// Put them all in one list if you want to pick randomly among them
const ALL_RECITERS = [reciter5, reciter4, reciter3, reciter2, reciter1];

/**
 * Simple random item picker using crypto for a secure random index.
 */
function getRandomItem(arr) {
  // Get a random 32-bit integer
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);

  // Convert to a float in [0, 1)
  const randomFloat = randomBuffer[0] / (0xFFFFFFFF + 1);

  // Use that float to get a uniform index
  const index = Math.floor(randomFloat * arr.length);
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

  // Store fadeDurations for the currently chosen reciter
  const [fadeDurations, setFadeDurations] = useState({ fadeIn: 0.15, fadeOut: 0.5 });

  useEffect(() => {
    // Once component loads, pick an initial surah
    setDataLoaded(true);
    pickRandomSurah();
  }, []);

  // === Add keyboard listener for desktop only ===
  useEffect(() => {
    // Quick mobile check; if mobile, do nothing
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile) return;

    const handleKeyDown = (e) => {
      // If user is typing into an input or textarea, skip
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Toggle play/pause with Space
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
        setIsPlaying((prev) => !prev);
      }
      // Skip to the next surah with ArrowRight
      else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipToNextSurah();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * pickRandomSurah: picks a random reciter array, then a random surah from that reciter.
   */
  function pickRandomSurah() {
    // 1) Choose a random reciter array
    const chosenReciter = getRandomItem(ALL_RECITERS);
    // 2) Determine the reciterName
    const reciterName = chosenReciter.reciterName || 'default';
    // 3) Lookup or fall back to default fade config
    const fadeConfig = RECITER_FADE_CONFIG[reciterName] || RECITER_FADE_CONFIG.default;
    setFadeDurations(fadeConfig);

    // 4) From that reciter, gather all surah numbers
    const surahNumbers = Array.from(new Set(chosenReciter.map((a) => a.surah_number)));
    // 5) Pick one surah
    const randomSurah = getRandomItem(surahNumbers);

    // 6) Filter out the ayahs for that surah
    const filtered = chosenReciter
      .filter((item) => item.surah_number === randomSurah)
      .sort((a, b) => a.ayah_number - b.ayah_number);

    // 7) Attach a "localAyahNumber"
    const withLocalAyahs = filtered.map((item, i) => ({
      ...item,
      localAyahNumber: i + 1,
    }));

    setCurrentSurahAyahs(withLocalAyahs);
    setCurrentAyahIndex(0);

    // 8) Surah name for display
    const surahName = SURAH_NAMES[randomSurah] || `Surah #${randomSurah}`;
    setCurrentSurahName(surahName);

    // 9) Pick a new background
    setBackgroundImageSrc(getRandomItem(backgroundURLs));

    // 10) Attempt to play automatically
    // setIsPlaying(true);
  }

  /**
   * handleNextAyah: move to the next ayah or pick a new surah if we're at the end.
   */
  function handleNextAyah() {
    setCurrentAyahIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= currentSurahAyahs.length) {
        // Surah done, pick new one
        pickRandomSurah();
        return 0;
      }
      return nextIndex;
    });
  }

  /**
   * skipToNextSurah: skip the entire surah.
   */
  function skipToNextSurah() {
    pickRandomSurah();
  }

  // Current ayah object
  const currentAyah = currentSurahAyahs[currentAyahIndex];

  // For preloading the next ayah
  const nextAyahIndex = currentAyahIndex + 1;
  const nextAyah =
    nextAyahIndex < currentSurahAyahs.length
      ? currentSurahAyahs[nextAyahIndex]
      : null;

  // Build text content
  let textContent = null;
  if (showTranscription) {
    if (textMode === 'arabic' && currentArabic) {
      textContent = (
        <div className="text-block">
          <div className="arabic-line" style={{ direction: 'ltr' }}>
            {currentArabic}
          </div>
        </div>
      );
    } else if (textMode === 'english' && currentEnglish) {
      textContent = (
        <div className="text-block">
          <div className="english-line" style={{ direction: 'ltr' }}>
            {currentEnglish}
          </div>
        </div>
      );
    } else if (textMode === 'both' && (currentArabic || currentEnglish)) {
      textContent = (
        <div className="text-block">
          <div className="arabic-line" style={{ direction: 'ltr' }}>
            {currentArabic}
          </div>
          <div className="english-line" style={{ direction: 'ltr' }}>
            {currentEnglish}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="app">
      {/* Background */}
      <div className="background">
        <img
          src={backgroundImageSrc}
          alt="Background"
          className="background-gif"
        />
      </div>

      {/* Main text content in center (if any) */}
      {textContent && <div className="transcription">{textContent}</div>}

      {/* Draggable container (entire box draggable except volume slider) */}
      <Draggable  cancel=".no-drag">
        <div className="player" style={{ direction: 'ltr' }}>
          {/* Drag handle + Surah name */}
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
          <div
            className="controls"
            style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}
          >
            {/* Play/Pause */}
            <button  className="no-drag" onClick={() => setIsPlaying((prev) => !prev)}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            {/* Skip entire surah */}
            <button  className="no-drag" onClick={skipToNextSurah}>
              <FaStepForward />
            </button>
            {/* Hide/Show text */}
            <button  className="no-drag" onClick={() => setShowTranscription((prev) => !prev)}>
              {showTranscription ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Mode Switch */}
          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <label  className="no-drag">
              <input 
                type="radio"
                name="textMode"
                value="arabic"
                checked={textMode === 'arabic'}
                onChange={() => setTextMode('arabic')}
              />
              Arabic
            </label>
            <label  className="no-drag">
              <input
                type="radio"
                name="textMode"
                value="english"
                checked={textMode === 'english'}
                onChange={() => setTextMode('english')}
              />
              English
            </label>
            <label  className="no-drag">
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

          {/* Volume slider */}
          <div  className="no-drag" style={{ marginTop: '10px', width: '80%', margin: 'auto' }}>
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

      {/* Preload the NEXT ayah audio to reduce gap */}
      {dataLoaded && nextAyah && (
        <audio
          src={nextAyah.audio_url}
          preload="auto"
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
}
