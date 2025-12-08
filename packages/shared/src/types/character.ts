import { z } from 'zod';

// Ability scores
export const AbilitySchema = z.enum([
  'STR',
  'DEX',
  'CON',
  'INT',
  'WIS',
  'CHA',
]);

export type Ability = z.infer<typeof AbilitySchema>;

export const AbilityScoresSchema = z.object({
  strength: z.number().int().min(1).max(30),
  dexterity: z.number().int().min(1).max(30),
  constitution: z.number().int().min(1).max(30),
  intelligence: z.number().int().min(1).max(30),
  wisdom: z.number().int().min(1).max(30),
  charisma: z.number().int().min(1).max(30),
});

export type AbilityScores = z.infer<typeof AbilityScoresSchema>;

// Skills
export const SkillSchema = z.enum([
  'acrobatics',
  'animalHandling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleightOfHand',
  'stealth',
  'survival',
]);

export type Skill = z.infer<typeof SkillSchema>;

// Character class
export const CharacterClassSchema = z.enum([
  'barbarian',
  'bard',
  'cleric',
  'druid',
  'fighter',
  'monk',
  'paladin',
  'ranger',
  'rogue',
  'sorcerer',
  'warlock',
  'wizard',
]);

export type CharacterClass = z.infer<typeof CharacterClassSchema>;

// Race
export const RaceSchema = z.enum([
  'dragonborn',
  'dwarf',
  'elf',
  'gnome',
  'halfElf',
  'halfOrc',
  'halfling',
  'human',
  'tiefling',
]);

export type Race = z.infer<typeof RaceSchema>;

// Character schema
export const CharacterSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  name: z.string().min(1).max(100),
  race: RaceSchema,
  subrace: z.string().optional(),
  class: CharacterClassSchema,
  subclass: z.string().optional(),
  background: z.string(),
  level: z.number().int().min(1).max(20),
  experiencePoints: z.number().int().min(0),
  ...AbilityScoresSchema.shape,
  maxHitPoints: z.number().int().positive(),
  currentHitPoints: z.number().int(),
  tempHitPoints: z.number().int().default(0),
  armorClass: z.number().int().positive(),
  initiative: z.number().int(),
  speed: z.number().int().positive(),
  proficiencyBonus: z.number().int().positive(),
  savingThrows: z.array(AbilitySchema),
  skills: z.array(SkillSchema),
  languages: z.array(z.string()),
  portraitUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Character = z.infer<typeof CharacterSchema>;
