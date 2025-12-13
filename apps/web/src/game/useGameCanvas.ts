/**
 * useGameCanvas
 * React hook for integrating GameApplication with React components
 */

'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import type { GameConfig, GameState, GridPosition, Creature, AreaOfEffect } from './types';

// Dynamic import to avoid SSR issues with PixiJS
let GameApplication: typeof import('./GameApplication').GameApplication;

export interface UseGameCanvasConfig {
  containerId: string;
  tileSize?: number;
  gridWidth?: number;
  gridHeight?: number;
  onTileClick?: (position: GridPosition) => void;
  onTokenClick?: (creatureId: string) => void;
  onTileHover?: (position: GridPosition | null) => void;
}

export interface UseGameCanvasReturn {
  /** Ref to attach to the container div */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Whether the game is ready */
  isReady: boolean;
  /** Error if initialization failed */
  error: Error | null;
  /** Load a new game state */
  loadState: (state: GameState) => void;
  /** Update partial state */
  updateState: (delta: Partial<GameState>) => void;
  /** Add a creature */
  addCreature: (creature: Creature) => void;
  /** Remove a creature */
  removeCreature: (creatureId: string) => void;
  /** Update a creature */
  updateCreature: (creature: Creature) => void;
  /** Select a creature */
  selectCreature: (creatureId: string | null) => void;
  /** Get selected creature */
  getSelectedCreature: () => Creature | null;
  /** Highlight tiles for movement/targeting */
  highlightTiles: (positions: GridPosition[], color?: number, alpha?: number) => void;
  /** Clear highlighted tiles */
  clearHighlights: () => void;
  /** Show an area of effect */
  showAoE: (id: string, aoe: AreaOfEffect) => void;
  /** Hide an area of effect */
  hideAoE: (id: string) => void;
  /** Preview an AoE */
  previewAoE: (aoe: AreaOfEffect) => void;
  /** Clear AoE preview */
  clearAoEPreview: () => void;
  /** Get tiles affected by an AoE */
  getAoETiles: (aoe: AreaOfEffect) => GridPosition[];
  /** Set target indicators */
  setTargets: (creatureIds: string[]) => void;
  /** Clear targets */
  clearTargets: () => void;
  /** Reveal fog of war area */
  revealFog: (centerX: number, centerY: number, radius: number) => void;
  /** Hide all fog */
  hideFog: () => void;
  /** Reveal all fog */
  revealAllFog: () => void;
  /** Center camera on position */
  centerOn: (gridX: number, gridY: number) => void;
  /** Set zoom level */
  setZoom: (scale: number) => void;
  /** Get current zoom */
  getZoom: () => number;
  /** Reset camera */
  resetCamera: () => void;
  /** Get current game state */
  getState: () => GameState | null;
}

/**
 * React hook for using the GameApplication
 *
 * @example
 * ```tsx
 * function GameBoard() {
 *   const {
 *     containerRef,
 *     isReady,
 *     loadState,
 *     selectCreature,
 *   } = useGameCanvas({
 *     containerId: 'game-container',
 *     tileSize: 64,
 *     gridWidth: 20,
 *     gridHeight: 15,
 *     onTileClick: (pos) => console.log('Tile clicked:', pos),
 *     onTokenClick: (id) => console.log('Token clicked:', id),
 *   });
 *
 *   useEffect(() => {
 *     if (isReady) {
 *       loadState(initialGameState);
 *     }
 *   }, [isReady]);
 *
 *   return <div ref={containerRef} id="game-container" className="w-full h-full" />;
 * }
 * ```
 */
export function useGameCanvas(config: UseGameCanvasConfig): UseGameCanvasReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<InstanceType<typeof GameApplication> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize game on mount
  useEffect(() => {
    let mounted = true;

    const initGame = async () => {
      try {
        // Dynamic import to avoid SSR issues
        if (!GameApplication) {
          const module = await import('./GameApplication');
          GameApplication = module.GameApplication;
        }

        // Wait for container to be in DOM
        if (!containerRef.current) {
          throw new Error('Container ref not attached');
        }

        // Create game config
        const gameConfig: GameConfig = {
          containerId: config.containerId,
          tileSize: config.tileSize ?? 64,
          gridWidth: config.gridWidth ?? 20,
          gridHeight: config.gridHeight ?? 15,
          onTileClick: config.onTileClick,
          onTokenClick: config.onTokenClick,
          onTileHover: config.onTileHover,
        };

        // Create game instance
        const game = new GameApplication(gameConfig);
        await game.ready();

        if (mounted) {
          gameRef.current = game;
          setIsReady(true);
        } else {
          // Component unmounted during init, clean up
          game.destroy();
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    initGame();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
      setIsReady(false);
    };
  }, [config.containerId, config.tileSize, config.gridWidth, config.gridHeight]);

  // Stable callback wrappers
  const loadState = useCallback((state: GameState) => {
    gameRef.current?.loadState(state);
  }, []);

  const updateState = useCallback((delta: Partial<GameState>) => {
    gameRef.current?.updateState(delta);
  }, []);

  const addCreature = useCallback((creature: Creature) => {
    gameRef.current?.addCreature(creature);
  }, []);

  const removeCreature = useCallback((creatureId: string) => {
    gameRef.current?.removeCreature(creatureId);
  }, []);

  const updateCreature = useCallback((creature: Creature) => {
    gameRef.current?.updateCreature(creature);
  }, []);

  const selectCreature = useCallback((creatureId: string | null) => {
    gameRef.current?.selectCreature(creatureId);
  }, []);

  const getSelectedCreature = useCallback((): Creature | null => {
    return gameRef.current?.getSelectedCreature() ?? null;
  }, []);

  const highlightTiles = useCallback(
    (positions: GridPosition[], color?: number, alpha?: number) => {
      gameRef.current?.highlightTiles(positions, color, alpha);
    },
    []
  );

  const clearHighlights = useCallback(() => {
    gameRef.current?.clearHighlights();
  }, []);

  const showAoE = useCallback((id: string, aoe: AreaOfEffect) => {
    gameRef.current?.showAoE(id, aoe);
  }, []);

  const hideAoE = useCallback((id: string) => {
    gameRef.current?.hideAoE(id);
  }, []);

  const previewAoE = useCallback((aoe: AreaOfEffect) => {
    gameRef.current?.previewAoE(aoe);
  }, []);

  const clearAoEPreview = useCallback(() => {
    gameRef.current?.clearAoEPreview();
  }, []);

  const getAoETiles = useCallback((aoe: AreaOfEffect): GridPosition[] => {
    return gameRef.current?.getAoETiles(aoe) ?? [];
  }, []);

  const setTargets = useCallback((creatureIds: string[]) => {
    gameRef.current?.setTargets(creatureIds);
  }, []);

  const clearTargets = useCallback(() => {
    gameRef.current?.clearTargets();
  }, []);

  const revealFog = useCallback((centerX: number, centerY: number, radius: number) => {
    gameRef.current?.revealFog(centerX, centerY, radius);
  }, []);

  const hideFog = useCallback(() => {
    gameRef.current?.hideFog();
  }, []);

  const revealAllFog = useCallback(() => {
    gameRef.current?.revealAllFog();
  }, []);

  const centerOn = useCallback((gridX: number, gridY: number) => {
    gameRef.current?.centerOn(gridX, gridY);
  }, []);

  const setZoom = useCallback((scale: number) => {
    gameRef.current?.setZoom(scale);
  }, []);

  const getZoom = useCallback((): number => {
    return gameRef.current?.getZoom() ?? 1;
  }, []);

  const resetCamera = useCallback(() => {
    gameRef.current?.resetCamera();
  }, []);

  const getState = useCallback((): GameState | null => {
    return gameRef.current?.getState() ?? null;
  }, []);

  return {
    containerRef,
    isReady,
    error,
    loadState,
    updateState,
    addCreature,
    removeCreature,
    updateCreature,
    selectCreature,
    getSelectedCreature,
    highlightTiles,
    clearHighlights,
    showAoE,
    hideAoE,
    previewAoE,
    clearAoEPreview,
    getAoETiles,
    setTargets,
    clearTargets,
    revealFog,
    hideFog,
    revealAllFog,
    centerOn,
    setZoom,
    getZoom,
    resetCamera,
    getState,
  };
}
