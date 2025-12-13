/**
 * CombatManager Tests
 * Tests for the combat system that integrates rules-engine with the game board
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CombatManager, type CreatureCombatStats, type CombatEvent } from '../../game/CombatManager';
import type { Creature } from '../../game/types';

// Mock the rules engine to control dice rolls
vi.mock('@dnd/rules-engine', () => ({
  roll: vi.fn(() => ({ total: 10, dice: [4, 6], modifier: 0 })),
  rollD20: vi.fn(() => ({ total: 15, dice: [15], modifier: 0 })),
  rollWithAdvantage: vi.fn(() => ({
    total: 18,
    dice: [18, 12],
    modifier: 0,
    isNatural20: false,
    isNatural1: false,
  })),
  rollWithDisadvantage: vi.fn(() => ({
    total: 8,
    dice: [14, 8],
    modifier: 0,
    isNatural20: false,
    isNatural1: false,
  })),
  resolveAttackWithConditions: vi.fn(() => ({
    hit: true,
    roll: 15,
    total: 18,
    isCritical: false,
    isCriticalMiss: false,
  })),
  calculateDamage: vi.fn(() => ({
    baseDamage: 8,
    finalDamage: 8,
    isCritical: false,
    wasResisted: false,
    wasVulnerable: false,
    wasImmune: false,
  })),
  applyDamage: vi.fn((currentHP, _maxHP, _tempHP, damage) => ({
    newHP: Math.max(0, currentHP - damage),
    newTempHP: 0,
    excessDamage: Math.max(0, damage - currentHP),
  })),
  applyHealing: vi.fn((currentHP, maxHP, amount) => Math.min(maxHP, currentHP + amount)),
  checkInstantDeath: vi.fn(() => false),
  rollInitiative: vi.fn(() => ({ roll: 14, total: 16, modifier: 2 })),
  sortByInitiative: vi.fn((combatants) =>
    combatants.sort((a: { initiative: number }, b: { initiative: number }) => b.initiative - a.initiative)
  ),
  rollDeathSave: vi.fn(() => ({ roll: 12, isNatural20: false, isNatural1: false })),
  processDeathSave: vi.fn((successes, failures, _result) => ({
    successes: successes + 1,
    failures,
    stabilized: successes + 1 >= 3,
    dead: false,
    regainedConsciousness: false,
  })),
  resolveAbilityCheck: vi.fn(() => ({
    success: true,
    roll: 14,
    total: 17,
    modifier: 3,
    isNatural20: false,
    isNatural1: false,
  })),
  resolveSavingThrow: vi.fn(() => ({
    success: true,
    roll: 15,
    total: 18,
    modifier: 3,
    isNatural20: false,
    isNatural1: false,
  })),
  calculatePassiveScore: vi.fn(() => 14),
  getSkillAbility: vi.fn(() => 'WIS'),
  calculateSpellSaveDC: vi.fn(() => 15),
  calculateSpellAttackBonus: vi.fn(() => 7),
  resolveConcentrationCheck: vi.fn(() => ({ success: true, dc: 10, total: 15 })),
  getAoETiles: vi.fn(() => [
    { x: 5, y: 5 },
    { x: 5, y: 6 },
    { x: 6, y: 5 },
  ]),
  getCantripDamageDice: vi.fn(() => '2d8'),
  getConditionEffects: vi.fn(() => ({
    name: 'Poisoned',
    effects: ['Disadvantage on attack rolls', 'Disadvantage on ability checks'],
  })),
}));

describe('CombatManager', () => {
  let combatManager: CombatManager;
  let mockCreature: Creature;
  let mockStats: CreatureCombatStats;
  let events: CombatEvent[];

  beforeEach(() => {
    combatManager = new CombatManager();
    events = [];

    // Subscribe to events
    combatManager.onEvent((event) => {
      events.push(event);
    });

    mockCreature = {
      id: 'fighter-1',
      name: 'Test Fighter',
      type: 'character',
      position: { x: 5, y: 5 },
      size: 'medium',
      currentHitPoints: 45,
      maxHitPoints: 50,
      tempHitPoints: 5,
      armorClass: 18,
      speed: 30,
      conditions: [],
      isConcentrating: false,
      isVisible: true,
      isHidden: false,
    };

    mockStats = {
      strengthMod: 3,
      dexterityMod: 2,
      constitutionMod: 2,
      intelligenceMod: 0,
      wisdomMod: 1,
      charismaMod: -1,
      proficiencyBonus: 3,
      attackBonus: 6,
      saveProficiencies: ['STR', 'CON'],
      resistances: [],
      vulnerabilities: [],
      immunities: [],
    };
  });

  describe('Creature Registration', () => {
    it('should register a creature with stats', () => {
      combatManager.registerCreature(mockCreature, mockStats);

      expect(combatManager.getCreature(mockCreature.id)).toEqual(mockCreature);
      expect(combatManager.getCreatureStats(mockCreature.id)).toEqual(mockStats);
    });

    it('should unregister a creature', () => {
      combatManager.registerCreature(mockCreature, mockStats);
      combatManager.unregisterCreature(mockCreature.id);

      expect(combatManager.getCreature(mockCreature.id)).toBeUndefined();
      expect(combatManager.getCreatureStats(mockCreature.id)).toBeUndefined();
    });

    it('should update creature data', () => {
      combatManager.registerCreature(mockCreature, mockStats);

      const updatedCreature = { ...mockCreature, currentHitPoints: 30 };
      combatManager.updateCreature(updatedCreature);

      expect(combatManager.getCreature(mockCreature.id)?.currentHitPoints).toBe(30);
    });
  });

  describe('Dice Rolling', () => {
    it('should roll dice and emit event', () => {
      const result = combatManager.rollDice('2d6');

      expect(result.total).toBe(10);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('dice_roll');
    });

    it('should roll d20 with modifier', () => {
      const result = combatManager.rollD20(3);

      expect(result.total).toBe(15);
      expect(events[0].type).toBe('dice_roll');
    });

    it('should roll with advantage', () => {
      const result = combatManager.rollWithAdvantage(2);

      expect(result.total).toBe(18);
      expect(result.bothRolls).toHaveLength(2);
    });

    it('should roll with disadvantage', () => {
      const result = combatManager.rollWithDisadvantage(2);

      expect(result.total).toBe(8);
      expect(result.bothRolls).toHaveLength(2);
    });
  });

  describe('Attack Resolution', () => {
    let targetCreature: Creature;
    let targetStats: CreatureCombatStats;

    beforeEach(() => {
      targetCreature = {
        ...mockCreature,
        id: 'goblin-1',
        name: 'Goblin',
        type: 'monster',
        armorClass: 15,
        currentHitPoints: 7,
        maxHitPoints: 7,
      };

      targetStats = {
        ...mockStats,
        strengthMod: -1,
        dexterityMod: 2,
        attackBonus: 4,
      };

      combatManager.registerCreature(mockCreature, mockStats);
      combatManager.registerCreature(targetCreature, targetStats);
    });

    it('should resolve an attack', () => {
      const result = combatManager.attack(mockCreature.id, targetCreature.id);

      expect(result.hit).toBe(true);
      expect(events.some((e) => e.type === 'attack')).toBe(true);
    });

    it('should throw if attacker not found', () => {
      expect(() => combatManager.attack('unknown', targetCreature.id)).toThrow('Attacker or target not found');
    });

    it('should throw if target not found', () => {
      expect(() => combatManager.attack(mockCreature.id, 'unknown')).toThrow('Attacker or target not found');
    });
  });

  describe('Damage and Healing', () => {
    beforeEach(() => {
      combatManager.registerCreature(mockCreature, mockStats);
    });

    it('should deal damage and emit event', () => {
      const result = combatManager.dealDamage(mockCreature.id, '2d6', 'SLASHING');

      expect(result.finalDamage).toBe(8);
      expect(events.some((e) => e.type === 'damage')).toBe(true);
    });

    it('should heal and emit event', () => {
      const damagedCreature = { ...mockCreature, currentHitPoints: 30 };
      combatManager.updateCreature(damagedCreature);

      const result = combatManager.heal(mockCreature.id, 10);

      expect(result.newHP).toBe(40);
      expect(result.actualHealing).toBe(10);
      expect(events.some((e) => e.type === 'healing')).toBe(true);
    });

    it('should not heal above max HP', () => {
      const result = combatManager.heal(mockCreature.id, 100);

      expect(result.newHP).toBe(50); // capped at maxHitPoints
    });

    it('should throw if target not found for damage', () => {
      expect(() => combatManager.dealDamage('unknown', '2d6', 'SLASHING')).toThrow('Target not found');
    });
  });

  describe('Initiative', () => {
    let creature2: Creature;
    let stats2: CreatureCombatStats;

    beforeEach(() => {
      creature2 = {
        ...mockCreature,
        id: 'wizard-1',
        name: 'Wizard',
        dexterityMod: 1,
      };

      stats2 = {
        ...mockStats,
        dexterityMod: 1,
      };

      combatManager.registerCreature(mockCreature, mockStats);
      combatManager.registerCreature(creature2, stats2);
    });

    it('should roll initiative for all creatures', () => {
      const result = combatManager.rollInitiativeForAll();

      expect(result.order).toHaveLength(2);
      expect(result.results.size).toBe(2);
      expect(events.some((e) => e.type === 'initiative')).toBe(true);
    });

    it('should track current turn', () => {
      combatManager.rollInitiativeForAll();

      expect(combatManager.getCurrentTurnCreature()).toBeTruthy();
      expect(combatManager.isInCombatMode()).toBe(true);
    });

    it('should advance to next turn', () => {
      combatManager.rollInitiativeForAll();
      const firstTurn = combatManager.getCurrentTurnCreature();

      combatManager.nextTurn();
      const secondTurn = combatManager.getCurrentTurnCreature();

      expect(firstTurn).not.toBe(secondTurn);
    });

    it('should wrap around and increment round', () => {
      combatManager.rollInitiativeForAll();

      combatManager.nextTurn();
      combatManager.nextTurn();

      expect(combatManager.getCurrentRound()).toBe(2);
    });

    it('should end combat', () => {
      combatManager.rollInitiativeForAll();
      combatManager.endCombat();

      expect(combatManager.isInCombatMode()).toBe(false);
      expect(combatManager.getInitiativeOrder()).toHaveLength(0);
    });
  });

  describe('Saving Throws', () => {
    beforeEach(() => {
      combatManager.registerCreature(mockCreature, mockStats);
    });

    it('should make a saving throw', () => {
      const result = combatManager.makeSavingThrow(mockCreature.id, 'CON', 15);

      expect(result.success).toBe(true);
      expect(result.total).toBe(18);
      expect(events.some((e) => e.type === 'dice_roll')).toBe(true);
    });

    it('should throw if creature not found', () => {
      expect(() => combatManager.makeSavingThrow('unknown', 'CON', 15)).toThrow('Creature not found');
    });
  });

  describe('Concentration', () => {
    beforeEach(() => {
      const concentratingCreature = { ...mockCreature, isConcentrating: true, concentrationSpellId: 'bless' };
      combatManager.registerCreature(concentratingCreature, mockStats);
    });

    it('should check concentration when taking damage', () => {
      const result = combatManager.checkConcentration(mockCreature.id, 10, 'Bless');

      expect(result.success).toBe(true);
      expect(result.dc).toBe(10);
      expect(events.some((e) => e.type === 'concentration')).toBe(true);
    });

    it('should throw if creature not concentrating', () => {
      combatManager.registerCreature({ ...mockCreature, isConcentrating: false }, mockStats);

      expect(() => combatManager.checkConcentration(mockCreature.id, 10, 'Bless')).toThrow(
        'Creature not concentrating or not found'
      );
    });
  });

  describe('Death Saves', () => {
    beforeEach(() => {
      combatManager.registerCreature(mockCreature, mockStats);
    });

    it('should make a death save', () => {
      const result = combatManager.makeDeathSave(mockCreature.id);

      expect(result.roll).toBe(12);
      expect(result.totalSuccesses).toBe(1);
      expect(events.some((e) => e.type === 'dice_roll')).toBe(true);
    });

    it('should throw if creature not found', () => {
      expect(() => combatManager.makeDeathSave('unknown')).toThrow('Creature not found');
    });
  });

  describe('Spell Utilities', () => {
    beforeEach(() => {
      const spellcaster = {
        ...mockStats,
        spellcastingAbility: 'INT' as const,
        spellcastingMod: 4,
      };
      combatManager.registerCreature(mockCreature, spellcaster);
    });

    it('should calculate spell save DC', () => {
      const dc = combatManager.getSpellSaveDC(mockCreature.id);
      expect(dc).toBe(15);
    });

    it('should calculate spell attack bonus', () => {
      const bonus = combatManager.getSpellAttackBonus(mockCreature.id);
      expect(bonus).toBe(7);
    });

    it('should get AoE affected tiles', () => {
      const tiles = combatManager.getAoEAffectedTiles('SPHERE', { x: 5, y: 5 }, { radius: 20 });
      expect(tiles).toHaveLength(3);
    });

    it('should get cantrip damage scaling', () => {
      const damage = combatManager.getCantripDamage('1d8', 11);
      expect(damage).toBe('2d8');
    });
  });

  describe('Ability Checks', () => {
    beforeEach(() => {
      combatManager.registerCreature(mockCreature, mockStats);
    });

    it('should make an ability check', () => {
      const result = combatManager.makeAbilityCheck(mockCreature.id, 'STR', 15);

      expect(result.success).toBe(true);
      expect(result.total).toBe(17);
    });

    it('should make a skill check', () => {
      const result = combatManager.makeAbilityCheck(mockCreature.id, 'WIS', 12, { skill: 'Perception' });

      expect(result.success).toBe(true);
    });

    it('should get passive score', () => {
      const passive = combatManager.getPassiveScore(mockCreature.id, 'Perception');
      expect(passive).toBe(14);
    });
  });

  describe('Conditions', () => {
    beforeEach(() => {
      combatManager.registerCreature(mockCreature, mockStats);
    });

    it('should get condition effects', () => {
      const effects = combatManager.getConditionEffects('POISONED');
      expect(effects.name).toBe('Poisoned');
    });

    it('should add a condition', () => {
      combatManager.addCondition(mockCreature.id, 'POISONED');

      const creature = combatManager.getCreature(mockCreature.id);
      expect(creature?.conditions).toContain('POISONED');
    });

    it('should not add duplicate conditions', () => {
      combatManager.addCondition(mockCreature.id, 'POISONED');
      combatManager.addCondition(mockCreature.id, 'POISONED');

      const creature = combatManager.getCreature(mockCreature.id);
      expect(creature?.conditions.filter((c) => c === 'POISONED')).toHaveLength(1);
    });

    it('should remove a condition', () => {
      combatManager.addCondition(mockCreature.id, 'POISONED');
      combatManager.removeCondition(mockCreature.id, 'POISONED');

      const creature = combatManager.getCreature(mockCreature.id);
      expect(creature?.conditions).not.toContain('POISONED');
    });
  });

  describe('Event System', () => {
    it('should allow subscribing and unsubscribing from events', () => {
      const handler = vi.fn();
      const unsubscribe = combatManager.onEvent(handler);

      combatManager.rollDice('1d6');
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      combatManager.rollDice('1d6');
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
  });

  describe('Cleanup', () => {
    it('should destroy and clean up resources', () => {
      combatManager.registerCreature(mockCreature, mockStats);
      combatManager.rollInitiativeForAll();

      combatManager.destroy();

      expect(combatManager.getCreature(mockCreature.id)).toBeUndefined();
      expect(combatManager.getInitiativeOrder()).toHaveLength(0);
    });
  });
});
