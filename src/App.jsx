// App.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  Suspense
} from 'react';
import Draggable from 'react-draggable';
import { FaPlay, FaPause, FaStepForward, FaStop, FaVolumeUp, FaEye, FaEyeSlash } from 'react-icons/fa';
import './App.css';

// Lazy import your audio player
import SurahAudioPlayerLazy from './SurahAudioPlayerLazy';

// Optional splash screen
import SplashScreen from './SplashScreen';

// Reciter config
import RECITER_FADE_CONFIG from './ReciterConfig';
// Surah list
import SURAH_NAMES from './SurahList';
// Background URLs
import backgroundURLs from './Backgrounds';

// Your JSON data (could also lazy-load these if they are large)
import reciter1Data from './AbdulBasetAbdulSamad.json';
// import reciter2Data from './YasserAlDossari.json';
import reciter3Data from './HaniArRifai.json';
import reciter4Data from './MohamedSiddiqAlMinshawi.json';
import reciter5Data from './Mohamedal-Tablawi.json';
import transcriptionData from './Uthmani.json';
import translationData from './English.json';

// Custom hook for preloading background images
import usePreloadImages from './usePreLoadImages';

// ====== UTILITIES ======
function parseReciterData(json, reciterName) {
  const dataArray = Array.isArray(json) ? json : Object.values(json);
  dataArray.reciterName = reciterName;
  return dataArray;
}

const reciter1 = parseReciterData(reciter1Data, 'AbdulBasetAbdulSamad');
// const reciter2 = parseReciterData(reciter2Data, 'YasserAlDossari');
const reciter3 = parseReciterData(reciter3Data, 'HaniArRifai');
const reciter4 = parseReciterData(reciter4Data, 'MohamedSiddiqAlMinshawi');
const reciter5 = parseReciterData(reciter5Data, 'Mohamedal-Tablawi');

const ALL_RECITERS = [reciter5, reciter4, reciter3, reciter1];

/**
 * Secure random item from an array
 */
function getRandomItem(arr) {
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  const randomFloat = randomBuffer[0] / (0xffffffff + 1);
  const index = Math.floor(randomFloat * arr.length);
  return arr[index];
}

/**
 * Return a random surah object:
 *  {
 *    surahAyahs: [ ... full list of ayahs ... ],
 *    surahName: '...'
 *    fadeDurations: { fadeIn, fadeOut }
 *  }
 */
function getRandomSurah() {
  // 1) Choose a random reciter array
  const chosenReciter = getRandomItem(ALL_RECITERS);
  const reciterName = chosenReciter.reciterName || 'default';

  // 2) Fade config
  const fadeConfig = RECITER_FADE_CONFIG[reciterName] || RECITER_FADE_CONFIG.default;

  // 3) Unique surah numbers for that reciter
  const surahNumbers = Array.from(new Set(chosenReciter.map((a) => a.surah_number)));
  // 4) Pick random surah
  const randomSurah = getRandomItem(surahNumbers);

  // 5) Filter the ayahs for that surah + sort
  const filtered = chosenReciter
    .filter((item) => item.surah_number === randomSurah)
    .sort((a, b) => a.ayah_number - b.ayah_number);

  const withLocalAyahs = filtered.map((item, i) => ({
    ...item,
    localAyahNumber: i + 1
  }));

  const surahName = SURAH_NAMES[randomSurah] || `Surah #${randomSurah}`;

  return {
    surahAyahs: withLocalAyahs,
    surahName,
    fadeDurations: fadeConfig
  };
}

export default function App() {
  // ----- State -----
  const [currentSurah, setCurrentSurah] = useState(null);
  const [nextSurah, setNextSurah] = useState(null); // pre-fetch the next surah
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // For text display
  const [showTranscription, setShowTranscription] = useState(true);
  const [textMode, setTextMode] = useState('arabic');
  const [currentArabic, setCurrentArabic] = useState('');
  const [currentEnglish, setCurrentEnglish] = useState('');

  // For controlling a short splash screen
  const [showSplash, setShowSplash] = useState(true);

  // Preload all background images to avoid lag on switching
  // (If you have a large list, consider preloading only some or lazy-load them)
  const { loadedImages, isLoading: imagesLoading } = usePreloadImages(backgroundURLs);

  // Manage background: store an index to the preloaded images
  const [bgIndex, setBgIndex] = useState(0);

  // If you want a fade-in/fade-out or immediate switch, you can do it in CSS
  // For immediate switch, just swap the src as we do below.

  // On mount, load initial surahs
  useEffect(() => {
    // Set up a fallback to remove splash after ~3 seconds if not ready
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    // Load 1st Surah and pre-fetch next Surah
    const first = getRandomSurah();
    setCurrentSurah(first);
    setNextSurah(getRandomSurah());

    return () => clearTimeout(splashTimeout);
  }, []);

  // If images + surah are loaded, remove the splash
  useEffect(() => {
    if (!imagesLoading && currentSurah) {
      // All images loaded + we have surah data = safe to hide splash
      setShowSplash(false);
    }
  }, [imagesLoading, currentSurah]);

  // Derive fadeDurations + surah name
  const fadeDurations = currentSurah?.fadeDurations || { fadeIn: 0.15, fadeOut: 0.5 };
  const currentSurahName = currentSurah?.surahName || '';

  // The current ayahs
  const currentSurahAyahs = currentSurah?.surahAyahs || [];
  const currentAyah = currentSurahAyahs[currentAyahIndex];

  // Next ayah for preloading audio
  const nextAyahIndex = currentAyahIndex + 1;
  const nextAyah = nextAyahIndex < currentSurahAyahs.length
    ? currentSurahAyahs[nextAyahIndex]
    : null;

  // Helper to pick next surah from the queue (or random if none)
  const loadNextSurahFromQueue = useCallback(() => {
    setCurrentSurah(nextSurah || getRandomSurah());
    setNextSurah(getRandomSurah()); // re-populate the "queue"
    setCurrentAyahIndex(0);
    // Also pick a random background index
    setBgIndex((prev) => {
      // to avoid the same background consecutively, you can do this check:
      let newIndex = Math.floor(Math.random() * loadedImages.length);
      if (newIndex === prev && loadedImages.length > 1) {
        newIndex = (newIndex + 1) % loadedImages.length;
      }
      return newIndex;
    });
  }, [nextSurah, loadedImages.length]);

  // Move to next ayah
  function handleNextAyah() {
    setCurrentAyahIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= currentSurahAyahs.length) {
        // Surah done => load the next surah from queue
        loadNextSurahFromQueue();
        return 0;
      }
      return nextIndex;
    });
  }

  // Skip entire surah
  function skipToNextSurah() {
    loadNextSurahFromQueue();
  }

  // Stop
  function stopPlayback() {
    // set isPlaying false and reset ayah to start
    setIsPlaying(false);
    setCurrentAyahIndex(0);
  }

  // Construct text content
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

  // We have the image objects in loadedImages; pick the bgIndex
  const backgroundImageSrc = loadedImages[bgIndex]?.src || ''; // fallback

  // Render the splash if still showing
  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <div className="app">
      {/* Background */}
      <div className="background">
        {/** 
         * For immediate switching, we simply render the chosen image. 
         * It's already preloaded in memory, so it won't flicker. 
         */}
        <img
          src={backgroundImageSrc}
          alt="Background"
          className="background-gif"
        />
      </div>

      {/** Main text content (centered) */}
      {textContent && <div className="transcription">{textContent}</div>}

      {/** Draggable Player */}
      <Draggable cancel=".no-drag">
        <div className="player" style={{ direction: 'ltr' }}>
          <div
            className="drag-handle"
            style={{
              background: 'rgba(0,0,0,0.4)',
              padding: '5px',
              textAlign: 'center',
              borderRadius: '4px',
              width: '100%'
            }}
          >
            <strong>{currentSurahName}</strong>
          </div>

          {/** Audio player + fallback while lazy-loading */}
          {currentAyah ? (
            <Suspense fallback={<div>Loading audio...</div>}>
              <SurahAudioPlayerLazy
                key={`${currentAyah.surah_number}-${currentAyah.localAyahNumber}`}
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
            </Suspense>
          ) : (
            <div>Loading...</div>
          )}

          {/** Controls */}
          <div
            className="controls"
            style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}
          >
            {/** Play/Pause */}
            <button className="no-drag" onClick={() => setIsPlaying((prev) => !prev)}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>

            {/** Stop (reset to start) */}
            <button className="no-drag" onClick={stopPlayback}>
              <FaStop />
            </button>

            {/** Skip surah */}
            <button className="no-drag" onClick={skipToNextSurah}>
              <FaStepForward />
            </button>

            {/** Hide/Show text */}
            <button
              className="no-drag"
              onClick={() => setShowTranscription((prev) => !prev)}
            >
              {showTranscription ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/** Radio group for textMode */}
          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <label className="no-drag">
              <input
                type="radio"
                name="textMode"
                value="arabic"
                checked={textMode === 'arabic'}
                onChange={() => setTextMode('arabic')}
              />
              Arabic
            </label>
            <label className="no-drag">
              <input
                type="radio"
                name="textMode"
                value="english"
                checked={textMode === 'english'}
                onChange={() => setTextMode('english')}
              />
              English
            </label>
            <label className="no-drag">
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

          {/** Volume slider */}
          <div className="no-drag" style={{ marginTop: '10px', width: '80%', margin: 'auto' }}>
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

      {/** Preload the next ayah audio to reduce gap */}
      {nextAyah && (
        <audio
          src={nextAyah.audio_url}
          preload="auto"
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
}
