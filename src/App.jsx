// App.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  Suspense
} from 'react';
import Draggable from 'react-draggable';
import { FaPlay, FaPause, FaStepForward, FaStop, FaVolumeUp, FaUsers } from 'react-icons/fa';
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

// Your JSON data
import reciter1Data from './AbdulBasetAbdulSamad.json';
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

const reciter1 = parseReciterData(reciter1Data, 'Abdul Baset Abdul Samad');
const reciter3 = parseReciterData(reciter3Data, 'Hani Ar Rifai');
const reciter4 = parseReciterData(reciter4Data, 'Mohamed Siddiq Al Minshawi');
const reciter5 = parseReciterData(reciter5Data, 'Mohamedal-Tablawi');

const ALL_RECITERS = [reciter5, reciter4, reciter3, reciter1];

function getRandomItem(arr) {
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  const randomFloat = randomBuffer[0] / (0xffffffff + 1);
  const index = Math.floor(randomFloat * arr.length);
  return arr[index];
}

function getRandomSurah(allowedReciters) {
  const validReciters = allowedReciters.length > 0 ? allowedReciters : ALL_RECITERS;
  const chosenReciter = getRandomItem(validReciters);
  const reciterName = chosenReciter.reciterName || 'default';

  const fadeConfig = RECITER_FADE_CONFIG[reciterName] || RECITER_FADE_CONFIG.default;
  const surahNumbers = Array.from(new Set(chosenReciter.map((a) => a.surah_number)));
  const randomSurah = getRandomItem(surahNumbers);

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
  const [nextSurah, setNextSurah] = useState(null);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showTranscription, setShowTranscription] = useState(true);
  const [textMode, setTextMode] = useState('arabic');
  const [currentArabic, setCurrentArabic] = useState('');
  const [currentEnglish, setCurrentEnglish] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const [selectedReciters, setSelectedReciters] = useState(
    ALL_RECITERS.map(r => r.reciterName)
  );
  const [showReciterSelection, setShowReciterSelection] = useState(false);

  const { loadedImages, isLoading: imagesLoading } = usePreloadImages(backgroundURLs);
  const [bgIndex, setBgIndex] = useState(0);

  // Reciter selection logic
  const toggleReciter = useCallback((reciterName) => {
    setSelectedReciters(prev => {
      const newSelected = prev.includes(reciterName) 
        ? prev.filter(r => r !== reciterName)
        : [...prev, reciterName];
      if (newSelected.length === 0) {
        alert('Please select at least one reciter.');
        return prev;
      }
      return newSelected;
    });
  }, []);

  // Initial load
  useEffect(() => {
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    const allowedReciters = ALL_RECITERS.filter(r => selectedReciters.includes(r.reciterName));
    const first = getRandomSurah(allowedReciters);
    setCurrentSurah(first);
    setNextSurah(getRandomSurah(allowedReciters));

    return () => clearTimeout(splashTimeout);
  }, []);

  useEffect(() => {
    if (!imagesLoading && currentSurah) {
      setShowSplash(false);
    }
  }, [imagesLoading, currentSurah]);

  // Update next surah when reciters change
  useEffect(() => {
    const allowedReciters = ALL_RECITERS.filter(r => selectedReciters.includes(r.reciterName));
    setNextSurah(getRandomSurah(allowedReciters));
  }, [selectedReciters]);

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

  const loadNextSurahFromQueue = useCallback(() => {
    const allowedReciters = ALL_RECITERS.filter(r => selectedReciters.includes(r.reciterName));
    setCurrentSurah(nextSurah || getRandomSurah(allowedReciters));
    setNextSurah(getRandomSurah(allowedReciters));
    setCurrentAyahIndex(0);
    setBgIndex((prev) => {
      let newIndex = Math.floor(Math.random() * loadedImages.length);
      if (newIndex === prev && loadedImages.length > 1) {
        newIndex = (newIndex + 1) % loadedImages.length;
      }
      return newIndex;
    });
  }, [nextSurah, loadedImages.length, selectedReciters]);

  // Move to next ayah
  function handleNextAyah() {
    setCurrentAyahIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= currentSurah.surahAyahs.length) {
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
            <strong>{currentSurah?.surahName}</strong>
          </div>

          {/** Audio player + fallback while lazy-loading */}
          {currentSurah?.surahAyahs[currentAyahIndex] ? (
            <Suspense fallback={<div>Loading audio...</div>}>
              <SurahAudioPlayerLazy
                key={`${currentSurah.surahAyahs[currentAyahIndex].surah_number}-${currentSurah.surahAyahs[currentAyahIndex].localAyahNumber}`}
                ayah={currentSurah.surahAyahs[currentAyahIndex]}
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

          <div className="controls">
            <button className="no-drag" onClick={() => setIsPlaying((prev) => !prev)}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button className="no-drag" onClick={stopPlayback}>
              <FaStop />
            </button>
            <button className="no-drag" onClick={skipToNextSurah}>
              <FaStepForward />
            </button>
            <button 
              className="no-drag" 
              onClick={() => setShowReciterSelection(prev => !prev)}
            >
              <FaUsers />
            </button>
          </div>

          {showReciterSelection && (
            <div className="reciter-selection-panel">
              <h4>Select Reciters</h4>
              {ALL_RECITERS.map((reciter) => (
                <label key={reciter.reciterName} className="no-drag">
                  <input
                    type="checkbox"
                    checked={selectedReciters.includes(reciter.reciterName)}
                    onChange={() => toggleReciter(reciter.reciterName)}
                  />
                  {reciter.reciterName}
                </label>
              ))}
            </div>
          )}

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
      {nextSurah?.surahAyahs[0] && (
        <audio
          src={nextSurah.surahAyahs[0].audio_url}
          preload="auto"
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
}