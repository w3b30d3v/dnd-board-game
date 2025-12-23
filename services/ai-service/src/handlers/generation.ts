// Content Generation Handler
// Generates structured D&D content using Claude Opus

import { generateJSON, estimateCost } from '../lib/claude.js';
import { getPhasePrompt, getSchema } from '../prompts/campaignStudio.js';
import { logger } from '../lib/logger.js';

// NPC Generation
export interface GeneratedNPC {
  name: string;
  race: string;
  class?: string;
  alignment: string;
  appearance: string;
  personality: {
    traits: string[];
    ideals: string;
    bonds: string;
    flaws: string;
  };
  background: string;
  motivation: string;
  secrets: string[];
  voiceNotes: string;
  relationship: 'ally' | 'neutral' | 'enemy' | 'complex';
  statBlock?: {
    cr: number;
    hp: number;
    ac: number;
    abilities: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  };
}

export async function generateNPC(description: string, context: string): Promise<{ npc: GeneratedNPC; cost: number }> {
  const systemPrompt = `${getPhasePrompt('npcs')}

Generate a detailed NPC based on the user's description. Use D&D 5e conventions.
The NPC should fit naturally into the campaign context provided.`;

  const userPrompt = `Campaign Context:
${context}

NPC Request:
${description}

Generate a complete NPC with all details.`;

  const result = await generateJSON<GeneratedNPC>(systemPrompt, userPrompt, getSchema('npc'));
  const cost = estimateCost(result.usage, 'generation');

  logger.info({ npcName: result.data.name, cost }, 'NPC generated');

  return { npc: result.data, cost };
}

// Encounter Generation
export interface GeneratedEncounter {
  name: string;
  type: 'combat' | 'social' | 'puzzle' | 'exploration';
  description: string;
  readAloud: string;
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';
  partyLevel: number;
  partySize: number;
  monsters: Array<{ name: string; count: number; notes: string }>;
  environment: {
    terrain: string;
    hazards: string[];
    cover: string[];
    lighting: 'bright' | 'dim' | 'dark';
  };
  objectives: {
    victory: string[];
    defeat: string[];
  };
  rewards: {
    xp: number;
    gold: number;
    items: string[];
    story: string;
  };
  tactics: string;
}

export async function generateEncounter(
  description: string,
  partyLevel: number,
  partySize: number,
  context: string
): Promise<{ encounter: GeneratedEncounter; cost: number }> {
  const systemPrompt = `${getPhasePrompt('encounters')}

Generate a balanced D&D 5e encounter. Follow CR calculation rules:
- Easy: Total XP = Party threshold × 0.75
- Medium: Total XP = Party threshold × 1.0
- Hard: Total XP = Party threshold × 1.5
- Deadly: Total XP = Party threshold × 2.0+

Consider action economy and monster synergies.`;

  const userPrompt = `Campaign Context:
${context}

Party: ${partySize} characters at level ${partyLevel}

Encounter Request:
${description}

Generate a complete, balanced encounter.`;

  const result = await generateJSON<GeneratedEncounter>(systemPrompt, userPrompt, getSchema('encounter'));
  const cost = estimateCost(result.usage, 'generation');

  logger.info({ encounterName: result.data.name, difficulty: result.data.difficulty, cost }, 'Encounter generated');

  return { encounter: result.data, cost };
}

// Quest Generation
export interface GeneratedQuest {
  title: string;
  description: string;
  questGiver: {
    name: string;
    motivation: string;
  };
  objectives: Array<{
    description: string;
    type: 'main' | 'optional' | 'hidden';
    completed: boolean;
  }>;
  prerequisites: string[];
  rewards: {
    gold: number;
    xp: number;
    items: string[];
    reputation: Array<{ faction: string; change: number }>;
  };
  consequences: {
    success: string;
    failure: string;
  };
  branches: Array<{
    condition: string;
    outcome: string;
  }>;
}

export async function generateQuest(
  description: string,
  context: string
): Promise<{ quest: GeneratedQuest; cost: number }> {
  const systemPrompt = `${getPhasePrompt('quests')}

Generate a compelling quest with:
- Clear objectives that players can track
- Meaningful choices with consequences
- Appropriate rewards for the effort
- Hooks that connect to the larger story`;

  const userPrompt = `Campaign Context:
${context}

Quest Request:
${description}

Generate a complete quest with all details.`;

  const result = await generateJSON<GeneratedQuest>(systemPrompt, userPrompt, getSchema('quest'));
  const cost = estimateCost(result.usage, 'generation');

  logger.info({ questTitle: result.data.title, cost }, 'Quest generated');

  return { quest: result.data, cost };
}

// Map Generation (generates map metadata, not the actual tiles)
export interface GeneratedMap {
  name: string;
  description: string;
  width: number;
  height: number;
  terrain: Array<{ x: number; y: number; type: string }>;
  pointsOfInterest: Array<{
    name: string;
    x: number;
    y: number;
    description: string;
    icon: string;
  }>;
  lighting: 'bright' | 'dim' | 'dark';
  atmosphere: string;
}

export async function generateMap(
  description: string,
  dimensions: { width: number; height: number },
  context: string
): Promise<{ map: GeneratedMap; cost: number }> {
  const systemPrompt = `${getPhasePrompt('locations')}

Generate a map layout for D&D combat or exploration.
Terrain types: grass, stone, water, lava, void, sand, forest, mountain
Include varied terrain for tactical interest.
Place points of interest at notable locations.`;

  const userPrompt = `Campaign Context:
${context}

Map Request:
${description}

Dimensions: ${dimensions.width}×${dimensions.height} tiles

Generate a complete map layout with terrain and points of interest.
Include enough terrain variety for interesting tactical play.`;

  const result = await generateJSON<GeneratedMap>(systemPrompt, userPrompt, getSchema('map'));
  const cost = estimateCost(result.usage, 'generation');

  logger.info({ mapName: result.data.name, cost }, 'Map generated');

  return { map: result.data, cost };
}

// Campaign Setting Generation
export interface GeneratedSetting {
  name: string;
  description: string;
  tone: 'heroic' | 'gritty' | 'horror' | 'comedic' | 'mixed';
  magicLevel: 'high' | 'medium' | 'low' | 'none';
  themes: string[];
  factions: Array<{
    name: string;
    description: string;
    alignment: string;
    goals: string;
  }>;
  currentEvents: string[];
  startingLocation: {
    name: string;
    type: string;
    description: string;
  };
}

export async function generateSetting(description: string): Promise<{ setting: GeneratedSetting; cost: number }> {
  const systemPrompt = `${getPhasePrompt('setting')}

Generate a rich campaign setting that:
- Has a clear identity and tone
- Includes interesting factions with conflicting goals
- Sets up hooks for adventure
- Has a compelling starting location`;

  const userPrompt = `Setting Request:
${description}

Generate a complete campaign setting.`;

  const result = await generateJSON<GeneratedSetting>(systemPrompt, userPrompt, getSchema('setting'));
  const cost = estimateCost(result.usage, 'generation');

  logger.info({ settingName: result.data.name, cost }, 'Setting generated');

  return { setting: result.data, cost };
}
