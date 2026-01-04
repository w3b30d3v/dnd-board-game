/**
 * AoE Calculator Tests
 * Tests for D&D 5e Area of Effect calculations
 */

import { describe, it, expect } from 'vitest';
import { calculateAoE, getCreaturesInAoE, SPELL_AOE_PRESETS, type AoEShape } from '@/game/AoECalculator';

describe('AoECalculator', () => {
  describe('calculateAoE', () => {
    describe('sphere', () => {
      it('should calculate a 20ft radius sphere', () => {
        const result = calculateAoE({
          shape: 'sphere',
          origin: { x: 5, y: 5 },
          radius: 20,
        });

        expect(result.shape).toBe('sphere');
        expect(result.originTile).toEqual({ x: 5, y: 5 });
        // 20ft = 4 tiles radius, area should be roughly pi*r^2 tiles
        expect(result.affectedTiles.length).toBeGreaterThan(30);
        // Should include origin
        expect(result.affectedTiles.some(t => t.x === 5 && t.y === 5)).toBe(true);
      });

      it('should calculate a 5ft radius sphere (single tile + adjacent)', () => {
        const result = calculateAoE({
          shape: 'sphere',
          origin: { x: 5, y: 5 },
          radius: 5,
        });

        // 5ft = 1 tile radius - should be small area
        expect(result.affectedTiles.length).toBeLessThanOrEqual(5);
        expect(result.affectedTiles.some(t => t.x === 5 && t.y === 5)).toBe(true);
      });
    });

    describe('cone', () => {
      it('should calculate a 15ft cone facing east', () => {
        const result = calculateAoE({
          shape: 'cone',
          origin: { x: 5, y: 5 },
          length: 15,
          direction: 0, // East
        });

        expect(result.shape).toBe('cone');
        // Cone tiles should mostly be to the right of origin
        const tilesRight = result.affectedTiles.filter(t => t.x > 5);
        expect(tilesRight.length).toBeGreaterThan(0);
        // Should not include origin (cone starts from caster but doesn't include caster)
      });

      it('should calculate a 15ft cone facing south', () => {
        const result = calculateAoE({
          shape: 'cone',
          origin: { x: 5, y: 5 },
          length: 15,
          direction: 90, // South (down in screen coords)
        });

        // Cone tiles should mostly be below origin
        const tilesBelow = result.affectedTiles.filter(t => t.y > 5);
        expect(tilesBelow.length).toBeGreaterThan(0);
      });
    });

    describe('line', () => {
      it('should calculate a 30ft line facing east', () => {
        const result = calculateAoE({
          shape: 'line',
          origin: { x: 5, y: 5 },
          length: 30,
          width: 5,
          direction: 0, // East
        });

        expect(result.shape).toBe('line');
        // Line should extend 6 tiles (30ft / 5ft) to the right
        const maxX = Math.max(...result.affectedTiles.map(t => t.x));
        expect(maxX).toBeGreaterThanOrEqual(5 + 5); // At least 5 tiles from origin
      });

      it('should include origin tile', () => {
        const result = calculateAoE({
          shape: 'line',
          origin: { x: 5, y: 5 },
          length: 30,
          width: 5,
          direction: 0,
        });

        expect(result.affectedTiles.some(t => t.x === 5 && t.y === 5)).toBe(true);
      });
    });

    describe('cube', () => {
      it('should calculate a 15ft cube', () => {
        const result = calculateAoE({
          shape: 'cube',
          origin: { x: 5, y: 5 },
          size: 15,
          direction: 0,
        });

        expect(result.shape).toBe('cube');
        // 15ft = 3 tiles, cube should be 3x3 = 9 tiles
        expect(result.affectedTiles.length).toBe(9);
      });

      it('should calculate a 10ft cube', () => {
        const result = calculateAoE({
          shape: 'cube',
          origin: { x: 5, y: 5 },
          size: 10,
          direction: 0,
        });

        // 10ft = 2 tiles, cube should be 2x2 = 4 tiles
        expect(result.affectedTiles.length).toBe(4);
      });
    });

    describe('cylinder', () => {
      it('should calculate same as sphere (2D projection)', () => {
        const cylinder = calculateAoE({
          shape: 'cylinder',
          origin: { x: 5, y: 5 },
          radius: 10,
        });

        const sphere = calculateAoE({
          shape: 'sphere',
          origin: { x: 5, y: 5 },
          radius: 10,
        });

        expect(cylinder.affectedTiles.length).toBe(sphere.affectedTiles.length);
      });
    });
  });

  describe('getCreaturesInAoE', () => {
    const creatures = [
      { id: 'goblin1', position: { x: 6, y: 5 } },
      { id: 'goblin2', position: { x: 7, y: 5 } },
      { id: 'player1', position: { x: 5, y: 5 } },
      { id: 'far_away', position: { x: 20, y: 20 } },
    ];

    it('should return creatures within the AoE', () => {
      const aoeResult = calculateAoE({
        shape: 'sphere',
        origin: { x: 5, y: 5 },
        radius: 10, // 2 tile radius
      });

      const affected = getCreaturesInAoE(aoeResult, creatures);

      // Should include creatures at (6,5), (5,5) - within 2 tiles
      expect(affected).toContain('goblin1');
      expect(affected).toContain('player1');
      // Goblin2 at (7,5) may or may not be included depending on exact calculation
      // Far away creature should not be included
      expect(affected).not.toContain('far_away');
    });

    it('should return empty array if no creatures affected', () => {
      const aoeResult = calculateAoE({
        shape: 'sphere',
        origin: { x: 100, y: 100 },
        radius: 5,
      });

      const affected = getCreaturesInAoE(aoeResult, creatures);
      expect(affected).toHaveLength(0);
    });
  });

  describe('SPELL_AOE_PRESETS', () => {
    it('should have correct preset for Fireball', () => {
      expect(SPELL_AOE_PRESETS.fireball).toEqual({
        shape: 'sphere',
        radius: 20,
      });
    });

    it('should have correct preset for Burning Hands', () => {
      expect(SPELL_AOE_PRESETS.burningHands).toEqual({
        shape: 'cone',
        length: 15,
      });
    });

    it('should have correct preset for Lightning Bolt', () => {
      expect(SPELL_AOE_PRESETS.lightningBolt).toEqual({
        shape: 'line',
        length: 100,
        width: 5,
      });
    });

    it('should have correct preset for Thunderwave', () => {
      expect(SPELL_AOE_PRESETS.thunderwave).toEqual({
        shape: 'cube',
        size: 15,
      });
    });

    it('should have correct preset for Moonbeam', () => {
      expect(SPELL_AOE_PRESETS.moonbeam).toEqual({
        shape: 'cylinder',
        radius: 5,
      });
    });
  });
});
