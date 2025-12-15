import { create } from 'zustand';
import type {
  Campaign,
  CreateCampaignInput,
  UpdateCampaignInput,
  GameMap,
  Encounter,
  NPC,
  Quest,
  ValidationResult,
} from '@dnd/shared';

interface CampaignState {
  // Data
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCampaigns: (token: string) => Promise<void>;
  fetchCampaign: (id: string, token: string) => Promise<void>;
  createCampaign: (data: CreateCampaignInput, token: string) => Promise<Campaign | null>;
  updateCampaign: (id: string, data: UpdateCampaignInput, token: string) => Promise<Campaign | null>;
  deleteCampaign: (id: string, token: string) => Promise<boolean>;

  // Map actions
  createMap: (campaignId: string, data: Partial<GameMap>, token: string) => Promise<GameMap | null>;
  updateMap: (campaignId: string, mapId: string, data: Partial<GameMap>, token: string) => Promise<GameMap | null>;
  deleteMap: (campaignId: string, mapId: string, token: string) => Promise<boolean>;

  // Encounter actions
  createEncounter: (campaignId: string, data: Partial<Encounter>, token: string) => Promise<Encounter | null>;
  updateEncounter: (campaignId: string, encounterId: string, data: Partial<Encounter>, token: string) => Promise<Encounter | null>;
  deleteEncounter: (campaignId: string, encounterId: string, token: string) => Promise<boolean>;

  // NPC actions
  createNPC: (campaignId: string, data: Partial<NPC>, token: string) => Promise<NPC | null>;
  updateNPC: (campaignId: string, npcId: string, data: Partial<NPC>, token: string) => Promise<NPC | null>;
  deleteNPC: (campaignId: string, npcId: string, token: string) => Promise<boolean>;

  // Quest actions
  createQuest: (campaignId: string, data: Partial<Quest>, token: string) => Promise<Quest | null>;
  updateQuest: (campaignId: string, questId: string, data: Partial<Quest>, token: string) => Promise<Quest | null>;
  deleteQuest: (campaignId: string, questId: string, token: string) => Promise<boolean>;

  // Validation & Publishing
  validateCampaign: (id: string, token: string) => Promise<ValidationResult | null>;
  publishCampaign: (id: string, options: { visibility: 'public' | 'private' | 'unlisted'; price?: number }, token: string) => Promise<boolean>;

  // State management
  setCurrentCampaign: (campaign: Campaign | null) => void;
  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  currentCampaign: null,
  isLoading: false,
  error: null,

  fetchCampaigns: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        // Try to get error message from response
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch campaigns');
      }
      const data = await response.json();
      // Clear error on successful fetch (even if empty campaigns array)
      set({ campaigns: data.campaigns || [], isLoading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch campaigns';
      // Don't show error for empty list - just set empty campaigns
      set({ error: message, isLoading: false, campaigns: [] });
    }
  },

  fetchCampaign: async (id: string, token: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch campaign');
      const campaign = await response.json();
      set({ currentCampaign: campaign, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch campaign';
      set({ error: message, isLoading: false });
    }
  },

  createCampaign: async (data: CreateCampaignInput, token: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/campaigns`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create campaign');
      const campaign = await response.json();
      set((state) => ({
        campaigns: [campaign, ...state.campaigns],
        isLoading: false,
      }));
      return campaign;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create campaign';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  updateCampaign: async (id: string, data: UpdateCampaignInput, token: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update campaign');
      const campaign = await response.json();
      set((state) => ({
        campaigns: state.campaigns.map((c) => (c.id === id ? campaign : c)),
        currentCampaign: state.currentCampaign?.id === id ? campaign : state.currentCampaign,
        isLoading: false,
      }));
      return campaign;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update campaign';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  deleteCampaign: async (id: string, token: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/campaigns/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete campaign');
      set((state) => ({
        campaigns: state.campaigns.filter((c) => c.id !== id),
        currentCampaign: state.currentCampaign?.id === id ? null : state.currentCampaign,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete campaign';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  // Map actions
  createMap: async (campaignId: string, data: Partial<GameMap>, token: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/maps`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create map');
      const map = await response.json();
      // Refresh campaign to get updated maps
      await get().fetchCampaign(campaignId, token);
      return map;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create map';
      set({ error: message });
      return null;
    }
  },

  updateMap: async (campaignId: string, mapId: string, data: Partial<GameMap>, token: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/maps/${mapId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update map');
      const map = await response.json();
      await get().fetchCampaign(campaignId, token);
      return map;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update map';
      set({ error: message });
      return null;
    }
  },

  deleteMap: async (campaignId: string, mapId: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/maps/${mapId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete map');
      await get().fetchCampaign(campaignId, token);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete map';
      set({ error: message });
      return false;
    }
  },

  // Encounter actions
  createEncounter: async (campaignId: string, data: Partial<Encounter>, token: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/encounters`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create encounter');
      const encounter = await response.json();
      await get().fetchCampaign(campaignId, token);
      return encounter;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create encounter';
      set({ error: message });
      return null;
    }
  },

  updateEncounter: async (campaignId: string, encounterId: string, data: Partial<Encounter>, token: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/encounters/${encounterId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update encounter');
      const encounter = await response.json();
      await get().fetchCampaign(campaignId, token);
      return encounter;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update encounter';
      set({ error: message });
      return null;
    }
  },

  deleteEncounter: async (campaignId: string, encounterId: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/encounters/${encounterId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete encounter');
      await get().fetchCampaign(campaignId, token);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete encounter';
      set({ error: message });
      return false;
    }
  },

  // NPC actions
  createNPC: async (campaignId: string, data: Partial<NPC>, token: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/npcs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create NPC');
      const npc = await response.json();
      await get().fetchCampaign(campaignId, token);
      return npc;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create NPC';
      set({ error: message });
      return null;
    }
  },

  updateNPC: async (campaignId: string, npcId: string, data: Partial<NPC>, token: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/npcs/${npcId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update NPC');
      const npc = await response.json();
      await get().fetchCampaign(campaignId, token);
      return npc;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update NPC';
      set({ error: message });
      return null;
    }
  },

  deleteNPC: async (campaignId: string, npcId: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/npcs/${npcId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete NPC');
      await get().fetchCampaign(campaignId, token);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete NPC';
      set({ error: message });
      return false;
    }
  },

  // Quest actions
  createQuest: async (campaignId: string, data: Partial<Quest>, token: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/quests`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create quest');
      const quest = await response.json();
      await get().fetchCampaign(campaignId, token);
      return quest;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create quest';
      set({ error: message });
      return null;
    }
  },

  updateQuest: async (campaignId: string, questId: string, data: Partial<Quest>, token: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/quests/${questId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update quest');
      const quest = await response.json();
      await get().fetchCampaign(campaignId, token);
      return quest;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update quest';
      set({ error: message });
      return null;
    }
  },

  deleteQuest: async (campaignId: string, questId: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/quests/${questId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete quest');
      await get().fetchCampaign(campaignId, token);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete quest';
      set({ error: message });
      return false;
    }
  },

  // Validation & Publishing
  validateCampaign: async (id: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${id}/validate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to validate campaign');
      return await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to validate campaign';
      set({ error: message });
      return null;
    }
  },

  publishCampaign: async (id: string, options, token: string) => {
    try {
      const response = await fetch(`${API_URL}/campaigns/${id}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });
      if (!response.ok) throw new Error('Failed to publish campaign');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish campaign';
      set({ error: message });
      return false;
    }
  },

  setCurrentCampaign: (campaign: Campaign | null) => set({ currentCampaign: campaign }),
  clearError: () => set({ error: null }),
}));
