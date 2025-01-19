import React, { useRef, useEffect, useState } from 'react';

export default function SurahAudioPlayer({
  ayah,
  isPlaying,
  volume,
  arabicData,
  englishData,
  setCurrentArabic,
  setCurrentEnglish,
  onAyahEnded,
  fadeInDuration = 0.0,  // defaults if not provided
  fadeOutDuration = 0.0
}) {
  const audioRef = useRef(null);
  const [lastActiveSegment, setLastActiveSegment] = useState(null);
  const [baseVolume, setBaseVolume] = useState(volume);

  // Reset on new ayah
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setLastActiveSegment(null);
    setCurrentArabic('');
    setCurrentEnglish('');
    setBaseVolume(volume);
  }, [ayah, volume, setCurrentArabic, setCurrentEnglish]);

  // Play/pause logic
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => console.error('Audio play error:', err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Volume changes in real time
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setBaseVolume(volume);
  }, [volume]);

  // Time updates for fade in/out + updating displayed text
  function handleTimeUpdate() {
    if (!audioRef.current) return;
    const player = audioRef.current;
    const dur = player.duration;

    if (dur < 4) {
      // skip fade out
      player.volume = baseVolume;}

    // Fade in at the start
    else if (player.currentTime <= fadeInDuration) {
      const fraction = player.currentTime / fadeInDuration;
      player.volume = baseVolume * fraction;
    }
    // Fade out near the end
    else if (!isNaN(dur) && dur > 0) {
      const timeLeft = dur - player.currentTime;
      if (timeLeft <= fadeOutDuration && timeLeft > 0) {
        const fraction = timeLeft / fadeOutDuration;
        player.volume = baseVolume * fraction;
      } else {
        player.volume = baseVolume;
      }
    }

    // Attempt to map time to a segment => update Arabic/English lines
    let parsedSegments = ayah.segments || [];
    if (typeof parsedSegments === 'string') {
      try {
        parsedSegments = JSON.parse(parsedSegments);
      } catch {
        parsedSegments = [];
      }
    }

    const currentTimeMs = player.currentTime * 1000;
    const activeSegment = parsedSegments.find((seg) => {
      const [ , , start, end ] = seg;
      return currentTimeMs >= start && currentTimeMs <= end;
    });

    if (activeSegment && activeSegment !== lastActiveSegment) {
      setLastActiveSegment(activeSegment);
      const locationKey = `${ayah.surah_number}:${ayah.localAyahNumber}`;

      const foundArabic = arabicData[locationKey]?.text || '';
      let foundEnglish = englishData[locationKey]?.t || '';
      // Clean up leading punctuation/spaces
      foundEnglish = foundEnglish.replace(/^[,\.\s]+/, '').trim();

      setCurrentArabic(foundArabic);
      setCurrentEnglish(foundEnglish);
    }
  }

  // When audio ends, move on
  function handleEnded() {
    if (audioRef.current) {
      audioRef.current.volume = volume; // reset volume
    }
    
    setTimeout(() => {
      onAyahEnded();
    }, 0);
  }

  return (
    <audio
      ref={audioRef}
      src={ayah.audio_url}
      autoPlay
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
    />
  );
}
