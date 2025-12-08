# D&D Digital Board Game Platform
# Document 27: Starter Tutorial Campaign

---

# 1. Overview

This document contains the complete content for the **"The Goblin Cave"** starter tutorial campaign, designed to:
- Teach new players basic D&D mechanics
- Demonstrate all game features
- Provide 2-3 hours of gameplay
- Cover levels 1-3

---

# 2. Campaign Metadata

```json
{
  "id": "campaign_tutorial_goblin_cave",
  "name": "The Goblin Cave",
  "description": "A band of goblins has been raiding the village of Millbrook. Track them to their cave hideout and put an end to their threat. Perfect for new adventurers!",
  "version": "1.0.0",
  "author": "D&D Platform Team",
  "recommendedLevel": { "min": 1, "max": 3 },
  "recommendedPartySize": { "min": 1, "max": 4 },
  "estimatedDuration": 180,
  "difficulty": "easy",
  "tags": ["tutorial", "beginner", "goblins", "dungeon", "starter"],
  "thumbnail": "/campaigns/goblin_cave/thumbnail.png",
  "chapters": [
    { "id": "ch1", "name": "The Village", "order": 1 },
    { "id": "ch2", "name": "The Forest Path", "order": 2 },
    { "id": "ch3", "name": "The Goblin Cave", "order": 3 }
  ]
}
```

---

# 3. Chapter 1: The Village of Millbrook

## 3.1 Map: Millbrook Village Center

```json
{
  "id": "map_millbrook_village",
  "name": "Millbrook Village Center",
  "chapterId": "ch1",
  "width": 20,
  "height": 20,
  "tileSize": 64,
  "layers": [
    {
      "id": "terrain",
      "name": "Ground",
      "type": "terrain",
      "tiles": [
        { "x": 0, "y": 0, "tileId": "floor_dirt", "fill": { "toX": 19, "toY": 19 } },
        { "x": 8, "y": 8, "tileId": "floor_stone", "fill": { "toX": 11, "toY": 11 } }
      ]
    },
    {
      "id": "buildings",
      "name": "Buildings",
      "type": "objects",
      "tiles": [
        { "x": 2, "y": 2, "tileId": "building_tavern", "properties": { "name": "The Rusty Sword Inn" } },
        { "x": 14, "y": 3, "tileId": "building_blacksmith", "properties": { "name": "Ironforge Smithy" } },
        { "x": 3, "y": 14, "tileId": "building_general", "properties": { "name": "General Goods" } },
        { "x": 15, "y": 14, "tileId": "building_temple", "properties": { "name": "Shrine of Pelor" } },
        { "x": 9, "y": 9, "tileId": "fountain", "properties": { "name": "Village Fountain" } }
      ]
    },
    {
      "id": "npcs",
      "name": "NPCs",
      "type": "tokens",
      "tiles": [
        { "x": 5, "y": 4, "tileId": "npc_innkeeper", "properties": { "npcId": "martha_innkeeper" } },
        { "x": 16, "y": 5, "tileId": "npc_blacksmith", "properties": { "npcId": "gorn_blacksmith" } },
        { "x": 10, "y": 10, "tileId": "npc_mayor", "properties": { "npcId": "mayor_aldric" } }
      ]
    },
    {
      "id": "spawn",
      "name": "Spawn Points",
      "type": "effects",
      "tiles": [
        { "x": 10, "y": 18, "tileId": "spawn_point", "properties": { "isSpawnPoint": true, "type": "player" } }
      ]
    }
  ],
  "lighting": {
    "ambientLight": 0.8,
    "ambientColor": "#FFF8E0",
    "globalIllumination": true,
    "lights": []
  },
  "ambience": {
    "backgroundMusic": "/audio/music/village_day.mp3",
    "ambientSound": "/audio/ambient/village.mp3"
  }
}
```

## 3.2 NPCs

```json
{
  "npcs": [
    {
      "id": "mayor_aldric",
      "name": "Mayor Aldric",
      "title": "Mayor of Millbrook",
      "race": "human",
      "class": "commoner",
      "portrait": "/portraits/mayor_aldric.png",
      "description": "A portly, balding man in his 50s with kind eyes and worried expression.",
      "dialogueId": "dialogue_mayor_quest"
    },
    {
      "id": "martha_innkeeper",
      "name": "Martha",
      "title": "Innkeeper",
      "race": "human",
      "class": "commoner",
      "portrait": "/portraits/martha_innkeeper.png",
      "description": "A sturdy, middle-aged woman with flour-dusted apron.",
      "dialogueId": "dialogue_martha_info"
    },
    {
      "id": "gorn_blacksmith",
      "name": "Gorn",
      "title": "Blacksmith",
      "race": "dwarf",
      "class": "commoner",
      "portrait": "/portraits/gorn_blacksmith.png",
      "description": "A burly dwarf with singed beard and powerful arms.",
      "dialogueId": "dialogue_gorn_shop",
      "shopInventory": "shop_weapons_basic"
    }
  ]
}
```

## 3.3 Dialogue: Mayor Aldric (Quest Giver)

```json
{
  "id": "dialogue_mayor_quest",
  "name": "Mayor Aldric - The Goblin Problem",
  "startNodeId": "node_1",
  "variables": [
    { "name": "quest_accepted", "type": "boolean", "defaultValue": false },
    { "name": "learned_about_goblins", "type": "boolean", "defaultValue": false }
  ],
  "nodes": [
    {
      "id": "node_1",
      "type": "dialogue",
      "position": { "x": 100, "y": 100 },
      "data": {
        "speaker": "Mayor Aldric",
        "speakerId": "mayor_aldric",
        "text": "Ah, adventurers! Thank the gods you've arrived. Our village is in dire need of help.",
        "emotion": "worried",
        "nextNodeId": "node_2"
      }
    },
    {
      "id": "node_2",
      "type": "player_choice",
      "position": { "x": 100, "y": 200 },
      "data": {
        "choices": [
          { "id": "c1", "text": "What's the problem?", "nextNodeId": "node_3" },
          { "id": "c2", "text": "I'm here to help. What do you need?", "nextNodeId": "node_3" },
          { "id": "c3", "text": "I'm just passing through.", "nextNodeId": "node_decline" }
        ]
      }
    },
    {
      "id": "node_3",
      "type": "dialogue",
      "position": { "x": 100, "y": 300 },
      "data": {
        "speaker": "Mayor Aldric",
        "speakerId": "mayor_aldric",
        "text": "Goblins! A whole band of the wretched creatures has been raiding our farms at night. They've stolen livestock, tools, and... *his voice cracks* ...they took my daughter's silver locket.",
        "emotion": "sad",
        "nextNodeId": "node_4"
      }
    },
    {
      "id": "node_4",
      "type": "set_variable",
      "position": { "x": 100, "y": 400 },
      "data": {
        "variable": "learned_about_goblins",
        "operation": "set",
        "value": true,
        "nextNodeId": "node_5"
      }
    },
    {
      "id": "node_5",
      "type": "player_choice",
      "position": { "x": 100, "y": 500 },
      "data": {
        "choices": [
          { "id": "c1", "text": "Where can I find these goblins?", "nextNodeId": "node_location" },
          { "id": "c2", "text": "What's in it for me?", "nextNodeId": "node_reward" },
          { "id": "c3", "text": "Tell me more about what they stole.", "nextNodeId": "node_details" }
        ]
      }
    },
    {
      "id": "node_location",
      "type": "dialogue",
      "position": { "x": 300, "y": 600 },
      "data": {
        "speaker": "Mayor Aldric",
        "speakerId": "mayor_aldric",
        "text": "Old Finn, our woodcutter, tracked them to a cave in the Whispering Woods, about an hour's walk north along the forest path. Be careful - he counted at least eight of the creatures.",
        "emotion": "worried",
        "nextNodeId": "node_accept"
      }
    },
    {
      "id": "node_reward",
      "type": "dialogue",
      "position": { "x": -100, "y": 600 },
      "data": {
        "speaker": "Mayor Aldric",
        "speakerId": "mayor_aldric",
        "text": "I can offer 50 gold pieces from the village treasury. It's not much, but it's all we can spare. You're welcome to keep anything you find in that cave too.",
        "emotion": "hopeful",
        "nextNodeId": "node_accept"
      }
    },
    {
      "id": "node_details",
      "type": "dialogue",
      "position": { "x": 100, "y": 600 },
      "data": {
        "speaker": "Mayor Aldric",
        "speakerId": "mayor_aldric",
        "text": "Three chickens, a goat, two sacks of grain, some farming tools, and my daughter's silver locket. She got it from her late mother. Please, if you find it...",
        "emotion": "sad",
        "nextNodeId": "node_5"
      }
    },
    {
      "id": "node_accept",
      "type": "player_choice",
      "position": { "x": 100, "y": 700 },
      "data": {
        "choices": [
          { "id": "c1", "text": "I'll deal with these goblins.", "nextNodeId": "node_quest_accepted" },
          { "id": "c2", "text": "I need to prepare first.", "nextNodeId": "node_prepare" },
          { "id": "c3", "text": "That's not enough gold.", "nextNodeId": "node_negotiate", "skillCheck": { "skill": "persuasion", "dc": 12, "successNodeId": "node_more_gold", "failureNodeId": "node_negotiate_fail" } }
        ]
      }
    },
    {
      "id": "node_more_gold",
      "type": "dialogue",
      "position": { "x": 100, "y": 800 },
      "data": {
        "speaker": "Mayor Aldric",
        "speakerId": "mayor_aldric",
        "text": "*sighs* You drive a hard bargain. 75 gold pieces. That's the absolute most I can offer.",
        "emotion": "neutral",
        "nextNodeId": "node_quest_accepted_bonus"
      }
    },
    {
      "id": "node_negotiate_fail",
      "type": "dialogue",
      "position": { "x": 300, "y": 800 },
      "data": {
        "speaker": "Mayor Aldric",
        "speakerId": "mayor_aldric",
        "text": "I'm sorry, but 50 gold is truly all we can afford. These are simple farming folk, not wealthy merchants.",
        "emotion": "sad",
        "nextNodeId": "node_accept"
      }
    },
    {
      "id": "node_quest_accepted",
      "type": "action",
      "position": { "x": 100, "y": 900 },
      "data": {
        "actionType": "start_quest",
        "parameters": {
          "questId": "quest_goblin_cave",
          "rewardGold": 50
        },
        "nextNodeId": "node_goodbye"
      }
    },
    {
      "id": "node_quest_accepted_bonus",
      "type": "action",
      "position": { "x": -100, "y": 900 },
      "data": {
        "actionType": "start_quest",
        "parameters": {
          "questId": "quest_goblin_cave",
          "rewardGold": 75
        },
        "nextNodeId": "node_goodbye"
      }
    },
    {
      "id": "node_goodbye",
      "type": "dialogue",
      "position": { "x": 100, "y": 1000 },
      "data": {
        "speaker": "Mayor Aldric",
        "speakerId": "mayor_aldric",
        "text": "Bless you, adventurer! The path to the forest starts at the north gate. May the gods watch over you.",
        "emotion": "grateful",
        "nextNodeId": "node_end"
      }
    },
    {
      "id": "node_prepare",
      "type": "dialogue",
      "position": { "x": 300, "y": 700 },
      "data": {
        "speaker": "Mayor Aldric",
        "speakerId": "mayor_aldric",
        "text": "Of course. Visit Gorn at the smithy for weapons, or Martha at the inn if you need supplies. Come back when you're ready.",
        "emotion": "understanding",
        "nextNodeId": "node_end_temp"
      }
    },
    {
      "id": "node_decline",
      "type": "dialogue",
      "position": { "x": -300, "y": 300 },
      "data": {
        "speaker": "Mayor Aldric",
        "speakerId": "mayor_aldric",
        "text": "*looks disappointed* I understand. Safe travels to you.",
        "emotion": "sad",
        "nextNodeId": "node_end_temp"
      }
    },
    {
      "id": "node_end",
      "type": "end",
      "position": { "x": 100, "y": 1100 },
      "data": {
        "endType": "normal",
        "parameters": {
          "unlockArea": "forest_path"
        }
      }
    },
    {
      "id": "node_end_temp",
      "type": "end",
      "position": { "x": 100, "y": 400 },
      "data": {
        "endType": "normal"
      }
    }
  ]
}
```

## 3.4 Tutorial Triggers (Chapter 1)

```json
{
  "tutorials": [
    {
      "id": "tutorial_movement",
      "trigger": "on_chapter_start",
      "chapterId": "ch1",
      "steps": [
        {
          "id": "step_1",
          "type": "highlight",
          "target": ".token-player",
          "title": "Your Character",
          "content": "This is your character. Click on them to select.",
          "nextTrigger": "click"
        },
        {
          "id": "step_2",
          "type": "highlight",
          "target": ".tile-highlighted",
          "title": "Movement",
          "content": "Click any highlighted tile to move there. Your speed determines how far you can go.",
          "nextTrigger": "action_complete"
        },
        {
          "id": "step_3",
          "type": "modal",
          "title": "Explore the Village",
          "content": "Talk to the villagers to learn about the goblin threat. Click on any NPC to start a conversation.",
          "nextTrigger": "click"
        }
      ]
    },
    {
      "id": "tutorial_dialogue",
      "trigger": "on_first_dialogue",
      "steps": [
        {
          "id": "step_1",
          "type": "highlight",
          "target": ".dialogue-choice",
          "title": "Dialogue Choices",
          "content": "Choose your response carefully. Some choices may require skill checks or have consequences.",
          "nextTrigger": "click"
        }
      ]
    }
  ]
}
```

---

# 4. Chapter 2: The Forest Path

## 4.1 Map: Forest Path

```json
{
  "id": "map_forest_path",
  "name": "The Whispering Woods Path",
  "chapterId": "ch2",
  "width": 30,
  "height": 15,
  "tileSize": 64,
  "layers": [
    {
      "id": "terrain",
      "name": "Ground",
      "type": "terrain",
      "tiles": [
        { "x": 0, "y": 0, "tileId": "floor_grass", "fill": { "toX": 29, "toY": 14 } },
        { "x": 3, "y": 6, "tileId": "floor_dirt", "path": [[3,6],[4,6],[5,7],[6,7],[7,7],[8,8],[9,8],[10,8],[11,8],[12,7],[13,7],[14,7],[15,7],[16,7],[17,7],[18,7],[19,7],[20,8],[21,8],[22,8],[23,8],[24,8],[25,7],[26,7],[27,7]] }
      ]
    },
    {
      "id": "trees",
      "name": "Trees",
      "type": "objects",
      "tiles": [
        { "x": 1, "y": 2, "tileId": "tree_oak" },
        { "x": 2, "y": 10, "tileId": "tree_oak" },
        { "x": 5, "y": 1, "tileId": "tree_pine" },
        { "x": 8, "y": 12, "tileId": "tree_oak" },
        { "x": 12, "y": 2, "tileId": "tree_pine" },
        { "x": 15, "y": 11, "tileId": "tree_oak" },
        { "x": 20, "y": 3, "tileId": "tree_oak" },
        { "x": 25, "y": 10, "tileId": "tree_pine" }
      ]
    },
    {
      "id": "encounters",
      "name": "Encounter Zones",
      "type": "effects",
      "tiles": [
        { "x": 12, "y": 7, "tileId": "encounter_zone", "properties": { "encounterId": "encounter_goblin_scouts" } }
      ]
    }
  ],
  "lighting": {
    "ambientLight": 0.6,
    "ambientColor": "#90B060",
    "globalIllumination": false,
    "lights": [
      { "id": "sunbeam_1", "x": 8, "y": 5, "radius": 3, "brightness": 0.8, "color": "#FFFFAA", "flicker": false }
    ]
  },
  "ambience": {
    "backgroundMusic": "/audio/music/forest_exploration.mp3",
    "ambientSound": "/audio/ambient/forest.mp3"
  }
}
```

## 4.2 Encounter: Goblin Scouts

```json
{
  "id": "encounter_goblin_scouts",
  "name": "Goblin Scouts",
  "description": "A pair of goblin scouts ambush travelers on the forest path.",
  "mapId": "map_forest_path",
  "difficulty": "easy",
  "monsters": [
    {
      "id": "goblin_1",
      "monsterId": "goblin",
      "name": "Goblin Scout",
      "position": { "x": 14, "y": 4 },
      "behavior": {
        "type": "aggressive",
        "targetPriority": "nearest",
        "aggression": 0.8,
        "morale": 0.3,
        "cooperation": 0.6
      },
      "isMinion": false
    },
    {
      "id": "goblin_2",
      "monsterId": "goblin",
      "name": "Goblin Scout",
      "position": { "x": 10, "y": 10 },
      "behavior": {
        "type": "ranged",
        "targetPriority": "lowest_hp",
        "aggression": 0.6,
        "morale": 0.2,
        "cooperation": 0.6
      },
      "isMinion": false
    }
  ],
  "objectives": [
    {
      "id": "obj_defeat",
      "type": "defeat_all",
      "isOptional": false
    }
  ],
  "rewards": [
    { "type": "xp", "amount": 50, "condition": "victory" },
    { "type": "gold", "amount": 10, "condition": "victory" }
  ],
  "triggers": [
    {
      "id": "trigger_ambush",
      "type": "on_combat_start",
      "condition": { "type": "always" },
      "action": {
        "type": "play_dialogue",
        "parameters": {
          "speaker": "Goblin Scout",
          "text": "Fresh meat! Get them, boys!"
        }
      },
      "repeatable": false
    },
    {
      "id": "trigger_flee",
      "type": "on_hp_threshold",
      "condition": {
        "type": "creature_hp_below",
        "creatureId": "any",
        "threshold": 0.25
      },
      "action": {
        "type": "play_dialogue",
        "parameters": {
          "speaker": "Goblin",
          "text": "Too strong! Run back to the cave!"
        }
      },
      "repeatable": false
    }
  ],
  "environment": {
    "weather": "clear",
    "lighting": "daylight"
  },
  "audio": {
    "combatMusic": "/audio/music/combat_forest.mp3"
  }
}
```

## 4.3 Tutorial: Combat Basics

```json
{
  "id": "tutorial_combat",
  "trigger": "on_first_combat",
  "steps": [
    {
      "id": "step_initiative",
      "type": "modal",
      "title": "Combat Begins!",
      "content": "When combat starts, everyone rolls Initiative to determine turn order. The character with the highest roll acts first.",
      "nextTrigger": "click"
    },
    {
      "id": "step_turn",
      "type": "highlight",
      "target": ".turn-indicator",
      "title": "Your Turn",
      "content": "It's your turn! You can Move and take an Action. The order doesn't matter.",
      "nextTrigger": "click"
    },
    {
      "id": "step_action_bar",
      "type": "highlight",
      "target": ".action-bar",
      "title": "Actions",
      "content": "Choose an action: Attack, Cast Spell, Dash, Disengage, Dodge, Help, or Hide.",
      "nextTrigger": "click"
    },
    {
      "id": "step_attack",
      "type": "highlight",
      "target": "#action-attack",
      "title": "Attack",
      "content": "Click Attack, then select a target in range. You'll roll a d20 + modifiers against their AC.",
      "nextTrigger": "click"
    },
    {
      "id": "step_end_turn",
      "type": "highlight",
      "target": "#btn-end-turn",
      "title": "End Turn",
      "content": "When you're done, click End Turn. If you forget, the timer will automatically end your turn.",
      "nextTrigger": "action_complete"
    }
  ]
}
```

---

# 5. Chapter 3: The Goblin Cave

## 5.1 Map: Cave Entrance

```json
{
  "id": "map_cave_entrance",
  "name": "Goblin Cave - Entrance",
  "chapterId": "ch3",
  "width": 25,
  "height": 20,
  "layers": [
    {
      "id": "terrain",
      "name": "Ground",
      "type": "terrain",
      "tiles": [
        { "x": 0, "y": 0, "tileId": "floor_stone", "fill": { "toX": 24, "toY": 19 } },
        { "x": 5, "y": 8, "tileId": "water_shallow", "fill": { "toX": 7, "toY": 12 } }
      ]
    },
    {
      "id": "walls",
      "name": "Walls",
      "type": "terrain",
      "tiles": [
        { "x": 0, "y": 0, "tileId": "wall_stone", "border": true, "excludeGaps": [[12,19]] }
      ]
    },
    {
      "id": "objects",
      "name": "Objects",
      "type": "objects",
      "tiles": [
        { "x": 15, "y": 5, "tileId": "crate", "properties": { "loot": "loot_supplies" } },
        { "x": 16, "y": 5, "tileId": "crate", "properties": { "loot": "loot_supplies" } },
        { "x": 20, "y": 10, "tileId": "campfire", "properties": { "lightId": "light_campfire" } }
      ]
    },
    {
      "id": "doors",
      "name": "Doors",
      "type": "objects",
      "tiles": [
        { "x": 22, "y": 15, "tileId": "door_wood", "properties": { "locked": false, "leadsTo": "map_cave_interior" } }
      ]
    }
  ],
  "lighting": {
    "ambientLight": 0.2,
    "ambientColor": "#404050",
    "globalIllumination": false,
    "lights": [
      { "id": "light_entrance", "x": 12, "y": 18, "radius": 4, "brightness": 0.6, "color": "#FFFFEE", "flicker": false },
      { "id": "light_campfire", "x": 20, "y": 10, "radius": 3, "brightness": 0.8, "color": "#FF8844", "flicker": true, "flickerIntensity": 0.2 }
    ]
  }
}
```

## 5.2 Map: Cave Interior

```json
{
  "id": "map_cave_interior",
  "name": "Goblin Cave - Interior",
  "chapterId": "ch3",
  "width": 30,
  "height": 25,
  "layers": [
    {
      "id": "terrain",
      "name": "Ground",
      "type": "terrain",
      "tiles": [
        { "x": 0, "y": 0, "tileId": "floor_stone", "fill": { "toX": 29, "toY": 24 } },
        { "x": 10, "y": 5, "tileId": "difficult_rubble", "fill": { "toX": 14, "toY": 8 } },
        { "x": 20, "y": 18, "tileId": "pit", "fill": { "toX": 22, "toY": 20 }, "properties": { "damage": "2d6", "damageType": "BLUDGEONING" } }
      ]
    },
    {
      "id": "walls",
      "name": "Walls",
      "type": "terrain",
      "tiles": [
        { "x": 0, "y": 0, "tileId": "wall_stone", "border": true },
        { "x": 15, "y": 0, "tileId": "wall_stone", "fill": { "toX": 15, "toY": 10 } },
        { "x": 8, "y": 12, "tileId": "wall_stone", "fill": { "toX": 12, "toY": 12 } }
      ]
    },
    {
      "id": "objects",
      "name": "Objects",
      "type": "objects",
      "tiles": [
        { "x": 5, "y": 20, "tileId": "treasure_chest", "properties": { "loot": "loot_goblin_treasure", "locked": true, "lockDC": 12 } },
        { "x": 25, "y": 5, "tileId": "throne_crude", "properties": { "boss_seat": true } }
      ]
    }
  ],
  "lighting": {
    "ambientLight": 0.15,
    "ambientColor": "#303040",
    "globalIllumination": false,
    "lights": [
      { "id": "torch_1", "x": 5, "y": 5, "radius": 3, "brightness": 0.7, "color": "#FF6644", "flicker": true },
      { "id": "torch_2", "x": 25, "y": 5, "radius": 3, "brightness": 0.7, "color": "#FF6644", "flicker": true },
      { "id": "brazier_boss", "x": 24, "y": 8, "radius": 4, "brightness": 0.8, "color": "#FF8844", "flicker": true }
    ]
  }
}
```

## 5.3 Encounter: Goblin Boss

```json
{
  "id": "encounter_goblin_boss",
  "name": "The Goblin King",
  "description": "Grukk the Goblin King sits on his crude throne, surrounded by loyal guards.",
  "mapId": "map_cave_interior",
  "difficulty": "medium",
  "monsters": [
    {
      "id": "grukk",
      "monsterId": "goblin_boss",
      "name": "Grukk the Goblin King",
      "position": { "x": 25, "y": 6 },
      "hp": 35,
      "behavior": {
        "type": "aggressive",
        "targetPriority": "highest_threat",
        "aggression": 0.9,
        "morale": 0.5,
        "cooperation": 0.3
      },
      "isMinion": false,
      "lootTable": "loot_grukk"
    },
    {
      "id": "guard_1",
      "monsterId": "goblin",
      "name": "Goblin Guard",
      "position": { "x": 23, "y": 8 },
      "behavior": {
        "type": "defensive",
        "targetPriority": "nearest",
        "aggression": 0.7,
        "morale": 0.4,
        "cooperation": 0.8
      },
      "isMinion": false
    },
    {
      "id": "guard_2",
      "monsterId": "goblin",
      "name": "Goblin Guard",
      "position": { "x": 27, "y": 8 },
      "behavior": {
        "type": "defensive",
        "targetPriority": "nearest",
        "aggression": 0.7,
        "morale": 0.4,
        "cooperation": 0.8
      },
      "isMinion": false
    }
  ],
  "objectives": [
    {
      "id": "obj_defeat_boss",
      "type": "defeat_target",
      "targetIds": ["grukk"],
      "isOptional": false
    },
    {
      "id": "obj_recover_locket",
      "type": "custom",
      "customCondition": "item_in_inventory:silver_locket",
      "isOptional": true,
      "xpBonus": 50
    }
  ],
  "rewards": [
    { "type": "xp", "amount": 200, "condition": "victory" },
    { "type": "gold", "amount": 50, "condition": "victory" }
  ],
  "triggers": [
    {
      "id": "trigger_boss_intro",
      "type": "on_combat_start",
      "condition": { "type": "always" },
      "action": {
        "type": "play_cutscene",
        "parameters": { "cutsceneId": "cutscene_grukk_intro" }
      },
      "repeatable": false
    },
    {
      "id": "trigger_reinforcements",
      "type": "on_hp_threshold",
      "condition": {
        "type": "creature_hp_below",
        "creatureId": "grukk",
        "threshold": 0.5
      },
      "action": {
        "type": "spawn_monsters",
        "parameters": {
          "monsters": [
            { "monsterId": "goblin", "position": { "x": 2, "y": 2 } },
            { "monsterId": "goblin", "position": { "x": 2, "y": 22 } }
          ]
        }
      },
      "repeatable": false
    },
    {
      "id": "trigger_boss_death",
      "type": "on_creature_death",
      "condition": {
        "type": "creature_dies",
        "creatureId": "grukk"
      },
      "action": {
        "type": "play_cutscene",
        "parameters": { "cutsceneId": "cutscene_victory" }
      },
      "repeatable": false
    }
  ]
}
```

## 5.4 Boss Cutscene

```json
{
  "id": "cutscene_grukk_intro",
  "name": "The Goblin King Rises",
  "duration": 15,
  "timeline": [
    {
      "id": "track_camera",
      "name": "Camera",
      "type": "camera",
      "clips": [
        {
          "id": "clip_pan_to_throne",
          "trackId": "track_camera",
          "startTime": 0,
          "duration": 3,
          "data": {
            "type": "camera",
            "start": { "x": 0, "y": 0, "zoom": 1, "rotation": 0 },
            "end": { "x": 400, "y": 0, "zoom": 1.5, "rotation": 0 },
            "easing": "easeInOut"
          }
        }
      ]
    },
    {
      "id": "track_dialogue",
      "name": "Dialogue",
      "type": "dialogue",
      "clips": [
        {
          "id": "clip_grukk_speaks",
          "trackId": "track_dialogue",
          "startTime": 3,
          "duration": 5,
          "data": {
            "type": "dialogue",
            "speaker": "Grukk the Goblin King",
            "speakerId": "grukk",
            "text": "More soft-skins come to Grukk's cave? You will join the others... as dinner!",
            "emotion": "angry",
            "position": "bottom"
          }
        }
      ]
    },
    {
      "id": "track_animation",
      "name": "Animation",
      "type": "animation",
      "clips": [
        {
          "id": "clip_grukk_stand",
          "trackId": "track_animation",
          "startTime": 4,
          "duration": 2,
          "data": {
            "type": "animation",
            "targetId": "grukk",
            "animation": "stand_menacing"
          }
        },
        {
          "id": "clip_guards_ready",
          "trackId": "track_animation",
          "startTime": 6,
          "duration": 1,
          "data": {
            "type": "animation",
            "targetId": "guard_1",
            "animation": "ready_weapon"
          }
        }
      ]
    },
    {
      "id": "track_audio",
      "name": "Audio",
      "type": "audio",
      "clips": [
        {
          "id": "clip_boss_music",
          "trackId": "track_audio",
          "startTime": 8,
          "duration": 7,
          "data": {
            "type": "audio",
            "url": "/audio/music/boss_intro.mp3",
            "volume": 0.8,
            "fadeIn": 2,
            "fadeOut": 1,
            "loop": false
          }
        }
      ]
    }
  ]
}
```

---

# 6. Loot Tables

```json
{
  "lootTables": [
    {
      "id": "loot_supplies",
      "name": "Supply Crate",
      "rolls": 1,
      "items": [
        { "itemId": "potion_healing", "weight": 3, "quantity": { "min": 1, "max": 1 } },
        { "itemId": "rations", "weight": 5, "quantity": { "min": 1, "max": 3 } },
        { "itemId": "torch", "weight": 4, "quantity": { "min": 1, "max": 2 } },
        { "itemId": "rope", "weight": 2, "quantity": { "min": 1, "max": 1 } }
      ]
    },
    {
      "id": "loot_goblin_treasure",
      "name": "Goblin Treasure Chest",
      "rolls": 3,
      "items": [
        { "itemId": "gold_pieces", "weight": 10, "quantity": { "min": 5, "max": 20 } },
        { "itemId": "silver_locket", "weight": 1, "quantity": { "min": 1, "max": 1 }, "unique": true },
        { "itemId": "gem_small", "weight": 2, "quantity": { "min": 1, "max": 2 } },
        { "itemId": "potion_healing", "weight": 3, "quantity": { "min": 1, "max": 1 } }
      ]
    },
    {
      "id": "loot_grukk",
      "name": "Grukk's Possessions",
      "guaranteed": [
        { "itemId": "scimitar_1", "quantity": 1 },
        { "itemId": "gold_pieces", "quantity": 25 }
      ],
      "rolls": 1,
      "items": [
        { "itemId": "potion_healing_greater", "weight": 2, "quantity": { "min": 1, "max": 1 } },
        { "itemId": "scroll_magic_missile", "weight": 1, "quantity": { "min": 1, "max": 1 } }
      ]
    }
  ]
}
```

---

# 7. Quest Definition

```json
{
  "id": "quest_goblin_cave",
  "name": "The Goblin Problem",
  "description": "Clear out the goblin cave and recover the stolen goods.",
  "type": "main",
  "stages": [
    {
      "id": "stage_1",
      "name": "Find the Cave",
      "description": "Follow the forest path north to find the goblin cave.",
      "objectives": [
        { "type": "reach_location", "locationId": "map_cave_entrance" }
      ]
    },
    {
      "id": "stage_2",
      "name": "Clear the Cave",
      "description": "Defeat Grukk the Goblin King and his minions.",
      "objectives": [
        { "type": "complete_encounter", "encounterId": "encounter_goblin_boss" }
      ]
    },
    {
      "id": "stage_3",
      "name": "Return to Millbrook",
      "description": "Return to Mayor Aldric with news of your success.",
      "objectives": [
        { "type": "talk_to", "npcId": "mayor_aldric" }
      ]
    }
  ],
  "rewards": {
    "xp": 300,
    "gold": 50,
    "items": [],
    "reputation": [{ "faction": "millbrook", "change": 50 }]
  },
  "bonusObjectives": [
    {
      "id": "bonus_locket",
      "name": "The Silver Locket",
      "description": "Find and return the mayor's daughter's silver locket.",
      "objective": { "type": "have_item", "itemId": "silver_locket" },
      "rewards": {
        "xp": 50,
        "gold": 25,
        "reputation": [{ "faction": "millbrook", "change": 25 }]
      }
    }
  ]
}
```

---

# 8. Monster Definitions (For Tutorial)

```json
{
  "monsters": [
    {
      "id": "goblin_boss",
      "name": "Goblin Boss",
      "size": "small",
      "type": "humanoid",
      "subtype": "goblinoid",
      "alignment": "neutral evil",
      "cr": 1,
      "xp": 200,
      "ac": 17,
      "acType": "chain shirt, shield",
      "hp": { "average": 21, "formula": "6d6" },
      "speed": { "walk": 30 },
      "abilities": {
        "STR": 10, "DEX": 14, "CON": 10,
        "INT": 10, "WIS": 8, "CHA": 10
      },
      "skills": { "stealth": 6 },
      "senses": { "darkvision": 60 },
      "languages": ["Common", "Goblin"],
      "traits": [
        {
          "name": "Nimble Escape",
          "description": "The goblin can take the Disengage or Hide action as a bonus action on each of its turns."
        }
      ],
      "actions": [
        {
          "name": "Multiattack",
          "description": "The goblin boss makes two attacks with its scimitar."
        },
        {
          "name": "Scimitar",
          "type": "melee_weapon",
          "attackBonus": 4,
          "reach": 5,
          "damage": { "dice": "1d6", "modifier": 2, "type": "SLASHING" }
        },
        {
          "name": "Javelin",
          "type": "ranged_weapon",
          "attackBonus": 2,
          "range": { "normal": 30, "long": 120 },
          "damage": { "dice": "1d6", "type": "PIERCING" }
        }
      ],
      "reactions": [
        {
          "name": "Redirect Attack",
          "description": "When a creature the goblin can see targets it with an attack, the goblin chooses another goblin within 5 feet of it. The two goblins swap places, and the chosen goblin becomes the target instead."
        }
      ]
    }
  ]
}
```

---

# END OF DOCUMENT 27
