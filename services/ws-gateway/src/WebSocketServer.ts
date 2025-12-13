import { WebSocketServer as WSServer, type WebSocket } from 'ws';
import { createServer, type Server } from 'http';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { connectionManager } from './ConnectionManager.js';
import { sessionManager } from './SessionManager.js';
import { handleMessage } from './handlers/MessageHandler.js';

/**
 * WebSocket Gateway Server
 * Handles real-time multiplayer communication
 */
export class WebSocketServer {
  private server: Server;
  private wss: WSServer;
  private isShuttingDown = false;

  constructor() {
    // Create HTTP server for WebSocket upgrade
    this.server = createServer((req, res) => {
      // Health check endpoint
      if (req.url === '/health') {
        const stats = connectionManager.getStats();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'healthy',
            ...stats,
            activeSessions: sessionManager.getActiveSessionCount(),
          })
        );
        return;
      }

      // All other HTTP requests return 426 Upgrade Required
      res.writeHead(426, { 'Content-Type': 'text/plain' });
      res.end('WebSocket connection required');
    });

    // Create WebSocket server
    this.wss = new WSServer({
      server: this.server,
      path: '/ws',
      maxPayload: 64 * 1024, // 64KB max message size
    });

    this.setupWebSocketHandlers();
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (socket: WebSocket, request) => {
      if (this.isShuttingDown) {
        socket.close(1001, 'Server shutting down');
        return;
      }

      // Check connection limit
      const stats = connectionManager.getStats();
      if (stats.totalConnections >= config.connection.maxConnections) {
        logger.warn('Max connections reached');
        socket.close(1013, 'Server at capacity');
        return;
      }

      // Register connection
      const connectionId = connectionManager.registerConnection(socket);

      // Get client IP for logging
      const clientIp =
        request.headers['x-forwarded-for']?.toString().split(',')[0] ||
        request.socket.remoteAddress;

      logger.info('WebSocket connected', {
        connectionId,
        clientIp,
        userAgent: request.headers['user-agent'],
      });

      // Handle incoming messages
      socket.on('message', async (data) => {
        try {
          const message = data.toString();
          await handleMessage(connectionId, message);
        } catch (error) {
          logger.error('Error processing message', { connectionId, error });
        }
      });

      // Handle pong (response to ping)
      socket.on('pong', () => {
        connectionManager.updateHeartbeat(connectionId);
      });

      // Handle connection close
      socket.on('close', (code, reason) => {
        logger.info('WebSocket disconnected', {
          connectionId,
          code,
          reason: reason.toString(),
        });

        const connection = connectionManager.getConnection(connectionId);
        if (connection?.sessionId && connection?.user) {
          // Mark player as disconnected in session
          sessionManager.setPlayerConnected(
            connection.sessionId,
            connection.user.userId,
            false
          );
        }

        connectionManager.removeConnection(connectionId);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('WebSocket error', { connectionId, error: error.message });
      });

      // Send initial connection acknowledgment
      socket.send(
        JSON.stringify({
          type: 'CONNECTED',
          timestamp: Date.now(),
          payload: {
            connectionId,
            serverVersion: '1.0.0',
            heartbeatInterval: config.connection.heartbeatInterval,
          },
        })
      );
    });

    // Server error handling
    this.wss.on('error', (error) => {
      logger.error('WebSocket server error', { error: error.message });
    });
  }

  /**
   * Start the WebSocket server
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(config.port, config.host, () => {
        logger.info('WebSocket server started', {
          port: config.port,
          host: config.host,
          wsPath: '/ws',
          healthPath: '/health',
        });
        resolve();
      });
    });
  }

  /**
   * Gracefully shutdown the server
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket server...');
    this.isShuttingDown = true;

    // Close all WebSocket connections
    connectionManager.shutdown();

    // Close session manager
    await sessionManager.shutdown();

    // Close WebSocket server
    await new Promise<void>((resolve) => {
      this.wss.close(() => {
        logger.info('WebSocket server closed');
        resolve();
      });
    });

    // Close HTTP server
    await new Promise<void>((resolve) => {
      this.server.close(() => {
        logger.info('HTTP server closed');
        resolve();
      });
    });

    logger.info('WebSocket server shutdown complete');
  }

  /**
   * Get server statistics
   */
  getStats(): {
    connections: ReturnType<typeof connectionManager.getStats>;
    sessions: number;
  } {
    return {
      connections: connectionManager.getStats(),
      sessions: sessionManager.getActiveSessionCount(),
    };
  }
}
