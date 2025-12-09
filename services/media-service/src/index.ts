// Media Service - AI image generation and asset management
// Integrated with NanoBanana API for character portraits, locations, monsters, items

export { NanoBananaService, nanoBananaService } from './services/nanoBananaService.js';
export { buildCharacterPortraitPrompt, addStyleTerms } from './prompts/characterPrompts.js';
export { isPromptSafe, sanitizeImagePrompt, buildSafeNegativePrompt } from './utils/contentSafety.js';

// Re-export types
export type { Character, PromptConfig } from './prompts/characterPrompts.js';

console.log('Media Service initialized');
