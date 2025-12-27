// Conversation Routes
// API endpoints for the Campaign Studio chat interface

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import multer from 'multer';
import {
  startConversation,
  getConversation,
  getConversationByCampaignId,
  getUserConversations,
  sendMessage,
  advancePhase,
  setPhase,
  getHistory,
  getTotalCost,
  deleteConversation,
  getGeneratedContent,
  exportConversation,
  importConversation,
  updateTitle,
  ConversationPhase,
  ConversationState,
} from '../handlers/conversation.js';
import { logger } from '../lib/logger.js';

const router: RouterType = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5, // Max 5 files at once
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// Helper to extract text from uploaded files
async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const { mimetype, buffer, originalname } = file;

  try {
    if (mimetype === 'application/pdf') {
      // Dynamic import for pdf-parse (ESM compatibility)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule = await import('pdf-parse') as any;
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const data = await pdfParse(buffer);
      return `[Content from PDF: ${originalname}]\n${data.text}`;
    } else if (mimetype === 'text/plain') {
      return `[Content from file: ${originalname}]\n${buffer.toString('utf-8')}`;
    } else if (
      mimetype === 'application/msword' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // For DOC/DOCX, we'll just note we received it
      // Full DOCX parsing would require mammoth or similar
      return `[Document uploaded: ${originalname}]\n(Note: DOC/DOCX content extraction requires additional processing. The file has been received.)`;
    }
    return `[File uploaded: ${originalname}]`;
  } catch (error) {
    logger.error({ error, filename: originalname }, 'Failed to extract text from file');
    return `[Failed to extract content from: ${originalname}]`;
  }
}

// Helper to fetch Google Doc content
async function fetchGoogleDocContent(url: string): Promise<string> {
  try {
    // Extract document ID from URL
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      return '[Invalid Google Docs URL]';
    }

    const docId = match[1];
    // Use the export URL for plain text
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

    const response = await fetch(exportUrl);
    if (!response.ok) {
      if (response.status === 403 || response.status === 404) {
        return '[Google Doc not accessible. Make sure the document is shared as "Anyone with the link can view"]';
      }
      return `[Failed to fetch Google Doc: ${response.statusText}]`;
    }

    const text = await response.text();
    return `[Content from Google Doc]\n${text}`;
  } catch (error) {
    logger.error({ error, url }, 'Failed to fetch Google Doc');
    return '[Failed to fetch Google Doc content]';
  }
}

// Validation schemas
// Accept either a UUID or a temporary campaign ID (temp_timestamp format)
const startSchema = z.object({
  campaignId: z.string().min(1).max(100),
  title: z.string().min(1).max(200).optional(),
});

const messageSchema = z.object({
  message: z.string().min(1).max(10000),
});

const phaseSchema = z.object({
  phase: z.enum(['setting', 'story', 'locations', 'npcs', 'encounters', 'quests']),
});

const titleSchema = z.object({
  title: z.string().min(1).max(200),
});

// Start a new conversation
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { campaignId, title } = startSchema.parse(req.body);
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const state = await startConversation(userId, campaignId, title);

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

// Get all conversations for the current user
router.get('/list', async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const conversations = await getUserConversations(userId);

    res.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        campaignId: c.campaignId,
        title: c.title,
        phase: c.phase,
        messageCount: c.messages.length,
        contentCount: c.generatedContent.length,
        totalCost: c.totalCost,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to list conversations');
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

// Send a message (supports file uploads and Google Docs URLs)
router.post(
  '/:conversationId/message',
  upload.array('files', 5),
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;

      // Get message from body (works for both JSON and FormData)
      let message = req.body.message || '';
      const googleDocUrl = req.body.googleDocUrl;
      const files = req.files as Express.Multer.File[] | undefined;

      // Validate that we have at least some content
      if (!message && (!files || files.length === 0) && !googleDocUrl) {
        res.status(400).json({ error: 'Message, files, or Google Doc URL required' });
        return;
      }

      const conversation = await getConversation(conversationId);
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      // Build the full message content including file contents
      const contentParts: string[] = [];

      // Add user's text message if present
      if (message.trim()) {
        contentParts.push(message.trim());
      }

      // Extract and add file contents
      if (files && files.length > 0) {
        logger.info({ fileCount: files.length }, 'Processing uploaded files');

        for (const file of files) {
          const extractedText = await extractTextFromFile(file);
          contentParts.push(extractedText);
        }
      }

      // Fetch and add Google Doc content
      if (googleDocUrl) {
        logger.info({ url: googleDocUrl }, 'Fetching Google Doc content');
        const docContent = await fetchGoogleDocContent(googleDocUrl);
        contentParts.push(docContent);
      }

      // Combine all content
      const fullMessage = contentParts.join('\n\n---\n\n');

      // If we have document content, add context for the AI
      let contextualMessage = fullMessage;
      if ((files && files.length > 0) || googleDocUrl) {
        contextualMessage = `The user has shared some campaign-related documents. Please analyze the content below and help them develop their D&D campaign based on this material. Extract key information like settings, characters, plot points, locations, and any other relevant campaign details.

${fullMessage}

Please provide your analysis and suggestions for building this into a cohesive D&D campaign.`;
      }

      const result = await sendMessage(conversationId, contextualMessage);
      const totalCost = await getTotalCost(conversationId);

      res.json({
        response: result.response,
        phase: result.phase,
        cost: result.cost,
        totalCost,
        generatedContent: result.generatedContent,
        filesProcessed: files?.length || 0,
        googleDocProcessed: !!googleDocUrl,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
        return;
      }
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
          return;
        }
        res.status(400).json({ error: `File upload error: ${error.message}` });
        return;
      }
      logger.error({ error }, 'Failed to process message');
      res.status(500).json({ error: 'Failed to process message' });
    }
  }
);

// Get conversation history
router.get('/:conversationId/history', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const conversation = await getConversation(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const history = await getHistory(conversationId);
    const totalCost = await getTotalCost(conversationId);

    res.json({
      conversationId,
      phase: conversation.phase,
      messages: history,
      totalCost,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get history');
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// Advance to next phase
router.post('/:conversationId/advance', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const conversation = await getConversation(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const newPhase = await advancePhase(conversationId);

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
router.post('/:conversationId/phase', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { phase } = phaseSchema.parse(req.body);

    const conversation = await getConversation(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    await setPhase(conversationId, phase);

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

// Update conversation title
router.patch('/:conversationId/title', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { title } = titleSchema.parse(req.body);

    const conversation = await getConversation(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    await updateTitle(conversationId, title);

    res.json({
      success: true,
      title,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to update title');
    res.status(500).json({ error: 'Failed to update title' });
  }
});

// Delete conversation
router.delete('/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const deleted = await deleteConversation(conversationId);

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
router.post('/resume', async (req: Request, res: Response) => {
  try {
    const { campaignId, title } = startSchema.parse(req.body);
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Try to find existing conversation
    const existing = await getConversationByCampaignId(campaignId, userId);

    if (existing) {
      res.json({
        conversationId: existing.id,
        phase: existing.phase,
        title: existing.title,
        messages: existing.messages,
        generatedContent: existing.generatedContent,
        totalCost: existing.totalCost,
        resumed: true,
      });
    } else {
      // No existing conversation, create new one
      const state = await startConversation(userId, campaignId, title);

      const greeting = `Welcome to the Campaign Studio! I'm here to help you create an amazing D&D campaign.

Let's start with your setting. Tell me about the world you want to create:
- What's the tone? (heroic adventure, dark and gritty, horror, comedic?)
- What time period or aesthetic? (medieval, renaissance, ancient?)
- Any particular themes or inspirations?

Just share your ideas naturally, and I'll help bring them to life!`;

      res.json({
        conversationId: state.id,
        phase: state.phase,
        title: state.title,
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
router.get('/:conversationId/content', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const conversation = await getConversation(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const content = await getGeneratedContent(conversationId);

    res.json({
      conversationId,
      generatedContent: content,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get content');
    res.status(500).json({ error: 'Failed to get content' });
  }
});

// Export full conversation state (for saving to database or downloading)
router.get('/:conversationId/export', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const state = await exportConversation(conversationId);
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
router.post('/import', async (req: Request, res: Response) => {
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

    await importConversation(conversation);

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
