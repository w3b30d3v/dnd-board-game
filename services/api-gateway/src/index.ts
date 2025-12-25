import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { basicAuth } from './middleware/basicAuth.js';
import { prisma } from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import characterRoutes from './routes/characters.js';
import mediaRoutes from './routes/media.js';
import campaignRoutes from './routes/campaigns.js';
import dmRoutes from './routes/dm.js';
import campaignStudioRoutes from './routes/campaignStudio.js';

// Verify database connection and schema on startup
async function verifyDatabase() {
  try {
    // Test basic connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection verified');

    // Check if maxActiveSessions column exists
    const result = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'maxActiveSessions'
    ` as Array<{ column_name: string }>;

    if (result.length === 0) {
      logger.warn('maxActiveSessions column not found - migration may not have run');
    } else {
      logger.info('Schema verification passed');
    }
  } catch (error) {
    logger.error({ error }, 'Database verification failed');
  }
}

// Run verification
verifyDatabase().catch(console.error);

const app: Express = express();

// Middleware
app.use(helmet());

// CORS configuration - MUST be before basicAuth to allow preflight OPTIONS requests
const allowedOrigins = [
  'https://web-production-f0a7.up.railway.app',
  'https://web-production-85b97.up.railway.app',
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
];

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
      // Allow configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Log rejected origins for debugging
      logger.warn({ origin }, 'CORS request rejected');
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());

// Basic auth for staging/password protection (after CORS to allow preflight)
app.use(basicAuth);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database health check
app.get('/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ err: error }, 'Database health check failed');
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: message,
      hint: 'Check DATABASE_URL environment variable and PostgreSQL service',
      timestamp: new Date().toISOString()
    });
  }
});

// API info
app.get('/api', (_req, res) => {
  res.json({
    name: 'D&D Platform API',
    version: '0.6.1',
    status: 'Phase 6 - Campaign Builder',
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/characters', characterRoutes);
app.use('/media', mediaRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/dm', dmRoutes);
app.use('/campaign-studio', campaignStudioRoutes);

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error({ err }, 'Unhandled error');
    // In non-production, include error details for debugging
    const isDev = config.nodeEnv !== 'production';
    const errorResponse: { error: string; details?: string; stack?: string } = {
      error: 'Internal server error',
    };
    if (isDev || process.env.DEBUG_ERRORS === 'true') {
      errorResponse.details = err.message;
      errorResponse.stack = err.stack;
    }
    res.status(500).json(errorResponse);
  }
);

// Start server
const port = config.port;
app.listen(port, () => {
  logger.info(`API Gateway started on port ${port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export default app;
