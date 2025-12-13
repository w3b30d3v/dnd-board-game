// WebSocket Gateway Configuration

export const config = {
  // Railway injects PORT, use WS_PORT as fallback for local dev
  port: parseInt(process.env.PORT || process.env.WS_PORT || '4001', 10),
  host: process.env.WS_HOST || '0.0.0.0',

  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-key-min-32-chars!!',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Connection settings
  connection: {
    heartbeatInterval: 30000, // 30 seconds
    heartbeatTimeout: 10000, // 10 seconds to respond
    maxConnections: 10000,
    maxConnectionsPerUser: 5,
  },

  // Session settings
  session: {
    maxPlayers: 10,
    defaultMaxPlayers: 6,
    inviteCodeLength: 6,
    sessionTimeout: 3600000, // 1 hour of inactivity
  },

  // Turn timer
  turn: {
    defaultTimeLimit: 120, // 2 minutes per turn
    warningTime: 30, // Warning at 30 seconds remaining
  },

  // Rate limiting
  rateLimit: {
    messagesPerSecond: 10,
    messagesPerMinute: 100,
  },
};
