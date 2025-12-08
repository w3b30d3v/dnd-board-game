# D&D Digital Board Game Platform
# Document 18: 5e Content Seed Data

---

# 1. Overview

This document contains seed data for 5e content. Create these JSON files in the `content/` directory.

---

# 2. Spells (content/spells.json)

```json
{
  "spells": [
    {
      "id": "fire-bolt",
      "name": "Fire Bolt",
      "level": 0,
      "school": "evocation",
      "castingTime": "1 action",
      "range": 120,
      "components": { "verbal": true, "somatic": true, "material": false },
      "duration": "Instantaneous",
      "concentration": false,
      "attack": { "type": "ranged_spell", "damage": { "dice": "1d10", "type": "FIRE" } },
      "scaling": { "5": "2d10", "11": "3d10", "17": "4d10" },
      "classes": ["sorcerer", "wizard"]
    },
    {
      "id": "sacred-flame",
      "name": "Sacred Flame",
      "level": 0,
      "school": "evocation",
      "castingTime": "1 action",
      "range": 60,
      "components": { "verbal": true, "somatic": true, "material": false },
      "duration": "Instantaneous",
      "concentration": false,
      "save": { "ability": "DEX", "damage": { "dice": "1d8", "type": "RADIANT" }, "onSuccess": "none" },
      "scaling": { "5": "2d8", "11": "3d8", "17": "4d8" },
      "special": ["ignores_cover"],
      "classes": ["cleric"]
    },
    {
      "id": "eldritch-blast",
      "name": "Eldritch Blast",
      "level": 0,
      "school": "evocation",
      "castingTime": "1 action",
      "range": 120,
      "components": { "verbal": true, "somatic": true, "material": false },
      "duration": "Instantaneous",
      "concentration": false,
      "attack": { "type": "ranged_spell", "damage": { "dice": "1d10", "type": "FORCE" } },
      "beamScaling": { "5": 2, "11": 3, "17": 4 },
      "classes": ["warlock"]
    },
    {
      "id": "guidance",
      "name": "Guidance",
      "level": 0,
      "school": "divination",
      "castingTime": "1 action",
      "range": 0,
      "rangeType": "touch",
      "components": { "verbal": true, "somatic": true, "material": false },
      "duration": "Concentration, up to 1 minute",
      "concentration": true,
      "buff": { "type": "ability_check_bonus", "dice": "1d4" },
      "classes": ["cleric", "druid"]
    },
    {
      "id": "magic-missile",
      "name": "Magic Missile",
      "level": 1,
      "school": "evocation",
      "castingTime": "1 action",
      "range": 120,
      "components": { "verbal": true, "somatic": true, "material": false },
      "duration": "Instantaneous",
      "concentration": false,
      "autoHit": true,
      "projectiles": { "count": 3, "damage": { "dice": "1d4", "modifier": 1, "type": "FORCE" }, "upcastBonus": 1 },
      "classes": ["sorcerer", "wizard"]
    },
    {
      "id": "shield",
      "name": "Shield",
      "level": 1,
      "school": "abjuration",
      "castingTime": "1 reaction",
      "range": 0,
      "rangeType": "self",
      "components": { "verbal": true, "somatic": true, "material": false },
      "duration": "1 round",
      "concentration": false,
      "buff": { "type": "ac_bonus", "value": 5 },
      "special": ["blocks_magic_missile"],
      "classes": ["sorcerer", "wizard"]
    },
    {
      "id": "cure-wounds",
      "name": "Cure Wounds",
      "level": 1,
      "school": "evocation",
      "castingTime": "1 action",
      "range": 0,
      "rangeType": "touch",
      "components": { "verbal": true, "somatic": true, "material": false },
      "duration": "Instantaneous",
      "concentration": false,
      "healing": { "dice": "1d8", "addModifier": true, "upcastDice": "1d8" },
      "restrictions": ["no_undead", "no_constructs"],
      "classes": ["bard", "cleric", "druid", "paladin", "ranger"]
    },
    {
      "id": "burning-hands",
      "name": "Burning Hands",
      "level": 1,
      "school": "evocation",
      "castingTime": "1 action",
      "range": 0,
      "rangeType": "self",
      "components": { "verbal": true, "somatic": true, "material": false },
      "duration": "Instantaneous",
      "concentration": false,
      "aoe": { "shape": "cone", "size": 15 },
      "save": { "ability": "DEX", "damage": { "dice": "3d6", "type": "FIRE" }, "onSuccess": "half", "upcastDice": "1d6" },
      "classes": ["sorcerer", "wizard"]
    },
    {
      "id": "thunderwave",
      "name": "Thunderwave",
      "level": 1,
      "school": "evocation",
      "castingTime": "1 action",
      "range": 0,
      "rangeType": "self",
      "components": { "verbal": true, "somatic": true, "material": false },
      "duration": "Instantaneous",
      "concentration": false,
      "aoe": { "shape": "cube", "size": 15 },
      "save": { "ability": "CON", "damage": { "dice": "2d8", "type": "THUNDER" }, "onSuccess": "half", "upcastDice": "1d8" },
      "push": { "distance": 10, "onFail": true },
      "classes": ["bard", "druid", "sorcerer", "wizard"]
    },
    {
      "id": "sleep",
      "name": "Sleep",
      "level": 1,
      "school": "enchantment",
      "castingTime": "1 action",
      "range": 90,
      "components": { "verbal": true, "somatic": true, "material": true, "materialDesc": "a pinch of sand" },
      "duration": "1 minute",
      "concentration": false,
      "aoe": { "shape": "sphere", "size": 20 },
      "special": ["affects_lowest_hp_first", "no_save"],
      "hitPoints": { "base": "5d8", "upcastDice": "2d8" },
      "classes": ["bard", "sorcerer", "wizard"]
    },
    {
      "id": "healing-word",
      "name": "Healing Word",
      "level": 1,
      "school": "evocation",
      "castingTime": "1 bonus action",
      "range": 60,
      "components": { "verbal": true, "somatic": false, "material": false },
      "duration": "Instantaneous",
      "concentration": false,
      "healing": { "dice": "1d4", "addModifier": true, "upcastDice": "1d4" },
      "classes": ["bard", "cleric", "druid"]
    },
    {
      "id": "hold-person",
      "name": "Hold Person",
      "level": 2,
      "school": "enchantment",
      "castingTime": "1 action",
      "range": 60,
      "components": { "verbal": true, "somatic": true, "material": true, "materialDesc": "a small piece of iron" },
      "duration": "Concentration, up to 1 minute",
      "concentration": true,
      "targetType": "humanoid",
      "maxTargets": 1,
      "save": { "ability": "WIS", "onFail": "paralyzed", "repeatSave": "end_of_turn" },
      "upcastTargets": 1,
      "classes": ["bard", "cleric", "druid", "sorcerer", "warlock", "wizard"]
    },
    {
      "id": "misty-step",
      "name": "Misty Step",
      "level": 2,
      "school": "conjuration",
      "castingTime": "1 bonus action",
      "range": 0,
      "rangeType": "self",
      "components": { "verbal": true, "somatic": false, "material": false },
      "duration": "Instantaneous",
      "concentration": false,
      "teleport": { "distance": 30 },
      "classes": ["sorcerer", "warlock", "wizard"]
    },
    {
      "id": "scorching-ray",
      "name": "Scorching Ray",
      "level": 2,
      "school": "evocation",
      "castingTime": "1 action",
      "range": 120,
      "components": { "verbal": true, "somatic": true, "material": false },
      "duration": "Instantaneous",
      "concentration": false,
      "rays": { "count": 3, "attack": "ranged_spell", "damage": { "dice": "2d6", "type": "FIRE" }, "upcastBonus": 1 },
      "classes": ["sorcerer", "wizard"]
    },
    {
      "id": "spiritual-weapon",
      "name": "Spiritual Weapon",
      "level": 2,
      "school": "evocation",
      "castingTime": "1 bonus action",
      "range": 60,
      "components": { "verbal": true, "somatic": true, "material": false },
      "duration": "1 minute",
      "concentration": false,
      "summon": { "type": "weapon", "attack": "melee_spell", "damage": { "dice": "1d8", "addModifier": true, "type": "FORCE" } },
      "upcastDamage": { "slotIncrease": 2, "diceIncrease": "1d8" },
      "classes": ["cleric"]
    },
    {
      "id": "fireball",
      "name": "Fireball",
      "level": 3,
      "school": "evocation",
      "castingTime": "1 action",
      "range": 150,
      "components": { "verbal": true, "somatic": true, "material": true, "materialDesc": "bat guano and sulfur" },
      "duration": "Instantaneous",
      "concentration": false,
      "aoe": { "shape": "sphere", "size": 20 },
      "save": { "ability": "DEX", "damage": { "dice": "8d6", "type": "FIRE" }, "onSuccess": "half", "upcastDice": "1d6" },
      "special": ["ignites_flammables", "spreads_around_corners"],
      "classes": ["sorcerer", "wizard"]
    },
    {
      "id": "lightning-bolt",
      "name": "Lightning Bolt",
      "level": 3,
      "school": "evocation",
      "castingTime": "1 action",
      "range": 0,
      "rangeType": "self",
      "components": { "verbal": true, "somatic": true, "material": true, "materialDesc": "fur and glass rod" },
      "duration": "Instantaneous",
      "concentration": false,
      "aoe": { "shape": "line", "length": 100, "width": 5 },
      "save": { "ability": "DEX", "damage": { "dice": "8d6", "type": "LIGHTNING" }, "onSuccess": "half", "upcastDice": "1d6" },
      "classes": ["sorcerer", "wizard"]
    },
    {
      "id": "counterspell",
      "name": "Counterspell",
      "level": 3,
      "school": "abjuration",
      "castingTime": "1 reaction",
      "castingTrigger": "when you see a creature within 60 feet casting a spell",
      "range": 60,
      "components": { "verbal": false, "somatic": true, "material": false },
      "duration": "Instantaneous",
      "concentration": false,
      "counter": { "autoSuccess": 3, "checkDC": "10 + spell level" },
      "classes": ["sorcerer", "warlock", "wizard"]
    },
    {
      "id": "spirit-guardians",
      "name": "Spirit Guardians",
      "level": 3,
      "school": "conjuration",
      "castingTime": "1 action",
      "range": 0,
      "rangeType": "self",
      "components": { "verbal": true, "somatic": true, "material": true, "materialDesc": "holy symbol" },
      "duration": "Concentration, up to 10 minutes",
      "concentration": true,
      "aura": { "radius": 15, "followsCaster": true },
      "save": { "ability": "WIS", "damage": { "dice": "3d8", "type": "RADIANT" }, "onSuccess": "half", "upcastDice": "1d8" },
      "special": ["difficult_terrain_enemies", "triggers_on_entry_or_start"],
      "classes": ["cleric"]
    },
    {
      "id": "haste",
      "name": "Haste",
      "level": 3,
      "school": "transmutation",
      "castingTime": "1 action",
      "range": 30,
      "components": { "verbal": true, "somatic": true, "material": true, "materialDesc": "licorice root" },
      "duration": "Concentration, up to 1 minute",
      "concentration": true,
      "buff": {
        "speed": "double",
        "acBonus": 2,
        "dexSaveAdvantage": true,
        "extraAction": ["attack_one", "dash", "disengage", "hide", "use_object"]
      },
      "endEffect": { "condition": "cant_move_or_act", "duration": "1 round" },
      "classes": ["sorcerer", "wizard"]
    }
  ]
}
```

---

# 3. Monsters (content/monsters.json)

```json
{
  "monsters": [
    {
      "id": "goblin",
      "name": "Goblin",
      "size": "Small",
      "type": "humanoid",
      "subtype": "goblinoid",
      "alignment": "neutral evil",
      "cr": 0.25,
      "xp": 50,
      "armorClass": 15,
      "armorType": "leather armor, shield",
      "hitPoints": { "average": 7, "dice": "2d6" },
      "speed": { "walk": 30 },
      "abilityScores": { "STR": 8, "DEX": 14, "CON": 10, "INT": 10, "WIS": 8, "CHA": 8 },
      "skills": { "stealth": 6 },
      "senses": { "darkvision": 60, "passivePerception": 9 },
      "languages": ["Common", "Goblin"],
      "traits": [
        {
          "name": "Nimble Escape",
          "description": "The goblin can take the Disengage or Hide action as a bonus action on each of its turns."
        }
      ],
      "actions": [
        {
          "name": "Scimitar",
          "type": "melee_weapon",
          "attackBonus": 4,
          "reach": 5,
          "damage": { "dice": "1d6", "modifier": 2, "type": "SLASHING" }
        },
        {
          "name": "Shortbow",
          "type": "ranged_weapon",
          "attackBonus": 4,
          "range": { "normal": 80, "long": 320 },
          "damage": { "dice": "1d6", "modifier": 2, "type": "PIERCING" }
        }
      ]
    },
    {
      "id": "skeleton",
      "name": "Skeleton",
      "size": "Medium",
      "type": "undead",
      "alignment": "lawful evil",
      "cr": 0.25,
      "xp": 50,
      "armorClass": 13,
      "armorType": "armor scraps",
      "hitPoints": { "average": 13, "dice": "2d8+4" },
      "speed": { "walk": 30 },
      "abilityScores": { "STR": 10, "DEX": 14, "CON": 15, "INT": 6, "WIS": 8, "CHA": 5 },
      "vulnerabilities": ["BLUDGEONING"],
      "immunities": ["POISON"],
      "conditionImmunities": ["exhaustion", "poisoned"],
      "senses": { "darkvision": 60, "passivePerception": 9 },
      "languages": ["understands languages it knew in life"],
      "actions": [
        {
          "name": "Shortsword",
          "type": "melee_weapon",
          "attackBonus": 4,
          "reach": 5,
          "damage": { "dice": "1d6", "modifier": 2, "type": "PIERCING" }
        },
        {
          "name": "Shortbow",
          "type": "ranged_weapon",
          "attackBonus": 4,
          "range": { "normal": 80, "long": 320 },
          "damage": { "dice": "1d6", "modifier": 2, "type": "PIERCING" }
        }
      ]
    },
    {
      "id": "zombie",
      "name": "Zombie",
      "size": "Medium",
      "type": "undead",
      "alignment": "neutral evil",
      "cr": 0.25,
      "xp": 50,
      "armorClass": 8,
      "hitPoints": { "average": 22, "dice": "3d8+9" },
      "speed": { "walk": 20 },
      "abilityScores": { "STR": 13, "DEX": 6, "CON": 16, "INT": 3, "WIS": 6, "CHA": 5 },
      "savingThrows": { "WIS": 0 },
      "immunities": ["POISON"],
      "conditionImmunities": ["poisoned"],
      "senses": { "darkvision": 60, "passivePerception": 8 },
      "languages": ["understands languages it knew in life"],
      "traits": [
        {
          "name": "Undead Fortitude",
          "description": "If damage reduces the zombie to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the zombie drops to 1 hit point instead."
        }
      ],
      "actions": [
        {
          "name": "Slam",
          "type": "melee_weapon",
          "attackBonus": 3,
          "reach": 5,
          "damage": { "dice": "1d6", "modifier": 1, "type": "BLUDGEONING" }
        }
      ]
    },
    {
      "id": "wolf",
      "name": "Wolf",
      "size": "Medium",
      "type": "beast",
      "alignment": "unaligned",
      "cr": 0.25,
      "xp": 50,
      "armorClass": 13,
      "armorType": "natural armor",
      "hitPoints": { "average": 11, "dice": "2d8+2" },
      "speed": { "walk": 40 },
      "abilityScores": { "STR": 12, "DEX": 15, "CON": 12, "INT": 3, "WIS": 12, "CHA": 6 },
      "skills": { "perception": 3, "stealth": 4 },
      "senses": { "passivePerception": 13 },
      "traits": [
        {
          "name": "Keen Hearing and Smell",
          "description": "The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell."
        },
        {
          "name": "Pack Tactics",
          "description": "The wolf has advantage on an attack roll against a creature if at least one of the wolf's allies is within 5 feet of the creature and the ally isn't incapacitated."
        }
      ],
      "actions": [
        {
          "name": "Bite",
          "type": "melee_weapon",
          "attackBonus": 4,
          "reach": 5,
          "damage": { "dice": "2d4", "modifier": 2, "type": "PIERCING" },
          "onHit": {
            "save": { "ability": "STR", "dc": 11 },
            "onFail": "prone"
          }
        }
      ]
    },
    {
      "id": "orc",
      "name": "Orc",
      "size": "Medium",
      "type": "humanoid",
      "subtype": "orc",
      "alignment": "chaotic evil",
      "cr": 0.5,
      "xp": 100,
      "armorClass": 13,
      "armorType": "hide armor",
      "hitPoints": { "average": 15, "dice": "2d8+6" },
      "speed": { "walk": 30 },
      "abilityScores": { "STR": 16, "DEX": 12, "CON": 16, "INT": 7, "WIS": 11, "CHA": 10 },
      "skills": { "intimidation": 2 },
      "senses": { "darkvision": 60, "passivePerception": 10 },
      "languages": ["Common", "Orc"],
      "traits": [
        {
          "name": "Aggressive",
          "description": "As a bonus action, the orc can move up to its speed toward a hostile creature that it can see."
        }
      ],
      "actions": [
        {
          "name": "Greataxe",
          "type": "melee_weapon",
          "attackBonus": 5,
          "reach": 5,
          "damage": { "dice": "1d12", "modifier": 3, "type": "SLASHING" }
        },
        {
          "name": "Javelin",
          "type": "melee_or_ranged",
          "attackBonus": 5,
          "reach": 5,
          "range": { "normal": 30, "long": 120 },
          "damage": { "dice": "1d6", "modifier": 3, "type": "PIERCING" }
        }
      ]
    },
    {
      "id": "bugbear",
      "name": "Bugbear",
      "size": "Medium",
      "type": "humanoid",
      "subtype": "goblinoid",
      "alignment": "chaotic evil",
      "cr": 1,
      "xp": 200,
      "armorClass": 16,
      "armorType": "hide armor, shield",
      "hitPoints": { "average": 27, "dice": "5d8+5" },
      "speed": { "walk": 30 },
      "abilityScores": { "STR": 15, "DEX": 14, "CON": 13, "INT": 8, "WIS": 11, "CHA": 9 },
      "skills": { "stealth": 6, "survival": 2 },
      "senses": { "darkvision": 60, "passivePerception": 10 },
      "languages": ["Common", "Goblin"],
      "traits": [
        {
          "name": "Brute",
          "description": "A melee weapon deals one extra die of its damage when the bugbear hits with it (included in the attack)."
        },
        {
          "name": "Surprise Attack",
          "description": "If the bugbear surprises a creature and hits it with an attack during the first round of combat, the target takes an extra 7 (2d6) damage from the attack."
        }
      ],
      "actions": [
        {
          "name": "Morningstar",
          "type": "melee_weapon",
          "attackBonus": 4,
          "reach": 5,
          "damage": { "dice": "2d8", "modifier": 2, "type": "PIERCING" }
        },
        {
          "name": "Javelin",
          "type": "melee_or_ranged",
          "attackBonus": 4,
          "reach": 5,
          "range": { "normal": 30, "long": 120 },
          "damage": { "dice": "1d6", "modifier": 2, "type": "PIERCING" }
        }
      ]
    },
    {
      "id": "ogre",
      "name": "Ogre",
      "size": "Large",
      "type": "giant",
      "alignment": "chaotic evil",
      "cr": 2,
      "xp": 450,
      "armorClass": 11,
      "armorType": "hide armor",
      "hitPoints": { "average": 59, "dice": "7d10+21" },
      "speed": { "walk": 40 },
      "abilityScores": { "STR": 19, "DEX": 8, "CON": 16, "INT": 5, "WIS": 7, "CHA": 7 },
      "senses": { "darkvision": 60, "passivePerception": 8 },
      "languages": ["Common", "Giant"],
      "actions": [
        {
          "name": "Greatclub",
          "type": "melee_weapon",
          "attackBonus": 6,
          "reach": 5,
          "damage": { "dice": "2d8", "modifier": 4, "type": "BLUDGEONING" }
        },
        {
          "name": "Javelin",
          "type": "melee_or_ranged",
          "attackBonus": 6,
          "reach": 5,
          "range": { "normal": 30, "long": 120 },
          "damage": { "dice": "2d6", "modifier": 4, "type": "PIERCING" }
        }
      ]
    },
    {
      "id": "owlbear",
      "name": "Owlbear",
      "size": "Large",
      "type": "monstrosity",
      "alignment": "unaligned",
      "cr": 3,
      "xp": 700,
      "armorClass": 13,
      "armorType": "natural armor",
      "hitPoints": { "average": 59, "dice": "7d10+21" },
      "speed": { "walk": 40 },
      "abilityScores": { "STR": 20, "DEX": 12, "CON": 17, "INT": 3, "WIS": 12, "CHA": 7 },
      "skills": { "perception": 3 },
      "senses": { "darkvision": 60, "passivePerception": 13 },
      "traits": [
        {
          "name": "Keen Sight and Smell",
          "description": "The owlbear has advantage on Wisdom (Perception) checks that rely on sight or smell."
        }
      ],
      "actions": [
        {
          "name": "Multiattack",
          "description": "The owlbear makes two attacks: one with its beak and one with its claws."
        },
        {
          "name": "Beak",
          "type": "melee_weapon",
          "attackBonus": 7,
          "reach": 5,
          "damage": { "dice": "1d10", "modifier": 5, "type": "PIERCING" }
        },
        {
          "name": "Claws",
          "type": "melee_weapon",
          "attackBonus": 7,
          "reach": 5,
          "damage": { "dice": "2d8", "modifier": 5, "type": "SLASHING" }
        }
      ]
    },
    {
      "id": "young-green-dragon",
      "name": "Young Green Dragon",
      "size": "Large",
      "type": "dragon",
      "alignment": "lawful evil",
      "cr": 8,
      "xp": 3900,
      "armorClass": 18,
      "armorType": "natural armor",
      "hitPoints": { "average": 136, "dice": "16d10+48" },
      "speed": { "walk": 40, "fly": 80, "swim": 40 },
      "abilityScores": { "STR": 19, "DEX": 12, "CON": 17, "INT": 16, "WIS": 13, "CHA": 15 },
      "savingThrows": { "DEX": 4, "CON": 6, "WIS": 4, "CHA": 5 },
      "skills": { "deception": 5, "perception": 7, "stealth": 4 },
      "immunities": ["POISON"],
      "conditionImmunities": ["poisoned"],
      "senses": { "blindsight": 30, "darkvision": 120, "passivePerception": 17 },
      "languages": ["Common", "Draconic"],
      "traits": [
        {
          "name": "Amphibious",
          "description": "The dragon can breathe air and water."
        }
      ],
      "actions": [
        {
          "name": "Multiattack",
          "description": "The dragon makes three attacks: one with its bite and two with its claws."
        },
        {
          "name": "Bite",
          "type": "melee_weapon",
          "attackBonus": 7,
          "reach": 10,
          "damage": [
            { "dice": "2d10", "modifier": 4, "type": "PIERCING" },
            { "dice": "2d6", "type": "POISON" }
          ]
        },
        {
          "name": "Claw",
          "type": "melee_weapon",
          "attackBonus": 7,
          "reach": 5,
          "damage": { "dice": "2d6", "modifier": 4, "type": "SLASHING" }
        },
        {
          "name": "Poison Breath",
          "type": "breath_weapon",
          "recharge": "5-6",
          "aoe": { "shape": "cone", "size": 30 },
          "save": { "ability": "CON", "dc": 14 },
          "damage": { "dice": "12d6", "type": "POISON" },
          "onSuccess": "half"
        }
      ]
    }
  ]
}
```

---

# 4. Weapons (content/weapons.json)

```json
{
  "weapons": [
    {
      "id": "dagger",
      "name": "Dagger",
      "category": "simple",
      "type": "melee",
      "cost": { "amount": 2, "unit": "gp" },
      "damage": { "dice": "1d4", "type": "PIERCING" },
      "weight": 1,
      "properties": ["finesse", "light", "thrown"],
      "range": { "normal": 20, "long": 60 }
    },
    {
      "id": "handaxe",
      "name": "Handaxe",
      "category": "simple",
      "type": "melee",
      "cost": { "amount": 5, "unit": "gp" },
      "damage": { "dice": "1d6", "type": "SLASHING" },
      "weight": 2,
      "properties": ["light", "thrown"],
      "range": { "normal": 20, "long": 60 }
    },
    {
      "id": "javelin",
      "name": "Javelin",
      "category": "simple",
      "type": "melee",
      "cost": { "amount": 5, "unit": "sp" },
      "damage": { "dice": "1d6", "type": "PIERCING" },
      "weight": 2,
      "properties": ["thrown"],
      "range": { "normal": 30, "long": 120 }
    },
    {
      "id": "mace",
      "name": "Mace",
      "category": "simple",
      "type": "melee",
      "cost": { "amount": 5, "unit": "gp" },
      "damage": { "dice": "1d6", "type": "BLUDGEONING" },
      "weight": 4,
      "properties": []
    },
    {
      "id": "quarterstaff",
      "name": "Quarterstaff",
      "category": "simple",
      "type": "melee",
      "cost": { "amount": 2, "unit": "sp" },
      "damage": { "dice": "1d6", "type": "BLUDGEONING" },
      "weight": 4,
      "properties": ["versatile"],
      "versatileDamage": "1d8"
    },
    {
      "id": "shortbow",
      "name": "Shortbow",
      "category": "simple",
      "type": "ranged",
      "cost": { "amount": 25, "unit": "gp" },
      "damage": { "dice": "1d6", "type": "PIERCING" },
      "weight": 2,
      "properties": ["ammunition", "two-handed"],
      "range": { "normal": 80, "long": 320 }
    },
    {
      "id": "longsword",
      "name": "Longsword",
      "category": "martial",
      "type": "melee",
      "cost": { "amount": 15, "unit": "gp" },
      "damage": { "dice": "1d8", "type": "SLASHING" },
      "weight": 3,
      "properties": ["versatile"],
      "versatileDamage": "1d10"
    },
    {
      "id": "greatsword",
      "name": "Greatsword",
      "category": "martial",
      "type": "melee",
      "cost": { "amount": 50, "unit": "gp" },
      "damage": { "dice": "2d6", "type": "SLASHING" },
      "weight": 6,
      "properties": ["heavy", "two-handed"]
    },
    {
      "id": "battleaxe",
      "name": "Battleaxe",
      "category": "martial",
      "type": "melee",
      "cost": { "amount": 10, "unit": "gp" },
      "damage": { "dice": "1d8", "type": "SLASHING" },
      "weight": 4,
      "properties": ["versatile"],
      "versatileDamage": "1d10"
    },
    {
      "id": "greataxe",
      "name": "Greataxe",
      "category": "martial",
      "type": "melee",
      "cost": { "amount": 30, "unit": "gp" },
      "damage": { "dice": "1d12", "type": "SLASHING" },
      "weight": 7,
      "properties": ["heavy", "two-handed"]
    },
    {
      "id": "rapier",
      "name": "Rapier",
      "category": "martial",
      "type": "melee",
      "cost": { "amount": 25, "unit": "gp" },
      "damage": { "dice": "1d8", "type": "PIERCING" },
      "weight": 2,
      "properties": ["finesse"]
    },
    {
      "id": "scimitar",
      "name": "Scimitar",
      "category": "martial",
      "type": "melee",
      "cost": { "amount": 25, "unit": "gp" },
      "damage": { "dice": "1d6", "type": "SLASHING" },
      "weight": 3,
      "properties": ["finesse", "light"]
    },
    {
      "id": "shortsword",
      "name": "Shortsword",
      "category": "martial",
      "type": "melee",
      "cost": { "amount": 10, "unit": "gp" },
      "damage": { "dice": "1d6", "type": "PIERCING" },
      "weight": 2,
      "properties": ["finesse", "light"]
    },
    {
      "id": "longbow",
      "name": "Longbow",
      "category": "martial",
      "type": "ranged",
      "cost": { "amount": 50, "unit": "gp" },
      "damage": { "dice": "1d8", "type": "PIERCING" },
      "weight": 2,
      "properties": ["ammunition", "heavy", "two-handed"],
      "range": { "normal": 150, "long": 600 }
    },
    {
      "id": "hand-crossbow",
      "name": "Hand Crossbow",
      "category": "martial",
      "type": "ranged",
      "cost": { "amount": 75, "unit": "gp" },
      "damage": { "dice": "1d6", "type": "PIERCING" },
      "weight": 3,
      "properties": ["ammunition", "light", "loading"],
      "range": { "normal": 30, "long": 120 }
    }
  ]
}
```

---

# 5. Armor (content/armor.json)

```json
{
  "armor": [
    {
      "id": "padded",
      "name": "Padded",
      "category": "light",
      "cost": { "amount": 5, "unit": "gp" },
      "ac": { "base": 11, "addDex": true },
      "weight": 8,
      "stealthDisadvantage": true
    },
    {
      "id": "leather",
      "name": "Leather",
      "category": "light",
      "cost": { "amount": 10, "unit": "gp" },
      "ac": { "base": 11, "addDex": true },
      "weight": 10,
      "stealthDisadvantage": false
    },
    {
      "id": "studded-leather",
      "name": "Studded Leather",
      "category": "light",
      "cost": { "amount": 45, "unit": "gp" },
      "ac": { "base": 12, "addDex": true },
      "weight": 13,
      "stealthDisadvantage": false
    },
    {
      "id": "hide",
      "name": "Hide",
      "category": "medium",
      "cost": { "amount": 10, "unit": "gp" },
      "ac": { "base": 12, "addDex": true, "maxDex": 2 },
      "weight": 12,
      "stealthDisadvantage": false
    },
    {
      "id": "chain-shirt",
      "name": "Chain Shirt",
      "category": "medium",
      "cost": { "amount": 50, "unit": "gp" },
      "ac": { "base": 13, "addDex": true, "maxDex": 2 },
      "weight": 20,
      "stealthDisadvantage": false
    },
    {
      "id": "scale-mail",
      "name": "Scale Mail",
      "category": "medium",
      "cost": { "amount": 50, "unit": "gp" },
      "ac": { "base": 14, "addDex": true, "maxDex": 2 },
      "weight": 45,
      "stealthDisadvantage": true
    },
    {
      "id": "breastplate",
      "name": "Breastplate",
      "category": "medium",
      "cost": { "amount": 400, "unit": "gp" },
      "ac": { "base": 14, "addDex": true, "maxDex": 2 },
      "weight": 20,
      "stealthDisadvantage": false
    },
    {
      "id": "half-plate",
      "name": "Half Plate",
      "category": "medium",
      "cost": { "amount": 750, "unit": "gp" },
      "ac": { "base": 15, "addDex": true, "maxDex": 2 },
      "weight": 40,
      "stealthDisadvantage": true
    },
    {
      "id": "ring-mail",
      "name": "Ring Mail",
      "category": "heavy",
      "cost": { "amount": 30, "unit": "gp" },
      "ac": { "base": 14 },
      "weight": 40,
      "stealthDisadvantage": true
    },
    {
      "id": "chain-mail",
      "name": "Chain Mail",
      "category": "heavy",
      "cost": { "amount": 75, "unit": "gp" },
      "ac": { "base": 16 },
      "strengthReq": 13,
      "weight": 55,
      "stealthDisadvantage": true
    },
    {
      "id": "splint",
      "name": "Splint",
      "category": "heavy",
      "cost": { "amount": 200, "unit": "gp" },
      "ac": { "base": 17 },
      "strengthReq": 15,
      "weight": 60,
      "stealthDisadvantage": true
    },
    {
      "id": "plate",
      "name": "Plate",
      "category": "heavy",
      "cost": { "amount": 1500, "unit": "gp" },
      "ac": { "base": 18 },
      "strengthReq": 15,
      "weight": 65,
      "stealthDisadvantage": true
    },
    {
      "id": "shield",
      "name": "Shield",
      "category": "shield",
      "cost": { "amount": 10, "unit": "gp" },
      "ac": { "bonus": 2 },
      "weight": 6
    }
  ]
}
```

---

# 6. Conditions (content/conditions.json)

```json
{
  "conditions": [
    {
      "id": "blinded",
      "name": "Blinded",
      "description": "A blinded creature can't see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage.",
      "effects": {
        "attacksHaveDisadvantage": true,
        "attacksAgainstHaveAdvantage": true,
        "autoFailSightChecks": true
      }
    },
    {
      "id": "charmed",
      "name": "Charmed",
      "description": "A charmed creature can't attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature.",
      "effects": {
        "cantAttackCharmer": true,
        "charmerHasSocialAdvantage": true
      }
    },
    {
      "id": "deafened",
      "name": "Deafened",
      "description": "A deafened creature can't hear and automatically fails any ability check that requires hearing.",
      "effects": {
        "autoFailHearingChecks": true
      }
    },
    {
      "id": "frightened",
      "name": "Frightened",
      "description": "A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can't willingly move closer to the source of its fear.",
      "effects": {
        "attacksHaveDisadvantage": true,
        "abilityChecksHaveDisadvantage": true,
        "cantMoveCloserToSource": true,
        "requiresLineOfSight": true
      }
    },
    {
      "id": "grappled",
      "name": "Grappled",
      "description": "A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed. The condition ends if the grappler is incapacitated or if an effect removes the grappled creature from the reach of the grappler.",
      "effects": {
        "speedZero": true
      }
    },
    {
      "id": "incapacitated",
      "name": "Incapacitated",
      "description": "An incapacitated creature can't take actions or reactions.",
      "effects": {
        "cantTakeActions": true,
        "cantTakeReactions": true
      }
    },
    {
      "id": "invisible",
      "name": "Invisible",
      "description": "An invisible creature is impossible to see without the aid of magic or a special sense. The creature's location can be detected by noise or tracks. Attack rolls against the creature have disadvantage, and the creature's attack rolls have advantage.",
      "effects": {
        "attacksHaveAdvantage": true,
        "attacksAgainstHaveDisadvantage": true,
        "cantBeSeen": true
      }
    },
    {
      "id": "paralyzed",
      "name": "Paralyzed",
      "description": "A paralyzed creature is incapacitated and can't move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet.",
      "effects": {
        "incapacitated": true,
        "cantMove": true,
        "cantSpeak": true,
        "autoFailStrDexSaves": true,
        "attacksAgainstHaveAdvantage": true,
        "autoCritWithin5ft": true
      }
    },
    {
      "id": "petrified",
      "name": "Petrified",
      "description": "A petrified creature is transformed, along with nonmagical objects it is wearing or carrying, into a solid inanimate substance. Its weight increases by a factor of ten, and it ceases aging.",
      "effects": {
        "incapacitated": true,
        "cantMove": true,
        "cantSpeak": true,
        "unaware": true,
        "autoFailStrDexSaves": true,
        "attacksAgainstHaveAdvantage": true,
        "resistanceAll": true,
        "immunePoisonAndDisease": true
      }
    },
    {
      "id": "poisoned",
      "name": "Poisoned",
      "description": "A poisoned creature has disadvantage on attack rolls and ability checks.",
      "effects": {
        "attacksHaveDisadvantage": true,
        "abilityChecksHaveDisadvantage": true
      }
    },
    {
      "id": "prone",
      "name": "Prone",
      "description": "A prone creature's only movement option is to crawl, unless it stands up and thereby ends the condition. The creature has disadvantage on attack rolls. An attack roll against the creature has advantage if the attacker is within 5 feet. Otherwise, the attack roll has disadvantage.",
      "effects": {
        "attacksHaveDisadvantage": true,
        "meleeAttacksAgainstHaveAdvantage": true,
        "rangedAttacksAgainstHaveDisadvantage": true,
        "movementCrawlOnly": true
      }
    },
    {
      "id": "restrained",
      "name": "Restrained",
      "description": "A restrained creature's speed becomes 0, and it can't benefit from any bonus to its speed. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage. The creature has disadvantage on Dexterity saving throws.",
      "effects": {
        "speedZero": true,
        "attacksHaveDisadvantage": true,
        "attacksAgainstHaveAdvantage": true,
        "dexSavesHaveDisadvantage": true
      }
    },
    {
      "id": "stunned",
      "name": "Stunned",
      "description": "A stunned creature is incapacitated, can't move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.",
      "effects": {
        "incapacitated": true,
        "cantMove": true,
        "speakingImpaired": true,
        "autoFailStrDexSaves": true,
        "attacksAgainstHaveAdvantage": true
      }
    },
    {
      "id": "unconscious",
      "name": "Unconscious",
      "description": "An unconscious creature is incapacitated, can't move or speak, and is unaware of its surroundings. The creature drops whatever it's holding and falls prone. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet.",
      "effects": {
        "incapacitated": true,
        "cantMove": true,
        "cantSpeak": true,
        "unaware": true,
        "dropsItems": true,
        "fallsProne": true,
        "autoFailStrDexSaves": true,
        "attacksAgainstHaveAdvantage": true,
        "autoCritWithin5ft": true
      }
    },
    {
      "id": "exhaustion",
      "name": "Exhaustion",
      "description": "Exhaustion is measured in six levels. An effect can give a creature one or more levels of exhaustion.",
      "levels": [
        { "level": 1, "effect": "Disadvantage on ability checks" },
        { "level": 2, "effect": "Speed halved" },
        { "level": 3, "effect": "Disadvantage on attack rolls and saving throws" },
        { "level": 4, "effect": "Hit point maximum halved" },
        { "level": 5, "effect": "Speed reduced to 0" },
        { "level": 6, "effect": "Death" }
      ],
      "stackable": true,
      "maxLevel": 6
    }
  ]
}
```

---

# 7. Content Seeding Script

Create this script to seed the database:

```typescript
// scripts/seed-content.ts

import { PrismaClient } from '@prisma/client';
import spells from '../content/spells.json';
import monsters from '../content/monsters.json';
import weapons from '../content/weapons.json';
import armor from '../content/armor.json';
import conditions from '../content/conditions.json';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 5e content...');

  // Seed spells
  console.log(`Seeding ${spells.spells.length} spells...`);
  for (const spell of spells.spells) {
    await prisma.spell.upsert({
      where: { id: spell.id },
      update: spell,
      create: spell,
    });
  }

  // Seed monsters
  console.log(`Seeding ${monsters.monsters.length} monsters...`);
  for (const monster of monsters.monsters) {
    await prisma.monster.upsert({
      where: { id: monster.id },
      update: monster,
      create: monster,
    });
  }

  // Seed weapons
  console.log(`Seeding ${weapons.weapons.length} weapons...`);
  for (const weapon of weapons.weapons) {
    await prisma.weapon.upsert({
      where: { id: weapon.id },
      update: weapon,
      create: weapon,
    });
  }

  // Seed armor
  console.log(`Seeding ${armor.armor.length} armor...`);
  for (const armorItem of armor.armor) {
    await prisma.armor.upsert({
      where: { id: armorItem.id },
      update: armorItem,
      create: armorItem,
    });
  }

  // Seed conditions
  console.log(`Seeding ${conditions.conditions.length} conditions...`);
  for (const condition of conditions.conditions) {
    await prisma.condition.upsert({
      where: { id: condition.id },
      update: condition,
      create: condition,
    });
  }

  console.log('Content seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

# END OF DOCUMENT 18
