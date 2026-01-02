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
    expiresIn: process.env.JWT_EXPIRES_IN || '24h', // Increased from 15m to 24h
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d', // Increased from 7d to 30d
  },

  services: {
    rulesEngine: process.env.RULES_ENGINE_URL || 'localhost:50051',
    gridSolver: process.env.GRID_SOLVER_URL || 'localhost:50052',
    aiService: process.env.AI_SERVICE_URL || 'localhost:50053',
  },

  // Character generation limits (configurable by admin via env vars)
  characterGeneration: {
    // Max AI-generated characters per user (each character = 1 portrait + N full body images)
    maxCharactersPerUser: parseInt(process.env.MAX_AI_CHARACTERS_PER_USER || '5', 10),
    // Max images per character: 1 portrait + this many full body action images
    maxFullBodyImagesPerCharacter: parseInt(process.env.MAX_FULLBODY_IMAGES_PER_CHARACTER || '2', 10),
  },

  // S3/MinIO storage for permanent file storage
  storage: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    bucketAssets: process.env.S3_BUCKET_ASSETS || 'dnd-assets',
    bucketMedia: process.env.S3_BUCKET_MEDIA || 'dnd-media',
    region: process.env.S3_REGION || 'us-east-1',
    // Public URL for accessing stored files (CDN or direct S3 URL)
    publicUrl: process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || 'http://localhost:9000',
  },
} as const;
