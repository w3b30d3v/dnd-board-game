// Media Service - AI image generation and asset management
// Integrated with NanoBanana API for character portraits, locations, monsters, items

export { NanoBananaService, nanoBananaService } from './services/nanoBananaService';
export { buildCharacterPortraitPrompt, addStyleTerms } from './prompts/characterPrompts';
export { isPromptSafe, sanitizeImagePrompt, buildSafeNegativePrompt } from './utils/contentSafety';

// Re-export types
export type { Character, PromptConfig } from './prompts/characterPrompts';

console.log('Media Service initialized');
