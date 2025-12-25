import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { WebSocket } from 'ws';
import { ConnectionManager } from '../ConnectionManager';

// Mock WebSocket
function createMockSocket(readyState = 1): WebSocket {
  return {
    readyState,
    send: vi.fn(),
    ping: vi.fn(),
    close: vi.fn(),
    terminate: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  } as unknown as WebSocket;
}

describe('ConnectionManager', () => {
  let manager: ConnectionManager;

  beforeEach(() => {
    manager = new ConnectionManager();
  });

  afterEach(() => {
    manager.shutdown();
  });

  describe('registerConnection', () => {
    it('should register a new connection and return an ID', () => {
      const socket = createMockSocket();
      const connectionId = manager.registerConnection(socket);

      expect(connectionId).toBeDefined();
      expect(typeof connectionId).toBe('string');
      expect(connectionId.length).toBeGreaterThan(0);
    });

    it('should store connection with correct initial state', () => {
      const socket = createMockSocket();
      const connectionId = manager.registerConnection(socket);
      const connection = manager.getConnection(connectionId);

      expect(connection).toBeDefined();
      expect(connection?.socket).toBe(socket);
      expect(connection?.user).toBeNull();
      expect(connection?.sessionId).toBeNull();
      expect(connection?.isAuthenticated).toBe(false);
    });

    it('should generate unique IDs for each connection', () => {
      const socket1 = createMockSocket();
      const socket2 = createMockSocket();

      const id1 = manager.registerConnection(socket1);
      const id2 = manager.registerConnection(socket2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('authenticateConnection', () => {
    it('should authenticate a connection with user info', () => {
      const socket = createMockSocket();
      const connectionId = manager.registerConnection(socket);

      const success = manager.authenticateConnection(connectionId, {
        userId: 'user-123',
      });

      expect(success).toBe(true);

      const connection = manager.getConnection(connectionId);
      expect(connection?.isAuthenticated).toBe(true);
      expect(connection?.user?.userId).toBe('user-123');
    });

    it('should return false for non-existent connection', () => {
      const success = manager.authenticateConnection('non-existent', {
        userId: 'user-123',
      });

      expect(success).toBe(false);
    });

    it('should track user connections', () => {
      const socket = createMockSocket();
      const connectionId = manager.registerConnection(socket);

      manager.authenticateConnection(connectionId, { userId: 'user-123' });

      const userConnections = manager.getUserConnections('user-123');
      expect(userConnections).toHaveLength(1);
      expect(userConnections[0]?.id).toBe(connectionId);
    });
  });

  describe('joinSession', () => {
    it('should associate connection with session', () => {
      const socket = createMockSocket();
      const connectionId = manager.registerConnection(socket);
      manager.authenticateConnection(connectionId, { userId: 'user-123' });

      const success = manager.joinSession(connectionId, 'session-456');

      expect(success).toBe(true);

      const connection = manager.getConnection(connectionId);
      expect(connection?.sessionId).toBe('session-456');
    });

    it('should fail for unauthenticated connection', () => {
      const socket = createMockSocket();
      const connectionId = manager.registerConnection(socket);

      const success = manager.joinSession(connectionId, 'session-456');

      expect(success).toBe(false);
    });

    it('should track session connections', () => {
      const socket = createMockSocket();
      const connectionId = manager.registerConnection(socket);
      manager.authenticateConnection(connectionId, { userId: 'user-123' });
      manager.joinSession(connectionId, 'session-456');

      const sessionConnections = manager.getSessionConnections('session-456');
      expect(sessionConnections).toHaveLength(1);
      expect(sessionConnections[0]?.id).toBe(connectionId);
    });

    it('should leave previous session when joining new one', () => {
      const socket = createMockSocket();
      const connectionId = manager.registerConnection(socket);
      manager.authenticateConnection(connectionId, { userId: 'user-123' });

      manager.joinSession(connectionId, 'session-1');
      manager.joinSession(connectionId, 'session-2');

      const session1Connections = manager.getSessionConnections('session-1');
      const session2Connections = manager.getSessionConnections('session-2');

      expect(session1Connections).toHaveLength(0);
      expect(session2Connections).toHaveLength(1);
    });
  });

  describe('leaveSession', () => {
    it('should remove connection from session', () => {
      const socket = createMockSocket();
      const connectionId = manager.registerConnection(socket);
      manager.authenticateConnection(connectionId, { userId: 'user-123' });
      manager.joinSession(connectionId, 'session-456');

      const success = manager.leaveSession(connectionId);

      expect(success).toBe(true);

      const connection = manager.getConnection(connectionId);
      expect(connection?.sessionId).toBeNull();

      const sessionConnections = manager.getSessionConnections('session-456');
      expect(sessionConnections).toHaveLength(0);
    });
  });

  describe('removeConnection', () => {
    it('should remove connection and clean up all associations', () => {
      const socket = createMockSocket();
      const connectionId = manager.registerConnection(socket);
      manager.authenticateConnection(connectionId, { userId: 'user-123' });
      manager.joinSession(connectionId, 'session-456');

      const removed = manager.removeConnection(connectionId);

      expect(removed).not.toBeNull();
      expect(manager.getConnection(connectionId)).toBeUndefined();
      expect(manager.getUserConnections('user-123')).toHaveLength(0);
      expect(manager.getSessionConnections('session-456')).toHaveLength(0);
    });
  });

  describe('send', () => {
    it('should send message to open connection', () => {
      const socket = createMockSocket(1); // OPEN
      const connectionId = manager.registerConnection(socket);
      const message = { type: 'TEST', payload: {} };

      const success = manager.send(connectionId, message);

      expect(success).toBe(true);
      expect(socket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should fail for closed connection', () => {
      const socket = createMockSocket(3); // CLOSED
      const connectionId = manager.registerConnection(socket);
      const message = { type: 'TEST', payload: {} };

      const success = manager.send(connectionId, message);

      expect(success).toBe(false);
      expect(socket.send).not.toHaveBeenCalled();
    });
  });

  describe('broadcastToSession', () => {
    it('should send message to all connections in session', () => {
      const socket1 = createMockSocket();
      const socket2 = createMockSocket();

      const id1 = manager.registerConnection(socket1);
      const id2 = manager.registerConnection(socket2);

      manager.authenticateConnection(id1, { userId: 'user-1' });
      manager.authenticateConnection(id2, { userId: 'user-2' });

      manager.joinSession(id1, 'session-1');
      manager.joinSession(id2, 'session-1');

      const message = { type: 'BROADCAST', payload: {} };
      const sent = manager.broadcastToSession('session-1', message);

      expect(sent).toBe(2);
      expect(socket1.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(socket2.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should exclude specified connection from broadcast', () => {
      const socket1 = createMockSocket();
      const socket2 = createMockSocket();

      const id1 = manager.registerConnection(socket1);
      const id2 = manager.registerConnection(socket2);

      manager.authenticateConnection(id1, { userId: 'user-1' });
      manager.authenticateConnection(id2, { userId: 'user-2' });

      manager.joinSession(id1, 'session-1');
      manager.joinSession(id2, 'session-1');

      const message = { type: 'BROADCAST', payload: {} };
      const sent = manager.broadcastToSession('session-1', message, id1);

      expect(sent).toBe(1);
      expect(socket1.send).not.toHaveBeenCalled();
      expect(socket2.send).toHaveBeenCalledWith(JSON.stringify(message));
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const socket1 = createMockSocket();
      const socket2 = createMockSocket();

      const id1 = manager.registerConnection(socket1);
      manager.registerConnection(socket2); // Register second connection (id not needed)

      manager.authenticateConnection(id1, { userId: 'user-1' });
      manager.joinSession(id1, 'session-1');

      const stats = manager.getStats();

      expect(stats.totalConnections).toBe(2);
      expect(stats.authenticatedConnections).toBe(1);
      expect(stats.uniqueUsers).toBe(1);
      expect(stats.activeSessions).toBe(1);
    });
  });
});
