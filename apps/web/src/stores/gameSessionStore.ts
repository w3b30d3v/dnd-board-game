import { create } from 'zustand';
import { api } from '@/lib/api';
import type { GameState, MapData, Creature, TileData } from '@/game/types';

// Types for session data from API
export interface SessionParticipant {
  id: string;
  userId: string;
  characterId: string | null;
  role: 'dm' | 'player';
  currentHp: number | null;
  tempHp: number;
  conditions: string[];
  inspiration: boolean;
  isConnected: boolean;
  lastSeenAt: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  character: {
    id: string;
    name: string;
    race: string;
    class: string;
    level: number;
    maxHitPoints: number;
    currentHitPoints: number;
    tempHitPoints: number;
    armorClass: number;
    speed: number;
    portraitUrl: string | null;
  } | null;
}

export interface SessionData {
  id: string;
  name: string;
  status: 'lobby' | 'active' | 'paused' | 'completed';
  inviteCode: string;
  campaignId: string;
  currentMapId: string | null;
  inCombat: boolean;
  currentTurn: number | null;
  round: number;
  initiativeOrder: Array<{ creatureId: string; initiative: number; tieBreaker: number }> | null;
  tokenStates: Record<string, TokenState>;
  revealedCells: Record<string, Array<[number, number]>>;
  journal: JournalEntry[];
  lastActivityAt: string;
  createdAt: string;
  campaign: {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    settings: Record<string, unknown>;
  };
  participants: SessionParticipant[];
}

export interface TokenState {
  x: number;
  y: number;
  currentHp: number;
  maxHp: number;
  tempHp: number;
  conditions: string[];
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  type: 'combat_start' | 'combat_end' | 'damage' | 'healing' | 'death' | 'note' | 'roll';
  content: string;
  userId?: string;
}

export interface MapInfo {
  id: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  gridSize: number;
  backgroundUrl: string | null;
  tags: string[];
}

export interface EncounterInfo {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
  monsters: Array<{
    id: string;
    monsterId: string;
    name: string;
    count: number;
    position?: { x: number; y: number };
  }>;
  objectives: Array<{ id: string; description: string; completed: boolean }>;
  rewards: Array<{ type: string; value: string }>;
  mapId: string | null;
}

// API response map format
interface ApiMapData {
  id: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  tileSize?: number;
  tiles?: unknown;
  layers?: unknown;
  backgroundUrl?: string | null;
  lighting?: unknown;
  ambience?: unknown;
}

interface GameSessionState {
  // Session data
  session: SessionData | null;
  currentMap: MapData | null;
  isDM: boolean;
  userId: string | null;

  // Available content
  availableMaps: MapInfo[];
  availableEncounters: EncounterInfo[];

  // Game state for PixiJS
  gameState: GameState | null;

  // Loading states
  isLoading: boolean;
  isLoadingMap: boolean;
  error: string | null;

  // Actions
  loadSession: (sessionId: string) => Promise<void>;
  loadMaps: (sessionId: string) => Promise<void>;
  loadEncounters: (sessionId: string) => Promise<void>;
  changeMap: (sessionId: string, mapId: string | null) => Promise<void>;
  updateGameState: (sessionId: string, updates: Partial<GameState>) => Promise<void>;
  joinSession: (sessionId: string, characterId?: string) => Promise<void>;
  leaveSession: (sessionId: string) => Promise<void>;
  addJournalEntry: (sessionId: string, type: string, content: string) => Promise<void>;
  convertToGameState: () => GameState | null;
  reset: () => void;
}

const initialState = {
  session: null,
  currentMap: null,
  isDM: false,
  userId: null,
  availableMaps: [],
  availableEncounters: [],
  gameState: null,
  isLoading: false,
  isLoadingMap: false,
  error: null,
};

export const useGameSessionStore = create<GameSessionState>()((set, get) => ({
  ...initialState,

  loadSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });

    try {
      const data = await api.get<{
        session: SessionData;
        currentMap: ApiMapData | null;
        isDM: boolean;
        userId: string;
      }>(`/game/sessions/${sessionId}`);
      const { session, currentMap, isDM, userId } = data;

      // Convert API map format to GameState MapData format
      let mapData: MapData | null = null;
      if (currentMap) {
        mapData = convertApiMapToGameMap(currentMap);
      }

      set({
        session,
        currentMap: mapData,
        isDM,
        userId,
        isLoading: false,
      });

      // Convert to game state for PixiJS
      const gameState = get().convertToGameState();
      set({ gameState });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load session';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  loadMaps: async (sessionId: string) => {
    try {
      const data = await api.get<{ maps: MapInfo[] }>(`/game/sessions/${sessionId}/maps`);
      set({ availableMaps: data.maps });
    } catch (error) {
      console.error('Failed to load maps:', error);
    }
  },

  loadEncounters: async (sessionId: string) => {
    try {
      const data = await api.get<{ encounters: EncounterInfo[] }>(`/game/sessions/${sessionId}/encounters`);
      set({ availableEncounters: data.encounters });
    } catch (error) {
      console.error('Failed to load encounters:', error);
    }
  },

  changeMap: async (sessionId: string, mapId: string | null) => {
    set({ isLoadingMap: true });

    try {
      const data = await api.patch<{ session: { id: string; currentMapId: string | null }; currentMap: ApiMapData | null }>(`/game/sessions/${sessionId}/map`, { mapId });
      const { currentMap } = data;

      let mapData: MapData | null = null;
      if (currentMap) {
        mapData = convertApiMapToGameMap(currentMap);
      }

      set((state) => ({
        session: state.session ? { ...state.session, currentMapId: mapId } : null,
        currentMap: mapData,
        isLoadingMap: false,
      }));

      // Update game state
      const gameState = get().convertToGameState();
      set({ gameState });
    } catch (error) {
      set({ isLoadingMap: false });
      throw error;
    }
  },

  updateGameState: async (sessionId: string, updates: Partial<GameState>) => {
    try {
      // Build update payload
      const payload: Record<string, unknown> = {};

      if (updates.creatures) {
        // Convert creatures to token states
        const tokenStates: Record<string, TokenState> = {};
        for (const creature of updates.creatures) {
          tokenStates[creature.id] = {
            x: creature.position.x,
            y: creature.position.y,
            currentHp: creature.currentHitPoints,
            maxHp: creature.maxHitPoints,
            tempHp: creature.tempHitPoints,
            conditions: creature.conditions,
          };
        }
        payload.tokenStates = tokenStates;
      }

      if (updates.round !== undefined) {
        payload.round = updates.round;
      }

      if (updates.phase === 'combat') {
        payload.inCombat = true;
      } else if (updates.phase === 'exploration') {
        payload.inCombat = false;
      }

      await api.patch(`/game/sessions/${sessionId}/state`, payload);

      // Update local state
      set((state) => ({
        session: state.session
          ? {
              ...state.session,
              tokenStates: (payload.tokenStates as Record<string, TokenState>) || state.session.tokenStates,
              round: (payload.round as number) ?? state.session.round,
              inCombat: (payload.inCombat as boolean) ?? state.session.inCombat,
            }
          : null,
      }));
    } catch (error) {
      console.error('Failed to update game state:', error);
      throw error;
    }
  },

  joinSession: async (sessionId: string, characterId?: string) => {
    await api.post(`/game/sessions/${sessionId}/join`, { characterId });
    // Reload session to get updated participants
    await get().loadSession(sessionId);
  },

  leaveSession: async (sessionId: string) => {
    await api.post(`/game/sessions/${sessionId}/leave`);
    set(initialState);
  },

  addJournalEntry: async (sessionId: string, type: string, content: string) => {
    try {
      const data = await api.post<{ entry: JournalEntry; journal: JournalEntry[] }>(`/game/sessions/${sessionId}/journal`, { type, content });
      set((state) => ({
        session: state.session
          ? { ...state.session, journal: data.journal }
          : null,
      }));
    } catch (error) {
      console.error('Failed to add journal entry:', error);
    }
  },

  convertToGameState: (): GameState | null => {
    const { session, currentMap } = get();

    if (!session) return null;

    // Build creatures from participants and token states
    const creatures: Creature[] = [];

    // Add player characters
    for (const participant of session.participants) {
      if (participant.role === 'player' && participant.character) {
        const tokenState = session.tokenStates[participant.character.id];
        creatures.push({
          id: participant.character.id,
          name: participant.character.name,
          type: 'character',
          position: tokenState
            ? { x: tokenState.x, y: tokenState.y }
            : { x: 1, y: 1 }, // Default position
          size: 'medium',
          currentHitPoints: tokenState?.currentHp ?? participant.character.currentHitPoints,
          maxHitPoints: participant.character.maxHitPoints,
          tempHitPoints: tokenState?.tempHp ?? participant.character.tempHitPoints,
          armorClass: participant.character.armorClass,
          speed: participant.character.speed,
          conditions: (tokenState?.conditions ?? []) as Creature['conditions'],
          isConcentrating: false,
          isVisible: true,
          isHidden: false,
          spriteUrl: participant.character.portraitUrl || undefined,
          tokenColor: '#22c55e', // Green for players
        });
      }
    }

    // Add monsters from token states (creatures starting with 'monster-' or 'npc-')
    for (const [creatureId, tokenState] of Object.entries(session.tokenStates)) {
      if (creatureId.startsWith('monster-') || creatureId.startsWith('npc-')) {
        creatures.push({
          id: creatureId,
          name: creatureId.replace(/^(monster-|npc-)/, '').replace(/-\d+$/, ''),
          type: creatureId.startsWith('monster-') ? 'monster' : 'npc',
          position: { x: tokenState.x, y: tokenState.y },
          size: 'medium',
          currentHitPoints: tokenState.currentHp,
          maxHitPoints: tokenState.maxHp,
          tempHitPoints: tokenState.tempHp,
          armorClass: 10,
          speed: 30,
          conditions: tokenState.conditions as Creature['conditions'],
          isConcentrating: false,
          isVisible: true,
          isHidden: false,
          tokenColor: creatureId.startsWith('monster-') ? '#ef4444' : '#3b82f6',
        });
      }
    }

    return {
      sessionId: session.id,
      map: currentMap || generateDefaultMap(),
      creatures,
      round: session.round,
      phase: session.inCombat ? 'combat' : 'exploration',
    };
  },

  reset: () => set(initialState),
}));

// Helper: Convert API map format to GameState MapData format
function convertApiMapToGameMap(apiMap: {
  id: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  tileSize?: number;
  tiles?: unknown;
  layers?: unknown;
  backgroundUrl?: string | null;
  lighting?: unknown;
  ambience?: unknown;
}): MapData {
  // Parse tiles from API format
  let tiles: TileData[] = [];

  if (apiMap.tiles && Array.isArray(apiMap.tiles)) {
    tiles = apiMap.tiles as TileData[];
  } else {
    // Generate default tiles
    for (let y = 0; y < apiMap.height; y++) {
      for (let x = 0; x < apiMap.width; x++) {
        tiles.push({
          x,
          y,
          terrain: 'NORMAL',
          elevation: 0,
          isExplored: true,
          isVisible: true,
          lightLevel: 1,
          effects: [],
        });
      }
    }
  }

  return {
    id: apiMap.id,
    name: apiMap.name,
    width: apiMap.width,
    height: apiMap.height,
    gridSize: apiMap.gridSize,
    tiles,
  };
}

// Helper: Generate a default empty map
function generateDefaultMap(): MapData {
  const width = 20;
  const height = 15;
  const tiles: TileData[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.push({
        x,
        y,
        terrain: 'NORMAL',
        elevation: 0,
        isExplored: true,
        isVisible: true,
        lightLevel: 1,
        effects: [],
      });
    }
  }

  return {
    id: 'default-map',
    name: 'Default Map',
    width,
    height,
    gridSize: 5,
    tiles,
  };
}
