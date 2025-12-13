/**
 * D&D 5e Dice Rolling System
 * Supports all standard dice, advantage/disadvantage, and seeded rolls for testing
 */

import type {
  DieType,
  DiceRoll,
  RollResult,
  AdvantageRoll,
} from './types';

// Seeded random number generator for deterministic testing
let seed: number | null = null;

/**
 * Set seed for deterministic random rolls (for testing)
 */
export function setSeed(newSeed: number | null): void {
  seed = newSeed;
}

/**
 * Get current seed
 */
export function getSeed(): number | null {
  return seed;
}

/**
 * Seeded random number generator (mulberry32)
 */
function seededRandom(): number {
  if (seed === null) {
    return Math.random();
  }

  // mulberry32 algorithm
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

/**
 * Get the maximum value for a die type
 */
export function getDieMax(die: DieType): number {
  const dieValues: Record<DieType, number> = {
    'd4': 4,
    'd6': 6,
    'd8': 8,
    'd10': 10,
    'd12': 12,
    'd20': 20,
    'd100': 100,
  };
  return dieValues[die];
}

/**
 * Roll a single die
 */
export function rollDie(die: DieType): number {
  const max = getDieMax(die);
  return Math.floor(seededRandom() * max) + 1;
}

/**
 * Roll multiple dice of the same type
 */
export function rollDice(die: DieType, count: number): number[] {
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    results.push(rollDie(die));
  }
  return results;
}

/**
 * Parse a dice formula string (e.g., "2d6+3", "1d20", "3d8-2")
 */
export function parseDiceFormula(formula: string): DiceRoll {
  const match = formula.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);

  if (!match) {
    throw new Error(`Invalid dice formula: ${formula}`);
  }

  const count = match[1] ? parseInt(match[1], 10) : 1;
  const dieSize = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  // Validate die size
  const validDice = [4, 6, 8, 10, 12, 20, 100];
  if (!validDice.includes(dieSize)) {
    throw new Error(`Invalid die size: d${dieSize}`);
  }

  return {
    die: `d${dieSize}` as DieType,
    count,
    modifier,
  };
}

/**
 * Roll dice from a formula string
 */
export function roll(formula: string, overrideRoll?: number): RollResult {
  const parsed = parseDiceFormula(formula);

  let dice: number[];
  if (overrideRoll !== undefined) {
    // Use override for testing - distribute evenly across dice
    const perDie = Math.floor(overrideRoll / parsed.count);
    dice = Array(parsed.count).fill(perDie);
    // Add remainder to first die
    const remainder = overrideRoll - (perDie * parsed.count);
    if (dice.length > 0) {
      dice[0] += remainder;
    }
  } else {
    dice = rollDice(parsed.die, parsed.count);
  }

  const diceTotal = dice.reduce((sum, d) => sum + d, 0);
  const total = diceTotal + parsed.modifier;

  // Check for natural 20/1 (only meaningful for d20)
  const isNatural20 = parsed.die === 'd20' && parsed.count === 1 && dice[0] === 20;
  const isNatural1 = parsed.die === 'd20' && parsed.count === 1 && dice[0] === 1;

  return {
    dice,
    total,
    modifier: parsed.modifier,
    isNatural20,
    isNatural1,
    formula,
  };
}

/**
 * Roll a d20 (most common roll in D&D)
 */
export function rollD20(modifier: number = 0, overrideRoll?: number): RollResult {
  const dieRoll = overrideRoll ?? rollDie('d20');

  return {
    dice: [dieRoll],
    total: dieRoll + modifier,
    modifier,
    isNatural20: dieRoll === 20,
    isNatural1: dieRoll === 1,
    formula: modifier >= 0 ? `1d20+${modifier}` : `1d20${modifier}`,
  };
}

/**
 * Roll with advantage (roll twice, take higher)
 */
export function rollWithAdvantage(
  modifier: number = 0,
  overrideRolls?: [number, number]
): AdvantageRoll & RollResult {
  const roll1 = overrideRolls?.[0] ?? rollDie('d20');
  const roll2 = overrideRolls?.[1] ?? rollDie('d20');
  const used = Math.max(roll1, roll2);

  return {
    roll1,
    roll2,
    used,
    hadAdvantage: true,
    hadDisadvantage: false,
    dice: [used],
    total: used + modifier,
    modifier,
    isNatural20: used === 20,
    isNatural1: used === 1,
    formula: `1d20+${modifier} (advantage)`,
  };
}

/**
 * Roll with disadvantage (roll twice, take lower)
 */
export function rollWithDisadvantage(
  modifier: number = 0,
  overrideRolls?: [number, number]
): AdvantageRoll & RollResult {
  const roll1 = overrideRolls?.[0] ?? rollDie('d20');
  const roll2 = overrideRolls?.[1] ?? rollDie('d20');
  const used = Math.min(roll1, roll2);

  return {
    roll1,
    roll2,
    used,
    hadAdvantage: false,
    hadDisadvantage: true,
    dice: [used],
    total: used + modifier,
    modifier,
    isNatural20: used === 20,
    isNatural1: used === 1,
    formula: `1d20+${modifier} (disadvantage)`,
  };
}

/**
 * Roll with advantage or disadvantage based on flags
 * If both, they cancel out (roll normally)
 */
export function rollD20WithAdvantageState(
  modifier: number = 0,
  advantage: boolean = false,
  disadvantage: boolean = false,
  overrideRolls?: [number, number]
): RollResult & Partial<AdvantageRoll> {
  // Advantage and disadvantage cancel each other out
  if (advantage && disadvantage) {
    return rollD20(modifier, overrideRolls?.[0]);
  }

  if (advantage) {
    return rollWithAdvantage(modifier, overrideRolls);
  }

  if (disadvantage) {
    return rollWithDisadvantage(modifier, overrideRolls);
  }

  return rollD20(modifier, overrideRolls?.[0]);
}

/**
 * Roll for critical hit damage (double the dice)
 */
export function rollCriticalDamage(formula: string, overrideRoll?: number): RollResult {
  const parsed = parseDiceFormula(formula);

  // Double the number of dice
  const critCount = parsed.count * 2;
  const critFormula = `${critCount}${parsed.die}${parsed.modifier >= 0 ? '+' : ''}${parsed.modifier}`;

  return roll(critFormula, overrideRoll);
}

/**
 * Calculate ability modifier from ability score
 * RAW: modifier = floor((score - 10) / 2)
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
