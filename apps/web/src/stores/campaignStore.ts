import { create } from 'zustand';
import type { Campaign } from '@dnd/shared';

interface CampaignState {
  // Data
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCampaigns: (token: string) => Promise<void>;
  deleteCampaign: (id: string, token: string) => Promise<boolean>;

  // State management
  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useCampaignStore = create<CampaignState>((set) => ({
  campaigns: [],
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
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete campaign';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
