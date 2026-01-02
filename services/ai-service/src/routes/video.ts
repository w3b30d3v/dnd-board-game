// Video Generation Routes for Runway (Veo3.1 / Gen3a models)
import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import {
  generateVideo,
  generateVideoFromImage,
  getVideoStatus,
  cancelVideo,
  buildVideoPrompt,
  estimateCost,
  isRunwayConfigured,
  SCENE_PRESETS,
  ScenePresetKey,
  VeoDuration,
  VeoRatio,
} from '../lib/runway.js';
import { config } from '../lib/config.js';
import { validateAndSanitize, ContentSafetyError } from '../lib/contentSafety.js';
import { uploadVideoFromUrl, STORAGE_ENABLED } from '../lib/storageService.js';

// Track which videos have been uploaded to R2 to avoid duplicate uploads
const uploadedVideos = new Map<string, string>();

const router: RouterType = Router();

// Validation schemas for Veo models (text-to-video)
const generateVideoSchema = z.object({
  sceneDescription: z.string().min(10).max(1000),
  style: z.enum(['cinematic', 'fantasy', 'dark', 'epic']).default('cinematic'),
  duration: z.union([z.literal(4), z.literal(6), z.literal(8)]).default(6),
  aspectRatio: z.enum(['1280:720', '720:1280', '1080:1920', '1920:1080']).default('1280:720'),
  campaignId: z.string().optional(),
  audio: z.boolean().optional(),
  model: z.enum(['veo3.1', 'veo3.1_fast']).default('veo3.1_fast'),
});

// For image-to-video, we support gen3a_turbo (5/10s) or veo models (4/6/8s)
const generateFromImageSchema = z.object({
  sceneDescription: z.string().min(10).max(1000),
  style: z.enum(['cinematic', 'fantasy', 'dark', 'epic']).default('cinematic'),
  imageUrl: z.string().url(),
  duration: z.union([z.literal(4), z.literal(5), z.literal(6), z.literal(8), z.literal(10)]).default(5),
  aspectRatio: z.enum(['1280:720', '720:1280', '1080:1920', '1920:1080', '768:1280', '1280:768']).default('1280:768'),
  campaignId: z.string().optional(),
  seed: z.number().optional(),
  model: z.enum(['gen3a_turbo', 'veo3.1', 'veo3.1_fast']).default('gen3a_turbo'),
});

const presetSchema = z.object({
  preset: z.enum([
    'tavernEntrance',
    'dungeonDescent',
    'dragonReveal',
    'forestGlade',
    'battleCharge',
    'mysticalPortal',
    'castleApproach',
    'victoryMoment',
  ] as const),
  duration: z.union([z.literal(4), z.literal(6), z.literal(8)]).default(6),
  campaignId: z.string().optional(),
});

/**
 * GET /ai/video/status
 * Check if Runway is configured
 */
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    configured: isRunwayConfigured(),
    models: {
      textToVideo: ['veo3.1', 'veo3.1_fast'],
      imageToVideo: ['gen3a_turbo', 'veo3.1', 'veo3.1_fast'],
    },
    durations: {
      veo: [4, 6, 8],
      gen3a: [5, 10],
    },
    defaultDuration: config.runwayDefaultDuration,
    maxVideosPerCampaign: config.runwayMaxVideosPerCampaign,
    estimatedCost: {
      fourSeconds: estimateCost(4),
      sixSeconds: estimateCost(6),
      eightSeconds: estimateCost(8),
    },
  });
});

/**
 * GET /ai/video/presets
 * List available scene presets
 */
router.get('/presets', (_req: Request, res: Response) => {
  const presets = Object.entries(SCENE_PRESETS).map(([key, value]) => ({
    id: key,
    description: value.description,
    style: value.style,
    preview: value.description.substring(0, 100) + '...',
  }));

  res.json({ presets });
});

/**
 * POST /ai/video/generate
 * Generate a video cutscene from text description (using Veo models)
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const validation = generateVideoSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const { sceneDescription, style, duration, aspectRatio, campaignId, audio, model } = validation.data;

    // Content safety check - validate scene description before sending to Runway
    let safeDescription: string;
    try {
      safeDescription = validateAndSanitize(sceneDescription, 'video');
    } catch (error) {
      if (error instanceof ContentSafetyError) {
        logger.warn({ issues: error.issues }, 'Video content safety violation');
        return res.status(400).json({
          error: 'Content violates family-friendly policy',
          issues: error.issues,
        });
      }
      throw error;
    }

    // Check if Runway is configured
    if (!isRunwayConfigured()) {
      logger.warn('Video generation requested but Runway not configured');
      return res.status(503).json({
        error: 'Video generation not available',
        message: 'Runway API key not configured',
      });
    }

    // Build enhanced prompt with safe description
    const prompt = buildVideoPrompt(safeDescription, style);

    logger.info(
      { campaignId, style, duration, model },
      'Generating video cutscene'
    );

    // Start video generation with Veo model
    const result = await generateVideo({
      prompt,
      duration: duration as VeoDuration,
      aspectRatio: aspectRatio as VeoRatio,
      model,
      audio,
    });

    res.status(202).json({
      taskId: result.taskId,
      status: result.status,
      estimatedCost: estimateCost(duration),
      message: 'Video generation started',
      pollUrl: `/ai/video/${result.taskId}/status`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error }, 'Video generation failed');
    res.status(500).json({ error: message });
  }
});

/**
 * POST /ai/video/generate-from-image
 * Generate a video from a source image (supports gen3a_turbo or veo models)
 */
router.post('/generate-from-image', async (req: Request, res: Response) => {
  try {
    const validation = generateFromImageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const { imageUrl, sceneDescription, style, duration, aspectRatio, campaignId, seed, model } =
      validation.data;

    // Content safety check - validate scene description before sending to Runway
    let safeDescription: string;
    try {
      safeDescription = validateAndSanitize(sceneDescription, 'video');
    } catch (error) {
      if (error instanceof ContentSafetyError) {
        logger.warn({ issues: error.issues }, 'Image-to-video content safety violation');
        return res.status(400).json({
          error: 'Content violates family-friendly policy',
          issues: error.issues,
        });
      }
      throw error;
    }

    if (!isRunwayConfigured()) {
      return res.status(503).json({
        error: 'Video generation not available',
        message: 'Runway API key not configured',
      });
    }

    const prompt = buildVideoPrompt(safeDescription, style);

    logger.info(
      { campaignId, style, duration, model, hasImage: true },
      'Generating video from image'
    );

    const result = await generateVideoFromImage(imageUrl, {
      prompt,
      duration,
      aspectRatio,
      seed,
      model,
    });

    res.status(202).json({
      taskId: result.taskId,
      status: result.status,
      estimatedCost: estimateCost(duration),
      message: 'Image-to-video generation started',
      pollUrl: `/ai/video/${result.taskId}/status`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error }, 'Image-to-video generation failed');
    res.status(500).json({ error: message });
  }
});

/**
 * POST /ai/video/generate-preset
 * Generate a video from a predefined scene preset (using Veo models)
 */
router.post('/generate-preset', async (req: Request, res: Response) => {
  try {
    const validation = presetSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const { preset, duration, campaignId } = validation.data;

    if (!isRunwayConfigured()) {
      return res.status(503).json({
        error: 'Video generation not available',
        message: 'Runway API key not configured',
      });
    }

    const scenePreset = SCENE_PRESETS[preset as ScenePresetKey];
    const prompt = buildVideoPrompt(scenePreset.description, scenePreset.style);

    logger.info(
      { campaignId, preset, duration },
      'Generating video from preset'
    );

    const result = await generateVideo({
      prompt,
      duration: duration as VeoDuration,
      aspectRatio: '1280:720',
      model: 'veo3.1_fast',
    });

    res.status(202).json({
      taskId: result.taskId,
      status: result.status,
      preset,
      estimatedCost: estimateCost(duration),
      message: 'Preset video generation started',
      pollUrl: `/ai/video/${result.taskId}/status`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error }, 'Preset video generation failed');
    res.status(500).json({ error: message });
  }
});

/**
 * GET /ai/video/:taskId/status
 * Check the status of a video generation task
 */
router.get('/:taskId/status', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ error: 'Task ID required' });
    }

    const result = await getVideoStatus(taskId);

    // If video is completed and we have a URL, upload to R2 for permanent storage
    let finalVideoUrl = result.videoUrl;
    let finalThumbnailUrl = result.thumbnailUrl;

    if (result.status === 'SUCCEEDED' && result.videoUrl && STORAGE_ENABLED) {
      // Check if already uploaded
      if (uploadedVideos.has(taskId)) {
        finalVideoUrl = uploadedVideos.get(taskId);
        logger.info({ taskId }, 'Using cached R2 video URL');
      } else {
        try {
          logger.info({ taskId }, 'Uploading completed video to R2');
          finalVideoUrl = await uploadVideoFromUrl(result.videoUrl, 'videos', taskId);
          uploadedVideos.set(taskId, finalVideoUrl);
          logger.info({ taskId, finalVideoUrl }, 'Video stored permanently in R2');

          // Also upload thumbnail if available
          if (result.thumbnailUrl) {
            try {
              const { uploadImageFromUrl } = await import('../lib/storageService.js');
              finalThumbnailUrl = await uploadImageFromUrl(result.thumbnailUrl, 'videos/thumbnails', taskId);
            } catch (thumbError) {
              logger.warn({ error: thumbError }, 'Failed to upload thumbnail');
            }
          }
        } catch (uploadError) {
          logger.warn({ error: uploadError, taskId }, 'Failed to upload video to R2, using temporary URL');
        }
      }
    }

    res.json({
      taskId: result.taskId,
      status: result.status,
      progress: result.progress,
      videoUrl: finalVideoUrl,
      thumbnailUrl: finalThumbnailUrl,
      duration: result.duration,
      error: result.error,
      createdAt: result.createdAt,
      storedPermanently: STORAGE_ENABLED && uploadedVideos.has(taskId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error, taskId: req.params.taskId }, 'Failed to get video status');
    res.status(500).json({ error: message });
  }
});

/**
 * DELETE /ai/video/:taskId
 * Cancel a video generation task
 */
router.delete('/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ error: 'Task ID required' });
    }

    await cancelVideo(taskId);

    res.json({
      taskId,
      status: 'CANCELLED',
      message: 'Video generation cancelled',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error, taskId: req.params.taskId }, 'Failed to cancel video');
    res.status(500).json({ error: message });
  }
});

export default router;
