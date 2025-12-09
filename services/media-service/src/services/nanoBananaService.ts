// NanoBanana API Service for AI Image Generation
// Powered by Google Gemini image models

import axios from 'axios';
import crypto from 'crypto';
import { sanitizeImagePrompt, isPromptSafe, buildSafeNegativePrompt } from '../utils/contentSafety.js';

const NANOBANANA_API_URL = 'https://api.nanobananaapi.ai/v1';

interface GenerateOptions {
  prompt: string;
  negativePrompt?: string;
  referenceImages?: string[]; // URLs or base64
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  resolution?: '1k' | '2k' | '4k';
  usePro?: boolean; // Use Pro API for higher quality
}

interface GenerateResult {
  taskId: string;
  status: 'pending' | 'completed' | 'failed';
  imageUrl?: string;
  error?: string;
}

// Simple in-memory cache (use Redis in production)
const imageCache = new Map<string, { result: GenerateResult; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export class NanoBananaService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NANOBANANA_API_KEY || '';
    if (!this.apiKey) {
      console.warn('NANOBANANA_API_KEY not set - using fallback mode');
    }
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Generate an image with safety checks
   */
  async generateImage(options: GenerateOptions): Promise<GenerateResult> {
    const { prompt, negativePrompt, referenceImages, aspectRatio, resolution, usePro } = options;

    // SAFETY: Validate prompt
    if (!isPromptSafe(prompt)) {
      throw new Error('Prompt contains inappropriate content');
    }

    // SAFETY: Add mandatory safety terms
    const safePrompt = sanitizeImagePrompt(prompt);
    const safeNegative = buildSafeNegativePrompt(negativePrompt);

    // Check cache first
    const cacheKey = this.buildCacheKey(safePrompt.prompt, safeNegative);
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }

    // If no API key, return a fallback placeholder
    if (!this.apiKey) {
      return this.generateFallbackImage(options);
    }

    // Choose endpoint based on quality needs
    const endpoint = usePro ? '/generate-pro' : '/generate';

    try {
      const response = await axios.post(
        `${NANOBANANA_API_URL}${endpoint}`,
        {
          prompt: safePrompt.prompt,
          negative_prompt: safeNegative,
          images: referenceImages,
          aspect_ratio: aspectRatio || '1:1',
          resolution: resolution || '1k',
          output_format: 'png',
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 second timeout
        }
      );

      const { task_id, status, image_url } = response.data;

      // If completed immediately, cache and return
      if (status === 'completed' && image_url) {
        const result: GenerateResult = {
          taskId: task_id,
          status: 'completed',
          imageUrl: image_url,
        };

        // Cache the result
        imageCache.set(cacheKey, { result, timestamp: Date.now() });

        return result;
      }

      // Return pending status for polling
      return {
        taskId: task_id,
        status: 'pending',
      };
    } catch (error: any) {
      console.error('NanoBanana API error:', error.response?.data || error.message);

      // On API error, return fallback
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('NanoBanana API authentication failed - using fallback');
        return this.generateFallbackImage(options);
      }

      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  /**
   * Poll for task completion
   */
  async getTaskStatus(taskId: string): Promise<GenerateResult> {
    if (!this.apiKey) {
      throw new Error('API not configured');
    }

    try {
      const response = await axios.get(`${NANOBANANA_API_URL}/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const { status, image_url, error } = response.data;

      return {
        taskId,
        status: status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'pending',
        imageUrl: image_url,
        error,
      };
    } catch (error: any) {
      throw new Error(`Failed to get task status: ${error.message}`);
    }
  }

  /**
   * Wait for completion with polling
   */
  async waitForCompletion(taskId: string, timeoutMs = 60000): Promise<GenerateResult> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < timeoutMs) {
      const result = await this.getTaskStatus(taskId);

      if (result.status === 'completed' || result.status === 'failed') {
        return result;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Image generation timed out');
  }

  /**
   * Generate fallback image when API is not available
   * Uses DiceBear for placeholder avatars
   */
  private generateFallbackImage(options: GenerateOptions): GenerateResult {
    const seed = this.buildCacheKey(options.prompt, options.negativePrompt || '');
    const style = 'adventurer'; // D&D-appropriate style

    const imageUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1b26&size=512`;

    return {
      taskId: `fallback-${seed.substring(0, 8)}`,
      status: 'completed',
      imageUrl,
    };
  }

  /**
   * Build cache key from prompt
   */
  private buildCacheKey(prompt: string, negative: string): string {
    const hash = crypto.createHash('md5').update(`${prompt}|${negative}`).digest('hex');
    return hash;
  }

  /**
   * Get remaining API credits
   */
  async getCredits(): Promise<number> {
    if (!this.apiKey) {
      return 0;
    }

    try {
      const response = await axios.get(`${NANOBANANA_API_URL}/account/credits`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.data.credits;
    } catch (error: any) {
      throw new Error(`Failed to get credits: ${error.message}`);
    }
  }
}

export const nanoBananaService = new NanoBananaService();
