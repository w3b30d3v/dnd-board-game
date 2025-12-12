/**
 * InputHandler
 * Handles mouse, touch, and keyboard input for the game board
 */

import * as PIXI from 'pixi.js';
import type { GridPosition, InputCallbacks } from './types';
import type { BoardRenderer } from './BoardRenderer';

export class InputHandler {
  private app: PIXI.Application;
  private boardRenderer: BoardRenderer;
  private tileSize: number;
  private callbacks: InputCallbacks;

  // Input state
  private isDragging: boolean = false;
  private isPinching: boolean = false;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;
  private lastPinchDistance: number = 0;

  // Touch tracking
  private activePointers: Map<number, { x: number; y: number }> = new Map();

  // Drag threshold (pixels)
  private dragThreshold: number = 5;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private hasDragged: boolean = false;

  constructor(
    app: PIXI.Application,
    boardRenderer: BoardRenderer,
    tileSize: number,
    callbacks: InputCallbacks
  ) {
    this.app = app;
    this.boardRenderer = boardRenderer;
    this.tileSize = tileSize;
    this.callbacks = callbacks;

    this.setupEventListeners();
  }

  /**
   * Set up all event listeners
   */
  private setupEventListeners(): void {
    const canvas = this.app.view as HTMLCanvasElement;

    // Make stage interactive
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    // Mouse events
    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

    // Touch events
    canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this));

    // Keyboard events (for future use)
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Context menu (right-click)
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Get world position from screen coordinates
   */
  private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const canvas = this.app.view as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    // Adjust for canvas position and scale
    const x = (screenX - rect.left) * (canvas.width / rect.width);
    const y = (screenY - rect.top) * (canvas.height / rect.height);

    // Convert to world coordinates using stage transform
    const stage = this.app.stage;
    return {
      x: (x - stage.x) / stage.scale.x,
      y: (y - stage.y) / stage.scale.y,
    };
  }

  /**
   * Get grid position from world coordinates
   */
  private worldToGrid(worldX: number, worldY: number): GridPosition {
    return {
      x: Math.floor(worldX / this.tileSize),
      y: Math.floor(worldY / this.tileSize),
    };
  }

  // ==================== Mouse Events ====================

  private handleMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return; // Left click only

    this.isDragging = true;
    this.hasDragged = false;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
  }

  private handleMouseMove(event: MouseEvent): void {
    const worldPos = this.screenToWorld(event.clientX, event.clientY);
    const gridPos = this.worldToGrid(worldPos.x, worldPos.y);

    // Handle dragging (panning)
    if (this.isDragging) {
      const dx = event.clientX - this.lastPointerX;
      const dy = event.clientY - this.lastPointerY;

      // Check if we've moved past the drag threshold
      const totalDx = event.clientX - this.dragStartX;
      const totalDy = event.clientY - this.dragStartY;
      if (Math.abs(totalDx) > this.dragThreshold || Math.abs(totalDy) > this.dragThreshold) {
        this.hasDragged = true;
      }

      if (this.hasDragged) {
        this.callbacks.onPan(dx, dy);
      }

      this.lastPointerX = event.clientX;
      this.lastPointerY = event.clientY;
    } else {
      // Hover - only update if position is valid
      if (this.boardRenderer.isValidPosition(gridPos)) {
        this.callbacks.onTileHover(gridPos);
      } else {
        this.callbacks.onTileHover(null);
      }
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (event.button !== 0) return;

    // If we didn't drag, it's a click
    if (!this.hasDragged) {
      const worldPos = this.screenToWorld(event.clientX, event.clientY);
      const gridPos = this.worldToGrid(worldPos.x, worldPos.y);

      if (this.boardRenderer.isValidPosition(gridPos)) {
        this.callbacks.onTileClick(gridPos);
      }
    }

    this.isDragging = false;
    this.hasDragged = false;
  }

  private handleMouseLeave(_event: MouseEvent): void {
    this.isDragging = false;
    this.hasDragged = false;
    this.callbacks.onTileHover(null);
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();

    // Normalize wheel delta
    const delta = -Math.sign(event.deltaY);

    this.callbacks.onZoom(delta, event.clientX, event.clientY);
  }

  // ==================== Touch Events ====================

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();

    // Track all active touches
    for (const touch of Array.from(event.changedTouches)) {
      this.activePointers.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      });
    }

    if (this.activePointers.size === 1) {
      // Single touch - potential click or pan
      const touch = event.changedTouches[0];
      this.isDragging = true;
      this.hasDragged = false;
      this.lastPointerX = touch.clientX;
      this.lastPointerY = touch.clientY;
      this.dragStartX = touch.clientX;
      this.dragStartY = touch.clientY;
    } else if (this.activePointers.size === 2) {
      // Two finger - pinch zoom
      this.isPinching = true;
      this.isDragging = false;
      this.lastPinchDistance = this.getPinchDistance();
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();

    // Update touch positions
    for (const touch of Array.from(event.changedTouches)) {
      this.activePointers.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      });
    }

    if (this.isPinching && this.activePointers.size === 2) {
      // Handle pinch zoom
      const distance = this.getPinchDistance();
      const delta = distance - this.lastPinchDistance;
      const center = this.getPinchCenter();

      // Convert distance change to zoom delta
      const zoomDelta = delta > 0 ? 1 : delta < 0 ? -1 : 0;

      if (Math.abs(delta) > 5) {
        this.callbacks.onZoom(zoomDelta, center.x, center.y);
        this.lastPinchDistance = distance;
      }
    } else if (this.isDragging && this.activePointers.size === 1) {
      // Handle single finger pan
      const touch = event.changedTouches[0];
      const dx = touch.clientX - this.lastPointerX;
      const dy = touch.clientY - this.lastPointerY;

      // Check if we've moved past the drag threshold
      const totalDx = touch.clientX - this.dragStartX;
      const totalDy = touch.clientY - this.dragStartY;
      if (Math.abs(totalDx) > this.dragThreshold || Math.abs(totalDy) > this.dragThreshold) {
        this.hasDragged = true;
      }

      if (this.hasDragged) {
        this.callbacks.onPan(dx, dy);
      }

      this.lastPointerX = touch.clientX;
      this.lastPointerY = touch.clientY;
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    // Remove ended touches
    for (const touch of Array.from(event.changedTouches)) {
      // Check for tap (click)
      if (!this.hasDragged && this.activePointers.size === 1 && !this.isPinching) {
        const worldPos = this.screenToWorld(touch.clientX, touch.clientY);
        const gridPos = this.worldToGrid(worldPos.x, worldPos.y);

        if (this.boardRenderer.isValidPosition(gridPos)) {
          this.callbacks.onTileClick(gridPos);
        }
      }

      this.activePointers.delete(touch.identifier);
    }

    // Reset state
    if (this.activePointers.size === 0) {
      this.isDragging = false;
      this.isPinching = false;
      this.hasDragged = false;
    } else if (this.activePointers.size === 1) {
      // Transitioned from pinch to pan
      this.isPinching = false;
      this.isDragging = true;
      const [pointer] = this.activePointers.values();
      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
    }
  }

  /**
   * Get distance between two touch points
   */
  private getPinchDistance(): number {
    const pointers = Array.from(this.activePointers.values());
    if (pointers.length < 2) return 0;

    const dx = pointers[1].x - pointers[0].x;
    const dy = pointers[1].y - pointers[0].y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get center point between two touches
   */
  private getPinchCenter(): { x: number; y: number } {
    const pointers = Array.from(this.activePointers.values());
    if (pointers.length < 2) return { x: 0, y: 0 };

    return {
      x: (pointers[0].x + pointers[1].x) / 2,
      y: (pointers[0].y + pointers[1].y) / 2,
    };
  }

  // ==================== Keyboard Events ====================

  private handleKeyDown(event: KeyboardEvent): void {
    // Reserved for future keyboard shortcuts
    // e.g., arrow keys for camera movement, space for end turn, etc.
    switch (event.key) {
      case 'ArrowUp':
        this.callbacks.onPan(0, 50);
        break;
      case 'ArrowDown':
        this.callbacks.onPan(0, -50);
        break;
      case 'ArrowLeft':
        this.callbacks.onPan(50, 0);
        break;
      case 'ArrowRight':
        this.callbacks.onPan(-50, 0);
        break;
      case '+':
      case '=':
        this.callbacks.onZoom(1, window.innerWidth / 2, window.innerHeight / 2);
        break;
      case '-':
        this.callbacks.onZoom(-1, window.innerWidth / 2, window.innerHeight / 2);
        break;
    }
  }

  private handleKeyUp(_event: KeyboardEvent): void {
    // Handle key up if needed
  }

  /**
   * Update tile size (if changed)
   */
  public setTileSize(tileSize: number): void {
    this.tileSize = tileSize;
  }

  /**
   * Clean up event listeners
   */
  public destroy(): void {
    const canvas = this.app.view as HTMLCanvasElement;

    canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    canvas.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
    canvas.removeEventListener('wheel', this.handleWheel.bind(this));

    canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    canvas.removeEventListener('touchcancel', this.handleTouchEnd.bind(this));

    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));

    this.activePointers.clear();
  }
}
