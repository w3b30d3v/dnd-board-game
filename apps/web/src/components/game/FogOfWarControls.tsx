'use client';

/**
 * FogOfWarControls
 * DM tool for revealing and hiding areas of the map
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Sun,
  Moon,
  Square,
  Circle,
  Undo,
  RefreshCw,
  X,
  ChevronDown,
} from 'lucide-react';
import type { GridPosition } from '@/game/types';

// Fog states
export type FogState = 'hidden' | 'dim' | 'visible';

// Reveal tool modes
export type RevealMode = 'paint' | 'rectangle' | 'circle' | 'token_sight';

interface FogOfWarControlsProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: RevealMode;
  brushSize: number;
  onModeChange: (mode: RevealMode) => void;
  onBrushSizeChange: (size: number) => void;
  onRevealArea: (positions: GridPosition[], state: FogState) => void;
  onRevealAll: () => void;
  onHideAll: () => void;
  onUndoLastReveal: () => void;
  onResetFog: () => void;
  canUndo: boolean;
}

export function FogOfWarControls({
  isOpen,
  onClose,
  currentMode,
  brushSize,
  onModeChange,
  onBrushSizeChange,
  onRevealArea,
  onRevealAll,
  onHideAll,
  onUndoLastReveal,
  onResetFog,
  canUndo,
}: FogOfWarControlsProps) {
  const [selectedFogState, setSelectedFogState] = useState<FogState>('visible');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Tool buttons
  const tools = [
    { id: 'paint' as RevealMode, name: 'Paint', icon: Square, desc: 'Click/drag to reveal' },
    { id: 'rectangle' as RevealMode, name: 'Rectangle', icon: Square, desc: 'Draw a rectangle' },
    { id: 'circle' as RevealMode, name: 'Circle', icon: Circle, desc: 'Draw a circle' },
    { id: 'token_sight' as RevealMode, name: 'Token Sight', icon: Eye, desc: 'Auto-reveal based on token position' },
  ];

  // Fog state buttons
  const fogStates: Array<{ id: FogState; name: string; icon: React.ComponentType<{ className?: string }>; color: string }> = [
    { id: 'visible', name: 'Reveal', icon: Sun, color: '#22C55E' },
    { id: 'dim', name: 'Dim', icon: Moon, color: '#F59E0B' },
    { id: 'hidden', name: 'Hide', icon: EyeOff, color: '#6B7280' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed right-4 top-20 w-72 bg-gradient-to-b from-[#1E1B26] to-[#0d0a14] rounded-xl border border-purple-500/30 shadow-2xl overflow-hidden z-40"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-purple-900/20">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-400" />
            <span className="font-medium text-white">Fog of War</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Reveal/Hide State */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Paint Mode</label>
            <div className="flex gap-2">
              {fogStates.map((state) => {
                const Icon = state.icon;
                return (
                  <button
                    key={state.id}
                    onClick={() => setSelectedFogState(state.id)}
                    className={`flex-1 p-2 rounded-lg border transition-colors flex flex-col items-center gap-1 ${
                      selectedFogState === state.id
                        ? 'border-2'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    style={{
                      borderColor: selectedFogState === state.id ? state.color : undefined,
                      backgroundColor: selectedFogState === state.id ? `${state.color}20` : undefined,
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: state.color }} />
                    <span className="text-xs text-white">{state.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tool Selection */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Tool</label>
            <div className="grid grid-cols-2 gap-2">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => onModeChange(tool.id)}
                    className={`p-3 rounded-lg border transition-colors text-left ${
                      currentMode === tool.id
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <div className="text-xs font-medium text-white">{tool.name}</div>
                    <div className="text-xs text-gray-500 truncate">{tool.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brush Size (for paint mode) */}
          {currentMode === 'paint' && (
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Brush Size: {brushSize}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={brushSize}
                onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onRevealArea([], selectedFogState)}
              className="flex-1 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-400 transition-colors"
              title="Click and drag on map to reveal"
            >
              Start Painting
            </button>
            <button
              onClick={onUndoLastReveal}
              disabled={!canUndo}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo last reveal"
            >
              <Undo className="w-4 h-4" />
            </button>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-400 transition-colors"
            >
              <span>Advanced Options</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 space-y-2 overflow-hidden"
                >
                  <button
                    onClick={onRevealAll}
                    className="w-full p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-sm text-green-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Sun className="w-4 h-4" />
                    Reveal Entire Map
                  </button>
                  <button
                    onClick={onHideAll}
                    className="w-full p-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 rounded-lg text-sm text-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <EyeOff className="w-4 h-4" />
                    Hide Entire Map
                  </button>
                  <button
                    onClick={onResetFog}
                    className="w-full p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset to Default
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Instructions */}
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400">
              <strong className="text-gray-300">How to use:</strong>
              <br />
              1. Select reveal/dim/hide mode
              <br />
              2. Choose a tool (paint, rectangle, circle)
              <br />
              3. Click and drag on the map to modify fog
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default FogOfWarControls;
