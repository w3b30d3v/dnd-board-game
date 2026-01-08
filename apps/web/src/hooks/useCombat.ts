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
export type CombatActionType = 'attack' | 'spell' | 'ability' | 'item' | 'move' | 'dash' | 'disengage' | 'dodge' | 'help' | 'hide' | 'ready' | 'short_rest' | 'long_rest';

// D&D 5e Conditions
export type ConditionName =
  | 'blinded' | 'charmed' | 'deafened' | 'frightened' | 'grappled'
  | 'incapacitated' | 'invisible' | 'paralyzed' | 'petrified'
  | 'poisoned' | 'prone' | 'restrained' | 'stunned' | 'unconscious' | 'exhaustion';

// Condition effects as per D&D 5e RAW
export interface ConditionEffects {
  cantMove?: boolean;
  cantTakeActions?: boolean;
  cantTakeReactions?: boolean;
  autoFailStrDexSaves?: boolean;
  attacksAgainstHaveAdvantage?: boolean;
  attacksHaveDisadvantage?: boolean;
  abilitychecksHaveDisadvantage?: boolean;
  savesHaveDisadvantage?: boolean;
  speedZero?: boolean;
  speedHalved?: boolean;
  attacksAgainstHaveDisadvantage?: boolean;
  cantSpeak?: boolean;
  autoFailHearing?: boolean;
  cantMoveCloserToSource?: boolean; // Frightened
  resistAllDamage?: boolean; // Petrified
  immuneToPoison?: boolean;
  cantBeCharmed?: boolean;
  meleeCritsWithin5ft?: boolean; // Paralyzed, Unconscious
}

// Get effects for a condition (D&D 5e RAW)
export function getConditionEffects(condition: ConditionName): ConditionEffects {
  switch (condition) {
    case 'blinded':
      return {
        autoFailHearing: false, // Can still hear
        attacksHaveDisadvantage: true,
        attacksAgainstHaveAdvantage: true,
      };
    case 'charmed':
      return {
        // Can't attack charmer or target them with harmful abilities
        // Charmer has advantage on social checks
      };
    case 'deafened':
      return {
        autoFailHearing: true,
      };
    case 'frightened':
      return {
        abilitychecksHaveDisadvantage: true,
        attacksHaveDisadvantage: true,
        cantMoveCloserToSource: true,
      };
    case 'grappled':
      return {
        speedZero: true,
      };
    case 'incapacitated':
      return {
        cantTakeActions: true,
        cantTakeReactions: true,
      };
    case 'invisible':
      return {
        attacksAgainstHaveDisadvantage: true,
        attacksHaveAdvantage: true, // Technically advantage on attacks
      };
    case 'paralyzed':
      return {
        cantMove: true,
        cantSpeak: true,
        cantTakeActions: true,
        cantTakeReactions: true,
        autoFailStrDexSaves: true,
        attacksAgainstHaveAdvantage: true,
        meleeCritsWithin5ft: true,
      };
    case 'petrified':
      return {
        cantMove: true,
        cantSpeak: true,
        cantTakeActions: true,
        cantTakeReactions: true,
        autoFailStrDexSaves: true,
        attacksAgainstHaveAdvantage: true,
        resistAllDamage: true,
        immuneToPoison: true,
      };
    case 'poisoned':
      return {
        attacksHaveDisadvantage: true,
        abilitychecksHaveDisadvantage: true,
      };
    case 'prone':
      return {
        // Disadvantage on attacks, attacks within 5ft have advantage, attacks beyond have disadvantage
        attacksHaveDisadvantage: true,
      };
    case 'restrained':
      return {
        speedZero: true,
        attacksHaveDisadvantage: true,
        attacksAgainstHaveAdvantage: true,
        savesHaveDisadvantage: true, // DEX saves
      };
    case 'stunned':
      return {
        cantMove: true,
        cantSpeak: true,
        cantTakeActions: true,
        cantTakeReactions: true,
        autoFailStrDexSaves: true,
        attacksAgainstHaveAdvantage: true,
      };
    case 'unconscious':
      return {
        cantMove: true,
        cantSpeak: true,
        cantTakeActions: true,
        cantTakeReactions: true,
        autoFailStrDexSaves: true,
        attacksAgainstHaveAdvantage: true,
        meleeCritsWithin5ft: true,
      };
    case 'exhaustion':
      // Exhaustion has 6 levels, simplified here
      return {
        abilitychecksHaveDisadvantage: true,
      };
    default:
      return {};
  }
}

// Check if creature can act based on conditions
export function canCreatureAct(conditions: ConditionName[]): boolean {
  for (const condition of conditions) {
    const effects = getConditionEffects(condition);
    if (effects.cantTakeActions) return false;
  }
  return true;
}

// Check if creature can move based on conditions
export function canCreatureMove(conditions: ConditionName[]): boolean {
  for (const condition of conditions) {
    const effects = getConditionEffects(condition);
    if (effects.cantMove || effects.speedZero) return false;
  }
  return true;
}

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

// Death save tracking per creature
export interface DeathSaveState {
  successes: number;
  failures: number;
  isStabilized: boolean;
}

// Ready action tracking
export interface ReadyAction {
  creatureId: string;
  action: CombatAction;
  trigger: string;
  targetId?: string;
}

// Dodge tracking
export interface DodgeState {
  creatureId: string;
  expiresAtRound: number;
  expiresAtTurn: number;
}

// Help tracking
export interface HelpState {
  helperId: string;
  targetId: string;
  beneficiaryId: string;
  used: boolean;
}

// Disengage tracking
export interface DisengageState {
  creatureId: string;
  expiresAtEndOfTurn: boolean;
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
  // Advantage/Disadvantage for attacks
  hasAdvantage: boolean;
  hasDisadvantage: boolean;
  // Death saves per creature
  deathSaves: Record<string, DeathSaveState>;
  // Dodge states (creatures currently dodging)
  dodgeStates: DodgeState[];
  // Help states (pending help actions)
  helpStates: HelpState[];
  // Disengage states
  disengageStates: DisengageState[];
  // Ready actions
  readyActions: ReadyAction[];
  // Hidden creatures
  hiddenCreatures: string[];
  // Turn timer
  turnTimerEnabled: boolean;
  turnTimerSeconds: number;
  turnTimerRemaining: number;
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
    hasAdvantage: false,
    hasDisadvantage: false,
    deathSaves: {},
    dodgeStates: [],
    helpStates: [],
    disengageStates: [],
    readyActions: [],
    hiddenCreatures: [],
    turnTimerEnabled: false,
    turnTimerSeconds: 60,
    turnTimerRemaining: 60,
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
      hasAdvantage: false,
      hasDisadvantage: false,
    }));
  }, []);

  // Set advantage for next attack
  const setAdvantage = useCallback((hasAdvantage: boolean) => {
    setState(prev => ({
      ...prev,
      hasAdvantage,
      // If setting advantage, clear disadvantage (they cancel out in D&D 5e)
      hasDisadvantage: hasAdvantage ? false : prev.hasDisadvantage,
    }));
  }, []);

  // Set disadvantage for next attack
  const setDisadvantage = useCallback((hasDisadvantage: boolean) => {
    setState(prev => ({
      ...prev,
      hasDisadvantage,
      // If setting disadvantage, clear advantage (they cancel out in D&D 5e)
      hasAdvantage: hasDisadvantage ? false : prev.hasAdvantage,
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

    // Make the attack roll with advantage/disadvantage
    const attackResult = cm.attack(attackerId, targetId, {
      advantage: state.hasAdvantage,
      disadvantage: state.hasDisadvantage,
    });

    // If hit, deal damage
    if (attackResult.hits && action.damage && action.damageType) {
      const damageResult = cm.dealDamage(targetId, action.damage, action.damageType, {
        isCritical: attackResult.isCritical,
      });

      // Clear selection, consume action, and reset advantage/disadvantage
      setState(prev => ({
        ...prev,
        selectedAction: null,
        selectedTargetId: null,
        isSelectingTarget: false,
        hasAdvantage: false,
        hasDisadvantage: false,
        actionEconomy: {
          ...prev.actionEconomy,
          hasAction: false,
        },
      }));

      return { attackResult, damageResult };
    }

    // Clear selection, consume action, and reset advantage/disadvantage even on miss
    setState(prev => ({
      ...prev,
      selectedAction: null,
      selectedTargetId: null,
      isSelectingTarget: false,
      hasAdvantage: false,
      hasDisadvantage: false,
      actionEconomy: {
        ...prev.actionEconomy,
        hasAction: false,
      },
    }));

    return { attackResult, damageResult: null };
  }, [state.currentTurnCreatureId, state.actionEconomy.hasAction, state.hasAdvantage, state.hasDisadvantage, addLogEntry]);

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

  // Perform Dodge action (with proper tracking)
  const performDodge = useCallback(() => {
    if (!state.actionEconomy.hasAction) {
      addLogEntry({
        type: 'info',
        message: 'No action available for Dodge!',
      });
      return false;
    }

    const creature = creatures.find(c => c.id === state.currentTurnCreatureId);
    if (!creature) return false;

    // Track dodge state - expires at start of creature's next turn
    setState(prev => ({
      ...prev,
      actionEconomy: {
        ...prev.actionEconomy,
        hasAction: false,
      },
      dodgeStates: [
        ...prev.dodgeStates.filter(d => d.creatureId !== creature.id),
        {
          creatureId: creature.id,
          expiresAtRound: prev.round + 1,
          expiresAtTurn: prev.initiativeOrder.findIndex(e => e.creatureId === creature.id),
        },
      ],
    }));

    addLogEntry({
      type: 'info',
      message: `${creature.name} uses Dodge! (attacks against have disadvantage until next turn)`,
    });

    return true;
  }, [state.actionEconomy.hasAction, state.currentTurnCreatureId, creatures, addLogEntry]);

  // Perform Help action
  const performHelp = useCallback((targetId: string, beneficiaryId: string) => {
    if (!state.actionEconomy.hasAction) {
      addLogEntry({
        type: 'info',
        message: 'No action available for Help!',
      });
      return false;
    }

    const creature = creatures.find(c => c.id === state.currentTurnCreatureId);
    const target = creatures.find(c => c.id === targetId);
    const beneficiary = creatures.find(c => c.id === beneficiaryId);

    if (!creature || !target || !beneficiary) return false;

    // Check if target is within 5 feet
    const distance = Math.max(
      Math.abs(creature.position.x - target.position.x),
      Math.abs(creature.position.y - target.position.y)
    ) * 5;

    if (distance > 5) {
      addLogEntry({
        type: 'info',
        message: 'Target must be within 5 feet for Help action!',
      });
      return false;
    }

    setState(prev => ({
      ...prev,
      actionEconomy: {
        ...prev.actionEconomy,
        hasAction: false,
      },
      helpStates: [
        ...prev.helpStates,
        {
          helperId: creature.id,
          targetId,
          beneficiaryId,
          used: false,
        },
      ],
    }));

    addLogEntry({
      type: 'info',
      message: `${creature.name} uses Help! (${beneficiary.name} has advantage on next attack against ${target.name})`,
    });

    return true;
  }, [state.actionEconomy.hasAction, state.currentTurnCreatureId, creatures, addLogEntry]);

  // Perform Hide action
  const performHide = useCallback(() => {
    if (!state.actionEconomy.hasAction) {
      addLogEntry({
        type: 'info',
        message: 'No action available for Hide!',
      });
      return false;
    }

    const creature = creatures.find(c => c.id === state.currentTurnCreatureId);
    if (!creature) return false;

    // Roll Stealth check (simplified - would need proper DC based on enemies' passive perception)
    const dexMod = 2; // Simplified - would get from creature stats
    const stealthRoll = Math.floor(Math.random() * 20) + 1 + dexMod;

    // Assume DC 12 for simplicity (average passive perception)
    const success = stealthRoll >= 12;

    setState(prev => ({
      ...prev,
      actionEconomy: {
        ...prev.actionEconomy,
        hasAction: false,
      },
      hiddenCreatures: success
        ? [...prev.hiddenCreatures.filter(id => id !== creature.id), creature.id]
        : prev.hiddenCreatures.filter(id => id !== creature.id),
    }));

    addLogEntry({
      type: 'info',
      message: `${creature.name} attempts to Hide! Stealth: ${stealthRoll} - ${success ? 'SUCCESS! (hidden)' : 'FAILED!'}`,
    });

    return success;
  }, [state.actionEconomy.hasAction, state.currentTurnCreatureId, creatures, addLogEntry]);

  // Perform Ready action
  const performReady = useCallback((trigger: string, action: CombatAction, targetId?: string) => {
    if (!state.actionEconomy.hasAction) {
      addLogEntry({
        type: 'info',
        message: 'No action available for Ready!',
      });
      return false;
    }

    const creature = creatures.find(c => c.id === state.currentTurnCreatureId);
    if (!creature) return false;

    setState(prev => ({
      ...prev,
      actionEconomy: {
        ...prev.actionEconomy,
        hasAction: false,
      },
      readyActions: [
        ...prev.readyActions.filter(r => r.creatureId !== creature.id),
        {
          creatureId: creature.id,
          action,
          trigger,
          targetId,
        },
      ],
    }));

    addLogEntry({
      type: 'info',
      message: `${creature.name} readies an action: "${trigger}" - will ${action.name}`,
    });

    return true;
  }, [state.actionEconomy.hasAction, state.currentTurnCreatureId, creatures, addLogEntry]);

  // ==================== DEATH SAVES ====================

  // Roll death save
  const rollDeathSave = useCallback((creatureId: string) => {
    const creature = creatures.find(c => c.id === creatureId);
    if (!creature) return null;

    // Get current death save state
    const currentSaves = state.deathSaves[creatureId] || { successes: 0, failures: 0, isStabilized: false };
    if (currentSaves.isStabilized) {
      addLogEntry({
        type: 'info',
        message: `${creature.name} is already stabilized.`,
      });
      return { ...currentSaves, roll: 0 };
    }

    // Roll the death save
    const roll = Math.floor(Math.random() * 20) + 1;

    let newSuccesses = currentSaves.successes;
    let newFailures = currentSaves.failures;
    let isStabilized = false;
    let isDead = false;
    let regainedConsciousness = false;

    // Natural 20: regain 1 HP and wake up
    if (roll === 20) {
      regainedConsciousness = true;
      addLogEntry({
        type: 'info',
        message: `NATURAL 20! ${creature.name} regains consciousness with 1 HP!`,
      });
    }
    // Natural 1: 2 failures
    else if (roll === 1) {
      newFailures += 2;
      addLogEntry({
        type: 'damage',
        message: `NATURAL 1! ${creature.name} suffers 2 death save failures! (${newFailures}/3)`,
      });
    }
    // Success (10+)
    else if (roll >= 10) {
      newSuccesses += 1;
      addLogEntry({
        type: 'info',
        message: `Death Save Success! ${creature.name} rolls ${roll} (${newSuccesses}/3 successes)`,
      });
    }
    // Failure (<10)
    else {
      newFailures += 1;
      addLogEntry({
        type: 'damage',
        message: `Death Save Failure! ${creature.name} rolls ${roll} (${newFailures}/3 failures)`,
      });
    }

    // Check for stabilization or death
    if (newSuccesses >= 3) {
      isStabilized = true;
      addLogEntry({
        type: 'info',
        message: `${creature.name} has stabilized! They are unconscious but no longer dying.`,
      });
    } else if (newFailures >= 3) {
      isDead = true;
      addLogEntry({
        type: 'damage',
        message: `${creature.name} has died!`,
      });
    }

    // Update state
    setState(prev => ({
      ...prev,
      deathSaves: {
        ...prev.deathSaves,
        [creatureId]: regainedConsciousness
          ? { successes: 0, failures: 0, isStabilized: false }
          : { successes: newSuccesses, failures: newFailures, isStabilized },
      },
    }));

    return {
      roll,
      totalSuccesses: newSuccesses,
      totalFailures: newFailures,
      stabilized: isStabilized,
      dead: isDead,
      regainedConsciousness,
    };
  }, [creatures, state.deathSaves, addLogEntry]);

  // Get death save state for a creature
  const getDeathSaves = useCallback((creatureId: string): DeathSaveState => {
    return state.deathSaves[creatureId] || { successes: 0, failures: 0, isStabilized: false };
  }, [state.deathSaves]);

  // Check if creature is dying (at 0 HP and not stabilized)
  const isDying = useCallback((creatureId: string): boolean => {
    const creature = creatures.find(c => c.id === creatureId);
    if (!creature) return false;

    const deathSave = state.deathSaves[creatureId];
    return creature.currentHitPoints <= 0 && creature.type === 'character' && !deathSave?.isStabilized;
  }, [creatures, state.deathSaves]);

  // Stabilize a creature (e.g., via Spare the Dying)
  const stabilizeCreature = useCallback((creatureId: string) => {
    const creature = creatures.find(c => c.id === creatureId);
    if (!creature) return;

    setState(prev => ({
      ...prev,
      deathSaves: {
        ...prev.deathSaves,
        [creatureId]: { successes: 3, failures: 0, isStabilized: true },
      },
    }));

    addLogEntry({
      type: 'info',
      message: `${creature.name} has been stabilized!`,
    });
  }, [creatures, addLogEntry]);

  // Add death save failure (e.g., from taking damage while at 0 HP)
  const addDeathSaveFailure = useCallback((creatureId: string, isCritical: boolean = false) => {
    const creature = creatures.find(c => c.id === creatureId);
    if (!creature) return;

    const currentSaves = state.deathSaves[creatureId] || { successes: 0, failures: 0, isStabilized: false };
    const failuresToAdd = isCritical ? 2 : 1;
    const newFailures = currentSaves.failures + failuresToAdd;

    setState(prev => ({
      ...prev,
      deathSaves: {
        ...prev.deathSaves,
        [creatureId]: {
          ...currentSaves,
          failures: newFailures,
          isStabilized: false, // Taking damage while at 0 HP removes stabilization
        },
      },
    }));

    if (newFailures >= 3) {
      addLogEntry({
        type: 'damage',
        message: `${creature.name} has died from damage while at 0 HP!`,
      });
    } else {
      addLogEntry({
        type: 'damage',
        message: `${creature.name} takes damage at 0 HP! (${newFailures}/3 failures)`,
      });
    }
  }, [creatures, state.deathSaves, addLogEntry]);

  // ==================== REST MECHANICS ====================

  // Short rest (1 hour)
  const shortRest = useCallback((creatureIds: string[], hitDiceToSpend: Record<string, number> = {}) => {
    addLogEntry({
      type: 'info',
      message: 'The party takes a short rest (1 hour)...',
    });

    for (const creatureId of creatureIds) {
      const creature = creatures.find(c => c.id === creatureId);
      if (!creature || creature.type !== 'character') continue;

      const diceToSpend = hitDiceToSpend[creatureId] || 0;
      if (diceToSpend > 0) {
        // Roll hit dice for healing (simplified - would use actual hit die size based on class)
        let totalHealing = 0;
        const conMod = 2; // Simplified CON mod
        for (let i = 0; i < diceToSpend; i++) {
          const roll = Math.floor(Math.random() * 8) + 1 + conMod; // d8 + CON
          totalHealing += Math.max(0, roll);
        }

        addLogEntry({
          type: 'heal',
          message: `${creature.name} spends ${diceToSpend} hit dice and recovers ${totalHealing} HP`,
        });
      }
    }

    // Clear death saves for creatures who rested
    setState(prev => {
      const newDeathSaves = { ...prev.deathSaves };
      for (const creatureId of creatureIds) {
        if (newDeathSaves[creatureId]) {
          newDeathSaves[creatureId] = { successes: 0, failures: 0, isStabilized: false };
        }
      }
      return { ...prev, deathSaves: newDeathSaves };
    });

    addLogEntry({
      type: 'info',
      message: 'Short rest complete!',
    });

    return true;
  }, [creatures, addLogEntry]);

  // Long rest (8 hours)
  const longRest = useCallback((creatureIds: string[]) => {
    addLogEntry({
      type: 'info',
      message: 'The party takes a long rest (8 hours)...',
    });

    for (const creatureId of creatureIds) {
      const creature = creatures.find(c => c.id === creatureId);
      if (!creature || creature.type !== 'character') continue;

      // Restore all HP
      addLogEntry({
        type: 'heal',
        message: `${creature.name} recovers to full HP`,
      });
    }

    // Clear death saves and other states
    setState(prev => {
      const newDeathSaves: Record<string, DeathSaveState> = {};
      for (const creatureId of creatureIds) {
        newDeathSaves[creatureId] = { successes: 0, failures: 0, isStabilized: false };
      }

      // Remove conditions that end on long rest
      // Remove exhaustion levels (up to 1 level per long rest)

      return {
        ...prev,
        deathSaves: newDeathSaves,
        hiddenCreatures: [], // No longer hidden after rest
        readyActions: [], // Ready actions expire
        helpStates: [],
        dodgeStates: [],
        disengageStates: [],
      };
    });

    addLogEntry({
      type: 'info',
      message: 'Long rest complete! HP restored, spell slots recovered (at caster level), hit dice recovered (half max).',
    });

    return true;
  }, [creatures, addLogEntry]);

  // ==================== CONDITION-AWARE COMBAT ====================

  // Check if attack has advantage/disadvantage based on conditions
  const getConditionModifiers = useCallback((attackerId: string, targetId: string): { advantage: boolean; disadvantage: boolean } => {
    const attacker = creatures.find(c => c.id === attackerId);
    const target = creatures.find(c => c.id === targetId);

    if (!attacker || !target) return { advantage: false, disadvantage: false };

    let hasAdvantage = false;
    let hasDisadvantage = false;

    // Check attacker's conditions
    for (const condition of (attacker.conditions as ConditionName[])) {
      const effects = getConditionEffects(condition);
      if (effects.attacksHaveDisadvantage) hasDisadvantage = true;
      if (effects.attacksHaveAdvantage) hasAdvantage = true;
    }

    // Check target's conditions
    for (const condition of (target.conditions as ConditionName[])) {
      const effects = getConditionEffects(condition);
      if (effects.attacksAgainstHaveAdvantage) hasAdvantage = true;
      if (effects.attacksAgainstHaveDisadvantage) hasDisadvantage = true;
    }

    // Check if target is dodging
    const targetDodging = state.dodgeStates.some(d => d.creatureId === targetId);
    if (targetDodging) hasDisadvantage = true;

    // Check if attacker is hidden
    if (state.hiddenCreatures.includes(attackerId)) hasAdvantage = true;

    // Check for help action
    const helpAvailable = state.helpStates.find(
      h => h.targetId === targetId && h.beneficiaryId === attackerId && !h.used
    );
    if (helpAvailable) hasAdvantage = true;

    return { advantage: hasAdvantage, disadvantage: hasDisadvantage };
  }, [creatures, state.dodgeStates, state.hiddenCreatures, state.helpStates]);

  // Add condition to creature
  const addCondition = useCallback((creatureId: string, condition: ConditionName) => {
    const cm = combatManagerRef.current;
    if (!cm) return;

    cm.addCondition(creatureId, condition);

    const creature = creatures.find(c => c.id === creatureId);
    addLogEntry({
      type: 'info',
      message: `${creature?.name || 'Creature'} is now ${condition}!`,
    });
  }, [creatures, addLogEntry]);

  // Remove condition from creature
  const removeCondition = useCallback((creatureId: string, condition: ConditionName) => {
    const cm = combatManagerRef.current;
    if (!cm) return;

    cm.removeCondition(creatureId, condition);

    const creature = creatures.find(c => c.id === creatureId);
    addLogEntry({
      type: 'info',
      message: `${creature?.name || 'Creature'} is no longer ${condition}.`,
    });
  }, [creatures, addLogEntry]);

  // ==================== TURN TIMER ====================

  // Set turn timer
  const setTurnTimer = useCallback((enabled: boolean, seconds: number = 60) => {
    setState(prev => ({
      ...prev,
      turnTimerEnabled: enabled,
      turnTimerSeconds: seconds,
      turnTimerRemaining: seconds,
    }));
  }, []);

  // Tick turn timer (call this every second when timer is enabled)
  const tickTurnTimer = useCallback(() => {
    setState(prev => {
      if (!prev.turnTimerEnabled || prev.turnTimerRemaining <= 0) return prev;

      const newRemaining = prev.turnTimerRemaining - 1;
      if (newRemaining <= 0) {
        addLogEntry({
          type: 'info',
          message: 'Turn timer expired! Auto-ending turn...',
        });
      }

      return {
        ...prev,
        turnTimerRemaining: newRemaining,
      };
    });
  }, [addLogEntry]);

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

    // Advantage/Disadvantage
    setAdvantage,
    setDisadvantage,

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
    performHelp,
    performHide,
    performReady,

    // Death saves
    rollDeathSave,
    getDeathSaves,
    isDying,
    stabilizeCreature,
    addDeathSaveFailure,

    // Rest mechanics
    shortRest,
    longRest,

    // Condition management
    getConditionModifiers,
    addCondition,
    removeCondition,

    // Turn timer
    setTurnTimer,
    tickTurnTimer,
  };
}

export default useCombat;
