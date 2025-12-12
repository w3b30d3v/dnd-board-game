import { z } from 'zod';
import { GridPositionSchema } from './common.js';

// Damage types (13 total in 5e)
export const DamageTypeSchema = z.enum([
  'ACID',
  'BLUDGEONING',
  'COLD',
  'FIRE',
  'FORCE',
  'LIGHTNING',
  'NECROTIC',
  'PIERCING',
  'POISON',
  'PSYCHIC',
  'RADIANT',
  'SLASHING',
  'THUNDER',
]);

export type DamageType = z.infer<typeof DamageTypeSchema>;

// Conditions (15 in PHB)
export const ConditionSchema = z.enum([
  'BLINDED',
  'CHARMED',
  'DEAFENED',
  'EXHAUSTION',
  'FRIGHTENED',
  'GRAPPLED',
  'INCAPACITATED',
  'INVISIBLE',
  'PARALYZED',
  'PETRIFIED',
  'POISONED',
  'PRONE',
  'RESTRAINED',
  'STUNNED',
  'UNCONSCIOUS',
]);

export type Condition = z.infer<typeof ConditionSchema>;

// Token on the game board
export const TokenSchema = z.object({
  id: z.string().cuid(),
  entityId: z.string().cuid(),
  entityType: z.enum(['character', 'monster', 'npc']),
  position: GridPositionSchema,
  size: z.enum(['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan']),
  spriteUrl: z.string().url().optional(),
  conditions: z.array(ConditionSchema),
  isVisible: z.boolean(),
  elevation: z.number().default(0),
});

export type Token = z.infer<typeof TokenSchema>;

// Game session
export const GameSessionSchema = z.object({
  id: z.string().cuid(),
  campaignId: z.string().cuid(),
  dmUserId: z.string().cuid(),
  name: z.string(),
  status: z.enum(['lobby', 'active', 'paused', 'completed']),
  currentTurn: z.number().int().min(0).optional(),
  round: z.number().int().min(0).default(0),
  initiativeOrder: z.array(z.string().cuid()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type GameSession = z.infer<typeof GameSessionSchema>;

// Combat action types
export const ActionTypeSchema = z.enum([
  'MOVE',
  'ATTACK',
  'CAST_SPELL',
  'DASH',
  'DISENGAGE',
  'DODGE',
  'HELP',
  'HIDE',
  'READY',
  'SEARCH',
  'USE_OBJECT',
  'BONUS_ACTION',
  'REACTION',
  'FREE_ACTION',
]);

export type ActionType = z.infer<typeof ActionTypeSchema>;

// Terrain types for tiles
export const TerrainTypeSchema = z.enum([
  'NORMAL',
  'DIFFICULT',
  'WATER',
  'LAVA',
  'PIT',
  'WALL',
  'DOOR',
  'STAIRS',
]);

export type TerrainType = z.infer<typeof TerrainTypeSchema>;

// Tile data for the game board
export const TileDataSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  terrain: TerrainTypeSchema.default('NORMAL'),
  elevation: z.number().default(0),
  isExplored: z.boolean().default(false),
  isVisible: z.boolean().default(false),
  lightLevel: z.number().min(0).max(1).default(1),
  effects: z.array(z.string()).default([]),
});

export type TileData = z.infer<typeof TileDataSchema>;

// Map data structure
export const MapDataSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  gridSize: z.number().int().positive().default(5), // feet per cell
  tiles: z.array(TileDataSchema),
  backgroundUrl: z.string().url().optional(),
});

export type MapData = z.infer<typeof MapDataSchema>;

// Creature on the board (player character, monster, NPC)
export const CreatureSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  type: z.enum(['character', 'monster', 'npc']),
  position: GridPositionSchema,
  size: z.enum(['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan']),

  // Combat stats
  currentHitPoints: z.number().int(),
  maxHitPoints: z.number().int(),
  tempHitPoints: z.number().int().default(0),
  armorClass: z.number().int(),
  speed: z.number().int(),
  initiative: z.number().int().optional(),

  // Status
  conditions: z.array(ConditionSchema).default([]),
  isConcentrating: z.boolean().default(false),
  concentrationSpellId: z.string().optional(),

  // Visual
  spriteUrl: z.string().url().optional(),
  tokenColor: z.string().optional(),

  // Visibility
  isVisible: z.boolean().default(true),
  isHidden: z.boolean().default(false),
});

export type Creature = z.infer<typeof CreatureSchema>;

// Visibility state for fog of war
export const VisibilityStateSchema = z.enum(['HIDDEN', 'EXPLORED', 'VISIBLE']);
export type VisibilityState = z.infer<typeof VisibilityStateSchema>;

// Full game state for the board
export const GameStateSchema = z.object({
  sessionId: z.string().cuid(),
  map: MapDataSchema,
  creatures: z.array(CreatureSchema),
  visibleTiles: z.array(GridPositionSchema).optional(),
  currentTurnCreatureId: z.string().cuid().optional(),
  round: z.number().int().min(0).default(0),
  phase: z.enum(['exploration', 'combat', 'dialogue']).default('exploration'),
});

export type GameState = z.infer<typeof GameStateSchema>;

// Area of Effect shapes
export const AoEShapeSchema = z.enum(['SPHERE', 'CUBE', 'CONE', 'LINE', 'CYLINDER']);
export type AoEShape = z.infer<typeof AoEShapeSchema>;

// Area of Effect definition
export const AreaOfEffectSchema = z.object({
  shape: AoEShapeSchema,
  origin: GridPositionSchema,
  size: z.number().positive(), // radius for sphere/cylinder, side for cube, length for cone/line
  direction: z.number().optional(), // angle in degrees for cone/line
  color: z.number().default(0xff0000),
  alpha: z.number().min(0).max(1).default(0.3),
});

export type AreaOfEffect = z.infer<typeof AreaOfEffectSchema>;
