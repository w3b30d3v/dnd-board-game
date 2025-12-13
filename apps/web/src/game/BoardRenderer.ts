/**
 * BoardRenderer
 * Handles rendering the tile grid and terrain
 * Enhanced with animated terrain, particles, and rich visual effects
 */

import * as PIXI from 'pixi.js';
import type { MapData, TileData, TerrainType, GridPosition } from './types';
import { TERRAIN_COLORS, GRID_COLORS } from './types';

// Ambient particle for terrain effects
interface AmbientParticle {
  graphics: PIXI.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
  type: 'ember' | 'bubble' | 'sparkle' | 'dust';
}

// Animated tile data
interface AnimatedTileData {
  tile: TileData;
  graphics: PIXI.Graphics;
  animPhase: number;
  glowIntensity: number;
}

export class BoardRenderer {
  private container: PIXI.Container;
  private tileSize: number;
  private gridWidth: number;
  private gridHeight: number;

  // Graphics layers
  private backgroundLayer: PIXI.Container;
  private ambientGradientLayer: PIXI.Graphics;
  private tileLayer: PIXI.Container;
  private animatedEffectsLayer: PIXI.Container;
  private gridLayer: PIXI.Graphics;
  private ambientParticleLayer: PIXI.Container;
  private highlightLayer: PIXI.Container;

  // Tile graphics cache
  private tileGraphics: Map<string, PIXI.Graphics> = new Map();
  private animatedTiles: Map<string, AnimatedTileData> = new Map();

  // Ambient particles
  private ambientParticles: AmbientParticle[] = [];
  private particleSpawnTimer: number = 0;

  // Current hover/selection
  private hoveredTile: GridPosition | null = null;
  private selectedTile: GridPosition | null = null;
  private highlightedTiles: Map<string, { color: number; alpha: number }> = new Map();

  // Animation settings
  private animationSpeed: number = 0.02;
  private waterWaveSpeed: number = 0.04;
  private lavaGlowSpeed: number = 0.03;
  private highlightPulsePhase: number = 0;
  private useEnhancedVisuals: boolean = true;

  // Enhanced color palette
  private terrainGradients: Record<TerrainType, [number, number]> = {
    NORMAL: [0x4a4a4a, 0x3a3a3a],
    DIFFICULT: [0x6b5d4d, 0x4a3d2d],
    WATER: [0x2196f3, 0x0d47a1],
    LAVA: [0xff5722, 0xb71c1c],
    PIT: [0x1a1a1a, 0x0a0a0a],
    WALL: [0x5d5d5d, 0x3d3d3d],
    DOOR: [0x8d6e63, 0x5d4037],
    STAIRS: [0x9e9e9e, 0x616161],
  };

  constructor(
    container: PIXI.Container,
    tileSize: number,
    gridWidth: number,
    gridHeight: number
  ) {
    this.container = container;
    this.tileSize = tileSize;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;

    // Create layers in order (bottom to top)
    this.backgroundLayer = new PIXI.Container();
    this.ambientGradientLayer = new PIXI.Graphics();
    this.tileLayer = new PIXI.Container();
    this.animatedEffectsLayer = new PIXI.Container();
    this.gridLayer = new PIXI.Graphics();
    this.ambientParticleLayer = new PIXI.Container();
    this.highlightLayer = new PIXI.Container();

    // Add layers in order
    this.container.addChild(this.backgroundLayer);
    this.container.addChild(this.ambientGradientLayer);
    this.container.addChild(this.tileLayer);
    this.container.addChild(this.animatedEffectsLayer);
    this.container.addChild(this.gridLayer);
    this.container.addChild(this.ambientParticleLayer);
    this.container.addChild(this.highlightLayer);

    // Draw initial grid and ambient background
    this.drawAmbientGradient();
    this.drawGrid();
  }

  /**
   * Draw ambient gradient background
   */
  private drawAmbientGradient(): void {
    this.ambientGradientLayer.clear();

    const width = this.gridWidth * this.tileSize;
    const height = this.gridHeight * this.tileSize;

    // Create a dark ambient gradient background
    // Top layer (darker)
    this.ambientGradientLayer.beginFill(0x0f0d13, 0.3);
    this.ambientGradientLayer.drawRect(0, 0, width, height);
    this.ambientGradientLayer.endFill();

    // Add corner vignette effect
    const cornerSize = Math.min(width, height) * 0.4;
    for (let i = 0; i < 4; i++) {
      const alpha = 0.1 - i * 0.02;
      const size = cornerSize * (1 - i * 0.2);
      this.ambientGradientLayer.beginFill(0x000000, alpha);
      // Top-left corner
      this.ambientGradientLayer.moveTo(0, 0);
      this.ambientGradientLayer.lineTo(size, 0);
      this.ambientGradientLayer.lineTo(0, size);
      this.ambientGradientLayer.lineTo(0, 0);
      // Top-right corner
      this.ambientGradientLayer.moveTo(width, 0);
      this.ambientGradientLayer.lineTo(width - size, 0);
      this.ambientGradientLayer.lineTo(width, size);
      this.ambientGradientLayer.lineTo(width, 0);
      // Bottom-left corner
      this.ambientGradientLayer.moveTo(0, height);
      this.ambientGradientLayer.lineTo(size, height);
      this.ambientGradientLayer.lineTo(0, height - size);
      this.ambientGradientLayer.lineTo(0, height);
      // Bottom-right corner
      this.ambientGradientLayer.moveTo(width, height);
      this.ambientGradientLayer.lineTo(width - size, height);
      this.ambientGradientLayer.lineTo(width, height - size);
      this.ambientGradientLayer.lineTo(width, height);
      this.ambientGradientLayer.endFill();
    }
  }

  /**
   * Draw the grid lines
   */
  private drawGrid(): void {
    this.gridLayer.clear();
    this.gridLayer.lineStyle(1, GRID_COLORS.line, 0.3);

    // Vertical lines
    for (let x = 0; x <= this.gridWidth; x++) {
      this.gridLayer.moveTo(x * this.tileSize, 0);
      this.gridLayer.lineTo(x * this.tileSize, this.gridHeight * this.tileSize);
    }

    // Horizontal lines
    for (let y = 0; y <= this.gridHeight; y++) {
      this.gridLayer.moveTo(0, y * this.tileSize);
      this.gridLayer.lineTo(this.gridWidth * this.tileSize, y * this.tileSize);
    }
  }

  /**
   * Get tile key for caching
   */
  private getTileKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * Get terrain color with visibility modifier
   */
  private getTerrainColor(terrain: TerrainType, lightLevel: number): number {
    const baseColor = TERRAIN_COLORS[terrain];

    // Darken based on light level
    const r = ((baseColor >> 16) & 0xff) * lightLevel;
    const g = ((baseColor >> 8) & 0xff) * lightLevel;
    const b = (baseColor & 0xff) * lightLevel;

    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
  }

  /**
   * Render a single tile
   */
  private renderTile(tile: TileData): void {
    const key = this.getTileKey(tile.x, tile.y);

    // Remove existing tile graphic
    const existing = this.tileGraphics.get(key);
    if (existing) {
      this.tileLayer.removeChild(existing);
      existing.destroy();
    }

    // Create new tile graphic
    const graphics = new PIXI.Graphics();

    // Fill with terrain color
    const color = this.getTerrainColor(tile.terrain, tile.lightLevel);
    graphics.beginFill(color);
    graphics.drawRect(
      tile.x * this.tileSize,
      tile.y * this.tileSize,
      this.tileSize,
      this.tileSize
    );
    graphics.endFill();

    // Add terrain indicators
    this.addTerrainIndicator(graphics, tile);

    this.tileLayer.addChild(graphics);
    this.tileGraphics.set(key, graphics);
  }

  /**
   * Add visual indicators for special terrain (enhanced with richer effects)
   */
  private addTerrainIndicator(graphics: PIXI.Graphics, tile: TileData): void {
    const x = tile.x * this.tileSize;
    const y = tile.y * this.tileSize;
    const size = this.tileSize;
    const padding = 4;

    // Check if this is an animated terrain type
    const isAnimated = ['WATER', 'LAVA'].includes(tile.terrain);

    switch (tile.terrain) {
      case 'DIFFICULT':
        // Enhanced diagonal lines with gradient effect
        graphics.lineStyle(2, 0xd4a574, 0.4);
        for (let i = 0; i < 4; i++) {
          const offset = (size / 5) * (i + 1);
          graphics.moveTo(x + padding, y + offset);
          graphics.lineTo(x + offset, y + padding);
        }
        // Add small pebble dots
        graphics.beginFill(0x8b7355, 0.5);
        for (let i = 0; i < 5; i++) {
          const px = x + padding + Math.random() * (size - padding * 2);
          const py = y + padding + Math.random() * (size - padding * 2);
          graphics.drawCircle(px, py, 1.5);
        }
        graphics.endFill();
        break;

      case 'WATER':
        // Enhanced water with shimmer effect (base, animated overlay handled separately)
        graphics.beginFill(0x1565c0, 0.2);
        graphics.drawRect(x, y, size, size);
        graphics.endFill();
        // Highlight reflection
        graphics.beginFill(0x64b5f6, 0.15);
        graphics.drawEllipse(x + size * 0.3, y + size * 0.3, size * 0.25, size * 0.15);
        graphics.endFill();
        // Wave base pattern
        graphics.lineStyle(2, 0x90caf9, 0.4);
        for (let i = 0; i < 2; i++) {
          const yOffset = y + size * 0.35 + i * (size * 0.35);
          graphics.moveTo(x + padding, yOffset);
          graphics.quadraticCurveTo(
            x + size / 4, yOffset - 4,
            x + size / 2, yOffset
          );
          graphics.quadraticCurveTo(
            x + (size * 3) / 4, yOffset + 4,
            x + size - padding, yOffset
          );
        }
        break;

      case 'LAVA':
        // Enhanced lava with multiple glow layers
        // Outer glow
        graphics.beginFill(0xff6f00, 0.2);
        graphics.drawRect(x, y, size, size);
        graphics.endFill();
        // Middle glow
        graphics.beginFill(0xff8f00, 0.3);
        graphics.drawCircle(x + size / 2, y + size / 2, size * 0.4);
        graphics.endFill();
        // Inner bright core
        graphics.beginFill(0xffab00, 0.4);
        graphics.drawCircle(x + size / 2, y + size / 2, size * 0.25);
        graphics.endFill();
        // Hot spots
        graphics.beginFill(0xffeb3b, 0.5);
        graphics.drawCircle(x + size * 0.35, y + size * 0.4, 3);
        graphics.drawCircle(x + size * 0.65, y + size * 0.6, 2);
        graphics.endFill();
        // Crack pattern
        graphics.lineStyle(1, 0x1a1a1a, 0.4);
        graphics.moveTo(x + size * 0.2, y + size * 0.3);
        graphics.lineTo(x + size * 0.5, y + size * 0.5);
        graphics.lineTo(x + size * 0.8, y + size * 0.4);
        break;

      case 'PIT':
        // Enhanced pit with depth effect
        // Outer ring (lightest)
        graphics.beginFill(0x2d2d2d, 0.8);
        graphics.drawCircle(x + size / 2, y + size / 2, size * 0.45);
        graphics.endFill();
        // Middle ring
        graphics.beginFill(0x1a1a1a, 0.9);
        graphics.drawCircle(x + size / 2, y + size / 2, size * 0.35);
        graphics.endFill();
        // Inner darkness
        graphics.beginFill(0x0a0a0a, 1);
        graphics.drawCircle(x + size / 2, y + size / 2, size * 0.2);
        graphics.endFill();
        // Edge highlight
        graphics.lineStyle(1, 0x3d3d3d, 0.5);
        graphics.drawCircle(x + size / 2, y + size / 2, size * 0.44);
        break;

      case 'WALL': {
        // Enhanced brick pattern with depth
        const brickHeight = size / 4;
        // Base stone texture
        graphics.beginFill(0x4a4a4a, 0.3);
        graphics.drawRect(x, y, size, size);
        graphics.endFill();
        // Brick lines
        graphics.lineStyle(1, 0x2a2a2a, 0.7);
        for (let row = 0; row < 4; row++) {
          const yPos = y + row * brickHeight;
          const rowOffset = row % 2 === 0 ? 0 : size / 4;
          graphics.moveTo(x + rowOffset + size / 4, yPos);
          graphics.lineTo(x + rowOffset + size / 4, yPos + brickHeight);
          graphics.moveTo(x + rowOffset + size / 2, yPos);
          graphics.lineTo(x + rowOffset + size / 2, yPos + brickHeight);
          graphics.moveTo(x + rowOffset + (size * 3) / 4, yPos);
          graphics.lineTo(x + rowOffset + (size * 3) / 4, yPos + brickHeight);
          if (row < 3) {
            graphics.moveTo(x, yPos + brickHeight);
            graphics.lineTo(x + size, yPos + brickHeight);
          }
        }
        // Edge highlight
        graphics.lineStyle(1, 0x5d5d5d, 0.4);
        graphics.drawRect(x + 1, y + 1, size - 2, size - 2);
        break;
      }

      case 'DOOR':
        // Enhanced door with wood grain
        // Door frame shadow
        graphics.beginFill(0x3e2723, 0.5);
        graphics.drawRect(x + padding, y + padding - 2, size - padding * 2, size - padding);
        graphics.endFill();
        // Door panel
        graphics.beginFill(0x6d4c41, 0.9);
        graphics.drawRect(x + padding * 2, y + padding, size - padding * 4, size - padding * 2);
        graphics.endFill();
        // Door frame
        graphics.lineStyle(3, 0x8d6e63, 0.9);
        graphics.drawRect(x + padding * 2, y + padding, size - padding * 4, size - padding * 2);
        // Wood grain lines
        graphics.lineStyle(1, 0x5d4037, 0.3);
        for (let i = 0; i < 3; i++) {
          const gy = y + padding + (size - padding * 2) * (0.25 + i * 0.25);
          graphics.moveTo(x + padding * 3, gy);
          graphics.lineTo(x + size - padding * 3, gy);
        }
        // Door handle (gold with shine)
        graphics.beginFill(0xffd700, 0.9);
        graphics.drawCircle(x + size * 0.72, y + size / 2, 4);
        graphics.endFill();
        graphics.beginFill(0xffffff, 0.4);
        graphics.drawCircle(x + size * 0.71, y + size / 2 - 1, 1.5);
        graphics.endFill();
        break;

      case 'STAIRS':
        // Enhanced stairs with 3D effect
        graphics.lineStyle(0);
        for (let i = 0; i < 5; i++) {
          const stepY = y + (size / 5) * i;
          const stepHeight = size / 5;
          const brightness = 0.6 + i * 0.08;
          // Step top (lighter)
          graphics.beginFill(this.blendColor(0x757575, 0xffffff, brightness * 0.3), 0.9);
          graphics.drawRect(x + padding, stepY, size - padding * 2, stepHeight * 0.7);
          graphics.endFill();
          // Step front (darker)
          graphics.beginFill(this.blendColor(0x616161, 0x000000, 0.2), 0.8);
          graphics.drawRect(x + padding, stepY + stepHeight * 0.7, size - padding * 2, stepHeight * 0.3);
          graphics.endFill();
        }
        // Edge highlights
        graphics.lineStyle(1, 0x9e9e9e, 0.5);
        graphics.moveTo(x + padding, y);
        graphics.lineTo(x + padding, y + size);
        break;
    }

    // Register animated tiles for update loop
    if (isAnimated) {
      const key = this.getTileKey(tile.x, tile.y);
      if (!this.animatedTiles.has(key)) {
        this.animatedTiles.set(key, {
          tile,
          graphics,
          animPhase: Math.random() * Math.PI * 2,
          glowIntensity: 0.5,
        });
      }
    }
  }

  /**
   * Blend two colors
   */
  private blendColor(color1: number, color2: number, ratio: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;
    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return (r << 16) | (g << 8) | b;
  }

  /**
   * Render the entire map
   */
  public renderMap(map: MapData): void {
    // Clear existing tiles
    this.tileGraphics.forEach((graphic) => {
      this.tileLayer.removeChild(graphic);
      graphic.destroy();
    });
    this.tileGraphics.clear();

    // Update grid dimensions
    this.gridWidth = map.width;
    this.gridHeight = map.height;

    // Render background if provided
    if (map.backgroundUrl) {
      this.setBackground(map.backgroundUrl);
    }

    // Render all tiles
    for (const tile of map.tiles) {
      this.renderTile(tile);
    }

    // Redraw grid
    this.drawGrid();
  }

  /**
   * Set a background image
   */
  public async setBackground(url: string): Promise<void> {
    // Clear existing background
    this.backgroundLayer.removeChildren();

    try {
      const texture = await PIXI.Assets.load(url);
      const sprite = new PIXI.Sprite(texture);

      // Scale to fit grid
      sprite.width = this.gridWidth * this.tileSize;
      sprite.height = this.gridHeight * this.tileSize;

      this.backgroundLayer.addChild(sprite);
    } catch (error) {
      console.warn('Failed to load background:', error);
    }
  }

  /**
   * Update a single tile
   */
  public updateTile(tile: TileData): void {
    this.renderTile(tile);
  }

  /**
   * Set hovered tile
   */
  public setHoveredTile(position: GridPosition | null): void {
    this.hoveredTile = position;
    this.renderHighlights();
  }

  /**
   * Set selected tile
   */
  public setSelectedTile(position: GridPosition | null): void {
    this.selectedTile = position;
    this.renderHighlights();
  }

  /**
   * Highlight multiple tiles
   */
  public highlightTiles(
    positions: GridPosition[],
    color: number = GRID_COLORS.movement,
    alpha: number = 0.3
  ): void {
    // Clear existing highlights
    this.highlightedTiles.clear();

    // Add new highlights
    for (const pos of positions) {
      this.highlightedTiles.set(this.getTileKey(pos.x, pos.y), { color, alpha });
    }

    this.renderHighlights();
  }

  /**
   * Clear all highlights
   */
  public clearHighlights(): void {
    this.highlightedTiles.clear();
    this.renderHighlights();
  }

  /**
   * Render all highlights
   */
  private renderHighlights(): void {
    this.highlightLayer.removeChildren();

    // Draw highlighted tiles
    for (const [key, { color, alpha }] of this.highlightedTiles) {
      const [x, y] = key.split(',').map(Number);
      const graphics = new PIXI.Graphics();

      graphics.beginFill(color, alpha);
      graphics.drawRect(
        x * this.tileSize + 2,
        y * this.tileSize + 2,
        this.tileSize - 4,
        this.tileSize - 4
      );
      graphics.endFill();

      this.highlightLayer.addChild(graphics);
    }

    // Draw hover highlight
    if (this.hoveredTile) {
      const graphics = new PIXI.Graphics();
      graphics.lineStyle(3, GRID_COLORS.hover, 0.8);
      graphics.drawRect(
        this.hoveredTile.x * this.tileSize + 1,
        this.hoveredTile.y * this.tileSize + 1,
        this.tileSize - 2,
        this.tileSize - 2
      );
      this.highlightLayer.addChild(graphics);
    }

    // Draw selection highlight
    if (this.selectedTile) {
      const graphics = new PIXI.Graphics();
      graphics.lineStyle(4, GRID_COLORS.selected, 1);
      graphics.drawRect(
        this.selectedTile.x * this.tileSize,
        this.selectedTile.y * this.tileSize,
        this.tileSize,
        this.tileSize
      );
      this.highlightLayer.addChild(graphics);
    }
  }

  /**
   * Convert screen position to grid position
   */
  public screenToGrid(screenX: number, screenY: number): GridPosition {
    return {
      x: Math.floor(screenX / this.tileSize),
      y: Math.floor(screenY / this.tileSize),
    };
  }

  /**
   * Check if a grid position is valid
   */
  public isValidPosition(position: GridPosition): boolean {
    return (
      position.x >= 0 &&
      position.x < this.gridWidth &&
      position.y >= 0 &&
      position.y < this.gridHeight
    );
  }

  /**
   * Get world position from grid position
   */
  public gridToWorld(gridPos: GridPosition): { x: number; y: number } {
    return {
      x: gridPos.x * this.tileSize + this.tileSize / 2,
      y: gridPos.y * this.tileSize + this.tileSize / 2,
    };
  }

  /**
   * Get tile size
   */
  public getTileSize(): number {
    return this.tileSize;
  }

  /**
   * Update animations (called each frame)
   */
  public update(_delta: number): void {
    // Update animated tiles
    this.updateAnimatedTiles();

    // Update ambient particles
    this.updateAmbientParticles();

    // Spawn new particles
    this.spawnAmbientParticles();

    // Update highlight pulse
    this.updateHighlightPulse();
  }

  /**
   * Update animated tiles (water, lava)
   */
  private updateAnimatedTiles(): void {
    for (const [_key, data] of this.animatedTiles) {
      data.animPhase += this.animationSpeed;

      // Update glow intensity for animated effects
      if (data.tile.terrain === 'LAVA') {
        data.glowIntensity = 0.4 + Math.sin(data.animPhase * this.lavaGlowSpeed * 50) * 0.2;
      } else if (data.tile.terrain === 'WATER') {
        data.glowIntensity = 0.3 + Math.sin(data.animPhase * this.waterWaveSpeed * 50) * 0.1;
      }
    }

    // Update animated effects layer
    this.animatedEffectsLayer.removeChildren();

    for (const [_key, data] of this.animatedTiles) {
      const x = data.tile.x * this.tileSize;
      const y = data.tile.y * this.tileSize;
      const size = this.tileSize;

      const effectGraphics = new PIXI.Graphics();

      if (data.tile.terrain === 'LAVA') {
        // Animated lava glow
        const glowSize = size * 0.3 * (1 + Math.sin(data.animPhase * 3) * 0.1);
        effectGraphics.beginFill(0xffeb3b, data.glowIntensity * 0.4);
        effectGraphics.drawCircle(x + size / 2, y + size / 2, glowSize);
        effectGraphics.endFill();

        // Animated bubble spots
        const bubbleX = x + size * 0.3 + Math.sin(data.animPhase * 2) * 5;
        const bubbleY = y + size * 0.5 + Math.cos(data.animPhase * 2.5) * 3;
        effectGraphics.beginFill(0xffd54f, 0.6);
        effectGraphics.drawCircle(bubbleX, bubbleY, 2 + Math.sin(data.animPhase) * 1);
        effectGraphics.endFill();
      } else if (data.tile.terrain === 'WATER') {
        // Animated water shimmer
        const shimmerY = y + size * 0.5 + Math.sin(data.animPhase * 2) * 3;
        effectGraphics.beginFill(0xb3e5fc, data.glowIntensity);
        effectGraphics.drawEllipse(
          x + size / 2 + Math.cos(data.animPhase) * 5,
          shimmerY,
          size * 0.2,
          size * 0.08
        );
        effectGraphics.endFill();

        // Ripple effect
        const rippleSize = (data.animPhase % (Math.PI * 2)) / (Math.PI * 2) * size * 0.3;
        const rippleAlpha = 0.3 * (1 - rippleSize / (size * 0.3));
        if (rippleAlpha > 0) {
          effectGraphics.lineStyle(1, 0x81d4fa, rippleAlpha);
          effectGraphics.drawCircle(x + size / 2, y + size / 2, rippleSize + size * 0.1);
        }
      }

      this.animatedEffectsLayer.addChild(effectGraphics);
    }
  }

  /**
   * Spawn ambient particles for terrain
   */
  private spawnAmbientParticles(): void {
    this.particleSpawnTimer++;

    if (this.particleSpawnTimer < 3) return; // Spawn every 3 frames
    this.particleSpawnTimer = 0;

    // Spawn particles for animated tiles
    for (const [_key, data] of this.animatedTiles) {
      if (Math.random() > 0.3) continue; // 30% chance per tile

      const x = data.tile.x * this.tileSize + Math.random() * this.tileSize;
      const y = data.tile.y * this.tileSize + Math.random() * this.tileSize;

      let particle: AmbientParticle | null = null;

      if (data.tile.terrain === 'LAVA') {
        // Ember particles
        particle = {
          graphics: new PIXI.Graphics(),
          x,
          y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 1.5 - 0.5,
          life: 1,
          maxLife: 40 + Math.random() * 30,
          size: 1.5 + Math.random() * 2,
          color: Math.random() > 0.5 ? 0xff6f00 : 0xffab00,
          alpha: 0.8,
          type: 'ember',
        };
      } else if (data.tile.terrain === 'WATER') {
        // Bubble particles
        particle = {
          graphics: new PIXI.Graphics(),
          x,
          y: y + this.tileSize * 0.8,
          vx: (Math.random() - 0.5) * 0.2,
          vy: -Math.random() * 0.5 - 0.2,
          life: 1,
          maxLife: 50 + Math.random() * 30,
          size: 1 + Math.random() * 2,
          color: 0xb3e5fc,
          alpha: 0.5,
          type: 'bubble',
        };
      }

      if (particle) {
        particle.graphics.beginFill(particle.color, particle.alpha);
        particle.graphics.drawCircle(0, 0, particle.size);
        particle.graphics.endFill();
        particle.graphics.x = particle.x;
        particle.graphics.y = particle.y;
        this.ambientParticleLayer.addChild(particle.graphics);
        this.ambientParticles.push(particle);
      }
    }

    // Spawn random dust/sparkle particles across the board (less frequent)
    if (Math.random() < 0.1) {
      const x = Math.random() * this.gridWidth * this.tileSize;
      const y = Math.random() * this.gridHeight * this.tileSize;

      const particle: AmbientParticle = {
        graphics: new PIXI.Graphics(),
        x,
        y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.1,
        life: 1,
        maxLife: 80 + Math.random() * 40,
        size: 0.5 + Math.random() * 1,
        color: 0xffffff,
        alpha: 0.2 + Math.random() * 0.2,
        type: 'dust',
      };

      particle.graphics.beginFill(particle.color, particle.alpha);
      particle.graphics.drawCircle(0, 0, particle.size);
      particle.graphics.endFill();
      particle.graphics.x = particle.x;
      particle.graphics.y = particle.y;
      this.ambientParticleLayer.addChild(particle.graphics);
      this.ambientParticles.push(particle);
    }
  }

  /**
   * Update ambient particles
   */
  private updateAmbientParticles(): void {
    const particlesToRemove: AmbientParticle[] = [];

    for (const particle of this.ambientParticles) {
      particle.life--;
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Type-specific behavior
      if (particle.type === 'ember') {
        particle.vx += (Math.random() - 0.5) * 0.1;
        particle.alpha = (particle.life / particle.maxLife) * 0.8;
      } else if (particle.type === 'bubble') {
        particle.vx = Math.sin(particle.life * 0.1) * 0.1;
        particle.size *= 1.01; // Bubbles grow slightly
        particle.alpha = (particle.life / particle.maxLife) * 0.5;
      } else {
        particle.alpha = (particle.life / particle.maxLife) * 0.3;
      }

      particle.graphics.x = particle.x;
      particle.graphics.y = particle.y;
      particle.graphics.alpha = particle.alpha;

      if (particle.life <= 0) {
        particlesToRemove.push(particle);
      }
    }

    // Remove dead particles
    for (const particle of particlesToRemove) {
      this.ambientParticleLayer.removeChild(particle.graphics);
      particle.graphics.destroy();
      const index = this.ambientParticles.indexOf(particle);
      if (index > -1) {
        this.ambientParticles.splice(index, 1);
      }
    }
  }

  /**
   * Update highlight pulse animation
   */
  private updateHighlightPulse(): void {
    this.highlightPulsePhase += 0.05;

    // Re-render highlights with pulse effect if there are highlighted tiles
    if (this.highlightedTiles.size > 0 || this.hoveredTile || this.selectedTile) {
      this.renderHighlightsAnimated();
    }
  }

  /**
   * Render highlights with animated pulse effect
   */
  private renderHighlightsAnimated(): void {
    this.highlightLayer.removeChildren();

    const pulseAlpha = 0.1 + Math.sin(this.highlightPulsePhase) * 0.1;
    const pulseScale = 1 + Math.sin(this.highlightPulsePhase) * 0.02;

    // Draw highlighted tiles with pulse
    for (const [key, { color, alpha }] of this.highlightedTiles) {
      const [x, y] = key.split(',').map(Number);
      const graphics = new PIXI.Graphics();

      const adjustedAlpha = alpha + pulseAlpha;

      // Outer glow
      graphics.beginFill(color, adjustedAlpha * 0.3);
      graphics.drawRect(
        x * this.tileSize,
        y * this.tileSize,
        this.tileSize,
        this.tileSize
      );
      graphics.endFill();

      // Inner fill
      graphics.beginFill(color, adjustedAlpha);
      const padding = 2 + (1 - pulseScale) * 5;
      graphics.drawRect(
        x * this.tileSize + padding,
        y * this.tileSize + padding,
        this.tileSize - padding * 2,
        this.tileSize - padding * 2
      );
      graphics.endFill();

      this.highlightLayer.addChild(graphics);
    }

    // Draw hover highlight with glow
    if (this.hoveredTile) {
      const graphics = new PIXI.Graphics();

      // Glow effect
      graphics.beginFill(GRID_COLORS.hover, 0.1 + pulseAlpha);
      graphics.drawRect(
        this.hoveredTile.x * this.tileSize - 2,
        this.hoveredTile.y * this.tileSize - 2,
        this.tileSize + 4,
        this.tileSize + 4
      );
      graphics.endFill();

      // Border
      graphics.lineStyle(3, GRID_COLORS.hover, 0.8 + pulseAlpha);
      graphics.drawRect(
        this.hoveredTile.x * this.tileSize + 1,
        this.hoveredTile.y * this.tileSize + 1,
        this.tileSize - 2,
        this.tileSize - 2
      );

      this.highlightLayer.addChild(graphics);
    }

    // Draw selection highlight with strong glow
    if (this.selectedTile) {
      const graphics = new PIXI.Graphics();

      // Outer glow
      for (let i = 2; i >= 0; i--) {
        const glowAlpha = (0.1 + pulseAlpha * 0.5) * (1 - i * 0.3);
        graphics.beginFill(GRID_COLORS.selected, glowAlpha);
        graphics.drawRect(
          this.selectedTile.x * this.tileSize - i * 3,
          this.selectedTile.y * this.tileSize - i * 3,
          this.tileSize + i * 6,
          this.tileSize + i * 6
        );
        graphics.endFill();
      }

      // Border
      graphics.lineStyle(4, GRID_COLORS.selected, 1);
      graphics.drawRect(
        this.selectedTile.x * this.tileSize,
        this.selectedTile.y * this.tileSize,
        this.tileSize,
        this.tileSize
      );

      // Corner accents
      const cornerSize = 8;
      graphics.lineStyle(2, 0xffd700, 0.8 + pulseAlpha);
      // Top-left
      graphics.moveTo(this.selectedTile.x * this.tileSize, this.selectedTile.y * this.tileSize + cornerSize);
      graphics.lineTo(this.selectedTile.x * this.tileSize, this.selectedTile.y * this.tileSize);
      graphics.lineTo(this.selectedTile.x * this.tileSize + cornerSize, this.selectedTile.y * this.tileSize);
      // Top-right
      graphics.moveTo(this.selectedTile.x * this.tileSize + this.tileSize - cornerSize, this.selectedTile.y * this.tileSize);
      graphics.lineTo(this.selectedTile.x * this.tileSize + this.tileSize, this.selectedTile.y * this.tileSize);
      graphics.lineTo(this.selectedTile.x * this.tileSize + this.tileSize, this.selectedTile.y * this.tileSize + cornerSize);
      // Bottom-left
      graphics.moveTo(this.selectedTile.x * this.tileSize, this.selectedTile.y * this.tileSize + this.tileSize - cornerSize);
      graphics.lineTo(this.selectedTile.x * this.tileSize, this.selectedTile.y * this.tileSize + this.tileSize);
      graphics.lineTo(this.selectedTile.x * this.tileSize + cornerSize, this.selectedTile.y * this.tileSize + this.tileSize);
      // Bottom-right
      graphics.moveTo(this.selectedTile.x * this.tileSize + this.tileSize - cornerSize, this.selectedTile.y * this.tileSize + this.tileSize);
      graphics.lineTo(this.selectedTile.x * this.tileSize + this.tileSize, this.selectedTile.y * this.tileSize + this.tileSize);
      graphics.lineTo(this.selectedTile.x * this.tileSize + this.tileSize, this.selectedTile.y * this.tileSize + this.tileSize - cornerSize);

      this.highlightLayer.addChild(graphics);
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Clean up particles
    for (const particle of this.ambientParticles) {
      particle.graphics.destroy();
    }
    this.ambientParticles = [];

    // Clean up animated tiles
    this.animatedTiles.clear();

    this.tileGraphics.forEach((graphic) => graphic.destroy());
    this.tileGraphics.clear();
    this.container.destroy({ children: true });
  }
}
