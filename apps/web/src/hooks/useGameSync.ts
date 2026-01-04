'use client';

/**
 * useGameSync Hook
 * Synchronizes game state across multiplayer sessions via WebSocket
 * Handles token positions, combat actions, and game state updates
 */

import { useCallback, useEffect, useRef } from 'react';
import { WSMessageType } from '@dnd/shared';
import { useWebSocket } from './useWebSocket';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import type { Creature, GridPosition } from '@/game/types';

export interface TokenMoveEvent {
  tokenId: string;
  creatureId: string;
  fromPosition: GridPosition;
  toPosition: GridPosition;
  path: GridPosition[];
}

export interface AttackEvent {
  attackerId: string;
  targetId: string;
  weaponId?: string;
  roll: number;
  total: number;
  hits: boolean;
  isCritical: boolean;
  damage?: number;
  damageType?: string;
}

export interface SpellCastEvent {
  casterId: string;
  spellId: string;
  spellName: string;
  spellLevel: number;
  targetId?: string;
  targetPosition?: GridPosition;
  areaAffected?: GridPosition[];
  roll?: number;
  damage?: number;
  healing?: number;
  effects?: string[];
}

export interface GameStateUpdate {
  creatures?: Creature[];
  initiativeOrder?: string[];
  currentTurnCreatureId?: string;
  round?: number;
  isInCombat?: boolean;
}

interface UseGameSyncOptions {
  sessionId: string | null;
  onTokenMoved?: (event: TokenMoveEvent) => void;
  onAttackResult?: (event: AttackEvent) => void;
  onSpellResult?: (event: SpellCastEvent) => void;
  onGameStateSync?: (state: GameStateUpdate) => void;
  onCombatStart?: (initiativeOrder: string[], round: number) => void;
  onCombatEnd?: () => void;
  onTurnStart?: (creatureId: string, round: number) => void;
  onCreatureUpdate?: (creature: Partial<Creature> & { id: string }) => void;
  onCreatureAdded?: (creature: Creature) => void;
  onCreatureRemoved?: (creatureId: string) => void;
}

export function useGameSync(options: UseGameSyncOptions) {
  const {
    sessionId,
    onTokenMoved,
    onAttackResult,
    onSpellResult,
    onGameStateSync,
    onCombatStart,
    onCombatEnd,
    onTurnStart,
    onCreatureUpdate,
    onCreatureAdded,
    onCreatureRemoved,
  } = options;

  const ws = useWebSocket({ autoConnect: true });
  const { sendMessage, isAuthenticated } = ws;
  const { addMessage } = useMultiplayerStore();

  // Store callbacks in refs to avoid dependency changes
  const callbacksRef = useRef({
    onTokenMoved,
    onAttackResult,
    onSpellResult,
    onGameStateSync,
    onCombatStart,
    onCombatEnd,
    onTurnStart,
    onCreatureUpdate,
    onCreatureAdded,
    onCreatureRemoved,
  });

  useEffect(() => {
    callbacksRef.current = {
      onTokenMoved,
      onAttackResult,
      onSpellResult,
      onGameStateSync,
      onCombatStart,
      onCombatEnd,
      onTurnStart,
      onCreatureUpdate,
      onCreatureAdded,
      onCreatureRemoved,
    };
  });

  // ====================
  // SEND ACTIONS
  // ====================

  /**
   * Send token move to all clients
   */
  const sendTokenMove = useCallback(
    (tokenId: string, path: GridPosition[]) => {
      if (!sessionId || !isAuthenticated) return false;

      return sendMessage(WSMessageType.MOVE_TOKEN, {
        sessionId,
        tokenId,
        path,
      });
    },
    [sessionId, isAuthenticated, sendMessage]
  );

  /**
   * Send attack action
   */
  const sendAttack = useCallback(
    (attackerId: string, targetId: string, weaponId?: string) => {
      if (!sessionId || !isAuthenticated) return false;

      return sendMessage(WSMessageType.ATTACK, {
        sessionId,
        creatureId: attackerId,
        targetId,
        weaponId,
      });
    },
    [sessionId, isAuthenticated, sendMessage]
  );

  /**
   * Send spell cast action
   */
  const sendSpellCast = useCallback(
    (
      casterId: string,
      spellId: string,
      spellSlot: number,
      targetId?: string,
      targetPosition?: GridPosition
    ) => {
      if (!sessionId || !isAuthenticated) return false;

      return sendMessage(WSMessageType.CAST_SPELL, {
        sessionId,
        creatureId: casterId,
        spellId,
        spellSlot,
        targetId,
        targetPosition,
      });
    },
    [sessionId, isAuthenticated, sendMessage]
  );

  /**
   * Start combat and broadcast to all clients
   */
  const sendCombatStart = useCallback(
    (initiativeOrder: Array<{ creatureId: string; initiative: number }>) => {
      if (!sessionId || !isAuthenticated) return false;

      return sendMessage(WSMessageType.COMBAT_START, {
        sessionId,
        initiativeOrder,
      });
    },
    [sessionId, isAuthenticated, sendMessage]
  );

  /**
   * End combat and broadcast
   */
  const sendCombatEnd = useCallback(() => {
    if (!sessionId || !isAuthenticated) return false;

    return sendMessage(WSMessageType.COMBAT_END, {
      sessionId,
    });
  }, [sessionId, isAuthenticated, sendMessage]);

  /**
   * Notify turn start
   */
  const sendTurnStart = useCallback(
    (creatureId: string, round: number) => {
      if (!sessionId || !isAuthenticated) return false;

      return sendMessage(WSMessageType.TURN_START, {
        sessionId,
        creatureId,
        round,
        turnIndex: 0, // Could be calculated from initiative order
      });
    },
    [sessionId, isAuthenticated, sendMessage]
  );

  /**
   * End current turn
   */
  const sendTurnEnd = useCallback(
    (creatureId: string) => {
      if (!sessionId || !isAuthenticated) return false;

      return sendMessage(WSMessageType.TURN_END, {
        sessionId,
        creatureId,
      });
    },
    [sessionId, isAuthenticated, sendMessage]
  );

  /**
   * Send creature update (HP, conditions, etc.)
   */
  const sendCreatureUpdate = useCallback(
    (creature: Partial<Creature> & { id: string }) => {
      if (!sessionId || !isAuthenticated) return false;

      return sendMessage(WSMessageType.TOKEN_UPDATE, {
        sessionId,
        tokenId: creature.id,
        updates: creature,
      });
    },
    [sessionId, isAuthenticated, sendMessage]
  );

  /**
   * Add a new creature/token
   */
  const sendCreatureAdd = useCallback(
    (creature: Creature) => {
      if (!sessionId || !isAuthenticated) return false;

      return sendMessage(WSMessageType.TOKEN_ADD, {
        sessionId,
        creature,
      });
    },
    [sessionId, isAuthenticated, sendMessage]
  );

  /**
   * Remove a creature/token
   */
  const sendCreatureRemove = useCallback(
    (creatureId: string) => {
      if (!sessionId || !isAuthenticated) return false;

      return sendMessage(WSMessageType.TOKEN_REMOVE, {
        sessionId,
        tokenId: creatureId,
      });
    },
    [sessionId, isAuthenticated, sendMessage]
  );

  /**
   * Send full game state sync (DM only)
   */
  const sendGameStateSync = useCallback(
    (state: GameStateUpdate) => {
      if (!sessionId || !isAuthenticated) return false;

      return sendMessage(WSMessageType.GAME_STATE_SYNC, {
        sessionId,
        ...state,
      });
    },
    [sessionId, isAuthenticated, sendMessage]
  );

  /**
   * Request a generic action
   */
  const sendAction = useCallback(
    (
      creatureId: string,
      actionType:
        | 'MOVE'
        | 'ATTACK'
        | 'CAST_SPELL'
        | 'DASH'
        | 'DISENGAGE'
        | 'DODGE'
        | 'HELP'
        | 'HIDE'
        | 'READY'
        | 'SEARCH'
        | 'USE_OBJECT'
        | 'BONUS_ACTION'
        | 'REACTION'
        | 'FREE_ACTION',
      options?: {
        targetId?: string;
        targetPosition?: GridPosition;
        spellId?: string;
        spellSlot?: number;
        weaponId?: string;
        itemId?: string;
        path?: GridPosition[];
      }
    ) => {
      if (!sessionId || !isAuthenticated) return false;

      return sendMessage(WSMessageType.ACTION_REQUEST, {
        sessionId,
        creatureId,
        actionType,
        ...options,
      });
    },
    [sessionId, isAuthenticated, sendMessage]
  );

  // ====================
  // MESSAGE HANDLING
  // ====================

  // Add custom message handler for game-specific messages
  useEffect(() => {
    if (!sessionId) return;

    // Custom handler for game messages (to be wired up when WebSocket raw access is available)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleGameMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;
        const callbacks = callbacksRef.current;

        switch (type) {
          case WSMessageType.TOKEN_MOVED:
            callbacks.onTokenMoved?.({
              tokenId: payload.tokenId,
              creatureId: payload.creatureId,
              fromPosition: payload.fromPosition,
              toPosition: payload.toPosition,
              path: payload.path,
            });
            break;

          case WSMessageType.ATTACK_RESULT:
            callbacks.onAttackResult?.({
              attackerId: payload.attackerId,
              targetId: payload.targetId,
              weaponId: payload.weaponId,
              roll: payload.roll,
              total: payload.total,
              hits: payload.hits,
              isCritical: payload.isCritical,
              damage: payload.damage,
              damageType: payload.damageType,
            });
            break;

          case WSMessageType.SPELL_RESULT:
            callbacks.onSpellResult?.({
              casterId: payload.casterId,
              spellId: payload.spellId,
              spellName: payload.spellName,
              spellLevel: payload.spellLevel,
              targetId: payload.targetId,
              targetPosition: payload.targetPosition,
              areaAffected: payload.areaAffected,
              roll: payload.roll,
              damage: payload.damage,
              healing: payload.healing,
              effects: payload.effects,
            });
            break;

          case WSMessageType.GAME_STATE_SYNC:
            callbacks.onGameStateSync?.({
              creatures: payload.creatures,
              initiativeOrder: payload.initiativeOrder,
              currentTurnCreatureId: payload.currentTurnCreatureId,
              round: payload.round,
              isInCombat: payload.isInCombat,
            });
            break;

          case WSMessageType.COMBAT_START:
            callbacks.onCombatStart?.(payload.initiativeOrder, payload.round || 1);
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: 'Combat has begun! Roll for initiative!',
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'info',
              timestamp: Date.now(),
            });
            break;

          case WSMessageType.COMBAT_END:
            callbacks.onCombatEnd?.();
            addMessage({
              senderId: 'system',
              senderName: 'System',
              content: 'Combat has ended.',
              isInCharacter: false,
              isWhisper: false,
              isSystem: true,
              level: 'success',
              timestamp: Date.now(),
            });
            break;

          case WSMessageType.TURN_START:
            callbacks.onTurnStart?.(payload.creatureId, payload.round);
            break;

          case WSMessageType.TOKEN_UPDATE:
            callbacks.onCreatureUpdate?.({
              id: payload.tokenId,
              ...payload.updates,
            });
            break;

          case WSMessageType.TOKEN_ADD:
            callbacks.onCreatureAdded?.(payload.creature);
            break;

          case WSMessageType.TOKEN_REMOVE:
            callbacks.onCreatureRemoved?.(payload.tokenId);
            break;
        }
      } catch {
        // Ignore parse errors - handled by main WebSocket hook
      }
    };

    // This would need access to the raw WebSocket, which the useWebSocket hook doesn't expose
    // For now, we'll rely on the store being updated by the main hook
    // In a full implementation, you'd either:
    // 1. Add these handlers to useWebSocket directly
    // 2. Expose the raw socket for additional event listeners
    // 3. Use a pub/sub pattern in the store

  }, [sessionId, addMessage]);

  return {
    // WebSocket state
    ...ws,

    // Game actions
    sendTokenMove,
    sendAttack,
    sendSpellCast,
    sendCombatStart,
    sendCombatEnd,
    sendTurnStart,
    sendTurnEnd,
    sendCreatureUpdate,
    sendCreatureAdd,
    sendCreatureRemove,
    sendGameStateSync,
    sendAction,
  };
}

export default useGameSync;
