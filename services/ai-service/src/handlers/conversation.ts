// Conversation Handler
// Manages the stateful conversation for campaign creation

import { v4 as uuidv4 } from 'uuid';
import { chat, ConversationMessage, estimateCost } from '../lib/claude.js';
import { getPhasePrompt, extractCampaignContent, checkContentSafety } from '../prompts/campaignStudio.js';
import { logger } from '../lib/logger.js';

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
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store (will be replaced with Redis/PostgreSQL for persistence)
const conversations = new Map<string, ConversationState>();

// Start a new conversation
export function startConversation(userId: string, campaignId: string): ConversationState {
  const id = uuidv4();

  const state: ConversationState = {
    id,
    campaignId,
    userId,
    phase: 'setting',
    messages: [],
    generatedContent: [],
    totalCost: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  conversations.set(id, state);
  logger.info({ conversationId: id, userId, campaignId }, 'Started new conversation');

  return state;
}

// Get conversation by ID
export function getConversation(id: string): ConversationState | undefined {
  return conversations.get(id);
}

// Get conversation by campaign ID (for resuming)
export function getConversationByCampaignId(campaignId: string, userId: string): ConversationState | undefined {
  for (const state of conversations.values()) {
    if (state.campaignId === campaignId && state.userId === userId) {
      return state;
    }
  }
  return undefined;
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
  const state = conversations.get(conversationId);
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
export function advancePhase(conversationId: string): ConversationPhase {
  const state = conversations.get(conversationId);
  if (!state) {
    throw new Error('Conversation not found');
  }

  const phaseOrder: ConversationPhase[] = ['setting', 'story', 'locations', 'npcs', 'encounters', 'quests'];
  const currentIndex = phaseOrder.indexOf(state.phase);

  if (currentIndex < phaseOrder.length - 1) {
    state.phase = phaseOrder[currentIndex + 1];
    state.updatedAt = new Date();
    logger.info({ conversationId, newPhase: state.phase }, 'Advanced to next phase');
  }

  return state.phase;
}

// Set specific phase
export function setPhase(conversationId: string, phase: ConversationPhase): void {
  const state = conversations.get(conversationId);
  if (!state) {
    throw new Error('Conversation not found');
  }

  state.phase = phase;
  state.updatedAt = new Date();
  logger.info({ conversationId, phase }, 'Phase set');
}

// Store generated content manually
export function storeContent(
  conversationId: string,
  type: string,
  data: Record<string, unknown>
): GeneratedContentBlock {
  const state = conversations.get(conversationId);
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
  logger.info({ conversationId, type }, 'Content stored');

  return contentBlock;
}

// Get all generated content
export function getGeneratedContent(conversationId: string): GeneratedContentBlock[] {
  const state = conversations.get(conversationId);
  return state?.generatedContent || [];
}

// Get conversation history
export function getHistory(conversationId: string): ConversationMessage[] {
  const state = conversations.get(conversationId);
  return state?.messages || [];
}

// Delete conversation
export function deleteConversation(conversationId: string): boolean {
  return conversations.delete(conversationId);
}

// Get total cost for a conversation
export function getTotalCost(conversationId: string): number {
  const state = conversations.get(conversationId);
  return state?.totalCost || 0;
}

// Export full conversation state for saving
export function exportConversation(conversationId: string): ConversationState | null {
  const state = conversations.get(conversationId);
  if (!state) return null;

  return {
    ...state,
    messages: [...state.messages],
    generatedContent: [...state.generatedContent],
  };
}

// Import conversation state (for resuming)
export function importConversation(state: ConversationState): void {
  conversations.set(state.id, {
    ...state,
    messages: [...state.messages],
    generatedContent: [...state.generatedContent],
  });
  logger.info({ conversationId: state.id }, 'Conversation imported');
}
