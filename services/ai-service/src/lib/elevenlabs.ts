// ElevenLabs TTS Integration
// Provides text-to-speech for DM narration and NPC dialogue

import { config } from './config.js';
import { logger } from './logger.js';

// Voice profile types
export interface VoiceSettings {
  stability: number; // 0-1, higher = more consistent
  similarityBoost: number; // 0-1, higher = closer to original voice
  style?: number; // 0-1, style exaggeration (v2 models only)
  useSpeakerBoost?: boolean;
}

export interface VoiceProfile {
  id: string;
  name: string;
  voiceId: string;
  description: string;
  settings: VoiceSettings;
  category: 'narrator' | 'npc' | 'system';
}

// Pre-defined voice profiles for D&D
// Using ElevenLabs pre-made voices available on all tiers
// See: https://elevenlabs.io/docs/voices/premade-voices
export const VOICE_PROFILES: Record<string, VoiceProfile> = {
  // DM/Narrator voices
  narrator: {
    id: 'narrator',
    name: 'Dungeon Master',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - clear, warm (pre-made)
    description: 'Deep, dramatic narrator voice for scene descriptions',
    settings: { stability: 0.75, similarityBoost: 0.75 },
    category: 'narrator',
  },
  narrator_mysterious: {
    id: 'narrator_mysterious',
    name: 'Mysterious Narrator',
    voiceId: 'AZnzlk1XvdvUeBnXmlld', // Domi - soft (pre-made)
    description: 'Soft, mysterious voice for dark or suspenseful scenes',
    settings: { stability: 0.85, similarityBoost: 0.7 },
    category: 'narrator',
  },
  narrator_epic: {
    id: 'narrator_epic',
    name: 'Epic Narrator',
    voiceId: 'ErXwobaYiN019PkySvjV', // Antoni - strong (pre-made)
    description: 'Powerful voice for epic battles and heroic moments',
    settings: { stability: 0.6, similarityBoost: 0.8 },
    category: 'narrator',
  },

  // NPC voice templates
  noble_male: {
    id: 'noble_male',
    name: 'Noble Male',
    voiceId: 'VR6AewLTigWG4xSOukaG', // Arnold (pre-made)
    description: 'Refined, aristocratic male voice',
    settings: { stability: 0.8, similarityBoost: 0.75 },
    category: 'npc',
  },
  warrior_male: {
    id: 'warrior_male',
    name: 'Warrior Male',
    voiceId: 'TxGEqnHWrfWFTfGW9XjX', // Josh (pre-made)
    description: 'Gruff, battle-hardened warrior voice',
    settings: { stability: 0.65, similarityBoost: 0.8 },
    category: 'npc',
  },
  wizard_male: {
    id: 'wizard_male',
    name: 'Wizard Male',
    voiceId: 'ErXwobaYiN019PkySvjV', // Antoni (pre-made)
    description: 'Wise, measured wizard voice',
    settings: { stability: 0.85, similarityBoost: 0.7 },
    category: 'npc',
  },
  noble_female: {
    id: 'noble_female',
    name: 'Noble Female',
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella (pre-made)
    description: 'Elegant, noble female voice',
    settings: { stability: 0.8, similarityBoost: 0.75 },
    category: 'npc',
  },
  tavern_keeper: {
    id: 'tavern_keeper',
    name: 'Tavern Keeper',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel (pre-made)
    description: 'Friendly, welcoming tavern keeper voice',
    settings: { stability: 0.7, similarityBoost: 0.75 },
    category: 'npc',
  },
  villain: {
    id: 'villain',
    name: 'Villain',
    voiceId: 'VR6AewLTigWG4xSOukaG', // Arnold - can sound menacing (pre-made)
    description: 'Dark, menacing villain voice',
    settings: { stability: 0.6, similarityBoost: 0.85 },
    category: 'npc',
  },

  // System voices
  system: {
    id: 'system',
    name: 'System',
    voiceId: 'AZnzlk1XvdvUeBnXmlld', // Domi - clear, neutral (pre-made)
    description: 'Clear, neutral voice for game notifications',
    settings: { stability: 0.9, similarityBoost: 0.7 },
    category: 'system',
  },
};

// Emotion modifiers that adjust voice settings
export const EMOTION_MODIFIERS: Record<string, Partial<VoiceSettings> & { speedMod?: number }> = {
  neutral: { stability: 0, similarityBoost: 0, speedMod: 1.0 },
  excited: { stability: -0.2, similarityBoost: 0, style: 0.3, speedMod: 1.1 },
  angry: { stability: -0.3, similarityBoost: 0.1, style: 0.4, speedMod: 1.05 },
  fearful: { stability: -0.4, similarityBoost: 0, style: 0.2, speedMod: 1.15 },
  sad: { stability: 0.1, similarityBoost: 0, style: -0.2, speedMod: 0.9 },
  mysterious: { stability: 0.15, similarityBoost: 0, style: 0.1, speedMod: 0.85 },
  threatening: { stability: -0.1, similarityBoost: 0.1, style: 0.3, speedMod: 0.9 },
  triumphant: { stability: -0.2, similarityBoost: 0, style: 0.5, speedMod: 1.0 },
};

// TTS request interface
export interface TTSRequest {
  text: string;
  voiceProfile?: string; // Key from VOICE_PROFILES
  emotion?: string; // Key from EMOTION_MODIFIERS
  customVoiceId?: string; // Override voice ID
  modelId?: string; // ElevenLabs model
}

// TTS response interface
export interface TTSResponse {
  audioUrl: string;
  audioBase64?: string;
  duration: number; // Estimated duration in seconds
  characterCount: number;
  voiceProfile: string;
}

// Check if ElevenLabs is configured
export function isElevenLabsConfigured(): boolean {
  return !!config.elevenLabsApiKey;
}

// Generate speech from text
export async function generateSpeech(request: TTSRequest): Promise<TTSResponse> {
  if (!isElevenLabsConfigured()) {
    throw new Error('ElevenLabs API key not configured');
  }

  const profile = request.voiceProfile
    ? VOICE_PROFILES[request.voiceProfile] || VOICE_PROFILES.narrator
    : VOICE_PROFILES.narrator;

  const emotion = request.emotion
    ? EMOTION_MODIFIERS[request.emotion] || EMOTION_MODIFIERS.neutral
    : EMOTION_MODIFIERS.neutral;

  // Apply emotion modifiers to voice settings
  // Only use stability and similarity_boost - style is only for certain models
  const settings = {
    stability: Math.max(0, Math.min(1, profile.settings.stability + (emotion.stability || 0))),
    similarity_boost: Math.max(0, Math.min(1, profile.settings.similarityBoost + (emotion.similarityBoost || 0))),
  };

  const voiceId = request.customVoiceId || profile.voiceId;
  // Use eleven_monolingual_v1 for better compatibility
  const modelId = request.modelId || 'eleven_monolingual_v1';

  logger.info({ voiceId, modelId, textLength: request.text.length }, 'Generating speech');

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': config.elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: request.text,
        model_id: modelId,
        voice_settings: settings,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, 'ElevenLabs API error');
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Get audio as buffer
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // Estimate duration (roughly 150 words per minute, ~5 chars per word)
    const estimatedDuration = (request.text.length / 5 / 150) * 60;

    return {
      audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
      audioBase64,
      duration: estimatedDuration,
      characterCount: request.text.length,
      voiceProfile: profile.id,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to generate speech');
    throw error;
  }
}

// Get available voices from ElevenLabs account
export async function getAvailableVoices(): Promise<Array<{ voiceId: string; name: string; category: string }>> {
  if (!isElevenLabsConfigured()) {
    throw new Error('ElevenLabs API key not configured');
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': config.elevenLabsApiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`);
    }

    const data = await response.json() as { voices: Array<{ voice_id: string; name: string; category: string }> };

    return data.voices.map((v) => ({
      voiceId: v.voice_id,
      name: v.name,
      category: v.category,
    }));
  } catch (error) {
    logger.error({ error }, 'Failed to fetch voices');
    throw error;
  }
}

// Get user's subscription info (character limits, etc.)
export async function getSubscriptionInfo(): Promise<{
  characterCount: number;
  characterLimit: number;
  canGenerate: boolean;
}> {
  if (!isElevenLabsConfigured()) {
    return { characterCount: 0, characterLimit: 0, canGenerate: false };
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: {
        'xi-api-key': config.elevenLabsApiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subscription: ${response.status}`);
    }

    const data = await response.json() as {
      character_count: number;
      character_limit: number;
    };

    return {
      characterCount: data.character_count,
      characterLimit: data.character_limit,
      canGenerate: data.character_count < data.character_limit,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to fetch subscription info');
    return { characterCount: 0, characterLimit: 0, canGenerate: false };
  }
}

// Pre-defined narration templates for common D&D scenarios
export const NARRATION_TEMPLATES = {
  combat: {
    initiative: 'Roll for initiative!',
    your_turn: "It's your turn. What do you do?",
    enemy_turn: "{enemy} prepares to attack.",
    critical_hit: 'Critical hit! A devastating blow!',
    critical_miss: 'A swing and a miss! The attack goes wide.',
    damage: '{target} takes {amount} {type} damage.',
    death: '{target} falls, defeated.',
    victory: 'Victory! The battle is won.',
  },
  exploration: {
    new_location: 'You arrive at {location}.',
    secret_found: 'You discover a hidden {item}.',
    trap_triggered: 'A trap springs! Roll a saving throw.',
    rest: 'You take a moment to rest and recover.',
  },
  social: {
    npc_greeting: '{npc} approaches you.',
    quest_accepted: 'You have accepted the quest: {quest}.',
    quest_complete: 'Quest complete! {quest}',
    level_up: 'Congratulations! You have reached level {level}.',
  },
};
