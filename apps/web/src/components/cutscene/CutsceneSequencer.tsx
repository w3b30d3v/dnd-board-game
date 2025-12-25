'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { VideoGenerator } from './VideoGenerator';
import { CutscenePlayer } from './CutscenePlayer';

export interface CutsceneScene {
  id: string;
  title: string;
  videoUrl?: string;
  duration: number;
  status: 'draft' | 'generating' | 'ready' | 'error';
  description?: string;
  thumbnail?: string;
}

export interface CutsceneSequencerProps {
  campaignId?: string;
  initialScenes?: CutsceneScene[];
  onSave?: (scenes: CutsceneScene[]) => void;
  className?: string;
}

export function CutsceneSequencer({
  campaignId,
  initialScenes = [],
  onSave,
  className,
}: CutsceneSequencerProps) {
  const [scenes, setScenes] = useState<CutsceneScene[]>(initialScenes);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);
  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
  const readyScenes = scenes.filter((s) => s.status === 'ready');

  const addScene = useCallback(() => {
    const newScene: CutsceneScene = {
      id: `scene_${Date.now()}`,
      title: `Scene ${scenes.length + 1}`,
      duration: 6,
      status: 'draft',
    };
    setScenes((prev) => [...prev, newScene]);
    setSelectedSceneId(newScene.id);
    setShowGenerator(true);
  }, [scenes.length]);

  const updateScene = useCallback((id: string, updates: Partial<CutsceneScene>) => {
    setScenes((prev) =>
      prev.map((scene) => (scene.id === id ? { ...scene, ...updates } : scene))
    );
  }, []);

  const removeScene = useCallback((id: string) => {
    setScenes((prev) => prev.filter((scene) => scene.id !== id));
    if (selectedSceneId === id) {
      setSelectedSceneId(null);
    }
  }, [selectedSceneId]);

  const handleVideoGenerated = useCallback(
    (videoUrl: string) => {
      if (editingSceneId) {
        updateScene(editingSceneId, {
          videoUrl,
          status: 'ready',
          thumbnail: videoUrl, // In real implementation, extract thumbnail
        });
        setShowGenerator(false);
        setEditingSceneId(null);
      }
    },
    [editingSceneId, updateScene]
  );

  const handleReorder = useCallback((newOrder: CutsceneScene[]) => {
    setScenes(newOrder);
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(scenes);
  }, [scenes, onSave]);

  const startPreview = useCallback(() => {
    if (readyScenes.length > 0) {
      setCurrentPreviewIndex(0);
      setPreviewMode(true);
    }
  }, [readyScenes.length]);

  const handlePreviewNext = useCallback(() => {
    if (currentPreviewIndex < readyScenes.length - 1) {
      setCurrentPreviewIndex((prev) => prev + 1);
    } else {
      setPreviewMode(false);
    }
  }, [currentPreviewIndex, readyScenes.length]);

  // Preview mode
  if (previewMode && readyScenes.length > 0) {
    const currentScene = readyScenes[currentPreviewIndex];
    return (
      <div className={`bg-bg-card border border-border rounded-lg overflow-hidden ${className}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-medium text-text-primary">{currentScene.title}</h3>
            <p className="text-xs text-text-muted">
              Scene {currentPreviewIndex + 1} of {readyScenes.length}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPreviewMode(false)}
            className="px-3 py-1.5 bg-bg-elevated text-text-secondary rounded-lg text-sm"
          >
            Exit Preview
          </motion.button>
        </div>

        <CutscenePlayer
          videoUrl={currentScene.videoUrl}
          status="SUCCEEDED"
          autoPlay
          onEnded={handlePreviewNext}
        />

        {/* Progress bar */}
        <div className="px-4 py-2 bg-bg-elevated">
          <div className="flex gap-1">
            {readyScenes.map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-1 rounded-full ${
                  idx <= currentPreviewIndex ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bg-card border border-border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-text-primary">Cutscene Sequencer</h3>
              <p className="text-xs text-text-muted">
                {scenes.length} scene{scenes.length !== 1 ? 's' : ''} &bull; {totalDuration}s total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {readyScenes.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startPreview}
                className="px-3 py-1.5 bg-bg-elevated text-text-secondary rounded-lg text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Preview
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="px-3 py-1.5 bg-primary text-bg-dark rounded-lg text-sm font-medium"
            >
              Save Sequence
            </motion.button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4">
        {scenes.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-elevated flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-text-secondary mb-4">No scenes yet. Add your first scene to start building your cutscene.</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={addScene}
              className="px-4 py-2 bg-primary text-bg-dark rounded-lg font-medium"
            >
              Add First Scene
            </motion.button>
          </div>
        ) : (
          <>
            {/* Scene list */}
            <Reorder.Group
              axis="y"
              values={scenes}
              onReorder={handleReorder}
              className="space-y-2"
            >
              {scenes.map((scene, index) => (
                <Reorder.Item
                  key={scene.id}
                  value={scene}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <motion.div
                    layout
                    onClick={() => setSelectedSceneId(scene.id)}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedSceneId === scene.id
                        ? 'bg-primary/10 border-primary/50'
                        : 'bg-bg-elevated border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Drag handle */}
                      <div className="text-text-muted">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                        </svg>
                      </div>

                      {/* Scene number */}
                      <div className="w-8 h-8 rounded-full bg-bg-card flex items-center justify-center text-sm font-medium text-text-secondary">
                        {index + 1}
                      </div>

                      {/* Thumbnail */}
                      <div className="w-16 h-10 rounded bg-bg-card overflow-hidden flex-shrink-0">
                        {scene.thumbnail ? (
                          <video src={scene.thumbnail} className="w-full h-full object-cover" muted />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{scene.title}</p>
                        <p className="text-xs text-text-muted">{scene.duration}s</p>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          scene.status === 'ready'
                            ? 'bg-green-500/20 text-green-400'
                            : scene.status === 'generating'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : scene.status === 'error'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {scene.status}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSceneId(scene.id);
                            setShowGenerator(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-bg-card text-text-muted hover:text-primary"
                          title="Generate video"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeScene(scene.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-bg-card text-text-muted hover:text-red-400"
                          title="Remove scene"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            {/* Add scene button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={addScene}
              className="w-full mt-3 p-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 text-text-muted hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Scene
            </motion.button>
          </>
        )}
      </div>

      {/* Video generator modal */}
      <AnimatePresence>
        {showGenerator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => {
              setShowGenerator(false);
              setEditingSceneId(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <VideoGenerator
                campaignId={campaignId}
                onVideoGenerated={handleVideoGenerated}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected scene preview */}
      <AnimatePresence>
        {selectedScene?.videoUrl && !showGenerator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border"
          >
            <div className="p-4">
              <h4 className="text-sm font-medium text-text-primary mb-2">Preview: {selectedScene.title}</h4>
              <CutscenePlayer
                videoUrl={selectedScene.videoUrl}
                status="SUCCEEDED"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CutsceneSequencer;
