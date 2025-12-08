import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import authRoutes from './routes/auth.js';
import characterRoutes from './routes/characters.js';
import mediaRoutes from './routes/media.js';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.nodeEnv === 'development'
      ? (origin, callback) => {
          // Allow requests with no origin (like mobile apps or curl)
          if (!origin) return callback(null, true);
          // Allow any localhost port in development
          if (origin.match(/^http:\/\/localhost:\d+$/)) {
            return callback(null, true);
          }
          callback(new Error('Not allowed by CORS'));
        }
      : [],
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info
app.get('/api', (_req, res) => {
  res.json({
    name: 'D&D Platform API',
    version: '0.1.0',
    status: 'Phase 2 - Character Builder',
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/characters', characterRoutes);
app.use('/media', mediaRoutes);

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
  logger.info(`API Gateway started on port ${port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export default app;
