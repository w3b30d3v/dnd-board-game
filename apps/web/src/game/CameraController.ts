/**
 * CameraController
 * Handles pan and zoom for the game board
 */

import * as PIXI from 'pixi.js';

export class CameraController {
  private stage: PIXI.Container;
  private screenWidth: number;
  private screenHeight: number;

  // Camera state
  private targetX: number = 0;
  private targetY: number = 0;
  private targetScale: number = 1;

  // Constraints
  private minScale: number = 0.25;
  private maxScale: number = 4;
  private smoothing: number = 0.15;

  // Bounds (set based on map size)
  private boundsMinX: number = -Infinity;
  private boundsMaxX: number = Infinity;
  private boundsMinY: number = -Infinity;
  private boundsMaxY: number = Infinity;

  constructor(
    stage: PIXI.Container,
    screenWidth: number,
    screenHeight: number
  ) {
    this.stage = stage;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // Center the stage initially
    this.stage.x = screenWidth / 2;
    this.stage.y = screenHeight / 2;
    this.targetX = this.stage.x;
    this.targetY = this.stage.y;
  }

  /**
   * Set the map bounds for constraining camera movement
   */
  public setBounds(
    mapWidth: number,
    mapHeight: number,
    tileSize: number
  ): void {
    const worldWidth = mapWidth * tileSize;
    const worldHeight = mapHeight * tileSize;

    // Calculate bounds with padding
    const padding = 100;
    this.boundsMinX = -worldWidth + this.screenWidth / 2 - padding;
    this.boundsMaxX = this.screenWidth / 2 + padding;
    this.boundsMinY = -worldHeight + this.screenHeight / 2 - padding;
    this.boundsMaxY = this.screenHeight / 2 + padding;
  }

  /**
   * Update screen dimensions (on resize)
   */
  public updateScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  /**
   * Pan the camera by delta
   */
  public pan(dx: number, dy: number): void {
    this.targetX += dx;
    this.targetY += dy;

    // Clamp to bounds
    this.targetX = Math.max(this.boundsMinX, Math.min(this.boundsMaxX, this.targetX));
    this.targetY = Math.max(this.boundsMinY, Math.min(this.boundsMaxY, this.targetY));
  }

  /**
   * Zoom the camera
   * @param delta - Positive to zoom in, negative to zoom out
   * @param centerX - Screen X position to zoom towards
   * @param centerY - Screen Y position to zoom towards
   */
  public zoom(delta: number, centerX: number, centerY: number): void {
    const oldScale = this.targetScale;
    const zoomFactor = delta > 0 ? 1.1 : 0.9;

    this.targetScale = Math.max(
      this.minScale,
      Math.min(this.maxScale, this.targetScale * zoomFactor)
    );

    // Zoom towards the cursor position
    const scaleDiff = this.targetScale - oldScale;
    if (Math.abs(scaleDiff) > 0.001) {
      const worldX = (centerX - this.stage.x) / oldScale;
      const worldY = (centerY - this.stage.y) / oldScale;

      this.targetX -= worldX * scaleDiff;
      this.targetY -= worldY * scaleDiff;
    }
  }

  /**
   * Set zoom level directly
   */
  public setZoom(scale: number): void {
    this.targetScale = Math.max(this.minScale, Math.min(this.maxScale, scale));
  }

  /**
   * Get current zoom level
   */
  public getZoom(): number {
    return this.stage.scale.x;
  }

  /**
   * Center camera on a world position
   */
  public centerOn(worldX: number, worldY: number): void {
    this.targetX = this.screenWidth / 2 - worldX * this.targetScale;
    this.targetY = this.screenHeight / 2 - worldY * this.targetScale;
  }

  /**
   * Center camera on a grid position
   */
  public centerOnTile(gridX: number, gridY: number, tileSize: number): void {
    const worldX = gridX * tileSize + tileSize / 2;
    const worldY = gridY * tileSize + tileSize / 2;
    this.centerOn(worldX, worldY);
  }

  /**
   * Smoothly animate to a position
   */
  public animateTo(worldX: number, worldY: number, _duration: number = 500): void {
    // For now, just center immediately
    // TODO: Add tweening with GSAP or custom animation
    this.centerOn(worldX, worldY);
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.stage.x) / this.stage.scale.x,
      y: (screenY - this.stage.y) / this.stage.scale.y,
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this.stage.scale.x + this.stage.x,
      y: worldY * this.stage.scale.y + this.stage.y,
    };
  }

  /**
   * Update camera position (called each frame)
   */
  public update(_delta: number): void {
    // Smoothly interpolate position
    this.stage.x += (this.targetX - this.stage.x) * this.smoothing;
    this.stage.y += (this.targetY - this.stage.y) * this.smoothing;

    // Smoothly interpolate scale
    const currentScale = this.stage.scale.x;
    const newScale = currentScale + (this.targetScale - currentScale) * this.smoothing;
    this.stage.scale.set(newScale, newScale);
  }

  /**
   * Reset camera to default position
   */
  public reset(): void {
    this.targetX = this.screenWidth / 2;
    this.targetY = this.screenHeight / 2;
    this.targetScale = 1;
  }

  /**
   * Get current camera position in world coordinates
   */
  public getPosition(): { x: number; y: number } {
    return this.screenToWorld(this.screenWidth / 2, this.screenHeight / 2);
  }
}
