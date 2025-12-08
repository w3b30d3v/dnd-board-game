# D&D Digital Board Game Platform
# Document 13: Starter Code Templates

---

# 1. Overview

This document provides ready-to-use code templates for critical components. Claude Code should use these as starting points.

---

# 2. Shared Types Package

## 2.1 Core Types

```typescript
// packages/shared/src/types/index.ts

// Re-export all types
export * from './abilities';
export * from './combat';
export * from './characters';
export * from './spells';
export * from './items';
export * from './conditions';
export * from './sessions';
export * from './api';
```

```typescript
// packages/shared/src/types/abilities.ts

export type Ability = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export type Skill =
  | 'acrobatics' | 'animal_handling' | 'arcana' | 'athletics'
  | 'deception' | 'history' | 'insight' | 'intimidation'
  | 'investigation' | 'medicine' | 'nature' | 'perception'
  | 'performance' | 'persuasion' | 'religion' | 'sleight_of_hand'
  | 'stealth' | 'survival';

export const SKILL_ABILITIES: Record<Skill, Ability> = {
  acrobatics: 'DEX',
  animal_handling: 'WIS',
  arcana: 'INT',
  athletics: 'STR',
  deception: 'CHA',
  history: 'INT',
  insight: 'WIS',
  intimidation: 'CHA',
  investigation: 'INT',
  medicine: 'WIS',
  nature: 'INT',
  perception: 'WIS',
  performance: 'CHA',
  persuasion: 'CHA',
  religion: 'INT',
  sleight_of_hand: 'DEX',
  stealth: 'DEX',
  survival: 'WIS'
};

export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}
```

```typescript
// packages/shared/src/types/combat.ts

export type DamageType =
  | 'SLASHING' | 'PIERCING' | 'BLUDGEONING'
  | 'FIRE' | 'COLD' | 'LIGHTNING' | 'THUNDER'
  | 'ACID' | 'POISON' | 'NECROTIC' | 'RADIANT'
  | 'FORCE' | 'PSYCHIC';

export type CoverType = 'none' | 'half' | 'three_quarters' | 'total';

export interface Position {
  x: number;
  y: number;
}

export interface AttackResult {
  hits: boolean;
  attackRoll: {
    natural: number;
    modifier: number;
    total: number;
    isCritical: boolean;
    isFumble: boolean;
    advantage?: boolean;
    disadvantage?: boolean;
    advantageRolls?: number[];
  };
  targetAC: number;
  damage?: DamageResult;
}

export interface DamageResult {
  rolls: Array<{ die: string; result: number }>;
  modifier: number;
  total: number;
  type: DamageType;
  resistance?: boolean;
  vulnerability?: boolean;
  immunity?: boolean;
  finalDamage: number;
}

export interface SavingThrowResult {
  success: boolean;
  roll: number;
  modifier: number;
  total: number;
  dc: number;
  ability: Ability;
  autoFail?: boolean;
  autoSuccess?: boolean;
}
```

```typescript
// packages/shared/src/types/conditions.ts

export type ConditionId =
  | 'blinded' | 'charmed' | 'deafened' | 'exhaustion'
  | 'frightened' | 'grappled' | 'incapacitated' | 'invisible'
  | 'paralyzed' | 'petrified' | 'poisoned' | 'prone'
  | 'restrained' | 'stunned' | 'unconscious';

export interface ActiveCondition {
  id: ConditionId;
  sourceId?: string;
  duration?: {
    type: 'rounds' | 'minutes' | 'hours' | 'until_dispelled' | 'save_ends';
    remaining?: number;
    saveAbility?: Ability;
    saveDC?: number;
  };
  exhaustionLevel?: number;  // 1-6 for exhaustion
}

export const CONDITION_EFFECTS: Record<ConditionId, ConditionEffect> = {
  blinded: {
    attacksAgainstAdvantage: true,
    attacksMadeDisadvantage: true,
    autoFailSightChecks: true
  },
  charmed: {
    cantAttackCharmer: true,
    charmerAdvantageOnSocialChecks: true
  },
  deafened: {
    autoFailHearingChecks: true
  },
  frightened: {
    attacksDisadvantageIfSourceVisible: true,
    abilityChecksDisadvantageIfSourceVisible: true,
    cantApproachSource: true
  },
  grappled: {
    speedZero: true
  },
  incapacitated: {
    cantTakeActions: true,
    cantTakeReactions: true
  },
  invisible: {
    attacksMadeAdvantage: true,
    attacksAgainstDisadvantage: true
  },
  paralyzed: {
    incapacitated: true,
    speedZero: true,
    autoFailStrDexSaves: true,
    attacksAgainstAdvantage: true,
    autoCritWithin5ft: true
  },
  petrified: {
    incapacitated: true,
    unaware: true,
    autoFailStrDexSaves: true,
    resistanceAll: true,
    immunePoison: true
  },
  poisoned: {
    attacksDisadvantage: true,
    abilityChecksDisadvantage: true
  },
  prone: {
    meleeAttacksAgainstAdvantage: true,
    rangedAttacksAgainstDisadvantage: true,
    attacksMadeDisadvantage: true
  },
  restrained: {
    speedZero: true,
    attacksAgainstAdvantage: true,
    attacksMadeDisadvantage: true,
    dexSavesDisadvantage: true
  },
  stunned: {
    incapacitated: true,
    cantMove: true,
    autoFailStrDexSaves: true,
    attacksAgainstAdvantage: true
  },
  unconscious: {
    incapacitated: true,
    cantMove: true,
    unaware: true,
    dropHeld: true,
    fallProne: true,
    autoFailStrDexSaves: true,
    attacksAgainstAdvantage: true,
    autoCritWithin5ft: true
  }
};

interface ConditionEffect {
  incapacitated?: boolean;
  speedZero?: boolean;
  cantMove?: boolean;
  cantTakeActions?: boolean;
  cantTakeReactions?: boolean;
  unaware?: boolean;
  dropHeld?: boolean;
  fallProne?: boolean;
  attacksAgainstAdvantage?: boolean;
  attacksAgainstDisadvantage?: boolean;
  attacksMadeAdvantage?: boolean;
  attacksMadeDisadvantage?: boolean;
  attacksDisadvantage?: boolean;
  abilityChecksDisadvantage?: boolean;
  autoFailStrDexSaves?: boolean;
  autoFailSightChecks?: boolean;
  autoFailHearingChecks?: boolean;
  autoCritWithin5ft?: boolean;
  dexSavesDisadvantage?: boolean;
  resistanceAll?: boolean;
  immunePoison?: boolean;
  cantAttackCharmer?: boolean;
  charmerAdvantageOnSocialChecks?: boolean;
  attacksDisadvantageIfSourceVisible?: boolean;
  abilityChecksDisadvantageIfSourceVisible?: boolean;
  cantApproachSource?: boolean;
  meleeAttacksAgainstAdvantage?: boolean;
  rangedAttacksAgainstDisadvantage?: boolean;
}
```

---

# 3. Dice Roller (Shared)

```typescript
// packages/shared/src/utils/dice.ts

export interface DiceRoll {
  expression: string;
  rolls: number[];
  modifier: number;
  total: number;
}

export interface RollOptions {
  advantage?: boolean;
  disadvantage?: boolean;
  criticalMultiplier?: number;
  seed?: number;
}

// Deterministic random for testing
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

let globalRng: SeededRandom | null = null;

export function setDiceSeed(seed: number): void {
  globalRng = new SeededRandom(seed);
}

export function clearDiceSeed(): void {
  globalRng = null;
}

function rollSingleDie(sides: number): number {
  if (globalRng) {
    return globalRng.nextInt(1, sides);
  }
  return Math.floor(Math.random() * sides) + 1;
}

export function parseDiceExpression(expression: string): { count: number; sides: number; modifier: number } {
  // Parse expressions like "2d6+3", "1d20-1", "4d6"
  const match = expression.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) {
    throw new Error(`Invalid dice expression: ${expression}`);
  }

  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0
  };
}

export function rollDice(expression: string, options: RollOptions = {}): DiceRoll {
  const { count, sides, modifier } = parseDiceExpression(expression);
  
  let rolls: number[] = [];
  const multiplier = options.criticalMultiplier || 1;
  
  for (let i = 0; i < count * multiplier; i++) {
    rolls.push(rollSingleDie(sides));
  }

  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;

  return {
    expression,
    rolls,
    modifier,
    total
  };
}

export function rollD20(options: RollOptions = {}): { result: number; rolls: number[]; usedAdvantage: boolean } {
  const roll1 = rollSingleDie(20);
  
  if (!options.advantage && !options.disadvantage) {
    return { result: roll1, rolls: [roll1], usedAdvantage: false };
  }

  const roll2 = rollSingleDie(20);
  const rolls = [roll1, roll2];

  // Advantage and disadvantage cancel out
  if (options.advantage && options.disadvantage) {
    return { result: roll1, rolls: [roll1], usedAdvantage: false };
  }

  if (options.advantage) {
    return { result: Math.max(roll1, roll2), rolls, usedAdvantage: true };
  }

  // Disadvantage
  return { result: Math.min(roll1, roll2), rolls, usedAdvantage: true };
}

export function rollAbilityScores(): number[] {
  // 4d6 drop lowest, 6 times
  const scores: number[] = [];
  
  for (let i = 0; i < 6; i++) {
    const rolls = [
      rollSingleDie(6),
      rollSingleDie(6),
      rollSingleDie(6),
      rollSingleDie(6)
    ].sort((a, b) => b - a);
    
    // Drop lowest
    scores.push(rolls[0] + rolls[1] + rolls[2]);
  }
  
  return scores.sort((a, b) => b - a);
}
```

---

# 4. API Gateway Starter

```typescript
// services/api-gateway/src/index.ts

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import pino from 'pino';

import { authRoutes } from './routes/auth.routes';
import { characterRoutes } from './routes/characters.routes';
import { sessionRoutes } from './routes/sessions.routes';
import { contentRoutes } from './routes/content.routes';
import { WebSocketGateway } from './websocket/gateway';
import { errorHandler } from './middleware/error.middleware';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

async function main() {
  const fastify = Fastify({ logger });

  // Database connections
  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  // Decorate with shared instances
  fastify.decorate('prisma', prisma);
  fastify.decorate('redis', redis);

  // Register plugins
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign: { expiresIn: '15m' }
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  await fastify.register(websocket);

  // Error handler
  fastify.setErrorHandler(errorHandler);

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes
  await fastify.register(authRoutes, { prefix: '/v1/auth' });
  await fastify.register(characterRoutes, { prefix: '/v1/characters' });
  await fastify.register(sessionRoutes, { prefix: '/v1/sessions' });
  await fastify.register(contentRoutes, { prefix: '/v1/content' });

  // WebSocket gateway
  const wsGateway = new WebSocketGateway(fastify, redis);
  await wsGateway.initialize();

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    await fastify.close();
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Start server
  const port = parseInt(process.env.PORT || '3001', 10);
  await fastify.listen({ port, host: '0.0.0.0' });
  
  logger.info(`Server running on port ${port}`);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
```

```typescript
// services/api-gateway/src/routes/auth.routes.ts

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import argon2 from 'argon2';

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/),
  displayName: z.string().min(1).max(50)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  deviceId: z.string().optional(),
  platform: z.enum(['web', 'ios', 'android', 'desktop']).optional()
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /register
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    
    // Check if email/username exists
    const existing = await fastify.prisma.user.findFirst({
      where: {
        OR: [
          { email: body.email },
          { username: body.username }
        ]
      }
    });

    if (existing) {
      return reply.status(409).send({
        error: existing.email === body.email ? 'EMAIL_EXISTS' : 'USERNAME_TAKEN'
      });
    }

    // Hash password
    const passwordHash = await argon2.hash(body.password);

    // Create user
    const user = await fastify.prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        displayName: body.displayName,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        createdAt: true
      }
    });

    return reply.status(201).send(user);
  });

  // POST /login
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    // Find user
    const user = await fastify.prisma.user.findUnique({
      where: { email: body.email }
    });

    if (!user) {
      return reply.status(401).send({ error: 'INVALID_CREDENTIALS' });
    }

    // Verify password
    const valid = await argon2.verify(user.passwordHash, body.password);
    if (!valid) {
      return reply.status(401).send({ error: 'INVALID_CREDENTIALS' });
    }

    // Generate tokens
    const accessToken = fastify.jwt.sign({
      sub: user.id,
      role: user.role
    });

    const refreshToken = crypto.randomUUID();
    
    // Store refresh token
    await fastify.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: await argon2.hash(refreshToken),
        deviceId: body.deviceId,
        platform: body.platform,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Update last login
    await fastify.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role
      }
    };
  });

  // POST /refresh
  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    // Find valid session
    const sessions = await fastify.prisma.userSession.findMany({
      where: {
        expiresAt: { gt: new Date() },
        revokedAt: null
      },
      include: { user: true }
    });

    let validSession = null;
    for (const session of sessions) {
      if (await argon2.verify(session.refreshTokenHash, refreshToken)) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      return reply.status(401).send({ error: 'INVALID_REFRESH_TOKEN' });
    }

    // Generate new access token
    const accessToken = fastify.jwt.sign({
      sub: validSession.user.id,
      role: validSession.user.role
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 900
    };
  });

  // POST /logout
  fastify.post('/logout', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken?: string };

    if (refreshToken) {
      // Revoke specific token
      const sessions = await fastify.prisma.userSession.findMany({
        where: { userId: request.user.sub, revokedAt: null }
      });

      for (const session of sessions) {
        if (await argon2.verify(session.refreshTokenHash, refreshToken)) {
          await fastify.prisma.userSession.update({
            where: { id: session.id },
            data: { revokedAt: new Date() }
          });
          break;
        }
      }
    }

    return { success: true };
  });
};
```

---

# 5. WebSocket Gateway

```typescript
// services/api-gateway/src/websocket/gateway.ts

import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  sessionId?: string;
  lastHeartbeat: number;
}

interface GameMessage {
  type: string;
  messageId: string;
  timestamp: number;
  sessionId?: string;
  sequence?: number;
  payload: any;
}

export class WebSocketGateway {
  private clients: Map<string, ConnectedClient> = new Map();
  private sessionClients: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(
    private fastify: FastifyInstance,
    private redis: Redis
  ) {}

  async initialize() {
    // WebSocket route
    this.fastify.get('/ws', { websocket: true }, (connection, request) => {
      this.handleConnection(connection.socket, request);
    });

    // Subscribe to Redis pub/sub for cross-server messaging
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe('game_events');
    
    subscriber.on('message', (channel, message) => {
      if (channel === 'game_events') {
        this.handleRedisMessage(JSON.parse(message));
      }
    });

    // Start heartbeat checker
    this.heartbeatInterval = setInterval(() => this.checkHeartbeats(), 30000);
  }

  private handleConnection(ws: WebSocket, request: any) {
    const clientId = uuidv4();
    
    ws.on('message', async (data) => {
      try {
        const message: GameMessage = JSON.parse(data.toString());
        await this.handleMessage(clientId, message);
      } catch (err) {
        this.sendError(ws, 'INVALID_MESSAGE', 'Failed to parse message');
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });

    ws.on('error', (err) => {
      this.fastify.log.error({ clientId, error: err }, 'WebSocket error');
    });

    // Store client (not authenticated yet)
    this.clients.set(clientId, {
      ws,
      userId: '',
      lastHeartbeat: Date.now()
    });

    // Send connection acknowledgment
    this.send(ws, {
      type: 'CONNECT_ACK',
      payload: { clientId }
    });
  }

  private async handleMessage(clientId: string, message: GameMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'AUTH':
        await this.handleAuth(clientId, message.payload);
        break;

      case 'HEARTBEAT':
        client.lastHeartbeat = Date.now();
        this.send(client.ws, { type: 'HEARTBEAT_ACK', payload: {} });
        break;

      case 'JOIN_SESSION':
        await this.handleJoinSession(clientId, message.payload);
        break;

      case 'LEAVE_SESSION':
        await this.handleLeaveSession(clientId);
        break;

      case 'COMMAND':
        await this.handleCommand(clientId, message);
        break;

      case 'CHAT':
        await this.handleChat(clientId, message.payload);
        break;

      default:
        this.sendError(client.ws, 'UNKNOWN_MESSAGE_TYPE', `Unknown type: ${message.type}`);
    }
  }

  private async handleAuth(clientId: string, payload: { token: string }) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const decoded = this.fastify.jwt.verify(payload.token) as { sub: string };
      client.userId = decoded.sub;

      this.send(client.ws, {
        type: 'AUTH_SUCCESS',
        payload: { userId: decoded.sub }
      });
    } catch (err) {
      this.sendError(client.ws, 'AUTH_FAILED', 'Invalid token');
    }
  }

  private async handleJoinSession(clientId: string, payload: { sessionId: string; characterId?: string }) {
    const client = this.clients.get(clientId);
    if (!client || !client.userId) {
      return this.sendError(client?.ws!, 'NOT_AUTHENTICATED', 'Must authenticate first');
    }

    const { sessionId, characterId } = payload;

    // Verify session exists and user has access
    const session = await this.fastify.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { players: true }
    });

    if (!session) {
      return this.sendError(client.ws, 'SESSION_NOT_FOUND', 'Session does not exist');
    }

    // Add to session
    client.sessionId = sessionId;
    
    if (!this.sessionClients.has(sessionId)) {
      this.sessionClients.set(sessionId, new Set());
    }
    this.sessionClients.get(sessionId)!.add(clientId);

    // Load current state from Redis
    const stateKey = `session:${sessionId}:state`;
    const currentState = await this.redis.get(stateKey);

    this.send(client.ws, {
      type: 'SESSION_JOINED',
      payload: {
        sessionId,
        state: currentState ? JSON.parse(currentState) : null
      }
    });

    // Notify others
    this.broadcastToSession(sessionId, {
      type: 'PLAYER_JOINED',
      payload: { userId: client.userId, characterId }
    }, clientId);
  }

  private async handleCommand(clientId: string, message: GameMessage) {
    const client = this.clients.get(clientId);
    if (!client?.sessionId) {
      return this.sendError(client?.ws!, 'NOT_IN_SESSION', 'Must join a session first');
    }

    // Forward command to game state service via Redis
    await this.redis.publish('game_commands', JSON.stringify({
      sessionId: client.sessionId,
      clientId,
      userId: client.userId,
      command: message.payload
    }));

    // Acknowledge receipt
    this.send(client.ws, {
      type: 'COMMAND_ACK',
      payload: { messageId: message.messageId }
    });
  }

  private async handleChat(clientId: string, payload: { message: string; channel?: string }) {
    const client = this.clients.get(clientId);
    if (!client?.sessionId) return;

    this.broadcastToSession(client.sessionId, {
      type: 'CHAT_MESSAGE',
      payload: {
        userId: client.userId,
        message: payload.message,
        channel: payload.channel || 'party',
        timestamp: Date.now()
      }
    });
  }

  private handleLeaveSession(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client?.sessionId) return;

    const sessionId = client.sessionId;
    this.sessionClients.get(sessionId)?.delete(clientId);
    client.sessionId = undefined;

    this.broadcastToSession(sessionId, {
      type: 'PLAYER_LEFT',
      payload: { userId: client.userId }
    });
  }

  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (client?.sessionId) {
      this.handleLeaveSession(clientId);
    }
    this.clients.delete(clientId);
  }

  private handleRedisMessage(message: { sessionId: string; type: string; payload: any }) {
    // Broadcast state updates from game service to all session clients
    this.broadcastToSession(message.sessionId, {
      type: message.type,
      payload: message.payload
    });
  }

  private broadcastToSession(sessionId: string, message: any, excludeClientId?: string) {
    const clients = this.sessionClients.get(sessionId);
    if (!clients) return;

    const fullMessage = {
      ...message,
      messageId: uuidv4(),
      timestamp: Date.now()
    };

    for (const clientId of clients) {
      if (clientId === excludeClientId) continue;
      const client = this.clients.get(clientId);
      if (client?.ws.readyState === WebSocket.OPEN) {
        this.send(client.ws, fullMessage);
      }
    }
  }

  private send(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ...message,
        messageId: message.messageId || uuidv4(),
        timestamp: message.timestamp || Date.now()
      }));
    }
  }

  private sendError(ws: WebSocket, code: string, message: string) {
    this.send(ws, {
      type: 'ERROR',
      payload: { code, message }
    });
  }

  private checkHeartbeats() {
    const timeout = 90000; // 90 seconds
    const now = Date.now();

    for (const [clientId, client] of this.clients) {
      if (now - client.lastHeartbeat > timeout) {
        this.fastify.log.info({ clientId }, 'Client heartbeat timeout');
        client.ws.close();
        this.handleDisconnect(clientId);
      }
    }
  }
}
```

---

# 6. Rules Engine Core (Rust)

```rust
// services/rules-engine/src/lib.rs

pub mod dice;
pub mod checks;
pub mod combat;
pub mod spells;
pub mod conditions;

use std::collections::HashMap;

pub type EntityId = String;
pub type Ability = String;

#[derive(Debug, Clone, PartialEq)]
pub enum DamageType {
    Slashing,
    Piercing,
    Bludgeoning,
    Fire,
    Cold,
    Lightning,
    Thunder,
    Acid,
    Poison,
    Necrotic,
    Radiant,
    Force,
    Psychic,
}

#[derive(Debug, Clone)]
pub struct Entity {
    pub id: EntityId,
    pub name: String,
    pub ability_scores: HashMap<String, i32>,
    pub armor_class: i32,
    pub current_hp: i32,
    pub max_hp: i32,
    pub proficiency_bonus: i32,
    pub conditions: Vec<String>,
    pub resistances: Vec<DamageType>,
    pub immunities: Vec<DamageType>,
    pub vulnerabilities: Vec<DamageType>,
}

impl Entity {
    pub fn get_modifier(&self, ability: &str) -> i32 {
        let score = self.ability_scores.get(ability).unwrap_or(&10);
        (score - 10) / 2
    }

    pub fn is_incapacitated(&self) -> bool {
        self.conditions.iter().any(|c| {
            matches!(c.as_str(), 
                "incapacitated" | "paralyzed" | "petrified" | 
                "stunned" | "unconscious"
            )
        })
    }

    pub fn has_condition(&self, condition: &str) -> bool {
        self.conditions.contains(&condition.to_string())
    }
}
```

```rust
// services/rules-engine/src/dice.rs

use rand::{Rng, SeedableRng};
use rand_chacha::ChaCha8Rng;

pub struct DiceRoller {
    rng: ChaCha8Rng,
}

impl DiceRoller {
    pub fn new() -> Self {
        Self {
            rng: ChaCha8Rng::from_entropy(),
        }
    }

    pub fn with_seed(seed: u64) -> Self {
        Self {
            rng: ChaCha8Rng::seed_from_u64(seed),
        }
    }

    pub fn roll(&mut self, sides: u32) -> u32 {
        self.rng.gen_range(1..=sides)
    }

    pub fn roll_dice(&mut self, count: u32, sides: u32) -> Vec<u32> {
        (0..count).map(|_| self.roll(sides)).collect()
    }

    pub fn roll_d20(&mut self, advantage: bool, disadvantage: bool) -> D20Result {
        let roll1 = self.roll(20);
        
        // Advantage and disadvantage cancel out
        if advantage == disadvantage {
            return D20Result {
                result: roll1,
                rolls: vec![roll1],
                used_advantage: false,
            };
        }

        let roll2 = self.roll(20);
        let rolls = vec![roll1, roll2];

        let result = if advantage {
            roll1.max(roll2)
        } else {
            roll1.min(roll2)
        };

        D20Result {
            result,
            rolls,
            used_advantage: true,
        }
    }

    pub fn roll_expression(&mut self, expr: &str) -> DiceResult {
        // Parse "2d6+3" style expressions
        let (count, sides, modifier) = parse_dice_expression(expr);
        
        let rolls: Vec<u32> = self.roll_dice(count, sides);
        let total: i32 = rolls.iter().sum::<u32>() as i32 + modifier;

        DiceResult {
            expression: expr.to_string(),
            rolls,
            modifier,
            total,
        }
    }
}

#[derive(Debug, Clone)]
pub struct D20Result {
    pub result: u32,
    pub rolls: Vec<u32>,
    pub used_advantage: bool,
}

#[derive(Debug, Clone)]
pub struct DiceResult {
    pub expression: String,
    pub rolls: Vec<u32>,
    pub modifier: i32,
    pub total: i32,
}

fn parse_dice_expression(expr: &str) -> (u32, u32, i32) {
    // Simple parser for "NdS+M" format
    let expr = expr.to_lowercase();
    
    let d_pos = expr.find('d').expect("Invalid dice expression");
    let count: u32 = expr[..d_pos].parse().unwrap_or(1);
    
    let rest = &expr[d_pos + 1..];
    
    if let Some(plus_pos) = rest.find('+') {
        let sides: u32 = rest[..plus_pos].parse().unwrap();
        let modifier: i32 = rest[plus_pos + 1..].parse().unwrap();
        (count, sides, modifier)
    } else if let Some(minus_pos) = rest.find('-') {
        let sides: u32 = rest[..minus_pos].parse().unwrap();
        let modifier: i32 = -rest[minus_pos + 1..].parse::<i32>().unwrap();
        (count, sides, modifier)
    } else {
        let sides: u32 = rest.parse().unwrap();
        (count, sides, 0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_seeded_rolls_are_deterministic() {
        let mut roller1 = DiceRoller::with_seed(12345);
        let mut roller2 = DiceRoller::with_seed(12345);

        for _ in 0..100 {
            assert_eq!(roller1.roll(20), roller2.roll(20));
        }
    }

    #[test]
    fn test_parse_dice_expression() {
        assert_eq!(parse_dice_expression("2d6+3"), (2, 6, 3));
        assert_eq!(parse_dice_expression("1d20"), (1, 20, 0));
        assert_eq!(parse_dice_expression("8d6"), (8, 6, 0));
        assert_eq!(parse_dice_expression("1d4-1"), (1, 4, -1));
    }
}
```

```rust
// services/rules-engine/src/combat.rs

use crate::{dice::DiceRoller, Entity, DamageType};

#[derive(Debug, Clone)]
pub struct AttackRequest {
    pub attacker_id: String,
    pub target_id: String,
    pub attack_type: AttackType,
    pub weapon_damage: String,
    pub damage_type: DamageType,
    pub attack_bonus: i32,
    pub damage_bonus: i32,
    pub advantage: bool,
    pub disadvantage: bool,
}

#[derive(Debug, Clone)]
pub enum AttackType {
    MeleeWeapon,
    RangedWeapon,
    MeleeSpell,
    RangedSpell,
}

#[derive(Debug, Clone)]
pub struct AttackResult {
    pub hits: bool,
    pub attack_roll: AttackRoll,
    pub target_ac: i32,
    pub damage: Option<DamageResult>,
}

#[derive(Debug, Clone)]
pub struct AttackRoll {
    pub natural: u32,
    pub modifier: i32,
    pub total: i32,
    pub is_critical: bool,
    pub is_fumble: bool,
    pub advantage_rolls: Option<Vec<u32>>,
}

#[derive(Debug, Clone)]
pub struct DamageResult {
    pub rolls: Vec<u32>,
    pub modifier: i32,
    pub base_total: i32,
    pub damage_type: DamageType,
    pub resistance_applied: bool,
    pub vulnerability_applied: bool,
    pub immunity_applied: bool,
    pub final_damage: i32,
}

pub fn resolve_attack(
    roller: &mut DiceRoller,
    request: &AttackRequest,
    attacker: &Entity,
    target: &Entity,
) -> AttackResult {
    // Check for advantage/disadvantage from conditions
    let advantage = request.advantage || should_have_advantage(attacker, target);
    let disadvantage = request.disadvantage || should_have_disadvantage(attacker, target);

    // Roll to hit
    let d20_result = roller.roll_d20(advantage, disadvantage);
    let natural = d20_result.result;
    
    let is_critical = natural == 20;
    let is_fumble = natural == 1;

    let attack_roll = AttackRoll {
        natural,
        modifier: request.attack_bonus,
        total: natural as i32 + request.attack_bonus,
        is_critical,
        is_fumble,
        advantage_rolls: if d20_result.used_advantage {
            Some(d20_result.rolls)
        } else {
            None
        },
    };

    // Determine hit/miss
    let hits = if is_fumble {
        false
    } else if is_critical {
        true
    } else {
        attack_roll.total >= target.armor_class
    };

    // Calculate damage if hit
    let damage = if hits {
        Some(calculate_damage(
            roller,
            &request.weapon_damage,
            request.damage_bonus,
            request.damage_type.clone(),
            is_critical,
            target,
        ))
    } else {
        None
    };

    AttackResult {
        hits,
        attack_roll,
        target_ac: target.armor_class,
        damage,
    }
}

fn calculate_damage(
    roller: &mut DiceRoller,
    damage_expr: &str,
    modifier: i32,
    damage_type: DamageType,
    is_critical: bool,
    target: &Entity,
) -> DamageResult {
    // Roll damage dice (double on crit)
    let dice_result = roller.roll_expression(damage_expr);
    let mut rolls = dice_result.rolls.clone();
    
    if is_critical {
        // Roll again and add
        let crit_rolls = roller.roll_expression(damage_expr);
        rolls.extend(crit_rolls.rolls);
    }

    let base_total: i32 = rolls.iter().sum::<u32>() as i32 + modifier;

    // Apply resistance/immunity/vulnerability
    let immunity_applied = target.immunities.contains(&damage_type);
    let resistance_applied = !immunity_applied && target.resistances.contains(&damage_type);
    let vulnerability_applied = !immunity_applied && target.vulnerabilities.contains(&damage_type);

    let final_damage = if immunity_applied {
        0
    } else if resistance_applied && vulnerability_applied {
        // They cancel out
        base_total
    } else if resistance_applied {
        base_total / 2
    } else if vulnerability_applied {
        base_total * 2
    } else {
        base_total
    };

    DamageResult {
        rolls,
        modifier,
        base_total,
        damage_type,
        resistance_applied,
        vulnerability_applied,
        immunity_applied,
        final_damage: final_damage.max(0),
    }
}

fn should_have_advantage(attacker: &Entity, target: &Entity) -> bool {
    // Invisible attacker
    if attacker.has_condition("invisible") && !target.has_condition("invisible") {
        return true;
    }
    // Target is blinded, paralyzed, petrified, restrained, stunned, or unconscious
    if target.has_condition("blinded") ||
       target.has_condition("paralyzed") ||
       target.has_condition("petrified") ||
       target.has_condition("restrained") ||
       target.has_condition("stunned") ||
       target.has_condition("unconscious") {
        return true;
    }
    false
}

fn should_have_disadvantage(attacker: &Entity, target: &Entity) -> bool {
    // Attacker is blinded, frightened, poisoned, prone, or restrained
    if attacker.has_condition("blinded") ||
       attacker.has_condition("frightened") ||
       attacker.has_condition("poisoned") ||
       attacker.has_condition("prone") ||
       attacker.has_condition("restrained") {
        return true;
    }
    // Target is invisible
    if target.has_condition("invisible") && !attacker.has_condition("invisible") {
        return true;
    }
    false
}
```

---

# 7. React Components

```typescript
// apps/web/src/components/game/Board.tsx

'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { Application, Container, Graphics, Sprite } from 'pixi.js';
import { useGameStore } from '@/stores/gameStore';
import { Position } from '@dnd/shared';

interface BoardProps {
  width: number;
  height: number;
  tileSize?: number;
}

export function Board({ width, height, tileSize = 40 }: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  
  const { 
    tiles, 
    entities, 
    selectedEntity,
    highlightedTiles,
    selectTile,
    selectEntity 
  } = useGameStore();

  // Initialize PixiJS
  useEffect(() => {
    if (!containerRef.current) return;

    const app = new Application();
    
    app.init({
      width: width * tileSize,
      height: height * tileSize,
      backgroundColor: 0x1a1a2e,
      antialias: true,
    }).then(() => {
      containerRef.current?.appendChild(app.canvas);
      appRef.current = app;
      
      // Initial render
      renderBoard(app);
    });

    return () => {
      app.destroy(true, { children: true });
    };
  }, [width, height, tileSize]);

  // Re-render when state changes
  useEffect(() => {
    if (appRef.current) {
      renderBoard(appRef.current);
    }
  }, [tiles, entities, selectedEntity, highlightedTiles]);

  const renderBoard = useCallback((app: Application) => {
    // Clear previous render
    app.stage.removeChildren();

    // Tiles layer
    const tilesContainer = new Container();
    tiles.forEach((tile) => {
      const tileGraphic = createTileGraphic(tile, tileSize);
      tileGraphic.position.set(tile.x * tileSize, tile.y * tileSize);
      
      // Highlight
      if (highlightedTiles.some(h => h.x === tile.x && h.y === tile.y)) {
        tileGraphic.tint = 0x4fc3f7;
        tileGraphic.alpha = 0.7;
      }
      
      // Click handler
      tileGraphic.eventMode = 'static';
      tileGraphic.cursor = 'pointer';
      tileGraphic.on('pointerdown', () => selectTile({ x: tile.x, y: tile.y }));
      
      tilesContainer.addChild(tileGraphic);
    });
    app.stage.addChild(tilesContainer);

    // Grid lines
    const gridGraphic = new Graphics();
    gridGraphic.stroke({ color: 0x3a3a50, width: 1 });
    for (let x = 0; x <= width; x++) {
      gridGraphic.moveTo(x * tileSize, 0);
      gridGraphic.lineTo(x * tileSize, height * tileSize);
    }
    for (let y = 0; y <= height; y++) {
      gridGraphic.moveTo(0, y * tileSize);
      gridGraphic.lineTo(width * tileSize, y * tileSize);
    }
    app.stage.addChild(gridGraphic);

    // Entities layer
    const entitiesContainer = new Container();
    entities.forEach((entity) => {
      const entityGraphic = createEntityGraphic(entity, tileSize);
      entityGraphic.position.set(
        entity.position.x * tileSize + tileSize / 2,
        entity.position.y * tileSize + tileSize / 2
      );
      
      // Selection highlight
      if (selectedEntity === entity.id) {
        const selection = new Graphics();
        selection.circle(0, 0, tileSize / 2 + 2);
        selection.stroke({ color: 0xffd54f, width: 3 });
        entityGraphic.addChild(selection);
      }
      
      entityGraphic.eventMode = 'static';
      entityGraphic.cursor = 'pointer';
      entityGraphic.on('pointerdown', () => selectEntity(entity.id));
      
      entitiesContainer.addChild(entityGraphic);
    });
    app.stage.addChild(entitiesContainer);
  }, [tiles, entities, selectedEntity, highlightedTiles, tileSize, width, height]);

  return (
    <div 
      ref={containerRef} 
      className="border border-gray-700 rounded-lg overflow-hidden"
      style={{ width: width * tileSize, height: height * tileSize }}
    />
  );
}

function createTileGraphic(tile: any, size: number): Graphics {
  const graphic = new Graphics();
  
  const colors: Record<string, number> = {
    stone_floor: 0x4a4a5a,
    grass: 0x4a7c4e,
    water: 0x3b82f6,
    wall: 0x2a2a3a,
    difficult_terrain: 0x8b7355,
  };
  
  graphic.rect(0, 0, size, size);
  graphic.fill(colors[tile.terrain] || 0x4a4a5a);
  
  return graphic;
}

function createEntityGraphic(entity: any, size: number): Container {
  const container = new Container();
  
  // Token circle
  const circle = new Graphics();
  circle.circle(0, 0, size / 2 - 4);
  circle.fill(entity.isPlayer ? 0x7c3aed : 0xef4444);
  container.addChild(circle);
  
  // HP bar
  const hpPercent = entity.currentHp / entity.maxHp;
  const hpBar = new Graphics();
  hpBar.rect(-size / 2 + 4, size / 2 - 8, (size - 8) * hpPercent, 4);
  hpBar.fill(hpPercent > 0.5 ? 0x10b981 : hpPercent > 0.25 ? 0xf59e0b : 0xef4444);
  container.addChild(hpBar);
  
  return container;
}
```

---

# 8. Game Store (Zustand)

```typescript
// apps/web/src/stores/gameStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Position, Entity, Tile } from '@dnd/shared';

interface GameState {
  // Map data
  tiles: Tile[];
  width: number;
  height: number;
  
  // Entities
  entities: Entity[];
  selectedEntity: string | null;
  
  // UI state
  highlightedTiles: Position[];
  currentTurn: string | null;
  roundNumber: number;
  
  // Combat
  inCombat: boolean;
  initiativeOrder: string[];
  
  // Actions
  selectTile: (pos: Position) => void;
  selectEntity: (id: string | null) => void;
  highlightTiles: (tiles: Position[]) => void;
  clearHighlights: () => void;
  
  // State updates (from server)
  applyStateDelta: (delta: StateDelta) => void;
  setFullState: (state: GameStateSnapshot) => void;
}

interface StateDelta {
  entities?: Partial<Entity>[];
  removedEntities?: string[];
  updatedTiles?: Tile[];
  currentTurn?: string;
  roundNumber?: number;
}

interface GameStateSnapshot {
  tiles: Tile[];
  entities: Entity[];
  currentTurn: string | null;
  roundNumber: number;
  inCombat: boolean;
  initiativeOrder: string[];
}

export const useGameStore = create<GameState>()(
  immer((set, get) => ({
    tiles: [],
    width: 20,
    height: 15,
    entities: [],
    selectedEntity: null,
    highlightedTiles: [],
    currentTurn: null,
    roundNumber: 0,
    inCombat: false,
    initiativeOrder: [],

    selectTile: (pos) => {
      const selectedId = get().selectedEntity;
      if (selectedId) {
        // If entity selected, this might be a move command
        const entity = get().entities.find(e => e.id === selectedId);
        if (entity && entity.isControlled) {
          // Check if valid move (highlighted)
          const isHighlighted = get().highlightedTiles.some(
            t => t.x === pos.x && t.y === pos.y
          );
          if (isHighlighted) {
            // Send move command via WebSocket
            window.gameConnection?.sendCommand({
              type: 'MOVE',
              entityId: selectedId,
              destination: pos
            });
          }
        }
      }
    },

    selectEntity: (id) => set((state) => {
      state.selectedEntity = id;
      state.highlightedTiles = [];
      
      if (id) {
        const entity = state.entities.find(e => e.id === id);
        if (entity?.isControlled) {
          // Request valid moves from server
          window.gameConnection?.sendCommand({
            type: 'GET_VALID_MOVES',
            entityId: id
          });
        }
      }
    }),

    highlightTiles: (tiles) => set((state) => {
      state.highlightedTiles = tiles;
    }),

    clearHighlights: () => set((state) => {
      state.highlightedTiles = [];
    }),

    applyStateDelta: (delta) => set((state) => {
      // Update entities
      if (delta.entities) {
        for (const update of delta.entities) {
          const index = state.entities.findIndex(e => e.id === update.id);
          if (index >= 0) {
            Object.assign(state.entities[index], update);
          } else {
            state.entities.push(update as Entity);
          }
        }
      }

      // Remove entities
      if (delta.removedEntities) {
        state.entities = state.entities.filter(
          e => !delta.removedEntities!.includes(e.id)
        );
      }

      // Update tiles
      if (delta.updatedTiles) {
        for (const tile of delta.updatedTiles) {
          const index = state.tiles.findIndex(
            t => t.x === tile.x && t.y === tile.y
          );
          if (index >= 0) {
            state.tiles[index] = tile;
          }
        }
      }

      // Update turn info
      if (delta.currentTurn !== undefined) {
        state.currentTurn = delta.currentTurn;
      }
      if (delta.roundNumber !== undefined) {
        state.roundNumber = delta.roundNumber;
      }
    }),

    setFullState: (snapshot) => set((state) => {
      state.tiles = snapshot.tiles;
      state.entities = snapshot.entities;
      state.currentTurn = snapshot.currentTurn;
      state.roundNumber = snapshot.roundNumber;
      state.inCombat = snapshot.inCombat;
      state.initiativeOrder = snapshot.initiativeOrder;
    }),
  }))
);
```

---

# END OF STARTER CODE TEMPLATES
