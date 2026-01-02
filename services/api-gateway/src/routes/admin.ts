// Admin Routes
// Handles administrative tasks like image migration, cleanup, etc.
// These routes require admin authentication

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth.js';
import { uploadImageFromUrl } from '../services/storageService.js';

const router: Router = Router();
const prisma = new PrismaClient();

// Check if storage is configured
const ENABLE_PERMANENT_STORAGE = !!process.env.S3_ACCESS_KEY;

// Patterns for identifying temporary URLs that need migration
const TEMP_URL_PATTERNS = [
  /nanobanana/i,           // NanoBanana API URLs
  /replicate\.delivery/i,  // Replicate URLs
  /oaidalleapiprodscus/i,  // OpenAI DALL-E URLs
  /blob\.core\.windows/i,  // Azure blob URLs (often temporary)
];

// Patterns for URLs that are already permanent or don't need migration
const PERMANENT_URL_PATTERNS = [
  /r2\.dev/i,              // Cloudflare R2 public URLs
  /r2\.cloudflarestorage/i, // R2 direct URLs
  /s3\./i,                 // S3 URLs
  /dicebear/i,             // DiceBear (generated on demand, stable)
  /cloudfront/i,           // CloudFront CDN
];

/**
 * Check if a URL is temporary and needs migration
 */
function isTemporaryUrl(url: string | null): boolean {
  if (!url) return false;

  // Check if it's already permanent
  for (const pattern of PERMANENT_URL_PATTERNS) {
    if (pattern.test(url)) return false;
  }

  // Check if it matches known temporary patterns
  for (const pattern of TEMP_URL_PATTERNS) {
    if (pattern.test(url)) return true;
  }

  return false;
}

interface MigrationDetail {
  type: string;
  id: string;
  name?: string;
  oldUrl: string;
  newUrl?: string;
  error?: string;
}

interface MigrationResults {
  migrated: number;
  failed: number;
  skipped: number;
  errors: string[];
  details: MigrationDetail[];
}

/**
 * Helper function to migrate a single URL to permanent storage
 */
async function migrateUrl(
  url: string,
  category: string,
  identifier: string,
  results: MigrationResults,
  dryRun: boolean
): Promise<string | null> {
  if (!isTemporaryUrl(url)) {
    results.skipped++;
    return null;
  }

  if (dryRun) {
    return `[DRY RUN] Would migrate to ${category}/${identifier}`;
  }

  try {
    const newUrl = await uploadImageFromUrl(url, category, identifier);
    results.migrated++;
    return newUrl;
  } catch (error) {
    results.failed++;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(`${category}/${identifier}: ${errorMsg}`);
    return null;
  }
}

/**
 * GET /admin/migration/status
 * Get status of images that need migration
 */
router.get('/migration/status', auth, async (req: Request, res: Response) => {
  try {
    // Get all users with avatars
    const users = await prisma.user.findMany({
      select: { id: true, avatarUrl: true, username: true },
    });

    // Get all characters with images
    const characters = await prisma.character.findMany({
      select: {
        id: true,
        name: true,
        portraitUrl: true,
        fullBodyUrls: true,
      },
    });

    // Get all NPCs with portraits
    const npcs = await prisma.nPC.findMany({
      select: { id: true, name: true, portraitUrl: true },
    });

    // Get all maps with background images
    const maps = await prisma.map.findMany({
      select: { id: true, name: true, backgroundUrl: true },
    });

    // Get campaigns with cover images
    const campaigns = await prisma.campaign.findMany({
      select: { id: true, name: true, coverImageUrl: true },
    });

    // Analyze what needs migration
    const userAvatarsToMigrate = users.filter(u => isTemporaryUrl(u.avatarUrl));
    const characterPortraitsToMigrate = characters.filter(c => isTemporaryUrl(c.portraitUrl));
    const characterFullBodyToMigrate = characters.filter(c =>
      c.fullBodyUrls.some(url => isTemporaryUrl(url))
    );
    const npcsToMigrate = npcs.filter(n => isTemporaryUrl(n.portraitUrl));
    const mapsToMigrate = maps.filter(m => isTemporaryUrl(m.backgroundUrl));
    const campaignsToMigrate = campaigns.filter(c => isTemporaryUrl(c.coverImageUrl));

    // Count total fullbody URLs that need migration
    let fullBodyUrlCount = 0;
    for (const char of characterFullBodyToMigrate) {
      fullBodyUrlCount += char.fullBodyUrls.filter(url => isTemporaryUrl(url)).length;
    }

    const totalToMigrate =
      userAvatarsToMigrate.length +
      characterPortraitsToMigrate.length +
      fullBodyUrlCount +
      npcsToMigrate.length +
      mapsToMigrate.length +
      campaignsToMigrate.length;

    return res.json({
      success: true,
      storageConfigured: ENABLE_PERMANENT_STORAGE,
      summary: {
        totalImages: totalToMigrate,
        userAvatars: userAvatarsToMigrate.length,
        characterPortraits: characterPortraitsToMigrate.length,
        characterFullBody: fullBodyUrlCount,
        npcs: npcsToMigrate.length,
        maps: mapsToMigrate.length,
        campaigns: campaignsToMigrate.length,
      },
      details: {
        userAvatars: userAvatarsToMigrate.map(u => ({ id: u.id, username: u.username, url: u.avatarUrl })),
        characters: characters
          .filter(c => isTemporaryUrl(c.portraitUrl) || c.fullBodyUrls.some(url => isTemporaryUrl(url)))
          .map(c => ({
            id: c.id,
            name: c.name,
            portrait: isTemporaryUrl(c.portraitUrl) ? c.portraitUrl : null,
            fullBodyUrls: c.fullBodyUrls.filter(url => isTemporaryUrl(url)),
          })),
        npcs: npcsToMigrate.map(n => ({ id: n.id, name: n.name, url: n.portraitUrl })),
        maps: mapsToMigrate.map(m => ({ id: m.id, name: m.name, url: m.backgroundUrl })),
        campaigns: campaignsToMigrate.map(c => ({ id: c.id, name: c.name, url: c.coverImageUrl })),
      },
    });
  } catch (error: unknown) {
    console.error('Failed to get migration status:', error);
    return res.status(500).json({ success: false, error: 'Failed to get migration status' });
  }
});

/**
 * POST /admin/migration/run
 * Run migration of temporary URLs to permanent storage
 * Body: { dryRun?: boolean, types?: string[] }
 */
router.post('/migration/run', auth, async (req: Request, res: Response) => {
  try {
    if (!ENABLE_PERMANENT_STORAGE) {
      return res.status(400).json({
        success: false,
        error: 'Storage not configured. Set S3_ACCESS_KEY and related environment variables.',
      });
    }

    const { dryRun = false, types = ['all'] } = req.body;
    const migrateAll = types.includes('all');

    const results: MigrationResults = {
      migrated: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      details: [],
    };

    // Migrate user avatars
    if (migrateAll || types.includes('avatars')) {
      const users = await prisma.user.findMany({
        where: { avatarUrl: { not: null } },
        select: { id: true, username: true, avatarUrl: true },
      });

      for (const user of users) {
        if (!user.avatarUrl || !isTemporaryUrl(user.avatarUrl)) {
          continue;
        }

        const newUrl = await migrateUrl(user.avatarUrl, 'avatars', `user-${user.id}`, results, dryRun);

        results.details.push({
          type: 'avatar',
          id: user.id,
          name: user.username,
          oldUrl: user.avatarUrl,
          newUrl: newUrl || undefined,
          error: newUrl ? undefined : 'Migration failed',
        });

        if (newUrl && !dryRun) {
          await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: newUrl },
          });
        }
      }
    }

    // Migrate character images
    if (migrateAll || types.includes('characters')) {
      const characters = await prisma.character.findMany({
        select: {
          id: true,
          name: true,
          portraitUrl: true,
          fullBodyUrls: true,
        },
      });

      for (const char of characters) {
        // Migrate portrait
        if (char.portraitUrl && isTemporaryUrl(char.portraitUrl)) {
          const newUrl = await migrateUrl(char.portraitUrl, 'characters', `${char.id}-portrait`, results, dryRun);
          results.details.push({
            type: 'character-portrait',
            id: char.id,
            name: char.name,
            oldUrl: char.portraitUrl,
            newUrl: newUrl || undefined,
          });

          if (newUrl && !dryRun) {
            await prisma.character.update({
              where: { id: char.id },
              data: { portraitUrl: newUrl },
            });
          }
        }

        // Migrate full body URLs (array)
        const tempFullBodyUrls = char.fullBodyUrls.filter((url): url is string => isTemporaryUrl(url));
        if (tempFullBodyUrls.length > 0) {
          const newFullBodyUrls = [...char.fullBodyUrls];
          let hasUpdates = false;

          for (let i = 0; i < char.fullBodyUrls.length; i++) {
            const url = char.fullBodyUrls[i];
            if (url && isTemporaryUrl(url)) {
              const newUrl = await migrateUrl(url, 'characters', `${char.id}-fullbody-${i}`, results, dryRun);
              results.details.push({
                type: 'character-fullbody',
                id: char.id,
                name: char.name,
                oldUrl: url,
                newUrl: newUrl || undefined,
              });

              if (newUrl && !dryRun) {
                newFullBodyUrls[i] = newUrl;
                hasUpdates = true;
              }
            }
          }

          if (hasUpdates && !dryRun) {
            await prisma.character.update({
              where: { id: char.id },
              data: { fullBodyUrls: newFullBodyUrls },
            });
          }
        }
      }
    }

    // Migrate NPC portraits
    if (migrateAll || types.includes('npcs')) {
      const npcs = await prisma.nPC.findMany({
        where: { portraitUrl: { not: null } },
        select: { id: true, name: true, portraitUrl: true },
      });

      for (const npc of npcs) {
        if (!npc.portraitUrl || !isTemporaryUrl(npc.portraitUrl)) {
          continue;
        }

        const newUrl = await migrateUrl(npc.portraitUrl, 'npcs', npc.id, results, dryRun);

        results.details.push({
          type: 'npc',
          id: npc.id,
          name: npc.name,
          oldUrl: npc.portraitUrl,
          newUrl: newUrl || undefined,
        });

        if (newUrl && !dryRun) {
          await prisma.nPC.update({
            where: { id: npc.id },
            data: { portraitUrl: newUrl },
          });
        }
      }
    }

    // Migrate map backgrounds
    if (migrateAll || types.includes('maps')) {
      const maps = await prisma.map.findMany({
        where: { backgroundUrl: { not: null } },
        select: { id: true, name: true, backgroundUrl: true },
      });

      for (const map of maps) {
        if (!map.backgroundUrl || !isTemporaryUrl(map.backgroundUrl)) {
          continue;
        }

        const newUrl = await migrateUrl(map.backgroundUrl, 'maps', map.id, results, dryRun);

        results.details.push({
          type: 'map',
          id: map.id,
          name: map.name,
          oldUrl: map.backgroundUrl,
          newUrl: newUrl || undefined,
        });

        if (newUrl && !dryRun) {
          await prisma.map.update({
            where: { id: map.id },
            data: { backgroundUrl: newUrl },
          });
        }
      }
    }

    // Migrate campaign covers
    if (migrateAll || types.includes('campaigns')) {
      const campaigns = await prisma.campaign.findMany({
        where: { coverImageUrl: { not: null } },
        select: { id: true, name: true, coverImageUrl: true },
      });

      for (const campaign of campaigns) {
        if (!campaign.coverImageUrl || !isTemporaryUrl(campaign.coverImageUrl)) {
          continue;
        }

        const newUrl = await migrateUrl(campaign.coverImageUrl, 'campaigns', campaign.id, results, dryRun);

        results.details.push({
          type: 'campaign',
          id: campaign.id,
          name: campaign.name,
          oldUrl: campaign.coverImageUrl,
          newUrl: newUrl || undefined,
        });

        if (newUrl && !dryRun) {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: { coverImageUrl: newUrl },
          });
        }
      }
    }

    return res.json({
      success: true,
      dryRun,
      results: {
        migrated: results.migrated,
        failed: results.failed,
        skipped: results.skipped,
        totalProcessed: results.migrated + results.failed + results.skipped,
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
      details: results.details,
    });
  } catch (error: unknown) {
    console.error('Migration failed:', error);
    return res.status(500).json({ success: false, error: 'Migration failed' });
  }
});

export default router;
