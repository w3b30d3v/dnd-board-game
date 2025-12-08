# D&D Digital Board Game Platform
# Document 25: Complete Prisma Schema

---

# 1. Overview

This document contains the complete `prisma/schema.prisma` file ready for direct use. Copy this entire schema to your project.

---

# 2. Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// AUTHENTICATION & USERS
// ============================================================================

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  emailVerified   Boolean   @default(false) @map("email_verified")
  username        String    @unique
  displayName     String    @map("display_name")
  passwordHash    String?   @map("password_hash")
  avatarUrl       String?   @map("avatar_url")
  
  // OAuth providers
  googleId        String?   @unique @map("google_id")
  discordId       String?   @unique @map("discord_id")
  appleId         String?   @unique @map("apple_id")
  
  // Account status
  status          UserStatus @default(ACTIVE)
  role            UserRole   @default(USER)
  
  // Preferences stored as JSON
  preferences     Json       @default("{}")
  
  // Timestamps
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")
  lastLoginAt     DateTime?  @map("last_login_at")
  deletedAt       DateTime?  @map("deleted_at")
  
  // Relations
  sessions        UserSession[]
  characters      Character[]
  ownedCampaigns  Campaign[]       @relation("CampaignOwner")
  gameSessions    GameSessionPlayer[]
  chatMessages    ChatMessage[]
  mediaAssets     MediaAsset[]
  
  @@map("users")
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
  DELETED
}

enum UserRole {
  USER
  PREMIUM
  CREATOR
  MODERATOR
  ADMIN
}

model UserSession {
  id              String    @id @default(cuid())
  userId          String    @map("user_id")
  refreshTokenHash String   @unique @map("refresh_token_hash")
  deviceId        String?   @map("device_id")
  platform        Platform?
  ipAddress       String?   @map("ip_address")
  userAgent       String?   @map("user_agent")
  
  createdAt       DateTime  @default(now()) @map("created_at")
  expiresAt       DateTime  @map("expires_at")
  revokedAt       DateTime? @map("revoked_at")
  
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([expiresAt])
  @@map("user_sessions")
}

enum Platform {
  WEB
  IOS
  ANDROID
  DESKTOP
}

model PasswordResetToken {
  id          String    @id @default(cuid())
  userId      String    @map("user_id")
  tokenHash   String    @unique @map("token_hash")
  createdAt   DateTime  @default(now()) @map("created_at")
  expiresAt   DateTime  @map("expires_at")
  usedAt      DateTime? @map("used_at")
  
  @@map("password_reset_tokens")
}

// ============================================================================
// CHARACTERS
// ============================================================================

model Character {
  id                String    @id @default(cuid())
  userId            String    @map("user_id")
  name              String
  
  // Core identity
  race              String
  subrace           String?
  characterClass    String    @map("class")
  subclass          String?
  background        String
  alignment         String?
  
  // Progression
  level             Int       @default(1)
  experiencePoints  Int       @default(0) @map("experience_points")
  
  // Ability scores
  strength          Int
  dexterity         Int
  constitution      Int
  intelligence      Int
  wisdom            Int
  charisma          Int
  
  // Health
  maxHitPoints      Int       @map("max_hit_points")
  currentHitPoints  Int       @map("current_hit_points")
  tempHitPoints     Int       @default(0) @map("temp_hit_points")
  hitDice           Json      @default("{}") @map("hit_dice")
  deathSaves        Json      @default("{\"successes\":0,\"failures\":0}") @map("death_saves")
  
  // Combat stats
  armorClass        Int       @map("armor_class")
  initiative        Int       @default(0)
  speed             Int       @default(30)
  proficiencyBonus  Int       @map("proficiency_bonus")
  
  // Proficiencies (arrays)
  savingThrows      String[]  @map("saving_throws")
  skills            String[]
  tools             String[]
  weapons           String[]
  armor             String[]
  languages         String[]
  
  // Features
  features          Json      @default("[]")
  traits            String[]
  
  // Spellcasting
  spellcastingAbility String? @map("spellcasting_ability")
  spellSlots        Json?     @map("spell_slots")
  spellsKnown       String[]  @map("spells_known")
  spellsPrepared    String[]  @map("spells_prepared")
  concentratingOn   String?   @map("concentrating_on")
  
  // Equipment & Inventory
  equipment         Json      @default("[]")
  inventory         Json      @default("[]")
  currency          Json      @default("{\"cp\":0,\"sp\":0,\"gp\":0,\"pp\":0}")
  attunedItems      String[]  @map("attuned_items")
  
  // Appearance
  portraitUrl       String?   @map("portrait_url")
  tokenUrl          String?   @map("token_url")
  appearance        Json?
  personality       Json?
  backstory         String?
  
  // Status
  isPublic          Boolean   @default(false) @map("is_public")
  isRetired         Boolean   @default(false) @map("is_retired")
  
  // Timestamps
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  
  // Relations
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  gameParticipations GameSessionPlayer[]
  
  @@index([userId])
  @@index([isPublic])
  @@map("characters")
}

// ============================================================================
// CAMPAIGNS
// ============================================================================

model Campaign {
  id              String    @id @default(cuid())
  ownerId         String    @map("owner_id")
  
  // Basic info
  name            String
  description     String?
  coverImageUrl   String?   @map("cover_image_url")
  
  // Settings
  levelRange      Json      @default("{\"min\":1,\"max\":20}") @map("level_range")
  setting         String?
  tags            String[]
  
  // Status
  status          CampaignStatus @default(DRAFT)
  visibility      Visibility     @default(PRIVATE)
  
  // Content references
  startingMapId   String?   @map("starting_map_id")
  
  // Publishing
  publishedAt     DateTime? @map("published_at")
  version         Int       @default(1)
  
  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  // Relations
  owner           User      @relation("CampaignOwner", fields: [ownerId], references: [id])
  maps            Map[]
  encounters      Encounter[]
  dialogues       Dialogue[]
  cutscenes       Cutscene[]
  quests          Quest[]
  gameSessions    GameSession[]
  
  @@index([ownerId])
  @@index([status, visibility])
  @@map("campaigns")
}

enum CampaignStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  DEPRECATED
}

enum Visibility {
  PRIVATE
  UNLISTED
  PUBLIC
}

// ============================================================================
// MAPS
// ============================================================================

model Map {
  id              String    @id @default(cuid())
  campaignId      String    @map("campaign_id")
  
  // Basic info
  name            String
  description     String?
  
  // Grid settings
  gridWidth       Int       @map("grid_width")
  gridHeight      Int       @map("grid_height")
  tileSize        Int       @default(64) @map("tile_size")
  
  // Tile data (stored as compressed JSON)
  tiles           Json      @default("[]")
  
  // Environment
  backgroundUrl   String?   @map("background_url")
  ambientLight    String    @default("normal") @map("ambient_light")
  ambientSound    String?   @map("ambient_sound")
  weatherEffect   String?   @map("weather_effect")
  
  // Metadata
  sortOrder       Int       @default(0) @map("sort_order")
  
  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  // Relations
  campaign        Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  objects         MapObject[]
  spawnPoints     SpawnPoint[]
  triggers        MapTrigger[]
  lightSources    LightSource[]
  
  @@index([campaignId])
  @@map("maps")
}

model MapObject {
  id              String    @id @default(cuid())
  mapId           String    @map("map_id")
  
  // Position
  x               Int
  y               Int
  width           Int       @default(1)
  height          Int       @default(1)
  rotation        Int       @default(0)
  
  // Type and appearance
  objectType      MapObjectType @map("object_type")
  assetId         String?   @map("asset_id")
  tint            String?
  
  // Properties
  blocksMovement  Boolean   @default(false) @map("blocks_movement")
  blocksVision    Boolean   @default(false) @map("blocks_vision")
  isInteractable  Boolean   @default(false) @map("is_interactable")
  interactionData Json?     @map("interaction_data")
  
  // For doors
  isOpen          Boolean   @default(false) @map("is_open")
  isLocked        Boolean   @default(false) @map("is_locked")
  lockDC          Int?      @map("lock_dc")
  keyId           String?   @map("key_id")
  
  map             Map       @relation(fields: [mapId], references: [id], onDelete: Cascade)
  
  @@index([mapId])
  @@map("map_objects")
}

enum MapObjectType {
  WALL
  DOOR
  CHEST
  TRAP
  FURNITURE
  PROP
  DECORATION
}

model SpawnPoint {
  id              String    @id @default(cuid())
  mapId           String    @map("map_id")
  
  x               Int
  y               Int
  spawnType       SpawnType @map("spawn_type")
  label           String?
  
  map             Map       @relation(fields: [mapId], references: [id], onDelete: Cascade)
  
  @@index([mapId])
  @@map("spawn_points")
}

enum SpawnType {
  PLAYER
  MONSTER
  NPC
  OBJECTIVE
}

model LightSource {
  id              String    @id @default(cuid())
  mapId           String    @map("map_id")
  
  x               Int
  y               Int
  radius          Int       @default(20)
  dimRadius       Int       @default(40) @map("dim_radius")
  color           String    @default("#FFAA00")
  intensity       Float     @default(1.0)
  flickering      Boolean   @default(false)
  
  map             Map       @relation(fields: [mapId], references: [id], onDelete: Cascade)
  
  @@index([mapId])
  @@map("light_sources")
}

model MapTrigger {
  id              String    @id @default(cuid())
  mapId           String    @map("map_id")
  
  // Trigger area
  x               Int
  y               Int
  width           Int       @default(1)
  height          Int       @default(1)
  
  // Trigger config
  triggerType     TriggerType @map("trigger_type")
  conditions      Json      @default("[]")
  actions         Json      @default("[]")
  
  // Flags
  oneShot         Boolean   @default(false) @map("one_shot")
  enabled         Boolean   @default(true)
  
  map             Map       @relation(fields: [mapId], references: [id], onDelete: Cascade)
  
  @@index([mapId])
  @@map("map_triggers")
}

enum TriggerType {
  ON_ENTER
  ON_EXIT
  ON_ROUND_START
  ON_ROUND_END
  ON_COMBAT_START
  ON_COMBAT_END
  MANUAL
}

// ============================================================================
// ENCOUNTERS
// ============================================================================

model Encounter {
  id              String    @id @default(cuid())
  campaignId      String    @map("campaign_id")
  mapId           String?   @map("map_id")
  
  name            String
  description     String?
  
  // Creatures in encounter
  creatures       Json      @default("[]")  // Array of creature placements
  
  // Difficulty
  difficulty      EncounterDifficulty?
  xpBudget        Int?      @map("xp_budget")
  adjustedXp      Int?      @map("adjusted_xp")
  
  // Environment
  terrain         Json      @default("[]")
  hazards         Json      @default("[]")
  lairActions     Json?     @map("lair_actions")
  
  // Rewards
  rewards         Json      @default("{}")
  
  campaign        Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  @@index([campaignId])
  @@map("encounters")
}

enum EncounterDifficulty {
  EASY
  MEDIUM
  HARD
  DEADLY
}

// ============================================================================
// DIALOGUES & CUTSCENES
// ============================================================================

model Dialogue {
  id              String    @id @default(cuid())
  campaignId      String    @map("campaign_id")
  
  name            String
  npcName         String?   @map("npc_name")
  npcPortrait     String?   @map("npc_portrait")
  
  // Dialogue tree
  nodes           Json      @default("[]")
  startNodeId     String?   @map("start_node_id")
  
  // Conditions
  conditions      Json      @default("[]")
  
  campaign        Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  @@index([campaignId])
  @@map("dialogues")
}

model Cutscene {
  id              String    @id @default(cuid())
  campaignId      String    @map("campaign_id")
  
  name            String
  description     String?
  
  // Scenes array
  scenes          Json      @default("[]")
  
  // Audio
  backgroundMusic String?   @map("background_music")
  
  // Settings
  skippable       Boolean   @default(true)
  duration        Int?      // Total duration in ms
  
  // Trigger
  triggerType     String?   @map("trigger_type")
  triggerParams   Json?     @map("trigger_params")
  playOnce        Boolean   @default(false) @map("play_once")
  
  campaign        Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  @@index([campaignId])
  @@map("cutscenes")
}

model Quest {
  id              String    @id @default(cuid())
  campaignId      String    @map("campaign_id")
  
  name            String
  description     String?
  
  // Quest structure
  objectives      Json      @default("[]")
  rewards         Json      @default("{}")
  
  // Prerequisites
  prerequisiteQuests String[] @map("prerequisite_quests")
  conditions      Json      @default("[]")
  
  // Type
  questType       QuestType @default(MAIN) @map("quest_type")
  
  campaign        Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  @@index([campaignId])
  @@map("quests")
}

enum QuestType {
  MAIN
  SIDE
  OPTIONAL
}

// ============================================================================
// GAME SESSIONS
// ============================================================================

model GameSession {
  id              String    @id @default(cuid())
  campaignId      String    @map("campaign_id")
  
  // Session info
  name            String?
  status          GameSessionStatus @default(LOBBY)
  
  // Current state
  currentMapId    String?   @map("current_map_id")
  gameState       Json      @default("{}") @map("game_state")
  
  // Combat state (if in combat)
  combatState     Json?     @map("combat_state")
  
  // Settings
  turnTimerSeconds Int?     @map("turn_timer_seconds")
  pausedAt        DateTime? @map("paused_at")
  
  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  startedAt       DateTime? @map("started_at")
  endedAt         DateTime? @map("ended_at")
  
  // Relations
  campaign        Campaign  @relation(fields: [campaignId], references: [id])
  players         GameSessionPlayer[]
  entities        GameEntity[]
  chatMessages    ChatMessage[]
  
  @@index([campaignId])
  @@index([status])
  @@map("game_sessions")
}

enum GameSessionStatus {
  LOBBY
  ACTIVE
  PAUSED
  COMBAT
  COMPLETED
  ABANDONED
}

model GameSessionPlayer {
  id              String    @id @default(cuid())
  sessionId       String    @map("session_id")
  userId          String    @map("user_id")
  characterId     String?   @map("character_id")
  
  role            PlayerRole @default(PLAYER)
  status          PlayerStatus @default(CONNECTED)
  
  // Connection info
  connectionId    String?   @map("connection_id")
  lastHeartbeat   DateTime? @map("last_heartbeat")
  
  // Join time
  joinedAt        DateTime  @default(now()) @map("joined_at")
  leftAt          DateTime? @map("left_at")
  
  session         GameSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user            User        @relation(fields: [userId], references: [id])
  character       Character?  @relation(fields: [characterId], references: [id])
  
  @@unique([sessionId, userId])
  @@index([sessionId])
  @@map("game_session_players")
}

enum PlayerRole {
  DM
  PLAYER
  SPECTATOR
}

enum PlayerStatus {
  CONNECTED
  DISCONNECTED
  AFK
}

model GameEntity {
  id              String    @id @default(cuid())
  sessionId       String    @map("session_id")
  
  // Identity
  entityType      EntityType @map("entity_type")
  sourceId        String?   @map("source_id")  // Character ID or Monster ID
  name            String
  
  // Position
  x               Int
  y               Int
  facing          String    @default("south")
  
  // Stats (copied from source, can be modified)
  maxHp           Int       @map("max_hp")
  currentHp       Int       @map("current_hp")
  tempHp          Int       @default(0) @map("temp_hp")
  armorClass      Int       @map("armor_class")
  speed           Int
  
  // Combat
  initiative      Int?
  initiativeBonus Int       @default(0) @map("initiative_bonus")
  
  // Conditions and effects
  conditions      Json      @default("[]")
  effects         Json      @default("[]")
  
  // Resources per turn
  actionUsed      Boolean   @default(false) @map("action_used")
  bonusActionUsed Boolean   @default(false) @map("bonus_action_used")
  reactionUsed    Boolean   @default(false) @map("reaction_used")
  movementUsed    Int       @default(0) @map("movement_used")
  
  // Visibility
  visibleTo       String[]  @map("visible_to")  // Player IDs or "all"
  
  // Token appearance
  tokenUrl        String?   @map("token_url")
  tokenSize       String    @default("medium") @map("token_size")
  tokenTint       String?   @map("token_tint")
  
  // Concentrating
  concentratingOn String?   @map("concentrating_on")
  
  session         GameSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@index([sessionId])
  @@map("game_entities")
}

enum EntityType {
  PLAYER_CHARACTER
  NPC
  MONSTER
  SUMMON
  OBJECT
}

// ============================================================================
// CHAT
// ============================================================================

model ChatMessage {
  id              String    @id @default(cuid())
  sessionId       String    @map("session_id")
  userId          String    @map("user_id")
  
  messageType     ChatMessageType @default(CHAT) @map("message_type")
  content         String
  
  // For dice rolls
  rollData        Json?     @map("roll_data")
  
  // Visibility
  whisperTo       String[]  @map("whisper_to")  // User IDs for whispers
  
  createdAt       DateTime  @default(now()) @map("created_at")
  
  session         GameSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user            User        @relation(fields: [userId], references: [id])
  
  @@index([sessionId])
  @@index([createdAt])
  @@map("chat_messages")
}

enum ChatMessageType {
  CHAT
  WHISPER
  DICE_ROLL
  SYSTEM
  EMOTE
}

// ============================================================================
// MEDIA ASSETS
// ============================================================================

model MediaAsset {
  id              String    @id @default(cuid())
  ownerId         String    @map("owner_id")
  
  // Type and metadata
  assetType       MediaAssetType @map("asset_type")
  mimeType        String    @map("mime_type")
  filename        String
  
  // Storage
  storageUrl      String    @map("storage_url")
  cdnUrl          String?   @map("cdn_url")
  thumbnailUrl    String?   @map("thumbnail_url")
  
  // Size
  fileSize        Int       @map("file_size")
  width           Int?
  height          Int?
  duration        Int?      // For video/audio in seconds
  
  // Generation info (for AI-generated)
  isGenerated     Boolean   @default(false) @map("is_generated")
  generationPrompt String?  @map("generation_prompt")
  generationParams Json?    @map("generation_params")
  
  // Status
  status          AssetStatus @default(PROCESSING)
  
  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  processedAt     DateTime? @map("processed_at")
  
  owner           User      @relation(fields: [ownerId], references: [id])
  
  @@index([ownerId])
  @@index([assetType])
  @@map("media_assets")
}

enum MediaAssetType {
  CHARACTER_PORTRAIT
  CHARACTER_TOKEN
  LOCATION_ART
  MAP_BACKGROUND
  ITEM_ICON
  MONSTER_TOKEN
  CUTSCENE_VIDEO
  AUDIO_MUSIC
  AUDIO_SFX
  AUDIO_VOICE
}

enum AssetStatus {
  PROCESSING
  READY
  FAILED
}

// ============================================================================
// 5E CONTENT (Read-mostly, seeded from JSON)
// ============================================================================

model Spell {
  id              String    @id
  name            String
  level           Int
  school          String
  
  // Casting
  castingTime     String    @map("casting_time")
  ritual          Boolean   @default(false)
  concentration   Boolean   @default(false)
  
  // Components
  verbal          Boolean   @default(false)
  somatic         Boolean   @default(false)
  material        Boolean   @default(false)
  materialDesc    String?   @map("material_desc")
  
  // Range & Area
  range           String
  areaOfEffect    Json?     @map("area_of_effect")
  
  // Duration
  duration        String
  
  // Classes
  classes         String[]
  
  // Description
  description     String
  atHigherLevels  String?   @map("at_higher_levels")
  
  // Mechanics (for rules engine)
  mechanics       Json
  
  // Source
  source          String
  
  @@index([level])
  @@index([school])
  @@map("spells")
}

model Monster {
  id              String    @id
  name            String
  
  // Basic info
  size            String
  creatureType    String    @map("creature_type")
  alignment       String?
  
  // Stats
  armorClass      Int       @map("armor_class")
  armorType       String?   @map("armor_type")
  hitPoints       Int       @map("hit_points")
  hitDice         String    @map("hit_dice")
  speed           Json
  
  // Ability scores
  strength        Int
  dexterity       Int
  constitution    Int
  intelligence    Int
  wisdom          Int
  charisma        Int
  
  // Proficiencies
  savingThrows    Json?     @map("saving_throws")
  skills          Json?
  
  // Resistances
  damageVulnerabilities String[] @map("damage_vulnerabilities")
  damageResistances     String[] @map("damage_resistances")
  damageImmunities      String[] @map("damage_immunities")
  conditionImmunities   String[] @map("condition_immunities")
  
  // Senses
  senses          Json
  languages       String[]
  
  // Challenge
  challengeRating Float     @map("challenge_rating")
  xp              Int
  
  // Abilities
  traits          Json      @default("[]")
  actions         Json      @default("[]")
  reactions       Json?
  legendaryActions Json?    @map("legendary_actions")
  lairActions     Json?     @map("lair_actions")
  
  // Description
  description     String?
  
  // Source
  source          String
  
  @@index([challengeRating])
  @@index([creatureType])
  @@map("monsters")
}

model Item {
  id              String    @id
  name            String
  
  // Type
  itemType        String    @map("item_type")
  itemSubtype     String?   @map("item_subtype")
  rarity          String    @default("common")
  
  // Cost & Weight
  cost            Json?
  weight          Float?
  
  // For weapons
  damage          Json?
  damageType      String?   @map("damage_type")
  properties      String[]
  range           Json?
  
  // For armor
  armorClass      Int?      @map("armor_class")
  strengthReq     Int?      @map("strength_req")
  stealthDisadv   Boolean   @default(false) @map("stealth_disadvantage")
  
  // Magic items
  isMagic         Boolean   @default(false) @map("is_magic")
  requiresAttunement Boolean @default(false) @map("requires_attunement")
  attunementReq   String?   @map("attunement_req")
  
  // Description
  description     String
  
  // Source
  source          String
  
  @@index([itemType])
  @@index([rarity])
  @@map("items")
}

model Condition {
  id              String    @id
  name            String
  
  description     String
  effects         Json      // Mechanical effects
  
  // Source
  source          String
  
  @@map("conditions")
}

// ============================================================================
// ANALYTICS (Optional, can be separate DB)
// ============================================================================

model AnalyticsEvent {
  id              String    @id @default(cuid())
  
  eventType       String    @map("event_type")
  userId          String?   @map("user_id")
  sessionId       String?   @map("session_id")
  
  properties      Json      @default("{}")
  
  // Context
  platform        String?
  appVersion      String?   @map("app_version")
  
  createdAt       DateTime  @default(now()) @map("created_at")
  
  @@index([eventType])
  @@index([userId])
  @@index([createdAt])
  @@map("analytics_events")
}
```

---

# 3. Migration Commands

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Apply to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

---

# 4. Environment Variables

```env
# .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dnd_board_game?schema=public"

# For production
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&sslmode=require"
```

---

# END OF DOCUMENT 25
