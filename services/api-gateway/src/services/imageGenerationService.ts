// Image Generation Service
// Handles AI image generation for characters

import { PrismaClient } from '@prisma/client';
import { config } from '../config.js';

const prisma = new PrismaClient();

// Get limits from config
const MAX_AI_CHARACTERS_PER_USER = config.characterGeneration.maxCharactersPerUser;
const MAX_FULLBODY_IMAGES_PER_CHARACTER = config.characterGeneration.maxFullBodyImagesPerCharacter;

// Environment configuration
const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY;
const NANOBANANA_API_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';
const CALLBACK_BASE_URL = process.env.CALLBACK_BASE_URL || '';

interface CharacterData {
  id: string;
  name: string;
  race: string;
  class: string;
  background: string;
  appearance?: unknown;
}

interface GenerationResult {
  images: {
    portrait: string;
    fullBodyUrls: string[];
  };
  source: 'nanobanana' | 'fallback';
  imagesGenerated: number;
  remaining: number;
  limit: number;
}

// In-memory store for pending image generations - SHARED across all services
// This map is exported and used by the webhook handler in media.ts
export const pendingImageTasks = new Map<string, {
  resolve: (url: string) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}>();

export class ImageGenerationService {
  async generateForCharacter(userId: string, character: CharacterData): Promise<GenerationResult> {
    // Check user's generation limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiCharactersGenerated: true },
    });

    const currentCount = user?.aiCharactersGenerated || 0;

    if (currentCount >= MAX_AI_CHARACTERS_PER_USER) {
      throw new Error(`You have reached the maximum of ${MAX_AI_CHARACTERS_PER_USER} AI-generated characters.`);
    }

    // If NanoBanana API is not configured, return fallback immediately
    if (!NANOBANANA_API_KEY) {
      const fallbackUrl = this.generateDiceBearFallback(character);
      return {
        images: {
          portrait: fallbackUrl,
          fullBodyUrls: Array(MAX_FULLBODY_IMAGES_PER_CHARACTER).fill(fallbackUrl),
        },
        source: 'fallback',
        imagesGenerated: 0,
        remaining: MAX_AI_CHARACTERS_PER_USER - currentCount,
        limit: MAX_AI_CHARACTERS_PER_USER,
      };
    }

    // Generate images
    const images: { portrait: string; fullBodyUrls: string[] } = {
      portrait: '',
      fullBodyUrls: [],
    };
    let successCount = 0;

    // 1. Generate portrait
    try {
      const portraitPrompt = this.buildCharacterPrompt(character, 'portrait');
      images.portrait = await this.generateWithNanoBanana(portraitPrompt, 'standard', 'portrait');
      successCount++;
    } catch (error) {
      console.warn('Portrait generation failed:', error);
      images.portrait = this.generateDiceBearFallback(character);
    }

    // 2. Generate full-body images
    const fullBodyStyles = ['full_body', 'action_pose'];
    for (let i = 0; i < MAX_FULLBODY_IMAGES_PER_CHARACTER; i++) {
      const style = fullBodyStyles[i % fullBodyStyles.length] || 'full_body';
      try {
        const prompt = this.buildCharacterPrompt(character, style);
        const url = await this.generateWithNanoBanana(prompt, 'standard', style);
        images.fullBodyUrls.push(url);
        successCount++;
      } catch (error) {
        console.warn(`Full body ${i + 1} generation failed:`, error);
        images.fullBodyUrls.push(this.generateDiceBearFallback(character));
      }
    }

    // Increment counter if at least one AI image was generated
    if (successCount > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { aiCharactersGenerated: { increment: 1 } },
      });
    }

    const newCount = successCount > 0 ? currentCount + 1 : currentCount;

    return {
      images,
      source: successCount > 0 ? 'nanobanana' : 'fallback',
      imagesGenerated: successCount,
      remaining: MAX_AI_CHARACTERS_PER_USER - newCount,
      limit: MAX_AI_CHARACTERS_PER_USER,
    };
  }

  // Handle webhook callback from NanoBanana
  handleWebhook(taskId: string, imageUrl: string | null, error: string | null): void {
    const pending = pendingImageTasks.get(taskId);
    if (!pending) {
      console.warn(`No pending task found for taskId: ${taskId}`);
      return;
    }

    clearTimeout(pending.timeout);
    pendingImageTasks.delete(taskId);

    if (error || !imageUrl) {
      pending.reject(new Error(error || 'No image URL in webhook response'));
    } else {
      pending.resolve(imageUrl);
    }
  }

  private generateDiceBearFallback(character: CharacterData): string {
    const seed = `${character.race}-${character.class}-${character.name || 'hero'}-${Date.now()}`;
    const styleMap: Record<string, string> = {
      human: 'adventurer',
      elf: 'lorelei',
      dwarf: 'avataaars',
      halfling: 'adventurer',
      dragonborn: 'bottts',
      tiefling: 'bottts',
      gnome: 'micah',
      'half-elf': 'lorelei',
      'half-orc': 'avataaars',
    };
    const style = styleMap[character.race.toLowerCase()] || 'adventurer';
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1b26&size=512`;
  }

  private buildCharacterPrompt(
    character: CharacterData,
    style: string
  ): { prompt: string; negativePrompt: string } {
    const raceDetails = this.getRaceDescription(character.race);
    const classDetails = this.getClassDescription(character.class);

    const artStyle = [
      'official Dungeons and Dragons 5th Edition character illustration',
      'by Larry Elmore',
      'by Todd Lockwood',
      'Players Handbook cover art quality',
      'epic fantasy book cover art',
      'rich color palette with deep shadows',
    ].join(', ');

    let composition: string;
    if (style === 'portrait') {
      composition = [
        'PORTRAIT ONLY',
        'head and shoulders composition',
        'close-up face shot from chest up',
        'NO full body',
        'detailed facial features',
        'expressive eyes',
        'three-quarter face angle',
        'dramatic Rembrandt lighting',
      ].join(', ');
    } else if (style === 'action_pose') {
      composition = 'dynamic action pose, full body visible head to toe, mid-combat stance, weapon raised, dramatic motion blur, intense expression';
    } else {
      composition = 'full body character design, complete figure visible from head to toe, standing heroic pose, confident stance';
    }

    const background = 'dramatic fantasy environment, torch-lit stone dungeon, mystical fog, volumetric god rays';
    const qualityTerms = 'ultra high detail, cinematic lighting, 8K resolution, masterpiece';

    const prompt = [artStyle, composition, raceDetails, classDetails, background, qualityTerms].join(', ');

    const negativePrompt = [
      'bad anatomy', 'wrong anatomy', 'extra limbs', 'missing limbs',
      'anime', 'cartoon', 'chibi', 'modern', 'sci-fi',
      'nude', 'nsfw', 'gore', 'blood',
      'blurry', 'low quality', 'watermark',
    ].join(', ');

    return { prompt, negativePrompt };
  }

  private getRaceDescription(race: string): string {
    const descriptions: Record<string, string> = {
      human: 'human adventurer, determined weathered face, strong jaw',
      elf: 'high elf, gracefully elongated pointed ears, angular cheekbones, almond-shaped luminous eyes',
      dwarf: 'mountain dwarf, broad stocky powerful build, magnificent braided beard',
      halfling: 'halfling, small stature standing 3 feet tall, youthful round friendly face',
      dragonborn: 'dragonborn, tall reptilian humanoid, scaled skin, draconic head',
      tiefling: 'tiefling, curved ram-like horns, solid colored eyes, skin tinted red or purple',
      gnome: 'rock gnome, very small, large curious sparkling eyes, prominent pointed nose',
      'half-elf': 'half-elf, subtle pointed ears, blend of human and elven features',
      'half-orc': 'half-orc, powerfully muscular build, grayish-green skin, prominent lower tusks',
    };
    return descriptions[race.toLowerCase()] || 'fantasy humanoid adventurer';
  }

  private getClassDescription(charClass: string): string {
    const descriptions: Record<string, string> = {
      fighter: 'battle-hardened warrior, wearing plate armor, longsword and shield',
      wizard: 'scholarly arcane master, wearing robes with arcane embroidery, carrying staff',
      rogue: 'shadowy infiltrator, wearing dark leather armor, multiple concealed daggers',
      cleric: 'divine champion, wearing chainmail over holy vestments, mace and holy symbol',
      paladin: 'holy knight, gleaming full plate armor, radiant holy sword',
      ranger: 'wilderness hunter, wearing green and brown leather, longbow and quiver',
      barbarian: 'primal warrior, minimal fur and leather, greataxe, tribal war paint',
      bard: 'charismatic performer, colorful clothes, carrying lute, rapier at hip',
      druid: 'nature guardian, robes of natural materials, gnarled wooden staff',
      monk: 'disciplined martial artist, simple practical robes, athletic lean build',
      sorcerer: 'innate magic wielder, magical energy crackling around hands',
      warlock: 'pact-bound occultist, dark mysterious robes with eldritch symbols',
    };
    return descriptions[charClass.toLowerCase()] || 'seasoned adventurer with appropriate gear';
  }

  private async generateWithNanoBanana(
    promptConfig: { prompt: string; negativePrompt: string },
    quality: string,
    style: string
  ): Promise<string> {
    const fetch = (await import('node-fetch')).default;

    if (!CALLBACK_BASE_URL) {
      throw new Error('Callback URL not configured for NanoBanana API');
    }

    const endpoint = quality === 'high' ? '/generate-pro' : '/generate';
    const fullPrompt = `${promptConfig.prompt}. DO NOT include: ${promptConfig.negativePrompt}`;
    const imageSize = style === 'portrait' ? '1:1' : '2:3';

    const requestBody = {
      prompt: fullPrompt,
      type: 'TEXTTOIAMGE',
      callBackUrl: `${CALLBACK_BASE_URL}/media/webhook/nanobanana`,
      numImages: 1,
      image_size: imageSize,
    };

    const response = await fetch(`${NANOBANANA_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NANOBANANA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`NanoBanana API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      code: number;
      msg: string;
      data?: {
        taskId?: string;
        imageUrl?: string;
        imageUrls?: string[];
      };
    };

    if (data.code !== 200) {
      throw new Error(`NanoBanana API error: ${data.msg}`);
    }

    // If image URL is returned immediately
    if (data.data?.imageUrl) {
      return data.data.imageUrl;
    }
    if (data.data?.imageUrls && data.data.imageUrls.length > 0 && data.data.imageUrls[0]) {
      return data.data.imageUrls[0];
    }

    // Wait for webhook callback
    const taskId = data.data?.taskId;
    if (!taskId) {
      throw new Error('No task ID returned from NanoBanana API');
    }

    const maxWait = 50000;
    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingImageTasks.delete(taskId);
        reject(new Error('Image generation timed out waiting for webhook'));
      }, maxWait);

      pendingImageTasks.set(taskId, { resolve, reject, timeout });
    });
  }
}

// Export for webhook handler
export { pendingImageTasks };
