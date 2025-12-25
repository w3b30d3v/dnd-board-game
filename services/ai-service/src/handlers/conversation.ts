// Conversation Handler
// Manages the stateful conversation for campaign creation
// Uses PostgreSQL for persistence with in-memory caching for performance

import { v4 as uuidv4 } from 'uuid';
import { chat, ConversationMessage, estimateCost } from '../lib/claude.js';
import { getPhasePrompt, extractCampaignContent, checkContentSafety } from '../prompts/campaignStudio.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/db.js';

// Conversation phases
export type ConversationPhase = 'setting' | 'story' | 'locations' | 'npcs' | 'encounters' | 'quests';

// Content block type
export interface GeneratedContentBlock {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

// Conversation state
export interface ConversationState {
  id: string;
  campaignId: string;
  userId: string;
  phase: ConversationPhase;
  messages: ConversationMessage[];
  generatedContent: GeneratedContentBlock[];
  totalCost: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory cache for active conversations (fast access during session)
const conversationCache = new Map<string, ConversationState>();

// Helper to convert DB record to ConversationState
function dbToState(record: {
  id: string;
  campaignId: string | null;
  userId: string;
  phase: string;
  messages: unknown;
  generatedContent: unknown;
  totalCost: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}): ConversationState {
  return {
    id: record.id,
    campaignId: record.campaignId || '',
    userId: record.userId,
    phase: record.phase as ConversationPhase,
    messages: (record.messages as ConversationMessage[]) || [],
    generatedContent: (record.generatedContent as GeneratedContentBlock[]) || [],
    totalCost: record.totalCost,
    title: record.title,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

// Helper to persist state to database
async function persistState(state: ConversationState): Promise<void> {
  try {
    await prisma.campaignConversation.upsert({
      where: { id: state.id },
      update: {
        phase: state.phase,
        messages: state.messages as unknown as object,
        generatedContent: state.generatedContent as unknown as object,
        totalCost: state.totalCost,
        title: state.title,
        updatedAt: new Date(),
      },
      create: {
        id: state.id,
        userId: state.userId,
        campaignId: state.campaignId || null,
        phase: state.phase,
        messages: state.messages as unknown as object,
        generatedContent: state.generatedContent as unknown as object,
        totalCost: state.totalCost,
        title: state.title,
      },
    });
    logger.debug({ conversationId: state.id }, 'Conversation persisted to database');
  } catch (error) {
    logger.error({ error, conversationId: state.id }, 'Failed to persist conversation');
    // Don't throw - allow in-memory operation to continue
  }
}

// Start a new conversation
export async function startConversation(userId: string, campaignId: string, title?: string): Promise<ConversationState> {
  const id = uuidv4();

  const state: ConversationState = {
    id,
    campaignId,
    userId,
    phase: 'setting',
    messages: [],
    generatedContent: [],
    totalCost: 0,
    title: title || 'New Campaign',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Cache and persist
  conversationCache.set(id, state);
  await persistState(state);

  logger.info({ conversationId: id, userId, campaignId }, 'Started new conversation');

  return state;
}

// Get conversation by ID (from cache or database)
export async function getConversation(id: string): Promise<ConversationState | undefined> {
  // Check cache first
  const cached = conversationCache.get(id);
  if (cached) {
    return cached;
  }

  // Load from database
  try {
    const record = await prisma.campaignConversation.findUnique({
      where: { id },
    });

    if (record) {
      const state = dbToState(record);
      conversationCache.set(id, state); // Cache for subsequent access
      return state;
    }
  } catch (error) {
    logger.error({ error, conversationId: id }, 'Failed to load conversation from database');
  }

  return undefined;
}

// Get conversation by campaign ID (for resuming)
export async function getConversationByCampaignId(campaignId: string, userId: string): Promise<ConversationState | undefined> {
  // Check cache first
  for (const state of conversationCache.values()) {
    if (state.campaignId === campaignId && state.userId === userId) {
      return state;
    }
  }

  // Load from database
  try {
    const record = await prisma.campaignConversation.findFirst({
      where: { campaignId, userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (record) {
      const state = dbToState(record);
      conversationCache.set(state.id, state);
      return state;
    }
  } catch (error) {
    logger.error({ error, campaignId, userId }, 'Failed to load conversation by campaign');
  }

  return undefined;
}

// Get all conversations for a user
export async function getUserConversations(userId: string): Promise<ConversationState[]> {
  try {
    const records = await prisma.campaignConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return records.map(dbToState);
  } catch (error) {
    logger.error({ error, userId }, 'Failed to load user conversations');
    return [];
  }
}

// Send a message and get Claude's response
export async function sendMessage(
  conversationId: string,
  userMessage: string
): Promise<{
  response: string;
  phase: ConversationPhase;
  cost: number;
  generatedContent: GeneratedContentBlock[];
}> {
  const state = await getConversation(conversationId);
  if (!state) {
    throw new Error('Conversation not found');
  }

  // Content safety check on user input
  const userSafety = checkContentSafety(userMessage);
  if (!userSafety.safe) {
    logger.warn({ conversationId, issues: userSafety.issues }, 'User message flagged for content safety');
    // We still proceed but log it - Claude will handle appropriately
  }

  // Add user message to history
  state.messages.push({
    role: 'user',
    content: userMessage,
  });

  // Get system prompt for current phase
  const systemPrompt = getPhasePrompt(state.phase);

  // Get Claude's response
  const response = await chat(systemPrompt, state.messages, {
    maxTokens: 2048,
    temperature: 0.7,
  });

  // Content safety check on response
  const responseSafety = checkContentSafety(response.content);
  if (!responseSafety.safe) {
    logger.warn({ conversationId, issues: responseSafety.issues }, 'Response flagged for content safety');
    // In production, you might want to regenerate or filter
  }

  // Add assistant response to history
  state.messages.push({
    role: 'assistant',
    content: response.content,
  });

  // Extract any generated content from the response
  const extractedContent = extractCampaignContent(response.content);
  const newContent: GeneratedContentBlock[] = [];

  for (const item of extractedContent) {
    const contentBlock: GeneratedContentBlock = {
      id: `${item.type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: item.type,
      data: item.data,
      createdAt: new Date(),
    };
    state.generatedContent.push(contentBlock);
    newContent.push(contentBlock);
  }

  // Calculate cost
  const cost = estimateCost(response.usage, 'chat');
  state.totalCost += cost;
  state.updatedAt = new Date();

  // Persist to database
  await persistState(state);

  logger.debug(
    {
      conversationId,
      phase: state.phase,
      messageCount: state.messages.length,
      contentCount: newContent.length,
      cost,
    },
    'Message processed'
  );

  return {
    response: response.content,
    phase: state.phase,
    cost,
    generatedContent: newContent,
  };
}

// Advance to the next phase
export async function advancePhase(conversationId: string): Promise<ConversationPhase> {
  const state = await getConversation(conversationId);
  if (!state) {
    throw new Error('Conversation not found');
  }

  const phaseOrder: ConversationPhase[] = ['setting', 'story', 'locations', 'npcs', 'encounters', 'quests'];
  const currentIndex = phaseOrder.indexOf(state.phase);

  if (currentIndex < phaseOrder.length - 1) {
    state.phase = phaseOrder[currentIndex + 1];
    state.updatedAt = new Date();
    await persistState(state);
    logger.info({ conversationId, newPhase: state.phase }, 'Advanced to next phase');
  }

  return state.phase;
}

// Set specific phase
export async function setPhase(conversationId: string, phase: ConversationPhase): Promise<void> {
  const state = await getConversation(conversationId);
  if (!state) {
    throw new Error('Conversation not found');
  }

  state.phase = phase;
  state.updatedAt = new Date();
  await persistState(state);
  logger.info({ conversationId, phase }, 'Phase set');
}

// Store generated content manually
export async function storeContent(
  conversationId: string,
  type: string,
  data: Record<string, unknown>
): Promise<GeneratedContentBlock> {
  const state = await getConversation(conversationId);
  if (!state) {
    throw new Error('Conversation not found');
  }

  const contentBlock: GeneratedContentBlock = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    data,
    createdAt: new Date(),
  };

  state.generatedContent.push(contentBlock);
  state.updatedAt = new Date();
  await persistState(state);
  logger.info({ conversationId, type }, 'Content stored');

  return contentBlock;
}

// Get all generated content
export async function getGeneratedContent(conversationId: string): Promise<GeneratedContentBlock[]> {
  const state = await getConversation(conversationId);
  return state?.generatedContent || [];
}

// Get conversation history
export async function getHistory(conversationId: string): Promise<ConversationMessage[]> {
  const state = await getConversation(conversationId);
  return state?.messages || [];
}

// Delete conversation
export async function deleteConversation(conversationId: string): Promise<boolean> {
  conversationCache.delete(conversationId);

  try {
    await prisma.campaignConversation.delete({
      where: { id: conversationId },
    });
    logger.info({ conversationId }, 'Conversation deleted');
    return true;
  } catch (error) {
    logger.error({ error, conversationId }, 'Failed to delete conversation');
    return false;
  }
}

// Get total cost for a conversation
export async function getTotalCost(conversationId: string): Promise<number> {
  const state = await getConversation(conversationId);
  return state?.totalCost || 0;
}

// Export full conversation state for saving
export async function exportConversation(conversationId: string): Promise<ConversationState | null> {
  const state = await getConversation(conversationId);
  if (!state) return null;

  return {
    ...state,
    messages: [...state.messages],
    generatedContent: [...state.generatedContent],
  };
}

// Import conversation state (for resuming)
export async function importConversation(state: ConversationState): Promise<void> {
  conversationCache.set(state.id, {
    ...state,
    messages: [...state.messages],
    generatedContent: [...state.generatedContent],
  });
  await persistState(state);
  logger.info({ conversationId: state.id }, 'Conversation imported');
}

// Update conversation title
export async function updateTitle(conversationId: string, title: string): Promise<void> {
  const state = await getConversation(conversationId);
  if (!state) {
    throw new Error('Conversation not found');
  }

  state.title = title;
  state.updatedAt = new Date();
  await persistState(state);
  logger.info({ conversationId, title }, 'Conversation title updated');
}
