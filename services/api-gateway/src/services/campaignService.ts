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
}
