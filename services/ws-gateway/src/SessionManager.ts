import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { connectionManager } from './ConnectionManager.js';
import type { SessionState, Player } from '@dnd/shared';
import { WSMessageType } from '@dnd/shared';

/**
 * Generates a short invite code
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < config.session.inviteCodeLength; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Manages game sessions
 * Uses Redis for distributed state storage
 */
export class SessionManager {
  private redis: Redis | null = null;
  private localSessions: Map<string, SessionState> = new Map(); // Fallback for no Redis
  private inviteCodeMap: Map<string, string> = new Map(); // inviteCode -> sessionId

  constructor() {
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    try {
      this.redis = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      await this.redis.connect();
      logger.info('Redis connected for session storage');
    } catch (error) {
      logger.warn('Redis connection failed, using in-memory storage', { error });
      this.redis = null;
    }
  }

  /**
   * Create a new game session
   */
  async createSession(
    hostUserId: string,
    hostUsername: string,
    hostDisplayName: string,
    options: {
      name: string;
      campaignId?: string;
      maxPlayers?: number;
      isPrivate?: boolean;
    }
  ): Promise<SessionState> {
    const sessionId = uuidv4();
    const inviteCode = generateInviteCode();

    const hostPlayer: Player = {
      userId: hostUserId,
      id: uuidv4(),
      username: hostUsername,
      displayName: hostDisplayName,
      isReady: false,
      isDM: true,
      isConnected: true,
    };

    const session: SessionState = {
      id: sessionId,
      name: options.name,
      inviteCode,
      hostUserId,
      campaignId: options.campaignId,
      status: 'lobby',
      maxPlayers: options.maxPlayers || config.session.defaultMaxPlayers,
      isPrivate: options.isPrivate || false,
      players: [hostPlayer],
      createdAt: Date.now(),
    };

    await this.saveSession(session);
    this.inviteCodeMap.set(inviteCode, sessionId);

    logger.info('Session created', {
      sessionId,
      inviteCode,
      hostUserId,
      name: options.name,
    });

    return session;
  }

  /**
   * Get a session by ID or invite code
   */
  async getSession(sessionIdOrCode: string): Promise<SessionState | null> {
    // Check if it's an invite code
    let sessionId = this.inviteCodeMap.get(sessionIdOrCode.toUpperCase());
    if (!sessionId) {
      sessionId = sessionIdOrCode;
    }

    if (this.redis) {
      try {
        const data = await this.redis.get(`session:${sessionId}`);
        if (data) {
          const session = JSON.parse(data) as SessionState;
          // Update invite code map
          this.inviteCodeMap.set(session.inviteCode, session.id);
          return session;
        }
      } catch (error) {
        logger.error('Redis get session error', { sessionId, error });
      }
    }

    return this.localSessions.get(sessionId) || null;
  }

  /**
   * Save session state
   */
  async saveSession(session: SessionState): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.set(
          `session:${session.id}`,
          JSON.stringify(session),
          'EX',
          Math.floor(config.session.sessionTimeout / 1000)
        );
      } catch (error) {
        logger.error('Redis save session error', { sessionId: session.id, error });
      }
    }

    this.localSessions.set(session.id, session);
    this.inviteCodeMap.set(session.inviteCode, session.id);
  }

  /**
   * Add a player to a session
   */
  async joinSession(
    sessionId: string,
    userId: string,
    username: string,
    displayName: string,
    characterId?: string,
    characterName?: string
  ): Promise<{ success: boolean; session?: SessionState; error?: string }> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.status !== 'lobby') {
      return { success: false, error: 'Session has already started' };
    }

    if (session.players.length >= session.maxPlayers) {
      return { success: false, error: 'Session is full' };
    }

    // Check if user is already in session
    const existingPlayer = session.players.find((p) => p.userId === userId);
    if (existingPlayer) {
      // Update connection status
      existingPlayer.isConnected = true;
      await this.saveSession(session);
      return { success: true, session };
    }

    const newPlayer: Player = {
      userId: userId,
      id: uuidv4(),
      username,
      displayName,
      characterId,
      characterName,
      isReady: false,
      isDM: false,
      isConnected: true,
    };

    session.players.push(newPlayer);
    await this.saveSession(session);

    // Broadcast player joined
    this.broadcastToSession(session.id, {
      type: WSMessageType.PLAYER_JOINED,
      timestamp: Date.now(),
      payload: {
        sessionId: session.id,
        player: newPlayer,
      },
    });

    logger.info('Player joined session', {
      sessionId,
      userId,
      username,
    });

    return { success: true, session };
  }

  /**
   * Remove a player from a session
   */
  async leaveSession(
    sessionId: string,
    userId: string
  ): Promise<{ success: boolean; session?: SessionState; sessionClosed?: boolean }> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return { success: false };
    }

    const playerIndex = session.players.findIndex((p) => p.userId === userId);
    if (playerIndex === -1) {
      return { success: false };
    }

    const player = session.players[playerIndex]!;
    session.players.splice(playerIndex, 1);

    // If host left, either transfer or close
    if (userId === session.hostUserId) {
      if (session.players.length > 0) {
        // Transfer host to next player
        const newHost = session.players[0]!;
        session.hostUserId = newHost.userId;
        newHost.isDM = true;

        logger.info('Host transferred', {
          sessionId,
          oldHost: userId,
          newHost: newHost.userId,
        });
      } else {
        // Close session
        await this.closeSession(sessionId);
        return { success: true, sessionClosed: true };
      }
    }

    await this.saveSession(session);

    // Broadcast player left
    this.broadcastToSession(session.id, {
      type: WSMessageType.PLAYER_LEFT,
      timestamp: Date.now(),
      payload: {
        sessionId: session.id,
        userId,
        username: player.username,
      },
    });

    logger.info('Player left session', {
      sessionId,
      userId,
    });

    return { success: true, session };
  }

  /**
   * Update player ready status
   */
  async setPlayerReady(
    sessionId: string,
    userId: string,
    isReady: boolean,
    characterId?: string
  ): Promise<SessionState | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const player = session.players.find((p) => p.userId === userId);
    if (!player) return null;

    player.isReady = isReady;
    if (characterId) {
      player.characterId = characterId;
    }

    await this.saveSession(session);

    // Broadcast ready status change
    this.broadcastToSession(session.id, {
      type: isReady ? WSMessageType.PLAYER_READY : WSMessageType.PLAYER_UNREADY,
      timestamp: Date.now(),
      payload: {
        sessionId: session.id,
        userId,
        isReady,
        characterId,
      },
    });

    return session;
  }

  /**
   * Update player connection status
   */
  async setPlayerConnected(
    sessionId: string,
    userId: string,
    isConnected: boolean
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    const player = session.players.find((p) => p.userId === userId);
    if (!player) return;

    player.isConnected = isConnected;
    await this.saveSession(session);

    // Broadcast connection status
    this.broadcastToSession(session.id, {
      type: WSMessageType.SYSTEM_MESSAGE,
      timestamp: Date.now(),
      payload: {
        sessionId: session.id,
        content: `${player.displayName} ${isConnected ? 'reconnected' : 'disconnected'}`,
        level: 'info',
      },
    });
  }

  /**
   * Start the game session
   */
  async startSession(sessionId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.hostUserId !== userId) {
      return { success: false, error: 'Only the host can start the game' };
    }

    if (session.status !== 'lobby') {
      return { success: false, error: 'Session already started' };
    }

    // Check all non-DM players are ready
    const unreadyPlayers = session.players.filter((p) => !p.isDM && !p.isReady);
    if (unreadyPlayers.length > 0) {
      return {
        success: false,
        error: `Players not ready: ${unreadyPlayers.map((p) => p.displayName).join(', ')}`,
      };
    }

    session.status = 'active';
    session.startedAt = Date.now();
    await this.saveSession(session);

    // Broadcast game start
    this.broadcastToSession(session.id, {
      type: WSMessageType.GAME_START,
      timestamp: Date.now(),
      payload: {
        sessionId: session.id,
      },
    });

    logger.info('Session started', { sessionId });

    return { success: true };
  }

  /**
   * Close a session
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    // Broadcast session closed
    this.broadcastToSession(session.id, {
      type: WSMessageType.SESSION_CLOSED,
      timestamp: Date.now(),
      payload: {
        sessionId: session.id,
        reason: 'Session closed by host',
      },
    });

    // Remove from storage
    if (this.redis) {
      try {
        await this.redis.del(`session:${sessionId}`);
      } catch (error) {
        logger.error('Redis delete session error', { sessionId, error });
      }
    }

    this.localSessions.delete(sessionId);
    this.inviteCodeMap.delete(session.inviteCode);

    logger.info('Session closed', { sessionId });
  }

  /**
   * Get player list for a session
   */
  async getPlayers(sessionId: string): Promise<Player[]> {
    const session = await this.getSession(sessionId);
    return session?.players || [];
  }

  /**
   * Broadcast message to all players in a session
   */
  broadcastToSession(sessionId: string, message: unknown, excludeConnectionId?: string): number {
    return connectionManager.broadcastToSession(sessionId, message, excludeConnectionId);
  }

  /**
   * Get active session count
   */
  getActiveSessionCount(): number {
    return this.localSessions.size;
  }

  /**
   * Cleanup expired sessions
   */
  async cleanup(): Promise<void> {
    const now = Date.now();

    for (const [sessionId, session] of this.localSessions) {
      // Check for inactive sessions
      const lastActivity = session.startedAt || session.createdAt;
      if (now - lastActivity > config.session.sessionTimeout) {
        await this.closeSession(sessionId);
      }
    }
  }

  /**
   * Shutdown session manager
   */
  async shutdown(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    this.localSessions.clear();
    this.inviteCodeMap.clear();
    logger.info('SessionManager shutdown complete');
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
