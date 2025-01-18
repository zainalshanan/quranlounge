import React, { useRef, useEffect, useState } from 'react';

export default function SurahAudioPlayer({
  ayah,                // now has { surah_number, localAyahNumber, segments, ... }
  isPlaying,
  volume,
  transcriptionData,
  setCurrentSubtitle,
  onAyahEnded
}) {
  const audioRef = useRef(null);
  const [lastActiveSegment, setLastActiveSegment] = useState(null);

  // Reset whenever ayah changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setCurrentSubtitle('');
    setLastActiveSegment(null);
  }, [ayah, setCurrentSubtitle]);

  // Handle play/pause & volume changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error('Audio play error:', err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, volume]);

  // Called each time audio time updates
  function handleTimeUpdate() {
    if (!audioRef.current) return;

    // Safely parse segments if needed
    let parsedSegments = ayah.segments || [];
    if (typeof parsedSegments === 'string') {
      try {
        parsedSegments = JSON.parse(parsedSegments);
      } catch (err) {
        console.warn('Failed to parse segments:', err);
        parsedSegments = [];
      }
    }

    const currentTimeMs = audioRef.current.currentTime * 1000;

    // Look for the segment that matches current time
    const activeSegment = parsedSegments.find((seg) => {
      // seg might be [0,1,0,720] => start=seg[2], end=seg[3]
      const start = seg[2];
      const end = seg[3];
      return currentTimeMs >= start && currentTimeMs <= end;
    });

    if (activeSegment && activeSegment !== lastActiveSegment) {
      setLastActiveSegment(activeSegment);

      // locationKey => "surahNumber:localAyahNumber" e.g. "1:1"
      const locationKey = `${ayah.surah_number}:${ayah.localAyahNumber}`;
      const foundText = transcriptionData[locationKey]?.text || '';
      setCurrentSubtitle(foundText);
    }
  }

  // When the audio finishes playing, go to next ayah
  function handleEnded() {
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
