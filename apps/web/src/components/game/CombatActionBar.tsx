'use client';

/**
 * CombatActionBar
 * Bottom bar UI for combat actions - attack, spell, item, movement, end turn
 * Includes action economy tracking and integration with spell/death save panels
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Sparkles,
  Backpack,
  Footprints,
  MoreHorizontal,
  ChevronRight,
  Activity,
  Zap,
  Shield,
  ScrollText,
  X,
} from 'lucide-react';
import type { CombatAction, CombatState, CombatActionType } from '@/hooks/useCombat';
import type { Creature } from '@/game/types';
import { SpellCastingPanel } from './SpellCastingPanel';
import { DeathSavePanel } from './DeathSavePanel';
import type { Spell } from '@/data/spells';

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
  // Action economy
  canPerformAction: (actionType: CombatActionType) => boolean;
  performDash: () => boolean;
  performDisengage: () => boolean;
  performDodge: () => boolean;
  useMovement: (distance: number) => boolean;
  getRemainingMovement: () => number;
  // Death saves
  onRollDeathSave?: (creatureId: string) => Promise<{
    roll: number;
    totalSuccesses: number;
    totalFailures: number;
    stabilized: boolean;
    dead: boolean;
    regainedConsciousness: boolean;
  }>;
  // Spell casting
  casterClass?: string;
  casterLevel?: number;
  spellSlots?: {
    level1: { used: number; max: number };
    level2: { used: number; max: number };
    level3: { used: number; max: number };
    level4: { used: number; max: number };
    level5: { used: number; max: number };
    level6: { used: number; max: number };
    level7: { used: number; max: number };
    level8: { used: number; max: number };
    level9: { used: number; max: number };
  };
  onCastSpell?: (spell: Spell, targetId?: string, targetPosition?: { x: number; y: number }, spellLevel?: number) => void;
  // Movement mode (board integration)
  isMovementMode?: boolean;
  canMove?: boolean;
  onStartMovement?: () => void;
  onCancelMovement?: () => void;
  // Direct damage/healing (DM controls)
  onApplyDamage?: (targetId: string, amount: number, damageType?: import('@dnd/rules-engine').DamageType) => void;
  onApplyHealing?: (targetId: string, amount: number) => void;
}

// Action button definitions
const ACTION_BUTTONS = [
  { id: 'attack', label: 'Attack', Icon: Swords, color: 'red' },
  { id: 'spell', label: 'Spell', Icon: Sparkles, color: 'purple' },
  { id: 'item', label: 'Item', Icon: Backpack, color: 'amber' },
  { id: 'move', label: 'Move', Icon: Footprints, color: 'blue' },
  { id: 'other', label: 'Other', Icon: MoreHorizontal, color: 'gray' },
];

// Default spell slots for level 1 caster
const DEFAULT_SPELL_SLOTS = {
  level1: { used: 0, max: 2 },
  level2: { used: 0, max: 0 },
  level3: { used: 0, max: 0 },
  level4: { used: 0, max: 0 },
  level5: { used: 0, max: 0 },
  level6: { used: 0, max: 0 },
  level7: { used: 0, max: 0 },
  level8: { used: 0, max: 0 },
  level9: { used: 0, max: 0 },
};

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
  canPerformAction,
  performDash,
  performDisengage,
  performDodge,
  getRemainingMovement,
  onRollDeathSave,
  casterClass = 'wizard',
  casterLevel = 1,
  spellSlots = DEFAULT_SPELL_SLOTS,
  onCastSpell,
  // Movement mode
  isMovementMode = false,
  canMove = false,
  onStartMovement,
  onCancelMovement,
}: CombatActionBarProps) {
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [showCombatLog, setShowCombatLog] = useState(false);
  const [showSpellPanel, setShowSpellPanel] = useState(false);
  const [showDeathSavePanel, setShowDeathSavePanel] = useState(false);
  const [deathSaveCreatureId, setDeathSaveCreatureId] = useState<string | null>(null);

  const isMyTurn = currentCreature?.id === combatState.currentTurnCreatureId;
  const actionEconomy = combatState.actionEconomy;

  // Check if current creature is at 0 HP (dying)
  const isDying = currentCreature && currentCreature.currentHitPoints <= 0 && currentCreature.type === 'character';

  // Toggle action panel
  const togglePanel = useCallback((panelId: string) => {
    if (panelId === 'spell') {
      setShowSpellPanel(true);
      setExpandedPanel(null);
    } else {
      setExpandedPanel(prev => (prev === panelId ? null : panelId));
    }
    onCancelAction();
  }, [onCancelAction]);

  // Handle action selection
  const handleActionSelect = useCallback((action: CombatAction) => {
    onSelectAction(action);
    setExpandedPanel(null);
  }, [onSelectAction]);

  // Handle other actions
  const handleOtherAction = useCallback((actionName: string) => {
    switch (actionName) {
      case 'Dash':
        performDash();
        break;
      case 'Disengage':
        performDisengage();
        break;
      case 'Dodge':
        performDodge();
        break;
      default:
        console.log(`${actionName} action selected`);
    }
    setExpandedPanel(null);
  }, [performDash, performDisengage, performDodge]);

  // Handle spell cast
  const handleCastSpell = useCallback((spell: Spell, targetId?: string, targetPosition?: { x: number; y: number }, spellLevel?: number) => {
    onCastSpell?.(spell, targetId, targetPosition, spellLevel);
    setShowSpellPanel(false);
  }, [onCastSpell]);

  // Handle death save
  const handleDeathSave = useCallback(async (creatureId: string) => {
    if (!onRollDeathSave) return {
      roll: 10,
      totalSuccesses: 0,
      totalFailures: 0,
      stabilized: false,
      dead: false,
      regainedConsciousness: false,
    };
    return onRollDeathSave(creatureId);
  }, [onRollDeathSave]);

  // Open death save panel for dying creature
  const openDeathSavePanel = useCallback((creatureId: string) => {
    setDeathSaveCreatureId(creatureId);
    setShowDeathSavePanel(true);
  }, []);

  // Not in combat - show start combat button (DM only)
  if (!combatState.isInCombat) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 bg-[#1E1B26]/95 backdrop-blur-md border-t border-white/10 z-40"
      >
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-center gap-4">
            <div className="text-gray-400">
              <span className="text-gray-500">Mode:</span> Exploration
            </div>
            {isDM && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartCombat}
                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium flex items-center gap-2 border border-red-500/30"
              >
                <Swords className="w-5 h-5" />
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
      {/* Spell Casting Panel */}
      <SpellCastingPanel
        isOpen={showSpellPanel}
        onClose={() => setShowSpellPanel(false)}
        casterCreature={currentCreature}
        casterClass={casterClass}
        casterLevel={casterLevel}
        spellSlots={spellSlots}
        onCastSpell={handleCastSpell}
        validTargets={validTargets}
        creatures={creatures}
        isSelectingTarget={combatState.isSelectingTarget}
        selectedTargetId={combatState.selectedTargetId}
        onSelectTarget={onSelectTarget}
      />

      {/* Death Save Panel */}
      {deathSaveCreatureId && (
        <DeathSavePanel
          isOpen={showDeathSavePanel}
          creatureName={creatures.find(c => c.id === deathSaveCreatureId)?.name || 'Unknown'}
          creatureId={deathSaveCreatureId}
          deathSaves={{ successes: 0, failures: 0 }}
          onRollDeathSave={handleDeathSave}
          onClose={() => {
            setShowDeathSavePanel(false);
            setDeathSaveCreatureId(null);
          }}
        />
      )}

      {/* Target Selection Overlay */}
      <AnimatePresence>
        {combatState.isSelectingTarget && !showSpellPanel && (
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
              className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-[#1E1B26] border border-white/10 rounded-lg p-4 min-w-[300px]"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-cinzel text-[#F59E0B] mb-3">Select Target</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {targetCreatures.length === 0 ? (
                  <p className="text-gray-500 text-sm">No valid targets in range</p>
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
                            ? 'bg-[#2A2735] hover:bg-white/10'
                            : 'bg-[#2A2735]/50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
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
                            <div className="text-white font-medium">{creature.name}</div>
                            <div className="text-xs text-gray-500">
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
                  className="flex-1 py-2 bg-[#2A2735] hover:bg-white/10 text-gray-400 rounded-lg"
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
            className="fixed right-0 top-16 bottom-24 w-80 bg-[#1E1B26]/95 backdrop-blur-md border-l border-white/10 z-30 overflow-hidden flex flex-col"
          >
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-cinzel text-[#F59E0B] flex items-center gap-2">
                <ScrollText className="w-4 h-4" />
                Combat Log
              </h3>
              <button
                onClick={() => setShowCombatLog(false)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
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
                      ? 'bg-[#F59E0B]/10 border-l-2 border-[#F59E0B]'
                      : 'bg-[#2A2735]'
                  }`}
                >
                  <div className="text-white">{entry.message}</div>
                  {entry.details && (
                    <div className="text-xs text-gray-500 mt-1">
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
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1E1B26] border border-white/10 rounded-lg p-4 min-w-[280px] z-40"
          >
            {expandedPanel === 'attack' && (
              <>
                <h3 className="font-cinzel text-red-400 mb-3 flex items-center gap-2">
                  <Swords className="w-5 h-5" />
                  Attack Actions
                  {!canPerformAction('attack') && (
                    <span className="text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded">No Action</span>
                  )}
                </h3>
                <div className="space-y-2">
                  {availableActions
                    .filter(a => a.type === 'attack')
                    .map(action => (
                      <motion.button
                        key={action.name}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleActionSelect(action)}
                        disabled={!canPerformAction('attack')}
                        className="w-full p-3 bg-[#2A2735] hover:bg-red-500/20 rounded-lg text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="text-white font-medium">{action.name}</div>
                        <div className="text-xs text-gray-500">
                          {action.damage} {action.damageType?.toLowerCase()} | Range: {action.range} ft
                        </div>
                      </motion.button>
                    ))}
                </div>
              </>
            )}
            {expandedPanel === 'item' && (
              <>
                <h3 className="font-cinzel text-amber-400 mb-3 flex items-center gap-2">
                  <Backpack className="w-5 h-5" />
                  Items
                </h3>
                <p className="text-gray-500 text-sm">Item usage coming soon...</p>
              </>
            )}
            {expandedPanel === 'move' && (
              <>
                <h3 className="font-cinzel text-blue-400 mb-3 flex items-center gap-2">
                  <Footprints className="w-5 h-5" />
                  Movement
                  {isMovementMode && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-500/30 text-blue-400 text-xs rounded-full animate-pulse">
                      Active
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Speed:</span>
                    <span className="text-white">{currentCreature?.speed || 30} ft</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Remaining:</span>
                    <span className="text-blue-400">{getRemainingMovement()} ft</span>
                  </div>
                  <div className="w-full bg-[#2A2735] rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.max(0, (getRemainingMovement() / (currentCreature?.speed || 30)) * 100)}%`,
                      }}
                    />
                  </div>
                  {/* Movement Mode Button */}
                  {isMovementMode ? (
                    <button
                      onClick={onCancelMovement}
                      className="w-full mt-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel Movement
                    </button>
                  ) : (
                    <button
                      onClick={onStartMovement}
                      disabled={!canMove || getRemainingMovement() <= 0}
                      className="w-full mt-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Footprints className="w-4 h-4" />
                      Move on Board
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {isMovementMode
                      ? 'Click on a highlighted tile to move there. Hover to see path.'
                      : 'Click "Move on Board" to see available destinations.'}
                  </p>
                </div>
              </>
            )}
            {expandedPanel === 'other' && (
              <>
                <h3 className="font-cinzel text-gray-300 mb-3 flex items-center gap-2">
                  <MoreHorizontal className="w-5 h-5" />
                  Other Actions
                </h3>
                <div className="space-y-2">
                  {[
                    { name: 'Dash', desc: 'Double your movement this turn', requiresAction: true },
                    { name: 'Disengage', desc: 'Movement doesn\'t provoke opportunity attacks', requiresAction: true },
                    { name: 'Dodge', desc: 'Attacks against you have disadvantage', requiresAction: true },
                    { name: 'Help', desc: 'Give an ally advantage on their next check', requiresAction: true },
                    { name: 'Hide', desc: 'Attempt to hide from enemies', requiresAction: true },
                    { name: 'Ready', desc: 'Prepare an action to trigger later', requiresAction: true },
                  ].map(action => (
                    <button
                      key={action.name}
                      onClick={() => handleOtherAction(action.name)}
                      disabled={action.requiresAction && !canPerformAction('dash')}
                      className="w-full p-2 bg-[#2A2735] hover:bg-white/10 rounded-lg text-left text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="text-white font-medium">{action.name}</div>
                      <div className="text-xs text-gray-500">{action.desc}</div>
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
        className="fixed bottom-0 left-0 right-0 bg-[#1E1B26]/95 backdrop-blur-md border-t border-white/10 z-40"
      >
        <div className="max-w-6xl mx-auto">
          {/* Turn Indicator & Action Economy */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-500">Round:</span>{' '}
                <span className="text-[#F59E0B] font-bold">{combatState.round}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Turn:</span>{' '}
                <span className="text-white font-medium">
                  {currentCreature?.name || 'Unknown'}
                </span>
              </div>
              {isMyTurn && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Your Turn
                </span>
              )}
              {isDying && (
                <motion.button
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  onClick={() => currentCreature && openDeathSavePanel(currentCreature.id)}
                  className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/50"
                >
                  DYING - Roll Death Save
                </motion.button>
              )}
            </div>

            {/* Action Economy Display */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <div className={`flex items-center gap-1 px-2 py-1 rounded ${actionEconomy.hasAction ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-500'}`}>
                  <Activity className="w-3 h-3" />
                  Action
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded ${actionEconomy.hasBonusAction ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-500'}`}>
                  <Zap className="w-3 h-3" />
                  Bonus
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded ${actionEconomy.hasReaction ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-500'}`}>
                  <Shield className="w-3 h-3" />
                  Reaction
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                  <Footprints className="w-3 h-3" />
                  {getRemainingMovement()}/{actionEconomy.movementMax} ft
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCombatLog(!showCombatLog)}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400"
                  title="Combat Log"
                >
                  <ScrollText className="w-5 h-5" />
                </button>
                {isDM && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onEndCombat}
                    className="px-3 py-1 bg-[#2A2735] hover:bg-white/10 text-gray-400 rounded-lg text-sm"
                  >
                    End Combat
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-2 p-3">
            {ACTION_BUTTONS.map(btn => {
              const isActive = expandedPanel === btn.id || (btn.id === 'spell' && showSpellPanel);
              const canUse = btn.id === 'move'
                ? getRemainingMovement() > 0
                : btn.id === 'item'
                ? true // Items can be used as object interaction
                : canPerformAction(btn.id as CombatActionType);

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
                  disabled={(!isMyTurn && !isDM) || !canUse}
                  className={`px-4 py-3 rounded-lg border transition-colors flex flex-col items-center gap-1 min-w-[70px] ${
                    isActive
                      ? activeClasses[btn.color]
                      : `bg-[#2A2735] border-white/10 ${colorClasses[btn.color]}`
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <btn.Icon className="w-5 h-5" />
                  <span className="text-xs text-gray-400">{btn.label}</span>
                </motion.button>
              );
            })}

            {/* Divider */}
            <div className="w-px h-12 bg-white/10 mx-2" />

            {/* End Turn Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEndTurn}
              disabled={!isMyTurn && !isDM}
              className="px-6 py-3 bg-[#F59E0B] hover:bg-[#F59E0B]/80 text-black rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>End Turn</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default CombatActionBar;
