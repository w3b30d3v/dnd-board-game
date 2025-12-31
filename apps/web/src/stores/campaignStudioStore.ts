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

export interface CutsceneData {
  id: string;
  name: string;
  description?: string;
  videoUrl?: string;
  duration?: number;
  narrationText?: string;
  voiceProfileId?: string;
}

export interface ContentBlock {
  id: string;
  type: 'setting' | 'location' | 'npc' | 'encounter' | 'quest' | 'cutscene';
  data: SettingData | LocationData | NPCData | EncounterData | QuestData | CutsceneData;
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
  isSaving: boolean;
  lastSavedAt: Date | null;
  error: string | null;
}

// Import data structure
export interface CampaignExportData {
  name: string;
  exportedAt: string;
  version: string;
  content: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
    createdAt: string;
  }>;
  chatHistory: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: string;
  }>;
}

interface CampaignStudioState extends ConversationState {
  // Actions
  startConversation: (campaignId: string) => Promise<void>;
  sendMessage: (content: string, files?: File[], googleDocUrl?: string) => Promise<void>;
  advancePhase: () => Promise<void>;
  setPhase: (phase: CampaignPhase) => void;
  regenerateContent: (contentId: string) => Promise<void>;
  editContent: (contentId: string, updates: Partial<ContentBlock['data']>) => void;
  addContent: (content: ContentBlock) => void;
  clearConversation: () => void;
  setError: (error: string | null) => void;
  // New actions for persistence and images
  saveContent: () => Promise<boolean>;
  generateImage: (contentId: string) => Promise<string | null>;
  loadContent: () => Promise<void>;
  // Import functionality
  importFromJson: (data: CampaignExportData, campaignId: string) => void;
}

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:4003';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
  isSaving: false,
  lastSavedAt: null,
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

  // Send a message to Claude (with optional files and Google Docs URL)
  sendMessage: async (content: string, files?: File[], googleDocUrl?: string) => {
    const { id, messages } = get();
    const token = getAuthToken();

    if (!token) {
      set({ error: 'Not authenticated' });
      return;
    }

    if (!id) {
      set({ error: 'No active conversation' });
      return;
    }

    // Build display message for user
    let displayContent = content;
    if (files && files.length > 0) {
      const fileNames = files.map(f => f.name).join(', ');
      displayContent = content
        ? `${content}\n\n📎 Attached: ${fileNames}`
        : `📎 Attached: ${fileNames}`;
    }
    if (googleDocUrl) {
      displayContent = displayContent
        ? `${displayContent}\n\n📄 Google Doc: ${googleDocUrl}`
        : `📄 Google Doc: ${googleDocUrl}`;
    }

    // Add user message immediately
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: displayContent,
      timestamp: new Date(),
    };

    set({
      messages: [...messages, userMessage],
      isGenerating: true,
      error: null,
    });

    try {
      let response: Response;

      // Use FormData if files are present, otherwise use JSON
      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append('message', content);
        if (googleDocUrl) {
          formData.append('googleDocUrl', googleDocUrl);
        }
        files.forEach((file) => {
          formData.append('files', file);
        });

        response = await fetch(`${AI_SERVICE_URL}/ai/conversation/${id}/message`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - browser will set multipart boundary
          },
          body: formData,
        });
      } else {
        response = await fetch(`${AI_SERVICE_URL}/ai/conversation/${id}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: content, googleDocUrl }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();

      // Process generated content from AI - it now comes with type and data
      const newContent: ContentBlock[] = (data.generatedContent || []).map(
        (item: { id?: string; type: string; data: Record<string, unknown>; createdAt?: string }) => ({
          id: item.id || `content_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: item.type as ContentBlock['type'],
          data: item.data as unknown as ContentBlock['data'],
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        })
      );

      // Add assistant response
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_response`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        generatedContent: newContent,
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        generatedContent: [...state.generatedContent, ...newContent],
        isGenerating: false,
      }));

      // Auto-generate images for settings, NPCs and locations that don't have images
      const contentNeedingImages = newContent.filter((c) => {
        if (c.type === 'setting') {
          const settingData = c.data as SettingData;
          return !settingData.imageUrl;
        }
        if (c.type === 'npc') {
          const npcData = c.data as NPCData;
          return !npcData.portraitUrl;
        }
        if (c.type === 'location') {
          const locData = c.data as LocationData & { imageUrl?: string };
          return !locData.imageUrl;
        }
        return false;
      });

      // Generate images in the background (don't await - let them complete async)
      if (contentNeedingImages.length > 0) {
        // Small delay to let the UI update first
        setTimeout(() => {
          contentNeedingImages.forEach((content) => {
            get().generateImage(content.id).catch((err) => {
              // Log error but don't fail the whole operation
              console.warn(`[CampaignStudio] Auto-image generation failed for ${content.id}:`, err);
            });
          });
        }, 500);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      set({ error: message, isGenerating: false });
    }
  },

  // Advance to the next phase
  advancePhase: async () => {
    const { id, currentPhase } = get();
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

  // Add new content
  addContent: (content: ContentBlock) => {
    set((state) => ({
      generatedContent: [...state.generatedContent, content],
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
      isSaving: false,
      lastSavedAt: null,
      error: null,
    });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },

  // Save all generated content to database
  saveContent: async () => {
    const { campaignId, generatedContent } = get();
    const token = getAuthToken();

    if (!token) {
      set({ error: 'Not authenticated' });
      return false;
    }

    if (!campaignId) {
      set({ error: 'No campaign selected' });
      return false;
    }

    if (generatedContent.length === 0) {
      // Nothing to save
      return true;
    }

    set({ isSaving: true, error: null });

    try {
      // Organize content by type
      const setting = generatedContent.find((c) => c.type === 'setting')?.data as SettingData | undefined;
      const locations = generatedContent
        .filter((c) => c.type === 'location')
        .map((c) => c.data as LocationData);
      const npcs = generatedContent
        .filter((c) => c.type === 'npc')
        .map((c) => c.data as NPCData);
      const encounters = generatedContent
        .filter((c) => c.type === 'encounter')
        .map((c) => c.data as EncounterData);
      const quests = generatedContent
        .filter((c) => c.type === 'quest')
        .map((c) => c.data as QuestData);

      const url = `${API_URL}/campaign-studio/${campaignId}/save`;
      console.log('[CampaignStudio] Saving to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          setting,
          locations,
          npcs,
          encounters,
          quests,
        }),
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('[CampaignStudio] Non-JSON response:', text.substring(0, 200));
        throw new Error(
          `API returned non-JSON response (${response.status}). ` +
          `Make sure the API server is running at ${API_URL}`
        );
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save content');
      }

      set({ isSaving: false, lastSavedAt: new Date() });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save content';
      console.error('[CampaignStudio] Save error:', message);
      set({ error: message, isSaving: false });
      return false;
    }
  },

  // Generate an image for a specific content item
  generateImage: async (contentId: string) => {
    const { campaignId, generatedContent } = get();
    const token = getAuthToken();

    if (!token || !campaignId) {
      set({ error: 'Not authenticated or no campaign' });
      return null;
    }

    const content = generatedContent.find((c) => c.id === contentId);
    if (!content) {
      set({ error: 'Content not found' });
      return null;
    }

    try {
      let requestBody: Record<string, string | undefined>;

      if (content.type === 'setting') {
        const settingData = content.data as SettingData;
        requestBody = {
          type: 'location', // Use location type for API, but build a setting-appropriate prompt
          name: settingData.name,
          description: settingData.description,
          locationType: 'world', // Special type for campaign settings
        };
      } else if (content.type === 'npc') {
        const npcData = content.data as NPCData;
        requestBody = {
          type: 'npc',
          name: npcData.name,
          description: npcData.description,
          race: npcData.race,
          class: npcData.class,
          role: npcData.role,
        };
      } else if (content.type === 'location') {
        const locationData = content.data as LocationData;
        requestBody = {
          type: 'location',
          name: locationData.name,
          description: locationData.description,
          locationType: locationData.type,
        };
      } else {
        set({ error: 'Image generation only supported for settings, NPCs and locations' });
        return null;
      }

      const url = `${API_URL}/campaign-studio/${campaignId}/generate-image`;
      console.log('[CampaignStudio] Generating image at:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('[CampaignStudio] Non-JSON response from generate-image:', text.substring(0, 200));
        throw new Error(
          `Cannot connect to API server. Please ensure NEXT_PUBLIC_API_URL is configured correctly. ` +
          `Current URL: ${API_URL}`
        );
      }

      // Safely parse JSON response
      let data: { imageUrl?: string; error?: string };
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[CampaignStudio] Failed to parse JSON response:', parseError);
        throw new Error('Invalid response from server. The API may be unavailable.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      const imageUrl = data.imageUrl;
      if (!imageUrl) {
        throw new Error('No image URL returned from server');
      }

      // Update the content with the new image URL
      set((state) => ({
        generatedContent: state.generatedContent.map((c) => {
          if (c.id !== contentId) return c;

          if (c.type === 'setting') {
            return {
              ...c,
              data: { ...(c.data as SettingData), imageUrl: imageUrl },
            };
          } else if (c.type === 'npc') {
            return {
              ...c,
              data: { ...(c.data as NPCData), portraitUrl: imageUrl },
            };
          } else if (c.type === 'location') {
            return {
              ...c,
              data: { ...(c.data as LocationData), imageUrl: imageUrl },
            };
          }
          return c;
        }),
      }));

      return imageUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate image';
      set({ error: message });
      return null;
    }
  },

  // Load saved content from database
  loadContent: async () => {
    const { campaignId } = get();
    const token = getAuthToken();

    if (!token || !campaignId) {
      return;
    }

    set({ isGenerating: true, error: null });

    try {
      const url = `${API_URL}/campaign-studio/${campaignId}/content`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.error('[CampaignStudio] Non-JSON response from load content');
        throw new Error(`API server not responding correctly at ${API_URL}`);
      }

      if (!response.ok) {
        if (response.status === 404) {
          // No saved content yet, that's OK
          set({ isGenerating: false });
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load content');
      }

      const data = await response.json();
      const content = data.content;

      // Convert loaded content to ContentBlocks
      const loadedContent: ContentBlock[] = [];

      // Add setting if present
      if (content.setting && content.setting.name) {
        loadedContent.push({
          id: `setting_${Date.now()}`,
          type: 'setting',
          data: content.setting,
          createdAt: new Date(),
        });
      }

      // Add locations
      for (const location of content.locations || []) {
        loadedContent.push({
          id: location.id || `location_${Date.now()}_${Math.random()}`,
          type: 'location',
          data: location,
          createdAt: new Date(),
        });
      }

      // Add NPCs
      for (const npc of content.npcs || []) {
        loadedContent.push({
          id: npc.id || `npc_${Date.now()}_${Math.random()}`,
          type: 'npc',
          data: npc,
          createdAt: new Date(),
        });
      }

      // Add encounters
      for (const encounter of content.encounters || []) {
        loadedContent.push({
          id: encounter.id || `encounter_${Date.now()}_${Math.random()}`,
          type: 'encounter',
          data: encounter,
          createdAt: new Date(),
        });
      }

      // Add quests
      for (const quest of content.quests || []) {
        loadedContent.push({
          id: quest.id || `quest_${Date.now()}_${Math.random()}`,
          type: 'quest',
          data: quest,
          createdAt: new Date(),
        });
      }

      set({
        generatedContent: loadedContent,
        isGenerating: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load content';
      set({ error: message, isGenerating: false });
    }
  },

  // Import from exported JSON file
  importFromJson: (data: CampaignExportData, campaignId: string) => {
    try {
      // Validate the import data structure
      if (!data.content || !Array.isArray(data.content)) {
        throw new Error('Invalid import data: missing content array');
      }

      // Convert imported content to ContentBlocks
      const importedContent: ContentBlock[] = data.content.map((item) => ({
        id: item.id || `imported_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: item.type as ContentBlock['type'],
        data: item.data as unknown as ContentBlock['data'],
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      }));

      // Convert imported chat history to Messages
      const importedMessages: Message[] = (data.chatHistory || []).map((msg) => ({
        id: msg.id || `imported_msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      }));

      // Determine the current phase based on content
      let currentPhase: CampaignPhase = 'setting';
      const completedPhases: CampaignPhase[] = [];

      // Check which phases have content
      const hasSettings = importedContent.some((c) => c.type === 'setting');
      const hasLocations = importedContent.some((c) => c.type === 'location');
      const hasNpcs = importedContent.some((c) => c.type === 'npc');
      const hasEncounters = importedContent.some((c) => c.type === 'encounter');
      const hasQuests = importedContent.some((c) => c.type === 'quest');

      if (hasSettings) {
        completedPhases.push('setting');
        currentPhase = 'story';
      }
      if (hasLocations) {
        completedPhases.push('story', 'locations');
        currentPhase = 'npcs';
      }
      if (hasNpcs) {
        if (!completedPhases.includes('npcs')) completedPhases.push('npcs');
        currentPhase = 'encounters';
      }
      if (hasEncounters) {
        if (!completedPhases.includes('encounters')) completedPhases.push('encounters');
        currentPhase = 'quests';
      }
      if (hasQuests) {
        if (!completedPhases.includes('quests')) completedPhases.push('quests');
      }

      // Generate a conversation ID for the imported session
      const conversationId = `imported_${Date.now()}`;

      // Add a system message indicating import
      const importMessage: Message = {
        id: `msg_import_${Date.now()}`,
        role: 'assistant',
        content: `📦 **Campaign Imported Successfully!**

I've restored your campaign "${data.name}" from the exported file (exported on ${new Date(data.exportedAt).toLocaleDateString()}).

**Restored:**
- ${importedContent.length} content items
- ${importedMessages.length} chat messages

You can continue building your campaign from where you left off. All your previous work has been preserved!`,
        timestamp: new Date(),
      };

      // Combine imported messages with the import notification
      const allMessages = [...importedMessages, importMessage];

      set({
        id: conversationId,
        campaignId,
        currentPhase,
        completedPhases: [...new Set(completedPhases)], // Remove duplicates
        messages: allMessages,
        generatedContent: importedContent,
        isGenerating: false,
        isSaving: false,
        lastSavedAt: null,
        error: null,
      });

      console.log('[CampaignStudio] Imported campaign:', {
        name: data.name,
        contentCount: importedContent.length,
        messageCount: importedMessages.length,
        currentPhase,
        completedPhases,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import campaign';
      console.error('[CampaignStudio] Import error:', message);
      set({ error: message });
    }
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
