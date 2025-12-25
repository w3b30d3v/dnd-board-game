// Personality Content Generator
// Generates safe, lore-appropriate personality content for D&D characters

import { selectFromTemplates } from '../data/personalityTemplates.js';

// Blocked patterns for content safety
const BLOCKED_PATTERNS = [
  // Profanity
  /\b(fuck|shit|damn|hell|ass|bitch|bastard|crap)\b/gi,

  // Sexual content
  /\b(sex|nude|naked|erotic|sensual|intimate)\b/gi,

  // Graphic violence
  /\b(gore|mutilate|dismember|torture)\b/gi,

  // Real-world sensitive topics
  /\b(nazi|holocaust|terrorism|rape)\b/gi,

  // Drug references (non-fantasy)
  /\b(cocaine|heroin|meth|marijuana)\b/gi,
];

// Replacement words for mild terms
const REPLACEMENTS: Record<string, string> = {
  damn: 'cursed',
  hell: 'the abyss',
  ass: 'fool',
  crap: 'rubbish',
};

interface GenerationRequest {
  field: 'personalityTrait' | 'ideal' | 'bond' | 'flaw' | 'backstory';
  race?: string;
  class?: string;
  background?: string;
  name?: string;
}

// GenerationResult interface kept for future AI generation implementation
// interface GenerationResult {
//   content: string;
//   isSafe: boolean;
// }

export async function generatePersonalityContent(request: GenerationRequest): Promise<string> {
  const { field, race, class: charClass, background, name } = request;

  // Use pre-written templates (fast, always safe)
  const content = selectFromTemplates(field, {
    race,
    charClass,
    background,
    name,
  });

  // Sanitize output just in case
  const sanitized = sanitizeContent(content);

  return sanitized;
}

export function sanitizeContent(content: string): string {
  let sanitized = content;

  // Apply replacements for mild terms
  for (const [word, replacement] of Object.entries(REPLACEMENTS)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    sanitized = sanitized.replace(regex, replacement);
  }

  return sanitized;
}

export function isContentSafe(content: string): boolean {
  const lowered = content.toLowerCase();

  // Check against blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(lowered)) {
      console.warn('Unsafe content detected');
      return false;
    }
  }

  return true;
}

// Generate all personality fields at once
export async function generateAllPersonalityContent(context: {
  race?: string;
  class?: string;
  background?: string;
  name?: string;
}): Promise<{
  personalityTrait: string;
  ideal: string;
  bond: string;
  flaw: string;
  backstory: string;
}> {
  const fields: Array<'personalityTrait' | 'ideal' | 'bond' | 'flaw' | 'backstory'> = [
    'personalityTrait',
    'ideal',
    'bond',
    'flaw',
    'backstory',
  ];

  const results: Record<string, string> = {};

  for (const field of fields) {
    results[field] = await generatePersonalityContent({
      field,
      ...context,
    });
  }

  return {
    personalityTrait: results.personalityTrait || '',
    ideal: results.ideal || '',
    bond: results.bond || '',
    flaw: results.flaw || '',
    backstory: results.backstory || '',
  };
}
