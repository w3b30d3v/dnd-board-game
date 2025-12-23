// AI Service Configuration

export const config = {
  // Server
  port: parseInt(process.env.AI_SERVICE_PORT || '4003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Claude AI
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  claudeModelChat: process.env.CLAUDE_MODEL_CHAT || 'claude-sonnet-4-20250514',
  claudeModelGeneration: process.env.CLAUDE_MODEL_GENERATION || 'claude-opus-4-20250514',
  claudeMaxDailySpend: parseFloat(process.env.CLAUDE_MAX_DAILY_SPEND || '50'),

  // Runway
  runwayApiKey: process.env.RUNWAY_API_KEY || '',
  runwayDefaultDuration: parseInt(process.env.RUNWAY_DEFAULT_DURATION || '5', 10),
  runwayMaxVideosPerCampaign: parseInt(process.env.RUNWAY_MAX_VIDEOS_PER_CAMPAIGN || '10', 10),

  // ElevenLabs
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  elevenLabsDefaultVoice: process.env.ELEVENLABS_DEFAULT_VOICE || 'narrator',
  elevenLabsMaxMinutesPerCampaign: parseInt(process.env.ELEVENLABS_MAX_MINUTES_PER_CAMPAIGN || '30', 10),

  // NanoBanana (for scene images)
  nanoBananaApiKey: process.env.NANOBANANA_API_KEY || '',

  // JWT (for auth)
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',

  // Redis (for conversation state)
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Feature flags
  features: {
    aiCampaignStudio: process.env.FEATURE_AI_CAMPAIGN_STUDIO === 'true',
    videoCutscenes: process.env.FEATURE_VIDEO_CUTSCENES === 'true',
    ttsNarration: process.env.FEATURE_TTS_NARRATION === 'true',
  },
};

// Validate required config
export function validateConfig(): string[] {
  const errors: string[] = [];

  if (!config.anthropicApiKey && config.features.aiCampaignStudio) {
    errors.push('ANTHROPIC_API_KEY is required when AI Campaign Studio is enabled');
  }

  if (!config.runwayApiKey && config.features.videoCutscenes) {
    errors.push('RUNWAY_API_KEY is required when Video Cutscenes are enabled');
  }

  if (!config.elevenLabsApiKey && config.features.ttsNarration) {
    errors.push('ELEVENLABS_API_KEY is required when TTS Narration is enabled');
  }

  return errors;
}
