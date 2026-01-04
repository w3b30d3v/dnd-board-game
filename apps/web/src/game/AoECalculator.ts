/**
 * AoECalculator
 * Calculates affected tiles for Area of Effect spells based on D&D 5e rules
 */

import type { GridPosition } from './types';

// AoE shape types per D&D 5e PHB
export type AoEShape = 'sphere' | 'cone' | 'line' | 'cube' | 'cylinder';

export interface AoEParams {
  shape: AoEShape;
  origin: GridPosition;         // Origin point of the effect
  radius?: number;              // For sphere/cylinder (in feet)
  length?: number;              // For cone/line (in feet)
  width?: number;               // For line (in feet, usually 5)
  size?: number;                // For cube (side length in feet)
  direction?: number;           // Angle in degrees (0 = right, 90 = down)
}

export interface AoEResult {
  affectedTiles: GridPosition[];
  originTile: GridPosition;
  shape: AoEShape;
}

const FEET_PER_TILE = 5;

/**
 * Convert feet to tiles
 */
function feetToTiles(feet: number): number {
  return Math.floor(feet / FEET_PER_TILE);
}

/**
 * Calculate Euclidean distance for circular effects
 */
function euclideanDistance(a: GridPosition, b: GridPosition): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

/**
 * Calculate affected tiles for a sphere (e.g., Fireball)
 * Sphere radiates from a point - any tile whose center is within radius is affected
 */
function calculateSphere(origin: GridPosition, radiusFeet: number): GridPosition[] {
  const radiusTiles = feetToTiles(radiusFeet);
  const affected: GridPosition[] = [];

  // Check all tiles within the bounding box
  for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
    for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
      const tile = { x: origin.x + dx, y: origin.y + dy };
      // Use Euclidean for sphere (circular shape)
      if (euclideanDistance(origin, tile) <= radiusTiles) {
        affected.push(tile);
      }
    }
  }

  return affected;
}

/**
 * Calculate affected tiles for a cube (e.g., Thunderwave)
 * Cube originates from caster and extends in a direction
 */
function calculateCube(origin: GridPosition, sizeFeet: number, direction: number): GridPosition[] {
  const sizeTiles = feetToTiles(sizeFeet);
  const affected: GridPosition[] = [];

  // Direction determines which way cube extends from origin
  const rad = (direction * Math.PI) / 180;
  const dx = Math.round(Math.cos(rad));
  const dy = Math.round(Math.sin(rad));

  // Origin corner of cube
  const startX = origin.x;
  const startY = origin.y;

  // Fill cube tiles
  for (let i = 0; i < sizeTiles; i++) {
    for (let j = 0; j < sizeTiles; j++) {
      // Calculate tile based on direction
      let tileX: number, tileY: number;

      if (dx !== 0 && dy !== 0) {
        // Diagonal direction
        tileX = startX + (dx > 0 ? i : -i);
        tileY = startY + (dy > 0 ? j : -j);
      } else if (dx !== 0) {
        // Horizontal direction
        tileX = startX + (dx > 0 ? i : -i);
        tileY = startY + j - Math.floor(sizeTiles / 2);
      } else {
        // Vertical direction
        tileX = startX + i - Math.floor(sizeTiles / 2);
        tileY = startY + (dy > 0 ? j : -j);
      }

      affected.push({ x: tileX, y: tileY });
    }
  }

  return affected;
}

/**
 * Calculate affected tiles for a cone (e.g., Burning Hands)
 * Cone spreads from origin in a direction
 */
function calculateCone(origin: GridPosition, lengthFeet: number, direction: number): GridPosition[] {
  const lengthTiles = feetToTiles(lengthFeet);
  const affected: GridPosition[] = [];

  const rad = (direction * Math.PI) / 180;
  const halfAngle = Math.PI / 6; // 30 degrees cone half-angle (60 degree total)

  // Check all tiles within max range
  for (let dx = -lengthTiles; dx <= lengthTiles; dx++) {
    for (let dy = -lengthTiles; dy <= lengthTiles; dy++) {
      if (dx === 0 && dy === 0) continue; // Skip origin

      const tile = { x: origin.x + dx, y: origin.y + dy };
      const dist = euclideanDistance(origin, tile);

      // Must be within length
      if (dist > lengthTiles) continue;

      // Calculate angle to tile
      const angleToTile = Math.atan2(dy, dx);

      // Calculate angular difference
      let angleDiff = Math.abs(angleToTile - rad);
      // Normalize to 0-PI
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

      // Must be within cone angle
      if (angleDiff <= halfAngle) {
        affected.push(tile);
      }
    }
  }

  return affected;
}

/**
 * Calculate affected tiles for a line (e.g., Lightning Bolt)
 * Line extends from origin in a direction with a width
 */
function calculateLine(
  origin: GridPosition,
  lengthFeet: number,
  widthFeet: number,
  direction: number
): GridPosition[] {
  const lengthTiles = feetToTiles(lengthFeet);
  const widthTiles = Math.max(1, feetToTiles(widthFeet));
  const affected: GridPosition[] = [];

  const rad = (direction * Math.PI) / 180;
  const perpRad = rad + Math.PI / 2;

  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const perpDx = Math.cos(perpRad);
  const perpDy = Math.sin(perpRad);

  // Walk along the line
  for (let i = 0; i <= lengthTiles; i++) {
    const centerX = origin.x + dx * i;
    const centerY = origin.y + dy * i;

    // Add width perpendicular to direction
    const halfWidth = (widthTiles - 1) / 2;
    for (let w = -halfWidth; w <= halfWidth; w++) {
      const tileX = Math.round(centerX + perpDx * w);
      const tileY = Math.round(centerY + perpDy * w);

      // Avoid duplicates
      if (!affected.some(t => t.x === tileX && t.y === tileY)) {
        affected.push({ x: tileX, y: tileY });
      }
    }
  }

  return affected;
}

/**
 * Calculate affected tiles for a cylinder (e.g., Moonbeam)
 * Same as sphere but projects vertically (2D representation is same as sphere)
 */
function calculateCylinder(origin: GridPosition, radiusFeet: number): GridPosition[] {
  // In 2D, cylinder is same as sphere projection
  return calculateSphere(origin, radiusFeet);
}

/**
 * Main function to calculate AoE affected tiles
 */
export function calculateAoE(params: AoEParams): AoEResult {
  const { shape, origin, radius = 20, length = 30, width = 5, size = 15, direction = 0 } = params;

  let affectedTiles: GridPosition[];

  switch (shape) {
    case 'sphere':
      affectedTiles = calculateSphere(origin, radius);
      break;
    case 'cube':
      affectedTiles = calculateCube(origin, size, direction);
      break;
    case 'cone':
      affectedTiles = calculateCone(origin, length, direction);
      break;
    case 'line':
      affectedTiles = calculateLine(origin, length, width, direction);
      break;
    case 'cylinder':
      affectedTiles = calculateCylinder(origin, radius);
      break;
    default:
      affectedTiles = [];
  }

  return {
    affectedTiles,
    originTile: origin,
    shape,
  };
}

/**
 * Get creatures affected by an AoE
 */
export function getCreaturesInAoE(
  aoeResult: AoEResult,
  creatures: Array<{ id: string; position: GridPosition }>
): string[] {
  const affectedTileSet = new Set(
    aoeResult.affectedTiles.map(t => `${t.x},${t.y}`)
  );

  return creatures
    .filter(c => affectedTileSet.has(`${c.position.x},${c.position.y}`))
    .map(c => c.id);
}

/**
 * Common spell AoE presets
 */
export const SPELL_AOE_PRESETS: Record<string, Omit<AoEParams, 'origin' | 'direction'>> = {
  fireball: { shape: 'sphere', radius: 20 },
  burningHands: { shape: 'cone', length: 15 },
  lightningBolt: { shape: 'line', length: 100, width: 5 },
  thunderwave: { shape: 'cube', size: 15 },
  moonbeam: { shape: 'cylinder', radius: 5 },
  coneOfCold: { shape: 'cone', length: 60 },
  cloudkill: { shape: 'sphere', radius: 20 },
  spiritGuardians: { shape: 'sphere', radius: 15 },
  darkness: { shape: 'sphere', radius: 15 },
  fog: { shape: 'sphere', radius: 20 },
};

export default {
  calculateAoE,
  getCreaturesInAoE,
  SPELL_AOE_PRESETS,
};
