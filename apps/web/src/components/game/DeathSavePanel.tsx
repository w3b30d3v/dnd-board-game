'use client';

/**
 * DeathSavePanel
 * UI for death saving throws when a character is at 0 HP
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Skull,
  Heart,
  Shield,
  X,
  Dice1,
} from 'lucide-react';

interface DeathSaveState {
  successes: number;
  failures: number;
}

interface DeathSavePanelProps {
  isOpen: boolean;
  creatureName: string;
  creatureId: string;
  deathSaves: DeathSaveState;
  onRollDeathSave: (creatureId: string) => Promise<{
    roll: number;
    totalSuccesses: number;
    totalFailures: number;
    stabilized: boolean;
    dead: boolean;
    regainedConsciousness: boolean;
  }>;
  onClose: () => void;
  onStabilized?: (creatureId: string) => void;
  onDeath?: (creatureId: string) => void;
  onRegainConsciousness?: (creatureId: string) => void;
}

export function DeathSavePanel({
  isOpen,
  creatureName,
  creatureId,
  deathSaves,
  onRollDeathSave,
  onClose,
  onStabilized,
  onDeath,
  onRegainConsciousness,
}: DeathSavePanelProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [result, setResult] = useState<'rolling' | 'success' | 'failure' | 'critical_success' | 'critical_failure' | 'stabilized' | 'dead' | 'conscious' | null>(null);
  const [localDeathSaves, setLocalDeathSaves] = useState(deathSaves);

  // Sync local state with prop
  useEffect(() => {
    setLocalDeathSaves(deathSaves);
  }, [deathSaves]);

  // Handle death save roll
  const handleRollDeathSave = useCallback(async () => {
    if (isRolling) return;

    setIsRolling(true);
    setResult('rolling');
    setLastRoll(null);

    // Animate dice rolling
    const rollAnimation = setInterval(() => {
      setLastRoll(Math.floor(Math.random() * 20) + 1);
    }, 100);

    // Add suspense delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    clearInterval(rollAnimation);

    try {
      const saveResult = await onRollDeathSave(creatureId);

      setLastRoll(saveResult.roll);
      setLocalDeathSaves({
        successes: saveResult.totalSuccesses,
        failures: saveResult.totalFailures,
      });

      // Determine result type
      if (saveResult.dead) {
        setResult('dead');
        setTimeout(() => {
          onDeath?.(creatureId);
        }, 2000);
      } else if (saveResult.regainedConsciousness) {
        setResult('conscious');
        setTimeout(() => {
          onRegainConsciousness?.(creatureId);
          onClose();
        }, 2000);
      } else if (saveResult.stabilized) {
        setResult('stabilized');
        setTimeout(() => {
          onStabilized?.(creatureId);
          onClose();
        }, 2000);
      } else if (saveResult.roll === 20) {
        setResult('critical_success');
      } else if (saveResult.roll === 1) {
        setResult('critical_failure');
      } else if (saveResult.roll >= 10) {
        setResult('success');
      } else {
        setResult('failure');
      }
    } catch (error) {
      console.error('Death save error:', error);
      setResult(null);
    } finally {
      setIsRolling(false);
    }
  }, [creatureId, isRolling, onClose, onDeath, onRegainConsciousness, onRollDeathSave, onStabilized]);

  // Get result message
  const getResultMessage = (): { text: string; color: string } => {
    switch (result) {
      case 'rolling':
        return { text: 'Rolling...', color: 'text-white' };
      case 'critical_success':
        return { text: 'NATURAL 20! You regain 1 HP!', color: 'text-green-400' };
      case 'critical_failure':
        return { text: 'NATURAL 1! Two failures!', color: 'text-red-400' };
      case 'success':
        return { text: 'Success!', color: 'text-green-400' };
      case 'failure':
        return { text: 'Failure...', color: 'text-red-400' };
      case 'stabilized':
        return { text: 'Stabilized! You are no longer dying.', color: 'text-blue-400' };
      case 'dead':
        return { text: 'You have died.', color: 'text-red-500' };
      case 'conscious':
        return { text: 'You regain consciousness!', color: 'text-green-500' };
      default:
        return { text: '', color: 'text-white' };
    }
  };

  if (!isOpen) return null;

  const resultMessage = getResultMessage();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="relative w-full max-w-md bg-gradient-to-b from-gray-900 to-black rounded-xl border border-red-500/30 shadow-2xl shadow-red-500/20 overflow-hidden"
        >
          {/* Pulse Animation for Tension */}
          <motion.div
            className="absolute inset-0 bg-red-500/10"
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Header */}
          <div className="relative flex items-center justify-between px-6 py-4 border-b border-red-500/30">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="p-2 rounded-full bg-red-500/20"
              >
                <Skull className="w-6 h-6 text-red-400" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-white">Death Saving Throw</h2>
                <p className="text-sm text-gray-400">{creatureName} is dying...</p>
              </div>
            </div>
            {result !== 'dead' && result !== 'conscious' && result !== 'stabilized' && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="relative p-6 space-y-6">
            {/* Death Save Counters */}
            <div className="flex justify-center gap-8">
              {/* Successes */}
              <div className="text-center">
                <p className="text-sm text-green-400 mb-2 flex items-center justify-center gap-1">
                  <Shield className="w-4 h-4" />
                  Successes
                </p>
                <div className="flex gap-2">
                  {[0, 1, 2].map((index) => (
                    <motion.div
                      key={`success-${index}`}
                      initial={false}
                      animate={{
                        scale: localDeathSaves.successes > index ? [1, 1.3, 1] : 1,
                        backgroundColor: localDeathSaves.successes > index ? '#22c55e' : '#374151',
                      }}
                      transition={{ duration: 0.3 }}
                      className="w-8 h-8 rounded-full border-2 border-green-500/50"
                    />
                  ))}
                </div>
              </div>

              {/* Failures */}
              <div className="text-center">
                <p className="text-sm text-red-400 mb-2 flex items-center justify-center gap-1">
                  <Skull className="w-4 h-4" />
                  Failures
                </p>
                <div className="flex gap-2">
                  {[0, 1, 2].map((index) => (
                    <motion.div
                      key={`failure-${index}`}
                      initial={false}
                      animate={{
                        scale: localDeathSaves.failures > index ? [1, 1.3, 1] : 1,
                        backgroundColor: localDeathSaves.failures > index ? '#ef4444' : '#374151',
                      }}
                      transition={{ duration: 0.3 }}
                      className="w-8 h-8 rounded-full border-2 border-red-500/50"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Dice Display */}
            <div className="flex justify-center">
              <motion.div
                animate={isRolling ? {
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{
                  duration: 0.3,
                  repeat: isRolling ? Infinity : 0,
                  ease: 'linear',
                }}
                className={`w-24 h-24 rounded-xl flex items-center justify-center text-4xl font-bold border-2 ${
                  lastRoll === 20
                    ? 'bg-green-500/30 border-green-400 text-green-300 shadow-lg shadow-green-500/30'
                    : lastRoll === 1
                    ? 'bg-red-500/30 border-red-400 text-red-300 shadow-lg shadow-red-500/30'
                    : lastRoll && lastRoll >= 10
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : lastRoll
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : 'bg-gray-800 border-gray-600 text-gray-400'
                }`}
              >
                {lastRoll || '?'}
              </motion.div>
            </div>

            {/* Result Message */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <p className={`text-lg font-semibold ${resultMessage.color}`}>
                  {resultMessage.text}
                </p>
              </motion.div>
            )}

            {/* Rules Reminder */}
            <div className="p-3 bg-black/50 rounded-lg border border-white/10">
              <p className="text-xs text-gray-500">
                <strong className="text-gray-400">Rules:</strong> Roll 10 or higher to succeed.
                Natural 20 = regain 1 HP and wake up.
                Natural 1 = 2 failures.
                3 successes = stable.
                3 failures = death.
              </p>
            </div>

            {/* Roll Button */}
            {result !== 'dead' && result !== 'conscious' && result !== 'stabilized' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRollDeathSave}
                disabled={isRolling}
                className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
                  isRolling
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500 shadow-lg shadow-red-500/30'
                }`}
              >
                <Dice1 className="w-6 h-6" />
                {isRolling ? 'Rolling...' : 'Roll Death Save'}
              </motion.button>
            )}

            {/* Death Result */}
            {result === 'dead' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Skull className="w-16 h-16 mx-auto text-red-500" />
                </motion.div>
                <p className="text-red-400 text-lg font-semibold">
                  {creatureName} has fallen...
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Conscious Result */}
            {result === 'conscious' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.5,
                  }}
                >
                  <Heart className="w-16 h-16 mx-auto text-green-500" />
                </motion.div>
                <p className="text-green-400 text-lg font-semibold">
                  {creatureName} regains consciousness!
                </p>
              </motion.div>
            )}

            {/* Stabilized Result */}
            {result === 'stabilized' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: 3,
                  }}
                >
                  <Shield className="w-16 h-16 mx-auto text-blue-500" />
                </motion.div>
                <p className="text-blue-400 text-lg font-semibold">
                  {creatureName} is stabilized!
                </p>
                <p className="text-sm text-gray-400">
                  Still unconscious, but no longer dying.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DeathSavePanel;
