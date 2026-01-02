// Generation Routes
// API endpoints for content generation with Claude Opus

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { generateNPC, generateEncounter, generateQuest, generateMap, generateSetting } from '../handlers/generation.js';
import { storeContent, getConversation } from '../handlers/conversation.js';
import { logger } from '../lib/logger.js';
import { uploadImageFromUrl, STORAGE_ENABLED } from '../lib/storageService.js';

// Map background style prompts
const MAP_STYLE_PROMPTS: Record<string, string> = {
  'battle-map': 'top-down battle map, grid-ready, clear terrain boundaries, tabletop RPG style, tokens placement friendly',
  'artistic': 'painterly fantasy map, rich colors, artistic interpretation, atmospheric mood, storybook illustration style',
  'realistic': 'photorealistic aerial view, natural lighting, detailed textures, immersive environment',
  'overhead': 'bird\'s eye view, orthographic projection, clean design, tactical map, D&D battle grid compatible',
};

const LIGHTING_PROMPTS: Record<string, string> = {
  bright: 'bright daylight, clear visibility, vibrant colors',
  dim: 'twilight atmosphere, soft shadows, muted tones, dusk lighting',
  dark: 'night scene, moonlight, torch lighting, dramatic shadows',
  dramatic: 'dramatic lighting, god rays, cinematic atmosphere, epic scale',
};

const router: RouterType = Router();

// Validation schemas
const generateNPCSchema = z.object({
  conversationId: z.string().uuid().optional(),
  description: z.string().min(10).max(2000),
  context: z.string().max(5000).optional(),
});

const generateEncounterSchema = z.object({
  conversationId: z.string().uuid().optional(),
  description: z.string().min(10).max(2000),
  partyLevel: z.number().int().min(1).max(20),
  partySize: z.number().int().min(1).max(8),
  context: z.string().max(5000).optional(),
});

const generateQuestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  description: z.string().min(10).max(2000),
  context: z.string().max(5000).optional(),
});

const generateMapSchema = z.object({
  conversationId: z.string().uuid().optional(),
  description: z.string().min(10).max(2000),
  width: z.number().int().min(10).max(100).default(30),
  height: z.number().int().min(10).max(100).default(30),
  context: z.string().max(5000).optional(),
  generateBackground: z.boolean().default(false),
  backgroundStyle: z.enum(['battle-map', 'artistic', 'realistic', 'overhead']).default('battle-map'),
});

const generateMapBackgroundSchema = z.object({
  description: z.string().min(10).max(1000),
  style: z.enum(['battle-map', 'artistic', 'realistic', 'overhead']).default('battle-map'),
  terrain: z.string().optional(),
  lighting: z.enum(['bright', 'dim', 'dark', 'dramatic']).default('bright'),
  aspectRatio: z.enum(['1:1', '16:9', '4:3']).default('16:9'),
  campaignId: z.string().optional(),
  mapId: z.string().optional(),
});

const generateSettingSchema = z.object({
  conversationId: z.string().uuid().optional(),
  description: z.string().min(10).max(5000),
});

// Generate NPC
router.post('/npc', async (req: Request, res: Response) => {
  try {
    const { conversationId, description, context } = generateNPCSchema.parse(req.body);

    const result = await generateNPC(description, context || 'Generic D&D 5e fantasy campaign');

    // Store in conversation if provided
    if (conversationId) {
      const conversation = await getConversation(conversationId);
      if (conversation) {
        await storeContent(conversationId, 'npcs', result.npc as unknown as Record<string, unknown>);
      }
    }

    res.json({
      npc: result.npc,
      cost: result.cost,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to generate NPC');
    res.status(500).json({ error: 'Failed to generate NPC' });
  }
});

// Generate Encounter
router.post('/encounter', async (req: Request, res: Response) => {
  try {
    const { conversationId, description, partyLevel, partySize, context } = generateEncounterSchema.parse(req.body);

    const result = await generateEncounter(description, partyLevel, partySize, context || 'Generic D&D 5e fantasy campaign');

    // Store in conversation if provided
    if (conversationId) {
      const conversation = await getConversation(conversationId);
      if (conversation) {
        await storeContent(conversationId, 'encounters', result.encounter as unknown as Record<string, unknown>);
      }
    }

    res.json({
      encounter: result.encounter,
      cost: result.cost,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to generate encounter');
    res.status(500).json({ error: 'Failed to generate encounter' });
  }
});

// Generate Quest
router.post('/quest', async (req: Request, res: Response) => {
  try {
    const { conversationId, description, context } = generateQuestSchema.parse(req.body);

    const result = await generateQuest(description, context || 'Generic D&D 5e fantasy campaign');

    // Store in conversation if provided
    if (conversationId) {
      const conversation = await getConversation(conversationId);
      if (conversation) {
        await storeContent(conversationId, 'quests', result.quest as unknown as Record<string, unknown>);
      }
    }

    res.json({
      quest: result.quest,
      cost: result.cost,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to generate quest');
    res.status(500).json({ error: 'Failed to generate quest' });
  }
});

// Generate Map
router.post('/map', async (req: Request, res: Response) => {
  try {
    const { conversationId, description, width, height, context } = generateMapSchema.parse(req.body);

    const result = await generateMap(description, { width, height }, context || 'Generic D&D 5e fantasy campaign');

    // Store in conversation if provided
    if (conversationId) {
      const conversation = await getConversation(conversationId);
      if (conversation) {
        await storeContent(conversationId, 'maps', result.map as unknown as Record<string, unknown>);
      }
    }

    res.json({
      map: result.map,
      cost: result.cost,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to generate map');
    res.status(500).json({ error: 'Failed to generate map' });
  }
});

// Generate Map Background Image
router.post('/map-background', async (req: Request, res: Response) => {
  try {
    const { description, style, terrain, lighting, aspectRatio, campaignId, mapId } = generateMapBackgroundSchema.parse(req.body);

    const nanoBananaApiKey = process.env.NANOBANANA_API_KEY;
    if (!nanoBananaApiKey) {
      res.status(503).json({ error: 'Image generation not configured', message: 'NanoBanana API key not set' });
      return;
    }

    // Build comprehensive prompt
    const stylePrompt = MAP_STYLE_PROMPTS[style] || MAP_STYLE_PROMPTS['battle-map'];
    const lightingPrompt = LIGHTING_PROMPTS[lighting] || LIGHTING_PROMPTS.bright;
    const terrainPrompt = terrain ? `${terrain} terrain, ` : '';

    const fullPrompt = `${description}, ${terrainPrompt}${stylePrompt}, ${lightingPrompt}, D&D fantasy setting, high quality, detailed`;

    logger.info({ description: description.substring(0, 50), style, lighting, aspectRatio }, 'Generating map background');

    // Call NanoBanana API
    const response = await fetch('https://api.nanobanana.ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nanoBananaApiKey}`,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        aspectRatio,
        webhookUrl: process.env.CALLBACK_BASE_URL
          ? `${process.env.CALLBACK_BASE_URL}/ai/campaign-studio/webhook/nanobanana`
          : undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, 'NanoBanana API error');
      res.status(502).json({ error: 'Image generation failed' });
      return;
    }

    const result = await response.json() as { taskId?: string; imageUrl?: string; status?: string };

    // Store image permanently if URL returned and storage is enabled
    let finalImageUrl = result.imageUrl;
    if (result.imageUrl && STORAGE_ENABLED) {
      try {
        const identifier = mapId || campaignId || 'map';
        finalImageUrl = await uploadImageFromUrl(result.imageUrl, 'maps/backgrounds', identifier);
        logger.info({ finalImageUrl }, 'Map background stored permanently in R2');
      } catch (storageError) {
        logger.warn({ error: storageError }, 'Failed to store map background, using temporary URL');
      }
    }

    res.json({
      taskId: result.taskId,
      backgroundUrl: finalImageUrl,
      status: result.status ?? (finalImageUrl ? 'completed' : 'pending'),
      style,
      lighting,
      storedPermanently: STORAGE_ENABLED && !!finalImageUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to generate map background');
    res.status(500).json({ error: 'Failed to generate map background' });
  }
});

// Generate Setting
router.post('/setting', async (req: Request, res: Response) => {
  try {
    const { conversationId, description } = generateSettingSchema.parse(req.body);

    const result = await generateSetting(description);

    // Store in conversation if provided
    if (conversationId) {
      const conversation = await getConversation(conversationId);
      if (conversation) {
        await storeContent(conversationId, 'setting', result.setting as unknown as Record<string, unknown>);
      }
    }

    res.json({
      setting: result.setting,
      cost: result.cost,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to generate setting');
    res.status(500).json({ error: 'Failed to generate setting' });
  }
});

export default router;
