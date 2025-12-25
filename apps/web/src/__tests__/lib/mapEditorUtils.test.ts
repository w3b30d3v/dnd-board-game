/**
 * Map Editor Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  EDITOR_TO_GAME_TERRAIN,
  GAME_TO_EDITOR_TERRAIN,
  TERRAIN_PREVIEW_COLORS,
  LIGHT_COLOR_PRESETS,
  convertLayersToTileData,
  hexToNumber,
  numberToHex,
  generateLightId,
  createDefaultLight,
  calculateLightInfluence,
  cloneLayers,
  cloneLighting,
  areLayersEqual,
  TERRAIN_INFO,
  getTerrainByShortcut,
} from '@/lib/mapEditorUtils';
import type { MapLayer, MapLighting, LightSource } from '@dnd/shared';

describe('mapEditorUtils', () => {
  describe('Terrain Type Mappings', () => {
    it('should map all editor terrain types to game types', () => {
      expect(EDITOR_TO_GAME_TERRAIN.grass).toBe('NORMAL');
      expect(EDITOR_TO_GAME_TERRAIN.stone).toBe('NORMAL');
      expect(EDITOR_TO_GAME_TERRAIN.water).toBe('WATER');
      expect(EDITOR_TO_GAME_TERRAIN.lava).toBe('LAVA');
      expect(EDITOR_TO_GAME_TERRAIN.ice).toBe('NORMAL');
      expect(EDITOR_TO_GAME_TERRAIN.sand).toBe('DIFFICULT');
      expect(EDITOR_TO_GAME_TERRAIN.wood).toBe('NORMAL');
      expect(EDITOR_TO_GAME_TERRAIN.void).toBe('PIT');
      expect(EDITOR_TO_GAME_TERRAIN.difficult).toBe('DIFFICULT');
    });

    it('should have reverse mappings for game terrain types', () => {
      expect(GAME_TO_EDITOR_TERRAIN.NORMAL).toBe('stone');
      expect(GAME_TO_EDITOR_TERRAIN.WATER).toBe('water');
      expect(GAME_TO_EDITOR_TERRAIN.LAVA).toBe('lava');
      expect(GAME_TO_EDITOR_TERRAIN.PIT).toBe('void');
      expect(GAME_TO_EDITOR_TERRAIN.DIFFICULT).toBe('difficult');
    });

    it('should have preview colors for all terrain types', () => {
      expect(TERRAIN_PREVIEW_COLORS.grass).toBe(0x4ade80);
      expect(TERRAIN_PREVIEW_COLORS.stone).toBe(0x9ca3af);
      expect(TERRAIN_PREVIEW_COLORS.water).toBe(0x1a4a6e);
      expect(TERRAIN_PREVIEW_COLORS.lava).toBe(0x8b2500);
      expect(TERRAIN_PREVIEW_COLORS.ice).toBe(0x93c5fd);
      expect(TERRAIN_PREVIEW_COLORS.sand).toBe(0xfcd34d);
      expect(TERRAIN_PREVIEW_COLORS.wood).toBe(0x6b4423);
      expect(TERRAIN_PREVIEW_COLORS.void).toBe(0x0a0a0a);
      expect(TERRAIN_PREVIEW_COLORS.difficult).toBe(0x5a4a32);
    });
  });

  describe('Light Color Presets', () => {
    it('should have 8 color presets', () => {
      expect(LIGHT_COLOR_PRESETS).toHaveLength(8);
    });

    it('should have valid hex colors', () => {
      for (const preset of LIGHT_COLOR_PRESETS) {
        expect(preset.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(preset.name).toBeTruthy();
      }
    });

    it('should include common light types', () => {
      const names = LIGHT_COLOR_PRESETS.map((p) => p.name);
      expect(names).toContain('Torch');
      expect(names).toContain('Candle');
      expect(names).toContain('Moonlight');
    });
  });

  describe('convertLayersToTileData', () => {
    it('should convert empty layers to default terrain', () => {
      const layers: MapLayer[] = [];
      const tiles = convertLayersToTileData(layers, 2, 2);

      expect(tiles).toHaveLength(4);
      tiles.forEach((tile) => {
        expect(tile.terrain).toBe('NORMAL');
        expect(tile.isExplored).toBe(true);
        expect(tile.isVisible).toBe(true);
        expect(tile.lightLevel).toBe(1);
      });
    });

    it('should convert layer tiles to game terrain types', () => {
      const layers: MapLayer[] = [
        {
          id: 'layer1',
          name: 'Base',
          visible: true,
          opacity: 1,
          tiles: [
            { x: 0, y: 0, terrain: 'water', elevation: 0 },
            { x: 1, y: 0, terrain: 'lava', elevation: 0 },
          ],
        },
      ];
      const tiles = convertLayersToTileData(layers, 2, 2);

      expect(tiles).toHaveLength(4);
      expect(tiles[0].terrain).toBe('WATER');
      expect(tiles[0].x).toBe(0);
      expect(tiles[0].y).toBe(0);
      expect(tiles[1].terrain).toBe('LAVA');
      expect(tiles[1].x).toBe(1);
      expect(tiles[1].y).toBe(0);
    });

    it('should skip hidden layers', () => {
      const layers: MapLayer[] = [
        {
          id: 'layer1',
          name: 'Base',
          visible: false,
          opacity: 1,
          tiles: [{ x: 0, y: 0, terrain: 'water', elevation: 0 }],
        },
      ];
      const tiles = convertLayersToTileData(layers, 2, 2);

      expect(tiles[0].terrain).toBe('NORMAL'); // Default, not water
    });

    it('should allow later layers to override earlier layers', () => {
      const layers: MapLayer[] = [
        {
          id: 'layer1',
          name: 'Base',
          visible: true,
          opacity: 1,
          tiles: [{ x: 0, y: 0, terrain: 'water', elevation: 0 }],
        },
        {
          id: 'layer2',
          name: 'Overlay',
          visible: true,
          opacity: 1,
          tiles: [{ x: 0, y: 0, terrain: 'lava', elevation: 0 }],
        },
      ];
      const tiles = convertLayersToTileData(layers, 2, 2);

      expect(tiles[0].terrain).toBe('LAVA'); // Overridden by layer2
    });

    it('should preserve elevation from editor tiles', () => {
      const layers: MapLayer[] = [
        {
          id: 'layer1',
          name: 'Base',
          visible: true,
          opacity: 1,
          tiles: [{ x: 0, y: 0, terrain: 'stone', elevation: 5 }],
        },
      ];
      const tiles = convertLayersToTileData(layers, 2, 2);

      expect(tiles[0].elevation).toBe(5);
    });
  });

  describe('hexToNumber', () => {
    it('should convert hex color string to number', () => {
      expect(hexToNumber('#ff0000')).toBe(0xff0000);
      expect(hexToNumber('#00ff00')).toBe(0x00ff00);
      expect(hexToNumber('#0000ff')).toBe(0x0000ff);
      expect(hexToNumber('#ffffff')).toBe(0xffffff);
      expect(hexToNumber('#000000')).toBe(0x000000);
    });

    it('should handle uppercase hex', () => {
      expect(hexToNumber('#FF0000')).toBe(0xff0000);
      expect(hexToNumber('#ABCDEF')).toBe(0xabcdef);
    });
  });

  describe('numberToHex', () => {
    it('should convert number to hex color string', () => {
      expect(numberToHex(0xff0000)).toBe('#ff0000');
      expect(numberToHex(0x00ff00)).toBe('#00ff00');
      expect(numberToHex(0x0000ff)).toBe('#0000ff');
      expect(numberToHex(0xffffff)).toBe('#ffffff');
    });

    it('should pad with zeros', () => {
      expect(numberToHex(0)).toBe('#000000');
      expect(numberToHex(0x0000ff)).toBe('#0000ff');
    });
  });

  describe('generateLightId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateLightId();
      const id2 = generateLightId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^light_\d+_[a-z0-9]+$/);
    });

    it('should start with "light_"', () => {
      const id = generateLightId();
      expect(id.startsWith('light_')).toBe(true);
    });
  });

  describe('createDefaultLight', () => {
    it('should create light at specified position', () => {
      const light = createDefaultLight(5, 10);

      expect(light.x).toBe(5);
      expect(light.y).toBe(10);
    });

    it('should have default properties', () => {
      const light = createDefaultLight(0, 0);

      expect(light.radius).toBe(5);
      expect(light.color).toBe('#ff9933');
      expect(light.intensity).toBe(0.8);
      expect(light.flicker).toBe(true);
      expect(light.id).toMatch(/^light_/);
    });
  });

  describe('calculateLightInfluence', () => {
    const light: LightSource = {
      id: 'test',
      x: 5,
      y: 5,
      radius: 5,
      color: '#ffffff',
      intensity: 1,
    };

    it('should return full intensity at light position', () => {
      const influence = calculateLightInfluence(5, 5, light);
      expect(influence).toBe(1);
    });

    it('should return 0 outside light radius', () => {
      const influence = calculateLightInfluence(15, 15, light);
      expect(influence).toBe(0);
    });

    it('should return partial intensity within radius', () => {
      const influence = calculateLightInfluence(7, 5, light);
      expect(influence).toBeGreaterThan(0);
      expect(influence).toBeLessThan(1);
    });

    it('should scale with light intensity', () => {
      const dimLight: LightSource = { ...light, intensity: 0.5 };
      const influence = calculateLightInfluence(5, 5, dimLight);
      expect(influence).toBe(0.5);
    });

    it('should return 0 at exactly the radius distance', () => {
      const influence = calculateLightInfluence(10, 5, light);
      expect(influence).toBe(0);
    });
  });

  describe('cloneLayers', () => {
    it('should create a deep copy of layers', () => {
      const original: MapLayer[] = [
        {
          id: 'layer1',
          name: 'Base',
          visible: true,
          opacity: 1,
          tiles: [{ x: 0, y: 0, terrain: 'water', elevation: 0 }],
        },
      ];

      const cloned = cloneLayers(original);

      // Modify original
      original[0].tiles[0].terrain = 'lava';

      // Clone should be unaffected
      expect(cloned[0].tiles[0].terrain).toBe('water');
    });

    it('should copy all layer properties', () => {
      const original: MapLayer[] = [
        {
          id: 'layer1',
          name: 'Test Layer',
          visible: false,
          opacity: 0.5,
          tiles: [],
        },
      ];

      const cloned = cloneLayers(original);

      expect(cloned[0].id).toBe('layer1');
      expect(cloned[0].name).toBe('Test Layer');
      expect(cloned[0].visible).toBe(false);
      expect(cloned[0].opacity).toBe(0.5);
    });
  });

  describe('cloneLighting', () => {
    it('should create a deep copy of lighting', () => {
      const original: MapLighting = {
        globalLight: 0.8,
        ambientColor: '#334455',
        lightSources: [
          { id: 'light1', x: 5, y: 5, radius: 3, color: '#ff0000', intensity: 1 },
        ],
      };

      const cloned = cloneLighting(original);

      // Modify original
      original.lightSources![0].x = 10;

      // Clone should be unaffected
      expect(cloned.lightSources![0].x).toBe(5);
    });

    it('should handle lighting without light sources', () => {
      const original: MapLighting = {
        globalLight: 1,
        ambientColor: '#ffffff',
      };

      const cloned = cloneLighting(original);

      expect(cloned.globalLight).toBe(1);
      expect(cloned.ambientColor).toBe('#ffffff');
    });
  });

  describe('areLayersEqual', () => {
    it('should return true for identical layers', () => {
      const layers: MapLayer[] = [
        {
          id: 'layer1',
          name: 'Base',
          visible: true,
          opacity: 1,
          tiles: [{ x: 0, y: 0, terrain: 'water', elevation: 0 }],
        },
      ];

      expect(areLayersEqual(layers, cloneLayers(layers))).toBe(true);
    });

    it('should return false for different layer count', () => {
      const a: MapLayer[] = [
        { id: '1', name: 'A', visible: true, opacity: 1, tiles: [] },
      ];
      const b: MapLayer[] = [
        { id: '1', name: 'A', visible: true, opacity: 1, tiles: [] },
        { id: '2', name: 'B', visible: true, opacity: 1, tiles: [] },
      ];

      expect(areLayersEqual(a, b)).toBe(false);
    });

    it('should return false for different layer IDs', () => {
      const a: MapLayer[] = [
        { id: '1', name: 'A', visible: true, opacity: 1, tiles: [] },
      ];
      const b: MapLayer[] = [
        { id: '2', name: 'A', visible: true, opacity: 1, tiles: [] },
      ];

      expect(areLayersEqual(a, b)).toBe(false);
    });

    it('should return false for different visibility', () => {
      const a: MapLayer[] = [
        { id: '1', name: 'A', visible: true, opacity: 1, tiles: [] },
      ];
      const b: MapLayer[] = [
        { id: '1', name: 'A', visible: false, opacity: 1, tiles: [] },
      ];

      expect(areLayersEqual(a, b)).toBe(false);
    });

    it('should return false for different tile terrain', () => {
      const a: MapLayer[] = [
        {
          id: '1',
          name: 'A',
          visible: true,
          opacity: 1,
          tiles: [{ x: 0, y: 0, terrain: 'water', elevation: 0 }],
        },
      ];
      const b: MapLayer[] = [
        {
          id: '1',
          name: 'A',
          visible: true,
          opacity: 1,
          tiles: [{ x: 0, y: 0, terrain: 'lava', elevation: 0 }],
        },
      ];

      expect(areLayersEqual(a, b)).toBe(false);
    });
  });

  describe('TERRAIN_INFO', () => {
    it('should have 9 terrain types', () => {
      expect(TERRAIN_INFO).toHaveLength(9);
    });

    it('should have shortcuts 1-9', () => {
      const shortcuts = TERRAIN_INFO.map((t) => t.shortcut);
      expect(shortcuts).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    });

    it('should have all required properties', () => {
      for (const terrain of TERRAIN_INFO) {
        expect(terrain.type).toBeTruthy();
        expect(terrain.label).toBeTruthy();
        expect(terrain.icon).toBeTruthy();
        expect(terrain.description).toBeTruthy();
        expect(terrain.shortcut).toBeTruthy();
      }
    });
  });

  describe('getTerrainByShortcut', () => {
    it('should return terrain type for valid shortcut', () => {
      expect(getTerrainByShortcut('1')).toBe('grass');
      expect(getTerrainByShortcut('3')).toBe('water');
      expect(getTerrainByShortcut('8')).toBe('void');
    });

    it('should return null for invalid shortcut', () => {
      expect(getTerrainByShortcut('0')).toBeNull();
      expect(getTerrainByShortcut('a')).toBeNull();
      expect(getTerrainByShortcut('')).toBeNull();
    });
  });
});
