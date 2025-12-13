import type { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import type { AuthenticatedUser } from './auth/validateToken.js';

export interface Connection {
  id: string;
  socket: WebSocket;
  user: AuthenticatedUser | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  connectedAt: number;
  lastHeartbeat: number;
  messageCount: number;
  metadata: Record<string, unknown>;
}

/**
 * Manages WebSocket connections
 * Tracks authenticated users and their sessions
 */
export class ConnectionManager {
  private connections: Map<string, Connection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> connectionIds
  private sessionConnections: Map<string, Set<string>> = new Map(); // sessionId -> connectionIds
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  /**
   * Register a new WebSocket connection
   */
  registerConnection(socket: WebSocket): string {
    const connectionId = uuidv4();

    const connection: Connection = {
      id: connectionId,
      socket,
      user: null,
      sessionId: null,
      isAuthenticated: false,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
      messageCount: 0,
      metadata: {},
    };

    this.connections.set(connectionId, connection);
    logger.info('Connection registered', { connectionId });

    return connectionId;
  }

  /**
   * Authenticate a connection with user info
   */
  authenticateConnection(connectionId: string, user: AuthenticatedUser): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      logger.warn('Connection not found for authentication', { connectionId });
      return false;
    }

    // Check max connections per user
    const existingConnections = this.userConnections.get(user.userId);
    if (
      existingConnections &&
      existingConnections.size >= config.connection.maxConnectionsPerUser
    ) {
      logger.warn('Max connections per user exceeded', {
        userId: user.userId,
        count: existingConnections.size,
      });
      return false;
    }

    connection.user = user;
    connection.isAuthenticated = true;

    // Track user connections
    if (!this.userConnections.has(user.userId)) {
      this.userConnections.set(user.userId, new Set());
    }
    this.userConnections.get(user.userId)!.add(connectionId);

    logger.info('Connection authenticated', {
      connectionId,
      userId: user.userId,
    });

    return true;
  }

  /**
   * Associate a connection with a game session
   */
  joinSession(connectionId: string, sessionId: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isAuthenticated) {
      return false;
    }

    // Leave previous session if any
    if (connection.sessionId) {
      this.leaveSession(connectionId);
    }

    connection.sessionId = sessionId;

    // Track session connections
    if (!this.sessionConnections.has(sessionId)) {
      this.sessionConnections.set(sessionId, new Set());
    }
    this.sessionConnections.get(sessionId)!.add(connectionId);

    logger.info('Connection joined session', {
      connectionId,
      sessionId,
      userId: connection.user?.userId,
    });

    return true;
  }

  /**
   * Remove connection from its current session
   */
  leaveSession(connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.sessionId) {
      return false;
    }

    const sessionId = connection.sessionId;
    this.sessionConnections.get(sessionId)?.delete(connectionId);

    // Clean up empty session sets
    if (this.sessionConnections.get(sessionId)?.size === 0) {
      this.sessionConnections.delete(sessionId);
    }

    connection.sessionId = null;

    logger.info('Connection left session', {
      connectionId,
      sessionId,
      userId: connection.user?.userId,
    });

    return true;
  }

  /**
   * Remove a connection entirely
   */
  removeConnection(connectionId: string): Connection | null {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return null;
    }

    // Leave session
    if (connection.sessionId) {
      this.leaveSession(connectionId);
    }

    // Remove from user connections
    if (connection.user) {
      this.userConnections.get(connection.user.userId)?.delete(connectionId);
      if (this.userConnections.get(connection.user.userId)?.size === 0) {
        this.userConnections.delete(connection.user.userId);
      }
    }

    this.connections.delete(connectionId);

    logger.info('Connection removed', {
      connectionId,
      userId: connection.user?.userId,
    });

    return connection;
  }

  /**
   * Get a connection by ID
   */
  getConnection(connectionId: string): Connection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get all connections for a user
   */
  getUserConnections(userId: string): Connection[] {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) return [];

    return Array.from(connectionIds)
      .map((id) => this.connections.get(id))
      .filter((c): c is Connection => c !== undefined);
  }

  /**
   * Get all connections in a session
   */
  getSessionConnections(sessionId: string): Connection[] {
    const connectionIds = this.sessionConnections.get(sessionId);
    if (!connectionIds) return [];

    return Array.from(connectionIds)
      .map((id) => this.connections.get(id))
      .filter((c): c is Connection => c !== undefined);
  }

  /**
   * Update heartbeat for a connection
   */
  updateHeartbeat(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastHeartbeat = Date.now();
    }
  }

  /**
   * Send message to a specific connection
   */
  send(connectionId: string, message: unknown): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.socket.readyState !== 1) {
      return false;
    }

    try {
      connection.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error('Failed to send message', { connectionId, error });
      return false;
    }
  }

  /**
   * Broadcast message to all connections in a session
   */
  broadcastToSession(sessionId: string, message: unknown, excludeConnectionId?: string): number {
    const connections = this.getSessionConnections(sessionId);
    let sent = 0;

    for (const connection of connections) {
      if (excludeConnectionId && connection.id === excludeConnectionId) {
        continue;
      }
      if (this.send(connection.id, message)) {
        sent++;
      }
    }

    return sent;
  }

  /**
   * Broadcast message to all connections of a user
   */
  broadcastToUser(userId: string, message: unknown): number {
    const connections = this.getUserConnections(userId);
    let sent = 0;

    for (const connection of connections) {
      if (this.send(connection.id, message)) {
        sent++;
      }
    }

    return sent;
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    authenticatedConnections: number;
    uniqueUsers: number;
    activeSessions: number;
  } {
    let authenticatedCount = 0;
    for (const connection of this.connections.values()) {
      if (connection.isAuthenticated) {
        authenticatedCount++;
      }
    }

    return {
      totalConnections: this.connections.size,
      authenticatedConnections: authenticatedCount,
      uniqueUsers: this.userConnections.size,
      activeSessions: this.sessionConnections.size,
    };
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = config.connection.heartbeatTimeout;

      for (const [connectionId, connection] of this.connections) {
        // Check if connection has timed out
        if (now - connection.lastHeartbeat > config.connection.heartbeatInterval + timeout) {
          logger.info('Connection timed out', { connectionId });
          connection.socket.terminate();
          this.removeConnection(connectionId);
        } else if (now - connection.lastHeartbeat > config.connection.heartbeatInterval) {
          // Send ping
          try {
            connection.socket.ping();
          } catch {
            // Socket might be closing
          }
        }
      }
    }, config.connection.heartbeatInterval);
  }

  /**
   * Cleanup and stop heartbeat
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all connections
    for (const [connectionId, connection] of this.connections) {
      try {
        connection.socket.close(1001, 'Server shutting down');
      } catch {
        // Ignore errors during shutdown
      }
      this.connections.delete(connectionId);
    }

    this.userConnections.clear();
    this.sessionConnections.clear();

    logger.info('ConnectionManager shutdown complete');
  }
}

// Singleton instance
export const connectionManager = new ConnectionManager();
