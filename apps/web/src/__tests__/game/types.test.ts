/**
 * Tests for game types and constants
 */

import { describe, it, expect } from 'vitest';
import {
  SIZE_TO_CELLS,
  TOKEN_TYPE_COLORS,
  TERRAIN_COLORS,
  GRID_COLORS,
} from '../../game/types';

describe('Game Types', () => {
  describe('SIZE_TO_CELLS', () => {
    it('should have correct cell sizes for D&D creature sizes', () => {
      expect(SIZE_TO_CELLS.tiny).toBe(0.5);
      expect(SIZE_TO_CELLS.small).toBe(1);
      expect(SIZE_TO_CELLS.medium).toBe(1);
      expect(SIZE_TO_CELLS.large).toBe(2);
      expect(SIZE_TO_CELLS.huge).toBe(3);
      expect(SIZE_TO_CELLS.gargantuan).toBe(4);
    });

    it('should have all 6 creature sizes', () => {
      const sizes = Object.keys(SIZE_TO_CELLS);
      expect(sizes).toHaveLength(6);
      expect(sizes).toContain('tiny');
      expect(sizes).toContain('small');
      expect(sizes).toContain('medium');
      expect(sizes).toContain('large');
      expect(sizes).toContain('huge');
      expect(sizes).toContain('gargantuan');
    });
  });

  describe('TOKEN_TYPE_COLORS', () => {
    it('should have distinct colors for each token type', () => {
      expect(TOKEN_TYPE_COLORS.character).toBeDefined();
      expect(TOKEN_TYPE_COLORS.monster).toBeDefined();
      expect(TOKEN_TYPE_COLORS.npc).toBeDefined();

      // Colors should be different
      expect(TOKEN_TYPE_COLORS.character).not.toBe(TOKEN_TYPE_COLORS.monster);
      expect(TOKEN_TYPE_COLORS.character).not.toBe(TOKEN_TYPE_COLORS.npc);
      expect(TOKEN_TYPE_COLORS.monster).not.toBe(TOKEN_TYPE_COLORS.npc);
    });

    it('should have valid hex color values', () => {
      Object.values(TOKEN_TYPE_COLORS).forEach((color) => {
        expect(typeof color).toBe('number');
        expect(color).toBeGreaterThanOrEqual(0);
        expect(color).toBeLessThanOrEqual(0xffffff);
      });
    });
  });

  describe('TERRAIN_COLORS', () => {
    it('should have all 8 terrain types', () => {
      const types = Object.keys(TERRAIN_COLORS);
      expect(types).toHaveLength(8);
      expect(types).toContain('NORMAL');
      expect(types).toContain('DIFFICULT');
      expect(types).toContain('WATER');
      expect(types).toContain('LAVA');
      expect(types).toContain('PIT');
      expect(types).toContain('WALL');
      expect(types).toContain('DOOR');
      expect(types).toContain('STAIRS');
    });

    it('should have valid hex color values', () => {
      Object.values(TERRAIN_COLORS).forEach((color) => {
        expect(typeof color).toBe('number');
        expect(color).toBeGreaterThanOrEqual(0);
        expect(color).toBeLessThanOrEqual(0xffffff);
      });
    });
  });

  describe('GRID_COLORS', () => {
    it('should have all required grid colors', () => {
      expect(GRID_COLORS.line).toBeDefined();
      expect(GRID_COLORS.hover).toBeDefined();
      expect(GRID_COLORS.selected).toBeDefined();
      expect(GRID_COLORS.movement).toBeDefined();
      expect(GRID_COLORS.attack).toBeDefined();
      expect(GRID_COLORS.spell).toBeDefined();
    });

    it('should have valid hex color values', () => {
      Object.values(GRID_COLORS).forEach((color) => {
        expect(typeof color).toBe('number');
        expect(color).toBeGreaterThanOrEqual(0);
        expect(color).toBeLessThanOrEqual(0xffffff);
      });
    });
  });
});
