import React, { useState, useEffect } from 'react';
import SurahAudioPlayer from './SurahAudioPlayer';
import './App.css';

// Icons (from react-icons for example)
import { FaPlay, FaPause, FaStepForward, FaVolumeUp, FaEye, FaEyeSlash } from 'react-icons/fa';

// Your single or multiple reciters (ayah-based JSON)
import reciterData from './AbdulBasetAbdulSamadRecitation.json';
// Additional reciters can be placed in the array if you have them
const ALL_RECITERS = [reciterData];

// Uthmani transcription
import transcriptionData from './Uthmani.json';

// Helper: pick a random item
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function App() {
  const [currentSurahAyahs, setCurrentSurahAyahs] = useState([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);

  // For controlling playback & volume
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // Show/hide the transcription text
  const [showTranscription, setShowTranscription] = useState(true);
  // The actual text that appears in the center
  const [currentSubtitle, setCurrentSubtitle] = useState('');

  // Random background
  const [backgroundImageSrc, setBackgroundImageSrc] = useState('/assets/gifs/1.gif');

  // Mark data as "loaded" if needed
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // If you had a real fetch, do it here. We just set loaded = true.
    setDataLoaded(true);
    pickRandomSurah();
  }, []);

  function pickRandomSurah() {
    // 1) Pick from available reciters
    const chosenReciter = getRandomItem(ALL_RECITERS);

    // 2) Unique surah numbers
    const surahNumbers = Array.from(
      new Set(chosenReciter.map((item) => item.surah_number))
    );

    // 3) Pick one surah
    const randomSurah = getRandomItem(surahNumbers);

    // 4) Filter ayahs for that surah, sorted in ascending order
    const filtered = chosenReciter
      .filter((item) => item.surah_number === randomSurah)
      .sort((a, b) => a.ayah_number - b.ayah_number);

    // 5) Map global ayah_number => local index
    const withLocalAyahs = filtered.map((item, i) => ({
      ...item,
      localAyahNumber: i + 1,
    }));

    setCurrentSurahAyahs(withLocalAyahs);
    setCurrentAyahIndex(0);
    setCurrentSubtitle('');

    // Random background
    const randomBG = `/assets/gifs/${Math.floor(Math.random() * 5) + 1}.gif`;
    setBackgroundImageSrc(randomBG);

    // Start playback
    setIsPlaying(true);

    console.log(
      `Random Surah #${randomSurah}, total ayahs = ${withLocalAyahs.length}, BG = ${randomBG}`
    );
  }

  // Called after an ayah finishes
  function handleNextAyah() {
    setCurrentAyahIndex((prev) => {
      const next = prev + 1;
      if (next >= currentSurahAyahs.length) {
        // Surah finished => pick a new random surah
        pickRandomSurah();
        return 0;
      }
      return next;
    });
  }

  // This skip button now triggers an entirely new random surah
  function skipToNextSurah() {
    pickRandomSurah();
  }

  // The ayah object we are currently playing
  const currentAyah = currentSurahAyahs[currentAyahIndex];

  return (
    <div className="app" style={{ direction: 'rtl', textAlign: 'right' }}>
      <div className="background">
        <img src={backgroundImageSrc} alt="Background" className="background-gif" />
      </div>

      {/** Conditionally show transcription in the center */}
      {showTranscription && currentSubtitle && (
        <div className="transcription">
          <strong style={{ fontFamily: 'Scheherazade New, serif', fontSize: '1.5em' }}>
            {currentSubtitle}
          </strong>
        </div>
      )}

      <div className="player">
        {dataLoaded && currentAyah ? (
          <SurahAudioPlayer
            key={currentAyah.surah_number + '-' + currentAyah.localAyahNumber}
            ayah={currentAyah}
            isPlaying={isPlaying}
            volume={volume}
            transcriptionData={transcriptionData}
            setCurrentSubtitle={setCurrentSubtitle}
            onAyahEnded={handleNextAyah}
          />
        ) : (
          <div>Loading...</div>
        )}

        <div className="controls">
          {/* Play/Pause */}
          <button onClick={() => setIsPlaying((prev) => !prev)}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>

          {/* "Skip" to next surah */}
          <button onClick={skipToNextSurah}>
            <FaStepForward />
          </button>

          {/* Toggle transcription eye */}
          <button onClick={() => setShowTranscription((prev) => !prev)}>
            {showTranscription ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Volume */}
        <div style={{ marginTop: '10px' }}>
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
