/**
 * GameApplication
 * Main game class that initializes PixiJS and manages all game systems
 */

import * as PIXI from 'pixi.js';
import { BoardRenderer } from './BoardRenderer';
import { TokenManager } from './TokenManager';
import { FogOfWarRenderer } from './FogOfWarRenderer';
import { AoEOverlayRenderer } from './AoEOverlayRenderer';
import { InputHandler } from './InputHandler';
import { CameraController } from './CameraController';
import type { GameConfig, GameState, GridPosition, Creature, AreaOfEffect } from './types';

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

  // Containers (layer order from bottom to top)
  private boardContainer: PIXI.Container;
  private tokenContainer: PIXI.Container;
  private effectsContainer: PIXI.Container;
  private fogContainer: PIXI.Container;
  private uiContainer: PIXI.Container;

  // State
  private currentState: GameState | null = null;
  private selectedCreatureId: string | null = null;
  private highlightedTiles: GridPosition[] = [];

  // Initialization promise
  private initPromise: Promise<void>;

  constructor(config: GameConfig) {
    this.config = config;

    // Create PIXI Application
    this.app = new PIXI.Application();

    // Create layer containers
    this.boardContainer = new PIXI.Container();
    this.tokenContainer = new PIXI.Container();
    this.effectsContainer = new PIXI.Container();
    this.fogContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();

    // Initialize asynchronously
    this.initPromise = this.init();

    // Placeholder renderers (will be initialized in init())
    this.boardRenderer = null as unknown as BoardRenderer;
    this.tokenManager = null as unknown as TokenManager;
    this.fogRenderer = null as unknown as FogOfWarRenderer;
    this.aoeRenderer = null as unknown as AoEOverlayRenderer;
    this.inputHandler = null as unknown as InputHandler;
    this.cameraController = null as unknown as CameraController;
  }

  /**
   * Initialize the game application
   */
  private async init(): Promise<void> {
    // Get container element
    const container = document.getElementById(this.config.containerId);
    if (!container) {
      throw new Error(`Container element not found: ${this.config.containerId}`);
    }

    // Initialize PIXI app
    await this.app.init({
      resizeTo: container,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Mount canvas to DOM
    container.appendChild(this.app.canvas);

    // Add layers in order (bottom to top)
    this.app.stage.addChild(this.boardContainer);
    this.app.stage.addChild(this.tokenContainer);
    this.app.stage.addChild(this.effectsContainer);
    this.app.stage.addChild(this.fogContainer);
    this.app.stage.addChild(this.uiContainer);

    // Initialize renderers
    this.boardRenderer = new BoardRenderer(
      this.boardContainer,
      this.config.tileSize,
      this.config.gridWidth,
      this.config.gridHeight
    );

    this.tokenManager = new TokenManager(
      this.tokenContainer,
      this.config.tileSize
    );

    this.fogRenderer = new FogOfWarRenderer(
      this.fogContainer,
      this.config.tileSize,
      this.config.gridWidth,
      this.config.gridHeight
    );

    this.aoeRenderer = new AoEOverlayRenderer(
      this.effectsContainer,
      this.config.tileSize
    );

    // Initialize camera controller
    this.cameraController = new CameraController(
      this.app.stage,
      this.app.screen.width,
      this.app.screen.height
    );

    // Set camera bounds
    this.cameraController.setBounds(
      this.config.gridWidth,
      this.config.gridHeight,
      this.config.tileSize
    );

    // Initialize input handler
    this.inputHandler = new InputHandler(
      this.app,
      this.boardRenderer,
      this.config.tileSize,
      {
        onTileClick: this.handleTileClick.bind(this),
        onTileHover: this.handleTileHover.bind(this),
        onPan: this.cameraController.pan.bind(this.cameraController),
        onZoom: this.cameraController.zoom.bind(this.cameraController),
      }
    );

    // Start game loop
    this.app.ticker.add(this.update.bind(this));

    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));

    // Center camera on board
    this.cameraController.centerOnTile(
      Math.floor(this.config.gridWidth / 2),
      Math.floor(this.config.gridHeight / 2),
      this.config.tileSize
    );
  }

  /**
   * Wait for initialization to complete
   */
  public async ready(): Promise<void> {
    await this.initPromise;
  }

  /**
   * Main game loop
   */
  private update(ticker: PIXI.Ticker): void {
    const delta = ticker.deltaTime;
    this.cameraController.update(delta);
    this.boardRenderer.update(delta);
    this.tokenManager.update(delta);
    this.aoeRenderer.update(delta);
  }

  /**
   * Handle tile click
   */
  private handleTileClick(position: GridPosition): void {
    // Check if clicking on a token
    const worldPos = this.boardRenderer.gridToWorld(position);
    const tokenId = this.tokenManager.getTokenAtPosition(worldPos.x, worldPos.y);

    if (tokenId) {
      // Token clicked
      this.selectCreature(tokenId);
      this.config.onTokenClick?.(tokenId);
    } else {
      // Empty tile clicked
      this.boardRenderer.setSelectedTile(position);
      this.config.onTileClick?.(position);
    }
  }

  /**
   * Handle tile hover
   */
  private handleTileHover(position: GridPosition | null): void {
    this.boardRenderer.setHoveredTile(position);
    this.config.onTileHover?.(position);
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

  // ==================== Public API ====================

  /**
   * Load a new game state
   */
  public loadState(state: GameState): void {
    this.currentState = state;

    // Update grid size if map dimensions changed
    if (
      state.map.width !== this.config.gridWidth ||
      state.map.height !== this.config.gridHeight
    ) {
      this.config.gridWidth = state.map.width;
      this.config.gridHeight = state.map.height;
      this.fogRenderer.setGridSize(state.map.width, state.map.height);
      this.cameraController.setBounds(
        state.map.width,
        state.map.height,
        this.config.tileSize
      );
    }

    // Render map
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
   * Add a creature to the board
   */
  public addCreature(creature: Creature): void {
    this.tokenManager.addToken(creature);
    this.currentState?.creatures.push(creature);
  }

  /**
   * Remove a creature from the board
   */
  public removeCreature(creatureId: string): void {
    this.tokenManager.removeToken(creatureId);
    if (this.currentState) {
      this.currentState.creatures = this.currentState.creatures.filter(
        (c) => c.id !== creatureId
      );
    }
  }

  /**
   * Update a creature
   */
  public updateCreature(creature: Creature): void {
    this.tokenManager.updateToken(creature);
    if (this.currentState) {
      const index = this.currentState.creatures.findIndex((c) => c.id === creature.id);
      if (index >= 0) {
        this.currentState.creatures[index] = creature;
      }
    }
  }

  /**
   * Move a token to a new grid position (with animation)
   */
  public moveToken(creatureId: string, x: number, y: number): void {
    if (!this.currentState) return;

    const creature = this.currentState.creatures.find((c) => c.id === creatureId);
    if (!creature) return;

    // Create updated creature with new position
    const updatedCreature: Creature = {
      ...creature,
      position: { x, y },
    };

    // Update token (triggers movement animation)
    this.tokenManager.updateToken(updatedCreature);

    // Update state
    const index = this.currentState.creatures.findIndex((c) => c.id === creatureId);
    if (index >= 0) {
      this.currentState.creatures[index] = updatedCreature;
    }
  }

  /**
   * Select a creature
   */
  public selectCreature(creatureId: string | null): void {
    this.selectedCreatureId = creatureId;
    this.tokenManager.selectToken(creatureId);
  }

  /**
   * Get selected creature
   */
  public getSelectedCreature(): Creature | null {
    if (!this.selectedCreatureId || !this.currentState) return null;
    return this.currentState.creatures.find((c) => c.id === this.selectedCreatureId) || null;
  }

  /**
   * Highlight tiles for movement/targeting
   */
  public highlightTiles(
    positions: GridPosition[],
    color?: number,
    alpha?: number
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
   * Show an area of effect
   */
  public showAoE(id: string, aoe: AreaOfEffect): void {
    this.aoeRenderer.showAoE(id, aoe);
  }

  /**
   * Hide an area of effect
   */
  public hideAoE(id: string): void {
    this.aoeRenderer.hideAoE(id);
  }

  /**
   * Preview an AoE
   */
  public previewAoE(aoe: AreaOfEffect): void {
    this.aoeRenderer.previewAoE(aoe);
  }

  /**
   * Clear AoE preview
   */
  public clearAoEPreview(): void {
    this.aoeRenderer.clearPreview();
  }

  /**
   * Get tiles affected by an AoE
   */
  public getAoETiles(aoe: AreaOfEffect): GridPosition[] {
    return this.aoeRenderer.getAffectedTiles(aoe);
  }

  /**
   * Set target indicators on tokens
   */
  public setTargets(creatureIds: string[]): void {
    this.tokenManager.setTargetedTokens(creatureIds);
  }

  /**
   * Clear targets
   */
  public clearTargets(): void {
    this.tokenManager.setTargetedTokens([]);
  }

  /**
   * Show floating damage number over a creature
   */
  public showDamage(creatureId: string, amount: number, isCritical: boolean = false): void {
    this.tokenManager.showFloatingDamage(creatureId, amount, isCritical);
    this.tokenManager.playDamageFlash(creatureId);
  }

  /**
   * Show floating healing number over a creature
   */
  public showHealing(creatureId: string, amount: number): void {
    this.tokenManager.showFloatingHealing(creatureId, amount);
    this.tokenManager.playHealingFlash(creatureId);
  }

  /**
   * Play death animation for a creature
   */
  public playDeathAnimation(creatureId: string): Promise<void> {
    return this.tokenManager.playDeathAnimation(creatureId);
  }

  /**
   * Play spawn animation for a creature
   */
  public playSpawnAnimation(creatureId: string): void {
    this.tokenManager.playSpawnAnimation(creatureId);
  }

  /**
   * Reveal fog of war area
   */
  public revealFog(centerX: number, centerY: number, radius: number): void {
    this.fogRenderer.revealArea(centerX, centerY, radius);
  }

  /**
   * Hide all fog of war
   */
  public hideFog(): void {
    this.fogRenderer.hideAll();
  }

  /**
   * Reveal all fog of war
   */
  public revealAllFog(): void {
    this.fogRenderer.revealAll();
  }

  /**
   * Center camera on a grid position
   */
  public centerOn(gridX: number, gridY: number): void {
    this.cameraController.centerOnTile(gridX, gridY, this.config.tileSize);
  }

  /**
   * Set zoom level
   */
  public setZoom(scale: number): void {
    this.cameraController.setZoom(scale);
  }

  /**
   * Get current zoom level
   */
  public getZoom(): number {
    return this.cameraController.getZoom();
  }

  /**
   * Reset camera position
   */
  public resetCamera(): void {
    this.cameraController.reset();
  }

  /**
   * Get current game state
   */
  public getState(): GameState | null {
    return this.currentState;
  }

  /**
   * Get PIXI application (for advanced use)
   */
  public getApp(): PIXI.Application {
    return this.app;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));

    this.inputHandler?.destroy();
    this.boardRenderer?.destroy();
    this.tokenManager?.destroy();
    this.fogRenderer?.destroy();
    this.aoeRenderer?.destroy();

    this.app.destroy(true, { children: true, texture: true });
  }
}
