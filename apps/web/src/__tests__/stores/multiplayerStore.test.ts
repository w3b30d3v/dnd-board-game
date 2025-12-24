import { describe, it, expect, beforeEach } from 'vitest';
import { useMultiplayerStore } from '@/stores/multiplayerStore';

describe('multiplayerStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useMultiplayerStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useMultiplayerStore.getState();

      expect(state.connectionStatus).toBe('disconnected');
      expect(state.connectionId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.currentSession).toBeNull();
      expect(state.players).toEqual([]);
      expect(state.isHost).toBe(false);
      expect(state.isReady).toBe(false);
      expect(state.isSessionLocked).toBe(false);
      expect(state.messages).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.diceResults).toEqual([]);
      expect(state.currentTurnCreatureId).toBeNull();
      expect(state.round).toBe(0);
      expect(state.isInCombat).toBe(false);
    });
  });

  describe('setConnectionStatus', () => {
    it('should update connection status', () => {
      const { setConnectionStatus } = useMultiplayerStore.getState();

      setConnectionStatus('connecting');
      expect(useMultiplayerStore.getState().connectionStatus).toBe('connecting');

      setConnectionStatus('connected');
      expect(useMultiplayerStore.getState().connectionStatus).toBe('connected');

      setConnectionStatus('authenticated');
      expect(useMultiplayerStore.getState().connectionStatus).toBe('authenticated');

      setConnectionStatus('disconnected');
      expect(useMultiplayerStore.getState().connectionStatus).toBe('disconnected');

      setConnectionStatus('error');
      expect(useMultiplayerStore.getState().connectionStatus).toBe('error');
    });

    it('should set error when provided', () => {
      const { setConnectionStatus } = useMultiplayerStore.getState();

      setConnectionStatus('error', 'Connection failed');
      expect(useMultiplayerStore.getState().error).toBe('Connection failed');
    });

    it('should clear error when not provided', () => {
      const { setConnectionStatus } = useMultiplayerStore.getState();

      setConnectionStatus('error', 'Some error');
      setConnectionStatus('connected');
      expect(useMultiplayerStore.getState().error).toBeNull();
    });
  });

  describe('setConnectionId', () => {
    it('should set connection ID', () => {
      const { setConnectionId } = useMultiplayerStore.getState();

      setConnectionId('conn-123');
      expect(useMultiplayerStore.getState().connectionId).toBe('conn-123');
    });

    it('should clear connection ID with null', () => {
      const { setConnectionId } = useMultiplayerStore.getState();

      setConnectionId('conn-123');
      setConnectionId(null);
      expect(useMultiplayerStore.getState().connectionId).toBeNull();
    });
  });

  describe('setSession', () => {
    it('should set session data and players', () => {
      const { setSession } = useMultiplayerStore.getState();

      const session = {
        id: 'session-123',
        campaignId: 'campaign-1',
        inviteCode: 'ABC123',
        status: 'active' as const,
        hostId: 'user-1',
        players: [
          { odId: 'p1', odName: 'Player 1', odRole: 'player' as const, odStatus: 'ready' as const, odIsHost: true, userId: 'user-1' },
        ],
        createdAt: new Date().toISOString(),
      };

      setSession(session);

      const state = useMultiplayerStore.getState();
      expect(state.currentSession).toEqual(session);
      expect(state.players).toHaveLength(1);
    });

    it('should clear session with null', () => {
      const { setSession } = useMultiplayerStore.getState();

      setSession({ id: 'session-123', campaignId: 'c1', inviteCode: 'ABC', status: 'active', hostId: 'h1', players: [], createdAt: new Date().toISOString() });
      setSession(null);

      const state = useMultiplayerStore.getState();
      expect(state.currentSession).toBeNull();
      expect(state.players).toEqual([]);
    });
  });

  describe('setIsHost', () => {
    it('should update host status', () => {
      const { setIsHost } = useMultiplayerStore.getState();

      setIsHost(true);
      expect(useMultiplayerStore.getState().isHost).toBe(true);

      setIsHost(false);
      expect(useMultiplayerStore.getState().isHost).toBe(false);
    });
  });

  describe('setIsReady', () => {
    it('should update ready status', () => {
      const { setIsReady } = useMultiplayerStore.getState();

      setIsReady(true);
      expect(useMultiplayerStore.getState().isReady).toBe(true);

      setIsReady(false);
      expect(useMultiplayerStore.getState().isReady).toBe(false);
    });
  });

  describe('setIsSessionLocked', () => {
    it('should update session lock status', () => {
      const { setIsSessionLocked } = useMultiplayerStore.getState();

      setIsSessionLocked(true);
      expect(useMultiplayerStore.getState().isSessionLocked).toBe(true);

      setIsSessionLocked(false);
      expect(useMultiplayerStore.getState().isSessionLocked).toBe(false);
    });
  });

  describe('addPlayer', () => {
    it('should add a player to the list', () => {
      const { addPlayer } = useMultiplayerStore.getState();

      addPlayer({
        odId: 'player-1',
        odName: 'Player One',
        odRole: 'player',
        odStatus: 'ready',
        odIsHost: true,
        userId: 'user-1',
      });

      const state = useMultiplayerStore.getState();
      expect(state.players.length).toBe(1);
      expect(state.players[0].odName).toBe('Player One');
    });

    it('should replace player with same userId', () => {
      const { addPlayer } = useMultiplayerStore.getState();

      addPlayer({ odId: 'p1', odName: 'Player One', odRole: 'player', odStatus: 'waiting', odIsHost: true, userId: 'user-1' });
      addPlayer({ odId: 'p1-updated', odName: 'Player One Updated', odRole: 'player', odStatus: 'ready', odIsHost: true, userId: 'user-1' });

      const state = useMultiplayerStore.getState();
      expect(state.players.length).toBe(1);
      expect(state.players[0].odName).toBe('Player One Updated');
    });
  });

  describe('removePlayer', () => {
    it('should remove a player from the list', () => {
      const { addPlayer, removePlayer } = useMultiplayerStore.getState();

      addPlayer({ odId: 'p1', odName: 'Player One', odRole: 'player', odStatus: 'ready', odIsHost: true, userId: 'user-1' });
      addPlayer({ odId: 'p2', odName: 'Player Two', odRole: 'player', odStatus: 'ready', odIsHost: false, userId: 'user-2' });

      removePlayer('user-1');

      const state = useMultiplayerStore.getState();
      expect(state.players.length).toBe(1);
      expect(state.players[0].userId).toBe('user-2');
    });

    it('should handle removing non-existent player', () => {
      const { addPlayer, removePlayer } = useMultiplayerStore.getState();

      addPlayer({ odId: 'p1', odName: 'Player One', odRole: 'player', odStatus: 'ready', odIsHost: true, userId: 'user-1' });

      removePlayer('non-existent');

      const state = useMultiplayerStore.getState();
      expect(state.players.length).toBe(1);
    });
  });

  describe('updatePlayer', () => {
    it('should update player properties', () => {
      const { addPlayer, updatePlayer } = useMultiplayerStore.getState();

      addPlayer({ odId: 'p1', odName: 'Player One', odRole: 'player', odStatus: 'waiting', odIsHost: true, userId: 'user-1' });

      updatePlayer('user-1', { odStatus: 'ready' });

      const state = useMultiplayerStore.getState();
      expect(state.players[0].odStatus).toBe('ready');
      expect(state.players[0].odName).toBe('Player One'); // Unchanged
    });
  });

  describe('setPlayers', () => {
    it('should replace entire players list', () => {
      const { addPlayer, setPlayers } = useMultiplayerStore.getState();

      addPlayer({ odId: 'p1', odName: 'Player One', odRole: 'player', odStatus: 'ready', odIsHost: true, userId: 'user-1' });

      setPlayers([
        { odId: 'p2', odName: 'Player Two', odRole: 'player', odStatus: 'ready', odIsHost: true, userId: 'user-2' },
        { odId: 'p3', odName: 'Player Three', odRole: 'player', odStatus: 'waiting', odIsHost: false, userId: 'user-3' },
      ]);

      const state = useMultiplayerStore.getState();
      expect(state.players.length).toBe(2);
      expect(state.players[0].odName).toBe('Player Two');
    });
  });

  describe('addMessage', () => {
    it('should add a chat message', () => {
      const { addMessage } = useMultiplayerStore.getState();

      addMessage({
        senderId: 'user-1',
        senderName: 'Player One',
        content: 'Hello everyone!',
        isInCharacter: false,
        isWhisper: false,
        isSystem: false,
        timestamp: Date.now(),
      });

      const state = useMultiplayerStore.getState();
      expect(state.messages.length).toBe(1);
      expect(state.messages[0].content).toBe('Hello everyone!');
      expect(state.messages[0].id).toBeDefined();
    });

    it('should add system messages', () => {
      const { addMessage } = useMultiplayerStore.getState();

      addMessage({
        senderId: 'system',
        senderName: 'System',
        content: 'Player One has joined',
        isInCharacter: false,
        isWhisper: false,
        isSystem: true,
        level: 'info',
        timestamp: Date.now(),
      });

      const state = useMultiplayerStore.getState();
      expect(state.messages[0].isSystem).toBe(true);
      expect(state.messages[0].level).toBe('info');
    });

    it('should increment unread count', () => {
      const { addMessage } = useMultiplayerStore.getState();

      addMessage({
        senderId: 'user-1',
        senderName: 'P1',
        content: 'First',
        isInCharacter: false,
        isWhisper: false,
        isSystem: false,
        timestamp: Date.now(),
      });
      addMessage({
        senderId: 'user-2',
        senderName: 'P2',
        content: 'Second',
        isInCharacter: false,
        isWhisper: false,
        isSystem: false,
        timestamp: Date.now(),
      });

      const state = useMultiplayerStore.getState();
      expect(state.unreadCount).toBe(2);
    });

    it('should maintain message order', () => {
      const { addMessage } = useMultiplayerStore.getState();

      addMessage({ senderId: 'p1', senderName: 'P1', content: 'First', isInCharacter: false, isWhisper: false, isSystem: false, timestamp: 1 });
      addMessage({ senderId: 'p2', senderName: 'P2', content: 'Second', isInCharacter: false, isWhisper: false, isSystem: false, timestamp: 2 });
      addMessage({ senderId: 'p1', senderName: 'P1', content: 'Third', isInCharacter: false, isWhisper: false, isSystem: false, timestamp: 3 });

      const state = useMultiplayerStore.getState();
      expect(state.messages.length).toBe(3);
      expect(state.messages[0].content).toBe('First');
      expect(state.messages[2].content).toBe('Third');
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages and unread count', () => {
      const { addMessage, clearMessages } = useMultiplayerStore.getState();

      addMessage({ senderId: 'p1', senderName: 'P1', content: 'Hello', isInCharacter: false, isWhisper: false, isSystem: false, timestamp: Date.now() });
      addMessage({ senderId: 'p2', senderName: 'P2', content: 'World', isInCharacter: false, isWhisper: false, isSystem: false, timestamp: Date.now() });

      clearMessages();

      const state = useMultiplayerStore.getState();
      expect(state.messages.length).toBe(0);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('markMessagesRead', () => {
    it('should reset unread count', () => {
      const { addMessage, markMessagesRead } = useMultiplayerStore.getState();

      addMessage({ senderId: 'p1', senderName: 'P1', content: 'Hello', isInCharacter: false, isWhisper: false, isSystem: false, timestamp: Date.now() });

      expect(useMultiplayerStore.getState().unreadCount).toBe(1);

      markMessagesRead();

      expect(useMultiplayerStore.getState().unreadCount).toBe(0);
    });
  });

  describe('addDiceResult', () => {
    it('should add a dice result', () => {
      const { addDiceResult } = useMultiplayerStore.getState();

      addDiceResult({
        playerId: 'user-1',
        playerName: 'Player One',
        dice: '1d20',
        rolls: [15],
        modifier: 5,
        total: 20,
        reason: 'Attack roll',
        isPrivate: false,
        timestamp: Date.now(),
      });

      const state = useMultiplayerStore.getState();
      expect(state.diceResults.length).toBe(1);
      expect(state.diceResults[0].total).toBe(20);
      expect(state.diceResults[0].id).toBeDefined();
    });
  });

  describe('clearDiceResults', () => {
    it('should clear all dice results', () => {
      const { addDiceResult, clearDiceResults } = useMultiplayerStore.getState();

      addDiceResult({ playerId: 'p1', playerName: 'P1', dice: '1d20', rolls: [10], modifier: 0, total: 10, isPrivate: false, timestamp: Date.now() });

      clearDiceResults();

      expect(useMultiplayerStore.getState().diceResults.length).toBe(0);
    });
  });

  describe('setCurrentTurn', () => {
    it('should update current turn and round', () => {
      const { setCurrentTurn } = useMultiplayerStore.getState();

      setCurrentTurn('creature-1', 3);

      const state = useMultiplayerStore.getState();
      expect(state.currentTurnCreatureId).toBe('creature-1');
      expect(state.round).toBe(3);
    });

    it('should handle null creature ID', () => {
      const { setCurrentTurn } = useMultiplayerStore.getState();

      setCurrentTurn('creature-1', 1);
      setCurrentTurn(null, 0);

      const state = useMultiplayerStore.getState();
      expect(state.currentTurnCreatureId).toBeNull();
      expect(state.round).toBe(0);
    });
  });

  describe('setIsInCombat', () => {
    it('should update combat status', () => {
      const { setIsInCombat } = useMultiplayerStore.getState();

      setIsInCombat(true);
      expect(useMultiplayerStore.getState().isInCombat).toBe(true);

      setIsInCombat(false);
      expect(useMultiplayerStore.getState().isInCombat).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const { setConnectionStatus, setConnectionId, setIsHost, addPlayer, addMessage, reset } =
        useMultiplayerStore.getState();

      // Set up some state
      setConnectionStatus('connected');
      setConnectionId('conn-123');
      setIsHost(true);
      addPlayer({ odId: 'p1', odName: 'Player One', odRole: 'player', odStatus: 'ready', odIsHost: true, userId: 'user-1' });
      addMessage({ senderId: 'p1', senderName: 'P1', content: 'Hello', isInCharacter: false, isWhisper: false, isSystem: false, timestamp: Date.now() });

      // Reset
      reset();

      const state = useMultiplayerStore.getState();
      expect(state.connectionStatus).toBe('disconnected');
      expect(state.connectionId).toBeNull();
      expect(state.players).toEqual([]);
      expect(state.isHost).toBe(false);
      expect(state.messages).toEqual([]);
    });
  });
});
