export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_GATEWAY_PORT || '4000', 10),

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dnd_dev',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },

  services: {
    rulesEngine: process.env.RULES_ENGINE_URL || 'localhost:50051',
    gridSolver: process.env.GRID_SOLVER_URL || 'localhost:50052',
    aiService: process.env.AI_SERVICE_URL || 'localhost:50053',
  },
} as const;
