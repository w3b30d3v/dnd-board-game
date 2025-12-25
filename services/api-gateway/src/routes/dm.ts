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
    console.log('Fetching DM dashboard for user:', userId);

    // Get all campaigns owned by the user with counts
    // Use explicit select to avoid new columns that may not exist (gameState, lastSavedAt)
    const campaigns = await prisma.campaign.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        coverImageUrl: true,
        status: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
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
    // Note: participants table may not exist if migration hasn't run
    let activeSessions: Array<{
      id: string;
      name: string;
      status: string;
      inviteCode: string;
      campaignId: string;
      inCombat: boolean;
      round: number;
      lastActivityAt: Date;
      createdAt: Date;
      campaign: { id: string; name: string };
      participants: Array<{ userId: string; role: string; isConnected: boolean; lastSeenAt: Date }>;
    }> = [];

    try {
      // Use explicit select to avoid new columns (isLocked, allowedUsers)
      activeSessions = await prisma.gameSession.findMany({
        where: {
          campaign: { ownerId: userId },
          status: { in: ['lobby', 'active', 'paused'] },
        },
        select: {
          id: true,
          name: true,
          status: true,
          inviteCode: true,
          campaignId: true,
          inCombat: true,
          round: true,
          lastActivityAt: true,
          createdAt: true,
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
    } catch (e) {
      // If participants table doesn't exist, try without it
      console.error('Error fetching sessions with participants, trying without:', e);
      const sessionsWithoutParticipants = await prisma.gameSession.findMany({
        where: {
          campaign: { ownerId: userId },
          status: { in: ['lobby', 'active', 'paused'] },
        },
        select: {
          id: true,
          name: true,
          status: true,
          inviteCode: true,
          campaignId: true,
          inCombat: true,
          round: true,
          lastActivityAt: true,
          createdAt: true,
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { lastActivityAt: 'desc' },
      });
      activeSessions = sessionsWithoutParticipants.map(s => ({ ...s, participants: [] }));
    }

    // Get user limits - use aiCharactersGenerated which definitely exists
    // maxActiveSessions defaults to 3 if migration hasn't run
    const maxSessions = 3;
    // Note: maxActiveSessions will be added after migration runs
    // For now, default to 3

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
      maxSessions: maxSessions,
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Check for database errors
    if (message.includes('connect') || message.includes('ECONNREFUSED') ||
        message.includes('database') || message.includes('P2022') ||
        message.includes('column') || message.includes('does not exist')) {
      return res.status(503).json({ error: 'Database error', details: message });
    }
    return res.status(500).json({ error: 'Failed to fetch dashboard', details: message });
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

    // Use explicit select to avoid new columns (isLocked, allowedUsers)
    let sessions;
    try {
      sessions = await prisma.gameSession.findMany({
        where,
        select: {
          id: true,
          name: true,
          status: true,
          inviteCode: true,
          campaignId: true,
          inCombat: true,
          round: true,
          currentMapId: true,
          lastActivityAt: true,
          createdAt: true,
          endedAt: true,
          campaign: {
            select: {
              id: true,
              name: true,
              coverImageUrl: true,
            },
          },
          participants: {
            select: {
              userId: true,
              role: true,
              isConnected: true,
              characterId: true,
            },
          },
        },
        orderBy: { lastActivityAt: 'desc' },
      });
    } catch {
      // If participants table doesn't exist, fetch without it
      const sessionsWithoutParticipants = await prisma.gameSession.findMany({
        where,
        select: {
          id: true,
          name: true,
          status: true,
          inviteCode: true,
          campaignId: true,
          inCombat: true,
          round: true,
          currentMapId: true,
          lastActivityAt: true,
          createdAt: true,
          endedAt: true,
          campaign: {
            select: {
              id: true,
              name: true,
              coverImageUrl: true,
            },
          },
        },
        orderBy: { lastActivityAt: 'desc' },
      });
      sessions = sessionsWithoutParticipants.map(s => ({ ...s, participants: [] }));
    }

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

    // Verify user owns the campaign - use select to avoid new columns
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, ownerId: userId },
      select: { id: true, name: true },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Check session limit - default to 3 until migration runs
    const maxSessions = 3;
    const activeCount = await prisma.gameSession.count({
      where: {
        campaign: { ownerId: userId },
        status: { in: ['lobby', 'active', 'paused'] },
      },
    });
    if (activeCount >= maxSessions) {
      return res.status(400).json({
        error: `Maximum ${maxSessions} active sessions allowed. Complete or archive existing sessions.`,
      });
    }

    // Generate a 6-character invite code
    const inviteCode = generateInviteCode();

    // Create session - use explicit select to avoid new columns
    const session = await prisma.gameSession.create({
      data: {
        campaignId,
        name: name || `${campaign.name} - Session ${activeCount + 1}`,
        inviteCode,
        status: 'lobby',
      },
      select: {
        id: true,
        name: true,
        status: true,
        inviteCode: true,
        campaignId: true,
        inCombat: true,
        round: true,
        createdAt: true,
        campaign: {
          select: { name: true },
        },
      },
    });

    // Add DM as participant (if migration has run)
    try {
      await prisma.gameSessionParticipant.create({
        data: {
          sessionId: session.id,
          userId,
          role: 'dm',
          isConnected: false,
        },
      });
    } catch {
      // Participants table may not exist yet - session still works
      console.log('Could not create participant record - table may not exist');
    }

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

    // Verify user owns the campaign this session belongs to - use select to avoid new columns
    const session = await prisma.gameSession.findFirst({
      where: {
        id,
        campaign: { ownerId: userId },
      },
      select: { id: true },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Use explicit select to avoid new columns (isLocked, allowedUsers)
    const updated = await prisma.gameSession.update({
      where: { id },
      data: {
        status,
        ...(status === 'completed' ? { endedAt: new Date() } : {}),
      },
      select: {
        id: true,
        name: true,
        status: true,
        inviteCode: true,
        campaignId: true,
        inCombat: true,
        round: true,
        endedAt: true,
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

    // Verify user owns the campaign this session belongs to - use select to avoid new columns
    const session = await prisma.gameSession.findFirst({
      where: {
        id,
        campaign: { ownerId: userId },
      },
      select: { id: true },
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

/**
 * POST /dm/sessions/:id/lock
 * Lock or unlock a session (DM only)
 */
router.post('/sessions/:id/lock', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { locked, allowedUsers } = req.body;

    // Verify user owns the campaign this session belongs to - use select to avoid fetching all columns
    const session = await prisma.gameSession.findFirst({
      where: {
        id,
        campaign: { ownerId: userId },
      },
      select: { id: true },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const updateData: { isLocked?: boolean; allowedUsers?: string[] } = {};
    if (typeof locked === 'boolean') {
      updateData.isLocked = locked;
    }
    if (Array.isArray(allowedUsers)) {
      updateData.allowedUsers = allowedUsers;
    }

    // Note: This endpoint intentionally uses isLocked/allowedUsers columns
    // If migration hasn't run, it will fail and the error handler below returns 503
    const updated = await prisma.gameSession.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        isLocked: true,
        allowedUsers: true,
      },
    });

    return res.json({
      session: {
        id: updated.id,
        isLocked: updated.isLocked,
        allowedUsers: updated.allowedUsers,
      },
    });
  } catch (error) {
    console.error('Error locking session:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Check if it's a schema error (column doesn't exist)
    if (message.includes('column') || message.includes('does not exist') || message.includes('Unknown arg')) {
      return res.status(503).json({
        error: 'Session lock feature not available',
        details: 'Database schema needs migration. Please contact administrator.',
      });
    }
    return res.status(500).json({ error: 'Failed to lock session' });
  }
});

/**
 * POST /dm/sessions/:id/save
 * Save current session state to campaign for long-term persistence
 */
router.post('/sessions/:id/save', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Get session with all state data - use explicit select to avoid isLocked/allowedUsers
    const session = await prisma.gameSession.findFirst({
      where: {
        id,
        campaign: { ownerId: userId },
      },
      select: {
        id: true,
        name: true,
        status: true,
        campaignId: true,
        currentMapId: true,
        inCombat: true,
        currentTurn: true,
        round: true,
        initiativeOrder: true,
        tokenStates: true,
        revealedCells: true,
        journal: true,
        participants: {
          select: {
            userId: true,
            characterId: true,
            role: true,
            currentHp: true,
            tempHp: true,
            conditions: true,
            inspiration: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Create a comprehensive game state snapshot
    const gameState = {
      sessionId: session.id,
      sessionName: session.name,
      status: session.status,
      currentMapId: session.currentMapId,
      inCombat: session.inCombat,
      currentTurn: session.currentTurn,
      round: session.round,
      initiativeOrder: session.initiativeOrder,
      tokenStates: session.tokenStates,
      revealedCells: session.revealedCells,
      journal: session.journal,
      participants: session.participants.map((p) => ({
        odlUserId: p.userId,
        characterId: p.characterId,
        role: p.role,
        currentHp: p.currentHp,
        tempHp: p.tempHp,
        conditions: p.conditions,
        inspiration: p.inspiration,
      })),
      savedAt: new Date().toISOString(),
    };

    // Save to campaign - intentionally uses gameState/lastSavedAt columns
    // Will fail with 503 if migration hasn't run (handled below)
    const campaign = await prisma.campaign.update({
      where: { id: session.campaignId },
      data: {
        gameState: gameState,
        lastSavedAt: new Date(),
      },
      select: {
        id: true,
        lastSavedAt: true,
      },
    });

    return res.json({
      success: true,
      savedAt: campaign.lastSavedAt,
      message: 'Game state saved to campaign. You can resume this session anytime.',
    });
  } catch (error) {
    console.error('Error saving session:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Check if it's a schema error (column doesn't exist)
    if (message.includes('column') || message.includes('does not exist') || message.includes('Unknown arg')) {
      return res.status(503).json({
        error: 'Session save feature not available',
        details: 'Database schema needs migration. Please contact administrator.',
      });
    }
    return res.status(500).json({ error: 'Failed to save session' });
  }
});

/**
 * POST /dm/sessions/:id/load
 * Load saved game state from campaign into a new or existing session
 */
router.post('/sessions/:id/load', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params; // This is the session ID to load into

    // Get the session with explicit select to avoid isLocked/allowedUsers
    // This endpoint intentionally selects campaign.gameState which requires migration
    const session = await prisma.gameSession.findFirst({
      where: {
        id,
        campaign: { ownerId: userId },
      },
      select: {
        id: true,
        campaignId: true,
        campaign: {
          select: {
            id: true,
            gameState: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get saved game state from campaign
    const campaign = session.campaign;
    if (!campaign.gameState) {
      return res.status(404).json({ error: 'No saved game state found for this campaign' });
    }

    const savedState = campaign.gameState as {
      currentMapId?: string;
      inCombat?: boolean;
      currentTurn?: number;
      round?: number;
      initiativeOrder?: Record<string, unknown>[];
      tokenStates?: Record<string, unknown>;
      revealedCells?: Record<string, unknown>;
      journal?: Record<string, unknown>[];
    };

    // Build update data, only including fields that have values
    const updateData: Record<string, unknown> = {
      inCombat: savedState.inCombat ?? false,
      round: savedState.round ?? 0,
      tokenStates: savedState.tokenStates ?? {},
      revealedCells: savedState.revealedCells ?? {},
      journal: savedState.journal ?? [],
      lastActivityAt: new Date(),
    };

    if (savedState.currentMapId !== undefined) {
      updateData.currentMapId = savedState.currentMapId;
    }
    if (savedState.currentTurn !== undefined) {
      updateData.currentTurn = savedState.currentTurn;
    }
    if (savedState.initiativeOrder !== undefined) {
      updateData.initiativeOrder = savedState.initiativeOrder;
    }

    // Restore session state - use explicit select to avoid isLocked/allowedUsers
    const updated = await prisma.gameSession.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        status: true,
        inCombat: true,
        round: true,
      },
    });

    return res.json({
      success: true,
      session: {
        id: updated.id,
        status: updated.status,
        inCombat: updated.inCombat,
        round: updated.round,
      },
      message: 'Game state loaded from saved campaign data.',
    });
  } catch (error) {
    console.error('Error loading session:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Check if it's a schema error (column doesn't exist)
    if (message.includes('column') || message.includes('does not exist') || message.includes('Unknown arg')) {
      return res.status(503).json({
        error: 'Session load feature not available',
        details: 'Database schema needs migration. Please contact administrator.',
      });
    }
    return res.status(500).json({ error: 'Failed to load session' });
  }
});

/**
 * GET /dm/campaigns/:id/saved-state
 * Get saved game state info for a campaign
 */
router.get('/campaigns/:id/saved-state', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        ownerId: userId,
      },
      select: {
        id: true,
        name: true,
        gameState: true,
        lastSavedAt: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const hasSavedState = campaign.gameState !== null;
    const savedState = campaign.gameState as { sessionName?: string; round?: number; inCombat?: boolean } | null;

    return res.json({
      campaignId: campaign.id,
      campaignName: campaign.name,
      hasSavedState,
      lastSavedAt: campaign.lastSavedAt,
      preview: hasSavedState
        ? {
            sessionName: savedState?.sessionName,
            round: savedState?.round,
            inCombat: savedState?.inCombat,
          }
        : null,
    });
  } catch (error) {
    console.error('Error getting saved state:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Check if it's a schema error (column doesn't exist)
    if (message.includes('column') || message.includes('does not exist') || message.includes('Unknown arg')) {
      return res.status(503).json({
        error: 'Saved state feature not available',
        details: 'Database schema needs migration. Please contact administrator.',
      });
    }
    return res.status(500).json({ error: 'Failed to get saved state' });
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
