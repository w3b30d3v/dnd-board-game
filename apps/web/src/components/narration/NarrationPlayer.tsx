'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NarrationPlayerProps {
  audioUrl?: string;
  text?: string;
  speakerName?: string;
  isGenerating?: boolean;
  onClose?: () => void;
  autoPlay?: boolean;
  showSubtitles?: boolean;
  className?: string;
}

export function NarrationPlayer({
  audioUrl,
  text,
  speakerName,
  isGenerating = false,
  onClose,
  autoPlay = true,
  showSubtitles = true,
  className = '',
}: NarrationPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentWord, setCurrentWord] = useState(0);

  // Split text into words for subtitle animation
  const words = text?.split(' ') || [];

  // Auto-play when audio URL is available
  useEffect(() => {
    if (audioUrl && autoPlay && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Browser blocked autoplay - user needs to interact
      });
    }
  }, [audioUrl, autoPlay]);

  // Update progress during playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
        // Estimate current word based on progress
        if (words.length > 0) {
          setCurrentWord(Math.floor(progress * words.length));
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentWord(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [words.length, progress]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = clickX / rect.width;
    audio.currentTime = newProgress * duration;
    setProgress(newProgress);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`bg-bg-card border border-border rounded-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-bg-elevated border-b border-border">
        <div className="flex items-center gap-3">
          {/* Voice icon */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {speakerName || 'Narrator'}
            </p>
            <p className="text-xs text-text-muted">
              {isGenerating ? 'Generating...' : isPlaying ? 'Playing' : 'Ready'}
            </p>
          </div>
        </div>

        {onClose && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-dark transition-colors"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Subtitles display */}
      {showSubtitles && text && (
        <div className="px-4 py-4 min-h-[80px] flex items-center">
          <p className="text-text-primary leading-relaxed">
            {words.map((word, index) => (
              <span
                key={index}
                className={`transition-colors duration-150 ${
                  index <= currentWord ? 'text-primary' : 'text-text-secondary'
                }`}
              >
                {word}{' '}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Audio element */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}

      {/* Controls */}
      <div className="px-4 py-3 bg-bg-elevated border-t border-border">
        {/* Loading state */}
        {isGenerating && (
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                  className="w-2 h-2 bg-primary rounded-full"
                />
              ))}
            </div>
            <span className="text-sm text-text-muted">Generating voice...</span>
          </div>
        )}

        {/* Playback controls */}
        {audioUrl && !isGenerating && (
          <div className="space-y-2">
            {/* Progress bar */}
            <div
              onClick={handleSeek}
              className="h-2 bg-bg-dark rounded-full cursor-pointer overflow-hidden"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {formatTime(progress * duration)}
              </span>

              <div className="flex items-center gap-2">
                {/* Rewind 5s */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-bg-dark transition-colors"
                >
                  <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                  </svg>
                </motion.button>

                {/* Play/Pause */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlayPause}
                  className="p-3 rounded-full bg-primary text-bg-dark hover:bg-primary/90 transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </motion.button>

                {/* Forward 5s */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (audioRef.current && duration) {
                      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5);
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-bg-dark transition-colors"
                >
                  <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                  </svg>
                </motion.button>
              </div>

              <span className="text-xs text-text-muted">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default NarrationPlayer;
