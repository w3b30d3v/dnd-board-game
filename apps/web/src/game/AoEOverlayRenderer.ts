/**
 * AoEOverlayRenderer
 * Handles rendering Area of Effect overlays for spells and abilities
 */

import * as PIXI from 'pixi.js';
import type { AreaOfEffect, GridPosition } from './types';

interface ActiveAoE extends AreaOfEffect {
  id: string;
  graphics: PIXI.Graphics;
  pulsePhase: number;
}

export class AoEOverlayRenderer {
  private container: PIXI.Container;
  private tileSize: number;

  // Active AoE effects
  private activeEffects: Map<string, ActiveAoE> = new Map();

  // Animation settings
  private pulseSpeed: number = 0.03;
  private pulseMinAlpha: number = 0.2;
  private pulseMaxAlpha: number = 0.5;

  constructor(container: PIXI.Container, tileSize: number) {
    this.container = container;
    this.tileSize = tileSize;
  }

  /**
   * Convert grid position to world position (center of tile)
   */
  private gridToWorld(gridPos: GridPosition): { x: number; y: number } {
    return {
      x: gridPos.x * this.tileSize + this.tileSize / 2,
      y: gridPos.y * this.tileSize + this.tileSize / 2,
    };
  }

  /**
   * Convert feet to pixels
   */
  private feetToPixels(feet: number): number {
    return (feet / 5) * this.tileSize; // Assuming 5ft per tile
  }

  /**
   * Show an area of effect
   */
  public showAoE(id: string, aoe: AreaOfEffect): void {
    // Remove existing with same ID
    this.hideAoE(id);

    const graphics = new PIXI.Graphics();
    this.drawAoE(graphics, aoe);
    this.container.addChild(graphics);

    const activeAoE: ActiveAoE = {
      ...aoe,
      id,
      graphics,
      pulsePhase: Math.random() * Math.PI * 2, // Random start phase
    };

    this.activeEffects.set(id, activeAoE);
  }

  /**
   * Hide an area of effect
   */
  public hideAoE(id: string): void {
    const effect = this.activeEffects.get(id);
    if (effect) {
      this.container.removeChild(effect.graphics);
      effect.graphics.destroy();
      this.activeEffects.delete(id);
    }
  }

  /**
   * Clear all AoE effects
   */
  public clearAll(): void {
    for (const effect of this.activeEffects.values()) {
      this.container.removeChild(effect.graphics);
      effect.graphics.destroy();
    }
    this.activeEffects.clear();
  }

  /**
   * Draw an AoE shape
   */
  private drawAoE(graphics: PIXI.Graphics, aoe: AreaOfEffect): void {
    const origin = this.gridToWorld(aoe.origin);
    const sizePixels = this.feetToPixels(aoe.size);

    graphics.beginFill(aoe.color, aoe.alpha);
    graphics.lineStyle(2, aoe.color, Math.min(1, aoe.alpha + 0.3));

    switch (aoe.shape) {
      case 'SPHERE':
      case 'CYLINDER':
        this.drawCircle(graphics, origin, sizePixels);
        break;

      case 'CUBE':
        this.drawCube(graphics, origin, sizePixels);
        break;

      case 'CONE':
        this.drawCone(graphics, origin, sizePixels, aoe.direction || 0);
        break;

      case 'LINE':
        this.drawLine(graphics, origin, sizePixels, aoe.direction || 0);
        break;
    }

    graphics.endFill();

    // Add dashed outline
    this.drawOutline(graphics, aoe);
  }

  /**
   * Draw a circle (sphere or cylinder)
   */
  private drawCircle(
    graphics: PIXI.Graphics,
    origin: { x: number; y: number },
    radius: number
  ): void {
    graphics.drawCircle(origin.x, origin.y, radius);
  }

  /**
   * Draw a cube (centered on origin)
   */
  private drawCube(
    graphics: PIXI.Graphics,
    origin: { x: number; y: number },
    size: number
  ): void {
    graphics.drawRect(
      origin.x - size / 2,
      origin.y - size / 2,
      size,
      size
    );
  }

  /**
   * Draw a cone
   */
  private drawCone(
    graphics: PIXI.Graphics,
    origin: { x: number; y: number },
    length: number,
    direction: number
  ): void {
    const angleRad = (direction * Math.PI) / 180;
    const spreadAngle = Math.PI / 3; // 60 degree cone (RAW 5e)

    // Calculate cone endpoints
    const leftAngle = angleRad - spreadAngle / 2;
    const rightAngle = angleRad + spreadAngle / 2;

    const leftX = origin.x + Math.cos(leftAngle) * length;
    const leftY = origin.y + Math.sin(leftAngle) * length;

    graphics.moveTo(origin.x, origin.y);
    graphics.lineTo(leftX, leftY);

    // Arc along the far edge
    graphics.arc(
      origin.x,
      origin.y,
      length,
      leftAngle,
      rightAngle
    );

    graphics.lineTo(origin.x, origin.y);
  }

  /**
   * Draw a line (5ft wide)
   */
  private drawLine(
    graphics: PIXI.Graphics,
    origin: { x: number; y: number },
    length: number,
    direction: number
  ): void {
    const angleRad = (direction * Math.PI) / 180;
    const width = this.feetToPixels(5); // 5ft wide

    // Calculate perpendicular offset
    const perpX = Math.cos(angleRad + Math.PI / 2) * (width / 2);
    const perpY = Math.sin(angleRad + Math.PI / 2) * (width / 2);

    // Calculate line endpoints
    const endX = origin.x + Math.cos(angleRad) * length;
    const endY = origin.y + Math.sin(angleRad) * length;

    // Draw rectangle along the line
    graphics.moveTo(origin.x + perpX, origin.y + perpY);
    graphics.lineTo(endX + perpX, endY + perpY);
    graphics.lineTo(endX - perpX, endY - perpY);
    graphics.lineTo(origin.x - perpX, origin.y - perpY);
    graphics.lineTo(origin.x + perpX, origin.y + perpY);
  }

  /**
   * Draw dashed outline
   */
  private drawOutline(graphics: PIXI.Graphics, aoe: AreaOfEffect): void {
    const origin = this.gridToWorld(aoe.origin);
    const sizePixels = this.feetToPixels(aoe.size);

    graphics.lineStyle(1, 0xffffff, 0.5);

    // Draw origin marker
    graphics.drawCircle(origin.x, origin.y, 4);

    // Draw range indicator
    if (aoe.shape === 'SPHERE' || aoe.shape === 'CYLINDER') {
      // Dashed circle
      const segments = 32;
      for (let i = 0; i < segments; i += 2) {
        const startAngle = (i / segments) * Math.PI * 2;
        const endAngle = ((i + 1) / segments) * Math.PI * 2;

        graphics.arc(origin.x, origin.y, sizePixels, startAngle, endAngle);
        graphics.moveTo(
          origin.x + Math.cos(endAngle + Math.PI / segments) * sizePixels,
          origin.y + Math.sin(endAngle + Math.PI / segments) * sizePixels
        );
      }
    }
  }

  /**
   * Get all tiles affected by an AoE
   */
  public getAffectedTiles(aoe: AreaOfEffect): GridPosition[] {
    const tiles: GridPosition[] = [];
    const origin = aoe.origin;
    const radiusTiles = Math.ceil(aoe.size / 5);

    // Check all tiles in a bounding box
    for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
      for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
        const tilePos = { x: origin.x + dx, y: origin.y + dy };

        if (this.isTileInAoE(tilePos, aoe)) {
          tiles.push(tilePos);
        }
      }
    }

    return tiles;
  }

  /**
   * Check if a tile is within an AoE
   */
  private isTileInAoE(tile: GridPosition, aoe: AreaOfEffect): boolean {
    const dx = tile.x - aoe.origin.x;
    const dy = tile.y - aoe.origin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radiusTiles = aoe.size / 5;

    switch (aoe.shape) {
      case 'SPHERE':
      case 'CYLINDER':
        return distance <= radiusTiles;

      case 'CUBE':
        return Math.abs(dx) <= radiusTiles / 2 && Math.abs(dy) <= radiusTiles / 2;

      case 'CONE': {
        if (distance > radiusTiles) return false;
        const angleToTile = Math.atan2(dy, dx) * (180 / Math.PI);
        const coneDirection = aoe.direction || 0;
        let angleDiff = Math.abs(angleToTile - coneDirection);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        return angleDiff <= 30; // 60 degree cone
      }

      case 'LINE': {
        // Check if tile is within 5ft wide line
        const lineAngle = ((aoe.direction || 0) * Math.PI) / 180;
        const lineLength = radiusTiles;

        // Project tile onto line
        const projLength = dx * Math.cos(lineAngle) + dy * Math.sin(lineAngle);
        if (projLength < 0 || projLength > lineLength) return false;

        // Check perpendicular distance
        const perpDist = Math.abs(-dx * Math.sin(lineAngle) + dy * Math.cos(lineAngle));
        return perpDist <= 0.5; // Half tile width
      }

      default:
        return false;
    }
  }

  /**
   * Preview an AoE (show with different styling)
   */
  public previewAoE(aoe: AreaOfEffect): void {
    this.showAoE('_preview', {
      ...aoe,
      alpha: aoe.alpha * 0.5,
    });
  }

  /**
   * Clear preview
   */
  public clearPreview(): void {
    this.hideAoE('_preview');
  }

  /**
   * Update animations (called each frame)
   */
  public update(delta: number): void {
    for (const effect of this.activeEffects.values()) {
      // Skip preview effects
      if (effect.id === '_preview') continue;

      // Update pulse animation
      effect.pulsePhase += this.pulseSpeed * delta;
      const pulseValue = (Math.sin(effect.pulsePhase) + 1) / 2;
      const alpha = this.pulseMinAlpha + pulseValue * (this.pulseMaxAlpha - this.pulseMinAlpha);

      // Redraw with new alpha
      effect.graphics.clear();
      this.drawAoE(effect.graphics, { ...effect, alpha });
    }
  }

  /**
   * Set tile size
   */
  public setTileSize(tileSize: number): void {
    this.tileSize = tileSize;

    // Redraw all active effects
    for (const effect of this.activeEffects.values()) {
      effect.graphics.clear();
      this.drawAoE(effect.graphics, effect);
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.clearAll();
    this.container.destroy({ children: true });
  }
}
