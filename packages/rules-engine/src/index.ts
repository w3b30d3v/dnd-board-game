/**
 * D&D 5e Rules Engine
 * RAW (Rules As Written) implementation of D&D 5th Edition mechanics
 *
 * @packageDocumentation
 */

// Types
export * from './types';

// Dice System
export {
  setSeed,
  getSeed,
  getDieMax,
  rollDie,
  rollDice,
  parseDiceFormula,
  roll,
  rollD20,
  rollWithAdvantage,
  rollWithDisadvantage,
  rollD20WithAdvantageState,
  rollCriticalDamage,
  calculateModifier,
} from './dice';

// Ability Checks & Saves
export {
  calculateAllModifiers,
  getAbilityModifier,
  resolveAbilityCheck,
  resolveSavingThrow,
  resolveContestedCheck,
  calculatePassiveScore,
  SKILL_ABILITIES,
  getSkillAbility,
} from './abilities';

// Conditions
export {
  getConditionEffects,
  getCombinedConditionEffects,
  canTakeActions,
  canTakeReactions,
  canMove,
  getExhaustionEffects,
  CONDITION_DESCRIPTIONS,
} from './conditions';

// Combat
export {
  resolveAttack,
  resolveAttackWithConditions,
  calculateDamage,
  applyDamage,
  applyHealing,
  checkInstantDeath,
  rollInitiative,
  sortByInitiative,
  isBloodied,
  isUnconscious,
  isDead,
  rollDeathSave,
  processDeathSave,
} from './combat';

// Spells
export {
  calculateSpellSaveDC,
  calculateSpellAttackBonus,
  createEmptySpellSlots,
  getFullCasterSlots,
  hasSpellSlot,
  useSpellSlot,
  restoreSpellSlot,
  restoreAllSpellSlots,
  resolveConcentrationCheck,
  wasConcentrationBroken,
  getAoETiles,
  isInAoE,
  COMMON_SPELL_DAMAGE,
  getCantripDamageDice,
  calculateUpcastDamage,
} from './spells';

// Convenience re-exports
export { ALL_DAMAGE_TYPES, ALL_CONDITIONS } from './types';
