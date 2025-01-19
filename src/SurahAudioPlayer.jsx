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
  fadeInDuration = 0.15,  // allow defaults
  fadeOutDuration = 0.5,
}) {
  const audioRef = useRef(null);
  const [lastActiveSegment, setLastActiveSegment] = useState(null);
  const [baseVolume, setBaseVolume] = useState(volume);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setLastActiveSegment(null);
    setCurrentArabic('');
    setCurrentEnglish('');
    setBaseVolume(volume);
  }, [ayah, volume, setCurrentArabic, setCurrentEnglish]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => console.error('Audio play error:', err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

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

    // Fade in at start
    if (player.currentTime <= fadeInDuration) {
      const fraction = player.currentTime / fadeInDuration;
      player.volume = baseVolume * fraction;
    }
    // Fade out near end
    else if (!isNaN(dur) && dur > 0) {
      const timeLeft = dur - player.currentTime;
      if (timeLeft <= fadeOutDuration && timeLeft > 0) {
        const fraction = timeLeft / fadeOutDuration;
        player.volume = baseVolume * fraction;
      } else {
        player.volume = baseVolume;
      }
    }

    // Update text from segments
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
      foundEnglish = foundEnglish.replace(/^[,\.\s]+/, '').trim();

      setCurrentArabic(foundArabic);
      setCurrentEnglish(foundEnglish);
    }
  }

  function handleEnded() {
    // Reset volume
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
