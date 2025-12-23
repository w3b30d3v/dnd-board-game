// Generation Routes
// API endpoints for content generation with Claude Opus

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { generateNPC, generateEncounter, generateQuest, generateMap, generateSetting } from '../handlers/generation.js';
import { storeContent, getConversation } from '../handlers/conversation.js';
import { logger } from '../lib/logger.js';

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
      const conversation = getConversation(conversationId);
      if (conversation) {
        storeContent(conversationId, 'npcs', result.npc);
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
      const conversation = getConversation(conversationId);
      if (conversation) {
        storeContent(conversationId, 'encounters', result.encounter);
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
      const conversation = getConversation(conversationId);
      if (conversation) {
        storeContent(conversationId, 'quests', result.quest);
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
      const conversation = getConversation(conversationId);
      if (conversation) {
        storeContent(conversationId, 'maps', result.map);
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

// Generate Setting
router.post('/setting', async (req: Request, res: Response) => {
  try {
    const { conversationId, description } = generateSettingSchema.parse(req.body);

    const result = await generateSetting(description);

    // Store in conversation if provided
    if (conversationId) {
      const conversation = getConversation(conversationId);
      if (conversation) {
        storeContent(conversationId, 'setting', result.setting);
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
