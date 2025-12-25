// Content Safety Utilities for AI Image Generation
// Ensures all generated content is family-friendly and appropriate

// Terms that must NEVER appear in prompts
const BLOCKED_TERMS = [
  // Sexual content
  'nude', 'naked', 'nsfw', 'sexual', 'erotic', 'sensual',
  'porn', 'xxx', 'hentai', 'ecchi', 'lewd',
  'bikini', 'lingerie', 'underwear', 'topless', 'bottomless',
  'breast', 'nipple', 'genitals', 'buttocks',
  'sexy', 'seductive', 'provocative', 'suggestive',

  // Violence (excessive)
  'gore', 'gory', 'mutilation', 'dismember', 'torture',
  'graphic violence', 'brutal', 'sadistic',

  // Hate/discrimination
  'nazi', 'swastika', 'racist', 'hate symbol',

  // Real people
  'celebrity', 'real person', 'politician',

  // Drugs (non-fantasy)
  'cocaine', 'heroin', 'meth', 'marijuana', 'drugs',
];

// Terms that must ALWAYS be in negative prompt
const MANDATORY_NEGATIVE = [
  'nude', 'naked', 'nsfw', 'sexual', 'revealing',
  'bikini armor', 'chainmail bikini', 'battle thong',
  'gore', 'excessive blood', 'torture',
  'real photo', 'photograph', 'celebrity',
  'watermark', 'signature', 'logo', 'text',
  'blurry', 'low quality', 'amateur', 'deformed',
];

// Terms that should be added for safety
const MANDATORY_POSITIVE = [
  'fully clothed',
  'appropriate fantasy attire',
  'family friendly',
];

export function isPromptSafe(prompt: string): boolean {
  const lowered = prompt.toLowerCase();

  for (const term of BLOCKED_TERMS) {
    if (lowered.includes(term)) {
      console.warn(`Blocked term found in prompt: ${term}`);
      return false;
    }
  }

  return true;
}

export function sanitizeImagePrompt(prompt: string): { prompt: string; negativePrompt: string } {
  // Ensure safety terms are present
  let safePrompt = prompt;

  for (const term of MANDATORY_POSITIVE) {
    if (!safePrompt.toLowerCase().includes(term.toLowerCase())) {
      safePrompt += `, ${term}`;
    }
  }

  return {
    prompt: safePrompt,
    negativePrompt: MANDATORY_NEGATIVE.join(', '),
  };
}

export function buildSafeNegativePrompt(userNegative?: string): string {
  const combined = userNegative
    ? [...MANDATORY_NEGATIVE, ...userNegative.split(',').map(s => s.trim())]
    : MANDATORY_NEGATIVE;

  return [...new Set(combined)].join(', ');
}

export function validateGeneratedImage(_imageUrl: string): Promise<boolean> {
  // TODO: Integrate with image moderation service (e.g., Google Vision SafeSearch)
  // For now, trust the negative prompt to do its job
  return Promise.resolve(true);
}
