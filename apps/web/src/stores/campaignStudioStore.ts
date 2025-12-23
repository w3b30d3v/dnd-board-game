'use client';

import { create } from 'zustand';

// Campaign Studio Types
export type CampaignPhase =
  | 'setting'
  | 'story'
  | 'locations'
  | 'npcs'
  | 'encounters'
  | 'quests';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  generatedContent?: ContentBlock[];
}

export interface ContentBlock {
  id: string;
  type: 'setting' | 'location' | 'npc' | 'encounter' | 'quest';
  data: SettingData | LocationData | NPCData | EncounterData | QuestData;
  createdAt: Date;
}

export interface SettingData {
  name: string;
  description: string;
  themes: string[];
  tone: string;
  era: string;
  imageUrl?: string;
}

export interface LocationData {
  id: string;
  name: string;
  description: string;
  type: string;
  features: string[];
  connections: string[];
  imageUrl?: string;
}

export interface NPCData {
  id: string;
  name: string;
  race: string;
  class?: string;
  role: string;
  description: string;
  personality: {
    traits: string[];
    ideal: string;
    bond: string;
    flaw: string;
  };
  voiceProfile?: string;
  portraitUrl?: string;
}

export interface EncounterData {
  id: string;
  name: string;
  type: 'combat' | 'social' | 'exploration' | 'puzzle';
  difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
  description: string;
  monsters?: string[];
  rewards?: string[];
  locationId?: string;
}

export interface QuestData {
  id: string;
  name: string;
  type: 'main' | 'side' | 'personal';
  description: string;
  objectives: string[];
  rewards: string[];
  giverNpcId?: string;
}

export interface ConversationState {
  id: string | null;
  campaignId: string | null;
  currentPhase: CampaignPhase;
  completedPhases: CampaignPhase[];
  messages: Message[];
  generatedContent: ContentBlock[];
  isGenerating: boolean;
  error: string | null;
}

interface CampaignStudioState extends ConversationState {
  // Actions
  startConversation: (campaignId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  advancePhase: () => Promise<void>;
  setPhase: (phase: CampaignPhase) => void;
  regenerateContent: (contentId: string) => Promise<void>;
  editContent: (contentId: string, updates: Partial<ContentBlock['data']>) => void;
  clearConversation: () => void;
  setError: (error: string | null) => void;
}

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:4003';

// Helper to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const storage = localStorage.getItem('auth-storage');
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage);
    return parsed.state?.token || null;
  } catch {
    return null;
  }
};

export const useCampaignStudioStore = create<CampaignStudioState>((set, get) => ({
  // Initial state
  id: null,
  campaignId: null,
  currentPhase: 'setting',
  completedPhases: [],
  messages: [],
  generatedContent: [],
  isGenerating: false,
  error: null,

  // Start a new conversation
  startConversation: async (campaignId: string) => {
    const token = getAuthToken();
    if (!token) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isGenerating: true, error: null });

    try {
      const response = await fetch(`${AI_SERVICE_URL}/ai/conversation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ campaignId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start conversation');
      }

      const data = await response.json();

      // Add initial assistant message
      const initialMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: data.message || getPhaseWelcomeMessage('setting'),
        timestamp: new Date(),
      };

      set({
        id: data.conversationId,
        campaignId,
        currentPhase: data.phase || 'setting',
        messages: [initialMessage],
        isGenerating: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start conversation';
      set({ error: message, isGenerating: false });
    }
  },

  // Send a message to Claude
  sendMessage: async (content: string) => {
    const { id, currentPhase, messages } = get();
    const token = getAuthToken();

    if (!token) {
      set({ error: 'Not authenticated' });
      return;
    }

    if (!id) {
      set({ error: 'No active conversation' });
      return;
    }

    // Add user message immediately
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    set({
      messages: [...messages, userMessage],
      isGenerating: true,
      error: null,
    });

    try {
      const response = await fetch(`${AI_SERVICE_URL}/ai/conversation/${id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();

      // Add assistant response
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_response`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        generatedContent: data.generatedContent,
      };

      // Update generated content if any
      const newContent = data.generatedContent?.map((item: ContentBlock['data'], index: number) => ({
        id: `content_${Date.now()}_${index}`,
        type: getContentTypeForPhase(currentPhase),
        data: item,
        createdAt: new Date(),
      })) || [];

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        generatedContent: [...state.generatedContent, ...newContent],
        isGenerating: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      set({ error: message, isGenerating: false });
    }
  },

  // Advance to the next phase
  advancePhase: async () => {
    const { id, currentPhase, completedPhases } = get();
    const token = getAuthToken();

    if (!token || !id) {
      set({ error: 'Not authenticated or no active conversation' });
      return;
    }

    set({ isGenerating: true, error: null });

    try {
      const response = await fetch(`${AI_SERVICE_URL}/ai/conversation/${id}/advance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to advance phase');
      }

      const data = await response.json();
      const nextPhase = data.phase as CampaignPhase;

      // Add summary message
      const summaryMessage: Message = {
        id: `msg_${Date.now()}_summary`,
        role: 'assistant',
        content: data.summary || `Excellent! The ${currentPhase} phase is complete. Let's move on to ${nextPhase}.`,
        timestamp: new Date(),
      };

      // Add welcome message for new phase
      const welcomeMessage: Message = {
        id: `msg_${Date.now()}_welcome`,
        role: 'assistant',
        content: getPhaseWelcomeMessage(nextPhase),
        timestamp: new Date(),
      };

      set((state) => ({
        currentPhase: nextPhase,
        completedPhases: [...state.completedPhases, currentPhase],
        messages: [...state.messages, summaryMessage, welcomeMessage],
        isGenerating: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to advance phase';
      set({ error: message, isGenerating: false });
    }
  },

  // Manually set the current phase
  setPhase: (phase: CampaignPhase) => {
    set({ currentPhase: phase });
  },

  // Regenerate a specific piece of content
  regenerateContent: async (contentId: string) => {
    const { id, generatedContent } = get();
    const token = getAuthToken();

    if (!token || !id) {
      set({ error: 'Not authenticated or no active conversation' });
      return;
    }

    const content = generatedContent.find((c) => c.id === contentId);
    if (!content) {
      set({ error: 'Content not found' });
      return;
    }

    set({ isGenerating: true, error: null });

    try {
      const response = await fetch(`${AI_SERVICE_URL}/ai/generate/${content.type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: id,
          contentId,
          regenerate: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate content');
      }

      const data = await response.json();

      // Update the specific content block
      set((state) => ({
        generatedContent: state.generatedContent.map((c) =>
          c.id === contentId
            ? { ...c, data: data.content, createdAt: new Date() }
            : c
        ),
        isGenerating: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to regenerate content';
      set({ error: message, isGenerating: false });
    }
  },

  // Edit content locally
  editContent: (contentId: string, updates: Partial<ContentBlock['data']>) => {
    set((state) => ({
      generatedContent: state.generatedContent.map((c) =>
        c.id === contentId
          ? { ...c, data: { ...c.data, ...updates } as ContentBlock['data'] }
          : c
      ),
    }));
  },

  // Clear the conversation
  clearConversation: () => {
    set({
      id: null,
      campaignId: null,
      currentPhase: 'setting',
      completedPhases: [],
      messages: [],
      generatedContent: [],
      isGenerating: false,
      error: null,
    });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));

// Helper functions
function getPhaseWelcomeMessage(phase: CampaignPhase): string {
  const messages: Record<CampaignPhase, string> = {
    setting: `Welcome to the Campaign Studio! I'm your AI assistant, and together we'll create an amazing D&D campaign.

Let's start by establishing the **Setting** - the world where your adventure will take place. Tell me about your vision:

- What kind of world do you imagine? (High fantasy, dark & gritty, steampunk, etc.)
- What era or time period? (Medieval, ancient, renaissance)
- Any specific themes you want to explore? (Political intrigue, exploration, war)

Share your ideas, and I'll help shape them into a compelling campaign setting!`,

    story: `Now let's craft the **Story** - the central narrative that will drive your campaign.

Consider these elements:
- What's the main conflict or threat?
- Who are the key factions involved?
- What hooks will draw the players in?
- What's at stake if they fail?

Tell me about the story you want to tell, and we'll develop it together!`,

    locations: `Time to build the **Locations** - the memorable places your players will explore.

Think about:
- Starting location (a town, tavern, or city)
- Key adventure sites (dungeons, ruins, lairs)
- Important landmarks
- Travel routes between locations

What locations do you envision? I'll help bring them to life!`,

    npcs: `Let's create the **NPCs** - the characters who will populate your world.

We need:
- Quest givers and allies
- Villains and antagonists
- Merchants and service providers
- Colorful locals with stories to tell

Who are the key characters in your campaign?`,

    encounters: `Now for the **Encounters** - the challenges your players will face.

Consider a mix of:
- Combat encounters (varying difficulty)
- Social encounters (negotiation, persuasion)
- Exploration challenges (puzzles, traps)
- Environmental hazards

What types of encounters fit your campaign?`,

    quests: `Finally, let's design the **Quests** - the missions that structure your campaign.

Include:
- A main quest line with multiple steps
- Side quests for depth and rewards
- Personal quests tied to player backstories
- Faction quests for political gameplay

What quests should drive your adventure?`,
  };

  return messages[phase];
}

function getContentTypeForPhase(phase: CampaignPhase): ContentBlock['type'] {
  const mapping: Record<CampaignPhase, ContentBlock['type']> = {
    setting: 'setting',
    story: 'setting', // Story updates the setting
    locations: 'location',
    npcs: 'npc',
    encounters: 'encounter',
    quests: 'quest',
  };
  return mapping[phase];
}

// Export phase order for UI
export const PHASE_ORDER: CampaignPhase[] = [
  'setting',
  'story',
  'locations',
  'npcs',
  'encounters',
  'quests',
];

export const PHASE_INFO: Record<CampaignPhase, { label: string; icon: string; description: string }> = {
  setting: {
    label: 'Setting',
    icon: '🌍',
    description: 'Define your world and its themes'
  },
  story: {
    label: 'Story',
    icon: '📜',
    description: 'Craft the central narrative'
  },
  locations: {
    label: 'Locations',
    icon: '🗺️',
    description: 'Build memorable places'
  },
  npcs: {
    label: 'NPCs',
    icon: '👥',
    description: 'Create compelling characters'
  },
  encounters: {
    label: 'Encounters',
    icon: '⚔️',
    description: 'Design challenging encounters'
  },
  quests: {
    label: 'Quests',
    icon: '🎯',
    description: 'Plan quest lines and objectives'
  },
};
