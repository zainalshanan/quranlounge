import React from 'react';
import { FaPlay, FaPause, FaForward } from 'react-icons/fa';

const Controls = ({ isPlaying, onPlayPause, onNext }) => {
  return (
    <div className="controls">
      <button onClick={onPlayPause}>
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      <button onClick={onNext}>
        <FaForward />
      </button>
    </div>
  );
};

export default Controls;
