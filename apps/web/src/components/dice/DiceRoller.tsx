'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useImmersive } from '@/components/immersion/ImmersiveProvider';
import { usePreferencesStore } from '@/stores/preferencesStore';

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
export type RollContext = 'combat' | 'exploration' | 'important';

export interface DiceRollResult {
  dice: DiceType;
  rolls: number[];
  modifier: number;
  total: number;
  isCritical?: boolean;
  isFumble?: boolean;
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface DiceRollerProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (result: DiceRollResult) => void;
  rollType?: string; // e.g., "Attack Roll", "Saving Throw", "Ability Check"
  rollContext?: string; // e.g., "Longsword Attack", "Wisdom Save vs Fear"
  gameContext?: RollContext; // Used to determine animation based on settings
  dice?: DiceType;
  count?: number;
  modifier?: number;
  advantage?: boolean;
  disadvantage?: boolean;
  autoRoll?: boolean;
  skipAnimation?: boolean; // Can override preferences to force skip
  forceAnimation?: boolean; // Can override preferences to force animation
}

// Dice face configurations for visual display
const DICE_FACES: Record<DiceType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

// Roll a single die
function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

// Particle component for celebrations
function CelebrationParticles({ type }: { type: 'critical' | 'fumble' | 'success' }) {
  const colors = {
    critical: ['#FFD700', '#FFA500', '#FF6B6B', '#FFFFFF'],
    fumble: ['#EF4444', '#7F1D1D', '#991B1B', '#450A0A'],
    success: ['#22C55E', '#86EFAC', '#4ADE80', '#FFFFFF'],
  };

  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 400 - 200,
    y: Math.random() * 400 - 200,
    scale: Math.random() * 1.5 + 0.5,
    color: colors[type][Math.floor(Math.random() * colors[type].length)],
    delay: Math.random() * 0.3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: [0, p.scale, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 1.2,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// 3D Dice visual component
function Dice3D({
  type,
  value,
  isRolling,
  isCritical,
  isFumble,
}: {
  type: DiceType;
  value: number;
  isRolling: boolean;
  isCritical: boolean;
  isFumble: boolean;
}) {
  const diceColor = isCritical
    ? 'from-yellow-400 to-amber-600'
    : isFumble
    ? 'from-red-600 to-red-900'
    : 'from-purple-500 to-indigo-700';

  const glowColor = isCritical
    ? 'shadow-[0_0_60px_rgba(251,191,36,0.8)]'
    : isFumble
    ? 'shadow-[0_0_60px_rgba(239,68,68,0.8)]'
    : 'shadow-[0_0_30px_rgba(139,92,246,0.5)]';

  return (
    <motion.div
      className="relative"
      animate={
        isRolling
          ? {
              rotateX: [0, 360, 720, 1080],
              rotateY: [0, 180, 540, 720],
              rotateZ: [0, 90, 270, 360],
            }
          : {
              rotateX: 0,
              rotateY: 0,
              rotateZ: 0,
            }
      }
      transition={
        isRolling
          ? { duration: 1.5, ease: 'easeOut' }
          : { duration: 0.5, type: 'spring', stiffness: 200 }
      }
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
    >
      <motion.div
        className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${diceColor} ${glowColor} flex items-center justify-center relative overflow-hidden`}
        animate={
          isCritical || isFumble
            ? {
                scale: [1, 1.2, 1],
                boxShadow: isCritical
                  ? [
                      '0 0 30px rgba(251,191,36,0.5)',
                      '0 0 80px rgba(251,191,36,1)',
                      '0 0 30px rgba(251,191,36,0.5)',
                    ]
                  : [
                      '0 0 30px rgba(239,68,68,0.5)',
                      '0 0 80px rgba(239,68,68,1)',
                      '0 0 30px rgba(239,68,68,0.5)',
                    ],
              }
            : {}
        }
        transition={{ duration: 0.5, repeat: isCritical || isFumble ? 2 : 0 }}
      >
        {/* Dice texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_50%)]" />

        {/* Dice type label */}
        <span className="absolute top-2 left-2 text-xs font-bold text-white/60 uppercase">
          {type}
        </span>

        {/* Value display */}
        <AnimatePresence mode="wait">
          {!isRolling && (
            <motion.span
              key={value}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`font-cinzel font-bold ${
                type === 'd100' ? 'text-3xl' : 'text-5xl'
              } text-white drop-shadow-lg`}
            >
              {value}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Rolling animation overlay */}
        {isRolling && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.2, repeat: Infinity }}
          >
            <span className="font-cinzel text-4xl text-white/50">?</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

export function DiceRoller({
  isOpen,
  onClose,
  onComplete,
  rollType = 'Dice Roll',
  rollContext,
  gameContext = 'exploration',
  dice = 'd20',
  count = 1,
  modifier = 0,
  advantage = false,
  disadvantage = false,
  autoRoll = true,
  skipAnimation = false,
  forceAnimation = false,
}: DiceRollerProps) {
  const [phase, setPhase] = useState<'anticipation' | 'rolling' | 'result'>('anticipation');
  const [rolls, setRolls] = useState<number[]>([]);
  const [displayValue, setDisplayValue] = useState(0);
  const [finalResult, setFinalResult] = useState<DiceRollResult | null>(null);
  const { playDiceRoll } = useImmersive();

  // Get preferences
  const { preferences, shouldShowDiceAnimation, getDiceAnimationDuration } = usePreferencesStore();

  // Determine if we should animate based on preferences
  const shouldAnimate = forceAnimation
    ? true
    : skipAnimation
    ? false
    : shouldShowDiceAnimation(gameContext);

  // Get animation duration based on speed preference
  const animationDuration = getDiceAnimationDuration();

  const maxValue = DICE_FACES[dice];
  const isCritical = dice === 'd20' && displayValue === 20;
  const isFumble = dice === 'd20' && displayValue === 1;

  // Whether to show celebrations based on preference
  const showCelebrations = preferences.diceCelebrationEnabled;

  const performRoll = useCallback(() => {
    const sides = DICE_FACES[dice];
    let rollResults: number[] = [];

    if (advantage || disadvantage) {
      // Roll twice for advantage/disadvantage
      rollResults = [rollDie(sides), rollDie(sides)];
    } else {
      // Roll the specified number of dice
      rollResults = Array.from({ length: count }, () => rollDie(sides));
    }

    return rollResults;
  }, [dice, count, advantage, disadvantage]);

  const calculateTotal = useCallback(
    (rollResults: number[]): number => {
      let total: number;

      if (advantage) {
        total = Math.max(...rollResults);
      } else if (disadvantage) {
        total = Math.min(...rollResults);
      } else {
        total = rollResults.reduce((sum, r) => sum + r, 0);
      }

      return total + modifier;
    },
    [advantage, disadvantage, modifier]
  );

  const startRoll = useCallback(() => {
    if (!shouldAnimate) {
      // Instant result - no animation
      const rollResults = performRoll();
      const total = calculateTotal(rollResults);
      const usedRoll = advantage ? Math.max(...rollResults) : disadvantage ? Math.min(...rollResults) : rollResults[0];

      const result: DiceRollResult = {
        dice,
        rolls: rollResults,
        modifier,
        total,
        isCritical: dice === 'd20' && usedRoll === 20,
        isFumble: dice === 'd20' && usedRoll === 1,
        advantage,
        disadvantage,
      };

      setFinalResult(result);
      setDisplayValue(usedRoll);
      setRolls(rollResults);
      setPhase('result');

      // Still play sounds even without animation
      if (result.isCritical) {
        playDiceRoll('critical');
      } else if (result.isFumble) {
        playDiceRoll('fumble');
      } else if (total >= 15) {
        playDiceRoll('success');
      } else {
        playDiceRoll('fail');
      }

      onComplete?.(result);
      return;
    }

    // Animated roll sequence
    setPhase('rolling');

    // Randomize display during roll
    const rollInterval = setInterval(() => {
      setDisplayValue(rollDie(maxValue));
    }, 50);

    // Perform actual roll after animation (duration based on preference)
    setTimeout(() => {
      clearInterval(rollInterval);
      const rollResults = performRoll();
      const total = calculateTotal(rollResults);
      const usedRoll = advantage ? Math.max(...rollResults) : disadvantage ? Math.min(...rollResults) : rollResults[0];

      setRolls(rollResults);
      setDisplayValue(usedRoll);

      const result: DiceRollResult = {
        dice,
        rolls: rollResults,
        modifier,
        total,
        isCritical: dice === 'd20' && usedRoll === 20,
        isFumble: dice === 'd20' && usedRoll === 1,
        advantage,
        disadvantage,
      };

      setFinalResult(result);

      // Dramatic pause before reveal
      setTimeout(() => {
        setPhase('result');

        // Play appropriate sound
        if (result.isCritical) {
          playDiceRoll('critical');
        } else if (result.isFumble) {
          playDiceRoll('fumble');
        } else if (total >= 15) {
          playDiceRoll('success');
        } else {
          playDiceRoll('fail');
        }

        onComplete?.(result);
      }, 300);
    }, animationDuration);
  }, [
    shouldAnimate,
    animationDuration,
    performRoll,
    calculateTotal,
    dice,
    modifier,
    advantage,
    disadvantage,
    maxValue,
    playDiceRoll,
    onComplete,
  ]);

  // Auto-roll on open
  useEffect(() => {
    if (isOpen && autoRoll) {
      const timer = setTimeout(startRoll, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoRoll, startRoll]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setPhase('anticipation');
      setRolls([]);
      setDisplayValue(0);
      setFinalResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={phase === 'result' ? onClose : undefined}
      >
        {/* Screen shake on critical/fumble */}
        <motion.div
          className="relative"
          animate={
            phase === 'result' && (isCritical || isFumble)
              ? {
                  x: [0, -10, 10, -10, 10, 0],
                  y: [0, 5, -5, 5, -5, 0],
                }
              : {}
          }
          transition={{ duration: 0.4 }}
        >
          {/* Celebration particles (respects preference) */}
          {showCelebrations && phase === 'result' && isCritical && <CelebrationParticles type="critical" />}
          {showCelebrations && phase === 'result' && isFumble && <CelebrationParticles type="fumble" />}

          {/* Main content */}
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="bg-gradient-to-br from-bg-card to-bg-dark border border-border rounded-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background glow */}
            <div
              className={`absolute inset-0 opacity-20 ${
                isCritical
                  ? 'bg-gradient-to-br from-yellow-500 to-transparent'
                  : isFumble
                  ? 'bg-gradient-to-br from-red-500 to-transparent'
                  : 'bg-gradient-to-br from-purple-500 to-transparent'
              }`}
            />

            {/* Roll context */}
            <div className="relative text-center mb-6">
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-text-muted uppercase tracking-wider"
              >
                {rollType}
              </motion.p>
              {rollContext && (
                <motion.h2
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-cinzel text-2xl text-text-primary mt-1"
                >
                  {rollContext}
                </motion.h2>
              )}
              {(advantage || disadvantage) && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                    advantage
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {advantage ? 'ADVANTAGE' : 'DISADVANTAGE'}
                </motion.span>
              )}
            </div>

            {/* Dice display */}
            <div className="relative flex justify-center mb-6">
              <Dice3D
                type={dice}
                value={displayValue}
                isRolling={phase === 'rolling'}
                isCritical={phase === 'result' && isCritical}
                isFumble={phase === 'result' && isFumble}
              />
            </div>

            {/* Result display */}
            <AnimatePresence>
              {phase === 'result' && finalResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative text-center"
                >
                  {/* Critical/Fumble banner */}
                  {(isCritical || isFumble) && (
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className={`mb-4 py-2 px-4 rounded-lg font-cinzel text-xl font-bold ${
                        isCritical
                          ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                          : 'bg-red-500/30 text-red-300 border border-red-500/50'
                      }`}
                    >
                      {isCritical ? 'CRITICAL HIT!' : 'CRITICAL MISS!'}
                    </motion.div>
                  )}

                  {/* Advantage/Disadvantage rolls display */}
                  {(advantage || disadvantage) && rolls.length === 2 && (
                    <div className="flex justify-center gap-4 mb-3">
                      {rolls.map((roll, i) => {
                        const isUsed =
                          (advantage && roll === Math.max(...rolls)) ||
                          (disadvantage && roll === Math.min(...rolls));
                        return (
                          <span
                            key={i}
                            className={`text-lg ${
                              isUsed ? 'text-primary font-bold' : 'text-text-muted line-through'
                            }`}
                          >
                            {roll}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex items-center justify-center gap-2 text-text-secondary">
                    <span className="text-2xl">{displayValue}</span>
                    {modifier !== 0 && (
                      <>
                        <span>{modifier >= 0 ? '+' : ''}{modifier}</span>
                        <span>=</span>
                      </>
                    )}
                    <span
                      className={`text-4xl font-cinzel font-bold ${
                        isCritical
                          ? 'text-yellow-400'
                          : isFumble
                          ? 'text-red-400'
                          : 'text-primary'
                      }`}
                    >
                      {finalResult.total}
                    </span>
                  </div>

                  {/* Tap to close hint */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 text-sm text-text-muted"
                  >
                    Tap anywhere to continue
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Anticipation phase - manual roll button */}
            {phase === 'anticipation' && !autoRoll && (
              <div className="relative text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startRoll}
                  className="px-8 py-3 bg-primary text-bg-dark font-bold rounded-lg"
                >
                  Roll {count > 1 ? `${count}${dice}` : dice}
                  {modifier !== 0 && (modifier >= 0 ? `+${modifier}` : modifier)}
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DiceRoller;
