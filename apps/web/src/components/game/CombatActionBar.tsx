'use client';

/**
 * CombatActionBar
 * Bottom bar UI for combat actions - attack, spell, item, movement, end turn
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CombatAction, CombatState } from '@/hooks/useCombat';
import type { Creature } from '@/game/types';

interface CombatActionBarProps {
  combatState: CombatState;
  currentCreature: Creature | null;
  availableActions: CombatAction[];
  validTargets: string[];
  creatures: Creature[];
  isDM: boolean;
  onSelectAction: (action: CombatAction | null) => void;
  onSelectTarget: (targetId: string | null) => void;
  onConfirmAttack: () => void;
  onCancelAction: () => void;
  onEndTurn: () => void;
  onStartCombat: () => void;
  onEndCombat: () => void;
  isInRange: (targetId: string) => boolean;
  getDistance: (id1: string, id2: string) => number;
}

// Action button definitions
const ACTION_BUTTONS = [
  { id: 'attack', label: 'Attack', icon: '⚔️', color: 'red' },
  { id: 'spell', label: 'Spell', icon: '✨', color: 'purple' },
  { id: 'item', label: 'Item', icon: '🎒', color: 'amber' },
  { id: 'move', label: 'Move', icon: '👣', color: 'blue' },
  { id: 'other', label: 'Other', icon: '⋯', color: 'gray' },
];

export function CombatActionBar({
  combatState,
  currentCreature,
  availableActions,
  validTargets,
  creatures,
  isDM,
  onSelectAction,
  onSelectTarget,
  onConfirmAttack,
  onCancelAction,
  onEndTurn,
  onStartCombat,
  onEndCombat,
  isInRange,
  getDistance,
}: CombatActionBarProps) {
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [showCombatLog, setShowCombatLog] = useState(false);

  const isMyTurn = currentCreature?.id === combatState.currentTurnCreatureId;

  // Toggle action panel
  const togglePanel = useCallback((panelId: string) => {
    setExpandedPanel(prev => (prev === panelId ? null : panelId));
    onCancelAction();
  }, [onCancelAction]);

  // Handle action selection
  const handleActionSelect = useCallback((action: CombatAction) => {
    onSelectAction(action);
    setExpandedPanel(null);
  }, [onSelectAction]);

  // Not in combat - show start combat button (DM only)
  if (!combatState.isInCombat) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur-md border-t border-border z-40"
      >
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-center gap-4">
            <div className="text-text-secondary">
              <span className="text-text-muted">Mode:</span> Exploration
            </div>
            {isDM && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartCombat}
                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium flex items-center gap-2 border border-red-500/30"
              >
                <span className="text-xl">⚔️</span>
                Start Combat
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Get target creatures for selection
  const targetCreatures = creatures.filter(c => validTargets.includes(c.id));

  return (
    <>
      {/* Target Selection Overlay */}
      <AnimatePresence>
        {combatState.isSelectingTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30"
            onClick={onCancelAction}
          >
            {/* Target Selection Panel */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-bg-card border border-border rounded-lg p-4 min-w-[300px]"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-cinzel text-primary mb-3">Select Target</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {targetCreatures.length === 0 ? (
                  <p className="text-text-muted text-sm">No valid targets in range</p>
                ) : (
                  targetCreatures.map(creature => {
                    const inRange = isInRange(creature.id);
                    const distance = currentCreature
                      ? getDistance(currentCreature.id, creature.id)
                      : 0;
                    const isSelected = combatState.selectedTargetId === creature.id;

                    return (
                      <motion.button
                        key={creature.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectTarget(creature.id)}
                        disabled={!inRange}
                        className={`w-full p-3 rounded-lg text-left transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-red-500/30 border-2 border-red-500'
                            : inRange
                            ? 'bg-bg-elevated hover:bg-border'
                            : 'bg-bg-elevated/50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                            style={{
                              backgroundColor:
                                creature.type === 'monster'
                                  ? '#ef4444'
                                  : creature.type === 'character'
                                  ? '#22c55e'
                                  : '#3b82f6',
                            }}
                          >
                            {creature.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-text-primary font-medium">{creature.name}</div>
                            <div className="text-xs text-text-muted">
                              HP: {creature.currentHitPoints}/{creature.maxHitPoints} | AC: {creature.armorClass}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm ${inRange ? 'text-green-400' : 'text-red-400'}`}>
                            {distance} ft
                          </div>
                          {!inRange && (
                            <div className="text-xs text-red-400">Out of range</div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>

              {/* Confirm/Cancel */}
              <div className="flex gap-2 mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancelAction}
                  className="flex-1 py-2 bg-bg-elevated hover:bg-border text-text-secondary rounded-lg"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirmAttack}
                  disabled={!combatState.selectedTargetId}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Attack!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combat Log Overlay */}
      <AnimatePresence>
        {showCombatLog && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed right-0 top-16 bottom-24 w-80 bg-bg-card/95 backdrop-blur-md border-l border-border z-30 overflow-hidden flex flex-col"
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="font-cinzel text-primary">Combat Log</h3>
              <button
                onClick={() => setShowCombatLog(false)}
                className="p-1 hover:bg-bg-elevated rounded"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {combatState.combatLog.map(entry => (
                <div
                  key={entry.id}
                  className={`text-sm p-2 rounded ${
                    entry.type === 'damage'
                      ? 'bg-red-500/10 border-l-2 border-red-500'
                      : entry.type === 'heal'
                      ? 'bg-green-500/10 border-l-2 border-green-500'
                      : entry.type === 'death'
                      ? 'bg-purple-500/10 border-l-2 border-purple-500'
                      : entry.type === 'turn'
                      ? 'bg-primary/10 border-l-2 border-primary'
                      : 'bg-bg-elevated'
                  }`}
                >
                  <div className="text-text-primary">{entry.message}</div>
                  {entry.details && (
                    <div className="text-xs text-text-muted mt-1">
                      {entry.details.roll !== undefined && `Roll: ${entry.details.roll}`}
                      {entry.details.total !== undefined && ` (Total: ${entry.details.total})`}
                      {entry.details.damage !== undefined && ` | Damage: ${entry.details.damage}`}
                      {entry.details.isCritical && ' CRITICAL!'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Panels */}
      <AnimatePresence>
        {expandedPanel && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-bg-card border border-border rounded-lg p-4 min-w-[280px] z-40"
          >
            {expandedPanel === 'attack' && (
              <>
                <h3 className="font-cinzel text-red-400 mb-3">Attack Actions</h3>
                <div className="space-y-2">
                  {availableActions
                    .filter(a => a.type === 'attack')
                    .map(action => (
                      <motion.button
                        key={action.name}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleActionSelect(action)}
                        className="w-full p-3 bg-bg-elevated hover:bg-red-500/20 rounded-lg text-left"
                      >
                        <div className="text-text-primary font-medium">{action.name}</div>
                        <div className="text-xs text-text-muted">
                          {action.damage} {action.damageType?.toLowerCase()} | Range: {action.range} ft
                        </div>
                      </motion.button>
                    ))}
                </div>
              </>
            )}
            {expandedPanel === 'spell' && (
              <>
                <h3 className="font-cinzel text-purple-400 mb-3">Spells</h3>
                <p className="text-text-muted text-sm">Spell casting coming soon...</p>
              </>
            )}
            {expandedPanel === 'item' && (
              <>
                <h3 className="font-cinzel text-amber-400 mb-3">Items</h3>
                <p className="text-text-muted text-sm">Item usage coming soon...</p>
              </>
            )}
            {expandedPanel === 'move' && (
              <>
                <h3 className="font-cinzel text-blue-400 mb-3">Movement</h3>
                <p className="text-text-muted text-sm">
                  Speed: {currentCreature?.speed || 30} ft
                  <br />
                  Click on a tile to move there.
                </p>
              </>
            )}
            {expandedPanel === 'other' && (
              <>
                <h3 className="font-cinzel text-text-secondary mb-3">Other Actions</h3>
                <div className="space-y-2">
                  {['Dash', 'Disengage', 'Dodge', 'Help', 'Hide', 'Ready'].map(action => (
                    <button
                      key={action}
                      className="w-full p-2 bg-bg-elevated hover:bg-border rounded-lg text-left text-sm"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Action Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur-md border-t border-border z-40"
      >
        <div className="max-w-6xl mx-auto">
          {/* Turn Indicator */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-text-muted">Round:</span>{' '}
                <span className="text-primary font-bold">{combatState.round}</span>
              </div>
              <div className="text-sm">
                <span className="text-text-muted">Turn:</span>{' '}
                <span className="text-text-primary font-medium">
                  {currentCreature?.name || 'Unknown'}
                </span>
              </div>
              {isMyTurn && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Your Turn
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCombatLog(!showCombatLog)}
                className="p-2 hover:bg-bg-elevated rounded-lg text-text-secondary"
                title="Combat Log"
              >
                📜
              </button>
              {isDM && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onEndCombat}
                  className="px-3 py-1 bg-bg-elevated hover:bg-border text-text-secondary rounded-lg text-sm"
                >
                  End Combat
                </motion.button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-2 p-3">
            {ACTION_BUTTONS.map(btn => {
              const isActive = expandedPanel === btn.id;
              const colorClasses: Record<string, string> = {
                red: 'hover:bg-red-500/20 hover:border-red-500/50',
                purple: 'hover:bg-purple-500/20 hover:border-purple-500/50',
                amber: 'hover:bg-amber-500/20 hover:border-amber-500/50',
                blue: 'hover:bg-blue-500/20 hover:border-blue-500/50',
                gray: 'hover:bg-gray-500/20 hover:border-gray-500/50',
              };
              const activeClasses: Record<string, string> = {
                red: 'bg-red-500/30 border-red-500',
                purple: 'bg-purple-500/30 border-purple-500',
                amber: 'bg-amber-500/30 border-amber-500',
                blue: 'bg-blue-500/30 border-blue-500',
                gray: 'bg-gray-500/30 border-gray-500',
              };

              return (
                <motion.button
                  key={btn.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => togglePanel(btn.id)}
                  disabled={!isMyTurn && !isDM}
                  className={`px-4 py-3 rounded-lg border transition-colors flex flex-col items-center gap-1 min-w-[70px] ${
                    isActive
                      ? activeClasses[btn.color]
                      : `bg-bg-elevated border-border ${colorClasses[btn.color]}`
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="text-xl">{btn.icon}</span>
                  <span className="text-xs text-text-secondary">{btn.label}</span>
                </motion.button>
              );
            })}

            {/* Divider */}
            <div className="w-px h-12 bg-border mx-2" />

            {/* End Turn Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEndTurn}
              disabled={!isMyTurn && !isDM}
              className="px-6 py-3 bg-primary hover:bg-primary/80 text-bg-dark rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>End Turn</span>
              <span className="text-lg">→</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default CombatActionBar;
