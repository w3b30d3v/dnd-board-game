'use client';

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import type { MapLayer, MapLighting, MapTerrainType } from '@dnd/shared';
import type { GameState, GridPosition, MapData } from '@/game/types';
import { useGameCanvas } from '@/game/useGameCanvas';
import { convertLayersToTileData } from '@/lib/mapEditorUtils';

export type EditorTool = 'paint' | 'erase' | 'fill' | 'select' | 'light' | 'pan';

interface MapEditorCanvasProps {
  width: number;
  height: number;
  tileSize?: number;
  layers: MapLayer[];
  lighting: MapLighting;
  selectedTool: EditorTool;
  selectedTerrain: MapTerrainType;
  showGrid: boolean;
  onTileClick: (x: number, y: number) => void;
  onTileDrag: (x: number, y: number) => void;
  onLightPlace: (x: number, y: number) => void;
  onZoomChange?: (zoom: number) => void;
}

/**
 * MapEditorCanvas
 * PixiJS canvas wrapper for map editing with live preview
 */
export function MapEditorCanvas({
  width,
  height,
  tileSize = 64,
  layers,
  lighting,
  selectedTool,
  selectedTerrain: _selectedTerrain,
  showGrid,
  onTileClick,
  onTileDrag,
  onLightPlace,
  onZoomChange,
}: MapEditorCanvasProps) {
  const containerId = 'map-editor-canvas';
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<GridPosition | null>(null);
  const lastDragPos = useRef<string | null>(null);

  // Handle tile click based on tool
  const handleTileClick = useCallback((position: GridPosition) => {
    if (selectedTool === 'light') {
      onLightPlace(position.x, position.y);
    } else if (selectedTool !== 'pan') {
      onTileClick(position.x, position.y);
    }
  }, [selectedTool, onTileClick, onLightPlace]);

  // Handle tile hover
  const handleTileHover = useCallback((position: GridPosition | null) => {
    setHoverPosition(position);

    // Handle drag painting
    if (isDrawing && position && (selectedTool === 'paint' || selectedTool === 'erase')) {
      const posKey = `${position.x},${position.y}`;
      if (posKey !== lastDragPos.current) {
        lastDragPos.current = posKey;
        onTileDrag(position.x, position.y);
      }
    }
  }, [isDrawing, selectedTool, onTileDrag]);

  // Initialize game canvas
  const {
    containerRef,
    isReady,
    error,
    loadState,
    highlightTiles,
    clearHighlights,
    revealAllFog,
    setZoom,
    getZoom,
  } = useGameCanvas({
    containerId,
    tileSize,
    gridWidth: width,
    gridHeight: height,
    onTileClick: handleTileClick,
    onTileHover: handleTileHover,
  });

  // Convert editor layers to game tile data
  const tiles = useMemo(() => {
    return convertLayersToTileData(layers, width, height);
  }, [layers, width, height]);

  // Create map data for game state
  const mapData: MapData = useMemo(() => ({
    id: 'editor-preview',
    name: 'Editor Preview',
    width,
    height,
    gridSize: 5,
    tiles,
  }), [width, height, tiles]);

  // Create game state
  const gameState: GameState = useMemo(() => ({
    sessionId: 'editor',
    map: mapData,
    creatures: [],
    round: 0,
    phase: 'exploration',
  }), [mapData]);

  // Load state when ready or when tiles change
  useEffect(() => {
    if (isReady) {
      loadState(gameState);
      revealAllFog(); // Show all tiles in editor mode
    }
  }, [isReady, gameState, loadState, revealAllFog]);

  // Highlight hover position
  useEffect(() => {
    if (isReady && hoverPosition && selectedTool !== 'pan') {
      const highlightColor = selectedTool === 'light' ? 0xffcc00 : 0xf59e0b;
      highlightTiles([hoverPosition], highlightColor, 0.3);
    } else if (isReady) {
      clearHighlights();
    }
  }, [isReady, hoverPosition, selectedTool, highlightTiles, clearHighlights]);

  // Handle mouse events for drawing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && selectedTool !== 'pan') { // Left click
      setIsDrawing(true);
      lastDragPos.current = null;
    }
  }, [selectedTool]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    lastDragPos.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDrawing(false);
    lastDragPos.current = null;
    setHoverPosition(null);
  }, []);

  // Handle zoom with scroll wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const currentZoom = getZoom();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.25, Math.min(2, currentZoom + delta));
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [getZoom, setZoom, onZoomChange]);

  // Get cursor style based on tool
  const getCursorStyle = (): string => {
    switch (selectedTool) {
      case 'paint':
        return 'crosshair';
      case 'erase':
        return 'not-allowed';
      case 'fill':
        return 'cell';
      case 'light':
        return 'pointer';
      case 'pan':
        return isDrawing ? 'grabbing' : 'grab';
      case 'select':
      default:
        return 'default';
    }
  };

  // Render light source indicators
  const renderLightIndicators = () => {
    if (!lighting.lightSources?.length) return null;

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {lighting.lightSources.map((light) => {
          const x = light.x * tileSize + tileSize / 2;
          const y = light.y * tileSize + tileSize / 2;
          const radius = light.radius * tileSize;

          return (
            <div
              key={light.id}
              className="absolute rounded-full opacity-30 pointer-events-none"
              style={{
                left: x - radius,
                top: y - radius,
                width: radius * 2,
                height: radius * 2,
                background: `radial-gradient(circle, ${light.color} 0%, transparent 70%)`,
              }}
            />
          );
        })}
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-primary text-danger">
        <div className="text-center">
          <p className="text-lg font-semibold">Failed to load canvas</p>
          <p className="text-sm text-text-muted">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-bg-primary">
      {/* Loading indicator */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-primary z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-text-muted">Loading preview...</p>
          </div>
        </div>
      )}

      {/* Canvas container */}
      <div
        ref={containerRef}
        id={containerId}
        className="w-full h-full"
        style={{ cursor: getCursorStyle() }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      />

      {/* Light source indicators (overlay) */}
      {renderLightIndicators()}

      {/* Grid overlay toggle info */}
      {showGrid && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-bg-card/80 rounded text-xs text-text-muted">
          Grid: {width}x{height} ({width * height} tiles)
        </div>
      )}

      {/* Tool indicator */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-bg-card/80 rounded text-xs text-text-muted capitalize">
        {selectedTool} Tool
      </div>

      {/* Hover position indicator */}
      {hoverPosition && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-bg-card/80 rounded text-xs text-text-muted">
          ({hoverPosition.x}, {hoverPosition.y})
        </div>
      )}
    </div>
  );
}

export default MapEditorCanvas;
