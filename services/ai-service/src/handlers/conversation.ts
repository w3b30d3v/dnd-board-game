// Conversation Handler
// Manages the stateful conversation for campaign creation

import { v4 as uuidv4 } from 'uuid';
import { chat, ConversationMessage, estimateCost } from '../lib/claude.js';
import { getPhasePrompt } from '../prompts/campaignStudio.js';
import { logger } from '../lib/logger.js';

// Conversation phases
export type ConversationPhase = 'setting' | 'story' | 'locations' | 'npcs' | 'encounters' | 'quests';

// Conversation state
export interface ConversationState {
  id: string;
  campaignId: string;
  userId: string;
  phase: ConversationPhase;
  messages: ConversationMessage[];
  generatedContent: {
    setting?: object;
    npcs: object[];
    encounters: object[];
    quests: object[];
    maps: object[];
  };
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store (will be replaced with Redis)
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
    generatedContent: {
      npcs: [],
      encounters: [],
      quests: [],
      maps: [],
    },
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

// Send a message and get Claude's response
export async function sendMessage(
  conversationId: string,
  userMessage: string
): Promise<{
  response: string;
  phase: ConversationPhase;
  cost: number;
}> {
  const state = conversations.get(conversationId);
  if (!state) {
    throw new Error('Conversation not found');
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

  // Add assistant response to history
  state.messages.push({
    role: 'assistant',
    content: response.content,
  });

  // Calculate cost
  const cost = estimateCost(response.usage, 'chat');
  state.totalCost += cost;
  state.updatedAt = new Date();

  logger.debug(
    {
      conversationId,
      phase: state.phase,
      messageCount: state.messages.length,
      cost,
    },
    'Message processed'
  );

  return {
    response: response.content,
    phase: state.phase,
    cost,
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

// Store generated content
export function storeContent(
  conversationId: string,
  contentType: 'setting' | 'npcs' | 'encounters' | 'quests' | 'maps',
  content: object
): void {
  const state = conversations.get(conversationId);
  if (!state) {
    throw new Error('Conversation not found');
  }

  if (contentType === 'setting') {
    state.generatedContent.setting = content;
  } else {
    (state.generatedContent[contentType] as object[]).push(content);
  }

  state.updatedAt = new Date();
  logger.info({ conversationId, contentType }, 'Content stored');
}

// Get all generated content
export function getGeneratedContent(conversationId: string): ConversationState['generatedContent'] | undefined {
  const state = conversations.get(conversationId);
  return state?.generatedContent;
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
