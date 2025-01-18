import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
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

// --- Multiple Reciters ---
import reciter1 from './AbdulBasetAbdulSamadRecitation.json';
import reciter2 from './yasseraldossari.json';

// Flatten all reciters into one large array of ayah-level data
const ALL_AYAH_DATA = [...reciter1, ...reciter2];

// Arabic text
import transcriptionData from './Uthmani.json';
// English text
import translationData from './English.json';

// Helper to pick a random item
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function App() {
  const [currentSurahAyahs, setCurrentSurahAyahs] = useState([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // Show/hide entire text region
  const [showTranscription, setShowTranscription] = useState(true);

  // Arabic & English lines from the child
  const [currentArabic, setCurrentArabic] = useState('');
  const [currentEnglish, setCurrentEnglish] = useState('');

  // Background
  const [backgroundImageSrc, setBackgroundImageSrc] = useState('/assets/gifs/1.gif');
  const [dataLoaded, setDataLoaded] = useState(false);

  // "arabic" | "english" | "both"
  const [textMode, setTextMode] = useState('arabic');

  // On mount, treat data as "loaded" and pick random surah
  useEffect(() => {
    setDataLoaded(true);
    pickRandomSurah();
  }, []);

  // --- Random Surah Across *All* Reciters ---
  function pickRandomSurah() {
    if (!ALL_AYAH_DATA.length) return;

    const allSurahNumbers = Array.from(
      new Set(ALL_AYAH_DATA.map((a) => a.surah_number))
    );
    const randomSurahNumber = getRandomItem(allSurahNumbers);

    const filtered = ALL_AYAH_DATA
      .filter((item) => item.surah_number === randomSurahNumber)
      .sort((a, b) => a.ayah_number - b.ayah_number);

    const withLocalAyahs = filtered.map((item, i) => ({
      ...item,
      localAyahNumber: i + 1,
    }));

    setCurrentSurahAyahs(withLocalAyahs);
    setCurrentAyahIndex(0);

    setCurrentArabic('');
    setCurrentEnglish('');

    const randomBG = `/assets/gifs/${Math.floor(Math.random() * 5) + 1}.gif`;
    setBackgroundImageSrc(randomBG);

    setIsPlaying(true);
    console.log(
      `Random Surah #${randomSurahNumber}, total ayahs=${withLocalAyahs.length}, BG=${randomBG}`
    );
  }

  // Move to next ayah in the current surah
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

  // The skip button => new random surah
  function skipToNextSurah() {
    pickRandomSurah();
  }

  const currentAyah = currentSurahAyahs[currentAyahIndex];

  // --------------- TEXT DISPLAY ---------------
  let textContent = null;
  if (showTranscription) {
    if (textMode === 'arabic' && currentArabic) {
      textContent = (
        <div style={{ fontSize: '2rem', textAlign: 'center' }}>{currentArabic}</div>
      );
    } else if (textMode === 'english' && currentEnglish) {
      textContent = (
        <div style={{ fontSize: '2rem', direction: 'ltr', textAlign: 'left' }}>
          {currentEnglish}
        </div>
      );
    } else if (textMode === 'both' && (currentArabic || currentEnglish)) {
      textContent = (
        <div>
          <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' }}>
            {currentArabic}
          </div>
          <div style={{ fontSize: '1.3rem', direction: 'ltr', textAlign: 'left' }}>
            {currentEnglish}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="app">
      <div className="background">
        <img src={backgroundImageSrc} alt="Background" className="background-gif" />
      </div>

      {textContent && <div className="transcription">{textContent}</div>}

      <Draggable>
        <div
          className="player"
          style={{
            direction: 'ltr',
          }}
        >
          {/* Drag handle */}
          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              padding: '5px',
              cursor: 'grab',
              textAlign: 'center',
              borderRadius: '4px',
            }}
          >
            <strong>Drag Handle</strong>
          </div>

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

          <div className="controls" style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
            <button onClick={() => setIsPlaying((prev) => !prev)}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button onClick={skipToNextSurah}>
              <FaStepForward />
            </button>
            <button onClick={() => setShowTranscription((prev) => !prev)}>
              {showTranscription ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

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
