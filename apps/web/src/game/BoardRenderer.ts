/**
 * BoardRenderer
 * Handles rendering the tile grid and terrain
 */

import * as PIXI from 'pixi.js';
import type { MapData, TileData, TerrainType, GridPosition } from './types';
import { TERRAIN_COLORS, GRID_COLORS } from './types';

export class BoardRenderer {
  private container: PIXI.Container;
  private tileSize: number;
  private gridWidth: number;
  private gridHeight: number;

  // Graphics layers
  private backgroundLayer: PIXI.Container;
  private tileLayer: PIXI.Container;
  private gridLayer: PIXI.Graphics;
  private highlightLayer: PIXI.Container;

  // Tile graphics cache
  private tileGraphics: Map<string, PIXI.Graphics> = new Map();

  // Current hover/selection
  private hoveredTile: GridPosition | null = null;
  private selectedTile: GridPosition | null = null;
  private highlightedTiles: Map<string, { color: number; alpha: number }> = new Map();

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

    // Create layers
    this.backgroundLayer = new PIXI.Container();
    this.tileLayer = new PIXI.Container();
    this.gridLayer = new PIXI.Graphics();
    this.highlightLayer = new PIXI.Container();

    // Add layers in order
    this.container.addChild(this.backgroundLayer);
    this.container.addChild(this.tileLayer);
    this.container.addChild(this.gridLayer);
    this.container.addChild(this.highlightLayer);

    // Draw initial grid
    this.drawGrid();
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
   * Add visual indicators for special terrain
   */
  private addTerrainIndicator(graphics: PIXI.Graphics, tile: TileData): void {
    const x = tile.x * this.tileSize;
    const y = tile.y * this.tileSize;
    const size = this.tileSize;
    const padding = 4;

    switch (tile.terrain) {
      case 'DIFFICULT':
        // Draw diagonal lines for difficult terrain
        graphics.lineStyle(2, 0x8b7355, 0.5);
        for (let i = 0; i < 3; i++) {
          const offset = (size / 4) * (i + 1);
          graphics.moveTo(x + padding, y + offset);
          graphics.lineTo(x + offset, y + padding);
        }
        break;

      case 'WATER':
        // Draw wave pattern
        graphics.lineStyle(2, 0x4a90d9, 0.6);
        for (let i = 0; i < 2; i++) {
          const yOffset = y + size * 0.3 + i * (size * 0.3);
          graphics.moveTo(x + padding, yOffset);
          graphics.quadraticCurveTo(
            x + size / 4, yOffset - 5,
            x + size / 2, yOffset
          );
          graphics.quadraticCurveTo(
            x + (size * 3) / 4, yOffset + 5,
            x + size - padding, yOffset
          );
        }
        break;

      case 'LAVA':
        // Draw glow effect
        graphics.beginFill(0xff4500, 0.3);
        graphics.drawCircle(x + size / 2, y + size / 2, size / 3);
        graphics.endFill();
        break;

      case 'PIT':
        // Draw concentric circles
        graphics.lineStyle(2, 0x1a1a1a, 0.7);
        graphics.drawCircle(x + size / 2, y + size / 2, size / 3);
        graphics.drawCircle(x + size / 2, y + size / 2, size / 5);
        break;

      case 'WALL': {
        // Draw brick pattern
        graphics.lineStyle(1, 0x2a2a2a, 0.6);
        const brickHeight = size / 4;
        for (let row = 0; row < 4; row++) {
          const yPos = y + row * brickHeight;
          const rowOffset = row % 2 === 0 ? 0 : size / 4;
          graphics.moveTo(x + rowOffset + size / 4, yPos);
          graphics.lineTo(x + rowOffset + size / 4, yPos + brickHeight);
          graphics.moveTo(x + rowOffset + size / 2, yPos);
          graphics.lineTo(x + rowOffset + size / 2, yPos + brickHeight);
          if (row < 3) {
            graphics.moveTo(x, yPos + brickHeight);
            graphics.lineTo(x + size, yPos + brickHeight);
          }
        }
        break;
      }

      case 'DOOR':
        // Draw door frame
        graphics.lineStyle(3, 0x8b4513, 0.8);
        graphics.drawRect(
          x + padding * 2,
          y + padding,
          size - padding * 4,
          size - padding * 2
        );
        // Door handle
        graphics.beginFill(0xffd700, 0.8);
        graphics.drawCircle(x + size * 0.7, y + size / 2, 3);
        graphics.endFill();
        break;

      case 'STAIRS':
        // Draw stair lines
        graphics.lineStyle(2, 0x888888, 0.6);
        for (let i = 1; i <= 4; i++) {
          const stepY = y + (size / 5) * i;
          graphics.moveTo(x + padding, stepY);
          graphics.lineTo(x + size - padding, stepY);
        }
        break;
    }
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
   * Clean up resources
   */
  public destroy(): void {
    this.tileGraphics.forEach((graphic) => graphic.destroy());
    this.tileGraphics.clear();
    this.container.destroy({ children: true });
  }
}
