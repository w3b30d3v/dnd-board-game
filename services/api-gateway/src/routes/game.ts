import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth, optionalAuth } from '../middleware/auth.js';

const router: Router = Router();

/**
 * GET /game/sessions/:id
 * Get full session data for gameplay (authenticated users)
 */
router.get('/sessions/:id', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Get session with all related data
    const session = await prisma.gameSession.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        inviteCode: true,
        campaignId: true,
        currentMapId: true,
        inCombat: true,
        currentTurn: true,
        round: true,
        initiativeOrder: true,
        tokenStates: true,
        revealedCells: true,
        journal: true,
        lastActivityAt: true,
        createdAt: true,
        campaign: {
          select: {
            id: true,
            name: true,
            description: true,
            ownerId: true,
            settings: true,
          },
        },
        participants: {
          select: {
            id: true,
            userId: true,
            characterId: true,
            role: true,
            currentHp: true,
            tempHp: true,
            conditions: true,
            inspiration: true,
            isConnected: true,
            lastSeenAt: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is authorized (DM or participant)
    const isDM = session.campaign.ownerId === userId;
    const isParticipant = session.participants.some(p => p.userId === userId);

    if (!isDM && !isParticipant) {
      return res.status(403).json({ error: 'Not authorized to view this session' });
    }

    // Get current map data if one is set
    let currentMap = null;
    if (session.currentMapId) {
      currentMap = await prisma.map.findUnique({
        where: { id: session.currentMapId },
        select: {
          id: true,
          name: true,
          width: true,
          height: true,
          gridSize: true,
          tileSize: true,
          layers: true,
          tiles: true,
          backgroundUrl: true,
          lighting: true,
          ambience: true,
        },
      });
    }

    // Get participant details with character info
    const participantsWithCharacters = await Promise.all(
      session.participants.map(async (p) => {
        let character = null;
        if (p.characterId) {
          character = await prisma.character.findUnique({
            where: { id: p.characterId },
            select: {
              id: true,
              name: true,
              race: true,
              class: true,
              level: true,
              maxHitPoints: true,
              currentHitPoints: true,
              tempHitPoints: true,
              armorClass: true,
              speed: true,
              portraitUrl: true,
            },
          });
        }

        const user = await prisma.user.findUnique({
          where: { id: p.userId },
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        });

        return {
          ...p,
          user,
          character,
        };
      })
    );

    return res.json({
      session: {
        ...session,
        participants: participantsWithCharacters,
      },
      currentMap,
      isDM,
      userId,
    });
  } catch (error) {
    console.error('Error fetching game session:', error);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
});

/**
 * GET /game/sessions/join/:inviteCode
 * Get session info by invite code (for joining)
 */
router.get('/sessions/join/:inviteCode', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.params;

    const session = await prisma.gameSession.findUnique({
      where: { inviteCode },
      select: {
        id: true,
        name: true,
        status: true,
        inviteCode: true,
        campaign: {
          select: {
            id: true,
            name: true,
            description: true,
            coverImageUrl: true,
            owner: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        participants: {
          select: {
            userId: true,
            role: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ error: 'This session has ended' });
    }

    return res.json({
      session: {
        id: session.id,
        name: session.name,
        status: session.status,
        campaign: session.campaign,
        playerCount: session.participants.filter(p => p.role === 'player').length,
      },
    });
  } catch (error) {
    console.error('Error fetching session by invite:', error);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
});

/**
 * POST /game/sessions/:id/join
 * Join a game session as a player
 */
router.post('/sessions/:id/join', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { characterId } = req.body;

    // Get session
    const session = await prisma.gameSession.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        campaign: {
          select: {
            ownerId: true,
          },
        },
        participants: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Cannot join a completed session' });
    }

    // Check if already joined
    if (session.participants.some(p => p.userId === userId)) {
      return res.status(400).json({ error: 'Already joined this session' });
    }

    // Check if user is the DM
    const isDM = session.campaign.ownerId === userId;

    // Verify character ownership if provided
    if (characterId && !isDM) {
      const character = await prisma.character.findFirst({
        where: { id: characterId, userId },
      });
      if (!character) {
        return res.status(400).json({ error: 'Character not found or not owned by you' });
      }
    }

    // Create participant using connect pattern
    const participant = await prisma.gameSessionParticipant.create({
      data: {
        session: { connect: { id } },
        userId,
        characterId: isDM ? null : characterId,
        role: isDM ? 'dm' : 'player',
        isConnected: false,
      },
      select: {
        id: true,
        userId: true,
        characterId: true,
        role: true,
        isConnected: true,
      },
    });

    return res.status(201).json({ participant });
  } catch (error) {
    console.error('Error joining session:', error);
    return res.status(500).json({ error: 'Failed to join session' });
  }
});

/**
 * POST /game/sessions/:id/leave
 * Leave a game session
 */
router.post('/sessions/:id/leave', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Find and delete participant
    const deleted = await prisma.gameSessionParticipant.deleteMany({
      where: {
        sessionId: id,
        userId,
        role: 'player', // DMs can't leave their own session
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Not a participant in this session' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error leaving session:', error);
    return res.status(500).json({ error: 'Failed to leave session' });
  }
});

/**
 * GET /game/sessions/:id/maps
 * Get all maps for a session's campaign
 */
router.get('/sessions/:id/maps', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify user has access to session
    const session = await prisma.gameSession.findUnique({
      where: { id },
      select: {
        campaignId: true,
        campaign: {
          select: {
            ownerId: true,
          },
        },
        participants: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const isDM = session.campaign.ownerId === userId;
    const isParticipant = session.participants.some(p => p.userId === userId);

    if (!isDM && !isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get maps for the campaign
    const maps = await prisma.map.findMany({
      where: { campaignId: session.campaignId },
      select: {
        id: true,
        name: true,
        description: true,
        width: true,
        height: true,
        gridSize: true,
        backgroundUrl: true,
        tags: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ maps, isDM });
  } catch (error) {
    console.error('Error fetching maps:', error);
    return res.status(500).json({ error: 'Failed to fetch maps' });
  }
});

/**
 * GET /game/sessions/:id/encounters
 * Get all encounters for a session's campaign
 */
router.get('/sessions/:id/encounters', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify user is DM
    const session = await prisma.gameSession.findUnique({
      where: { id },
      select: {
        campaignId: true,
        campaign: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.campaign.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the DM can view encounters' });
    }

    // Get encounters for the campaign
    const encounters = await prisma.encounter.findMany({
      where: { campaignId: session.campaignId },
      select: {
        id: true,
        name: true,
        description: true,
        difficulty: true,
        monsters: true,
        objectives: true,
        rewards: true,
        mapId: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ encounters });
  } catch (error) {
    console.error('Error fetching encounters:', error);
    return res.status(500).json({ error: 'Failed to fetch encounters' });
  }
});

/**
 * PATCH /game/sessions/:id/map
 * Change the current map (DM only)
 */
router.patch('/sessions/:id/map', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { mapId } = req.body;

    // Verify user is DM
    const session = await prisma.gameSession.findUnique({
      where: { id },
      select: {
        id: true,
        campaignId: true,
        campaign: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.campaign.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the DM can change maps' });
    }

    // Verify map belongs to campaign
    if (mapId) {
      const map = await prisma.map.findFirst({
        where: { id: mapId, campaignId: session.campaignId },
      });
      if (!map) {
        return res.status(404).json({ error: 'Map not found in this campaign' });
      }
    }

    // Update session
    const updated = await prisma.gameSession.update({
      where: { id },
      data: {
        currentMapId: mapId || null,
        lastActivityAt: new Date(),
      },
      select: {
        id: true,
        currentMapId: true,
      },
    });

    // Get full map data
    let currentMap = null;
    if (updated.currentMapId) {
      currentMap = await prisma.map.findUnique({
        where: { id: updated.currentMapId },
        select: {
          id: true,
          name: true,
          width: true,
          height: true,
          gridSize: true,
          tileSize: true,
          layers: true,
          tiles: true,
          backgroundUrl: true,
          lighting: true,
          ambience: true,
        },
      });
    }

    return res.json({ session: updated, currentMap });
  } catch (error) {
    console.error('Error changing map:', error);
    return res.status(500).json({ error: 'Failed to change map' });
  }
});

/**
 * PATCH /game/sessions/:id/state
 * Update game state (token positions, fog, combat, etc.) - DM only
 */
router.patch('/sessions/:id/state', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { tokenStates, revealedCells, inCombat, round, currentTurn, initiativeOrder } = req.body;

    // Verify user is DM
    const session = await prisma.gameSession.findUnique({
      where: { id },
      select: {
        id: true,
        campaign: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.campaign.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the DM can update game state' });
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      lastActivityAt: new Date(),
    };

    if (tokenStates !== undefined) updateData.tokenStates = tokenStates;
    if (revealedCells !== undefined) updateData.revealedCells = revealedCells;
    if (inCombat !== undefined) updateData.inCombat = inCombat;
    if (round !== undefined) updateData.round = round;
    if (currentTurn !== undefined) updateData.currentTurn = currentTurn;
    if (initiativeOrder !== undefined) updateData.initiativeOrder = initiativeOrder;

    const updated = await prisma.gameSession.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        tokenStates: true,
        revealedCells: true,
        inCombat: true,
        round: true,
        currentTurn: true,
        initiativeOrder: true,
      },
    });

    return res.json({ session: updated });
  } catch (error) {
    console.error('Error updating game state:', error);
    return res.status(500).json({ error: 'Failed to update game state' });
  }
});

/**
 * POST /game/sessions/:id/journal
 * Add an entry to the session journal
 */
router.post('/sessions/:id/journal', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { type, content } = req.body;

    // Get session with journal
    const session = await prisma.gameSession.findUnique({
      where: { id },
      select: {
        id: true,
        journal: true,
        campaign: {
          select: {
            ownerId: true,
          },
        },
        participants: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verify user has access
    const isDM = session.campaign.ownerId === userId;
    const isParticipant = session.participants.some(p => p.userId === userId);

    if (!isDM && !isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Add journal entry
    const currentJournal = Array.isArray(session.journal) ? session.journal : [];
    const newEntry = {
      id: `journal_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: type || 'note',
      content,
      userId,
    };
    const updatedJournal = [...currentJournal, newEntry];

    const updated = await prisma.gameSession.update({
      where: { id },
      data: {
        journal: updatedJournal,
      },
      select: {
        id: true,
        journal: true,
      },
    });

    return res.json({ entry: newEntry, journal: updated.journal });
  } catch (error) {
    console.error('Error adding journal entry:', error);
    return res.status(500).json({ error: 'Failed to add journal entry' });
  }
});

export default router;
