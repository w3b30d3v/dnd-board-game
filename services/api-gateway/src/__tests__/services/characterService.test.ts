import { describe, it, expect } from 'vitest';

// D&D 5e character creation logic tests
describe('Character Service Logic', () => {
  describe('Ability Score Validation', () => {
    function isValidAbilityScore(score: number): boolean {
      return Number.isInteger(score) && score >= 1 && score <= 30;
    }

    it('should accept valid ability scores (1-30)', () => {
      expect(isValidAbilityScore(1)).toBe(true);
      expect(isValidAbilityScore(10)).toBe(true);
      expect(isValidAbilityScore(20)).toBe(true);
      expect(isValidAbilityScore(30)).toBe(true);
    });

    it('should reject invalid ability scores', () => {
      expect(isValidAbilityScore(0)).toBe(false);
      expect(isValidAbilityScore(-1)).toBe(false);
      expect(isValidAbilityScore(31)).toBe(false);
      expect(isValidAbilityScore(10.5)).toBe(false);
    });
  });

  describe('Hit Dice by Class', () => {
    const CLASS_HIT_DICE: Record<string, number> = {
      barbarian: 12,
      bard: 8,
      cleric: 8,
      druid: 8,
      fighter: 10,
      monk: 8,
      paladin: 10,
      ranger: 10,
      rogue: 8,
      sorcerer: 6,
      warlock: 8,
      wizard: 6,
    };

    function getHitDice(characterClass: string): number {
      return CLASS_HIT_DICE[characterClass.toLowerCase()] || 8;
    }

    it('should return correct hit dice for each class', () => {
      expect(getHitDice('barbarian')).toBe(12);
      expect(getHitDice('fighter')).toBe(10);
      expect(getHitDice('paladin')).toBe(10);
      expect(getHitDice('cleric')).toBe(8);
      expect(getHitDice('wizard')).toBe(6);
      expect(getHitDice('sorcerer')).toBe(6);
    });

    it('should be case insensitive', () => {
      expect(getHitDice('BARBARIAN')).toBe(12);
      expect(getHitDice('Wizard')).toBe(6);
    });

    it('should return default d8 for unknown classes', () => {
      expect(getHitDice('unknown')).toBe(8);
    });
  });

  describe('Spellcasting Ability by Class', () => {
    const CLASS_SPELLCASTING: Record<string, string | null> = {
      barbarian: null,
      bard: 'charisma',
      cleric: 'wisdom',
      druid: 'wisdom',
      fighter: null,
      monk: null,
      paladin: 'charisma',
      ranger: 'wisdom',
      rogue: null,
      sorcerer: 'charisma',
      warlock: 'charisma',
      wizard: 'intelligence',
    };

    function getSpellcastingAbility(characterClass: string): string | null {
      return CLASS_SPELLCASTING[characterClass.toLowerCase()] || null;
    }

    it('should return correct spellcasting ability', () => {
      expect(getSpellcastingAbility('wizard')).toBe('intelligence');
      expect(getSpellcastingAbility('cleric')).toBe('wisdom');
      expect(getSpellcastingAbility('warlock')).toBe('charisma');
    });

    it('should return null for non-spellcasters', () => {
      expect(getSpellcastingAbility('barbarian')).toBeNull();
      expect(getSpellcastingAbility('fighter')).toBeNull();
      expect(getSpellcastingAbility('rogue')).toBeNull();
    });
  });

  describe('Race Base Speed', () => {
    const RACE_SPEED: Record<string, number> = {
      human: 30,
      elf: 30,
      dwarf: 25,
      halfling: 25,
      dragonborn: 30,
      gnome: 25,
      'half-elf': 30,
      'half-orc': 30,
      tiefling: 30,
    };

    function getBaseSpeed(race: string): number {
      return RACE_SPEED[race.toLowerCase()] || 30;
    }

    it('should return correct base speed for each race', () => {
      expect(getBaseSpeed('human')).toBe(30);
      expect(getBaseSpeed('elf')).toBe(30);
      expect(getBaseSpeed('dwarf')).toBe(25);
      expect(getBaseSpeed('halfling')).toBe(25);
      expect(getBaseSpeed('gnome')).toBe(25);
    });

    it('should handle hyphenated race names', () => {
      expect(getBaseSpeed('half-elf')).toBe(30);
      expect(getBaseSpeed('half-orc')).toBe(30);
    });

    it('should return default 30 for unknown races', () => {
      expect(getBaseSpeed('unknown')).toBe(30);
    });
  });

  describe('Derived Stats Calculation', () => {
    function calculateModifier(score: number): number {
      return Math.floor((score - 10) / 2);
    }

    function calculateDerivedStats(input: {
      class: string;
      race: string;
      constitution: number;
      dexterity: number;
    }) {
      const CLASS_HIT_DICE: Record<string, number> = {
        barbarian: 12, fighter: 10, paladin: 10, ranger: 10,
        bard: 8, cleric: 8, druid: 8, monk: 8, rogue: 8, warlock: 8,
        sorcerer: 6, wizard: 6,
      };
      const RACE_SPEED: Record<string, number> = {
        human: 30, elf: 30, dwarf: 25, halfling: 25, dragonborn: 30,
        gnome: 25, 'half-elf': 30, 'half-orc': 30, tiefling: 30,
      };

      const conMod = calculateModifier(input.constitution);
      const dexMod = calculateModifier(input.dexterity);

      const hitDice = CLASS_HIT_DICE[input.class.toLowerCase()] || 8;
      const maxHitPoints = hitDice + conMod;

      const speed = RACE_SPEED[input.race.toLowerCase()] || 30;
      const proficiencyBonus = 2; // Level 1
      const initiative = dexMod;
      const armorClass = 10 + dexMod;

      return {
        maxHitPoints,
        currentHitPoints: maxHitPoints,
        speed,
        proficiencyBonus,
        initiative,
        armorClass,
      };
    }

    it('should calculate barbarian with high CON correctly', () => {
      const stats = calculateDerivedStats({
        class: 'barbarian',
        race: 'human',
        constitution: 16, // +3 mod
        dexterity: 14,   // +2 mod
      });

      expect(stats.maxHitPoints).toBe(15); // d12 (12) + CON mod (3)
      expect(stats.armorClass).toBe(12);   // 10 + DEX mod (2)
      expect(stats.initiative).toBe(2);    // DEX mod
      expect(stats.speed).toBe(30);        // Human base
    });

    it('should calculate wizard with low CON correctly', () => {
      const stats = calculateDerivedStats({
        class: 'wizard',
        race: 'elf',
        constitution: 10, // +0 mod
        dexterity: 12,   // +1 mod
      });

      expect(stats.maxHitPoints).toBe(6); // d6 (6) + CON mod (0)
      expect(stats.armorClass).toBe(11);  // 10 + DEX mod (1)
      expect(stats.initiative).toBe(1);   // DEX mod
      expect(stats.speed).toBe(30);       // Elf base
    });

    it('should calculate dwarf with low DEX correctly', () => {
      const stats = calculateDerivedStats({
        class: 'cleric',
        race: 'dwarf',
        constitution: 14, // +2 mod
        dexterity: 8,    // -1 mod
      });

      expect(stats.maxHitPoints).toBe(10); // d8 (8) + CON mod (2)
      expect(stats.armorClass).toBe(9);    // 10 + DEX mod (-1)
      expect(stats.initiative).toBe(-1);   // DEX mod
      expect(stats.speed).toBe(25);        // Dwarf base
    });
  });

  describe('Valid Races', () => {
    const VALID_RACES = [
      'human', 'elf', 'dwarf', 'halfling', 'dragonborn',
      'gnome', 'half-elf', 'half-orc', 'tiefling'
    ];

    function isValidRace(race: string): boolean {
      return VALID_RACES.includes(race.toLowerCase());
    }

    it('should accept all PHB races', () => {
      VALID_RACES.forEach(race => {
        expect(isValidRace(race)).toBe(true);
      });
    });

    it('should be case insensitive', () => {
      expect(isValidRace('HUMAN')).toBe(true);
      expect(isValidRace('Elf')).toBe(true);
    });

    it('should reject invalid races', () => {
      expect(isValidRace('invalid')).toBe(false);
      expect(isValidRace('orc')).toBe(false);
    });
  });

  describe('Valid Classes', () => {
    const VALID_CLASSES = [
      'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
      'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'
    ];

    function isValidClass(charClass: string): boolean {
      return VALID_CLASSES.includes(charClass.toLowerCase());
    }

    it('should accept all PHB classes', () => {
      VALID_CLASSES.forEach(charClass => {
        expect(isValidClass(charClass)).toBe(true);
      });
    });

    it('should be case insensitive', () => {
      expect(isValidClass('WIZARD')).toBe(true);
      expect(isValidClass('Paladin')).toBe(true);
    });

    it('should reject invalid classes', () => {
      expect(isValidClass('invalid')).toBe(false);
      expect(isValidClass('mage')).toBe(false);
    });
  });
});
