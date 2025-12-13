/**
 * D&D 5e Spell System
 * RAW implementation of spellcasting, spell slots, and concentration
 */

import type {
  SpellSlots,
  ConcentrationCheckInput,
  ConcentrationCheckResult,
  SpellSaveDCInput,
  AoEInput,
  GridPosition,
} from './types';
import { rollD20 } from './dice';

/**
 * Calculate spell save DC (RAW 5e)
 *
 * PHB p.205: "Spell save DC = 8 + your proficiency bonus +
 * your spellcasting ability modifier"
 */
export function calculateSpellSaveDC(input: SpellSaveDCInput): number {
  return 8 + input.proficiencyBonus + input.spellcastingAbilityMod;
}

/**
 * Calculate spell attack bonus (RAW 5e)
 *
 * PHB p.205: "Spell attack modifier = your proficiency bonus +
 * your spellcasting ability modifier"
 */
export function calculateSpellAttackBonus(input: SpellSaveDCInput): number {
  return input.proficiencyBonus + input.spellcastingAbilityMod;
}

/**
 * Create empty spell slots
 */
export function createEmptySpellSlots(): SpellSlots {
  return {
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    level5: 0,
    level6: 0,
    level7: 0,
    level8: 0,
    level9: 0,
  };
}

/**
 * Get spell slots for a full caster by level (RAW 5e PHB p.165)
 */
export function getFullCasterSlots(classLevel: number): SpellSlots {
  const slotTable: Record<number, SpellSlots> = {
    1: { level1: 2, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    2: { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    3: { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    4: { level1: 4, level2: 3, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    5: { level1: 4, level2: 3, level3: 2, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    6: { level1: 4, level2: 3, level3: 3, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    7: { level1: 4, level2: 3, level3: 3, level4: 1, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    8: { level1: 4, level2: 3, level3: 3, level4: 2, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    9: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 1, level6: 0, level7: 0, level8: 0, level9: 0 },
    10: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 0, level7: 0, level8: 0, level9: 0 },
    11: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 0, level8: 0, level9: 0 },
    12: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 0, level8: 0, level9: 0 },
    13: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 0, level9: 0 },
    14: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 0, level9: 0 },
    15: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 1, level9: 0 },
    16: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 1, level9: 0 },
    17: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 1, level9: 1 },
    18: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 3, level6: 1, level7: 1, level8: 1, level9: 1 },
    19: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 3, level6: 2, level7: 1, level8: 1, level9: 1 },
    20: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 3, level6: 2, level7: 2, level8: 1, level9: 1 },
  };

  return slotTable[Math.min(classLevel, 20)] || createEmptySpellSlots();
}

/**
 * Check if a spell slot is available
 */
export function hasSpellSlot(slots: SpellSlots, level: number): boolean {
  const key = `level${level}` as keyof SpellSlots;
  return (slots[key] || 0) > 0;
}

/**
 * Use a spell slot
 */
export function useSpellSlot(slots: SpellSlots, level: number): SpellSlots {
  const key = `level${level}` as keyof SpellSlots;
  if ((slots[key] || 0) <= 0) {
    throw new Error(`No level ${level} spell slots available`);
  }

  return {
    ...slots,
    [key]: slots[key] - 1,
  };
}

/**
 * Restore a spell slot
 */
export function restoreSpellSlot(slots: SpellSlots, level: number, max: SpellSlots): SpellSlots {
  const key = `level${level}` as keyof SpellSlots;
  const current = slots[key] || 0;
  const maximum = max[key] || 0;

  return {
    ...slots,
    [key]: Math.min(current + 1, maximum),
  };
}

/**
 * Restore all spell slots (long rest)
 */
export function restoreAllSpellSlots(max: SpellSlots): SpellSlots {
  return { ...max };
}

/**
 * Make a concentration check (RAW 5e)
 *
 * PHB p.203: "Whenever you take damage while you are concentrating on a spell,
 * you must make a Constitution saving throw to maintain your concentration.
 * The DC equals 10 or half the damage you take, whichever number is higher."
 */
export function resolveConcentrationCheck(input: ConcentrationCheckInput): ConcentrationCheckResult {
  const { damage, constitutionMod, roll: overrideRoll } = input;

  // DC is max(10, damage/2)
  const dc = Math.max(10, Math.floor(damage / 2));

  // Roll Constitution save
  const rollResult = rollD20(constitutionMod, overrideRoll);

  return {
    dc,
    roll: rollResult.dice[0],
    modifier: constitutionMod,
    total: rollResult.total,
    success: rollResult.total >= dc,
  };
}

/**
 * Check if concentration was broken
 */
export function wasConcentrationBroken(checkResult: ConcentrationCheckResult): boolean {
  return !checkResult.success;
}

/**
 * Get tiles affected by an AoE (RAW 5e)
 *
 * Uses grid-based calculations assuming 5ft squares
 * Follows the DMG optional grid rules
 */
export function getAoETiles(input: AoEInput): GridPosition[] {
  const { shape, origin, radius, size, length, width = 5, direction = 0 } = input;
  const tiles: GridPosition[] = [];

  // Convert feet to grid squares (5ft per square)
  const radiusSquares = radius ? Math.floor(radius / 5) : 0;
  const sizeSquares = size ? Math.floor(size / 5) : 0;
  const lengthSquares = length ? Math.floor(length / 5) : 0;
  const widthSquares = width ? Math.floor(width / 5) : 1;

  switch (shape) {
    case 'SPHERE':
    case 'CYLINDER':
      // Circular area centered on origin
      for (let dx = -radiusSquares; dx <= radiusSquares; dx++) {
        for (let dy = -radiusSquares; dy <= radiusSquares; dy++) {
          // Check if center of square is within radius
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radiusSquares) {
            tiles.push({ x: origin.x + dx, y: origin.y + dy });
          }
        }
      }
      break;

    case 'CUBE':
      // Square area, origin at one corner or edge
      for (let dx = 0; dx < sizeSquares; dx++) {
        for (let dy = 0; dy < sizeSquares; dy++) {
          tiles.push({ x: origin.x + dx, y: origin.y + dy });
        }
      }
      break;

    case 'CONE':
      // 60-degree cone from origin in direction
      // Simplified: width at end = length
      const dirRad = (direction * Math.PI) / 180;
      for (let dist = 1; dist <= lengthSquares; dist++) {
        const coneWidth = dist; // Width grows with distance
        for (let offset = -coneWidth; offset <= coneWidth; offset++) {
          const x = origin.x + Math.round(Math.cos(dirRad) * dist - Math.sin(dirRad) * offset * 0.5);
          const y = origin.y + Math.round(Math.sin(dirRad) * dist + Math.cos(dirRad) * offset * 0.5);
          if (!tiles.some(t => t.x === x && t.y === y)) {
            tiles.push({ x, y });
          }
        }
      }
      break;

    case 'LINE':
      // Line from origin in direction
      const lineDirRad = (direction * Math.PI) / 180;
      for (let dist = 0; dist <= lengthSquares; dist++) {
        const centerX = origin.x + Math.round(Math.cos(lineDirRad) * dist);
        const centerY = origin.y + Math.round(Math.sin(lineDirRad) * dist);

        // Add width perpendicular to line
        for (let w = 0; w < widthSquares; w++) {
          const offsetX = Math.round(-Math.sin(lineDirRad) * w);
          const offsetY = Math.round(Math.cos(lineDirRad) * w);
          const x = centerX + offsetX;
          const y = centerY + offsetY;
          if (!tiles.some(t => t.x === x && t.y === y)) {
            tiles.push({ x, y });
          }
        }
      }
      break;
  }

  return tiles;
}

/**
 * Check if a position is within an AoE
 */
export function isInAoE(position: GridPosition, aoeTiles: GridPosition[]): boolean {
  return aoeTiles.some(tile => tile.x === position.x && tile.y === position.y);
}

/**
 * Common spell damage formulas by spell level
 */
export const COMMON_SPELL_DAMAGE: Record<string, string> = {
  // Cantrips (scaling handled separately)
  'Fire Bolt': '1d10',
  'Ray of Frost': '1d8',
  'Eldritch Blast': '1d10',
  'Sacred Flame': '1d8',

  // Level 1
  'Burning Hands': '3d6',
  'Magic Missile': '1d4+1', // Per dart
  'Thunderwave': '2d8',
  'Guiding Bolt': '4d6',

  // Level 2
  'Scorching Ray': '2d6', // Per ray
  'Shatter': '3d8',

  // Level 3
  'Fireball': '8d6',
  'Lightning Bolt': '8d6',

  // Level 4
  'Ice Storm': '2d8+4d6',

  // Level 5
  'Cone of Cold': '8d8',
  'Flame Strike': '4d6+4d6',

  // Level 6
  'Chain Lightning': '10d8',
  'Disintegrate': '10d6+40',

  // Level 7
  'Delayed Blast Fireball': '12d6',
  'Finger of Death': '7d8+30',

  // Level 8
  'Sunburst': '12d6',

  // Level 9
  'Meteor Swarm': '40d6',
};

/**
 * Get cantrip damage dice based on character level (RAW 5e)
 *
 * PHB: Cantrips scale at levels 5, 11, and 17
 */
export function getCantripDamageDice(baseDice: string, characterLevel: number): string {
  // Parse base dice (e.g., "1d10" -> 1)
  const match = baseDice.match(/^(\d+)d(\d+)/);
  if (!match) return baseDice;

  const dieSize = match[2];
  let numDice = 1;

  if (characterLevel >= 17) {
    numDice = 4;
  } else if (characterLevel >= 11) {
    numDice = 3;
  } else if (characterLevel >= 5) {
    numDice = 2;
  }

  return `${numDice}d${dieSize}`;
}

/**
 * Calculate upcast damage (when casting at higher level)
 */
export function calculateUpcastDamage(
  baseFormula: string,
  baseLevel: number,
  castLevel: number,
  bonusDicePerLevel: string = '1d6'
): string {
  if (castLevel <= baseLevel) {
    return baseFormula;
  }

  const levelsAbove = castLevel - baseLevel;
  const match = bonusDicePerLevel.match(/^(\d+)d(\d+)/);
  if (!match) return baseFormula;

  const bonusCount = parseInt(match[1]) * levelsAbove;
  const bonusDie = match[2];

  // Parse base formula
  const baseMatch = baseFormula.match(/^(\d+)d(\d+)(.*)$/);
  if (!baseMatch) return baseFormula;

  const baseDice = parseInt(baseMatch[1]);
  const baseDie = baseMatch[2];
  const baseModifier = baseMatch[3] || '';

  // If same die type, combine
  if (baseDie === bonusDie) {
    return `${baseDice + bonusCount}d${baseDie}${baseModifier}`;
  }

  // Different die types, append
  return `${baseFormula}+${bonusCount}d${bonusDie}`;
}
