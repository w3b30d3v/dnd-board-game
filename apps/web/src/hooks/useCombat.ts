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

export interface CombatState {
  isInCombat: boolean;
  round: number;
  currentTurnCreatureId: string | null;
  initiativeOrder: InitiativeEntry[];
  selectedTargetId: string | null;
  selectedAction: CombatAction | null;
  isSelectingTarget: boolean;
  combatLog: CombatLogEntry[];
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

  const [state, setState] = useState<CombatState>({
    isInCombat: false,
    round: 0,
    currentTurnCreatureId: null,
    initiativeOrder: [],
    selectedTargetId: null,
    selectedAction: null,
    isSelectingTarget: false,
    combatLog: [],
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

  // Next turn
  const nextTurn = useCallback(() => {
    const cm = combatManagerRef.current;
    if (!cm) return;

    const nextCreatureId = cm.nextTurn();
    const newRound = cm.getCurrentRound();

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
      };
    });
  }, [addLogEntry]);

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

  // Execute attack
  const executeAttack = useCallback((targetId: string, action: CombatAction) => {
    const cm = combatManagerRef.current;
    if (!cm || !state.currentTurnCreatureId) return null;

    const attackerId = state.currentTurnCreatureId;

    // Make the attack roll
    const attackResult = cm.attack(attackerId, targetId);

    // If hit, deal damage
    if (attackResult.hits && action.damage && action.damageType) {
      const damageResult = cm.dealDamage(targetId, action.damage, action.damageType, {
        isCritical: attackResult.isCritical,
      });

      // Clear selection
      setState(prev => ({
        ...prev,
        selectedAction: null,
        selectedTargetId: null,
        isSelectingTarget: false,
      }));

      return { attackResult, damageResult };
    }

    // Clear selection even on miss
    setState(prev => ({
      ...prev,
      selectedAction: null,
      selectedTargetId: null,
      isSelectingTarget: false,
    }));

    return { attackResult, damageResult: null };
  }, [state.currentTurnCreatureId]);

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
  };
}

export default useCombat;
