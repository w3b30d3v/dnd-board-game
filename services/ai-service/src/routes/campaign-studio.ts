// Campaign Studio Routes
// Endpoints for persisting generated content to campaigns and handling webhooks

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { logger } from '../lib/logger.js';
import { getConversation } from '../handlers/conversation.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { uploadImageFromUrl, STORAGE_ENABLED } from '../lib/storageService.js';

const router: RouterType = Router();

// Type for NanoBanana API response
interface NanoBananaResponse {
  taskId?: string;
  imageUrl?: string;
  status?: string;
}

// Validation schemas
const saveContentSchema = z.object({
  conversationId: z.string().optional(),
  content: z.object({
    setting: z.record(z.unknown()).optional(),
    locations: z.array(z.record(z.unknown())).optional(),
    npcs: z.array(z.record(z.unknown())).optional(),
    encounters: z.array(z.record(z.unknown())).optional(),
    quests: z.array(z.record(z.unknown())).optional(),
    maps: z.array(z.record(z.unknown())).optional(),
  }).optional(),
});

const generateImageSchema = z.object({
  type: z.enum(['npc', 'location', 'scene']),
  entityId: z.string().optional(),
  prompt: z.string().min(10).max(2000),
  style: z.string().optional(),
});

// Save all generated content from conversation to campaign
router.post('/:campaignId/save', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { conversationId, content } = saveContentSchema.parse(req.body);

    // Verify campaign ownership
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, ownerId: userId },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Get content from conversation if conversationId provided
    let contentToSave = content;
    if (conversationId && !content) {
      const conversation = await getConversation(conversationId);
      if (conversation && conversation.generatedContent) {
        // Transform generated content blocks into the expected format
        const blocks = conversation.generatedContent as Array<{ type: string; data: Record<string, unknown> }>;
        contentToSave = {
          setting: blocks.find(b => b.type === 'setting')?.data,
          locations: blocks.filter(b => b.type === 'locations').map(b => b.data),
          npcs: blocks.filter(b => b.type === 'npcs').map(b => b.data),
          encounters: blocks.filter(b => b.type === 'encounters').map(b => b.data),
          quests: blocks.filter(b => b.type === 'quests').map(b => b.data),
          maps: blocks.filter(b => b.type === 'maps').map(b => b.data),
        };
      }
    }

    if (!contentToSave) {
      res.status(400).json({ error: 'No content to save' });
      return;
    }

    const results = {
      setting: false,
      npcs: 0,
      encounters: 0,
      quests: 0,
      maps: 0,
    };

    // Save setting to campaign
    if (contentToSave.setting) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          settings: contentToSave.setting as object,
          updatedAt: new Date(),
        },
      });
      results.setting = true;
    }

    // Save NPCs
    if (contentToSave.npcs && contentToSave.npcs.length > 0) {
      for (const npc of contentToSave.npcs) {
        await prisma.nPC.create({
          data: {
            campaignId,
            name: (npc.name as string) || 'Unnamed NPC',
            title: npc.title as string | undefined,
            description: npc.description as string | undefined,
            personality: npc.personality as string | undefined,
            motivation: npc.motivation as string | undefined,
            secrets: npc.secrets as string | undefined,
            portraitUrl: npc.portraitUrl as string | undefined,
            stats: npc.stats as object | undefined,
            tags: (npc.tags as string[]) || [],
            isHostile: (npc.isHostile as boolean) || false,
            faction: npc.faction as string | undefined,
          },
        });
        results.npcs++;
      }
    }

    // Save Encounters
    if (contentToSave.encounters && contentToSave.encounters.length > 0) {
      for (const encounter of contentToSave.encounters) {
        await prisma.encounter.create({
          data: {
            campaignId,
            name: (encounter.name as string) || 'Unnamed Encounter',
            description: encounter.description as string | undefined,
            difficulty: (encounter.difficulty as string) || 'medium',
            monsters: (encounter.monsters as object) || [],
            objectives: (encounter.objectives as object) || [],
            rewards: (encounter.rewards as object) || [],
            environment: (encounter.environment as object) || {},
            tags: (encounter.tags as string[]) || [],
          },
        });
        results.encounters++;
      }
    }

    // Save Quests
    if (contentToSave.quests && contentToSave.quests.length > 0) {
      for (const quest of contentToSave.quests) {
        await prisma.quest.create({
          data: {
            campaignId,
            name: (quest.name as string) || 'Unnamed Quest',
            description: quest.description as string | undefined,
            type: (quest.type as string) || 'side',
            objectives: (quest.objectives as object) || [],
            rewards: (quest.rewards as object) || [],
            prerequisites: (quest.prerequisites as object) || [],
            recommendedLevel: quest.recommendedLevel as number | undefined,
            tags: (quest.tags as string[]) || [],
          },
        });
        results.quests++;
      }
    }

    // Save Maps
    if (contentToSave.maps && contentToSave.maps.length > 0) {
      for (const map of contentToSave.maps) {
        await prisma.map.create({
          data: {
            campaignId,
            name: (map.name as string) || 'Unnamed Map',
            description: map.description as string | undefined,
            width: (map.width as number) || 30,
            height: (map.height as number) || 30,
            gridSize: (map.gridSize as number) || 5,
            tileSize: (map.tileSize as number) || 64,
            layers: (map.layers as object) || [],
            tiles: (map.tiles as object) || [],
            backgroundUrl: map.backgroundUrl as string | undefined,
            lighting: (map.lighting as object) || {},
            ambience: (map.ambience as object) || {},
            tags: (map.tags as string[]) || [],
          },
        });
        results.maps++;
      }
    }

    // Link conversation to campaign if not already linked
    if (conversationId) {
      await prisma.campaignConversation.updateMany({
        where: { id: conversationId, userId },
        data: { campaignId },
      });
    }

    logger.info({ campaignId, results }, 'Saved content to campaign');

    res.json({
      success: true,
      campaignId,
      saved: results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to save content to campaign');
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// Get all content for a campaign
router.get('/:campaignId/content', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify campaign access
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        OR: [
          { ownerId: userId },
          { players: { some: { userId } } },
        ],
      },
      include: {
        npcs: true,
        encounters: true,
        quests: true,
        maps: true,
        videos: true,
        audioClips: true,
      },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Get associated conversation if any
    const conversation = await prisma.campaignConversation.findFirst({
      where: { campaignId, userId },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        settings: campaign.settings,
        status: campaign.status,
      },
      content: {
        npcs: campaign.npcs,
        encounters: campaign.encounters,
        quests: campaign.quests,
        maps: campaign.maps,
        videos: campaign.videos,
        audioClips: campaign.audioClips,
      },
      conversation: conversation ? {
        id: conversation.id,
        phase: conversation.phase,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
      } : null,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get campaign content');
    res.status(500).json({ error: 'Failed to get content' });
  }
});

// Save a video to campaign
router.post('/:campaignId/video', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const schema = z.object({
      name: z.string().optional(),
      type: z.enum(['intro', 'location', 'npc', 'battle', 'cutscene', 'outro']).default('cutscene'),
      prompt: z.string(),
      style: z.string().optional(),
      duration: z.number().optional(),
      aspectRatio: z.string().optional(),
      runwayTaskId: z.string().optional(),
      model: z.string().optional(),
      videoUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
      cost: z.number().default(0),
    });

    const data = schema.parse(req.body);

    // Verify campaign ownership
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, ownerId: userId },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const video = await prisma.campaignVideo.create({
      data: {
        campaignId,
        ...data,
      },
    });

    res.json({ video });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to save video');
    res.status(500).json({ error: 'Failed to save video' });
  }
});

// Update video status (for polling/webhook)
router.patch('/:campaignId/video/:videoId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId, videoId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const schema = z.object({
      status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
      videoUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      error: z.string().optional(),
    });

    const data = schema.parse(req.body);

    // Verify campaign ownership
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, ownerId: userId },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const video = await prisma.campaignVideo.update({
      where: { id: videoId },
      data,
    });

    res.json({ video });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to update video');
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Save audio to campaign
router.post('/:campaignId/audio', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const schema = z.object({
      name: z.string().optional(),
      type: z.enum(['narration', 'npc_dialogue', 'read_aloud', 'ambient']).default('narration'),
      text: z.string(),
      voiceId: z.string(),
      voiceProfile: z.string().optional(),
      emotion: z.string().optional(),
      audioUrl: z.string().optional(),
      duration: z.number().optional(),
      status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
      characterCount: z.number().default(0),
      cost: z.number().default(0),
    });

    const data = schema.parse(req.body);

    // Verify campaign ownership
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, ownerId: userId },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const audio = await prisma.campaignAudio.create({
      data: {
        campaignId,
        ...data,
      },
    });

    res.json({ audio });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to save audio');
    res.status(500).json({ error: 'Failed to save audio' });
  }
});

// Webhook for Runway async video generation
router.post('/webhook/runway', async (req: Request, res: Response) => {
  try {
    const { taskId, status, output, progress } = req.body;

    logger.info({ taskId, status, progress }, 'Runway webhook received');

    // Find the video by runwayTaskId
    const video = await prisma.campaignVideo.findFirst({
      where: { runwayTaskId: taskId },
    });

    if (!video) {
      logger.warn({ taskId }, 'No video found for Runway task');
      res.json({ received: true, matched: false });
      return;
    }

    // Map Runway status to our status
    let videoStatus: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';
    if (status === 'RUNNING' || status === 'THROTTLED') {
      videoStatus = 'processing';
    } else if (status === 'SUCCEEDED') {
      videoStatus = 'completed';
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      videoStatus = 'failed';
    }

    // Update the video record
    const updateData: {
      status: typeof videoStatus;
      videoUrl?: string;
      thumbnailUrl?: string;
    } = {
      status: videoStatus,
    };

    // If succeeded, upload to permanent storage
    if (status === 'SUCCEEDED' && output && Array.isArray(output) && output.length > 0) {
      let videoUrl = output[0];

      if (STORAGE_ENABLED) {
        try {
          const { uploadVideoFromUrl } = await import('../lib/storageService.js');
          videoUrl = await uploadVideoFromUrl(output[0], 'videos', taskId);
          logger.info({ taskId, videoUrl }, 'Video stored permanently');
        } catch (storageError) {
          logger.warn({ taskId, error: storageError }, 'Failed to store video permanently');
        }
      }

      updateData.videoUrl = videoUrl;
    }

    await prisma.campaignVideo.update({
      where: { id: video.id },
      data: updateData,
    });

    logger.info({ taskId, videoStatus }, 'Video status updated via webhook');

    res.json({ received: true, matched: true, status: videoStatus });
  } catch (error) {
    logger.error({ error }, 'Failed to process Runway webhook');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook for NanoBanana async image generation
router.post('/webhook/nanobanana', async (req: Request, res: Response) => {
  try {
    const { taskId, status, imageUrl, error } = req.body;

    logger.info({ taskId, status }, 'NanoBanana webhook received');

    if (status === 'completed' && imageUrl) {
      // Upload to permanent storage if enabled
      if (STORAGE_ENABLED) {
        try {
          const permanentUrl = await uploadImageFromUrl(imageUrl, 'ai-campaigns', taskId || 'webhook');
          logger.info({ taskId, permanentUrl }, 'Image stored permanently');
        } catch (storageError) {
          logger.warn({ taskId, error: storageError }, 'Failed to store image permanently');
        }
      } else {
        logger.info({ taskId, imageUrl }, 'Image generation completed (no permanent storage)');
      }
    } else if (status === 'failed') {
      logger.error({ taskId, error }, 'Image generation failed');
    }

    res.json({ received: true });
  } catch (error) {
    logger.error({ error }, 'Failed to process NanoBanana webhook');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Generate image for NPC or location
router.post('/:campaignId/generate-image', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { type, entityId, prompt, style } = generateImageSchema.parse(req.body);

    // Verify campaign ownership
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, ownerId: userId },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Build the NanoBanana API request
    const nanoBananaApiKey = process.env.NANOBANANA_API_KEY;
    if (!nanoBananaApiKey) {
      res.status(503).json({ error: 'Image generation not configured' });
      return;
    }

    // Construct D&D-themed prompt
    const fullPrompt = style
      ? `${prompt}, ${style} style, D&D fantasy art, high quality`
      : `${prompt}, epic fantasy art, D&D style, high quality, detailed`;

    // Call NanoBanana API
    const response = await fetch('https://api.nanobanana.ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nanoBananaApiKey}`,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        aspectRatio: type === 'npc' ? '1:1' : '16:9',
        webhookUrl: process.env.CALLBACK_BASE_URL
          ? `${process.env.CALLBACK_BASE_URL}/ai/campaign-studio/webhook/nanobanana`
          : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error({ status: response.status, errorData }, 'NanoBanana API error');
      res.status(502).json({ error: 'Image generation failed' });
      return;
    }

    const result = await response.json() as NanoBananaResponse;

    // Store image permanently if URL returned and storage is enabled
    let finalImageUrl = result.imageUrl;
    if (result.imageUrl && STORAGE_ENABLED) {
      try {
        finalImageUrl = await uploadImageFromUrl(result.imageUrl, 'ai-campaigns', type);
        logger.info({ finalImageUrl }, 'Campaign image stored permanently');
      } catch (storageError) {
        logger.warn({ error: storageError }, 'Failed to store image, using temporary URL');
      }
    }

    // If entity ID provided, update the entity with the (permanent) image URL
    if (entityId && finalImageUrl) {
      if (type === 'npc') {
        await prisma.nPC.update({
          where: { id: entityId },
          data: { portraitUrl: finalImageUrl },
        });
      }
      // Could add location/scene image updates here
    }

    res.json({
      taskId: result.taskId,
      imageUrl: finalImageUrl,
      status: result.status ?? 'pending',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to generate image');
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

export default router;
