// Content Safety Utilities for AI Services
// Ensures all generated content (voice, video) is family-friendly

// Terms that must NEVER appear in content sent to AI services
const BLOCKED_TERMS = [
  // Profanity
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'crap',
  'piss', 'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut',

  // Sexual content
  'nude', 'naked', 'nsfw', 'sexual', 'erotic', 'sensual',
  'porn', 'xxx', 'hentai', 'ecchi', 'lewd',
  'bikini', 'lingerie', 'underwear', 'topless', 'bottomless',
  'breast', 'nipple', 'genitals', 'buttocks',
  'sexy', 'seductive', 'provocative', 'suggestive',
  'orgasm', 'masturbat', 'intercourse', 'fondle',

  // Violence (excessive/graphic)
  'gore', 'gory', 'mutilation', 'dismember', 'torture',
  'graphic violence', 'brutal murder', 'sadistic',
  'decapitat', 'disembowel', 'eviscerat',

  // Hate/discrimination
  'nazi', 'swastika', 'racist', 'hate symbol',
  'racial slur', 'homophobic', 'transphobic',

  // Self-harm
  'suicide', 'self-harm', 'cutting myself',

  // Drugs (non-fantasy context)
  'cocaine', 'heroin', 'meth', 'crack pipe',
];

// Additional patterns to check (regex-based)
const BLOCKED_PATTERNS = [
  /\bf+u+c+k+/i,
  /\bs+h+i+t+/i,
  /\ba+s+s+h+o+l+e+/i,
  /\bb+i+t+c+h+/i,
  /\bn+[i1]+g+[g]+[ae]+r*/i,  // Racial slur variations
  /\bf+[a4]+g+[g]*/i,         // Homophobic slur variations
];

export interface ContentSafetyResult {
  safe: boolean;
  issues: string[];
  sanitizedText?: string;
}

/**
 * Check if text content is safe for AI generation
 * Used for voice narration and video scene descriptions
 */
export function checkContentSafety(text: string): ContentSafetyResult {
  const issues: string[] = [];
  const lowerText = text.toLowerCase();

  // Check blocked terms
  for (const term of BLOCKED_TERMS) {
    if (lowerText.includes(term.toLowerCase())) {
      issues.push(`Contains inappropriate term: "${term}"`);
    }
  }

  // Check blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      issues.push('Contains inappropriate language pattern');
      break; // One pattern match is enough
    }
  }

  return {
    safe: issues.length === 0,
    issues,
  };
}

/**
 * Sanitize text by removing or replacing inappropriate content
 * Returns sanitized text if possible, or null if content is too inappropriate
 */
export function sanitizeText(text: string): ContentSafetyResult {
  let sanitized = text;
  const issues: string[] = [];

  // Replace blocked terms with asterisks
  for (const term of BLOCKED_TERMS) {
    const regex = new RegExp(term, 'gi');
    if (regex.test(sanitized)) {
      sanitized = sanitized.replace(regex, '*'.repeat(term.length));
      issues.push(`Sanitized term: "${term}"`);
    }
  }

  // Check patterns and reject if found (can't easily sanitize)
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(sanitized)) {
      return {
        safe: false,
        issues: ['Content contains inappropriate patterns that cannot be sanitized'],
      };
    }
  }

  // If too many terms were sanitized, reject entirely
  if (issues.length > 3) {
    return {
      safe: false,
      issues: ['Content contains too much inappropriate language'],
    };
  }

  return {
    safe: true,
    issues,
    sanitizedText: sanitized,
  };
}

/**
 * Check if video scene description is appropriate
 * Additional checks specific to visual content
 */
export function checkVideoSceneSafety(description: string): ContentSafetyResult {
  const baseCheck = checkContentSafety(description);
  if (!baseCheck.safe) {
    return baseCheck;
  }

  const issues: string[] = [];
  const lowerDesc = description.toLowerCase();

  // Additional video-specific blocked content
  const videoBlockedTerms = [
    'blood splatter', 'blood spray', 'pool of blood',
    'dead body', 'corpse pile', 'mass grave',
    'child violence', 'child abuse',
    'real person', 'celebrity', 'politician',
    'real world violence', 'terrorist', 'shooting',
  ];

  for (const term of videoBlockedTerms) {
    if (lowerDesc.includes(term)) {
      issues.push(`Video scene contains inappropriate visual: "${term}"`);
    }
  }

  return {
    safe: issues.length === 0,
    issues,
  };
}

/**
 * Check if voice narration text is appropriate
 * Ensures text won't produce offensive audio
 */
export function checkVoiceTextSafety(text: string): ContentSafetyResult {
  const baseCheck = checkContentSafety(text);
  if (!baseCheck.safe) {
    return baseCheck;
  }

  const issues: string[] = [];
  const lowerText = text.toLowerCase();

  // Additional voice-specific checks
  // Check for text that might sound inappropriate when spoken
  const voiceBlockedTerms = [
    'moan', 'groan sensually', 'whisper seductively',
    'scream in agony', 'death rattle',
  ];

  for (const term of voiceBlockedTerms) {
    if (lowerText.includes(term)) {
      issues.push(`Voice text contains inappropriate audio content: "${term}"`);
    }
  }

  return {
    safe: issues.length === 0,
    issues,
  };
}

/**
 * Validate and optionally sanitize content before sending to AI service
 * Returns the safe text or throws an error if content is too inappropriate
 */
export function validateAndSanitize(
  text: string,
  type: 'voice' | 'video' | 'general'
): string {
  // First check if it's safe as-is
  let safetyCheck: ContentSafetyResult;

  switch (type) {
    case 'voice':
      safetyCheck = checkVoiceTextSafety(text);
      break;
    case 'video':
      safetyCheck = checkVideoSceneSafety(text);
      break;
    default:
      safetyCheck = checkContentSafety(text);
  }

  if (safetyCheck.safe) {
    return text;
  }

  // Try to sanitize
  const sanitizeResult = sanitizeText(text);
  if (sanitizeResult.safe && sanitizeResult.sanitizedText) {
    return sanitizeResult.sanitizedText;
  }

  // Content is too inappropriate
  throw new ContentSafetyError(
    'Content violates family-friendly policy',
    safetyCheck.issues
  );
}

/**
 * Custom error for content safety violations
 */
export class ContentSafetyError extends Error {
  public issues: string[];

  constructor(message: string, issues: string[]) {
    super(message);
    this.name = 'ContentSafetyError';
    this.issues = issues;
  }
}
