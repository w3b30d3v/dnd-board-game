'use client';

/**
 * useCombat Hook
 * Central hook that manages combat state and wires CombatManager to the game
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { CombatManager, type CombatEvent, type CreatureCombatStats } from '@/game/CombatManager';
import type { Creature, GridPosition } from '@/game/types';
import type { TokenManager } from '@/game/TokenManager';
import { useImmersive } from '@/components/immersion/ImmersiveProvider';
import type { DamageType } from '@dnd/rules-engine';

// Combat action types
export type CombatActionType = 'attack' | 'spell' | 'ability' | 'item' | 'move' | 'dash' | 'disengage' | 'dodge' | 'help' | 'hide' | 'ready';

export interface CombatAction {
  type: CombatActionType;
  name: string;
  description: string;
  range?: number;
  damage?: string;
  damageType?: DamageType;
  savingThrow?: { ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'; dc: number };
  areaOfEffect?: { shape: 'SPHERE' | 'CUBE' | 'CONE' | 'LINE'; size: number };
  requiresTarget: boolean;
  isSpell?: boolean;
  spellLevel?: number;
}

export interface InitiativeEntry {
  creatureId: string;
  initiative: number;
  tieBreaker: number;
}

// Action economy tracking per turn (D&D 5e RAW)
export interface ActionEconomy {
  hasAction: boolean;       // Standard action available
  hasBonusAction: boolean;  // Bonus action available
  hasReaction: boolean;     // Reaction available (resets at start of turn)
  movementUsed: number;     // Feet of movement used
  movementMax: number;      // Max movement (typically 30)
  hasUsedObject: boolean;   // Free object interaction used
}

export interface CombatState {
  isInCombat: boolean;
  round: number;
  currentTurnCreatureId: string | null;
  initiativeOrder: InitiativeEntry[];
  selectedTargetId: string | null;
  selectedAction: CombatAction | null;
  isSelectingTarget: boolean;
  combatLog: CombatLogEntry[];
  // Action economy
  actionEconomy: ActionEconomy;
}

export interface CombatLogEntry {
  id: string;
  timestamp: Date;
  type: 'attack' | 'damage' | 'heal' | 'death' | 'initiative' | 'turn' | 'info';
  message: string;
  details?: {
    roll?: number;
    total?: number;
    damage?: number;
    isCritical?: boolean;
    isHit?: boolean;
  };
}

// Default combat stats for creatures without detailed stats
function getDefaultStats(creature: Creature): CreatureCombatStats {
  // Calculate modifier from AC (rough approximation)
  const dexMod = Math.floor((creature.armorClass - 10) / 2);
  const profBonus = creature.type === 'character' ? 2 : Math.floor(creature.maxHitPoints / 20) + 2;

  return {
    strengthMod: 0,
    dexterityMod: dexMod,
    constitutionMod: Math.floor((creature.maxHitPoints - 10) / 6),
    intelligenceMod: 0,
    wisdomMod: 0,
    charismaMod: 0,
    proficiencyBonus: profBonus,
    attackBonus: dexMod + profBonus,
    saveProficiencies: [],
    resistances: [],
    vulnerabilities: [],
    immunities: [],
  };
}

// Basic melee attack action
const BASIC_MELEE_ATTACK: CombatAction = {
  type: 'attack',
  name: 'Melee Attack',
  description: 'Make a melee weapon attack against a creature within 5 feet',
  range: 5,
  damage: '1d8',
  damageType: 'SLASHING',
  requiresTarget: true,
};

const BASIC_RANGED_ATTACK: CombatAction = {
  type: 'attack',
  name: 'Ranged Attack',
  description: 'Make a ranged weapon attack against a creature',
  range: 60,
  damage: '1d8',
  damageType: 'PIERCING',
  requiresTarget: true,
};

export function useCombat(creatures: Creature[], tokenManager: TokenManager | null) {
  const combatManagerRef = useRef<CombatManager | null>(null);
  const immersive = useImmersive();

  // Default action economy (resets each turn)
  const defaultActionEconomy: ActionEconomy = {
    hasAction: true,
    hasBonusAction: true,
    hasReaction: true,
    movementUsed: 0,
    movementMax: 30, // Default 30 ft movement
    hasUsedObject: false,
  };

  const [state, setState] = useState<CombatState>({
    isInCombat: false,
    round: 0,
    currentTurnCreatureId: null,
    initiativeOrder: [],
    selectedTargetId: null,
    selectedAction: null,
    isSelectingTarget: false,
    combatLog: [],
    actionEconomy: defaultActionEconomy,
  });

  // Initialize CombatManager
  useEffect(() => {
    if (!combatManagerRef.current) {
      combatManagerRef.current = new CombatManager();
    }

    // Connect TokenManager for visual effects
    if (tokenManager && combatManagerRef.current) {
      combatManagerRef.current.setTokenManager(tokenManager);
    }

    return () => {
      combatManagerRef.current?.destroy();
      combatManagerRef.current = null;
    };
  }, [tokenManager]);

  // Register/update creatures when they change
  useEffect(() => {
    const cm = combatManagerRef.current;
    if (!cm) return;

    for (const creature of creatures) {
      const stats = getDefaultStats(creature);
      cm.registerCreature(creature, stats);
    }
  }, [creatures]);

  // Subscribe to combat events
  useEffect(() => {
    const cm = combatManagerRef.current;
    if (!cm) return;

    const unsubscribe = cm.onEvent((event: CombatEvent) => {
      handleCombatEvent(event);
    });

    return unsubscribe;
  }, []);

  // Add to combat log
  const addLogEntry = useCallback((entry: Omit<CombatLogEntry, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      combatLog: [
        {
          ...entry,
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        },
        ...prev.combatLog.slice(0, 99), // Keep last 100 entries
      ],
    }));
  }, []);

  // Handle combat events from CombatManager
  const handleCombatEvent = useCallback((event: CombatEvent) => {
    const cm = combatManagerRef.current;

    switch (event.type) {
      case 'attack': {
        const attacker = cm?.getCreature(event.attackerId);
        const target = cm?.getCreature(event.targetId);
        const isHit = event.result.hits;
        const isCritical = event.result.isCritical;

        // Play audio/VFX
        const targetCreature = creatures.find(c => c.id === event.targetId);
        if (targetCreature) {
          const screenPos = getScreenPosition(targetCreature.position);
          immersive.playMeleeAttack(isHit, screenPos);
        }

        // Log entry
        if (isCritical) {
          addLogEntry({
            type: 'attack',
            message: `${attacker?.name || 'Unknown'} CRITICALLY ${isHit ? 'HITS' : 'MISSES'} ${target?.name || 'Unknown'}!`,
            details: { roll: event.result.roll, total: event.result.total, isCritical: true, isHit },
          });
        } else {
          addLogEntry({
            type: 'attack',
            message: `${attacker?.name || 'Unknown'} ${isHit ? 'hits' : 'misses'} ${target?.name || 'Unknown'} (${event.result.total} vs AC ${target?.armorClass})`,
            details: { roll: event.result.roll, total: event.result.total, isHit },
          });
        }
        break;
      }

      case 'damage': {
        const target = cm?.getCreature(event.targetId);
        const targetCreature = creatures.find(c => c.id === event.targetId);

        // Play audio/VFX
        if (targetCreature) {
          const screenPos = getScreenPosition(targetCreature.position);
          immersive.playDamage(event.amount, screenPos, event.isCritical);
        }

        let message = `${target?.name || 'Unknown'} takes ${event.amount} ${event.damageType.toLowerCase()} damage`;
        if (event.wasResisted) message += ' (resisted)';
        if (event.wasVulnerable) message += ' (vulnerable!)';
        if (event.wasImmune) message = `${target?.name || 'Unknown'} is immune to ${event.damageType.toLowerCase()} damage`;

        addLogEntry({
          type: 'damage',
          message,
          details: { damage: event.amount, isCritical: event.isCritical },
        });
        break;
      }

      case 'healing': {
        const target = cm?.getCreature(event.targetId);
        const targetCreature = creatures.find(c => c.id === event.targetId);

        // Play audio/VFX
        if (targetCreature) {
          const screenPos = getScreenPosition(targetCreature.position);
          immersive.playHeal(event.amount, screenPos);
        }

        addLogEntry({
          type: 'heal',
          message: `${target?.name || 'Unknown'} heals ${event.amount} HP (now at ${event.newHP})`,
        });
        break;
      }

      case 'death': {
        const creature = creatures.find(c => c.id === event.creatureId);

        // Play audio/VFX
        if (creature) {
          const screenPos = getScreenPosition(creature.position);
          immersive.playDeath(screenPos);
        }

        addLogEntry({
          type: 'death',
          message: `${creature?.name || 'Unknown'} has fallen!${event.wasInstantDeath ? ' (Instant Death)' : ''}`,
        });

        // Check for victory/defeat
        checkCombatEnd();
        break;
      }

      case 'initiative': {
        addLogEntry({
          type: 'initiative',
          message: `Initiative rolled! Order: ${event.order.map(id => cm?.getCreature(id)?.name || id).join(' → ')}`,
        });
        break;
      }
    }
  }, [creatures, immersive, addLogEntry]);

  // Convert grid position to screen position (approximate)
  const getScreenPosition = useCallback((pos: GridPosition): { x: number; y: number } => {
    const tileSize = 48;
    return {
      x: pos.x * tileSize + tileSize / 2 + 280, // Offset for sidebar
      y: pos.y * tileSize + tileSize / 2 + 60, // Offset for header
    };
  }, []);

  // Start combat and roll initiative
  const startCombat = useCallback(() => {
    const cm = combatManagerRef.current;
    if (!cm || creatures.length === 0) return;

    // Register all creatures
    for (const creature of creatures) {
      const stats = getDefaultStats(creature);
      cm.registerCreature(creature, stats);
    }

    // Roll initiative
    const { order, results } = cm.rollInitiativeForAll();

    // Build initiative order with tiebreakers
    const initiativeOrder: InitiativeEntry[] = order.map(id => {
      const result = results.get(id);
      return {
        creatureId: id,
        initiative: result?.total || 0,
        tieBreaker: result?.roll || 0,
      };
    });

    // Set combat phase
    immersive.setGamePhase('combat');

    setState(prev => ({
      ...prev,
      isInCombat: true,
      round: 1,
      currentTurnCreatureId: order[0] || null,
      initiativeOrder,
    }));

    addLogEntry({
      type: 'info',
      message: 'Combat has begun! Roll for initiative!',
    });

    addLogEntry({
      type: 'turn',
      message: `Round 1 begins. ${cm.getCreature(order[0])?.name || 'Unknown'}'s turn.`,
    });

    return { order, results };
  }, [creatures, immersive, addLogEntry]);

  // End combat
  const endCombat = useCallback(() => {
    const cm = combatManagerRef.current;
    if (cm) {
      cm.endCombat();
    }

    immersive.setGamePhase('exploration');

    setState(prev => ({
      ...prev,
      isInCombat: false,
      round: 0,
      currentTurnCreatureId: null,
      initiativeOrder: [],
      selectedTargetId: null,
      selectedAction: null,
      isSelectingTarget: false,
    }));

    addLogEntry({
      type: 'info',
      message: 'Combat has ended.',
    });
  }, [immersive, addLogEntry]);

  // Next turn (resets action economy)
  const nextTurn = useCallback(() => {
    const cm = combatManagerRef.current;
    if (!cm) return;

    const nextCreatureId = cm.nextTurn();
    const newRound = cm.getCurrentRound();

    // Get movement speed for the next creature
    const nextCreature = creatures.find(c => c.id === nextCreatureId);
    const movementMax = nextCreature?.speed ?? 30;

    setState(prev => {
      const roundChanged = newRound !== prev.round;

      if (roundChanged) {
        addLogEntry({
          type: 'turn',
          message: `Round ${newRound} begins!`,
        });
      }

      addLogEntry({
        type: 'turn',
        message: `${cm.getCreature(nextCreatureId || '')?.name || 'Unknown'}'s turn.`,
      });

      return {
        ...prev,
        currentTurnCreatureId: nextCreatureId,
        round: newRound,
        selectedTargetId: null,
        selectedAction: null,
        isSelectingTarget: false,
        // Reset action economy for new turn
        actionEconomy: {
          hasAction: true,
          hasBonusAction: true,
          hasReaction: true, // Reaction resets at start of your turn
          movementUsed: 0,
          movementMax,
          hasUsedObject: false,
        },
      };
    });
  }, [addLogEntry, creatures]);

  // Select action
  const selectAction = useCallback((action: CombatAction | null) => {
    setState(prev => ({
      ...prev,
      selectedAction: action,
      isSelectingTarget: action?.requiresTarget ?? false,
      selectedTargetId: null,
    }));
  }, []);

  // Select target
  const selectTarget = useCallback((targetId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedTargetId: targetId,
    }));
  }, []);

  // Cancel action
  const cancelAction = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedAction: null,
      selectedTargetId: null,
      isSelectingTarget: false,
    }));
  }, []);

  // Execute attack (consumes action economy)
  const executeAttack = useCallback((targetId: string, action: CombatAction) => {
    const cm = combatManagerRef.current;
    if (!cm || !state.currentTurnCreatureId) return null;

    // Check action economy - attacks use standard action
    if (!state.actionEconomy.hasAction) {
      addLogEntry({
        type: 'info',
        message: 'No action available this turn!',
      });
      return null;
    }

    const attackerId = state.currentTurnCreatureId;

    // Make the attack roll
    const attackResult = cm.attack(attackerId, targetId);

    // If hit, deal damage
    if (attackResult.hits && action.damage && action.damageType) {
      const damageResult = cm.dealDamage(targetId, action.damage, action.damageType, {
        isCritical: attackResult.isCritical,
      });

      // Clear selection and consume action
      setState(prev => ({
        ...prev,
        selectedAction: null,
        selectedTargetId: null,
        isSelectingTarget: false,
        actionEconomy: {
          ...prev.actionEconomy,
          hasAction: false,
        },
      }));

      return { attackResult, damageResult };
    }

    // Clear selection and consume action even on miss
    setState(prev => ({
      ...prev,
      selectedAction: null,
      selectedTargetId: null,
      isSelectingTarget: false,
      actionEconomy: {
        ...prev.actionEconomy,
        hasAction: false,
      },
    }));

    return { attackResult, damageResult: null };
  }, [state.currentTurnCreatureId, state.actionEconomy.hasAction, addLogEntry]);

  // Confirm attack (when target is selected and action is ready)
  const confirmAttack = useCallback(() => {
    if (!state.selectedTargetId || !state.selectedAction) return null;

    return executeAttack(state.selectedTargetId, state.selectedAction);
  }, [state.selectedTargetId, state.selectedAction, executeAttack]);

  // Direct damage (for DM)
  const applyDamage = useCallback((targetId: string, amount: number, damageType: DamageType = 'BLUDGEONING') => {
    const cm = combatManagerRef.current;
    if (!cm) return;

    cm.dealDamage(targetId, amount.toString(), damageType);
  }, []);

  // Direct healing (for DM or spells)
  const applyHealing = useCallback((targetId: string, amount: number) => {
    const cm = combatManagerRef.current;
    if (!cm) return;

    cm.heal(targetId, amount);
  }, []);

  // Check if combat should end
  const checkCombatEnd = useCallback(() => {
    const cm = combatManagerRef.current;
    if (!cm || !state.isInCombat) return;

    const aliveMonsters = creatures.filter(c => c.type === 'monster' && c.currentHitPoints > 0);
    const aliveCharacters = creatures.filter(c => c.type === 'character' && c.currentHitPoints > 0);

    if (aliveMonsters.length === 0) {
      immersive.playVictory();
      addLogEntry({
        type: 'info',
        message: 'Victory! All enemies have been defeated!',
      });
      // Don't auto-end, let DM decide
    } else if (aliveCharacters.length === 0) {
      addLogEntry({
        type: 'info',
        message: 'Defeat... All party members have fallen.',
      });
    }
  }, [creatures, state.isInCombat, immersive, addLogEntry]);

  // Get available actions for current turn creature
  const getAvailableActions = useCallback((): CombatAction[] => {
    // For now, return basic attacks
    // This can be expanded based on character abilities, spells, etc.
    return [BASIC_MELEE_ATTACK, BASIC_RANGED_ATTACK];
  }, []);

  // Get valid targets for current action
  const getValidTargets = useCallback((): string[] => {
    if (!state.selectedAction || !state.currentTurnCreatureId) return [];

    const currentCreature = creatures.find(c => c.id === state.currentTurnCreatureId);
    if (!currentCreature) return [];

    // For attacks, target enemies
    // For heals, target allies
    const isHealing = state.selectedAction.type === 'spell' && state.selectedAction.damage?.startsWith('-');

    return creatures
      .filter(c => {
        // Can't target self with attacks
        if (c.id === state.currentTurnCreatureId && state.selectedAction?.type === 'attack') return false;
        // Must be alive
        if (c.currentHitPoints <= 0) return false;
        // Target enemies for attacks, allies for heals
        if (isHealing) {
          return c.type === currentCreature.type || c.type === 'character';
        } else {
          return c.type !== currentCreature.type;
        }
      })
      .map(c => c.id);
  }, [creatures, state.selectedAction, state.currentTurnCreatureId]);

  // Calculate distance between two creatures
  const getDistance = useCallback((creatureId1: string, creatureId2: string): number => {
    const c1 = creatures.find(c => c.id === creatureId1);
    const c2 = creatures.find(c => c.id === creatureId2);
    if (!c1 || !c2) return Infinity;

    const dx = Math.abs(c1.position.x - c2.position.x);
    const dy = Math.abs(c1.position.y - c2.position.y);

    // D&D uses max of dx/dy for diagonal movement (5 ft per square)
    return Math.max(dx, dy) * 5;
  }, [creatures]);

  // Check if target is in range
  const isInRange = useCallback((targetId: string): boolean => {
    if (!state.currentTurnCreatureId || !state.selectedAction?.range) return true;

    const distance = getDistance(state.currentTurnCreatureId, targetId);
    return distance <= state.selectedAction.range;
  }, [state.currentTurnCreatureId, state.selectedAction, getDistance]);

  // ==================== ACTION ECONOMY HELPERS ====================

  // Check if action can be performed based on action economy
  const canPerformAction = useCallback((actionType: CombatActionType): boolean => {
    switch (actionType) {
      case 'attack':
      case 'spell':
      case 'dash':
      case 'disengage':
      case 'dodge':
      case 'help':
      case 'hide':
      case 'ready':
        return state.actionEconomy.hasAction;
      case 'ability':
      case 'item':
        // Bonus actions (simplified - real implementation would check specific abilities)
        return state.actionEconomy.hasBonusAction;
      case 'move':
        return state.actionEconomy.movementUsed < state.actionEconomy.movementMax;
      default:
        return true;
    }
  }, [state.actionEconomy]);

  // Consume bonus action
  const useBonusAction = useCallback(() => {
    if (!state.actionEconomy.hasBonusAction) {
      addLogEntry({
        type: 'info',
        message: 'No bonus action available this turn!',
      });
      return false;
    }

    setState(prev => ({
      ...prev,
      actionEconomy: {
        ...prev.actionEconomy,
        hasBonusAction: false,
      },
    }));
    return true;
  }, [state.actionEconomy.hasBonusAction, addLogEntry]);

  // Consume reaction
  const useReaction = useCallback(() => {
    if (!state.actionEconomy.hasReaction) {
      addLogEntry({
        type: 'info',
        message: 'No reaction available!',
      });
      return false;
    }

    setState(prev => ({
      ...prev,
      actionEconomy: {
        ...prev.actionEconomy,
        hasReaction: false,
      },
    }));
    return true;
  }, [state.actionEconomy.hasReaction, addLogEntry]);

  // Use movement (returns true if successful, false if not enough movement)
  const useMovement = useCallback((distance: number): boolean => {
    const remaining = state.actionEconomy.movementMax - state.actionEconomy.movementUsed;
    if (distance > remaining) {
      addLogEntry({
        type: 'info',
        message: `Not enough movement! (${remaining} ft remaining)`,
      });
      return false;
    }

    setState(prev => ({
      ...prev,
      actionEconomy: {
        ...prev.actionEconomy,
        movementUsed: prev.actionEconomy.movementUsed + distance,
      },
    }));
    return true;
  }, [state.actionEconomy.movementMax, state.actionEconomy.movementUsed, addLogEntry]);

  // Get remaining movement
  const getRemainingMovement = useCallback((): number => {
    return state.actionEconomy.movementMax - state.actionEconomy.movementUsed;
  }, [state.actionEconomy.movementMax, state.actionEconomy.movementUsed]);

  // Perform Dash action (doubles movement)
  const performDash = useCallback(() => {
    if (!state.actionEconomy.hasAction) {
      addLogEntry({
        type: 'info',
        message: 'No action available for Dash!',
      });
      return false;
    }

    const creature = creatures.find(c => c.id === state.currentTurnCreatureId);
    const extraMovement = creature?.speed ?? 30;

    setState(prev => ({
      ...prev,
      actionEconomy: {
        ...prev.actionEconomy,
        hasAction: false,
        movementMax: prev.actionEconomy.movementMax + extraMovement,
      },
    }));

    addLogEntry({
      type: 'info',
      message: `${creature?.name || 'Creature'} uses Dash! (+${extraMovement} ft movement)`,
    });

    return true;
  }, [state.actionEconomy.hasAction, state.currentTurnCreatureId, creatures, addLogEntry]);

  // Perform Disengage action
  const performDisengage = useCallback(() => {
    if (!state.actionEconomy.hasAction) {
      addLogEntry({
        type: 'info',
        message: 'No action available for Disengage!',
      });
      return false;
    }

    const creature = creatures.find(c => c.id === state.currentTurnCreatureId);

    setState(prev => ({
      ...prev,
      actionEconomy: {
        ...prev.actionEconomy,
        hasAction: false,
      },
    }));

    addLogEntry({
      type: 'info',
      message: `${creature?.name || 'Creature'} uses Disengage! (movement doesn't provoke opportunity attacks)`,
    });

    return true;
  }, [state.actionEconomy.hasAction, state.currentTurnCreatureId, creatures, addLogEntry]);

  // Perform Dodge action
  const performDodge = useCallback(() => {
    if (!state.actionEconomy.hasAction) {
      addLogEntry({
        type: 'info',
        message: 'No action available for Dodge!',
      });
      return false;
    }

    const creature = creatures.find(c => c.id === state.currentTurnCreatureId);

    setState(prev => ({
      ...prev,
      actionEconomy: {
        ...prev.actionEconomy,
        hasAction: false,
      },
    }));

    addLogEntry({
      type: 'info',
      message: `${creature?.name || 'Creature'} uses Dodge! (attacks against have disadvantage until next turn)`,
    });

    return true;
  }, [state.actionEconomy.hasAction, state.currentTurnCreatureId, creatures, addLogEntry]);

  return {
    // State
    ...state,
    combatManager: combatManagerRef.current,

    // Combat lifecycle
    startCombat,
    endCombat,
    nextTurn,

    // Action selection
    selectAction,
    selectTarget,
    cancelAction,
    confirmAttack,

    // Direct effects
    applyDamage,
    applyHealing,

    // Utilities
    getAvailableActions,
    getValidTargets,
    getDistance,
    isInRange,
    addLogEntry,

    // Action economy
    canPerformAction,
    useBonusAction,
    useReaction,
    useMovement,
    getRemainingMovement,
    performDash,
    performDisengage,
    performDodge,
  };
}

export default useCombat;
