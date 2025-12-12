/**
 * TokenManager
 * Handles creature token rendering and animation
 */

import * as PIXI from 'pixi.js';
import type { Creature, GridPosition, TokenVisualState, CreatureSize } from './types';
import { SIZE_TO_CELLS, TOKEN_TYPE_COLORS } from './types';

interface TokenData {
  creature: Creature;
  container: PIXI.Container;
  sprite: PIXI.Graphics | PIXI.Sprite;
  healthBar: PIXI.Graphics;
  nameText: PIXI.Text;
  conditionIcons: PIXI.Container;
  state: TokenVisualState;
  animationTarget?: GridPosition;
}

export class TokenManager {
  private container: PIXI.Container;
  private tileSize: number;
  private tokens: Map<string, TokenData> = new Map();

  // Selection state
  private selectedTokenId: string | null = null;
  private targetedTokenIds: Set<string> = new Set();

  // Animation settings
  private moveAnimationSpeed: number = 0.15;

  constructor(container: PIXI.Container, tileSize: number) {
    this.container = container;
    this.tileSize = tileSize;
  }

  /**
   * Get token size in pixels based on creature size
   */
  private getTokenSize(size: CreatureSize): number {
    const cells = SIZE_TO_CELLS[size];
    return this.tileSize * cells * 0.85; // 85% of cell size for padding
  }

  /**
   * Create the token visual elements
   */
  private createTokenVisuals(creature: Creature): TokenData {
    const tokenContainer = new PIXI.Container();
    const size = this.getTokenSize(creature.size);
    const cells = SIZE_TO_CELLS[creature.size];

    // Position container at grid position
    tokenContainer.x = creature.position.x * this.tileSize + (this.tileSize * cells) / 2;
    tokenContainer.y = creature.position.y * this.tileSize + (this.tileSize * cells) / 2;

    // Create main sprite (circle for now, sprite URL later)
    let sprite: PIXI.Graphics | PIXI.Sprite;

    if (creature.spriteUrl) {
      // TODO: Load sprite from URL
      sprite = this.createPlaceholderToken(creature, size);
    } else {
      sprite = this.createPlaceholderToken(creature, size);
    }

    tokenContainer.addChild(sprite);

    // Create health bar
    const healthBar = this.createHealthBar(creature, size);
    healthBar.y = -size / 2 - 10;
    tokenContainer.addChild(healthBar);

    // Create name text
    const nameText = new PIXI.Text({
      text: creature.name,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
        align: 'center',
      },
    });
    nameText.anchor.set(0.5, 1);
    nameText.y = -size / 2 - 15;
    tokenContainer.addChild(nameText);

    // Create condition icons container
    const conditionIcons = new PIXI.Container();
    conditionIcons.y = size / 2 + 5;
    tokenContainer.addChild(conditionIcons);

    // Update condition icons
    this.updateConditionIcons(conditionIcons, creature.conditions, size);

    // Add to main container
    this.container.addChild(tokenContainer);

    return {
      creature,
      container: tokenContainer,
      sprite,
      healthBar,
      nameText,
      conditionIcons,
      state: {
        isSelected: false,
        isTargeted: false,
        isMoving: false,
        animationProgress: 0,
      },
    };
  }

  /**
   * Create a placeholder circular token
   */
  private createPlaceholderToken(creature: Creature, size: number): PIXI.Graphics {
    const graphics = new PIXI.Graphics();
    const color = creature.tokenColor
      ? parseInt(creature.tokenColor.replace('#', '0x'))
      : TOKEN_TYPE_COLORS[creature.type];

    // Outer ring
    graphics.lineStyle(3, 0x000000, 0.5);
    graphics.beginFill(color, 0.9);
    graphics.drawCircle(0, 0, size / 2);
    graphics.endFill();

    // Inner highlight
    graphics.beginFill(0xffffff, 0.2);
    graphics.drawCircle(-size / 6, -size / 6, size / 4);
    graphics.endFill();

    // First letter of name
    const initial = new PIXI.Text({
      text: creature.name.charAt(0).toUpperCase(),
      style: {
        fontFamily: 'Arial',
        fontSize: size * 0.5,
        fontWeight: 'bold',
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
      },
    });
    initial.anchor.set(0.5);
    graphics.addChild(initial);

    return graphics;
  }

  /**
   * Create health bar graphics
   */
  private createHealthBar(creature: Creature, tokenSize: number): PIXI.Graphics {
    const graphics = new PIXI.Graphics();
    const width = tokenSize * 0.8;
    const height = 6;
    const hpPercent = creature.currentHitPoints / creature.maxHitPoints;

    // Background
    graphics.beginFill(0x000000, 0.7);
    graphics.drawRoundedRect(-width / 2, 0, width, height, 2);
    graphics.endFill();

    // Health fill
    const healthColor = hpPercent > 0.5 ? 0x22c55e : hpPercent > 0.25 ? 0xf59e0b : 0xef4444;
    graphics.beginFill(healthColor);
    graphics.drawRoundedRect(-width / 2 + 1, 1, (width - 2) * Math.max(0, hpPercent), height - 2, 1);
    graphics.endFill();

    // Temp HP indicator (blue bar above)
    if (creature.tempHitPoints > 0) {
      const tempPercent = Math.min(1, creature.tempHitPoints / creature.maxHitPoints);
      graphics.beginFill(0x3b82f6, 0.8);
      graphics.drawRoundedRect(-width / 2, -3, width * tempPercent, 2, 1);
      graphics.endFill();
    }

    return graphics;
  }

  /**
   * Update condition icons
   */
  private updateConditionIcons(
    container: PIXI.Container,
    conditions: string[],
    _tokenSize: number
  ): void {
    container.removeChildren();

    const iconSize = 14;
    const spacing = 16;
    const startX = -((conditions.length - 1) * spacing) / 2;

    conditions.forEach((condition, index) => {
      const icon = this.createConditionIcon(condition, iconSize);
      icon.x = startX + index * spacing;
      container.addChild(icon);
    });
  }

  /**
   * Create a condition icon
   */
  private createConditionIcon(condition: string, size: number): PIXI.Graphics {
    const graphics = new PIXI.Graphics();

    // Condition colors
    const conditionColors: Record<string, number> = {
      BLINDED: 0x4a4a4a,
      CHARMED: 0xff69b4,
      DEAFENED: 0x808080,
      EXHAUSTION: 0x8b4513,
      FRIGHTENED: 0x9400d3,
      GRAPPLED: 0xffa500,
      INCAPACITATED: 0x696969,
      INVISIBLE: 0x87ceeb,
      PARALYZED: 0xffff00,
      PETRIFIED: 0xa0a0a0,
      POISONED: 0x32cd32,
      PRONE: 0xcd853f,
      RESTRAINED: 0x8b0000,
      STUNNED: 0xffd700,
      UNCONSCIOUS: 0x2f2f2f,
    };

    const color = conditionColors[condition] || 0x888888;

    graphics.beginFill(color);
    graphics.lineStyle(1, 0x000000, 0.8);
    graphics.drawCircle(0, 0, size / 2);
    graphics.endFill();

    // Condition initial
    const initial = new PIXI.Text({
      text: condition.charAt(0),
      style: {
        fontFamily: 'Arial',
        fontSize: 9,
        fontWeight: 'bold',
        fill: 0xffffff,
      },
    });
    initial.anchor.set(0.5);
    graphics.addChild(initial);

    return graphics;
  }

  /**
   * Add a token to the board
   */
  public addToken(creature: Creature): void {
    // Remove existing token if present
    this.removeToken(creature.id);

    // Create new token
    const tokenData = this.createTokenVisuals(creature);
    this.tokens.set(creature.id, tokenData);

    // Apply visibility
    if (!creature.isVisible) {
      tokenData.container.alpha = 0.3;
    }
  }

  /**
   * Remove a token from the board
   */
  public removeToken(creatureId: string): void {
    const tokenData = this.tokens.get(creatureId);
    if (tokenData) {
      this.container.removeChild(tokenData.container);
      tokenData.container.destroy({ children: true });
      this.tokens.delete(creatureId);
    }
  }

  /**
   * Update a token's data
   */
  public updateToken(creature: Creature): void {
    const tokenData = this.tokens.get(creature.id);
    if (!tokenData) {
      // Token doesn't exist, add it
      this.addToken(creature);
      return;
    }

    // Check if position changed
    if (
      creature.position.x !== tokenData.creature.position.x ||
      creature.position.y !== tokenData.creature.position.y
    ) {
      // Start movement animation
      tokenData.animationTarget = creature.position;
      tokenData.state.isMoving = true;
    }

    // Update health bar
    if (
      creature.currentHitPoints !== tokenData.creature.currentHitPoints ||
      creature.maxHitPoints !== tokenData.creature.maxHitPoints ||
      creature.tempHitPoints !== tokenData.creature.tempHitPoints
    ) {
      const size = this.getTokenSize(creature.size);
      tokenData.container.removeChild(tokenData.healthBar);
      tokenData.healthBar.destroy();
      tokenData.healthBar = this.createHealthBar(creature, size);
      tokenData.healthBar.y = -size / 2 - 10;
      tokenData.container.addChild(tokenData.healthBar);
    }

    // Update conditions
    if (creature.conditions.join(',') !== tokenData.creature.conditions.join(',')) {
      const size = this.getTokenSize(creature.size);
      this.updateConditionIcons(tokenData.conditionIcons, creature.conditions, size);
    }

    // Update visibility
    tokenData.container.alpha = creature.isVisible ? 1 : 0.3;

    // Store updated creature data
    tokenData.creature = creature;
  }

  /**
   * Clear all tokens
   */
  public clear(): void {
    this.tokens.forEach((tokenData) => {
      this.container.removeChild(tokenData.container);
      tokenData.container.destroy({ children: true });
    });
    this.tokens.clear();
    this.selectedTokenId = null;
    this.targetedTokenIds.clear();
  }

  /**
   * Select a token
   */
  public selectToken(creatureId: string | null): void {
    // Deselect previous
    if (this.selectedTokenId) {
      const prev = this.tokens.get(this.selectedTokenId);
      if (prev) {
        prev.state.isSelected = false;
        this.updateTokenAppearance(prev);
      }
    }

    this.selectedTokenId = creatureId;

    // Select new
    if (creatureId) {
      const token = this.tokens.get(creatureId);
      if (token) {
        token.state.isSelected = true;
        this.updateTokenAppearance(token);
      }
    }
  }

  /**
   * Set targeted tokens
   */
  public setTargetedTokens(creatureIds: string[]): void {
    // Clear previous targets
    this.targetedTokenIds.forEach((id) => {
      const token = this.tokens.get(id);
      if (token) {
        token.state.isTargeted = false;
        this.updateTokenAppearance(token);
      }
    });

    this.targetedTokenIds = new Set(creatureIds);

    // Set new targets
    creatureIds.forEach((id) => {
      const token = this.tokens.get(id);
      if (token) {
        token.state.isTargeted = true;
        this.updateTokenAppearance(token);
      }
    });
  }

  /**
   * Update token appearance based on state
   */
  private updateTokenAppearance(tokenData: TokenData): void {
    // Selection ring
    if (tokenData.state.isSelected) {
      // Add selection highlight
      const size = this.getTokenSize(tokenData.creature.size);
      const ring = new PIXI.Graphics();
      ring.lineStyle(3, 0x22c55e, 1);
      ring.drawCircle(0, 0, size / 2 + 4);
      ring.name = 'selectionRing';

      // Remove existing ring
      const existingRing = tokenData.container.getChildByName('selectionRing');
      if (existingRing) {
        tokenData.container.removeChild(existingRing);
      }

      tokenData.container.addChildAt(ring, 0);
    } else {
      const existingRing = tokenData.container.getChildByName('selectionRing');
      if (existingRing) {
        tokenData.container.removeChild(existingRing);
      }
    }

    // Target indicator
    if (tokenData.state.isTargeted) {
      const size = this.getTokenSize(tokenData.creature.size);
      const target = new PIXI.Graphics();
      target.lineStyle(2, 0xef4444, 1);

      // Draw crosshair
      target.moveTo(-size / 2 - 8, 0);
      target.lineTo(-size / 2 - 2, 0);
      target.moveTo(size / 2 + 2, 0);
      target.lineTo(size / 2 + 8, 0);
      target.moveTo(0, -size / 2 - 8);
      target.lineTo(0, -size / 2 - 2);
      target.moveTo(0, size / 2 + 2);
      target.lineTo(0, size / 2 + 8);

      target.name = 'targetIndicator';

      const existingTarget = tokenData.container.getChildByName('targetIndicator');
      if (existingTarget) {
        tokenData.container.removeChild(existingTarget);
      }

      tokenData.container.addChild(target);
    } else {
      const existingTarget = tokenData.container.getChildByName('targetIndicator');
      if (existingTarget) {
        tokenData.container.removeChild(existingTarget);
      }
    }
  }

  /**
   * Get token at screen position
   */
  public getTokenAtPosition(worldX: number, worldY: number): string | null {
    for (const [id, tokenData] of this.tokens) {
      const size = this.getTokenSize(tokenData.creature.size);
      const dx = worldX - tokenData.container.x;
      const dy = worldY - tokenData.container.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= size / 2) {
        return id;
      }
    }
    return null;
  }

  /**
   * Update animations (called each frame)
   */
  public update(_delta: number): void {
    for (const tokenData of this.tokens.values()) {
      if (tokenData.state.isMoving && tokenData.animationTarget) {
        const cells = SIZE_TO_CELLS[tokenData.creature.size];
        const targetX = tokenData.animationTarget.x * this.tileSize + (this.tileSize * cells) / 2;
        const targetY = tokenData.animationTarget.y * this.tileSize + (this.tileSize * cells) / 2;

        // Lerp towards target
        tokenData.container.x += (targetX - tokenData.container.x) * this.moveAnimationSpeed;
        tokenData.container.y += (targetY - tokenData.container.y) * this.moveAnimationSpeed;

        // Check if arrived
        const dx = Math.abs(targetX - tokenData.container.x);
        const dy = Math.abs(targetY - tokenData.container.y);

        if (dx < 1 && dy < 1) {
          tokenData.container.x = targetX;
          tokenData.container.y = targetY;
          tokenData.state.isMoving = false;
          tokenData.animationTarget = undefined;
        }
      }
    }
  }

  /**
   * Get selected token ID
   */
  public getSelectedTokenId(): string | null {
    return this.selectedTokenId;
  }

  /**
   * Get all token IDs
   */
  public getAllTokenIds(): string[] {
    return Array.from(this.tokens.keys());
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.clear();
    this.container.destroy({ children: true });
  }
}
