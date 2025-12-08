# D&D Digital Board Game Platform
# API Specifications - Part 2
# Realtime Gateway, Matchmaking, Content, Campaign Builder, Character, Media, Grid Solver, AI APIs

---

# 4. Realtime Gateway (WebSocket) API

Handles all real-time communication during gameplay.

## 4.1 Connection

**URL:** `wss://rt.dndboard.game/sessions/{session_id}`

**Connection Headers:**
```
Authorization: Bearer <jwt_token>
X-Client-Version: 1.2.0
X-Protocol-Version: 1.0.0
X-Last-Sequence: 0
```

## 4.2 Connection Lifecycle

### Initial Handshake

```json
// Server → Client (on connect)
{
  "type": "CONNECTION_ACK",
  "connection_id": "conn_abc123",
  "protocol_version": "1.0.0",
  "server_time": 1710936000000,
  "heartbeat_interval_ms": 30000
}

// Server → Client (initial state)
{
  "type": "STATE_SNAPSHOT",
  "sequence": 1,
  "timestamp": 1710936000100,
  "payload": {
    "session_id": "sess_a1b2c3d4",
    "state": "ACTIVE",
    "map": {
      "map_id": "map_goblin_cave",
      "name": "Cragmaw Hideout",
      "grid": {"width": 50, "height": 40},
      "visible_tiles": [/* array of visible tile data */]
    },
    "combat": {
      "active": true,
      "round": 3,
      "initiative_order": [
        {"entity_id": "ent_pc001", "name": "Thorin", "initiative": 18, "is_current": true},
        {"entity_id": "ent_goblin1", "name": "Goblin", "initiative": 15},
        {"entity_id": "ent_pc002", "name": "Elara", "initiative": 12}
      ],
      "current_turn": "ent_pc001"
    },
    "entities": [
      {
        "entity_id": "ent_pc001",
        "type": "PLAYER_CHARACTER",
        "name": "Thorin Ironforge",
        "position": {"x": 5, "y": 10},
        "current_hp": 25,
        "max_hp": 28,
        "temp_hp": 0,
        "armor_class": 18,
        "conditions": [],
        "controller_id": "usr_player1",
        "visible_to": "all",
        "resources": {
          "action": true,
          "bonus_action": true,
          "reaction": true,
          "movement": 25
        }
      }
    ],
    "players": [
      {
        "user_id": "usr_player1",
        "display_name": "Player One",
        "role": "PLAYER",
        "status": "CONNECTED",
        "controlled_entities": ["ent_pc001"]
      },
      {
        "user_id": "usr_dm001",
        "display_name": "DungeonMaster Dave",
        "role": "DM",
        "status": "CONNECTED",
        "controlled_entities": ["ent_goblin1", "ent_goblin2"]
      }
    ],
    "fog_of_war": {
      "enabled": true,
      "revealed_tiles": [/* array of revealed positions */]
    }
  }
}
```

## 4.3 Client → Server Messages

### Message Envelope

```json
{
  "type": "COMMAND",
  "message_id": "msg_001",
  "timestamp": 1710936000000,
  "payload": { /* command-specific */ }
}
```

### Movement Command

```json
{
  "type": "COMMAND",
  "message_id": "msg_001",
  "payload": {
    "command": "MOVE",
    "entity_id": "ent_pc001",
    "path": [
      {"x": 5, "y": 10},
      {"x": 6, "y": 10},
      {"x": 7, "y": 11}
    ]
  }
}
```

### Attack Command

```json
{
  "type": "COMMAND",
  "message_id": "msg_002",
  "payload": {
    "command": "ATTACK",
    "entity_id": "ent_pc001",
    "attack_type": "MELEE_WEAPON",
    "weapon_id": "weapon_longsword",
    "target_id": "ent_goblin1"
  }
}
```

### Cast Spell Command

```json
{
  "type": "COMMAND",
  "message_id": "msg_003",
  "payload": {
    "command": "CAST_SPELL",
    "entity_id": "ent_pc002",
    "spell_id": "spell_fireball",
    "slot_level": 3,
    "targets": {
      "type": "POINT",
      "position": {"x": 25, "y": 15}
    },
    "metamagic": null
  }
}
```

### End Turn Command

```json
{
  "type": "COMMAND",
  "message_id": "msg_004",
  "payload": {
    "command": "END_TURN",
    "entity_id": "ent_pc001"
  }
}
```

### Use Ability Command

```json
{
  "type": "COMMAND",
  "message_id": "msg_005",
  "payload": {
    "command": "USE_ABILITY",
    "entity_id": "ent_pc001",
    "ability_id": "second_wind",
    "targets": ["ent_pc001"]
  }
}
```

### Use Item Command

```json
{
  "type": "COMMAND",
  "message_id": "msg_006",
  "payload": {
    "command": "USE_ITEM",
    "entity_id": "ent_pc001",
    "item_slot": 3,
    "target_id": "ent_pc002"
  }
}
```

### Reaction Command

```json
{
  "type": "COMMAND",
  "message_id": "msg_007",
  "payload": {
    "command": "REACTION",
    "entity_id": "ent_pc001",
    "reaction_type": "OPPORTUNITY_ATTACK",
    "trigger_id": "trigger_opp_001",
    "target_id": "ent_goblin1"
  }
}
```

### Decline Reaction Command

```json
{
  "type": "COMMAND",
  "message_id": "msg_008",
  "payload": {
    "command": "DECLINE_REACTION",
    "entity_id": "ent_pc001",
    "trigger_id": "trigger_opp_001"
  }
}
```

### Ready Action Command

```json
{
  "type": "COMMAND",
  "message_id": "msg_009",
  "payload": {
    "command": "READY_ACTION",
    "entity_id": "ent_pc001",
    "action_type": "ATTACK",
    "trigger_description": "When an enemy enters my reach",
    "trigger_condition": {
      "type": "ENEMY_ENTERS_RANGE",
      "range": 5
    }
  }
}
```

### Standard Actions

```json
// DASH
{
  "type": "COMMAND",
  "message_id": "msg_010",
  "payload": {
    "command": "DASH",
    "entity_id": "ent_pc001"
  }
}

// DISENGAGE
{
  "type": "COMMAND",
  "message_id": "msg_011",
  "payload": {
    "command": "DISENGAGE",
    "entity_id": "ent_pc001"
  }
}

// DODGE
{
  "type": "COMMAND",
  "message_id": "msg_012",
  "payload": {
    "command": "DODGE",
    "entity_id": "ent_pc001"
  }
}

// HIDE
{
  "type": "COMMAND",
  "message_id": "msg_013",
  "payload": {
    "command": "HIDE",
    "entity_id": "ent_pc001"
  }
}

// HELP
{
  "type": "COMMAND",
  "message_id": "msg_014",
  "payload": {
    "command": "HELP",
    "entity_id": "ent_pc001",
    "help_type": "ATTACK",
    "ally_id": "ent_pc002"
  }
}

// SEARCH
{
  "type": "COMMAND",
  "message_id": "msg_015",
  "payload": {
    "command": "SEARCH",
    "entity_id": "ent_pc001"
  }
}
```

### DM Commands

```json
// DM Override HP
{
  "type": "DM_COMMAND",
  "message_id": "dm_001",
  "payload": {
    "command": "OVERRIDE_HP",
    "entity_id": "ent_goblin1",
    "new_hp": 5,
    "reason": "Dramatic tension"
  }
}

// DM Force Roll Result
{
  "type": "DM_COMMAND",
  "message_id": "dm_002",
  "payload": {
    "command": "FORCE_ROLL",
    "roll_id": "pending_roll_001",
    "result": 20
  }
}

// DM Add Entity
{
  "type": "DM_COMMAND",
  "message_id": "dm_003",
  "payload": {
    "command": "ADD_ENTITY",
    "monster_id": "monster_goblin",
    "position": {"x": 20, "y": 15},
    "custom_name": "Goblin Reinforcement",
    "current_hp": 7,
    "add_to_initiative": true,
    "initiative_value": 12
  }
}

// DM Remove Entity
{
  "type": "DM_COMMAND",
  "message_id": "dm_004",
  "payload": {
    "command": "REMOVE_ENTITY",
    "entity_id": "ent_goblin1",
    "reason": "Fled combat"
  }
}

// DM Apply Condition
{
  "type": "DM_COMMAND",
  "message_id": "dm_005",
  "payload": {
    "command": "APPLY_CONDITION",
    "entity_id": "ent_pc001",
    "condition": "FRIGHTENED",
    "duration_rounds": 3,
    "source_entity": "ent_dragon1"
  }
}

// DM Teleport Entity
{
  "type": "DM_COMMAND",
  "message_id": "dm_006",
  "payload": {
    "command": "TELEPORT",
    "entity_id": "ent_pc001",
    "position": {"x": 25, "y": 10}
  }
}

// DM Deal Damage
{
  "type": "DM_COMMAND",
  "message_id": "dm_007",
  "payload": {
    "command": "DEAL_DAMAGE",
    "entity_id": "ent_pc001",
    "damage": 15,
    "damage_type": "FIRE",
    "source": "Environmental Trap"
  }
}

// DM Modify Initiative
{
  "type": "DM_COMMAND",
  "message_id": "dm_008",
  "payload": {
    "command": "MODIFY_INITIATIVE",
    "entity_id": "ent_pc001",
    "new_initiative": 25
  }
}

// DM End Combat
{
  "type": "DM_COMMAND",
  "message_id": "dm_009",
  "payload": {
    "command": "END_COMBAT",
    "outcome": "VICTORY",
    "xp_awarded": 450
  }
}

// DM Change Scene
{
  "type": "DM_COMMAND",
  "message_id": "dm_010",
  "payload": {
    "command": "CHANGE_SCENE",
    "scene_id": "scene_002",
    "map_id": "map_throne_room",
    "transition": "FADE_TO_BLACK"
  }
}

// DM Pause/Resume
{
  "type": "DM_COMMAND",
  "message_id": "dm_011",
  "payload": {
    "command": "PAUSE_SESSION"
  }
}
```

### Chat Messages

```json
// Party Chat
{
  "type": "CHAT",
  "message_id": "chat_001",
  "payload": {
    "channel": "party",
    "text": "Should we go left or right?",
    "in_character": false
  }
}

// DM-Only Chat
{
  "type": "CHAT",
  "message_id": "chat_002",
  "payload": {
    "channel": "dm_only",
    "recipient_id": "usr_dm001",
    "text": "Can I roll insight on the NPC?",
    "in_character": false
  }
}

// In-Character Speech
{
  "type": "CHAT",
  "message_id": "chat_003",
  "payload": {
    "channel": "all",
    "text": "Stand back, foul creature! I shall smite thee!",
    "in_character": true,
    "speaking_as": "ent_pc001"
  }
}
```

### Utility Messages

```json
// Heartbeat
{
  "type": "HEARTBEAT",
  "message_id": "hb_001",
  "timestamp": 1710936000000,
  "payload": {
    "client_time": 1710936000000
  }
}

// Sync Request (after reconnection)
{
  "type": "SYNC_REQUEST",
  "message_id": "sync_001",
  "payload": {
    "last_sequence": 42
  }
}
```

## 4.4 Server → Client Messages

### Command Acknowledgment

```json
// Accepted
{
  "type": "COMMAND_ACK",
  "message_id": "msg_001",
  "timestamp": 1710936000050,
  "payload": {
    "status": "ACCEPTED",
    "estimated_process_time_ms": 100
  }
}

// Rejected
{
  "type": "COMMAND_ACK",
  "message_id": "msg_001",
  "timestamp": 1710936000050,
  "payload": {
    "status": "REJECTED",
    "error": {
      "code": "NOT_YOUR_TURN",
      "message": "It is not your entity's turn to act.",
      "details": {
        "current_turn": "ent_goblin1"
      }
    }
  }
}
```

### State Delta

```json
{
  "type": "STATE_DELTA",
  "sequence": 43,
  "timestamp": 1710936000100,
  "caused_by": "msg_001",
  "payload": {
    "entity_changes": [
      {
        "entity_id": "ent_pc001",
        "change_type": "MODIFIED",
        "position": {"x": 7, "y": 11},
        "resources": {
          "movement": 10
        }
      }
    ],
    "combat_log": [
      {
        "type": "MOVEMENT",
        "actor": "Thorin Ironforge",
        "actor_id": "ent_pc001",
        "text": "Thorin moves 15 feet.",
        "timestamp": 1710936000100
      }
    ]
  }
}
```

### Combat Result

```json
{
  "type": "COMBAT_RESULT",
  "sequence": 44,
  "timestamp": 1710936000200,
  "caused_by": "msg_002",
  "payload": {
    "action_type": "ATTACK",
    "actor_id": "ent_pc001",
    "actor_name": "Thorin Ironforge",
    "attack": {
      "target_id": "ent_goblin1",
      "target_name": "Goblin",
      "hit": true,
      "critical": false,
      "attack_roll": {
        "natural": 15,
        "total": 23,
        "breakdown": ["d20: 15", "+5 STR", "+3 proficiency"]
      },
      "target_ac": 15
    },
    "damage": {
      "total": 12,
      "dealt": 12,
      "type": "SLASHING",
      "breakdown": ["1d8+5: 12"]
    },
    "target_state": {
      "entity_id": "ent_goblin1",
      "previous_hp": 7,
      "current_hp": 0,
      "max_hp": 7,
      "status": "UNCONSCIOUS"
    },
    "entity_changes": [
      {
        "entity_id": "ent_goblin1",
        "change_type": "MODIFIED",
        "current_hp": 0,
        "conditions_added": ["UNCONSCIOUS"]
      },
      {
        "entity_id": "ent_pc001",
        "change_type": "MODIFIED",
        "resources": {"action": false}
      }
    ],
    "visual_effects": [
      {
        "type": "melee_attack",
        "animation": "sword_swing",
        "origin": {"x": 7, "y": 11},
        "target": {"x": 8, "y": 11},
        "duration_ms": 500
      },
      {
        "type": "damage_number",
        "position": {"x": 8, "y": 11},
        "value": 12,
        "color": "#ef4444"
      }
    ],
    "audio_cues": [
      {"sound": "sword_slash", "position": {"x": 8, "y": 11}},
      {"sound": "hit_flesh", "position": {"x": 8, "y": 11}, "delay_ms": 200}
    ],
    "combat_log": [
      {
        "type": "ATTACK",
        "text": "Thorin attacks Goblin with Longsword. Attack: 23 vs AC 15. Hit!"
      },
      {
        "type": "DAMAGE",
        "text": "Thorin deals 12 slashing damage to Goblin."
      },
      {
        "type": "STATUS",
        "text": "Goblin falls unconscious!"
      }
    ]
  }
}
```

### Turn Change

```json
{
  "type": "TURN_CHANGE",
  "sequence": 45,
  "timestamp": 1710936000300,
  "payload": {
    "previous_entity": "ent_pc001",
    "current_entity": "ent_goblin2",
    "round": 3,
    "turn_timer": {
      "enabled": true,
      "seconds": 120
    },
    "start_of_turn_effects": []
  }
}
```

### Reaction Prompt

```json
{
  "type": "REACTION_PROMPT",
  "sequence": 46,
  "timestamp": 1710936000400,
  "payload": {
    "trigger_id": "trigger_opp_001",
    "entity_id": "ent_pc001",
    "reaction_type": "OPPORTUNITY_ATTACK",
    "trigger_description": "Goblin moves out of your reach",
    "triggering_entity": "ent_goblin2",
    "time_limit_ms": 10000,
    "available_reactions": [
      {
        "type": "OPPORTUNITY_ATTACK",
        "description": "Make a melee attack against the fleeing creature"
      },
      {
        "type": "DECLINE",
        "description": "Let them go"
      }
    ]
  }
}
```

### Session Events

```json
// Player Joined
{
  "type": "PLAYER_UPDATE",
  "sequence": 47,
  "payload": {
    "action": "JOINED",
    "user_id": "usr_player2",
    "display_name": "Elara's Player",
    "entity_ids": ["ent_pc002"],
    "role": "player"
  }
}

// Player Disconnected
{
  "type": "PLAYER_UPDATE",
  "sequence": 48,
  "payload": {
    "action": "DISCONNECTED",
    "user_id": "usr_player2",
    "reconnect_window_seconds": 300
  }
}

// Combat Started
{
  "type": "COMBAT_STARTED",
  "sequence": 49,
  "payload": {
    "combat_id": "combat_001",
    "initiative_order": [
      {"entity_id": "ent_pc001", "name": "Thorin", "initiative": 18},
      {"entity_id": "ent_goblin1", "name": "Goblin", "initiative": 15}
    ],
    "first_turn": "ent_pc001",
    "surprise_round": false
  }
}

// Combat Ended
{
  "type": "COMBAT_ENDED",
  "sequence": 50,
  "payload": {
    "outcome": "VICTORY",
    "total_rounds": 5,
    "xp_awarded": 450,
    "loot": [
      {"item_id": "gold_coins", "quantity": 25}
    ]
  }
}
```

### Error Messages

```json
{
  "type": "ERROR",
  "message_id": "msg_003",
  "payload": {
    "code": "INVALID_TARGET",
    "message": "Target is out of range for this spell.",
    "severity": "WARNING",
    "details": {
      "spell_range": 120,
      "actual_distance": 150
    }
  }
}
```

## 4.5 Error Codes

| Code | Description |
|------|-------------|
| `NOT_YOUR_TURN` | Attempting action when it's not your turn |
| `INVALID_TARGET` | Target doesn't exist or can't be targeted |
| `OUT_OF_RANGE` | Target beyond weapon/spell range |
| `NO_LINE_OF_SIGHT` | Cannot see target |
| `INSUFFICIENT_MOVEMENT` | Not enough movement for path |
| `NO_SPELL_SLOT` | No available spell slot |
| `ACTION_UNAVAILABLE` | Action/bonus/reaction already used |
| `CONCENTRATION_CONFLICT` | Already concentrating |
| `INVALID_PATH` | Path blocked or impossible |
| `ENTITY_NOT_FOUND` | Entity ID doesn't exist |
| `NOT_AUTHORIZED` | User can't control this entity |
| `SESSION_PAUSED` | Session is paused |
| `SESSION_ENDED` | Session has ended |
| `RATE_LIMITED` | Too many commands |

## 4.6 Reconnection Protocol

```json
// Client reconnects with X-Last-Sequence header

// Server response - delta recovery possible
{
  "type": "RECONNECTION_ACK",
  "payload": {
    "connection_id": "conn_new123",
    "recovery_type": "DELTA",
    "your_sequence": 42,
    "current_sequence": 50,
    "missed_deltas": [/* array of missed messages */]
  }
}

// Server response - full snapshot needed
{
  "type": "RECONNECTION_ACK",
  "payload": {
    "connection_id": "conn_new123",
    "recovery_type": "FULL_SNAPSHOT",
    "reason": "Too many missed messages",
    "state": {/* full game state */},
    "current_sequence": 50
  }
}
```

---

# 5. Matchmaking & Party Service API

Handles lobby creation, party management, and session launching.

## 5.1 Base Configuration

**Base URL:** `https://api.dndboard.game/v1/lobbies`

## 5.2 Lobby Endpoints

### POST /lobbies

Create a new lobby.

**Request:**
```json
{
  "name": "Friday Night Dungeon Crawl",
  "campaign_id": "camp_abc123",
  "visibility": "PRIVATE",
  "max_players": 5,
  "password": "optional_password",
  "settings": {
    "allow_spectators": true,
    "require_character_approval": true,
    "min_level": 1,
    "max_level": 5,
    "allowed_sources": ["PHB", "XGE", "TCE"]
  }
}
```

**Response (201):**
```json
{
  "lobby_id": "lobby_xyz789",
  "join_code": "DRAGON42",
  "invite_link": "https://dndboard.game/join/DRAGON42",
  "name": "Friday Night Dungeon Crawl",
  "host": {
    "user_id": "usr_dm001",
    "display_name": "DungeonMaster Dave",
    "role": "DM"
  },
  "state": "WAITING",
  "max_players": 5,
  "created_at": "2024-03-20T18:00:00Z"
}
```

### GET /lobbies

List available public lobbies.

### GET /lobbies/{lobby_id}

Get lobby details.

**Response:**
```json
{
  "lobby_id": "lobby_xyz789",
  "join_code": "DRAGON42",
  "name": "Friday Night Dungeon Crawl",
  "state": "WAITING",
  "host": {
    "user_id": "usr_dm001",
    "display_name": "DungeonMaster Dave",
    "role": "DM",
    "status": "READY"
  },
  "players": [
    {
      "user_id": "usr_player1",
      "display_name": "Thorin's Player",
      "role": "PLAYER",
      "status": "READY",
      "character": {
        "character_id": "char_hero001",
        "name": "Thorin Ironforge",
        "class": "Fighter",
        "level": 3,
        "approved": true
      }
    }
  ],
  "max_players": 5,
  "campaign": {
    "campaign_id": "camp_abc123",
    "name": "Lost Mine of Phandelver",
    "level_range": "1-5"
  }
}
```

### POST /lobbies/{lobby_id}/join

Join a lobby.

**Request:**
```json
{
  "join_code": "DRAGON42",
  "password": "optional",
  "role": "PLAYER",
  "character_id": "char_hero001"
}
```

### POST /lobbies/{lobby_id}/leave

Leave the lobby.

### PUT /lobbies/{lobby_id}/players/{user_id}

Update player status or character.

### POST /lobbies/{lobby_id}/kick

Kick a player (host only).

### POST /lobbies/{lobby_id}/start

Start the game session.

**Response:**
```json
{
  "session_id": "sess_a1b2c3d4",
  "websocket_url": "wss://rt.dndboard.game/sessions/sess_a1b2c3d4",
  "redirect_at": "2024-03-20T18:30:00Z"
}
```

---

# 6. Content Service API

Provides read access to all game content: spells, items, monsters, classes, conditions.

## 6.1 Base Configuration

**Base URL:** `https://api.dndboard.game/v1/content`

## 6.2 Spells

### GET /spells

List and search spells.

**Query Parameters:**
- `class`: Filter by class
- `level`: Filter by spell level (0-9)
- `school`: Filter by school
- `concentration`: true/false
- `ritual`: true/false
- `search`: Text search

### GET /spells/{spell_id}

Get full spell details.

**Response:**
```json
{
  "spell_id": "spell_fireball",
  "name": "Fireball",
  "level": 3,
  "school": "evocation",
  "casting_time": "1 action",
  "range": "150 feet",
  "components": {
    "verbal": true,
    "somatic": true,
    "material": true,
    "material_description": "A tiny ball of bat guano and sulfur"
  },
  "duration": "Instantaneous",
  "concentration": false,
  "classes": ["sorcerer", "wizard"],
  "description": "A bright streak flashes from your pointing finger...",
  "at_higher_levels": "When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd."
}
```

### GET /spells/{spell_id}/mechanics

Get mechanical data for rules engine.

**Response:**
```json
{
  "spell_id": "spell_fireball",
  "mechanics": {
    "targeting": {
      "type": "POINT",
      "range_feet": 150,
      "requires_sight": true
    },
    "area_of_effect": {
      "shape": "SPHERE",
      "radius_feet": 20,
      "spreads_around_corners": true
    },
    "saving_throw": {
      "ability": "DEX",
      "dc_type": "SPELL_DC",
      "success_effect": "HALF_DAMAGE"
    },
    "damage": {
      "base_dice": "8d6",
      "damage_type": "FIRE",
      "upcast_dice": "1d6",
      "upcast_per_level": 1
    }
  }
}
```

## 6.3 Monsters

### GET /monsters

List monsters with filters.

### GET /monsters/{monster_id}

Get full monster stat block.

**Response:**
```json
{
  "monster_id": "monster_adult_red_dragon",
  "name": "Adult Red Dragon",
  "size": "Huge",
  "type": "dragon",
  "alignment": "chaotic evil",
  "armor_class": {"value": 19, "type": "natural armor"},
  "hit_points": {"average": 256, "formula": "19d12 + 133"},
  "speed": {"walk": 40, "climb": 40, "fly": 80},
  "ability_scores": {
    "STR": 27, "DEX": 10, "CON": 25,
    "INT": 16, "WIS": 13, "CHA": 21
  },
  "saving_throws": {"DEX": 6, "CON": 13, "WIS": 7, "CHA": 11},
  "damage_immunities": ["fire"],
  "senses": {"blindsight": 60, "darkvision": 120},
  "challenge_rating": 17,
  "actions": [
    {
      "name": "Multiattack",
      "description": "The dragon can use its Frightful Presence..."
    },
    {
      "name": "Bite",
      "attack_type": "MELEE_WEAPON",
      "attack_bonus": 14,
      "reach": 10,
      "damage": [
        {"dice": "2d10+8", "type": "PIERCING"},
        {"dice": "2d6", "type": "FIRE"}
      ]
    },
    {
      "name": "Fire Breath (Recharge 5-6)",
      "recharge": {"min": 5, "max": 6},
      "save": {"ability": "DEX", "dc": 21},
      "damage": {"dice": "18d6", "type": "FIRE"}
    }
  ],
  "legendary_actions": {
    "per_round": 3,
    "actions": [
      {"name": "Detect", "cost": 1},
      {"name": "Tail Attack", "cost": 1},
      {"name": "Wing Attack", "cost": 2}
    ]
  }
}
```

## 6.4 Items

### GET /items

List items.

### GET /items/{item_id}

Get item details.

## 6.5 Conditions

### GET /conditions

List all conditions.

### GET /conditions/{condition_id}

Get condition details with effects.

**Response:**
```json
{
  "condition_id": "condition_frightened",
  "name": "Frightened",
  "description": "A frightened creature has disadvantage...",
  "effects": [
    {
      "type": "IMPOSE_DISADVANTAGE",
      "target": "ability_checks",
      "condition": "source_visible"
    },
    {
      "type": "IMPOSE_DISADVANTAGE",
      "target": "attack_rolls",
      "condition": "source_visible"
    },
    {
      "type": "MOVEMENT_RESTRICTION",
      "restriction": "cannot_approach_source"
    }
  ]
}
```

---

# 7. Campaign Builder API

Allows DMs to create campaigns, maps, encounters, and dialogues.

## 7.1 Base Configuration

**Base URL:** `https://api.dndboard.game/v1/campaigns`

## 7.2 Campaign Management

### POST /campaigns

Create a new campaign.

### GET /campaigns/{campaign_id}

Get campaign with all content references.

### PUT /campaigns/{campaign_id}

Update campaign metadata.

## 7.3 Map Editor

### POST /campaigns/{campaign_id}/maps

Create a new map.

**Request:**
```json
{
  "name": "Cragmaw Hideout",
  "grid": {"width": 50, "height": 40, "tile_size_feet": 5},
  "default_terrain": "cave_floor",
  "environment": "underground"
}
```

### PUT /campaigns/{campaign_id}/maps/{map_id}/tiles

Batch update tiles.

**Request:**
```json
{
  "operations": [
    {
      "action": "SET",
      "tiles": [
        {"x": 0, "y": 0, "terrain": "stone_wall", "blocking": true}
      ]
    },
    {
      "action": "FILL_RECT",
      "from": {"x": 10, "y": 5},
      "to": {"x": 15, "y": 10},
      "terrain": "water_shallow",
      "difficult_terrain": true
    }
  ]
}
```

### PUT /campaigns/{campaign_id}/maps/{map_id}/objects

Add map objects (doors, traps, lights).

### PUT /campaigns/{campaign_id}/maps/{map_id}/spawn-points

Define spawn points.

## 7.4 Encounter Editor

### POST /campaigns/{campaign_id}/encounters

Create an encounter.

**Request:**
```json
{
  "name": "Goblin Ambush",
  "map_id": "map_triboar_trail",
  "encounter_type": "COMBAT",
  "difficulty_target": "MEDIUM",
  "monsters": [
    {
      "monster_id": "monster_goblin",
      "count": 4,
      "spawn_point_id": "spawn_ambush",
      "behavior_preset": "AMBUSH"
    }
  ],
  "triggers": [
    {
      "type": "ON_ENTER_AREA",
      "area": {"from": {"x": 20, "y": 8}, "to": {"x": 25, "y": 12}},
      "actions": [{"type": "START_COMBAT"}]
    }
  ],
  "rewards": {
    "xp": 200,
    "gold": 15
  }
}
```

### GET /campaigns/{campaign_id}/encounters/{encounter_id}/difficulty

Calculate encounter difficulty.

## 7.5 Dialogue Editor

### POST /campaigns/{campaign_id}/dialogues

Create a dialogue tree.

**Request:**
```json
{
  "name": "Sildar Introduction",
  "npc_id": "npc_sildar",
  "starting_node": "node_start",
  "nodes": [
    {
      "node_id": "node_start",
      "type": "NPC_SPEECH",
      "speaker": "Sildar Hallwinter",
      "text": "Thank the gods you've arrived!",
      "next": "node_choices"
    },
    {
      "node_id": "node_choices",
      "type": "PLAYER_CHOICE",
      "choices": [
        {"text": "What happened?", "next": "node_explain"},
        {"text": "[Insight DC 12] Are you hiding something?", "next": "node_check", "skill_check": {"skill": "INSIGHT", "dc": 12}}
      ]
    },
    {
      "node_id": "node_check",
      "type": "SKILL_CHECK",
      "skill": "INSIGHT",
      "dc": 12,
      "success_next": "node_success",
      "failure_next": "node_fail"
    }
  ]
}
```

## 7.6 Publishing

### POST /campaigns/{campaign_id}/validate

Validate campaign before publishing.

### POST /campaigns/{campaign_id}/publish

Publish the campaign.

---

# 8. Character Service API

Manages player characters.

## 8.1 Base Configuration

**Base URL:** `https://api.dndboard.game/v1/characters`

## 8.2 Character CRUD

### POST /characters

Create a new character.

**Request:**
```json
{
  "name": "Thorin Ironforge",
  "race_id": "race_mountain_dwarf",
  "class_id": "class_fighter",
  "background_id": "background_soldier",
  "ability_scores": {
    "method": "POINT_BUY",
    "values": {"STR": 15, "DEX": 12, "CON": 14, "INT": 10, "WIS": 12, "CHA": 8}
  },
  "class_choices": {"fighting_style": "defense"},
  "skill_proficiencies": ["Athletics", "Intimidation"]
}
```

**Response (201):**
```json
{
  "character_id": "char_hero001",
  "name": "Thorin Ironforge",
  "level": 1,
  "race": {"id": "race_mountain_dwarf", "name": "Mountain Dwarf"},
  "classes": [{"class_id": "class_fighter", "name": "Fighter", "level": 1}],
  "ability_scores": {
    "STR": {"base": 15, "racial": 2, "total": 17, "modifier": 3},
    "DEX": {"base": 12, "total": 12, "modifier": 1},
    "CON": {"base": 14, "racial": 2, "total": 16, "modifier": 3},
    "INT": {"base": 10, "total": 10, "modifier": 0},
    "WIS": {"base": 12, "total": 12, "modifier": 1},
    "CHA": {"base": 8, "total": 8, "modifier": -1}
  },
  "combat_stats": {
    "armor_class": 17,
    "hit_points": {"current": 13, "maximum": 13},
    "speed": 25
  },
  "proficiencies": {
    "armor": ["light", "medium", "heavy", "shields"],
    "weapons": ["simple", "martial"],
    "saving_throws": ["STR", "CON"],
    "skills": ["Athletics", "Intimidation"]
  }
}
```

### GET /characters

List user's characters.

### GET /characters/{character_id}

Get full character sheet.

### PUT /characters/{character_id}

Update character.

## 8.3 Level Up

### POST /characters/{character_id}/level-up

Level up a character.

**Request:**
```json
{
  "new_level": 2,
  "hit_point_method": "ROLL",
  "hit_point_roll": 7,
  "choices": {}
}
```

### POST /characters/{character_id}/add-xp

Add experience points.

## 8.4 Inventory

### GET /characters/{character_id}/inventory

### POST /characters/{character_id}/inventory

Add item.

### POST /characters/{character_id}/equip

Equip/unequip items.

## 8.5 Spellcasting

### GET /characters/{character_id}/spells

### PUT /characters/{character_id}/spells/prepare

Update prepared spells.

---

# 9. Media Pipeline API

Handles AI-generated and uploaded media.

## 9.1 Base Configuration

**Base URL:** `https://api.dndboard.game/v1/media`

## 9.2 Asset Generation

### POST /media/generate

Request AI-generated asset.

**Request (Portrait):**
```json
{
  "type": "CHARACTER_PORTRAIT",
  "parameters": {
    "race": "dwarf",
    "gender": "male",
    "class": "fighter",
    "expression": "determined",
    "style": "fantasy_realistic"
  },
  "dimensions": {"width": 512, "height": 512}
}
```

**Request (Location):**
```json
{
  "type": "LOCATION_ART",
  "parameters": {
    "setting": "underground_cave",
    "features": ["stalactites", "underground_river"],
    "mood": "ominous",
    "lighting": "torchlight"
  }
}
```

**Response (202):**
```json
{
  "job_id": "job_media_001",
  "status": "QUEUED",
  "estimated_completion_seconds": 45,
  "poll_url": "/media/jobs/job_media_001"
}
```

### GET /media/jobs/{job_id}

Check generation status.

**Response (Completed):**
```json
{
  "job_id": "job_media_001",
  "status": "COMPLETED",
  "result": {
    "asset_id": "asset_portrait_001",
    "urls": {
      "original": "https://cdn.dndboard.game/media/asset_portrait_001.png",
      "thumbnail": "https://cdn.dndboard.game/media/asset_portrait_001_thumb.png"
    }
  }
}
```

## 9.3 Asset Upload

### POST /media/upload

Get presigned upload URL.

### POST /media/upload/{upload_id}/complete

Confirm upload.

### GET /media/assets/{asset_id}

Get asset details.

---

# 10. AoE/LoS/Cover Solver API (gRPC)

Internal service for grid calculations.

## 10.1 Service Definition

```protobuf
syntax = "proto3";
package dnd.grid.v1;

service GridSolver {
  // Line of Sight
  rpc CheckLineOfSight(LoSRequest) returns (LoSResult);
  rpc GetVisibleTiles(VisionRequest) returns (VisibleTileSet);
  
  // Cover
  rpc CalculateCover(CoverRequest) returns (CoverResult);
  
  // Area of Effect
  rpc GetAoETiles(AoERequest) returns (AoETileSet);
  rpc GetAffectedEntities(AoEEntityRequest) returns (AffectedEntities);
  
  // Pathfinding
  rpc FindPath(PathRequest) returns (PathResult);
  rpc GetReachableTiles(ReachableRequest) returns (ReachableTileSet);
}
```

## 10.2 Key Messages

```protobuf
message LoSRequest {
  string map_id = 1;
  Position origin = 2;
  Position target = 3;
  LoSOptions options = 4;
}

message LoSResult {
  bool has_line_of_sight = 1;
  bool blocked = 2;
  Position first_blocking_tile = 3;
  LightLevel light_at_target = 4;
  float distance_feet = 5;
}

message CoverRequest {
  string map_id = 1;
  Position attacker = 2;
  Position target = 3;
}

message CoverResult {
  CoverLevel cover = 1;  // NONE, HALF, THREE_QUARTERS, TOTAL
  int32 ac_bonus = 2;
  int32 dex_save_bonus = 3;
}

message AoERequest {
  string map_id = 1;
  AoEShape shape = 2;
  Position origin = 3;
  Direction direction = 4;
}

message AoEShape {
  ShapeType type = 1;  // SPHERE, CUBE, CONE, LINE, CYLINDER
  int32 size_feet = 2;
}

message AoETileSet {
  repeated Position tiles = 1;
  int32 total_area_sqft = 2;
}

message PathRequest {
  string map_id = 1;
  Position start = 2;
  Position goal = 3;
  PathfindingOptions options = 4;
}

message PathfindingOptions {
  int32 movement_available = 1;
  CreatureSize creature_size = 2;
  bool avoid_opportunity_attacks = 3;
  bool ignore_difficult_terrain = 4;
}

message PathResult {
  bool path_found = 1;
  repeated Position path = 2;
  int32 total_movement_cost = 3;
  repeated PathSegment segments = 4;
}

message ReachableTileSet {
  repeated ReachableTile tiles = 1;
}

message ReachableTile {
  Position position = 1;
  int32 movement_cost = 2;
  bool requires_dash = 3;
  bool enters_threatened_area = 4;
}
```

---

# 11. AI Behaviours & Scripting API (gRPC)

Manages monster AI and encounter triggers.

## 11.1 Service Definition

```protobuf
syntax = "proto3";
package dnd.ai.v1;

service AIBehavior {
  // Decision Making
  rpc GetNextAction(AIDecisionRequest) returns (AIAction);
  rpc EvaluateTargets(TargetEvaluationRequest) returns (TargetRanking);
  
  // Triggers
  rpc EvaluateTriggers(TriggerEvalRequest) returns (TriggeredEvents);
  rpc RegisterTrigger(TriggerRegistration) returns (TriggerResponse);
  
  // Boss Mechanics
  rpc CheckPhaseTransition(PhaseCheckRequest) returns (PhaseTransition);
  rpc GetLegendaryAction(LegendaryRequest) returns (LegendaryAction);
  rpc GetLairAction(LairRequest) returns (LairAction);
  
  // Group Tactics
  rpc CoordinateGroup(GroupTacticsRequest) returns (GroupActions);
}
```

## 11.2 Key Messages

```protobuf
message AIDecisionRequest {
  string session_id = 1;
  string entity_id = 2;
  GameStateSnapshot state = 3;
  BehaviorProfile behavior = 4;
  TurnResources available_resources = 5;
}

message BehaviorProfile {
  BehaviorType primary_type = 1;  // AGGRESSIVE, DEFENSIVE, TACTICAL, SKIRMISHER, etc.
  float aggression = 2;
  float self_preservation = 3;
  float tactical_intelligence = 4;
  repeated TargetPriority target_priorities = 5;
}

message AIAction {
  ActionType type = 1;  // MOVE, ATTACK, CAST_SPELL, USE_ABILITY, etc.
  string ability_id = 2;
  string target_id = 3;
  Position target_position = 4;
  repeated Position movement_path = 5;
  string reasoning = 6;
  float confidence = 7;
}

message TriggerRegistration {
  string trigger_id = 1;
  string session_id = 2;
  TriggerType type = 3;  // ON_ENTER_AREA, ON_HP_THRESHOLD, ON_TURN_START, etc.
  TriggerCondition condition = 4;
  repeated TriggerAction actions = 5;
  bool one_shot = 6;
}

enum TriggerActionType {
  SPAWN_ENTITIES = 0;
  START_DIALOGUE = 1;
  PLAY_CUTSCENE = 2;
  APPLY_DAMAGE = 3;
  START_COMBAT = 4;
  SET_FLAG = 5;
  PLAY_SOUND = 6;
  PHASE_TRANSITION = 7;
}

message PhaseCheckRequest {
  string session_id = 1;
  string boss_entity_id = 2;
  BossPhaseConfig config = 3;
}

message BossPhaseConfig {
  repeated BossPhase phases = 1;
}

message BossPhase {
  int32 phase_number = 1;
  string name = 2;
  PhaseTransitionCondition entry_condition = 3;
  repeated string abilities_gained = 4;
  repeated string abilities_lost = 5;
  BehaviorProfile behavior_override = 6;
}

message PhaseTransition {
  bool transition_occurred = 1;
  int32 previous_phase = 2;
  int32 new_phase = 3;
  string cutscene_id = 4;
  string announcement_text = 5;
}
```

---

# 12. Analytics & Events API

Tracks gameplay events.

## 12.1 Base Configuration

**Base URL:** `https://api.dndboard.game/v1/analytics`

## 12.2 Event Tracking

### POST /track

Submit gameplay events (batched).

**Request:**
```json
{
  "batch_id": "batch_001",
  "events": [
    {
      "event_id": "evt_001",
      "event_type": "combat.attack",
      "timestamp": "2024-03-20T18:30:15.123Z",
      "session_id": "sess_a1b2c3",
      "properties": {
        "attacker_class": "fighter",
        "target_type": "goblin",
        "hit": true,
        "critical": false,
        "damage_dealt": 12
      }
    }
  ]
}
```

## 12.3 Event Types

- `combat.started`, `combat.ended`
- `combat.attack`, `combat.spell_cast`
- `combat.damage_dealt`, `combat.healing`
- `combat.death`, `combat.death_save`
- `session.created`, `session.joined`, `session.ended`
- `character.created`, `character.leveled_up`
- `campaign.chapter_completed`, `campaign.quest_completed`

## 12.4 Analytics Queries

### GET /analytics/sessions/{session_id}/summary

### GET /analytics/campaigns/{campaign_id}/funnel

### GET /analytics/encounters/{encounter_id}/balance

---

# 13. Common Data Types

## 13.1 Position
```json
{"x": 10, "y": 15, "z": 0}
```

## 13.2 Dice Expression
```json
{"expression": "2d6+5", "dice": [{"count": 2, "sides": 6}], "modifier": 5}
```

## 13.3 Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid spell target",
    "details": {"field": "target_id", "reason": "Target out of range"},
    "request_id": "req_abc123"
  }
}
```

## 13.4 Pagination
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

# 14. Rate Limiting

Headers returned:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1710936060
```

| Endpoint Category | Free Tier | Pro Tier |
|-------------------|-----------|----------|
| Authentication | 20/min | 50/min |
| Game Commands | 60/min | 120/min |
| Content Reads | 100/min | 500/min |
| Media Generation | 10/hour | 100/hour |

---

# END OF API SPECIFICATIONS
