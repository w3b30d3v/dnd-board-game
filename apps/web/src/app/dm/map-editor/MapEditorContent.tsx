'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useRequireAuth } from '@/hooks/useAuth';
import type { MapTerrainType } from '@dnd/shared';
import { TERRAIN_INFO, TERRAIN_PREVIEW_COLORS, numberToHex } from '@/lib/mapEditorUtils';

// Map data interface
interface MapData {
  id?: string;
  name: string;
  width: number;
  height: number;
  tiles: MapTerrainType[][];
  locationId?: string;
  locationName?: string;
}

const TILE_SIZE = 32;

// Helper function to create empty tilemap
function createEmptyTilemap(width: number, height: number): MapTerrainType[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 'stone' as MapTerrainType)
  );
}

// Helper function to get tile at position
function getTileAtPosition(tiles: MapTerrainType[][], x: number, y: number): MapTerrainType {
  if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
    return tiles[y][x];
  }
  return 'stone';
}

// Helper function to set tile at position
function setTileAtPosition(tiles: MapTerrainType[][], x: number, y: number, terrain: MapTerrainType): void {
  if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
    tiles[y][x] = terrain;
  }
}

// Helper function for flood fill
function floodFillTiles(
  tiles: MapTerrainType[][],
  startX: number,
  startY: number,
  newTerrain: MapTerrainType
): MapTerrainType[][] {
  const newTiles = tiles.map(row => [...row]);
  const targetTerrain = getTileAtPosition(newTiles, startX, startY);

  if (targetTerrain === newTerrain) return newTiles;

  const stack: [number, number][] = [[startX, startY]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (x < 0 || x >= newTiles[0].length || y < 0 || y >= newTiles.length) continue;
    if (getTileAtPosition(newTiles, x, y) !== targetTerrain) continue;

    visited.add(key);
    setTileAtPosition(newTiles, x, y, newTerrain);

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return newTiles;
}

export default function MapEditorContent() {
  const searchParams = useSearchParams();
  const locationId = searchParams?.get('locationId');
  const locationName = searchParams?.get('locationName');
  const campaignId = searchParams?.get('campaignId');

  const { token, _hasHydrated } = useAuthStore();
  useRequireAuth('/login');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapData, setMapData] = useState<MapData>(() => ({
    name: locationName || 'New Map',
    width: 20,
    height: 15,
    tiles: createEmptyTilemap(20, 15),
    locationId: locationId || undefined,
    locationName: locationName || undefined,
  }));

  const [selectedTerrain, setSelectedTerrain] = useState<MapTerrainType>('grass');
  const [tool, setTool] = useState<'brush' | 'fill' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Render map to canvas
  const renderMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1E1B26';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const terrain = getTileAtPosition(mapData.tiles, x, y);
        const color = TERRAIN_PREVIEW_COLORS[terrain] || 0x333333;

        ctx.fillStyle = numberToHex(color);
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }

    // Draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= mapData.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * TILE_SIZE, 0);
      ctx.lineTo(x * TILE_SIZE, mapData.height * TILE_SIZE);
      ctx.stroke();
    }

    for (let y = 0; y <= mapData.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * TILE_SIZE);
      ctx.lineTo(mapData.width * TILE_SIZE, y * TILE_SIZE);
      ctx.stroke();
    }
  }, [mapData]);

  // Render whenever map changes
  useEffect(() => {
    renderMap();
  }, [renderMap]);

  // Handle canvas interaction
  const handleCanvasInteraction = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
      const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

      if (x < 0 || x >= mapData.width || y < 0 || y >= mapData.height) return;

      if (tool === 'fill') {
        const newTiles = floodFillTiles(mapData.tiles, x, y, selectedTerrain);
        setMapData((prev) => ({ ...prev, tiles: newTiles }));
      } else {
        const terrainToUse: MapTerrainType = tool === 'eraser' ? 'stone' : selectedTerrain;
        const newTiles = mapData.tiles.map((row) => [...row]);

        // Apply brush with size
        const halfBrush = Math.floor(brushSize / 2);
        for (let dy = -halfBrush; dy <= halfBrush; dy++) {
          for (let dx = -halfBrush; dx <= halfBrush; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < mapData.width && ny >= 0 && ny < mapData.height) {
              setTileAtPosition(newTiles, nx, ny, terrainToUse);
            }
          }
        }

        setMapData((prev) => ({ ...prev, tiles: newTiles }));
      }
    },
    [mapData, selectedTerrain, tool, brushSize]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    handleCanvasInteraction(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (tool === 'fill') return; // Don't drag-fill
    handleCanvasInteraction(e);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Save map
  const handleSave = async () => {
    if (!token || !campaignId) {
      setSaveMessage('Please provide a campaign ID');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/maps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: mapData.name,
          width: mapData.width,
          height: mapData.height,
          tiles: mapData.tiles,
          locationId: mapData.locationId,
        }),
      });

      if (response.ok) {
        setSaveMessage('Map saved successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const error = await response.json();
        setSaveMessage(error.error || 'Failed to save map');
      }
    } catch {
      setSaveMessage('Network error - please try again');
    } finally {
      setIsSaving(false);
    }
  };

  // Resize map
  const handleResize = (newWidth: number, newHeight: number) => {
    const newTiles = createEmptyTilemap(newWidth, newHeight);

    // Copy existing tiles
    for (let y = 0; y < Math.min(mapData.height, newHeight); y++) {
      for (let x = 0; x < Math.min(mapData.width, newWidth); x++) {
        newTiles[y][x] = mapData.tiles[y][x];
      }
    }

    setMapData((prev) => ({
      ...prev,
      width: newWidth,
      height: newHeight,
      tiles: newTiles,
    }));
  };

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="w-12 h-12 spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      {/* Header */}
      <header className="bg-bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href={campaignId ? `/dm/campaign-studio?id=${campaignId}` : '/dm'}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-bg-elevated transition-colors"
              >
                <svg
                  className="w-5 h-5 text-text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </motion.button>
            </Link>
            <div>
              <input
                type="text"
                value={mapData.name}
                onChange={(e) => setMapData((prev) => ({ ...prev, name: e.target.value }))}
                className="text-lg font-cinzel font-bold text-text-primary bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded px-1"
              />
              {locationName && (
                <p className="text-xs text-text-muted">
                  Location: {locationName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving || !campaignId}
              className="px-4 py-2 rounded-lg bg-primary text-bg-dark font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Map'}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Save message */}
      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mx-4 mt-2 px-4 py-2 rounded-lg text-sm ${
              saveMessage.includes('success')
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {saveMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        <div className="w-64 bg-bg-card border-r border-border p-4 overflow-y-auto">
          {/* Tools */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-text-primary mb-2">Tools</h3>
            <div className="flex gap-2">
              {[
                { id: 'brush', icon: '🖌️', label: 'Brush' },
                { id: 'fill', icon: '🪣', label: 'Fill' },
                { id: 'eraser', icon: '🧹', label: 'Eraser' },
              ].map((t) => (
                <motion.button
                  key={t.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTool(t.id as typeof tool)}
                  className={`flex-1 p-2 rounded-lg text-center transition-colors ${
                    tool === t.id
                      ? 'bg-primary text-bg-dark'
                      : 'bg-bg-elevated text-text-secondary hover:bg-border'
                  }`}
                  title={t.label}
                >
                  {t.icon}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Brush Size */}
          {tool === 'brush' && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-primary mb-2">
                Brush Size: {brushSize}
              </h3>
              <input
                type="range"
                min="1"
                max="5"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Terrain Types */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-text-primary mb-2">Terrain</h3>
            <div className="grid grid-cols-2 gap-2">
              {TERRAIN_INFO.map((terrain) => (
                <motion.button
                  key={terrain.type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTerrain(terrain.type)}
                  className={`p-2 rounded-lg flex items-center gap-2 transition-colors ${
                    selectedTerrain === terrain.type
                      ? 'ring-2 ring-primary bg-bg-elevated'
                      : 'bg-bg-elevated hover:bg-border'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded"
                    style={{ backgroundColor: numberToHex(TERRAIN_PREVIEW_COLORS[terrain.type]) }}
                  />
                  <span className="text-xs text-text-secondary truncate">
                    {terrain.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Map Size */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-text-primary mb-2">Map Size</h3>
            <div className="flex gap-2">
              <div>
                <label className="text-xs text-text-muted">Width</label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={mapData.width}
                  onChange={(e) =>
                    handleResize(Number(e.target.value), mapData.height)
                  }
                  className="w-full px-2 py-1 bg-bg-elevated border border-border rounded text-sm text-text-primary"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted">Height</label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={mapData.height}
                  onChange={(e) =>
                    handleResize(mapData.width, Number(e.target.value))
                  }
                  className="w-full px-2 py-1 bg-bg-elevated border border-border rounded text-sm text-text-primary"
                />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div>
            <h3 className="text-sm font-medium text-text-primary mb-2">Legend</h3>
            <div className="space-y-1">
              {TERRAIN_INFO.map((terrain) => (
                <div key={terrain.type} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: numberToHex(TERRAIN_PREVIEW_COLORS[terrain.type]) }}
                  />
                  <span className="text-text-muted">{terrain.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-bg-dark">
          <div className="border border-border rounded-lg overflow-hidden shadow-lg">
            <canvas
              ref={canvasRef}
              width={mapData.width * TILE_SIZE}
              height={mapData.height * TILE_SIZE}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="cursor-crosshair"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
