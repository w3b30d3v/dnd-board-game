// Conversation Routes
// API endpoints for the Campaign Studio chat interface

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import {
  startConversation,
  getConversation,
  getConversationByCampaignId,
  sendMessage,
  advancePhase,
  setPhase,
  getHistory,
  getTotalCost,
  deleteConversation,
  getGeneratedContent,
  exportConversation,
  importConversation,
  ConversationPhase,
  ConversationState,
} from '../handlers/conversation.js';
import { logger } from '../lib/logger.js';

const router: RouterType = Router();

// Validation schemas
// Accept either a UUID or a temporary campaign ID (temp_timestamp format)
const startSchema = z.object({
  campaignId: z.string().min(1).max(100),
});

const messageSchema = z.object({
  message: z.string().min(1).max(10000),
});

const phaseSchema = z.object({
  phase: z.enum(['setting', 'story', 'locations', 'npcs', 'encounters', 'quests']),
});

// Start a new conversation
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { campaignId } = startSchema.parse(req.body);
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const state = startConversation(userId, campaignId);

    // Send initial greeting
    const greeting = `Welcome to the Campaign Studio! I'm here to help you create an amazing D&D campaign.

Let's start with your setting. Tell me about the world you want to create:
- What's the tone? (heroic adventure, dark and gritty, horror, comedic?)
- What time period or aesthetic? (medieval, renaissance, ancient?)
- Any particular themes or inspirations?

Just share your ideas naturally, and I'll help bring them to life!`;

    res.json({
      conversationId: state.id,
      phase: state.phase,
      message: greeting,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to start conversation');
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// Send a message
router.post('/:conversationId/message', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { message } = messageSchema.parse(req.body);

    const conversation = getConversation(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const result = await sendMessage(conversationId, message);

    res.json({
      response: result.response,
      phase: result.phase,
      cost: result.cost,
      totalCost: getTotalCost(conversationId),
      // Return any generated content blocks from this response
      generatedContent: result.generatedContent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to process message');
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get conversation history
router.get('/:conversationId/history', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const conversation = getConversation(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const history = getHistory(conversationId);

    res.json({
      conversationId,
      phase: conversation.phase,
      messages: history,
      totalCost: getTotalCost(conversationId),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get history');
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// Advance to next phase
router.post('/:conversationId/advance', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const conversation = getConversation(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const newPhase = advancePhase(conversationId);

    const phaseMessages: Record<ConversationPhase, string> = {
      setting: "Let's establish your campaign setting!",
      story: "Great! Now let's develop your main story arc. What's the central conflict?",
      locations: "Now let's create some memorable locations for your adventure!",
      npcs: "Time to populate your world with interesting characters!",
      encounters: "Let's design some exciting encounters for your players!",
      quests: "Finally, let's structure the quests that will guide your players!",
    };

    res.json({
      phase: newPhase,
      message: phaseMessages[newPhase],
    });
  } catch (error) {
    logger.error({ error }, 'Failed to advance phase');
    res.status(500).json({ error: 'Failed to advance phase' });
  }
});

// Set specific phase
router.post('/:conversationId/phase', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { phase } = phaseSchema.parse(req.body);

    const conversation = getConversation(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    setPhase(conversationId, phase);

    res.json({
      phase,
      message: `Switched to ${phase} phase.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to set phase');
    res.status(500).json({ error: 'Failed to set phase' });
  }
});

// Delete conversation
router.delete('/:conversationId', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const deleted = deleteConversation(conversationId);

    if (!deleted) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Failed to delete conversation');
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Resume an existing conversation for a campaign
router.post('/resume', (req: Request, res: Response) => {
  try {
    const { campaignId } = startSchema.parse(req.body);
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Try to find existing conversation
    const existing = getConversationByCampaignId(campaignId, userId);

    if (existing) {
      res.json({
        conversationId: existing.id,
        phase: existing.phase,
        messages: existing.messages,
        generatedContent: existing.generatedContent,
        totalCost: existing.totalCost,
        resumed: true,
      });
    } else {
      // No existing conversation, create new one
      const state = startConversation(userId, campaignId);

      const greeting = `Welcome to the Campaign Studio! I'm here to help you create an amazing D&D campaign.

Let's start with your setting. Tell me about the world you want to create:
- What's the tone? (heroic adventure, dark and gritty, horror, comedic?)
- What time period or aesthetic? (medieval, renaissance, ancient?)
- Any particular themes or inspirations?

Just share your ideas naturally, and I'll help bring them to life!`;

      res.json({
        conversationId: state.id,
        phase: state.phase,
        messages: [],
        generatedContent: [],
        message: greeting,
        resumed: false,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to resume conversation');
    res.status(500).json({ error: 'Failed to resume conversation' });
  }
});

// Get all generated content for a conversation
router.get('/:conversationId/content', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const conversation = getConversation(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({
      conversationId,
      generatedContent: getGeneratedContent(conversationId),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get content');
    res.status(500).json({ error: 'Failed to get content' });
  }
});

// Export full conversation state (for saving to database or downloading)
router.get('/:conversationId/export', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const state = exportConversation(conversationId);
    if (!state) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({
      exportedAt: new Date().toISOString(),
      version: '1.0',
      conversation: state,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to export conversation');
    res.status(500).json({ error: 'Failed to export conversation' });
  }
});

// Import conversation state (for resuming from database or file)
router.post('/import', (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { conversation } = req.body as { conversation: ConversationState };

    if (!conversation || !conversation.id || !conversation.campaignId) {
      res.status(400).json({ error: 'Invalid conversation state' });
      return;
    }

    // Verify ownership
    if (conversation.userId !== userId) {
      res.status(403).json({ error: 'Cannot import conversation from another user' });
      return;
    }

    importConversation(conversation);

    res.json({
      success: true,
      conversationId: conversation.id,
      phase: conversation.phase,
      messageCount: conversation.messages.length,
      contentCount: conversation.generatedContent.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to import conversation');
    res.status(500).json({ error: 'Failed to import conversation' });
  }
});

export default router;
