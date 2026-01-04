'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { GameApplication } from '@/game/GameApplication';
import type { GridPosition } from '@/game/types';
import { DMControls } from './DMControls';
import { PlayerPanel } from './PlayerPanel';
import { InitiativeTracker } from './InitiativeTracker';
import { useImmersive } from '@/components/immersion/ImmersiveProvider';
import { AudioControls } from './AudioControls';
import { CombatActionBar } from '@/components/game/CombatActionBar';
import { useCombat } from '@/hooks/useCombat';
import { useMovementAndTargeting } from '@/hooks/useMovementAndTargeting';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { WSMessageType } from '@dnd/shared';
import type { Spell } from '@/data/spells';
import { calculateAoE, getCreaturesInAoE, SPELL_AOE_PRESETS } from '@/game/AoECalculator';
import type { TileData } from '@/game/types';

// Generate default tiles if map doesn't have them
function generateDefaultTiles(width: number, height: number): TileData[] {
  const tiles: TileData[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.push({
        x,
        y,
        terrain: 'NORMAL',
        elevation: 0,
        isExplored: true,
        isVisible: true,
        lightLevel: 1,
        effects: [],
      });
    }
  }
  return tiles;
}

// D&D 5e Spell Slot Progression by caster level
// Full casters: Bard, Cleric, Druid, Sorcerer, Wizard
// Half casters: Paladin, Ranger (start at level 2, use half level)
// Third casters: Arcane Trickster, Eldritch Knight (use 1/3 level, start at 3)
const SPELL_SLOT_TABLE: Record<number, number[]> = {
  1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

// Full caster classes
const FULL_CASTERS = ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'];
const HALF_CASTERS = ['paladin', 'ranger'];

// Spell slots interface
interface SpellSlots {
  level1: { used: number; max: number };
  level2: { used: number; max: number };
  level3: { used: number; max: number };
  level4: { used: number; max: number };
  level5: { used: number; max: number };
  level6: { used: number; max: number };
  level7: { used: number; max: number };
  level8: { used: number; max: number };
  level9: { used: number; max: number };
}

// Get spell slots based on class and level
function getSpellSlotsForClass(className: string, level: number): SpellSlots {
  const classLower = className.toLowerCase();

  // Determine effective caster level
  let casterLevel = 0;
  if (FULL_CASTERS.includes(classLower)) {
    casterLevel = level;
  } else if (HALF_CASTERS.includes(classLower)) {
    casterLevel = Math.floor(level / 2);
  } else if (classLower === 'warlock') {
    // Warlock uses Pact Magic (different system, simplified here)
    const pactSlots = Math.min(2 + Math.floor((level - 1) / 2), 4);
    const pactLevel = Math.min(Math.ceil(level / 2), 5);
    const slots: SpellSlots = {
      level1: { used: 0, max: pactLevel >= 1 ? pactSlots : 0 },
      level2: { used: 0, max: pactLevel >= 2 ? pactSlots : 0 },
      level3: { used: 0, max: pactLevel >= 3 ? pactSlots : 0 },
      level4: { used: 0, max: pactLevel >= 4 ? pactSlots : 0 },
      level5: { used: 0, max: pactLevel >= 5 ? pactSlots : 0 },
      level6: { used: 0, max: 0 },
      level7: { used: 0, max: 0 },
      level8: { used: 0, max: 0 },
      level9: { used: 0, max: 0 },
    };
    // Warlocks get 6-9 level slots as Mystic Arcanum (1/day each at higher levels)
    if (level >= 11) slots.level6.max = 1;
    if (level >= 13) slots.level7.max = 1;
    if (level >= 15) slots.level8.max = 1;
    if (level >= 17) slots.level9.max = 1;
    return slots;
  }

  // Non-casters get no spell slots
  if (casterLevel <= 0) {
    return {
      level1: { used: 0, max: 0 },
      level2: { used: 0, max: 0 },
      level3: { used: 0, max: 0 },
      level4: { used: 0, max: 0 },
      level5: { used: 0, max: 0 },
      level6: { used: 0, max: 0 },
      level7: { used: 0, max: 0 },
      level8: { used: 0, max: 0 },
      level9: { used: 0, max: 0 },
    };
  }

  // Cap at 20
  casterLevel = Math.min(casterLevel, 20);
  const slotArray = SPELL_SLOT_TABLE[casterLevel] || SPELL_SLOT_TABLE[1];

  return {
    level1: { used: 0, max: slotArray[0] },
    level2: { used: 0, max: slotArray[1] },
    level3: { used: 0, max: slotArray[2] },
    level4: { used: 0, max: slotArray[3] },
    level5: { used: 0, max: slotArray[4] },
    level6: { used: 0, max: slotArray[5] },
    level7: { used: 0, max: slotArray[6] },
    level8: { used: 0, max: slotArray[7] },
    level9: { used: 0, max: slotArray[8] },
  };
}

interface GameSessionContentProps {
  sessionId: string;
}

export function GameSessionContent({ sessionId }: GameSessionContentProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameApplication | null>(null);

  const { token, _hasHydrated } = useAuthStore();
  const {
    session,
    currentMap,
    isDM,
    gameState,
    isLoading,
    error,
    availableMaps,
    loadSession,
    loadMaps,
    loadEncounters,
    changeMap,
    updateGameState,
    reset,
  } = useGameSessionStore();

  const [selectedTile, setSelectedTile] = useState<GridPosition | null>(null);
  const [selectedCreature, setSelectedCreature] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showDMControls, setShowDMControls] = useState(false);
  const [showPlayerPanel, setShowPlayerPanel] = useState(true);

  // Spell slots state - keyed by creature ID
  const [spellSlotsUsed, setSpellSlotsUsed] = useState<Record<string, Record<number, number>>>({});

  // Concentration tracking state - maps creature ID to spell info
  const [concentration, setConcentration] = useState<Record<string, { spellId: string; spellName: string }>>({});

  // Immersive system hooks
  const {
    setGamePhase,
    setCombatIntensity,
    enterLocation,
    playDamage,
    playHeal,
    playCriticalHit,
    playVictory,
  } = useImmersive();

  // Get creatures from game state
  const creatures = useMemo(() => gameState?.creatures || [], [gameState?.creatures]);

  // WebSocket for real-time multiplayer sync
  const {
    connect: wsConnect,
    disconnect: wsDisconnect,
    isAuthenticated: wsAuthenticated,
    joinSession: wsJoinSession,
    sendMessage: wsSendMessage,
  } = useWebSocket({ autoConnect: false });

  // Combat system - the heart of gameplay
  const combat = useCombat(creatures, null); // TokenManager accessed through gameRef

  // Find current creature's character data for spell slots
  const currentCreatureCharacter = useMemo(() => {
    if (!combat.currentTurnCreatureId || !session?.participants) return null;

    const creature = creatures.find((c) => c.id === combat.currentTurnCreatureId);
    if (!creature) return null;

    // Match creature to participant's character by name (creature name should match character name)
    const participant = session.participants.find(
      (p) => p.character?.name === creature.name
    );

    return participant?.character || null;
  }, [combat.currentTurnCreatureId, creatures, session?.participants]);

  // Compute spell slots for current creature
  const currentCreatureSpellSlots = useMemo((): SpellSlots => {
    if (!currentCreatureCharacter || !combat.currentTurnCreatureId) {
      // Default slots for non-character creatures (e.g., wizard NPC)
      return getSpellSlotsForClass('wizard', 1);
    }

    const baseSlots = getSpellSlotsForClass(
      currentCreatureCharacter.class,
      currentCreatureCharacter.level
    );

    // Apply used slots from state
    const usedSlots = spellSlotsUsed[combat.currentTurnCreatureId] || {};

    return {
      level1: { ...baseSlots.level1, used: usedSlots[1] || 0 },
      level2: { ...baseSlots.level2, used: usedSlots[2] || 0 },
      level3: { ...baseSlots.level3, used: usedSlots[3] || 0 },
      level4: { ...baseSlots.level4, used: usedSlots[4] || 0 },
      level5: { ...baseSlots.level5, used: usedSlots[5] || 0 },
      level6: { ...baseSlots.level6, used: usedSlots[6] || 0 },
      level7: { ...baseSlots.level7, used: usedSlots[7] || 0 },
      level8: { ...baseSlots.level8, used: usedSlots[8] || 0 },
      level9: { ...baseSlots.level9, used: usedSlots[9] || 0 },
    };
  }, [currentCreatureCharacter, combat.currentTurnCreatureId, spellSlotsUsed]);

  // Consume a spell slot
  const consumeSpellSlot = useCallback(
    (creatureId: string, level: number) => {
      if (level <= 0) return; // Cantrips don't consume slots

      setSpellSlotsUsed((prev) => ({
        ...prev,
        [creatureId]: {
          ...(prev[creatureId] || {}),
          [level]: (prev[creatureId]?.[level] || 0) + 1,
        },
      }));

      // Broadcast spell slot usage via WebSocket
      wsSendMessage(WSMessageType.GAME_STATE_SYNC, {
        sessionId,
        type: 'spell_slot_used',
        creatureId,
        level,
      });
    },
    [sessionId, wsSendMessage]
  );

  // Break concentration on a spell
  const breakConcentration = useCallback(
    (creatureId: string, reason: string = 'lost concentration') => {
      const conc = concentration[creatureId];
      if (!conc) return;

      combat.addLogEntry({
        type: 'info',
        message: `${creatures.find(c => c.id === creatureId)?.name} ${reason} on ${conc.spellName}!`,
      });

      setConcentration(prev => {
        const next = { ...prev };
        delete next[creatureId];
        return next;
      });

      // Broadcast concentration break via WebSocket
      wsSendMessage(WSMessageType.GAME_STATE_SYNC, {
        sessionId,
        type: 'concentration_broken',
        creatureId,
        spellName: conc.spellName,
      });
    },
    [concentration, creatures, combat, sessionId, wsSendMessage]
  );

  // Set concentration on a spell
  const setConcentrationSpell = useCallback(
    (creatureId: string, spellId: string, spellName: string) => {
      // If already concentrating, break the previous concentration
      if (concentration[creatureId]) {
        breakConcentration(creatureId, 'broke concentration to cast a new spell');
      }

      setConcentration(prev => ({
        ...prev,
        [creatureId]: { spellId, spellName },
      }));

      combat.addLogEntry({
        type: 'info',
        message: `${creatures.find(c => c.id === creatureId)?.name} is now concentrating on ${spellName}`,
      });
    },
    [concentration, creatures, combat, breakConcentration]
  );

  // Check concentration when taking damage (D&D 5e: DC = max(10, damage/2))
  const checkConcentration = useCallback(
    (creatureId: string, damageAmount: number) => {
      if (!concentration[creatureId]) return true; // No concentration to check

      const dc = Math.max(10, Math.floor(damageAmount / 2));
      const creature = creatures.find(c => c.id === creatureId);
      if (!creature) return true;

      // Roll CON save (simplified: use base modifier)
      const conMod = creature.type === 'character' ? 2 : Math.floor(creature.armorClass / 5);
      const roll = Math.floor(Math.random() * 20) + 1;
      const total = roll + conMod;
      const success = total >= dc;

      combat.addLogEntry({
        type: 'info',
        message: `${creature.name} Concentration check (CON): ${roll} + ${conMod} = ${total} vs DC ${dc} - ${success ? 'MAINTAINED!' : 'FAILED!'}`,
      });

      if (!success) {
        breakConcentration(creatureId, 'lost concentration due to damage');
      }

      return success;
    },
    [concentration, creatures, combat, breakConcentration]
  );

  // Handle moving a creature on the board
  const handleMoveCreature = useCallback(
    async (creatureId: string, newPosition: GridPosition, path: GridPosition[]) => {
      if (!gameState) return;

      // Calculate movement distance
      const movementDistance = (path.length - 1) * 5; // 5 feet per tile

      // Use movement in combat system
      if (combat.isInCombat) {
        const success = combat.useMovement(movementDistance);
        if (!success) {
          console.warn('Not enough movement remaining');
          return;
        }
      }

      // Update creature position locally
      const updatedCreatures = gameState.creatures.map((c) =>
        c.id === creatureId ? { ...c, position: newPosition } : c
      );

      // Animate token movement on board
      if (gameRef.current) {
        // Animate along path
        for (let i = 1; i < path.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          gameRef.current.moveToken(creatureId, path[i].x, path[i].y);
        }
      }

      // Persist to server
      try {
        await updateGameState(sessionId, { creatures: updatedCreatures });

        // Broadcast movement to other players via WebSocket
        wsSendMessage(WSMessageType.MOVE_TOKEN, {
          sessionId,
          tokenId: creatureId,
          path,
        });
      } catch (err) {
        console.error('Failed to persist movement:', err);
      }
    },
    [gameState, combat, sessionId, updateGameState, wsSendMessage]
  );

  // Handle targeting a creature
  const handleSelectTarget = useCallback(
    (targetId: string) => {
      combat.selectTarget(targetId);
    },
    [combat]
  );

  // Sync HP changes from combat system to game state and persist
  const syncCreatureHp = useCallback(
    async (creatureId: string, newHp: number) => {
      if (!gameState) return;

      const updatedCreatures = gameState.creatures.map((c) =>
        c.id === creatureId
          ? { ...c, currentHitPoints: Math.max(0, Math.min(newHp, c.maxHitPoints)) }
          : c
      );

      try {
        await updateGameState(sessionId, { creatures: updatedCreatures });
      } catch (err) {
        console.error('Failed to persist HP change:', err);
      }
    },
    [gameState, sessionId, updateGameState]
  );

  // Handle attack confirmation with damage persistence
  const handleConfirmAttack = useCallback(async () => {
    const result = combat.confirmAttack();
    if (!result || !combat.selectedTargetId) return result;

    // Get the updated HP from CombatManager
    const targetId = combat.selectedTargetId;
    const attackerId = combat.currentTurnCreatureId;
    const cm = combat.combatManager;
    if (cm) {
      const updatedCreature = cm.getCreature(targetId);
      if (updatedCreature) {
        // Sync the HP change to game state and persist
        await syncCreatureHp(targetId, updatedCreature.currentHitPoints);

        // Show floating damage on the game board
        if (gameRef.current && result.damageResult) {
          gameRef.current.showDamage(
            targetId,
            result.damageResult.finalDamage,
            result.attackResult.isCritical
          );
        }

        // Broadcast attack result to other players via WebSocket
        wsSendMessage(WSMessageType.ACTION_RESULT, {
          sessionId,
          creatureId: attackerId,
          actionType: 'ATTACK',
          success: result.attackResult.hits,
          rolls: [{
            type: 'attack',
            dice: '1d20',
            result: result.attackResult.roll,
            total: result.attackResult.total,
            isCritical: result.attackResult.isCritical,
          }],
          damage: result.damageResult ? {
            amount: result.damageResult.finalDamage,
            type: result.damageResult.damageType,
            isCritical: result.attackResult.isCritical,
          } : undefined,
        });
      }
    }

    return result;
  }, [combat, syncCreatureHp, wsSendMessage, sessionId]);

  // Handle direct damage application (DM only)
  const handleApplyDamage = useCallback(
    async (targetId: string, amount: number, damageType: import('@dnd/rules-engine').DamageType = 'BLUDGEONING') => {
      combat.applyDamage(targetId, amount, damageType);

      // Get updated HP and sync
      const cm = combat.combatManager;
      if (cm) {
        const creature = cm.getCreature(targetId);
        if (creature) {
          await syncCreatureHp(targetId, creature.currentHitPoints);

          // Show floating damage
          if (gameRef.current) {
            gameRef.current.showDamage(targetId, amount, false);
          }

          // Check concentration if creature took damage
          if (amount > 0) {
            checkConcentration(targetId, amount);
          }
        }
      }
    },
    [combat, syncCreatureHp, checkConcentration]
  );

  // Handle healing application
  const handleApplyHealing = useCallback(
    async (targetId: string, amount: number) => {
      combat.applyHealing(targetId, amount);

      // Get updated HP and sync
      const cm = combat.combatManager;
      if (cm) {
        const creature = cm.getCreature(targetId);
        if (creature) {
          await syncCreatureHp(targetId, creature.currentHitPoints);

          // Show floating healing
          if (gameRef.current) {
            gameRef.current.showHealing(targetId, amount);
          }
        }
      }
    },
    [combat, syncCreatureHp]
  );

  // Handle spell casting
  const handleCastSpell = useCallback(
    async (
      spell: Spell,
      targetId?: string,
      targetPosition?: { x: number; y: number },
      spellLevel?: number
    ) => {
      if (!combat.isInCombat || !combat.currentTurnCreatureId) return;

      // Determine spell level (upcast level or base spell level)
      const castLevel = spellLevel || spell.level;

      // Consume spell slot (cantrips don't use slots)
      if (castLevel > 0) {
        consumeSpellSlot(combat.currentTurnCreatureId, castLevel);
      }

      // Log the spell cast
      const slotInfo = castLevel > 0 ? ` (level ${castLevel} slot)` : ' (cantrip)';
      combat.addLogEntry({
        type: 'info',
        message: `${creatures.find(c => c.id === combat.currentTurnCreatureId)?.name} casts ${spell.name}${slotInfo}!`,
      });

      // Handle concentration spells
      if (spell.concentration) {
        setConcentrationSpell(combat.currentTurnCreatureId, spell.id, spell.name);
      }

      // Parse spell damage from description (simplified - would need proper spell data)
      const damageMatch = spell.description.match(/(\d+d\d+)\s+(acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder)/i);

      // Parse saving throw from description
      const saveMatch = spell.description.match(/(strength|dexterity|constitution|intelligence|wisdom|charisma)\s+sav/i);
      const saveType = saveMatch ? saveMatch[1].toUpperCase() as 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA' : null;

      // Calculate spell save DC
      const casterLevel = currentCreatureCharacter?.level || 1;
      const profBonus = Math.floor((casterLevel - 1) / 4) + 2;
      const spellSaveDC = 8 + profBonus + 2; // +2 for typical spellcasting mod

      // Helper to roll saving throw for a creature
      const rollSavingThrow = (creatureId: string, saveAbility: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA') => {
        const creature = creatures.find(c => c.id === creatureId);
        if (!creature) return { success: false, roll: 0, total: 0 };

        // Estimate creature's save modifier (simplified)
        const baseMod = creature.type === 'character' ? 2 : Math.floor(creature.armorClass / 4) - 2;
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + baseMod;
        const success = total >= spellSaveDC;

        // Log the save result
        combat.addLogEntry({
          type: 'info',
          message: `${creature.name} ${saveAbility} save: ${roll} + ${baseMod} = ${total} vs DC ${spellSaveDC} - ${success ? 'SUCCESS!' : 'FAILED!'}`,
        });

        return { success, roll, total };
      };

      // Check for AoE preset
      const spellKey = spell.name.toLowerCase().replace(/\s+/g, '');
      const aoePreset = SPELL_AOE_PRESETS[spellKey];

      if (aoePreset && targetPosition) {
        // AoE spell
        const aoeResult = calculateAoE({
          ...aoePreset,
          origin: targetPosition,
          direction: 0,
        });

        // Show AoE on board
        if (gameRef.current) {
          // Convert lowercase shape to uppercase for AreaOfEffect type
          const shapeUppercase = aoeResult.shape.toUpperCase() as import('@/game/types').AoEShape;
          const aoeSize = aoePreset.radius || aoePreset.length || aoePreset.size || 20;
          gameRef.current.showAoE('spell-effect', {
            shape: shapeUppercase,
            origin: targetPosition,
            size: aoeSize,
            direction: 0,
            color: 0xF59E0B, // Gold for spells
            alpha: 0.4,
          });

          // Clear after animation
          setTimeout(() => {
            gameRef.current?.hideAoE('spell-effect');
          }, 2000);
        }

        // Get affected creatures
        const affectedIds = getCreaturesInAoE(aoeResult, creatures);

        // Apply damage to all affected creatures
        if (damageMatch) {
          const diceNotation = damageMatch[1];
          const damageType = damageMatch[2].toUpperCase() as import('@dnd/rules-engine').DamageType;

          for (const affectedId of affectedIds) {
            let finalDamage = parseDiceRoll(diceNotation);

            // Check for saving throw
            if (saveType) {
              const saveResult = rollSavingThrow(affectedId, saveType);
              if (saveResult.success) {
                // Most AoE spells deal half damage on save
                finalDamage = Math.floor(finalDamage / 2);
              }
            }

            await handleApplyDamage(affectedId, finalDamage, damageType);
          }
        }
      } else if (targetId && damageMatch) {
        // Single target damage spell
        const diceNotation = damageMatch[1];
        const damageType = damageMatch[2].toUpperCase() as import('@dnd/rules-engine').DamageType;
        let finalDamage = parseDiceRoll(diceNotation);

        // Check for saving throw
        if (saveType) {
          const saveResult = rollSavingThrow(targetId, saveType);
          if (saveResult.success) {
            // Half damage on save
            finalDamage = Math.floor(finalDamage / 2);
          }
        }

        await handleApplyDamage(targetId, finalDamage, damageType);
      } else if (spell.description.toLowerCase().includes('heal') && targetId) {
        // Healing spell
        const healMatch = spell.description.match(/(\d+d\d+)/);
        if (healMatch) {
          await handleApplyHealing(targetId, parseDiceRoll(healMatch[1]));
        }
      }

      // Broadcast spell cast via WebSocket
      wsSendMessage(WSMessageType.SPELL_RESULT, {
        sessionId,
        creatureId: combat.currentTurnCreatureId,
        spellId: spell.id,
        spellName: spell.name,
        targetId,
        targetPosition,
        spellLevel: spellLevel || spell.level,
      });
    },
    [combat, creatures, sessionId, wsSendMessage, handleApplyDamage, handleApplyHealing, consumeSpellSlot, setConcentrationSpell]
  );

  // Simple dice roll parser (e.g., "1d10" returns a random value)
  function parseDiceRoll(notation: string): number {
    const match = notation.match(/(\d+)d(\d+)/);
    if (!match) return 0;
    const numDice = parseInt(match[1], 10);
    const dieSize = parseInt(match[2], 10);
    let total = 0;
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(Math.random() * dieSize) + 1;
    }
    return total;
  }

  // Get current user's character ID
  const myCharacterId = useMemo(() => {
    if (isDM) return combat.currentTurnCreatureId;
    // Find participant with user's ID - would need userId from auth
    return combat.currentTurnCreatureId; // For now, allow controlling current turn
  }, [isDM, combat.currentTurnCreatureId]);

  // Check if it's my turn
  const isMyTurn = useMemo(() => {
    return combat.isInCombat && combat.currentTurnCreatureId === myCharacterId;
  }, [combat.isInCombat, combat.currentTurnCreatureId, myCharacterId]);

  // Movement and targeting system
  // Get tiles - use map tiles or generate defaults
  const mapWidth = gameState?.map.width || 20;
  const mapHeight = gameState?.map.height || 20;
  const mapTiles = useMemo(() => {
    if (gameState?.map.tiles && gameState.map.tiles.length > 0) {
      return gameState.map.tiles;
    }
    // Generate default tiles if none provided
    return generateDefaultTiles(mapWidth, mapHeight);
  }, [gameState?.map.tiles, mapWidth, mapHeight]);

  const movement = useMovementAndTargeting({
    creatures,
    tiles: mapTiles,
    gridWidth: mapWidth,
    gridHeight: mapHeight,
    currentCreatureId: combat.currentTurnCreatureId,
    remainingMovement: combat.getRemainingMovement(),
    isInCombat: combat.isInCombat,
    isMyTurn,
    onMoveCreature: handleMoveCreature,
    onSelectTarget: handleSelectTarget,
  });

  // Track previous HP values to detect damage/healing
  const prevCreatureHp = useRef<Map<string, number>>(new Map());

  // Auth check
  useEffect(() => {
    if (_hasHydrated && !token) {
      router.push(`/login?redirect=/game/${sessionId}`);
    }
  }, [_hasHydrated, token, router, sessionId]);

  // Connect to WebSocket for real-time multiplayer
  useEffect(() => {
    if (!token || !sessionId) return;

    // Connect to WebSocket server
    wsConnect();

    return () => {
      wsDisconnect();
    };
  }, [token, sessionId, wsConnect, wsDisconnect]);

  // Join session via WebSocket once authenticated
  useEffect(() => {
    if (wsAuthenticated && sessionId) {
      wsJoinSession(sessionId);
    }
  }, [wsAuthenticated, sessionId, wsJoinSession]);

  // Get pending token moves from multiplayer store
  const { pendingTokenMoves, clearPendingTokenMoves } = useMultiplayerStore();

  // Process pending token moves from other players
  useEffect(() => {
    if (!gameRef.current || pendingTokenMoves.length === 0) return;

    // Process each pending move
    pendingTokenMoves.forEach(async (move) => {
      // Animate the token movement on the board
      if (move.path && move.path.length > 1) {
        for (let i = 1; i < move.path.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          gameRef.current?.moveToken(move.tokenId, move.path[i].x, move.path[i].y);
        }
      } else {
        // Direct move without path
        gameRef.current?.moveToken(move.tokenId, move.toPosition.x, move.toPosition.y);
      }
    });

    // Clear processed moves
    clearPendingTokenMoves();
  }, [pendingTokenMoves, clearPendingTokenMoves]);

  // Listen for WebSocket game events
  useEffect(() => {
    // Handle action results from other players
    const handleActionResult = (event: CustomEvent) => {
      const payload = event.detail;
      if (!gameRef.current || !payload.targetId) return;

      // Show damage/healing VFX
      if (payload.damage) {
        gameRef.current.showDamage(
          payload.targetId,
          payload.damage.amount,
          payload.damage.isCritical
        );
        // Trigger a state refresh to get updated HP
        loadSession(sessionId);
      }
      if (payload.healing) {
        gameRef.current.showHealing(payload.targetId, payload.healing);
      }
    };

    // Handle token updates (HP, conditions)
    const handleTokenUpdate = () => {
      if (!gameRef.current) return;
      // Refresh game state to get latest
      loadSession(sessionId);
    };

    // Handle game state sync
    const handleGameStateSync = () => {
      // Refresh the full game state
      loadSession(sessionId);
    };

    // Add event listeners
    window.addEventListener('ws:action-result', handleActionResult as EventListener);
    window.addEventListener('ws:token-update', handleTokenUpdate as EventListener);
    window.addEventListener('ws:game-state-sync', handleGameStateSync as EventListener);

    return () => {
      window.removeEventListener('ws:action-result', handleActionResult as EventListener);
      window.removeEventListener('ws:token-update', handleTokenUpdate as EventListener);
      window.removeEventListener('ws:game-state-sync', handleGameStateSync as EventListener);
    };
  }, [gameState, sessionId, loadSession]);

  // Load session data
  useEffect(() => {
    if (!token || !sessionId) return;

    loadSession(sessionId).catch((err) => {
      console.error('Failed to load session:', err);
    });

    return () => {
      reset();
    };
  }, [token, sessionId, loadSession, reset]);

  // Load maps and encounters for DM
  useEffect(() => {
    if (!isDM || !sessionId) return;

    loadMaps(sessionId);
    loadEncounters(sessionId);
  }, [isDM, sessionId, loadMaps, loadEncounters]);

  // Set game phase for immersive audio/visuals
  useEffect(() => {
    if (!session) return;

    if (session.inCombat || combat.isInCombat) {
      setGamePhase('combat');
    } else {
      setGamePhase('exploration');
    }
  }, [session?.inCombat, combat.isInCombat, setGamePhase, session]);

  // Adjust combat intensity based on HP levels of player characters
  useEffect(() => {
    if (!combat.isInCombat || !gameState?.creatures) return;

    const playerCharacters = gameState.creatures.filter(c => c.type === 'character');
    if (playerCharacters.length === 0) return;

    // Calculate average HP percentage
    const totalHpPercent = playerCharacters.reduce((sum, c) => {
      return sum + (c.currentHitPoints / c.maxHitPoints);
    }, 0);
    const avgHpPercent = totalHpPercent / playerCharacters.length;

    // Check if any player is at low HP (below 25%)
    const anyLowHp = playerCharacters.some(c => c.currentHitPoints / c.maxHitPoints < 0.25);

    // Check if any player is unconscious (0 HP)
    const anyUnconscious = playerCharacters.some(c => c.currentHitPoints <= 0);

    // Determine intensity
    if (anyUnconscious) {
      setCombatIntensity('boss'); // Maximum tension when someone is down
    } else if (anyLowHp || avgHpPercent < 0.4) {
      setCombatIntensity('high');
    } else if (avgHpPercent < 0.7) {
      setCombatIntensity('medium');
    } else {
      setCombatIntensity('low');
    }
  }, [combat.isInCombat, gameState?.creatures, setCombatIntensity]);

  // Play victory when combat ends with all enemies defeated
  useEffect(() => {
    if (!combat.isInCombat && gameState?.creatures) {
      const enemies = gameState.creatures.filter(c => c.type === 'monster');
      const allDefeated = enemies.length > 0 && enemies.every(e => e.currentHitPoints <= 0);

      if (allDefeated) {
        playVictory();
      }
    }
  }, [combat.isInCombat, gameState?.creatures, playVictory]);

  // Set ambient soundscape based on map
  useEffect(() => {
    if (!currentMap) return;

    // Determine location type from map name or tags
    const mapName = currentMap.name.toLowerCase();

    if (mapName.includes('dungeon') || mapName.includes('cave') || mapName.includes('crypt')) {
      enterLocation('dungeon');
    } else if (mapName.includes('forest') || mapName.includes('woods')) {
      enterLocation('forest');
    } else if (mapName.includes('tavern') || mapName.includes('inn')) {
      enterLocation('tavern');
    } else if (mapName.includes('castle') || mapName.includes('throne')) {
      enterLocation('castle');
    } else if (mapName.includes('village')) {
      enterLocation('village');
    } else if (mapName.includes('town') || mapName.includes('city')) {
      enterLocation('city');
    } else if (mapName.includes('swamp') || mapName.includes('marsh')) {
      enterLocation('swamp');
    } else if (mapName.includes('mountain') || mapName.includes('peak')) {
      enterLocation('mountain');
    } else if (mapName.includes('ocean') || mapName.includes('sea') || mapName.includes('beach')) {
      enterLocation('ocean');
    } else {
      // Default to dungeon ambience for battle maps
      enterLocation('dungeon');
    }
  }, [currentMap, enterLocation]);

  // Detect HP changes and play sound/visual effects
  useEffect(() => {
    if (!gameState?.creatures) return;

    const tileSize = 48; // Match game tile size
    const containerRect = containerRef.current?.getBoundingClientRect();

    for (const creature of gameState.creatures) {
      const prevHp = prevCreatureHp.current.get(creature.id);

      if (prevHp !== undefined) {
        const hpChange = creature.currentHitPoints - prevHp;

        // Calculate screen position for VFX (centered on creature)
        const screenX = containerRect
          ? containerRect.left + creature.position.x * tileSize + tileSize / 2
          : window.innerWidth / 2;
        const screenY = containerRect
          ? containerRect.top + creature.position.y * tileSize + tileSize / 2
          : window.innerHeight / 2;

        const position = { x: screenX, y: screenY };

        if (hpChange < 0) {
          // Took damage
          const damageAmount = Math.abs(hpChange);
          const isCritical = damageAmount > creature.maxHitPoints * 0.3; // 30%+ max HP = critical

          if (isCritical) {
            // playCriticalHit includes both VFX and SFX
            playCriticalHit(position);
          } else {
            // playDamage includes both VFX and SFX
            playDamage(damageAmount, position);
          }
        } else if (hpChange > 0) {
          // Received healing - playHeal includes both VFX and SFX
          playHeal(hpChange, position);
        }
      }

      // Update tracked HP
      prevCreatureHp.current.set(creature.id, creature.currentHitPoints);
    }
  }, [gameState?.creatures, playDamage, playHeal, playCriticalHit]);

  // Initialize game
  useEffect(() => {
    if (!containerRef.current || !gameState || gameRef.current) return;

    const game = new GameApplication({
      containerId: 'game-container',
      tileSize: 48,
      gridWidth: gameState.map.width,
      gridHeight: gameState.map.height,
      onTileClick: (pos) => {
        setSelectedTile(pos);
        // If in movement mode, handle tile click for movement
        movement.handleTileClick(pos);
      },
      onTileHover: (pos) => {
        movement.handleTileHover(pos);
      },
      onTokenClick: (id) => {
        setSelectedCreature(id);
        // Handle token click for targeting
        movement.handleTokenClick(id);
      },
    });

    gameRef.current = game;

    game.ready().then(() => {
      game.loadState(gameState);
      // Reveal fog based on player positions if not DM
      if (!isDM) {
        gameState.creatures
          .filter((c) => c.type === 'character')
          .forEach((c) => {
            game.revealFog(c.position.x, c.position.y, 30);
          });
      } else {
        game.revealAllFog();
      }
    });

    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, [gameState, isDM]);

  // Update game state when it changes
  useEffect(() => {
    if (!gameRef.current || !gameState) return;

    gameRef.current.ready().then(() => {
      gameRef.current?.loadState(gameState);
    });
  }, [gameState]);

  // Highlight tiles for movement/targeting
  useEffect(() => {
    if (!gameRef.current) return;

    if (movement.highlightedTiles.length > 0) {
      // Different colors for different modes
      const color = movement.interactionMode === 'move' ? 0x22C55E : 0xEF4444; // Green for move, red for target
      gameRef.current.highlightTiles(movement.highlightedTiles, color, 0.3);
    } else {
      gameRef.current.clearHighlights();
    }
  }, [movement.highlightedTiles, movement.interactionMode]);

  // Show path preview when hovering during movement
  useEffect(() => {
    if (!gameRef.current || movement.interactionMode !== 'move') return;

    if (movement.selectedPath.length > 0) {
      // Show path as brighter highlight
      gameRef.current.highlightTiles(movement.selectedPath, 0x3B82F6, 0.5); // Blue for path
    }
  }, [movement.selectedPath, movement.interactionMode]);

  // Auto-confirm attack when target is selected via board click during targeting mode
  useEffect(() => {
    if (
      movement.interactionMode === 'target' &&
      combat.selectedTargetId &&
      combat.selectedAction?.requiresTarget
    ) {
      // Execute the attack after a brief delay for visual feedback
      const timer = setTimeout(() => {
        handleConfirmAttack();
        movement.cancelMode();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [movement.interactionMode, combat.selectedTargetId, combat.selectedAction, handleConfirmAttack, movement]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (!gameRef.current) return;
    const newZoom = Math.min(4, zoom * 1.2);
    gameRef.current.setZoom(newZoom);
    setZoom(newZoom);
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    if (!gameRef.current) return;
    const newZoom = Math.max(0.25, zoom / 1.2);
    gameRef.current.setZoom(newZoom);
    setZoom(newZoom);
  }, [zoom]);

  const handleResetCamera = useCallback(() => {
    if (!gameRef.current) return;
    gameRef.current.resetCamera();
    setZoom(1);
  }, []);

  // Handle map change
  const handleMapChange = useCallback(
    async (mapId: string | null) => {
      try {
        await changeMap(sessionId, mapId);
        // Reinitialize game with new map
        if (gameRef.current) {
          gameRef.current.destroy();
          gameRef.current = null;
        }
      } catch (err) {
        console.error('Failed to change map:', err);
      }
    },
    [sessionId, changeMap]
  );

  // Loading state
  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 spinner border-4 mx-auto mb-4" />
          <p className="text-text-secondary">Loading game session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-cinzel text-text-primary mb-2">Failed to Load Session</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 bg-primary text-bg-dark rounded-lg font-medium"
            >
              Return to Dashboard
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  // No session loaded
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary">Session not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-border/50 backdrop-blur-md z-10">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3">
            <Link href={isDM ? '/dm' : '/dashboard'}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-bg-elevated transition-colors"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
            </Link>
            <div>
              <h1 className="text-lg font-cinzel text-primary">{session.name}</h1>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>{session.campaign.name}</span>
                <span className="text-text-muted">|</span>
                <span className={session.inCombat ? 'text-red-400' : 'text-green-400'}>
                  {session.inCombat ? `Combat - Round ${session.round}` : 'Exploration'}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Session Status */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Players:</span>
              <span className="text-sm text-text-primary">
                {session.participants.filter((p) => p.role === 'player').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Invite:</span>
              <code className="text-sm text-primary bg-bg-elevated px-2 py-0.5 rounded">
                {session.inviteCode}
              </code>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Audio Controls */}
            <AudioControls />

            {isDM && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDMControls(!showDMControls)}
                className={`p-2 rounded-lg transition-colors ${
                  showDMControls ? 'bg-primary text-bg-dark' : 'bg-bg-elevated hover:bg-border'
                }`}
                title="DM Controls"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPlayerPanel(!showPlayerPanel)}
              className={`p-2 rounded-lg transition-colors ${
                showPlayerPanel ? 'bg-primary/20 text-primary' : 'bg-bg-elevated hover:bg-border'
              }`}
              title="Player Panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* DM Controls Sidebar */}
        <AnimatePresence>
          {isDM && showDMControls && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-bg-card border-r border-border overflow-hidden"
            >
              <DMControls
                sessionId={sessionId}
                session={session}
                availableMaps={availableMaps}
                currentMapId={session.currentMapId}
                onMapChange={handleMapChange}
                game={gameRef.current}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Canvas */}
        <div className="flex-1 relative">
          <div id="game-container" ref={containerRef} className="absolute inset-0" />

          {/* Note: VFX are handled by ImmersiveProvider's VFXManager component */}

          {/* No Map Message */}
          {!currentMap && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-dark/80">
              <div className="text-center">
                <svg className="w-16 h-16 text-text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h3 className="text-lg font-cinzel text-text-primary mb-2">No Map Loaded</h3>
                <p className="text-sm text-text-muted">
                  {isDM ? 'Select a map from the DM Controls panel' : 'Waiting for the DM to load a map'}
                </p>
              </div>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleZoomIn}
              className="w-10 h-10 bg-bg-card/80 backdrop-blur rounded-lg flex items-center justify-center text-xl font-bold hover:bg-primary/20 border border-border"
            >
              +
            </motion.button>
            <div className="text-center text-xs text-text-muted">{Math.round(zoom * 100)}%</div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleZoomOut}
              className="w-10 h-10 bg-bg-card/80 backdrop-blur rounded-lg flex items-center justify-center text-xl font-bold hover:bg-primary/20 border border-border"
            >
              -
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResetCamera}
              className="w-10 h-10 bg-bg-card/80 backdrop-blur rounded-lg flex items-center justify-center hover:bg-primary/20 border border-border"
              title="Reset Camera"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </motion.button>
          </div>

          {/* Position Info */}
          <div className="absolute top-4 left-4 bg-bg-card/80 backdrop-blur rounded-lg p-3 text-sm z-10 border border-border">
            <div className="text-text-muted">
              Selected: {selectedTile ? `(${selectedTile.x}, ${selectedTile.y})` : 'None'}
            </div>
            <div className="text-text-muted">Creature: {selectedCreature || 'None'}</div>
          </div>

          {/* Initiative Tracker (Combat) */}
          {(session.inCombat || combat.isInCombat) && (
            <div className="absolute top-4 right-4 z-10">
              <InitiativeTracker
                initiativeOrder={combat.isInCombat ? combat.initiativeOrder : (session.initiativeOrder || [])}
                currentTurn={combat.isInCombat ?
                  combat.initiativeOrder.findIndex(e => e.creatureId === combat.currentTurnCreatureId) :
                  session.currentTurn}
                creatures={gameState?.creatures || []}
              />
            </div>
          )}
        </div>

        {/* Player Panel Sidebar */}
        <AnimatePresence>
          {showPlayerPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-bg-card border-l border-border overflow-hidden"
            >
              <PlayerPanel
                participants={session.participants}
                isDM={isDM}
                selectedCreature={selectedCreature}
                onSelectCreature={setSelectedCreature}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Combat Action Bar - Bottom of screen */}
      <CombatActionBar
        combatState={{
          isInCombat: combat.isInCombat,
          round: combat.round,
          currentTurnCreatureId: combat.currentTurnCreatureId,
          initiativeOrder: combat.initiativeOrder,
          selectedTargetId: combat.selectedTargetId,
          selectedAction: combat.selectedAction,
          isSelectingTarget: combat.isSelectingTarget,
          combatLog: combat.combatLog,
          actionEconomy: combat.actionEconomy,
          hasAdvantage: combat.hasAdvantage,
          hasDisadvantage: combat.hasDisadvantage,
        }}
        currentCreature={creatures.find(c => c.id === combat.currentTurnCreatureId) || null}
        availableActions={combat.getAvailableActions()}
        validTargets={combat.getValidTargets()}
        creatures={creatures}
        isDM={isDM}
        onSelectAction={combat.selectAction}
        onSelectTarget={combat.selectTarget}
        onConfirmAttack={handleConfirmAttack}
        onCancelAction={combat.cancelAction}
        onApplyDamage={handleApplyDamage}
        onApplyHealing={handleApplyHealing}
        onEndTurn={combat.nextTurn}
        onStartCombat={combat.startCombat}
        onEndCombat={combat.endCombat}
        isInRange={combat.isInRange}
        getDistance={combat.getDistance}
        canPerformAction={combat.canPerformAction}
        performDash={combat.performDash}
        performDisengage={combat.performDisengage}
        performDodge={combat.performDodge}
        useMovement={combat.useMovement}
        getRemainingMovement={combat.getRemainingMovement}
        // Movement system integration
        isMovementMode={movement.interactionMode === 'move'}
        canMove={movement.canMove}
        onStartMovement={movement.startMovementMode}
        onCancelMovement={movement.cancelMode}
        // Targeting system integration
        onStartTargeting={movement.startTargetingMode}
        onCancelTargeting={movement.cancelMode}
        // Spell casting
        casterClass={currentCreatureCharacter?.class}
        casterLevel={currentCreatureCharacter?.level}
        spellSlots={currentCreatureSpellSlots}
        onCastSpell={handleCastSpell}
        // Advantage/Disadvantage
        onSetAdvantage={combat.setAdvantage}
        onSetDisadvantage={combat.setDisadvantage}
      />
    </div>
  );
}
