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
  fadeInDuration = 0.0,
  fadeOutDuration = 0.0
}) {
  const audioRef = useRef(null);
  const [lastActiveSegment, setLastActiveSegment] = useState(null);
  const [baseVolume, setBaseVolume] = useState(volume);

  // Reset ONLY when ayah changes
  useEffect(() => {
    if (!audioRef.current) return;
    // Only reset when ayah changes
    audioRef.current.currentTime = 0;
    audioRef.current.volume = volume; // set volume once
    setLastActiveSegment(null);
    setCurrentArabic('');
    setCurrentEnglish('');
    setBaseVolume(volume);
  }, [ayah, setCurrentArabic, setCurrentEnglish]); 
  // ^ remove "volume" from here
  
  // separate effect just for changing volume in real-time
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setBaseVolume(volume);
  }, [volume]);

  // Play/pause logic
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => console.error('Audio play error:', err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  function handleTimeUpdate() {
    if (!audioRef.current) return;
    const player = audioRef.current;
    const dur = player.duration;

    // Optional fade in/out approach
    if (dur > 0 && !isNaN(dur)) {
      const timeLeft = dur - player.currentTime;
      // Fade in if within fadeInDuration
      if (player.currentTime <= fadeInDuration) {
        const fraction = player.currentTime / fadeInDuration;
        player.volume = baseVolume * fraction;
      }
      // Fade out near the end
      else if (timeLeft <= fadeOutDuration && timeLeft > 0) {
        const fraction = timeLeft / fadeOutDuration;
        player.volume = baseVolume * fraction;
      } else {
        // Maintain normal volume
        player.volume = baseVolume;
      }
    }

    // Update displayed text
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
      const [, , start, end] = seg;
      return currentTimeMs >= start && currentTimeMs <= end;
    });

    if (activeSegment && activeSegment !== lastActiveSegment) {
      setLastActiveSegment(activeSegment);
      const locationKey = `${ayah.surah_number}:${ayah.localAyahNumber}`;

      const foundArabic = arabicData[locationKey]?.text || '';
      let foundEnglish = englishData[locationKey]?.t || '';
      foundEnglish = foundEnglish.replace(/^[,\.\s]+/, '').trim();

      setCurrentArabic(foundArabic);
      setCurrentEnglish(foundEnglish);
    }
  }

  function handleEnded() {
    if (audioRef.current) {
      audioRef.current.volume = volume; // reset volume
    }
    onAyahEnded();
  }

  return (
    <audio
      ref={audioRef}
      src={ayah.audio_url}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
    />
  );
}
