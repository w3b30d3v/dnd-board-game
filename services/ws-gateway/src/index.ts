/**
 * WebSocket Gateway Service
 * Real-time multiplayer communication for D&D sessions
 */

import { WebSocketServer } from './WebSocketServer.js';
import { logger } from './lib/logger.js';

// Create server instance
const server = new WebSocketServer();

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal');
  await server.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal');
  await server.shutdown();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal('Unhandled rejection', { reason });
  process.exit(1);
});

// Start server
server.start().then(() => {
  logger.info('WebSocket Gateway ready');
}).catch((error) => {
  logger.fatal('Failed to start WebSocket Gateway', { error });
  process.exit(1);
});
