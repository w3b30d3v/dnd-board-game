/**
 * FogOfWarRenderer
 * Handles rendering fog of war (hidden, explored, visible states)
 */

import * as PIXI from 'pixi.js';
import type { GridPosition, VisibilityState } from './types';

export class FogOfWarRenderer {
  private container: PIXI.Container;
  private tileSize: number;
  private gridWidth: number;
  private gridHeight: number;

  // Visibility data
  private visibility: Map<string, VisibilityState> = new Map();

  // Graphics layers
  private fogLayer: PIXI.Graphics;
  private exploredLayer: PIXI.Graphics;

  // Colors and alphas
  private hiddenColor: number = 0x000000;
  private hiddenAlpha: number = 1;
  private exploredAlpha: number = 0.5;
  private visibleAlpha: number = 0;

  // Smooth fog edges
  private useSmoothEdges: boolean = true;

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

    // Create graphics layers
    this.exploredLayer = new PIXI.Graphics();
    this.fogLayer = new PIXI.Graphics();

    this.container.addChild(this.exploredLayer);
    this.container.addChild(this.fogLayer);

    // Initialize all tiles as hidden
    this.initializeVisibility();
  }

  /**
   * Get tile key for map
   */
  private getTileKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * Initialize all tiles as hidden
   */
  private initializeVisibility(): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.visibility.set(this.getTileKey(x, y), 'HIDDEN');
      }
    }
    this.render();
  }

  /**
   * Update visibility based on visible tiles array
   */
  public updateVisibility(visibleTiles: GridPosition[]): void {
    // Mark all previously visible tiles as explored (not hidden)
    for (const [key, state] of this.visibility) {
      if (state === 'VISIBLE') {
        this.visibility.set(key, 'EXPLORED');
      }
    }

    // Mark new visible tiles
    for (const tile of visibleTiles) {
      const key = this.getTileKey(tile.x, tile.y);
      this.visibility.set(key, 'VISIBLE');
    }

    this.render();
  }

  /**
   * Set visibility for a specific tile
   */
  public setTileVisibility(x: number, y: number, state: VisibilityState): void {
    this.visibility.set(this.getTileKey(x, y), state);
    this.render();
  }

  /**
   * Reveal an area (circle) around a point
   */
  public revealArea(centerX: number, centerY: number, radius: number): void {
    const radiusTiles = Math.ceil(radius / 5); // Assuming 5ft per tile

    for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
      for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;

        // Check if within grid bounds
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
          continue;
        }

        // Check if within radius
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= radiusTiles) {
          this.visibility.set(this.getTileKey(x, y), 'VISIBLE');
        }
      }
    }

    this.render();
  }

  /**
   * Explore tiles (set to EXPLORED state)
   */
  public exploreTiles(tiles: GridPosition[]): void {
    for (const tile of tiles) {
      const key = this.getTileKey(tile.x, tile.y);
      const currentState = this.visibility.get(key);

      // Only upgrade from HIDDEN to EXPLORED
      if (currentState === 'HIDDEN') {
        this.visibility.set(key, 'EXPLORED');
      }
    }

    this.render();
  }

  /**
   * Hide all tiles
   */
  public hideAll(): void {
    for (const key of this.visibility.keys()) {
      this.visibility.set(key, 'HIDDEN');
    }
    this.render();
  }

  /**
   * Reveal all tiles
   */
  public revealAll(): void {
    for (const key of this.visibility.keys()) {
      this.visibility.set(key, 'VISIBLE');
    }
    this.render();
  }

  /**
   * Get visibility state for a tile
   */
  public getVisibility(x: number, y: number): VisibilityState {
    return this.visibility.get(this.getTileKey(x, y)) || 'HIDDEN';
  }

  /**
   * Check if a tile is visible
   */
  public isVisible(x: number, y: number): boolean {
    return this.getVisibility(x, y) === 'VISIBLE';
  }

  /**
   * Check if a tile has been explored
   */
  public isExplored(x: number, y: number): boolean {
    const state = this.getVisibility(x, y);
    return state === 'VISIBLE' || state === 'EXPLORED';
  }

  /**
   * Render the fog of war
   */
  private render(): void {
    this.fogLayer.clear();
    this.exploredLayer.clear();

    // Render each tile
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const state = this.visibility.get(this.getTileKey(x, y)) || 'HIDDEN';
        this.renderTileFog(x, y, state);
      }
    }

    // Add smooth edge effect if enabled
    if (this.useSmoothEdges) {
      this.renderSmoothEdges();
    }
  }

  /**
   * Render fog for a single tile
   */
  private renderTileFog(x: number, y: number, state: VisibilityState): void {
    const tileX = x * this.tileSize;
    const tileY = y * this.tileSize;

    switch (state) {
      case 'HIDDEN':
        this.fogLayer.beginFill(this.hiddenColor, this.hiddenAlpha);
        this.fogLayer.drawRect(tileX, tileY, this.tileSize, this.tileSize);
        this.fogLayer.endFill();
        break;

      case 'EXPLORED':
        this.exploredLayer.beginFill(this.hiddenColor, this.exploredAlpha);
        this.exploredLayer.drawRect(tileX, tileY, this.tileSize, this.tileSize);
        this.exploredLayer.endFill();
        break;

      case 'VISIBLE':
        // No fog for visible tiles
        break;
    }
  }

  /**
   * Add smooth edges between visibility states
   */
  private renderSmoothEdges(): void {
    // For each visible tile, check adjacent explored/hidden tiles
    // and add gradient effect
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const state = this.visibility.get(this.getTileKey(x, y));

        if (state === 'VISIBLE') {
          // Check adjacent tiles for fog edges
          this.renderEdgeGradient(x, y);
        }
      }
    }
  }

  /**
   * Render gradient edge for a visible tile
   */
  private renderEdgeGradient(x: number, y: number): void {
    const tileX = x * this.tileSize;
    const tileY = y * this.tileSize;
    const edgeSize = this.tileSize / 4;

    // Check each direction
    const directions = [
      { dx: 0, dy: -1, side: 'top' },
      { dx: 1, dy: 0, side: 'right' },
      { dx: 0, dy: 1, side: 'bottom' },
      { dx: -1, dy: 0, side: 'left' },
    ];

    for (const { dx, dy, side } of directions) {
      const nx = x + dx;
      const ny = y + dy;

      // Skip if out of bounds
      if (nx < 0 || nx >= this.gridWidth || ny < 0 || ny >= this.gridHeight) {
        continue;
      }

      const neighborState = this.visibility.get(this.getTileKey(nx, ny));

      // Only add edge if neighbor is darker
      if (neighborState === 'HIDDEN' || neighborState === 'EXPLORED') {
        const alpha = neighborState === 'HIDDEN' ? 0.6 : 0.3;

        // Draw gradient edge
        this.exploredLayer.beginFill(this.hiddenColor, alpha);

        switch (side) {
          case 'top':
            this.exploredLayer.drawRect(tileX, tileY, this.tileSize, edgeSize);
            break;
          case 'right':
            this.exploredLayer.drawRect(
              tileX + this.tileSize - edgeSize,
              tileY,
              edgeSize,
              this.tileSize
            );
            break;
          case 'bottom':
            this.exploredLayer.drawRect(
              tileX,
              tileY + this.tileSize - edgeSize,
              this.tileSize,
              edgeSize
            );
            break;
          case 'left':
            this.exploredLayer.drawRect(tileX, tileY, edgeSize, this.tileSize);
            break;
        }

        this.exploredLayer.endFill();
      }
    }
  }

  /**
   * Update grid dimensions
   */
  public setGridSize(width: number, height: number): void {
    const oldWidth = this.gridWidth;
    const oldHeight = this.gridHeight;

    this.gridWidth = width;
    this.gridHeight = height;

    // Add new tiles as hidden
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x >= oldWidth || y >= oldHeight) {
          this.visibility.set(this.getTileKey(x, y), 'HIDDEN');
        }
      }
    }

    // Remove tiles outside new bounds
    for (const key of Array.from(this.visibility.keys())) {
      const [x, y] = key.split(',').map(Number);
      if (x >= width || y >= height) {
        this.visibility.delete(key);
      }
    }

    this.render();
  }

  /**
   * Enable/disable smooth edges
   */
  public setSmoothEdges(enabled: boolean): void {
    this.useSmoothEdges = enabled;
    this.render();
  }

  /**
   * Get all visible tile positions
   */
  public getVisibleTiles(): GridPosition[] {
    const tiles: GridPosition[] = [];

    for (const [key, state] of this.visibility) {
      if (state === 'VISIBLE') {
        const [x, y] = key.split(',').map(Number);
        tiles.push({ x, y });
      }
    }

    return tiles;
  }

  /**
   * Get all explored tile positions (including visible)
   */
  public getExploredTiles(): GridPosition[] {
    const tiles: GridPosition[] = [];

    for (const [key, state] of this.visibility) {
      if (state === 'VISIBLE' || state === 'EXPLORED') {
        const [x, y] = key.split(',').map(Number);
        tiles.push({ x, y });
      }
    }

    return tiles;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.visibility.clear();
    this.fogLayer.destroy();
    this.exploredLayer.destroy();
    this.container.destroy({ children: true });
  }
}
