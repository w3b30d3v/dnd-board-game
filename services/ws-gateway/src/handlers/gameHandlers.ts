import { WSMessageType } from '@dnd/shared';
import { connectionManager, type Connection } from '../ConnectionManager.js';
import { sessionManager } from '../SessionManager.js';
import { logger } from '../lib/logger.js';
import { sendError, type IncomingMessage } from './MessageHandler.js';
import { broadcastSystemMessage } from './chatHandlers.js';

/**
 * Simple dice rolling (without rules engine for now)
 */
function rollDice(expression: string): { rolls: number[]; modifier: number; total: number } {
  // Parse expression like "2d6+4", "1d20", "3d8-2"
  const match = expression.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) {
    return { rolls: [0], modifier: 0, total: 0 };
  }

  const count = parseInt(match[1]!, 10);
  const sides = parseInt(match[2]!, 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }

  const total = rolls.reduce((sum, r) => sum + r, 0) + modifier;

  return { rolls, modifier, total };
}

/**
 * Handle dice roll request
 */
export async function handleDiceRoll(
  connection: Connection,
  message: IncomingMessage
): Promise<void> {
  if (message.type !== WSMessageType.DICE_ROLL) return;
  if (!connection.user || !connection.sessionId) {
    sendError(connection.id, 'NOT_IN_SESSION', 'You must be in a session to roll dice');
    return;
  }

  const { dice, reason, isPrivate } = message.payload;

  // Validate dice expression
  const validDice = /^(\d+)d(\d+)([+-]\d+)?$/i.test(dice);
  if (!validDice) {
    sendError(connection.id, 'INVALID_DICE', 'Invalid dice expression (e.g., 2d6+4)');
    return;
  }

  const result = rollDice(dice);

  // Get player info
  const session = await sessionManager.getSession(connection.sessionId);
  const player = session?.players.find((p) => p.userId === connection.user?.userId);
  const playerName = player?.displayName || 'Unknown';

  const diceResult = {
    type: WSMessageType.DICE_RESULT,
    timestamp: Date.now(),
    payload: {
      sessionId: connection.sessionId,
      playerId: connection.user.userId,
      playerName,
      dice,
      rolls: result.rolls,
      modifier: result.modifier,
      total: result.total,
      reason,
      isPrivate: isPrivate || false,
    },
  };

  if (isPrivate) {
    // Only send to the roller and the DM
    connectionManager.send(connection.id, diceResult);

    // Find DM and send to them too
    if (session) {
      const dm = session.players.find((p) => p.isDM);
      if (dm && dm.userId !== connection.user.userId) {
        const dmConnections = connectionManager.getUserConnections(dm.userId);
        for (const dmConn of dmConnections) {
          if (dmConn.sessionId === connection.sessionId) {
            connectionManager.send(dmConn.id, diceResult);
          }
        }
      }
    }
  } else {
    // Broadcast to all players in session
    sessionManager.broadcastToSession(connection.sessionId, diceResult);
  }

  logger.debug('Dice rolled', {
    sessionId: connection.sessionId,
    dice,
    total: result.total,
    isPrivate,
  });
}

/**
 * Handle turn end request
 */
export async function handleTurnEnd(
  connection: Connection,
  message: IncomingMessage
): Promise<void> {
  if (message.type !== WSMessageType.TURN_END) return;
  if (!connection.user || !connection.sessionId) {
    sendError(connection.id, 'NOT_IN_SESSION', 'You must be in a session');
    return;
  }

  const session = await sessionManager.getSession(connection.sessionId);
  if (!session) {
    sendError(connection.id, 'SESSION_NOT_FOUND', 'Session not found');
    return;
  }

  // For now, just broadcast the turn end
  // TODO: Integrate with combat manager for proper turn management

  const { creatureId } = message.payload;

  sessionManager.broadcastToSession(connection.sessionId, {
    type: WSMessageType.TURN_END,
    timestamp: Date.now(),
    payload: {
      sessionId: connection.sessionId,
      creatureId,
    },
  });

  logger.debug('Turn ended', {
    sessionId: connection.sessionId,
    creatureId,
  });
}

/**
 * Handle action request (attack, cast spell, etc.)
 */
export async function handleActionRequest(
  connection: Connection,
  message: IncomingMessage
): Promise<void> {
  if (message.type !== WSMessageType.ACTION_REQUEST) return;
  if (!connection.user || !connection.sessionId) {
    sendError(connection.id, 'NOT_IN_SESSION', 'You must be in a session');
    return;
  }

  const session = await sessionManager.getSession(connection.sessionId);
  if (!session || session.status !== 'active') {
    sendError(connection.id, 'SESSION_NOT_ACTIVE', 'Session is not active');
    return;
  }

  const { actionType, creatureId, targetId } = message.payload;

  // TODO: Validate action with rules engine
  // For now, just acknowledge and broadcast a result

  // Get player info for messaging
  const player = session.players.find((p) => p.userId === connection.user?.userId);
  const playerName = player?.characterName || player?.displayName || 'Unknown';

  // Simulate action result
  const actionResult = {
    type: WSMessageType.ACTION_RESULT,
    timestamp: Date.now(),
    payload: {
      sessionId: connection.sessionId,
      creatureId,
      actionType,
      success: true,
      message: `${playerName} performed ${actionType}${targetId ? ` on target` : ''}`,
    },
  };

  sessionManager.broadcastToSession(connection.sessionId, actionResult);

  // Also send a system message for visibility
  broadcastSystemMessage(
    connection.sessionId,
    `${playerName} used ${actionType}`,
    'info'
  );

  logger.debug('Action performed', {
    sessionId: connection.sessionId,
    actionType,
    creatureId,
    targetId,
  });
}

/**
 * Handle combat start
 */
export async function handleCombatStart(
  sessionId: string,
  creatures: { id: string; name: string; initiative: number }[]
): Promise<void> {
  // Sort by initiative
  const sorted = [...creatures].sort((a, b) => b.initiative - a.initiative);
  const initiativeOrder = sorted.map((c) => c.id);

  sessionManager.broadcastToSession(sessionId, {
    type: WSMessageType.COMBAT_START,
    timestamp: Date.now(),
    payload: {
      sessionId,
    },
  });

  sessionManager.broadcastToSession(sessionId, {
    type: WSMessageType.INITIATIVE_ORDER,
    timestamp: Date.now(),
    payload: {
      sessionId,
      order: sorted.map((c) => ({
        creatureId: c.id,
        name: c.name,
        initiative: c.initiative,
      })),
    },
  });

  // Start first turn
  if (initiativeOrder.length > 0) {
    sessionManager.broadcastToSession(sessionId, {
      type: WSMessageType.TURN_START,
      timestamp: Date.now(),
      payload: {
        sessionId,
        creatureId: initiativeOrder[0]!,
        round: 1,
        turnIndex: 0,
        timeLimit: 120, // 2 minutes
      },
    });
  }

  broadcastSystemMessage(sessionId, 'Combat has begun! Roll for initiative!', 'warning');

  logger.info('Combat started', { sessionId, creatureCount: creatures.length });
}

/**
 * Handle combat end
 */
export async function handleCombatEnd(
  sessionId: string,
  victorious: boolean
): Promise<void> {
  sessionManager.broadcastToSession(sessionId, {
    type: WSMessageType.COMBAT_END,
    timestamp: Date.now(),
    payload: {
      sessionId,
      victorious,
    },
  });

  broadcastSystemMessage(
    sessionId,
    victorious ? 'Victory! Combat has ended.' : 'Combat has ended.',
    victorious ? 'success' : 'info'
  );

  logger.info('Combat ended', { sessionId, victorious });
}
