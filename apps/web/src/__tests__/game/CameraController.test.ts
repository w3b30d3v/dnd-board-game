/**
 * Tests for CameraController
 * Tests pan, zoom, coordinate conversion, and camera animations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock PIXI before importing CameraController
vi.mock('pixi.js', () => ({
  Container: class MockContainer {
    x = 0;
    y = 0;
    scale = {
      x: 1,
      y: 1,
      set: vi.fn(function (this: { x: number; y: number }, sx: number, sy: number) {
        this.x = sx;
        this.y = sy;
      }),
    };
  },
}));

import { CameraController } from '../../game/CameraController';

describe('CameraController', () => {
  let camera: CameraController;
  let mockStage: {
    x: number;
    y: number;
    scale: { x: number; y: number; set: ReturnType<typeof vi.fn> };
  };
  const screenWidth = 1280;
  const screenHeight = 720;

  beforeEach(() => {
    mockStage = {
      x: 0,
      y: 0,
      scale: {
        x: 1,
        y: 1,
        set: vi.fn(function (this: { x: number; y: number }, sx: number, sy: number) {
          this.x = sx;
          this.y = sy;
        }),
      },
    };
    camera = new CameraController(mockStage as never, screenWidth, screenHeight);
  });

  describe('Initialization', () => {
    it('should center the stage initially', () => {
      // Stage should be centered on screen
      expect(mockStage.x).toBe(screenWidth / 2);
      expect(mockStage.y).toBe(screenHeight / 2);
    });
  });

  describe('Pan', () => {
    it('should pan the camera by delta values', () => {
      const initialX = mockStage.x;
      const initialY = mockStage.y;

      camera.pan(100, 50);
      camera.update(1); // Apply smoothing

      // After multiple updates, position should approach target
      for (let i = 0; i < 50; i++) {
        camera.update(1);
      }

      // Position should have moved towards target
      expect(mockStage.x).not.toBe(initialX);
      expect(mockStage.y).not.toBe(initialY);
    });

    it('should clamp pan to bounds when set', () => {
      camera.setBounds(20, 15, 64); // 20x15 grid with 64px tiles

      // Try to pan way beyond bounds
      camera.pan(10000, 10000);
      camera.update(1);

      // Should be clamped (exact values depend on bounds calculation)
      // Just verify it doesn't exceed reasonable bounds
      expect(mockStage.x).toBeLessThan(10000);
      expect(mockStage.y).toBeLessThan(10000);
    });
  });

  describe('Zoom', () => {
    it('should zoom in when delta is positive', () => {
      camera.zoom(1, screenWidth / 2, screenHeight / 2);

      // Update multiple times to approach target
      for (let i = 0; i < 50; i++) {
        camera.update(1);
      }

      expect(mockStage.scale.x).toBeGreaterThan(1);
    });

    it('should zoom out when delta is negative', () => {
      camera.zoom(-1, screenWidth / 2, screenHeight / 2);

      // Update multiple times to approach target
      for (let i = 0; i < 50; i++) {
        camera.update(1);
      }

      expect(mockStage.scale.x).toBeLessThan(1);
    });

    it('should respect minimum zoom level', () => {
      // Zoom out many times
      for (let i = 0; i < 20; i++) {
        camera.zoom(-1, screenWidth / 2, screenHeight / 2);
      }

      for (let i = 0; i < 100; i++) {
        camera.update(1);
      }

      // Should not go below minimum (0.25)
      expect(mockStage.scale.x).toBeGreaterThanOrEqual(0.25);
    });

    it('should respect maximum zoom level', () => {
      // Zoom in many times
      for (let i = 0; i < 20; i++) {
        camera.zoom(1, screenWidth / 2, screenHeight / 2);
      }

      for (let i = 0; i < 100; i++) {
        camera.update(1);
      }

      // Should not go above maximum (4)
      expect(mockStage.scale.x).toBeLessThanOrEqual(4);
    });

    it('should set zoom level directly', () => {
      camera.setZoom(2);

      for (let i = 0; i < 50; i++) {
        camera.update(1);
      }

      expect(mockStage.scale.x).toBeCloseTo(2, 1);
    });

    it('should return current zoom level', () => {
      mockStage.scale.x = 1.5;
      expect(camera.getZoom()).toBe(1.5);
    });
  });

  describe('Center On', () => {
    it('should center camera on world position', () => {
      camera.centerOn(500, 300);

      for (let i = 0; i < 50; i++) {
        camera.update(1);
      }

      // Camera should be positioned to center on (500, 300)
      // Expected: screenWidth/2 - worldX * scale, screenHeight/2 - worldY * scale
      const expectedX = screenWidth / 2 - 500 * mockStage.scale.x;
      const expectedY = screenHeight / 2 - 300 * mockStage.scale.x;

      expect(mockStage.x).toBeCloseTo(expectedX, 0);
      expect(mockStage.y).toBeCloseTo(expectedY, 0);
    });

    it('should center camera on tile position', () => {
      const tileSize = 64;
      camera.centerOnTile(5, 5, tileSize);

      for (let i = 0; i < 50; i++) {
        camera.update(1);
      }

      // Tile center: (5 * 64 + 32, 5 * 64 + 32) = (352, 352)
      const expectedX = screenWidth / 2 - 352 * mockStage.scale.x;
      const expectedY = screenHeight / 2 - 352 * mockStage.scale.x;

      expect(mockStage.x).toBeCloseTo(expectedX, 0);
      expect(mockStage.y).toBeCloseTo(expectedY, 0);
    });
  });

  describe('Coordinate Conversion', () => {
    it('should convert screen to world coordinates', () => {
      mockStage.x = 640;
      mockStage.y = 360;
      mockStage.scale.x = 1;
      mockStage.scale.y = 1;

      const world = camera.screenToWorld(640, 360);
      expect(world.x).toBe(0);
      expect(world.y).toBe(0);
    });

    it('should convert screen to world with zoom', () => {
      mockStage.x = 640;
      mockStage.y = 360;
      mockStage.scale.x = 2;
      mockStage.scale.y = 2;

      const world = camera.screenToWorld(840, 560);
      // (840 - 640) / 2 = 100, (560 - 360) / 2 = 100
      expect(world.x).toBe(100);
      expect(world.y).toBe(100);
    });

    it('should convert world to screen coordinates', () => {
      mockStage.x = 640;
      mockStage.y = 360;
      mockStage.scale.x = 1;
      mockStage.scale.y = 1;

      const screen = camera.worldToScreen(100, 100);
      expect(screen.x).toBe(740);
      expect(screen.y).toBe(460);
    });

    it('should convert world to screen with zoom', () => {
      mockStage.x = 640;
      mockStage.y = 360;
      mockStage.scale.x = 2;
      mockStage.scale.y = 2;

      const screen = camera.worldToScreen(100, 100);
      // 100 * 2 + 640 = 840, 100 * 2 + 360 = 560
      expect(screen.x).toBe(840);
      expect(screen.y).toBe(560);
    });
  });

  describe('Animation', () => {
    it('should animate to world position', async () => {
      const promise = camera.animateTo(500, 300, 100);

      // Simulate animation frames
      for (let i = 0; i < 100; i++) {
        camera.update(1);
      }

      await promise;

      expect(camera.isAnimating()).toBe(false);
    });

    it('should report animating state during animation', () => {
      camera.animateTo(500, 300, 1000);

      expect(camera.isAnimating()).toBe(true);

      // Complete animation
      for (let i = 0; i < 100; i++) {
        camera.update(1);
      }

      expect(camera.isAnimating()).toBe(false);
    });

    it('should stop animation when stopAnimation is called', () => {
      camera.animateTo(500, 300, 1000);

      expect(camera.isAnimating()).toBe(true);

      camera.stopAnimation();

      expect(camera.isAnimating()).toBe(false);
    });

    it('should resolve immediately if already at position', async () => {
      const currentPos = camera.getPosition();
      const promise = camera.animateTo(currentPos.x, currentPos.y, 500);

      // Should resolve without needing updates
      await promise;

      expect(camera.isAnimating()).toBe(false);
    });

    it('should animate to tile position', async () => {
      const promise = camera.animateToTile(5, 5, 64, 100);

      for (let i = 0; i < 100; i++) {
        camera.update(1);
      }

      await promise;

      expect(camera.isAnimating()).toBe(false);
    });
  });

  describe('Reset', () => {
    it('should reset camera to default position', () => {
      // Pan and zoom
      camera.pan(200, 200);
      camera.setZoom(2);

      for (let i = 0; i < 50; i++) {
        camera.update(1);
      }

      // Reset
      camera.reset();

      for (let i = 0; i < 50; i++) {
        camera.update(1);
      }

      // Should be back to center
      expect(mockStage.x).toBeCloseTo(screenWidth / 2, 0);
      expect(mockStage.y).toBeCloseTo(screenHeight / 2, 0);
      expect(mockStage.scale.x).toBeCloseTo(1, 1);
    });
  });

  describe('Screen Size Update', () => {
    it('should update screen dimensions', () => {
      camera.updateScreenSize(1920, 1080);

      // After reset, should use new screen dimensions
      camera.reset();

      for (let i = 0; i < 50; i++) {
        camera.update(1);
      }

      expect(mockStage.x).toBeCloseTo(1920 / 2, 0);
      expect(mockStage.y).toBeCloseTo(1080 / 2, 0);
    });
  });

  describe('Get Position', () => {
    it('should return current camera position in world coordinates', () => {
      mockStage.x = 640;
      mockStage.y = 360;
      mockStage.scale.x = 1;
      mockStage.scale.y = 1;

      const pos = camera.getPosition();

      // Center of screen in world coordinates
      expect(pos.x).toBe(0);
      expect(pos.y).toBe(0);
    });
  });
});
