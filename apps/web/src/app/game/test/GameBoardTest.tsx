'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GameApplication } from '@/game/GameApplication';
import type { GameState, GridPosition, Creature, MapData, TileData } from '@/game/types';

// Generate a sample map
function generateSampleMap(): MapData {
  const width = 20;
  const height = 15;
  const tiles: TileData[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let terrain: TileData['terrain'] = 'NORMAL';

      // Add some terrain variety
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        terrain = 'WALL';
      } else if ((x === 5 && y >= 3 && y <= 7) || (y === 5 && x >= 5 && x <= 8)) {
        terrain = 'WALL';
      } else if (x === 10 && y === 5) {
        terrain = 'DOOR';
      } else if (x >= 12 && x <= 14 && y >= 3 && y <= 5) {
        terrain = 'WATER';
      } else if (x === 15 && y === 10) {
        terrain = 'STAIRS';
      } else if (x >= 3 && x <= 4 && y >= 10 && y <= 12) {
        terrain = 'DIFFICULT';
      }

      tiles.push({
        x,
        y,
        terrain,
        elevation: 0,
        isExplored: true,
        isVisible: true,
        lightLevel: terrain === 'WALL' ? 0.5 : 1,
        effects: [],
      });
    }
  }

  return {
    id: 'test-map',
    name: 'Test Dungeon',
    width,
    height,
    gridSize: 5,
    tiles,
  };
}

// Generate sample creatures
function generateSampleCreatures(): Creature[] {
  return [
    {
      id: 'player-1',
      name: 'Thorin',
      type: 'character',
      position: { x: 3, y: 3 },
      size: 'medium',
      currentHitPoints: 45,
      maxHitPoints: 52,
      tempHitPoints: 5,
      armorClass: 18,
      speed: 25,
      conditions: [],
      isConcentrating: false,
      isVisible: true,
      isHidden: false,
      tokenColor: '#22c55e',
    },
    {
      id: 'player-2',
      name: 'Elara',
      type: 'character',
      position: { x: 4, y: 4 },
      size: 'medium',
      currentHitPoints: 28,
      maxHitPoints: 35,
      tempHitPoints: 0,
      armorClass: 14,
      speed: 30,
      conditions: [],
      isConcentrating: true,
      concentrationSpellId: 'bless',
      isVisible: true,
      isHidden: false,
      tokenColor: '#3b82f6',
    },
    {
      id: 'goblin-1',
      name: 'Goblin',
      type: 'monster',
      position: { x: 15, y: 8 },
      size: 'small',
      currentHitPoints: 7,
      maxHitPoints: 7,
      tempHitPoints: 0,
      armorClass: 15,
      speed: 30,
      conditions: [],
      isConcentrating: false,
      isVisible: true,
      isHidden: false,
    },
    {
      id: 'goblin-2',
      name: 'Goblin Boss',
      type: 'monster',
      position: { x: 16, y: 7 },
      size: 'medium',
      currentHitPoints: 15,
      maxHitPoints: 21,
      tempHitPoints: 0,
      armorClass: 17,
      speed: 30,
      conditions: ['POISONED'],
      isConcentrating: false,
      isVisible: true,
      isHidden: false,
    },
    {
      id: 'ogre-1',
      name: 'Ogre',
      type: 'monster',
      position: { x: 12, y: 10 },
      size: 'large',
      currentHitPoints: 35,
      maxHitPoints: 59,
      tempHitPoints: 0,
      armorClass: 11,
      speed: 40,
      conditions: [],
      isConcentrating: false,
      isVisible: true,
      isHidden: false,
    },
    {
      id: 'npc-1',
      name: 'Merchant',
      type: 'npc',
      position: { x: 8, y: 8 },
      size: 'medium',
      currentHitPoints: 10,
      maxHitPoints: 10,
      tempHitPoints: 0,
      armorClass: 10,
      speed: 30,
      conditions: [],
      isConcentrating: false,
      isVisible: true,
      isHidden: false,
    },
  ];
}

export function GameBoardTest() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameApplication | null>(null);
  const [selectedTile, setSelectedTile] = useState<GridPosition | null>(null);
  const [hoveredTile, setHoveredTile] = useState<GridPosition | null>(null);
  const [selectedCreature, setSelectedCreature] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showFog, setShowFog] = useState(true);
  const [showAoE, setShowAoE] = useState(false);

  // Initialize game
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = new GameApplication({
      containerId: 'game-container',
      tileSize: 48,
      gridWidth: 20,
      gridHeight: 15,
      onTileClick: (pos) => setSelectedTile(pos),
      onTileHover: (pos) => setHoveredTile(pos),
      onTokenClick: (id) => setSelectedCreature(id),
    });

    gameRef.current = game;

    // Wait for initialization then load state
    game.ready().then(() => {
      const initialState: GameState = {
        sessionId: 'test-session',
        map: generateSampleMap(),
        creatures: generateSampleCreatures(),
        round: 1,
        phase: 'exploration',
      };

      game.loadState(initialState);

      // Set up initial fog (reveal around players)
      if (showFog) {
        game.revealFog(3, 3, 30); // 30ft vision
        game.revealFog(4, 4, 30);
      } else {
        game.revealAllFog();
      }
    });

    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  // Toggle fog of war
  const toggleFog = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;

    if (showFog) {
      game.revealAllFog();
    } else {
      game.hideFog();
      game.revealFog(3, 3, 30);
      game.revealFog(4, 4, 30);
    }
    setShowFog(!showFog);
  }, [showFog]);

  // Toggle AoE preview
  const toggleAoE = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;

    if (showAoE) {
      game.hideAoE('fireball-preview');
    } else {
      game.showAoE('fireball-preview', {
        shape: 'SPHERE',
        origin: { x: 14, y: 8 },
        size: 20, // 20ft radius
        color: 0xff4500,
        alpha: 0.4,
      });
    }
    setShowAoE(!showAoE);
  }, [showAoE]);

  // Center on selected creature
  const centerOnCreature = useCallback(() => {
    const game = gameRef.current;
    if (!game || !selectedCreature) return;

    const creature = game.getState()?.creatures.find((c) => c.id === selectedCreature);
    if (creature) {
      game.centerOn(creature.position.x, creature.position.y);
    }
  }, [selectedCreature]);

  // Reset camera
  const resetCamera = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;

    game.resetCamera();
    setZoom(1);
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;

    const newZoom = Math.min(4, zoom * 1.2);
    game.setZoom(newZoom);
    setZoom(newZoom);
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;

    const newZoom = Math.max(0.25, zoom / 1.2);
    game.setZoom(newZoom);
    setZoom(newZoom);
  }, [zoom]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-border/50 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-text-secondary hover:text-primary">
                ← Back
              </Link>
              <h1 className="text-xl font-cinzel text-primary">Game Board Test</h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Phase 3 Demo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Game Canvas */}
        <div className="flex-1 relative">
          <div
            id="game-container"
            ref={containerRef}
            className="absolute inset-0"
          />

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleZoomIn}
              className="w-10 h-10 bg-bg-light/80 backdrop-blur rounded-lg flex items-center justify-center text-xl font-bold hover:bg-primary/20"
            >
              +
            </motion.button>
            <div className="text-center text-xs text-text-muted">
              {Math.round(zoom * 100)}%
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleZoomOut}
              className="w-10 h-10 bg-bg-light/80 backdrop-blur rounded-lg flex items-center justify-center text-xl font-bold hover:bg-primary/20"
            >
              −
            </motion.button>
          </div>

          {/* Position Info */}
          <div className="absolute top-4 left-4 bg-bg-light/80 backdrop-blur rounded-lg p-3 text-sm z-10">
            <div className="text-text-muted">
              Hover: {hoveredTile ? `(${hoveredTile.x}, ${hoveredTile.y})` : 'None'}
            </div>
            <div className="text-text-muted">
              Selected: {selectedTile ? `(${selectedTile.x}, ${selectedTile.y})` : 'None'}
            </div>
            <div className="text-text-muted">
              Creature: {selectedCreature || 'None'}
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-64 bg-bg-medium border-l border-border/50 p-4 space-y-4">
          <h2 className="font-cinzel text-lg text-primary mb-4">Controls</h2>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-secondary">Camera</h3>
            <button
              onClick={resetCamera}
              className="w-full px-3 py-2 bg-bg-light rounded hover:bg-primary/20 text-sm"
            >
              Reset Camera
            </button>
            <button
              onClick={centerOnCreature}
              disabled={!selectedCreature}
              className="w-full px-3 py-2 bg-bg-light rounded hover:bg-primary/20 text-sm disabled:opacity-50"
            >
              Center on Selected
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-secondary">Visibility</h3>
            <button
              onClick={toggleFog}
              className="w-full px-3 py-2 bg-bg-light rounded hover:bg-primary/20 text-sm"
            >
              {showFog ? 'Reveal All' : 'Enable Fog'}
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-secondary">Effects</h3>
            <button
              onClick={toggleAoE}
              className="w-full px-3 py-2 bg-bg-light rounded hover:bg-primary/20 text-sm"
            >
              {showAoE ? 'Hide Fireball' : 'Show Fireball AoE'}
            </button>
          </div>

          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-text-secondary mb-2">Instructions</h3>
            <ul className="text-xs text-text-muted space-y-1">
              <li>• Click and drag to pan</li>
              <li>• Scroll to zoom</li>
              <li>• Click tiles to select</li>
              <li>• Click tokens to select creatures</li>
              <li>• Arrow keys to pan</li>
              <li>• +/- keys to zoom</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-text-secondary mb-2">Legend</h3>
            <ul className="text-xs text-text-muted space-y-1">
              <li>
                <span className="inline-block w-3 h-3 bg-[#3d3d3d] rounded mr-2" />
                Normal
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-[#4a4a4a] rounded mr-2" />
                Wall
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-[#5a4a32] rounded mr-2" />
                Difficult
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-[#1a4a6e] rounded mr-2" />
                Water
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-[#6b4423] rounded mr-2" />
                Door
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-green-500 rounded mr-2" />
                Player
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-red-500 rounded mr-2" />
                Monster
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-blue-500 rounded mr-2" />
                NPC
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
