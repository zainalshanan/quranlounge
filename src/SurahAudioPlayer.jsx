import React, { useRef, useEffect, useState } from 'react';

export default function SurahAudioPlayer({
  ayah, // { surah_number, localAyahNumber, segments, audio_url, ... }
  isPlaying,
  volume,
  arabicData,  // e.g. Uthmani
  englishData, // e.g. translation
  setCurrentArabic,
  setCurrentEnglish,
  onAyahEnded
}) {
  const audioRef = useRef(null);
  const [lastActiveSegment, setLastActiveSegment] = useState(null);

  const fadeOutDuration = 0.5;
  const fadeInDuration = 0.15;
  const [baseVolume, setBaseVolume] = useState(volume);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setLastActiveSegment(null);

    // Clear parent's text
    setCurrentArabic('');
    setCurrentEnglish('');
    setBaseVolume(volume);
  }, [ayah, volume, setCurrentArabic, setCurrentEnglish]);

  // Play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => console.error('Audio play error:', err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // React to volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setBaseVolume(volume);
  }, [volume]);

  function handleTimeUpdate() {
    if (!audioRef.current) return;
    const player = audioRef.current;
    const dur = player.duration;
  
    // Fade in at the start
    if (player.currentTime <= fadeInDuration) {
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
    
    // Parse segments if string
    let parsedSegments = ayah.segments || [];
    if (typeof parsedSegments === 'string') {
      try {
        parsedSegments = JSON.parse(parsedSegments);
      } catch {
        parsedSegments = [];
      }
    }
  
    // Find active segment
    const currentTimeMs = player.currentTime * 1000;
    const activeSegment = parsedSegments.find((seg) => {
      const start = seg[2];
      const end = seg[3];
      return currentTimeMs >= start && currentTimeMs <= end;
    });
  
    if (activeSegment && activeSegment !== lastActiveSegment) {
      setLastActiveSegment(activeSegment);
  
      // Build key => "surah_number:localAyahNumber"
      const locationKey = `${ayah.surah_number}:${ayah.localAyahNumber}`;
      const foundArabic = arabicData[locationKey]?.text || '';
      let foundEnglish = englishData[locationKey]?.t || '';
      // Remove leading punctuation
      foundEnglish = foundEnglish.replace(/^[,\.\s]+/, '').trim();
  
      setCurrentArabic(foundArabic);
      setCurrentEnglish(foundEnglish);
    }
  }
  
  function handleEnded() {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    onAyahEnded();
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
