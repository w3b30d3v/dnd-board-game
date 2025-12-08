# D&D Digital Board Game Platform
# Document 4: Rules Engine Implementation Patterns

---

# 1. Overview

This document defines the architecture, data structures, and implementation patterns for the Rules Engine - the core system responsible for enforcing RAW (Rules As Written) D&D 5e mechanics.

---

# 2. Design Principles

## 2.1 Core Principles

1. **Data-Driven Design** - All rules defined as data, not hardcoded logic
2. **Deterministic Output** - Same input always produces same output
3. **Stateless Processing** - All state passed in request, nothing persisted
4. **Extensibility** - Easy to add new spells, features, conditions
5. **Testability** - Every rule can be unit tested in isolation
6. **RAW Compliance** - Faithful to 5e rules as written

## 2.2 Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                    RULES ENGINE                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Dice      │  │  Modifier   │  │    Effect           │  │
│  │   Roller    │  │  Calculator │  │    Processor        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Ability    │  │   Attack    │  │    Spell            │  │
│  │  Resolver   │  │  Resolver   │  │    Resolver         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Condition  │  │   Damage    │  │    Resource         │  │
│  │  Manager    │  │  Calculator │  │    Manager          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

# 3. Data-Driven Rules Architecture

## 3.1 Rule Definition Schema

All rules are defined as JSON/YAML data that the engine interprets:

```yaml
# Example: Longsword Attack Rule
weapon:
  id: "weapon_longsword"
  name: "Longsword"
  type: "martial_melee"
  damage:
    dice: "1d8"
    type: "SLASHING"
  properties:
    - "versatile"
  versatile_damage:
    dice: "1d10"
    type: "SLASHING"
  range:
    normal: 5
    long: null
  weight: 3
  cost: { value: 15, unit: "gp" }
```

## 3.2 Spell Definition Schema (DSL)

```yaml
spell:
  id: "spell_fireball"
  name: "Fireball"
  level: 3
  school: "evocation"
  
  casting:
    time: "1 action"
    components:
      verbal: true
      somatic: true
      material: "A tiny ball of bat guano and sulfur"
  
  targeting:
    type: "point"
    range: 150
    requires_sight: true
  
  area_of_effect:
    shape: "sphere"
    radius: 20
    origin: "point"
    spreads_around_corners: true
  
  effects:
    - type: "saving_throw"
      ability: "DEX"
      dc: "spell_dc"
      on_success: "half_damage"
      on_failure: "full_damage"
    
    - type: "damage"
      dice: "8d6"
      damage_type: "FIRE"
      upcast:
        additional_dice: "1d6"
        per_level: 1
    
    - type: "environment"
      action: "ignite_flammable"
      condition: "unattended"
  
  concentration: false
  duration: "instantaneous"
```

## 3.3 Condition Definition Schema

```yaml
condition:
  id: "condition_frightened"
  name: "Frightened"
  
  requires_source: true
  
  effects:
    - type: "modify_roll"
      target: "ability_checks"
      modification: "disadvantage"
      condition: "source_visible"
    
    - type: "modify_roll"
      target: "attack_rolls"
      modification: "disadvantage"
      condition: "source_visible"
    
    - type: "movement_restriction"
      restriction: "cannot_willingly_approach"
      target: "source"
  
  end_conditions:
    - type: "source_not_visible"
    - type: "spell_ends"
    - type: "saving_throw_success"
```

## 3.4 Class Feature Schema

```yaml
feature:
  id: "feature_second_wind"
  name: "Second Wind"
  class: "fighter"
  level_required: 1
  
  resource:
    name: "Second Wind"
    uses: 1
    recharge: "short_rest"
  
  action_type: "bonus_action"
  
  effects:
    - type: "healing"
      target: "self"
      dice: "1d10"
      modifier:
        type: "class_level"
        class: "fighter"
```

---

# 4. Effect System

## 4.1 Effect Types

The engine supports these effect types:

```typescript
enum EffectType {
  // Dice/Roll Modifications
  ADVANTAGE = "advantage",
  DISADVANTAGE = "disadvantage",
  BONUS = "bonus",
  PENALTY = "penalty",
  REROLL = "reroll",
  SET_MINIMUM = "set_minimum",
  
  // Damage Effects
  DAMAGE = "damage",
  DAMAGE_RESISTANCE = "damage_resistance",
  DAMAGE_VULNERABILITY = "damage_vulnerability",
  DAMAGE_IMMUNITY = "damage_immunity",
  
  // Healing
  HEALING = "healing",
  TEMP_HP = "temp_hp",
  
  // Conditions
  APPLY_CONDITION = "apply_condition",
  REMOVE_CONDITION = "remove_condition",
  IMMUNITY_CONDITION = "immunity_condition",
  
  // Movement
  MODIFY_SPEED = "modify_speed",
  PREVENT_MOVEMENT = "prevent_movement",
  FORCED_MOVEMENT = "forced_movement",
  
  // Actions
  GRANT_ACTION = "grant_action",
  PREVENT_ACTION = "prevent_action",
  GRANT_REACTION = "grant_reaction",
  
  // Resources
  RESTORE_RESOURCE = "restore_resource",
  CONSUME_RESOURCE = "consume_resource",
  
  // Special
  CHANGE_SIZE = "change_size",
  GRANT_PROFICIENCY = "grant_proficiency",
  MODIFY_AC = "modify_ac",
  MODIFY_SAVE = "modify_save",
}
```

## 4.2 Effect Processing Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                    EFFECT PIPELINE                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Collect Effects                                          │
│     ├─ From conditions on entity                             │
│     ├─ From active spells                                    │
│     ├─ From equipment                                        │
│     ├─ From class features                                   │
│     └─ From racial traits                                    │
│                                                              │
│  2. Filter by Context                                        │
│     ├─ Check effect conditions (e.g., "source_visible")      │
│     ├─ Check effect triggers (e.g., "on_attack")             │
│     └─ Remove inapplicable effects                           │
│                                                              │
│  3. Sort by Priority                                         │
│     ├─ Base values first                                     │
│     ├─ Multipliers second                                    │
│     ├─ Additions third                                       │
│     └─ Caps/floors last                                      │
│                                                              │
│  4. Apply Effects                                            │
│     └─ Sequential application with running total             │
│                                                              │
│  5. Resolve Conflicts                                        │
│     ├─ Same-named effects don't stack                        │
│     ├─ Advantage/disadvantage cancel                         │
│     └─ Take highest for same-source bonuses                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 4.3 Effect Context

```typescript
interface EffectContext {
  // Who is affected
  target: Entity;
  
  // Who caused the effect (if any)
  source?: Entity;
  
  // What triggered this effect evaluation
  trigger: EffectTrigger;
  
  // Current game state
  gameState: GameState;
  
  // Specific context data
  attackRoll?: DiceRoll;
  savingThrow?: SavingThrowType;
  damageType?: DamageType;
  spellLevel?: number;
  isConcentration?: boolean;
}

enum EffectTrigger {
  ON_ATTACK_ROLL = "on_attack_roll",
  ON_DAMAGE_ROLL = "on_damage_roll",
  ON_SAVING_THROW = "on_saving_throw",
  ON_ABILITY_CHECK = "on_ability_check",
  ON_TAKE_DAMAGE = "on_take_damage",
  ON_DEAL_DAMAGE = "on_deal_damage",
  ON_TURN_START = "on_turn_start",
  ON_TURN_END = "on_turn_end",
  ON_MOVEMENT = "on_movement",
  ON_DEATH = "on_death",
}
```

---

# 5. Dice System

## 5.1 Dice Roller Interface

```typescript
interface DiceRoller {
  // Basic roll
  roll(expression: string): DiceResult;
  
  // Roll with advantage/disadvantage
  rollWithAdvantage(expression: string): DiceResult;
  rollWithDisadvantage(expression: string): DiceResult;
  
  // Roll with specific modifiers
  rollWithModifiers(expression: string, modifiers: Modifier[]): DiceResult;
  
  // Roll multiple dice and take best/worst
  rollPool(count: number, sides: number, keep: KeepType, keepCount: number): DiceResult;
}

interface DiceResult {
  expression: string;
  natural: number;          // Raw roll (before modifiers)
  total: number;            // Final result
  rolls: IndividualRoll[];  // Each die result
  modifiers: AppliedModifier[];
  critical?: CriticalType;
  advantage?: boolean;
  disadvantage?: boolean;
}

interface IndividualRoll {
  sides: number;
  result: number;
  rerolled?: boolean;
  originalResult?: number;
}
```

## 5.2 Modifier Stack

```typescript
interface Modifier {
  source: string;           // Where this modifier comes from
  type: ModifierType;       // How to apply it
  value: number | string;   // Static value or dice expression
  condition?: string;       // When to apply
  stacks: boolean;          // Can this stack with same source?
}

enum ModifierType {
  FLAT = "flat",           // Add fixed value
  DICE = "dice",           // Add dice roll
  MULTIPLY = "multiply",   // Multiply result
  SET_MIN = "set_min",     // Floor
  SET_MAX = "set_max",     // Ceiling
  REROLL_BELOW = "reroll_below", // Reroll dice below X
  REROLL_ONCE = "reroll_once",   // Reroll once, take second
}
```

## 5.3 Critical Hit Handling

```typescript
function calculateCriticalDamage(
  baseDice: string,
  modifiers: number,
  criticalEffects: CriticalEffect[]
): DamageResult {
  // RAW: Double the dice, not the modifier
  const normalDice = rollDice(baseDice);
  const criticalDice = rollDice(baseDice); // Roll again
  
  let total = normalDice.total + criticalDice.total + modifiers;
  
  // Apply special critical effects (e.g., Brutal Critical)
  for (const effect of criticalEffects) {
    if (effect.type === "additional_dice") {
      total += rollDice(effect.dice).total;
    }
  }
  
  return {
    normalDice: normalDice.total,
    criticalDice: criticalDice.total,
    modifiers,
    total,
    breakdown: `${normalDice.expression} + ${criticalDice.expression} + ${modifiers}`
  };
}
```

---

# 6. Attack Resolution

## 6.1 Attack Flow

```typescript
function resolveAttack(request: AttackRequest, context: CombatContext): AttackResult {
  // 1. Validate attack is possible
  const validation = validateAttack(request, context);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  // 2. Collect all modifiers for attack roll
  const attackModifiers = collectAttackModifiers(request, context);
  
  // 3. Determine advantage/disadvantage
  const advDisadv = resolveAdvantageDisadvantage(request, context);
  
  // 4. Roll attack
  const attackRoll = rollAttack(attackModifiers, advDisadv);
  
  // 5. Compare to AC (with cover bonus)
  const targetAC = calculateEffectiveAC(request.target, context);
  const hit = attackRoll.total >= targetAC || attackRoll.critical === "HIT";
  const criticalMiss = attackRoll.natural === 1;
  
  if (criticalMiss) {
    return { success: true, hit: false, criticalMiss: true, attackRoll };
  }
  
  if (!hit) {
    return { success: true, hit: false, attackRoll, targetAC };
  }
  
  // 6. Roll damage
  const damageResult = rollDamage(
    request,
    context,
    attackRoll.critical === "HIT"
  );
  
  // 7. Apply resistances/vulnerabilities
  const finalDamage = applyDamageModifiers(
    damageResult,
    request.target,
    context
  );
  
  return {
    success: true,
    hit: true,
    critical: attackRoll.critical === "HIT",
    attackRoll,
    targetAC,
    damage: finalDamage
  };
}
```

## 6.2 Attack Modifier Collection

```typescript
function collectAttackModifiers(
  request: AttackRequest,
  context: CombatContext
): Modifier[] {
  const modifiers: Modifier[] = [];
  const attacker = request.attacker;
  
  // 1. Ability modifier
  const abilityMod = getAttackAbilityModifier(request);
  modifiers.push({
    source: "ability",
    type: ModifierType.FLAT,
    value: abilityMod,
    stacks: true
  });
  
  // 2. Proficiency (if proficient)
  if (isProficientWithWeapon(attacker, request.weapon)) {
    modifiers.push({
      source: "proficiency",
      type: ModifierType.FLAT,
      value: attacker.proficiencyBonus,
      stacks: true
    });
  }
  
  // 3. Magic weapon bonus
  if (request.weapon.magicBonus) {
    modifiers.push({
      source: "magic_weapon",
      type: ModifierType.FLAT,
      value: request.weapon.magicBonus,
      stacks: true
    });
  }
  
  // 4. Fighting style bonuses
  const fightingStyleMod = getFightingStyleBonus(attacker, request);
  if (fightingStyleMod) {
    modifiers.push(fightingStyleMod);
  }
  
  // 5. Condition effects
  for (const condition of attacker.conditions) {
    const conditionMods = getConditionAttackModifiers(condition, context);
    modifiers.push(...conditionMods);
  }
  
  // 6. Spell effects (Bless, etc.)
  for (const effect of attacker.activeEffects) {
    if (effect.trigger === "on_attack_roll") {
      modifiers.push(effect.modifier);
    }
  }
  
  // 7. Cover penalty
  const cover = context.coverLevel;
  if (cover !== CoverLevel.NONE) {
    // Cover doesn't affect attack rolls, affects AC
    // But some effects might
  }
  
  return modifiers;
}
```

## 6.3 Advantage/Disadvantage Resolution

```typescript
function resolveAdvantageDisadvantage(
  request: AttackRequest,
  context: CombatContext
): { advantage: boolean; disadvantage: boolean } {
  const advantageSources: string[] = [];
  const disadvantageSources: string[] = [];
  
  const attacker = request.attacker;
  const target = request.target;
  
  // Check attacker conditions
  for (const condition of attacker.conditions) {
    if (condition.grantsAdvantageOnAttacks) {
      advantageSources.push(condition.name);
    }
    if (condition.grantsDisadvantageOnAttacks) {
      disadvantageSources.push(condition.name);
    }
  }
  
  // Check target conditions
  if (target.hasCondition("prone")) {
    if (context.isRangedAttack) {
      disadvantageSources.push("target_prone_ranged");
    } else if (context.distance <= 5) {
      advantageSources.push("target_prone_melee");
    }
  }
  
  if (target.hasCondition("restrained")) {
    advantageSources.push("target_restrained");
  }
  
  if (target.hasCondition("stunned") || target.hasCondition("paralyzed")) {
    advantageSources.push("target_incapacitated");
  }
  
  if (target.hasCondition("invisible") && !attacker.canSee(target)) {
    disadvantageSources.push("target_unseen");
  }
  
  if (attacker.hasCondition("invisible") && !target.canSee(attacker)) {
    advantageSources.push("attacker_unseen");
  }
  
  // Range disadvantage
  if (context.isRangedAttack && context.distance > request.weapon.range.normal) {
    disadvantageSources.push("long_range");
  }
  
  // Flanking (optional rule)
  if (context.rules.flankingEnabled && context.isFlanking) {
    advantageSources.push("flanking");
  }
  
  // RAW: Any advantage + any disadvantage = straight roll
  const hasAdvantage = advantageSources.length > 0;
  const hasDisadvantage = disadvantageSources.length > 0;
  
  if (hasAdvantage && hasDisadvantage) {
    return { advantage: false, disadvantage: false };
  }
  
  return { advantage: hasAdvantage, disadvantage: hasDisadvantage };
}
```

---

# 7. Damage System

## 7.1 Damage Types

```typescript
enum DamageType {
  // Physical
  BLUDGEONING = "bludgeoning",
  PIERCING = "piercing",
  SLASHING = "slashing",
  
  // Elemental
  ACID = "acid",
  COLD = "cold",
  FIRE = "fire",
  LIGHTNING = "lightning",
  THUNDER = "thunder",
  
  // Magical
  FORCE = "force",
  NECROTIC = "necrotic",
  RADIANT = "radiant",
  PSYCHIC = "psychic",
  POISON = "poison",
}
```

## 7.2 Resistance/Vulnerability Application

```typescript
function applyDamageModifiers(
  damage: DamageRoll,
  target: Entity,
  context: CombatContext
): FinalDamage {
  const results: DamageComponent[] = [];
  
  for (const component of damage.components) {
    let finalAmount = component.amount;
    let modifier = DamageModifier.NONE;
    
    // Check immunity first
    if (target.isImmuneTo(component.type)) {
      finalAmount = 0;
      modifier = DamageModifier.IMMUNITY;
    }
    // Then resistance
    else if (target.isResistantTo(component.type)) {
      finalAmount = Math.floor(component.amount / 2);
      modifier = DamageModifier.RESISTANCE;
    }
    // Then vulnerability
    else if (target.isVulnerableTo(component.type)) {
      finalAmount = component.amount * 2;
      modifier = DamageModifier.VULNERABILITY;
    }
    
    results.push({
      type: component.type,
      originalAmount: component.amount,
      finalAmount,
      modifier
    });
  }
  
  return {
    components: results,
    total: results.reduce((sum, c) => sum + c.finalAmount, 0)
  };
}
```

## 7.3 Damage Reduction Effects

```typescript
function applyDamageReduction(
  damage: number,
  target: Entity,
  context: DamageContext
): number {
  let remaining = damage;
  
  // Heavy Armor Master (melee bludgeoning/piercing/slashing)
  if (target.hasFeature("heavy_armor_master") && 
      context.isNonMagical && 
      context.isBPS) {
    remaining = Math.max(0, remaining - 3);
  }
  
  // Rage damage reduction
  if (target.hasCondition("raging") && context.isBPS) {
    remaining = Math.floor(remaining / 2);
  }
  
  // Other effects...
  
  return remaining;
}
```

---

# 8. Saving Throws

## 8.1 Save Resolution

```typescript
function resolveSavingThrow(
  request: SaveRequest,
  context: CombatContext
): SaveResult {
  const target = request.target;
  const ability = request.ability;
  
  // 1. Collect modifiers
  const modifiers = collectSaveModifiers(target, ability, context);
  
  // 2. Check advantage/disadvantage
  const advDisadv = resolveSaveAdvantage(target, ability, context);
  
  // 3. Roll save
  const roll = rollSave(ability, modifiers, advDisadv);
  
  // 4. Compare to DC
  const success = roll.total >= request.dc;
  
  // 5. Determine effect
  let effect: SaveEffect;
  if (success) {
    effect = request.onSuccess;
  } else {
    effect = request.onFailure;
  }
  
  // 6. Check for Legendary Resistance
  if (!success && target.hasLegendaryResistance()) {
    const useLR = shouldUseLegendaryResistance(request, context);
    if (useLR) {
      return {
        roll,
        success: true,
        legendaryResistanceUsed: true,
        effect: request.onSuccess
      };
    }
  }
  
  return { roll, success, effect };
}
```

## 8.2 Save Modifiers

```typescript
function collectSaveModifiers(
  target: Entity,
  ability: Ability,
  context: CombatContext
): Modifier[] {
  const modifiers: Modifier[] = [];
  
  // 1. Ability modifier
  modifiers.push({
    source: "ability",
    type: ModifierType.FLAT,
    value: target.getAbilityModifier(ability),
    stacks: true
  });
  
  // 2. Proficiency (if proficient in save)
  if (target.isProficientInSave(ability)) {
    modifiers.push({
      source: "proficiency",
      type: ModifierType.FLAT,
      value: target.proficiencyBonus,
      stacks: true
    });
  }
  
  // 3. Magic items (Ring of Protection, Cloak of Protection)
  for (const item of target.equipment) {
    if (item.saveBonus) {
      modifiers.push({
        source: item.name,
        type: ModifierType.FLAT,
        value: item.saveBonus,
        stacks: false  // Same-named items don't stack
      });
    }
  }
  
  // 4. Spell effects (Bless, etc.)
  for (const effect of target.activeEffects) {
    if (effect.trigger === "on_saving_throw") {
      modifiers.push(effect.modifier);
    }
  }
  
  // 5. Aura effects (Paladin's Aura of Protection)
  const auraModifiers = getAuraModifiers(target, "saving_throw", context);
  modifiers.push(...auraModifiers);
  
  return modifiers;
}
```

---

# 9. Condition System

## 9.1 Condition Manager

```typescript
class ConditionManager {
  private conditions: Map<string, ActiveCondition> = new Map();
  
  apply(
    condition: ConditionDefinition,
    target: Entity,
    source: Entity | null,
    duration: Duration
  ): ApplyResult {
    // Check immunity
    if (target.isImmuneToCondition(condition.id)) {
      return { applied: false, reason: "immunity" };
    }
    
    // Check if already has condition
    const existing = this.conditions.get(condition.id);
    if (existing) {
      // Some conditions refresh duration, some don't stack
      if (condition.refreshable) {
        existing.duration = duration;
        return { applied: true, refreshed: true };
      } else {
        return { applied: false, reason: "already_has" };
      }
    }
    
    // Apply condition
    const activeCondition: ActiveCondition = {
      definition: condition,
      source,
      duration,
      appliedAt: Date.now(),
      saveInfo: condition.saveToEnd ? {
        ability: condition.saveToEnd.ability,
        dc: condition.saveToEnd.dc,
        timing: condition.saveToEnd.timing
      } : null
    };
    
    this.conditions.set(condition.id, activeCondition);
    
    // Apply immediate effects
    for (const effect of condition.effects) {
      if (effect.timing === "immediate") {
        this.applyEffect(effect, target);
      }
    }
    
    return { applied: true, condition: activeCondition };
  }
  
  processEndOfTurn(target: Entity): ConditionUpdate[] {
    const updates: ConditionUpdate[] = [];
    
    for (const [id, condition] of this.conditions) {
      // Check save to end
      if (condition.saveInfo?.timing === "end_of_turn") {
        const saveResult = this.attemptSave(target, condition);
        if (saveResult.success) {
          this.remove(id);
          updates.push({ id, removed: true, reason: "save_success" });
          continue;
        }
      }
      
      // Check duration
      if (condition.duration.type === "rounds") {
        condition.duration.remaining--;
        if (condition.duration.remaining <= 0) {
          this.remove(id);
          updates.push({ id, removed: true, reason: "duration_expired" });
        }
      }
    }
    
    return updates;
  }
  
  getActiveEffects(trigger: EffectTrigger): Effect[] {
    const effects: Effect[] = [];
    
    for (const condition of this.conditions.values()) {
      for (const effect of condition.definition.effects) {
        if (effect.trigger === trigger || effect.trigger === "always") {
          effects.push(effect);
        }
      }
    }
    
    return effects;
  }
}
```

## 9.2 Standard 5e Conditions

```typescript
const STANDARD_CONDITIONS: ConditionDefinition[] = [
  {
    id: "blinded",
    name: "Blinded",
    effects: [
      { type: "auto_fail", target: "sight_checks" },
      { type: "disadvantage", target: "attack_rolls" },
      { type: "advantage_against", target: "attack_rolls" }
    ]
  },
  {
    id: "charmed",
    name: "Charmed",
    requiresSource: true,
    effects: [
      { type: "cannot_attack", target: "source" },
      { type: "advantage", target: "social_checks", condition: "with_source" }
    ]
  },
  {
    id: "deafened",
    name: "Deafened",
    effects: [
      { type: "auto_fail", target: "hearing_checks" }
    ]
  },
  {
    id: "frightened",
    name: "Frightened",
    requiresSource: true,
    effects: [
      { type: "disadvantage", target: "ability_checks", condition: "source_visible" },
      { type: "disadvantage", target: "attack_rolls", condition: "source_visible" },
      { type: "movement_restriction", restriction: "cannot_approach_source" }
    ]
  },
  {
    id: "grappled",
    name: "Grappled",
    effects: [
      { type: "speed_zero" }
    ],
    endConditions: ["grappler_incapacitated", "forced_out_of_reach"]
  },
  {
    id: "incapacitated",
    name: "Incapacitated",
    effects: [
      { type: "cannot_take_actions" },
      { type: "cannot_take_reactions" }
    ]
  },
  {
    id: "invisible",
    name: "Invisible",
    effects: [
      { type: "cannot_be_seen", exception: "special_sense" },
      { type: "advantage", target: "attack_rolls" },
      { type: "disadvantage_against", target: "attack_rolls" }
    ]
  },
  {
    id: "paralyzed",
    name: "Paralyzed",
    includesConditions: ["incapacitated"],
    effects: [
      { type: "auto_fail", target: "str_saves" },
      { type: "auto_fail", target: "dex_saves" },
      { type: "advantage_against", target: "attack_rolls" },
      { type: "auto_critical", condition: "attacker_within_5ft" }
    ]
  },
  {
    id: "petrified",
    name: "Petrified",
    includesConditions: ["incapacitated"],
    effects: [
      { type: "resistance", target: "all_damage" },
      { type: "immunity", target: "poison_disease" },
      { type: "auto_fail", target: "str_saves" },
      { type: "auto_fail", target: "dex_saves" },
      { type: "advantage_against", target: "attack_rolls" }
    ]
  },
  {
    id: "poisoned",
    name: "Poisoned",
    effects: [
      { type: "disadvantage", target: "attack_rolls" },
      { type: "disadvantage", target: "ability_checks" }
    ]
  },
  {
    id: "prone",
    name: "Prone",
    effects: [
      { type: "only_movement", movement: "crawl" },
      { type: "disadvantage", target: "attack_rolls" },
      { type: "advantage_against", target: "attack_rolls", condition: "within_5ft" },
      { type: "disadvantage_against", target: "attack_rolls", condition: "beyond_5ft" }
    ],
    endConditions: ["stand_up"]
  },
  {
    id: "restrained",
    name: "Restrained",
    effects: [
      { type: "speed_zero" },
      { type: "disadvantage", target: "attack_rolls" },
      { type: "disadvantage", target: "dex_saves" },
      { type: "advantage_against", target: "attack_rolls" }
    ]
  },
  {
    id: "stunned",
    name: "Stunned",
    includesConditions: ["incapacitated"],
    effects: [
      { type: "auto_fail", target: "str_saves" },
      { type: "auto_fail", target: "dex_saves" },
      { type: "advantage_against", target: "attack_rolls" }
    ]
  },
  {
    id: "unconscious",
    name: "Unconscious",
    includesConditions: ["incapacitated", "prone"],
    effects: [
      { type: "drop_items" },
      { type: "auto_fail", target: "str_saves" },
      { type: "auto_fail", target: "dex_saves" },
      { type: "advantage_against", target: "attack_rolls" },
      { type: "auto_critical", condition: "attacker_within_5ft" }
    ]
  }
];
```

---

# 10. Concentration System

## 10.1 Concentration Manager

```typescript
class ConcentrationManager {
  private concentratingSpell: ConcentratedSpell | null = null;
  
  startConcentrating(
    caster: Entity,
    spell: SpellDefinition,
    targets: Entity[],
    duration: Duration
  ): ConcentrationResult {
    // End any existing concentration
    if (this.concentratingSpell) {
      this.endConcentration("new_concentration");
    }
    
    this.concentratingSpell = {
      spell,
      targets,
      duration,
      startedAt: Date.now()
    };
    
    return { success: true, spell };
  }
  
  checkConcentration(
    caster: Entity,
    damageTaken: number
  ): ConcentrationCheckResult {
    if (!this.concentratingSpell) {
      return { required: false };
    }
    
    const dc = Math.max(10, Math.floor(damageTaken / 2));
    
    // Roll Constitution save
    const saveResult = resolveSavingThrow({
      target: caster,
      ability: Ability.CON,
      dc,
      onSuccess: { type: "maintain" },
      onFailure: { type: "break" }
    }, {} as CombatContext);
    
    if (!saveResult.success) {
      this.endConcentration("failed_save");
      return {
        required: true,
        dc,
        roll: saveResult.roll,
        success: false,
        spellEnded: this.concentratingSpell.spell.name
      };
    }
    
    return {
      required: true,
      dc,
      roll: saveResult.roll,
      success: true
    };
  }
  
  endConcentration(reason: string): void {
    if (this.concentratingSpell) {
      // Remove spell effects from all targets
      for (const target of this.concentratingSpell.targets) {
        removeSpellEffects(target, this.concentratingSpell.spell.id);
      }
      
      this.concentratingSpell = null;
    }
  }
  
  processRound(): void {
    if (this.concentratingSpell) {
      if (this.concentratingSpell.duration.type === "rounds") {
        this.concentratingSpell.duration.remaining--;
        if (this.concentratingSpell.duration.remaining <= 0) {
          this.endConcentration("duration_expired");
        }
      }
    }
  }
}
```

---

# 11. Golden Test Fixtures

## 11.1 Attack Resolution Tests

```yaml
test_suite: "attack_resolution"
tests:
  - name: "basic_melee_hit"
    setup:
      attacker:
        str: 16  # +3
        proficiency: 2
        weapon: "longsword"
      target:
        ac: 15
      forced_roll: 12  # 12 + 3 + 2 = 17 vs AC 15
    expected:
      hit: true
      attack_total: 17
      
  - name: "basic_melee_miss"
    setup:
      attacker:
        str: 10  # +0
        proficiency: 2
        weapon: "longsword"
      target:
        ac: 18
      forced_roll: 14  # 14 + 0 + 2 = 16 vs AC 18
    expected:
      hit: false
      attack_total: 16
      
  - name: "critical_hit"
    setup:
      attacker:
        str: 14  # +2
        proficiency: 2
        weapon: "longsword"
      target:
        ac: 25  # Would normally miss
      forced_roll: 20
    expected:
      hit: true
      critical: true
      
  - name: "critical_miss"
    setup:
      attacker:
        str: 20  # +5
        proficiency: 6
        weapon: "longsword"
      target:
        ac: 5  # Would normally hit easily
      forced_roll: 1
    expected:
      hit: false
      critical_miss: true
      
  - name: "attack_with_advantage"
    setup:
      attacker:
        str: 14
        proficiency: 2
        conditions: ["invisible"]
      target:
        ac: 15
      forced_rolls: [8, 15]  # Takes higher
    expected:
      hit: true
      used_roll: 15
      had_advantage: true
      
  - name: "advantage_disadvantage_cancel"
    setup:
      attacker:
        str: 14
        proficiency: 2
        conditions: ["invisible"]  # Advantage
      target:
        ac: 15
        conditions: ["invisible"]  # Disadvantage
      forced_roll: 12
    expected:
      hit: true
      had_advantage: false
      had_disadvantage: false
```

## 11.2 Damage Calculation Tests

```yaml
test_suite: "damage_calculation"
tests:
  - name: "basic_damage"
    setup:
      weapon: "longsword"
      str_mod: 3
      forced_damage: 6  # 1d8 = 6
    expected:
      total: 9  # 6 + 3
      
  - name: "critical_damage"
    setup:
      weapon: "longsword"
      str_mod: 3
      critical: true
      forced_damage: [6, 4]  # Two d8s
    expected:
      total: 13  # 6 + 4 + 3
      
  - name: "resistance_halves"
    setup:
      damage: 20
      type: "fire"
      target_resistances: ["fire"]
    expected:
      total: 10
      modifier: "resistance"
      
  - name: "vulnerability_doubles"
    setup:
      damage: 15
      type: "cold"
      target_vulnerabilities: ["cold"]
    expected:
      total: 30
      modifier: "vulnerability"
      
  - name: "immunity_negates"
    setup:
      damage: 50
      type: "poison"
      target_immunities: ["poison"]
    expected:
      total: 0
      modifier: "immunity"
```

## 11.3 Spell Resolution Tests

```yaml
test_suite: "spell_resolution"
tests:
  - name: "fireball_basic"
    setup:
      spell: "fireball"
      slot_level: 3
      caster_spell_dc: 15
      targets:
        - { dex_save_mod: 2, forced_roll: 10 }  # 12 < 15, fail
        - { dex_save_mod: 5, forced_roll: 12 }  # 17 >= 15, success
      forced_damage: 28  # 8d6
    expected:
      target_0:
        save_success: false
        damage: 28
      target_1:
        save_success: true
        damage: 14
        
  - name: "fireball_upcast"
    setup:
      spell: "fireball"
      slot_level: 5  # +2 levels
      forced_damage: 38  # 10d6 (8d6 + 2d6)
    expected:
      dice_count: 10
      
  - name: "hold_person_concentration"
    setup:
      spell: "hold_person"
      target_wis_save: 2
      caster_spell_dc: 15
      forced_roll: 8  # 10 < 15, fail
    expected:
      target_paralyzed: true
      requires_concentration: true
```

---

# 12. Performance Considerations

## 12.1 Caching Strategy

```typescript
class RulesCache {
  // Cache spell definitions (immutable after load)
  private spellCache: Map<string, SpellDefinition> = new Map();
  
  // Cache modifier calculations (per entity per turn)
  private modifierCache: Map<string, Modifier[]> = new Map();
  
  // Cache advantage/disadvantage state (per entity per turn)
  private advDisadvCache: Map<string, AdvDisadvState> = new Map();
  
  // Invalidate at turn boundaries
  onTurnEnd(entityId: string): void {
    this.modifierCache.delete(entityId);
    this.advDisadvCache.delete(entityId);
  }
  
  // Invalidate when conditions change
  onConditionChange(entityId: string): void {
    this.modifierCache.delete(entityId);
    this.advDisadvCache.delete(entityId);
  }
}
```

## 12.2 Batch Processing

```typescript
// For AoE spells affecting many targets
async function batchResolveSaves(
  targets: Entity[],
  saveInfo: SaveInfo,
  context: CombatContext
): Promise<SaveResult[]> {
  // Pre-calculate shared data
  const dc = saveInfo.dc;
  const ability = saveInfo.ability;
  
  // Process in parallel
  return Promise.all(
    targets.map(target => 
      resolveSavingThrow({ target, ability, dc, ...saveInfo }, context)
    )
  );
}
```

---

# END OF RULES ENGINE IMPLEMENTATION PATTERNS
