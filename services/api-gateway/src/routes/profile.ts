// Profile Routes
// Handles user profile management, stats, and AI avatar generation

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth.js';
import { uploadImageFromUrl } from '../services/storageService.js';

const router: Router = Router();
const prisma = new PrismaClient();

// Environment configuration
const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY;
const NANOBANANA_API_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';

// Enable permanent storage if S3/R2 is configured
const ENABLE_PERMANENT_STORAGE = process.env.S3_ACCESS_KEY ? true : false;

/**
 * GET /profile
 * Get current user's full profile
 */
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Extract bio and gender from preferences JSON if they exist there,
    // or from top-level fields if schema has been migrated
    const preferences = user.preferences as Record<string, unknown> || {};
    const bio = (user as Record<string, unknown>).bio ?? preferences.bio ?? null;
    const gender = (user as Record<string, unknown>).gender ?? preferences.gender ?? null;

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio,
        gender,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error: unknown) {
    console.error('Failed to get profile:', error);
    return res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

/**
 * PATCH /profile
 * Update user profile (displayName, bio, gender)
 */
router.patch('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { displayName, bio, gender } = req.body;

    // Get current user to preserve preferences
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    const currentPrefs = currentUser.preferences as Record<string, unknown> || {};

    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.length > 100) {
        return res.status(400).json({ success: false, error: 'Invalid display name' });
      }
      updateData.displayName = displayName;
    }

    // Store bio and gender in preferences JSON (works with existing schema)
    if (bio !== undefined || gender !== undefined) {
      const newPrefs = { ...currentPrefs };

      if (bio !== undefined) {
        if (typeof bio !== 'string' || bio.length > 500) {
          return res.status(400).json({ success: false, error: 'Bio must be less than 500 characters' });
        }
        newPrefs.bio = bio;
      }

      if (gender !== undefined) {
        const validGenders = ['male', 'female', 'non-binary', 'prefer-not-to-say', ''];
        if (!validGenders.includes(gender)) {
          return res.status(400).json({ success: false, error: 'Invalid gender value' });
        }
        newPrefs.gender = gender || null;
      }

      updateData.preferences = newPrefs;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const prefs = user.preferences as Record<string, unknown> || {};

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: prefs.bio ?? null,
        gender: prefs.gender ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error: unknown) {
    console.error('Failed to update profile:', error);
    return res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

/**
 * GET /profile/stats
 * Get user statistics (characters created, campaigns played, sessions, play time)
 */
router.get('/stats', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get character count
    const charactersCreated = await prisma.character.count({
      where: { userId },
    });

    // Get campaigns where user is a player
    const campaignsPlayed = await prisma.campaignPlayer.count({
      where: { userId },
    });

    // Get completed game sessions where user participated
    const sessionsCompleted = await prisma.gameSession.count({
      where: {
        status: 'completed',
        OR: [
          { campaign: { ownerId: userId } },
          { campaign: { players: { some: { userId } } } },
        ],
      },
    });

    // Calculate total play time from game sessions (in minutes)
    // Use createdAt and endedAt since startedAt doesn't exist
    const gameSessions = await prisma.gameSession.findMany({
      where: {
        OR: [
          { campaign: { ownerId: userId } },
          { campaign: { players: { some: { userId } } } },
        ],
      },
      select: {
        createdAt: true,
        endedAt: true,
        status: true,
      },
    });

    let totalMinutes = 0;
    for (const session of gameSessions) {
      // Only count sessions that have been started
      if (session.status === 'active' || session.status === 'paused' || session.status === 'completed') {
        const startTime = session.createdAt;
        const endTime = session.endedAt || new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        // Cap at 12 hours per session to avoid inflated numbers
        totalMinutes += Math.min(duration, 12 * 60);
      }
    }

    // Format play time
    let totalPlayTime: string;
    if (totalMinutes < 60) {
      totalPlayTime = `${Math.round(totalMinutes)}m`;
    } else if (totalMinutes < 1440) {
      totalPlayTime = `${Math.round(totalMinutes / 60)}h`;
    } else {
      const days = Math.floor(totalMinutes / 1440);
      const hours = Math.round((totalMinutes % 1440) / 60);
      totalPlayTime = `${days}d ${hours}h`;
    }

    return res.json({
      success: true,
      stats: {
        charactersCreated,
        campaignsPlayed,
        sessionsCompleted,
        totalPlayTime,
      },
    });
  } catch (error: unknown) {
    console.error('Failed to get profile stats:', error);
    return res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

/**
 * POST /profile/generate-avatar
 * Generate an AI profile picture based on user info
 */
router.post('/generate-avatar', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get user info for prompt generation
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const preferences = user.preferences as Record<string, unknown> || {};
    const bio = preferences.bio as string | undefined;
    const gender = preferences.gender as string | undefined;

    // Check if NanoBanana API is configured
    if (!NANOBANANA_API_KEY) {
      // Generate DiceBear avatar as fallback
      const seed = user.displayName || user.username || user.email || userId;
      const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });

      return res.json({
        success: true,
        avatarUrl,
        message: 'Generated DiceBear avatar (AI generation not configured)',
      });
    }

    // Build a prompt based on user info
    const genderTerm = gender === 'male' ? 'man' :
                       gender === 'female' ? 'woman' :
                       gender === 'non-binary' ? 'person' : 'person';

    // Extract personality hints from bio
    let personalityHints = '';
    if (bio) {
      if (bio.toLowerCase().includes('adventure')) personalityHints += 'adventurous, ';
      if (bio.toLowerCase().includes('magic') || bio.toLowerCase().includes('wizard')) personalityHints += 'mystical, ';
      if (bio.toLowerCase().includes('warrior') || bio.toLowerCase().includes('fight')) personalityHints += 'fierce, ';
      if (bio.toLowerCase().includes('kind') || bio.toLowerCase().includes('friendly')) personalityHints += 'warm, ';
      if (bio.toLowerCase().includes('wise') || bio.toLowerCase().includes('knowledge')) personalityHints += 'wise, ';
    }

    const prompt = `Portrait of a ${personalityHints}${genderTerm} fantasy adventurer, D&D style character portrait, warm lighting, detailed face, professional portrait photography style, epic fantasy atmosphere, high quality, masterpiece`;

    // Call NanoBanana API
    const response = await fetch(NANOBANANA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': NANOBANANA_API_KEY,
      },
      body: JSON.stringify({
        prompt,
        num_inference_steps: 25,
        guidance_scale: 7.5,
        aspect_ratio: '1:1',
      }),
    });

    if (!response.ok) {
      // Fallback to DiceBear
      const seed = user.displayName || user.username || user.email || userId;
      const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });

      return res.json({
        success: true,
        avatarUrl,
        message: 'Generated DiceBear avatar (AI generation failed)',
      });
    }

    const result = await response.json() as { url?: string; image_url?: string };
    const tempAvatarUrl = result.url || result.image_url;

    if (tempAvatarUrl) {
      // Upload to permanent storage if configured
      let avatarUrl = tempAvatarUrl;
      if (ENABLE_PERMANENT_STORAGE) {
        try {
          avatarUrl = await uploadImageFromUrl(tempAvatarUrl, 'avatars', `user-${userId}`);
          console.log(`[Profile] Avatar uploaded to permanent storage: ${avatarUrl}`);
        } catch (storageError) {
          console.error('[Profile] Failed to upload avatar to storage, using temp URL:', storageError);
          // Fall back to temp URL if storage upload fails
        }
      }

      // Update user's avatar URL
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });

      return res.json({
        success: true,
        avatarUrl,
        message: ENABLE_PERMANENT_STORAGE ? 'AI avatar generated and stored permanently' : 'AI avatar generated (temp URL)',
      });
    } else {
      // Fallback to DiceBear
      const seed = user.displayName || user.username || user.email || userId;
      const fallbackUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: fallbackUrl },
      });

      return res.json({
        success: true,
        avatarUrl: fallbackUrl,
        message: 'Generated DiceBear avatar (AI response invalid)',
      });
    }
  } catch (error: unknown) {
    console.error('Failed to generate avatar:', error);

    // Fallback to DiceBear on any error
    try {
      const userId = req.user?.id;
      if (userId) {
        const seed = userId;
        const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

        await prisma.user.update({
          where: { id: userId },
          data: { avatarUrl },
        });

        return res.json({
          success: true,
          avatarUrl,
          message: 'Generated DiceBear avatar (error occurred)',
        });
      }
    } catch {
      // Ignore fallback errors
    }

    return res.status(500).json({ success: false, error: 'Failed to generate avatar' });
  }
});

export default router;
