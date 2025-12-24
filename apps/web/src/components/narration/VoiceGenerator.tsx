'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NarrationPlayer } from './NarrationPlayer';
import {
  useVoiceNarration,
  useVoiceStatus,
  useVoiceProfiles,
  type GeneratedAudio,
} from '@/hooks/useVoiceNarration';

interface VoiceGeneratorProps {
  initialText?: string;
  contentType?: 'setting' | 'location' | 'npc' | 'encounter' | 'quest' | 'dialogue';
  onGenerated?: (audio: GeneratedAudio) => void;
  className?: string;
}

export function VoiceGenerator({
  initialText = '',
  contentType = 'setting',
  onGenerated,
  className = '',
}: VoiceGeneratorProps) {
  const { narrateContent, isGenerating, error, clearError } = useVoiceNarration();
  const { status, isLoading: statusLoading, isConfigured } = useVoiceStatus();
  const { profiles, emotions, isLoading: profilesLoading } = useVoiceProfiles();

  const [text, setText] = useState(initialText);
  const [selectedProfile, setSelectedProfile] = useState<string>('narrator');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('neutral');
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);

  const handleGenerate = async () => {
    if (!text.trim() || text.length < 10) return;

    try {
      const audio = await narrateContent(text, contentType, {
        voiceProfile: selectedProfile,
        emotion: selectedEmotion,
      });

      setGeneratedAudio(audio);
      onGenerated?.(audio);
    } catch {
      // Error is handled by the hook
    }
  };

  // Not configured state
  if (!statusLoading && !isConfigured) {
    return (
      <div className={`bg-bg-card border border-border rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-elevated flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">Voice Narration Not Available</h3>
          <p className="text-sm text-text-secondary">
            ElevenLabs API is not configured. Contact your administrator to enable voice narration.
          </p>
        </div>
      </div>
    );
  }

  // Show player when audio is generated
  if (generatedAudio) {
    return (
      <div className={className}>
        <NarrationPlayer
          audioUrl={generatedAudio.audioUrl}
          text={text}
          speakerName={profiles.find((p) => p.id === selectedProfile)?.name || 'Narrator'}
          onClose={() => setGeneratedAudio(null)}
          autoPlay
        />

        <div className="mt-4 flex justify-end gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setGeneratedAudio(null)}
            className="px-4 py-2 bg-bg-elevated text-text-secondary rounded-lg"
          >
            Generate Another
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bg-card border border-border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-cinzel font-bold text-text-primary">Generate Narration</h3>
          <p className="text-xs text-text-muted">AI-powered voice for your content</p>
        </div>
      </div>

      {/* Character limit info */}
      {status && status.characterLimit && (
        <div className="mb-4 p-3 bg-bg-elevated rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Characters remaining</span>
            <span className="text-text-primary font-medium">
              {status.remainingCharacters?.toLocaleString() || 0} / {status.characterLimit.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-bg-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
              style={{
                width: `${((status.remainingCharacters || 0) / status.characterLimit) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Text input */}
      <div className="mb-4">
        <label className="block text-sm text-text-secondary mb-2">Text to narrate</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter the text you want to convert to speech..."
          className="w-full h-32 px-3 py-2 bg-[#1E1B26] border border-[#3f3f46] rounded-lg text-white placeholder:text-[#71717a] resize-none focus:outline-none focus:border-[#F59E0B]/50"
          maxLength={5000}
        />
        <p className="text-xs text-text-muted mt-1">{text.length}/5000 characters</p>
      </div>

      {/* Voice profile selector */}
      <div className="mb-4">
        <label className="block text-sm text-text-secondary mb-2">Voice</label>
        {profilesLoading ? (
          <div className="flex items-center gap-2 py-2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-text-muted">Loading voices...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {profiles
              .filter((p) => p.category === 'narrator')
              .map((profile) => (
                <motion.button
                  key={profile.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedProfile(profile.id)}
                  className={`p-2 text-left rounded-lg border transition-colors ${
                    selectedProfile === profile.id
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-bg-elevated border-border hover:border-primary/30'
                  }`}
                >
                  <p className="text-sm font-medium text-text-primary">{profile.name}</p>
                  <p className="text-xs text-text-muted truncate">{profile.description}</p>
                </motion.button>
              ))}
          </div>
        )}
      </div>

      {/* Emotion selector */}
      <div className="mb-4">
        <label className="block text-sm text-text-secondary mb-2">Emotion</label>
        <div className="flex flex-wrap gap-2">
          {emotions.map((emotion) => (
            <button
              key={emotion}
              onClick={() => setSelectedEmotion(emotion)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                selectedEmotion === emotion
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-bg-elevated text-text-secondary hover:bg-border'
              }`}
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between"
          >
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={clearError} className="text-red-400 hover:text-red-300">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGenerate}
        disabled={isGenerating || statusLoading || text.length < 10}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          isGenerating || statusLoading || text.length < 10
            ? 'bg-bg-elevated text-text-muted cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90'
        }`}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </span>
        ) : (
          'Generate Narration'
        )}
      </motion.button>

      {/* Cost estimate */}
      <p className="text-xs text-text-muted text-center mt-2">
        Estimated cost: {text.length} characters
      </p>
    </div>
  );
}

export default VoiceGenerator;
