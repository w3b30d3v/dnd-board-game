# Document 44: NanoBanana API Integration for D&D Asset Generation

## Purpose

This document specifies how to integrate **NanoBanana API** (powered by Google Gemini image models) into the D&D Digital Board Game platform for generating high-quality:

- Character portraits
- Location/scene art
- Monster illustrations
- Item/equipment images
- Spell effect visuals
- Cutscene frames
- Multi-image compositions

---

# PART 1: API OVERVIEW

## 1.1 What is NanoBanana API?

NanoBanana API provides access to Google's Gemini image generation models at reduced cost:

| Model | Powered By | Cost | Best For |
|-------|------------|------|----------|
| **NanoBanana API** | Gemini 2.5 Flash Image | ~$0.02/image | Fast generation, high-volume, real-time |
| **NanoBanana Pro API** | Gemini 3 Pro Image | ~$0.12/image | 4K quality, character consistency, complex scenes |

## 1.2 Key Capabilities for D&D

| Feature | How We Use It |
|---------|---------------|
| **Character Consistency** | Same character across multiple images (portraits, action poses) |
| **Multi-Image Blending** | Combine up to 8 reference images (character + background + equipment) |
| **Natural Language Editing** | "Add a scar across the left eye", "Change armor to plate mail" |
| **4K Resolution** | High-quality prints for character sheets |
| **Text Rendering** | Names, titles, spell text on images |
| **Style Transfer** | Consistent D&D fantasy art style |

## 1.3 API Authentication

```typescript
// Environment variable
NANOBANANA_API_KEY=your_api_key_here

// Request header
Authorization: Bearer YOUR_API_KEY
```

---

# PART 2: API ENDPOINTS

## 2.1 Standard Generation (NanoBanana API)

```typescript
// POST https://api.nanobananaapi.ai/v1/generate

interface NanoBananaGenerateRequest {
  prompt: string;                    // Text description
  negative_prompt?: string;          // What to avoid
  image?: string;                    // Base64 or URL (for editing)
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  output_format?: 'png' | 'jpeg' | 'webp';
  webhook_url?: string;              // For async callback
}

interface NanoBananaGenerateResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  image_url?: string;                // When completed
  credits_used: number;
}
```

## 2.2 Pro Generation (NanoBanana Pro API)

```typescript
// POST https://api.nanobananaapi.ai/v1/generate-pro

interface NanoBananaProRequest {
  prompt: string;
  negative_prompt?: string;
  images?: string[];                 // Up to 8 reference images
  resolution?: '1k' | '2k' | '4k';
  style_reference?: string;          // URL to style guide image
  character_reference?: string;      // For consistency
  webhook_url?: string;
}

interface NanoBananaProResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  image_url?: string;
  credits_used: number;
}
```

## 2.3 Task Status Check

```typescript
// GET https://api.nanobananaapi.ai/v1/tasks/{task_id}

interface TaskStatusResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;                 // 0-100
  image_url?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
}
```

---

# PART 3: D&D-SPECIFIC PROMPT ENGINEERING

## 3.1 Character Portrait Prompts

```typescript
// services/media-service/src/prompts/characterPrompts.ts

export function buildCharacterPortraitPrompt(character: Character): PromptConfig {
  const { race, class: charClass, appearance, personality, name } = character;
  
  // Core description
  const coreDescription = [
    'fantasy character portrait',
    'dungeons and dragons art style',
    'detailed digital painting',
    getRaceDescription(race),
    getClassAppearance(charClass),
  ];
  
  // Physical features
  const physicalFeatures = [
    appearance?.hairColor && `${appearance.hairColor} hair`,
    appearance?.hairStyle && `${appearance.hairStyle} hairstyle`,
    appearance?.eyeColor && `${appearance.eyeColor} eyes`,
    appearance?.skinTone && `${appearance.skinTone} skin`,
    appearance?.facialHair && `${appearance.facialHair}`,
    appearance?.distinguishingMarks && appearance.distinguishingMarks,
  ].filter(Boolean);
  
  // Expression from personality
  const expression = getExpressionFromPersonality(personality);
  
  // SAFETY: Mandatory terms
  const safetyTerms = [
    'fully clothed',
    'appropriate fantasy armor and attire',
    'heroic pose',
    'professional illustration',
    'family friendly',
  ];
  
  // Quality terms
  const qualityTerms = [
    'masterpiece',
    'best quality',
    'highly detailed',
    'sharp focus',
    'dramatic lighting',
    'rich colors',
  ];
  
  const prompt = [
    ...coreDescription,
    ...physicalFeatures,
    expression,
    ...safetyTerms,
    ...qualityTerms,
  ].filter(Boolean).join(', ');
  
  // SAFETY: Mandatory negative prompt
  const negativePrompt = [
    'nude', 'naked', 'nsfw', 'sexual', 'suggestive',
    'revealing clothing', 'bikini', 'lingerie',
    'gore', 'blood', 'violent', 'disturbing',
    'deformed', 'ugly', 'blurry', 'low quality',
    'bad anatomy', 'extra limbs', 'mutated',
    'watermark', 'signature', 'text',
  ].join(', ');
  
  return { prompt, negativePrompt };
}

// Race descriptions
function getRaceDescription(race: string): string {
  const descriptions: Record<string, string> = {
    human: 'human, realistic proportions, noble bearing',
    elf: 'elf, pointed ears, elegant angular features, ethereal beauty, ageless appearance',
    dwarf: 'dwarf, stocky muscular build, magnificent beard, rugged features, proud stance',
    halfling: 'halfling, small stature, youthful cheerful face, curly hair, bare hairy feet',
    dragonborn: 'dragonborn, reptilian humanoid, scaled skin, draconic head, powerful build',
    tiefling: 'tiefling, demonic horns, solid colored eyes, pointed tail, infernal heritage',
    gnome: 'gnome, very small, large curious eyes, pointed nose, wild hair',
    'half-elf': 'half-elf, slightly pointed ears, blend of human and elven grace',
    'half-orc': 'half-orc, muscular imposing build, prominent lower tusks, grayish-green skin',
    aasimar: 'aasimar, celestial beauty, faint golden glow, radiant eyes, angelic features',
    goliath: 'goliath, massive towering humanoid, gray skin, bald, tribal markings',
    firbolg: 'firbolg, tall gentle giant, cow-like nose, bluish skin, forest dweller',
    tabaxi: 'tabaxi, cat-like humanoid, feline features, spotted or striped fur, agile',
    kenku: 'kenku, raven-like humanoid, black feathers, beak, dark eyes',
    tortle: 'tortle, turtle-like humanoid, shell on back, wise ancient eyes',
  };
  
  return descriptions[race.toLowerCase()] || 'fantasy humanoid';
}

// Class appearances
function getClassAppearance(charClass: string): string {
  const appearances: Record<string, string> = {
    fighter: 'wearing practical plate armor, sword at hip, battle-ready stance, military bearing',
    wizard: 'wearing elegant arcane robes, holding ornate staff, mystical symbols, scholarly',
    rogue: 'wearing dark leather armor, hooded cloak, daggers visible, shadowy mysterious',
    cleric: 'wearing chainmail with holy vestments, sacred symbol prominent, divine presence',
    paladin: 'wearing brilliant shining plate armor, holy sword, radiant confident, noble',
    ranger: 'wearing practical leather and fur, bow and quiver, woodsman attire, alert',
    barbarian: 'wearing minimal fur and leather armor, muscular powerful build, tribal tattoos, fierce',
    bard: 'wearing colorful flamboyant clothes, musical instrument, charming smile, theatrical',
    druid: 'wearing natural materials leaves and vines, wooden staff, wild hair, connected to nature',
    monk: 'wearing simple practical robes, bare hands ready, serene focused expression',
    sorcerer: 'wearing elegant clothes, magical energy crackling, confident natural power',
    warlock: 'wearing dark mysterious robes, eldritch symbols, otherworldly presence, haunted eyes',
    artificer: 'wearing practical work clothes, tools and gadgets, goggles, inventive curious',
    blood_hunter: 'wearing scarred leather armor, crimson accents, grim determined, monster hunter',
  };
  
  return appearances[charClass.toLowerCase()] || 'adventurer gear and equipment';
}

// Expression from personality
function getExpressionFromPersonality(personality?: PersonalityTraits): string {
  if (!personality) return 'determined heroic expression';
  
  const { trait, flaw, ideal } = personality;
  const combined = `${trait || ''} ${flaw || ''} ${ideal || ''}`.toLowerCase();
  
  if (combined.includes('friendly') || combined.includes('kind')) return 'warm friendly smile';
  if (combined.includes('suspicious') || combined.includes('trust')) return 'wary guarded expression';
  if (combined.includes('proud') || combined.includes('arrogant')) return 'confident proud expression';
  if (combined.includes('curious') || combined.includes('knowledge')) return 'curious intelligent gaze';
  if (combined.includes('angry') || combined.includes('revenge')) return 'fierce intense stare';
  if (combined.includes('sad') || combined.includes('loss')) return 'melancholy thoughtful expression';
  if (combined.includes('brave') || combined.includes('courage')) return 'bold fearless expression';
  if (combined.includes('shy') || combined.includes('quiet')) return 'reserved gentle expression';
  
  return 'determined heroic expression';
}
```

## 3.2 Location/Scene Prompts

```typescript
// services/media-service/src/prompts/locationPrompts.ts

export function buildLocationPrompt(location: LocationData): PromptConfig {
  const { type, name, atmosphere, timeOfDay, weather, features } = location;
  
  const baseDescription = [
    'fantasy landscape',
    'dungeons and dragons environment',
    'detailed digital matte painting',
    getLocationType(type),
    `${atmosphere} atmosphere`,
  ];
  
  const environmentDetails = [
    timeOfDay && getTimeOfDayLighting(timeOfDay),
    weather && getWeatherEffects(weather),
    ...features.map(f => f.toLowerCase()),
  ].filter(Boolean);
  
  const qualityTerms = [
    'epic scale',
    'cinematic composition',
    'volumetric lighting',
    'rich atmospheric perspective',
    'highly detailed',
    'masterpiece',
  ];
  
  // SAFETY terms (no violence, appropriate)
  const safetyTerms = [
    'family friendly',
    'fantasy adventure setting',
  ];
  
  const prompt = [
    ...baseDescription,
    ...environmentDetails,
    ...safetyTerms,
    ...qualityTerms,
  ].join(', ');
  
  const negativePrompt = [
    'gore', 'blood', 'corpses', 'disturbing',
    'modern elements', 'cars', 'electricity',
    'blurry', 'low quality', 'watermark',
  ].join(', ');
  
  return { prompt, negativePrompt };
}

function getLocationType(type: string): string {
  const types: Record<string, string> = {
    dungeon: 'underground dungeon, ancient stone corridors, torchlit passages, mysterious shadows',
    forest: 'enchanted forest, towering ancient trees, mystical fog, dappled sunlight',
    castle: 'medieval fantasy castle, gothic architecture, imposing towers, stone walls',
    tavern: 'cozy fantasy tavern interior, wooden beams, fireplace, warm candlelight',
    cave: 'natural cave system, stalactites, underground pool, glowing crystals',
    city: 'fantasy medieval city, cobblestone streets, timber-framed buildings, bustling',
    wilderness: 'untamed wilderness, rolling hills, distant mountains, wild beauty',
    temple: 'ancient temple, ornate religious architecture, sacred atmosphere, divine light',
    ruins: 'ancient ruins, crumbling stone, overgrown vegetation, mysterious past',
    swamp: 'murky swamp, twisted trees, hanging moss, eerie mist, dangerous',
    desert: 'vast fantasy desert, endless dunes, ancient monuments, scorching heat',
    mountains: 'dramatic mountain peaks, snow-capped summits, alpine meadows, eagles',
    ocean: 'vast fantasy ocean, sailing ships, sea monsters in distance, adventure',
    underdark: 'underground realm, bioluminescent fungi, alien landscape, darkness',
    feywild: 'feywild realm, impossible colors, dreamlike landscape, magical creatures',
    shadowfell: 'shadowfell plane, dark twisted landscape, muted colors, ominous',
  };
  
  return types[type.toLowerCase()] || 'fantasy landscape';
}

function getTimeOfDayLighting(time: string): string {
  const lighting: Record<string, string> = {
    dawn: 'golden dawn light, soft pink sky, morning mist, peaceful awakening',
    morning: 'bright morning sun, clear sky, fresh atmosphere',
    midday: 'high sun, strong shadows, vibrant colors',
    afternoon: 'warm afternoon light, long shadows, golden tones',
    sunset: 'dramatic sunset, orange and purple sky, golden hour lighting',
    dusk: 'fading twilight, deep blue sky, first stars appearing',
    night: 'moonlit night, silver light, starry sky, mysterious shadows',
    midnight: 'deep night, dark sky, faint starlight, ominous darkness',
  };
  
  return lighting[time.toLowerCase()] || '';
}

function getWeatherEffects(weather: string): string {
  const effects: Record<string, string> = {
    clear: 'clear sky, good visibility',
    cloudy: 'overcast sky, diffused light, moody atmosphere',
    rain: 'falling rain, wet surfaces, reflections, dramatic storm',
    storm: 'dramatic thunderstorm, lightning in sky, wind-blown, intense',
    snow: 'falling snow, winter wonderland, frost, cold atmosphere',
    fog: 'thick atmospheric fog, limited visibility, mysterious',
    wind: 'strong wind, movement in vegetation, dynamic',
  };
  
  return effects[weather.toLowerCase()] || '';
}
```

## 3.3 Monster Prompts

```typescript
// services/media-service/src/prompts/monsterPrompts.ts

export function buildMonsterPrompt(monster: MonsterData): PromptConfig {
  const { name, type, size, description, cr } = monster;
  
  const baseDescription = [
    'fantasy monster illustration',
    'dungeons and dragons creature',
    'detailed creature design',
    getMonsterTypeDescription(type),
    getSizeDescription(size),
  ];
  
  // Threat level based on CR
  const threatLevel = getThreatLevel(cr);
  
  const styleTerms = [
    'menacing pose',
    'dramatic lighting',
    threatLevel,
    'highly detailed',
    'professional creature art',
    'masterpiece quality',
  ];
  
  // Custom description if provided
  const customDesc = description ? [description] : [];
  
  // SAFETY: Keep it fantasy appropriate, not gratuitous
  const safetyTerms = [
    'fantasy creature',
    'game art style',
    'family friendly monster design',
  ];
  
  const prompt = [
    ...baseDescription,
    ...customDesc,
    ...safetyTerms,
    ...styleTerms,
  ].join(', ');
  
  const negativePrompt = [
    'gore', 'excessive blood', 'torture', 'disturbing body horror',
    'sexual', 'nude', 'inappropriate',
    'blurry', 'low quality', 'amateur',
    'realistic photo', 'human',
  ].join(', ');
  
  return { prompt, negativePrompt };
}

function getMonsterTypeDescription(type: string): string {
  const types: Record<string, string> = {
    aberration: 'alien aberration, tentacles, multiple eyes, otherworldly horror, eldritch',
    beast: 'natural beast, animal creature, realistic anatomy, wild',
    celestial: 'celestial being, angelic, radiant glow, divine beauty, wings',
    construct: 'magical construct, golem, artificial creature, animated',
    dragon: 'majestic dragon, scales, wings, powerful, ancient, breath weapon',
    elemental: 'elemental being, pure energy form, magical essence',
    fey: 'fey creature, whimsical, magical, beautiful and dangerous',
    fiend: 'demonic fiend, infernal, horns, dark power, menacing',
    giant: 'massive giant, towering humanoid, primitive, powerful',
    humanoid: 'humanoid creature, intelligent, civilized or savage',
    monstrosity: 'monstrous creature, unnatural, hybrid features, dangerous',
    ooze: 'amorphous ooze, gelatinous, formless, dissolving',
    plant: 'plant creature, vegetable matter, animate vegetation',
    undead: 'undead creature, skeletal or decayed, glowing eyes, death magic',
  };
  
  return types[type.toLowerCase()] || 'fantasy monster';
}

function getSizeDescription(size: string): string {
  const sizes: Record<string, string> = {
    tiny: 'tiny creature, very small, fits in palm',
    small: 'small creature, child-sized, nimble',
    medium: 'medium creature, human-sized',
    large: 'large creature, horse-sized, imposing',
    huge: 'huge creature, elephant-sized, massive',
    gargantuan: 'gargantuan creature, building-sized, colossal, terrifying scale',
  };
  
  return sizes[size.toLowerCase()] || '';
}

function getThreatLevel(cr: number): string {
  if (cr <= 1) return 'minor threat, starter monster';
  if (cr <= 5) return 'dangerous opponent, formidable';
  if (cr <= 10) return 'serious threat, deadly, powerful';
  if (cr <= 15) return 'legendary threat, extremely dangerous';
  return 'world-ending threat, apocalyptic power, ultimate boss';
}
```

## 3.4 Item/Equipment Prompts

```typescript
// services/media-service/src/prompts/itemPrompts.ts

export function buildItemPrompt(item: ItemData): PromptConfig {
  const { name, type, rarity, magical, description } = item;
  
  const baseDescription = [
    'fantasy item illustration',
    'dungeons and dragons equipment',
    'detailed item art',
    getItemTypeDescription(type),
    getRarityAppearance(rarity),
  ];
  
  const magicalEffects = magical ? [
    'magical glow',
    'arcane runes',
    'enchanted appearance',
    getMagicalAura(rarity),
  ] : [];
  
  const styleTerms = [
    'centered composition',
    'clean background',
    'highly detailed',
    'professional game art',
    'masterpiece quality',
  ];
  
  const prompt = [
    ...baseDescription,
    ...magicalEffects,
    description || '',
    ...styleTerms,
  ].filter(Boolean).join(', ');
  
  const negativePrompt = [
    'blurry', 'low quality', 'amateur',
    'hands holding', 'person', 'character',
    'watermark', 'text', 'signature',
  ].join(', ');
  
  return { prompt, negativePrompt };
}

function getItemTypeDescription(type: string): string {
  const types: Record<string, string> = {
    weapon_sword: 'medieval fantasy sword, blade, crossguard, pommel',
    weapon_axe: 'fantasy battle axe, heavy blade, wooden handle',
    weapon_bow: 'elegant fantasy bow, curved limbs, bowstring',
    weapon_staff: 'magical wooden staff, carved, crystal top',
    weapon_dagger: 'fantasy dagger, short blade, ornate handle',
    armor_plate: 'full plate armor set, metal plates, impressive',
    armor_chain: 'chainmail armor, interlocking rings, flexible',
    armor_leather: 'leather armor, studded, practical',
    armor_shield: 'medieval shield, heraldic design, sturdy',
    potion: 'magical potion bottle, glowing liquid, glass vial',
    scroll: 'magical scroll, parchment, arcane writing',
    ring: 'magical ring, gemstone, ornate band',
    amulet: 'magical amulet, pendant, chain necklace',
    wand: 'magical wand, carved wood or bone, crystal tip',
    tome: 'ancient spellbook, leather bound, magical symbols',
    artifact: 'legendary artifact, unique design, immense power',
  };
  
  return types[type.toLowerCase()] || 'fantasy equipment item';
}

function getRarityAppearance(rarity: string): string {
  const appearances: Record<string, string> = {
    common: 'simple practical design, worn but functional',
    uncommon: 'quality craftsmanship, minor decorations',
    rare: 'exceptional craftsmanship, intricate details, valuable',
    'very rare': 'masterwork quality, elaborate decorations, precious materials',
    legendary: 'legendary masterpiece, awe-inspiring design, perfect craftsmanship',
    artifact: 'divine artifact, impossible beauty, reality-bending presence',
  };
  
  return appearances[rarity.toLowerCase()] || '';
}

function getMagicalAura(rarity: string): string {
  const auras: Record<string, string> = {
    common: 'faint magical shimmer',
    uncommon: 'soft magical glow',
    rare: 'bright magical aura, visible enchantment',
    'very rare': 'intense magical radiance, powerful aura',
    legendary: 'overwhelming magical presence, legendary glow',
    artifact: 'reality-warping aura, divine radiance',
  };
  
  return auras[rarity.toLowerCase()] || '';
}
```

---

# PART 4: SERVICE IMPLEMENTATION

## 4.1 NanoBanana Service

```typescript
// services/media-service/src/services/nanoBananaService.ts

import axios from 'axios';
import { Redis } from 'ioredis';
import { sanitizeImagePrompt, isPromptSafe } from '../utils/contentSafety';

const NANOBANANA_API_URL = 'https://api.nanobananaapi.ai/v1';
const redis = new Redis(process.env.REDIS_URL);

interface GenerateOptions {
  prompt: string;
  negativePrompt?: string;
  referenceImages?: string[];  // URLs or base64
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  resolution?: '1k' | '2k' | '4k';
  usePro?: boolean;  // Use Pro API for higher quality
}

interface GenerateResult {
  taskId: string;
  status: 'pending' | 'completed' | 'failed';
  imageUrl?: string;
  error?: string;
}

export class NanoBananaService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.NANOBANANA_API_KEY!;
    if (!this.apiKey) {
      throw new Error('NANOBANANA_API_KEY environment variable not set');
    }
  }
  
  /**
   * Generate an image with safety checks
   */
  async generateImage(options: GenerateOptions): Promise<GenerateResult> {
    const { prompt, negativePrompt, referenceImages, aspectRatio, resolution, usePro } = options;
    
    // SAFETY: Validate prompt
    if (!isPromptSafe(prompt)) {
      throw new Error('Prompt contains inappropriate content');
    }
    
    // SAFETY: Add mandatory safety terms
    const safePrompt = sanitizeImagePrompt(prompt);
    const safeNegative = this.buildSafeNegativePrompt(negativePrompt);
    
    // Check cache first
    const cacheKey = this.buildCacheKey(safePrompt.prompt, safeNegative);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Choose endpoint based on quality needs
    const endpoint = usePro ? '/generate-pro' : '/generate';
    
    try {
      const response = await axios.post(
        `${NANOBANANA_API_URL}${endpoint}`,
        {
          prompt: safePrompt.prompt,
          negative_prompt: safeNegative,
          images: referenceImages,
          aspect_ratio: aspectRatio || '1:1',
          resolution: resolution || '1k',
          output_format: 'png',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const { task_id, status, image_url } = response.data;
      
      // If completed immediately, cache and return
      if (status === 'completed' && image_url) {
        const result: GenerateResult = {
          taskId: task_id,
          status: 'completed',
          imageUrl: image_url,
        };
        
        // Cache for 24 hours
        await redis.setex(cacheKey, 86400, JSON.stringify(result));
        
        return result;
      }
      
      // Return pending status for polling
      return {
        taskId: task_id,
        status: 'pending',
      };
      
    } catch (error: any) {
      console.error('NanoBanana API error:', error.response?.data || error.message);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }
  
  /**
   * Poll for task completion
   */
  async getTaskStatus(taskId: string): Promise<GenerateResult> {
    try {
      const response = await axios.get(
        `${NANOBANANA_API_URL}/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      
      const { status, image_url, error } = response.data;
      
      return {
        taskId,
        status: status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'pending',
        imageUrl: image_url,
        error,
      };
      
    } catch (error: any) {
      throw new Error(`Failed to get task status: ${error.message}`);
    }
  }
  
  /**
   * Wait for completion with polling
   */
  async waitForCompletion(taskId: string, timeoutMs = 60000): Promise<GenerateResult> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds
    
    while (Date.now() - startTime < timeoutMs) {
      const result = await this.getTaskStatus(taskId);
      
      if (result.status === 'completed' || result.status === 'failed') {
        return result;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error('Image generation timed out');
  }
  
  /**
   * Build safe negative prompt with mandatory terms
   */
  private buildSafeNegativePrompt(userNegative?: string): string {
    const mandatoryNegative = [
      'nude', 'naked', 'nsfw', 'sexual', 'suggestive',
      'revealing clothing', 'bikini', 'lingerie',
      'pornographic', 'erotic', 'sensual',
      'gore', 'excessive blood', 'torture', 'mutilation',
      'hate symbols', 'offensive', 'inappropriate',
      'real person', 'celebrity', 'photograph',
      'watermark', 'signature', 'logo',
      'blurry', 'low quality', 'amateur', 'deformed',
    ];
    
    const combined = userNegative 
      ? [...mandatoryNegative, ...userNegative.split(',').map(s => s.trim())]
      : mandatoryNegative;
    
    return [...new Set(combined)].join(', ');
  }
  
  /**
   * Build cache key from prompt
   */
  private buildCacheKey(prompt: string, negative: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5')
      .update(`${prompt}|${negative}`)
      .digest('hex');
    return `nanobanana:${hash}`;
  }
  
  /**
   * Get remaining API credits
   */
  async getCredits(): Promise<number> {
    try {
      const response = await axios.get(
        `${NANOBANANA_API_URL}/account/credits`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      
      return response.data.credits;
      
    } catch (error: any) {
      throw new Error(`Failed to get credits: ${error.message}`);
    }
  }
}

export const nanoBananaService = new NanoBananaService();
```

## 4.2 Character Portrait Generator

```typescript
// services/media-service/src/generators/characterPortraitGenerator.ts

import { nanoBananaService } from '../services/nanoBananaService';
import { buildCharacterPortraitPrompt } from '../prompts/characterPrompts';
import { Character } from '@dnd/shared/types';

interface PortraitOptions {
  character: Character;
  style?: 'portrait' | 'full_body' | 'action_pose';
  aspectRatio?: '1:1' | '3:4' | '2:3';
  quality?: 'standard' | 'high';  // standard = Flash, high = Pro
}

export async function generateCharacterPortrait(options: PortraitOptions): Promise<string> {
  const { character, style = 'portrait', aspectRatio = '1:1', quality = 'standard' } = options;
  
  // Build prompt
  const { prompt, negativePrompt } = buildCharacterPortraitPrompt(character);
  
  // Add style-specific terms
  const stylePrompt = addStyleTerms(prompt, style);
  
  // Generate
  const result = await nanoBananaService.generateImage({
    prompt: stylePrompt,
    negativePrompt,
    aspectRatio,
    usePro: quality === 'high',
    resolution: quality === 'high' ? '2k' : '1k',
  });
  
  // If pending, wait for completion
  if (result.status === 'pending') {
    const completed = await nanoBananaService.waitForCompletion(result.taskId);
    if (completed.status === 'failed') {
      throw new Error(completed.error || 'Portrait generation failed');
    }
    return completed.imageUrl!;
  }
  
  return result.imageUrl!;
}

function addStyleTerms(basePrompt: string, style: string): string {
  const styleTerms: Record<string, string> = {
    portrait: 'head and shoulders portrait, facing slightly to side, eye contact',
    full_body: 'full body standing pose, head to toe visible, dynamic stance',
    action_pose: 'dynamic action pose, mid-movement, dramatic angle, combat ready',
  };
  
  return `${basePrompt}, ${styleTerms[style] || styleTerms.portrait}`;
}
```

## 4.3 Progressive Character Visualization

```typescript
// services/media-service/src/generators/progressiveCharacterGenerator.ts

import { nanoBananaService } from '../services/nanoBananaService';

interface ProgressiveState {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  race?: string;
  class?: string;
  background?: string;
  abilities?: Record<string, number>;
  appearance?: Record<string, string>;
  personality?: Record<string, string>;
}

/**
 * Generate character visualization at each step of creation
 * Lower levels = simpler/faster generation
 * Higher levels = full quality with all details
 */
export async function generateProgressiveVisualization(
  state: ProgressiveState
): Promise<string> {
  const { level } = state;
  
  // Level 1-2: Use standard API (fast, cheap)
  // Level 3-4: Use standard API with more detail
  // Level 5-6: Use Pro API for final quality
  
  const usePro = level >= 5;
  const prompt = buildProgressivePrompt(state);
  
  const result = await nanoBananaService.generateImage({
    prompt: prompt.prompt,
    negativePrompt: prompt.negativePrompt,
    aspectRatio: '3:4',
    usePro,
    resolution: usePro ? '2k' : '1k',
  });
  
  if (result.status === 'pending') {
    const completed = await nanoBananaService.waitForCompletion(result.taskId);
    return completed.imageUrl!;
  }
  
  return result.imageUrl!;
}

function buildProgressivePrompt(state: ProgressiveState): { prompt: string; negativePrompt: string } {
  const { level, race, class: charClass, background, abilities, appearance, personality } = state;
  
  const parts: string[] = [
    'fantasy character',
    'dungeons and dragons style',
  ];
  
  // Level 1: Just race silhouette
  if (level >= 1 && race) {
    parts.push(getRaceBasicShape(race));
  }
  
  // Level 2: Add class hints
  if (level >= 2 && charClass) {
    parts.push(getClassBasicAppearance(charClass));
  }
  
  // Level 3: Add background equipment
  if (level >= 3 && background) {
    parts.push(getBackgroundEquipment(background));
  }
  
  // Level 4: Physique from abilities
  if (level >= 4 && abilities) {
    parts.push(getPhysiqueFromAbilities(abilities));
  }
  
  // Level 5: Full appearance details
  if (level >= 5 && appearance) {
    parts.push(getAppearanceDetails(appearance));
  }
  
  // Level 6: Expression from personality
  if (level >= 6 && personality) {
    parts.push(getPersonalityExpression(personality));
  }
  
  // Quality scales with level
  const qualityTerms = level >= 5 
    ? ['masterpiece', 'best quality', 'highly detailed', 'sharp focus']
    : level >= 3
    ? ['good quality', 'detailed']
    : ['simple', 'stylized'];
  
  // SAFETY: Always include
  const safetyTerms = [
    'fully clothed',
    'appropriate fantasy attire',
    'family friendly',
  ];
  
  const prompt = [...parts, ...safetyTerms, ...qualityTerms].join(', ');
  
  const negativePrompt = [
    'nude', 'naked', 'nsfw', 'sexual', 'revealing',
    'gore', 'blood', 'disturbing',
    'blurry', 'low quality', 'deformed',
  ].join(', ');
  
  return { prompt, negativePrompt };
}

// Helper functions for progressive details
function getRaceBasicShape(race: string): string {
  const shapes: Record<string, string> = {
    human: 'human figure, average build',
    elf: 'slender elf, pointed ears, tall',
    dwarf: 'stocky dwarf, short, broad shoulders, beard',
    halfling: 'small halfling, child-sized, cheerful',
    dragonborn: 'reptilian dragonborn, scaled, dragon head',
    tiefling: 'tiefling with horns, tail, demonic features',
  };
  return shapes[race.toLowerCase()] || 'humanoid figure';
}

function getClassBasicAppearance(charClass: string): string {
  const appearances: Record<string, string> = {
    fighter: 'wearing armor, sword',
    wizard: 'wearing robes, staff',
    rogue: 'wearing leather, hooded',
    cleric: 'wearing vestments, holy symbol',
    // ... etc
  };
  return appearances[charClass.toLowerCase()] || 'adventurer';
}

function getBackgroundEquipment(background: string): string {
  const equipment: Record<string, string> = {
    noble: 'fine clothes, signet ring, elegant',
    soldier: 'military gear, medals, disciplined',
    criminal: 'dark clothes, thieves tools, shadowy',
    acolyte: 'religious vestments, prayer beads',
    // ... etc
  };
  return equipment[background.toLowerCase()] || '';
}

function getPhysiqueFromAbilities(abilities: Record<string, number>): string {
  const parts: string[] = [];
  
  if (abilities.strength >= 16) parts.push('muscular powerful build');
  else if (abilities.strength <= 8) parts.push('slight build');
  
  if (abilities.dexterity >= 16) parts.push('lithe agile');
  
  if (abilities.constitution >= 16) parts.push('sturdy robust');
  else if (abilities.constitution <= 8) parts.push('frail');
  
  if (abilities.charisma >= 16) parts.push('attractive commanding presence');
  
  return parts.join(', ');
}

function getAppearanceDetails(appearance: Record<string, string>): string {
  const parts: string[] = [];
  
  if (appearance.hairColor) parts.push(`${appearance.hairColor} hair`);
  if (appearance.hairStyle) parts.push(`${appearance.hairStyle}`);
  if (appearance.eyeColor) parts.push(`${appearance.eyeColor} eyes`);
  if (appearance.skinTone) parts.push(`${appearance.skinTone} skin`);
  if (appearance.facialHair) parts.push(appearance.facialHair);
  if (appearance.scars) parts.push(appearance.scars);
  
  return parts.join(', ');
}

function getPersonalityExpression(personality: Record<string, string>): string {
  const trait = personality.trait?.toLowerCase() || '';
  const flaw = personality.flaw?.toLowerCase() || '';
  
  if (trait.includes('friendly')) return 'warm friendly expression';
  if (trait.includes('suspicious')) return 'wary guarded look';
  if (flaw.includes('pride')) return 'confident proud expression';
  if (flaw.includes('coward')) return 'nervous uncertain expression';
  
  return 'determined heroic expression';
}
```

---

# PART 5: API ENDPOINTS

## 5.1 Character Portrait Endpoint

```typescript
// services/api-gateway/src/routes/media.ts

import { Router } from 'express';
import { generateCharacterPortrait } from '@dnd/media-service';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

const portraitSchema = z.object({
  characterId: z.string().uuid().optional(),
  character: z.object({
    race: z.string(),
    class: z.string(),
    background: z.string().optional(),
    appearance: z.object({
      hairColor: z.string().optional(),
      hairStyle: z.string().optional(),
      eyeColor: z.string().optional(),
      skinTone: z.string().optional(),
      facialHair: z.string().optional(),
      distinguishingMarks: z.string().optional(),
    }).optional(),
    personality: z.object({
      trait: z.string().optional(),
      ideal: z.string().optional(),
      bond: z.string().optional(),
      flaw: z.string().optional(),
    }).optional(),
  }).optional(),
  style: z.enum(['portrait', 'full_body', 'action_pose']).default('portrait'),
  quality: z.enum(['standard', 'high']).default('standard'),
});

router.post(
  '/generate/portrait',
  authenticateToken,
  validateRequest(portraitSchema),
  async (req, res) => {
    try {
      const { character, style, quality } = req.body;
      
      const imageUrl = await generateCharacterPortrait({
        character,
        style,
        quality,
      });
      
      res.json({
        success: true,
        imageUrl,
      });
      
    } catch (error: any) {
      console.error('Portrait generation failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;
```

## 5.2 Progressive Visualization Endpoint

```typescript
router.post(
  '/generate/progressive',
  authenticateToken,
  validateRequest(progressiveSchema),
  async (req, res) => {
    try {
      const state = req.body;
      
      const imageUrl = await generateProgressiveVisualization(state);
      
      res.json({
        success: true,
        imageUrl,
        level: state.level,
      });
      
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);
```

---

# PART 6: CONTENT SAFETY IMPLEMENTATION

## 6.1 Safety Utilities

```typescript
// services/media-service/src/utils/contentSafety.ts

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

export function validateGeneratedImage(imageUrl: string): Promise<boolean> {
  // TODO: Integrate with image moderation service (e.g., Google Vision SafeSearch)
  // For now, trust the negative prompt to do its job
  return Promise.resolve(true);
}
```

---

# PART 7: ENVIRONMENT CONFIGURATION

## 7.1 Environment Variables

```env
# .env

# NanoBanana API
NANOBANANA_API_KEY=your_api_key_here

# Cost control
NANOBANANA_MAX_DAILY_SPEND=10.00  # Maximum daily spend in USD
NANOBANANA_DEFAULT_QUALITY=standard  # standard or high

# Caching
REDIS_URL=redis://localhost:6379
IMAGE_CACHE_TTL_SECONDS=86400  # 24 hours

# Storage
GENERATED_IMAGES_BUCKET=dnd-generated-images
CDN_URL=https://cdn.yourdomain.com
```

## 7.2 Cost Tracking

```typescript
// services/media-service/src/utils/costTracker.ts

import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const COST_PER_IMAGE = {
  standard: 0.02,  // NanoBanana API
  high: 0.12,      // NanoBanana Pro API
};

export async function trackImageGeneration(quality: 'standard' | 'high'): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const key = `nanobanana:cost:${today}`;
  
  const cost = COST_PER_IMAGE[quality];
  await redis.incrbyfloat(key, cost);
  await redis.expire(key, 86400 * 7); // Keep 7 days
}

export async function getDailySpend(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const key = `nanobanana:cost:${today}`;
  
  const spend = await redis.get(key);
  return parseFloat(spend || '0');
}

export async function canGenerateImage(quality: 'standard' | 'high'): Promise<boolean> {
  const maxSpend = parseFloat(process.env.NANOBANANA_MAX_DAILY_SPEND || '10');
  const currentSpend = await getDailySpend();
  const cost = COST_PER_IMAGE[quality];
  
  return (currentSpend + cost) <= maxSpend;
}
```

---

# PART 8: USAGE EXAMPLES

## 8.1 Generate Character Portrait (React Component)

```tsx
// apps/web/src/components/character-builder/PortraitGenerator.tsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCharacterBuilder } from '@/hooks/useCharacterBuilder';
import { api } from '@/lib/api';

export function PortraitGenerator() {
  const { character } = useCharacterBuilder();
  const [isGenerating, setIsGenerating] = useState(false);
  const [portrait, setPortrait] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const generatePortrait = async (quality: 'standard' | 'high') => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await api.post('/media/generate/portrait', {
        character,
        style: 'portrait',
        quality,
      });
      
      setPortrait(response.data.imageUrl);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate portrait');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="portrait-generator">
      <h3>Character Portrait</h3>
      
      {portrait ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="portrait-display"
        >
          <img src={portrait} alt={character.name} />
          <button onClick={() => setPortrait(null)}>
            Regenerate
          </button>
        </motion.div>
      ) : (
        <div className="portrait-options">
          <p>Generate a portrait for {character.name}</p>
          
          <div className="quality-options">
            <button
              onClick={() => generatePortrait('standard')}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Standard Quality (~$0.02)'}
            </button>
            
            <button
              onClick={() => generatePortrait('high')}
              disabled={isGenerating}
              className="premium"
            >
              {isGenerating ? 'Generating...' : 'High Quality 4K (~$0.12)'}
            </button>
          </div>
          
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
}
```

---

**END OF DOCUMENT 44**
