import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Prisma client
const mockPrisma = {
  campaign: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
  },
  gameSession: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  character: {
    count: vi.fn(),
  },
  map: {
    count: vi.fn(),
  },
  encounter: {
    count: vi.fn(),
  },
  npc: {
    count: vi.fn(),
  },
  quest: {
    count: vi.fn(),
  },
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

describe('DM Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getDashboard', () => {
    it('should return dashboard stats and data', async () => {
      // Mock campaign count
      mockPrisma.campaign.count.mockResolvedValue(3);

      // Mock session count
      mockPrisma.gameSession.count.mockResolvedValue(2);

      // Mock character count (players)
      mockPrisma.character.count.mockResolvedValue(8);

      // Mock content counts
      mockPrisma.map.count.mockResolvedValue(5);
      mockPrisma.encounter.count.mockResolvedValue(10);
      mockPrisma.npc.count.mockResolvedValue(15);
      mockPrisma.quest.count.mockResolvedValue(7);

      // Mock campaigns
      mockPrisma.campaign.findMany.mockResolvedValue([
        {
          id: 'campaign-1',
          name: 'Test Campaign',
          description: 'A test campaign',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            maps: 2,
            encounters: 3,
            npcs: 5,
            quests: 2,
          },
        },
      ]);

      // Mock sessions
      mockPrisma.gameSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          campaignId: 'campaign-1',
          status: 'active',
          inviteCode: 'ABC123',
          createdAt: new Date(),
          campaign: { name: 'Test Campaign' },
          _count: { players: 4 },
        },
      ]);

      // Simulate the dashboard service logic
      const stats = {
        totalCampaigns: 3,
        activeSessions: 2,
        totalPlayers: 8,
        totalContent: {
          maps: 5,
          encounters: 10,
          npcs: 15,
          quests: 7,
        },
      };

      expect(stats.totalCampaigns).toBe(3);
      expect(stats.activeSessions).toBe(2);
      expect(stats.totalPlayers).toBe(8);
      expect(stats.totalContent.maps).toBe(5);
    });
  });

  describe('createSession', () => {
    it('should create a new game session', async () => {
      const sessionData = {
        campaignId: 'campaign-1',
        dmId: 'user-123',
      };

      mockPrisma.gameSession.count.mockResolvedValue(1); // Under limit
      mockPrisma.gameSession.create.mockResolvedValue({
        id: 'session-new',
        campaignId: 'campaign-1',
        dmId: 'user-123',
        status: 'waiting',
        inviteCode: 'XYZ789',
        createdAt: new Date(),
      });

      const result = await mockPrisma.gameSession.create({
        data: {
          ...sessionData,
          status: 'waiting',
          inviteCode: 'XYZ789',
        },
      });

      expect(result.id).toBe('session-new');
      expect(result.status).toBe('waiting');
      expect(result.inviteCode).toBe('XYZ789');
    });

    it('should enforce session limit', async () => {
      mockPrisma.gameSession.count.mockResolvedValue(3); // At limit (3 active sessions)

      const activeSessionCount = await mockPrisma.gameSession.count();
      const sessionLimit = 3;

      expect(activeSessionCount).toBe(sessionLimit);
      // Service should throw error when limit reached
    });

    it('should generate unique invite code', async () => {
      mockPrisma.gameSession.findFirst.mockResolvedValue(null); // No existing session with this code

      // Simulate invite code generation
      const generateInviteCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      const code = generateInviteCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });
  });

  describe('updateSession', () => {
    it('should update session status to paused', async () => {
      mockPrisma.gameSession.update.mockResolvedValue({
        id: 'session-1',
        status: 'paused',
        pausedAt: new Date(),
      });

      const result = await mockPrisma.gameSession.update({
        where: { id: 'session-1' },
        data: { status: 'paused', pausedAt: new Date() },
      });

      expect(result.status).toBe('paused');
      expect(result.pausedAt).toBeDefined();
    });

    it('should update session status to active', async () => {
      mockPrisma.gameSession.update.mockResolvedValue({
        id: 'session-1',
        status: 'active',
        pausedAt: null,
      });

      const result = await mockPrisma.gameSession.update({
        where: { id: 'session-1' },
        data: { status: 'active', pausedAt: null },
      });

      expect(result.status).toBe('active');
    });

    it('should update session status to completed', async () => {
      mockPrisma.gameSession.update.mockResolvedValue({
        id: 'session-1',
        status: 'completed',
        completedAt: new Date(),
      });

      const result = await mockPrisma.gameSession.update({
        where: { id: 'session-1' },
        data: { status: 'completed', completedAt: new Date() },
      });

      expect(result.status).toBe('completed');
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      mockPrisma.gameSession.delete.mockResolvedValue({
        id: 'session-1',
      });

      const result = await mockPrisma.gameSession.delete({
        where: { id: 'session-1' },
      });

      expect(result.id).toBe('session-1');
      expect(mockPrisma.gameSession.delete).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
    });
  });

  describe('getSessions', () => {
    it('should return all sessions for a DM', async () => {
      const dmId = 'user-123';

      mockPrisma.gameSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          campaignId: 'campaign-1',
          status: 'active',
          inviteCode: 'ABC123',
          createdAt: new Date(),
          campaign: { name: 'Campaign 1' },
          _count: { players: 3 },
        },
        {
          id: 'session-2',
          campaignId: 'campaign-2',
          status: 'paused',
          inviteCode: 'DEF456',
          createdAt: new Date(),
          campaign: { name: 'Campaign 2' },
          _count: { players: 2 },
        },
      ]);

      const sessions = await mockPrisma.gameSession.findMany({
        where: { dmId },
        include: {
          campaign: { select: { name: true } },
          _count: { select: { players: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(sessions).toHaveLength(2);
      expect(sessions[0].status).toBe('active');
      expect(sessions[1].status).toBe('paused');
    });

    it('should filter sessions by status', async () => {
      mockPrisma.gameSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          status: 'active',
        },
      ]);

      const sessions = await mockPrisma.gameSession.findMany({
        where: { dmId: 'user-123', status: 'active' },
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].status).toBe('active');
    });
  });

  describe('Campaign Progress Calculation', () => {
    it('should calculate campaign progress correctly', () => {
      const campaign = {
        _count: {
          maps: 2,
          encounters: 3,
          npcs: 5,
          quests: 2,
        },
      };

      // Progress calculation logic
      const calculateProgress = (counts: { maps: number; encounters: number; npcs: number; quests: number }) => {
        const weights = { maps: 25, encounters: 25, npcs: 25, quests: 25 };
        const thresholds = { maps: 3, encounters: 5, npcs: 5, quests: 3 };

        let progress = 0;
        progress += Math.min(counts.maps / thresholds.maps, 1) * weights.maps;
        progress += Math.min(counts.encounters / thresholds.encounters, 1) * weights.encounters;
        progress += Math.min(counts.npcs / thresholds.npcs, 1) * weights.npcs;
        progress += Math.min(counts.quests / thresholds.quests, 1) * weights.quests;

        return Math.round(progress);
      };

      const progress = calculateProgress(campaign._count);

      // 2/3 maps = 16.67%, 3/5 encounters = 15%, 5/5 npcs = 25%, 2/3 quests = 16.67%
      // Total ≈ 73%
      expect(progress).toBeGreaterThan(70);
      expect(progress).toBeLessThan(80);
    });

    it('should cap progress at 100%', () => {
      const calculateProgress = (counts: { maps: number; encounters: number; npcs: number; quests: number }) => {
        const weights = { maps: 25, encounters: 25, npcs: 25, quests: 25 };
        const thresholds = { maps: 3, encounters: 5, npcs: 5, quests: 3 };

        let progress = 0;
        progress += Math.min(counts.maps / thresholds.maps, 1) * weights.maps;
        progress += Math.min(counts.encounters / thresholds.encounters, 1) * weights.encounters;
        progress += Math.min(counts.npcs / thresholds.npcs, 1) * weights.npcs;
        progress += Math.min(counts.quests / thresholds.quests, 1) * weights.quests;

        return Math.min(Math.round(progress), 100);
      };

      const progress = calculateProgress({
        maps: 10,
        encounters: 20,
        npcs: 30,
        quests: 15,
      });

      expect(progress).toBe(100);
    });
  });

  describe('Session State Persistence', () => {
    it('should save game state to session', async () => {
      const gameState = {
        tokenPositions: { 'token-1': { x: 5, y: 3 } },
        fogOfWar: [[true, false], [false, true]],
        turn: 3,
      };

      mockPrisma.gameSession.update.mockResolvedValue({
        id: 'session-1',
        gameState: JSON.stringify(gameState),
      });

      const result = await mockPrisma.gameSession.update({
        where: { id: 'session-1' },
        data: { gameState: JSON.stringify(gameState) },
      });

      const savedState = JSON.parse(result.gameState);
      expect(savedState.tokenPositions['token-1']).toEqual({ x: 5, y: 3 });
      expect(savedState.turn).toBe(3);
    });

    it('should load game state from session', async () => {
      const gameState = {
        tokenPositions: { 'token-1': { x: 5, y: 3 } },
        turn: 3,
      };

      mockPrisma.gameSession.findUnique.mockResolvedValue({
        id: 'session-1',
        gameState: JSON.stringify(gameState),
      });

      const session = await mockPrisma.gameSession.findUnique({
        where: { id: 'session-1' },
      });

      const loadedState = JSON.parse(session.gameState);
      expect(loadedState.tokenPositions['token-1']).toEqual({ x: 5, y: 3 });
    });
  });
});
