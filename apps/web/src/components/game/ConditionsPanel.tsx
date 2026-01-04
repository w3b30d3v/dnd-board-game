'use client';

/**
 * ConditionsPanel
 * DM tool for applying and removing conditions to creatures
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EyeOff,
  Heart,
  EarOff,
  Zap,
  Ghost,
  Shield,
  ShieldOff,
  Moon,
  Skull,
  AlertTriangle,
  Anchor,
  Hand,
  X,
  Check,
  Plus,
  Minus,
} from 'lucide-react';
import type { Creature } from '@/game/types';

// D&D 5e condition types
export type ConditionType =
  | 'BLINDED'
  | 'CHARMED'
  | 'DEAFENED'
  | 'EXHAUSTION'
  | 'FRIGHTENED'
  | 'GRAPPLED'
  | 'INCAPACITATED'
  | 'INVISIBLE'
  | 'PARALYZED'
  | 'PETRIFIED'
  | 'POISONED'
  | 'PRONE'
  | 'RESTRAINED'
  | 'STUNNED'
  | 'UNCONSCIOUS';

// Condition display info
const CONDITIONS: Array<{
  id: ConditionType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hasLevels?: boolean;
}> = [
  {
    id: 'BLINDED',
    name: 'Blinded',
    description: 'Cannot see. Attack rolls have disadvantage. Attacks against have advantage.',
    icon: EyeOff,
    color: '#64748B',
  },
  {
    id: 'CHARMED',
    name: 'Charmed',
    description: "Cannot attack charmer. Charmer has advantage on social checks.",
    icon: Heart,
    color: '#EC4899',
  },
  {
    id: 'DEAFENED',
    name: 'Deafened',
    description: 'Cannot hear. Fails checks requiring hearing.',
    icon: EarOff,
    color: '#6B7280',
  },
  {
    id: 'EXHAUSTION',
    name: 'Exhaustion',
    description: 'Cumulative penalties (1-6). Level 6 causes death.',
    icon: Zap,
    color: '#EAB308',
    hasLevels: true,
  },
  {
    id: 'FRIGHTENED',
    name: 'Frightened',
    description: 'Disadvantage on checks and attacks while fear source visible.',
    icon: AlertTriangle,
    color: '#F97316',
  },
  {
    id: 'GRAPPLED',
    name: 'Grappled',
    description: 'Speed is 0. Cannot benefit from speed bonuses.',
    icon: Hand,
    color: '#84CC16',
  },
  {
    id: 'INCAPACITATED',
    name: 'Incapacitated',
    description: 'Cannot take actions or reactions.',
    icon: ShieldOff,
    color: '#F59E0B',
  },
  {
    id: 'INVISIBLE',
    name: 'Invisible',
    description: 'Cannot be seen. Attacks against have disadvantage.',
    icon: Ghost,
    color: '#06B6D4',
  },
  {
    id: 'PARALYZED',
    name: 'Paralyzed',
    description: 'Incapacitated, cannot move/speak. Auto-fails STR/DEX saves. Auto-crit within 5ft.',
    icon: Anchor,
    color: '#8B5CF6',
  },
  {
    id: 'PETRIFIED',
    name: 'Petrified',
    description: 'Transformed to stone. Incapacitated. Resistance to all damage.',
    icon: Shield,
    color: '#78716C',
  },
  {
    id: 'POISONED',
    name: 'Poisoned',
    description: 'Disadvantage on attack rolls and ability checks.',
    icon: Skull,
    color: '#22C55E',
  },
  {
    id: 'PRONE',
    name: 'Prone',
    description: 'Must crawl. Disadvantage on attacks. Attacks within 5ft have advantage.',
    icon: Anchor,
    color: '#A16207',
  },
  {
    id: 'RESTRAINED',
    name: 'Restrained',
    description: 'Speed 0. Disadvantage on attacks and DEX saves. Attacks against have advantage.',
    icon: Anchor,
    color: '#DC2626',
  },
  {
    id: 'STUNNED',
    name: 'Stunned',
    description: 'Incapacitated, cannot move. Auto-fails STR/DEX saves.',
    icon: Zap,
    color: '#3B82F6',
  },
  {
    id: 'UNCONSCIOUS',
    name: 'Unconscious',
    description: 'Incapacitated, unaware. Drops items, falls prone. Auto-crit within 5ft.',
    icon: Moon,
    color: '#1E293B',
  },
];

interface ConditionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  creature: Creature | null;
  currentConditions: ConditionType[];
  exhaustionLevel?: number;
  onApplyCondition: (creatureId: string, condition: ConditionType, level?: number) => void;
  onRemoveCondition: (creatureId: string, condition: ConditionType) => void;
}

export function ConditionsPanel({
  isOpen,
  onClose,
  creature,
  currentConditions,
  exhaustionLevel = 0,
  onApplyCondition,
  onRemoveCondition,
}: ConditionsPanelProps) {
  const [selectedCondition, setSelectedCondition] = useState<ConditionType | null>(null);
  const [tempExhaustionLevel, setTempExhaustionLevel] = useState(exhaustionLevel);
  const [showConfirmRemove, setShowConfirmRemove] = useState<ConditionType | null>(null);

  // Toggle condition
  const handleToggleCondition = useCallback((condition: ConditionType) => {
    if (!creature) return;

    if (currentConditions.includes(condition)) {
      // Show confirm for removing certain dangerous conditions
      if (['UNCONSCIOUS', 'PARALYZED', 'PETRIFIED'].includes(condition)) {
        setShowConfirmRemove(condition);
      } else {
        onRemoveCondition(creature.id, condition);
      }
    } else {
      if (condition === 'EXHAUSTION') {
        setSelectedCondition(condition);
      } else {
        onApplyCondition(creature.id, condition);
      }
    }
  }, [creature, currentConditions, onApplyCondition, onRemoveCondition]);

  // Apply exhaustion level
  const handleApplyExhaustion = useCallback(() => {
    if (!creature) return;
    onApplyCondition(creature.id, 'EXHAUSTION', tempExhaustionLevel);
    setSelectedCondition(null);
  }, [creature, tempExhaustionLevel, onApplyCondition]);

  // Confirm remove
  const handleConfirmRemove = useCallback(() => {
    if (!creature || !showConfirmRemove) return;
    onRemoveCondition(creature.id, showConfirmRemove);
    setShowConfirmRemove(null);
  }, [creature, showConfirmRemove, onRemoveCondition]);

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
          className="relative w-full max-w-2xl max-h-[85vh] bg-gradient-to-b from-[#1E1B26] to-[#0d0a14] rounded-xl border border-purple-500/30 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-purple-900/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <AlertTriangle className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Conditions</h2>
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

          {/* Current Conditions */}
          {currentConditions.length > 0 && (
            <div className="px-6 py-3 bg-red-900/20 border-b border-red-500/20">
              <p className="text-xs text-red-400 mb-2">Active Conditions:</p>
              <div className="flex flex-wrap gap-2">
                {currentConditions.map((cond) => {
                  const condInfo = CONDITIONS.find((c) => c.id === cond);
                  if (!condInfo) return null;
                  const Icon = condInfo.icon;
                  return (
                    <span
                      key={cond}
                      className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                      style={{ backgroundColor: `${condInfo.color}30`, color: condInfo.color }}
                    >
                      <Icon className="w-3 h-3" />
                      {condInfo.name}
                      {cond === 'EXHAUSTION' && ` (${exhaustionLevel})`}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conditions Grid */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-180px)]">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CONDITIONS.map((condition) => {
                const isActive = currentConditions.includes(condition.id);
                const Icon = condition.icon;

                return (
                  <motion.button
                    key={condition.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleToggleCondition(condition.id)}
                    disabled={!creature}
                    className={`relative p-3 rounded-lg border transition-all text-left ${
                      isActive
                        ? 'border-2'
                        : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{
                      borderColor: isActive ? condition.color : undefined,
                      backgroundColor: isActive ? `${condition.color}20` : undefined,
                    }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div
                        className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: condition.color }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: condition.color }}><Icon className="w-4 h-4" /></span>
                      <span className="font-medium text-white text-sm">{condition.name}</span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{condition.description}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Exhaustion Level Selector */}
          <AnimatePresence>
            {selectedCondition === 'EXHAUSTION' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-0 left-0 right-0 bg-[#1E1B26] border-t border-yellow-500/30 p-4"
              >
                <h3 className="text-yellow-400 font-medium mb-3">Set Exhaustion Level</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setTempExhaustionLevel(Math.max(0, tempExhaustionLevel - 1))}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    <Minus className="w-5 h-5 text-white" />
                  </button>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      {[1, 2, 3, 4, 5, 6].map((level) => (
                        <button
                          key={level}
                          onClick={() => setTempExhaustionLevel(level)}
                          className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                            tempExhaustionLevel >= level
                              ? level === 6
                                ? 'bg-red-500 text-white'
                                : 'bg-yellow-500 text-black'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {tempExhaustionLevel === 0 && 'No exhaustion'}
                      {tempExhaustionLevel === 1 && 'Disadvantage on ability checks'}
                      {tempExhaustionLevel === 2 && 'Speed halved'}
                      {tempExhaustionLevel === 3 && 'Disadvantage on attacks and saves'}
                      {tempExhaustionLevel === 4 && 'HP maximum halved'}
                      {tempExhaustionLevel === 5 && 'Speed reduced to 0'}
                      {tempExhaustionLevel === 6 && 'DEATH'}
                    </div>
                  </div>
                  <button
                    onClick={() => setTempExhaustionLevel(Math.min(6, tempExhaustionLevel + 1))}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setSelectedCondition(null)}
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyExhaustion}
                    className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-medium rounded-lg"
                  >
                    Apply Exhaustion
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirm Remove Dialog */}
          <AnimatePresence>
            {showConfirmRemove && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-[#1E1B26] border border-red-500/30 rounded-lg p-6 max-w-sm"
                >
                  <h3 className="text-white font-medium mb-2">Remove Condition?</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Are you sure you want to remove{' '}
                    <span className="text-red-400">
                      {CONDITIONS.find((c) => c.id === showConfirmRemove)?.name}
                    </span>{' '}
                    from {creature?.name}?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirmRemove(null)}
                      className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmRemove}
                      className="flex-1 py-2 bg-red-500 hover:bg-red-400 text-white font-medium rounded-lg"
                    >
                      Remove
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

export default ConditionsPanel;
