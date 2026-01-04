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
    addMessage,
    addDiceResult,
    setCurrentTurn,
    setIsInCombat,
    setIsHost,
    setIsReady,
    setIsSessionLocked,
    addPendingTokenMove,
    setLastGameStateSync,
    reset,
  } = useMultiplayerStore();

  // Get current user from auth store
  const { user } = useAuthStore();

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
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: 'WebSocket connected. Authenticating...',
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'info',
              timestamp: Date.now(),
            });
            // Auto-authenticate if we have a token
            if (token) {
              sendMessage(WSMessageType.AUTHENTICATE, { token });
            }
            break;

          case WSMessageType.AUTHENTICATED: {
            setConnectionStatus('authenticated');
            // Auto-rejoin session if we have one cached (handles reconnection)
            const cachedSession = useMultiplayerStore.getState().currentSession;
            if (cachedSession) {
              // Rejoin the session after reconnecting
              sendMessage(WSMessageType.JOIN_SESSION, {
                sessionId: cachedSession.id,
              });
              addMessage({
                senderId: 'system',
                senderName: 'System',
                content: 'Reconnecting to session...',
                isInCharacter: false,
                isWhisper: false,
                isSystem: true,
                level: 'info',
                timestamp: Date.now(),
              });
            } else {
              addMessage({
                senderId: 'system',
                senderName: 'System',
                content: 'Authentication successful. Ready to create or join a session.',
                isInCharacter: false,
                isWhisper: false,
                isSystem: true,
                level: 'success',
                timestamp: Date.now(),
              });
            }
            break;
          }

          case WSMessageType.AUTH_ERROR:
            setConnectionStatus('error', payload.message);
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: `Authentication failed: ${payload.message}`,
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'error',
              timestamp: Date.now(),
            });
            break;

          case WSMessageType.ERROR:
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: `Error: ${payload.message}`,
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'error',
              timestamp: Date.now(),
            });
            break;

          case WSMessageType.SESSION_CREATED:
            setSession({
              id: payload.sessionId,
              name: payload.name,
              inviteCode: payload.inviteCode,
              status: 'lobby',
              hostUserId: '', // Will be set from player list
              maxPlayers: 6,
              isPrivate: false,
              isLocked: false,
              allowedUsers: [],
              players: [],
              createdAt: Date.now(),
            });
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: `Session "${payload.name}" created! Invite code: ${payload.inviteCode}`,
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'success',
              timestamp: Date.now(),
            });
            break;

          case WSMessageType.SESSION_JOINED:
            setSession({
              id: payload.sessionId,
              name: payload.name,
              inviteCode: '', // Will be filled by host info
              status: payload.status || 'lobby',
              hostUserId: '',
              maxPlayers: 6,
              isPrivate: false,
              isLocked: payload.isLocked || false,
              allowedUsers: payload.allowedUsers || [],
              players: [],
              createdAt: Date.now(),
            });
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: `Joined session "${payload.name}"`,
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'success',
              timestamp: Date.now(),
            });
            break;

          case WSMessageType.PLAYER_LIST:
            setPlayers(payload.players);
            // Update isHost and isReady for current user
            if (user && payload.players) {
              const currentPlayer = payload.players.find(
                (p: { userId: string }) => p.userId === user.id
              );
              if (currentPlayer) {
                setIsHost(currentPlayer.isDM || false);
                setIsReady(currentPlayer.isReady || false);
              }
            }
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

          case WSMessageType.SESSION_LOCKED:
            setIsSessionLocked(payload.isLocked);
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: payload.isLocked
                ? 'Session has been locked. No new players can join.'
                : 'Session has been unlocked. New players can now join.',
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: payload.isLocked ? 'warning' : 'info',
              timestamp: Date.now(),
            });
            break;

          case 'SESSION_LOCKED_ERROR':
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: payload.message || 'Cannot join: session is locked',
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'error',
              timestamp: Date.now(),
            });
            break;

          case 'SESSION_LEFT':
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: 'You left the session',
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'info',
              timestamp: Date.now(),
            });
            setSession(null);
            setPlayers([]);
            break;

          case 'SESSION_ERROR':
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: payload.message || 'Session error',
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'error',
              timestamp: Date.now(),
            });
            break;

          // Game state sync handlers
          case WSMessageType.TOKEN_MOVED:
            // Store the pending token move for the game to process
            addPendingTokenMove({
              tokenId: payload.tokenId || payload.creatureId,
              fromPosition: payload.fromPosition,
              toPosition: payload.toPosition,
              path: payload.path || [payload.fromPosition, payload.toPosition],
            });
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: `Token moved to (${payload.toPosition.x}, ${payload.toPosition.y})`,
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'info',
              timestamp: Date.now(),
            });
            break;

          case WSMessageType.ACTION_RESULT:
            // Handle attack/action results from other players
            if (payload.damage) {
              addMessage({
                senderId: 'system',
                senderName: 'System',
                content: `${payload.success ? 'Hit!' : 'Miss!'} ${payload.damage ? `${payload.damage.amount} ${payload.damage.type} damage` : ''}${payload.damage?.isCritical ? ' (CRITICAL!)' : ''}`,
                isInCharacter: false,
                isWhisper: false,
                isSystem: true,
                level: payload.success ? 'success' : 'info',
                timestamp: Date.now(),
              });
            }
            // Dispatch a custom event for GameSessionContent to handle
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('ws:action-result', { detail: payload }));
            }
            break;

          case WSMessageType.SPELL_RESULT:
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: `${payload.spellName} was cast!`,
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'info',
              timestamp: Date.now(),
            });
            // Dispatch a custom event for GameSessionContent to handle
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('ws:spell-result', { detail: payload }));
            }
            break;

          case WSMessageType.GAME_STATE_SYNC:
            // Full game state sync - dispatch for game to handle
            setLastGameStateSync(Date.now());
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('ws:game-state-sync', { detail: payload }));
            }
            break;

          case WSMessageType.TOKEN_UPDATE:
            // Individual token update (HP, conditions, etc.)
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('ws:token-update', { detail: payload }));
            }
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
      user,
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
      setIsHost,
      setIsReady,
      setIsSessionLocked,
      setSession,
      addPendingTokenMove,
      setLastGameStateSync,
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
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: `Connection lost. Reconnecting in ${delay / 1000}s (attempt ${reconnectCountRef.current}/${reconnectAttempts})...`,
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'warning',
              timestamp: Date.now(),
            });
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          } else {
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: 'Connection lost. Max reconnect attempts reached. Click Connect to try again.',
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'error',
              timestamp: Date.now(),
            });
          }
        } else {
          addMessage({
            senderId: 'system',
            senderName: 'System',
            content: 'Disconnected from server.',
            isInCharacter: false,
            isWhisper: false,
            isSystem: true,
            level: 'info',
            timestamp: Date.now(),
          });
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
  }, [WS_URL, handleMessage, setConnectionStatus, addMessage, reconnectAttempts, reconnectDelay]);

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

  /**
   * Lock the session (DM only)
   */
  const lockSession = useCallback(
    (sessionId: string, allowedUsers?: string[]) => {
      return sendMessage(WSMessageType.SESSION_LOCK, {
        sessionId,
        allowedUsers,
      });
    },
    [sendMessage]
  );

  /**
   * Unlock the session (DM only)
   */
  const unlockSession = useCallback(
    (sessionId: string) => {
      return sendMessage(WSMessageType.SESSION_UNLOCK, {
        sessionId,
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

    // DM Controls
    lockSession,
    unlockSession,

    // Raw send
    sendMessage,
  };
}
