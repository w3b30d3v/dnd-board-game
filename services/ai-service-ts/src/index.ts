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
    version: '0.1.0',
    description: 'Campaign Studio & Content Generation',
    endpoints: {
      conversation: '/ai/conversation',
      generation: '/ai/generate',
    },
  });
});

// Routes (protected)
app.use('/ai/conversation', authMiddleware, conversationRoutes);
app.use('/ai/generate', authMiddleware, generationRoutes);

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
