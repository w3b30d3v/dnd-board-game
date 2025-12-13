'use client';

import { useCallback, useEffect, useRef } from 'react';
import { WSMessageType } from '@dnd/shared';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useAuthStore } from '@/stores/authStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001/ws';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = false,
    reconnectAttempts = 5,
    reconnectDelay = 2000,
  } = options;

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { token } = useAuthStore();
  const {
    connectionStatus,
    setConnectionStatus,
    setConnectionId,
    setSession,
    setPlayers,
    addPlayer,
    removePlayer,
    updatePlayer,
    setIsHost,
    addMessage,
    addDiceResult,
    setCurrentTurn,
    setIsInCombat,
    reset,
  } = useMultiplayerStore();

  /**
   * Send a message through the WebSocket
   */
  const sendMessage = useCallback(
    (type: string, payload: Record<string, unknown> = {}) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type,
            timestamp: Date.now(),
            payload,
          })
        );
        return true;
      }
      console.warn('WebSocket not connected');
      return false;
    },
    []
  );

  /**
   * Handle incoming messages
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;

        switch (type) {
          case 'CONNECTED':
            setConnectionId(payload.connectionId);
            // Auto-authenticate if we have a token
            if (token) {
              sendMessage(WSMessageType.AUTHENTICATE, { token });
            }
            break;

          case WSMessageType.AUTHENTICATED:
            setConnectionStatus('authenticated');
            break;

          case WSMessageType.AUTH_ERROR:
            setConnectionStatus('error', payload.message);
            break;

          case WSMessageType.SESSION_CREATED:
          case WSMessageType.SESSION_JOINED:
            // Session info will come in PLAYER_LIST
            break;

          case WSMessageType.PLAYER_LIST:
            setPlayers(payload.players);
            break;

          case WSMessageType.PLAYER_JOINED:
            addPlayer(payload.player);
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: `${payload.player.displayName} joined the session`,
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'info',
              timestamp: Date.now(),
            });
            break;

          case WSMessageType.PLAYER_LEFT:
            removePlayer(payload.userId);
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: `${payload.username} left the session`,
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'info',
              timestamp: Date.now(),
            });
            break;

          case WSMessageType.PLAYER_READY:
          case WSMessageType.PLAYER_UNREADY:
            updatePlayer(payload.userId, { isReady: payload.isReady });
            break;

          case WSMessageType.CHAT_BROADCAST:
            addMessage({
              senderId: payload.senderId,
              senderName: payload.senderName,
              content: payload.content,
              isInCharacter: payload.isInCharacter,
              isWhisper: false,
              isSystem: false,
              timestamp: payload.timestamp,
            });
            break;

          case WSMessageType.WHISPER_RECEIVED:
            addMessage({
              senderId: payload.senderId,
              senderName: payload.senderName,
              content: payload.content,
              isInCharacter: false,
              isWhisper: true,
              isSystem: false,
              timestamp: payload.timestamp,
            });
            break;

          case WSMessageType.SYSTEM_MESSAGE:
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: payload.content,
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: payload.level,
              timestamp: Date.now(),
            });
            break;

          case WSMessageType.DICE_RESULT:
            addDiceResult({
              playerId: payload.playerId,
              playerName: payload.playerName,
              dice: payload.dice,
              rolls: payload.rolls,
              modifier: payload.modifier,
              total: payload.total,
              reason: payload.reason,
              isPrivate: payload.isPrivate,
              timestamp: Date.now(),
            });
            break;

          case WSMessageType.GAME_START:
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: 'The game has started!',
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'success',
              timestamp: Date.now(),
            });
            break;

          case WSMessageType.COMBAT_START:
            setIsInCombat(true);
            break;

          case WSMessageType.COMBAT_END:
            setIsInCombat(false);
            setCurrentTurn(null, 0);
            break;

          case WSMessageType.TURN_START:
            setCurrentTurn(payload.creatureId, payload.round);
            break;

          case WSMessageType.SESSION_CLOSED:
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: payload.reason || 'Session has been closed',
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'warning',
              timestamp: Date.now(),
            });
            setSession(null);
            break;

          case WSMessageType.ERROR:
            console.error('WebSocket error:', payload);
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: payload.message,
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'error',
              timestamp: Date.now(),
            });
            break;

          default:
            console.log('Unhandled message type:', type, payload);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    },
    [
      token,
      sendMessage,
      setConnectionId,
      setConnectionStatus,
      setPlayers,
      addPlayer,
      removePlayer,
      updatePlayer,
      addMessage,
      addDiceResult,
      setCurrentTurn,
      setIsInCombat,
      setSession,
    ]
  );

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');

    try {
      const socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectCountRef.current = 0;
      };

      socket.onmessage = handleMessage;

      socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        socketRef.current = null;

        // Attempt reconnect if not a clean close
        if (event.code !== 1000 && event.code !== 1001) {
          if (reconnectCountRef.current < reconnectAttempts) {
            reconnectCountRef.current++;
            const delay = reconnectDelay * reconnectCountRef.current;
            console.log(`Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current})`);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          }
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error', 'Connection failed');
      };

      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionStatus('error', 'Failed to connect');
    }
  }, [WS_URL, handleMessage, setConnectionStatus, reconnectAttempts, reconnectDelay]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnect');
      socketRef.current = null;
    }

    reset();
  }, [reset]);

  /**
   * Create a new session
   */
  const createSession = useCallback(
    (name: string, options?: { campaignId?: string; maxPlayers?: number; isPrivate?: boolean }) => {
      return sendMessage(WSMessageType.CREATE_SESSION, {
        name,
        ...options,
      });
    },
    [sendMessage]
  );

  /**
   * Join an existing session
   */
  const joinSession = useCallback(
    (sessionIdOrCode: string, characterId?: string) => {
      const isInviteCode = sessionIdOrCode.length <= 6 && /^[A-Z0-9]+$/i.test(sessionIdOrCode);
      return sendMessage(WSMessageType.JOIN_SESSION, {
        [isInviteCode ? 'inviteCode' : 'sessionId']: sessionIdOrCode,
        characterId,
      });
    },
    [sendMessage]
  );

  /**
   * Leave current session
   */
  const leaveSession = useCallback(
    (sessionId: string) => {
      return sendMessage(WSMessageType.LEAVE_SESSION, { sessionId });
    },
    [sendMessage]
  );

  /**
   * Set ready status
   */
  const setReady = useCallback(
    (sessionId: string, characterId?: string) => {
      return sendMessage(WSMessageType.PLAYER_READY, { sessionId, characterId });
    },
    [sendMessage]
  );

  /**
   * Send a chat message
   */
  const sendChat = useCallback(
    (sessionId: string, content: string, isInCharacter = false) => {
      return sendMessage(WSMessageType.CHAT_MESSAGE, {
        sessionId,
        content,
        isInCharacter,
      });
    },
    [sendMessage]
  );

  /**
   * Send a whisper (private message)
   */
  const sendWhisper = useCallback(
    (sessionId: string, targetUserId: string, content: string) => {
      return sendMessage(WSMessageType.WHISPER, {
        sessionId,
        targetUserId,
        content,
      });
    },
    [sendMessage]
  );

  /**
   * Roll dice
   */
  const rollDice = useCallback(
    (sessionId: string, dice: string, reason?: string, isPrivate = false) => {
      return sendMessage(WSMessageType.DICE_ROLL, {
        sessionId,
        dice,
        reason,
        isPrivate,
      });
    },
    [sendMessage]
  );

  /**
   * End current turn
   */
  const endTurn = useCallback(
    (sessionId: string, creatureId: string) => {
      return sendMessage(WSMessageType.TURN_END, {
        sessionId,
        creatureId,
      });
    },
    [sendMessage]
  );

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && token) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [autoConnect, token, connect]);

  return {
    // Connection
    connectionStatus,
    isConnected: connectionStatus === 'connected' || connectionStatus === 'authenticated',
    isAuthenticated: connectionStatus === 'authenticated',
    connect,
    disconnect,

    // Session
    createSession,
    joinSession,
    leaveSession,
    setReady,

    // Chat
    sendChat,
    sendWhisper,

    // Game
    rollDice,
    endTurn,

    // Raw send
    sendMessage,
  };
}
