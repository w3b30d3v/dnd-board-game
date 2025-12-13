/**
 * Tests for AoEOverlayRenderer
 * Tests Area of Effect shape rendering and affected tile calculations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AreaOfEffect } from '../../game/types';

// Mock PIXI before importing AoEOverlayRenderer
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
    lineStyle = vi.fn().mockReturnThis();
    moveTo = vi.fn().mockReturnThis();
    lineTo = vi.fn().mockReturnThis();
    arc = vi.fn().mockReturnThis();
    clear = vi.fn().mockReturnThis();
    destroy = vi.fn();
  },
}));

import { AoEOverlayRenderer } from '../../game/AoEOverlayRenderer';

describe('AoEOverlayRenderer', () => {
  let aoeRenderer: AoEOverlayRenderer;
  let mockContainer: {
    children: unknown[];
    addChild: (child: unknown) => unknown;
    removeChild: (child: unknown) => unknown;
    destroy: ReturnType<typeof vi.fn>;
  };
  const tileSize = 64;

  function createAoE(overrides?: Partial<AreaOfEffect>): AreaOfEffect {
    return {
      shape: 'SPHERE',
      size: 20, // 20ft radius = 4 tiles
      origin: { x: 5, y: 5 },
      color: 0xff0000,
      alpha: 0.3,
      ...overrides,
    };
  }

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
    aoeRenderer = new AoEOverlayRenderer(mockContainer as never, tileSize);
  });

  describe('Show/Hide AoE', () => {
    it('should show an AoE effect', () => {
      const aoe = createAoE();
      aoeRenderer.showAoE('fireball-1', aoe);

      expect(mockContainer.children.length).toBe(1);
    });

    it('should hide an AoE effect', () => {
      const aoe = createAoE();
      aoeRenderer.showAoE('fireball-1', aoe);
      aoeRenderer.hideAoE('fireball-1');

      expect(mockContainer.children.length).toBe(0);
    });

    it('should replace existing AoE with same ID', () => {
      const aoe1 = createAoE({ size: 20 });
      const aoe2 = createAoE({ size: 30 });

      aoeRenderer.showAoE('fireball-1', aoe1);
      aoeRenderer.showAoE('fireball-1', aoe2);

      // Should still only have one effect
      expect(mockContainer.children.length).toBe(1);
    });

    it('should handle hiding non-existent AoE', () => {
      expect(() => aoeRenderer.hideAoE('non-existent')).not.toThrow();
    });
  });

  describe('Clear All', () => {
    it('should clear all AoE effects', () => {
      aoeRenderer.showAoE('effect-1', createAoE());
      aoeRenderer.showAoE('effect-2', createAoE());
      aoeRenderer.showAoE('effect-3', createAoE());

      aoeRenderer.clearAll();

      expect(mockContainer.children.length).toBe(0);
    });
  });

  describe('Preview', () => {
    it('should show preview AoE', () => {
      aoeRenderer.previewAoE(createAoE());

      expect(mockContainer.children.length).toBe(1);
    });

    it('should clear preview', () => {
      aoeRenderer.previewAoE(createAoE());
      aoeRenderer.clearPreview();

      expect(mockContainer.children.length).toBe(0);
    });

    it('should replace existing preview', () => {
      aoeRenderer.previewAoE(createAoE({ size: 20 }));
      aoeRenderer.previewAoE(createAoE({ size: 30 }));

      expect(mockContainer.children.length).toBe(1);
    });
  });

  describe('Get Affected Tiles - Sphere', () => {
    it('should return tiles within sphere radius', () => {
      const aoe = createAoE({
        shape: 'SPHERE',
        size: 10, // 10ft = 2 tiles radius
        origin: { x: 5, y: 5 },
      });

      const tiles = aoeRenderer.getAffectedTiles(aoe);

      // Should include center tile
      expect(tiles).toContainEqual({ x: 5, y: 5 });

      // Should include adjacent tiles
      expect(tiles).toContainEqual({ x: 5, y: 4 });
      expect(tiles).toContainEqual({ x: 5, y: 6 });
      expect(tiles).toContainEqual({ x: 4, y: 5 });
      expect(tiles).toContainEqual({ x: 6, y: 5 });
    });

    it('should not include tiles outside sphere radius', () => {
      const aoe = createAoE({
        shape: 'SPHERE',
        size: 5, // 5ft = 1 tile radius
        origin: { x: 5, y: 5 },
      });

      const tiles = aoeRenderer.getAffectedTiles(aoe);

      // Tiles 2+ away should not be included
      expect(tiles).not.toContainEqual({ x: 3, y: 5 });
      expect(tiles).not.toContainEqual({ x: 7, y: 5 });
    });
  });

  describe('Get Affected Tiles - Cube', () => {
    it('should return tiles within cube area', () => {
      const aoe = createAoE({
        shape: 'CUBE',
        size: 10, // 10ft cube = 2 tiles
        origin: { x: 5, y: 5 },
      });

      const tiles = aoeRenderer.getAffectedTiles(aoe);

      // Should include center
      expect(tiles).toContainEqual({ x: 5, y: 5 });
    });
  });

  describe('Get Affected Tiles - Cone', () => {
    it('should return tiles within cone shape', () => {
      const aoe = createAoE({
        shape: 'CONE',
        size: 15, // 15ft cone
        origin: { x: 5, y: 5 },
        direction: 0, // Right
      });

      const tiles = aoeRenderer.getAffectedTiles(aoe);

      // Should include origin
      expect(tiles).toContainEqual({ x: 5, y: 5 });

      // Should include tiles in direction
      expect(tiles).toContainEqual({ x: 6, y: 5 });
    });

    it('should respect cone direction', () => {
      const aoeRight = createAoE({
        shape: 'CONE',
        size: 15,
        origin: { x: 5, y: 5 },
        direction: 0, // Right
      });

      const aoeLeft = createAoE({
        shape: 'CONE',
        size: 15,
        origin: { x: 5, y: 5 },
        direction: 180, // Left
      });

      const tilesRight = aoeRenderer.getAffectedTiles(aoeRight);
      const tilesLeft = aoeRenderer.getAffectedTiles(aoeLeft);

      // Right cone should include tiles to the right
      expect(tilesRight.some((t) => t.x > 5)).toBe(true);

      // Left cone should include tiles to the left
      expect(tilesLeft.some((t) => t.x < 5)).toBe(true);
    });
  });

  describe('Get Affected Tiles - Line', () => {
    it('should return tiles along line', () => {
      const aoe = createAoE({
        shape: 'LINE',
        size: 30, // 30ft line = 6 tiles
        origin: { x: 5, y: 5 },
        direction: 0, // Right
      });

      const tiles = aoeRenderer.getAffectedTiles(aoe);

      // Should include origin
      expect(tiles).toContainEqual({ x: 5, y: 5 });

      // Should include tiles along line direction
      expect(tiles.some((t) => t.x > 5)).toBe(true);
    });

    it('should not include tiles far from line', () => {
      const aoe = createAoE({
        shape: 'LINE',
        size: 30,
        origin: { x: 5, y: 5 },
        direction: 0, // Horizontal line
      });

      const tiles = aoeRenderer.getAffectedTiles(aoe);

      // Should not include tiles far above or below the line
      expect(tiles.some((t) => t.y === 3)).toBe(false);
      expect(tiles.some((t) => t.y === 7)).toBe(false);
    });
  });

  describe('Get Affected Tiles - Cylinder', () => {
    it('should behave like sphere for 2D calculation', () => {
      const sphere = createAoE({
        shape: 'SPHERE',
        size: 15,
        origin: { x: 5, y: 5 },
      });

      const cylinder = createAoE({
        shape: 'CYLINDER',
        size: 15,
        origin: { x: 5, y: 5 },
      });

      const sphereTiles = aoeRenderer.getAffectedTiles(sphere);
      const cylinderTiles = aoeRenderer.getAffectedTiles(cylinder);

      expect(sphereTiles.length).toBe(cylinderTiles.length);
    });
  });

  describe('Update Animation', () => {
    it('should update without error', () => {
      aoeRenderer.showAoE('effect-1', createAoE());

      expect(() => aoeRenderer.update(1)).not.toThrow();
    });

    it('should not update preview effects', () => {
      aoeRenderer.previewAoE(createAoE());

      // Should not throw when updating
      expect(() => aoeRenderer.update(1)).not.toThrow();
    });
  });

  describe('Set Tile Size', () => {
    it('should update tile size and redraw effects', () => {
      aoeRenderer.showAoE('effect-1', createAoE());

      expect(() => aoeRenderer.setTileSize(32)).not.toThrow();
    });
  });

  describe('Destroy', () => {
    it('should clean up all resources', () => {
      aoeRenderer.showAoE('effect-1', createAoE());
      aoeRenderer.showAoE('effect-2', createAoE());

      aoeRenderer.destroy();

      expect(mockContainer.destroy).toHaveBeenCalled();
    });
  });
});
