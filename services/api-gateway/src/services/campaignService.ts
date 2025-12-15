import { prisma } from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';

export interface CreateCampaignInput {
  name: string;
  description?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
  recommendedLevel?: { min: number; max: number };
  settings?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
  status?: 'draft' | 'active' | 'completed' | 'archived';
  recommendedLevel?: { min: number; max: number };
  settings?: Record<string, unknown>;
  tags?: string[];
}

export interface CreateMapInput {
  name: string;
  description?: string;
  width: number;
  height: number;
  gridSize?: number;
  tileSize?: number;
  layers?: unknown[];
  backgroundUrl?: string;
  lighting?: Record<string, unknown>;
  ambience?: Record<string, unknown>;
  tags?: string[];
}

export interface CreateEncounterInput {
  name: string;
  description?: string;
  mapId?: string;
  difficulty?: 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';
  recommendedLevel?: { min: number; max: number };
  monsters?: unknown[];
  objectives?: unknown[];
  rewards?: unknown[];
  triggers?: unknown[];
  environment?: Record<string, unknown>;
  audio?: Record<string, unknown>;
  tags?: string[];
}

export interface CreateNPCInput {
  name: string;
  title?: string;
  monsterId?: string;
  stats?: Record<string, unknown>;
  portraitUrl?: string;
  description?: string;
  personality?: string;
  motivation?: string;
  secrets?: string;
  defaultLocation?: string;
  defaultDialogueId?: string;
  tags?: string[];
  isHostile?: boolean;
  faction?: string;
}

export interface CreateDialogueInput {
  name: string;
  description?: string;
  npcId?: string;
  startNodeId: string;
  nodes: unknown[];
  variables?: unknown[];
  tags?: string[];
}

export interface CreateQuestInput {
  name: string;
  description?: string;
  type?: 'main' | 'side' | 'personal';
  objectives?: unknown[];
  rewards?: unknown[];
  prerequisites?: unknown[];
  questGiverId?: string;
  recommendedLevel?: number;
  tags?: string[];
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  category: string;
  message: string;
  location?: string;
}

export class CampaignService {
  // ========================
  // Campaign CRUD
  // ========================

  async findByUser(userId: string) {
    // Use explicit select to avoid new columns that may not exist yet (gameState, lastSavedAt)
    return prisma.campaign.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        coverImageUrl: true,
        status: true,
        isPublic: true,
        recommendedLevel: true,
        settings: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        _count: {
          select: {
            maps: true,
            encounters: true,
            npcs: true,
            quests: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    // Use explicit select to avoid new columns that may not exist yet (gameState, lastSavedAt)
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { isPublic: true },
          { players: { some: { userId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        coverImageUrl: true,
        status: true,
        isPublic: true,
        recommendedLevel: true,
        settings: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        maps: true,
        encounters: true,
        npcs: true,
        dialogues: true,
        quests: true,
        players: {
          include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
        _count: {
          select: {
            maps: true,
            encounters: true,
            npcs: true,
            quests: true,
          },
        },
      },
    });

    return campaign;
  }

  async create(userId: string, data: CreateCampaignInput) {
    // Use explicit select to avoid new columns that may not exist yet (gameState, lastSavedAt)
    return prisma.campaign.create({
      data: {
        ownerId: userId,
        name: data.name,
        description: data.description,
        coverImageUrl: data.coverImageUrl,
        isPublic: data.isPublic ?? false,
        recommendedLevel: (data.recommendedLevel ?? { min: 1, max: 5 }) as Prisma.InputJsonValue,
        settings: (data.settings ?? {}) as Prisma.InputJsonValue,
        tags: data.tags ?? [],
      },
      select: {
        id: true,
        name: true,
        description: true,
        coverImageUrl: true,
        status: true,
        isPublic: true,
        recommendedLevel: true,
        settings: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        _count: {
          select: { maps: true, encounters: true, npcs: true, quests: true },
        },
      },
    });
  }

  async update(id: string, userId: string, data: UpdateCampaignInput) {
    // Verify ownership - use select to avoid new columns
    const existing = await prisma.campaign.findFirst({
      where: { id, ownerId: userId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Campaign not found or you do not have permission');
    }

    // Use explicit select to avoid new columns that may not exist yet (gameState, lastSavedAt)
    return prisma.campaign.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        coverImageUrl: data.coverImageUrl,
        isPublic: data.isPublic,
        status: data.status,
        recommendedLevel: data.recommendedLevel as Prisma.InputJsonValue,
        settings: data.settings as Prisma.InputJsonValue,
        tags: data.tags,
      },
      select: {
        id: true,
        name: true,
        description: true,
        coverImageUrl: true,
        status: true,
        isPublic: true,
        recommendedLevel: true,
        settings: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        _count: {
          select: { maps: true, encounters: true, npcs: true, quests: true },
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    // Use select to avoid new columns
    const existing = await prisma.campaign.findFirst({
      where: { id, ownerId: userId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Campaign not found or you do not have permission');
    }

    await prisma.campaign.delete({ where: { id } });
    return { success: true };
  }

  // ========================
  // Map CRUD
  // ========================

  async createMap(campaignId: string, userId: string, data: CreateMapInput) {
    // Verify campaign ownership - use select to avoid new columns
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, ownerId: userId },
      select: { id: true },
    });

    if (!campaign) {
      throw new Error('Campaign not found or you do not have permission');
    }

    return prisma.map.create({
      data: {
        campaignId,
        name: data.name,
        description: data.description,
        width: data.width,
        height: data.height,
        gridSize: data.gridSize ?? 5,
        tileSize: data.tileSize ?? 64,
        layers: (data.layers ?? []) as Prisma.InputJsonValue,
        backgroundUrl: data.backgroundUrl,
        lighting: (data.lighting ?? {}) as Prisma.InputJsonValue,
        ambience: (data.ambience ?? {}) as Prisma.InputJsonValue,
        tags: data.tags ?? [],
      },
    });
  }

  async updateMap(mapId: string, userId: string, data: Partial<CreateMapInput>) {
    // Verify ownership through campaign
    const map = await prisma.map.findFirst({
      where: { id: mapId },
      include: { campaign: true },
    });

    if (!map || map.campaign.ownerId !== userId) {
      throw new Error('Map not found or you do not have permission');
    }

    return prisma.map.update({
      where: { id: mapId },
      data: {
        name: data.name,
        description: data.description,
        width: data.width,
        height: data.height,
        gridSize: data.gridSize,
        tileSize: data.tileSize,
        layers: data.layers as Prisma.InputJsonValue,
        backgroundUrl: data.backgroundUrl,
        lighting: data.lighting as Prisma.InputJsonValue,
        ambience: data.ambience as Prisma.InputJsonValue,
        tags: data.tags,
      },
    });
  }

  async deleteMap(mapId: string, userId: string) {
    const map = await prisma.map.findFirst({
      where: { id: mapId },
      include: { campaign: true },
    });

    if (!map || map.campaign.ownerId !== userId) {
      throw new Error('Map not found or you do not have permission');
    }

    await prisma.map.delete({ where: { id: mapId } });
    return { success: true };
  }

  // ========================
  // Encounter CRUD
  // ========================

  async createEncounter(campaignId: string, userId: string, data: CreateEncounterInput) {
    // Use select to avoid new columns
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, ownerId: userId },
      select: { id: true },
    });

    if (!campaign) {
      throw new Error('Campaign not found or you do not have permission');
    }

    return prisma.encounter.create({
      data: {
        campaignId,
        mapId: data.mapId,
        name: data.name,
        description: data.description,
        difficulty: data.difficulty ?? 'medium',
        recommendedLevel: (data.recommendedLevel ?? { min: 1, max: 5 }) as Prisma.InputJsonValue,
        monsters: (data.monsters ?? []) as Prisma.InputJsonValue,
        objectives: (data.objectives ?? []) as Prisma.InputJsonValue,
        rewards: (data.rewards ?? []) as Prisma.InputJsonValue,
        triggers: (data.triggers ?? []) as Prisma.InputJsonValue,
        environment: (data.environment ?? {}) as Prisma.InputJsonValue,
        audio: (data.audio ?? {}) as Prisma.InputJsonValue,
        tags: data.tags ?? [],
      },
    });
  }

  async updateEncounter(encounterId: string, userId: string, data: Partial<CreateEncounterInput>) {
    const encounter = await prisma.encounter.findFirst({
      where: { id: encounterId },
      include: { campaign: true },
    });

    if (!encounter || encounter.campaign.ownerId !== userId) {
      throw new Error('Encounter not found or you do not have permission');
    }

    return prisma.encounter.update({
      where: { id: encounterId },
      data: {
        mapId: data.mapId,
        name: data.name,
        description: data.description,
        difficulty: data.difficulty,
        recommendedLevel: data.recommendedLevel as Prisma.InputJsonValue,
        monsters: data.monsters as Prisma.InputJsonValue,
        objectives: data.objectives as Prisma.InputJsonValue,
        rewards: data.rewards as Prisma.InputJsonValue,
        triggers: data.triggers as Prisma.InputJsonValue,
        environment: data.environment as Prisma.InputJsonValue,
        audio: data.audio as Prisma.InputJsonValue,
        tags: data.tags,
      },
    });
  }

  async deleteEncounter(encounterId: string, userId: string) {
    const encounter = await prisma.encounter.findFirst({
      where: { id: encounterId },
      include: { campaign: true },
    });

    if (!encounter || encounter.campaign.ownerId !== userId) {
      throw new Error('Encounter not found or you do not have permission');
    }

    await prisma.encounter.delete({ where: { id: encounterId } });
    return { success: true };
  }

  // ========================
  // NPC CRUD
  // ========================

  async createNPC(campaignId: string, userId: string, data: CreateNPCInput) {
    // Use select to avoid new columns
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, ownerId: userId },
      select: { id: true },
    });

    if (!campaign) {
      throw new Error('Campaign not found or you do not have permission');
    }

    return prisma.nPC.create({
      data: {
        campaignId,
        name: data.name,
        title: data.title,
        monsterId: data.monsterId,
        stats: data.stats as Prisma.InputJsonValue,
        portraitUrl: data.portraitUrl,
        description: data.description,
        personality: data.personality,
        motivation: data.motivation,
        secrets: data.secrets,
        defaultLocation: data.defaultLocation,
        defaultDialogueId: data.defaultDialogueId,
        tags: data.tags ?? [],
        isHostile: data.isHostile ?? false,
        faction: data.faction,
      },
    });
  }

  async updateNPC(npcId: string, userId: string, data: Partial<CreateNPCInput>) {
    const npc = await prisma.nPC.findFirst({
      where: { id: npcId },
      include: { campaign: true },
    });

    if (!npc || npc.campaign.ownerId !== userId) {
      throw new Error('NPC not found or you do not have permission');
    }

    return prisma.nPC.update({
      where: { id: npcId },
      data: {
        name: data.name,
        title: data.title,
        monsterId: data.monsterId,
        stats: data.stats as Prisma.InputJsonValue,
        portraitUrl: data.portraitUrl,
        description: data.description,
        personality: data.personality,
        motivation: data.motivation,
        secrets: data.secrets,
        defaultLocation: data.defaultLocation,
        defaultDialogueId: data.defaultDialogueId,
        tags: data.tags,
        isHostile: data.isHostile,
        faction: data.faction,
      },
    });
  }

  async deleteNPC(npcId: string, userId: string) {
    const npc = await prisma.nPC.findFirst({
      where: { id: npcId },
      include: { campaign: true },
    });

    if (!npc || npc.campaign.ownerId !== userId) {
      throw new Error('NPC not found or you do not have permission');
    }

    await prisma.nPC.delete({ where: { id: npcId } });
    return { success: true };
  }

  // ========================
  // Quest CRUD
  // ========================

  async createQuest(campaignId: string, userId: string, data: CreateQuestInput) {
    // Use select to avoid new columns
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, ownerId: userId },
      select: { id: true },
    });

    if (!campaign) {
      throw new Error('Campaign not found or you do not have permission');
    }

    return prisma.quest.create({
      data: {
        campaignId,
        name: data.name,
        description: data.description,
        type: data.type ?? 'main',
        objectives: (data.objectives ?? []) as Prisma.InputJsonValue,
        rewards: (data.rewards ?? []) as Prisma.InputJsonValue,
        prerequisites: (data.prerequisites ?? []) as Prisma.InputJsonValue,
        questGiverId: data.questGiverId,
        recommendedLevel: data.recommendedLevel,
        tags: data.tags ?? [],
      },
    });
  }

  async updateQuest(questId: string, userId: string, data: Partial<CreateQuestInput>) {
    const quest = await prisma.quest.findFirst({
      where: { id: questId },
      include: { campaign: true },
    });

    if (!quest || quest.campaign.ownerId !== userId) {
      throw new Error('Quest not found or you do not have permission');
    }

    return prisma.quest.update({
      where: { id: questId },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        objectives: data.objectives as Prisma.InputJsonValue,
        rewards: data.rewards as Prisma.InputJsonValue,
        prerequisites: data.prerequisites as Prisma.InputJsonValue,
        questGiverId: data.questGiverId,
        recommendedLevel: data.recommendedLevel,
        tags: data.tags,
      },
    });
  }

  async deleteQuest(questId: string, userId: string) {
    const quest = await prisma.quest.findFirst({
      where: { id: questId },
      include: { campaign: true },
    });

    if (!quest || quest.campaign.ownerId !== userId) {
      throw new Error('Quest not found or you do not have permission');
    }

    await prisma.quest.delete({ where: { id: questId } });
    return { success: true };
  }

  // ========================
  // Validation & Publishing
  // ========================

  async validateCampaign(campaignId: string): Promise<ValidationResult> {
    // Use explicit select to avoid new columns
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        description: true,
        coverImageUrl: true,
        status: true,
        tags: true,
        maps: true,
        encounters: true,
        npcs: true,
        dialogues: true,
        quests: true,
      },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const issues: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    // Required fields
    if (!campaign.name || campaign.name.length < 3) {
      issues.push({
        type: 'error',
        category: 'metadata',
        message: 'Campaign must have a name (at least 3 characters)',
      });
    }

    if (!campaign.description || campaign.description.length < 50) {
      warnings.push({
        type: 'warning',
        category: 'metadata',
        message: 'Campaign description is short. Consider adding more detail.',
      });
    }

    // Must have at least one map
    if (campaign.maps.length === 0) {
      issues.push({
        type: 'error',
        category: 'content',
        message: 'Campaign must have at least one map',
      });
    }

    // Must have at least one encounter
    if (campaign.encounters.length === 0) {
      warnings.push({
        type: 'warning',
        category: 'content',
        message: 'Campaign has no encounters. Consider adding combat.',
      });
    }

    // Validate each map
    for (const map of campaign.maps) {
      if (map.width < 10 || map.height < 10) {
        warnings.push({
          type: 'warning',
          category: 'maps',
          message: `Map "${map.name}" is very small (${map.width}x${map.height})`,
          location: map.id,
        });
      }
    }

    // Validate encounters
    for (const encounter of campaign.encounters) {
      const monsters = encounter.monsters as unknown[];
      if (!monsters || monsters.length === 0) {
        warnings.push({
          type: 'warning',
          category: 'encounters',
          message: `Encounter "${encounter.name}" has no monsters`,
          location: encounter.id,
        });
      }
    }

    // Calculate score
    const errorCount = issues.filter((i) => i.type === 'error').length;
    const warningCount = warnings.length;
    const score = Math.max(0, 100 - errorCount * 20 - warningCount * 5);

    return {
      valid: errorCount === 0,
      score,
      issues,
      warnings,
    };
  }

  async publishCampaign(
    campaignId: string,
    userId: string,
    options: {
      visibility: 'public' | 'private' | 'unlisted';
      price?: number;
      description?: string;
      tags?: string[];
    }
  ) {
    // Verify ownership - use explicit select to avoid new columns
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, ownerId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        coverImageUrl: true,
        status: true,
        tags: true,
        ownerId: true,
        maps: true,
        encounters: true,
        npcs: true,
        dialogues: true,
        quests: true,
      },
    });

    if (!campaign) {
      throw new Error('Campaign not found or you do not have permission');
    }

    // Validate before publishing
    const validation = await this.validateCampaign(campaignId);
    if (!validation.valid) {
      throw new Error('Campaign validation failed. Please fix all errors before publishing.');
    }

    // Get next version
    const latest = await prisma.publishedCampaign.findFirst({
      where: { campaignId },
      orderBy: { publishedAt: 'desc' },
    });

    let version = '1.0.0';
    if (latest) {
      const parts = latest.version.split('.').map(Number);
      const patch = (parts[2] ?? 0) + 1;
      version = `${parts[0] ?? 1}.${parts[1] ?? 0}.${patch}`;
    }

    // Create published version
    const published = await prisma.publishedCampaign.create({
      data: {
        campaignId,
        version,
        name: campaign.name,
        description: options.description ?? campaign.description ?? '',
        visibility: options.visibility,
        price: options.price ?? 0,
        tags: options.tags ?? campaign.tags,
        content: JSON.parse(JSON.stringify(campaign)) as Prisma.InputJsonValue,
        thumbnailUrl: campaign.coverImageUrl,
      },
    });

    return published;
  }
}
