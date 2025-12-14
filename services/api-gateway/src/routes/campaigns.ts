import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { CampaignService } from '../services/campaignService.js';
import { auth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';

const router: Router = Router();
const campaignService = new CampaignService();

// ========================
// Validation Schemas
// ========================

const createCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  isPublic: z.boolean().optional(),
  recommendedLevel: z
    .object({
      min: z.number().int().min(1).max(20),
      max: z.number().int().min(1).max(20),
    })
    .optional(),
  settings: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  isPublic: z.boolean().optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
  recommendedLevel: z
    .object({
      min: z.number().int().min(1).max(20),
      max: z.number().int().min(1).max(20),
    })
    .optional(),
  settings: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

const createMapSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  width: z.number().int().min(5).max(200),
  height: z.number().int().min(5).max(200),
  gridSize: z.number().int().min(1).max(20).optional(),
  tileSize: z.number().int().min(16).max(256).optional(),
  layers: z.array(z.unknown()).optional(),
  backgroundUrl: z.string().url().optional(),
  lighting: z.record(z.unknown()).optional(),
  ambience: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

const createEncounterSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  mapId: z.string().optional(),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard', 'deadly']).optional(),
  recommendedLevel: z
    .object({
      min: z.number().int().min(1).max(20),
      max: z.number().int().min(1).max(20),
    })
    .optional(),
  monsters: z.array(z.unknown()).optional(),
  objectives: z.array(z.unknown()).optional(),
  rewards: z.array(z.unknown()).optional(),
  triggers: z.array(z.unknown()).optional(),
  environment: z.record(z.unknown()).optional(),
  audio: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

const createNPCSchema = z.object({
  name: z.string().min(1).max(100),
  title: z.string().max(100).optional(),
  monsterId: z.string().optional(),
  stats: z.record(z.unknown()).optional(),
  portraitUrl: z.string().url().optional(),
  description: z.string().optional(),
  personality: z.string().optional(),
  motivation: z.string().optional(),
  secrets: z.string().optional(),
  defaultLocation: z.string().optional(),
  defaultDialogueId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isHostile: z.boolean().optional(),
  faction: z.string().optional(),
});

const createQuestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['main', 'side', 'personal']).optional(),
  objectives: z.array(z.unknown()).optional(),
  rewards: z.array(z.unknown()).optional(),
  prerequisites: z.array(z.unknown()).optional(),
  questGiverId: z.string().optional(),
  recommendedLevel: z.number().int().min(1).max(20).optional(),
  tags: z.array(z.string()).optional(),
});

const publishSchema = z.object({
  visibility: z.enum(['public', 'private', 'unlisted']),
  price: z.number().int().min(0).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// ========================
// Campaign Routes
// ========================

// GET /campaigns - List user's campaigns
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const campaigns = await campaignService.findByUser(req.user!.id);
    return res.json({ campaigns });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// POST /campaigns - Create a new campaign
router.post('/', auth, validateBody(createCampaignSchema), async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.create(req.user!.id, req.body);
    return res.status(201).json(campaign);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create campaign';
    return res.status(400).json({ error: message });
  }
});

// GET /campaigns/:id - Get a specific campaign
router.get('/:id', auth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const campaign = await campaignService.findById(req.params.id, req.user!.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    return res.json(campaign);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// PUT /campaigns/:id - Update a campaign
router.put(
  '/:id',
  auth,
  validateBody(updateCampaignSchema),
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const campaign = await campaignService.update(req.params.id, req.user!.id, req.body);
      return res.json(campaign);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update campaign';
      if (message.includes('not found')) {
        return res.status(404).json({ error: message });
      }
      return res.status(400).json({ error: message });
    }
  }
);

// DELETE /campaigns/:id - Delete a campaign
router.delete('/:id', auth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    await campaignService.delete(req.params.id, req.user!.id);
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete campaign';
    if (message.includes('not found')) {
      return res.status(404).json({ error: message });
    }
    return res.status(400).json({ error: message });
  }
});

// GET /campaigns/:id/validate - Validate campaign for publishing
router.get('/:id/validate', auth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const validation = await campaignService.validateCampaign(req.params.id);
    return res.json(validation);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Validation failed';
    return res.status(400).json({ error: message });
  }
});

// POST /campaigns/:id/publish - Publish campaign
router.post(
  '/:id/publish',
  auth,
  validateBody(publishSchema),
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const published = await campaignService.publishCampaign(req.params.id, req.user!.id, req.body);
      return res.status(201).json(published);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish campaign';
      return res.status(400).json({ error: message });
    }
  }
);

// ========================
// Map Routes
// ========================

// POST /campaigns/:id/maps - Create a map
router.post(
  '/:id/maps',
  auth,
  validateBody(createMapSchema),
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const map = await campaignService.createMap(req.params.id, req.user!.id, req.body);
      return res.status(201).json(map);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create map';
      return res.status(400).json({ error: message });
    }
  }
);

// PUT /campaigns/:campaignId/maps/:mapId - Update a map
router.put(
  '/:campaignId/maps/:mapId',
  auth,
  validateBody(createMapSchema.partial()),
  async (req: Request<{ campaignId: string; mapId: string }>, res: Response) => {
    try {
      const map = await campaignService.updateMap(req.params.mapId, req.user!.id, req.body);
      return res.json(map);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update map';
      return res.status(400).json({ error: message });
    }
  }
);

// DELETE /campaigns/:campaignId/maps/:mapId - Delete a map
router.delete(
  '/:campaignId/maps/:mapId',
  auth,
  async (req: Request<{ campaignId: string; mapId: string }>, res: Response) => {
    try {
      await campaignService.deleteMap(req.params.mapId, req.user!.id);
      return res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete map';
      return res.status(400).json({ error: message });
    }
  }
);

// ========================
// Encounter Routes
// ========================

// POST /campaigns/:id/encounters - Create an encounter
router.post(
  '/:id/encounters',
  auth,
  validateBody(createEncounterSchema),
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const encounter = await campaignService.createEncounter(req.params.id, req.user!.id, req.body);
      return res.status(201).json(encounter);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create encounter';
      return res.status(400).json({ error: message });
    }
  }
);

// PUT /campaigns/:campaignId/encounters/:encounterId - Update an encounter
router.put(
  '/:campaignId/encounters/:encounterId',
  auth,
  validateBody(createEncounterSchema.partial()),
  async (req: Request<{ campaignId: string; encounterId: string }>, res: Response) => {
    try {
      const encounter = await campaignService.updateEncounter(
        req.params.encounterId,
        req.user!.id,
        req.body
      );
      return res.json(encounter);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update encounter';
      return res.status(400).json({ error: message });
    }
  }
);

// DELETE /campaigns/:campaignId/encounters/:encounterId - Delete an encounter
router.delete(
  '/:campaignId/encounters/:encounterId',
  auth,
  async (req: Request<{ campaignId: string; encounterId: string }>, res: Response) => {
    try {
      await campaignService.deleteEncounter(req.params.encounterId, req.user!.id);
      return res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete encounter';
      return res.status(400).json({ error: message });
    }
  }
);

// ========================
// NPC Routes
// ========================

// POST /campaigns/:id/npcs - Create an NPC
router.post(
  '/:id/npcs',
  auth,
  validateBody(createNPCSchema),
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const npc = await campaignService.createNPC(req.params.id, req.user!.id, req.body);
      return res.status(201).json(npc);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create NPC';
      return res.status(400).json({ error: message });
    }
  }
);

// PUT /campaigns/:campaignId/npcs/:npcId - Update an NPC
router.put(
  '/:campaignId/npcs/:npcId',
  auth,
  validateBody(createNPCSchema.partial()),
  async (req: Request<{ campaignId: string; npcId: string }>, res: Response) => {
    try {
      const npc = await campaignService.updateNPC(req.params.npcId, req.user!.id, req.body);
      return res.json(npc);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update NPC';
      return res.status(400).json({ error: message });
    }
  }
);

// DELETE /campaigns/:campaignId/npcs/:npcId - Delete an NPC
router.delete(
  '/:campaignId/npcs/:npcId',
  auth,
  async (req: Request<{ campaignId: string; npcId: string }>, res: Response) => {
    try {
      await campaignService.deleteNPC(req.params.npcId, req.user!.id);
      return res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete NPC';
      return res.status(400).json({ error: message });
    }
  }
);

// ========================
// Quest Routes
// ========================

// POST /campaigns/:id/quests - Create a quest
router.post(
  '/:id/quests',
  auth,
  validateBody(createQuestSchema),
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const quest = await campaignService.createQuest(req.params.id, req.user!.id, req.body);
      return res.status(201).json(quest);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create quest';
      return res.status(400).json({ error: message });
    }
  }
);

// PUT /campaigns/:campaignId/quests/:questId - Update a quest
router.put(
  '/:campaignId/quests/:questId',
  auth,
  validateBody(createQuestSchema.partial()),
  async (req: Request<{ campaignId: string; questId: string }>, res: Response) => {
    try {
      const quest = await campaignService.updateQuest(req.params.questId, req.user!.id, req.body);
      return res.json(quest);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update quest';
      return res.status(400).json({ error: message });
    }
  }
);

// DELETE /campaigns/:campaignId/quests/:questId - Delete a quest
router.delete(
  '/:campaignId/quests/:questId',
  auth,
  async (req: Request<{ campaignId: string; questId: string }>, res: Response) => {
    try {
      await campaignService.deleteQuest(req.params.questId, req.user!.id);
      return res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete quest';
      return res.status(400).json({ error: message });
    }
  }
);

export default router;
