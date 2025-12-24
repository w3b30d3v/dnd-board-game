// Voice/TTS Routes
// API endpoints for text-to-speech narration

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import {
  isElevenLabsConfigured,
  generateSpeech,
  getAvailableVoices,
  getSubscriptionInfo,
  VOICE_PROFILES,
  EMOTION_MODIFIERS,
  NARRATION_TEMPLATES,
} from '../lib/elevenlabs.js';
import { logger } from '../lib/logger.js';

const router: RouterType = Router();

// Validation schemas
const generateSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceProfile: z.string().optional(),
  emotion: z.string().optional(),
  customVoiceId: z.string().optional(),
});

const templateSchema = z.object({
  template: z.string(),
  category: z.enum(['combat', 'exploration', 'social']),
  variables: z.record(z.string()).optional(),
  voiceProfile: z.string().optional(),
  emotion: z.string().optional(),
});

// GET /ai/voice/status - Check if TTS is available
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const configured = isElevenLabsConfigured();

    if (!configured) {
      res.json({
        available: false,
        reason: 'ElevenLabs API key not configured',
      });
      return;
    }

    const subscription = await getSubscriptionInfo();

    res.json({
      available: subscription.canGenerate,
      characterCount: subscription.characterCount,
      characterLimit: subscription.characterLimit,
      remainingCharacters: subscription.characterLimit - subscription.characterCount,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get voice status');
    res.status(500).json({ error: 'Failed to get voice status' });
  }
});

// GET /ai/voice/profiles - List available voice profiles
router.get('/profiles', (_req: Request, res: Response) => {
  const profiles = Object.values(VOICE_PROFILES).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
  }));

  const emotions = Object.keys(EMOTION_MODIFIERS);

  res.json({
    profiles,
    emotions,
    defaultProfile: 'narrator',
    defaultEmotion: 'neutral',
  });
});

// GET /ai/voice/voices - List voices from ElevenLabs account
router.get('/voices', async (_req: Request, res: Response) => {
  try {
    if (!isElevenLabsConfigured()) {
      res.status(503).json({ error: 'ElevenLabs not configured' });
      return;
    }

    const voices = await getAvailableVoices();
    res.json({ voices });
  } catch (error) {
    logger.error({ error }, 'Failed to get voices');
    res.status(500).json({ error: 'Failed to get voices' });
  }
});

// GET /ai/voice/templates - List narration templates
router.get('/templates', (_req: Request, res: Response) => {
  res.json({
    templates: NARRATION_TEMPLATES,
    categories: Object.keys(NARRATION_TEMPLATES),
  });
});

// POST /ai/voice/generate - Generate speech from text
router.post('/generate', async (req: Request, res: Response) => {
  try {
    if (!isElevenLabsConfigured()) {
      res.status(503).json({ error: 'ElevenLabs not configured' });
      return;
    }

    const { text, voiceProfile, emotion, customVoiceId } = generateSchema.parse(req.body);

    logger.info({ textLength: text.length, voiceProfile, emotion }, 'Generating speech');

    const result = await generateSpeech({
      text,
      voiceProfile,
      emotion,
      customVoiceId,
    });

    res.json({
      audioUrl: result.audioUrl,
      duration: result.duration,
      characterCount: result.characterCount,
      voiceProfile: result.voiceProfile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to generate speech');
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// POST /ai/voice/generate-template - Generate speech from a template
router.post('/generate-template', async (req: Request, res: Response) => {
  try {
    if (!isElevenLabsConfigured()) {
      res.status(503).json({ error: 'ElevenLabs not configured' });
      return;
    }

    const { template, category, variables, voiceProfile, emotion } = templateSchema.parse(req.body);

    // Get template text
    const categoryTemplates = NARRATION_TEMPLATES[category] as Record<string, string>;
    let text = categoryTemplates[template];

    if (!text) {
      res.status(400).json({ error: `Template '${template}' not found in category '${category}'` });
      return;
    }

    // Replace variables in template
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    }

    logger.info({ template, category, textLength: text.length }, 'Generating speech from template');

    const result = await generateSpeech({
      text,
      voiceProfile: voiceProfile || 'narrator',
      emotion,
    });

    res.json({
      audioUrl: result.audioUrl,
      duration: result.duration,
      text,
      template,
      voiceProfile: result.voiceProfile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to generate speech from template');
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// POST /ai/voice/narrate - Generate narration for Campaign Studio content
router.post('/narrate', async (req: Request, res: Response) => {
  try {
    if (!isElevenLabsConfigured()) {
      res.status(503).json({ error: 'ElevenLabs not configured' });
      return;
    }

    const schema = z.object({
      content: z.string().min(1).max(10000),
      contentType: z.enum(['setting', 'location', 'npc', 'encounter', 'quest', 'dialogue']),
      speakerName: z.string().optional(),
      voiceProfile: z.string().optional(),
      emotion: z.string().optional(),
    });

    const { content, contentType, speakerName, voiceProfile, emotion } = schema.parse(req.body);

    // Select appropriate voice based on content type
    let selectedVoice = voiceProfile;
    let selectedEmotion = emotion;

    if (!selectedVoice) {
      switch (contentType) {
        case 'setting':
        case 'location':
          selectedVoice = 'narrator';
          selectedEmotion = selectedEmotion || 'mysterious';
          break;
        case 'npc':
        case 'dialogue':
          selectedVoice = 'noble_male'; // Default NPC voice
          selectedEmotion = selectedEmotion || 'neutral';
          break;
        case 'encounter':
          selectedVoice = 'narrator_epic';
          selectedEmotion = selectedEmotion || 'excited';
          break;
        case 'quest':
          selectedVoice = 'narrator';
          selectedEmotion = selectedEmotion || 'triumphant';
          break;
        default:
          selectedVoice = 'narrator';
      }
    }

    logger.info({ contentType, textLength: content.length, selectedVoice }, 'Generating narration');

    const result = await generateSpeech({
      text: content,
      voiceProfile: selectedVoice,
      emotion: selectedEmotion,
    });

    res.json({
      audioUrl: result.audioUrl,
      duration: result.duration,
      characterCount: result.characterCount,
      contentType,
      speakerName,
      voiceProfile: result.voiceProfile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    logger.error({ error }, 'Failed to generate narration');
    res.status(500).json({ error: 'Failed to generate narration' });
  }
});

export default router;
