// Campaign Studio Routes
// Handles saving AI-generated content and image generation for NPCs/locations

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

const router: Router = Router();

// Environment configuration for NanoBanana
const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY;
const NANOBANANA_API_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';
const CALLBACK_BASE_URL = process.env.CALLBACK_BASE_URL || '';

// Pending image tasks for webhook callbacks
const pendingImageTasks = new Map<
  string,
  {
    resolve: (url: string) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }
>();

// ========================
// Validation Schemas
// ========================

const settingDataSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable().default(''),
  themes: z.array(z.string()).optional().nullable().default([]),
  tone: z.string().optional().nullable().default(''),
  era: z.string().optional().nullable().default(''),
  imageUrl: z.string().optional().nullable(),
}).passthrough(); // Allow extra fields

const locationDataSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(''),
  type: z.string().optional().nullable().default('location'),
  features: z.array(z.string()).optional().nullable().default([]),
  connections: z.array(z.string()).optional().nullable().default([]),
  imageUrl: z.string().optional().nullable(),
}).passthrough(); // Allow extra fields

const npcDataSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  race: z.string().optional().nullable().default(''),
  class: z.string().optional().nullable(),
  role: z.string().optional().nullable().default(''),
  description: z.string().optional().nullable().default(''),
  personality: z.object({
    traits: z.array(z.string()).optional().nullable().default([]),
    ideal: z.string().optional().nullable().default(''),
    bond: z.string().optional().nullable().default(''),
    flaw: z.string().optional().nullable().default(''),
  }).optional().nullable(),
  voiceProfile: z.string().optional().nullable(),
  portraitUrl: z.string().optional().nullable(),
}).passthrough(); // Allow extra fields

const encounterDataSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.string().optional().nullable().default('combat'),
  difficulty: z.string().optional().nullable().default('medium'),
  description: z.string().optional().nullable().default(''),
  monsters: z.array(z.string()).optional().nullable().default([]),
  rewards: z.array(z.string()).optional().nullable().default([]),
  locationId: z.string().optional().nullable(),
}).passthrough(); // Allow extra fields

const questDataSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.string().optional().nullable().default('main'),
  description: z.string().optional().nullable().default(''),
  objectives: z.array(z.string()).optional().nullable().default([]),
  rewards: z.array(z.string()).optional().nullable().default([]),
  giverNpcId: z.string().optional().nullable(),
}).passthrough(); // Allow extra fields

const saveContentSchema = z.object({
  setting: settingDataSchema.optional(),
  locations: z.array(locationDataSchema).optional().default([]),
  npcs: z.array(npcDataSchema).optional().default([]),
  encounters: z.array(encounterDataSchema).optional().default([]),
  quests: z.array(questDataSchema).optional().default([]),
});

const generateImageSchema = z.object({
  type: z.enum(['npc', 'location']),
  name: z.string().min(1),
  description: z.string().optional(),
  // NPC-specific
  race: z.string().optional(),
  class: z.string().optional(),
  role: z.string().optional(),
  // Location-specific
  locationType: z.string().optional(),
});

// ========================
// Routes
// ========================

// POST /campaign-studio/:campaignId/save - Save all generated content
router.post(
  '/:campaignId/save',
  auth,
  validateBody(saveContentSchema),
  async (req: Request<{ campaignId: string }>, res: Response) => {
    try {
      const { campaignId } = req.params;
      const userId = req.user!.id;
      const { setting, locations, npcs, encounters, quests } = req.body;

      logger.info({ campaignId, userId }, 'Saving campaign studio content');

      // Try to find existing campaign
      let campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, ownerId: userId },
        select: { id: true, name: true },
      });

      // If campaign doesn't exist (e.g., imported campaign), create it
      if (!campaign) {
        // For imported/temporary campaigns, create a new one
        const campaignName = setting?.name || 'Imported Campaign';
        logger.info({ campaignId, campaignName }, 'Creating new campaign for imported content');

        campaign = await prisma.campaign.create({
          data: {
            id: campaignId,
            name: campaignName,
            description: setting?.description || '',
            ownerId: userId,
            status: 'draft',
            settings: {
              themes: setting?.themes || [],
              tone: setting?.tone || '',
              era: setting?.era || '',
              imageUrl: setting?.imageUrl,
            },
          },
          select: { id: true, name: true },
        });
      }

      // Use a transaction to save all content atomically
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update campaign settings if provided
        if (setting) {
          await tx.campaign.update({
            where: { id: campaignId },
            data: {
              name: setting.name || campaign.name,
              description: setting.description,
              settings: {
                themes: setting.themes,
                tone: setting.tone,
                era: setting.era,
                imageUrl: setting.imageUrl,
              },
            },
          });
        }

        // 2. Upsert locations (as Maps with basic tiles)
        const savedMaps = [];
        for (const location of locations || []) {
          const mapData = {
            campaignId,
            name: location.name,
            description: location.description,
            width: 30, // Default map size
            height: 30,
            gridSize: 5,
            tileSize: 64,
            layers: [],
            lighting: { ambient: 0.8 },
            ambience: {
              type: location.type,
              features: location.features,
              connections: location.connections,
              imageUrl: location.imageUrl,
            },
            tags: [location.type],
          };

          const saved = await tx.map.upsert({
            where: { id: location.id },
            create: { id: location.id, ...mapData },
            update: mapData,
          });
          savedMaps.push(saved);
        }

        // 3. Upsert NPCs
        const savedNpcs = [];
        for (const npc of npcs || []) {
          const npcData = {
            campaignId,
            name: npc.name,
            title: npc.role,
            description: npc.description,
            portraitUrl: npc.portraitUrl,
            personality: npc.personality?.traits?.join(', '),
            motivation: npc.personality?.ideal,
            secrets: npc.personality?.flaw,
            tags: [npc.race, npc.class, npc.role].filter(Boolean) as string[],
          };

          const saved = await tx.nPC.upsert({
            where: { id: npc.id },
            create: { id: npc.id, ...npcData },
            update: npcData,
          });
          savedNpcs.push(saved);
        }

        // 4. Upsert Encounters
        const savedEncounters = [];
        for (const encounter of encounters || []) {
          const encounterData = {
            campaignId,
            mapId: encounter.locationId || null,
            name: encounter.name,
            description: encounter.description,
            difficulty: encounter.difficulty,
            monsters: encounter.monsters?.map((m: string) => ({ name: m })) || [],
            rewards: encounter.rewards?.map((r: string) => ({ description: r })) || [],
            tags: [encounter.type],
          };

          const saved = await tx.encounter.upsert({
            where: { id: encounter.id },
            create: { id: encounter.id, ...encounterData },
            update: encounterData,
          });
          savedEncounters.push(saved);
        }

        // 5. Upsert Quests
        const savedQuests = [];
        for (const quest of quests || []) {
          const questData = {
            campaignId,
            name: quest.name,
            description: quest.description,
            type: quest.type,
            objectives: quest.objectives?.map((o: string, i: number) => ({
              id: `obj-${i}`,
              description: o,
              completed: false,
            })) || [],
            rewards: quest.rewards?.map((r: string) => ({ description: r })) || [],
            questGiverId: quest.giverNpcId,
            tags: [quest.type],
          };

          const saved = await tx.quest.upsert({
            where: { id: quest.id },
            create: { id: quest.id, ...questData },
            update: questData,
          });
          savedQuests.push(saved);
        }

        // Update campaign lastSavedAt
        await tx.campaign.update({
          where: { id: campaignId },
          data: { updatedAt: new Date() },
        });

        return {
          maps: savedMaps.length,
          npcs: savedNpcs.length,
          encounters: savedEncounters.length,
          quests: savedQuests.length,
        };
      });

      logger.info({ campaignId, result }, 'Campaign studio content saved');

      return res.json({
        success: true,
        saved: result,
        message: 'Campaign content saved successfully',
      });
    } catch (error) {
      logger.error({ error }, 'Failed to save campaign studio content');
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to save campaign content', details: message });
    }
  }
);

// POST /campaign-studio/:campaignId/generate-image - Generate image for NPC or location
// Note: campaignId can be 'temp_xxx' for unsaved campaigns - we allow image generation without a real campaign
router.post(
  '/:campaignId/generate-image',
  auth,
  validateBody(generateImageSchema),
  async (req: Request<{ campaignId: string }>, res: Response) => {
    try {
      const { campaignId } = req.params;
      const userId = req.user!.id;
      const { type, name, description, race, class: charClass, role, locationType } = req.body;

      // For image generation, we don't require the campaign to exist in the database
      // This allows generating images for imported/unsaved campaigns
      // We only verify the user is authenticated (done by auth middleware)
      logger.info({ campaignId, userId, type, name }, 'Generating image for campaign content');

      // Check if NanoBanana is configured (only check API key - matches character generation)
      const hasApiKey = !!NANOBANANA_API_KEY;
      logger.info({ hasApiKey, callbackUrl: CALLBACK_BASE_URL }, 'NanoBanana config check');

      if (!hasApiKey) {
        logger.warn('NanoBanana API key not configured, using fallback');
        // Return a DiceBear fallback
        const fallbackUrl = generateFallbackImage(type, name, race);
        return res.json({
          success: true,
          imageUrl: fallbackUrl,
          source: 'fallback',
          reason: 'api_key_not_configured',
        });
      }

      // Build the prompt based on type
      let prompt: string;
      let aspectRatio: string;

      if (type === 'npc') {
        prompt = buildNPCPortraitPrompt(name, race || 'human', charClass, role, description);
        aspectRatio = '1:1'; // Square portrait
      } else {
        prompt = buildLocationPrompt(name, locationType || 'location', description);
        aspectRatio = '16:9'; // Wide landscape
      }

      try {
        logger.info({ prompt: prompt.substring(0, 100), aspectRatio }, 'Calling NanoBanana');
        const imageUrl = await generateWithNanoBanana(prompt, aspectRatio);
        logger.info({ imageUrl }, 'NanoBanana generation succeeded');
        return res.json({
          success: true,
          imageUrl,
          source: 'nanobanana',
        });
      } catch (genError) {
        const errorMsg = genError instanceof Error ? genError.message : String(genError);
        logger.warn({ error: errorMsg }, 'NanoBanana generation failed, using fallback');
        const fallbackUrl = generateFallbackImage(type, name, race);
        return res.json({
          success: true,
          imageUrl: fallbackUrl,
          source: 'fallback',
          reason: 'generation_failed',
          error: errorMsg,
        });
      }
    } catch (error) {
      logger.error({ error }, 'Failed to generate image');
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to generate image', details: message });
    }
  }
);

// Webhook endpoint for NanoBanana callbacks (no auth required)
router.post('/webhook/nanobanana', async (req: Request, res: Response) => {
  try {
    logger.info({ body: req.body }, 'Campaign Studio NanoBanana webhook received');

    const { code, msg, data } = req.body;
    const taskId = data?.taskId;
    const resultImageUrl = data?.info?.resultImageUrl;

    let resolvedTaskId = taskId;
    if (!resolvedTaskId && pendingImageTasks.size > 0) {
      resolvedTaskId = Array.from(pendingImageTasks.keys())[0];
    }

    if (!resolvedTaskId) {
      return res.json({ success: true, message: 'No matching task' });
    }

    const pending = pendingImageTasks.get(resolvedTaskId);
    if (!pending) {
      return res.json({ success: true, message: 'Task not found' });
    }

    clearTimeout(pending.timeout);
    pendingImageTasks.delete(resolvedTaskId);

    if (code !== 200) {
      pending.reject(new Error(msg || 'Image generation failed'));
    } else if (resultImageUrl) {
      pending.resolve(resultImageUrl);
    } else {
      pending.reject(new Error('No image URL in response'));
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Webhook processing failed');
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// GET /campaign-studio/:campaignId/content - Load saved content
router.get('/:campaignId/content', auth, async (req: Request<{ campaignId: string }>, res: Response) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user!.id;

    // Get campaign with all related content
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        OR: [{ ownerId: userId }, { players: { some: { userId } } }],
      },
      include: {
        maps: true,
        npcs: true,
        encounters: true,
        quests: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Transform to Campaign Studio format
    const content = {
      setting: {
        name: campaign.name,
        description: campaign.description || '',
        themes: (campaign.settings as Record<string, unknown>)?.themes || [],
        tone: (campaign.settings as Record<string, unknown>)?.tone || '',
        era: (campaign.settings as Record<string, unknown>)?.era || '',
        imageUrl: (campaign.settings as Record<string, unknown>)?.imageUrl,
      },
      locations: campaign.maps.map((map) => ({
        id: map.id,
        name: map.name,
        description: map.description || '',
        type: (map.ambience as Record<string, unknown>)?.type || 'location',
        features: (map.ambience as Record<string, unknown>)?.features || [],
        connections: (map.ambience as Record<string, unknown>)?.connections || [],
        imageUrl: (map.ambience as Record<string, unknown>)?.imageUrl,
      })),
      npcs: campaign.npcs.map((npc) => ({
        id: npc.id,
        name: npc.name,
        race: npc.tags?.[0] || '',
        class: npc.tags?.[1] || '',
        role: npc.title || '',
        description: npc.description || '',
        personality: {
          traits: npc.personality?.split(', ') || [],
          ideal: npc.motivation || '',
          bond: '',
          flaw: npc.secrets || '',
        },
        portraitUrl: npc.portraitUrl,
      })),
      encounters: campaign.encounters.map((enc) => ({
        id: enc.id,
        name: enc.name,
        type: enc.tags?.[0] || 'combat',
        difficulty: enc.difficulty,
        description: enc.description || '',
        monsters: (enc.monsters as Array<{ name: string }>)?.map((m) => m.name) || [],
        rewards: (enc.rewards as Array<{ description: string }>)?.map((r) => r.description) || [],
        locationId: enc.mapId,
      })),
      quests: campaign.quests.map((quest) => ({
        id: quest.id,
        name: quest.name,
        type: quest.type,
        description: quest.description || '',
        objectives: (quest.objectives as Array<{ description: string }>)?.map((o) => o.description) || [],
        rewards: (quest.rewards as Array<{ description: string }>)?.map((r) => r.description) || [],
        giverNpcId: quest.questGiverId,
      })),
    };

    return res.json({ success: true, content });
  } catch (error) {
    logger.error({ error }, 'Failed to load campaign content');
    return res.status(500).json({ error: 'Failed to load campaign content' });
  }
});

// ========================
// Helper Functions
// ========================

function buildNPCPortraitPrompt(
  name: string,
  race: string,
  charClass?: string,
  role?: string,
  description?: string
): string {
  const artStyle = [
    'official Dungeons and Dragons 5th Edition character portrait',
    'by Larry Elmore',
    'Players Handbook illustration style',
    'epic fantasy art',
    'dramatic lighting',
    'highly detailed',
  ].join(', ');

  const raceDesc = getNPCRaceDescription(race);
  const classDesc = charClass ? `${charClass} adventurer` : 'fantasy character';
  const roleDesc = role ? `serving as ${role}` : '';

  const composition = [
    'portrait composition',
    'head and shoulders',
    'close-up face',
    'three-quarter angle',
    'expressive eyes',
    'detailed facial features',
  ].join(', ');

  const negative = [
    'anime', 'cartoon', 'chibi', 'blurry', 'low quality',
    'bad anatomy', 'deformed', 'watermark', 'text',
    'nude', 'nsfw', 'modern', 'sci-fi',
  ].join(', ');

  const parts = [
    artStyle,
    `${name} the ${raceDesc}`,
    classDesc,
    roleDesc,
    description || '',
    composition,
    `DO NOT include: ${negative}`,
  ].filter(Boolean);

  return parts.join(', ');
}

function buildLocationPrompt(name: string, locationType: string, description?: string): string {
  const artStyle = [
    'official Dungeons and Dragons environment art',
    'fantasy landscape painting',
    'epic scene composition',
    'dramatic lighting',
    'highly detailed architecture',
    'atmospheric perspective',
  ].join(', ');

  const typeDescriptions: Record<string, string> = {
    world: 'epic fantasy world map view, sweeping landscape vista, multiple biomes, mountains rivers forests, god-view perspective, mystical atmosphere',
    tavern: 'cozy medieval tavern interior with warm firelight, wooden beams, tankards on tables',
    dungeon: 'dark underground dungeon corridor with stone walls, flickering torches, mysterious shadows',
    forest: 'ancient enchanted forest with towering trees, magical mist, dappled sunlight',
    castle: 'grand medieval castle with tall towers, stone walls, heraldic banners',
    village: 'quaint fantasy village with thatched roofs, cobblestone streets, market stalls',
    cave: 'vast underground cavern with stalactites, glowing crystals, underground river',
    temple: 'ancient stone temple with carved pillars, religious iconography, sacred atmosphere',
    market: 'bustling fantasy marketplace with colorful stalls, exotic goods, diverse crowds',
    ship: 'wooden sailing ship on stormy seas, billowing sails, dramatic waves',
    tower: 'tall wizard tower with magical aura, floating books, arcane symbols',
    island: 'tropical fantasy island with palm trees, sandy beaches, mysterious jungle interior',
    mountain: 'majestic mountain peak with snow caps, dramatic cliffs, alpine meadows',
    swamp: 'murky swamp with twisted trees, hanging moss, eerie mist, dark waters',
    desert: 'vast desert landscape with rolling dunes, ancient ruins, scorching sun',
    city: 'grand fantasy city with towering spires, busy streets, diverse architecture',
  };

  const typeDesc = typeDescriptions[locationType.toLowerCase()] || `${locationType} fantasy location`;

  const negative = [
    'anime', 'cartoon', 'blurry', 'low quality',
    'watermark', 'text', 'modern', 'cars', 'technology',
    'people', 'characters', 'figures',
  ].join(', ');

  const parts = [
    artStyle,
    `${name}`,
    typeDesc,
    description || '',
    'wide establishing shot',
    'no people',
    `DO NOT include: ${negative}`,
  ].filter(Boolean);

  return parts.join(', ');
}

function getNPCRaceDescription(race: string): string {
  const descriptions: Record<string, string> = {
    human: 'human with weathered features',
    elf: 'elegant elf with pointed ears and angular features',
    dwarf: 'stout dwarf with thick beard and proud bearing',
    halfling: 'cheerful halfling with round face and bright eyes',
    dragonborn: 'imposing dragonborn with scaled skin and draconic features',
    tiefling: 'mysterious tiefling with horns and infernal heritage',
    gnome: 'curious gnome with large eyes and wild hair',
    'half-elf': 'graceful half-elf blending human and elven features',
    'half-orc': 'powerful half-orc with tusks and green-tinted skin',
  };
  return descriptions[race.toLowerCase()] || `${race} fantasy character`;
}

function generateFallbackImage(type: string, name: string, race?: string): string {
  const seed = `${type}-${name}-${Date.now()}`;

  if (type === 'npc') {
    const styleMap: Record<string, string> = {
      human: 'adventurer',
      elf: 'lorelei',
      dwarf: 'avataaars',
      halfling: 'adventurer',
      dragonborn: 'bottts',
      tiefling: 'bottts',
      gnome: 'micah',
    };
    const style = styleMap[race?.toLowerCase() || 'human'] || 'adventurer';
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1b26&size=512`;
  } else {
    // Location - use identicon or shapes
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1b26&size=512`;
  }
}

async function generateWithNanoBanana(prompt: string, aspectRatio: string): Promise<string> {
  const fetch = (await import('node-fetch')).default;

  // Check callback URL is configured
  if (!CALLBACK_BASE_URL) {
    throw new Error('CALLBACK_BASE_URL not configured - required for NanoBanana webhook');
  }

  const callbackUrl = `${CALLBACK_BASE_URL}/campaign-studio/webhook/nanobanana`;

  const requestBody = {
    prompt,
    type: 'TEXTTOIAMGE',
    callBackUrl: callbackUrl,
    numImages: 1,
    image_size: aspectRatio,
  };

  logger.info({ prompt: prompt.substring(0, 100), callbackUrl }, 'Calling NanoBanana API');

  const response = await fetch(`${NANOBANANA_API_URL}/generate`, {
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
    data?: { taskId?: string; imageUrl?: string; imageUrls?: string[] };
  };

  if (data.code !== 200) {
    throw new Error(`NanoBanana API error: ${data.msg}`);
  }

  // Immediate result
  if (data.data?.imageUrl) return data.data.imageUrl;
  if (data.data?.imageUrls?.[0]) return data.data.imageUrls[0];

  // Wait for webhook
  const taskId = data.data?.taskId;
  if (!taskId) throw new Error('No task ID from NanoBanana');

  const maxWait = 50000;

  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingImageTasks.delete(taskId);
      reject(new Error('Image generation timed out'));
    }, maxWait);

    pendingImageTasks.set(taskId, { resolve, reject, timeout });
  });
}

export default router;
