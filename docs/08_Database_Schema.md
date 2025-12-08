# D&D Digital Board Game Platform
# Document 8: Complete Database Schema

---

# 1. Overview

This document contains all PostgreSQL schemas, indexes, constraints, and migration strategies for the platform.

**Database:** PostgreSQL 16
**ORM:** Prisma or Drizzle (TypeScript) / SQLx (Rust)

---

# 2. Schema Organization

```
databases/
├── main/           # Core application data
│   ├── users
│   ├── characters
│   ├── sessions
│   └── campaigns
├── content/        # Static 5e content (read-heavy)
│   ├── spells
│   ├── monsters
│   ├── items
│   └── conditions
└── analytics/      # Event tracking (append-only)
    └── events
```

---

# 3. Main Database Schema

## 3.1 Users & Authentication

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    
    -- Account status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'deleted')),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'premium', 'creator', 'moderator', 'admin')),
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status) WHERE status != 'deleted';

-- User sessions (for JWT refresh tokens)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_id VARCHAR(100),
    platform VARCHAR(20) CHECK (platform IN ('web', 'ios', 'android', 'desktop')),
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at) WHERE revoked_at IS NULL;

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens(token_hash) WHERE used_at IS NULL;
```

## 3.2 Characters

```sql
-- Character table
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(100) NOT NULL,
    race VARCHAR(50) NOT NULL,
    subrace VARCHAR(50),
    class VARCHAR(50) NOT NULL,
    subclass VARCHAR(50),
    background VARCHAR(50) NOT NULL,
    alignment VARCHAR(30),
    
    -- Level & XP
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 20),
    experience_points INTEGER NOT NULL DEFAULT 0,
    
    -- Ability scores (base, before racial bonuses)
    strength INTEGER NOT NULL CHECK (strength >= 1 AND strength <= 30),
    dexterity INTEGER NOT NULL CHECK (dexterity >= 1 AND dexterity <= 30),
    constitution INTEGER NOT NULL CHECK (constitution >= 1 AND constitution <= 30),
    intelligence INTEGER NOT NULL CHECK (intelligence >= 1 AND intelligence <= 30),
    wisdom INTEGER NOT NULL CHECK (wisdom >= 1 AND wisdom <= 30),
    charisma INTEGER NOT NULL CHECK (charisma >= 1 AND charisma <= 30),
    
    -- Hit points
    max_hit_points INTEGER NOT NULL,
    current_hit_points INTEGER NOT NULL,
    temp_hit_points INTEGER DEFAULT 0,
    hit_dice_remaining INTEGER NOT NULL,
    
    -- Proficiencies (stored as arrays)
    skill_proficiencies TEXT[] DEFAULT '{}',
    skill_expertise TEXT[] DEFAULT '{}',
    saving_throw_proficiencies TEXT[] DEFAULT '{}',
    armor_proficiencies TEXT[] DEFAULT '{}',
    weapon_proficiencies TEXT[] DEFAULT '{}',
    tool_proficiencies TEXT[] DEFAULT '{}',
    language_proficiencies TEXT[] DEFAULT '{}',
    
    -- Spellcasting (JSONB for flexibility)
    spellcasting JSONB DEFAULT NULL,
    -- Example: {"class": "wizard", "ability": "intelligence", "slots": {"1": 4, "2": 3}, "prepared": ["fireball", "shield"]}
    
    -- Features & traits
    features JSONB DEFAULT '[]',
    -- Example: [{"source": "race", "name": "Darkvision", "description": "..."}]
    
    -- Personality
    personality_traits TEXT,
    ideals TEXT,
    bonds TEXT,
    flaws TEXT,
    backstory TEXT,
    
    -- Appearance
    appearance JSONB DEFAULT '{}',
    -- Example: {"age": 25, "height": "5'10\"", "weight": "170 lbs", "eyes": "blue", "hair": "brown", "skin": "fair"}
    
    portrait_url TEXT,
    token_url TEXT,
    
    -- Death saves (for active combat)
    death_save_successes INTEGER DEFAULT 0,
    death_save_failures INTEGER DEFAULT 0,
    
    -- Currency
    copper INTEGER DEFAULT 0,
    silver INTEGER DEFAULT 0,
    electrum INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 0,
    platinum INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_characters_user ON characters(user_id);
CREATE INDEX idx_characters_class ON characters(class);
CREATE INDEX idx_characters_level ON characters(level);
CREATE INDEX idx_characters_active ON characters(user_id, is_active) WHERE is_active = TRUE;

-- Character inventory
CREATE TABLE character_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    
    item_id VARCHAR(100) NOT NULL,  -- References content.items
    quantity INTEGER NOT NULL DEFAULT 1,
    
    -- Equipment status
    is_equipped BOOLEAN DEFAULT FALSE,
    equipped_slot VARCHAR(30),  -- 'main_hand', 'off_hand', 'armor', 'head', 'neck', etc.
    is_attuned BOOLEAN DEFAULT FALSE,
    
    -- Custom properties (for magic items)
    custom_name VARCHAR(100),
    custom_properties JSONB DEFAULT '{}',
    charges_remaining INTEGER,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_character ON character_inventory(character_id);
CREATE INDEX idx_inventory_equipped ON character_inventory(character_id, is_equipped) WHERE is_equipped = TRUE;

-- Character level history (for multiclassing)
CREATE TABLE character_class_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    class VARCHAR(50) NOT NULL,
    subclass VARCHAR(50),
    level INTEGER NOT NULL,
    level_order INTEGER NOT NULL,  -- Order in which levels were taken
    
    -- Choices made at this level
    choices JSONB DEFAULT '{}',
    -- Example: {"hit_points": "rolled", "hit_points_value": 7, "asi_choice": "feat", "feat": "sentinel"}
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_class_levels_character ON character_class_levels(character_id);
```

## 3.3 Campaigns & Maps

```sql
-- Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    
    -- Basic info
    name VARCHAR(200) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    
    -- Settings
    min_level INTEGER DEFAULT 1,
    max_level INTEGER DEFAULT 20,
    themes TEXT[] DEFAULT '{}',  -- ['dungeon', 'wilderness', 'urban', 'planar']
    
    -- Publishing
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unlisted', 'archived')),
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public')),
    version VARCHAR(20) DEFAULT '1.0.0',
    
    -- Stats
    play_count INTEGER DEFAULT 0,
    rating_sum INTEGER DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX idx_campaigns_creator ON campaigns(creator_id);
CREATE INDEX idx_campaigns_status ON campaigns(status, visibility);
CREATE INDEX idx_campaigns_published ON campaigns(published_at DESC) WHERE status = 'published';

-- Campaign chapters
CREATE TABLE campaign_chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    
    -- Prerequisites
    prerequisites JSONB DEFAULT '[]',  -- [{type: "chapter_complete", chapter_id: "..."}, {type: "flag", flag: "..."}]
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chapters_campaign ON campaign_chapters(campaign_id, order_index);

-- Maps
CREATE TABLE maps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES campaign_chapters(id) ON DELETE SET NULL,
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Grid settings
    grid_width INTEGER NOT NULL CHECK (grid_width > 0 AND grid_width <= 200),
    grid_height INTEGER NOT NULL CHECK (grid_height > 0 AND grid_height <= 200),
    grid_size INTEGER DEFAULT 5,  -- Feet per tile
    
    -- Tile data (compressed)
    tiles BYTEA NOT NULL,  -- Compressed JSON of tile data
    tile_compression VARCHAR(20) DEFAULT 'gzip',
    
    -- Layers
    background_url TEXT,
    foreground_url TEXT,
    
    -- Lighting defaults
    global_illumination VARCHAR(20) DEFAULT 'bright' CHECK (global_illumination IN ('bright', 'dim', 'dark')),
    
    -- Music/ambience
    ambient_track_id VARCHAR(100),
    combat_track_id VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maps_campaign ON maps(campaign_id);

-- Map objects (doors, traps, lights, etc.)
CREATE TABLE map_objects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    
    object_type VARCHAR(30) NOT NULL CHECK (object_type IN (
        'door', 'secret_door', 'trap', 'light', 'interactable', 
        'spawn_point', 'transition', 'trigger_area'
    )),
    
    -- Position
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    
    -- Properties
    properties JSONB NOT NULL DEFAULT '{}',
    -- Door: {locked: true, dc: 15, key_item: "iron_key"}
    -- Trap: {type: "pit", dc_detect: 14, dc_disarm: 12, damage: "2d6", damage_type: "piercing"}
    -- Light: {radius: 30, dim_radius: 60, color: "#ffaa00"}
    -- Spawn: {spawn_type: "player", index: 1} or {spawn_type: "monster", encounter_id: "..."}
    -- Transition: {target_map_id: "...", target_x: 5, target_y: 10}
    
    is_hidden BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_map_objects_map ON map_objects(map_id);
CREATE INDEX idx_map_objects_position ON map_objects(map_id, x, y);

-- Encounters
CREATE TABLE encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    map_id UUID REFERENCES maps(id) ON DELETE SET NULL,
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Difficulty
    target_party_size INTEGER DEFAULT 4,
    target_party_level INTEGER DEFAULT 1,
    calculated_difficulty VARCHAR(20),  -- 'easy', 'medium', 'hard', 'deadly'
    
    -- Monsters
    monsters JSONB NOT NULL DEFAULT '[]',
    -- [{monster_id: "goblin", count: 4, position: {x: 5, y: 5}}, ...]
    
    -- Triggers
    triggers JSONB DEFAULT '[]',
    
    -- Objectives
    objectives JSONB DEFAULT '[]',
    -- [{type: "defeat_all"}, {type: "survive_rounds", rounds: 5}]
    
    -- Rewards
    rewards JSONB DEFAULT '{}',
    -- {xp: 500, gold: 100, items: ["potion_healing"]}
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_encounters_campaign ON encounters(campaign_id);
CREATE INDEX idx_encounters_map ON encounters(map_id);

-- Dialogues
CREATE TABLE dialogues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    name VARCHAR(200) NOT NULL,
    npc_name VARCHAR(100),
    npc_portrait_url TEXT,
    
    -- Dialogue tree (JSONB graph structure)
    nodes JSONB NOT NULL DEFAULT '[]',
    -- [{
    --   id: "node_1",
    --   type: "npc_speech" | "player_choice" | "skill_check" | "set_flag" | "give_item",
    --   text: "...",
    --   speaker: "npc" | "player",
    --   choices: [{text: "...", next: "node_2", conditions: []}],
    --   skill_check: {skill: "persuasion", dc: 15, success: "node_3", failure: "node_4"},
    --   effects: [{type: "set_flag", flag: "met_blacksmith"}, {type: "give_item", item: "iron_key"}]
    -- }]
    
    start_node_id VARCHAR(100) DEFAULT 'start',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dialogues_campaign ON dialogues(campaign_id);
```

## 3.4 Game Sessions

```sql
-- Game sessions
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Campaign reference
    campaign_id UUID REFERENCES campaigns(id),
    current_map_id UUID REFERENCES maps(id),
    current_encounter_id UUID REFERENCES encounters(id),
    
    -- Session info
    name VARCHAR(200),
    dm_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'lobby' CHECK (status IN (
        'lobby', 'active', 'paused', 'combat', 'completed', 'abandoned'
    )),
    
    -- Settings
    settings JSONB DEFAULT '{}',
    -- {
    --   max_players: 5,
    --   visibility: "private",
    --   password_hash: "...",
    --   turn_timer_seconds: 120,
    --   allow_spectators: true,
    --   fog_of_war_enabled: true
    -- }
    
    -- Combat state (when in combat)
    combat_state JSONB DEFAULT NULL,
    -- {
    --   round: 1,
    --   turn_index: 0,
    --   initiative_order: [{entity_id: "...", initiative: 18}, ...],
    --   turn_started_at: "2024-01-15T10:30:00Z"
    -- }
    
    -- Campaign progress
    flags JSONB DEFAULT '{}',
    story_progress JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_dm ON game_sessions(dm_user_id);
CREATE INDEX idx_sessions_status ON game_sessions(status);
CREATE INDEX idx_sessions_active ON game_sessions(status, last_activity_at) 
    WHERE status IN ('lobby', 'active', 'paused', 'combat');

-- Session players
CREATE TABLE session_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    character_id UUID REFERENCES characters(id),
    
    -- Role
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'dm', 'spectator')),
    
    -- Status
    status VARCHAR(20) DEFAULT 'not_ready' CHECK (status IN (
        'not_ready', 'selecting_character', 'ready', 'connected', 'disconnected'
    )),
    
    -- Connection
    connection_id VARCHAR(100),
    connected_at TIMESTAMPTZ,
    disconnected_at TIMESTAMPTZ,
    
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(session_id, user_id)
);

CREATE INDEX idx_session_players_session ON session_players(session_id);
CREATE INDEX idx_session_players_user ON session_players(user_id);

-- Session entities (runtime state of characters/monsters)
CREATE TABLE session_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    
    -- Source
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('pc', 'npc', 'monster', 'object')),
    source_character_id UUID REFERENCES characters(id),
    source_monster_id VARCHAR(100),
    
    -- Controller
    controller_user_id UUID REFERENCES users(id),
    
    -- Display
    name VARCHAR(100) NOT NULL,
    token_url TEXT,
    
    -- Position
    map_id UUID REFERENCES maps(id),
    x INTEGER,
    y INTEGER,
    
    -- Combat stats (current state)
    current_hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    temp_hp INTEGER DEFAULT 0,
    armor_class INTEGER NOT NULL,
    
    -- Speed
    speed_walk INTEGER DEFAULT 30,
    speed_fly INTEGER DEFAULT 0,
    speed_swim INTEGER DEFAULT 0,
    speed_climb INTEGER DEFAULT 0,
    speed_burrow INTEGER DEFAULT 0,
    
    -- Conditions
    conditions JSONB DEFAULT '[]',
    -- [{condition: "prone", source: "trip_attack", expires_at: "end_of_turn:entity_123"}]
    
    -- Active effects
    effects JSONB DEFAULT '[]',
    -- [{name: "Bless", source: "spell", expires: "concentration:entity_456", bonus: "1d4"}]
    
    -- Resources (for PCs)
    resources JSONB DEFAULT '{}',
    -- {spell_slots: {1: 2, 2: 1}, class_resources: {action_surge: 1, second_wind: 0}}
    
    -- Combat
    initiative INTEGER,
    has_action BOOLEAN DEFAULT TRUE,
    has_bonus_action BOOLEAN DEFAULT TRUE,
    has_reaction BOOLEAN DEFAULT TRUE,
    movement_remaining INTEGER DEFAULT 30,
    
    -- Death saves
    death_save_successes INTEGER DEFAULT 0,
    death_save_failures INTEGER DEFAULT 0,
    is_dead BOOLEAN DEFAULT FALSE,
    is_unconscious BOOLEAN DEFAULT FALSE,
    
    -- Concentration
    concentrating_on VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entities_session ON session_entities(session_id);
CREATE INDEX idx_entities_map ON session_entities(map_id, x, y);
CREATE INDEX idx_entities_controller ON session_entities(controller_user_id);

-- Session chat
CREATE TABLE session_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    channel VARCHAR(20) DEFAULT 'party' CHECK (channel IN ('party', 'dm', 'whisper', 'system')),
    whisper_to_user_id UUID REFERENCES users(id),
    
    message TEXT NOT NULL,
    
    -- For dice rolls
    roll_data JSONB,
    -- {expression: "1d20+5", rolls: [{die: 20, result: 15}], total: 20, purpose: "attack"}
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_session ON session_chat(session_id, created_at);

-- Session state snapshots (for recovery)
CREATE TABLE session_snapshots (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    
    sequence_number BIGINT NOT NULL,
    
    -- Full state snapshot
    state JSONB NOT NULL,
    
    -- Delta from previous (for compression)
    is_full_snapshot BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_session_seq ON session_snapshots(session_id, sequence_number DESC);
```

---

# 4. Content Database Schema

```sql
-- Spells
CREATE TABLE spells (
    id VARCHAR(100) PRIMARY KEY,
    
    -- Basic info
    name VARCHAR(100) NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 0 AND level <= 9),
    school VARCHAR(30) NOT NULL CHECK (school IN (
        'abjuration', 'conjuration', 'divination', 'enchantment',
        'evocation', 'illusion', 'necromancy', 'transmutation'
    )),
    
    -- Casting
    casting_time VARCHAR(100) NOT NULL,
    ritual BOOLEAN DEFAULT FALSE,
    concentration BOOLEAN DEFAULT FALSE,
    
    -- Range
    range_type VARCHAR(20) NOT NULL CHECK (range_type IN ('self', 'touch', 'ranged', 'sight', 'unlimited')),
    range_distance INTEGER,  -- In feet, null for self/touch
    
    -- Components
    components_verbal BOOLEAN DEFAULT FALSE,
    components_somatic BOOLEAN DEFAULT FALSE,
    components_material BOOLEAN DEFAULT FALSE,
    components_material_text TEXT,
    components_material_cost INTEGER,  -- In copper
    components_consumed BOOLEAN DEFAULT FALSE,
    
    -- Duration
    duration VARCHAR(100) NOT NULL,
    duration_seconds INTEGER,  -- Null for instantaneous
    
    -- Description
    description TEXT NOT NULL,
    at_higher_levels TEXT,
    
    -- Classes
    classes TEXT[] NOT NULL,
    
    -- Source
    source VARCHAR(50) NOT NULL,
    page INTEGER,
    
    -- Mechanics (for rules engine)
    mechanics JSONB NOT NULL,
    -- {
    --   targeting: {type: "single", range: 60, requires_sight: true},
    --   aoe: {shape: "sphere", radius: 20, origin: "point"},
    --   attack: {type: "ranged_spell"},
    --   save: {ability: "dexterity", effect_on_save: "half"},
    --   damage: {dice: "8d6", type: "fire", scales: true, scale_dice: "1d6"},
    --   effects: [{type: "apply_condition", condition: "prone"}]
    -- }
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spells_level ON spells(level);
CREATE INDEX idx_spells_school ON spells(school);
CREATE INDEX idx_spells_classes ON spells USING GIN(classes);

-- Monsters
CREATE TABLE monsters (
    id VARCHAR(100) PRIMARY KEY,
    
    -- Basic info
    name VARCHAR(100) NOT NULL,
    size VARCHAR(20) NOT NULL CHECK (size IN ('tiny', 'small', 'medium', 'large', 'huge', 'gargantuan')),
    type VARCHAR(50) NOT NULL,
    subtype VARCHAR(50),
    alignment VARCHAR(50),
    
    -- Combat
    armor_class INTEGER NOT NULL,
    armor_type VARCHAR(100),
    hit_points_average INTEGER NOT NULL,
    hit_points_formula VARCHAR(50) NOT NULL,  -- "7d8+14"
    
    -- Speed
    speed JSONB NOT NULL,  -- {walk: 30, fly: 60, swim: 30}
    
    -- Abilities
    strength INTEGER NOT NULL,
    dexterity INTEGER NOT NULL,
    constitution INTEGER NOT NULL,
    intelligence INTEGER NOT NULL,
    wisdom INTEGER NOT NULL,
    charisma INTEGER NOT NULL,
    
    -- Proficiencies
    saving_throws JSONB DEFAULT '{}',  -- {dexterity: 5, wisdom: 3}
    skills JSONB DEFAULT '{}',  -- {perception: 5, stealth: 4}
    
    -- Resistances/Immunities
    damage_vulnerabilities TEXT[] DEFAULT '{}',
    damage_resistances TEXT[] DEFAULT '{}',
    damage_immunities TEXT[] DEFAULT '{}',
    condition_immunities TEXT[] DEFAULT '{}',
    
    -- Senses
    senses JSONB NOT NULL,  -- {darkvision: 60, passive_perception: 12}
    
    -- Languages
    languages TEXT[] DEFAULT '{}',
    
    -- Challenge
    challenge_rating DECIMAL(4,2) NOT NULL,
    experience_points INTEGER NOT NULL,
    
    -- Traits
    traits JSONB DEFAULT '[]',
    -- [{name: "Pack Tactics", description: "..."}]
    
    -- Actions
    actions JSONB NOT NULL DEFAULT '[]',
    -- [{
    --   name: "Bite",
    --   type: "melee_attack",
    --   attack_bonus: 4,
    --   reach: 5,
    --   targets: 1,
    --   damage: [{dice: "1d6+2", type: "piercing"}],
    --   description: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6+2) piercing damage."
    -- }]
    
    -- Bonus actions
    bonus_actions JSONB DEFAULT '[]',
    
    -- Reactions
    reactions JSONB DEFAULT '[]',
    
    -- Legendary
    legendary_actions JSONB DEFAULT NULL,
    legendary_action_count INTEGER DEFAULT 0,
    
    -- Lair
    lair_actions JSONB DEFAULT NULL,
    regional_effects JSONB DEFAULT NULL,
    
    -- Source
    source VARCHAR(50) NOT NULL,
    page INTEGER,
    
    -- AI behavior hints
    behavior_tags TEXT[] DEFAULT '{}',  -- ['aggressive', 'ranged', 'spellcaster']
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_monsters_cr ON monsters(challenge_rating);
CREATE INDEX idx_monsters_type ON monsters(type);
CREATE INDEX idx_monsters_size ON monsters(size);

-- Items
CREATE TABLE items (
    id VARCHAR(100) PRIMARY KEY,
    
    -- Basic info
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'weapon', 'armor', 'shield', 'ammunition', 'potion',
        'scroll', 'wand', 'rod', 'staff', 'ring', 'wondrous',
        'adventuring_gear', 'tool', 'mount', 'vehicle'
    )),
    subtype VARCHAR(50),
    
    -- Rarity (for magic items)
    rarity VARCHAR(20) CHECK (rarity IN (
        'common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact'
    )),
    requires_attunement BOOLEAN DEFAULT FALSE,
    attunement_requirements TEXT,
    
    -- Physical
    weight DECIMAL(8,2),  -- In pounds
    
    -- Cost
    cost_cp INTEGER,  -- In copper pieces
    
    -- Description
    description TEXT NOT NULL,
    
    -- Weapon properties
    weapon_category VARCHAR(20),  -- 'simple' or 'martial'
    weapon_range_type VARCHAR(20),  -- 'melee' or 'ranged'
    damage_dice VARCHAR(20),
    damage_type VARCHAR(30),
    properties TEXT[] DEFAULT '{}',  -- ['finesse', 'light', 'thrown', 'two-handed']
    range_normal INTEGER,
    range_long INTEGER,
    
    -- Armor properties
    armor_category VARCHAR(20),  -- 'light', 'medium', 'heavy', 'shield'
    armor_class INTEGER,
    armor_class_dex_bonus BOOLEAN DEFAULT TRUE,
    armor_class_max_dex INTEGER,
    strength_requirement INTEGER,
    stealth_disadvantage BOOLEAN DEFAULT FALSE,
    
    -- Magic item properties
    magic_bonus INTEGER,
    charges_max INTEGER,
    charges_recharge VARCHAR(100),  -- "1d6+1 at dawn"
    
    -- Effects
    effects JSONB DEFAULT '[]',
    
    -- Source
    source VARCHAR(50) NOT NULL,
    page INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_rarity ON items(rarity);

-- Conditions
CREATE TABLE conditions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    
    -- Mechanical effects
    effects JSONB NOT NULL,
    -- {
    --   advantage: {attack_rolls: false},
    --   disadvantage: {attack_rolls: true, ability_checks: ["strength", "dexterity"]},
    --   grants_advantage_to_attackers: true,
    --   speed_multiplier: 0,
    --   incapacitated: true,
    --   auto_fail_saves: ["strength", "dexterity"],
    --   ends_on: ["take_damage", "ally_action"]
    -- }
    
    source VARCHAR(50) DEFAULT 'PHB'
);

-- Races
CREATE TABLE races (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_race_id VARCHAR(100) REFERENCES races(id),  -- For subraces
    
    -- Ability score increases
    ability_score_increases JSONB NOT NULL,
    -- {strength: 2, constitution: 1} or {choice: {count: 2, amount: 1}}
    
    -- Age
    age_adult INTEGER,
    age_max INTEGER,
    
    -- Size
    size VARCHAR(20) NOT NULL,
    
    -- Speed
    speed JSONB NOT NULL,  -- {walk: 30}
    
    -- Traits
    traits JSONB NOT NULL DEFAULT '[]',
    -- [{name: "Darkvision", description: "..."}]
    
    -- Languages
    languages TEXT[] DEFAULT '{}',
    language_choices INTEGER DEFAULT 0,
    
    -- Proficiencies
    proficiencies JSONB DEFAULT '{}',
    -- {weapons: ["longsword"], skills: {choose: 2, from: ["perception", "stealth"]}}
    
    -- Spellcasting
    spellcasting JSONB,
    
    description TEXT,
    source VARCHAR(50) NOT NULL
);

-- Classes
CREATE TABLE classes (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    
    -- Hit dice
    hit_die INTEGER NOT NULL,
    
    -- Proficiencies
    armor_proficiencies TEXT[] DEFAULT '{}',
    weapon_proficiencies TEXT[] DEFAULT '{}',
    tool_proficiencies JSONB DEFAULT '{}',
    saving_throw_proficiencies TEXT[] NOT NULL,
    
    -- Skills
    skill_choices JSONB NOT NULL,
    -- {choose: 2, from: ["athletics", "acrobatics", ...]}
    
    -- Starting equipment
    starting_equipment JSONB NOT NULL,
    
    -- Features by level
    features JSONB NOT NULL,
    -- {1: [{name: "Rage", description: "..."}], 2: [...]}
    
    -- Spellcasting
    spellcasting JSONB,
    -- {ability: "wisdom", prepare_style: "prepared", ...}
    
    -- Subclass
    subclass_level INTEGER,
    subclass_name VARCHAR(50),  -- "Martial Archetype", "Arcane Tradition"
    
    description TEXT,
    source VARCHAR(50) NOT NULL
);

-- Backgrounds
CREATE TABLE backgrounds (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    
    -- Proficiencies
    skill_proficiencies TEXT[] NOT NULL,
    tool_proficiencies TEXT[] DEFAULT '{}',
    language_choices INTEGER DEFAULT 0,
    
    -- Equipment
    starting_equipment JSONB NOT NULL,
    starting_gold INTEGER,
    
    -- Feature
    feature_name VARCHAR(100) NOT NULL,
    feature_description TEXT NOT NULL,
    
    -- Personality
    personality_traits JSONB DEFAULT '[]',
    ideals JSONB DEFAULT '[]',
    bonds JSONB DEFAULT '[]',
    flaws JSONB DEFAULT '[]',
    
    description TEXT,
    source VARCHAR(50) NOT NULL
);
```

---

# 5. Analytics Schema

```sql
-- Events table (append-only, partitioned)
CREATE TABLE events (
    id BIGSERIAL,
    
    -- Event identification
    event_type VARCHAR(100) NOT NULL,
    event_version VARCHAR(10) DEFAULT '1.0',
    
    -- Context
    user_id UUID,
    session_id UUID,
    character_id UUID,
    campaign_id UUID,
    
    -- Event data
    properties JSONB NOT NULL DEFAULT '{}',
    
    -- Metadata
    client_timestamp TIMESTAMPTZ,
    server_timestamp TIMESTAMPTZ DEFAULT NOW(),
    client_version VARCHAR(20),
    platform VARCHAR(20),
    
    PRIMARY KEY (id, server_timestamp)
) PARTITION BY RANGE (server_timestamp);

-- Create monthly partitions
CREATE TABLE events_2024_01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE events_2024_02 PARTITION OF events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... create partitions as needed

CREATE INDEX idx_events_user ON events(user_id, server_timestamp);
CREATE INDEX idx_events_session ON events(session_id, server_timestamp);
CREATE INDEX idx_events_type ON events(event_type, server_timestamp);
```

---

# 6. Indexes Summary

| Table | Index | Purpose |
|-------|-------|---------|
| users | email | Login lookup |
| users | username | Profile lookup |
| characters | user_id | List user's characters |
| game_sessions | status | Find active sessions |
| session_entities | session_id | Load all entities |
| spells | classes (GIN) | Filter by class |
| monsters | challenge_rating | CR filtering |

---

# 7. Migration Strategy

```sql
-- migrations/001_initial_schema.sql
-- Run all CREATE TABLE statements

-- migrations/002_seed_content.sql
-- INSERT INTO spells ... (from JSON import)
-- INSERT INTO monsters ... (from JSON import)
-- INSERT INTO items ... (from JSON import)

-- migrations/003_add_indexes.sql
-- CREATE INDEX statements
```

---

# END OF DATABASE SCHEMA
