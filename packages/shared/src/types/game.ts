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
