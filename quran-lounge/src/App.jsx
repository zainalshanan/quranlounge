import React, { useState, useEffect } from 'react';
import SurahAudioPlayer from './SurahAudioPlayer';
import './App.css';

// Icons (Font Awesome via react-icons, or whichever you prefer)
import { FaPlay, FaPause, FaStepForward, FaVolumeUp } from 'react-icons/fa';

// Import your single or multiple reciters:
import reciterData from './AbdulBasetAbdulSamadRecitation.json';
// If you have more reciters, you can add them:
const ALL_RECITERS = [reciterData /*, reciter2Data, reciter3Data... */];

// Uthmani transcription
import transcriptionData from './Uthmani.json';

// Helper: pick a random item from an array
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function App() {
  const [currentSurahAyahs, setCurrentSurahAyahs] = useState([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);

  // For controlling playback & volume
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // Subtitle that shows in the center
  const [currentSubtitle, setCurrentSubtitle] = useState('');

  // Random background
  const [backgroundImageSrc, setBackgroundImageSrc] = useState('/assets/gifs/1.gif');

  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // If you needed to fetch, you'd do it here, but we are importing
    setDataLoaded(true);
    // Pick a random surah on mount
    pickRandomSurah();
  }, []);

  function pickRandomSurah() {
    // 1) Pick one reciter
    const chosenReciter = getRandomItem(ALL_RECITERS);

    // 2) Extract unique surah numbers
    const surahNumbers = Array.from(
      new Set(chosenReciter.map((item) => item.surah_number))
    );

    // 3) Pick a random surah
    const randomSurah = getRandomItem(surahNumbers);

    // 4) Filter all AYAH-level audio for that surah
    const filtered = chosenReciter
      .filter((item) => item.surah_number === randomSurah)
      .sort((a, b) => a.ayah_number - b.ayah_number);

    // 5) Remap the global ayah_number to a local index: i+1
    //    So if Surah 72 has items with ayah_number=5448,5449..., we now label them 1,2,...
    const withLocalAyahNumbers = filtered.map((item, i) => ({
      ...item,
      localAyahNumber: i + 1,
    }));

    setCurrentSurahAyahs(withLocalAyahNumbers);
    setCurrentAyahIndex(0);
    setCurrentSubtitle('');

    // Random background
    const randomBG = `/assets/gifs/${Math.floor(Math.random() * 5) + 1}.gif`;
    setBackgroundImageSrc(randomBG);

    // Start playback automatically
    setIsPlaying(true);

    console.log(
      `Random Surah #${randomSurah}, ayahs in surah = ${filtered.length}, BG = ${randomBG}`
    );
  }

  // Called from SurahAudioPlayer when an ayah ends
  function handleNextAyah() {
    setCurrentAyahIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= currentSurahAyahs.length) {
        // Finished the surah, pick a new random surah
        pickRandomSurah();
        return 0;
      }
      return nextIndex;
    });
  }

  // The currently playing ayah object
  const currentAyah = currentSurahAyahs[currentAyahIndex];

  // "Skip" button to go to the next ayah in the same surah
  function skipAyah() {
    setCurrentAyahIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= currentSurahAyahs.length) {
        pickRandomSurah();
        return 0;
      }
      return nextIndex;
    });
  }

  return (
    <div className="app" style={{ direction: 'rtl', textAlign: 'right' }}>
      {/* Background */}
      <div className="background">
        <img src={backgroundImageSrc} alt="Background" className="background-gif" />
      </div>

      {/* Transcription in center */}
      {currentSubtitle && (
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

        {/* Controls with icons */}
        <div className="controls">
          {/* Play/Pause Toggle */}
          <button onClick={() => setIsPlaying((prev) => !prev)}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>

          {/* Skip next ayah */}
          <button onClick={skipAyah}>
            <FaStepForward />
          </button>

          {/* Next random surah */}
          <button onClick={pickRandomSurah}>
            Next Surah
          </button>
        </div>

        {/* Volume slider */}
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
