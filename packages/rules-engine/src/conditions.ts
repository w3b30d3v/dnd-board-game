/**
 * D&D 5e Conditions System
 * RAW implementation of all 15 conditions and their effects
 */

import type { ConditionType, ConditionEffects } from './types';

/**
 * Get the effects of a condition (RAW 5e PHB Appendix A)
 */
export function getConditionEffects(condition: ConditionType): ConditionEffects {
  switch (condition) {
    case 'BLINDED':
      // PHB p.290: A blinded creature can't see and automatically fails any
      // ability check that requires sight. Attack rolls against the creature
      // have advantage, and the creature's attack rolls have disadvantage.
      return {
        attacksHaveDisadvantage: true,
        attacksAgainstHaveAdvantage: true,
        // Note: "automatically fails checks requiring sight" is situational
      };

    case 'CHARMED':
      // PHB p.290: A charmed creature can't attack the charmer or target the
      // charmer with harmful abilities or magical effects. The charmer has
      // advantage on any ability check to interact socially with the creature.
      return {
        // Effects are target-specific and situational
      };

    case 'DEAFENED':
      // PHB p.290: A deafened creature can't hear and automatically fails any
      // ability check that requires hearing.
      return {
        // Effects are situational (checks requiring hearing)
      };

    case 'EXHAUSTION':
      // PHB p.291: Exhaustion has 6 levels with cumulative effects
      // Level 1: Disadvantage on ability checks
      // Level 2: Speed halved
      // Level 3: Disadvantage on attack rolls and saving throws
      // Level 4: Hit point maximum halved
      // Level 5: Speed reduced to 0
      // Level 6: Death
      return {
        abilityChecksHaveDisadvantage: true, // Level 1+
        // Higher levels handled separately
      };

    case 'FRIGHTENED':
      // PHB p.290: A frightened creature has disadvantage on ability checks
      // and attack rolls while the source of its fear is within line of sight.
      // The creature can't willingly move closer to the source of its fear.
      return {
        attacksHaveDisadvantage: true,
        abilityChecksHaveDisadvantage: true,
        // Movement restriction is situational
      };

    case 'GRAPPLED':
      // PHB p.290: A grappled creature's speed becomes 0, and it can't benefit
      // from any bonus to its speed. The condition ends if the grappler is
      // incapacitated or if an effect removes the grappled creature from the
      // grappler's reach.
      return {
        speedZero: true,
      };

    case 'INCAPACITATED':
      // PHB p.290: An incapacitated creature can't take actions or reactions.
      return {
        cannotTakeActions: true,
        cannotTakeReactions: true,
      };

    case 'INVISIBLE':
      // PHB p.291: An invisible creature is impossible to see without the aid
      // of magic or a special sense. The creature's location can be detected
      // by any noise it makes or any tracks it leaves. Attack rolls against
      // the creature have disadvantage, and the creature's attack rolls have
      // advantage.
      return {
        attacksAgainstHaveDisadvantage: true,
        // Note: Creature's attacks have advantage (handled in combat)
      };

    case 'PARALYZED':
      // PHB p.291: A paralyzed creature is incapacitated and can't move or speak.
      // The creature automatically fails Strength and Dexterity saving throws.
      // Attack rolls against the creature have advantage. Any attack that hits
      // the creature is a critical hit if the attacker is within 5 feet.
      return {
        cannotTakeActions: true,
        cannotTakeReactions: true,
        cannotMove: true,
        cannotSpeak: true,
        autoFailStrengthSaves: true,
        autoFailDexteritySaves: true,
        attacksAgainstHaveAdvantage: true,
        automaticCriticalOnHit: true, // Within 5 feet
      };

    case 'PETRIFIED':
      // PHB p.291: A petrified creature is transformed, along with any
      // nonmagical object it is wearing or carrying, into a solid inanimate
      // substance. Its weight increases by a factor of ten, and it ceases aging.
      // The creature is incapacitated, can't move or speak, and is unaware of
      // its surroundings. Attack rolls against the creature have advantage.
      // The creature automatically fails Strength and Dexterity saving throws.
      // The creature has resistance to all damage. The creature is immune to
      // poison and disease.
      return {
        cannotTakeActions: true,
        cannotTakeReactions: true,
        cannotMove: true,
        cannotSpeak: true,
        autoFailStrengthSaves: true,
        autoFailDexteritySaves: true,
        attacksAgainstHaveAdvantage: true,
        // Resistance to all damage handled separately
      };

    case 'POISONED':
      // PHB p.292: A poisoned creature has disadvantage on attack rolls and
      // ability checks.
      return {
        attacksHaveDisadvantage: true,
        abilityChecksHaveDisadvantage: true,
      };

    case 'PRONE':
      // PHB p.292: A prone creature's only movement option is to crawl, unless
      // it stands up. The creature has disadvantage on attack rolls. An attack
      // roll against the creature has advantage if the attacker is within 5 feet.
      // Otherwise, the attack roll has disadvantage.
      return {
        attacksHaveDisadvantage: true,
        // Attacks against: advantage within 5ft, disadvantage beyond
        // This is handled in combat resolution
      };

    case 'RESTRAINED':
      // PHB p.292: A restrained creature's speed becomes 0, and it can't benefit
      // from any bonus to its speed. Attack rolls against the creature have
      // advantage, and the creature's attack rolls have disadvantage. The creature
      // has disadvantage on Dexterity saving throws.
      return {
        speedZero: true,
        attacksHaveDisadvantage: true,
        attacksAgainstHaveAdvantage: true,
        savesHaveDisadvantage: true, // DEX saves specifically
      };

    case 'STUNNED':
      // PHB p.292: A stunned creature is incapacitated, can't move, and can
      // speak only falteringly. The creature automatically fails Strength and
      // Dexterity saving throws. Attack rolls against the creature have advantage.
      return {
        cannotTakeActions: true,
        cannotTakeReactions: true,
        cannotMove: true,
        autoFailStrengthSaves: true,
        autoFailDexteritySaves: true,
        attacksAgainstHaveAdvantage: true,
      };

    case 'UNCONSCIOUS':
      // PHB p.292: An unconscious creature is incapacitated, can't move or speak,
      // and is unaware of its surroundings. The creature drops whatever it's
      // holding and falls prone. The creature automatically fails Strength and
      // Dexterity saving throws. Attack rolls against the creature have advantage.
      // Any attack that hits the creature is a critical hit if the attacker is
      // within 5 feet of the creature.
      return {
        cannotTakeActions: true,
        cannotTakeReactions: true,
        cannotMove: true,
        cannotSpeak: true,
        autoFailStrengthSaves: true,
        autoFailDexteritySaves: true,
        attacksAgainstHaveAdvantage: true,
        automaticCriticalOnHit: true, // Within 5 feet
        dropsHeldItems: true,
        fallsProne: true,
      };

    default:
      return {};
  }
}

/**
 * Get combined effects of multiple conditions
 */
export function getCombinedConditionEffects(conditions: ConditionType[]): ConditionEffects {
  const combined: ConditionEffects = {};

  for (const condition of conditions) {
    const effects = getConditionEffects(condition);

    // Combine boolean effects (true if any condition has it)
    if (effects.attacksHaveDisadvantage) combined.attacksHaveDisadvantage = true;
    if (effects.attacksAgainstHaveAdvantage) combined.attacksAgainstHaveAdvantage = true;
    if (effects.attacksAgainstHaveDisadvantage) combined.attacksAgainstHaveDisadvantage = true;
    if (effects.autoFailStrengthSaves) combined.autoFailStrengthSaves = true;
    if (effects.autoFailDexteritySaves) combined.autoFailDexteritySaves = true;
    if (effects.savesHaveDisadvantage) combined.savesHaveDisadvantage = true;
    if (effects.abilityChecksHaveDisadvantage) combined.abilityChecksHaveDisadvantage = true;
    if (effects.speedReduced) combined.speedReduced = true;
    if (effects.speedZero) combined.speedZero = true;
    if (effects.cannotMove) combined.cannotMove = true;
    if (effects.cannotTakeActions) combined.cannotTakeActions = true;
    if (effects.cannotTakeReactions) combined.cannotTakeReactions = true;
    if (effects.cannotSpeak) combined.cannotSpeak = true;
    if (effects.automaticCriticalOnHit) combined.automaticCriticalOnHit = true;
    if (effects.dropsHeldItems) combined.dropsHeldItems = true;
    if (effects.fallsProne) combined.fallsProne = true;
  }

  return combined;
}

/**
 * Check if a creature can take actions
 */
export function canTakeActions(conditions: ConditionType[]): boolean {
  const effects = getCombinedConditionEffects(conditions);
  return !effects.cannotTakeActions;
}

/**
 * Check if a creature can take reactions
 */
export function canTakeReactions(conditions: ConditionType[]): boolean {
  const effects = getCombinedConditionEffects(conditions);
  return !effects.cannotTakeReactions;
}

/**
 * Check if a creature can move
 */
export function canMove(conditions: ConditionType[]): boolean {
  const effects = getCombinedConditionEffects(conditions);
  return !effects.cannotMove && !effects.speedZero;
}

/**
 * Get exhaustion effects by level (1-6)
 */
export function getExhaustionEffects(level: number): ConditionEffects {
  if (level <= 0) return {};

  const effects: ConditionEffects = {
    exhaustionLevel: level,
  };

  // Level 1+: Disadvantage on ability checks
  if (level >= 1) {
    effects.abilityChecksHaveDisadvantage = true;
  }

  // Level 2+: Speed halved
  if (level >= 2) {
    effects.speedReduced = true;
  }

  // Level 3+: Disadvantage on attack rolls and saving throws
  if (level >= 3) {
    effects.attacksHaveDisadvantage = true;
    effects.savesHaveDisadvantage = true;
  }

  // Level 4+: Hit point maximum halved (handled elsewhere)

  // Level 5+: Speed reduced to 0
  if (level >= 5) {
    effects.speedZero = true;
  }

  // Level 6: Death (handled elsewhere)

  return effects;
}

/**
 * Condition descriptions for UI display
 */
export const CONDITION_DESCRIPTIONS: Record<ConditionType, string> = {
  BLINDED: 'Cannot see. Attack rolls have disadvantage. Attacks against have advantage.',
  CHARMED: 'Cannot attack charmer. Charmer has advantage on social checks.',
  DEAFENED: 'Cannot hear. Fails checks requiring hearing.',
  EXHAUSTION: 'Cumulative penalties. Level 6 causes death.',
  FRIGHTENED: 'Disadvantage on checks and attacks while fear source visible.',
  GRAPPLED: 'Speed is 0. Cannot benefit from speed bonuses.',
  INCAPACITATED: 'Cannot take actions or reactions.',
  INVISIBLE: 'Cannot be seen. Attacks against have disadvantage.',
  PARALYZED: 'Incapacitated, cannot move/speak. Auto-fails STR/DEX saves. Auto-crit within 5ft.',
  PETRIFIED: 'Transformed to stone. Incapacitated. Resistance to all damage.',
  POISONED: 'Disadvantage on attack rolls and ability checks.',
  PRONE: 'Must crawl. Disadvantage on attacks. Attacks within 5ft have advantage.',
  RESTRAINED: 'Speed 0. Disadvantage on attacks and DEX saves. Attacks against have advantage.',
  STUNNED: 'Incapacitated, cannot move. Auto-fails STR/DEX saves.',
  UNCONSCIOUS: 'Incapacitated, unaware. Drops items, falls prone. Auto-crit within 5ft.',
};
