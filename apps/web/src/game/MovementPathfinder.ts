/**
 * MovementPathfinder
 * Calculates valid movement tiles and paths based on D&D 5e rules
 */

import type { GridPosition, TerrainType, TileData, Creature } from './types';

// Movement costs per terrain type (in feet, base is 5ft per square)
const TERRAIN_MOVEMENT_COST: Record<TerrainType, number> = {
  NORMAL: 5,
  DIFFICULT: 10, // Difficult terrain costs double
  WATER: 10,     // Swimming costs double (unless swim speed)
  LAVA: 10,      // Dangerous difficult terrain
  PIT: Infinity, // Cannot cross without flying
  WALL: Infinity, // Impassable
  DOOR: 5,       // Normal (assumes open)
  STAIRS: 5,     // Normal
};

export interface MovementResult {
  reachableTiles: GridPosition[];
  movementCosts: Map<string, number>;
  paths: Map<string, GridPosition[]>;
}

export interface PathfindResult {
  path: GridPosition[];
  totalCost: number;
  isValid: boolean;
}

/**
 * Get position key for Map lookups
 */
function posKey(pos: GridPosition): string {
  return `${pos.x},${pos.y}`;
}

/**
 * Parse position key back to GridPosition
 */
function parseKey(key: string): GridPosition {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

/**
 * Get adjacent positions (including diagonals)
 */
function getNeighbors(pos: GridPosition): GridPosition[] {
  return [
    { x: pos.x - 1, y: pos.y },     // Left
    { x: pos.x + 1, y: pos.y },     // Right
    { x: pos.x, y: pos.y - 1 },     // Up
    { x: pos.x, y: pos.y + 1 },     // Down
    { x: pos.x - 1, y: pos.y - 1 }, // Up-Left
    { x: pos.x + 1, y: pos.y - 1 }, // Up-Right
    { x: pos.x - 1, y: pos.y + 1 }, // Down-Left
    { x: pos.x + 1, y: pos.y + 1 }, // Down-Right
  ];
}

/**
 * Check if position is diagonal from another
 */
function isDiagonal(from: GridPosition, to: GridPosition): boolean {
  return Math.abs(from.x - to.x) === 1 && Math.abs(from.y - to.y) === 1;
}

/**
 * Calculate all reachable tiles from a starting position
 */
export function calculateReachableTiles(
  start: GridPosition,
  maxMovement: number,
  tiles: TileData[],
  creatures: Creature[],
  creatureId: string,
  gridWidth: number,
  gridHeight: number
): MovementResult {
  const reachableTiles: GridPosition[] = [];
  const movementCosts = new Map<string, number>();
  const paths = new Map<string, GridPosition[]>();
  const visited = new Set<string>();

  // Build tile lookup
  const tileMap = new Map<string, TileData>();
  for (const tile of tiles) {
    tileMap.set(posKey(tile), tile);
  }

  // Build creature position lookup (excluding self)
  const occupiedPositions = new Set<string>();
  for (const creature of creatures) {
    if (creature.id !== creatureId && creature.currentHitPoints > 0) {
      occupiedPositions.add(posKey(creature.position));
    }
  }

  // Priority queue for Dijkstra's algorithm
  // [cost, x, y, path]
  const queue: Array<[number, GridPosition, GridPosition[]]> = [[0, start, [start]]];
  movementCosts.set(posKey(start), 0);
  paths.set(posKey(start), [start]);

  while (queue.length > 0) {
    // Sort by cost (simple priority queue)
    queue.sort((a, b) => a[0] - b[0]);
    const [currentCost, current, currentPath] = queue.shift()!;

    const currentKey = posKey(current);
    if (visited.has(currentKey)) continue;
    visited.add(currentKey);

    // Add to reachable if not the starting position
    if (currentKey !== posKey(start)) {
      reachableTiles.push(current);
    }

    // Explore neighbors
    for (const neighbor of getNeighbors(current)) {
      const neighborKey = posKey(neighbor);

      // Skip if out of bounds
      if (neighbor.x < 0 || neighbor.x >= gridWidth ||
          neighbor.y < 0 || neighbor.y >= gridHeight) {
        continue;
      }

      // Skip if already visited
      if (visited.has(neighborKey)) continue;

      // Get terrain
      const tile = tileMap.get(neighborKey);
      const terrain = tile?.terrain || 'NORMAL';
      const terrainCost = TERRAIN_MOVEMENT_COST[terrain];

      // Skip impassable terrain
      if (terrainCost === Infinity) continue;

      // Skip occupied squares (can move through allies but not enemies in 5e)
      // For simplicity, we block all occupied squares for now
      if (occupiedPositions.has(neighborKey)) continue;

      // Calculate movement cost
      let moveCost = terrainCost;

      // Diagonal movement in 5e uses max of dx/dy (no extra cost)
      // But some tables use 5-10-5-10 rule, we'll use simple rule
      if (isDiagonal(current, neighbor)) {
        // Optional: Apply 5-10-5 diagonal rule (alternating)
        // For simplicity, use standard 5ft diagonal
        moveCost = Math.max(moveCost, 5);
      }

      const newCost = currentCost + moveCost;

      // Skip if exceeds movement budget
      if (newCost > maxMovement) continue;

      // Update if this is a better path
      const existingCost = movementCosts.get(neighborKey);
      if (existingCost === undefined || newCost < existingCost) {
        movementCosts.set(neighborKey, newCost);
        paths.set(neighborKey, [...currentPath, neighbor]);
        queue.push([newCost, neighbor, [...currentPath, neighbor]]);
      }
    }
  }

  return { reachableTiles, movementCosts, paths };
}

/**
 * Find optimal path between two positions using A*
 */
export function findPath(
  start: GridPosition,
  end: GridPosition,
  tiles: TileData[],
  creatures: Creature[],
  creatureId: string,
  gridWidth: number,
  gridHeight: number,
  maxMovement: number = Infinity
): PathfindResult {
  // Build lookups
  const tileMap = new Map<string, TileData>();
  for (const tile of tiles) {
    tileMap.set(posKey(tile), tile);
  }

  const occupiedPositions = new Set<string>();
  for (const creature of creatures) {
    if (creature.id !== creatureId && creature.currentHitPoints > 0) {
      // Allow moving to occupied position if it's the target (for attacks)
      if (posKey(creature.position) !== posKey(end)) {
        occupiedPositions.add(posKey(creature.position));
      }
    }
  }

  // A* algorithm
  const openSet = new Set<string>([posKey(start)]);
  const cameFrom = new Map<string, GridPosition>();
  const gScore = new Map<string, number>([[posKey(start), 0]]);
  const fScore = new Map<string, number>([[posKey(start), heuristic(start, end)]]);

  while (openSet.size > 0) {
    // Get node with lowest fScore
    let currentKey = '';
    let lowestF = Infinity;
    for (const key of openSet) {
      const f = fScore.get(key) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        currentKey = key;
      }
    }

    const current = parseKey(currentKey);

    // Reached destination
    if (currentKey === posKey(end)) {
      const path = reconstructPath(cameFrom, current);
      const totalCost = gScore.get(currentKey) ?? 0;
      return {
        path,
        totalCost,
        isValid: maxMovement === Infinity || totalCost <= maxMovement,
      };
    }

    openSet.delete(currentKey);

    // Explore neighbors
    for (const neighbor of getNeighbors(current)) {
      const neighborKey = posKey(neighbor);

      // Skip if out of bounds
      if (neighbor.x < 0 || neighbor.x >= gridWidth ||
          neighbor.y < 0 || neighbor.y >= gridHeight) {
        continue;
      }

      // Get terrain
      const tile = tileMap.get(neighborKey);
      const terrain = tile?.terrain || 'NORMAL';
      const terrainCost = TERRAIN_MOVEMENT_COST[terrain];

      // Skip impassable terrain
      if (terrainCost === Infinity) continue;

      // Skip occupied squares (except destination for attacks)
      if (occupiedPositions.has(neighborKey) && neighborKey !== posKey(end)) continue;

      // Calculate movement cost
      const moveCost = isDiagonal(current, neighbor) ? Math.max(terrainCost, 5) : terrainCost;
      const tentativeG = (gScore.get(currentKey) ?? Infinity) + moveCost;

      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeG);
        fScore.set(neighborKey, tentativeG + heuristic(neighbor, end));

        if (!openSet.has(neighborKey)) {
          openSet.add(neighborKey);
        }
      }
    }
  }

  // No path found
  return { path: [], totalCost: Infinity, isValid: false };
}

/**
 * Heuristic for A* (Chebyshev distance for 8-directional movement)
 */
function heuristic(a: GridPosition, b: GridPosition): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) * 5;
}

/**
 * Reconstruct path from A* cameFrom map
 */
function reconstructPath(cameFrom: Map<string, GridPosition>, current: GridPosition): GridPosition[] {
  const path = [current];
  let currentKey = posKey(current);

  while (cameFrom.has(currentKey)) {
    const prev = cameFrom.get(currentKey)!;
    path.unshift(prev);
    currentKey = posKey(prev);
  }

  return path;
}

/**
 * Check if a position is threatened by an enemy (for opportunity attacks)
 */
export function getThreatenedBy(
  position: GridPosition,
  creatures: Creature[],
  excludeCreatureId: string
): Creature[] {
  const threatening: Creature[] = [];

  for (const creature of creatures) {
    // Skip self, dead creatures, and allies
    if (creature.id === excludeCreatureId || creature.currentHitPoints <= 0) {
      continue;
    }

    // Check if creature threatens this position (within 5 feet / 1 square)
    const distance = Math.max(
      Math.abs(creature.position.x - position.x),
      Math.abs(creature.position.y - position.y)
    );

    if (distance <= 1) {
      threatening.push(creature);
    }
  }

  return threatening;
}

/**
 * Check if moving from one position to another provokes opportunity attacks
 */
export function checkOpportunityAttacks(
  path: GridPosition[],
  creatures: Creature[],
  movingCreatureId: string,
  movingCreatureType: Creature['type']
): Creature[] {
  const provockedAttacks: Creature[] = [];
  const alreadyProvoked = new Set<string>();

  if (path.length < 2) return [];

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];

    // Get enemies that threatened the 'from' position
    const threatening = getThreatenedBy(from, creatures, movingCreatureId)
      .filter(c => {
        // Only enemies provoke opportunity attacks
        if (movingCreatureType === 'monster') {
          return c.type === 'character' || c.type === 'npc';
        } else {
          return c.type === 'monster';
        }
      });

    for (const enemy of threatening) {
      // Check if we're leaving their threat range
      const wasAdjacent = Math.max(
        Math.abs(enemy.position.x - from.x),
        Math.abs(enemy.position.y - from.y)
      ) <= 1;

      const stillAdjacent = Math.max(
        Math.abs(enemy.position.x - to.x),
        Math.abs(enemy.position.y - to.y)
      ) <= 1;

      // If we were adjacent and are moving away, it provokes
      if (wasAdjacent && !stillAdjacent && !alreadyProvoked.has(enemy.id)) {
        provockedAttacks.push(enemy);
        alreadyProvoked.add(enemy.id);
      }
    }
  }

  return provockedAttacks;
}

export default {
  calculateReachableTiles,
  findPath,
  getThreatenedBy,
  checkOpportunityAttacks,
};
