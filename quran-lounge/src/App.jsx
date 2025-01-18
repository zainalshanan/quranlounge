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
  FaEyeSlash,
} from 'react-icons/fa';

// Example reciters (some might be array-based, some object-based)
import reciter1Data from './AbdulBasetAbdulSamadRecitation.json';  // array or object
import reciter2Data from './yasseraldossari.json';                // array or object
import reciter3Data from './Haniar-RifaiRecitation.json'; 
import reciter4Data from './Mohamed Siddiq al-Minshawi Recitation.json'; 

// Uthmani Arabic
import transcriptionData from './Uthmani.json';
// English
import translationData from './English.json';

/**
 * parseReciterData: Converts the reciter JSON into a standard array of ayahs.
 * If it's already an array, return as-is.
 * If it's an object like { "1:1": {...}, "1:2": {...} }, return Object.values(...).
 */
function parseReciterData(json) {
  if (Array.isArray(json)) {
    // Already an array of ayahs
    return json;
  } else {
    // It's an object keyed by "1:1", "1:2", etc.
    return Object.values(json);
  }
}

// Convert each reciter to standard arrays
const reciter1 = parseReciterData(reciter1Data);
const reciter2 = parseReciterData(reciter2Data);
const reciter3 = parseReciterData(reciter3Data);
const reciter4 = parseReciterData(reciter4Data);

// Keep them in separate arrays so we can randomly pick a reciter
const ALL_RECITERS = [reciter1, reciter2, reciter3, reciter4];
// Surah name mapping for surah_number -> English/Transliterated name
const SURAH_NAMES = {
  1: 'Al-Fātiḥah',
  2: 'Al-Baqarah',
  3: 'Āl ʿImrān',
  4: 'An-Nisā',
  5: 'Al-Mā’idah',
  6: 'Al-Anʿām',
  7: 'Al-Aʿrāf',
  8: 'Al-Anfāl',
  9: 'At-Tawbah',
  10: 'Yūnus',
  11: 'Hūd',
  12: 'Yūsuf',
  13: 'Ar-Raʿd',
  14: 'Ibrāhīm',
  15: 'Al-Ḥijr',
  16: 'An-Nahl',
  17: 'Al-Isrā’',
  18: 'Al-Kahf',
  19: 'Maryam',
  20: 'Ṭā-Hā',
  21: 'Al-Anbiyā’',
  22: 'Al-Ḥajj',
  23: 'Al-Mu’minūn',
  24: 'An-Nūr',
  25: 'Al-Furqān',
  26: 'Ash-Shuʿarā’',
  27: 'An-Naml',
  28: 'Al-Qaṣaṣ',
  29: 'Al-ʿAnkabūt',
  30: 'Ar-Rūm',
  31: 'Luqmān',
  32: 'As-Sajdah',
  33: 'Al-Aḥzāb',
  34: 'Saba’',
  35: 'Fāṭir',
  36: 'Ya-Sīn',
  37: 'As-Ṣaffāt',
  38: 'Ṣād',
  39: 'Az-Zumar',
  40: 'Ghāfir',
  41: 'Fussilat',
  42: 'Ash-Shūrā',
  43: 'Az-Zukhruf',
  44: 'Ad-Dukhān',
  45: 'Al-Jāthiyah',
  46: 'Al-Aḥqāf',
  47: 'Muḥammad',
  48: 'Al-Fatḥ',
  49: 'Al-Ḥujurāt',
  50: 'Qāf',
  51: 'Adh-Dhāriyāt',
  52: 'At-Tūr',
  53: 'An-Najm',
  54: 'Al-Qamar',
  55: 'Ar-Raḥmān',
  56: 'Al-Wāqiʿah',
  57: 'Al-Ḥadīd',
  58: 'Al-Mujādilah',
  59: 'Al-Ḥashr',
  60: 'Al-Mumtahina',
  61: 'As-Ṣaff',
  62: 'Al-Jumuʿah',
  63: 'Al-Munāfiqūn',
  64: 'At-Taghābun',
  65: 'At-Talāq',
  66: 'At-Tahrīm',
  67: 'Al-Mulk',
  68: 'Al-Qalam',
  69: 'Al-Ḥāqqah',
  70: 'Al-Maʿārij',
  71: 'Nūḥ',
  72: 'Al-Jinn',
  73: 'Al-Muzzammil',
  74: 'Al-Muddaththir',
  75: 'Al-Qiyāmah',
  76: 'Al-Insān',
  77: 'Al-Mursalāt',
  78: 'An-Naba’',
  79: 'An-Nāziʿāt',
  80: 'Abasa',
  81: 'At-Takwīr',
  82: 'Al-Infitār',
  83: 'Al-Muṭaffifīn',
  84: 'Al-Inshiqāq',
  85: 'Al-Burūj',
  86: 'At-Tāriq',
  87: 'Al-Aʿlā',
  88: 'Al-Ghāshiyah',
  89: 'Al-Fajr',
  90: 'Al-Balad',
  91: 'Ash-Shams',
  92: 'Al-Layl',
  93: 'Adh-Dhuḥā',
  94: 'Ash-Sharḥ',
  95: 'At-Tīn',
  96: 'Al-ʿAlaq',
  97: 'Al-Qadr',
  98: 'Al-Bayyina',
  99: 'Az-Zalzalah',
  100: 'Al-ʿĀdiyāt',
  101: 'Al-Qāriʿah',
  102: 'At-Takāthur',
  103: 'Al-ʿAṣr',
  104: 'Al-Humazah',
  105: 'Al-Fīl',
  106: 'Quraysh',
  107: 'Al-Māʿūn',
  108: 'Al-Kawthar',
  109: 'Al-Kāfirūn',
  110: 'An-Nasr',
  111: 'Al-Masad',
  112: 'Al-Ikhlāṣ',
  113: 'Al-Falaq',
  114: 'An-Nās'
};

const backgroundURLs = [
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbjR1MmVkOXByYWhydnZhdGdmbzR5NmplaTY3NWJ3dzBsaHdjYjNociZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dU97uV3UyP0ly/giphy.gif',
  'https://media.giphy.com/media/c2CDTcHLscXaU5s1vK/giphy.gif?cid=790b761186j991l9hqlw55ms4i68spdr38yc5l02oso8o6av&ep=v1_gifs_search&rid=giphy.gif&ct=g',
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdzIzM3VrN3dvd2g5emNocmJjbWw0MmNpNTFkbHliMTRwcHFvMmVnaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9Z6n6Nr14rOH51TGnE/giphy.gif','https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2lwNjBkM2VwemowYzk0ZmticTNvdHB3d2M2NXJ1OTlkendqMXh6MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JPyVBbuFZkMhi/giphy.gif','https://media.giphy.com/media/dPTktM4fvh8dO/giphy.gif?cid=790b7611zesvphawaytx7jvg1uhs6rvkjs4ve4c0ldffeait&ep=v1_gifs_search&rid=giphy.gif&ct=g','https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGE4MzZ2Y2pnY2NzOHZhemx6bGZzdGI0aDl1ZmFvYXZ5OWZmM2c5diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/145uApxDPDN2py/giphy.gif','https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJrNmJrMnBzMGZ3cGh1Y2gwc2FhYjRwbnBsNzF1bjVxZTJ1MGNrbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HUhzR00v9RCjTKo/giphy.gif','https://media.giphy.com/media/bQQhvm48KehvDLSwPn/giphy.gif?cid=790b7611pt600vhn7lgmzkofs8f3o9bsck3sx830tvhemqc2&ep=v1_gifs_search&rid=giphy.gif&ct=g','https://media.giphy.com/media/q2DwjOrFktA3r3cd5D/giphy.gif?cid=ecf05e47jebbca7o883sfebng0phwpypztgkb5ymrl6wxyg0&ep=v1_gifs_search&rid=giphy.gif&ct=g',
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3I0aWhrM3pjMDlsYnAxZHZ5c3JxeGJ1eG01dTllZmRqZTN2Mzh4eiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/z8DrnSOoMQnEMNHwJH/giphy.gif',
  'https://media.giphy.com/media/KZBTBnJt59SUsvag2d/giphy.gif?cid=ecf05e4749552y4uhqgf5txudzr42wh7ulnhkmp2gqw5xjf3&ep=v1_gifs_related&rid=giphy.gif&ct=g','https://media.giphy.com/media/LKTFkDdiS8KI0/giphy.gif?cid=ecf05e4749552y4uhqgf5txudzr42wh7ulnhkmp2gqw5xjf3&ep=v1_gifs_related&rid=giphy.gif&ct=g','https://media.giphy.com/media/GaDyM2r396naHmmYlI/giphy.gif?cid=ecf05e479c0jr8qmx2gjtjvl1bqmnz71gelho4wumg1jpqpn&ep=v1_gifs_related&rid=giphy.gif&ct=g','https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2l1am54bmtvaXdvaTd2cmhlbnl3cnRza3kxcm01eGNncjR5d3VidyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hnI0Tm6F1szIY/giphy.gif',
  'https://media.giphy.com/media/Wpy9lrAfHCLp4mIT9L/giphy.gif?cid=ecf05e47er3k8vdojp1c4opt7ewb58naydpciqmixnn7dizv&ep=v1_gifs_related&rid=giphy.gif&ct=g','https://media.giphy.com/media/eJoGJF8lASakPof1h2/giphy.gif?cid=ecf05e47er3k8vdojp1c4opt7ewb58naydpciqmixnn7dizv&ep=v1_gifs_related&rid=giphy.gif&ct=g',


];
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

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // Show/hide text
  const [showTranscription, setShowTranscription] = useState(true);

  // For text from child
  const [currentArabic, setCurrentArabic] = useState('');
  const [currentEnglish, setCurrentEnglish] = useState('');

  // Background
  const [backgroundImageSrc, setBackgroundImageSrc] = useState('/assets/gifs/1.gif');
  const [dataLoaded, setDataLoaded] = useState(false);

  // "arabic" | "english" | "both"
  const [textMode, setTextMode] = useState('arabic');

  // Display surah name on the drag handle
  const [currentSurahName, setCurrentSurahName] = useState('');

  useEffect(() => {
    setDataLoaded(true);
    pickRandomSurah();
  }, []);

  /**
   * pickRandomSurah: picks a random reciter, then a random surah from that reciter
   */
  function pickRandomSurah() {
    // 1) Randomly pick one reciter array
    const chosenReciter = getRandomItem(ALL_RECITERS);
    if (!chosenReciter.length) return;

    // 2) Find all surah numbers in that reciter
    const surahNumbers = Array.from(new Set(chosenReciter.map((a) => a.surah_number)));
    const randomSurah = getRandomItem(surahNumbers);

    // 3) Filter ayahs for that surah
    const filtered = chosenReciter
      .filter((item) => item.surah_number === randomSurah)
      .sort((a, b) => a.ayah_number - b.ayah_number);

    // 4) local ayah numbering => "surah:1", "surah:2"
    const withLocalAyahs = filtered.map((item, i) => ({
      ...item,
      localAyahNumber: i + 1,
    }));

    setCurrentSurahAyahs(withLocalAyahs);
    setCurrentAyahIndex(0);

    const surahName = SURAH_NAMES[randomSurah] || `Surah #${randomSurah}`;
    setCurrentSurahName(surahName);

    // Clear old lines
    setCurrentArabic('');
    setCurrentEnglish('');

    // Function to pick either from URLs or assets folder
    const chooseBackground = () => {
        return getRandomItem(backgroundURLs);
    };
    
  
    setBackgroundImageSrc(chooseBackground());

    setIsPlaying(true);
    console.log(
      `Random surah #${randomSurah} (${surahName}), total ayahs: ${withLocalAyahs.length}`
    );
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

  // Skip entire surah
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
          <div className="arabic-line">{currentArabic}</div>
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
      {/* Background */}
      <div className="background">
        <img src={backgroundImageSrc} alt="Background" className="background-gif" />
      </div>

      {/* Transcription in the center */}
      {textContent && <div className="transcription">{textContent}</div>}

      {/* Draggable container */}
      <Draggable handle=".drag-handle">
        <div className="player" style={{ direction: 'ltr' }}>
          {/* Drag handle with surah name */}
          <div
            className="drag-handle"
            style={{
              background: 'rgba(0,0,0,0.4)',
              padding: '5px',
              cursor: 'grab',
              textAlign: 'center',
              borderRadius: '4px',
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