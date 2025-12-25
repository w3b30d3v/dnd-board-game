/**
 * Map Editor Utilities
 * Converts between editor types and game board types
 */

import type { MapTerrainType, MapLayer, MapTile, MapLighting, LightSource } from '@dnd/shared';
import type { TerrainType, TileData } from '@/game/types';

// Editor terrain types to game terrain types mapping
export const EDITOR_TO_GAME_TERRAIN: Record<MapTerrainType, TerrainType> = {
  grass: 'NORMAL',
  stone: 'NORMAL',
  water: 'WATER',
  lava: 'LAVA',
  ice: 'NORMAL',
  sand: 'DIFFICULT',
  wood: 'NORMAL',
  void: 'PIT',
  difficult: 'DIFFICULT',
};

// Game terrain types to editor terrain types mapping (for reverse conversion)
export const GAME_TO_EDITOR_TERRAIN: Partial<Record<TerrainType, MapTerrainType>> = {
  NORMAL: 'stone',
  DIFFICULT: 'difficult',
  WATER: 'water',
  LAVA: 'lava',
  PIT: 'void',
  WALL: 'stone',
  DOOR: 'wood',
  STAIRS: 'stone',
};

// Terrain colors for preview (matching BoardRenderer)
export const TERRAIN_PREVIEW_COLORS: Record<MapTerrainType, number> = {
  grass: 0x4ade80,
  stone: 0x9ca3af,
  water: 0x1a4a6e,
  lava: 0x8b2500,
  ice: 0x93c5fd,
  sand: 0xfcd34d,
  wood: 0x6b4423,
  void: 0x0a0a0a,
  difficult: 0x5a4a32,
};

// Light source colors for preview
export const LIGHT_COLOR_PRESETS = [
  { name: 'Torch', color: '#ff9933' },
  { name: 'Candle', color: '#ffcc66' },
  { name: 'Fireplace', color: '#ff6600' },
  { name: 'Moonlight', color: '#b3c7ff' },
  { name: 'Magic (Blue)', color: '#66ccff' },
  { name: 'Magic (Purple)', color: '#cc66ff' },
  { name: 'Magic (Green)', color: '#66ff99' },
  { name: 'Sunlight', color: '#ffffcc' },
];

/**
 * Convert map editor layers to game TileData format for rendering
 */
export function convertLayersToTileData(
  layers: MapLayer[],
  width: number,
  height: number
): TileData[] {
  const tiles: TileData[] = [];
  const tileMap = new Map<string, MapTile>();

  // Merge all visible layers (later layers override earlier ones)
  for (const layer of layers) {
    if (!layer.visible) continue;
    for (const tile of layer.tiles) {
      const key = `${tile.x},${tile.y}`;
      tileMap.set(key, tile);
    }
  }

  // Convert to TileData array
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      const editorTile = tileMap.get(key);

      const terrain: TerrainType = editorTile
        ? EDITOR_TO_GAME_TERRAIN[editorTile.terrain] || 'NORMAL'
        : 'NORMAL';

      tiles.push({
        x,
        y,
        terrain,
        elevation: editorTile?.elevation || 0,
        isExplored: true,
        isVisible: true,
        lightLevel: 1,
        effects: [],
      });
    }
  }

  return tiles;
}

/**
 * Convert hex color string to number
 */
export function hexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * Convert number to hex color string
 */
export function numberToHex(num: number): string {
  return '#' + num.toString(16).padStart(6, '0');
}

/**
 * Generate unique ID for light sources
 */
export function generateLightId(): string {
  return `light_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a default light source at a position
 */
export function createDefaultLight(x: number, y: number): LightSource {
  return {
    id: generateLightId(),
    x,
    y,
    radius: 5,
    color: '#ff9933', // Torch color
    intensity: 0.8,
    flicker: true,
  };
}

/**
 * Calculate light influence on a tile
 * Returns intensity (0-1) based on distance from light
 */
export function calculateLightInfluence(
  tileX: number,
  tileY: number,
  light: LightSource
): number {
  const dx = tileX - light.x;
  const dy = tileY - light.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance >= light.radius) return 0;

  // Linear falloff
  const falloff = 1 - (distance / light.radius);
  return falloff * light.intensity;
}

/**
 * Deep clone layers for undo/redo
 */
export function cloneLayers(layers: MapLayer[]): MapLayer[] {
  return layers.map(layer => ({
    ...layer,
    tiles: layer.tiles.map(tile => ({ ...tile })),
  }));
}

/**
 * Deep clone lighting for undo/redo
 */
export function cloneLighting(lighting: MapLighting): MapLighting {
  return {
    ...lighting,
    lightSources: lighting.lightSources?.map(light => ({ ...light })),
  };
}

/**
 * Check if two layer states are equal (for detecting changes)
 */
export function areLayersEqual(a: MapLayer[], b: MapLayer[]): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
    if (a[i].visible !== b[i].visible) return false;
    if (a[i].opacity !== b[i].opacity) return false;
    if (a[i].tiles.length !== b[i].tiles.length) return false;

    // Check tiles
    const aTiles = new Map(a[i].tiles.map(t => [`${t.x},${t.y}`, t.terrain]));
    for (const tile of b[i].tiles) {
      if (aTiles.get(`${tile.x},${tile.y}`) !== tile.terrain) return false;
    }
  }

  return true;
}

/**
 * Terrain type information for the UI
 */
export const TERRAIN_INFO: Array<{
  type: MapTerrainType;
  label: string;
  icon: string;
  description: string;
  shortcut: string;
}> = [
  { type: 'grass', label: 'Grass', icon: '🌿', description: 'Open grassland', shortcut: '1' },
  { type: 'stone', label: 'Stone', icon: '🪨', description: 'Stone floor or path', shortcut: '2' },
  { type: 'water', label: 'Water', icon: '💧', description: 'Shallow water (animated)', shortcut: '3' },
  { type: 'lava', label: 'Lava', icon: '🔥', description: 'Molten lava (animated)', shortcut: '4' },
  { type: 'ice', label: 'Ice', icon: '❄️', description: 'Slippery ice', shortcut: '5' },
  { type: 'sand', label: 'Sand', icon: '🏜️', description: 'Difficult terrain', shortcut: '6' },
  { type: 'wood', label: 'Wood', icon: '🪵', description: 'Wooden floor', shortcut: '7' },
  { type: 'void', label: 'Void', icon: '⬛', description: 'Pit or hole', shortcut: '8' },
  { type: 'difficult', label: 'Difficult', icon: '⚠️', description: 'Difficult terrain', shortcut: '9' },
];

/**
 * Get terrain type by keyboard shortcut
 */
export function getTerrainByShortcut(key: string): MapTerrainType | null {
  const terrain = TERRAIN_INFO.find(t => t.shortcut === key);
  return terrain?.type || null;
}
