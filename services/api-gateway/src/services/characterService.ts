import { prisma } from '../lib/prisma.js';

// D&D 5e class data for derived stats
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

const CLASS_SPELLCASTING: Record<string, string | null> = {
  barbarian: null,
  bard: 'charisma',
  cleric: 'wisdom',
  druid: 'wisdom',
  fighter: null, // Eldritch Knight uses intelligence at level 3
  monk: null, // Way of Four Elements uses wisdom at level 3
  paladin: 'charisma',
  ranger: 'wisdom',
  rogue: null, // Arcane Trickster uses intelligence at level 3
  sorcerer: 'charisma',
  warlock: 'charisma',
  wizard: 'intelligence',
};

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

export interface CreateCharacterInput {
  name: string;
  race: string;
  subrace?: string;
  class: string;
  subclass?: string;
  background: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  skills: string[];
  equipment?: unknown[];
  spellsKnown?: string[];
  portraitUrl?: string;
  appearance?: unknown;
}

export interface UpdateCharacterInput {
  name?: string;
  currentHitPoints?: number;
  tempHitPoints?: number;
  equipment?: unknown[];
  spellsPrepared?: string[];
  currency?: unknown;
  portraitUrl?: string;
  appearance?: unknown;
}

function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function calculateDerivedStats(input: CreateCharacterInput) {
  const conMod = calculateModifier(input.constitution);
  const dexMod = calculateModifier(input.dexterity);

  const hitDice = CLASS_HIT_DICE[input.class.toLowerCase()] || 8;
  const maxHitPoints = hitDice + conMod; // Level 1 max HP

  const speed = RACE_SPEED[input.race.toLowerCase()] || 30;
  const proficiencyBonus = 2; // Level 1
  const initiative = dexMod;
  const armorClass = 10 + dexMod; // Base AC without armor

  const spellcastingAbility = CLASS_SPELLCASTING[input.class.toLowerCase()] || null;

  return {
    maxHitPoints,
    currentHitPoints: maxHitPoints,
    speed,
    proficiencyBonus,
    initiative,
    armorClass,
    spellcastingAbility,
  };
}

export class CharacterService {
  async create(userId: string, input: CreateCharacterInput) {
    const derived = calculateDerivedStats(input);

    const character = await prisma.character.create({
      data: {
        userId,
        name: input.name,
        race: input.race.toLowerCase(),
        subrace: input.subrace?.toLowerCase() || null,
        class: input.class.toLowerCase(),
        subclass: input.subclass?.toLowerCase() || null,
        background: input.background.toLowerCase(),
        level: 1,
        experiencePoints: 0,
        strength: input.strength,
        dexterity: input.dexterity,
        constitution: input.constitution,
        intelligence: input.intelligence,
        wisdom: input.wisdom,
        charisma: input.charisma,
        maxHitPoints: derived.maxHitPoints,
        currentHitPoints: derived.currentHitPoints,
        tempHitPoints: 0,
        armorClass: derived.armorClass,
        initiative: derived.initiative,
        speed: derived.speed,
        proficiencyBonus: derived.proficiencyBonus,
        savingThrows: [],
        skills: input.skills || [],
        tools: [],
        weapons: [],
        armor: [],
        languages: ['common'],
        features: [],
        traits: [],
        spellcastingAbility: derived.spellcastingAbility,
        spellSlots: null,
        spellsKnown: input.spellsKnown || [],
        spellsPrepared: [],
        equipment: input.equipment || [],
        currency: { cp: 0, sp: 0, gp: 0, pp: 0 },
        portraitUrl: input.portraitUrl || null,
        appearance: input.appearance || null,
        isPublic: false,
      },
    });

    return character;
  }

  async findById(id: string, userId: string) {
    const character = await prisma.character.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { isPublic: true },
        ],
      },
    });

    return character;
  }

  async findByUser(userId: string) {
    const characters = await prisma.character.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return characters;
  }

  async update(id: string, userId: string, input: UpdateCharacterInput) {
    // First verify ownership
    const existing = await prisma.character.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Character not found or access denied');
    }

    const character = await prisma.character.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.currentHitPoints !== undefined && { currentHitPoints: input.currentHitPoints }),
        ...(input.tempHitPoints !== undefined && { tempHitPoints: input.tempHitPoints }),
        ...(input.equipment && { equipment: input.equipment }),
        ...(input.spellsPrepared && { spellsPrepared: input.spellsPrepared }),
        ...(input.currency && { currency: input.currency }),
        ...(input.portraitUrl && { portraitUrl: input.portraitUrl }),
        ...(input.appearance && { appearance: input.appearance }),
      },
    });

    return character;
  }

  async delete(id: string, userId: string) {
    // First verify ownership
    const existing = await prisma.character.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Character not found or access denied');
    }

    await prisma.character.delete({
      where: { id },
    });

    return true;
  }
}
