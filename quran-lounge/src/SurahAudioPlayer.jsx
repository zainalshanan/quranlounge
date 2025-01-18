import React, { useRef, useEffect, useState } from 'react';

export default function SurahAudioPlayer({
  ayah,                // includes { surah_number, localAyahNumber, segments, audio_url }
  isPlaying,
  volume,
  transcriptionData,
  setCurrentSubtitle,
  onAyahEnded
}) {
  const audioRef = useRef(null);
  const [lastActiveSegment, setLastActiveSegment] = useState(null);

  // We'll store the "baseVolume" in case user changes volume mid-play
  const [baseVolume, setBaseVolume] = useState(volume);

  // How many seconds from the end to begin fading out
  const fadeOutDuration = 1.5;

  // Reset each time a new ayah loads
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setCurrentSubtitle('');
    setLastActiveSegment(null);

    // On a new ayah, store the current "base" volume
    setBaseVolume(volume);
  }, [ayah, setCurrentSubtitle, volume]);

  // Handle play/pause & volume changes
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

  // On each 'timeupdate', we handle fade-out & transcription segments
  function handleTimeUpdate() {
    if (!audioRef.current) return;

    const player = audioRef.current;

    // 1) Fade out logic
    const dur = player.duration;
    if (!isNaN(dur) && dur > 0) {
      const timeLeft = dur - player.currentTime;
      if (timeLeft <= fadeOutDuration && timeLeft > 0) {
        // fraction goes from 1 down to 0
        const fraction = timeLeft / fadeOutDuration;
        // fade from baseVolume * fraction
        const fadeVolume = baseVolume * fraction;
        player.volume = fadeVolume;
      } else {
        // If we're not in the fade zone, keep normal volume
        player.volume = baseVolume;
      }
    }

    // 2) Transcription (time-synced segments)
    let parsedSegments = ayah.segments || [];
    if (typeof parsedSegments === 'string') {
      try {
        parsedSegments = JSON.parse(parsedSegments);
      } catch (err) {
        console.warn('Failed to parse segments:', err);
        parsedSegments = [];
      }
    }

    const currentTimeMs = player.currentTime * 1000;
    const activeSegment = parsedSegments.find((seg) => {
      const start = seg[2];
      const end = seg[3];
      return currentTimeMs >= start && currentTimeMs <= end;
    });

    if (activeSegment && activeSegment !== lastActiveSegment) {
      setLastActiveSegment(activeSegment);

      const locationKey = `${ayah.surah_number}:${ayah.localAyahNumber}`;
      const foundText = transcriptionData[locationKey]?.text || '';
      setCurrentSubtitle(foundText);
    }
  }

  function handleEnded() {
    // Reset volume for next ayah (so it doesn't remain at 0)
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    onAyahEnded();
  }

  // Also react to changes in "volume" from the parent
  // so if user adjusts volume mid-play, we treat that as new baseVolume
  useEffect(() => {
    // If the user changes the main volume while playing,
    // let's adopt it as the new baseVolume (unless we're mid-fade).
    // This is optional logic. If you prefer ignoring user changes, remove this.
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setBaseVolume(volume);
  }, [volume]);

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
