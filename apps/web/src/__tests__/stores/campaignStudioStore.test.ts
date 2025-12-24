import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCampaignStudioStore, PHASE_ORDER, PHASE_INFO } from '@/stores/campaignStudioStore';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('campaignStudioStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state before each test
    useCampaignStudioStore.setState({
      id: null,
      campaignId: null,
      currentPhase: 'setting',
      completedPhases: [],
      messages: [],
      generatedContent: [],
      isGenerating: false,
      error: null,
    });
    // Mock auth token
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
      state: { token: 'test-token' }
    }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useCampaignStudioStore.getState();

      expect(state.id).toBeNull();
      expect(state.campaignId).toBeNull();
      expect(state.currentPhase).toBe('setting');
      expect(state.completedPhases).toEqual([]);
      expect(state.messages).toEqual([]);
      expect(state.generatedContent).toEqual([]);
      expect(state.isGenerating).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Phase Management', () => {
    it('should set phase correctly', () => {
      const { setPhase } = useCampaignStudioStore.getState();

      setPhase('locations');

      const state = useCampaignStudioStore.getState();
      expect(state.currentPhase).toBe('locations');
    });

    it('should have correct phase order', () => {
      expect(PHASE_ORDER).toEqual(['setting', 'story', 'locations', 'npcs', 'encounters', 'quests']);
    });

    it('should have phase info for all phases', () => {
      PHASE_ORDER.forEach((phase) => {
        expect(PHASE_INFO[phase]).toBeDefined();
        expect(PHASE_INFO[phase].label).toBeDefined();
        expect(PHASE_INFO[phase].icon).toBeDefined();
        expect(PHASE_INFO[phase].description).toBeDefined();
      });
    });
  });

  describe('editContent', () => {
    it('should edit existing content', () => {
      // Set up initial content
      useCampaignStudioStore.setState({
        generatedContent: [
          {
            id: 'content-1',
            type: 'location',
            data: {
              id: 'loc-1',
              name: 'Original Name',
              description: 'Original Description',
              type: 'city',
              features: [],
              connections: [],
            },
            createdAt: new Date(),
          },
        ],
      });

      const { editContent } = useCampaignStudioStore.getState();

      editContent('content-1', { name: 'Updated Name' });

      const state = useCampaignStudioStore.getState();
      expect((state.generatedContent[0].data as { name: string }).name).toBe('Updated Name');
    });

    it('should not modify other content', () => {
      useCampaignStudioStore.setState({
        generatedContent: [
          {
            id: 'content-1',
            type: 'location',
            data: { id: 'loc-1', name: 'Location 1', description: '', type: 'city', features: [], connections: [] },
            createdAt: new Date(),
          },
          {
            id: 'content-2',
            type: 'location',
            data: { id: 'loc-2', name: 'Location 2', description: '', type: 'city', features: [], connections: [] },
            createdAt: new Date(),
          },
        ],
      });

      const { editContent } = useCampaignStudioStore.getState();

      editContent('content-1', { name: 'Updated' });

      const state = useCampaignStudioStore.getState();
      expect((state.generatedContent[1].data as { name: string }).name).toBe('Location 2');
    });
  });

  describe('clearConversation', () => {
    it('should reset store to initial state', () => {
      // Set up some state
      useCampaignStudioStore.setState({
        id: 'conv-123',
        campaignId: 'camp-123',
        currentPhase: 'npcs',
        completedPhases: ['setting', 'story', 'locations'],
        messages: [{ id: 'msg-1', role: 'user', content: 'Test', timestamp: new Date() }],
        generatedContent: [
          { id: 'content-1', type: 'location', data: { name: 'Test' } as never, createdAt: new Date() },
        ],
        isGenerating: true,
        error: 'Test error',
      });

      const { clearConversation } = useCampaignStudioStore.getState();
      clearConversation();

      const state = useCampaignStudioStore.getState();
      expect(state.id).toBeNull();
      expect(state.campaignId).toBeNull();
      expect(state.currentPhase).toBe('setting');
      expect(state.completedPhases).toEqual([]);
      expect(state.messages).toEqual([]);
      expect(state.generatedContent).toEqual([]);
      expect(state.isGenerating).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { setError } = useCampaignStudioStore.getState();

      setError('Test error message');

      const state = useCampaignStudioStore.getState();
      expect(state.error).toBe('Test error message');
    });

    it('should clear error with null', () => {
      useCampaignStudioStore.setState({ error: 'Existing error' });

      const { setError } = useCampaignStudioStore.getState();
      setError(null);

      const state = useCampaignStudioStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('startConversation', () => {
    it('should handle missing auth token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { startConversation } = useCampaignStudioStore.getState();
      await startConversation('campaign-123');

      const state = useCampaignStudioStore.getState();
      expect(state.error).toBe('Not authenticated');
    });

    it('should set isGenerating while starting', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { startConversation } = useCampaignStudioStore.getState();
      startConversation('campaign-123');

      // Check immediately after call
      const state = useCampaignStudioStore.getState();
      expect(state.isGenerating).toBe(true);
    });

    it('should handle successful conversation start', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          conversationId: 'conv-123',
          phase: 'setting',
          message: 'Welcome message',
        }),
      });

      const { startConversation } = useCampaignStudioStore.getState();
      await startConversation('campaign-123');

      const state = useCampaignStudioStore.getState();
      expect(state.id).toBe('conv-123');
      expect(state.campaignId).toBe('campaign-123');
      expect(state.isGenerating).toBe(false);
      expect(state.messages.length).toBe(1);
      expect(state.messages[0].role).toBe('assistant');
    });

    it('should handle API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'API Error' }),
      });

      const { startConversation } = useCampaignStudioStore.getState();
      await startConversation('campaign-123');

      const state = useCampaignStudioStore.getState();
      expect(state.error).toBe('API Error');
      expect(state.isGenerating).toBe(false);
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      useCampaignStudioStore.setState({
        id: 'conv-123',
        campaignId: 'campaign-123',
        currentPhase: 'setting',
        messages: [],
      });
    });

    it('should handle missing conversation', async () => {
      useCampaignStudioStore.setState({ id: null });

      const { sendMessage } = useCampaignStudioStore.getState();
      await sendMessage('Test message');

      const state = useCampaignStudioStore.getState();
      expect(state.error).toBe('No active conversation');
    });

    it('should add user message immediately', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { sendMessage } = useCampaignStudioStore.getState();
      sendMessage('Hello AI');

      // Check immediately after call
      const state = useCampaignStudioStore.getState();
      expect(state.messages.length).toBe(1);
      expect(state.messages[0].role).toBe('user');
      expect(state.messages[0].content).toBe('Hello AI');
    });

    it('should add assistant response on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          message: 'AI response',
          generatedContent: null,
        }),
      });

      const { sendMessage } = useCampaignStudioStore.getState();
      await sendMessage('Hello AI');

      const state = useCampaignStudioStore.getState();
      expect(state.messages.length).toBe(2);
      expect(state.messages[1].role).toBe('assistant');
      expect(state.messages[1].content).toBe('AI response');
      expect(state.isGenerating).toBe(false);
    });
  });

  describe('Content Types', () => {
    it('should support all content types in generatedContent', () => {
      const types = ['setting', 'location', 'npc', 'encounter', 'quest'] as const;

      useCampaignStudioStore.setState({
        generatedContent: types.map((type, i) => ({
          id: `content-${i}`,
          type,
          data: { name: `Test ${type}` } as never,
          createdAt: new Date(),
        })),
      });

      const state = useCampaignStudioStore.getState();
      expect(state.generatedContent.length).toBe(5);
      expect(state.generatedContent.map((c) => c.type)).toEqual(types);
    });
  });
});
