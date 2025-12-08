# D&D Digital Board Game Platform
# Complete API Specifications
## Version 1.0 | Technical Reference Document

---

# Table of Contents

1. Authentication & Authorization API
2. Rules & Combat Engine API (gRPC)
3. Game State Server API
4. Realtime Gateway (WebSocket) API
5. Matchmaking & Party Service API
6. Content Service API
7. Campaign Builder API
8. Character Service API
9. Media Pipeline API
10. AoE/LoS/Cover Solver API (gRPC)
11. AI Behaviours & Scripting API (gRPC)
12. Analytics & Events API

---

# 1. Authentication & Authorization API

The Authentication service handles user identity, session management, and authorization tokens. All other services validate tokens against this service.

## 1.1 Base Configuration

```
Base URL: https://api.dndboard.game/v1/auth
Content-Type: application/json
```

## 1.2 Endpoints

### POST /register

Create a new user account.

**Request Body:**
```json
{
  "email": "player@example.com",
  "username": "hero_slayer",
  "password": "securePassword123!",
  "display_name": "Hero Slayer",
  "accepted_terms": true,
  "marketing_opt_in": false
}
```

**Response (201 Created):**
```json
{
  "user_id": "usr_a1b2c3d4e5f6",
  "email": "player@example.com",
  "username": "hero_slayer",
  "display_name": "Hero Slayer",
  "created_at": "2024-01-15T10:30:00Z",
  "email_verified": false
}
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `EMAIL_EXISTS` | Email address already registered |
| `USERNAME_TAKEN` | Username is already in use |
| `WEAK_PASSWORD` | Password does not meet security requirements (min 8 chars, 1 uppercase, 1 number, 1 special) |
| `TERMS_NOT_ACCEPTED` | User must accept terms of service |
| `INVALID_EMAIL` | Email format is invalid |

---

### POST /login

Authenticate user and obtain access tokens.

**Request Body:**
```json
{
  "email": "player@example.com",
  "password": "securePassword123!",
  "device_id": "device_xyz123",
  "platform": "web"
}
```

**Platform values:** `web`, `ios`, `android`, `desktop`

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "ref_a1b2c3d4e5f6g7h8i9j0",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "user_id": "usr_a1b2c3d4e5f6",
    "username": "hero_slayer",
    "display_name": "Hero Slayer",
    "avatar_url": "https://cdn.dndboard.game/avatars/usr_a1b2c3d4e5f6.png",
    "roles": ["player"],
    "entitlements": ["base_game", "expansion_pack_1"]
  }
}
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Email or password incorrect |
| `ACCOUNT_LOCKED` | Too many failed attempts, account temporarily locked |
| `ACCOUNT_BANNED` | Account has been banned |
| `EMAIL_NOT_VERIFIED` | Must verify email before logging in |

---

### POST /refresh

Refresh an expired access token using a valid refresh token.

**Request Body:**
```json
{
  "refresh_token": "ref_a1b2c3d4e5f6g7h8i9j0"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `INVALID_REFRESH_TOKEN` | Token is invalid or malformed |
| `REFRESH_TOKEN_EXPIRED` | Token has expired, must re-login |
| `REFRESH_TOKEN_REVOKED` | Token was revoked (logout or security event) |

---

### POST /logout

Invalidate current session and all associated tokens.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** `204 No Content`

---

### GET /me

Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "user_id": "usr_a1b2c3d4e5f6",
  "email": "player@example.com",
  "username": "hero_slayer",
  "display_name": "Hero Slayer",
  "avatar_url": "https://cdn.dndboard.game/avatars/usr_a1b2c3d4e5f6.png",
  "created_at": "2024-01-15T10:30:00Z",
  "last_login": "2024-03-20T14:22:00Z",
  "roles": ["player", "dm"],
  "entitlements": ["base_game", "expansion_pack_1"],
  "preferences": {
    "language": "en",
    "theme": "dark",
    "notifications_enabled": true,
    "dice_style": "3d_realistic",
    "auto_roll": false,
    "show_damage_numbers": true
  },
  "stats": {
    "games_played": 47,
    "games_dmed": 12,
    "characters_created": 8,
    "total_play_time_hours": 156
  }
}
```

---

### PUT /me

Update current user profile.

**Request Body:**
```json
{
  "display_name": "Hero Slayer Supreme",
  "avatar_url": "https://cdn.dndboard.game/avatars/custom/abc123.png",
  "preferences": {
    "language": "en",
    "theme": "dark",
    "notifications_enabled": false
  }
}
```

**Response (200 OK):** Updated user object

---

### POST /password/change

Change password for authenticated user.

**Request Body:**
```json
{
  "current_password": "oldPassword123!",
  "new_password": "newSecurePassword456!"
}
```

**Response:** `204 No Content`

---

### POST /password/reset/request

Request password reset email.

**Request Body:**
```json
{
  "email": "player@example.com"
}
```

**Response:** `202 Accepted` (always returns success to prevent email enumeration)

---

### POST /password/reset/confirm

Complete password reset with token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "new_password": "newSecurePassword456!"
}
```

**Response:** `204 No Content`

---

## 1.3 JWT Token Structure

Access tokens are RS256-signed JWTs with the following payload:

```json
{
  "sub": "usr_a1b2c3d4e5f6",
  "iss": "https://auth.dndboard.game",
  "aud": "dndboard-api",
  "exp": 1710936000,
  "iat": 1710932400,
  "jti": "jwt_unique_id_123",
  "roles": ["player", "dm"],
  "entitlements": ["base_game", "expansion_pack_1"],
  "session_id": "sess_xyz123"
}
```

**Token Validation Rules:**
- Verify RS256 signature against public key
- Check `iss` matches expected issuer
- Check `aud` contains service identifier
- Check `exp` > current time
- Check `iat` < current time (not issued in future)

---

# 2. Rules & Combat Engine API (gRPC)

The Rules Engine is the authoritative source for all RAW 5e mechanics. It processes combat commands, validates actions, and returns deterministic results. This is an internal gRPC service called by the Game State Server.

## 2.1 Service Configuration

```
Protocol: gRPC over HTTP/2
Service Address: rules-engine.internal:50051
Proto Package: dnd.rules.v1
```

## 2.2 Service Definition

```protobuf
syntax = "proto3";
package dnd.rules.v1;

service RulesEngine {
  // Dice Operations
  rpc RollDice(DiceRollRequest) returns (DiceRollResult);
  rpc RollWithAdvantage(DiceRollRequest) returns (DiceRollResult);
  
  // Ability Checks
  rpc ResolveAbilityCheck(AbilityCheckRequest) returns (CheckResult);
  rpc ResolveSkillCheck(SkillCheckRequest) returns (CheckResult);
  rpc ResolveSavingThrow(SavingThrowRequest) returns (CheckResult);
  rpc ResolveContestCheck(ContestRequest) returns (ContestResult);
  
  // Combat
  rpc ResolveAttack(AttackRequest) returns (AttackResult);
  rpc ResolveDamage(DamageRequest) returns (DamageResult);
  rpc ApplyHealing(HealingRequest) returns (HealingResult);
  rpc ResolveOpportunityAttack(OpportunityAttackRequest) returns (AttackResult);
  
  // Spellcasting
  rpc ValidateSpellCast(SpellCastRequest) returns (SpellValidation);
  rpc ResolveSpell(SpellCastRequest) returns (SpellResult);
  rpc ResolveConcentrationCheck(ConcentrationCheckRequest) returns (ConcentrationResult);
  
  // Conditions
  rpc ApplyCondition(ConditionRequest) returns (ConditionResult);
  rpc RemoveCondition(ConditionRemovalRequest) returns (ConditionResult);
  rpc CheckConditionEffects(ConditionQueryRequest) returns (ActiveConditions);
  rpc ProcessEndOfTurnConditions(EndTurnConditionRequest) returns (ConditionUpdates);
  
  // Turn Management
  rpc RollInitiative(InitiativeRequest) returns (InitiativeResult);
  rpc GetTurnOrder(TurnOrderRequest) returns (TurnOrder);
  rpc AdvanceTurn(AdvanceTurnRequest) returns (TurnState);
  rpc ProcessStartOfTurn(StartTurnRequest) returns (TurnEffects);
  rpc ProcessEndOfTurn(EndTurnRequest) returns (TurnEffects);
  
  // Death & Dying
  rpc ProcessDeathSave(DeathSaveRequest) returns (DeathSaveResult);
  rpc CheckInstantDeath(InstantDeathRequest) returns (InstantDeathResult);
  rpc Stabilize(StabilizeRequest) returns (StabilizeResult);
}
```

## 2.3 Core Message Types

### Dice Rolling

```protobuf
message DiceRollRequest {
  string roll_id = 1;
  string expression = 2;  // "2d6+4", "1d20", "8d6"
  RollContext context = 3;
  bool advantage = 4;
  bool disadvantage = 5;
  repeated Modifier bonuses = 6;
  repeated Modifier penalties = 7;
  int32 minimum_result = 8;  // For features like Reliable Talent
}

message RollContext {
  string actor_id = 1;
  string action_type = 2;  // "attack", "save", "check", "damage", "healing"
  string target_id = 3;
  string ability = 4;  // "STR", "DEX", etc.
  string skill = 5;    // "Athletics", "Perception", etc.
  map<string, string> metadata = 4;
}

message Modifier {
  string source = 1;      // "proficiency", "ability", "magic_weapon", "bless"
  int32 value = 2;
  bool is_dice = 3;       // true for things like Bless (1d4)
  string dice_expr = 4;   // "1d4" if is_dice
}

message DiceRollResult {
  string roll_id = 1;
  repeated DieResult individual_dice = 2;
  int32 total = 3;
  int32 natural_roll = 4;  // Before any modifiers
  bool critical_success = 5;  // Natural 20 on d20
  bool critical_failure = 6;  // Natural 1 on d20
  string expression_evaluated = 7;
  RollBreakdown breakdown = 8;
  int64 timestamp = 9;
  bytes random_seed = 10;  // For replay/verification
}

message DieResult {
  int32 sides = 1;
  int32 result = 2;
  bool kept = 3;       // For advantage/disadvantage
  bool rerolled = 4;   // For features like Lucky, Great Weapon Fighting
  int32 original = 5;  // Original roll if rerolled
}

message RollBreakdown {
  repeated string components = 1;  // ["d20: 15", "+5 STR", "+3 proficiency", "+1d4 Bless: 3"]
  string formula = 2;              // "15 + 5 + 3 + 3 = 26"
}
```

### Ability Checks

```protobuf
message AbilityCheckRequest {
  string check_id = 1;
  string actor_id = 2;
  Ability ability = 3;
  int32 dc = 4;
  bool advantage = 5;
  bool disadvantage = 6;
  repeated string active_conditions = 7;
  repeated Modifier additional_modifiers = 8;
}

enum Ability {
  STRENGTH = 0;
  DEXTERITY = 1;
  CONSTITUTION = 2;
  INTELLIGENCE = 3;
  WISDOM = 4;
  CHARISMA = 5;
}

message SkillCheckRequest {
  string check_id = 1;
  string actor_id = 2;
  Skill skill = 3;
  int32 dc = 4;
  bool advantage = 5;
  bool disadvantage = 6;
  repeated string active_conditions = 7;
  bool reliable_talent = 8;  // Treat rolls below 10 as 10
  bool jack_of_all_trades = 9;
  repeated Modifier additional_modifiers = 10;
}

enum Skill {
  ACROBATICS = 0;
  ANIMAL_HANDLING = 1;
  ARCANA = 2;
  ATHLETICS = 3;
  DECEPTION = 4;
  HISTORY = 5;
  INSIGHT = 6;
  INTIMIDATION = 7;
  INVESTIGATION = 8;
  MEDICINE = 9;
  NATURE = 10;
  PERCEPTION = 11;
  PERFORMANCE = 12;
  PERSUASION = 13;
  RELIGION = 14;
  SLEIGHT_OF_HAND = 15;
  STEALTH = 16;
  SURVIVAL = 17;
}

message CheckResult {
  string check_id = 1;
  bool success = 2;
  int32 margin = 3;        // How much over/under DC
  DiceRollResult roll = 4;
  int32 dc = 5;
  int32 total = 6;
  repeated string modifiers_applied = 7;
}

message SavingThrowRequest {
  string save_id = 1;
  string actor_id = 2;
  Ability ability = 3;
  int32 dc = 4;
  bool advantage = 5;
  bool disadvantage = 6;
  string source = 7;       // What caused the save (spell, trap, etc.)
  string source_id = 8;
  repeated string active_conditions = 9;
  bool magic_resistance = 10;  // Advantage on saves vs spells
  repeated Modifier additional_modifiers = 11;
}

message ContestRequest {
  string contest_id = 1;
  string actor_id = 2;
  string opponent_id = 3;
  Skill actor_skill = 4;
  Skill opponent_skill = 5;
  repeated string actor_conditions = 6;
  repeated string opponent_conditions = 7;
}

message ContestResult {
  string contest_id = 1;
  string winner_id = 2;
  bool tie = 3;
  CheckResult actor_result = 4;
  CheckResult opponent_result = 5;
}
```

### Combat - Attacks

```protobuf
message AttackRequest {
  string attack_id = 1;
  string attacker_id = 2;
  string target_id = 3;
  AttackType attack_type = 4;
  string weapon_id = 5;
  bool is_opportunity_attack = 6;
  bool is_bonus_action_attack = 7;
  repeated string attacker_conditions = 8;
  repeated string target_conditions = 9;
  CoverType target_cover = 10;
  int32 range_feet = 11;
  AttackModifiers modifiers = 12;
}

enum AttackType {
  MELEE_WEAPON = 0;
  RANGED_WEAPON = 1;
  MELEE_SPELL = 2;
  RANGED_SPELL = 3;
  UNARMED = 4;
}

enum CoverType {
  NONE = 0;
  HALF = 1;           // +2 AC
  THREE_QUARTERS = 2; // +5 AC
  TOTAL = 3;          // Cannot be targeted
}

message AttackModifiers {
  bool advantage = 1;
  bool disadvantage = 2;
  bool sharpshooter = 3;      // -5 attack, +10 damage
  bool great_weapon_master = 4;
  bool reckless_attack = 5;
  bool sneak_attack_eligible = 6;
  int32 sneak_attack_dice = 7;
  bool divine_smite = 8;
  int32 smite_slot_level = 9;
  repeated Modifier additional = 10;
}

message AttackResult {
  string attack_id = 1;
  bool hit = 2;
  bool critical = 3;
  bool fumble = 4;
  bool auto_hit = 5;   // For certain abilities
  bool auto_miss = 6;  // For certain conditions
  DiceRollResult attack_roll = 7;
  int32 target_ac = 8;
  int32 attack_total = 9;
  repeated string modifiers_applied = 10;
  DamageResult damage = 11;  // Populated if hit
  repeated TriggeredEffect triggered_effects = 12;
}

message TriggeredEffect {
  string effect_id = 1;
  string effect_type = 2;  // "sneak_attack", "divine_smite", "hex_damage"
  string description = 3;
  DamageResult additional_damage = 4;
  ConditionApplication condition = 5;
}
```

### Combat - Damage

```protobuf
message DamageRequest {
  string damage_id = 1;
  string source_id = 2;
  string target_id = 3;
  repeated DamageComponent damage_components = 4;
  bool is_critical = 5;
  bool half_on_save = 6;
  bool save_negates = 7;
  SavingThrowRequest required_save = 8;
  bool ignore_resistance = 9;
  bool treat_immunity_as_resistance = 10;
}

message DamageComponent {
  string dice_expression = 1;  // "2d6", "1d8+4"
  DamageType damage_type = 2;
  bool is_magical = 3;
  string source = 4;  // "weapon", "spell", "sneak_attack"
}

enum DamageType {
  ACID = 0;
  BLUDGEONING = 1;
  COLD = 2;
  FIRE = 3;
  FORCE = 4;
  LIGHTNING = 5;
  NECROTIC = 6;
  PIERCING = 7;
  POISON = 8;
  PSYCHIC = 9;
  RADIANT = 10;
  SLASHING = 11;
  THUNDER = 12;
}

message DamageResult {
  string damage_id = 1;
  int32 total_damage_rolled = 2;
  int32 damage_dealt = 3;  // After resistances/immunities
  repeated DamageBreakdown breakdown = 4;
  repeated ResistanceApplication resistances = 5;
  TargetHealthState target_state = 6;
  SavingThrowResult save_result = 7;  // If save was required
}

message DamageBreakdown {
  DamageType type = 1;
  int32 raw_damage = 2;
  int32 modified_damage = 3;
  DiceRollResult roll = 4;
  string source = 5;
}

message ResistanceApplication {
  DamageType type = 1;
  ResistanceLevel level = 2;
  int32 damage_before = 3;
  int32 damage_after = 4;
  string source = 5;  // What grants the resistance
}

enum ResistanceLevel {
  NORMAL = 0;
  RESISTANT = 1;   // Half damage (round down)
  IMMUNE = 2;      // No damage
  VULNERABLE = 3;  // Double damage
}

message TargetHealthState {
  string entity_id = 1;
  int32 previous_hp = 2;
  int32 current_hp = 3;
  int32 max_hp = 4;
  int32 temp_hp_used = 5;
  bool unconscious = 6;
  bool dead = 7;
  bool instant_death = 8;  // Massive damage rule
  int32 overkill_damage = 9;
}

message HealingRequest {
  string healing_id = 1;
  string source_id = 2;
  string target_id = 3;
  string dice_expression = 4;  // "2d8+4"
  HealingType healing_type = 5;
  bool cannot_heal = 6;  // For undead, constructs
}

enum HealingType {
  MAGICAL = 0;
  NATURAL = 1;  // Rest, hit dice
  TEMPORARY_HP = 2;
}

message HealingResult {
  string healing_id = 1;
  int32 healing_rolled = 2;
  int32 healing_applied = 3;  // May be capped at max HP
  int32 overhealing = 4;
  DiceRollResult roll = 5;
  TargetHealthState target_state = 6;
  bool target_stabilized = 7;
  bool target_regained_consciousness = 8;
}
```

### Spellcasting

```protobuf
message SpellCastRequest {
  string cast_id = 1;
  string caster_id = 2;
  string spell_id = 3;
  int32 slot_level = 4;  // 0 for cantrips
  repeated string target_ids = 5;
  Position target_point = 6;  // For AoE spells
  Direction target_direction = 7;  // For cones, lines
  SpellcastingClass casting_class = 8;
  map<string, string> spell_choices = 9;  // For spells with options
  bool is_ritual = 10;
  string material_component_source = 11;  // Item ID providing material
}

enum SpellcastingClass {
  BARD = 0;
  CLERIC = 1;
  DRUID = 2;
  PALADIN = 3;
  RANGER = 4;
  SORCERER = 5;
  WARLOCK = 6;
  WIZARD = 7;
  ARCANE_TRICKSTER = 8;
  ELDRITCH_KNIGHT = 9;
}

message Position {
  int32 x = 1;
  int32 y = 2;
  int32 z = 3;  // For flying, elevated terrain
}

message Direction {
  float angle_degrees = 1;  // 0 = North, 90 = East
}

message SpellValidation {
  bool valid = 1;
  repeated ValidationError errors = 2;
  SpellRequirements requirements = 3;
}

message ValidationError {
  string code = 1;
  string message = 2;
  string field = 3;
}

message SpellRequirements {
  bool has_verbal = 1;
  bool has_somatic = 2;
  bool has_material = 3;
  string material_component = 4;
  int32 material_cost_gp = 5;
  bool material_consumed = 6;
  bool requires_concentration = 7;
  int32 range_feet = 8;
  string casting_time = 9;
  int32 minimum_slot_level = 10;
}

message SpellResult {
  string cast_id = 1;
  bool success = 2;
  string failure_reason = 3;
  repeated SpellTargetResult target_results = 4;
  AoEResult aoe_result = 5;
  int32 slot_consumed = 6;
  ConcentrationState concentration = 7;
  string duration = 8;
  int32 duration_rounds = 9;
  repeated TriggeredEffect triggered_effects = 10;
  repeated VisualEffect visual_effects = 11;
}

message SpellTargetResult {
  string target_id = 1;
  bool affected = 2;
  string immunity_reason = 3;
  SavingThrowResult save_result = 4;
  DamageResult damage = 5;
  HealingResult healing = 6;
  repeated ConditionApplication conditions_applied = 7;
  repeated string effects_applied = 8;
}

message ConcentrationState {
  bool started = 1;
  string spell_id = 2;
  string spell_name = 3;
  string previous_concentration = 4;  // If replacing another spell
  int32 remaining_rounds = 5;
}

message ConcentrationCheckRequest {
  string check_id = 1;
  string caster_id = 2;
  int32 damage_taken = 3;
  repeated string active_conditions = 4;
  bool war_caster = 5;  // Advantage on concentration saves
}

message ConcentrationResult {
  string check_id = 1;
  bool maintained = 2;
  CheckResult save_result = 3;
  int32 dc = 4;  // max(10, damage/2)
  string broken_spell = 5;
  repeated string effects_ended = 6;
}

message AoEResult {
  repeated Position affected_tiles = 1;
  repeated string affected_entity_ids = 2;
  int32 total_targets = 3;
}
```

### Conditions

```protobuf
message ConditionRequest {
  string instance_id = 1;
  string target_id = 2;
  string source_id = 3;
  ConditionType condition_type = 4;
  Duration duration = 5;
  SaveToEnd save_to_end = 6;
  string frightened_source = 7;  // For frightened condition
  int32 exhaustion_level = 8;    // For exhaustion
  map<string, string> custom_params = 9;
}

enum ConditionType {
  // Standard 5e Conditions
  BLINDED = 0;
  CHARMED = 1;
  DEAFENED = 2;
  EXHAUSTION = 3;
  FRIGHTENED = 4;
  GRAPPLED = 5;
  INCAPACITATED = 6;
  INVISIBLE = 7;
  PARALYZED = 8;
  PETRIFIED = 9;
  POISONED = 10;
  PRONE = 11;
  RESTRAINED = 12;
  STUNNED = 13;
  UNCONSCIOUS = 14;
  
  // Game-specific conditions
  CONCENTRATING = 15;
  RAGING = 16;
  HUNTERS_MARK = 17;
  HEX = 18;
  BLESSED = 19;
  BANED = 20;
  HASTED = 21;
  SLOWED = 22;
  DODGING = 23;
  HIDDEN = 24;
  SURPRISED = 25;
}

message SaveToEnd {
  Ability ability = 1;
  int32 dc = 2;
  SaveTiming timing = 3;
}

enum SaveTiming {
  END_OF_TURN = 0;
  START_OF_TURN = 1;
  BOTH = 2;
}

message Duration {
  DurationType type = 1;
  int32 value = 2;
  string end_trigger = 3;  // Custom end condition
}

enum DurationType {
  INSTANTANEOUS = 0;
  ROUNDS = 1;
  MINUTES = 2;
  HOURS = 3;
  UNTIL_DISPELLED = 4;
  UNTIL_LONG_REST = 5;
  UNTIL_SHORT_REST = 6;
  SPECIAL = 7;
}

message ConditionResult {
  bool applied = 1;
  string condition_instance_id = 2;
  repeated ConditionEffect active_effects = 3;
  bool immune = 4;
  string immunity_reason = 5;
  repeated string stacking_info = 6;  // For exhaustion
}

message ConditionEffect {
  string effect_type = 1;
  string description = 2;
  map<string, string> modifiers = 3;
}

message ConditionRemovalRequest {
  string condition_instance_id = 1;
  string target_id = 2;
  string removal_reason = 3;  // "save_success", "spell_ended", "dispelled"
}

message ActiveConditions {
  string entity_id = 1;
  repeated ActiveCondition conditions = 2;
}

message ActiveCondition {
  string instance_id = 1;
  ConditionType type = 2;
  string source_id = 3;
  int32 remaining_rounds = 4;
  SaveToEnd save_to_end = 5;
  repeated ConditionEffect effects = 6;
}

message ConditionUpdates {
  repeated string conditions_removed = 1;
  repeated string conditions_remaining = 2;
  repeated SavingThrowResult saves_made = 3;
}
```

### Initiative & Turn Management

```protobuf
message InitiativeRequest {
  string combat_id = 1;
  repeated Combatant combatants = 2;
}

message Combatant {
  string entity_id = 1;
  string name = 2;
  int32 dexterity_score = 3;
  int32 dexterity_modifier = 4;
  int32 initiative_bonus = 5;  // Beyond DEX (e.g., Alert feat, Jack of All Trades)
  bool advantage = 6;
  CombatantType type = 7;
  int32 group_id = 8;  // For grouped initiative (all goblins roll once)
}

enum CombatantType {
  PLAYER_CHARACTER = 0;
  NPC_ALLY = 1;
  MONSTER = 2;
  LAIR = 3;
  LEGENDARY = 4;
}

message InitiativeResult {
  string combat_id = 1;
  repeated InitiativeEntry entries = 2;
}

message InitiativeEntry {
  string entity_id = 1;
  int32 initiative_total = 2;
  DiceRollResult roll = 3;
  int32 tiebreaker = 4;  // DEX score for ties
  int32 secondary_tiebreaker = 5;  // Random for same DEX
}

message TurnOrderRequest {
  string combat_id = 1;
}

message TurnOrder {
  string combat_id = 1;
  int32 current_round = 2;
  int32 current_turn_index = 3;
  string current_entity_id = 4;
  repeated TurnEntry turns = 5;
  repeated ScheduledAction lair_actions = 6;
  repeated ScheduledAction legendary_actions = 7;
}

message TurnEntry {
  int32 order = 1;
  string entity_id = 2;
  string name = 3;
  int32 initiative = 4;
  bool has_acted = 5;
  bool delayed = 6;
  bool readied_action = 7;
  TurnResources resources = 8;
}

message TurnResources {
  bool action_available = 1;
  bool bonus_action_available = 2;
  bool reaction_available = 3;
  int32 movement_remaining = 4;
  int32 movement_total = 5;
  bool free_object_interaction = 6;
  int32 extra_attacks_remaining = 7;
}

message ScheduledAction {
  string entity_id = 1;
  int32 initiative_count = 2;  // 20 for lair actions
  string action_type = 3;
  int32 uses_remaining = 4;
}

message AdvanceTurnRequest {
  string combat_id = 1;
  string current_entity_id = 2;
}

message TurnState {
  string combat_id = 1;
  int32 round = 2;
  string previous_entity = 3;
  string current_entity = 4;
  TurnResources current_resources = 5;
  repeated TurnEffect start_of_turn_effects = 6;
  bool combat_ended = 7;
  string combat_end_reason = 8;
}

message TurnEffect {
  string effect_type = 1;
  string description = 2;
  DamageResult damage = 3;
  HealingResult healing = 4;
  repeated string conditions_ended = 5;
  repeated SavingThrowResult saves_made = 6;
}

message StartTurnRequest {
  string combat_id = 1;
  string entity_id = 2;
}

message EndTurnRequest {
  string combat_id = 1;
  string entity_id = 2;
}

message TurnEffects {
  repeated TurnEffect effects = 1;
  repeated string conditions_expired = 2;
  repeated string effects_triggered = 3;
}
```

### Death & Dying

```protobuf
message DeathSaveRequest {
  string save_id = 1;
  string entity_id = 2;
  repeated string active_conditions = 3;
  bool advantage = 4;  // From features
  bool disadvantage = 5;  // From conditions
  repeated Modifier modifiers = 6;
}

message DeathSaveResult {
  string save_id = 1;
  DiceRollResult roll = 2;
  bool success = 3;
  bool critical_success = 4;  // Natural 20 - regain 1 HP
  bool critical_failure = 5;   // Natural 1 - two failures
  DeathSaveState new_state = 6;
}

message DeathSaveState {
  string entity_id = 1;
  int32 successes = 2;
  int32 failures = 3;
  bool stabilized = 4;
  bool dead = 5;
  bool regained_consciousness = 6;
  int32 current_hp = 7;
}

message InstantDeathRequest {
  string entity_id = 1;
  int32 damage_taken = 2;
  int32 current_hp = 3;
  int32 max_hp = 4;
}

message InstantDeathResult {
  bool instant_death = 1;
  int32 overkill_amount = 2;  // How much over max HP
  string reason = 3;
}

message StabilizeRequest {
  string stabilize_id = 1;
  string healer_id = 2;
  string target_id = 3;
  StabilizeMethod method = 4;
}

enum StabilizeMethod {
  MEDICINE_CHECK = 0;
  SPARE_THE_DYING = 1;
  HEALERS_KIT = 2;
  HEALING_SPELL = 3;
}

message StabilizeResult {
  string stabilize_id = 1;
  bool success = 2;
  CheckResult medicine_check = 3;
  DeathSaveState target_state = 4;
}
```

---

# 3. Game State Server API

The Game State Server maintains the authoritative state for active game sessions. It receives commands from clients via the Realtime Gateway, validates them, calls the Rules Engine, and broadcasts state deltas to all connected clients.

## 3.1 Session Management (REST)

**Base URL:** `https://api.dndboard.game/v1/sessions`

### POST /sessions

Create a new game session.

**Request:**
```json
{
  "campaign_id": "camp_abc123",
  "encounter_id": "enc_xyz789",
  "dm_user_id": "usr_dm001",
  "session_type": "combat",
  "max_players": 6,
  "settings": {
    "allow_spectators": true,
    "turn_timer_seconds": 120,
    "auto_roll_monsters": true,
    "fog_of_war_enabled": true,
    "grid_snap": true,
    "show_monster_hp": "dm_only",
    "critical_hit_rule": "double_dice",
    "flanking_enabled": false,
    "dm_override_enabled": true
  }
}
```

**Session Types:** `combat`, `exploration`, `social`, `mixed`

**Response (201 Created):**
```json
{
  "session_id": "sess_a1b2c3d4",
  "join_code": "DRAGON42",
  "state": "LOBBY",
  "created_at": "2024-03-20T10:00:00Z",
  "websocket_url": "wss://rt.dndboard.game/sessions/sess_a1b2c3d4",
  "rest_url": "https://api.dndboard.game/v1/sessions/sess_a1b2c3d4",
  "expires_at": "2024-03-20T22:00:00Z"
}
```

**Session States:**
- `LOBBY` - Waiting for players
- `LOADING` - Loading assets, preparing scene
- `ACTIVE` - Game in progress
- `PAUSED` - DM paused the session
- `ENDED` - Session complete

---

### GET /sessions/{session_id}

Get current session state snapshot.

**Response:**
```json
{
  "session_id": "sess_a1b2c3d4",
  "state": "ACTIVE",
  "round": 3,
  "current_scene": {
    "scene_id": "scene_001",
    "map_id": "map_goblin_cave",
    "name": "Goblin Cave Entrance",
    "grid": {
      "width": 30,
      "height": 20,
      "tile_size_feet": 5
    },
    "lighting": {
      "ambient": "dim",
      "time_of_day": "night"
    }
  },
  "entities": [
    {
      "entity_id": "ent_pc001",
      "type": "PLAYER_CHARACTER",
      "name": "Thorin Ironforge",
      "owner_id": "usr_player1",
      "position": {"x": 5, "y": 10, "z": 0},
      "facing": 90,
      "visible_to": ["all"],
      "token": {
        "image_url": "https://cdn.dndboard.game/tokens/char_hero001.png",
        "size": "MEDIUM",
        "color_ring": "#3b82f6"
      },
      "stats": {
        "current_hp": 45,
        "max_hp": 52,
        "temp_hp": 0,
        "ac": 18,
        "speed": 25,
        "initiative": 18
      },
      "conditions": [
        {
          "type": "BLESSED",
          "instance_id": "cond_001",
          "remaining_rounds": 8,
          "source": "ent_pc002"
        }
      ],
      "resources": {
        "action": true,
        "bonus_action": true,
        "reaction": true,
        "movement": 25
      },
      "spell_slots": {
        "1": {"used": 1, "max": 4},
        "2": {"used": 0, "max": 3}
      }
    },
    {
      "entity_id": "ent_goblin1",
      "type": "MONSTER",
      "name": "Goblin",
      "owner_id": null,
      "position": {"x": 15, "y": 8, "z": 0},
      "visible_to": ["dm", "ent_pc001"],
      "stats": {
        "current_hp": 7,
        "max_hp": 7,
        "ac": 15,
        "speed": 30,
        "initiative": 15
      },
      "conditions": []
    }
  ],
  "combat": {
    "active": true,
    "round": 3,
    "turn_index": 0,
    "current_turn": "ent_pc001",
    "initiative_order": [
      {"entity_id": "ent_pc001", "initiative": 18, "name": "Thorin"},
      {"entity_id": "ent_goblin1", "initiative": 15, "name": "Goblin"},
      {"entity_id": "ent_pc002", "initiative": 12, "name": "Elara"}
    ],
    "turn_timer": {
      "enabled": true,
      "seconds_remaining": 95,
      "total_seconds": 120
    }
  },
  "fog_of_war": {
    "enabled": true,
    "explored_tiles": [[5,10], [6,10], [5,11], [6,11]],
    "currently_visible": [[5,10], [6,10]],
    "vision_sources": [
      {
        "entity_id": "ent_pc001",
        "position": {"x": 5, "y": 10},
        "radius": 60,
        "type": "darkvision",
        "blocked_by_walls": true
      }
    ]
  },
  "effects": [
    {
      "effect_id": "eff_001",
      "type": "AREA_EFFECT",
      "name": "Darkness",
      "position": {"x": 12, "y": 12},
      "radius": 15,
      "visual": "magical_darkness",
      "remaining_rounds": 5
    }
  ],
  "combat_log": [
    {
      "timestamp": "2024-03-20T10:05:30Z",
      "round": 3,
      "type": "ATTACK",
      "actor": "Thorin",
      "target": "Goblin",
      "text": "Thorin attacks Goblin with Longsword. Attack roll: 23 vs AC 15. Hit! Damage: 12 slashing.",
      "details": {
        "attack_roll": {"natural": 15, "total": 23},
        "damage": {"total": 12, "type": "slashing"}
      }
    }
  ]
}
```

---

### POST /sessions/{session_id}/end

End the session.

**Request:**
```json
{
  "reason": "completed",
  "save_state": true
}
```

**Reasons:** `completed`, `dm_ended`, `timeout`, `error`

---

## 3.2 Command Processing (Internal gRPC)

Commands received via WebSocket are processed by this internal service.

```protobuf
syntax = "proto3";
package dnd.gamestate.v1;

service GameStateService {
  // Entity Actions
  rpc ProcessMoveCommand(MoveCommand) returns (MoveResult);
  rpc ProcessAttackCommand(AttackCommand) returns (CombatResult);
  rpc ProcessCastSpellCommand(CastSpellCommand) returns (CombatResult);
  rpc ProcessUseAbilityCommand(UseAbilityCommand) returns (AbilityResult);
  rpc ProcessInteractCommand(InteractCommand) returns (InteractionResult);
  
  // Standard Actions
  rpc ProcessDashAction(DashCommand) returns (ActionResult);
  rpc ProcessDisengageAction(DisengageCommand) returns (ActionResult);
  rpc ProcessDodgeAction(DodgeCommand) returns (ActionResult);
  rpc ProcessHelpAction(HelpCommand) returns (ActionResult);
  rpc ProcessHideAction(HideCommand) returns (StealthResult);
  rpc ProcessReadyAction(ReadyCommand) returns (ReadyResult);
  rpc ProcessSearchAction(SearchCommand) returns (SearchResult);
  rpc ProcessUseObjectAction(UseObjectCommand) returns (ActionResult);
  
  // Turn Management
  rpc EndTurn(EndTurnCommand) returns (TurnTransition);
  rpc DelayTurn(DelayTurnCommand) returns (TurnTransition);
  
  // Reactions
  rpc ProcessReaction(ReactionCommand) returns (ReactionResult);
  rpc DeclineReaction(DeclineReactionCommand) returns (ReactionResult);
  
  // DM Controls
  rpc DMOverrideHP(HPOverrideCommand) returns (EntityUpdate);
  rpc DMOverridePosition(PositionOverrideCommand) returns (EntityUpdate);
  rpc DMForceRoll(ForceRollCommand) returns (DiceRollResult);
  rpc DMSetRollResult(SetRollCommand) returns (DiceRollResult);
  rpc DMAddEntity(AddEntityCommand) returns (EntityAdded);
  rpc DMRemoveEntity(RemoveEntityCommand) returns (EntityRemoved);
  rpc DMApplyCondition(DMConditionCommand) returns (ConditionResult);
  rpc DMRemoveCondition(DMRemoveConditionCommand) returns (ConditionResult);
  rpc DMModifyInitiative(ModifyInitiativeCommand) returns (TurnOrder);
  rpc DMEndCombat(EndCombatCommand) returns (CombatEnded);
  rpc DMPauseSession(PauseCommand) returns (SessionState);
  rpc DMResumeSession(ResumeCommand) returns (SessionState);
  
  // State Queries
  rpc GetValidMoves(ValidMovesQuery) returns (ValidMovesList);
  rpc GetValidTargets(ValidTargetsQuery) returns (ValidTargetsList);
  rpc GetValidActions(ValidActionsQuery) returns (ValidActionsList);
  rpc GetLineOfSight(LoSQuery) returns (LoSResult);
  rpc GetEntityState(EntityStateQuery) returns (EntityState);
}
```

### Move Command

```protobuf
message MoveCommand {
  string command_id = 1;
  string session_id = 2;
  string entity_id = 3;
  repeated Position path = 4;
  MoveType move_type = 5;
}

enum MoveType {
  NORMAL = 0;
  TELEPORT = 1;
  FORCED = 2;  // Push, pull effects
  PRONE_CRAWL = 3;
}

message MoveResult {
  string command_id = 1;
  bool success = 2;
  Position final_position = 3;
  repeated Position actual_path = 4;
  int32 movement_used = 5;
  int32 movement_remaining = 6;
  repeated string errors = 7;
  repeated TriggeredEvent triggered_events = 8;
  repeated OpportunityAttackResult opportunity_attacks = 9;
}

message TriggeredEvent {
  string event_id = 1;
  string event_type = 2;  // "trap", "hazard", "trigger", "enter_area"
  Position trigger_position = 3;
  string description = 4;
  repeated Effect effects = 5;
}

message OpportunityAttackResult {
  string attacker_id = 1;
  string target_id = 2;
  Position trigger_position = 3;
  bool attack_taken = 4;
  AttackResult result = 5;
}
```

### State Delta Broadcasting

After processing commands, the server broadcasts state deltas:

```protobuf
message StateDelta {
  string session_id = 1;
  int64 sequence_number = 2;
  int64 timestamp = 3;
  string caused_by_command = 4;
  string caused_by_user = 5;
  
  repeated EntityDelta entity_changes = 6;
  repeated TileDelta tile_changes = 7;
  CombatDelta combat_change = 8;
  repeated LogEntry combat_log = 9;
  repeated VisualEffect visual_effects = 10;
  repeated AudioCue audio_cues = 11;
  repeated Notification notifications = 12;
}

message EntityDelta {
  string entity_id = 1;
  DeltaType type = 2;
  
  // Only changed fields are populated
  optional Position position = 3;
  optional int32 current_hp = 4;
  optional int32 temp_hp = 5;
  optional int32 ac = 6;
  repeated ConditionDelta conditions = 7;
  optional TurnResources resources = 8;
  optional bool visible = 9;
  optional DeathSaveState death_saves = 10;
  map<string, SpellSlotChange> spell_slots = 11;
  repeated string features_used = 12;
}

enum DeltaType {
  ADDED = 0;
  MODIFIED = 1;
  REMOVED = 2;
}

message ConditionDelta {
  ConditionChangeType change = 1;
  string condition_instance_id = 2;
  ConditionType type = 3;
  int32 remaining_rounds = 4;
}

enum ConditionChangeType {
  ADDED = 0;
  UPDATED = 1;
  REMOVED = 2;
}

message VisualEffect {
  string effect_id = 1;
  string effect_type = 2;  // "fireball", "healing_word", "critical_hit", "miss"
  Position origin = 3;
  Position target = 4;
  repeated Position area = 5;
  string animation_id = 6;
  float duration_seconds = 7;
  string color = 8;
  float intensity = 9;
  map<string, string> parameters = 10;
}

message AudioCue {
  string cue_id = 1;
  string sound_id = 2;  // "sword_hit", "spell_fire", "death_scream"
  Position source = 3;
  float volume = 4;
  bool spatial = 5;
  float delay_ms = 6;
}

message LogEntry {
  int64 timestamp = 1;
  int32 round = 2;
  string log_type = 3;  // "ATTACK", "DAMAGE", "HEAL", "CONDITION", "MOVEMENT", "SPELL"
  string actor_id = 4;
  string actor_name = 5;
  string target_id = 6;
  string target_name = 7;
  string text = 8;
  string visibility = 9;  // "all", "dm_only", "actor_only"
  map<string, string> details = 10;
}
```

---

Continue in Part 2...
