# D&D Digital Board Game Platform
# Document 17: Protocol Buffer Definitions

---

# 1. Overview

This document contains all `.proto` file contents. Claude Code should create these files in the `proto/` directory.

**Directory Structure:**
```
proto/
├── buf.yaml
├── buf.gen.yaml
├── rules/
│   └── v1/
│       ├── rules_service.proto
│       ├── dice.proto
│       ├── combat.proto
│       ├── spells.proto
│       └── conditions.proto
├── grid/
│   └── v1/
│       ├── grid_service.proto
│       ├── los.proto
│       ├── pathfinding.proto
│       └── aoe.proto
└── game/
    └── v1/
        ├── game_service.proto
        ├── session.proto
        └── events.proto
```

---

# 2. Buf Configuration

## 2.1 buf.yaml

```yaml
# proto/buf.yaml
version: v1
name: buf.build/dnd-platform/protos
deps: []
breaking:
  use:
    - FILE
lint:
  use:
    - DEFAULT
  except:
    - PACKAGE_VERSION_SUFFIX
```

## 2.2 buf.gen.yaml

```yaml
# proto/buf.gen.yaml
version: v1
managed:
  enabled: true
  go_package_prefix:
    default: github.com/dnd-platform/gen/go
plugins:
  # TypeScript generation (for Node.js services)
  - plugin: buf.build/community/timostamm-protobuf-ts
    out: ../packages/shared/src/generated
    opt:
      - long_type_string
      - optimize_code_size
      - generate_dependencies

  # Rust generation
  - plugin: buf.build/community/neoeinstein-prost
    out: ../services/shared-rust/src/generated
    opt:
      - compile_well_known_types

  # Rust tonic (gRPC)
  - plugin: buf.build/community/neoeinstein-tonic
    out: ../services/shared-rust/src/generated
    opt:
      - compile_well_known_types
```

---

# 3. Rules Service Protos

## 3.1 proto/rules/v1/rules_service.proto

```protobuf
syntax = "proto3";

package rules.v1;

option java_multiple_files = true;
option java_package = "com.dnd.rules.v1";

import "rules/v1/dice.proto";
import "rules/v1/combat.proto";
import "rules/v1/spells.proto";
import "rules/v1/conditions.proto";

// Main Rules Engine service
service RulesService {
  // Dice Operations
  rpc RollDice(RollDiceRequest) returns (RollDiceResponse);
  rpc RollWithAdvantage(RollAdvantageRequest) returns (RollDiceResponse);
  
  // Ability Checks
  rpc ResolveAbilityCheck(AbilityCheckRequest) returns (AbilityCheckResponse);
  rpc ResolveSkillCheck(SkillCheckRequest) returns (SkillCheckResponse);
  rpc ResolveSavingThrow(SavingThrowRequest) returns (SavingThrowResponse);
  
  // Combat
  rpc ResolveAttack(AttackRequest) returns (AttackResponse);
  rpc CalculateDamage(DamageRequest) returns (DamageResponse);
  rpc ApplyDamage(ApplyDamageRequest) returns (ApplyDamageResponse);
  
  // Spellcasting
  rpc ValidateSpellCast(ValidateSpellRequest) returns (ValidateSpellResponse);
  rpc ResolveSpell(ResolveSpellRequest) returns (ResolveSpellResponse);
  rpc CheckConcentration(ConcentrationCheckRequest) returns (ConcentrationCheckResponse);
  
  // Conditions
  rpc ApplyCondition(ApplyConditionRequest) returns (ApplyConditionResponse);
  rpc RemoveCondition(RemoveConditionRequest) returns (RemoveConditionResponse);
  rpc GetActiveConditions(GetConditionsRequest) returns (GetConditionsResponse);
  
  // Turn Management
  rpc RollInitiative(InitiativeRequest) returns (InitiativeResponse);
  rpc ProcessTurnStart(TurnStartRequest) returns (TurnStartResponse);
  rpc ProcessTurnEnd(TurnEndRequest) returns (TurnEndResponse);
  
  // Utility
  rpc CalculateModifier(ModifierRequest) returns (ModifierResponse);
  rpc GetProficiencyBonus(ProficiencyRequest) returns (ProficiencyResponse);
}
```

## 3.2 proto/rules/v1/dice.proto

```protobuf
syntax = "proto3";

package rules.v1;

option java_multiple_files = true;
option java_package = "com.dnd.rules.v1";

// Dice types
enum DieType {
  DIE_TYPE_UNSPECIFIED = 0;
  DIE_TYPE_D4 = 4;
  DIE_TYPE_D6 = 6;
  DIE_TYPE_D8 = 8;
  DIE_TYPE_D10 = 10;
  DIE_TYPE_D12 = 12;
  DIE_TYPE_D20 = 20;
  DIE_TYPE_D100 = 100;
}

// Single die roll result
message DieRoll {
  DieType die_type = 1;
  int32 result = 2;
}

// Roll dice request
message RollDiceRequest {
  // Dice expression like "2d6", "1d20", "4d6kh3" (keep highest 3)
  string expression = 1;
  
  // Optional seed for deterministic testing
  optional int64 seed = 2;
  
  // Context for logging
  string context = 3;
}

// Roll dice response
message RollDiceResponse {
  repeated DieRoll rolls = 1;
  int32 total = 2;
  string expression = 3;
  
  // For complex expressions
  repeated int32 kept_rolls = 4;
  repeated int32 dropped_rolls = 5;
}

// Advantage/Disadvantage roll
message RollAdvantageRequest {
  bool advantage = 1;
  bool disadvantage = 2;
  int32 modifier = 3;
  optional int64 seed = 4;
  string context = 5;
}

// Ability score modifier calculation
message ModifierRequest {
  int32 ability_score = 1;
}

message ModifierResponse {
  int32 modifier = 1;
}

// Proficiency bonus lookup
message ProficiencyRequest {
  int32 level = 1;
}

message ProficiencyResponse {
  int32 proficiency_bonus = 1;
}
```

## 3.3 proto/rules/v1/combat.proto

```protobuf
syntax = "proto3";

package rules.v1;

option java_multiple_files = true;
option java_package = "com.dnd.rules.v1";

import "rules/v1/dice.proto";

// Ability types
enum Ability {
  ABILITY_UNSPECIFIED = 0;
  ABILITY_STR = 1;
  ABILITY_DEX = 2;
  ABILITY_CON = 3;
  ABILITY_INT = 4;
  ABILITY_WIS = 5;
  ABILITY_CHA = 6;
}

// Damage types
enum DamageType {
  DAMAGE_TYPE_UNSPECIFIED = 0;
  DAMAGE_TYPE_SLASHING = 1;
  DAMAGE_TYPE_PIERCING = 2;
  DAMAGE_TYPE_BLUDGEONING = 3;
  DAMAGE_TYPE_FIRE = 4;
  DAMAGE_TYPE_COLD = 5;
  DAMAGE_TYPE_LIGHTNING = 6;
  DAMAGE_TYPE_THUNDER = 7;
  DAMAGE_TYPE_ACID = 8;
  DAMAGE_TYPE_POISON = 9;
  DAMAGE_TYPE_NECROTIC = 10;
  DAMAGE_TYPE_RADIANT = 11;
  DAMAGE_TYPE_FORCE = 12;
  DAMAGE_TYPE_PSYCHIC = 13;
}

// Cover types
enum CoverType {
  COVER_TYPE_NONE = 0;
  COVER_TYPE_HALF = 1;
  COVER_TYPE_THREE_QUARTERS = 2;
  COVER_TYPE_TOTAL = 3;
}

// Creature stats snapshot
message CreatureStats {
  string creature_id = 1;
  map<string, int32> ability_scores = 2;  // "STR" -> 18
  int32 armor_class = 3;
  int32 proficiency_bonus = 4;
  repeated string proficient_saves = 5;
  repeated DamageType resistances = 6;
  repeated DamageType vulnerabilities = 7;
  repeated DamageType immunities = 8;
  repeated string active_conditions = 9;
  int32 current_hp = 10;
  int32 max_hp = 11;
  int32 temp_hp = 12;
}

// Ability check request
message AbilityCheckRequest {
  string creature_id = 1;
  Ability ability = 2;
  int32 dc = 3;
  bool advantage = 4;
  bool disadvantage = 5;
  CreatureStats stats = 6;
  optional int64 seed = 7;
}

message AbilityCheckResponse {
  bool success = 1;
  int32 natural_roll = 2;
  int32 modifier = 3;
  int32 total = 4;
  int32 dc = 5;
  bool had_advantage = 6;
  bool had_disadvantage = 7;
  repeated int32 all_rolls = 8;
}

// Skill check request
message SkillCheckRequest {
  string creature_id = 1;
  string skill = 2;  // "perception", "stealth", etc.
  int32 dc = 3;
  bool advantage = 4;
  bool disadvantage = 5;
  CreatureStats stats = 6;
  bool proficient = 7;
  bool expertise = 8;
  optional int64 seed = 9;
}

message SkillCheckResponse {
  bool success = 1;
  int32 natural_roll = 2;
  int32 ability_modifier = 3;
  int32 proficiency_bonus = 4;
  int32 total = 5;
  int32 dc = 6;
  Ability ability_used = 7;
}

// Saving throw request
message SavingThrowRequest {
  string creature_id = 1;
  Ability ability = 2;
  int32 dc = 3;
  bool advantage = 4;
  bool disadvantage = 5;
  CreatureStats stats = 6;
  optional int64 seed = 7;
}

message SavingThrowResponse {
  bool success = 1;
  int32 natural_roll = 2;
  int32 modifier = 3;
  int32 total = 4;
  int32 dc = 5;
  bool auto_fail = 6;   // e.g., paralyzed for STR/DEX
  bool auto_success = 7;
}

// Attack request
message AttackRequest {
  string attacker_id = 1;
  string target_id = 2;
  CreatureStats attacker_stats = 3;
  CreatureStats target_stats = 4;
  
  // Attack details
  int32 attack_bonus = 5;
  string damage_dice = 6;        // "1d8", "2d6"
  int32 damage_modifier = 7;
  DamageType damage_type = 8;
  
  // Situational
  bool advantage = 9;
  bool disadvantage = 10;
  CoverType target_cover = 11;
  bool is_ranged = 12;
  int32 range = 13;
  int32 distance = 14;
  
  optional int64 seed = 15;
}

message AttackResponse {
  bool hits = 1;
  int32 natural_roll = 2;
  int32 attack_modifier = 3;
  int32 total_attack = 4;
  int32 target_ac = 5;
  
  bool is_critical = 6;
  bool is_fumble = 7;
  bool had_advantage = 8;
  bool had_disadvantage = 9;
  repeated int32 all_attack_rolls = 10;
  
  // Only populated if hits
  DamageResult damage = 11;
}

// Damage calculation
message DamageRequest {
  string dice_expression = 1;
  int32 modifier = 2;
  DamageType damage_type = 3;
  bool is_critical = 4;
  CreatureStats target_stats = 5;
  optional int64 seed = 6;
}

message DamageResult {
  repeated DieRoll rolls = 1;
  int32 base_damage = 2;
  int32 modifier = 3;
  DamageType damage_type = 4;
  
  bool is_resistant = 5;
  bool is_vulnerable = 6;
  bool is_immune = 7;
  
  int32 final_damage = 8;
}

message DamageResponse {
  DamageResult result = 1;
}

// Apply damage to creature
message ApplyDamageRequest {
  string creature_id = 1;
  int32 damage = 2;
  DamageType damage_type = 3;
  CreatureStats current_stats = 4;
}

message ApplyDamageResponse {
  int32 damage_taken = 1;
  int32 temp_hp_remaining = 2;
  int32 current_hp = 3;
  bool is_unconscious = 4;
  bool is_dead = 5;
  bool requires_concentration_check = 6;
  int32 concentration_dc = 7;  // 10 or half damage, whichever is higher
}

// Initiative
message InitiativeRequest {
  string creature_id = 1;
  int32 dexterity_modifier = 2;
  int32 initiative_bonus = 3;  // Additional bonuses (e.g., Alert feat)
  bool advantage = 4;
  optional int64 seed = 5;
}

message InitiativeResponse {
  string creature_id = 1;
  int32 initiative = 2;
  int32 natural_roll = 3;
  int32 total_modifier = 4;
}

// Turn lifecycle
message TurnStartRequest {
  string creature_id = 1;
  CreatureStats stats = 2;
  repeated ActiveCondition conditions = 3;
}

message TurnStartResponse {
  repeated ConditionUpdate condition_updates = 1;
  repeated string expired_conditions = 2;
  int32 damage_taken = 3;  // From DoT effects
  int32 healing_received = 4;  // From HoT effects
}

message TurnEndRequest {
  string creature_id = 1;
  CreatureStats stats = 2;
  repeated ActiveCondition conditions = 3;
}

message TurnEndResponse {
  repeated ConditionUpdate condition_updates = 1;
  repeated string expired_conditions = 2;
  repeated SavingThrowPrompt save_prompts = 3;  // Saves at end of turn
}

message ConditionUpdate {
  string condition_id = 1;
  int32 remaining_duration = 2;
  bool expired = 3;
}

message SavingThrowPrompt {
  string condition_id = 1;
  Ability ability = 2;
  int32 dc = 3;
  string description = 4;
}

// Active condition (imported from conditions.proto)
message ActiveCondition {
  string id = 1;
  string condition_type = 2;
  string source_id = 3;
  int32 remaining_rounds = 4;
  Ability save_ability = 5;
  int32 save_dc = 6;
}
```

## 3.4 proto/rules/v1/spells.proto

```protobuf
syntax = "proto3";

package rules.v1;

option java_multiple_files = true;
option java_package = "com.dnd.rules.v1";

import "rules/v1/combat.proto";
import "rules/v1/dice.proto";

// Spell schools
enum SpellSchool {
  SPELL_SCHOOL_UNSPECIFIED = 0;
  SPELL_SCHOOL_ABJURATION = 1;
  SPELL_SCHOOL_CONJURATION = 2;
  SPELL_SCHOOL_DIVINATION = 3;
  SPELL_SCHOOL_ENCHANTMENT = 4;
  SPELL_SCHOOL_EVOCATION = 5;
  SPELL_SCHOOL_ILLUSION = 6;
  SPELL_SCHOOL_NECROMANCY = 7;
  SPELL_SCHOOL_TRANSMUTATION = 8;
}

// Spell targeting
enum SpellTargetType {
  SPELL_TARGET_TYPE_UNSPECIFIED = 0;
  SPELL_TARGET_TYPE_SELF = 1;
  SPELL_TARGET_TYPE_SINGLE = 2;
  SPELL_TARGET_TYPE_MULTIPLE = 3;
  SPELL_TARGET_TYPE_AREA = 4;
  SPELL_TARGET_TYPE_POINT = 5;
}

// AoE shapes
enum AoeShape {
  AOE_SHAPE_UNSPECIFIED = 0;
  AOE_SHAPE_SPHERE = 1;
  AOE_SHAPE_CUBE = 2;
  AOE_SHAPE_CONE = 3;
  AOE_SHAPE_LINE = 4;
  AOE_SHAPE_CYLINDER = 5;
}

// Spell definition
message SpellDefinition {
  string spell_id = 1;
  string name = 2;
  int32 level = 3;
  SpellSchool school = 4;
  
  // Casting requirements
  bool requires_verbal = 5;
  bool requires_somatic = 6;
  bool requires_material = 7;
  string material_components = 8;
  bool material_consumed = 9;
  int32 material_cost_gp = 10;
  
  // Timing
  string casting_time = 11;  // "1 action", "1 bonus action", "1 reaction", "1 minute"
  bool is_ritual = 12;
  bool requires_concentration = 13;
  string duration = 14;  // "Instantaneous", "1 minute", "Concentration, up to 1 hour"
  
  // Targeting
  int32 range_feet = 15;
  SpellTargetType target_type = 16;
  int32 max_targets = 17;
  
  // AoE (if applicable)
  AoeShape aoe_shape = 18;
  int32 aoe_size_feet = 19;
  
  // Effects
  string damage_dice = 20;
  DamageType damage_type = 21;
  string healing_dice = 22;
  Ability save_ability = 23;
  string effect_on_save = 24;  // "half", "none", "special"
  
  // Upcast scaling
  string upcast_damage_per_level = 25;
  string upcast_targets_per_level = 26;
}

// Validate spell cast
message ValidateSpellRequest {
  string caster_id = 1;
  string spell_id = 2;
  int32 spell_slot_level = 3;
  
  // Caster state
  map<int32, int32> available_slots = 4;  // level -> count
  bool is_concentrating = 5;
  string current_concentration_spell = 6;
  repeated string prepared_spells = 7;
  
  // Targeting
  repeated string target_ids = 8;
  Position target_point = 9;
  
  // Components
  bool has_free_hand = 10;
  bool can_speak = 11;
  repeated string held_items = 12;
  
  SpellDefinition spell = 13;
}

message ValidateSpellResponse {
  bool valid = 1;
  repeated string errors = 2;
  bool will_break_concentration = 3;
  int32 slot_to_consume = 4;
}

// Grid position
message Position {
  int32 x = 1;
  int32 y = 2;
}

// Resolve spell cast
message ResolveSpellRequest {
  string caster_id = 1;
  string spell_id = 2;
  int32 cast_at_level = 3;
  
  CreatureStats caster_stats = 4;
  int32 spell_save_dc = 5;
  int32 spell_attack_bonus = 6;
  
  repeated SpellTarget targets = 7;
  Position origin_point = 8;
  
  SpellDefinition spell = 9;
  optional int64 seed = 10;
}

message SpellTarget {
  string creature_id = 1;
  CreatureStats stats = 2;
  int32 distance_feet = 3;
  CoverType cover = 4;
}

message ResolveSpellResponse {
  bool success = 1;
  
  // For attack spells
  repeated SpellAttackResult attack_results = 2;
  
  // For save spells
  repeated SpellSaveResult save_results = 3;
  
  // For healing spells
  repeated HealingResult healing_results = 4;
  
  // Applied conditions
  repeated AppliedCondition applied_conditions = 5;
  
  // Concentration
  bool requires_concentration = 6;
  int32 concentration_duration_rounds = 7;
}

message SpellAttackResult {
  string target_id = 1;
  bool hits = 2;
  int32 attack_roll = 3;
  int32 target_ac = 4;
  bool is_critical = 5;
  DamageResult damage = 6;
}

message SpellSaveResult {
  string target_id = 1;
  bool saved = 2;
  int32 save_roll = 3;
  int32 save_modifier = 4;
  int32 save_dc = 5;
  DamageResult damage = 6;  // May be full, half, or none
}

message HealingResult {
  string target_id = 1;
  repeated DieRoll rolls = 2;
  int32 modifier = 3;
  int32 total_healing = 4;
  int32 new_hp = 5;
}

message AppliedCondition {
  string target_id = 1;
  string condition_type = 2;
  int32 duration_rounds = 3;
  Ability save_ability = 4;
  int32 save_dc = 5;
}

// Concentration check
message ConcentrationCheckRequest {
  string caster_id = 1;
  int32 damage_taken = 2;
  CreatureStats caster_stats = 3;
  bool advantage = 4;  // e.g., War Caster
  optional int64 seed = 5;
}

message ConcentrationCheckResponse {
  bool maintained = 1;
  int32 dc = 2;  // 10 or half damage
  int32 roll = 3;
  int32 modifier = 4;
  int32 total = 5;
}
```

## 3.5 proto/rules/v1/conditions.proto

```protobuf
syntax = "proto3";

package rules.v1;

option java_multiple_files = true;
option java_package = "com.dnd.rules.v1";

import "rules/v1/combat.proto";

// Standard 5e conditions
enum ConditionType {
  CONDITION_TYPE_UNSPECIFIED = 0;
  CONDITION_TYPE_BLINDED = 1;
  CONDITION_TYPE_CHARMED = 2;
  CONDITION_TYPE_DEAFENED = 3;
  CONDITION_TYPE_EXHAUSTION = 4;
  CONDITION_TYPE_FRIGHTENED = 5;
  CONDITION_TYPE_GRAPPLED = 6;
  CONDITION_TYPE_INCAPACITATED = 7;
  CONDITION_TYPE_INVISIBLE = 8;
  CONDITION_TYPE_PARALYZED = 9;
  CONDITION_TYPE_PETRIFIED = 10;
  CONDITION_TYPE_POISONED = 11;
  CONDITION_TYPE_PRONE = 12;
  CONDITION_TYPE_RESTRAINED = 13;
  CONDITION_TYPE_STUNNED = 14;
  CONDITION_TYPE_UNCONSCIOUS = 15;
}

// Duration type
enum DurationType {
  DURATION_TYPE_UNSPECIFIED = 0;
  DURATION_TYPE_ROUNDS = 1;
  DURATION_TYPE_MINUTES = 2;
  DURATION_TYPE_HOURS = 3;
  DURATION_TYPE_UNTIL_DISPELLED = 4;
  DURATION_TYPE_SAVE_ENDS = 5;
  DURATION_TYPE_PERMANENT = 6;
}

// Apply condition request
message ApplyConditionRequest {
  string target_id = 1;
  ConditionType condition_type = 2;
  string source_id = 3;  // Who/what applied it
  
  // Duration
  DurationType duration_type = 4;
  int32 duration_value = 5;
  
  // Save to end
  Ability save_ability = 6;
  int32 save_dc = 7;
  bool save_at_end_of_turn = 8;
  
  // Special (for exhaustion)
  int32 exhaustion_level = 9;
}

message ApplyConditionResponse {
  bool applied = 1;
  string condition_instance_id = 2;
  bool target_was_immune = 3;
  repeated string effects_applied = 4;
}

// Remove condition
message RemoveConditionRequest {
  string target_id = 1;
  string condition_instance_id = 2;
}

message RemoveConditionResponse {
  bool removed = 1;
  repeated string effects_removed = 2;
}

// Get active conditions
message GetConditionsRequest {
  string creature_id = 1;
}

message GetConditionsResponse {
  repeated ConditionInstance conditions = 1;
}

message ConditionInstance {
  string instance_id = 1;
  ConditionType condition_type = 2;
  string source_id = 3;
  
  DurationType duration_type = 4;
  int32 remaining_duration = 5;
  
  Ability save_ability = 6;
  int32 save_dc = 7;
  
  int32 exhaustion_level = 8;
  
  // Computed effects
  ConditionEffects effects = 9;
}

// Condition mechanical effects
message ConditionEffects {
  // Attack modifiers
  bool attacks_have_disadvantage = 1;
  bool attacks_have_advantage = 2;
  bool attacks_against_have_advantage = 3;
  bool attacks_against_have_disadvantage = 4;
  
  // Auto-crit
  bool melee_attacks_against_auto_crit = 5;
  
  // Save modifiers
  bool str_saves_auto_fail = 6;
  bool dex_saves_auto_fail = 7;
  
  // Ability check modifiers
  bool ability_checks_have_disadvantage = 8;
  
  // Movement
  bool speed_is_zero = 9;
  int32 speed_reduction = 10;
  bool cant_move_closer_to_source = 11;
  
  // Actions
  bool cant_take_actions = 12;
  bool cant_take_reactions = 13;
  bool cant_take_bonus_actions = 14;
  
  // Targeting
  bool cant_be_targeted = 15;  // e.g., total cover from invisibility
  
  // Resistances
  repeated DamageType resistances = 16;
  repeated DamageType immunities = 17;
  
  // Special
  bool drops_held_items = 18;
  bool falls_prone = 19;
  bool auto_fail_sight_checks = 20;
  bool auto_fail_hearing_checks = 21;
}
```

---

# 4. Grid Service Protos

## 4.1 proto/grid/v1/grid_service.proto

```protobuf
syntax = "proto3";

package grid.v1;

option java_multiple_files = true;
option java_package = "com.dnd.grid.v1";

import "grid/v1/los.proto";
import "grid/v1/pathfinding.proto";
import "grid/v1/aoe.proto";

// Grid Solver service
service GridService {
  // Line of Sight
  rpc CheckLineOfSight(LineOfSightRequest) returns (LineOfSightResponse);
  rpc GetVisibleTiles(VisibleTilesRequest) returns (VisibleTilesResponse);
  
  // Cover
  rpc CalculateCover(CoverRequest) returns (CoverResponse);
  
  // Area of Effect
  rpc GetAoeTiles(AoeRequest) returns (AoeResponse);
  rpc GetAoeTargets(AoeTargetsRequest) returns (AoeTargetsResponse);
  
  // Pathfinding
  rpc FindPath(PathfindingRequest) returns (PathfindingResponse);
  rpc GetReachableTiles(ReachableTilesRequest) returns (ReachableTilesResponse);
  
  // Grid Queries
  rpc GetTileInfo(TileInfoRequest) returns (TileInfoResponse);
  rpc GetCreaturesInRadius(RadiusQueryRequest) returns (RadiusQueryResponse);
  
  // Distance
  rpc CalculateDistance(DistanceRequest) returns (DistanceResponse);
}
```

## 4.2 proto/grid/v1/los.proto

```protobuf
syntax = "proto3";

package grid.v1;

option java_multiple_files = true;
option java_package = "com.dnd.grid.v1";

// Grid position
message GridPosition {
  int32 x = 1;
  int32 y = 2;
}

// Tile types
enum TileType {
  TILE_TYPE_UNSPECIFIED = 0;
  TILE_TYPE_FLOOR = 1;
  TILE_TYPE_WALL = 2;
  TILE_TYPE_DOOR_CLOSED = 3;
  TILE_TYPE_DOOR_OPEN = 4;
  TILE_TYPE_WINDOW = 5;
  TILE_TYPE_DIFFICULT_TERRAIN = 6;
  TILE_TYPE_WATER_SHALLOW = 7;
  TILE_TYPE_WATER_DEEP = 8;
  TILE_TYPE_PIT = 9;
  TILE_TYPE_STAIRS = 10;
}

// Blocking type for LoS
enum BlockingType {
  BLOCKING_TYPE_NONE = 0;
  BLOCKING_TYPE_PARTIAL = 1;  // Half cover
  BLOCKING_TYPE_FULL = 2;     // Total cover/wall
}

// Tile data
message TileData {
  GridPosition position = 1;
  TileType tile_type = 2;
  BlockingType blocking = 3;
  int32 movement_cost = 4;  // 1 = normal, 2 = difficult, 999 = impassable
  int32 elevation = 5;      // Height in 5-ft increments
  bool provides_half_cover = 6;
  bool provides_three_quarter_cover = 7;
  optional string creature_id = 8;  // If occupied
}

// Grid map for calculations
message GridMap {
  int32 width = 1;
  int32 height = 2;
  repeated TileData tiles = 3;
  repeated GridCreature creatures = 4;
}

// Creature on grid
message GridCreature {
  string creature_id = 1;
  GridPosition position = 2;
  int32 size = 3;  // 1 = Medium, 2 = Large, 3 = Huge, 4 = Gargantuan
  bool is_prone = 4;
}

// Line of Sight check
message LineOfSightRequest {
  GridPosition from = 1;
  GridPosition to = 2;
  GridMap map = 3;
}

message LineOfSightResponse {
  bool has_line_of_sight = 1;
  repeated GridPosition blocked_by = 2;
  float obscured_percentage = 3;  // 0-1
}

// Get all visible tiles from a position
message VisibleTilesRequest {
  GridPosition from = 1;
  int32 vision_radius = 2;  // In tiles (5ft each)
  GridMap map = 3;
  bool darkvision = 4;
  int32 darkvision_radius = 5;
}

message VisibleTilesResponse {
  repeated VisibleTile tiles = 1;
}

message VisibleTile {
  GridPosition position = 1;
  bool fully_visible = 2;
  bool dimly_lit = 3;
  bool in_darkness = 4;
}

// Cover calculation
message CoverRequest {
  GridPosition attacker = 1;
  GridPosition target = 2;
  GridMap map = 3;
}

enum CoverLevel {
  COVER_LEVEL_NONE = 0;
  COVER_LEVEL_HALF = 1;
  COVER_LEVEL_THREE_QUARTERS = 2;
  COVER_LEVEL_TOTAL = 3;
}

message CoverResponse {
  CoverLevel cover = 1;
  int32 ac_bonus = 2;
  int32 dex_save_bonus = 3;
  repeated GridPosition providing_cover = 4;
}

// Distance calculation
message DistanceRequest {
  GridPosition from = 1;
  GridPosition to = 2;
  bool use_diagonal = 3;  // 5-5-5 vs 5-10-5 diagonals
}

message DistanceResponse {
  int32 distance_tiles = 1;
  int32 distance_feet = 2;
}

// Tile info query
message TileInfoRequest {
  GridPosition position = 1;
  GridMap map = 2;
}

message TileInfoResponse {
  TileData tile = 1;
  optional GridCreature occupant = 2;
  repeated string effects = 3;  // Active spell effects on tile
}
```

## 4.3 proto/grid/v1/pathfinding.proto

```protobuf
syntax = "proto3";

package grid.v1;

option java_multiple_files = true;
option java_package = "com.dnd.grid.v1";

import "grid/v1/los.proto";

// Pathfinding request
message PathfindingRequest {
  GridPosition from = 1;
  GridPosition to = 2;
  GridMap map = 3;
  
  // Movement constraints
  int32 max_movement = 4;       // In feet
  bool can_fly = 5;
  bool can_swim = 6;
  bool can_climb = 7;
  bool ignore_difficult_terrain = 8;
  repeated GridPosition avoid_positions = 9;
  
  // Creature size
  int32 creature_size = 10;
}

message PathfindingResponse {
  bool path_found = 1;
  repeated PathNode path = 2;
  int32 total_cost = 3;
  int32 total_feet = 4;
}

message PathNode {
  GridPosition position = 1;
  int32 cumulative_cost = 2;
  bool is_difficult_terrain = 3;
}

// Get all reachable tiles
message ReachableTilesRequest {
  GridPosition from = 1;
  int32 movement_remaining = 2;
  GridMap map = 3;
  
  bool can_fly = 4;
  bool ignore_difficult_terrain = 5;
  int32 creature_size = 6;
  
  // For calculating dash action
  bool include_dash = 7;
}

message ReachableTilesResponse {
  repeated ReachableTile tiles = 1;
}

message ReachableTile {
  GridPosition position = 1;
  int32 movement_cost = 2;
  bool requires_dash = 3;
  repeated GridPosition path_from_start = 4;
}

// Radius query (creatures in range)
message RadiusQueryRequest {
  GridPosition center = 1;
  int32 radius_feet = 2;
  GridMap map = 3;
  bool require_line_of_sight = 4;
}

message RadiusQueryResponse {
  repeated CreatureInRadius creatures = 1;
}

message CreatureInRadius {
  string creature_id = 1;
  GridPosition position = 2;
  int32 distance_feet = 3;
  bool has_line_of_sight = 4;
  CoverLevel cover = 5;
}
```

## 4.4 proto/grid/v1/aoe.proto

```protobuf
syntax = "proto3";

package grid.v1;

option java_multiple_files = true;
option java_package = "com.dnd.grid.v1";

import "grid/v1/los.proto";

// AoE shape types
enum AoeShapeType {
  AOE_SHAPE_TYPE_UNSPECIFIED = 0;
  AOE_SHAPE_TYPE_SPHERE = 1;
  AOE_SHAPE_TYPE_CUBE = 2;
  AOE_SHAPE_TYPE_CONE = 3;
  AOE_SHAPE_TYPE_LINE = 4;
  AOE_SHAPE_TYPE_CYLINDER = 5;
}

// Direction for cones and lines
enum Direction {
  DIRECTION_UNSPECIFIED = 0;
  DIRECTION_NORTH = 1;
  DIRECTION_NORTHEAST = 2;
  DIRECTION_EAST = 3;
  DIRECTION_SOUTHEAST = 4;
  DIRECTION_SOUTH = 5;
  DIRECTION_SOUTHWEST = 6;
  DIRECTION_WEST = 7;
  DIRECTION_NORTHWEST = 8;
}

// AoE definition
message AoeDefinition {
  AoeShapeType shape = 1;
  int32 size_feet = 2;      // Radius for sphere/cylinder, side for cube, length for cone/line
  int32 width_feet = 3;     // Only for line
  int32 height_feet = 4;    // Only for cylinder
}

// Get tiles in AoE
message AoeRequest {
  GridPosition origin = 1;
  AoeDefinition aoe = 2;
  Direction direction = 3;  // For cones and lines
  GridMap map = 4;
  bool ignore_walls = 5;    // Some spells go around corners
}

message AoeResponse {
  repeated AoeTile tiles = 1;
  int32 total_tiles = 2;
}

message AoeTile {
  GridPosition position = 1;
  bool blocked_by_wall = 2;
  int32 distance_from_origin = 3;
}

// Get creatures affected by AoE
message AoeTargetsRequest {
  GridPosition origin = 1;
  AoeDefinition aoe = 2;
  Direction direction = 3;
  GridMap map = 4;
  bool ignore_walls = 5;
  
  // Filter options
  optional string exclude_creature_id = 6;  // Usually the caster
  bool allies_only = 7;
  bool enemies_only = 8;
}

message AoeTargetsResponse {
  repeated AoeTarget targets = 1;
}

message AoeTarget {
  string creature_id = 1;
  GridPosition position = 2;
  int32 distance_feet = 3;
  bool has_cover = 4;
  CoverLevel cover_level = 5;
}
```

---

# 5. Game Service Protos

## 5.1 proto/game/v1/game_service.proto

```protobuf
syntax = "proto3";

package game.v1;

option java_multiple_files = true;
option java_package = "com.dnd.game.v1";

import "game/v1/session.proto";
import "game/v1/events.proto";

// Game State service
service GameService {
  // Session management
  rpc CreateSession(CreateSessionRequest) returns (CreateSessionResponse);
  rpc JoinSession(JoinSessionRequest) returns (JoinSessionResponse);
  rpc LeaveSession(LeaveSessionRequest) returns (LeaveSessionResponse);
  rpc GetSessionState(GetSessionStateRequest) returns (GetSessionStateResponse);
  
  // Game commands
  rpc SubmitCommand(CommandRequest) returns (CommandResponse);
  
  // Real-time updates (server streaming)
  rpc SubscribeToSession(SubscribeRequest) returns (stream GameEvent);
  
  // Turn management
  rpc StartCombat(StartCombatRequest) returns (StartCombatResponse);
  rpc EndTurn(EndTurnRequest) returns (EndTurnResponse);
  rpc EndCombat(EndCombatRequest) returns (EndCombatResponse);
  
  // DM controls
  rpc SetCreatureHP(SetHPRequest) returns (SetHPResponse);
  rpc SpawnCreature(SpawnCreatureRequest) returns (SpawnCreatureResponse);
  rpc RemoveCreature(RemoveCreatureRequest) returns (RemoveCreatureResponse);
  rpc ModifyTerrain(ModifyTerrainRequest) returns (ModifyTerrainResponse);
}
```

## 5.2 proto/game/v1/session.proto

```protobuf
syntax = "proto3";

package game.v1;

option java_multiple_files = true;
option java_package = "com.dnd.game.v1";

import "grid/v1/los.proto";
import "rules/v1/combat.proto";
import "rules/v1/conditions.proto";

// Session state
enum SessionState {
  SESSION_STATE_UNSPECIFIED = 0;
  SESSION_STATE_LOBBY = 1;
  SESSION_STATE_EXPLORATION = 2;
  SESSION_STATE_COMBAT = 3;
  SESSION_STATE_CUTSCENE = 4;
  SESSION_STATE_PAUSED = 5;
  SESSION_STATE_ENDED = 6;
}

// Player role
enum PlayerRole {
  PLAYER_ROLE_UNSPECIFIED = 0;
  PLAYER_ROLE_PLAYER = 1;
  PLAYER_ROLE_DM = 2;
  PLAYER_ROLE_SPECTATOR = 3;
}

// Create session
message CreateSessionRequest {
  string campaign_id = 1;
  string map_id = 2;
  string host_user_id = 3;
  int32 max_players = 4;
  string session_name = 5;
  bool is_private = 6;
}

message CreateSessionResponse {
  string session_id = 1;
  string join_code = 2;
}

// Join session
message JoinSessionRequest {
  string session_id = 1;
  string user_id = 2;
  string character_id = 3;
  PlayerRole role = 4;
  string join_code = 5;
}

message JoinSessionResponse {
  bool success = 1;
  string error_message = 2;
  SessionSnapshot current_state = 3;
}

// Leave session
message LeaveSessionRequest {
  string session_id = 1;
  string user_id = 2;
}

message LeaveSessionResponse {
  bool success = 1;
}

// Get session state
message GetSessionStateRequest {
  string session_id = 1;
}

message GetSessionStateResponse {
  SessionSnapshot state = 1;
}

// Full session snapshot
message SessionSnapshot {
  string session_id = 1;
  SessionState state = 2;
  
  // Map
  grid.v1.GridMap map = 3;
  
  // Participants
  repeated SessionParticipant participants = 4;
  
  // Creatures (PCs + NPCs + monsters)
  repeated SessionCreature creatures = 5;
  
  // Combat state (if in combat)
  CombatState combat = 6;
  
  // Turn/round tracking
  int32 current_round = 7;
  string active_creature_id = 8;
  
  // Timestamps
  int64 created_at = 9;
  int64 updated_at = 10;
}

message SessionParticipant {
  string user_id = 1;
  string display_name = 2;
  PlayerRole role = 3;
  string character_id = 4;
  bool is_ready = 5;
  bool is_connected = 6;
}

message SessionCreature {
  string creature_id = 1;
  string name = 2;
  string owner_user_id = 3;  // For PCs
  bool is_player_character = 4;
  
  // Position
  grid.v1.GridPosition position = 5;
  int32 size = 6;
  
  // Stats snapshot
  rules.v1.CreatureStats stats = 7;
  
  // Conditions
  repeated rules.v1.ConditionInstance conditions = 8;
  
  // Combat
  int32 initiative = 9;
  bool has_taken_turn = 10;
  
  // Resources
  int32 movement_remaining = 11;
  bool action_available = 12;
  bool bonus_action_available = 13;
  bool reaction_available = 14;
}

message CombatState {
  bool active = 1;
  int32 round = 2;
  repeated InitiativeEntry initiative_order = 3;
  int32 current_initiative_index = 4;
}

message InitiativeEntry {
  string creature_id = 1;
  int32 initiative = 2;
  int32 tiebreaker = 3;  // DEX modifier, then random
}

// Command submission
message CommandRequest {
  string session_id = 1;
  string user_id = 2;
  string creature_id = 3;
  GameCommand command = 4;
}

message CommandResponse {
  bool accepted = 1;
  string error_message = 2;
  repeated GameEvent events = 3;
}

// Game commands
message GameCommand {
  oneof command {
    MoveCommand move = 1;
    AttackCommand attack = 2;
    CastSpellCommand cast_spell = 3;
    UseAbilityCommand use_ability = 4;
    InteractCommand interact = 5;
    DashCommand dash = 6;
    DodgeCommand dodge = 7;
    DisengageCommand disengage = 8;
    HideCommand hide = 9;
    HelpCommand help = 10;
    ReadyCommand ready = 11;
    EndTurnCommand end_turn = 12;
  }
}

message MoveCommand {
  repeated grid.v1.GridPosition path = 1;
}

message AttackCommand {
  string target_id = 1;
  string weapon_id = 2;
}

message CastSpellCommand {
  string spell_id = 1;
  int32 slot_level = 2;
  repeated string target_ids = 3;
  grid.v1.GridPosition target_point = 4;
}

message UseAbilityCommand {
  string ability_id = 1;
  repeated string target_ids = 2;
}

message InteractCommand {
  string object_id = 1;
  string interaction_type = 2;
}

message DashCommand {}
message DodgeCommand {}
message DisengageCommand {}
message HideCommand {}
message HelpCommand {
  string target_id = 1;
}
message ReadyCommand {
  string trigger = 1;
  GameCommand action = 2;
}
message EndTurnCommand {}

// Subscribe to session updates
message SubscribeRequest {
  string session_id = 1;
  string user_id = 2;
}

// Combat management
message StartCombatRequest {
  string session_id = 1;
  repeated string creature_ids = 2;
}

message StartCombatResponse {
  CombatState combat = 1;
  repeated GameEvent events = 2;
}

message EndTurnRequest {
  string session_id = 1;
  string creature_id = 2;
}

message EndTurnResponse {
  string next_creature_id = 1;
  bool new_round = 2;
  repeated GameEvent events = 3;
}

message EndCombatRequest {
  string session_id = 1;
}

message EndCombatResponse {
  repeated GameEvent events = 1;
}

// DM controls
message SetHPRequest {
  string session_id = 1;
  string creature_id = 2;
  int32 new_hp = 3;
}

message SetHPResponse {
  bool success = 1;
}

message SpawnCreatureRequest {
  string session_id = 1;
  string monster_id = 2;
  grid.v1.GridPosition position = 3;
  string custom_name = 4;
}

message SpawnCreatureResponse {
  string creature_id = 1;
  SessionCreature creature = 2;
}

message RemoveCreatureRequest {
  string session_id = 1;
  string creature_id = 2;
}

message RemoveCreatureResponse {
  bool success = 1;
}

message ModifyTerrainRequest {
  string session_id = 1;
  grid.v1.GridPosition position = 2;
  grid.v1.TileType new_type = 3;
}

message ModifyTerrainResponse {
  bool success = 1;
}
```

## 5.3 proto/game/v1/events.proto

```protobuf
syntax = "proto3";

package game.v1;

option java_multiple_files = true;
option java_package = "com.dnd.game.v1";

import "grid/v1/los.proto";
import "rules/v1/combat.proto";
import "rules/v1/dice.proto";

// Game event types
enum GameEventType {
  GAME_EVENT_TYPE_UNSPECIFIED = 0;
  
  // Session events
  GAME_EVENT_TYPE_PLAYER_JOINED = 1;
  GAME_EVENT_TYPE_PLAYER_LEFT = 2;
  GAME_EVENT_TYPE_SESSION_STATE_CHANGED = 3;
  
  // Combat events
  GAME_EVENT_TYPE_COMBAT_STARTED = 10;
  GAME_EVENT_TYPE_COMBAT_ENDED = 11;
  GAME_EVENT_TYPE_TURN_STARTED = 12;
  GAME_EVENT_TYPE_TURN_ENDED = 13;
  GAME_EVENT_TYPE_ROUND_STARTED = 14;
  
  // Action events
  GAME_EVENT_TYPE_CREATURE_MOVED = 20;
  GAME_EVENT_TYPE_ATTACK_MADE = 21;
  GAME_EVENT_TYPE_SPELL_CAST = 22;
  GAME_EVENT_TYPE_ABILITY_USED = 23;
  GAME_EVENT_TYPE_INTERACTION = 24;
  
  // Effect events
  GAME_EVENT_TYPE_DAMAGE_DEALT = 30;
  GAME_EVENT_TYPE_HEALING_RECEIVED = 31;
  GAME_EVENT_TYPE_CONDITION_APPLIED = 32;
  GAME_EVENT_TYPE_CONDITION_REMOVED = 33;
  GAME_EVENT_TYPE_CREATURE_DIED = 34;
  GAME_EVENT_TYPE_CREATURE_UNCONSCIOUS = 35;
  
  // Dice events
  GAME_EVENT_TYPE_DICE_ROLLED = 40;
  
  // Map events
  GAME_EVENT_TYPE_FOG_REVEALED = 50;
  GAME_EVENT_TYPE_TERRAIN_CHANGED = 51;
  GAME_EVENT_TYPE_CREATURE_SPAWNED = 52;
  GAME_EVENT_TYPE_CREATURE_REMOVED = 53;
}

// Main game event wrapper
message GameEvent {
  string event_id = 1;
  GameEventType type = 2;
  int64 timestamp = 3;
  string session_id = 4;
  
  oneof payload {
    PlayerJoinedEvent player_joined = 10;
    PlayerLeftEvent player_left = 11;
    SessionStateChangedEvent session_state_changed = 12;
    
    CombatStartedEvent combat_started = 20;
    CombatEndedEvent combat_ended = 21;
    TurnStartedEvent turn_started = 22;
    TurnEndedEvent turn_ended = 23;
    RoundStartedEvent round_started = 24;
    
    CreatureMovedEvent creature_moved = 30;
    AttackMadeEvent attack_made = 31;
    SpellCastEvent spell_cast = 32;
    
    DamageDealtEvent damage_dealt = 40;
    HealingReceivedEvent healing_received = 41;
    ConditionAppliedEvent condition_applied = 42;
    ConditionRemovedEvent condition_removed = 43;
    CreatureDiedEvent creature_died = 44;
    
    DiceRolledEvent dice_rolled = 50;
    
    FogRevealedEvent fog_revealed = 60;
    CreatureSpawnedEvent creature_spawned = 61;
  }
}

// Session events
message PlayerJoinedEvent {
  string user_id = 1;
  string display_name = 2;
  string character_id = 3;
}

message PlayerLeftEvent {
  string user_id = 1;
  string display_name = 2;
}

message SessionStateChangedEvent {
  SessionState previous_state = 1;
  SessionState new_state = 2;
}

// Combat events
message CombatStartedEvent {
  repeated InitiativeResult initiatives = 1;
}

message InitiativeResult {
  string creature_id = 1;
  string creature_name = 2;
  int32 roll = 3;
  int32 modifier = 4;
  int32 total = 5;
}

message CombatEndedEvent {
  string reason = 1;  // "victory", "flee", "dm_ended"
}

message TurnStartedEvent {
  string creature_id = 1;
  string creature_name = 2;
  int32 round = 3;
}

message TurnEndedEvent {
  string creature_id = 1;
}

message RoundStartedEvent {
  int32 round_number = 1;
}

// Action events
message CreatureMovedEvent {
  string creature_id = 1;
  grid.v1.GridPosition from = 2;
  grid.v1.GridPosition to = 3;
  repeated grid.v1.GridPosition path = 4;
  int32 movement_used = 5;
}

message AttackMadeEvent {
  string attacker_id = 1;
  string target_id = 2;
  string weapon_name = 3;
  
  bool hits = 4;
  int32 attack_roll = 5;
  int32 attack_total = 6;
  int32 target_ac = 7;
  bool is_critical = 8;
  bool is_fumble = 9;
  
  // Only if hits
  int32 damage = 10;
  string damage_type = 11;
}

message SpellCastEvent {
  string caster_id = 1;
  string spell_name = 2;
  int32 spell_level = 3;
  repeated string target_ids = 4;
  grid.v1.GridPosition target_point = 5;
}

// Effect events
message DamageDealtEvent {
  string source_id = 1;
  string target_id = 2;
  int32 damage = 3;
  string damage_type = 4;
  int32 new_hp = 5;
  bool was_critical = 6;
}

message HealingReceivedEvent {
  string source_id = 1;
  string target_id = 2;
  int32 healing = 3;
  int32 new_hp = 4;
}

message ConditionAppliedEvent {
  string target_id = 1;
  string condition = 2;
  string source_id = 3;
  int32 duration_rounds = 4;
}

message ConditionRemovedEvent {
  string target_id = 1;
  string condition = 2;
  string reason = 3;  // "expired", "saved", "dispelled"
}

message CreatureDiedEvent {
  string creature_id = 1;
  string creature_name = 2;
  string killed_by = 3;
}

// Dice events
message DiceRolledEvent {
  string roller_id = 1;
  string context = 2;  // "attack", "damage", "save", "check"
  repeated rules.v1.DieRoll rolls = 3;
  int32 modifier = 4;
  int32 total = 5;
}

// Map events
message FogRevealedEvent {
  repeated grid.v1.GridPosition tiles = 1;
}

message CreatureSpawnedEvent {
  string creature_id = 1;
  string creature_name = 2;
  grid.v1.GridPosition position = 3;
}

// Import SessionState from session.proto
enum SessionState {
  SESSION_STATE_UNSPECIFIED = 0;
  SESSION_STATE_LOBBY = 1;
  SESSION_STATE_EXPLORATION = 2;
  SESSION_STATE_COMBAT = 3;
  SESSION_STATE_CUTSCENE = 4;
  SESSION_STATE_PAUSED = 5;
  SESSION_STATE_ENDED = 6;
}
```

---

# 6. Proto Generation Script

Create this script to generate types from protos:

```bash
#!/bin/bash
# scripts/generate-protos.sh

set -e

echo "Generating Protocol Buffer types..."

# Check if buf is installed
if ! command -v buf &> /dev/null; then
    echo "Installing buf..."
    npm install -g @bufbuild/buf
fi

cd proto

# Lint protos
echo "Linting protos..."
buf lint

# Generate types
echo "Generating TypeScript and Rust types..."
buf generate

echo "Proto generation complete!"
```

---

# END OF DOCUMENT 17
