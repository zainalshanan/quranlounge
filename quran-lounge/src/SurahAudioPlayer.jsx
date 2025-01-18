import React, { useRef, useEffect, useState } from 'react';

export default function SurahAudioPlayer({
  ayah,                // { surah_number, localAyahNumber, segments, audio_url }
  isPlaying,
  volume,
  arabicData,          // Uthmani JSON
  englishData,         // English JSON
  setCurrentArabic,
  setCurrentEnglish,
  onAyahEnded
}) {
  const audioRef = useRef(null);
  const [lastActiveSegment, setLastActiveSegment] = useState(null);

  // Fade-out in last 1.5s
  const fadeOutDuration = 1.5;
  const [baseVolume, setBaseVolume] = useState(volume);

  // Reset on new ayah
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setLastActiveSegment(null);

    // Clear parent's text
    setCurrentArabic('');
    setCurrentEnglish('');

    setBaseVolume(volume);
  }, [ayah, setCurrentArabic, setCurrentEnglish, volume]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error('Audio play error:', err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // If volume changes mid-play
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    setBaseVolume(volume);
  }, [volume]);

  function handleTimeUpdate() {
    if (!audioRef.current) return;

    const player = audioRef.current;
    const dur = player.duration;
    if (!isNaN(dur) && dur > 0) {
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

    const currentTimeMs = player.currentTime * 1000;
    const activeSegment = parsedSegments.find((seg) => {
      const [_, __, start, end] = seg;
      return currentTimeMs >= start && currentTimeMs <= end;
    });

    if (activeSegment && activeSegment !== lastActiveSegment) {
      setLastActiveSegment(activeSegment);

      const key = `${ayah.surah_number}:${ayah.localAyahNumber}`;
      const foundArabic = arabicData[key]?.text || '';
      let foundEnglish = englishData[key]?.t || '';

      // Remove leading commas/spaces/punctuation
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
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      autoPlay
    />
  );
}
