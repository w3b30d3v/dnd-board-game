# D&D Digital Board Game Platform
# Document 11: Content Data Schemas

---

# 1. Overview

This document defines the JSON schemas for all D&D 5e content data. These schemas are used by:
- Content Service API
- Rules Engine
- Character Builder
- Campaign Builder

---

# 2. Spell Schema

## 2.1 Complete Spell Definition

```typescript
// packages/shared/src/types/spell.ts

interface Spell {
  id: string;                    // "spell_fireball"
  name: string;                  // "Fireball"
  level: number;                 // 0-9 (0 = cantrip)
  school: SpellSchool;
  
  // Casting requirements
  casting: {
    time: CastingTime;
    ritual: boolean;
    concentration: boolean;
  };
  
  // Components
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialDescription?: string;
    materialCost?: {
      value: number;
      unit: "cp" | "sp" | "gp" | "pp";
      consumed: boolean;
    };
  };
  
  // Range & Targeting
  range: {
    type: "self" | "touch" | "ranged" | "sight" | "unlimited";
    distance?: number;           // In feet
    unit?: "feet" | "miles";
  };
  
  // Area of Effect (optional)
  areaOfEffect?: {
    shape: "sphere" | "cube" | "cone" | "line" | "cylinder";
    size: number;                // Radius/length in feet
    width?: number;              // For lines
  };
  
  // Duration
  duration: {
    type: "instantaneous" | "timed" | "until_dispelled" | "special";
    value?: number;
    unit?: "rounds" | "minutes" | "hours" | "days";
    upTo?: boolean;              // "up to 1 minute"
  };
  
  // Classes that can cast
  classes: string[];             // ["wizard", "sorcerer"]
  
  // Description
  description: string;
  atHigherLevels?: string;
  
  // Mechanics (for Rules Engine)
  mechanics: SpellMechanics;
  
  // Source
  source: {
    book: string;
    page: number;
  };
}

interface SpellMechanics {
  // What type of spell
  type: "attack" | "save" | "utility" | "healing" | "buff" | "debuff";
  
  // Attack roll spells
  attackType?: "melee" | "ranged";
  
  // Saving throw spells
  saveAbility?: Ability;
  saveEffect?: "half" | "none" | "special";
  
  // Damage
  damage?: {
    dice: string;                // "8d6"
    type: DamageType;
    scaling?: {
      type: "slot" | "level";
      dice: string;              // Additional dice per level
    };
  };
  
  // Healing
  healing?: {
    dice: string;
    scaling?: {
      type: "slot";
      dice: string;
    };
  };
  
  // Conditions applied
  conditions?: {
    condition: ConditionId;
    duration?: string;           // "until end of next turn"
    saveEnds?: boolean;
  }[];
  
  // Multi-target
  targets?: {
    type: "creatures" | "points" | "objects";
    count: number | "all_in_area";
    scaling?: {
      type: "slot";
      additional: number;
    };
  };
}

type SpellSchool = 
  | "abjuration"
  | "conjuration"
  | "divination"
  | "enchantment"
  | "evocation"
  | "illusion"
  | "necromancy"
  | "transmutation";

type CastingTime = 
  | "1 action"
  | "1 bonus action"
  | "1 reaction"
  | "1 minute"
  | "10 minutes"
  | "1 hour"
  | "8 hours"
  | "12 hours"
  | "24 hours"
  | "special";
```

## 2.2 Example: Fireball

```json
{
  "id": "spell_fireball",
  "name": "Fireball",
  "level": 3,
  "school": "evocation",
  
  "casting": {
    "time": "1 action",
    "ritual": false,
    "concentration": false
  },
  
  "components": {
    "verbal": true,
    "somatic": true,
    "material": true,
    "materialDescription": "a tiny ball of bat guano and sulfur"
  },
  
  "range": {
    "type": "ranged",
    "distance": 150,
    "unit": "feet"
  },
  
  "areaOfEffect": {
    "shape": "sphere",
    "size": 20
  },
  
  "duration": {
    "type": "instantaneous"
  },
  
  "classes": ["sorcerer", "wizard"],
  
  "description": "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one.",
  
  "atHigherLevels": "When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.",
  
  "mechanics": {
    "type": "save",
    "saveAbility": "DEX",
    "saveEffect": "half",
    "damage": {
      "dice": "8d6",
      "type": "FIRE",
      "scaling": {
        "type": "slot",
        "dice": "1d6"
      }
    },
    "targets": {
      "type": "creatures",
      "count": "all_in_area"
    }
  },
  
  "source": {
    "book": "PHB",
    "page": 241
  }
}
```

---

# 3. Monster Schema

## 3.1 Complete Monster Definition

```typescript
// packages/shared/src/types/monster.ts

interface Monster {
  id: string;                    // "monster_goblin"
  name: string;                  // "Goblin"
  
  // Basic Info
  size: Size;
  type: CreatureType;
  subtype?: string;
  alignment: Alignment;
  
  // Combat Stats
  armorClass: {
    value: number;
    type?: string;               // "natural armor", "leather armor"
  };
  
  hitPoints: {
    average: number;
    dice: string;                // "2d6"
    modifier: number;            // For max HP calculation
  };
  
  speed: {
    walk?: number;
    fly?: number;
    swim?: number;
    climb?: number;
    burrow?: number;
    hover?: boolean;
  };
  
  // Ability Scores
  abilityScores: {
    STR: number;
    DEX: number;
    CON: number;
    INT: number;
    WIS: number;
    CHA: number;
  };
  
  // Saves & Skills
  savingThrows?: Partial<Record<Ability, number>>;
  skills?: Record<string, number>;
  
  // Immunities & Resistances
  damageImmunities?: DamageType[];
  damageResistances?: DamageType[];
  damageVulnerabilities?: DamageType[];
  conditionImmunities?: ConditionId[];
  
  // Senses
  senses: {
    darkvision?: number;
    blindsight?: number;
    tremorsense?: number;
    truesight?: number;
    passivePerception: number;
  };
  
  // Languages
  languages: string[];
  
  // Challenge Rating
  challengeRating: number | string;  // 0.25, 0.5, or 1-30
  experiencePoints: number;
  
  // Traits
  traits?: MonsterTrait[];
  
  // Actions
  actions: MonsterAction[];
  
  // Bonus Actions
  bonusActions?: MonsterAction[];
  
  // Reactions
  reactions?: MonsterAction[];
  
  // Legendary
  legendary?: {
    actions: number;             // Per round
    description?: string;
    options: LegendaryAction[];
  };
  
  // Lair
  lair?: {
    description?: string;
    actions: LairAction[];
    regionalEffects?: string[];
  };
  
  // Behavior hints for AI
  behavior?: MonsterBehavior;
  
  // Source
  source: {
    book: string;
    page: number;
  };
}

interface MonsterTrait {
  name: string;
  description: string;
  mechanics?: {
    type: string;
    value?: any;
  };
}

interface MonsterAction {
  name: string;
  description: string;
  
  // Attack action
  attack?: {
    type: "melee" | "ranged";
    bonus: number;
    reach?: number;
    range?: { normal: number; long?: number };
    targets: number | "one" | "all_in_reach";
    damage: {
      dice: string;
      type: DamageType;
      bonus: number;
    };
    additionalDamage?: {
      dice: string;
      type: DamageType;
      condition?: string;
    };
    effects?: ActionEffect[];
  };
  
  // Non-attack action
  other?: {
    recharge?: string;           // "5-6" or "short rest"
    uses?: { count: number; per: "day" | "short rest" | "long rest" };
    saveDC?: number;
    saveAbility?: Ability;
    damage?: { dice: string; type: DamageType };
    aoe?: { shape: string; size: number };
    conditions?: ConditionId[];
  };
}

interface LegendaryAction {
  name: string;
  cost: number;                  // 1, 2, or 3 actions
  description: string;
  action: MonsterAction;
}

interface LairAction {
  description: string;
  initiativeCount: number;       // Usually 20
  effect: string;
  mechanics?: any;
}

interface MonsterBehavior {
  profile: "aggressive" | "defensive" | "tactical" | "coward" | "pack_hunter";
  priorities: string[];          // ["lowest_hp", "spellcasters", "nearest"]
  fleeThreshold?: number;        // HP percentage to flee
  specialBehaviors?: string[];
}

type Size = "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";

type CreatureType = 
  | "aberration" | "beast" | "celestial" | "construct" 
  | "dragon" | "elemental" | "fey" | "fiend" 
  | "giant" | "humanoid" | "monstrosity" | "ooze" 
  | "plant" | "undead";

type Alignment = 
  | "lawful good" | "neutral good" | "chaotic good"
  | "lawful neutral" | "true neutral" | "chaotic neutral"
  | "lawful evil" | "neutral evil" | "chaotic evil"
  | "unaligned" | "any";
```

## 3.2 Example: Goblin

```json
{
  "id": "monster_goblin",
  "name": "Goblin",
  "size": "small",
  "type": "humanoid",
  "subtype": "goblinoid",
  "alignment": "neutral evil",
  
  "armorClass": {
    "value": 15,
    "type": "leather armor, shield"
  },
  
  "hitPoints": {
    "average": 7,
    "dice": "2d6",
    "modifier": 0
  },
  
  "speed": {
    "walk": 30
  },
  
  "abilityScores": {
    "STR": 8,
    "DEX": 14,
    "CON": 10,
    "INT": 10,
    "WIS": 8,
    "CHA": 8
  },
  
  "skills": {
    "stealth": 6
  },
  
  "senses": {
    "darkvision": 60,
    "passivePerception": 9
  },
  
  "languages": ["Common", "Goblin"],
  
  "challengeRating": 0.25,
  "experiencePoints": 50,
  
  "traits": [
    {
      "name": "Nimble Escape",
      "description": "The goblin can take the Disengage or Hide action as a bonus action on each of its turns."
    }
  ],
  
  "actions": [
    {
      "name": "Scimitar",
      "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.",
      "attack": {
        "type": "melee",
        "bonus": 4,
        "reach": 5,
        "targets": "one",
        "damage": {
          "dice": "1d6",
          "type": "SLASHING",
          "bonus": 2
        }
      }
    },
    {
      "name": "Shortbow",
      "description": "Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
      "attack": {
        "type": "ranged",
        "bonus": 4,
        "range": { "normal": 80, "long": 320 },
        "targets": "one",
        "damage": {
          "dice": "1d6",
          "type": "PIERCING",
          "bonus": 2
        }
      }
    }
  ],
  
  "behavior": {
    "profile": "pack_hunter",
    "priorities": ["isolated_target", "lowest_hp"],
    "fleeThreshold": 25,
    "specialBehaviors": ["use_nimble_escape_to_hide", "attack_from_range_first"]
  },
  
  "source": {
    "book": "MM",
    "page": 166
  }
}
```

---

# 4. Character Schema

## 4.1 Complete Character Definition

```typescript
// packages/shared/src/types/character.ts

interface Character {
  id: string;
  userId: string;
  
  // Basic Info
  name: string;
  race: CharacterRace;
  class: CharacterClass;
  background: CharacterBackground;
  level: number;
  experiencePoints: number;
  
  // Ability Scores
  abilityScores: {
    base: Record<Ability, number>;
    racial: Record<Ability, number>;
    improvements: Record<Ability, number>;
    total: Record<Ability, number>;      // Calculated
    modifiers: Record<Ability, number>;  // Calculated
  };
  
  // Combat Stats
  proficiencyBonus: number;              // Calculated
  armorClass: number;                    // Calculated
  initiative: number;                    // Calculated
  speed: number;
  
  // Hit Points
  hitPoints: {
    maximum: number;
    current: number;
    temporary: number;
    hitDice: {
      total: number;
      remaining: number;
      die: string;
    };
  };
  
  // Death Saves
  deathSaves: {
    successes: number;
    failures: number;
  };
  
  // Proficiencies
  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
    savingThrows: Ability[];
    skills: Skill[];
    expertise: Skill[];          // Double proficiency
    languages: string[];
  };
  
  // Equipment
  equipment: CharacterEquipment;
  
  // Features & Traits
  features: CharacterFeature[];
  
  // Spellcasting (if applicable)
  spellcasting?: CharacterSpellcasting;
  
  // Personality
  personality: {
    traits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
  };
  
  // Appearance
  appearance: {
    age: number;
    height: string;
    weight: string;
    eyes: string;
    hair: string;
    skin: string;
    description?: string;
    portraitUrl?: string;
  };
  
  // Backstory
  backstory?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

interface CharacterRace {
  id: string;                    // "race_elf_high"
  name: string;                  // "High Elf"
  parentRace?: string;           // "Elf"
  abilityScoreIncreases: Partial<Record<Ability, number>>;
  size: Size;
  speed: number;
  traits: string[];              // Trait IDs
  languages: string[];
  proficiencies?: string[];
  choices?: RaceChoice[];
}

interface CharacterClass {
  id: string;                    // "class_fighter"
  name: string;                  // "Fighter"
  level: number;
  subclass?: {
    id: string;
    name: string;
    level: number;
  };
  hitDie: string;                // "d10"
  features: ClassFeature[];
  choices: ClassChoice[];
}

interface CharacterBackground {
  id: string;
  name: string;
  skillProficiencies: Skill[];
  toolProficiencies?: string[];
  languages?: number;            // Number to choose
  equipment: string[];
  feature: {
    name: string;
    description: string;
  };
}

interface CharacterEquipment {
  currency: {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
  };
  
  items: EquipmentItem[];
  
  equipped: {
    armor?: string;              // Item ID
    shield?: string;
    mainHand?: string;
    offHand?: string;
    accessories: string[];
  };
  
  attunedItems: string[];        // Max 3
}

interface CharacterSpellcasting {
  ability: Ability;
  spellSaveDC: number;           // Calculated
  spellAttackBonus: number;      // Calculated
  
  slots: {
    [level: number]: {
      total: number;
      remaining: number;
    };
  };
  
  cantripsKnown: string[];       // Spell IDs
  spellsKnown: string[];
  spellsPrepared: string[];
  
  ritualCasting: boolean;
  spellbook?: string[];          // For wizards
}

interface CharacterFeature {
  id: string;
  name: string;
  source: string;                // "Race", "Class", "Background", "Feat"
  sourceLevel?: number;
  description: string;
  
  // Usage tracking
  uses?: {
    current: number;
    maximum: number;
    recharge: "short rest" | "long rest" | "dawn";
  };
  
  // Mechanical effect
  mechanics?: FeatureMechanic;
}

interface FeatureMechanic {
  type: "passive" | "action" | "bonus_action" | "reaction";
  effect: string;                // For Rules Engine
  modifiers?: Modifier[];
}
```

## 4.2 Example: Level 1 Fighter

```json
{
  "id": "char_abc123",
  "userId": "usr_xyz789",
  
  "name": "Thorin Ironforge",
  
  "race": {
    "id": "race_dwarf_mountain",
    "name": "Mountain Dwarf",
    "parentRace": "Dwarf",
    "abilityScoreIncreases": { "CON": 2, "STR": 2 },
    "size": "medium",
    "speed": 25,
    "traits": ["darkvision", "dwarven_resilience", "stonecunning"],
    "languages": ["Common", "Dwarvish"],
    "proficiencies": ["battleaxe", "handaxe", "light_hammer", "warhammer", "light_armor", "medium_armor"]
  },
  
  "class": {
    "id": "class_fighter",
    "name": "Fighter",
    "level": 1,
    "hitDie": "d10",
    "features": [
      {
        "id": "fighting_style",
        "name": "Fighting Style",
        "choice": "defense"
      },
      {
        "id": "second_wind",
        "name": "Second Wind"
      }
    ],
    "choices": []
  },
  
  "background": {
    "id": "background_soldier",
    "name": "Soldier",
    "skillProficiencies": ["athletics", "intimidation"],
    "toolProficiencies": ["dice_set", "vehicles_land"],
    "equipment": ["insignia_of_rank", "trophy", "dice_set", "common_clothes", "belt_pouch"],
    "feature": {
      "name": "Military Rank",
      "description": "You have a military rank from your career as a soldier."
    }
  },
  
  "level": 1,
  "experiencePoints": 0,
  
  "abilityScores": {
    "base": { "STR": 15, "DEX": 12, "CON": 14, "INT": 10, "WIS": 13, "CHA": 8 },
    "racial": { "STR": 2, "DEX": 0, "CON": 2, "INT": 0, "WIS": 0, "CHA": 0 },
    "improvements": { "STR": 0, "DEX": 0, "CON": 0, "INT": 0, "WIS": 0, "CHA": 0 },
    "total": { "STR": 17, "DEX": 12, "CON": 16, "INT": 10, "WIS": 13, "CHA": 8 },
    "modifiers": { "STR": 3, "DEX": 1, "CON": 3, "INT": 0, "WIS": 1, "CHA": -1 }
  },
  
  "proficiencyBonus": 2,
  "armorClass": 19,
  "initiative": 1,
  "speed": 25,
  
  "hitPoints": {
    "maximum": 13,
    "current": 13,
    "temporary": 0,
    "hitDice": {
      "total": 1,
      "remaining": 1,
      "die": "d10"
    }
  },
  
  "deathSaves": {
    "successes": 0,
    "failures": 0
  },
  
  "proficiencies": {
    "armor": ["light", "medium", "heavy", "shields"],
    "weapons": ["simple", "martial"],
    "tools": ["dice_set", "vehicles_land"],
    "savingThrows": ["STR", "CON"],
    "skills": ["athletics", "intimidation"],
    "expertise": [],
    "languages": ["Common", "Dwarvish"]
  },
  
  "equipment": {
    "currency": { "cp": 0, "sp": 0, "ep": 0, "gp": 10, "pp": 0 },
    "items": [
      { "id": "item_chain_mail", "name": "Chain Mail", "quantity": 1 },
      { "id": "item_shield", "name": "Shield", "quantity": 1 },
      { "id": "item_battleaxe", "name": "Battleaxe", "quantity": 1 },
      { "id": "item_handaxe", "name": "Handaxe", "quantity": 2 }
    ],
    "equipped": {
      "armor": "item_chain_mail",
      "shield": "item_shield",
      "mainHand": "item_battleaxe"
    },
    "attunedItems": []
  },
  
  "features": [
    {
      "id": "fighting_style_defense",
      "name": "Fighting Style: Defense",
      "source": "Class",
      "sourceLevel": 1,
      "description": "While you are wearing armor, you gain a +1 bonus to AC.",
      "mechanics": {
        "type": "passive",
        "modifiers": [{ "type": "AC", "value": 1, "condition": "wearing_armor" }]
      }
    },
    {
      "id": "second_wind",
      "name": "Second Wind",
      "source": "Class",
      "sourceLevel": 1,
      "description": "You have a limited well of stamina. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level.",
      "uses": {
        "current": 1,
        "maximum": 1,
        "recharge": "short rest"
      },
      "mechanics": {
        "type": "bonus_action",
        "effect": "heal_self:1d10+level"
      }
    }
  ],
  
  "personality": {
    "traits": ["I face problems head-on."],
    "ideals": ["Greater Good. Our lot is to lay down our lives in defense of others."],
    "bonds": ["I would still lay down my life for the people I served with."],
    "flaws": ["I made a terrible mistake in battle that cost many lives."]
  },
  
  "appearance": {
    "age": 95,
    "height": "4'5\"",
    "weight": "170 lbs",
    "eyes": "Brown",
    "hair": "Black, braided beard",
    "skin": "Tan"
  }
}
```

---

# 5. Item Schema

## 5.1 Base Item Interface

```typescript
// packages/shared/src/types/item.ts

interface BaseItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  weight: number;                // In pounds
  cost: {
    value: number;
    unit: "cp" | "sp" | "gp" | "pp";
  };
  description: string;
  source: { book: string; page: number };
}

// Weapon
interface Weapon extends BaseItem {
  type: "weapon";
  weaponCategory: "simple" | "martial";
  weaponType: "melee" | "ranged";
  damage: {
    dice: string;
    type: DamageType;
  };
  properties: WeaponProperty[];
  range?: {
    normal: number;
    long: number;
  };
  versatileDamage?: string;      // "1d10"
  special?: string;
}

// Armor
interface Armor extends BaseItem {
  type: "armor";
  armorCategory: "light" | "medium" | "heavy" | "shield";
  baseAC: number;
  dexBonus: boolean | "max2";    // true = full DEX, "max2" = max +2
  strengthRequired?: number;
  stealthDisadvantage: boolean;
  donTime: string;               // "1 action", "1 minute", "10 minutes"
  doffTime: string;
}

// Magic Item
interface MagicItem extends BaseItem {
  type: "wondrous" | "potion" | "scroll" | "ring" | "rod" | "staff" | "wand";
  requiresAttunement: boolean;
  attunementRequirements?: string;
  charges?: {
    maximum: number;
    rechargeAmount?: string;     // "1d6+1"
    rechargeTiming?: string;     // "dawn"
  };
  effects: ItemEffect[];
}

interface ItemEffect {
  trigger: "passive" | "action" | "bonus_action" | "reaction" | "use";
  effect: string;
  description: string;
  spellEffect?: string;          // Spell ID if it casts a spell
}

type ItemType = "weapon" | "armor" | "adventuring_gear" | "tool" | "wondrous" | "potion" | "scroll" | "ring" | "rod" | "staff" | "wand";

type Rarity = "common" | "uncommon" | "rare" | "very_rare" | "legendary" | "artifact";

type WeaponProperty = 
  | "ammunition" | "finesse" | "heavy" | "light" 
  | "loading" | "reach" | "special" | "thrown" 
  | "two-handed" | "versatile";
```

---

# 6. Condition Schema

```typescript
// packages/shared/src/types/condition.ts

interface Condition {
  id: ConditionId;
  name: string;
  description: string;
  
  // Mechanical effects
  effects: ConditionEffect[];
  
  // Ending conditions
  endConditions?: string[];
  
  // Source
  source: { book: string; page: number };
}

interface ConditionEffect {
  type: ConditionEffectType;
  value?: any;
  description: string;
}

type ConditionEffectType =
  | "incapacitated"              // Can't take actions or reactions
  | "speed_zero"                 // Speed becomes 0
  | "speed_halved"               // Speed halved
  | "advantage_attacks"          // Attacks against have advantage
  | "disadvantage_attacks"       // Attacks against have disadvantage
  | "auto_fail_saves"            // Auto-fail certain saves
  | "disadvantage_ability"       // Disadvantage on ability checks
  | "disadvantage_attacks_made"  // Disadvantage on attacks made
  | "cant_speak"                 // Can't speak
  | "unaware"                    // Unaware of surroundings
  | "drop_held"                  // Drop anything held
  | "fall_prone"                 // Fall prone
  | "auto_crit"                  // Attacks are auto-crits if within 5ft
  | "resistance"                 // Resistance to damage
  | "vulnerability";             // Vulnerability to damage

type ConditionId =
  | "blinded"
  | "charmed"
  | "deafened"
  | "exhaustion"
  | "frightened"
  | "grappled"
  | "incapacitated"
  | "invisible"
  | "paralyzed"
  | "petrified"
  | "poisoned"
  | "prone"
  | "restrained"
  | "stunned"
  | "unconscious";
```

## 6.1 Example: All Standard Conditions

```json
{
  "conditions": [
    {
      "id": "blinded",
      "name": "Blinded",
      "description": "A blinded creature can't see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage.",
      "effects": [
        { "type": "auto_fail_saves", "value": "sight_required", "description": "Auto-fails ability checks requiring sight" },
        { "type": "advantage_attacks", "description": "Attacks against have advantage" },
        { "type": "disadvantage_attacks_made", "description": "Attack rolls have disadvantage" }
      ]
    },
    {
      "id": "charmed",
      "name": "Charmed",
      "description": "A charmed creature can't attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature.",
      "effects": [
        { "type": "cant_attack", "value": "charmer", "description": "Can't attack the charmer" }
      ]
    },
    {
      "id": "frightened",
      "name": "Frightened",
      "description": "A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can't willingly move closer to the source of its fear.",
      "effects": [
        { "type": "disadvantage_ability", "value": "all", "condition": "source_visible", "description": "Disadvantage on ability checks while source visible" },
        { "type": "disadvantage_attacks_made", "condition": "source_visible", "description": "Disadvantage on attacks while source visible" },
        { "type": "movement_restriction", "value": "cant_approach_source", "description": "Can't willingly move closer to source" }
      ]
    },
    {
      "id": "paralyzed",
      "name": "Paralyzed",
      "description": "A paralyzed creature is incapacitated and can't move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.",
      "effects": [
        { "type": "incapacitated", "description": "Can't take actions or reactions" },
        { "type": "speed_zero", "description": "Speed becomes 0" },
        { "type": "cant_speak", "description": "Can't speak" },
        { "type": "auto_fail_saves", "value": ["STR", "DEX"], "description": "Auto-fails STR and DEX saves" },
        { "type": "advantage_attacks", "description": "Attacks against have advantage" },
        { "type": "auto_crit", "value": 5, "description": "Attacks within 5ft are critical hits" }
      ]
    },
    {
      "id": "prone",
      "name": "Prone",
      "description": "A prone creature's only movement option is to crawl, unless it stands up. The creature has disadvantage on attack rolls. An attack roll against the creature has advantage if the attacker is within 5 feet. Otherwise, the attack roll has disadvantage.",
      "effects": [
        { "type": "movement_crawl", "description": "Can only crawl unless standing up" },
        { "type": "disadvantage_attacks_made", "description": "Disadvantage on attack rolls" },
        { "type": "advantage_attacks", "condition": "within_5ft", "description": "Advantage on melee attacks against" },
        { "type": "disadvantage_attacks", "condition": "beyond_5ft", "description": "Disadvantage on ranged attacks against" }
      ],
      "endConditions": ["stand_up_half_movement"]
    },
    {
      "id": "stunned",
      "name": "Stunned",
      "description": "A stunned creature is incapacitated, can't move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.",
      "effects": [
        { "type": "incapacitated", "description": "Can't take actions or reactions" },
        { "type": "speed_zero", "description": "Can't move" },
        { "type": "auto_fail_saves", "value": ["STR", "DEX"], "description": "Auto-fails STR and DEX saves" },
        { "type": "advantage_attacks", "description": "Attacks against have advantage" }
      ]
    },
    {
      "id": "unconscious",
      "name": "Unconscious",
      "description": "An unconscious creature is incapacitated, can't move or speak, and is unaware of its surroundings. The creature drops whatever it's holding and falls prone. Attack rolls against the creature have advantage. Any attack that hits is a critical hit if within 5 feet.",
      "effects": [
        { "type": "incapacitated", "description": "Can't take actions or reactions" },
        { "type": "speed_zero", "description": "Can't move" },
        { "type": "cant_speak", "description": "Can't speak" },
        { "type": "unaware", "description": "Unaware of surroundings" },
        { "type": "drop_held", "description": "Drops held items" },
        { "type": "fall_prone", "description": "Falls prone" },
        { "type": "auto_fail_saves", "value": ["STR", "DEX"], "description": "Auto-fails STR and DEX saves" },
        { "type": "advantage_attacks", "description": "Attacks against have advantage" },
        { "type": "auto_crit", "value": 5, "description": "Attacks within 5ft are critical hits" }
      ]
    }
  ]
}
```

---

# 7. Race & Class Schemas

## 7.1 Race Schema

```typescript
interface Race {
  id: string;
  name: string;
  description: string;
  
  // Ability Score Increases
  abilityScoreIncreases: Partial<Record<Ability, number>> | {
    choice: { count: number; amount: number };
  };
  
  // Base traits
  age: { maturity: number; lifespan: number };
  size: Size;
  speed: number;
  
  // Racial traits
  traits: RaceTrait[];
  
  // Languages
  languages: {
    fixed: string[];
    choice?: number;
  };
  
  // Proficiencies
  proficiencies?: {
    weapons?: string[];
    armor?: string[];
    tools?: string[];
    skills?: { choose: number; from: Skill[] };
  };
  
  // Subraces
  subraces?: Subrace[];
  
  source: { book: string; page: number };
}

interface RaceTrait {
  id: string;
  name: string;
  description: string;
  mechanics?: any;
}

interface Subrace {
  id: string;
  name: string;
  description: string;
  abilityScoreIncreases: Partial<Record<Ability, number>>;
  traits: RaceTrait[];
}
```

## 7.2 Class Schema

```typescript
interface Class {
  id: string;
  name: string;
  description: string;
  
  // Hit Points
  hitDie: string;                // "d10"
  hitPointsAtFirstLevel: string; // "10 + CON modifier"
  hitPointsAtHigherLevels: string;
  
  // Proficiencies
  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
    savingThrows: Ability[];
    skills: {
      choose: number;
      from: Skill[];
    };
  };
  
  // Starting Equipment
  startingEquipment: StartingEquipmentOption[];
  
  // Class Features by Level
  features: ClassFeatureByLevel[];
  
  // Subclass
  subclass: {
    name: string;                // "Martial Archetype"
    level: number;               // When you get it
    options: Subclass[];
  };
  
  // Spellcasting (if applicable)
  spellcasting?: ClassSpellcasting;
  
  source: { book: string; page: number };
}

interface ClassFeatureByLevel {
  level: number;
  features: ClassFeature[];
  proficiencyBonus: number;
  
  // Class-specific
  rages?: number;                // Barbarian
  sneakAttack?: string;          // Rogue
  kiPoints?: number;             // Monk
  // etc.
}

interface ClassFeature {
  id: string;
  name: string;
  description: string;
  choice?: {
    name: string;
    options: FeatureOption[];
  };
  mechanics?: FeatureMechanic;
}
```

---

# 8. Validation

All content files should be validated against these schemas before import:

```typescript
// scripts/validate-content.ts

import { z } from 'zod';

const SpellSchema = z.object({
  id: z.string().regex(/^spell_/),
  name: z.string().min(1),
  level: z.number().min(0).max(9),
  school: z.enum([
    "abjuration", "conjuration", "divination", "enchantment",
    "evocation", "illusion", "necromancy", "transmutation"
  ]),
  // ... full schema
});

async function validateContent() {
  const spells = await loadJSON('content/spells/*.json');
  
  for (const spell of spells) {
    const result = SpellSchema.safeParse(spell);
    if (!result.success) {
      console.error(`Invalid spell: ${spell.name}`);
      console.error(result.error.issues);
    }
  }
}
```

---

# END OF CONTENT DATA SCHEMAS
