'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useImmersive } from '@/components/immersion/ImmersiveProvider';

export function AudioControls() {
  const { masterVolume, setMasterVolume, isMuted, toggleMute } = useImmersive();
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="relative">
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowControls(!showControls)}
        className={`p-2 rounded-lg transition-colors ${
          showControls ? 'bg-primary/20 text-primary' : 'bg-bg-elevated hover:bg-border'
        }`}
        title="Audio Settings"
      >
        {isMuted ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </motion.button>

      {/* Controls Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-56 bg-bg-card border border-border rounded-lg shadow-xl p-4 z-50"
          >
            <div className="text-xs font-medium text-text-primary mb-3">Audio Settings</div>

            {/* Master Volume */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                <span>Master Volume</span>
                <span>{Math.round(masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={masterVolume * 100}
                onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
                className="w-full h-2 bg-bg-elevated rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Mute Toggle */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleMute}
              className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                isMuted
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              }`}
            >
              {isMuted ? 'Unmute Audio' : 'Mute Audio'}
            </motion.button>

            {/* Audio Tips */}
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] text-text-muted">
                Audio includes ambient sounds, music, and sound effects that respond to gameplay.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
