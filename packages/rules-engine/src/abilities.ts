/**
 * D&D 5e Ability Checks and Saving Throws
 * RAW implementation of ability checks, saving throws, and skill checks
 */

import type {
  AbilityType,
  AbilityScores,
  AbilityModifiers,
  AbilityCheckInput,
  AbilityCheckResult,
  SavingThrowInput,
  SavingThrowResult,
  ConditionType,
} from './types';
import { rollD20WithAdvantageState, calculateModifier } from './dice';
import { getConditionEffects } from './conditions';

/**
 * Calculate all ability modifiers from ability scores
 */
export function calculateAllModifiers(scores: AbilityScores): AbilityModifiers {
  return {
    STR: calculateModifier(scores.STR),
    DEX: calculateModifier(scores.DEX),
    CON: calculateModifier(scores.CON),
    INT: calculateModifier(scores.INT),
    WIS: calculateModifier(scores.WIS),
    CHA: calculateModifier(scores.CHA),
  };
}

/**
 * Get the modifier for a specific ability
 */
export function getAbilityModifier(scores: AbilityScores, ability: AbilityType): number {
  return calculateModifier(scores[ability]);
}

/**
 * Resolve an ability check (RAW 5e)
 *
 * PHB p.174: "To make an ability check, roll a d20 and add the relevant
 * ability modifier. As with other d20 rolls, apply bonuses and penalties,
 * and compare the total to the DC."
 */
export function resolveAbilityCheck(input: AbilityCheckInput): AbilityCheckResult {
  const {
    // ability is used for typing, not runtime logic
    modifier,
    dc,
    advantage = false,
    disadvantage = false,
    proficient = false,
    proficiencyBonus = 0,
    roll: overrideRoll,
  } = input;

  // Calculate total modifier
  let totalModifier = modifier;
  if (proficient && proficiencyBonus > 0) {
    totalModifier += proficiencyBonus;
  }

  // Roll the d20
  const rollResult = rollD20WithAdvantageState(
    totalModifier,
    advantage,
    disadvantage,
    overrideRoll !== undefined ? [overrideRoll, overrideRoll] : undefined
  );

  // Determine success
  // RAW: A check succeeds if total >= DC
  const success = rollResult.total >= dc;

  return {
    roll: rollResult.dice[0],
    modifier: totalModifier,
    total: rollResult.total,
    dc,
    success,
    isNatural20: rollResult.isNatural20,
    isNatural1: rollResult.isNatural1,
  };
}

/**
 * Check if conditions cause auto-fail on saves
 */
function checkAutoFailConditions(
  ability: AbilityType,
  conditions: ConditionType[]
): { autoFail: boolean; reason?: string } {
  for (const condition of conditions) {
    const effects = getConditionEffects(condition);

    // Paralyzed and Stunned auto-fail STR and DEX saves
    if (ability === 'STR' && effects.autoFailStrengthSaves) {
      return { autoFail: true, reason: condition };
    }
    if (ability === 'DEX' && effects.autoFailDexteritySaves) {
      return { autoFail: true, reason: condition };
    }
  }

  return { autoFail: false };
}

/**
 * Check if conditions impose disadvantage on saves
 */
function checkDisadvantageConditions(conditions: ConditionType[]): boolean {
  for (const condition of conditions) {
    const effects = getConditionEffects(condition);
    if (effects.savesHaveDisadvantage) {
      return true;
    }
  }
  return false;
}

/**
 * Resolve a saving throw (RAW 5e)
 *
 * PHB p.179: "A saving throw—also called a save—represents an attempt
 * to resist a spell, a trap, a poison, a disease, or a similar threat."
 *
 * Key differences from ability checks:
 * - Certain conditions can cause auto-fail (e.g., Paralyzed fails STR/DEX)
 * - Some spells allow half damage on success
 */
export function resolveSavingThrow(input: SavingThrowInput): SavingThrowResult {
  const {
    ability,
    modifier,
    dc,
    advantage = false,
    disadvantage = false,
    proficient = false,
    proficiencyBonus = 0,
    conditions = [],
    roll: overrideRoll,
  } = input;

  // Check for auto-fail conditions
  const autoFailCheck = checkAutoFailConditions(ability, conditions);
  if (autoFailCheck.autoFail) {
    return {
      roll: 0,
      modifier,
      total: 0,
      dc,
      success: false,
      isNatural20: false,
      isNatural1: false,
      autoFail: true,
    };
  }

  // Check if conditions impose disadvantage
  const conditionDisadvantage = checkDisadvantageConditions(conditions);
  const effectiveDisadvantage = disadvantage || conditionDisadvantage;

  // Calculate total modifier
  let totalModifier = modifier;
  if (proficient && proficiencyBonus > 0) {
    totalModifier += proficiencyBonus;
  }

  // Roll the d20
  const rollResult = rollD20WithAdvantageState(
    totalModifier,
    advantage,
    effectiveDisadvantage,
    overrideRoll !== undefined ? [overrideRoll, overrideRoll] : undefined
  );

  // Determine success
  const success = rollResult.total >= dc;

  return {
    roll: rollResult.dice[0],
    modifier: totalModifier,
    total: rollResult.total,
    dc,
    success,
    isNatural20: rollResult.isNatural20,
    isNatural1: rollResult.isNatural1,
  };
}

/**
 * Resolve a contested check (e.g., grapple, shove)
 *
 * PHB p.174: "Sometimes one character's or monster's efforts are directly
 * opposed to another's. The participant with the higher check total wins."
 */
export function resolveContestedCheck(
  attacker: AbilityCheckInput,
  defender: AbilityCheckInput
): {
  attackerResult: AbilityCheckResult;
  defenderResult: AbilityCheckResult;
  winner: 'attacker' | 'defender' | 'tie';
} {
  // For contested checks, we set DC to 0 since we're comparing totals
  const attackerResult = resolveAbilityCheck({ ...attacker, dc: 0 });
  const defenderResult = resolveAbilityCheck({ ...defender, dc: 0 });

  let winner: 'attacker' | 'defender' | 'tie';
  if (attackerResult.total > defenderResult.total) {
    winner = 'attacker';
  } else if (defenderResult.total > attackerResult.total) {
    winner = 'defender';
  } else {
    // Tie - in most cases, the situation doesn't change
    // RAW doesn't specify, but common interpretation is defender wins ties
    winner = 'tie';
  }

  return {
    attackerResult,
    defenderResult,
    winner,
  };
}

/**
 * Calculate passive check score (RAW 5e)
 *
 * PHB p.175: "A passive check is a special kind of ability check that
 * doesn't involve any die rolls. Such a check can represent the average
 * result for a task done repeatedly."
 *
 * Formula: 10 + all modifiers (advantage gives +5, disadvantage gives -5)
 */
export function calculatePassiveScore(
  modifier: number,
  proficient: boolean = false,
  proficiencyBonus: number = 0,
  advantage: boolean = false,
  disadvantage: boolean = false
): number {
  let score = 10 + modifier;

  if (proficient) {
    score += proficiencyBonus;
  }

  // Advantage/disadvantage on passive checks
  if (advantage && !disadvantage) {
    score += 5;
  } else if (disadvantage && !advantage) {
    score -= 5;
  }

  return score;
}

/**
 * Standard D&D 5e skills and their associated abilities
 */
export const SKILL_ABILITIES: Record<string, AbilityType> = {
  // Strength
  'Athletics': 'STR',

  // Dexterity
  'Acrobatics': 'DEX',
  'Sleight of Hand': 'DEX',
  'Stealth': 'DEX',

  // Intelligence
  'Arcana': 'INT',
  'History': 'INT',
  'Investigation': 'INT',
  'Nature': 'INT',
  'Religion': 'INT',

  // Wisdom
  'Animal Handling': 'WIS',
  'Insight': 'WIS',
  'Medicine': 'WIS',
  'Perception': 'WIS',
  'Survival': 'WIS',

  // Charisma
  'Deception': 'CHA',
  'Intimidation': 'CHA',
  'Performance': 'CHA',
  'Persuasion': 'CHA',
};

/**
 * Get the ability associated with a skill
 */
export function getSkillAbility(skill: string): AbilityType | undefined {
  return SKILL_ABILITIES[skill];
}
