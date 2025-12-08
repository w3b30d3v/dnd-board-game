// Media Generation Routes
// Handles AI image generation for character portraits, locations, etc.

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { generatePersonalityContent, generateAllPersonalityContent } from '../services/personalityGenerator';

const router = Router();

// Environment configuration
const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY;
const NANOBANANA_API_URL = 'https://api.nanobananaapi.ai/v1';

interface PortraitRequest {
  character: {
    race: string;
    class: string;
    background?: string;
    name?: string;
    appearance?: {
      hairColor?: string;
      hairStyle?: string;
      eyeColor?: string;
      skinTone?: string;
      facialHair?: string;
      distinguishingMarks?: string;
    };
    personality?: {
      trait?: string;
      ideal?: string;
      bond?: string;
      flaw?: string;
    };
  };
  style?: 'portrait' | 'full_body' | 'action_pose';
  quality?: 'standard' | 'high';
}

// Generate character portrait
router.post('/generate/portrait', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { character, style = 'portrait', quality = 'standard' } = req.body as PortraitRequest;

    if (!character || !character.race || !character.class) {
      return res.status(400).json({
        success: false,
        error: 'Character race and class are required',
      });
    }

    // Build the prompt
    const prompt = buildCharacterPrompt(character, style);

    // If NanoBanana API is configured, use it
    if (NANOBANANA_API_KEY) {
      try {
        const imageUrl = await generateWithNanoBanana(prompt, quality);
        return res.json({
          success: true,
          imageUrl,
          source: 'nanobanana',
        });
      } catch (apiError) {
        console.warn('NanoBanana API failed, using fallback:', apiError);
      }
    }

    // Fallback to DiceBear
    const fallbackUrl = generateDiceBearFallback(character);
    return res.json({
      success: true,
      imageUrl: fallbackUrl,
      source: 'fallback',
    });
  } catch (error: any) {
    console.error('Portrait generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Portrait generation failed',
    });
  }
});

// Generate personality content
router.post('/generate/personality', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { field, race, class: charClass, background, name } = req.body;

    if (!field) {
      return res.status(400).json({
        success: false,
        error: 'Field is required (personalityTrait, ideal, bond, flaw, or backstory)',
      });
    }

    const content = await generatePersonalityContent({
      field,
      race,
      class: charClass,
      background,
      name,
    });

    res.json({
      success: true,
      content,
    });
  } catch (error: any) {
    console.error('Personality generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Personality generation failed',
    });
  }
});

// Generate all personality fields at once
router.post('/generate/personality/all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { race, class: charClass, background, name } = req.body;

    const content = await generateAllPersonalityContent({
      race,
      class: charClass,
      background,
      name,
    });

    res.json({
      success: true,
      ...content,
    });
  } catch (error: any) {
    console.error('Personality generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Personality generation failed',
    });
  }
});

// Helper functions

function buildCharacterPrompt(
  character: PortraitRequest['character'],
  style: string
): { prompt: string; negativePrompt: string } {
  const { race, class: charClass, appearance, personality } = character;

  // Core description
  const parts = [
    'fantasy character portrait',
    'dungeons and dragons art style',
    'detailed digital painting',
    getRaceDescription(race),
    getClassAppearance(charClass),
  ];

  // Physical features
  if (appearance) {
    if (appearance.hairColor) parts.push(`${appearance.hairColor} hair`);
    if (appearance.hairStyle) parts.push(`${appearance.hairStyle} hairstyle`);
    if (appearance.eyeColor) parts.push(`${appearance.eyeColor} eyes`);
    if (appearance.skinTone) parts.push(`${appearance.skinTone} skin`);
    if (appearance.facialHair) parts.push(appearance.facialHair);
    if (appearance.distinguishingMarks) parts.push(appearance.distinguishingMarks);
  }

  // Style-specific terms
  const styleTerms: Record<string, string> = {
    portrait: 'head and shoulders portrait, facing slightly to side, eye contact',
    full_body: 'full body standing pose, head to toe visible, dynamic stance',
    action_pose: 'dynamic action pose, mid-movement, dramatic angle, combat ready',
  };
  parts.push(styleTerms[style] || styleTerms.portrait);

  // Safety terms (mandatory)
  parts.push(
    'fully clothed',
    'appropriate fantasy armor and attire',
    'heroic pose',
    'professional illustration',
    'family friendly'
  );

  // Quality terms
  parts.push('masterpiece', 'best quality', 'highly detailed', 'sharp focus', 'dramatic lighting');

  const prompt = parts.filter(Boolean).join(', ');

  // Negative prompt (mandatory for safety)
  const negativePrompt = [
    'nude',
    'naked',
    'nsfw',
    'sexual',
    'suggestive',
    'revealing clothing',
    'bikini',
    'lingerie',
    'gore',
    'blood',
    'violent',
    'disturbing',
    'deformed',
    'ugly',
    'blurry',
    'low quality',
    'bad anatomy',
    'extra limbs',
    'mutated',
    'watermark',
    'signature',
    'text',
  ].join(', ');

  return { prompt, negativePrompt };
}

function getRaceDescription(race: string): string {
  const descriptions: Record<string, string> = {
    human: 'human, realistic proportions, noble bearing',
    elf: 'elf, pointed ears, elegant angular features, ethereal beauty, ageless appearance',
    dwarf: 'dwarf, stocky muscular build, magnificent beard, rugged features, proud stance',
    halfling: 'halfling, small stature, youthful cheerful face, curly hair',
    dragonborn: 'dragonborn, reptilian humanoid, scaled skin, draconic head, powerful build',
    tiefling: 'tiefling, demonic horns, solid colored eyes, pointed tail, infernal heritage',
    gnome: 'gnome, very small, large curious eyes, pointed nose, wild hair',
    'half-elf': 'half-elf, slightly pointed ears, blend of human and elven grace',
    'half-orc': 'half-orc, muscular imposing build, prominent lower tusks, grayish-green skin',
  };

  return descriptions[race.toLowerCase()] || 'fantasy humanoid';
}

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
  };

  return appearances[charClass.toLowerCase()] || 'adventurer gear and equipment';
}

async function generateWithNanoBanana(
  promptConfig: { prompt: string; negativePrompt: string },
  quality: string
): Promise<string> {
  const fetch = (await import('node-fetch')).default;

  const endpoint = quality === 'high' ? '/generate-pro' : '/generate';

  const response = await fetch(`${NANOBANANA_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NANOBANANA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: promptConfig.prompt,
      negative_prompt: promptConfig.negativePrompt,
      aspect_ratio: '1:1',
      resolution: quality === 'high' ? '2k' : '1k',
      output_format: 'png',
    }),
  });

  if (!response.ok) {
    throw new Error(`NanoBanana API error: ${response.status}`);
  }

  const data = (await response.json()) as { task_id: string; status: string; image_url?: string };

  // If completed immediately
  if (data.status === 'completed' && data.image_url) {
    return data.image_url;
  }

  // Poll for completion
  const taskId = data.task_id;
  const maxWait = 60000; // 60 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const statusResponse = await fetch(`${NANOBANANA_API_URL}/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${NANOBANANA_API_KEY}`,
      },
    });

    const statusData = (await statusResponse.json()) as { status: string; image_url?: string };

    if (statusData.status === 'completed' && statusData.image_url) {
      return statusData.image_url;
    }

    if (statusData.status === 'failed') {
      throw new Error('Image generation failed');
    }
  }

  throw new Error('Image generation timed out');
}

function generateDiceBearFallback(character: PortraitRequest['character']): string {
  const { race, class: charClass, name } = character;

  // Create a deterministic seed from character details
  const seed = `${race}-${charClass}-${name || 'hero'}-${Date.now()}`;

  // Choose style based on race
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

  const style = styleMap[race.toLowerCase()] || 'adventurer';

  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1b26&size=512`;
}

export default router;
