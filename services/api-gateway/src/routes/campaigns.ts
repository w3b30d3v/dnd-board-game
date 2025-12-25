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

// ========================
// Campaign Routes
// ========================

// GET /campaigns - List user's campaigns
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const campaigns = await campaignService.findByUser(req.user!.id);
    return res.json({ campaigns: campaigns || [] });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Check for database errors
    if (message.includes('connect') || message.includes('ECONNREFUSED') ||
        message.includes('database') || message.includes('P2022') ||
        message.includes('column') || message.includes('does not exist')) {
      return res.status(503).json({ error: 'Database error', details: message });
    }
    return res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// POST /campaigns - Create a new campaign
router.post('/', auth, validateBody(createCampaignSchema), async (req: Request, res: Response) => {
  try {
    console.log('Creating campaign with data:', req.body);
    const campaign = await campaignService.create(req.user!.id, req.body);
    return res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    const message = error instanceof Error ? error.message : 'Failed to create campaign';
    // Check for database errors
    if (message.includes('connect') || message.includes('ECONNREFUSED') ||
        message.includes('database') || message.includes('P2022') ||
        message.includes('column') || message.includes('does not exist')) {
      return res.status(503).json({ error: 'Database error', details: message });
    }
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

export default router;
