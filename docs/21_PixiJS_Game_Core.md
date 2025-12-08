# D&D Digital Board Game Platform
# Document 21: PixiJS Game Core Implementation

---

# 1. Overview

This document contains the PixiJS-based game client core. Create these files in `apps/web/src/game/`.

---

# 2. Game Application (apps/web/src/game/GameApplication.ts)

```typescript
import * as PIXI from 'pixi.js';
import { BoardRenderer } from './BoardRenderer';
import { TokenManager } from './TokenManager';
import { FogOfWarRenderer } from './FogOfWarRenderer';
import { AoEOverlayRenderer } from './AoEOverlayRenderer';
import { InputHandler } from './InputHandler';
import { CameraController } from './CameraController';
import type { GameState, TileData, GridPosition } from '@dnd/shared';

export interface GameConfig {
  containerId: string;
  tileSize: number;
  gridWidth: number;
  gridHeight: number;
  onTileClick?: (position: GridPosition) => void;
  onTokenClick?: (creatureId: string) => void;
  onTileHover?: (position: GridPosition | null) => void;
}

export class GameApplication {
  private app: PIXI.Application;
  private config: GameConfig;
  
  // Renderers
  private boardRenderer: BoardRenderer;
  private tokenManager: TokenManager;
  private fogRenderer: FogOfWarRenderer;
  private aoeRenderer: AoEOverlayRenderer;
  
  // Controllers
  private inputHandler: InputHandler;
  private cameraController: CameraController;
  
  // Containers (layer order)
  private boardContainer: PIXI.Container;
  private tokenContainer: PIXI.Container;
  private effectsContainer: PIXI.Container;
  private fogContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  
  // State
  private currentState: GameState | null = null;
  private selectedCreatureId: string | null = null;
  private highlightedTiles: GridPosition[] = [];

  constructor(config: GameConfig) {
    this.config = config;
    
    // Create PIXI Application
    this.app = new PIXI.Application({
      resizeTo: document.getElementById(config.containerId) || window,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Mount to DOM
    const container = document.getElementById(config.containerId);
    if (container) {
      container.appendChild(this.app.view as HTMLCanvasElement);
    }

    // Create layer containers
    this.boardContainer = new PIXI.Container();
    this.tokenContainer = new PIXI.Container();
    this.effectsContainer = new PIXI.Container();
    this.fogContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();

    // Add in order (bottom to top)
    this.app.stage.addChild(this.boardContainer);
    this.app.stage.addChild(this.tokenContainer);
    this.app.stage.addChild(this.effectsContainer);
    this.app.stage.addChild(this.fogContainer);
    this.app.stage.addChild(this.uiContainer);

    // Initialize renderers
    this.boardRenderer = new BoardRenderer(
      this.boardContainer,
      config.tileSize,
      config.gridWidth,
      config.gridHeight
    );

    this.tokenManager = new TokenManager(
      this.tokenContainer,
      config.tileSize
    );

    this.fogRenderer = new FogOfWarRenderer(
      this.fogContainer,
      config.tileSize,
      config.gridWidth,
      config.gridHeight
    );

    this.aoeRenderer = new AoEOverlayRenderer(
      this.effectsContainer,
      config.tileSize
    );

    // Initialize controllers
    this.cameraController = new CameraController(
      this.app.stage,
      this.app.screen.width,
      this.app.screen.height
    );

    this.inputHandler = new InputHandler(
      this.app,
      this.boardRenderer,
      config.tileSize,
      {
        onTileClick: this.handleTileClick.bind(this),
        onTileHover: this.handleTileHover.bind(this),
        onPan: this.cameraController.pan.bind(this.cameraController),
        onZoom: this.cameraController.zoom.bind(this.cameraController),
      }
    );

    // Start game loop
    this.app.ticker.add(this.update.bind(this));

    // Handle resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * Main game loop
   */
  private update(delta: number): void {
    this.cameraController.update(delta);
    this.tokenManager.update(delta);
    this.aoeRenderer.update(delta);
  }

  /**
   * Load a new game state
   */
  public loadState(state: GameState): void {
    this.currentState = state;

    // Render board
    this.boardRenderer.renderMap(state.map);

    // Render tokens
    this.tokenManager.clear();
    for (const creature of state.creatures) {
      this.tokenManager.addToken(creature);
    }

    // Update fog of war
    if (state.visibleTiles) {
      this.fogRenderer.updateVisibility(state.visibleTiles);
    }
  }

  /**
   * Update partial state (delta updates)
   */
  public updateState(delta: Partial<GameState>): void {
    if (!this.currentState) return;

    // Merge delta into current state
    this.currentState = { ...this.currentState, ...delta };

    // Update affected renderers
    if (delta.creatures) {
      for (const creature of delta.creatures) {
        this.tokenManager.updateToken(creature);
      }
    }

    if (delta.visibleTiles) {
      this.fogRenderer.updateVisibility(delta.visibleTiles);
    }
  }

  /**
   * Highlight tiles for movement/targeting
   */
  public highlightTiles(
    positions: GridPosition[],
    color: number = 0x00ff00,
    alpha: number = 0.3
  ): void {
    this.highlightedTiles = positions;
    this.boardRenderer.highlightTiles(positions, color, alpha);
  }

  /**
   * Clear highlighted tiles
   */
  public clearHighlights(): void {
    this.highlightedTiles = [];
    this.boardRenderer.clearHighlights();
  }

  /**
   * Show AoE preview
   */
  public showAoEPreview(
    shape: 'sphere' | 'cube' | 'cone' | 'line',
    origin: GridPosition,
    size: number,
    direction?: number
  ): void {
    this.aoeRenderer.showPreview(shape, origin, size, direction);
  }

  /**
   * Hide AoE preview
   */
  public hideAoEPreview(): void {
    this.aoeRenderer.hidePreview();
  }

  /**
   * Select a creature
   */
  public selectCreature(creatureId: string | null): void {
    this.selectedCreatureId = creatureId;
    this.tokenManager.setSelected(creatureId);
  }

  /**
   * Animate creature movement
   */
  public async animateMovement(
    creatureId: string,
    path: GridPosition[]
  ): Promise<void> {
    return this.tokenManager.animateMovement(creatureId, path);
  }

  /**
   * Play attack animation
   */
  public async playAttackAnimation(
    attackerId: string,
    targetId: string,
    hits: boolean
  ): Promise<void> {
    return this.tokenManager.playAttackAnimation(attackerId, targetId, hits);
  }

  /**
   * Show damage number
   */
  public showDamageNumber(
    position: GridPosition,
    amount: number,
    type: 'damage' | 'healing' | 'critical'
  ): void {
    // Create floating damage text
    const worldPos = this.gridToWorld(position);
    const color = type === 'healing' ? 0x00ff00 : 
                  type === 'critical' ? 0xff0000 : 0xffffff;
    
    const text = new PIXI.Text(
      type === 'healing' ? `+${amount}` : `-${amount}`,
      {
        fontFamily: 'Arial',
        fontSize: type === 'critical' ? 32 : 24,
        fill: color,
        fontWeight: 'bold',
        stroke: 0x000000,
        strokeThickness: 4,
      }
    );
    
    text.anchor.set(0.5);
    text.position.set(worldPos.x, worldPos.y);
    this.uiContainer.addChild(text);

    // Animate floating up and fading
    const startY = text.y;
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      text.y = startY - (50 * progress);
      text.alpha = 1 - progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.uiContainer.removeChild(text);
        text.destroy();
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Center camera on position
   */
  public centerOn(position: GridPosition, animate: boolean = true): void {
    const worldPos = this.gridToWorld(position);
    this.cameraController.centerOn(worldPos.x, worldPos.y, animate);
  }

  /**
   * Handle tile click
   */
  private handleTileClick(position: GridPosition): void {
    this.config.onTileClick?.(position);
  }

  /**
   * Handle tile hover
   */
  private handleTileHover(position: GridPosition | null): void {
    this.config.onTileHover?.(position);
    
    if (position) {
      this.boardRenderer.setHoveredTile(position);
    } else {
      this.boardRenderer.clearHoveredTile();
    }
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    this.cameraController.updateScreenSize(
      this.app.screen.width,
      this.app.screen.height
    );
  }

  /**
   * Convert grid position to world coordinates
   */
  private gridToWorld(position: GridPosition): { x: number; y: number } {
    return {
      x: position.x * this.config.tileSize + this.config.tileSize / 2,
      y: position.y * this.config.tileSize + this.config.tileSize / 2,
    };
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.inputHandler.destroy();
    this.app.destroy(true, { children: true });
  }
}
```

---

# 3. Board Renderer (apps/web/src/game/BoardRenderer.ts)

```typescript
import * as PIXI from 'pixi.js';
import type { GridPosition, TileData, MapData } from '@dnd/shared';

const TILE_COLORS = {
  floor: 0x3d3d3d,
  wall: 0x1a1a1a,
  water: 0x2196f3,
  difficult: 0x8b4513,
  door_open: 0x5d4037,
  door_closed: 0x3e2723,
  pit: 0x000000,
};

export class BoardRenderer {
  private container: PIXI.Container;
  private tileSize: number;
  private gridWidth: number;
  private gridHeight: number;

  private tilesContainer: PIXI.Container;
  private gridLinesContainer: PIXI.Container;
  private highlightContainer: PIXI.Container;
  private hoverGraphics: PIXI.Graphics;

  private tileSprites: Map<string, PIXI.Graphics> = new Map();

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

    // Create sub-containers
    this.tilesContainer = new PIXI.Container();
    this.gridLinesContainer = new PIXI.Container();
    this.highlightContainer = new PIXI.Container();
    this.hoverGraphics = new PIXI.Graphics();

    this.container.addChild(this.tilesContainer);
    this.container.addChild(this.gridLinesContainer);
    this.container.addChild(this.highlightContainer);
    this.container.addChild(this.hoverGraphics);

    // Draw initial grid
    this.drawGridLines();
  }

  /**
   * Render the entire map
   */
  public renderMap(map: MapData): void {
    this.tilesContainer.removeChildren();
    this.tileSprites.clear();

    for (const tile of map.tiles) {
      this.renderTile(tile);
    }
  }

  /**
   * Render a single tile
   */
  private renderTile(tile: TileData): void {
    const graphics = new PIXI.Graphics();
    const x = tile.position.x * this.tileSize;
    const y = tile.position.y * this.tileSize;

    // Get tile color
    const color = this.getTileColor(tile.type);

    // Draw tile background
    graphics.beginFill(color);
    graphics.drawRect(x, y, this.tileSize, this.tileSize);
    graphics.endFill();

    // Add tile border
    graphics.lineStyle(1, 0x555555, 0.5);
    graphics.drawRect(x, y, this.tileSize, this.tileSize);

    // Add cover indicators
    if (tile.providesHalfCover) {
      this.drawCoverIndicator(graphics, x, y, 'half');
    } else if (tile.providesThreeQuarterCover) {
      this.drawCoverIndicator(graphics, x, y, 'three_quarters');
    }

    // Store reference
    const key = `${tile.position.x},${tile.position.y}`;
    this.tileSprites.set(key, graphics);

    this.tilesContainer.addChild(graphics);
  }

  /**
   * Get color for tile type
   */
  private getTileColor(type: string): number {
    return TILE_COLORS[type as keyof typeof TILE_COLORS] || TILE_COLORS.floor;
  }

  /**
   * Draw cover indicator on tile
   */
  private drawCoverIndicator(
    graphics: PIXI.Graphics,
    x: number,
    y: number,
    coverType: 'half' | 'three_quarters'
  ): void {
    const size = this.tileSize * 0.3;
    const color = coverType === 'half' ? 0xffff00 : 0xff9800;

    graphics.beginFill(color, 0.6);
    graphics.moveTo(x + this.tileSize - size, y);
    graphics.lineTo(x + this.tileSize, y);
    graphics.lineTo(x + this.tileSize, y + size);
    graphics.closePath();
    graphics.endFill();
  }

  /**
   * Draw grid lines
   */
  private drawGridLines(): void {
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(1, 0x444444, 0.3);

    // Vertical lines
    for (let x = 0; x <= this.gridWidth; x++) {
      graphics.moveTo(x * this.tileSize, 0);
      graphics.lineTo(x * this.tileSize, this.gridHeight * this.tileSize);
    }

    // Horizontal lines
    for (let y = 0; y <= this.gridHeight; y++) {
      graphics.moveTo(0, y * this.tileSize);
      graphics.lineTo(this.gridWidth * this.tileSize, y * this.tileSize);
    }

    this.gridLinesContainer.addChild(graphics);
  }

  /**
   * Highlight tiles
   */
  public highlightTiles(
    positions: GridPosition[],
    color: number,
    alpha: number
  ): void {
    this.clearHighlights();

    const graphics = new PIXI.Graphics();
    graphics.beginFill(color, alpha);

    for (const pos of positions) {
      graphics.drawRect(
        pos.x * this.tileSize,
        pos.y * this.tileSize,
        this.tileSize,
        this.tileSize
      );
    }

    graphics.endFill();
    this.highlightContainer.addChild(graphics);
  }

  /**
   * Clear all highlights
   */
  public clearHighlights(): void {
    this.highlightContainer.removeChildren();
  }

  /**
   * Set hovered tile
   */
  public setHoveredTile(position: GridPosition): void {
    this.hoverGraphics.clear();
    this.hoverGraphics.lineStyle(2, 0xffffff, 0.8);
    this.hoverGraphics.drawRect(
      position.x * this.tileSize,
      position.y * this.tileSize,
      this.tileSize,
      this.tileSize
    );
  }

  /**
   * Clear hovered tile
   */
  public clearHoveredTile(): void {
    this.hoverGraphics.clear();
  }

  /**
   * Get tile at world position
   */
  public getTileAtWorld(worldX: number, worldY: number): GridPosition | null {
    const gridX = Math.floor(worldX / this.tileSize);
    const gridY = Math.floor(worldY / this.tileSize);

    if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
      return { x: gridX, y: gridY };
    }

    return null;
  }
}
```

---

# 4. Token Manager (apps/web/src/game/TokenManager.ts)

```typescript
import * as PIXI from 'pixi.js';
import type { GridPosition, SessionCreature } from '@dnd/shared';

interface TokenSprite {
  container: PIXI.Container;
  sprite: PIXI.Sprite | PIXI.Graphics;
  nameText: PIXI.Text;
  healthBar: PIXI.Graphics;
  creature: SessionCreature;
}

export class TokenManager {
  private container: PIXI.Container;
  private tileSize: number;
  private tokens: Map<string, TokenSprite> = new Map();
  private selectedId: string | null = null;
  private selectionIndicator: PIXI.Graphics;

  constructor(container: PIXI.Container, tileSize: number) {
    this.container = container;
    this.tileSize = tileSize;

    this.selectionIndicator = new PIXI.Graphics();
    this.container.addChild(this.selectionIndicator);
  }

  /**
   * Add a token for a creature
   */
  public addToken(creature: SessionCreature): void {
    const tokenContainer = new PIXI.Container();

    // Token background/sprite
    const sprite = new PIXI.Graphics();
    const radius = (this.tileSize / 2) * 0.8;
    
    // Color based on friend/foe
    const color = creature.isPlayerCharacter ? 0x4caf50 : 0xf44336;
    
    sprite.beginFill(color);
    sprite.drawCircle(0, 0, radius);
    sprite.endFill();
    
    // Border
    sprite.lineStyle(2, 0xffffff);
    sprite.drawCircle(0, 0, radius);

    // Name text
    const nameText = new PIXI.Text(creature.name.substring(0, 3).toUpperCase(), {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    nameText.anchor.set(0.5);
    nameText.y = -radius - 10;

    // Health bar
    const healthBar = new PIXI.Graphics();
    this.updateHealthBar(healthBar, creature, radius);

    // Assemble token
    tokenContainer.addChild(sprite);
    tokenContainer.addChild(nameText);
    tokenContainer.addChild(healthBar);

    // Position
    const pos = this.gridToWorld(creature.position);
    tokenContainer.position.set(pos.x, pos.y);

    // Make interactive
    tokenContainer.eventMode = 'static';
    tokenContainer.cursor = 'pointer';

    // Store token
    this.tokens.set(creature.creatureId, {
      container: tokenContainer,
      sprite,
      nameText,
      healthBar,
      creature,
    });

    this.container.addChild(tokenContainer);
  }

  /**
   * Update token for creature state change
   */
  public updateToken(creature: SessionCreature): void {
    const token = this.tokens.get(creature.creatureId);
    if (!token) {
      this.addToken(creature);
      return;
    }

    // Update position
    const pos = this.gridToWorld(creature.position);
    token.container.position.set(pos.x, pos.y);

    // Update health bar
    const radius = (this.tileSize / 2) * 0.8;
    this.updateHealthBar(token.healthBar, creature, radius);

    // Update stored creature
    token.creature = creature;
  }

  /**
   * Remove a token
   */
  public removeToken(creatureId: string): void {
    const token = this.tokens.get(creatureId);
    if (token) {
      this.container.removeChild(token.container);
      token.container.destroy({ children: true });
      this.tokens.delete(creatureId);
    }
  }

  /**
   * Clear all tokens
   */
  public clear(): void {
    for (const token of this.tokens.values()) {
      this.container.removeChild(token.container);
      token.container.destroy({ children: true });
    }
    this.tokens.clear();
  }

  /**
   * Set selected token
   */
  public setSelected(creatureId: string | null): void {
    this.selectedId = creatureId;
    this.updateSelectionIndicator();
  }

  /**
   * Animate token movement along path
   */
  public async animateMovement(
    creatureId: string,
    path: GridPosition[]
  ): Promise<void> {
    const token = this.tokens.get(creatureId);
    if (!token || path.length === 0) return;

    const moveDuration = 200; // ms per tile

    for (const pos of path) {
      const worldPos = this.gridToWorld(pos);
      await this.tweenTo(token.container, worldPos.x, worldPos.y, moveDuration);
    }
  }

  /**
   * Play attack animation
   */
  public async playAttackAnimation(
    attackerId: string,
    targetId: string,
    hits: boolean
  ): Promise<void> {
    const attacker = this.tokens.get(attackerId);
    const target = this.tokens.get(targetId);
    
    if (!attacker || !target) return;

    // Quick lunge toward target
    const origX = attacker.container.x;
    const origY = attacker.container.y;
    
    const dx = target.container.x - attacker.container.x;
    const dy = target.container.y - attacker.container.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const lungeX = origX + (dx / dist) * 20;
    const lungeY = origY + (dy / dist) * 20;

    // Lunge forward
    await this.tweenTo(attacker.container, lungeX, lungeY, 100);
    
    // Flash target if hit
    if (hits) {
      target.sprite.tint = 0xff0000;
      setTimeout(() => {
        target.sprite.tint = 0xffffff;
      }, 150);
    }

    // Return to original position
    await this.tweenTo(attacker.container, origX, origY, 100);
  }

  /**
   * Update function called each frame
   */
  public update(delta: number): void {
    this.updateSelectionIndicator();
  }

  /**
   * Update health bar graphics
   */
  private updateHealthBar(
    graphics: PIXI.Graphics,
    creature: SessionCreature,
    radius: number
  ): void {
    graphics.clear();

    const barWidth = radius * 1.5;
    const barHeight = 4;
    const y = radius + 5;

    // Background
    graphics.beginFill(0x333333);
    graphics.drawRect(-barWidth / 2, y, barWidth, barHeight);
    graphics.endFill();

    // Health fill
    const healthPercent = creature.stats.currentHp / creature.stats.maxHp;
    const fillColor = healthPercent > 0.5 ? 0x4caf50 : 
                      healthPercent > 0.25 ? 0xffeb3b : 0xf44336;
    
    graphics.beginFill(fillColor);
    graphics.drawRect(-barWidth / 2, y, barWidth * healthPercent, barHeight);
    graphics.endFill();
  }

  /**
   * Update selection indicator position
   */
  private updateSelectionIndicator(): void {
    this.selectionIndicator.clear();
    
    if (!this.selectedId) return;

    const token = this.tokens.get(this.selectedId);
    if (!token) return;

    const radius = (this.tileSize / 2) * 0.9;
    
    this.selectionIndicator.lineStyle(3, 0xffff00, 0.8);
    this.selectionIndicator.drawCircle(
      token.container.x,
      token.container.y,
      radius
    );
  }

  /**
   * Simple tween animation
   */
  private tweenTo(
    container: PIXI.Container,
    targetX: number,
    targetY: number,
    duration: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const startX = container.x;
      const startY = container.y;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out quad
        const ease = 1 - (1 - progress) * (1 - progress);
        
        container.x = startX + (targetX - startX) * ease;
        container.y = startY + (targetY - startY) * ease;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Convert grid position to world coordinates
   */
  private gridToWorld(position: GridPosition): { x: number; y: number } {
    return {
      x: position.x * this.tileSize + this.tileSize / 2,
      y: position.y * this.tileSize + this.tileSize / 2,
    };
  }
}
```

---

# 5. Input Handler (apps/web/src/game/InputHandler.ts)

```typescript
import * as PIXI from 'pixi.js';
import type { BoardRenderer } from './BoardRenderer';
import type { GridPosition } from '@dnd/shared';

interface InputCallbacks {
  onTileClick: (position: GridPosition) => void;
  onTileHover: (position: GridPosition | null) => void;
  onPan: (dx: number, dy: number) => void;
  onZoom: (delta: number, centerX: number, centerY: number) => void;
}

export class InputHandler {
  private app: PIXI.Application;
  private boardRenderer: BoardRenderer;
  private tileSize: number;
  private callbacks: InputCallbacks;

  private isDragging = false;
  private lastPointerPosition = { x: 0, y: 0 };
  private lastHoveredTile: GridPosition | null = null;

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

  private setupEventListeners(): void {
    const view = this.app.view as HTMLCanvasElement;

    // Make stage interactive
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    // Pointer events
    this.app.stage.on('pointerdown', this.onPointerDown.bind(this));
    this.app.stage.on('pointerup', this.onPointerUp.bind(this));
    this.app.stage.on('pointerupoutside', this.onPointerUp.bind(this));
    this.app.stage.on('pointermove', this.onPointerMove.bind(this));

    // Wheel event for zoom
    view.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

    // Keyboard events
    window.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  private onPointerDown(event: PIXI.FederatedPointerEvent): void {
    // Middle mouse or right mouse for panning
    if (event.button === 1 || event.button === 2) {
      this.isDragging = true;
      this.lastPointerPosition = { x: event.globalX, y: event.globalY };
      return;
    }

    // Left click - tile selection
    if (event.button === 0) {
      const worldPos = this.screenToWorld(event.globalX, event.globalY);
      const tilePos = this.boardRenderer.getTileAtWorld(worldPos.x, worldPos.y);
      
      if (tilePos) {
        this.callbacks.onTileClick(tilePos);
      }
    }
  }

  private onPointerUp(event: PIXI.FederatedPointerEvent): void {
    this.isDragging = false;
  }

  private onPointerMove(event: PIXI.FederatedPointerEvent): void {
    // Handle panning
    if (this.isDragging) {
      const dx = event.globalX - this.lastPointerPosition.x;
      const dy = event.globalY - this.lastPointerPosition.y;
      
      this.callbacks.onPan(dx, dy);
      
      this.lastPointerPosition = { x: event.globalX, y: event.globalY };
      return;
    }

    // Handle hover
    const worldPos = this.screenToWorld(event.globalX, event.globalY);
    const tilePos = this.boardRenderer.getTileAtWorld(worldPos.x, worldPos.y);

    // Only fire callback if tile changed
    if (!this.positionsEqual(tilePos, this.lastHoveredTile)) {
      this.lastHoveredTile = tilePos;
      this.callbacks.onTileHover(tilePos);
    }
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    this.callbacks.onZoom(delta, event.clientX, event.clientY);
  }

  private onKeyDown(event: KeyboardEvent): void {
    // Arrow key panning
    const panAmount = 50;
    
    switch (event.key) {
      case 'ArrowUp':
        this.callbacks.onPan(0, panAmount);
        break;
      case 'ArrowDown':
        this.callbacks.onPan(0, -panAmount);
        break;
      case 'ArrowLeft':
        this.callbacks.onPan(panAmount, 0);
        break;
      case 'ArrowRight':
        this.callbacks.onPan(-panAmount, 0);
        break;
    }
  }

  private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const stage = this.app.stage;
    return {
      x: (screenX - stage.x) / stage.scale.x,
      y: (screenY - stage.y) / stage.scale.y,
    };
  }

  private positionsEqual(a: GridPosition | null, b: GridPosition | null): boolean {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return a.x === b.x && a.y === b.y;
  }

  public destroy(): void {
    const view = this.app.view as HTMLCanvasElement;
    view.removeEventListener('wheel', this.onWheel.bind(this));
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
  }
}
```

---

# 6. Camera Controller (apps/web/src/game/CameraController.ts)

```typescript
import * as PIXI from 'pixi.js';

export class CameraController {
  private stage: PIXI.Container;
  private screenWidth: number;
  private screenHeight: number;

  private targetX = 0;
  private targetY = 0;
  private targetScale = 1;

  private minScale = 0.25;
  private maxScale = 2;
  private smoothing = 0.15;

  constructor(stage: PIXI.Container, screenWidth: number, screenHeight: number) {
    this.stage = stage;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // Center initially
    this.targetX = screenWidth / 2;
    this.targetY = screenHeight / 2;
    this.stage.x = this.targetX;
    this.stage.y = this.targetY;
  }

  /**
   * Pan the camera
   */
  public pan(dx: number, dy: number): void {
    this.targetX += dx;
    this.targetY += dy;
  }

  /**
   * Zoom the camera
   */
  public zoom(delta: number, centerX: number, centerY: number): void {
    const oldScale = this.targetScale;
    this.targetScale = Math.max(
      this.minScale,
      Math.min(this.maxScale, this.targetScale + delta)
    );

    // Zoom toward cursor position
    if (this.targetScale !== oldScale) {
      const scaleFactor = this.targetScale / oldScale;
      this.targetX = centerX - (centerX - this.targetX) * scaleFactor;
      this.targetY = centerY - (centerY - this.targetY) * scaleFactor;
    }
  }

  /**
   * Center camera on world position
   */
  public centerOn(worldX: number, worldY: number, animate: boolean = true): void {
    const targetStageX = this.screenWidth / 2 - worldX * this.targetScale;
    const targetStageY = this.screenHeight / 2 - worldY * this.targetScale;

    if (animate) {
      this.targetX = targetStageX;
      this.targetY = targetStageY;
    } else {
      this.targetX = targetStageX;
      this.targetY = targetStageY;
      this.stage.x = targetStageX;
      this.stage.y = targetStageY;
    }
  }

  /**
   * Update camera (called each frame)
   */
  public update(delta: number): void {
    // Smooth interpolation
    this.stage.x += (this.targetX - this.stage.x) * this.smoothing;
    this.stage.y += (this.targetY - this.stage.y) * this.smoothing;
    this.stage.scale.x += (this.targetScale - this.stage.scale.x) * this.smoothing;
    this.stage.scale.y += (this.targetScale - this.stage.scale.y) * this.smoothing;
  }

  /**
   * Update screen size on resize
   */
  public updateScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  /**
   * Get current world position at screen center
   */
  public getWorldCenter(): { x: number; y: number } {
    return {
      x: (this.screenWidth / 2 - this.stage.x) / this.stage.scale.x,
      y: (this.screenHeight / 2 - this.stage.y) / this.stage.scale.y,
    };
  }
}
```

---

# 7. React Integration Hook (apps/web/src/game/useGameCanvas.ts)

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { GameApplication, GameConfig } from './GameApplication';
import type { GameState, GridPosition } from '@dnd/shared';

interface UseGameCanvasOptions {
  onTileClick?: (position: GridPosition) => void;
  onTokenClick?: (creatureId: string) => void;
  onTileHover?: (position: GridPosition | null) => void;
}

export function useGameCanvas(options: UseGameCanvasOptions = {}) {
  const gameRef = useRef<GameApplication | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize game
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: GameConfig = {
      containerId: 'game-container',
      tileSize: 64,
      gridWidth: 40,
      gridHeight: 30,
      onTileClick: options.onTileClick,
      onTokenClick: options.onTokenClick,
      onTileHover: options.onTileHover,
    };

    gameRef.current = new GameApplication(config);

    return () => {
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, []);

  // Update callbacks when they change
  useEffect(() => {
    // Callbacks are set during construction, would need to add setter methods
    // to GameApplication to update them dynamically
  }, [options.onTileClick, options.onTokenClick, options.onTileHover]);

  // Exposed methods
  const loadState = useCallback((state: GameState) => {
    gameRef.current?.loadState(state);
  }, []);

  const updateState = useCallback((delta: Partial<GameState>) => {
    gameRef.current?.updateState(delta);
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

  const selectCreature = useCallback((creatureId: string | null) => {
    gameRef.current?.selectCreature(creatureId);
  }, []);

  const animateMovement = useCallback(
    async (creatureId: string, path: GridPosition[]) => {
      return gameRef.current?.animateMovement(creatureId, path);
    },
    []
  );

  const showDamageNumber = useCallback(
    (position: GridPosition, amount: number, type: 'damage' | 'healing' | 'critical') => {
      gameRef.current?.showDamageNumber(position, amount, type);
    },
    []
  );

  const centerOn = useCallback((position: GridPosition, animate?: boolean) => {
    gameRef.current?.centerOn(position, animate);
  }, []);

  return {
    containerRef,
    loadState,
    updateState,
    highlightTiles,
    clearHighlights,
    selectCreature,
    animateMovement,
    showDamageNumber,
    centerOn,
  };
}
```

---

# 8. Game Canvas Component (apps/web/src/components/GameCanvas.tsx)

```tsx
import React, { useEffect } from 'react';
import { useGameCanvas } from '../game/useGameCanvas';
import { useGameStore } from '../stores/gameStore';
import type { GridPosition } from '@dnd/shared';

export const GameCanvas: React.FC = () => {
  const gameState = useGameStore((state) => state.currentSession);
  const selectedCreature = useGameStore((state) => state.selectedCreatureId);
  const selectCreature = useGameStore((state) => state.selectCreature);
  const submitMove = useGameStore((state) => state.submitMove);

  const {
    containerRef,
    loadState,
    updateState,
    highlightTiles,
    clearHighlights,
    selectCreature: selectCreatureInCanvas,
    animateMovement,
    showDamageNumber,
    centerOn,
  } = useGameCanvas({
    onTileClick: handleTileClick,
    onTileHover: handleTileHover,
  });

  // Load initial state
  useEffect(() => {
    if (gameState) {
      loadState(gameState);
    }
  }, [gameState?.sessionId]);

  // Update on state changes
  useEffect(() => {
    if (gameState) {
      updateState(gameState);
    }
  }, [gameState]);

  // Sync selection
  useEffect(() => {
    selectCreatureInCanvas(selectedCreature);
  }, [selectedCreature]);

  function handleTileClick(position: GridPosition) {
    if (selectedCreature) {
      // Try to move selected creature
      submitMove(selectedCreature, [position]);
    }
  }

  function handleTileHover(position: GridPosition | null) {
    // Could show movement preview here
  }

  return (
    <div
      id="game-container"
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    />
  );
};
```

---

# END OF DOCUMENT 21
