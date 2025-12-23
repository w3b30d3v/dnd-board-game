'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CutscenePlayer } from './CutscenePlayer';
import {
  useVideoGeneration,
  useVideoPresets,
  useRunwayStatus,
} from '@/hooks/useVideoGeneration';

type GenerationMode = 'custom' | 'preset';
type VideoStyle = 'cinematic' | 'fantasy' | 'dark' | 'epic';

interface VideoGeneratorProps {
  campaignId?: string;
  onVideoGenerated?: (videoUrl: string) => void;
  className?: string;
}

export function VideoGenerator({ campaignId, onVideoGenerated, className }: VideoGeneratorProps) {
  const { task, isGenerating, error, generateVideo, generateFromPreset, cancelVideo, clearTask } =
    useVideoGeneration();
  const { presets, isLoading: presetsLoading } = useVideoPresets();
  const { isConfigured, isLoading: statusLoading } = useRunwayStatus();

  const [mode, setMode] = useState<GenerationMode>('preset');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customDescription, setCustomDescription] = useState('');
  const [style, setStyle] = useState<VideoStyle>('cinematic');
  const [duration, setDuration] = useState<4 | 6 | 8>(6);

  const handleGenerate = async () => {
    if (mode === 'preset' && selectedPreset) {
      await generateFromPreset({
        preset: selectedPreset,
        duration,
        campaignId,
      });
    } else if (mode === 'custom' && customDescription.length >= 10) {
      await generateVideo({
        sceneDescription: customDescription,
        style,
        duration,
        campaignId,
      });
    }
  };

  const handleVideoComplete = () => {
    if (task?.videoUrl && onVideoGenerated) {
      onVideoGenerated(task.videoUrl);
    }
  };

  // Not configured state
  if (!statusLoading && !isConfigured) {
    return (
      <div className={`bg-bg-card border border-border rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-elevated flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">Video Generation Not Available</h3>
          <p className="text-sm text-text-secondary">
            Runway API is not configured. Contact your administrator to enable video cutscene generation.
          </p>
        </div>
      </div>
    );
  }

  // Show player when generating or completed
  if (task) {
    return (
      <div className={className}>
        <CutscenePlayer
          videoUrl={task.videoUrl}
          status={task.status}
          progress={task.progress}
          error={task.error}
          onClose={clearTask}
          title={selectedPreset ? presets.find(p => p.id === selectedPreset)?.description.substring(0, 50) : undefined}
        />

        {/* Action buttons */}
        <div className="mt-4 flex justify-end gap-3">
          {task.status === 'SUCCEEDED' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleVideoComplete}
              className="px-4 py-2 bg-primary text-bg-dark rounded-lg font-medium"
            >
              Use This Video
            </motion.button>
          )}
          {['PENDING', 'THROTTLED', 'RUNNING'].includes(task.status) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={cancelVideo}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-medium"
            >
              Cancel
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearTask}
            className="px-4 py-2 bg-bg-elevated text-text-secondary rounded-lg"
          >
            {task.status === 'SUCCEEDED' ? 'Generate Another' : 'Close'}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bg-card border border-border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-cinzel font-bold text-text-primary">Generate Cutscene</h3>
          <p className="text-xs text-text-muted">AI-powered video generation</p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('preset')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            mode === 'preset'
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-bg-elevated text-text-secondary hover:bg-border'
          }`}
        >
          Scene Presets
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            mode === 'custom'
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-bg-elevated text-text-secondary hover:bg-border'
          }`}
        >
          Custom Scene
        </button>
      </div>

      {/* Content based on mode */}
      <AnimatePresence mode="wait">
        {mode === 'preset' ? (
          <motion.div
            key="preset"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {presetsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {presets.map((preset) => (
                  <motion.button
                    key={preset.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      selectedPreset === preset.id
                        ? 'bg-primary/10 border-primary/50'
                        : 'bg-bg-elevated border-border hover:border-primary/30'
                    }`}
                  >
                    <p className="text-sm font-medium text-text-primary capitalize">
                      {preset.id.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">{preset.preview}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
                      preset.style === 'cinematic' ? 'bg-blue-500/20 text-blue-400' :
                      preset.style === 'fantasy' ? 'bg-purple-500/20 text-purple-400' :
                      preset.style === 'dark' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {preset.style}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Description */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">Scene Description</label>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Describe your scene in detail (e.g., 'A dragon emerges from a volcanic mountain, spreading its wings against a sunset sky...')"
                className="w-full h-24 px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-primary/50"
                maxLength={1000}
              />
              <p className="text-xs text-text-muted mt-1">{customDescription.length}/1000 characters</p>
            </div>

            {/* Style selector */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">Visual Style</label>
              <div className="grid grid-cols-4 gap-2">
                {(['cinematic', 'fantasy', 'dark', 'epic'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium capitalize transition-colors ${
                      style === s
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-bg-elevated text-text-secondary hover:bg-border'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duration selector */}
      <div className="mt-4">
        <label className="block text-sm text-text-secondary mb-2">Duration</label>
        <div className="flex gap-2">
          {([4, 6, 8] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                duration === d
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-bg-elevated text-text-secondary hover:bg-border'
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-2">
          Estimated cost: ${(duration * 0.05).toFixed(2)}
        </p>
      </div>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Generate button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGenerate}
        disabled={
          isGenerating ||
          statusLoading ||
          (mode === 'preset' && !selectedPreset) ||
          (mode === 'custom' && customDescription.length < 10)
        }
        className={`w-full mt-6 py-3 rounded-lg font-medium transition-colors ${
          isGenerating ||
          statusLoading ||
          (mode === 'preset' && !selectedPreset) ||
          (mode === 'custom' && customDescription.length < 10)
            ? 'bg-bg-elevated text-text-muted cursor-not-allowed'
            : 'bg-primary text-bg-dark hover:bg-primary/90'
        }`}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-bg-dark/30 border-t-bg-dark rounded-full animate-spin" />
            Generating...
          </span>
        ) : (
          'Generate Cutscene'
        )}
      </motion.button>
    </div>
  );
}
