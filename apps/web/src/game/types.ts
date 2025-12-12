/**
 * Game Board Types
 * Type definitions for the PixiJS game board
 */

// Grid position on the board
export interface GridPosition {
  x: number;
  y: number;
}

// Terrain types for tiles
export type TerrainType =
  | 'NORMAL'
  | 'DIFFICULT'
  | 'WATER'
  | 'LAVA'
  | 'PIT'
  | 'WALL'
  | 'DOOR'
  | 'STAIRS';

// Tile data for the game board
export interface TileData {
  x: number;
  y: number;
  terrain: TerrainType;
  elevation: number;
  isExplored: boolean;
  isVisible: boolean;
  lightLevel: number;
  effects: string[];
}

// Map data structure
export interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  gridSize: number; // feet per cell (default 5)
  tiles: TileData[];
  backgroundUrl?: string;
}

// D&D 5e creature sizes
export type CreatureSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

// Size to grid cells mapping (5e rules)
export const SIZE_TO_CELLS: Record<CreatureSize, number> = {
  tiny: 0.5,
  small: 1,
  medium: 1,
  large: 2,
  huge: 3,
  gargantuan: 4,
};

// Conditions (5e PHB)
export type Condition =
  | 'BLINDED'
  | 'CHARMED'
  | 'DEAFENED'
  | 'EXHAUSTION'
  | 'FRIGHTENED'
  | 'GRAPPLED'
  | 'INCAPACITATED'
  | 'INVISIBLE'
  | 'PARALYZED'
  | 'PETRIFIED'
  | 'POISONED'
  | 'PRONE'
  | 'RESTRAINED'
  | 'STUNNED'
  | 'UNCONSCIOUS';

// Creature on the board
export interface Creature {
  id: string;
  name: string;
  type: 'character' | 'monster' | 'npc';
  position: GridPosition;
  size: CreatureSize;

  // Combat stats
  currentHitPoints: number;
  maxHitPoints: number;
  tempHitPoints: number;
  armorClass: number;
  speed: number;
  initiative?: number;

  // Status
  conditions: Condition[];
  isConcentrating: boolean;
  concentrationSpellId?: string;

  // Visual
  spriteUrl?: string;
  tokenColor?: string;

  // Visibility
  isVisible: boolean;
  isHidden: boolean;
}

// Visibility state for fog of war
export type VisibilityState = 'HIDDEN' | 'EXPLORED' | 'VISIBLE';

// Full game state for the board
export interface GameState {
  sessionId: string;
  map: MapData;
  creatures: Creature[];
  visibleTiles?: GridPosition[];
  currentTurnCreatureId?: string;
  round: number;
  phase: 'exploration' | 'combat' | 'dialogue';
}

// Area of Effect shapes (5e)
export type AoEShape = 'SPHERE' | 'CUBE' | 'CONE' | 'LINE' | 'CYLINDER';

// Area of Effect definition
export interface AreaOfEffect {
  shape: AoEShape;
  origin: GridPosition;
  size: number; // radius for sphere/cylinder, side for cube, length for cone/line
  direction?: number; // angle in degrees for cone/line
  color: number;
  alpha: number;
}

// Game configuration
export interface GameConfig {
  containerId: string;
  tileSize: number;
  gridWidth: number;
  gridHeight: number;
  onTileClick?: (position: GridPosition) => void;
  onTokenClick?: (creatureId: string) => void;
  onTileHover?: (position: GridPosition | null) => void;
}

// Input handler callbacks
export interface InputCallbacks {
  onTileClick: (position: GridPosition) => void;
  onTileHover: (position: GridPosition | null) => void;
  onPan: (dx: number, dy: number) => void;
  onZoom: (delta: number, centerX: number, centerY: number) => void;
}

// Token visual state
export interface TokenVisualState {
  isSelected: boolean;
  isTargeted: boolean;
  isMoving: boolean;
  animationProgress: number;
}

// Terrain colors
export const TERRAIN_COLORS: Record<TerrainType, number> = {
  NORMAL: 0x3d3d3d,
  DIFFICULT: 0x5a4a32,
  WATER: 0x1a4a6e,
  LAVA: 0x8b2500,
  PIT: 0x0a0a0a,
  WALL: 0x4a4a4a,
  DOOR: 0x6b4423,
  STAIRS: 0x5a5a5a,
};

// Grid line colors
export const GRID_COLORS = {
  line: 0x444444,
  hover: 0xf59e0b,
  selected: 0x22c55e,
  movement: 0x3b82f6,
  attack: 0xef4444,
  spell: 0x8b5cf6,
};

// Token colors by type
export const TOKEN_TYPE_COLORS: Record<Creature['type'], number> = {
  character: 0x22c55e,
  monster: 0xef4444,
  npc: 0x3b82f6,
};
