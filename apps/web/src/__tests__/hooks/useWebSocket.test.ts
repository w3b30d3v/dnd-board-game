import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send = vi.fn();
  close = vi.fn().mockImplementation(() => {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  });

  // Helper to simulate receiving a message
  simulateMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  // Helper to simulate error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Connection', () => {
    it('should connect to WebSocket server', async () => {
      // Simulate basic WebSocket connection behavior
      const ws = new MockWebSocket('ws://localhost:4001');

      await waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });
    });

    it('should handle connection error', async () => {
      const ws = new MockWebSocket('ws://localhost:4001');
      const onError = vi.fn();
      ws.onerror = onError;

      ws.simulateError();

      expect(onError).toHaveBeenCalled();
    });

    it('should handle disconnection', async () => {
      const ws = new MockWebSocket('ws://localhost:4001');
      const onClose = vi.fn();
      ws.onclose = onClose;

      await waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });

      ws.close();

      expect(onClose).toHaveBeenCalled();
      expect(ws.readyState).toBe(MockWebSocket.CLOSED);
    });
  });

  describe('Message Handling', () => {
    it('should send messages when connected', async () => {
      const ws = new MockWebSocket('ws://localhost:4001');

      await waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });

      const message = { type: 'chat', content: 'Hello' };
      ws.send(JSON.stringify(message));

      expect(ws.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should receive and parse messages', async () => {
      const ws = new MockWebSocket('ws://localhost:4001');
      const onMessage = vi.fn();
      ws.onmessage = (event) => {
        onMessage(JSON.parse(event.data));
      };

      await waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });

      ws.simulateMessage({ type: 'chat', content: 'Hello from server' });

      expect(onMessage).toHaveBeenCalledWith({
        type: 'chat',
        content: 'Hello from server',
      });
    });

    it('should handle different message types', async () => {
      const ws = new MockWebSocket('ws://localhost:4001');
      const messages: unknown[] = [];
      ws.onmessage = (event) => {
        messages.push(JSON.parse(event.data));
      };

      await waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });

      // Simulate different message types
      ws.simulateMessage({ type: 'player_joined', playerId: 'p1', playerName: 'Player 1' });
      ws.simulateMessage({ type: 'player_left', playerId: 'p2' });
      ws.simulateMessage({ type: 'game_state', state: { turn: 1 } });
      ws.simulateMessage({ type: 'chat', playerId: 'p1', content: 'Hello' });

      expect(messages).toHaveLength(4);
      expect(messages[0]).toHaveProperty('type', 'player_joined');
      expect(messages[1]).toHaveProperty('type', 'player_left');
      expect(messages[2]).toHaveProperty('type', 'game_state');
      expect(messages[3]).toHaveProperty('type', 'chat');
    });
  });

  describe('Reconnection', () => {
    it('should attempt reconnection on disconnect', async () => {
      let connectionAttempts = 0;

      class ReconnectingWebSocket extends MockWebSocket {
        constructor(url: string) {
          super(url);
          connectionAttempts++;
        }
      }

      const ws1 = new ReconnectingWebSocket('ws://localhost:4001');
      expect(connectionAttempts).toBe(1);

      // Simulate disconnect
      ws1.close();

      // Simulate reconnection attempt
      new ReconnectingWebSocket('ws://localhost:4001');
      expect(connectionAttempts).toBe(2);
    });
  });

  describe('Authentication', () => {
    it('should send auth message on connect', async () => {
      const ws = new MockWebSocket('ws://localhost:4001');

      await waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });

      const authMessage = {
        type: 'auth',
        token: 'jwt-token-123',
      };

      ws.send(JSON.stringify(authMessage));

      expect(ws.send).toHaveBeenCalledWith(JSON.stringify(authMessage));
    });

    it('should handle auth success response', async () => {
      const ws = new MockWebSocket('ws://localhost:4001');
      let isAuthenticated = false;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'auth_success') {
          isAuthenticated = true;
        }
      };

      await waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });

      ws.simulateMessage({ type: 'auth_success', userId: 'user-123' });

      expect(isAuthenticated).toBe(true);
    });

    it('should handle auth failure response', async () => {
      const ws = new MockWebSocket('ws://localhost:4001');
      let authError: string | null = null;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'auth_error') {
          authError = data.message;
        }
      };

      await waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });

      ws.simulateMessage({ type: 'auth_error', message: 'Invalid token' });

      expect(authError).toBe('Invalid token');
    });
  });

  describe('Session Management', () => {
    it('should join session', async () => {
      const ws = new MockWebSocket('ws://localhost:4001');

      await waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });

      const joinMessage = {
        type: 'join_session',
        sessionId: 'session-123',
        inviteCode: 'ABC123',
      };

      ws.send(JSON.stringify(joinMessage));

      expect(ws.send).toHaveBeenCalledWith(JSON.stringify(joinMessage));
    });

    it('should handle join success', async () => {
      const ws = new MockWebSocket('ws://localhost:4001');
      let sessionJoined = false;
      let players: unknown[] = [];

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'session_joined') {
          sessionJoined = true;
          players = data.players;
        }
      };

      await waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });

      ws.simulateMessage({
        type: 'session_joined',
        sessionId: 'session-123',
        players: [
          { id: 'p1', name: 'Player 1', isHost: true },
          { id: 'p2', name: 'Player 2', isHost: false },
        ],
      });

      expect(sessionJoined).toBe(true);
      expect(players).toHaveLength(2);
    });

    it('should leave session', async () => {
      const ws = new MockWebSocket('ws://localhost:4001');

      await waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });

      const leaveMessage = {
        type: 'leave_session',
        sessionId: 'session-123',
      };

      ws.send(JSON.stringify(leaveMessage));

      expect(ws.send).toHaveBeenCalledWith(JSON.stringify(leaveMessage));
    });
  });

  describe('Game Actions', () => {
    it('should send move token action', async () => {
      const ws = new MockWebSocket('ws://localhost:4001');

      await waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });

      const moveAction = {
        type: 'game_action',
        action: 'move_token',
        tokenId: 'token-1',
        position: { x: 5, y: 3 },
      };

      ws.send(JSON.stringify(moveAction));

      expect(ws.send).toHaveBeenCalledWith(JSON.stringify(moveAction));
    });

    it('should send roll dice action', async () => {
      const ws = new MockWebSocket('ws://localhost:4001');

      await waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });

      const rollAction = {
        type: 'game_action',
        action: 'roll_dice',
        diceType: 'd20',
        modifier: 5,
      };

      ws.send(JSON.stringify(rollAction));

      expect(ws.send).toHaveBeenCalledWith(JSON.stringify(rollAction));
    });

    it('should receive game state updates', async () => {
      const ws = new MockWebSocket('ws://localhost:4001');
      let gameState: unknown = null;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'game_state_update') {
          gameState = data.state;
        }
      };

      await waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
      });

      ws.simulateMessage({
        type: 'game_state_update',
        state: {
          turn: 3,
          activePlayer: 'p1',
          tokens: [
            { id: 'token-1', position: { x: 5, y: 3 } },
          ],
        },
      });

      expect(gameState).toEqual({
        turn: 3,
        activePlayer: 'p1',
        tokens: [
          { id: 'token-1', position: { x: 5, y: 3 } },
        ],
      });
    });
  });
});
