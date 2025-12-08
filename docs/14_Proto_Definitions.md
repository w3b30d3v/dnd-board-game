# D&D Digital Board Game Platform
# Document 14: Protocol Buffer Definitions

---

# 1. Overview

This document contains all Protocol Buffer definitions for gRPC services.
Generate code with: `pnpm proto:generate`

---

# 2. Common Types

```protobuf
// proto/common/v1/types.proto

syntax = "proto3";

package dnd.common.v1;

option go_package = "github.com/dnd-platform/proto/common/v1";

// Position on the grid
message Position {
  int32 x = 1;
  int32 y = 2;
}

// Ability scores
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
  COVER_TYPE_UNSPECIFIED = 0;
  COVER_TYPE_NONE = 1;
  COVER_TYPE_HALF = 2;
  COVER_TYPE_THREE_QUARTERS = 3;
  COVER_TYPE_TOTAL = 4;
}

// Condition IDs
enum Condition {
  CONDITION_UNSPECIFIED = 0;
  CONDITION_BLINDED = 1;
  CONDITION_CHARMED = 2;
  CONDITION_DEAFENED = 3;
  CONDITION_EXHAUSTION = 4;
  CONDITION_FRIGHTENED = 5;
  CONDITION_GRAPPLED = 6;
  CONDITION_INCAPACITATED = 7;
  CONDITION_INVISIBLE = 8;
  CONDITION_PARALYZED = 9;
  CONDITION_PETRIFIED = 10;
  CONDITION_POISONED = 11;
  CONDITION_PRONE = 12;
  CONDITION_RESTRAINED = 13;
  CONDITION_STUNNED = 14;
  CONDITION_UNCONSCIOUS = 15;
}

// Dice expression result
message DiceResult {
  string expression = 1;        // "2d6+3"
  repeated int32 rolls = 2;     // [4, 6]
  int32 modifier = 3;           // 3
  int32 total = 4;              // 13
}

// Entity reference
message EntityRef {
  string entity_id = 1;
  string entity_type = 2;       // "player", "monster", "npc"
}
```

---

# 3. Rules Engine Service

```protobuf
// proto/rules/v1/rules.proto

syntax = "proto3";

package dnd.rules.v1;

option go_package = "github.com/dnd-platform/proto/rules/v1";

import "common/v1/types.proto";

service RulesEngine {
  // Dice rolling
  rpc RollDice(RollDiceRequest) returns (RollDiceResponse);
  
  // Ability checks
  rpc ResolveAbilityCheck(AbilityCheckRequest) returns (AbilityCheckResponse);
  rpc ResolveSkillCheck(SkillCheckRequest) returns (SkillCheckResponse);
  rpc ResolveSavingThrow(SavingThrowRequest) returns (SavingThrowResponse);
  
  // Combat
  rpc ResolveAttack(AttackRequest) returns (AttackResponse);
  rpc ApplyDamage(ApplyDamageRequest) returns (ApplyDamageResponse);
  rpc ResolveHealing(HealingRequest) returns (HealingResponse);
  
  // Spellcasting
  rpc ValidateSpellCast(ValidateSpellRequest) returns (ValidateSpellResponse);
  rpc ResolveSpellCast(SpellCastRequest) returns (SpellCastResponse);
  rpc ResolveConcentrationCheck(ConcentrationCheckRequest) returns (ConcentrationCheckResponse);
  
  // Conditions
  rpc ApplyCondition(ApplyConditionRequest) returns (ApplyConditionResponse);
  rpc RemoveCondition(RemoveConditionRequest) returns (RemoveConditionResponse);
  rpc GetConditionEffects(GetConditionEffectsRequest) returns (GetConditionEffectsResponse);
  
  // Initiative
  rpc RollInitiative(InitiativeRequest) returns (InitiativeResponse);
  
  // Death saves
  rpc RollDeathSave(DeathSaveRequest) returns (DeathSaveResponse);
}

// ============ DICE ROLLING ============

message RollDiceRequest {
  string expression = 1;        // "2d6+3", "1d20"
  optional uint64 seed = 2;     // For deterministic rolls
}

message RollDiceResponse {
  dnd.common.v1.DiceResult result = 1;
}

// ============ ABILITY CHECKS ============

message AbilityCheckRequest {
  string entity_id = 1;
  dnd.common.v1.Ability ability = 2;
  int32 dc = 3;
  bool has_advantage = 4;
  bool has_disadvantage = 5;
  repeated string bonus_sources = 6;  // "guidance", "bardic_inspiration"
  optional uint64 seed = 7;
}

message AbilityCheckResponse {
  bool success = 1;
  int32 natural_roll = 2;
  int32 modifier = 3;
  int32 total = 4;
  int32 dc = 5;
  bool had_advantage = 6;
  bool had_disadvantage = 7;
  repeated int32 all_rolls = 8;       // If adv/disadv
  repeated ModifierSource modifiers = 9;
}

message ModifierSource {
  string source = 1;            // "ability_mod", "proficiency", "guidance"
  int32 value = 2;
}

message SkillCheckRequest {
  string entity_id = 1;
  string skill = 2;             // "stealth", "perception"
  int32 dc = 3;
  bool has_advantage = 4;
  bool has_disadvantage = 5;
  repeated string bonus_sources = 6;
  optional uint64 seed = 7;
}

message SkillCheckResponse {
  bool success = 1;
  int32 natural_roll = 2;
  int32 modifier = 3;
  int32 total = 4;
  int32 dc = 5;
  dnd.common.v1.Ability ability_used = 6;
  bool is_proficient = 7;
  bool has_expertise = 8;
  repeated ModifierSource modifiers = 9;
}

message SavingThrowRequest {
  string entity_id = 1;
  dnd.common.v1.Ability ability = 2;
  int32 dc = 3;
  bool has_advantage = 4;
  bool has_disadvantage = 5;
  bool is_magic = 6;            // For magic resistance
  optional string source_id = 7; // Caster/effect causing save
  optional uint64 seed = 8;
}

message SavingThrowResponse {
  bool success = 1;
  bool auto_fail = 2;           // Due to condition (e.g., paralyzed)
  string auto_fail_reason = 3;
  int32 natural_roll = 4;
  int32 modifier = 5;
  int32 total = 6;
  int32 dc = 7;
  bool is_proficient = 8;
  repeated ModifierSource modifiers = 9;
}

// ============ COMBAT ============

message AttackRequest {
  string attacker_id = 1;
  string target_id = 2;
  AttackType attack_type = 3;
  optional string weapon_id = 4;
  optional string spell_id = 5;
  bool has_advantage = 6;
  bool has_disadvantage = 7;
  repeated string bonus_sources = 8;
  optional uint64 seed = 9;
}

enum AttackType {
  ATTACK_TYPE_UNSPECIFIED = 0;
  ATTACK_TYPE_MELEE_WEAPON = 1;
  ATTACK_TYPE_RANGED_WEAPON = 2;
  ATTACK_TYPE_MELEE_SPELL = 3;
  ATTACK_TYPE_RANGED_SPELL = 4;
  ATTACK_TYPE_UNARMED = 5;
}

message AttackResponse {
  bool hits = 1;
  AttackRoll attack_roll = 2;
  int32 target_ac = 3;
  optional DamageResult damage = 4;
  repeated Effect effects_applied = 5;
}

message AttackRoll {
  int32 natural = 1;
  int32 modifier = 2;
  int32 total = 3;
  bool is_critical = 4;
  bool is_fumble = 5;
  bool had_advantage = 6;
  bool had_disadvantage = 7;
  repeated int32 all_rolls = 8;
  repeated ModifierSource modifiers = 9;
}

message DamageResult {
  repeated DamageRoll rolls = 1;
  int32 total = 2;
}

message DamageRoll {
  dnd.common.v1.DamageType type = 1;
  string dice = 2;              // "2d6"
  repeated int32 roll_results = 3;
  int32 modifier = 4;
  int32 subtotal = 5;
}

message Effect {
  string effect_type = 1;       // "condition", "damage_over_time", "buff"
  string effect_id = 2;
  map<string, string> parameters = 3;
}

message ApplyDamageRequest {
  string target_id = 1;
  repeated DamageInstance damages = 2;
  optional string source_id = 3;
}

message DamageInstance {
  int32 amount = 1;
  dnd.common.v1.DamageType type = 2;
  bool is_magical = 3;
}

message ApplyDamageResponse {
  int32 original_total = 1;
  int32 final_total = 2;
  int32 hp_before = 3;
  int32 hp_after = 4;
  bool is_unconscious = 5;
  bool is_dead = 6;
  repeated DamageModification modifications = 7;
}

message DamageModification {
  dnd.common.v1.DamageType type = 1;
  string modification = 2;      // "resistance", "immunity", "vulnerability"
  int32 original = 3;
  int32 final = 4;
}

message HealingRequest {
  string target_id = 1;
  string dice = 2;              // "2d8+3"
  optional string source_id = 3;
  optional uint64 seed = 4;
}

message HealingResponse {
  int32 amount_rolled = 1;
  int32 amount_healed = 2;      // May be less if at max HP
  int32 hp_before = 3;
  int32 hp_after = 4;
  int32 max_hp = 5;
}

// ============ SPELLCASTING ============

message ValidateSpellRequest {
  string caster_id = 1;
  string spell_id = 2;
  int32 slot_level = 3;
  repeated string target_ids = 4;
  optional dnd.common.v1.Position target_point = 5;
}

message ValidateSpellResponse {
  bool is_valid = 1;
  repeated ValidationError errors = 2;
}

message ValidationError {
  string code = 1;              // "NO_SPELL_SLOT", "OUT_OF_RANGE", "INVALID_TARGET"
  string message = 2;
}

message SpellCastRequest {
  string caster_id = 1;
  string spell_id = 2;
  int32 slot_level = 3;
  repeated string target_ids = 4;
  optional dnd.common.v1.Position target_point = 5;
  optional uint64 seed = 6;
}

message SpellCastResponse {
  bool success = 1;
  string spell_id = 2;
  int32 slot_used = 3;
  repeated SpellTargetResult target_results = 4;
  optional ConcentrationInfo concentration = 5;
}

message SpellTargetResult {
  string target_id = 1;
  optional SavingThrowResponse save = 2;
  optional int32 damage_taken = 3;
  optional int32 healing_received = 4;
  repeated dnd.common.v1.Condition conditions_applied = 5;
  repeated Effect effects_applied = 6;
}

message ConcentrationInfo {
  string spell_id = 1;
  int32 duration_rounds = 2;
  repeated string affected_targets = 3;
}

message ConcentrationCheckRequest {
  string caster_id = 1;
  int32 damage_taken = 2;
  optional uint64 seed = 3;
}

message ConcentrationCheckResponse {
  bool maintained = 1;
  int32 dc = 2;                 // Max of 10 or half damage
  SavingThrowResponse save_result = 3;
  optional string broken_spell_id = 4;
}

// ============ CONDITIONS ============

message ApplyConditionRequest {
  string target_id = 1;
  dnd.common.v1.Condition condition = 2;
  optional string source_id = 3;
  optional int32 duration_rounds = 4;
  optional SaveToEnd save_to_end = 5;
}

message SaveToEnd {
  dnd.common.v1.Ability ability = 1;
  int32 dc = 2;
  bool end_of_turn = 3;         // vs start of turn
}

message ApplyConditionResponse {
  bool applied = 1;
  bool already_had = 2;
  bool immune = 3;
  repeated ConditionEffect active_effects = 4;
}

message ConditionEffect {
  string effect_type = 1;       // "disadvantage_attacks", "speed_zero"
  string description = 2;
  map<string, string> parameters = 3;
}

message RemoveConditionRequest {
  string target_id = 1;
  dnd.common.v1.Condition condition = 2;
}

message RemoveConditionResponse {
  bool removed = 1;
  bool had_condition = 2;
}

message GetConditionEffectsRequest {
  string entity_id = 1;
}

message GetConditionEffectsResponse {
  repeated ActiveCondition conditions = 1;
  bool has_advantage_on_attacks = 2;
  bool has_disadvantage_on_attacks = 3;
  bool attacks_against_have_advantage = 4;
  bool attacks_against_have_disadvantage = 5;
  bool auto_fail_str_saves = 6;
  bool auto_fail_dex_saves = 7;
  bool is_incapacitated = 8;
  int32 speed_modifier = 9;     // 0, -50 (halved), -100 (zero)
}

message ActiveCondition {
  dnd.common.v1.Condition condition = 1;
  optional string source_id = 2;
  optional int32 rounds_remaining = 3;
  repeated ConditionEffect effects = 4;
}

// ============ INITIATIVE ============

message InitiativeRequest {
  repeated EntityInitiative entities = 1;
  optional uint64 seed = 2;
}

message EntityInitiative {
  string entity_id = 1;
  int32 dex_modifier = 2;
  bool has_advantage = 3;       // Alert feat, etc.
  optional int32 bonus = 4;     // Additional bonuses
}

message InitiativeResponse {
  repeated InitiativeResult results = 1;
}

message InitiativeResult {
  string entity_id = 1;
  int32 roll = 2;
  int32 modifier = 3;
  int32 total = 4;
  int32 order = 5;              // 1 = first, 2 = second, etc.
}

// ============ DEATH SAVES ============

message DeathSaveRequest {
  string entity_id = 1;
  bool has_advantage = 2;
  bool has_disadvantage = 3;
  optional uint64 seed = 4;
}

message DeathSaveResponse {
  int32 roll = 1;
  bool is_success = 2;
  bool is_critical_success = 3; // Nat 20 = regain 1 HP
  bool is_critical_failure = 4; // Nat 1 = 2 failures
  int32 total_successes = 5;
  int32 total_failures = 6;
  bool is_stable = 7;           // 3 successes
  bool is_dead = 8;             // 3 failures
  bool regained_consciousness = 9;
}
```

---

# 4. Grid Solver Service

```protobuf
// proto/grid/v1/grid.proto

syntax = "proto3";

package dnd.grid.v1;

option go_package = "github.com/dnd-platform/proto/grid/v1";

import "common/v1/types.proto";

service GridSolver {
  // Line of Sight
  rpc CheckLineOfSight(LineOfSightRequest) returns (LineOfSightResponse);
  rpc GetVisibleTiles(VisibleTilesRequest) returns (VisibleTilesResponse);
  
  // Cover
  rpc CalculateCover(CoverRequest) returns (CoverResponse);
  
  // AoE
  rpc GetAoETiles(AoERequest) returns (AoEResponse);
  
  // Pathfinding
  rpc FindPath(PathRequest) returns (PathResponse);
  rpc GetReachableTiles(ReachableRequest) returns (ReachableResponse);
}

// ============ LINE OF SIGHT ============

message LineOfSightRequest {
  dnd.common.v1.Position from = 1;
  dnd.common.v1.Position to = 2;
  string map_id = 3;
}

message LineOfSightResponse {
  bool has_line_of_sight = 1;
  repeated dnd.common.v1.Position blocking_tiles = 2;
  string blocking_reason = 3;   // "wall", "fog", "darkness"
}

message VisibleTilesRequest {
  dnd.common.v1.Position from = 1;
  int32 vision_radius = 2;      // In feet (e.g., 60 for darkvision)
  string vision_type = 3;       // "normal", "darkvision", "blindsight", "truesight"
  string map_id = 4;
}

message VisibleTilesResponse {
  repeated VisibleTile tiles = 1;
}

message VisibleTile {
  dnd.common.v1.Position position = 1;
  string visibility = 2;        // "bright", "dim", "dark"
  bool is_revealed = 3;
}

// ============ COVER ============

message CoverRequest {
  dnd.common.v1.Position attacker = 1;
  dnd.common.v1.Position target = 2;
  string map_id = 3;
}

message CoverResponse {
  dnd.common.v1.CoverType cover = 1;
  int32 ac_bonus = 2;           // 0, 2, 5
  int32 dex_save_bonus = 3;     // 0, 2, 5
  repeated CoverSource sources = 4;
}

message CoverSource {
  dnd.common.v1.Position position = 1;
  string type = 2;              // "wall", "creature", "object"
  dnd.common.v1.CoverType cover_provided = 3;
}

// ============ AREA OF EFFECT ============

message AoERequest {
  AoEShape shape = 1;
  dnd.common.v1.Position origin = 2;
  int32 size = 3;               // Radius/length in feet
  optional int32 width = 4;     // For lines
  optional Direction direction = 5; // For cones/lines
  string map_id = 6;
  bool spreads_around_corners = 7;
}

enum AoEShape {
  AOE_SHAPE_UNSPECIFIED = 0;
  AOE_SHAPE_SPHERE = 1;
  AOE_SHAPE_CUBE = 2;
  AOE_SHAPE_CONE = 3;
  AOE_SHAPE_LINE = 4;
  AOE_SHAPE_CYLINDER = 5;
}

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

message AoEResponse {
  repeated AoETile affected_tiles = 1;
  repeated AffectedEntity affected_entities = 2;
}

message AoETile {
  dnd.common.v1.Position position = 1;
  bool is_blocked = 2;          // By wall that stops spreading
  float distance_from_origin = 3;
}

message AffectedEntity {
  string entity_id = 1;
  dnd.common.v1.Position position = 2;
  dnd.common.v1.CoverType cover = 3;
}

// ============ PATHFINDING ============

message PathRequest {
  dnd.common.v1.Position from = 1;
  dnd.common.v1.Position to = 2;
  string entity_id = 3;         // For size/movement constraints
  int32 movement_budget = 4;    // In feet
  string map_id = 5;
  PathOptions options = 6;
}

message PathOptions {
  bool avoid_opportunity_attacks = 1;
  bool allow_difficult_terrain = 2;
  repeated string avoid_entity_ids = 3;
}

message PathResponse {
  bool path_found = 1;
  repeated PathStep steps = 2;
  int32 total_cost = 3;         // In feet
  bool uses_difficult_terrain = 4;
  repeated string opportunity_attack_from = 5;
}

message PathStep {
  dnd.common.v1.Position position = 1;
  int32 cost = 2;               // 5 or 10 (difficult)
  int32 cumulative_cost = 3;
  bool is_difficult_terrain = 4;
}

message ReachableRequest {
  dnd.common.v1.Position from = 1;
  int32 movement_budget = 2;
  string entity_id = 3;
  string map_id = 4;
  bool include_difficult_terrain = 5;
}

message ReachableResponse {
  repeated ReachableTile tiles = 1;
}

message ReachableTile {
  dnd.common.v1.Position position = 1;
  int32 movement_cost = 2;
  bool is_difficult_terrain = 3;
  bool provokes_opportunity_attack = 4;
}
```

---

# 5. AI Behavior Service

```protobuf
// proto/ai/v1/behavior.proto

syntax = "proto3";

package dnd.ai.v1;

option go_package = "github.com/dnd-platform/proto/ai/v1";

import "common/v1/types.proto";

service AIBehavior {
  // Decision making
  rpc DecideAction(DecideActionRequest) returns (DecideActionResponse);
  rpc EvaluateTargets(EvaluateTargetsRequest) returns (EvaluateTargetsResponse);
  
  // Triggers
  rpc CheckTriggers(CheckTriggersRequest) returns (CheckTriggersResponse);
  
  // Boss phases
  rpc GetBossPhase(BossPhaseRequest) returns (BossPhaseResponse);
}

message DecideActionRequest {
  string entity_id = 1;
  string behavior_profile = 2;  // "aggressive", "defensive", "tactical"
  CombatState combat_state = 3;
}

message CombatState {
  repeated EntityState entities = 1;
  string map_id = 2;
  int32 round_number = 3;
}

message EntityState {
  string entity_id = 1;
  dnd.common.v1.Position position = 2;
  int32 current_hp = 3;
  int32 max_hp = 4;
  bool is_ally = 5;
  repeated dnd.common.v1.Condition conditions = 6;
  bool has_used_action = 7;
  bool has_used_bonus_action = 8;
  bool has_used_reaction = 9;
  int32 remaining_movement = 10;
}

message DecideActionResponse {
  AIAction action = 1;
  string reasoning = 2;         // For debugging
  float confidence = 3;         // 0.0 - 1.0
}

message AIAction {
  ActionType type = 1;
  optional string target_id = 2;
  optional dnd.common.v1.Position target_position = 3;
  optional string ability_id = 4;
  optional string spell_id = 5;
}

enum ActionType {
  ACTION_TYPE_UNSPECIFIED = 0;
  ACTION_TYPE_ATTACK = 1;
  ACTION_TYPE_CAST_SPELL = 2;
  ACTION_TYPE_MOVE = 3;
  ACTION_TYPE_DASH = 4;
  ACTION_TYPE_DISENGAGE = 5;
  ACTION_TYPE_DODGE = 6;
  ACTION_TYPE_HIDE = 7;
  ACTION_TYPE_USE_ABILITY = 8;
  ACTION_TYPE_END_TURN = 9;
}

message EvaluateTargetsRequest {
  string entity_id = 1;
  repeated string potential_target_ids = 2;
  string evaluation_criteria = 3; // "lowest_hp", "nearest", "highest_threat"
  CombatState combat_state = 4;
}

message EvaluateTargetsResponse {
  repeated TargetEvaluation evaluations = 1;
  string recommended_target = 2;
}

message TargetEvaluation {
  string target_id = 1;
  float score = 2;
  repeated string factors = 3;  // ["low_hp", "isolated", "threatening"]
}

message CheckTriggersRequest {
  string entity_id = 1;
  TriggerEvent event = 2;
  CombatState combat_state = 3;
}

enum TriggerEvent {
  TRIGGER_EVENT_UNSPECIFIED = 0;
  TRIGGER_EVENT_TURN_START = 1;
  TRIGGER_EVENT_TURN_END = 2;
  TRIGGER_EVENT_TOOK_DAMAGE = 3;
  TRIGGER_EVENT_HP_BELOW_THRESHOLD = 4;
  TRIGGER_EVENT_ALLY_DIED = 5;
  TRIGGER_EVENT_PLAYER_ENTERED_AREA = 6;
  TRIGGER_EVENT_ROUND_NUMBER = 7;
}

message CheckTriggersResponse {
  repeated TriggeredAction triggered_actions = 1;
}

message TriggeredAction {
  string trigger_id = 1;
  AIAction action = 2;
  string dialogue = 3;          // Optional dialogue to display
}

message BossPhaseRequest {
  string boss_id = 1;
  int32 current_hp = 2;
  int32 max_hp = 3;
  int32 round_number = 4;
}

message BossPhaseResponse {
  int32 current_phase = 1;
  bool phase_changed = 2;
  repeated string new_abilities = 3;
  repeated string removed_abilities = 4;
  optional string phase_dialogue = 5;
  optional AIAction phase_action = 6;
}
```

---

# 6. Buf Configuration

```yaml
# proto/buf.yaml

version: v1
name: buf.build/dnd-platform/proto
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

```yaml
# proto/buf.gen.yaml

version: v1
managed:
  enabled: true
plugins:
  # TypeScript for Node.js services
  - plugin: buf.build/community/timostamm-protobuf-ts
    out: ../services/api-gateway/src/grpc/generated
    opt:
      - long_type_string
      - generate_dependencies
  
  # Rust for Rules Engine and Grid Solver
  - plugin: buf.build/community/neoeinstein-prost
    out: ../services/rules-engine/src/proto
  - plugin: buf.build/community/neoeinstein-tonic
    out: ../services/rules-engine/src/proto
```

---

# 7. Generation Script

```bash
#!/bin/bash
# scripts/generate-proto.sh

set -e

echo "Generating Protocol Buffer code..."

cd proto

# Install buf if not present
if ! command -v buf &> /dev/null; then
    echo "Installing buf..."
    npm install -g @bufbuild/buf
fi

# Lint proto files
buf lint

# Generate code
buf generate

# Copy Rust generated files to grid-solver as well
cp -r ../services/rules-engine/src/proto/* ../services/grid-solver/src/proto/

echo "Proto generation complete!"
```

---

# END OF PROTOCOL BUFFER DEFINITIONS
