'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { LightSource } from '@dnd/shared';
import { LIGHT_COLOR_PRESETS } from '@/lib/mapEditorUtils';

interface LightSourceEditorProps {
  lights: LightSource[];
  selectedLightId: string | null;
  onSelectLight: (id: string | null) => void;
  onUpdateLight: (id: string, updates: Partial<LightSource>) => void;
  onDeleteLight: (id: string) => void;
}

export function LightSourceEditor({
  lights,
  selectedLightId,
  onSelectLight,
  onUpdateLight,
  onDeleteLight,
}: LightSourceEditorProps) {
  const selectedLight = lights.find(l => l.id === selectedLightId);

  return (
    <div className="space-y-3">
      {/* Light List */}
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {lights.length === 0 ? (
          <p className="text-xs text-text-muted italic">
            No lights placed. Select the Light tool and click on the map.
          </p>
        ) : (
          lights.map((light) => (
            <motion.div
              key={light.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectLight(light.id === selectedLightId ? null : light.id)}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                selectedLightId === light.id
                  ? 'bg-secondary/20 border border-secondary/50'
                  : 'bg-bg-elevated hover:bg-border'
              }`}
            >
              <div
                className="w-4 h-4 rounded-full shadow-lg"
                style={{
                  backgroundColor: light.color,
                  boxShadow: `0 0 8px ${light.color}`,
                }}
              />
              <span className="flex-1 text-xs text-text-primary truncate">
                ({light.x}, {light.y})
              </span>
              <span className="text-xs text-text-muted">
                r:{light.radius}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLight(light.id);
                }}
                className="text-xs text-danger hover:text-danger/80 p-1"
              >
                ✕
              </motion.button>
            </motion.div>
          ))
        )}
      </div>

      {/* Selected Light Properties */}
      <AnimatePresence mode="wait">
        {selectedLight && (
          <motion.div
            key="light-props"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 p-3 bg-bg-elevated rounded-lg border border-border"
          >
            <h5 className="text-xs font-medium text-text-primary">Light Properties</h5>

            {/* Position (read-only) */}
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>Position:</span>
              <span className="text-text-primary">
                ({selectedLight.x}, {selectedLight.y})
              </span>
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-xs text-text-muted mb-1">Color</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {LIGHT_COLOR_PRESETS.map((preset) => (
                  <motion.button
                    key={preset.name}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onUpdateLight(selectedLight.id, { color: preset.color })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      selectedLight.color === preset.color
                        ? 'border-white scale-110'
                        : 'border-transparent'
                    }`}
                    style={{
                      backgroundColor: preset.color,
                      boxShadow: selectedLight.color === preset.color
                        ? `0 0 8px ${preset.color}`
                        : 'none',
                    }}
                    title={preset.name}
                  />
                ))}
              </div>
              <input
                type="color"
                value={selectedLight.color}
                onChange={(e) => onUpdateLight(selectedLight.id, { color: e.target.value })}
                className="w-full h-8 rounded cursor-pointer bg-bg-primary"
              />
            </div>

            {/* Radius */}
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Radius: {selectedLight.radius} tiles
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={selectedLight.radius}
                onChange={(e) => onUpdateLight(selectedLight.id, { radius: parseInt(e.target.value) })}
                className="w-full accent-secondary"
              />
            </div>

            {/* Intensity */}
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Intensity: {Math.round(selectedLight.intensity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={selectedLight.intensity}
                onChange={(e) => onUpdateLight(selectedLight.id, { intensity: parseFloat(e.target.value) })}
                className="w-full accent-secondary"
              />
            </div>

            {/* Flicker */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="light-flicker"
                checked={selectedLight.flicker || false}
                onChange={(e) => onUpdateLight(selectedLight.id, { flicker: e.target.checked })}
                className="w-4 h-4 accent-secondary"
              />
              <label htmlFor="light-flicker" className="text-xs text-text-primary cursor-pointer">
                Flicker effect
              </label>
            </div>

            {/* Delete Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onDeleteLight(selectedLight.id);
                onSelectLight(null);
              }}
              className="w-full px-3 py-2 text-xs text-danger bg-danger/10 rounded hover:bg-danger/20 transition-colors"
            >
              Delete Light
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LightSourceEditor;
