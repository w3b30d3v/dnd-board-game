import { WSMessageType } from '@dnd/shared';
import { connectionManager, type Connection } from '../ConnectionManager.js';
import { sessionManager } from '../SessionManager.js';
import { validateToken } from '../auth/validateToken.js';
import { logger } from '../lib/logger.js';
import { handleChatMessage, handleWhisper } from './chatHandlers.js';
import { handleTurnEnd, handleActionRequest, handleDiceRoll } from './gameHandlers.js';

// Flexible message type for incoming messages
export interface IncomingMessage {
  type: string;
  timestamp?: number;
  correlationId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
}

// Helper to safely extract payload
export function getPayload<T>(message: IncomingMessage): T {
  return (message.payload || {}) as T;
}

/**
 * Route incoming messages to appropriate handlers
 */
export async function handleMessage(
  connectionId: string,
  rawMessage: string
): Promise<void> {
  const connection = connectionManager.getConnection(connectionId);
  if (!connection) {
    logger.warn('Message from unknown connection', { connectionId });
    return;
  }

  let message: IncomingMessage;
  try {
    message = JSON.parse(rawMessage);
  } catch {
    sendError(connectionId, 'INVALID_JSON', 'Invalid JSON message');
    return;
  }

  // Update heartbeat on any message
  connectionManager.updateHeartbeat(connectionId);

  // Handle ping/pong
  if (message.type === WSMessageType.PING) {
    connectionManager.send(connectionId, {
      type: WSMessageType.PONG,
      timestamp: Date.now(),
    });
    return;
  }

  // Handle authentication first (required for all other messages except ping)
  if (message.type === WSMessageType.AUTHENTICATE) {
    await handleAuthenticate(connection, message);
    return;
  }

  // All other messages require authentication
  if (!connection.isAuthenticated || !connection.user) {
    sendError(connectionId, 'NOT_AUTHENTICATED', 'Please authenticate first');
    return;
  }

  // Route to specific handlers
  try {
    switch (message.type) {
      // Session management
      case WSMessageType.CREATE_SESSION:
        await handleCreateSession(connection, message);
        break;

      case WSMessageType.JOIN_SESSION:
        await handleJoinSession(connection, message);
        break;

      case WSMessageType.LEAVE_SESSION:
        await handleLeaveSession(connection, message);
        break;

      case WSMessageType.PLAYER_READY:
        await handlePlayerReady(connection, message);
        break;

      case WSMessageType.GAME_START:
        await handleGameStart(connection, message);
        break;

      // Session Lock
      case WSMessageType.SESSION_LOCK:
        await handleSessionLock(connection, message, true);
        break;

      case WSMessageType.SESSION_UNLOCK:
        await handleSessionLock(connection, message, false);
        break;

      // Chat
      case WSMessageType.CHAT_MESSAGE:
        await handleChatMessage(connection, message);
        break;

      case WSMessageType.WHISPER:
        await handleWhisper(connection, message);
        break;

      // Game actions
      case WSMessageType.TURN_END:
        await handleTurnEnd(connection, message);
        break;

      case WSMessageType.ACTION_REQUEST:
        await handleActionRequest(connection, message);
        break;

      case WSMessageType.DICE_ROLL:
        await handleDiceRoll(connection, message);
        break;

      case WSMessageType.MOVE_TOKEN:
        await handleMoveToken(connection, message);
        break;

      default:
        logger.warn('Unknown message type', {
          type: message.type,
          connectionId,
        });
        sendError(connectionId, 'UNKNOWN_MESSAGE', `Unknown message type: ${message.type}`);
    }
  } catch (error) {
    logger.error('Error handling message', {
      type: message.type,
      connectionId,
      error,
    });
    sendError(connectionId, 'HANDLER_ERROR', 'Error processing message');
  }
}

/**
 * Handle authentication message
 */
async function handleAuthenticate(
  connection: Connection,
  message: IncomingMessage
): Promise<void> {
  if (message.type !== WSMessageType.AUTHENTICATE) return;

  const { token } = message.payload;
  const user = validateToken(token);

  if (!user) {
    connectionManager.send(connection.id, {
      type: WSMessageType.AUTH_ERROR,
      timestamp: Date.now(),
      payload: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
    return;
  }

  const success = connectionManager.authenticateConnection(connection.id, user);
  if (!success) {
    connectionManager.send(connection.id, {
      type: WSMessageType.AUTH_ERROR,
      timestamp: Date.now(),
      payload: {
        code: 'AUTH_FAILED',
        message: 'Too many connections for this user',
      },
    });
    return;
  }

  // Send authenticated message with displayName from JWT token
  connectionManager.send(connection.id, {
    type: WSMessageType.AUTHENTICATED,
    timestamp: Date.now(),
    payload: {
      userId: user.userId,
      username: user.displayName.toLowerCase().replace(/\s+/g, '_'),
      displayName: user.displayName,
    },
  });

  logger.info('User authenticated', { connectionId: connection.id, odId: user.userId });
}

/**
 * Handle create session message
 */
async function handleCreateSession(
  connection: Connection,
  message: IncomingMessage
): Promise<void> {
  if (message.type !== WSMessageType.CREATE_SESSION) return;
  if (!connection.user) return;

  const { name, campaignId, maxPlayers, isPrivate } = message.payload;

  const session = await sessionManager.createSession(
    connection.user.userId,
    connection.user.displayName.toLowerCase().replace(/\s+/g, '_'),
    connection.user.displayName,
    { name, campaignId, maxPlayers, isPrivate }
  );

  // Join the connection to the session
  connectionManager.joinSession(connection.id, session.id);

  connectionManager.send(connection.id, {
    type: WSMessageType.SESSION_CREATED,
    timestamp: Date.now(),
    correlationId: message.correlationId,
    payload: {
      sessionId: session.id,
      inviteCode: session.inviteCode,
      name: session.name,
    },
  });

  // Send initial player list
  connectionManager.send(connection.id, {
    type: WSMessageType.PLAYER_LIST,
    timestamp: Date.now(),
    payload: {
      sessionId: session.id,
      players: session.players,
    },
  });
}

/**
 * Handle join session message
 */
async function handleJoinSession(
  connection: Connection,
  message: IncomingMessage
): Promise<void> {
  if (message.type !== WSMessageType.JOIN_SESSION) return;
  if (!connection.user) return;

  const { sessionId, inviteCode, characterId } = message.payload;
  const sessionIdentifier = sessionId || inviteCode;

  if (!sessionIdentifier) {
    sendError(connection.id, 'MISSING_SESSION', 'Session ID or invite code required');
    return;
  }

  const result = await sessionManager.joinSession(
    sessionIdentifier,
    connection.user.userId,
    connection.user.displayName.toLowerCase().replace(/\s+/g, '_'),
    connection.user.displayName,
    characterId
  );

  if (!result.success || !result.session) {
    connectionManager.send(connection.id, {
      type: WSMessageType.SESSION_ERROR,
      timestamp: Date.now(),
      correlationId: message.correlationId,
      payload: {
        code: 'JOIN_FAILED',
        message: result.error || 'Failed to join session',
      },
    });
    return;
  }

  // Join the connection to the session
  connectionManager.joinSession(connection.id, result.session.id);

  connectionManager.send(connection.id, {
    type: WSMessageType.SESSION_JOINED,
    timestamp: Date.now(),
    correlationId: message.correlationId,
    payload: {
      sessionId: result.session.id,
      name: result.session.name,
      status: result.session.status,
    },
  });

  // Send player list
  connectionManager.send(connection.id, {
    type: WSMessageType.PLAYER_LIST,
    timestamp: Date.now(),
    payload: {
      sessionId: result.session.id,
      players: result.session.players,
    },
  });
}

/**
 * Handle leave session message
 */
async function handleLeaveSession(
  connection: Connection,
  message: IncomingMessage
): Promise<void> {
  if (message.type !== WSMessageType.LEAVE_SESSION) return;
  if (!connection.user || !connection.sessionId) return;

  const result = await sessionManager.leaveSession(
    connection.sessionId,
    connection.user.userId
  );

  if (result.success) {
    connectionManager.leaveSession(connection.id);

    connectionManager.send(connection.id, {
      type: WSMessageType.SESSION_LEFT,
      timestamp: Date.now(),
      correlationId: message.correlationId,
      payload: {
        sessionId: message.payload.sessionId,
      },
    });
  }
}

/**
 * Handle player ready message - toggles ready status
 */
async function handlePlayerReady(
  connection: Connection,
  message: IncomingMessage
): Promise<void> {
  if (message.type !== WSMessageType.PLAYER_READY) return;
  if (!connection.user || !connection.sessionId) return;

  const { characterId } = message.payload;

  // Get current session to check player's ready state
  const currentSession = await sessionManager.getSession(connection.sessionId);
  if (!currentSession) return;

  const player = currentSession.players.find(p => p.userId === connection.user!.userId);
  if (!player) return;

  // Toggle ready state
  const newReadyState = !player.isReady;

  const session = await sessionManager.setPlayerReady(
    connection.sessionId,
    connection.user.userId,
    newReadyState,
    characterId
  );

  if (session) {
    // Broadcast updated player list
    sessionManager.broadcastToSession(connection.sessionId, {
      type: WSMessageType.PLAYER_LIST,
      timestamp: Date.now(),
      payload: {
        sessionId: session.id,
        players: session.players,
      },
    });
  }
}

/**
 * Handle game start message
 */
async function handleGameStart(
  connection: Connection,
  message: IncomingMessage
): Promise<void> {
  if (message.type !== WSMessageType.GAME_START) return;
  if (!connection.user || !connection.sessionId) return;

  const result = await sessionManager.startSession(
    connection.sessionId,
    connection.user.userId
  );

  if (!result.success) {
    sendError(connection.id, 'START_FAILED', result.error || 'Failed to start game');
  }
  // Success broadcast is handled in startSession
}

/**
 * Handle session lock/unlock message
 */
async function handleSessionLock(
  connection: Connection,
  message: IncomingMessage,
  isLocking: boolean
): Promise<void> {
  if (!connection.user || !connection.sessionId) {
    sendError(connection.id, 'NOT_IN_SESSION', 'You must be in a session');
    return;
  }

  const { allowedUsers } = message.payload || {};

  const result = await sessionManager.setSessionLock(
    connection.sessionId,
    connection.user.userId,
    isLocking,
    allowedUsers
  );

  if (!result.success) {
    sendError(connection.id, 'LOCK_FAILED', result.error || 'Failed to change lock status');
    return;
  }

  // Success broadcast is handled in setSessionLock
  logger.info(`Session ${isLocking ? 'locked' : 'unlocked'}`, {
    sessionId: connection.sessionId,
    userId: connection.user.userId,
  });
}

/**
 * Handle move token message
 */
async function handleMoveToken(
  connection: Connection,
  message: IncomingMessage
): Promise<void> {
  if (message.type !== WSMessageType.MOVE_TOKEN) return;
  if (!connection.sessionId) return;

  const { tokenId, path } = message.payload;

  // TODO: Validate movement with rules engine
  // For now, just broadcast the movement

  sessionManager.broadcastToSession(connection.sessionId, {
    type: WSMessageType.TOKEN_MOVED,
    timestamp: Date.now(),
    payload: {
      sessionId: connection.sessionId,
      tokenId,
      creatureId: tokenId, // TODO: Map token to creature
      fromPosition: path[0],
      toPosition: path[path.length - 1],
      path,
    },
  });
}

/**
 * Send an error message to a connection
 */
export function sendError(
  connectionId: string,
  code: string,
  message: string,
  details?: Record<string, unknown>
): void {
  connectionManager.send(connectionId, {
    type: WSMessageType.ERROR,
    timestamp: Date.now(),
    payload: {
      code,
      message,
      details,
    },
  });
}
