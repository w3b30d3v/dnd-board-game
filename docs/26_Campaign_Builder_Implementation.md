# D&D Digital Board Game Platform
# Document 26: Campaign Builder Implementation

---

# 1. Overview

This document provides complete implementation code for the Campaign Builder (DM Tools), including:
- Map Editor with tile placement and terrain types
- Encounter Editor with monster placement and CR calculation
- Dialogue/Cutscene Editor with branching conversations
- Publishing workflow for sharing campaigns

---

# 2. Map Editor

## 2.1 Map Editor Types

```typescript
// packages/shared/src/types/mapEditor.ts

export interface MapData {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  tileSize: number;  // Always 64px (represents 5ft)
  layers: MapLayer[];
  lighting: LightingSettings;
  ambience: AmbienceSettings;
  metadata: MapMetadata;
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'terrain' | 'objects' | 'tokens' | 'effects' | 'fog';
  visible: boolean;
  locked: boolean;
  opacity: number;
  tiles: TilePlacement[];
}

export interface TilePlacement {
  x: number;
  y: number;
  tileId: string;
  rotation: 0 | 90 | 180 | 270;
  flipX: boolean;
  flipY: boolean;
  properties?: Record<string, any>;
}

export type TerrainType = 
  | 'floor_stone' | 'floor_wood' | 'floor_dirt' | 'floor_grass'
  | 'wall_stone' | 'wall_wood' | 'wall_brick'
  | 'water_shallow' | 'water_deep'
  | 'difficult_rubble' | 'difficult_ice' | 'difficult_mud'
  | 'pit' | 'lava'
  | 'door_wood' | 'door_iron' | 'door_secret'
  | 'stairs_up' | 'stairs_down';

export interface TileDefinition {
  id: string;
  name: string;
  category: string;
  terrainType: TerrainType;
  texture: string;
  isWalkable: boolean;
  isOpaque: boolean;  // Blocks LoS
  movementCost: number;  // 1 = normal, 2 = difficult terrain
  effects?: TileEffect[];
}

export interface TileEffect {
  type: 'damage' | 'condition' | 'teleport' | 'trigger';
  damageType?: DamageType;
  damageAmount?: string;  // e.g., "2d6"
  condition?: ConditionType;
  triggerId?: string;
}

export interface LightingSettings {
  ambientLight: number;  // 0-1
  ambientColor: string;
  globalIllumination: boolean;
  lights: LightSource[];
}

export interface LightSource {
  id: string;
  x: number;
  y: number;
  radius: number;  // In tiles
  brightness: number;
  color: string;
  flicker: boolean;
  flickerIntensity?: number;
}

export interface AmbienceSettings {
  backgroundMusic?: string;
  ambientSound?: string;
  weatherEffect?: 'none' | 'rain' | 'snow' | 'fog' | 'storm';
  weatherIntensity?: number;
}

export interface MapMetadata {
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  recommendedLevel: { min: number; max: number };
  estimatedDuration: number;  // Minutes
}
```

## 2.2 Map Editor Component

```tsx
// apps/web/src/components/dm/MapEditor/MapEditor.tsx

import { useState, useRef, useCallback, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { MapData, TilePlacement, TileDefinition } from '@dnd/shared';
import { TilePalette } from './TilePalette';
import { LayerPanel } from './LayerPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { MapToolbar } from './MapToolbar';

interface MapEditorProps {
  mapData: MapData;
  onSave: (map: MapData) => void;
}

type EditorTool = 'select' | 'paint' | 'erase' | 'fill' | 'eyedropper' | 'light' | 'token';

export function MapEditor({ mapData, onSave }: MapEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  
  const [map, setMap] = useState<MapData>(mapData);
  const [selectedTool, setSelectedTool] = useState<EditorTool>('paint');
  const [selectedTile, setSelectedTile] = useState<TileDefinition | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<string>(map.layers[0]?.id);
  const [zoom, setZoom] = useState(1);
  const [gridVisible, setGridVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  // Initialize PIXI
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;
    
    const app = new PIXI.Application({
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight,
      backgroundColor: 0x1a1a2e,
      resolution: window.devicePixelRatio,
      autoDensity: true,
    });
    
    canvasRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;
    
    // Create containers for each layer
    const mapContainer = new PIXI.Container();
    mapContainer.sortableChildren = true;
    app.stage.addChild(mapContainer);
    
    // Grid overlay
    const gridContainer = new PIXI.Container();
    gridContainer.zIndex = 1000;
    app.stage.addChild(gridContainer);
    
    renderMap();
    
    return () => {
      app.destroy(true);
      appRef.current = null;
    };
  }, []);
  
  // Render map layers
  const renderMap = useCallback(() => {
    if (!appRef.current) return;
    
    const app = appRef.current;
    const mapContainer = app.stage.children[0] as PIXI.Container;
    mapContainer.removeChildren();
    
    // Render each layer
    map.layers.forEach((layer, index) => {
      if (!layer.visible) return;
      
      const layerContainer = new PIXI.Container();
      layerContainer.zIndex = index;
      layerContainer.alpha = layer.opacity;
      
      layer.tiles.forEach(tile => {
        const sprite = createTileSprite(tile);
        if (sprite) {
          sprite.x = tile.x * map.tileSize;
          sprite.y = tile.y * map.tileSize;
          layerContainer.addChild(sprite);
        }
      });
      
      mapContainer.addChild(layerContainer);
    });
    
    // Render grid
    if (gridVisible) {
      renderGrid();
    }
    
    // Render lights
    renderLights();
  }, [map, gridVisible]);
  
  const createTileSprite = (tile: TilePlacement): PIXI.Sprite | null => {
    const texture = PIXI.Texture.from(`/tiles/${tile.tileId}.png`);
    const sprite = new PIXI.Sprite(texture);
    sprite.width = map.tileSize;
    sprite.height = map.tileSize;
    sprite.anchor.set(0.5);
    sprite.rotation = (tile.rotation * Math.PI) / 180;
    sprite.scale.x *= tile.flipX ? -1 : 1;
    sprite.scale.y *= tile.flipY ? -1 : 1;
    return sprite;
  };
  
  const renderGrid = () => {
    if (!appRef.current) return;
    
    const gridContainer = appRef.current.stage.children[1] as PIXI.Container;
    gridContainer.removeChildren();
    
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(1, 0x444466, 0.5);
    
    for (let x = 0; x <= map.width; x++) {
      graphics.moveTo(x * map.tileSize, 0);
      graphics.lineTo(x * map.tileSize, map.height * map.tileSize);
    }
    
    for (let y = 0; y <= map.height; y++) {
      graphics.moveTo(0, y * map.tileSize);
      graphics.lineTo(map.width * map.tileSize, y * map.tileSize);
    }
    
    gridContainer.addChild(graphics);
  };
  
  const renderLights = () => {
    // Light rendering with soft shadows
    map.lighting.lights.forEach(light => {
      // Create radial gradient for light
      const lightGraphics = new PIXI.Graphics();
      // ... light rendering implementation
    });
  };
  
  // Handle tile painting
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!appRef.current || !selectedTile) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (map.tileSize * zoom));
    const y = Math.floor((e.clientY - rect.top) / (map.tileSize * zoom));
    
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) return;
    
    switch (selectedTool) {
      case 'paint':
        paintTile(x, y);
        break;
      case 'erase':
        eraseTile(x, y);
        break;
      case 'fill':
        fillArea(x, y);
        break;
      case 'eyedropper':
        pickTile(x, y);
        break;
    }
  };
  
  const paintTile = (x: number, y: number) => {
    if (!selectedTile) return;
    
    setMap(prev => {
      const newLayers = prev.layers.map(layer => {
        if (layer.id !== selectedLayer) return layer;
        
        // Remove existing tile at position
        const filteredTiles = layer.tiles.filter(t => t.x !== x || t.y !== y);
        
        return {
          ...layer,
          tiles: [...filteredTiles, {
            x,
            y,
            tileId: selectedTile.id,
            rotation: 0,
            flipX: false,
            flipY: false,
          }],
        };
      });
      
      return { ...prev, layers: newLayers };
    });
    
    renderMap();
  };
  
  const eraseTile = (x: number, y: number) => {
    setMap(prev => {
      const newLayers = prev.layers.map(layer => {
        if (layer.id !== selectedLayer) return layer;
        return {
          ...layer,
          tiles: layer.tiles.filter(t => t.x !== x || t.y !== y),
        };
      });
      return { ...prev, layers: newLayers };
    });
    renderMap();
  };
  
  const fillArea = (startX: number, startY: number) => {
    if (!selectedTile) return;
    
    const layer = map.layers.find(l => l.id === selectedLayer);
    if (!layer) return;
    
    // Get the tile type at start position
    const startTile = layer.tiles.find(t => t.x === startX && t.y === startY);
    const startTileId = startTile?.tileId || null;
    
    // Flood fill algorithm
    const visited = new Set<string>();
    const queue: [number, number][] = [[startX, startY]];
    const newTiles: TilePlacement[] = [];
    
    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      const key = `${x},${y}`;
      
      if (visited.has(key)) continue;
      if (x < 0 || x >= map.width || y < 0 || y >= map.height) continue;
      
      const currentTile = layer.tiles.find(t => t.x === x && t.y === y);
      if ((currentTile?.tileId || null) !== startTileId) continue;
      
      visited.add(key);
      newTiles.push({
        x,
        y,
        tileId: selectedTile.id,
        rotation: 0,
        flipX: false,
        flipY: false,
      });
      
      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    
    setMap(prev => {
      const newLayers = prev.layers.map(layer => {
        if (layer.id !== selectedLayer) return layer;
        const filteredTiles = layer.tiles.filter(
          t => !visited.has(`${t.x},${t.y}`)
        );
        return { ...layer, tiles: [...filteredTiles, ...newTiles] };
      });
      return { ...prev, layers: newLayers };
    });
    
    renderMap();
  };
  
  const pickTile = (x: number, y: number) => {
    const layer = map.layers.find(l => l.id === selectedLayer);
    const tile = layer?.tiles.find(t => t.x === x && t.y === y);
    if (tile) {
      // Find tile definition and select it
      // setSelectedTile(...)
    }
  };
  
  // Add light source
  const addLight = (x: number, y: number) => {
    setMap(prev => ({
      ...prev,
      lighting: {
        ...prev.lighting,
        lights: [...prev.lighting.lights, {
          id: `light_${Date.now()}`,
          x,
          y,
          radius: 4,
          brightness: 1,
          color: '#FFAA44',
          flicker: false,
        }],
      },
    }));
  };
  
  // Resize map
  const resizeMap = (newWidth: number, newHeight: number) => {
    setMap(prev => {
      const newLayers = prev.layers.map(layer => ({
        ...layer,
        tiles: layer.tiles.filter(t => t.x < newWidth && t.y < newHeight),
      }));
      return { ...prev, width: newWidth, height: newHeight, layers: newLayers };
    });
  };
  
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Sidebar - Tile Palette */}
      <div className="w-64 border-r border-gray-700 overflow-y-auto">
        <TilePalette
          selectedTile={selectedTile}
          onSelectTile={setSelectedTile}
        />
      </div>
      
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <MapToolbar
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          zoom={zoom}
          onZoomChange={setZoom}
          gridVisible={gridVisible}
          onToggleGrid={() => setGridVisible(!gridVisible)}
          onSave={() => onSave(map)}
          onUndo={() => {}}
          onRedo={() => {}}
        />
        
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-hidden cursor-crosshair"
          onClick={handleCanvasClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseMove={(e) => {
            if (isDragging && (selectedTool === 'paint' || selectedTool === 'erase')) {
              handleCanvasClick(e);
            }
          }}
        />
      </div>
      
      {/* Right Sidebar - Layers & Properties */}
      <div className="w-64 border-l border-gray-700">
        <LayerPanel
          layers={map.layers}
          selectedLayer={selectedLayer}
          onSelectLayer={setSelectedLayer}
          onToggleVisibility={(id) => {
            setMap(prev => ({
              ...prev,
              layers: prev.layers.map(l =>
                l.id === id ? { ...l, visible: !l.visible } : l
              ),
            }));
          }}
          onAddLayer={() => {
            setMap(prev => ({
              ...prev,
              layers: [...prev.layers, {
                id: `layer_${Date.now()}`,
                name: `Layer ${prev.layers.length + 1}`,
                type: 'terrain',
                visible: true,
                locked: false,
                opacity: 1,
                tiles: [],
              }],
            }));
          }}
        />
        
        <PropertiesPanel
          map={map}
          onUpdateMap={setMap}
        />
      </div>
    </div>
  );
}
```

## 2.3 Tile Palette Component

```tsx
// apps/web/src/components/dm/MapEditor/TilePalette.tsx

import { useState } from 'react';
import { TileDefinition } from '@dnd/shared';

const TILE_CATEGORIES = [
  { id: 'floors', name: 'Floors', icon: '⬜' },
  { id: 'walls', name: 'Walls', icon: '🧱' },
  { id: 'doors', name: 'Doors', icon: '🚪' },
  { id: 'terrain', name: 'Terrain', icon: '🌲' },
  { id: 'water', name: 'Water', icon: '💧' },
  { id: 'hazards', name: 'Hazards', icon: '⚠️' },
  { id: 'objects', name: 'Objects', icon: '📦' },
];

const TILES: TileDefinition[] = [
  // Floors
  { id: 'floor_stone', name: 'Stone Floor', category: 'floors', terrainType: 'floor_stone', texture: 'floor_stone.png', isWalkable: true, isOpaque: false, movementCost: 1 },
  { id: 'floor_wood', name: 'Wood Floor', category: 'floors', terrainType: 'floor_wood', texture: 'floor_wood.png', isWalkable: true, isOpaque: false, movementCost: 1 },
  { id: 'floor_dirt', name: 'Dirt Floor', category: 'floors', terrainType: 'floor_dirt', texture: 'floor_dirt.png', isWalkable: true, isOpaque: false, movementCost: 1 },
  { id: 'floor_grass', name: 'Grass', category: 'floors', terrainType: 'floor_grass', texture: 'floor_grass.png', isWalkable: true, isOpaque: false, movementCost: 1 },
  
  // Walls
  { id: 'wall_stone', name: 'Stone Wall', category: 'walls', terrainType: 'wall_stone', texture: 'wall_stone.png', isWalkable: false, isOpaque: true, movementCost: Infinity },
  { id: 'wall_wood', name: 'Wood Wall', category: 'walls', terrainType: 'wall_wood', texture: 'wall_wood.png', isWalkable: false, isOpaque: true, movementCost: Infinity },
  { id: 'wall_brick', name: 'Brick Wall', category: 'walls', terrainType: 'wall_brick', texture: 'wall_brick.png', isWalkable: false, isOpaque: true, movementCost: Infinity },
  
  // Doors
  { id: 'door_wood', name: 'Wooden Door', category: 'doors', terrainType: 'door_wood', texture: 'door_wood.png', isWalkable: true, isOpaque: true, movementCost: 1 },
  { id: 'door_iron', name: 'Iron Door', category: 'doors', terrainType: 'door_iron', texture: 'door_iron.png', isWalkable: true, isOpaque: true, movementCost: 1 },
  { id: 'door_secret', name: 'Secret Door', category: 'doors', terrainType: 'door_secret', texture: 'door_secret.png', isWalkable: true, isOpaque: true, movementCost: 1 },
  
  // Terrain
  { id: 'difficult_rubble', name: 'Rubble', category: 'terrain', terrainType: 'difficult_rubble', texture: 'rubble.png', isWalkable: true, isOpaque: false, movementCost: 2 },
  { id: 'difficult_ice', name: 'Ice', category: 'terrain', terrainType: 'difficult_ice', texture: 'ice.png', isWalkable: true, isOpaque: false, movementCost: 2 },
  
  // Water
  { id: 'water_shallow', name: 'Shallow Water', category: 'water', terrainType: 'water_shallow', texture: 'water_shallow.png', isWalkable: true, isOpaque: false, movementCost: 2 },
  { id: 'water_deep', name: 'Deep Water', category: 'water', terrainType: 'water_deep', texture: 'water_deep.png', isWalkable: false, isOpaque: false, movementCost: Infinity },
  
  // Hazards
  { id: 'pit', name: 'Pit', category: 'hazards', terrainType: 'pit', texture: 'pit.png', isWalkable: false, isOpaque: false, movementCost: Infinity, effects: [{ type: 'damage', damageType: 'BLUDGEONING', damageAmount: '1d6' }] },
  { id: 'lava', name: 'Lava', category: 'hazards', terrainType: 'lava', texture: 'lava.png', isWalkable: true, isOpaque: false, movementCost: 1, effects: [{ type: 'damage', damageType: 'FIRE', damageAmount: '10d10' }] },
];

interface TilePaletteProps {
  selectedTile: TileDefinition | null;
  onSelectTile: (tile: TileDefinition) => void;
}

export function TilePalette({ selectedTile, onSelectTile }: TilePaletteProps) {
  const [selectedCategory, setSelectedCategory] = useState('floors');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredTiles = TILES.filter(tile => {
    const matchesCategory = selectedCategory === 'all' || tile.category === selectedCategory;
    const matchesSearch = tile.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Tiles</h3>
      
      {/* Search */}
      <input
        type="text"
        placeholder="Search tiles..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded text-white"
      />
      
      {/* Categories */}
      <div className="flex flex-wrap gap-1 mb-4">
        {TILE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2 py-1 rounded text-sm ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={cat.name}
          >
            {cat.icon}
          </button>
        ))}
      </div>
      
      {/* Tile Grid */}
      <div className="grid grid-cols-3 gap-2">
        {filteredTiles.map(tile => (
          <button
            key={tile.id}
            onClick={() => onSelectTile(tile)}
            className={`aspect-square p-1 rounded border-2 ${
              selectedTile?.id === tile.id
                ? 'border-purple-500'
                : 'border-transparent hover:border-gray-500'
            }`}
          >
            <img
              src={`/tiles/${tile.texture}`}
              alt={tile.name}
              className="w-full h-full object-cover rounded"
            />
            <span className="text-xs text-gray-400 block truncate mt-1">
              {tile.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

# 3. Encounter Editor

## 3.1 Encounter Types

```typescript
// packages/shared/src/types/encounter.ts

export interface Encounter {
  id: string;
  name: string;
  description: string;
  mapId: string;
  difficulty: EncounterDifficulty;
  
  // Monsters
  monsters: PlacedMonster[];
  
  // Objectives
  objectives: EncounterObjective[];
  
  // Rewards
  rewards: EncounterReward[];
  
  // Triggers
  triggers: EncounterTrigger[];
  
  // Environmental effects
  environment: EnvironmentSettings;
  
  // Music/ambience
  audio: AudioSettings;
  
  metadata: EncounterMetadata;
}

export interface PlacedMonster {
  id: string;
  monsterId: string;  // Reference to monster definition
  name?: string;  // Override name
  position: { x: number; y: number };
  hp?: number;  // Override HP
  behavior: MonsterBehavior;
  lootTable?: string;
  isMinion: boolean;  // Minion rules: 1 HP but immune to area damage under threshold
}

export interface MonsterBehavior {
  type: 'aggressive' | 'defensive' | 'ranged' | 'support' | 'coward' | 'custom';
  targetPriority: TargetPriority;
  customScript?: string;  // For custom AI
  
  // AI parameters
  aggression: number;  // 0-1
  morale: number;  // 0-1, flee when HP below morale * max_hp
  cooperation: number;  // 0-1, how much it coordinates with allies
}

export type TargetPriority = 
  | 'nearest' 
  | 'lowest_hp' 
  | 'highest_threat' 
  | 'healers_first' 
  | 'casters_first'
  | 'random';

export interface EncounterObjective {
  id: string;
  type: 'defeat_all' | 'defeat_target' | 'survive' | 'escape' | 'protect' | 'custom';
  targetIds?: string[];  // For defeat_target
  duration?: number;  // Rounds for survive
  escapeZone?: { x: number; y: number; width: number; height: number };
  protectTarget?: string;
  customCondition?: string;
  isOptional: boolean;
  xpBonus?: number;
}

export interface EncounterReward {
  type: 'xp' | 'gold' | 'item' | 'inspiration';
  amount?: number;
  itemId?: string;
  condition?: 'victory' | 'objective' | 'bonus';
}

export interface EncounterTrigger {
  id: string;
  type: TriggerType;
  condition: TriggerCondition;
  action: TriggerAction;
  repeatable: boolean;
  delay?: number;  // Rounds delay before trigger fires
}

export type TriggerType = 
  | 'on_combat_start'
  | 'on_round_start'
  | 'on_round_end'
  | 'on_creature_death'
  | 'on_hp_threshold'
  | 'on_tile_enter'
  | 'on_dialogue_choice';

export interface TriggerCondition {
  type: string;
  parameters: Record<string, any>;
}

export interface TriggerAction {
  type: 'spawn_monsters' | 'play_dialogue' | 'play_cutscene' | 'modify_terrain' | 'heal_monsters' | 'buff_monsters' | 'change_music' | 'end_combat';
  parameters: Record<string, any>;
}

export type EncounterDifficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';

export interface EncounterMetadata {
  author: string;
  createdAt: Date;
  updatedAt: Date;
  recommendedPartySize: number;
  recommendedLevel: { min: number; max: number };
  tags: string[];
}
```

## 3.2 Encounter Editor Component

```tsx
// apps/web/src/components/dm/EncounterEditor/EncounterEditor.tsx

import { useState, useMemo } from 'react';
import { Encounter, PlacedMonster, EncounterDifficulty } from '@dnd/shared';
import { MonsterPicker } from './MonsterPicker';
import { DifficultyCalculator } from './DifficultyCalculator';
import { TriggerEditor } from './TriggerEditor';
import { MapPreview } from './MapPreview';

interface EncounterEditorProps {
  encounter: Encounter;
  onSave: (encounter: Encounter) => void;
  maps: { id: string; name: string }[];
  monsters: MonsterData[];
}

interface MonsterData {
  id: string;
  name: string;
  cr: number;
  xp: number;
  type: string;
}

const XP_THRESHOLDS: Record<number, Record<EncounterDifficulty, number>> = {
  1: { trivial: 0, easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { trivial: 0, easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { trivial: 0, easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { trivial: 0, easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { trivial: 0, easy: 250, medium: 500, hard: 750, deadly: 1100 },
  // ... continues to level 20
};

const MULTIPLIERS = [
  { count: 1, multiplier: 1 },
  { count: 2, multiplier: 1.5 },
  { count: 3, multiplier: 2 },
  { count: 7, multiplier: 2.5 },
  { count: 11, multiplier: 3 },
  { count: 15, multiplier: 4 },
];

export function EncounterEditor({ encounter, onSave, maps, monsters }: EncounterEditorProps) {
  const [data, setData] = useState<Encounter>(encounter);
  const [partyLevel, setPartyLevel] = useState(3);
  const [partySize, setPartySize] = useState(4);
  const [showMonsterPicker, setShowMonsterPicker] = useState(false);
  
  // Calculate encounter difficulty
  const difficultyInfo = useMemo(() => {
    // Get total XP
    const totalXP = data.monsters.reduce((sum, pm) => {
      const monster = monsters.find(m => m.id === pm.monsterId);
      return sum + (monster?.xp || 0);
    }, 0);
    
    // Apply multiplier based on monster count
    const monsterCount = data.monsters.length;
    const multiplierEntry = [...MULTIPLIERS].reverse().find(m => monsterCount >= m.count);
    const multiplier = multiplierEntry?.multiplier || 1;
    
    // Adjust for party size
    let sizeAdjustment = 0;
    if (partySize < 3) sizeAdjustment = 1;
    else if (partySize > 5) sizeAdjustment = -1;
    
    const adjustedMultiplier = Math.max(0.5, multiplier + sizeAdjustment * 0.5);
    const adjustedXP = Math.floor(totalXP * adjustedMultiplier);
    
    // Get thresholds for party level
    const thresholds = XP_THRESHOLDS[partyLevel] || XP_THRESHOLDS[1];
    const partyThresholds = {
      trivial: thresholds.trivial * partySize,
      easy: thresholds.easy * partySize,
      medium: thresholds.medium * partySize,
      hard: thresholds.hard * partySize,
      deadly: thresholds.deadly * partySize,
    };
    
    // Determine difficulty
    let difficulty: EncounterDifficulty = 'trivial';
    if (adjustedXP >= partyThresholds.deadly) difficulty = 'deadly';
    else if (adjustedXP >= partyThresholds.hard) difficulty = 'hard';
    else if (adjustedXP >= partyThresholds.medium) difficulty = 'medium';
    else if (adjustedXP >= partyThresholds.easy) difficulty = 'easy';
    
    return {
      totalXP,
      adjustedXP,
      multiplier: adjustedMultiplier,
      difficulty,
      thresholds: partyThresholds,
    };
  }, [data.monsters, monsters, partyLevel, partySize]);
  
  const addMonster = (monsterId: string, position?: { x: number; y: number }) => {
    const newMonster: PlacedMonster = {
      id: `monster_${Date.now()}`,
      monsterId,
      position: position || { x: 5, y: 5 },
      behavior: {
        type: 'aggressive',
        targetPriority: 'nearest',
        aggression: 0.7,
        morale: 0.3,
        cooperation: 0.5,
      },
      isMinion: false,
    };
    
    setData(prev => ({
      ...prev,
      monsters: [...prev.monsters, newMonster],
    }));
  };
  
  const removeMonster = (id: string) => {
    setData(prev => ({
      ...prev,
      monsters: prev.monsters.filter(m => m.id !== id),
    }));
  };
  
  const updateMonster = (id: string, updates: Partial<PlacedMonster>) => {
    setData(prev => ({
      ...prev,
      monsters: prev.monsters.map(m =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  };
  
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Panel - Monster List */}
      <div className="w-80 border-r border-gray-700 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-bold text-white mb-4">{data.name}</h2>
          
          {/* Difficulty Calculator */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Party Settings</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500">Level</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={partyLevel}
                  onChange={(e) => setPartyLevel(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 rounded text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Size</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 rounded text-white"
                />
              </div>
            </div>
            
            {/* Difficulty Display */}
            <div className={`p-3 rounded-lg text-center ${
              difficultyInfo.difficulty === 'deadly' ? 'bg-red-900' :
              difficultyInfo.difficulty === 'hard' ? 'bg-orange-900' :
              difficultyInfo.difficulty === 'medium' ? 'bg-yellow-900' :
              difficultyInfo.difficulty === 'easy' ? 'bg-green-900' :
              'bg-gray-700'
            }`}>
              <div className="text-2xl font-bold text-white capitalize">
                {difficultyInfo.difficulty}
              </div>
              <div className="text-sm text-gray-300">
                {difficultyInfo.adjustedXP} XP (adjusted)
              </div>
              <div className="text-xs text-gray-400">
                {difficultyInfo.totalXP} base × {difficultyInfo.multiplier.toFixed(1)}
              </div>
            </div>
          </div>
          
          {/* Monster List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-400">Monsters</h3>
              <button
                onClick={() => setShowMonsterPicker(true)}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                + Add
              </button>
            </div>
            
            {data.monsters.map(pm => {
              const monster = monsters.find(m => m.id === pm.monsterId);
              return (
                <div
                  key={pm.id}
                  className="bg-gray-800 rounded-lg p-3 flex items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {pm.name || monster?.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      CR {monster?.cr} • {monster?.xp} XP
                    </div>
                  </div>
                  <button
                    onClick={() => removeMonster(pm.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            
            {data.monsters.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No monsters added yet
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Center - Map Preview */}
      <div className="flex-1">
        <MapPreview
          mapId={data.mapId}
          monsters={data.monsters}
          onMonsterDrag={(id, pos) => updateMonster(id, { position: pos })}
          onMapClick={(pos) => {
            // If monster picker is open, place at clicked position
          }}
        />
      </div>
      
      {/* Right Panel - Triggers & Objectives */}
      <div className="w-80 border-l border-gray-700 overflow-y-auto">
        <TriggerEditor
          triggers={data.triggers}
          objectives={data.objectives}
          onChange={(triggers, objectives) => setData(prev => ({
            ...prev,
            triggers,
            objectives,
          }))}
        />
      </div>
      
      {/* Monster Picker Modal */}
      {showMonsterPicker && (
        <MonsterPicker
          monsters={monsters}
          onSelect={(id) => {
            addMonster(id);
            setShowMonsterPicker(false);
          }}
          onClose={() => setShowMonsterPicker(false)}
        />
      )}
      
      {/* Save Button */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => onSave({ ...data, difficulty: difficultyInfo.difficulty })}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 shadow-lg"
        >
          Save Encounter
        </button>
      </div>
    </div>
  );
}
```

---

# 4. Dialogue Editor

## 4.1 Dialogue Types

```typescript
// packages/shared/src/types/dialogue.ts

export interface DialogueTree {
  id: string;
  name: string;
  description: string;
  startNodeId: string;
  nodes: DialogueNode[];
  variables: DialogueVariable[];
  metadata: DialogueMetadata;
}

export interface DialogueNode {
  id: string;
  type: DialogueNodeType;
  position: { x: number; y: number };  // For editor layout
  data: DialogueNodeData;
}

export type DialogueNodeType = 
  | 'dialogue'      // NPC speaks
  | 'player_choice' // Player picks response
  | 'condition'     // Branch based on condition
  | 'action'        // Trigger game action
  | 'roll'          // Skill check
  | 'set_variable'  // Set dialogue variable
  | 'end';          // End dialogue

export type DialogueNodeData = 
  | DialogueTextData
  | PlayerChoiceData
  | ConditionData
  | ActionData
  | RollData
  | SetVariableData
  | EndData;

export interface DialogueTextData {
  speaker: string;
  speakerId?: string;  // NPC ID for portrait
  text: string;
  emotion?: 'neutral' | 'happy' | 'angry' | 'sad' | 'afraid' | 'surprised';
  voiceLine?: string;
  duration?: number;  // Auto-advance after duration
  nextNodeId: string;
}

export interface PlayerChoiceData {
  prompt?: string;
  choices: DialogueChoice[];
}

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string;
  condition?: ChoiceCondition;  // Only show if condition met
  skillCheck?: SkillCheck;  // Requires skill check
  consequence?: ChoiceConsequence;
}

export interface ChoiceCondition {
  type: 'variable' | 'stat' | 'item' | 'quest' | 'reputation';
  variable?: string;
  operator?: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value?: any;
  stat?: string;
  itemId?: string;
  questId?: string;
  questState?: string;
}

export interface SkillCheck {
  skill: string;  // 'persuasion', 'intimidation', 'deception', etc.
  dc: number;
  advantage?: boolean;
  disadvantage?: boolean;
  successNodeId: string;
  failureNodeId: string;
}

export interface ChoiceConsequence {
  type: 'reputation' | 'quest' | 'variable' | 'item' | 'gold';
  target?: string;
  change?: number;
  value?: any;
}

export interface ConditionData {
  conditions: BranchCondition[];
  defaultNodeId: string;
}

export interface BranchCondition {
  condition: ChoiceCondition;
  nextNodeId: string;
}

export interface ActionData {
  actionType: DialogueActionType;
  parameters: Record<string, any>;
  nextNodeId: string;
}

export type DialogueActionType = 
  | 'start_combat'
  | 'give_item'
  | 'take_item'
  | 'give_gold'
  | 'take_gold'
  | 'give_xp'
  | 'start_quest'
  | 'update_quest'
  | 'complete_quest'
  | 'change_reputation'
  | 'play_cutscene'
  | 'teleport'
  | 'spawn_npc'
  | 'remove_npc';

export interface RollData {
  skill: string;
  dc: number;
  successNodeId: string;
  failureNodeId: string;
  criticalSuccessNodeId?: string;
  criticalFailureNodeId?: string;
}

export interface SetVariableData {
  variable: string;
  operation: 'set' | 'add' | 'subtract' | 'toggle';
  value: any;
  nextNodeId: string;
}

export interface EndData {
  endType: 'normal' | 'combat' | 'shop' | 'rest';
  parameters?: Record<string, any>;
}

export interface DialogueVariable {
  name: string;
  type: 'number' | 'boolean' | 'string';
  defaultValue: any;
  persistent: boolean;  // Saved across sessions
}

export interface DialogueMetadata {
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  npcs: string[];  // NPC IDs involved
}
```

## 4.2 Dialogue Editor Component

```tsx
// apps/web/src/components/dm/DialogueEditor/DialogueEditor.tsx

import { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DialogueTree, DialogueNode, DialogueNodeType } from '@dnd/shared';
import { DialogueNodeEditor } from './DialogueNodeEditor';
import { NodePalette } from './NodePalette';

// Custom node components
import { DialogueTextNode } from './nodes/DialogueTextNode';
import { PlayerChoiceNode } from './nodes/PlayerChoiceNode';
import { ConditionNode } from './nodes/ConditionNode';
import { ActionNode } from './nodes/ActionNode';
import { RollNode } from './nodes/RollNode';

const nodeTypes: NodeTypes = {
  dialogue: DialogueTextNode,
  player_choice: PlayerChoiceNode,
  condition: ConditionNode,
  action: ActionNode,
  roll: RollNode,
  set_variable: ActionNode,
  end: ActionNode,
};

interface DialogueEditorProps {
  dialogue: DialogueTree;
  onSave: (dialogue: DialogueTree) => void;
  npcs: { id: string; name: string; portrait: string }[];
}

export function DialogueEditor({ dialogue, onSave, npcs }: DialogueEditorProps) {
  // Convert dialogue nodes to ReactFlow format
  const initialNodes: Node[] = dialogue.nodes.map(node => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
  }));
  
  // Generate edges from node connections
  const initialEdges: Edge[] = generateEdges(dialogue.nodes);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);
  
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);
  
  const addNode = useCallback((type: DialogueNodeType) => {
    const position = reactFlowInstance?.project({
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2 - 50,
    }) || { x: 250, y: 250 };
    
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type,
      position,
      data: getDefaultNodeData(type),
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, [reactFlowInstance, setNodes]);
  
  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data } : node
      )
    );
  }, [setNodes]);
  
  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
    setSelectedNode(null);
  }, [setNodes, setEdges]);
  
  const handleSave = () => {
    // Convert back to DialogueTree format
    const updatedNodes: DialogueNode[] = nodes.map(node => ({
      id: node.id,
      type: node.type as DialogueNodeType,
      position: node.position,
      data: node.data,
    }));
    
    // Update nextNodeId references from edges
    edges.forEach(edge => {
      const sourceNode = updatedNodes.find(n => n.id === edge.source);
      if (sourceNode) {
        updateNodeConnection(sourceNode, edge.sourceHandle, edge.target);
      }
    });
    
    onSave({
      ...dialogue,
      nodes: updatedNodes,
    });
  };
  
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Node Palette */}
      <div className="w-64 border-r border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Nodes</h3>
        <NodePalette onAddNode={addNode} />
        
        {/* Variables */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Variables</h4>
          {dialogue.variables.map(v => (
            <div key={v.name} className="text-sm text-gray-300 py-1">
              {v.name}: {v.type}
            </div>
          ))}
          <button className="text-purple-400 text-sm mt-2 hover:text-purple-300">
            + Add Variable
          </button>
        </div>
      </div>
      
      {/* Flow Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background />
          <MiniMap />
        </ReactFlow>
      </div>
      
      {/* Node Properties */}
      {selectedNode && (
        <div className="w-80 border-l border-gray-700 p-4 overflow-y-auto">
          <DialogueNodeEditor
            node={selectedNode}
            npcs={npcs}
            onChange={(data) => updateNodeData(selectedNode.id, data)}
            onDelete={() => deleteNode(selectedNode.id)}
          />
        </div>
      )}
      
      {/* Save Button */}
      <button
        onClick={handleSave}
        className="fixed bottom-4 right-4 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 shadow-lg"
      >
        Save Dialogue
      </button>
    </div>
  );
}

function getDefaultNodeData(type: DialogueNodeType): any {
  switch (type) {
    case 'dialogue':
      return {
        speaker: 'NPC',
        text: 'Enter dialogue text...',
        emotion: 'neutral',
        nextNodeId: '',
      };
    case 'player_choice':
      return {
        prompt: '',
        choices: [
          { id: 'choice_1', text: 'Option 1', nextNodeId: '' },
          { id: 'choice_2', text: 'Option 2', nextNodeId: '' },
        ],
      };
    case 'condition':
      return {
        conditions: [],
        defaultNodeId: '',
      };
    case 'action':
      return {
        actionType: 'give_item',
        parameters: {},
        nextNodeId: '',
      };
    case 'roll':
      return {
        skill: 'persuasion',
        dc: 15,
        successNodeId: '',
        failureNodeId: '',
      };
    case 'set_variable':
      return {
        variable: '',
        operation: 'set',
        value: 0,
        nextNodeId: '',
      };
    case 'end':
      return {
        endType: 'normal',
      };
    default:
      return {};
  }
}

function generateEdges(nodes: DialogueNode[]): Edge[] {
  const edges: Edge[] = [];
  
  nodes.forEach(node => {
    const data = node.data as any;
    
    if (data.nextNodeId) {
      edges.push({
        id: `${node.id}-${data.nextNodeId}`,
        source: node.id,
        target: data.nextNodeId,
      });
    }
    
    if (data.choices) {
      data.choices.forEach((choice: any) => {
        if (choice.nextNodeId) {
          edges.push({
            id: `${node.id}-${choice.id}-${choice.nextNodeId}`,
            source: node.id,
            sourceHandle: choice.id,
            target: choice.nextNodeId,
          });
        }
      });
    }
    
    if (data.successNodeId) {
      edges.push({
        id: `${node.id}-success-${data.successNodeId}`,
        source: node.id,
        sourceHandle: 'success',
        target: data.successNodeId,
        label: 'Success',
      });
    }
    
    if (data.failureNodeId) {
      edges.push({
        id: `${node.id}-failure-${data.failureNodeId}`,
        source: node.id,
        sourceHandle: 'failure',
        target: data.failureNodeId,
        label: 'Failure',
      });
    }
  });
  
  return edges;
}

function updateNodeConnection(node: DialogueNode, handle: string | null, targetId: string) {
  const data = node.data as any;
  
  if (!handle) {
    data.nextNodeId = targetId;
  } else if (handle === 'success') {
    data.successNodeId = targetId;
  } else if (handle === 'failure') {
    data.failureNodeId = targetId;
  } else if (data.choices) {
    const choice = data.choices.find((c: any) => c.id === handle);
    if (choice) {
      choice.nextNodeId = targetId;
    }
  }
}
```

---

# 5. Cutscene Editor

## 5.1 Cutscene Types

```typescript
// packages/shared/src/types/cutscene.ts

export interface Cutscene {
  id: string;
  name: string;
  description: string;
  duration: number;  // Total duration in seconds
  timeline: CutsceneTrack[];
  metadata: CutsceneMetadata;
}

export interface CutsceneTrack {
  id: string;
  name: string;
  type: TrackType;
  clips: CutsceneClip[];
}

export type TrackType = 
  | 'camera'
  | 'dialogue'
  | 'animation'
  | 'vfx'
  | 'audio'
  | 'text'
  | 'image';

export interface CutsceneClip {
  id: string;
  trackId: string;
  startTime: number;
  duration: number;
  data: ClipData;
  transitions?: {
    in?: Transition;
    out?: Transition;
  };
}

export type ClipData = 
  | CameraClipData
  | DialogueClipData
  | AnimationClipData
  | VfxClipData
  | AudioClipData
  | TextClipData
  | ImageClipData;

export interface CameraClipData {
  type: 'camera';
  start: CameraState;
  end: CameraState;
  easing: EasingType;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
}

export interface DialogueClipData {
  type: 'dialogue';
  speaker: string;
  speakerId?: string;
  text: string;
  emotion: string;
  voiceLine?: string;
  position: 'bottom' | 'top' | 'left' | 'right';
}

export interface AnimationClipData {
  type: 'animation';
  targetId: string;  // Token/character ID
  animation: string;  // 'walk', 'attack', 'cast', 'die', etc.
  path?: { x: number; y: number }[];  // For movement
}

export interface VfxClipData {
  type: 'vfx';
  effect: string;  // 'fire', 'lightning', 'smoke', etc.
  position: { x: number; y: number };
  scale: number;
  color?: string;
}

export interface AudioClipData {
  type: 'audio';
  url: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
}

export interface TextClipData {
  type: 'text';
  text: string;
  font: string;
  size: number;
  color: string;
  position: { x: number; y: number };
  alignment: 'left' | 'center' | 'right';
}

export interface ImageClipData {
  type: 'image';
  url: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  opacity: number;
}

export interface Transition {
  type: 'fade' | 'slide' | 'zoom' | 'none';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export type EasingType = 
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'bounce'
  | 'elastic';

export interface CutsceneMetadata {
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  thumbnail?: string;
}
```

## 5.2 Cutscene Player Component

```typescript
// apps/web/src/components/game/CutscenePlayer.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { Cutscene, CutsceneClip, CameraState } from '@dnd/shared';
import { DialogueBox } from './DialogueBox';

interface CutscenePlayerProps {
  cutscene: Cutscene;
  onComplete: () => void;
  onSkip?: () => void;
}

export function CutscenePlayer({ cutscene, onComplete, onSkip }: CutscenePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeClips, setActiveClips] = useState<CutsceneClip[]>([]);
  const [currentDialogue, setCurrentDialogue] = useState<any>(null);
  
  // Initialize PIXI
  useEffect(() => {
    if (!containerRef.current) return;
    
    const app = new PIXI.Application({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: 0x000000,
    });
    
    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;
    
    return () => {
      app.destroy(true);
      appRef.current = null;
    };
  }, []);
  
  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;
    
    let lastTime = performance.now();
    let animationFrame: number;
    
    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      
      setCurrentTime(prev => {
        const newTime = prev + delta;
        
        if (newTime >= cutscene.duration) {
          setIsPlaying(false);
          onComplete();
          return cutscene.duration;
        }
        
        return newTime;
      });
      
      animationFrame = requestAnimationFrame(tick);
    };
    
    animationFrame = requestAnimationFrame(tick);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isPlaying, cutscene.duration, onComplete]);
  
  // Update active clips based on current time
  useEffect(() => {
    const clips: CutsceneClip[] = [];
    
    cutscene.timeline.forEach(track => {
      track.clips.forEach(clip => {
        if (currentTime >= clip.startTime && 
            currentTime < clip.startTime + clip.duration) {
          clips.push(clip);
        }
      });
    });
    
    setActiveClips(clips);
    
    // Process clips
    clips.forEach(clip => {
      processClip(clip, currentTime - clip.startTime, clip.duration);
    });
  }, [currentTime, cutscene.timeline]);
  
  const processClip = (clip: CutsceneClip, localTime: number, duration: number) => {
    const progress = localTime / duration;
    const data = clip.data as any;
    
    switch (data.type) {
      case 'camera':
        updateCamera(data, progress);
        break;
      case 'dialogue':
        setCurrentDialogue({
          ...data,
          progress,
        });
        break;
      case 'animation':
        playAnimation(data, progress);
        break;
      case 'vfx':
        playVfx(data, progress);
        break;
      case 'audio':
        // Audio handled separately
        break;
      case 'text':
        renderText(data, progress);
        break;
      case 'image':
        renderImage(data, progress);
        break;
    }
  };
  
  const updateCamera = (data: any, progress: number) => {
    if (!appRef.current) return;
    
    const start = data.start as CameraState;
    const end = data.end as CameraState;
    const eased = applyEasing(progress, data.easing);
    
    const container = appRef.current.stage;
    container.x = lerp(start.x, end.x, eased);
    container.y = lerp(start.y, end.y, eased);
    container.scale.set(lerp(start.zoom, end.zoom, eased));
    container.rotation = lerp(start.rotation, end.rotation, eased);
  };
  
  const playAnimation = (data: any, progress: number) => {
    // Animate token/character
  };
  
  const playVfx = (data: any, progress: number) => {
    // Play VFX effect
  };
  
  const renderText = (data: any, progress: number) => {
    // Render text overlay
  };
  
  const renderImage = (data: any, progress: number) => {
    // Render image overlay
  };
  
  const handleSkip = () => {
    setIsPlaying(false);
    onSkip?.() || onComplete();
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* PIXI Canvas */}
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Dialogue Box */}
      {currentDialogue && (
        <DialogueBox
          speaker={currentDialogue.speaker}
          text={currentDialogue.text}
          emotion={currentDialogue.emotion}
          position={currentDialogue.position}
        />
      )}
      
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute bottom-4 right-4 px-4 py-2 bg-gray-800/80 text-white rounded hover:bg-gray-700"
      >
        Skip
      </button>
      
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
        <div
          className="h-full bg-purple-500"
          style={{ width: `${(currentTime / cutscene.duration) * 100}%` }}
        />
      </div>
    </div>
  );
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function applyEasing(t: number, type: string): number {
  switch (type) {
    case 'easeIn':
      return t * t;
    case 'easeOut':
      return t * (2 - t);
    case 'easeInOut':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case 'bounce':
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    case 'elastic':
      return t === 0 || t === 1
        ? t
        : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
    default:
      return t;
  }
}
```

---

# 6. Publishing Workflow

## 6.1 Campaign Publishing API

```typescript
// services/api-gateway/src/routes/campaigns.ts

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireDM } from '../middleware/auth';
import { CampaignService } from '../services/campaignService';

const router = Router();
const campaignService = new CampaignService();

// Publish campaign
router.post('/:id/publish', requireAuth, requireDM, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    // Validate campaign is complete
    const campaign = await campaignService.getCampaign(id);
    
    if (campaign.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const validation = await campaignService.validateCampaign(id);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Campaign validation failed',
        issues: validation.issues,
      });
    }
    
    // Create published version
    const published = await campaignService.publishCampaign(id, {
      visibility: req.body.visibility || 'public',
      price: req.body.price || 0,
      description: req.body.description,
      tags: req.body.tags,
    });
    
    res.json(published);
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish campaign' });
  }
});

// Get validation status
router.get('/:id/validate', requireAuth, async (req, res) => {
  try {
    const validation = await campaignService.validateCampaign(req.params.id);
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: 'Validation failed' });
  }
});
```

## 6.2 Campaign Validation Service

```typescript
// services/api-gateway/src/services/campaignService.ts

import { prisma } from '../lib/prisma';

interface ValidationResult {
  valid: boolean;
  score: number;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
}

interface ValidationIssue {
  type: 'error' | 'warning';
  category: string;
  message: string;
  location?: string;
}

export class CampaignService {
  async validateCampaign(campaignId: string): Promise<ValidationResult> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        maps: true,
        encounters: true,
        dialogues: true,
        cutscenes: true,
        chapters: true,
      },
    });
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    const issues: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    
    // Required fields
    if (!campaign.name || campaign.name.length < 3) {
      issues.push({
        type: 'error',
        category: 'metadata',
        message: 'Campaign must have a name (at least 3 characters)',
      });
    }
    
    if (!campaign.description || campaign.description.length < 50) {
      warnings.push({
        type: 'warning',
        category: 'metadata',
        message: 'Campaign description is short. Consider adding more detail.',
      });
    }
    
    // Must have at least one map
    if (campaign.maps.length === 0) {
      issues.push({
        type: 'error',
        category: 'content',
        message: 'Campaign must have at least one map',
      });
    }
    
    // Must have at least one encounter
    if (campaign.encounters.length === 0) {
      warnings.push({
        type: 'warning',
        category: 'content',
        message: 'Campaign has no encounters. Consider adding combat.',
      });
    }
    
    // Validate each map
    for (const map of campaign.maps) {
      if (map.width < 10 || map.height < 10) {
        warnings.push({
          type: 'warning',
          category: 'maps',
          message: `Map "${map.name}" is very small (${map.width}x${map.height})`,
          location: map.id,
        });
      }
      
      // Check for spawn point
      const hasSpawn = map.layers.some((layer: any) =>
        layer.tiles.some((tile: any) => tile.properties?.isSpawnPoint)
      );
      
      if (!hasSpawn) {
        warnings.push({
          type: 'warning',
          category: 'maps',
          message: `Map "${map.name}" has no spawn point marked`,
          location: map.id,
        });
      }
    }
    
    // Validate encounters
    for (const encounter of campaign.encounters) {
      if (encounter.monsters.length === 0) {
        warnings.push({
          type: 'warning',
          category: 'encounters',
          message: `Encounter "${encounter.name}" has no monsters`,
          location: encounter.id,
        });
      }
      
      // Check CR balance
      const totalCR = encounter.monsters.reduce((sum: number, m: any) => {
        return sum + (m.monster?.cr || 0);
      }, 0);
      
      if (totalCR > campaign.recommendedLevel.max * 4) {
        warnings.push({
          type: 'warning',
          category: 'balance',
          message: `Encounter "${encounter.name}" may be too difficult for recommended level`,
          location: encounter.id,
        });
      }
    }
    
    // Validate dialogues
    for (const dialogue of campaign.dialogues) {
      const orphanedNodes = this.findOrphanedNodes(dialogue.nodes);
      if (orphanedNodes.length > 0) {
        warnings.push({
          type: 'warning',
          category: 'dialogues',
          message: `Dialogue "${dialogue.name}" has ${orphanedNodes.length} unreachable node(s)`,
          location: dialogue.id,
        });
      }
      
      const deadEnds = this.findDeadEnds(dialogue.nodes);
      if (deadEnds.length > 0) {
        warnings.push({
          type: 'warning',
          category: 'dialogues',
          message: `Dialogue "${dialogue.name}" has ${deadEnds.length} dead end(s)`,
          location: dialogue.id,
        });
      }
    }
    
    // Calculate score
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = warnings.length;
    const score = Math.max(0, 100 - (errorCount * 20) - (warningCount * 5));
    
    return {
      valid: errorCount === 0,
      score,
      issues,
      warnings,
    };
  }
  
  async publishCampaign(campaignId: string, options: {
    visibility: 'public' | 'private' | 'unlisted';
    price: number;
    description?: string;
    tags?: string[];
  }) {
    // Create version snapshot
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { maps: true, encounters: true, dialogues: true, cutscenes: true },
    });
    
    // Generate thumbnail
    const thumbnailUrl = await this.generateThumbnail(campaign!);
    
    // Create published version
    const published = await prisma.publishedCampaign.create({
      data: {
        campaignId,
        version: await this.getNextVersion(campaignId),
        name: campaign!.name,
        description: options.description || campaign!.description,
        visibility: options.visibility,
        price: options.price,
        tags: options.tags || [],
        thumbnailUrl,
        content: JSON.stringify(campaign),
        publishedAt: new Date(),
      },
    });
    
    return published;
  }
  
  private findOrphanedNodes(nodes: any[]): string[] {
    const reachable = new Set<string>();
    const startNode = nodes.find(n => n.isStart);
    
    if (!startNode) return nodes.map(n => n.id);
    
    const queue = [startNode.id];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (reachable.has(nodeId)) continue;
      reachable.add(nodeId);
      
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;
      
      // Add connected nodes
      const connections = this.getNodeConnections(node);
      connections.forEach(id => queue.push(id));
    }
    
    return nodes.filter(n => !reachable.has(n.id)).map(n => n.id);
  }
  
  private findDeadEnds(nodes: any[]): string[] {
    return nodes.filter(node => {
      if (node.type === 'end') return false;
      const connections = this.getNodeConnections(node);
      return connections.length === 0;
    }).map(n => n.id);
  }
  
  private getNodeConnections(node: any): string[] {
    const connections: string[] = [];
    
    if (node.data.nextNodeId) {
      connections.push(node.data.nextNodeId);
    }
    
    if (node.data.choices) {
      node.data.choices.forEach((c: any) => {
        if (c.nextNodeId) connections.push(c.nextNodeId);
      });
    }
    
    if (node.data.successNodeId) connections.push(node.data.successNodeId);
    if (node.data.failureNodeId) connections.push(node.data.failureNodeId);
    
    return connections;
  }
  
  private async generateThumbnail(campaign: any): Promise<string> {
    // Generate thumbnail from first map
    // Implementation depends on rendering setup
    return `/thumbnails/${campaign.id}.png`;
  }
  
  private async getNextVersion(campaignId: string): Promise<string> {
    const latest = await prisma.publishedCampaign.findFirst({
      where: { campaignId },
      orderBy: { publishedAt: 'desc' },
    });
    
    if (!latest) return '1.0.0';
    
    const parts = latest.version.split('.').map(Number);
    parts[2] += 1;
    return parts.join('.');
  }
}
```

---

# END OF DOCUMENT 26
