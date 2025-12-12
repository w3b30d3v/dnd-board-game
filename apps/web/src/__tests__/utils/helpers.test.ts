import { describe, it, expect } from 'vitest';

// Test utility functions that are commonly used

describe('Title Case Formatting', () => {
  // Helper function matching the one in CharacterDetailsContent
  function toTitleCase(str: string): string {
    return str.split(/[-_\s]+/).map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  it('should convert lowercase to title case', () => {
    expect(toTitleCase('dwarf')).toBe('Dwarf');
  });

  it('should convert uppercase to title case', () => {
    expect(toTitleCase('BARBARIAN')).toBe('Barbarian');
  });

  it('should handle hyphenated words', () => {
    expect(toTitleCase('half-elf')).toBe('Half Elf');
  });

  it('should handle underscored words', () => {
    expect(toTitleCase('folk_hero')).toBe('Folk Hero');
  });

  it('should handle multiple words', () => {
    expect(toTitleCase('mountain dwarf')).toBe('Mountain Dwarf');
  });

  it('should handle mixed case input', () => {
    expect(toTitleCase('hIgH ELf')).toBe('High Elf');
  });
});

describe('Modifier Calculation', () => {
  // D&D 5e ability modifier formula
  function calculateModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  it('should return -5 for score of 1', () => {
    expect(calculateModifier(1)).toBe(-5);
  });

  it('should return -1 for score of 8', () => {
    expect(calculateModifier(8)).toBe(-1);
  });

  it('should return 0 for score of 10', () => {
    expect(calculateModifier(10)).toBe(0);
  });

  it('should return 0 for score of 11', () => {
    expect(calculateModifier(11)).toBe(0);
  });

  it('should return +1 for score of 12', () => {
    expect(calculateModifier(12)).toBe(1);
  });

  it('should return +2 for score of 14', () => {
    expect(calculateModifier(14)).toBe(2);
  });

  it('should return +3 for score of 16', () => {
    expect(calculateModifier(16)).toBe(3);
  });

  it('should return +4 for score of 18', () => {
    expect(calculateModifier(18)).toBe(4);
  });

  it('should return +5 for score of 20', () => {
    expect(calculateModifier(20)).toBe(5);
  });
});

describe('Proficiency Bonus Calculation', () => {
  // D&D 5e proficiency bonus formula
  function calculateProficiencyBonus(level: number): number {
    return Math.floor((level - 1) / 4) + 2;
  }

  it('should return +2 for levels 1-4', () => {
    expect(calculateProficiencyBonus(1)).toBe(2);
    expect(calculateProficiencyBonus(2)).toBe(2);
    expect(calculateProficiencyBonus(3)).toBe(2);
    expect(calculateProficiencyBonus(4)).toBe(2);
  });

  it('should return +3 for levels 5-8', () => {
    expect(calculateProficiencyBonus(5)).toBe(3);
    expect(calculateProficiencyBonus(6)).toBe(3);
    expect(calculateProficiencyBonus(7)).toBe(3);
    expect(calculateProficiencyBonus(8)).toBe(3);
  });

  it('should return +4 for levels 9-12', () => {
    expect(calculateProficiencyBonus(9)).toBe(4);
    expect(calculateProficiencyBonus(12)).toBe(4);
  });

  it('should return +5 for levels 13-16', () => {
    expect(calculateProficiencyBonus(13)).toBe(5);
    expect(calculateProficiencyBonus(16)).toBe(5);
  });

  it('should return +6 for levels 17-20', () => {
    expect(calculateProficiencyBonus(17)).toBe(6);
    expect(calculateProficiencyBonus(20)).toBe(6);
  });
});

describe('Hit Points Calculation', () => {
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

  function calculateMaxHP(characterClass: string, level: number, constitutionModifier: number): number {
    const hitDice = CLASS_HIT_DICE[characterClass.toLowerCase()] || 8;
    // Level 1: max hit dice + CON mod
    // Each additional level: avg (hit dice / 2 + 1) + CON mod
    const level1HP = hitDice + constitutionModifier;
    const additionalHP = (level - 1) * (Math.floor(hitDice / 2) + 1 + constitutionModifier);
    return level1HP + additionalHP;
  }

  it('should calculate level 1 barbarian HP correctly', () => {
    // Barbarian d12, CON mod +2
    expect(calculateMaxHP('barbarian', 1, 2)).toBe(14); // 12 + 2
  });

  it('should calculate level 1 wizard HP correctly', () => {
    // Wizard d6, CON mod +1
    expect(calculateMaxHP('wizard', 1, 1)).toBe(7); // 6 + 1
  });

  it('should calculate level 5 fighter HP correctly', () => {
    // Fighter d10, CON mod +2
    // Level 1: 10 + 2 = 12
    // Levels 2-5: 4 * (5 + 1 + 2) = 4 * 8 = 32
    expect(calculateMaxHP('fighter', 5, 2)).toBe(44); // 12 + 32
  });
});
