import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth } from '../middleware/auth.js';

const router: Router = Router();

// All routes require authentication
router.use(auth);

/**
 * GET /dm/dashboard
 * Get DM dashboard overview with campaigns, sessions, and stats
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all campaigns owned by the user with counts
    const campaigns = await prisma.campaign.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: {
            maps: true,
            encounters: true,
            npcs: true,
            quests: true,
            players: true,
            gameSessions: true,
          },
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get active game sessions where user is DM
    const activeSessions = await prisma.gameSession.findMany({
      where: {
        campaign: { ownerId: userId },
        status: { in: ['lobby', 'active', 'paused'] },
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        participants: {
          select: {
            userId: true,
            role: true,
            isConnected: true,
            lastSeenAt: true,
          },
        },
      },
      orderBy: { lastActivityAt: 'desc' },
    });

    // Get user limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        maxActiveSessions: true,
        aiCharactersGenerated: true,
      },
    });

    // Calculate stats
    const totalPlayers = new Set(
      campaigns.flatMap(c => c.players.map(p => p.userId))
    ).size;

    const stats = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      draftCampaigns: campaigns.filter(c => c.status === 'draft').length,
      completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
      totalPlayers,
      activeSessions: activeSessions.length,
      maxSessions: user?.maxActiveSessions || 3,
      totalMaps: campaigns.reduce((sum, c) => sum + c._count.maps, 0),
      totalEncounters: campaigns.reduce((sum, c) => sum + c._count.encounters, 0),
      totalNpcs: campaigns.reduce((sum, c) => sum + c._count.npcs, 0),
      totalQuests: campaigns.reduce((sum, c) => sum + c._count.quests, 0),
    };

    // Format campaigns for response
    const formattedCampaigns = campaigns.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      status: c.status,
      coverImageUrl: c.coverImageUrl,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      counts: c._count,
      players: c.players.map(p => ({
        userId: p.userId,
        role: p.role,
        displayName: p.user.displayName,
        avatarUrl: p.user.avatarUrl,
      })),
      // Calculate progress based on content
      progress: calculateCampaignProgress(c._count),
    }));

    // Format sessions for response
    const formattedSessions = activeSessions.map(s => ({
      id: s.id,
      name: s.name,
      status: s.status,
      inviteCode: s.inviteCode,
      campaignId: s.campaignId,
      campaignName: s.campaign.name,
      inCombat: s.inCombat,
      round: s.round,
      lastActivityAt: s.lastActivityAt,
      createdAt: s.createdAt,
      playerCount: s.participants.filter(p => p.role === 'player').length,
      connectedCount: s.participants.filter(p => p.isConnected).length,
      participants: s.participants,
    }));

    return res.json({
      stats,
      campaigns: formattedCampaigns,
      activeSessions: formattedSessions,
    });
  } catch (error) {
    console.error('Error fetching DM dashboard:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

/**
 * GET /dm/sessions
 * Get all game sessions for the DM
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = {
      campaign: { ownerId: userId },
    };

    if (status) {
      where.status = status;
    }

    const sessions = await prisma.gameSession.findMany({
      where,
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            coverImageUrl: true,
          },
        },
        participants: {
          include: {
            // Note: Can't include user directly - would need separate query
          },
        },
      },
      orderBy: { lastActivityAt: 'desc' },
    });

    return res.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * POST /dm/sessions
 * Create a new game session for a campaign
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { campaignId, name } = req.body;

    // Verify user owns the campaign
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, ownerId: userId },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Check session limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { maxActiveSessions: true },
    });

    const activeCount = await prisma.gameSession.count({
      where: {
        campaign: { ownerId: userId },
        status: { in: ['lobby', 'active', 'paused'] },
      },
    });

    const maxSessions = user?.maxActiveSessions || 3;
    if (activeCount >= maxSessions) {
      return res.status(400).json({
        error: `Maximum ${maxSessions} active sessions allowed. Complete or archive existing sessions.`,
      });
    }

    // Generate a 6-character invite code
    const inviteCode = generateInviteCode();

    // Create session
    const session = await prisma.gameSession.create({
      data: {
        campaignId,
        name: name || `${campaign.name} - Session ${activeCount + 1}`,
        inviteCode,
        status: 'lobby',
      },
      include: {
        campaign: {
          select: { name: true },
        },
      },
    });

    // Add DM as participant
    await prisma.gameSessionParticipant.create({
      data: {
        sessionId: session.id,
        userId,
        role: 'dm',
        isConnected: false,
      },
    });

    return res.status(201).json({ session });
  } catch (error) {
    console.error('Error creating session:', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * PATCH /dm/sessions/:id
 * Update session status (pause, resume, complete)
 */
router.patch('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { status } = req.body;

    // Verify user owns the campaign this session belongs to
    const session = await prisma.gameSession.findFirst({
      where: {
        id,
        campaign: { ownerId: userId },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const updated = await prisma.gameSession.update({
      where: { id },
      data: {
        status,
        ...(status === 'completed' ? { endedAt: new Date() } : {}),
      },
    });

    return res.json({ session: updated });
  } catch (error) {
    console.error('Error updating session:', error);
    return res.status(500).json({ error: 'Failed to update session' });
  }
});

/**
 * DELETE /dm/sessions/:id
 * Delete a session (archive)
 */
router.delete('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify user owns the campaign this session belongs to
    const session = await prisma.gameSession.findFirst({
      where: {
        id,
        campaign: { ownerId: userId },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await prisma.gameSession.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Helper functions

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar-looking chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function calculateCampaignProgress(counts: {
  maps: number;
  encounters: number;
  npcs: number;
  quests: number;
}): number {
  // Simple progress calculation based on content
  const weights = {
    maps: 25,
    encounters: 30,
    npcs: 25,
    quests: 20,
  };

  let progress = 0;
  if (counts.maps >= 1) progress += weights.maps;
  if (counts.encounters >= 1) progress += weights.encounters;
  if (counts.npcs >= 1) progress += weights.npcs;
  if (counts.quests >= 1) progress += weights.quests;

  return progress;
}

export default router;
