'use client';

/**
 * RestPanel
 * DM/Player tool for taking short and long rests per D&D 5e rules
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Sun,
  Coffee,
  Heart,
  Dice6,
  Sparkles,
  Clock,
  X,
  Check,
  AlertTriangle,
  Plus,
  Minus,
} from 'lucide-react';
import type { Creature } from '@/game/types';

interface HitDie {
  dieType: number; // d6, d8, d10, d12
  total: number;    // Total hit dice available
  remaining: number; // Current remaining
}

interface RestPanelProps {
  isOpen: boolean;
  onClose: () => void;
  creature: Creature | null;
  hitDice?: HitDie;
  currentHp: number;
  maxHp: number;
  constitutionModifier: number;
  level: number;
  spellSlotsUsed?: Record<number, number>; // Spell level -> slots used
  maxSpellSlots?: Record<number, number>;  // Spell level -> max slots
  usedAbilities?: string[]; // List of used ability names
  onShortRest: (creatureId: string, hpRecovered: number, hitDiceUsed: number) => void;
  onLongRest: (creatureId: string) => void;
}

export function RestPanel({
  isOpen,
  onClose,
  creature,
  hitDice = { dieType: 8, total: 1, remaining: 1 },
  currentHp,
  maxHp,
  constitutionModifier,
  level,
  spellSlotsUsed = {},
  maxSpellSlots = {},
  usedAbilities = [],
  onShortRest,
  onLongRest,
}: RestPanelProps) {
  const [restType, setRestType] = useState<'short' | 'long'>('short');
  const [hitDiceToSpend, setHitDiceToSpend] = useState(0);
  const [showConfirmLongRest, setShowConfirmLongRest] = useState(false);
  const [rolledHp, setRolledHp] = useState<number[]>([]);

  // Calculate hit die average
  const hitDieAverage = useMemo(() => {
    return Math.floor((hitDice.dieType + 1) / 2);
  }, [hitDice.dieType]);

  // Calculate expected HP recovery for short rest
  const expectedHpRecovery = useMemo(() => {
    if (hitDiceToSpend === 0) return 0;
    // Each hit die: average + CON modifier
    return hitDiceToSpend * (hitDieAverage + constitutionModifier);
  }, [hitDiceToSpend, hitDieAverage, constitutionModifier]);

  // Calculate actual HP recovery (from rolled dice)
  const actualHpRecovery = useMemo(() => {
    const rolled = rolledHp.reduce((sum, hp) => sum + hp + constitutionModifier, 0);
    return Math.min(rolled, maxHp - currentHp); // Cap at missing HP
  }, [rolledHp, constitutionModifier, maxHp, currentHp]);

  // Spell slots to recover on long rest
  const spellSlotsToRecover = useMemo(() => {
    const slots: Array<{ level: number; slots: number }> = [];
    for (let level = 1; level <= 9; level++) {
      const used = spellSlotsUsed[level] || 0;
      if (used > 0) {
        slots.push({ level, slots: used });
      }
    }
    return slots;
  }, [spellSlotsUsed]);

  // Roll a hit die
  const rollHitDie = useCallback(() => {
    if (hitDiceToSpend >= hitDice.remaining) return;

    const roll = Math.floor(Math.random() * hitDice.dieType) + 1;
    setRolledHp(prev => [...prev, roll]);
    setHitDiceToSpend(prev => prev + 1);
  }, [hitDiceToSpend, hitDice.remaining, hitDice.dieType]);

  // Remove a rolled hit die
  const removeHitDie = useCallback(() => {
    if (rolledHp.length === 0) return;
    setRolledHp(prev => prev.slice(0, -1));
    setHitDiceToSpend(prev => Math.max(0, prev - 1));
  }, [rolledHp.length]);

  // Reset rolls
  const resetRolls = useCallback(() => {
    setRolledHp([]);
    setHitDiceToSpend(0);
  }, []);

  // Handle short rest completion
  const handleShortRest = useCallback(() => {
    if (!creature) return;
    onShortRest(creature.id, actualHpRecovery, hitDiceToSpend);
    resetRolls();
    onClose();
  }, [creature, actualHpRecovery, hitDiceToSpend, onShortRest, resetRolls, onClose]);

  // Handle long rest completion
  const handleLongRest = useCallback(() => {
    if (!creature) return;
    onLongRest(creature.id);
    setShowConfirmLongRest(false);
    onClose();
  }, [creature, onLongRest, onClose]);

  // Calculate hit dice recovered on long rest
  const hitDiceRecoveredOnLongRest = useMemo(() => {
    return Math.max(1, Math.floor(hitDice.total / 2));
  }, [hitDice.total]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg max-h-[85vh] bg-gradient-to-b from-[#1E1B26] to-[#0d0a14] rounded-xl border border-blue-500/30 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-blue-500/20 bg-blue-900/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Moon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Take a Rest</h2>
                <p className="text-sm text-gray-400">
                  {creature?.name || 'No creature selected'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)] space-y-6">
            {/* Rest Type Selection */}
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setRestType('short')}
                className={`p-4 rounded-xl border transition-all ${
                  restType === 'short'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Coffee className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium text-white">Short Rest</div>
                <div className="text-xs text-gray-400">1+ hour</div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setRestType('long')}
                className={`p-4 rounded-xl border transition-all ${
                  restType === 'long'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Moon className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium text-white">Long Rest</div>
                <div className="text-xs text-gray-400">8+ hours</div>
              </motion.button>
            </div>

            {/* Current Status */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Current Status</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                    <Heart className="w-4 h-4" />
                    <span className="text-lg font-bold">{currentHp}</span>
                    <span className="text-gray-500">/ {maxHp}</span>
                  </div>
                  <div className="text-xs text-gray-500">Hit Points</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                    <Dice6 className="w-4 h-4" />
                    <span className="text-lg font-bold">{hitDice.remaining}</span>
                    <span className="text-gray-500">/ {hitDice.total}</span>
                  </div>
                  <div className="text-xs text-gray-500">Hit Dice (d{hitDice.dieType})</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-lg font-bold">
                      {Object.values(spellSlotsUsed).reduce((a, b) => a + b, 0)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">Slots Used</div>
                </div>
              </div>
            </div>

            {/* Short Rest Options */}
            {restType === 'short' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white">Spend Hit Dice</h3>
                    <span className="text-xs text-gray-400">
                      {hitDice.remaining} remaining
                    </span>
                  </div>

                  {/* Hit Dice Rolling */}
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                    {/* Rolled Dice Display */}
                    {rolledHp.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {rolledHp.map((roll, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="w-10 h-10 bg-blue-500/20 border border-blue-500 rounded-lg flex items-center justify-center"
                          >
                            <span className="text-blue-400 font-bold">{roll}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Roll Controls */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={removeHitDie}
                        disabled={rolledHp.length === 0}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-5 h-5 text-white" />
                      </button>

                      <button
                        onClick={rollHitDie}
                        disabled={hitDiceToSpend >= hitDice.remaining}
                        className="flex-1 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Dice6 className="w-5 h-5" />
                        Roll 1d{hitDice.dieType}
                      </button>

                      <button
                        onClick={resetRolls}
                        disabled={rolledHp.length === 0}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {/* Recovery Summary */}
                    {hitDiceToSpend > 0 && (
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-green-400 text-sm">HP Recovery</span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-400 font-bold">
                              +{actualHpRecovery}
                            </span>
                            <span className="text-xs text-gray-400">
                              (rolls + {hitDiceToSpend} × CON {constitutionModifier >= 0 ? '+' : ''}{constitutionModifier})
                            </span>
                          </div>
                        </div>
                        {actualHpRecovery + currentHp >= maxHp && (
                          <div className="text-xs text-yellow-400 mt-1">
                            (Capped at max HP)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Short Rest Benefits */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <h4 className="text-amber-400 text-sm font-medium mb-2">Short Rest Benefits</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-amber-400" />
                      Spend hit dice to recover HP
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-amber-400" />
                      Recover some class abilities (Fighter: Second Wind, Action Surge, etc.)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-amber-400" />
                      Warlocks recover spell slots
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Long Rest Options */}
            {restType === 'long' && (
              <div className="space-y-4">
                {/* Long Rest Recovery Summary */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-3">
                  <h4 className="text-blue-400 text-sm font-medium">You Will Recover:</h4>

                  {/* HP Recovery */}
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-white">Hit Points</span>
                    </div>
                    <span className="text-green-400 font-medium">
                      {currentHp} → {maxHp} (+{maxHp - currentHp})
                    </span>
                  </div>

                  {/* Hit Dice Recovery */}
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <div className="flex items-center gap-2">
                      <Dice6 className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white">Hit Dice</span>
                    </div>
                    <span className="text-green-400 font-medium">
                      {hitDice.remaining} → {Math.min(hitDice.total, hitDice.remaining + hitDiceRecoveredOnLongRest)} (+{hitDiceRecoveredOnLongRest})
                    </span>
                  </div>

                  {/* Spell Slots Recovery */}
                  {spellSlotsToRecover.length > 0 && (
                    <div className="p-2 bg-white/5 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-white">Spell Slots</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {spellSlotsToRecover.map(({ level, slots }) => (
                          <span
                            key={level}
                            className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded"
                          >
                            Level {level}: +{slots}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Class Abilities */}
                  {usedAbilities.length > 0 && (
                    <div className="p-2 bg-white/5 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-white">Abilities Restored</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {usedAbilities.map((ability) => (
                          <span
                            key={ability}
                            className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded"
                          >
                            {ability}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Warning */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-amber-400 text-sm font-medium">Long Rest Requirements</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Requires 8 hours of sleep/light activity. Cannot long rest more than once per 24 hours.
                      Interrupted rest may not provide full benefits.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            {restType === 'short' ? (
              <button
                onClick={handleShortRest}
                disabled={!creature}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Coffee className="w-5 h-5" />
                Short Rest
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmLongRest(true)}
                disabled={!creature}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Moon className="w-5 h-5" />
                Long Rest
              </button>
            )}
          </div>

          {/* Confirm Long Rest Dialog */}
          <AnimatePresence>
            {showConfirmLongRest && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 flex items-center justify-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-[#1E1B26] border border-blue-500/30 rounded-lg p-6 max-w-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Moon className="w-8 h-8 text-blue-400" />
                    <div>
                      <h3 className="text-white font-medium">Confirm Long Rest</h3>
                      <p className="text-gray-400 text-sm">8 hours will pass</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    {creature?.name} will fully recover all HP, half their hit dice, all spell slots,
                    and all class abilities.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirmLongRest(false)}
                      className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLongRest}
                      className="flex-1 py-2 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-lg flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Rest
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default RestPanel;
