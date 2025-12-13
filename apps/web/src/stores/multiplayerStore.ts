import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, SessionState } from '@dnd/shared';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'authenticated' | 'error';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  isInCharacter: boolean;
  isWhisper: boolean;
  isSystem: boolean;
  level?: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
}

export interface DiceResult {
  id: string;
  playerId: string;
  playerName: string;
  dice: string;
  rolls: number[];
  modifier: number;
  total: number;
  reason?: string;
  isPrivate: boolean;
  timestamp: number;
}

interface MultiplayerState {
  // Connection
  connectionStatus: ConnectionStatus;
  connectionId: string | null;
  error: string | null;

  // Session
  currentSession: SessionState | null;
  players: Player[];
  isHost: boolean;
  isReady: boolean;

  // Chat
  messages: ChatMessage[];
  unreadCount: number;

  // Dice
  diceResults: DiceResult[];

  // Game state
  currentTurnCreatureId: string | null;
  round: number;
  isInCombat: boolean;

  // Actions
  setConnectionStatus: (status: ConnectionStatus, error?: string) => void;
  setConnectionId: (id: string | null) => void;
  setSession: (session: SessionState | null) => void;
  setPlayers: (players: Player[]) => void;
  updatePlayer: (odId: string, updates: Partial<Player>) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (odId: string) => void;
  setIsHost: (isHost: boolean) => void;
  setIsReady: (isReady: boolean) => void;
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
  clearMessages: () => void;
  markMessagesRead: () => void;
  addDiceResult: (result: Omit<DiceResult, 'id'>) => void;
  clearDiceResults: () => void;
  setCurrentTurn: (creatureId: string | null, round: number) => void;
  setIsInCombat: (inCombat: boolean) => void;
  reset: () => void;
}

const initialState = {
  connectionStatus: 'disconnected' as ConnectionStatus,
  connectionId: null,
  error: null,
  currentSession: null,
  players: [],
  isHost: false,
  isReady: false,
  messages: [],
  unreadCount: 0,
  diceResults: [],
  currentTurnCreatureId: null,
  round: 0,
  isInCombat: false,
};

export const useMultiplayerStore = create<MultiplayerState>()(
  persist(
    (set) => ({
      ...initialState,

      setConnectionStatus: (status, error) =>
        set({ connectionStatus: status, error: error || null }),

      setConnectionId: (id) => set({ connectionId: id }),

      setSession: (session) =>
        set({
          currentSession: session,
          players: session?.players || [],
          isHost: false, // Will be set separately
        }),

      setPlayers: (players) => set({ players }),

      updatePlayer: (userId, updates) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.userId === userId ? { ...p, ...updates } : p
          ),
        })),

      addPlayer: (player) =>
        set((state) => ({
          players: [...state.players.filter((p) => p.userId !== player.userId), player],
        })),

      removePlayer: (userId) =>
        set((state) => ({
          players: state.players.filter((p) => p.userId !== userId),
        })),

      setIsHost: (isHost) => set({ isHost }),

      setIsReady: (isReady) => set({ isReady }),

      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            { ...message, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}` },
          ].slice(-100), // Keep last 100 messages
          unreadCount: state.unreadCount + 1,
        })),

      clearMessages: () => set({ messages: [], unreadCount: 0 }),

      markMessagesRead: () => set({ unreadCount: 0 }),

      addDiceResult: (result) =>
        set((state) => ({
          diceResults: [
            ...state.diceResults,
            { ...result, id: `dice-${Date.now()}-${Math.random().toString(36).slice(2)}` },
          ].slice(-50), // Keep last 50 rolls
        })),

      clearDiceResults: () => set({ diceResults: [] }),

      setCurrentTurn: (creatureId, round) =>
        set({ currentTurnCreatureId: creatureId, round }),

      setIsInCombat: (inCombat) => set({ isInCombat: inCombat }),

      reset: () => set(initialState),
    }),
    {
      name: 'multiplayer-storage',
      partialize: (state) => ({
        // Only persist minimal state
        messages: state.messages.slice(-20), // Keep last 20 messages
      }),
    }
  )
);
