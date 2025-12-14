import { WSMessageType } from '@dnd/shared';
import { connectionManager, type Connection } from '../ConnectionManager.js';
import { sessionManager } from '../SessionManager.js';
import { logger } from '../lib/logger.js';
import { sendError, type IncomingMessage } from './MessageHandler.js';

/**
 * Handle chat message broadcast to session
 */
export async function handleChatMessage(
  connection: Connection,
  message: IncomingMessage
): Promise<void> {
  if (message.type !== WSMessageType.CHAT_MESSAGE) return;
  if (!connection.user || !connection.sessionId) {
    sendError(connection.id, 'NOT_IN_SESSION', 'You must be in a session to chat');
    return;
  }

  const { content, isInCharacter } = message.payload;

  // Validate content length
  if (!content || content.length === 0) {
    sendError(connection.id, 'EMPTY_MESSAGE', 'Message cannot be empty');
    return;
  }

  if (content.length > 1000) {
    sendError(connection.id, 'MESSAGE_TOO_LONG', 'Message exceeds 1000 characters');
    return;
  }

  // Get player info
  const session = await sessionManager.getSession(connection.sessionId);
  const player = session?.players.find((p) => p.userId === connection.user?.userId);

  const displayName = player?.displayName || 'Unknown';
  const characterName = player?.characterName;

  // For in-character: show "CharName (Player)" or just "Player" if no character
  // For out-of-character: show "Player" or "Player [CharName]" if has character
  const senderName = isInCharacter && characterName
    ? `${characterName} (${displayName})`
    : characterName
      ? `${displayName} [${characterName}]`
      : displayName;

  // Broadcast to all players in session
  sessionManager.broadcastToSession(connection.sessionId, {
    type: WSMessageType.CHAT_BROADCAST,
    timestamp: Date.now(),
    payload: {
      sessionId: connection.sessionId,
      senderId: connection.user.userId,
      senderName,
      displayName,
      characterName,
      content,
      isInCharacter: isInCharacter || false,
      timestamp: Date.now(),
    },
  });

  logger.debug('Chat message broadcast', {
    sessionId: connection.sessionId,
    senderId: connection.user.userId,
    isInCharacter,
  });
}

/**
 * Handle private whisper message
 */
export async function handleWhisper(
  connection: Connection,
  message: IncomingMessage
): Promise<void> {
  if (message.type !== WSMessageType.WHISPER) return;
  if (!connection.user || !connection.sessionId) {
    sendError(connection.id, 'NOT_IN_SESSION', 'You must be in a session to whisper');
    return;
  }

  const { targetUserId, content } = message.payload;

  // Validate content
  if (!content || content.length === 0) {
    sendError(connection.id, 'EMPTY_MESSAGE', 'Whisper cannot be empty');
    return;
  }

  if (content.length > 1000) {
    sendError(connection.id, 'MESSAGE_TOO_LONG', 'Message exceeds 1000 characters');
    return;
  }

  // Get session to verify target is in session
  const session = await sessionManager.getSession(connection.sessionId);
  if (!session) {
    sendError(connection.id, 'SESSION_NOT_FOUND', 'Session not found');
    return;
  }

  const targetPlayer = session.players.find((p) => p.userId === targetUserId);
  if (!targetPlayer) {
    sendError(connection.id, 'PLAYER_NOT_FOUND', 'Target player not in session');
    return;
  }

  const senderPlayer = session.players.find((p) => p.userId === connection.user?.userId);
  const senderName = senderPlayer?.displayName || 'Unknown';

  // Send to target user (all their connections in this session)
  const targetConnections = connectionManager.getUserConnections(targetUserId);
  for (const targetConn of targetConnections) {
    if (targetConn.sessionId === connection.sessionId) {
      connectionManager.send(targetConn.id, {
        type: WSMessageType.WHISPER_RECEIVED,
        timestamp: Date.now(),
        payload: {
          sessionId: connection.sessionId,
          senderId: connection.user.userId,
          senderName,
          content,
          timestamp: Date.now(),
        },
      });
    }
  }

  // Echo back to sender for confirmation
  connectionManager.send(connection.id, {
    type: WSMessageType.WHISPER_RECEIVED,
    timestamp: Date.now(),
    payload: {
      sessionId: connection.sessionId,
      senderId: connection.user.userId,
      senderName: `You → ${targetPlayer.displayName}`,
      content,
      timestamp: Date.now(),
    },
  });

  logger.debug('Whisper sent', {
    sessionId: connection.sessionId,
    senderId: connection.user.userId,
    targetUserId,
  });
}

/**
 * Send a system message to a session
 */
export function broadcastSystemMessage(
  sessionId: string,
  content: string,
  level: 'info' | 'warning' | 'error' | 'success' = 'info'
): void {
  sessionManager.broadcastToSession(sessionId, {
    type: WSMessageType.SYSTEM_MESSAGE,
    timestamp: Date.now(),
    payload: {
      sessionId,
      content,
      level,
    },
  });
}
