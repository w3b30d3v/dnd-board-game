// Media Generation Routes
// Handles AI image generation for character portraits, locations, etc.

import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth.js';
import { generatePersonalityContent, generateAllPersonalityContent } from '../services/personalityGenerator.js';

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
router.post('/generate/portrait', auth, async (req: Request, res: Response) => {
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
router.post('/generate/personality', auth, async (req: Request, res: Response) => {
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
router.post('/generate/personality/all', auth, async (req: Request, res: Response) => {
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
  const { race, class: charClass, appearance } = character;

  // Core description - Classic D&D style like official Wizards of the Coast artwork
  const parts = [
    // Art style reference - classic D&D look
    'official Dungeons and Dragons character portrait',
    'Wizards of the Coast art style',
    'Players Handbook illustration style',
    'classic fantasy RPG character art',
    'oil painting style',
    'realistic fantasy art',

    // Race and class
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
    portrait: 'dramatic portrait, three-quarter view, intense gaze, moody lighting, dark atmospheric background',
    full_body: 'full body heroic stance, medieval fantasy setting, torch lit dungeon background',
    action_pose: 'dynamic combat pose, spell effects, dramatic action scene, cinematic composition',
  };
  parts.push(styleTerms[style] || styleTerms.portrait);

  // Classic D&D aesthetic terms
  parts.push(
    'medieval fantasy aesthetic',
    'weathered battle-worn equipment',
    'authentic period-accurate armor and weapons',
    'rich earth tones and deep shadows',
    'dramatic chiaroscuro lighting',
    'textured brushwork',
    'fully clothed in practical adventurer gear',
    'heroic but realistic proportions'
  );

  // Quality terms
  parts.push(
    'masterpiece quality',
    'highly detailed face and armor',
    'sharp focus on character',
    'professional fantasy illustration',
    'museum quality artwork',
    '8k resolution details'
  );

  const prompt = parts.filter(Boolean).join(', ');

  // Negative prompt (mandatory for safety + avoiding non-D&D styles)
  const negativePrompt = [
    // Safety
    'nude', 'naked', 'nsfw', 'sexual', 'suggestive', 'revealing clothing',
    'bikini', 'lingerie', 'gore', 'excessive blood',
    // Quality
    'deformed', 'ugly', 'blurry', 'low quality', 'bad anatomy',
    'extra limbs', 'mutated', 'watermark', 'signature', 'text',
    // Style avoidance - keep it classic D&D
    'anime', 'manga', 'cartoon', 'chibi', 'cute', 'kawaii',
    'modern clothing', 'sci-fi', 'cyberpunk', 'steampunk',
    'photo realistic', 'photography', 'real person',
    'plastic', 'glossy', 'smooth skin', 'airbrushed',
    'video game screenshot', 'CGI', '3D render'
  ].join(', ');

  return { prompt, negativePrompt };
}

function getRaceDescription(race: string): string {
  // Classic D&D race descriptions matching official sourcebook artwork
  const descriptions: Record<string, string> = {
    human: 'human adventurer, determined weathered face, realistic human proportions, scars from past battles, strong jaw, expressive eyes showing wisdom and experience',
    elf: 'high elf, gracefully elongated pointed ears, angular cheekbones, almond-shaped luminous eyes, otherworldly ageless beauty, flowing hair, ethereal presence, slight build but athletic',
    dwarf: 'mountain dwarf, broad stocky powerful build, magnificent braided beard with metal clasps, weathered ruddy complexion, deep-set proud eyes, prominent nose, battle scars, clan markings',
    halfling: 'halfling, small stature standing 3 feet tall, youthful round friendly face, curly brown or auburn hair, large hairy feet, cheerful expression, nimble build',
    dragonborn: 'dragonborn, tall reptilian humanoid, scaled skin with metallic or chromatic coloring, draconic head with snout, no tail, powerful muscular build, proud warrior bearing, small horns',
    tiefling: 'tiefling, curved ram-like horns, solid colored eyes without pupils, skin tinted red or purple, long pointed tail, sharp teeth, infernal heritage visible, mysterious alluring',
    gnome: 'rock gnome, very small standing 3 feet, large curious sparkling eyes, prominent pointed nose, wild unkempt hair, animated excited expression, tinker tools on belt',
    'half-elf': 'half-elf, subtle pointed ears, blend of human and elven features, slightly angular face, dual heritage visible, adaptable appearance, hauntingly beautiful',
    'half-orc': 'half-orc, powerfully muscular imposing build, grayish-green skin tone, prominent lower tusks jutting from jaw, fierce intimidating expression, tribal scars, slightly pointed ears',
  };

  return descriptions[race.toLowerCase()] || 'fantasy humanoid adventurer';
}

function getClassAppearance(charClass: string): string {
  // Classic D&D class appearances matching official sourcebook artwork
  const appearances: Record<string, string> = {
    fighter: 'battle-hardened warrior, wearing dented scratched plate armor showing years of combat, longsword and shield, military stance, confident veteran expression, red cloak',
    wizard: 'scholarly arcane master, wearing deep blue or purple robes with silver arcane embroidery, carrying gnarled wooden staff with crystal, spellbook at hip, wise penetrating gaze, long beard',
    rogue: 'shadowy infiltrator, wearing supple dark leather armor, deep hood obscuring face, multiple concealed daggers, lockpicks visible, calculating cunning expression, lurking in shadows',
    cleric: 'divine champion, wearing polished chainmail over holy vestments, prominent holy symbol of deity, mace or warhammer, righteous determined expression, divine light emanating',
    paladin: 'holy knight, wearing gleaming ornate full plate armor with religious iconography, radiant holy sword, noble commanding presence, unwavering conviction in eyes, flowing cape',
    ranger: 'wilderness hunter, wearing practical worn green and brown leather and fur, longbow and quiver, twin shortswords, alert watchful expression, face paint, hooded cloak',
    barbarian: 'primal warrior, wearing minimal fur and leather showing muscular physique, greataxe or greatsword, tribal war paint and tattoos, wild untamed hair, fierce battle rage in eyes',
    bard: 'charismatic performer, wearing fine colorful clothes with flourishes, carrying lute or other instrument, rapier at hip, charming confident smile, feathered cap, theatrical pose',
    druid: 'nature guardian, wearing robes of natural materials with leaves and vines woven in, gnarled wooden staff, wild unkempt hair with feathers and twigs, serene connection to nature, animal companion nearby',
    monk: 'disciplined martial artist, wearing simple practical robes, bare calloused hands and feet, shaved head or topknot, serene focused meditative expression, athletic lean build, prayer beads',
    sorcerer: 'innate magic wielder, wearing elegant but practical clothes, magical energy crackling around hands, confident born-with-power expression, draconic or wild magic visual hints, glowing eyes',
    warlock: 'pact-bound occultist, wearing dark mysterious robes with eldritch symbols, otherworldly patron influence visible, haunted knowing eyes, arcane focus glowing with power, shadowy aura',
  };

  return appearances[charClass.toLowerCase()] || 'seasoned adventurer with appropriate gear';
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
