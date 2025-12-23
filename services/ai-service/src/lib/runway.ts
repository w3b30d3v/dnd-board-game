// Runway Video Generation Client (Veo3.1 / Gen3a models)
import RunwayML from '@runwayml/sdk';
import { config } from './config.js';
import { logger } from './logger.js';

// Initialize Runway client
const runway = config.runwayApiKey
  ? new RunwayML({ apiKey: config.runwayApiKey })
  : null;

// Model options
export type TextToVideoModel = 'veo3.1' | 'veo3.1_fast';
export type ImageToVideoModel = 'gen3a_turbo' | 'veo3.1' | 'veo3.1_fast';

// Veo model options
export type VeoDuration = 4 | 6 | 8;
export type VeoRatio = '1280:720' | '720:1280' | '1080:1920' | '1920:1080';

// Gen3a model options (for image-to-video only)
export type Gen3aDuration = 5 | 10;
export type Gen3aRatio = '768:1280' | '1280:768';

export interface VideoGenerationOptions {
  prompt: string;
  imageUrl?: string; // Optional source image for image-to-video
  duration?: VeoDuration; // 4, 6, or 8 seconds for Veo models
  aspectRatio?: VeoRatio;
  model?: TextToVideoModel;
  audio?: boolean;
}

export interface ImageVideoGenerationOptions {
  prompt: string;
  duration?: Gen3aDuration | VeoDuration;
  aspectRatio?: Gen3aRatio | VeoRatio;
  model?: ImageToVideoModel;
  seed?: number;
}

export interface VideoGenerationResult {
  taskId: string;
  status: 'PENDING' | 'THROTTLED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  progress?: number;
  error?: string;
  createdAt: Date;
}

export interface VideoTask {
  id: string;
  campaignId: string;
  sceneDescription: string;
  style: 'cinematic' | 'fantasy' | 'dark' | 'epic';
  status: VideoGenerationResult['status'];
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

// Style-specific prompt enhancements
const STYLE_PROMPTS: Record<string, string> = {
  cinematic:
    'Cinematic camera movement, dramatic lighting, film grain, shallow depth of field, professional cinematography',
  fantasy:
    'High fantasy aesthetic, magical atmosphere, ethereal lighting, mystical elements, D&D inspired visuals',
  dark:
    'Dark and moody atmosphere, dramatic shadows, ominous lighting, gothic fantasy aesthetic, foreboding tone',
  epic:
    'Epic scale, sweeping camera movements, grand vistas, heroic lighting, awe-inspiring visuals',
};

/**
 * Generate a video cutscene using Runway Veo 3.1 (text-to-video)
 */
export async function generateVideo(
  options: VideoGenerationOptions
): Promise<VideoGenerationResult> {
  if (!runway) {
    logger.warn('Runway API key not configured, returning mock response');
    return createMockResponse();
  }

  try {
    logger.info({ prompt: options.prompt.substring(0, 100) }, 'Starting video generation');

    const model = options.model || 'veo3.1_fast';
    const duration = options.duration || (config.runwayDefaultDuration as VeoDuration);
    const ratio = options.aspectRatio || '1280:720';

    // Use text-to-video with Veo 3.1 models
    const task = await runway.textToVideo.create({
      model,
      promptText: options.prompt,
      duration,
      ratio,
      audio: options.audio,
    });

    logger.info({ taskId: task.id }, 'Video generation task created');

    return {
      taskId: task.id,
      status: 'PENDING',
      createdAt: new Date(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error }, 'Video generation failed');
    throw new Error(`Video generation failed: ${message}`);
  }
}

/**
 * Generate video from an image (image-to-video)
 * Uses Gen3a Turbo model which supports 5 or 10 second durations
 */
export async function generateVideoFromImage(
  imageUrl: string,
  options: ImageVideoGenerationOptions
): Promise<VideoGenerationResult> {
  if (!runway) {
    logger.warn('Runway API key not configured, returning mock response');
    return createMockResponse();
  }

  try {
    logger.info({ imageUrl, prompt: options.prompt.substring(0, 100) }, 'Starting image-to-video generation');

    const model = options.model || 'gen3a_turbo';

    // Gen3a uses different duration/ratio than Veo models
    if (model === 'gen3a_turbo') {
      const duration = (options.duration === 5 || options.duration === 10)
        ? options.duration
        : 5;
      const ratio = (options.aspectRatio === '768:1280' || options.aspectRatio === '1280:768')
        ? options.aspectRatio
        : '1280:768';

      const task = await runway.imageToVideo.create({
        model: 'gen3a_turbo',
        promptImage: imageUrl,
        promptText: options.prompt,
        duration,
        ratio,
        seed: options.seed,
      });

      logger.info({ taskId: task.id }, 'Image-to-video task created (gen3a_turbo)');

      return {
        taskId: task.id,
        status: 'PENDING',
        createdAt: new Date(),
      };
    } else {
      // Veo models
      const duration = (options.duration === 4 || options.duration === 6 || options.duration === 8)
        ? options.duration
        : 6;
      const ratio = (['1280:720', '720:1280', '1080:1920', '1920:1080'].includes(options.aspectRatio || ''))
        ? (options.aspectRatio as VeoRatio)
        : '1280:720';

      const task = await runway.imageToVideo.create({
        model: model as 'veo3.1' | 'veo3.1_fast',
        promptImage: imageUrl,
        promptText: options.prompt,
        duration,
        ratio,
      });

      logger.info({ taskId: task.id }, `Image-to-video task created (${model})`);

      return {
        taskId: task.id,
        status: 'PENDING',
        createdAt: new Date(),
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error }, 'Image-to-video generation failed');
    throw new Error(`Image-to-video generation failed: ${message}`);
  }
}

/**
 * Get the status of a video generation task
 */
export async function getVideoStatus(taskId: string): Promise<VideoGenerationResult> {
  if (!runway) {
    logger.warn('Runway API key not configured, returning mock response');
    return createMockResponse(taskId, 'SUCCEEDED');
  }

  try {
    const task = await runway.tasks.retrieve(taskId);

    const result: VideoGenerationResult = {
      taskId: task.id,
      status: task.status as VideoGenerationResult['status'],
      createdAt: new Date(task.createdAt),
    };

    // Add video URL if completed (task is a union type, need to check status)
    if (task.status === 'SUCCEEDED') {
      const succeededTask = task as { output: string[] };
      if (succeededTask.output && succeededTask.output.length > 0) {
        result.videoUrl = succeededTask.output[0];
        result.duration = config.runwayDefaultDuration;
      }
    }

    // Add progress if running
    if (task.status === 'RUNNING') {
      const runningTask = task as { progress: number };
      result.progress = runningTask.progress;
    }

    // Add error if failed
    if (task.status === 'FAILED') {
      const failedTask = task as { failure: string };
      result.error = failedTask.failure;
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error, taskId }, 'Failed to get video status');
    throw new Error(`Failed to get video status: ${message}`);
  }
}

/**
 * Cancel/delete a video generation task
 * Note: Running/pending/throttled tasks are cancelled, completed tasks are deleted
 */
export async function cancelVideo(taskId: string): Promise<void> {
  if (!runway) {
    logger.warn('Runway API key not configured');
    return;
  }

  try {
    await runway.tasks.delete(taskId);
    logger.info({ taskId }, 'Video generation cancelled/deleted');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error, taskId }, 'Failed to cancel video');
    throw new Error(`Failed to cancel video: ${message}`);
  }
}

/**
 * Build an enhanced prompt for video generation
 */
export function buildVideoPrompt(
  sceneDescription: string,
  style: keyof typeof STYLE_PROMPTS = 'cinematic'
): string {
  const styleEnhancement = STYLE_PROMPTS[style] || STYLE_PROMPTS.cinematic;

  return `${sceneDescription}. ${styleEnhancement}`;
}

/**
 * Estimate cost for video generation
 * Runway Gen-3 pricing: ~$0.05 per second of video
 */
export function estimateCost(durationSeconds: number): number {
  const costPerSecond = 0.05;
  return durationSeconds * costPerSecond;
}

/**
 * Check if Runway is configured and available
 */
export function isRunwayConfigured(): boolean {
  return !!config.runwayApiKey;
}

/**
 * Create a mock response for development/testing
 */
function createMockResponse(
  taskId: string = `mock_${Date.now()}`,
  status: VideoGenerationResult['status'] = 'PENDING'
): VideoGenerationResult {
  const result: VideoGenerationResult = {
    taskId,
    status,
    createdAt: new Date(),
  };

  if (status === 'SUCCEEDED') {
    // Use a sample video URL for testing
    result.videoUrl = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';
    result.duration = 5;
  }

  return result;
}

// Scene type presets for common D&D scenarios
export const SCENE_PRESETS = {
  tavernEntrance: {
    description: 'Camera slowly pushes through heavy wooden doors into a warm, bustling tavern. Firelight flickers across weathered faces of adventurers, tankards raised in celebration.',
    style: 'cinematic' as const,
  },
  dungeonDescent: {
    description: 'Torchlight illuminates ancient stone stairs descending into darkness. Cobwebs stretch across forgotten corridors as shadows dance on moss-covered walls.',
    style: 'dark' as const,
  },
  dragonReveal: {
    description: 'A massive dragon emerges from volcanic smoke, scales gleaming with inner fire. Wings unfurl against a crimson sky as ancient eyes fix upon the viewer.',
    style: 'epic' as const,
  },
  forestGlade: {
    description: 'Sunbeams pierce through ancient forest canopy, illuminating a mystical glade. Fireflies dance among glowing mushrooms and ethereal mist.',
    style: 'fantasy' as const,
  },
  battleCharge: {
    description: 'Warriors charge across a battlefield, weapons raised. Magical energy crackles through the air as armies clash in epic combat.',
    style: 'epic' as const,
  },
  mysticalPortal: {
    description: 'A swirling portal of arcane energy tears open in reality. Eldritch light spills forth as otherworldly shapes move within the magical gateway.',
    style: 'fantasy' as const,
  },
  castleApproach: {
    description: 'A towering castle rises from morning mist, its spires reaching toward storm clouds. Lightning illuminates gothic architecture and ancient banners.',
    style: 'dark' as const,
  },
  victoryMoment: {
    description: 'Heroes stand triumphant atop a defeated foe, sunlight breaking through clouds above. Their weapons raised in victory as allies cheer below.',
    style: 'cinematic' as const,
  },
};

export type ScenePresetKey = keyof typeof SCENE_PRESETS;
