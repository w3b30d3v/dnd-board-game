/**
 * D&D 5e Combat System
 * RAW implementation of attack rolls, damage calculation, and combat mechanics
 */

import type {
  AttackInput,
  AttackResult,
  DamageInput,
  DamageResult,
  DamageTarget,
  ConditionType,
  InitiativeInput,
  InitiativeResult,
  CombatantInitiative,
} from './types';
import { rollD20WithAdvantageState, roll, rollCriticalDamage, rollDie } from './dice';
import { getCombinedConditionEffects } from './conditions';

/**
 * Resolve an attack roll (RAW 5e)
 *
 * PHB p.194: "When you make an attack, your attack roll determines whether
 * the attack hits or misses. To make an attack roll, roll a d20 and add
 * the appropriate modifiers. If the total of the roll plus modifiers
 * equals or exceeds the target's Armor Class (AC), the attack hits."
 */
export function resolveAttack(input: AttackInput): AttackResult {
  const {
    attackBonus,
    targetAC,
    advantage = false,
    disadvantage = false,
    roll: overrideRoll,
    roll2: overrideRoll2,
  } = input;

  // Roll the attack
  const rollResult = rollD20WithAdvantageState(
    attackBonus,
    advantage,
    disadvantage,
    overrideRoll !== undefined
      ? [overrideRoll, overrideRoll2 ?? overrideRoll]
      : undefined
  );

  const dieRoll = rollResult.dice[0];

  // Natural 20 always hits (critical hit)
  // Natural 1 always misses (critical miss)
  // RAW PHB p.194
  let hits: boolean;
  if (dieRoll === 20) {
    hits = true;
  } else if (dieRoll === 1) {
    hits = false;
  } else {
    hits = rollResult.total >= targetAC;
  }

  return {
    roll: dieRoll,
    attackBonus,
    total: rollResult.total,
    targetAC,
    hits,
    isCritical: dieRoll === 20,
    isCriticalMiss: dieRoll === 1,
    hadAdvantage: advantage && !disadvantage,
    hadDisadvantage: disadvantage && !advantage,
  };
}

/**
 * Resolve attack with attacker/defender conditions
 */
export function resolveAttackWithConditions(
  input: AttackInput,
  attackerConditions: ConditionType[] = [],
  defenderConditions: ConditionType[] = [],
  attackerWithin5Feet: boolean = true
): AttackResult {
  const attackerEffects = getCombinedConditionEffects(attackerConditions);
  const defenderEffects = getCombinedConditionEffects(defenderConditions);

  // Determine advantage/disadvantage from conditions
  let advantage = input.advantage ?? false;
  let disadvantage = input.disadvantage ?? false;

  // Attacker conditions
  if (attackerEffects.attacksHaveDisadvantage) {
    disadvantage = true;
  }

  // Defender conditions
  if (defenderEffects.attacksAgainstHaveAdvantage) {
    advantage = true;
  }
  if (defenderEffects.attacksAgainstHaveDisadvantage) {
    disadvantage = true;
  }

  // Prone special case: advantage if within 5ft, disadvantage if beyond
  if (defenderConditions.includes('PRONE')) {
    if (attackerWithin5Feet) {
      advantage = true;
    } else {
      disadvantage = true;
    }
  }

  // Invisible attacker has advantage (not in defenderEffects)
  if (attackerConditions.includes('INVISIBLE')) {
    advantage = true;
  }

  const result = resolveAttack({
    ...input,
    advantage,
    disadvantage,
  });

  // Check for automatic critical (paralyzed/unconscious within 5ft)
  if (result.hits && attackerWithin5Feet && defenderEffects.automaticCriticalOnHit) {
    return {
      ...result,
      isCritical: true,
    };
  }

  return result;
}

/**
 * Calculate damage with resistances, vulnerabilities, and immunities (RAW 5e)
 *
 * PHB p.197: "Resistance and then vulnerability are applied after all
 * other modifiers to damage."
 */
export function calculateDamage(
  input: DamageInput,
  target?: DamageTarget
): DamageResult {
  const { dice, type, roll: overrideRoll, isCritical = false } = input;

  // Roll damage
  let rollResult;
  if (isCritical) {
    rollResult = rollCriticalDamage(dice, overrideRoll);
  } else {
    rollResult = roll(dice, overrideRoll);
  }

  const baseDamage = rollResult.total;
  let finalDamage = baseDamage;

  // Check target modifiers
  let wasResisted = false;
  let wasVulnerable = false;
  let wasImmune = false;

  if (target) {
    // Immunity (no damage)
    if (target.immunities?.includes(type)) {
      finalDamage = 0;
      wasImmune = true;
    }
    // Resistance (half damage, rounded down)
    else if (target.resistances?.includes(type)) {
      finalDamage = Math.floor(baseDamage / 2);
      wasResisted = true;
    }
    // Vulnerability (double damage)
    else if (target.vulnerabilities?.includes(type)) {
      finalDamage = baseDamage * 2;
      wasVulnerable = true;
    }
  }

  return {
    baseDamage,
    finalDamage,
    damageType: type,
    wasResisted,
    wasVulnerable,
    wasImmune,
    isCritical,
  };
}

/**
 * Apply damage to a creature (RAW 5e)
 *
 * PHB p.196: "Damage reduces hit points. When you take damage, you subtract
 * that damage from your hit points. Temporary hit points are lost first."
 */
export function applyDamage(
  currentHP: number,
  _maxHP: number,  // Kept for API consistency, not used in damage calculation
  tempHP: number,
  damage: number
): { newHP: number; newTempHP: number; excessDamage: number } {
  let remainingDamage = damage;

  // Temp HP absorbs damage first
  let newTempHP = tempHP;
  if (newTempHP > 0) {
    if (remainingDamage >= newTempHP) {
      remainingDamage -= newTempHP;
      newTempHP = 0;
    } else {
      newTempHP -= remainingDamage;
      remainingDamage = 0;
    }
  }

  // Apply remaining damage to HP
  let newHP = currentHP - remainingDamage;
  let excessDamage = 0;

  // Track excess damage (for massive damage / instant death)
  if (newHP < 0) {
    excessDamage = Math.abs(newHP);
    newHP = 0;
  }

  return { newHP, newTempHP, excessDamage };
}

/**
 * Apply healing to a creature (RAW 5e)
 *
 * PHB p.197: "Unless it results in death, damage isn't permanent. Rest can
 * restore a creature's hit points, and magical methods such as a cure wounds
 * spell or a potion of healing can remove damage in an instant."
 */
export function applyHealing(
  currentHP: number,
  maxHP: number,
  healing: number
): number {
  // Can't exceed max HP
  return Math.min(currentHP + healing, maxHP);
}

/**
 * Check for massive damage / instant death (RAW 5e)
 *
 * PHB p.197: "Massive damage can kill you instantly. When damage reduces
 * you to 0 hit points and there is damage remaining, you die if the
 * remaining damage equals or exceeds your hit point maximum."
 */
export function checkInstantDeath(
  maxHP: number,
  excessDamage: number
): boolean {
  return excessDamage >= maxHP;
}

/**
 * Roll initiative (RAW 5e)
 *
 * PHB p.189: "At the beginning of every combat, you roll initiative by
 * making a Dexterity check. Initiative determines the order of turns
 * during combat."
 */
export function rollInitiative(input: InitiativeInput): InitiativeResult {
  const { dexterityMod, bonus = 0, advantage = false, roll: overrideRoll } = input;

  const totalMod = dexterityMod + bonus;

  // Roll with possible advantage (e.g., from Alert feat)
  const rollResult = rollD20WithAdvantageState(
    totalMod,
    advantage,
    false,
    overrideRoll !== undefined ? [overrideRoll, overrideRoll] : undefined
  );

  return {
    roll: rollResult.dice[0],
    modifier: totalMod,
    total: rollResult.total,
  };
}

/**
 * Sort combatants by initiative (RAW 5e)
 *
 * PHB p.189: "If a tie occurs, the DM decides the order among tied
 * DM-controlled creatures, and the players decide the order among
 * their tied characters."
 *
 * Common house rule: Higher DEX breaks ties, then coinflip
 */
export function sortByInitiative(combatants: CombatantInitiative[]): CombatantInitiative[] {
  return [...combatants].sort((a, b) => {
    // Higher initiative goes first
    if (b.initiative !== a.initiative) {
      return b.initiative - a.initiative;
    }
    // Tiebreaker: higher dexterity
    if (b.dexterity !== a.dexterity) {
      return b.dexterity - a.dexterity;
    }
    // If still tied, maintain original order (stable sort)
    return 0;
  });
}

/**
 * Check if creature is below half HP (bloodied)
 * Common house rule, not RAW but useful for display
 */
export function isBloodied(currentHP: number, maxHP: number): boolean {
  return currentHP <= maxHP / 2 && currentHP > 0;
}

/**
 * Check if creature is unconscious at 0 HP
 * RAW: PC at 0 HP is unconscious and must make death saves
 */
export function isUnconscious(currentHP: number, isPlayer: boolean): boolean {
  return currentHP <= 0 && isPlayer;
}

/**
 * Check if creature is dead
 * Monsters die at 0 HP, players need to fail death saves
 */
export function isDead(
  currentHP: number,
  isPlayer: boolean,
  deathSaveFailures: number = 0
): boolean {
  if (!isPlayer) {
    return currentHP <= 0;
  }
  return deathSaveFailures >= 3;
}

/**
 * Roll a death saving throw (RAW 5e)
 *
 * PHB p.197: "Whenever you start your turn with 0 hit points, you must
 * make a special saving throw, called a death saving throw, to determine
 * whether you creep closer to death or hang onto life."
 *
 * DC 10: Success/Failure
 * Natural 1: 2 failures
 * Natural 20: Regain 1 HP and become conscious
 */
export function rollDeathSave(overrideRoll?: number): {
  roll: number;
  successes: number;
  failures: number;
  stabilized: boolean;
  regainedConsciousness: boolean;
} {
  const dieRoll = overrideRoll ?? rollDie('d20');

  let successes = 0;
  let failures = 0;
  let stabilized = false;
  let regainedConsciousness = false;

  if (dieRoll === 1) {
    // Natural 1: 2 failures
    failures = 2;
  } else if (dieRoll === 20) {
    // Natural 20: Regain 1 HP, become conscious
    regainedConsciousness = true;
  } else if (dieRoll >= 10) {
    // Success
    successes = 1;
  } else {
    // Failure
    failures = 1;
  }

  return {
    roll: dieRoll,
    successes,
    failures,
    stabilized,
    regainedConsciousness,
  };
}

/**
 * Process death save result
 */
export function processDeathSave(
  currentSuccesses: number,
  currentFailures: number,
  saveResult: ReturnType<typeof rollDeathSave>
): {
  successes: number;
  failures: number;
  stabilized: boolean;
  dead: boolean;
  regainedConsciousness: boolean;
} {
  if (saveResult.regainedConsciousness) {
    return {
      successes: 0,
      failures: 0,
      stabilized: false,
      dead: false,
      regainedConsciousness: true,
    };
  }

  const successes = currentSuccesses + saveResult.successes;
  const failures = currentFailures + saveResult.failures;

  return {
    successes,
    failures,
    stabilized: successes >= 3,
    dead: failures >= 3,
    regainedConsciousness: false,
  };
}
