/**
 * D&D 5e Rules Engine Types
 * RAW (Rules As Written) type definitions
 */

// ============================================================================
// DICE TYPES
// ============================================================================

export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DiceRoll {
  die: DieType;
  count: number;
  modifier: number;
}

export interface RollResult {
  dice: number[];           // Individual die results
  total: number;            // Sum of dice + modifier
  modifier: number;         // Modifier applied
  isNatural20: boolean;     // Natural 20 on d20
  isNatural1: boolean;      // Natural 1 on d20
  formula: string;          // e.g., "2d6+3"
}

export interface AdvantageRoll {
  roll1: number;
  roll2: number;
  used: number;             // The roll that was used
  hadAdvantage: boolean;
  hadDisadvantage: boolean;
}

// ============================================================================
// ABILITY TYPES
// ============================================================================

export type AbilityType = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface AbilityScores {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface AbilityModifiers {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface AbilityCheckInput {
  ability: AbilityType;
  modifier: number;
  dc: number;
  advantage?: boolean;
  disadvantage?: boolean;
  proficient?: boolean;
  proficiencyBonus?: number;
  roll?: number;            // For seeded/deterministic testing
}

export interface AbilityCheckResult {
  roll: number;             // The d20 roll
  modifier: number;         // Total modifier
  total: number;            // roll + modifier
  dc: number;               // Difficulty class
  success: boolean;         // Did the check succeed?
  isNatural20: boolean;
  isNatural1: boolean;
  autoFail?: boolean;       // Failed due to condition
  autoSuccess?: boolean;    // Succeeded automatically
}

export interface SavingThrowInput extends AbilityCheckInput {
  conditions?: ConditionType[];  // Active conditions affecting the save
}

export interface SavingThrowResult extends AbilityCheckResult {
  halfDamageOnSuccess?: boolean;  // For spells like Fireball
}

// ============================================================================
// DAMAGE TYPES
// ============================================================================

export type DamageType =
  | 'ACID'
  | 'BLUDGEONING'
  | 'COLD'
  | 'FIRE'
  | 'FORCE'
  | 'LIGHTNING'
  | 'NECROTIC'
  | 'PIERCING'
  | 'POISON'
  | 'PSYCHIC'
  | 'RADIANT'
  | 'SLASHING'
  | 'THUNDER';

export const ALL_DAMAGE_TYPES: DamageType[] = [
  'ACID', 'BLUDGEONING', 'COLD', 'FIRE', 'FORCE',
  'LIGHTNING', 'NECROTIC', 'PIERCING', 'POISON',
  'PSYCHIC', 'RADIANT', 'SLASHING', 'THUNDER'
];

export interface DamageInput {
  dice: string;             // e.g., "3d6" or "2d8+4"
  type: DamageType;
  roll?: number;            // For seeded testing (total of dice)
  isCritical?: boolean;     // Double dice on critical
}

export interface DamageTarget {
  resistances?: DamageType[];
  vulnerabilities?: DamageType[];
  immunities?: DamageType[];
}

export interface DamageResult {
  baseDamage: number;       // Damage before modifiers
  finalDamage: number;      // Damage after resistances/vulnerabilities
  damageType: DamageType;
  wasResisted: boolean;     // Target had resistance
  wasVulnerable: boolean;   // Target had vulnerability
  wasImmune: boolean;       // Target was immune
  isCritical: boolean;
}

// ============================================================================
// ATTACK TYPES
// ============================================================================

export type AttackType = 'MELEE' | 'RANGED' | 'SPELL';

export interface AttackInput {
  attackBonus: number;      // Total attack bonus
  targetAC: number;         // Target's armor class
  advantage?: boolean;
  disadvantage?: boolean;
  roll?: number;            // For seeded testing
  roll2?: number;           // Second roll for advantage/disadvantage
}

export interface AttackResult {
  roll: number;             // The d20 roll used
  attackBonus: number;
  total: number;            // roll + attackBonus
  targetAC: number;
  hits: boolean;            // Does the attack hit?
  isCritical: boolean;      // Natural 20
  isCriticalMiss: boolean;  // Natural 1
  hadAdvantage: boolean;
  hadDisadvantage: boolean;
}

// ============================================================================
// CONDITION TYPES
// ============================================================================

export type ConditionType =
  | 'BLINDED'
  | 'CHARMED'
  | 'DEAFENED'
  | 'EXHAUSTION'
  | 'FRIGHTENED'
  | 'GRAPPLED'
  | 'INCAPACITATED'
  | 'INVISIBLE'
  | 'PARALYZED'
  | 'PETRIFIED'
  | 'POISONED'
  | 'PRONE'
  | 'RESTRAINED'
  | 'STUNNED'
  | 'UNCONSCIOUS';

export const ALL_CONDITIONS: ConditionType[] = [
  'BLINDED', 'CHARMED', 'DEAFENED', 'EXHAUSTION', 'FRIGHTENED',
  'GRAPPLED', 'INCAPACITATED', 'INVISIBLE', 'PARALYZED', 'PETRIFIED',
  'POISONED', 'PRONE', 'RESTRAINED', 'STUNNED', 'UNCONSCIOUS'
];

export interface ConditionEffects {
  // Attack modifiers
  attacksHaveDisadvantage?: boolean;
  attacksAgainstHaveAdvantage?: boolean;
  attacksAgainstHaveDisadvantage?: boolean;

  // Save modifiers
  autoFailStrengthSaves?: boolean;
  autoFailDexteritySaves?: boolean;
  savesHaveDisadvantage?: boolean;

  // Ability check modifiers
  abilityChecksHaveDisadvantage?: boolean;

  // Movement
  speedReduced?: boolean;
  speedZero?: boolean;
  cannotMove?: boolean;

  // Actions
  cannotTakeActions?: boolean;
  cannotTakeReactions?: boolean;
  cannotSpeak?: boolean;

  // Special
  automaticCriticalOnHit?: boolean;  // Attacks within 5ft auto-crit (paralyzed/unconscious)
  dropsHeldItems?: boolean;
  fallsProne?: boolean;

  // Exhaustion level (1-6)
  exhaustionLevel?: number;
}

// ============================================================================
// SPELL TYPES
// ============================================================================

export type SpellSchool =
  | 'ABJURATION'
  | 'CONJURATION'
  | 'DIVINATION'
  | 'ENCHANTMENT'
  | 'EVOCATION'
  | 'ILLUSION'
  | 'NECROMANCY'
  | 'TRANSMUTATION';

export interface SpellSlots {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
  level6: number;
  level7: number;
  level8: number;
  level9: number;
}

export interface ConcentrationCheckInput {
  damage: number;
  constitutionMod: number;
  roll?: number;            // For seeded testing
}

export interface ConcentrationCheckResult {
  dc: number;               // DC is max(10, damage/2)
  roll: number;
  modifier: number;
  total: number;
  success: boolean;
}

export interface SpellSaveDCInput {
  spellcastingAbilityMod: number;
  proficiencyBonus: number;
}

// ============================================================================
// COMBAT TYPES
// ============================================================================

export interface InitiativeInput {
  dexterityMod: number;
  bonus?: number;           // Additional initiative bonus
  advantage?: boolean;      // e.g., from Alert feat
  roll?: number;            // For seeded testing
}

export interface InitiativeResult {
  roll: number;
  modifier: number;
  total: number;
}

export interface CombatantInitiative {
  id: string;
  name: string;
  initiative: number;
  dexterity: number;        // Tiebreaker
}

// ============================================================================
// AOE TYPES
// ============================================================================

export type AoEShape = 'SPHERE' | 'CUBE' | 'CONE' | 'LINE' | 'CYLINDER';

export interface AoEInput {
  shape: AoEShape;
  origin: { x: number; y: number };
  radius?: number;          // For sphere, cylinder
  size?: number;            // For cube
  length?: number;          // For line, cone
  width?: number;           // For line (default 5ft)
  direction?: number;       // Angle in degrees for cone/line
}

export interface GridPosition {
  x: number;
  y: number;
}

// ============================================================================
// CREATURE TYPES
// ============================================================================

export interface CreatureStats {
  maxHitPoints: number;
  currentHitPoints: number;
  temporaryHitPoints: number;
  armorClass: number;
  abilities: AbilityScores;
  proficiencyBonus: number;
  speed: number;
  conditions: ConditionType[];
  resistances: DamageType[];
  vulnerabilities: DamageType[];
  immunities: DamageType[];
  conditionImmunities: ConditionType[];
}

// ============================================================================
// RULE ENGINE CONFIG
// ============================================================================

export interface RulesEngineConfig {
  seed?: number;            // For deterministic random
  criticalHitRule?: 'RAW' | 'MAX_DAMAGE';  // RAW = double dice, MAX = max + roll
  flanking?: boolean;       // Optional flanking rule
  criticalFumbles?: boolean; // Optional fumble table
}
