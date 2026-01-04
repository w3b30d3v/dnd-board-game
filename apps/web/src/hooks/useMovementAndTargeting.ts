'use client';

/**
 * useMovementAndTargeting Hook
 * Handles token movement on the game board and click-to-target functionality
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { calculateReachableTiles, checkOpportunityAttacks } from '@/game/MovementPathfinder';
import type { GridPosition, Creature, TileData } from '@/game/types';

export type InteractionMode = 'none' | 'move' | 'target' | 'aoe';

export interface MovementResult {
  reachableTiles: GridPosition[];
  movementCosts: Map<string, number>;
  paths: Map<string, GridPosition[]>;
}

export interface UseMovementAndTargetingOptions {
  creatures: Creature[];
  tiles: TileData[];
  gridWidth: number;
  gridHeight: number;
  currentCreatureId: string | null;
  remainingMovement: number;
  isInCombat: boolean;
  isMyTurn: boolean;
  onMoveCreature: (creatureId: string, newPosition: GridPosition, path: GridPosition[]) => void;
  onSelectTarget: (targetId: string) => void;
  onOpportunityAttack?: (attackerId: string, targetId: string) => void;
}

export interface UseMovementAndTargetingReturn {
  // State
  interactionMode: InteractionMode;
  highlightedTiles: GridPosition[];
  selectedPath: GridPosition[];
  hoveredTile: GridPosition | null;

  // Actions
  startMovementMode: () => void;
  startTargetingMode: (range: number) => void;
  cancelMode: () => void;
  handleTileClick: (pos: GridPosition) => void;
  handleTileHover: (pos: GridPosition | null) => void;
  handleTokenClick: (creatureId: string) => void;

  // Computed
  canMove: boolean;
  validTargets: string[];
}

export function useMovementAndTargeting({
  creatures,
  tiles,
  gridWidth,
  gridHeight,
  currentCreatureId,
  remainingMovement,
  isInCombat,
  isMyTurn,
  onMoveCreature,
  onSelectTarget,
  onOpportunityAttack,
}: UseMovementAndTargetingOptions): UseMovementAndTargetingReturn {
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('none');
  const [highlightedTiles, setHighlightedTiles] = useState<GridPosition[]>([]);
  const [selectedPath, setSelectedPath] = useState<GridPosition[]>([]);
  const [hoveredTile, setHoveredTile] = useState<GridPosition | null>(null);
  const [targetingRange, setTargetingRange] = useState(0);

  // Get current creature
  const currentCreature = useMemo(() => {
    return creatures.find(c => c.id === currentCreatureId) || null;
  }, [creatures, currentCreatureId]);

  // Calculate if we can move
  const canMove = useMemo(() => {
    return isMyTurn && remainingMovement > 0 && currentCreature !== null;
  }, [isMyTurn, remainingMovement, currentCreature]);

  // Calculate reachable tiles when in movement mode
  const movementData = useMemo((): MovementResult | null => {
    if (interactionMode !== 'move' || !currentCreature || remainingMovement <= 0) {
      return null;
    }

    const result = calculateReachableTiles(
      currentCreature.position,
      remainingMovement,
      tiles,
      creatures,
      currentCreature.id,
      gridWidth,
      gridHeight
    );

    return result;
  }, [interactionMode, currentCreature, remainingMovement, tiles, creatures, gridWidth, gridHeight]);

  // Update highlighted tiles when movement data changes
  useEffect(() => {
    if (movementData) {
      setHighlightedTiles(movementData.reachableTiles);
    } else if (interactionMode === 'move') {
      setHighlightedTiles([]);
    }
  }, [movementData, interactionMode]);

  // Calculate valid targets when in targeting mode
  const validTargets = useMemo(() => {
    if (interactionMode !== 'target' || !currentCreature) {
      return [];
    }

    // Get creatures within range
    return creatures
      .filter(c => {
        if (c.id === currentCreatureId) return false;
        if (c.currentHitPoints <= 0) return false;

        // Calculate distance
        const dx = Math.abs(c.position.x - currentCreature.position.x);
        const dy = Math.abs(c.position.y - currentCreature.position.y);
        const distance = Math.max(dx, dy) * 5; // 5 feet per tile

        return distance <= targetingRange;
      })
      .map(c => c.id);
  }, [interactionMode, currentCreature, creatures, currentCreatureId, targetingRange]);

  // Update highlighted tiles for targeting mode
  useEffect(() => {
    if (interactionMode === 'target' && currentCreature) {
      // Highlight tiles where valid targets are
      const targetTiles = creatures
        .filter(c => validTargets.includes(c.id))
        .map(c => c.position);
      setHighlightedTiles(targetTiles);
    }
  }, [interactionMode, currentCreature, creatures, validTargets]);

  // Start movement mode
  const startMovementMode = useCallback(() => {
    if (!canMove) return;
    setInteractionMode('move');
    setSelectedPath([]);
  }, [canMove]);

  // Start targeting mode
  const startTargetingMode = useCallback((range: number) => {
    if (!isMyTurn || !currentCreature) return;
    setTargetingRange(range);
    setInteractionMode('target');
    setSelectedPath([]);
  }, [isMyTurn, currentCreature]);

  // Cancel current mode
  const cancelMode = useCallback(() => {
    setInteractionMode('none');
    setHighlightedTiles([]);
    setSelectedPath([]);
    setHoveredTile(null);
    setTargetingRange(0);
  }, []);

  // Handle tile hover
  const handleTileHover = useCallback((pos: GridPosition | null) => {
    setHoveredTile(pos);

    if (interactionMode === 'move' && pos && movementData && currentCreature) {
      // Show path to hovered tile
      const path = movementData.paths.get(`${pos.x},${pos.y}`);
      if (path) {
        setSelectedPath(path);
      } else {
        setSelectedPath([]);
      }
    }
  }, [interactionMode, movementData, currentCreature]);

  // Handle tile click
  const handleTileClick = useCallback((pos: GridPosition) => {
    if (interactionMode === 'move' && movementData && currentCreature) {
      // Check if this is a valid destination
      const path = movementData.paths.get(`${pos.x},${pos.y}`);
      if (path && path.length > 1) {
        // Check for opportunity attacks
        const opportunityAttackers = checkOpportunityAttacks(
          path,
          creatures,
          currentCreature.id,
          currentCreature.type
        );

        // Trigger opportunity attacks (DM can resolve them)
        if (opportunityAttackers.length > 0 && onOpportunityAttack) {
          opportunityAttackers.forEach(attacker => {
            onOpportunityAttack(attacker.id, currentCreature.id);
          });
        }

        // Execute movement
        onMoveCreature(currentCreature.id, pos, path);
        cancelMode();
      }
    }
  }, [interactionMode, movementData, currentCreature, creatures, onMoveCreature, onOpportunityAttack, cancelMode]);

  // Handle token click
  const handleTokenClick = useCallback((creatureId: string) => {
    if (interactionMode === 'target') {
      if (validTargets.includes(creatureId)) {
        onSelectTarget(creatureId);
        cancelMode();
      }
    } else if (interactionMode === 'none' && isInCombat) {
      // Could auto-enter targeting mode or just select for info
    }
  }, [interactionMode, validTargets, onSelectTarget, cancelMode, isInCombat]);

  return {
    interactionMode,
    highlightedTiles,
    selectedPath,
    hoveredTile,
    startMovementMode,
    startTargetingMode,
    cancelMode,
    handleTileClick,
    handleTileHover,
    handleTokenClick,
    canMove,
    validTargets,
  };
}

export default useMovementAndTargeting;
