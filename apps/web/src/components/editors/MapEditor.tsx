'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { GameMap, MapTerrainType, MapLayer, MapTile, MapLighting, MapAmbience, LightSource } from '@dnd/shared';
import { EnchantedCard } from '@/components/dnd/EnchantedCard';
import { useMapEditorHistory } from '@/hooks/useMapEditorHistory';
import { LightSourceEditor } from './LightSourceEditor';
import {
  TERRAIN_INFO,
  getTerrainByShortcut,
  createDefaultLight,
  cloneLayers,
  cloneLighting,
} from '@/lib/mapEditorUtils';
import type { EditorTool } from './MapEditorCanvas';

// Dynamic import to avoid SSR issues with PixiJS
const MapEditorCanvas = dynamic(() => import('./MapEditorCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-bg-primary">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-text-muted">Loading editor...</p>
      </div>
    </div>
  ),
});

interface MapEditorProps {
  map: GameMap;
  onSave: (updates: Partial<GameMap>) => Promise<void>;
  onClose: () => void;
}

// Terrain type colors for the simple grid view (fallback)
const TERRAIN_COLORS: Record<MapTerrainType, string> = {
  grass: '#4ade80',
  stone: '#9ca3af',
  water: '#60a5fa',
  lava: '#ef4444',
  ice: '#93c5fd',
  sand: '#fcd34d',
  wood: '#a16207',
  void: '#1f2937',
  difficult: '#f97316',
};

const WEATHER_OPTIONS = [
  { value: 'clear', label: 'Clear', icon: '☀️' },
  { value: 'rain', label: 'Rain', icon: '🌧️' },
  { value: 'snow', label: 'Snow', icon: '❄️' },
  { value: 'fog', label: 'Fog', icon: '🌫️' },
  { value: 'storm', label: 'Storm', icon: '⛈️' },
];

const TIME_OPTIONS = [
  { value: 'dawn', label: 'Dawn', icon: '🌅' },
  { value: 'day', label: 'Day', icon: '☀️' },
  { value: 'dusk', label: 'Dusk', icon: '🌇' },
  { value: 'night', label: 'Night', icon: '🌙' },
];

const TOOL_INFO: Array<{ tool: EditorTool; icon: string; label: string; shortcut: string }> = [
  { tool: 'paint', icon: '🖌️', label: 'Paint', shortcut: 'B' },
  { tool: 'erase', icon: '🧹', label: 'Erase', shortcut: 'E' },
  { tool: 'fill', icon: '🪣', label: 'Fill', shortcut: 'G' },
  { tool: 'light', icon: '💡', label: 'Light', shortcut: 'L' },
  { tool: 'pan', icon: '✋', label: 'Pan', shortcut: 'H' },
];

export function MapEditor({ map, onSave, onClose }: MapEditorProps) {
  // Core state
  const [name, setName] = useState(map.name);
  const [description, setDescription] = useState(map.description || '');
  const [width, setWidth] = useState(map.width);
  const [height, setHeight] = useState(map.height);
  const [layers, setLayers] = useState<MapLayer[]>(map.layers || []);
  const [lighting, setLighting] = useState<MapLighting>(map.lighting || { globalLight: 1, ambientColor: '#ffffff' });
  const [ambience, setAmbience] = useState<MapAmbience>(map.ambience || {});

  // Editor state
  const [selectedTool, setSelectedTool] = useState<EditorTool>('paint');
  const [selectedTerrain, setSelectedTerrain] = useState<MapTerrainType>('stone');
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [selectedLightId, setSelectedLightId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activePanel, setActivePanel] = useState<'terrain' | 'layers' | 'lighting' | 'ambience'>('terrain');
  const [showGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [usePixiPreview, setUsePixiPreview] = useState(true);

  // Undo/redo history
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
  } = useMapEditorHistory({ layers, lighting });

  // Initialize default layer if empty
  useEffect(() => {
    if (layers.length === 0) {
      const defaultLayer: MapLayer = {
        id: 'base',
        name: 'Base Layer',
        visible: true,
        opacity: 1,
        tiles: [],
      };
      setLayers([defaultLayer]);
    }
  }, [layers.length]);

  // Push to history when changes are made
  const pushHistory = useCallback(() => {
    pushState({ layers: cloneLayers(layers), lighting: cloneLighting(lighting) });
  }, [layers, lighting, pushState]);

  // Handle undo
  const handleUndo = useCallback(() => {
    const state = undo();
    if (state) {
      setLayers(state.layers);
      setLighting(state.lighting);
      setHasChanges(true);
    }
  }, [undo]);

  // Handle redo
  const handleRedo = useCallback(() => {
    const state = redo();
    if (state) {
      setLayers(state.layers);
      setLighting(state.lighting);
      setHasChanges(true);
    }
  }, [redo]);

  // Get tile at position
  const getTileAt = useCallback((x: number, y: number): MapTile | undefined => {
    const layer = layers[selectedLayerIndex];
    if (!layer) return undefined;
    return layer.tiles.find((t) => t.x === x && t.y === y);
  }, [layers, selectedLayerIndex]);

  // Set tile at position
  const setTileAt = useCallback((x: number, y: number, terrain: MapTerrainType | null) => {
    setLayers((prev) => {
      const newLayers = [...prev];
      const layer = { ...newLayers[selectedLayerIndex] };
      const tiles = [...layer.tiles];

      const existingIndex = tiles.findIndex((t) => t.x === x && t.y === y);

      if (terrain === null) {
        // Erase - remove tile
        if (existingIndex >= 0) {
          tiles.splice(existingIndex, 1);
        }
      } else {
        // Paint or update tile
        if (existingIndex >= 0) {
          tiles[existingIndex] = { ...tiles[existingIndex], terrain };
        } else {
          tiles.push({ x, y, terrain });
        }
      }

      layer.tiles = tiles;
      newLayers[selectedLayerIndex] = layer;
      return newLayers;
    });
    setHasChanges(true);
  }, [selectedLayerIndex]);

  // Handle tile click based on tool
  const handleTileClick = useCallback((x: number, y: number) => {
    pushHistory();

    if (selectedTool === 'paint') {
      setTileAt(x, y, selectedTerrain);
    } else if (selectedTool === 'erase') {
      setTileAt(x, y, null);
    } else if (selectedTool === 'fill') {
      // Flood fill
      const targetTile = getTileAt(x, y);
      const targetTerrain = targetTile?.terrain || null;
      if (targetTerrain === selectedTerrain) return;

      const toFill: Set<string> = new Set();
      const queue = [{ x, y }];

      while (queue.length > 0 && toFill.size < 1000) {
        const pos = queue.shift()!;
        const key = `${pos.x},${pos.y}`;

        if (pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height) continue;
        if (toFill.has(key)) continue;

        const tile = getTileAt(pos.x, pos.y);
        const terrain = tile?.terrain || null;
        if (terrain !== targetTerrain) continue;

        toFill.add(key);
        queue.push({ x: pos.x + 1, y: pos.y });
        queue.push({ x: pos.x - 1, y: pos.y });
        queue.push({ x: pos.x, y: pos.y + 1 });
        queue.push({ x: pos.x, y: pos.y - 1 });
      }

      toFill.forEach((key) => {
        const [cx, cy] = key.split(',').map(Number);
        setTileAt(cx, cy, selectedTerrain);
      });
    }
  }, [selectedTool, selectedTerrain, getTileAt, setTileAt, width, height, pushHistory]);

  // Handle drag painting
  const handleTileDrag = useCallback((x: number, y: number) => {
    if (selectedTool === 'paint') {
      setTileAt(x, y, selectedTerrain);
    } else if (selectedTool === 'erase') {
      setTileAt(x, y, null);
    }
  }, [selectedTool, selectedTerrain, setTileAt]);

  // Handle light placement
  const handleLightPlace = useCallback((x: number, y: number) => {
    pushHistory();
    const newLight = createDefaultLight(x, y);
    setLighting((prev) => ({
      ...prev,
      lightSources: [...(prev.lightSources || []), newLight],
    }));
    setSelectedLightId(newLight.id);
    setHasChanges(true);
  }, [pushHistory]);

  // Update light source
  const handleUpdateLight = useCallback((id: string, updates: Partial<LightSource>) => {
    setLighting((prev) => ({
      ...prev,
      lightSources: prev.lightSources?.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    }));
    setHasChanges(true);
  }, []);

  // Delete light source
  const handleDeleteLight = useCallback((id: string) => {
    pushHistory();
    setLighting((prev) => ({
      ...prev,
      lightSources: prev.lightSources?.filter((l) => l.id !== id),
    }));
    if (selectedLightId === id) {
      setSelectedLightId(null);
    }
    setHasChanges(true);
  }, [selectedLightId, pushHistory]);

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    await onSave({
      name,
      description: description || undefined,
      width,
      height,
      layers,
      lighting,
      ambience,
    });
    setSaving(false);
    setHasChanges(false);
  };

  // Add layer
  const addLayer = () => {
    pushHistory();
    const newLayer: MapLayer = {
      id: `layer_${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      opacity: 1,
      tiles: [],
    };
    setLayers([...layers, newLayer]);
    setSelectedLayerIndex(layers.length);
    setHasChanges(true);
  };

  // Delete layer
  const deleteLayer = (index: number) => {
    if (layers.length <= 1) return;
    pushHistory();
    const newLayers = layers.filter((_, i) => i !== index);
    setLayers(newLayers);
    if (selectedLayerIndex >= newLayers.length) {
      setSelectedLayerIndex(newLayers.length - 1);
    }
    setHasChanges(true);
  };

  // Resize map
  const resizeMap = (newWidth: number, newHeight: number) => {
    pushHistory();
    setWidth(newWidth);
    setHeight(newHeight);
    // Clip tiles outside new bounds
    setLayers((prev) =>
      prev.map((layer) => ({
        ...layer,
        tiles: layer.tiles.filter((t) => t.x < newWidth && t.y < newHeight),
      }))
    );
    setHasChanges(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
          return;
        }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          handleRedo();
          return;
        }
        if (e.key === 's') {
          e.preventDefault();
          if (hasChanges) handleSave();
          return;
        }
      }

      // Tool shortcuts
      const key = e.key.toUpperCase();
      switch (key) {
        case 'B':
          setSelectedTool('paint');
          break;
        case 'E':
          setSelectedTool('erase');
          break;
        case 'G':
          setSelectedTool('fill');
          break;
        case 'L':
          setSelectedTool('light');
          setActivePanel('lighting');
          break;
        case 'H':
          setSelectedTool('pan');
          break;
        default: {
          // Terrain shortcuts (1-9)
          const terrain = getTerrainByShortcut(e.key);
          if (terrain) {
            setSelectedTerrain(terrain);
            setActivePanel('terrain');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, hasChanges, handleSave]);

  // Warn before closing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  return (
    <div className="fixed inset-0 z-50 flex bg-bg-primary">
      {/* Left Sidebar - Tools Panel */}
      <div className="w-64 bg-bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="font-cinzel font-bold text-text-primary text-lg truncate">{name || 'Untitled Map'}</h2>
          <p className="text-xs text-text-muted">{width}x{height} tiles</p>
        </div>

        {/* Tool Buttons */}
        <div className="p-3 border-b border-border">
          <div className="grid grid-cols-5 gap-1">
            {TOOL_INFO.map(({ tool, icon, label, shortcut }) => (
              <motion.button
                key={tool}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTool(tool)}
                className={`p-2 rounded-lg text-center transition-colors ${
                  selectedTool === tool
                    ? 'bg-secondary/20 border border-secondary/50'
                    : 'bg-bg-elevated hover:bg-border'
                }`}
                title={`${label} (${shortcut})`}
              >
                <span className="text-lg">{icon}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Panel Tabs */}
        <div className="flex border-b border-border">
          {(['terrain', 'layers', 'lighting', 'ambience'] as const).map((panel) => (
            <button
              key={panel}
              onClick={() => setActivePanel(panel)}
              className={`flex-1 px-2 py-2 text-xs capitalize transition-colors ${
                activePanel === panel
                  ? 'text-secondary border-b-2 border-secondary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {panel}
            </button>
          ))}
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-3">
          <AnimatePresence mode="wait">
            {activePanel === 'terrain' && (
              <motion.div
                key="terrain"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-2"
              >
                {TERRAIN_INFO.map(({ type, label, icon, shortcut }) => (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTerrain(type)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      selectedTerrain === type
                        ? 'bg-secondary/20 border border-secondary/50'
                        : 'bg-bg-elevated hover:bg-border'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-sm"
                      style={{ backgroundColor: TERRAIN_COLORS[type] }}
                    >
                      {icon}
                    </div>
                    <span className="flex-1 text-sm text-text-primary text-left">{label}</span>
                    <span className="text-xs text-text-muted">{shortcut}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {activePanel === 'layers' && (
              <motion.div
                key="layers"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-2"
              >
                {layers.map((layer, index) => (
                  <div
                    key={layer.id}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
                      selectedLayerIndex === index
                        ? 'bg-secondary/20 border border-secondary/50'
                        : 'bg-bg-elevated hover:bg-border'
                    }`}
                    onClick={() => setSelectedLayerIndex(index)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLayers((prev) =>
                          prev.map((l, i) =>
                            i === index ? { ...l, visible: !l.visible } : l
                          )
                        );
                        setHasChanges(true);
                      }}
                      className="text-sm"
                    >
                      {layer.visible ? '👁️' : '🚫'}
                    </button>
                    <span className="flex-1 text-sm text-text-primary truncate">{layer.name}</span>
                    {layers.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLayer(index);
                        }}
                        className="text-xs text-danger hover:text-danger/80"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addLayer}
                  className="w-full p-2 text-sm text-secondary border border-dashed border-secondary/50 rounded-lg hover:bg-secondary/10"
                >
                  + Add Layer
                </motion.button>
              </motion.div>
            )}

            {activePanel === 'lighting' && (
              <motion.div
                key="lighting"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                {/* Global Lighting */}
                <div>
                  <label className="block text-xs text-text-muted mb-1">Global Light</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={lighting.globalLight}
                    onChange={(e) => {
                      setLighting({ ...lighting, globalLight: parseFloat(e.target.value) });
                      setHasChanges(true);
                    }}
                    className="w-full accent-secondary"
                  />
                  <span className="text-xs text-text-muted">{Math.round(lighting.globalLight * 100)}%</span>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Ambient Color</label>
                  <input
                    type="color"
                    value={lighting.ambientColor}
                    onChange={(e) => {
                      setLighting({ ...lighting, ambientColor: e.target.value });
                      setHasChanges(true);
                    }}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>

                {/* Light Sources */}
                <div className="pt-2 border-t border-border">
                  <h4 className="text-xs font-medium text-text-primary mb-2">
                    Point Lights ({lighting.lightSources?.length || 0})
                  </h4>
                  <LightSourceEditor
                    lights={lighting.lightSources || []}
                    selectedLightId={selectedLightId}
                    onSelectLight={setSelectedLightId}
                    onUpdateLight={handleUpdateLight}
                    onDeleteLight={handleDeleteLight}
                  />
                </div>
              </motion.div>
            )}

            {activePanel === 'ambience' && (
              <motion.div
                key="ambience"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs text-text-muted mb-2">Weather</label>
                  <div className="grid grid-cols-3 gap-1">
                    {WEATHER_OPTIONS.map(({ value, label, icon }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setAmbience({ ...ambience, weather: value as MapAmbience['weather'] });
                          setHasChanges(true);
                        }}
                        className={`p-2 rounded text-center text-xs transition-colors ${
                          ambience.weather === value
                            ? 'bg-secondary/20 border border-secondary/50'
                            : 'bg-bg-elevated hover:bg-border'
                        }`}
                      >
                        <span className="text-lg">{icon}</span>
                        <p className="text-text-muted">{label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-2">Time of Day</label>
                  <div className="grid grid-cols-2 gap-1">
                    {TIME_OPTIONS.map(({ value, label, icon }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setAmbience({ ...ambience, timeOfDay: value as MapAmbience['timeOfDay'] });
                          setHasChanges(true);
                        }}
                        className={`p-2 rounded text-center text-xs transition-colors ${
                          ambience.timeOfDay === value
                            ? 'bg-secondary/20 border border-secondary/50'
                            : 'bg-bg-elevated hover:bg-border'
                        }`}
                      >
                        <span className="text-lg">{icon}</span>
                        <p className="text-text-muted">{label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-14 bg-bg-card border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUndo}
                disabled={!canUndo}
                className={`p-2 rounded-lg transition-colors ${
                  canUndo ? 'hover:bg-bg-elevated' : 'opacity-40 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                ↩️
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRedo}
                disabled={!canRedo}
                className={`p-2 rounded-lg transition-colors ${
                  canRedo ? 'hover:bg-bg-elevated' : 'opacity-40 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Shift+Z)"
              >
                ↪️
              </motion.button>
            </div>

            <div className="w-px h-6 bg-border" />

            {/* Map Name */}
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setHasChanges(true);
              }}
              className="bg-transparent text-text-primary font-semibold border-b border-transparent hover:border-border focus:border-secondary focus:outline-none"
              placeholder="Map Name"
            />

            <div className="w-px h-6 bg-border" />

            {/* Size Controls */}
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span>Size:</span>
              <input
                type="number"
                min={5}
                max={100}
                value={width}
                onChange={(e) => resizeMap(parseInt(e.target.value) || 10, height)}
                className="w-12 px-1 py-0.5 rounded bg-bg-elevated text-text-primary text-center"
              />
              <span>×</span>
              <input
                type="number"
                min={5}
                max={100}
                value={height}
                onChange={(e) => resizeMap(width, parseInt(e.target.value) || 10)}
                className="w-12 px-1 py-0.5 rounded bg-bg-elevated text-text-primary text-center"
              />
            </div>

            <div className="w-px h-6 bg-border" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span>Zoom:</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                className="p-1 hover:bg-bg-elevated rounded"
              >
                ➖
              </motion.button>
              <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                className="p-1 hover:bg-bg-elevated rounded"
              >
                ➕
              </motion.button>
            </div>

            <div className="w-px h-6 bg-border" />

            {/* Preview Toggle */}
            <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={usePixiPreview}
                onChange={(e) => setUsePixiPreview(e.target.checked)}
                className="accent-secondary"
              />
              Live Preview
            </label>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-xs text-warning">Unsaved changes</span>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="btn-magic text-sm px-4 py-2"
            >
              {saving ? 'Saving...' : 'Save Map'}
            </motion.button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          {usePixiPreview ? (
            <MapEditorCanvas
              width={width}
              height={height}
              tileSize={64}
              layers={layers}
              lighting={lighting}
              selectedTool={selectedTool}
              selectedTerrain={selectedTerrain}
              showGrid={showGrid}
              onTileClick={handleTileClick}
              onTileDrag={handleTileDrag}
              onLightPlace={handleLightPlace}
              onZoomChange={setZoom}
            />
          ) : (
            // Fallback simple grid (original implementation)
            <div className="w-full h-full overflow-auto p-4 bg-bg-primary">
              <div
                className="inline-grid border border-border rounded-lg overflow-hidden"
                style={{
                  gridTemplateColumns: `repeat(${width}, ${24 * zoom}px)`,
                  backgroundColor: lighting.ambientColor,
                  opacity: lighting.globalLight,
                }}
              >
                {Array.from({ length: height }, (_, y) =>
                  Array.from({ length: width }, (_, x) => {
                    const tile = getTileAt(x, y);
                    const bgColor = tile ? TERRAIN_COLORS[tile.terrain] : '#1f2937';

                    return (
                      <div
                        key={`${x}-${y}`}
                        className="border border-border/30 cursor-crosshair transition-colors hover:brightness-125"
                        style={{
                          width: `${24 * zoom}px`,
                          height: `${24 * zoom}px`,
                          backgroundColor: bgColor,
                        }}
                        onMouseDown={() => handleTileClick(x, y)}
                        onMouseEnter={(e) => {
                          if (e.buttons === 1) handleTileDrag(x, y);
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      <div className="w-72 bg-bg-card border-l border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-text-primary">Map Properties</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setHasChanges(true);
              }}
              className="w-full px-3 py-2 rounded bg-bg-elevated border border-border text-text-primary text-sm resize-none focus:border-secondary focus:outline-none"
              rows={4}
              placeholder="Describe this map..."
            />
          </div>

          <EnchantedCard className="p-3">
            <h4 className="text-sm font-medium text-text-primary mb-2">Statistics</h4>
            <div className="space-y-1 text-xs text-text-muted">
              <div className="flex justify-between">
                <span>Total Tiles</span>
                <span>{width * height}</span>
              </div>
              <div className="flex justify-between">
                <span>Painted Tiles</span>
                <span>{layers.reduce((sum, l) => sum + l.tiles.length, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Layers</span>
                <span>{layers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Light Sources</span>
                <span>{lighting.lightSources?.length || 0}</span>
              </div>
            </div>
          </EnchantedCard>

          <EnchantedCard className="p-3">
            <h4 className="text-sm font-medium text-text-primary mb-2">Keyboard Shortcuts</h4>
            <div className="space-y-1 text-xs text-text-muted">
              <div className="flex justify-between">
                <span>Undo</span>
                <span className="text-text-secondary">Ctrl+Z</span>
              </div>
              <div className="flex justify-between">
                <span>Redo</span>
                <span className="text-text-secondary">Ctrl+Shift+Z</span>
              </div>
              <div className="flex justify-between">
                <span>Save</span>
                <span className="text-text-secondary">Ctrl+S</span>
              </div>
              <div className="flex justify-between">
                <span>Paint Tool</span>
                <span className="text-text-secondary">B</span>
              </div>
              <div className="flex justify-between">
                <span>Erase Tool</span>
                <span className="text-text-secondary">E</span>
              </div>
              <div className="flex justify-between">
                <span>Fill Tool</span>
                <span className="text-text-secondary">G</span>
              </div>
              <div className="flex justify-between">
                <span>Light Tool</span>
                <span className="text-text-secondary">L</span>
              </div>
              <div className="flex justify-between">
                <span>Terrain 1-9</span>
                <span className="text-text-secondary">1-9</span>
              </div>
            </div>
          </EnchantedCard>

          <EnchantedCard className="p-3">
            <h4 className="text-sm font-medium text-text-primary mb-2">Quick Actions</h4>
            <div className="space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (confirm('Clear all tiles on the current layer?')) {
                    pushHistory();
                    setLayers((prev) =>
                      prev.map((l, i) =>
                        i === selectedLayerIndex ? { ...l, tiles: [] } : l
                      )
                    );
                    setHasChanges(true);
                  }
                }}
                className="w-full px-3 py-2 text-sm text-danger bg-danger/10 rounded hover:bg-danger/20 transition-colors"
              >
                Clear Layer
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  pushHistory();
                  const newTiles: MapTile[] = [];
                  for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                      newTiles.push({ x, y, terrain: selectedTerrain });
                    }
                  }
                  setLayers((prev) =>
                    prev.map((l, i) =>
                      i === selectedLayerIndex ? { ...l, tiles: newTiles } : l
                    )
                  );
                  setHasChanges(true);
                }}
                className="w-full px-3 py-2 text-sm text-secondary bg-secondary/10 rounded hover:bg-secondary/20 transition-colors"
              >
                Fill with {selectedTerrain}
              </motion.button>
            </div>
          </EnchantedCard>
        </div>
      </div>
    </div>
  );
}

export default MapEditor;
