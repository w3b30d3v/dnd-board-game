/**
 * Tests for TokenManager
 * Note: Full animation tests require browser environment
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Creature } from '../../game/types';

// Mock PIXI before importing TokenManager
vi.mock('pixi.js', () => ({
  Container: class MockContainer {
    children: unknown[] = [];
    x = 0;
    y = 0;
    scale = { x: 1, y: 1, set: vi.fn() };
    alpha = 1;
    rotation = 0;
    name?: string;
    addChild(child: unknown) {
      this.children.push(child);
      return child;
    }
    addChildAt(child: unknown, index: number) {
      this.children.splice(index, 0, child);
      return child;
    }
    removeChild(child: unknown) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
      return child;
    }
    removeChildren() {
      this.children = [];
    }
    getChildByName(name: string) {
      return this.children.find((c: unknown) => (c as { name?: string }).name === name);
    }
    destroy() {}
  },
  Graphics: class MockGraphics {
    children: unknown[] = [];
    tint = 0xffffff;
    scale = { x: 1, y: 1, set: vi.fn() };
    alpha = 1;
    rotation = 0;
    name?: string;
    x = 0;
    y = 0;
    lineStyle = vi.fn().mockReturnThis();
    beginFill = vi.fn().mockReturnThis();
    endFill = vi.fn().mockReturnThis();
    drawRect = vi.fn().mockReturnThis();
    drawCircle = vi.fn().mockReturnThis();
    drawRoundedRect = vi.fn().mockReturnThis();
    drawEllipse = vi.fn().mockReturnThis();
    quadraticCurveTo = vi.fn().mockReturnThis();
    moveTo = vi.fn().mockReturnThis();
    lineTo = vi.fn().mockReturnThis();
    clear = vi.fn().mockReturnThis();
    destroy = vi.fn();
    addChild(child: unknown) {
      this.children.push(child);
      return child;
    }
    removeChild(child: unknown) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
      return child;
    }
  },
  Text: class MockText {
    text = '';
    anchor = { set: vi.fn() };
    x = 0;
    y = 0;
    constructor(options: { text: string }) {
      this.text = options.text;
    }
  },
}));

import { TokenManager } from '../../game/TokenManager';

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  let mockContainer: ReturnType<typeof createMockContainer>;
  const tileSize = 64;

  function createMockContainer() {
    return {
      children: [] as unknown[],
      x: 0,
      y: 0,
      addChild(child: unknown) {
        this.children.push(child);
        return child;
      },
      addChildAt(child: unknown, index: number) {
        this.children.splice(index, 0, child);
        return child;
      },
      removeChild(child: unknown) {
        const idx = this.children.indexOf(child);
        if (idx >= 0) this.children.splice(idx, 1);
        return child;
      },
      destroy: vi.fn(),
    };
  }

  function createTestCreature(overrides?: Partial<Creature>): Creature {
    return {
      id: 'test-creature-1',
      name: 'Test Creature',
      type: 'character',
      position: { x: 5, y: 5 },
      size: 'medium',
      currentHitPoints: 30,
      maxHitPoints: 50,
      tempHitPoints: 0,
      armorClass: 15,
      speed: 30,
      conditions: [],
      isConcentrating: false,
      isVisible: true,
      isHidden: false,
      ...overrides,
    };
  }

  beforeEach(() => {
    mockContainer = createMockContainer();
    tokenManager = new TokenManager(mockContainer as never, tileSize);
  });

  describe('Token Management', () => {
    it('should add a token to the board', () => {
      const creature = createTestCreature();
      tokenManager.addToken(creature);

      expect(tokenManager.getAllTokenIds()).toContain(creature.id);
      expect(mockContainer.children.length).toBeGreaterThan(0);
    });

    it('should remove a token from the board', () => {
      const creature = createTestCreature();
      tokenManager.addToken(creature);
      tokenManager.removeToken(creature.id);

      expect(tokenManager.getAllTokenIds()).not.toContain(creature.id);
    });

    it('should replace existing token when adding duplicate', () => {
      const creature = createTestCreature();
      tokenManager.addToken(creature);

      const updatedCreature = createTestCreature({ currentHitPoints: 20 });
      tokenManager.addToken(updatedCreature);

      // Should still only have one token
      expect(tokenManager.getAllTokenIds()).toHaveLength(1);
    });

    it('should clear all tokens', () => {
      tokenManager.addToken(createTestCreature({ id: 'creature-1' }));
      tokenManager.addToken(createTestCreature({ id: 'creature-2' }));
      tokenManager.addToken(createTestCreature({ id: 'creature-3' }));

      expect(tokenManager.getAllTokenIds()).toHaveLength(3);

      tokenManager.clear();

      expect(tokenManager.getAllTokenIds()).toHaveLength(0);
    });
  });

  describe('Selection', () => {
    it('should select a token', () => {
      const creature = createTestCreature();
      tokenManager.addToken(creature);
      tokenManager.selectToken(creature.id);

      expect(tokenManager.getSelectedTokenId()).toBe(creature.id);
    });

    it('should deselect when selecting null', () => {
      const creature = createTestCreature();
      tokenManager.addToken(creature);
      tokenManager.selectToken(creature.id);
      tokenManager.selectToken(null);

      expect(tokenManager.getSelectedTokenId()).toBeNull();
    });

    it('should switch selection between tokens', () => {
      const creature1 = createTestCreature({ id: 'creature-1' });
      const creature2 = createTestCreature({ id: 'creature-2' });

      tokenManager.addToken(creature1);
      tokenManager.addToken(creature2);

      tokenManager.selectToken(creature1.id);
      expect(tokenManager.getSelectedTokenId()).toBe(creature1.id);

      tokenManager.selectToken(creature2.id);
      expect(tokenManager.getSelectedTokenId()).toBe(creature2.id);
    });
  });

  describe('Token Update', () => {
    it('should update creature data', () => {
      const creature = createTestCreature();
      tokenManager.addToken(creature);

      const updatedCreature = createTestCreature({ currentHitPoints: 20 });
      tokenManager.updateToken(updatedCreature);

      // Token should still exist
      expect(tokenManager.getAllTokenIds()).toContain(creature.id);
    });

    it('should add token if update called for non-existent token', () => {
      const creature = createTestCreature({ id: 'new-creature' });
      tokenManager.updateToken(creature);

      expect(tokenManager.getAllTokenIds()).toContain('new-creature');
    });
  });

  describe('Targeting', () => {
    it('should set targeted tokens', () => {
      const creature1 = createTestCreature({ id: 'creature-1' });
      const creature2 = createTestCreature({ id: 'creature-2' });

      tokenManager.addToken(creature1);
      tokenManager.addToken(creature2);

      tokenManager.setTargetedTokens(['creature-1', 'creature-2']);

      // Both should be marked (internal state)
      // We can't directly test visual state without mocking more deeply
    });

    it('should clear targeted tokens with empty array', () => {
      const creature = createTestCreature();
      tokenManager.addToken(creature);
      tokenManager.setTargetedTokens([creature.id]);
      tokenManager.setTargetedTokens([]);

      // Targets should be cleared
    });
  });

  describe('Animation Methods', () => {
    it('should play damage flash without error', () => {
      const creature = createTestCreature();
      tokenManager.addToken(creature);

      expect(() => tokenManager.playDamageFlash(creature.id)).not.toThrow();
    });

    it('should play healing flash without error', () => {
      const creature = createTestCreature();
      tokenManager.addToken(creature);

      expect(() => tokenManager.playHealingFlash(creature.id)).not.toThrow();
    });

    it('should play spawn animation without error', () => {
      const creature = createTestCreature();
      tokenManager.addToken(creature);

      expect(() => tokenManager.playSpawnAnimation(creature.id)).not.toThrow();
    });

    it('should play death animation and return promise', async () => {
      const creature = createTestCreature();
      tokenManager.addToken(creature);

      const promise = tokenManager.playDeathAnimation(creature.id);
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe('Token Lookup', () => {
    it('should return all token IDs', () => {
      tokenManager.addToken(createTestCreature({ id: 'a' }));
      tokenManager.addToken(createTestCreature({ id: 'b' }));
      tokenManager.addToken(createTestCreature({ id: 'c' }));

      const ids = tokenManager.getAllTokenIds();
      expect(ids).toHaveLength(3);
      expect(ids).toContain('a');
      expect(ids).toContain('b');
      expect(ids).toContain('c');
    });
  });
});
