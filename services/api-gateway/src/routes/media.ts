// Media Generation Routes
// Handles AI image generation for character portraits, locations, etc.

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth.js';
import { generatePersonalityContent, generateAllPersonalityContent } from '../services/personalityGenerator.js';
import { config } from '../config.js';

const router: Router = Router();
const prisma = new PrismaClient();

// Get limits from config (admin-configurable via env vars)
const MAX_AI_CHARACTERS_PER_USER = config.characterGeneration.maxCharactersPerUser;
const MAX_FULLBODY_IMAGES_PER_CHARACTER = config.characterGeneration.maxFullBodyImagesPerCharacter;

// Environment configuration
const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY;
const NANOBANANA_API_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';
const CALLBACK_BASE_URL = process.env.CALLBACK_BASE_URL || ''; // Required for NanoBanana webhook

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

// Check user's AI generation limit
router.get('/generation-limit', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiCharactersGenerated: true },
    });

    const generated = user?.aiCharactersGenerated || 0;
    const remaining = Math.max(0, MAX_AI_CHARACTERS_PER_USER - generated);

    return res.json({
      success: true,
      generated,
      remaining,
      limit: MAX_AI_CHARACTERS_PER_USER,
    });
  } catch (error: any) {
    console.error('Failed to check generation limit:', error);
    return res.status(500).json({ success: false, error: 'Failed to check limit' });
  }
});

// Generate character images (1 portrait + configurable full-body poses)
// This counts as 1 character against the user's limit
router.post('/generate/character-images', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { character, quality = 'standard' } = req.body as PortraitRequest;

    if (!character || !character.race || !character.class) {
      return res.status(400).json({
        success: false,
        error: 'Character race and class are required',
      });
    }

    // Check user's generation limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiCharactersGenerated: true },
    });

    const currentCount = user?.aiCharactersGenerated || 0;
    const totalImagesPerCharacter = 1 + MAX_FULLBODY_IMAGES_PER_CHARACTER; // 1 portrait + N full body

    if (currentCount >= MAX_AI_CHARACTERS_PER_USER) {
      return res.status(403).json({
        success: false,
        error: `You have reached the maximum of ${MAX_AI_CHARACTERS_PER_USER} AI-generated characters. Each character uses ${totalImagesPerCharacter} AI images.`,
        limitReached: true,
        generated: currentCount,
        limit: MAX_AI_CHARACTERS_PER_USER,
      });
    }

    // If NanoBanana API is not configured, return fallback immediately
    if (!NANOBANANA_API_KEY) {
      const fallbackUrl = generateDiceBearFallback(character);
      const fallbackImages: Record<string, string> = { portrait: fallbackUrl };
      for (let i = 1; i <= MAX_FULLBODY_IMAGES_PER_CHARACTER; i++) {
        fallbackImages[`fullBody${i}`] = fallbackUrl;
      }
      return res.json({
        success: true,
        images: fallbackImages,
        source: 'fallback',
        generated: currentCount,
        remaining: MAX_AI_CHARACTERS_PER_USER - currentCount,
        limit: MAX_AI_CHARACTERS_PER_USER,
      });
    }

    // Generate images: 1 portrait + N full-body images
    const images: Record<string, string> = {};
    let successCount = 0;

    // 1. Generate portrait (head/shoulders) - always first
    try {
      const portraitPrompt = buildCharacterPrompt(character, 'portrait');
      images.portrait = await generateWithNanoBanana(portraitPrompt, quality, 'portrait');
      successCount++;
      console.log('Portrait generated successfully');
    } catch (error) {
      console.warn('Portrait generation failed:', error);
      images.portrait = generateDiceBearFallback(character);
    }

    // 2. Generate full-body images based on config
    const fullBodyStyles = ['full_body', 'action_pose'];
    for (let i = 1; i <= MAX_FULLBODY_IMAGES_PER_CHARACTER; i++) {
      const style = fullBodyStyles[(i - 1) % fullBodyStyles.length] || 'full_body';
      try {
        const prompt = buildCharacterPrompt(character, style);
        images[`fullBody${i}`] = await generateWithNanoBanana(prompt, quality, style);
        successCount++;
        console.log(`Full body ${i} generated successfully`);
      } catch (error) {
        console.warn(`Full body ${i} generation failed:`, error);
        images[`fullBody${i}`] = generateDiceBearFallback(character);
      }
    }

    // Only increment counter if at least one AI image was successfully generated
    if (successCount > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { aiCharactersGenerated: { increment: 1 } },
      });
    }

    const newCount = successCount > 0 ? currentCount + 1 : currentCount;

    return res.json({
      success: true,
      images,
      source: successCount > 0 ? 'nanobanana' : 'fallback',
      imagesGenerated: successCount,
      generated: newCount,
      remaining: MAX_AI_CHARACTERS_PER_USER - newCount,
      limit: MAX_AI_CHARACTERS_PER_USER,
    });
  } catch (error: any) {
    console.error('Character images generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Character images generation failed',
    });
  }
});

// Generate single character portrait (legacy endpoint, doesn't count against limit)
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
        const imageUrl = await generateWithNanoBanana(prompt, quality, style);
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
    return res.status(500).json({
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

    return res.json({
      success: true,
      content,
    });
  } catch (error: any) {
    console.error('Personality generation failed:', error);
    return res.status(500).json({
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

    return res.json({
      success: true,
      ...content,
    });
  } catch (error: any) {
    console.error('Personality generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Personality generation failed',
    });
  }
});

// In-memory store for pending image generations (in production, use Redis)
const pendingImageTasks = new Map<string, {
  resolve: (url: string) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}>();

// Webhook endpoint for NanoBanana callbacks
router.post('/webhook/nanobanana', async (req: Request, res: Response) => {
  try {
    console.log('=== NanoBanana webhook received ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Pending tasks:', Array.from(pendingImageTasks.keys()));

    // NanoBanana webhook structure:
    // { code: 200, msg: "...", data: { taskId: "...", info: { resultImageUrl: "..." } } }
    const { code, msg, data } = req.body;

    // Extract nested fields
    const taskId = data?.taskId;
    const resultImageUrl = data?.info?.resultImageUrl;
    const failureReason = msg;

    // Find the task - either by taskId or use first pending task
    let resolvedTaskId = taskId;

    if (!resolvedTaskId && pendingImageTasks.size > 0) {
      // If no taskId but we have pending tasks and got a successful result, use the first pending task
      const pendingKeys = Array.from(pendingImageTasks.keys());
      if (pendingKeys.length > 0) {
        resolvedTaskId = pendingKeys[0];
        console.log(`No taskId in webhook, using first pending task: ${resolvedTaskId}`);
      }
    }

    if (!resolvedTaskId) {
      console.warn('No taskId in webhook and no pending tasks');
      return res.json({ success: true, message: 'Webhook received but no matching task' });
    }

    const pending = pendingImageTasks.get(resolvedTaskId);
    if (!pending) {
      console.warn(`No pending task found for taskId: ${resolvedTaskId}`);
      // Still return success - the task might have timed out
      return res.json({ success: true, message: 'Webhook received' });
    }

    // Clear the timeout
    clearTimeout(pending.timeout);
    pendingImageTasks.delete(resolvedTaskId);

    // Check for failure (code !== 200)
    if (code !== 200) {
      pending.reject(new Error(failureReason || 'Image generation failed'));
    } else {
      // Extract image URL from nested structure
      console.log(`Extracted image URL: ${resultImageUrl}`);
      if (resultImageUrl) {
        pending.resolve(resultImageUrl);
      } else {
        pending.reject(new Error('No image URL in webhook response'));
      }
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper functions

function buildCharacterPrompt(
  character: PortraitRequest['character'],
  style: string
): { prompt: string; negativePrompt: string } {
  const { race, class: charClass, appearance } = character;

  // Build a comprehensive full-body D&D character prompt
  const raceDetails = getFullRaceDescription(race);
  const classDetails = getFullClassDescription(charClass);

  // Core art style - reference specific D&D artists and styles
  const artStyle = [
    'official Dungeons and Dragons 5th Edition character illustration',
    'by Larry Elmore',
    'by Keith Parkinson',
    'by Todd Lockwood',
    'Players Handbook cover art quality',
    'Monster Manual illustration style',
    'epic fantasy book cover art',
    'traditional oil painting technique',
    'rich color palette with deep shadows',
  ].join(', ');

  // Composition based on style
  let composition: string;
  if (style === 'portrait') {
    // Portrait style - ONLY head and shoulders, NO full body
    composition = [
      'PORTRAIT ONLY',
      'head and shoulders composition',
      'close-up face shot from chest up',
      'NO full body',
      'NO legs visible',
      'NO feet visible',
      'cropped at chest level',
      'detailed facial features',
      'expressive eyes with catch lights',
      'three-quarter face angle',
      'dramatic Rembrandt lighting on face',
      'shallow depth of field blurred background',
      'face fills 60% of frame',
      'professional headshot composition',
    ].join(', ');
  } else if (style === 'action_pose') {
    composition = 'dynamic action pose, full body visible head to toe, mid-combat stance, weapon raised or in use, dramatic motion blur on edges, intense determined expression, captured mid-movement';
  } else {
    // full_body style - heroic standing pose
    composition = 'full body character design, complete figure visible from head to toe, standing heroic pose, weight on back foot ready for action, facing three-quarter view, confident stance';
  }

  // Environment/Background
  const background = [
    'dramatic fantasy environment background',
    'torch-lit stone dungeon walls',
    'mystical fog at feet',
    'volumetric god rays from above',
    'ancient carved stone pillars',
  ].join(', ');

  // Physical appearance details
  let physicalDetails = '';
  if (appearance) {
    const features = [];
    if (appearance.hairColor) features.push(`${appearance.hairColor} colored hair`);
    if (appearance.hairStyle) features.push(`${appearance.hairStyle} hair style`);
    if (appearance.eyeColor) features.push(`piercing ${appearance.eyeColor} eyes`);
    if (appearance.skinTone) features.push(`${appearance.skinTone} skin complexion`);
    if (appearance.facialHair) features.push(appearance.facialHair);
    if (appearance.distinguishingMarks) features.push(`distinctive ${appearance.distinguishingMarks}`);
    physicalDetails = features.join(', ');
  }

  // Quality and detail emphasis
  const qualityTerms = [
    'ultra high detail',
    'intricate armor engravings and textures',
    'visible leather stitching and metal rivets',
    'realistic fabric folds and material textures',
    'detailed facial features with expression',
    'individual hair strands visible',
    'scratches and wear on equipment',
    'cinematic dramatic lighting',
    'subsurface scattering on skin',
    '8K resolution',
    'award winning fantasy illustration',
    'artstation trending',
    'masterpiece',
  ].join(', ');

  // Combine all parts
  const promptParts = [
    artStyle,
    composition,
    raceDetails,
    classDetails,
    physicalDetails,
    background,
    qualityTerms,
    'fully clothed and armored',
    'appropriate medieval fantasy attire',
  ].filter(Boolean);

  const prompt = promptParts.join(', ');

  // Comprehensive negative prompt - add style-specific exclusions
  const baseNegativePrompts = [
    // Anatomy issues
    'bad anatomy', 'wrong anatomy', 'extra limbs', 'missing limbs', 'floating limbs',
    'disconnected limbs', 'malformed hands', 'extra fingers', 'missing fingers',
    'long neck', 'mutated', 'mutation', 'deformed', 'disfigured', 'poorly drawn face',
    'cloned face', 'gross proportions', 'malformed limbs', 'fused fingers', 'too many fingers',

    // Quality issues
    'ugly', 'blurry', 'low quality', 'low resolution', 'worst quality', 'jpeg artifacts',
    'pixelated', 'grainy', 'noisy image', 'out of frame', 'cropped', 'cut off',
    'watermark', 'signature', 'text', 'logo', 'username', 'artist name',

    // Wrong styles - NOT D&D
    'anime', 'manga', 'cartoon', 'chibi', 'kawaii', 'disney', 'pixar',
    'fortnite', 'overwatch', 'league of legends', 'world of warcraft stylized',
    'mobile game art', 'casual game', 'childish', 'cute style',

    // Wrong setting
    'modern', 'contemporary', 'sci-fi', 'futuristic', 'cyberpunk', 'steampunk',
    'guns', 'technology', 'electronics', 'cars', 'buildings',

    // Wrong medium
    'photography', 'photo', 'photorealistic', 'real person', 'real life',
    '3d render', 'cgi', 'video game screenshot', 'unreal engine', 'unity',
    'plastic', 'toy', 'figurine', 'miniature',

    // Content safety
    'nude', 'naked', 'nsfw', 'sexual', 'suggestive', 'revealing', 'bikini armor',
    'chainmail bikini', 'exposed skin', 'cleavage', 'gore', 'blood', 'violent',

    // Composition issues
    'bad composition', 'amateur', 'beginner art', 'sketch', 'unfinished',
    'simple background', 'white background', 'plain background',
  ];

  // For portrait style, explicitly exclude full body
  if (style === 'portrait') {
    baseNegativePrompts.push(
      'full body', 'full figure', 'legs visible', 'feet visible',
      'waist down', 'standing pose', 'walking', 'running',
      'distant view', 'wide shot', 'far away'
    );
  }

  const negativePrompt = baseNegativePrompts.join(', ');

  return { prompt, negativePrompt };
}

function getFullRaceDescription(race: string): string {
  const descriptions: Record<string, string> = {
    human: `human warrior,
      strong defined jawline with slight stubble,
      weathered tanned skin showing years of adventure,
      determined fierce eyes with crow's feet from squinting in sun,
      battle scars across cheek and brow,
      athletic muscular build,
      approximately 6 feet tall,
      shoulder-length brown hair tied back practically,
      noble bearing despite rugged appearance`,

    elf: `high elf,
      tall slender elegant build approximately 6 feet,
      impossibly graceful posture and movement,
      elongated pointed ears extending 4 inches,
      angular high cheekbones and narrow chin,
      large almond-shaped eyes with slight luminescence,
      flawless ageless pale skin with slight golden undertone,
      long flowing silver or golden hair past shoulders,
      ethereal otherworldly beauty,
      ancient wisdom visible in expression`,

    dwarf: `mountain dwarf,
      short stocky powerful build approximately 4.5 feet tall,
      extremely broad shoulders and barrel chest,
      thick muscular arms like tree trunks,
      magnificent long braided beard reaching belt with metal clan clasps,
      weathered ruddy complexion from forge work,
      deep-set fierce proud eyes under heavy brow,
      prominent broad nose,
      intricate braided hair with metal rings,
      visible clan tattoos on arms`,

    halfling: `lightfoot halfling,
      small cheerful build approximately 3 feet tall,
      round friendly youthful face with rosy cheeks,
      large expressive bright eyes full of curiosity,
      curly brown or auburn hair slightly wild,
      pointed slightly furry ears,
      large hairy bare feet with tough soles,
      nimble quick appearance,
      mischievous knowing smile`,

    dragonborn: `dragonborn warrior,
      tall imposing reptilian humanoid approximately 6.5 feet,
      powerful muscular scaled body,
      draconic head with elongated snout and sharp teeth,
      scales colored metallic brass or chromatic red,
      no tail but vestigial wing nubs on back,
      yellow reptilian eyes with vertical slit pupils,
      small horns sweeping back from skull,
      proud noble bearing of dragon ancestry`,

    tiefling: `tiefling,
      humanoid with obvious infernal heritage,
      large curved ram-like horns sweeping back from forehead,
      solid colored eyes without visible pupils glowing faintly,
      skin tinted deep crimson or purple,
      long pointed prehensile tail,
      sharp pointed teeth and slightly pointed ears,
      supernaturally attractive yet unsettling features,
      otherworldly dangerous allure`,

    gnome: `rock gnome,
      very small build approximately 3 feet tall,
      disproportionately large head with huge curious eyes,
      long prominent pointed nose,
      wild unkempt colorful hair sticking in all directions,
      weathered tan skin from outdoor tinkering,
      animated excited expression,
      various tools and gadgets hanging from belt,
      nimble clever fingers`,

    'half-elf': `half-elf,
      blend of human and elven features,
      approximately 5.5 feet tall with athletic build,
      subtle pointed ears not as pronounced as full elf,
      slightly angular facial features softened by human heritage,
      bright intelligent eyes showing dual nature,
      can pass for either race from distance,
      natural grace combined with human adaptability`,

    'half-orc': `half-orc,
      large powerfully muscular build approximately 6.5 feet,
      grayish-green skin tone with rough texture,
      prominent lower tusks jutting from jaw,
      heavy brow ridge over deep-set fierce eyes,
      broad flat nose with flared nostrils,
      coarse black hair often in warrior topknot,
      ritual tribal scars on face and arms,
      intimidating savage appearance`,
  };

  return descriptions[race.toLowerCase()] || 'fantasy humanoid adventurer with distinctive features';
}

function getFullClassDescription(charClass: string): string {
  const descriptions: Record<string, string> = {
    fighter: `experienced fighter warrior,
      WEARING: heavy full plate armor with battle damage dents and scratches,
      chainmail visible at joints,
      steel pauldrons with heraldic engravings,
      thick leather gloves with metal knuckles,
      sturdy iron-shod boots,
      EQUIPMENT: longsword in right hand with worn leather grip,
      large kite shield on left arm with painted insignia,
      backup dagger at belt,
      traveling pack on back,
      HEADGEAR: open-faced steel helm with cheek guards and nose guard,
      red wool cloak fastened with bronze clasp,
      DETAILS: military bearing, confident veteran stance, ready for battle`,

    wizard: `powerful arcane wizard,
      WEARING: flowing deep blue velvet robes with silver arcane runes embroidered,
      wide sleeves with fur trim,
      leather belt with many pouches for components,
      soft leather boots,
      EQUIPMENT: gnarled ancient wooden staff topped with glowing crystal orb,
      leather-bound spellbook hanging from belt chain,
      component pouches,
      scroll case on back,
      HEADGEAR: pointed wide-brimmed wizard hat with constellation patterns,
      DETAILS: long grey beard, wise ancient eyes, one hand crackling with arcane energy,
      mystical aura surrounding figure`,

    rogue: `deadly rogue assassin,
      WEARING: supple black leather armor form-fitting for stealth,
      dark hooded cloak with deep cowl,
      soft-soled boots for silent movement,
      fingerless gloves for dexterity,
      EQUIPMENT: twin daggers sheathed at hips,
      hand crossbow on thigh,
      lockpicks in wrist sheath,
      grappling hook and rope at belt,
      poison vials in hidden pockets,
      HEADGEAR: deep hood casting face in shadow,
      DETAILS: calculating eyes visible in shadow, half-smile,
      ready to strike from darkness,
      multiple hidden blade sheaths visible`,

    cleric: `holy cleric of the light,
      WEARING: polished steel breastplate over white holy vestments,
      chainmail sleeves,
      tabard with deity symbol prominently displayed,
      heavy boots with greaves,
      EQUIPMENT: ornate mace with holy symbol on head,
      large round shield emblazoned with sun symbol,
      holy symbol amulet glowing around neck,
      prayer book at belt,
      HEADGEAR: steel helm with religious iconography,
      DETAILS: divine light emanating from figure,
      righteous determined expression,
      one hand raised channeling holy power`,

    paladin: `noble paladin holy knight,
      WEARING: gleaming ornate full plate armor with gold inlay,
      white tabard with holy order symbol,
      ceremonial pauldrons with religious engravings,
      gauntlets with prayer inscriptions,
      armored boots with spurs,
      EQUIPMENT: magnificent two-handed holy sword glowing with divine light,
      shield on back with deity symbol,
      holy symbol incorporated into armor,
      HEADGEAR: great helm with religious crest and white plume,
      flowing white cape,
      DETAILS: radiant aura, unwavering conviction in eyes,
      commanding noble presence`,

    ranger: `wilderness ranger tracker,
      WEARING: practical worn green and brown leather armor,
      fur-lined cloak in forest colors,
      tall boots with animal fur trim,
      archer's arm guard on left forearm,
      EQUIPMENT: masterwork longbow in hand,
      quiver with fletched arrows on back,
      twin shortswords crossed on back,
      hunting knife at belt,
      snares and traps hanging from pack,
      HEADGEAR: deep hood with ranger badge pinned,
      DETAILS: alert watchful eyes scanning surroundings,
      camouflage face paint,
      wolf or hawk animal companion at side`,

    barbarian: `fierce barbarian berserker,
      WEARING: minimal fur and leather armor showing muscular physique,
      war trophy bones and teeth as decoration,
      leather bracers with metal studs,
      fur boots and leg wraps,
      EQUIPMENT: massive greataxe with notched blade held ready,
      backup handaxes at belt,
      drinking horn,
      trophy skulls,
      HEADGEAR: horned helm or bare head with wild mane of hair,
      bear fur cloak,
      DETAILS: tribal war paint on face and chest,
      ritual scarification and tattoos,
      wild eyes showing barely contained rage,
      veins visible from battle fury`,

    bard: `charismatic bard performer,
      WEARING: fine colorful doublet in purple and gold,
      flowing sleeves and cape,
      polished leather boots with silver buckles,
      decorative belt with instruments,
      EQUIPMENT: masterwork lute or lyre held lovingly,
      rapier at hip with ornate guard,
      throwing daggers concealed in boot,
      songbook in pouch,
      HEADGEAR: feathered cap at rakish angle,
      DETAILS: charming confident smile,
      theatrical flourishing pose,
      sparkle in eye,
      fingers positioned on instrument ready to play`,

    druid: `wise druid nature guardian,
      WEARING: robes woven from living vines and leaves,
      bark-like natural armor on shoulders,
      no metal visible anywhere,
      bare feet connected to earth,
      EQUIPMENT: gnarled wooden staff topped with living crystal,
      medicine pouch with herbs,
      wooden holy symbol of nature,
      HEADGEAR: crown of antlers or living flower wreath,
      cloak of moss and lichen,
      DETAILS: wild hair with twigs and feathers woven in,
      one eye glowing with natural magic,
      small woodland creatures nearby,
      vines growing from ground toward feet`,

    monk: `disciplined monk martial artist,
      WEARING: simple practical robes in saffron or brown,
      cloth wraps on hands and feet,
      rope belt with meditation beads,
      EQUIPMENT: quarterstaff across shoulders,
      prayer beads around neck,
      small pouch with few possessions,
      HEADGEAR: bald shaved head or simple topknot,
      DETAILS: athletic lean muscular build,
      calloused bare hands and feet,
      serene focused meditative expression,
      perfect balanced martial arts stance,
      ki energy subtly visible as slight glow`,

    sorcerer: `powerful innate sorcerer,
      WEARING: elegant but practical traveling clothes,
      long coat with subtle scale pattern suggesting draconic heritage,
      gloves with arcane sigils,
      boots crackling with residual magic,
      EQUIPMENT: arcane focus crystal floating near hand,
      no spellbook needed - power is innate,
      HEADGEAR: none - wild magic-touched hair floating slightly,
      DETAILS: eyes glowing with inner magical power,
      magical energy crackling between fingers,
      confident powerful expression,
      subtle draconic or wild magic features visible - slight scales or color shifts`,

    warlock: `mysterious warlock pact-bound,
      WEARING: dark robes covered in eldritch symbols and forbidden runes,
      leather armor beneath,
      boots with otherworldly design,
      EQUIPMENT: pact weapon materialized from shadow - blade or rod,
      tome of shadows chained to belt,
      arcane focus glowing with patron's power,
      HEADGEAR: deep hood with eyes glowing from within shadow,
      DETAILS: haunted knowing expression,
      patron's influence visible - tentacle patterns,
      fiendish marks,
      or fey glamour,
      otherworldly presence,
      shadows seem to bend toward figure`,
  };

  return descriptions[charClass.toLowerCase()] || 'seasoned adventurer with class-appropriate equipment and attire';
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
  quality: string,
  style: string = 'portrait'
): Promise<string> {
  const fetch = (await import('node-fetch')).default;

  // NanoBanana API requires a callback URL - check if configured
  if (!CALLBACK_BASE_URL) {
    console.warn('CALLBACK_BASE_URL not configured - NanoBanana requires a publicly accessible webhook');
    throw new Error('Callback URL not configured for NanoBanana API');
  }

  // Use correct endpoint paths per NanoBanana API docs
  const endpoint = quality === 'high' ? '/generate-pro' : '/generate';

  // Combine prompt with negative prompt instruction
  const fullPrompt = `${promptConfig.prompt}. DO NOT include: ${promptConfig.negativePrompt}`;

  // Choose aspect ratio based on style
  // portrait: 1:1 square for head/shoulders
  // full_body: 2:3 vertical for full character
  const imageSize = style === 'portrait' ? '1:1' : '2:3';

  const requestBody = {
    prompt: fullPrompt,
    type: 'TEXTTOIAMGE', // Note: API has typo "IAMGE" instead of "IMAGE"
    callBackUrl: `${CALLBACK_BASE_URL}/media/webhook/nanobanana`,
    numImages: 1,
    image_size: imageSize,
  };

  console.log('=== Calling NanoBanana API ===');
  console.log('URL:', `${NANOBANANA_API_URL}${endpoint}`);
  console.log('Callback URL:', requestBody.callBackUrl);
  console.log('Request body (truncated prompt):', { ...requestBody, prompt: requestBody.prompt.substring(0, 100) + '...' });

  const response = await fetch(`${NANOBANANA_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NANOBANANA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('NanoBanana API error response:', errorText);
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

  console.log('NanoBanana API response:', JSON.stringify(data, null, 2));

  // Check for success
  if (data.code !== 200) {
    throw new Error(`NanoBanana API error: ${data.msg}`);
  }

  // If image URL is returned immediately (unlikely but possible)
  if (data.data?.imageUrl) {
    return data.data.imageUrl;
  }
  if (data.data?.imageUrls && data.data.imageUrls.length > 0 && data.data.imageUrls[0]) {
    return data.data.imageUrls[0];
  }

  // Get task ID for webhook callback
  const taskId = data.data?.taskId;
  if (!taskId) {
    throw new Error('No task ID returned from NanoBanana API');
  }

  // Wait for webhook callback with Promise
  // Keep under Railway's 60-second timeout so fallback can return
  const maxWait = 50000; // 50 seconds for image generation

  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingImageTasks.delete(taskId);
      reject(new Error('Image generation timed out waiting for webhook'));
    }, maxWait);

    pendingImageTasks.set(taskId, { resolve, reject, timeout });
  });
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
