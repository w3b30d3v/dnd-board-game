// AI Service - Campaign Studio & Content Generation
// Provides Claude-powered conversational campaign creation

import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from './lib/config.js';
import { logger } from './lib/logger.js';
import { authMiddleware } from './middleware/auth.js';
import conversationRoutes from './routes/conversation.js';
import generationRoutes from './routes/generation.js';
import videoRoutes from './routes/video.js';
import voiceRoutes from './routes/voice.js';
import campaignStudioRoutes from './routes/campaign-studio.js';
import { isRunwayConfigured } from './lib/runway.js';
import { isElevenLabsConfigured } from './lib/elevenlabs.js';

const app: Express = express();

// Validate configuration
const configErrors = validateConfig();
if (configErrors.length > 0) {
  logger.warn({ errors: configErrors }, 'Configuration warnings');
}

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      // Allow any localhost port in development
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }
      // Allow any Railway subdomain
      if (origin.match(/^https:\/\/.*\.up\.railway\.app$/)) {
        return callback(null, true);
      }
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-service',
    timestamp: new Date().toISOString(),
    features: config.features,
  });
});

// API info
app.get('/api', (_req, res) => {
  res.json({
    name: 'AI Service',
    version: '0.4.0',
    description: 'Campaign Studio & Content Generation',
    endpoints: {
      conversation: '/ai/conversation',
      generation: '/ai/generate',
      video: '/ai/video',
      voice: '/ai/voice',
      campaignStudio: '/ai/campaign-studio',
      webhooks: '/ai/webhook',
    },
    integrations: {
      runway: isRunwayConfigured(),
      elevenlabs: isElevenLabsConfigured(),
    },
  });
});

// Test endpoint (no auth) - verifies Claude connection
app.get('/test/claude', async (_req, res) => {
  try {
    const { chat } = await import('./lib/claude.js');
    const response = await chat(
      'You are a helpful assistant. Respond in exactly 10 words or less.',
      [{ role: 'user', content: 'Say hello and confirm you are Claude.' }],
      { maxTokens: 50 }
    );
    res.json({
      status: 'ok',
      response: response.content,
      usage: response.usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error }, 'Claude test failed');
    res.status(500).json({ status: 'error', message });
  }
});

// Test endpoint (no auth) - verifies Runway connection
app.get('/test/runway', (_req, res) => {
  res.json({
    status: isRunwayConfigured() ? 'ok' : 'not_configured',
    configured: isRunwayConfigured(),
    message: isRunwayConfigured()
      ? 'Runway Gen-3 Alpha is configured and ready'
      : 'RUNWAY_API_KEY not set - video generation unavailable',
  });
});

// Test endpoint (no auth) - verifies ElevenLabs connection
app.get('/test/elevenlabs', (_req, res) => {
  res.json({
    status: isElevenLabsConfigured() ? 'ok' : 'not_configured',
    configured: isElevenLabsConfigured(),
    message: isElevenLabsConfigured()
      ? 'ElevenLabs TTS is configured and ready'
      : 'ELEVENLABS_API_KEY not set - voice narration unavailable',
  });
});

// Test endpoint (no auth) - actually tests ElevenLabs voice generation
app.get('/test/elevenlabs/generate', async (_req, res) => {
  if (!isElevenLabsConfigured()) {
    res.status(503).json({ error: 'ElevenLabs not configured' });
    return;
  }

  try {
    const { generateSpeech } = await import('./lib/elevenlabs.js');
    const result = await generateSpeech({
      text: 'Hello, this is a test of the ElevenLabs voice generation.',
      voiceProfile: 'narrator',
    });

    res.json({
      status: 'ok',
      message: 'Voice generation successful',
      duration: result.duration,
      characterCount: result.characterCount,
      voiceProfile: result.voiceProfile,
      // Don't return the full audio URL in test - it's too large
      hasAudio: !!result.audioUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error }, 'ElevenLabs test generation failed');
    res.status(500).json({
      status: 'error',
      error: message,
    });
  }
});

// Webhook route (no auth - receives callbacks from external services)
// Must be defined BEFORE protected routes to avoid auth middleware
app.use('/ai/webhook', campaignStudioRoutes);

// Routes (protected)
app.use('/ai/conversation', authMiddleware, conversationRoutes);
app.use('/ai/generate', authMiddleware, generationRoutes);
app.use('/ai/video', authMiddleware, videoRoutes);
app.use('/ai/voice', authMiddleware, voiceRoutes);
app.use('/ai/campaign-studio', authMiddleware, campaignStudioRoutes);

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  }
);

// Start server
const port = config.port;
app.listen(port, () => {
  logger.info(`AI Service started on port ${port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Features: ${JSON.stringify(config.features)}`);
});

export default app;
