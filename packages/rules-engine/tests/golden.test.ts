/**
 * RAW 5e Golden Tests
 * These tests verify that the rules engine correctly implements
 * D&D 5th Edition Rules As Written (RAW)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Dice
  setSeed,
  roll,
  rollD20,
  rollWithAdvantage,
  rollWithDisadvantage,
  calculateModifier,

  // Abilities
  resolveAbilityCheck,
  resolveSavingThrow,
  calculatePassiveScore,

  // Combat
  resolveAttack,
  resolveAttackWithConditions,
  calculateDamage,
  applyDamage,
  applyHealing,
  checkInstantDeath,
  rollDeathSave,
  processDeathSave,

  // Conditions
  getConditionEffects,

  // Spells
  calculateSpellSaveDC,
  resolveConcentrationCheck,
  getAoETiles,
  getFullCasterSlots,
  getCantripDamageDice,
} from '../src';

describe('RAW 5e Golden Tests', () => {
  beforeEach(() => {
    // Reset seed before each test for deterministic behavior
    setSeed(null);
  });

  describe('Dice Rolling', () => {
    it('calculates ability modifier correctly (score 10 = +0)', () => {
      expect(calculateModifier(10)).toBe(0);
      expect(calculateModifier(11)).toBe(0);
    });

    it('calculates ability modifier correctly (score 14 = +2)', () => {
      expect(calculateModifier(14)).toBe(2);
      expect(calculateModifier(15)).toBe(2);
    });

    it('calculates ability modifier correctly (score 8 = -1)', () => {
      expect(calculateModifier(8)).toBe(-1);
      expect(calculateModifier(9)).toBe(-1);
    });

    it('calculates ability modifier correctly (score 20 = +5)', () => {
      expect(calculateModifier(20)).toBe(5);
    });

    it('calculates ability modifier correctly (score 1 = -5)', () => {
      expect(calculateModifier(1)).toBe(-5);
    });

    it('parses and rolls dice formula correctly', () => {
      const result = roll('2d6+3', 8); // Override total to 8
      expect(result.total).toBe(11); // 8 + 3 modifier
      expect(result.modifier).toBe(3);
      expect(result.formula).toBe('2d6+3');
    });

    it('advantage takes higher of two rolls', () => {
      const result = rollWithAdvantage(0, [8, 15]);
      expect(result.used).toBe(15);
      expect(result.hadAdvantage).toBe(true);
      expect(result.total).toBe(15);
    });

    it('disadvantage takes lower of two rolls', () => {
      const result = rollWithDisadvantage(0, [8, 15]);
      expect(result.used).toBe(8);
      expect(result.hadDisadvantage).toBe(true);
      expect(result.total).toBe(8);
    });

    it('detects natural 20', () => {
      const result = rollD20(0, 20);
      expect(result.isNatural20).toBe(true);
      expect(result.isNatural1).toBe(false);
    });

    it('detects natural 1', () => {
      const result = rollD20(0, 1);
      expect(result.isNatural1).toBe(true);
      expect(result.isNatural20).toBe(false);
    });
  });

  describe('Ability Checks', () => {
    it('STR check with +3 modifier against DC 15 (roll 12 = success)', () => {
      const result = resolveAbilityCheck({
        ability: 'STR',
        modifier: 3,
        dc: 15,
        roll: 12, // 12 + 3 = 15 >= 15
      });
      expect(result.success).toBe(true);
      expect(result.total).toBe(15);
    });

    it('STR check with +3 modifier against DC 15 (roll 11 = fail)', () => {
      const result = resolveAbilityCheck({
        ability: 'STR',
        modifier: 3,
        dc: 15,
        roll: 11, // 11 + 3 = 14 < 15
      });
      expect(result.success).toBe(false);
      expect(result.total).toBe(14);
    });

    it('adds proficiency bonus when proficient', () => {
      const result = resolveAbilityCheck({
        ability: 'DEX',
        modifier: 2,
        dc: 15,
        proficient: true,
        proficiencyBonus: 3,
        roll: 10, // 10 + 2 + 3 = 15
      });
      expect(result.total).toBe(15);
      expect(result.success).toBe(true);
    });

    it('calculates passive score correctly', () => {
      // 10 + modifier
      expect(calculatePassiveScore(3)).toBe(13);
      // With proficiency
      expect(calculatePassiveScore(3, true, 2)).toBe(15);
      // With advantage (+5)
      expect(calculatePassiveScore(3, false, 0, true)).toBe(18);
      // With disadvantage (-5)
      expect(calculatePassiveScore(3, false, 0, false, true)).toBe(8);
    });
  });

  describe('Saving Throws', () => {
    it('paralyzed creature auto-fails STR saves', () => {
      const result = resolveSavingThrow({
        ability: 'STR',
        modifier: 5,
        dc: 10,
        conditions: ['PARALYZED'],
        roll: 20, // Even a 20 fails
      });
      expect(result.autoFail).toBe(true);
      expect(result.success).toBe(false);
    });

    it('paralyzed creature auto-fails DEX saves', () => {
      const result = resolveSavingThrow({
        ability: 'DEX',
        modifier: 5,
        dc: 10,
        conditions: ['PARALYZED'],
      });
      expect(result.autoFail).toBe(true);
      expect(result.success).toBe(false);
    });

    it('stunned creature auto-fails STR/DEX saves', () => {
      const strResult = resolveSavingThrow({
        ability: 'STR',
        modifier: 5,
        dc: 10,
        conditions: ['STUNNED'],
      });
      expect(strResult.autoFail).toBe(true);

      const dexResult = resolveSavingThrow({
        ability: 'DEX',
        modifier: 5,
        dc: 10,
        conditions: ['STUNNED'],
      });
      expect(dexResult.autoFail).toBe(true);
    });

    it('paralyzed creature CAN make WIS saves', () => {
      const result = resolveSavingThrow({
        ability: 'WIS',
        modifier: 3,
        dc: 12,
        conditions: ['PARALYZED'],
        roll: 10, // 10 + 3 = 13 >= 12
      });
      expect(result.autoFail).toBeUndefined();
      expect(result.success).toBe(true);
    });
  });

  describe('Attack Rolls', () => {
    it('attack roll vs AC hits when total >= AC', () => {
      const result = resolveAttack({
        attackBonus: 5,
        targetAC: 15,
        roll: 12, // 12 + 5 = 17 >= 15
      });
      expect(result.hits).toBe(true);
      expect(result.total).toBe(17);
    });

    it('attack roll vs AC misses when total < AC', () => {
      const result = resolveAttack({
        attackBonus: 5,
        targetAC: 15,
        roll: 8, // 8 + 5 = 13 < 15
      });
      expect(result.hits).toBe(false);
    });

    it('natural 20 always hits regardless of AC', () => {
      const result = resolveAttack({
        attackBonus: -5,
        targetAC: 30,
        roll: 20,
      });
      expect(result.hits).toBe(true);
      expect(result.isCritical).toBe(true);
    });

    it('natural 1 always misses regardless of bonus', () => {
      const result = resolveAttack({
        attackBonus: 20,
        targetAC: 5,
        roll: 1,
      });
      expect(result.hits).toBe(false);
      expect(result.isCriticalMiss).toBe(true);
    });

    it('attacks against paralyzed within 5ft auto-crit', () => {
      const result = resolveAttackWithConditions(
        { attackBonus: 5, targetAC: 15, roll: 10 },
        [],
        ['PARALYZED'],
        true // within 5ft
      );
      expect(result.hits).toBe(true);
      expect(result.isCritical).toBe(true);
    });

    it('attacks against paralyzed have advantage', () => {
      const effects = getConditionEffects('PARALYZED');
      expect(effects.attacksAgainstHaveAdvantage).toBe(true);
    });
  });

  describe('Damage Calculation', () => {
    it('calculates base damage correctly', () => {
      const result = calculateDamage({
        dice: '3d6',
        type: 'FIRE',
        roll: 12,
      });
      expect(result.baseDamage).toBe(12);
      expect(result.finalDamage).toBe(12);
    });

    it('fire damage halved with fire resistance', () => {
      const result = calculateDamage(
        { dice: '3d6', type: 'FIRE', roll: 12 },
        { resistances: ['FIRE'] }
      );
      expect(result.baseDamage).toBe(12);
      expect(result.finalDamage).toBe(6); // Halved, rounded down
      expect(result.wasResisted).toBe(true);
    });

    it('fire damage doubled with fire vulnerability', () => {
      const result = calculateDamage(
        { dice: '3d6', type: 'FIRE', roll: 12 },
        { vulnerabilities: ['FIRE'] }
      );
      expect(result.baseDamage).toBe(12);
      expect(result.finalDamage).toBe(24); // Doubled
      expect(result.wasVulnerable).toBe(true);
    });

    it('fire damage is 0 with fire immunity', () => {
      const result = calculateDamage(
        { dice: '3d6', type: 'FIRE', roll: 12 },
        { immunities: ['FIRE'] }
      );
      expect(result.finalDamage).toBe(0);
      expect(result.wasImmune).toBe(true);
    });

    it('resistance rounds down (11 damage = 5 resisted)', () => {
      const result = calculateDamage(
        { dice: '2d6', type: 'COLD', roll: 11 },
        { resistances: ['COLD'] }
      );
      expect(result.finalDamage).toBe(5); // 11/2 = 5.5, rounded down
    });
  });

  describe('Hit Points', () => {
    it('temp HP absorbs damage first', () => {
      const result = applyDamage(20, 20, 5, 8);
      expect(result.newTempHP).toBe(0); // 5 temp HP absorbed
      expect(result.newHP).toBe(17); // 20 - (8-5) = 17
    });

    it('HP cannot go below 0', () => {
      const result = applyDamage(5, 20, 0, 10);
      expect(result.newHP).toBe(0);
      expect(result.excessDamage).toBe(5);
    });

    it('healing cannot exceed max HP', () => {
      const result = applyHealing(15, 20, 10);
      expect(result).toBe(20); // Capped at max
    });

    it('massive damage causes instant death', () => {
      // PC with 20 max HP takes 45 damage at 5 HP
      // Excess damage = 45 - 5 = 40, which is >= 20 max HP
      const { excessDamage } = applyDamage(5, 20, 0, 45);
      expect(checkInstantDeath(20, excessDamage)).toBe(true);
    });

    it('massive damage threshold (exactly equal)', () => {
      // Exactly at threshold should still cause instant death
      const { excessDamage } = applyDamage(5, 20, 0, 25);
      expect(excessDamage).toBe(20);
      expect(checkInstantDeath(20, excessDamage)).toBe(true);
    });
  });

  describe('Death Saves', () => {
    it('roll >= 10 is a success', () => {
      const result = rollDeathSave(10);
      expect(result.successes).toBe(1);
      expect(result.failures).toBe(0);
    });

    it('roll < 10 is a failure', () => {
      const result = rollDeathSave(9);
      expect(result.successes).toBe(0);
      expect(result.failures).toBe(1);
    });

    it('natural 1 is 2 failures', () => {
      const result = rollDeathSave(1);
      expect(result.failures).toBe(2);
    });

    it('natural 20 regains consciousness', () => {
      const result = rollDeathSave(20);
      expect(result.regainedConsciousness).toBe(true);
    });

    it('3 successes stabilizes', () => {
      const result = processDeathSave(2, 1, { roll: 15, successes: 1, failures: 0, stabilized: false, regainedConsciousness: false });
      expect(result.stabilized).toBe(true);
      expect(result.dead).toBe(false);
    });

    it('3 failures causes death', () => {
      const result = processDeathSave(1, 2, { roll: 5, successes: 0, failures: 1, stabilized: false, regainedConsciousness: false });
      expect(result.dead).toBe(true);
    });
  });

  describe('Concentration', () => {
    it('concentration DC is max(10, damage/2)', () => {
      // Low damage: DC 10
      const lowResult = resolveConcentrationCheck({
        damage: 10,
        constitutionMod: 3,
        roll: 8, // 8 + 3 = 11 >= 10
      });
      expect(lowResult.dc).toBe(10);
      expect(lowResult.success).toBe(true);

      // High damage: DC = damage/2
      const highResult = resolveConcentrationCheck({
        damage: 22,
        constitutionMod: 3,
        roll: 8, // 8 + 3 = 11 >= 11 (22/2)
      });
      expect(highResult.dc).toBe(11);
      expect(highResult.success).toBe(true);
    });

    it('concentration check with damage 22 requires DC 11', () => {
      const result = resolveConcentrationCheck({
        damage: 22,
        constitutionMod: 2,
        roll: 8, // 8 + 2 = 10 < 11
      });
      expect(result.dc).toBe(11);
      expect(result.success).toBe(false);
    });
  });

  describe('Spell System', () => {
    it('spell save DC = 8 + proficiency + ability mod', () => {
      const dc = calculateSpellSaveDC({
        proficiencyBonus: 3,
        spellcastingAbilityMod: 4,
      });
      expect(dc).toBe(15); // 8 + 3 + 4
    });

    it('full caster spell slots at level 5', () => {
      const slots = getFullCasterSlots(5);
      expect(slots.level1).toBe(4);
      expect(slots.level2).toBe(3);
      expect(slots.level3).toBe(2);
      expect(slots.level4).toBe(0);
    });

    it('cantrip damage scales at levels 5, 11, 17', () => {
      expect(getCantripDamageDice('1d10', 1)).toBe('1d10');
      expect(getCantripDamageDice('1d10', 5)).toBe('2d10');
      expect(getCantripDamageDice('1d10', 11)).toBe('3d10');
      expect(getCantripDamageDice('1d10', 17)).toBe('4d10');
    });
  });

  describe('Area of Effect', () => {
    it('20ft radius sphere affects correct number of tiles', () => {
      const tiles = getAoETiles({
        shape: 'SPHERE',
        radius: 20,
        origin: { x: 10, y: 10 },
      });
      // 20ft = 4 squares radius
      // Should affect roughly pi * 4^2 = ~50 squares
      expect(tiles.length).toBeGreaterThan(40);
      expect(tiles.length).toBeLessThan(60);
    });

    it('15ft cube affects 9 tiles', () => {
      const tiles = getAoETiles({
        shape: 'CUBE',
        size: 15,
        origin: { x: 0, y: 0 },
      });
      // 15ft = 3 squares, 3x3 = 9 tiles
      expect(tiles.length).toBe(9);
    });

    it('line includes origin', () => {
      const tiles = getAoETiles({
        shape: 'LINE',
        length: 30,
        width: 5,
        origin: { x: 0, y: 0 },
        direction: 0,
      });
      expect(tiles.some(t => t.x === 0 && t.y === 0)).toBe(true);
    });
  });

  describe('Conditions', () => {
    it('blinded gives disadvantage on attacks', () => {
      const effects = getConditionEffects('BLINDED');
      expect(effects.attacksHaveDisadvantage).toBe(true);
    });

    it('blinded gives advantage on attacks against', () => {
      const effects = getConditionEffects('BLINDED');
      expect(effects.attacksAgainstHaveAdvantage).toBe(true);
    });

    it('invisible gives disadvantage on attacks against', () => {
      const effects = getConditionEffects('INVISIBLE');
      expect(effects.attacksAgainstHaveDisadvantage).toBe(true);
    });

    it('poisoned gives disadvantage on attacks and ability checks', () => {
      const effects = getConditionEffects('POISONED');
      expect(effects.attacksHaveDisadvantage).toBe(true);
      expect(effects.abilityChecksHaveDisadvantage).toBe(true);
    });

    it('grappled reduces speed to 0', () => {
      const effects = getConditionEffects('GRAPPLED');
      expect(effects.speedZero).toBe(true);
    });

    it('unconscious drops items and falls prone', () => {
      const effects = getConditionEffects('UNCONSCIOUS');
      expect(effects.dropsHeldItems).toBe(true);
      expect(effects.fallsProne).toBe(true);
    });
  });
});
