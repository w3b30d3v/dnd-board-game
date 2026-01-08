import { z } from 'zod';
import { GridPositionSchema } from './common.js';

// WebSocket Message Types
export const WSMessageType = {
  // Connection
  AUTHENTICATE: 'AUTHENTICATE',
  AUTHENTICATED: 'AUTHENTICATED',
  AUTH_ERROR: 'AUTH_ERROR',
  PING: 'PING',
  PONG: 'PONG',

  // Session Management
  CREATE_SESSION: 'CREATE_SESSION',
  SESSION_CREATED: 'SESSION_CREATED',
  JOIN_SESSION: 'JOIN_SESSION',
  SESSION_JOINED: 'SESSION_JOINED',
  LEAVE_SESSION: 'LEAVE_SESSION',
  SESSION_LEFT: 'SESSION_LEFT',
  SESSION_CLOSED: 'SESSION_CLOSED',
  SESSION_ERROR: 'SESSION_ERROR',

  // Session Lock (DM feature)
  SESSION_LOCK: 'SESSION_LOCK',
  SESSION_UNLOCK: 'SESSION_UNLOCK',
  SESSION_LOCKED: 'SESSION_LOCKED', // Broadcast when session lock status changes
  SESSION_LOCKED_ERROR: 'SESSION_LOCKED_ERROR', // Error when trying to join locked session

  // Player Status
  PLAYER_JOINED: 'PLAYER_JOINED',
  PLAYER_LEFT: 'PLAYER_LEFT',
  PLAYER_READY: 'PLAYER_READY',
  PLAYER_UNREADY: 'PLAYER_UNREADY',
  PLAYER_LIST: 'PLAYER_LIST',

  // Game State
  GAME_START: 'GAME_START',
  GAME_STATE_SYNC: 'GAME_STATE_SYNC',
  GAME_PAUSE: 'GAME_PAUSE',
  GAME_RESUME: 'GAME_RESUME',
  GAME_END: 'GAME_END',

  // Combat / Turn
  COMBAT_START: 'COMBAT_START',
  COMBAT_END: 'COMBAT_END',
  INITIATIVE_ROLLED: 'INITIATIVE_ROLLED',
  INITIATIVE_ORDER: 'INITIATIVE_ORDER',
  TURN_START: 'TURN_START',
  TURN_END: 'TURN_END',
  TURN_TIMEOUT: 'TURN_TIMEOUT',

  // Actions
  ACTION_REQUEST: 'ACTION_REQUEST',
  ACTION_RESULT: 'ACTION_RESULT',
  ACTION_REJECTED: 'ACTION_REJECTED',
  MOVE_TOKEN: 'MOVE_TOKEN',
  TOKEN_MOVED: 'TOKEN_MOVED',
  ATTACK: 'ATTACK',
  ATTACK_RESULT: 'ATTACK_RESULT',
  CAST_SPELL: 'CAST_SPELL',
  SPELL_RESULT: 'SPELL_RESULT',
  DICE_ROLL: 'DICE_ROLL',
  DICE_RESULT: 'DICE_RESULT',

  // Chat
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  CHAT_BROADCAST: 'CHAT_BROADCAST',
  WHISPER: 'WHISPER',
  WHISPER_RECEIVED: 'WHISPER_RECEIVED',
  SYSTEM_MESSAGE: 'SYSTEM_MESSAGE',

  // Map / Board
  MAP_LOAD: 'MAP_LOAD',
  MAP_UPDATE: 'MAP_UPDATE',
  FOG_UPDATE: 'FOG_UPDATE',
  TOKEN_ADD: 'TOKEN_ADD',
  TOKEN_REMOVE: 'TOKEN_REMOVE',
  TOKEN_UPDATE: 'TOKEN_UPDATE',

  // DM Controls
  DM_COMMAND: 'DM_COMMAND',
  DM_BROADCAST: 'DM_BROADCAST',

  // Game State Persistence
  GAME_SAVE: 'GAME_SAVE',
  GAME_SAVED: 'GAME_SAVED',
  GAME_LOAD: 'GAME_LOAD',
  GAME_LOADED: 'GAME_LOADED',

  // Combat State Sync (Tier 1 multiplayer)
  HP_UPDATE: 'HP_UPDATE',
  CONDITION_CHANGE: 'CONDITION_CHANGE',
  DEATH_SAVE: 'DEATH_SAVE',
  CONCENTRATION_CHECK: 'CONCENTRATION_CHECK',
  SPELL_CAST: 'SPELL_CAST',
  REST: 'REST',

  // Errors
  ERROR: 'ERROR',
} as const;

export type WSMessageTypeValue = (typeof WSMessageType)[keyof typeof WSMessageType];

// Base message schema
export const WSMessageBaseSchema = z.object({
  type: z.string(),
  timestamp: z.number().default(() => Date.now()),
  correlationId: z.string().uuid().optional(),
});

// Authentication messages
export const AuthenticateMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.AUTHENTICATE),
  payload: z.object({
    token: z.string(),
  }),
});

export const AuthenticatedMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.AUTHENTICATED),
  payload: z.object({
    userId: z.string(),
    username: z.string(),
    displayName: z.string(),
  }),
});

// Session messages
export const CreateSessionMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.CREATE_SESSION),
  payload: z.object({
    name: z.string().min(1).max(100),
    campaignId: z.string().cuid().optional(),
    maxPlayers: z.number().int().min(2).max(10).default(6),
    isPrivate: z.boolean().default(false),
  }),
});

export const SessionCreatedMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.SESSION_CREATED),
  payload: z.object({
    sessionId: z.string(),
    inviteCode: z.string(),
    name: z.string(),
  }),
});

export const JoinSessionMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.JOIN_SESSION),
  payload: z.object({
    sessionId: z.string().optional(),
    inviteCode: z.string().optional(),
    characterId: z.string().cuid().optional(),
  }),
});

export const LeaveSessionMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.LEAVE_SESSION),
  payload: z.object({
    sessionId: z.string(),
  }),
});

// Player status
export const PlayerSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  displayName: z.string(),
  characterId: z.string().optional(),
  characterName: z.string().optional(),
  isReady: z.boolean(),
  isDM: z.boolean(),
  isConnected: z.boolean(),
});

export type Player = z.infer<typeof PlayerSchema>;

export const PlayerListMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.PLAYER_LIST),
  payload: z.object({
    sessionId: z.string(),
    players: z.array(PlayerSchema),
  }),
});

export const PlayerReadyMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.PLAYER_READY),
  payload: z.object({
    sessionId: z.string(),
    characterId: z.string().cuid().optional(),
  }),
});

// Turn management
export const TurnStartMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.TURN_START),
  payload: z.object({
    sessionId: z.string(),
    creatureId: z.string(),
    round: z.number().int(),
    turnIndex: z.number().int(),
    timeLimit: z.number().int().optional(), // seconds
  }),
});

export const TurnEndMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.TURN_END),
  payload: z.object({
    sessionId: z.string(),
    creatureId: z.string(),
  }),
});

// Action messages
export const ActionRequestMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.ACTION_REQUEST),
  payload: z.object({
    sessionId: z.string(),
    creatureId: z.string(),
    actionType: z.enum([
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
    ]),
    targetId: z.string().optional(),
    targetPosition: GridPositionSchema.optional(),
    spellId: z.string().optional(),
    spellSlot: z.number().int().min(1).max(9).optional(),
    weaponId: z.string().optional(),
    itemId: z.string().optional(),
    path: z.array(GridPositionSchema).optional(),
  }),
});

export const ActionResultMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.ACTION_RESULT),
  payload: z.object({
    sessionId: z.string(),
    creatureId: z.string(),
    actionType: z.string(),
    success: z.boolean(),
    rolls: z.array(
      z.object({
        type: z.string(),
        dice: z.string(),
        result: z.number(),
        total: z.number(),
        advantage: z.boolean().optional(),
        disadvantage: z.boolean().optional(),
        isCritical: z.boolean().optional(),
        isFumble: z.boolean().optional(),
      })
    ).optional(),
    damage: z
      .object({
        amount: z.number(),
        type: z.string(),
        isCritical: z.boolean().optional(),
      })
      .optional(),
    healing: z.number().optional(),
    effects: z.array(z.string()).optional(),
    message: z.string().optional(),
  }),
});

// Dice roll messages
export const DiceRollMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.DICE_ROLL),
  payload: z.object({
    sessionId: z.string(),
    dice: z.string(), // e.g., "2d6+4", "1d20"
    reason: z.string().optional(),
    isPrivate: z.boolean().default(false),
  }),
});

export const DiceResultMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.DICE_RESULT),
  payload: z.object({
    sessionId: z.string(),
    playerId: z.string(),
    playerName: z.string(),
    dice: z.string(),
    rolls: z.array(z.number()),
    modifier: z.number(),
    total: z.number(),
    reason: z.string().optional(),
    isPrivate: z.boolean().default(false),
  }),
});

// Chat messages
export const ChatMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.CHAT_MESSAGE),
  payload: z.object({
    sessionId: z.string(),
    content: z.string().min(1).max(1000),
    isInCharacter: z.boolean().default(false),
  }),
});

export const ChatBroadcastMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.CHAT_BROADCAST),
  payload: z.object({
    sessionId: z.string(),
    senderId: z.string(),
    senderName: z.string(),
    content: z.string(),
    isInCharacter: z.boolean(),
    timestamp: z.number(),
  }),
});

export const WhisperMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.WHISPER),
  payload: z.object({
    sessionId: z.string(),
    targetUserId: z.string(),
    content: z.string().min(1).max(1000),
  }),
});

export const SystemMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.SYSTEM_MESSAGE),
  payload: z.object({
    sessionId: z.string(),
    content: z.string(),
    level: z.enum(['info', 'warning', 'error', 'success']).default('info'),
  }),
});

// Token/Map messages
export const MoveTokenMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.MOVE_TOKEN),
  payload: z.object({
    sessionId: z.string(),
    tokenId: z.string(),
    path: z.array(GridPositionSchema),
  }),
});

export const TokenMovedMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.TOKEN_MOVED),
  payload: z.object({
    sessionId: z.string(),
    tokenId: z.string(),
    creatureId: z.string(),
    fromPosition: GridPositionSchema,
    toPosition: GridPositionSchema,
    path: z.array(GridPositionSchema),
  }),
});

// Error message
export const ErrorMessageSchema = WSMessageBaseSchema.extend({
  type: z.literal(WSMessageType.ERROR),
  payload: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

// Union of all message types for validation
export const WSMessageSchema = z.discriminatedUnion('type', [
  AuthenticateMessageSchema,
  AuthenticatedMessageSchema,
  CreateSessionMessageSchema,
  SessionCreatedMessageSchema,
  JoinSessionMessageSchema,
  LeaveSessionMessageSchema,
  PlayerListMessageSchema,
  PlayerReadyMessageSchema,
  TurnStartMessageSchema,
  TurnEndMessageSchema,
  ActionRequestMessageSchema,
  ActionResultMessageSchema,
  DiceRollMessageSchema,
  DiceResultMessageSchema,
  ChatMessageSchema,
  ChatBroadcastMessageSchema,
  WhisperMessageSchema,
  SystemMessageSchema,
  MoveTokenMessageSchema,
  TokenMovedMessageSchema,
  ErrorMessageSchema,
]);

export type WSMessage = z.infer<typeof WSMessageSchema>;
export type AuthenticateMessage = z.infer<typeof AuthenticateMessageSchema>;
export type AuthenticatedMessage = z.infer<typeof AuthenticatedMessageSchema>;
export type CreateSessionMessage = z.infer<typeof CreateSessionMessageSchema>;
export type SessionCreatedMessage = z.infer<typeof SessionCreatedMessageSchema>;
export type JoinSessionMessage = z.infer<typeof JoinSessionMessageSchema>;
export type LeaveSessionMessage = z.infer<typeof LeaveSessionMessageSchema>;
export type PlayerListMessage = z.infer<typeof PlayerListMessageSchema>;
export type PlayerReadyMessage = z.infer<typeof PlayerReadyMessageSchema>;
export type TurnStartMessage = z.infer<typeof TurnStartMessageSchema>;
export type TurnEndMessage = z.infer<typeof TurnEndMessageSchema>;
export type ActionRequestMessage = z.infer<typeof ActionRequestMessageSchema>;
export type ActionResultMessage = z.infer<typeof ActionResultMessageSchema>;
export type DiceRollMessage = z.infer<typeof DiceRollMessageSchema>;
export type DiceResultMessage = z.infer<typeof DiceResultMessageSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatBroadcastMessage = z.infer<typeof ChatBroadcastMessageSchema>;
export type WhisperMessage = z.infer<typeof WhisperMessageSchema>;
export type SystemMessage = z.infer<typeof SystemMessageSchema>;
export type MoveTokenMessage = z.infer<typeof MoveTokenMessageSchema>;
export type TokenMovedMessage = z.infer<typeof TokenMovedMessageSchema>;
export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;

// Session state for multiplayer
export const SessionStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  inviteCode: z.string(),
  hostUserId: z.string(),
  campaignId: z.string().optional(),
  status: z.enum(['lobby', 'starting', 'active', 'paused', 'ended']),
  maxPlayers: z.number(),
  isPrivate: z.boolean(),
  isLocked: z.boolean().default(false), // DM can lock session to prevent new joins
  allowedUsers: z.array(z.string()).default([]), // User IDs allowed when locked
  players: z.array(PlayerSchema),
  gameState: z.unknown().optional(), // Full game state when active
  createdAt: z.number(),
  startedAt: z.number().optional(),
  lastSavedAt: z.number().optional(), // Last time game was saved to campaign
});

export type SessionState = z.infer<typeof SessionStateSchema>;
