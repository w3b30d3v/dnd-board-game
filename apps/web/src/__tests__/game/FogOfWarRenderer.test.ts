/**
 * Tests for FogOfWarRenderer
 * Tests visibility states, reveal/hide operations, and fog rendering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock PIXI before importing FogOfWarRenderer
vi.mock('pixi.js', () => ({
  Container: class MockContainer {
    children: unknown[] = [];
    addChild(child: unknown) {
      this.children.push(child);
      return child;
    }
    removeChild(child: unknown) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
      return child;
    }
    destroy = vi.fn();
  },
  Graphics: class MockGraphics {
    beginFill = vi.fn().mockReturnThis();
    endFill = vi.fn().mockReturnThis();
    drawRect = vi.fn().mockReturnThis();
    drawCircle = vi.fn().mockReturnThis();
    clear = vi.fn().mockReturnThis();
    destroy = vi.fn();
  },
}));

import { FogOfWarRenderer } from '../../game/FogOfWarRenderer';

describe('FogOfWarRenderer', () => {
  let fogRenderer: FogOfWarRenderer;
  let mockContainer: {
    children: unknown[];
    addChild: (child: unknown) => unknown;
    removeChild: (child: unknown) => unknown;
    destroy: ReturnType<typeof vi.fn>;
  };
  const tileSize = 64;
  const gridWidth = 10;
  const gridHeight = 8;

  beforeEach(() => {
    mockContainer = {
      children: [],
      addChild(child: unknown) {
        this.children.push(child);
        return child;
      },
      removeChild(child: unknown) {
        const idx = this.children.indexOf(child);
        if (idx >= 0) this.children.splice(idx, 1);
        return child;
      },
      destroy: vi.fn(),
    };
    fogRenderer = new FogOfWarRenderer(
      mockContainer as never,
      tileSize,
      gridWidth,
      gridHeight
    );
  });

  describe('Initialization', () => {
    it('should create fog and explored layers', () => {
      // Should have added two graphics layers
      expect(mockContainer.children.length).toBe(2);
    });

    it('should initialize all tiles as hidden', () => {
      // All tiles should be hidden by default
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          expect(fogRenderer.getVisibility(x, y)).toBe('HIDDEN');
        }
      }
    });
  });

  describe('Visibility State', () => {
    it('should set tile visibility', () => {
      fogRenderer.setTileVisibility(5, 3, 'VISIBLE');
      expect(fogRenderer.getVisibility(5, 3)).toBe('VISIBLE');
    });

    it('should track explored state', () => {
      fogRenderer.setTileVisibility(5, 3, 'EXPLORED');
      expect(fogRenderer.getVisibility(5, 3)).toBe('EXPLORED');
    });

    it('should return HIDDEN for unset tiles', () => {
      expect(fogRenderer.getVisibility(999, 999)).toBe('HIDDEN');
    });
  });

  describe('isVisible', () => {
    it('should return true for visible tiles', () => {
      fogRenderer.setTileVisibility(5, 3, 'VISIBLE');
      expect(fogRenderer.isVisible(5, 3)).toBe(true);
    });

    it('should return false for explored tiles', () => {
      fogRenderer.setTileVisibility(5, 3, 'EXPLORED');
      expect(fogRenderer.isVisible(5, 3)).toBe(false);
    });

    it('should return false for hidden tiles', () => {
      expect(fogRenderer.isVisible(5, 3)).toBe(false);
    });
  });

  describe('isExplored', () => {
    it('should return true for visible tiles', () => {
      fogRenderer.setTileVisibility(5, 3, 'VISIBLE');
      expect(fogRenderer.isExplored(5, 3)).toBe(true);
    });

    it('should return true for explored tiles', () => {
      fogRenderer.setTileVisibility(5, 3, 'EXPLORED');
      expect(fogRenderer.isExplored(5, 3)).toBe(true);
    });

    it('should return false for hidden tiles', () => {
      expect(fogRenderer.isExplored(5, 3)).toBe(false);
    });
  });

  describe('updateVisibility', () => {
    it('should mark specified tiles as visible', () => {
      fogRenderer.updateVisibility([
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
      ]);

      expect(fogRenderer.getVisibility(1, 1)).toBe('VISIBLE');
      expect(fogRenderer.getVisibility(2, 2)).toBe('VISIBLE');
      expect(fogRenderer.getVisibility(3, 3)).toBe('VISIBLE');
    });

    it('should mark previously visible tiles as explored', () => {
      fogRenderer.setTileVisibility(5, 5, 'VISIBLE');

      // Update with different visible tiles
      fogRenderer.updateVisibility([{ x: 1, y: 1 }]);

      expect(fogRenderer.getVisibility(5, 5)).toBe('EXPLORED');
      expect(fogRenderer.getVisibility(1, 1)).toBe('VISIBLE');
    });
  });

  describe('revealArea', () => {
    it('should reveal tiles within radius', () => {
      fogRenderer.revealArea(5, 5, 10); // 10ft radius = 2 tiles

      expect(fogRenderer.getVisibility(5, 5)).toBe('VISIBLE'); // Center
      expect(fogRenderer.getVisibility(5, 4)).toBe('VISIBLE'); // Adjacent
      expect(fogRenderer.getVisibility(4, 5)).toBe('VISIBLE'); // Adjacent
    });

    it('should not reveal tiles outside radius', () => {
      fogRenderer.revealArea(5, 5, 5); // 5ft radius = 1 tile

      // Tiles more than 1 tile away should remain hidden
      expect(fogRenderer.getVisibility(0, 0)).toBe('HIDDEN');
    });

    it('should not reveal tiles outside grid bounds', () => {
      fogRenderer.revealArea(0, 0, 10);

      // Should handle edge cases without error
      expect(fogRenderer.getVisibility(-1, -1)).toBe('HIDDEN');
    });
  });

  describe('exploreTiles', () => {
    it('should set hidden tiles to explored', () => {
      fogRenderer.exploreTiles([
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ]);

      expect(fogRenderer.getVisibility(1, 1)).toBe('EXPLORED');
      expect(fogRenderer.getVisibility(2, 2)).toBe('EXPLORED');
    });

    it('should not downgrade visible tiles to explored', () => {
      fogRenderer.setTileVisibility(1, 1, 'VISIBLE');
      fogRenderer.exploreTiles([{ x: 1, y: 1 }]);

      expect(fogRenderer.getVisibility(1, 1)).toBe('VISIBLE');
    });

    it('should not change already explored tiles', () => {
      fogRenderer.setTileVisibility(1, 1, 'EXPLORED');
      fogRenderer.exploreTiles([{ x: 1, y: 1 }]);

      expect(fogRenderer.getVisibility(1, 1)).toBe('EXPLORED');
    });
  });

  describe('hideAll', () => {
    it('should hide all tiles', () => {
      // First reveal some tiles
      fogRenderer.setTileVisibility(1, 1, 'VISIBLE');
      fogRenderer.setTileVisibility(2, 2, 'EXPLORED');

      fogRenderer.hideAll();

      expect(fogRenderer.getVisibility(1, 1)).toBe('HIDDEN');
      expect(fogRenderer.getVisibility(2, 2)).toBe('HIDDEN');
    });
  });

  describe('revealAll', () => {
    it('should reveal all tiles', () => {
      fogRenderer.revealAll();

      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          expect(fogRenderer.getVisibility(x, y)).toBe('VISIBLE');
        }
      }
    });
  });

  describe('getVisibleTiles', () => {
    it('should return all visible tiles', () => {
      fogRenderer.setTileVisibility(1, 1, 'VISIBLE');
      fogRenderer.setTileVisibility(2, 2, 'VISIBLE');
      fogRenderer.setTileVisibility(3, 3, 'EXPLORED');

      const visibleTiles = fogRenderer.getVisibleTiles();

      expect(visibleTiles).toHaveLength(2);
      expect(visibleTiles).toContainEqual({ x: 1, y: 1 });
      expect(visibleTiles).toContainEqual({ x: 2, y: 2 });
    });

    it('should return empty array when no tiles are visible', () => {
      const visibleTiles = fogRenderer.getVisibleTiles();
      expect(visibleTiles).toHaveLength(0);
    });
  });

  describe('getExploredTiles', () => {
    it('should return all explored and visible tiles', () => {
      fogRenderer.setTileVisibility(1, 1, 'VISIBLE');
      fogRenderer.setTileVisibility(2, 2, 'EXPLORED');
      // 3,3 remains hidden

      const exploredTiles = fogRenderer.getExploredTiles();

      expect(exploredTiles).toHaveLength(2);
      expect(exploredTiles).toContainEqual({ x: 1, y: 1 });
      expect(exploredTiles).toContainEqual({ x: 2, y: 2 });
    });
  });

  describe('setGridSize', () => {
    it('should handle grid expansion', () => {
      fogRenderer.setGridSize(15, 12);

      // New tiles should be hidden
      expect(fogRenderer.getVisibility(12, 10)).toBe('HIDDEN');
    });

    it('should handle grid contraction', () => {
      fogRenderer.setTileVisibility(9, 7, 'VISIBLE');
      fogRenderer.setGridSize(5, 5);

      // Tiles outside new bounds should be removed
      const visibleTiles = fogRenderer.getVisibleTiles();
      expect(visibleTiles.some((t) => t.x === 9 && t.y === 7)).toBe(false);
    });

    it('should preserve existing visibility within new bounds', () => {
      fogRenderer.setTileVisibility(2, 2, 'VISIBLE');
      fogRenderer.setGridSize(15, 12);

      expect(fogRenderer.getVisibility(2, 2)).toBe('VISIBLE');
    });
  });

  describe('setSmoothEdges', () => {
    it('should toggle smooth edges without error', () => {
      expect(() => fogRenderer.setSmoothEdges(false)).not.toThrow();
      expect(() => fogRenderer.setSmoothEdges(true)).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      fogRenderer.destroy();

      // After destroy, visibility map should be cleared
      expect(fogRenderer.getVisibility(0, 0)).toBe('HIDDEN');
    });
  });
});
