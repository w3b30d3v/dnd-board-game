// Game constants
export const GRID_CELL_SIZE = 5; // 5 feet per cell (standard D&D grid)
export const MAX_LEVEL = 20;
export const PROFICIENCY_BY_LEVEL = [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6];

// Ability score modifiers
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Proficiency bonus by level
export function getProficiencyBonus(level: number): number {
  if (level < 1 || level > 20) {
    throw new Error('Level must be between 1 and 20');
  }
  return PROFICIENCY_BY_LEVEL[level - 1] ?? 2;
}

// Experience thresholds by level
export const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000,
  195000, 225000, 265000, 305000, 355000,
];

// Size categories
export const SIZE_SPACE = {
  tiny: 2.5,
  small: 5,
  medium: 5,
  large: 10,
  huge: 15,
  gargantuan: 20,
} as const;

// Base movement speeds
export const BASE_SPEED = {
  dragonborn: 30,
  dwarf: 25,
  elf: 30,
  gnome: 25,
  halfElf: 30,
  halfOrc: 30,
  halfling: 25,
  human: 30,
  tiefling: 30,
} as const;
