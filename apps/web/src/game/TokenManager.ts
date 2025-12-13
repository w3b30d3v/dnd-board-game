/**
 * TokenManager
 * Handles creature token rendering and animation
 * Enhanced with portrait images, particles, and rich visual effects
 */

import * as PIXI from 'pixi.js';
import type { Creature, GridPosition, TokenVisualState, CreatureSize } from './types';
import { SIZE_TO_CELLS, TOKEN_TYPE_COLORS } from './types';

// Floating damage/healing number
interface FloatingNumber {
  container: PIXI.Container;
  startY: number;
  progress: number;
  duration: number;
}

// Particle for ambient effects
interface Particle {
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
}

interface TokenData {
  creature: Creature;
  container: PIXI.Container;
  sprite: PIXI.Graphics | PIXI.Sprite;
  portraitSprite?: PIXI.Sprite;
  borderRing: PIXI.Graphics;
  glowRing: PIXI.Graphics;
  healthBar: PIXI.Graphics;
  healthBarBg: PIXI.Graphics;
  nameText: PIXI.Text;
  conditionIcons: PIXI.Container;
  conditionParticles: PIXI.Container;
  state: TokenVisualState;
  animationTarget?: GridPosition;
  // Animation state
  idlePhase: number;
  baseY: number;
  selectionPulsePhase: number;
  borderRotation: number;
  glowIntensity: number;
  flashTimer: number;
  flashColor: number | null;
  spawnProgress: number;
  deathProgress: number;
  isSpawning: boolean;
  isDying: boolean;
  // Condition particles
  conditionParticleList: Particle[];
}

export class TokenManager {
  private container: PIXI.Container;
  private floatingNumbersContainer: PIXI.Container;
  private tileSize: number;
  private tokens: Map<string, TokenData> = new Map();
  private floatingNumbers: FloatingNumber[] = [];

  // Selection state
  private selectedTokenId: string | null = null;
  private targetedTokenIds: Set<string> = new Set();

  // Animation settings
  private moveAnimationSpeed: number = 0.15;
  private idleFloatAmplitude: number = 4; // pixels
  private idleFloatSpeed: number = 0.03; // radians per frame
  private selectionPulseSpeed: number = 0.05; // radians per frame
  private borderRotationSpeed: number = 0.02; // radians per frame for animated border
  private flashDuration: number = 18; // frames (~0.3s at 60fps)
  private spawnDuration: number = 30; // frames (~0.5s at 60fps)
  private deathDuration: number = 30; // frames (~0.5s at 60fps)
  private floatingNumberDuration: number = 60; // frames (~1s at 60fps)

  // Visual settings
  private useEnhancedVisuals: boolean = true;
  private gradientColors = {
    player: [0x22c55e, 0x16a34a], // Green gradient
    enemy: [0xef4444, 0xb91c1c],  // Red gradient
    npc: [0x3b82f6, 0x1d4ed8],    // Blue gradient
  };

  constructor(container: PIXI.Container, tileSize: number) {
    this.container = container;
    this.tileSize = tileSize;

    // Create floating numbers layer (above tokens)
    this.floatingNumbersContainer = new PIXI.Container();
    this.container.addChild(this.floatingNumbersContainer);
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

    // Create glow ring (behind everything)
    const glowRing = this.createGlowRing(creature, size);
    tokenContainer.addChild(glowRing);

    // Create animated border ring
    const borderRing = this.createAnimatedBorder(creature, size);
    tokenContainer.addChild(borderRing);

    // Create main sprite (circle with optional portrait)
    const sprite: PIXI.Graphics | PIXI.Sprite = this.createEnhancedPlaceholderToken(creature, size);
    let portraitSprite: PIXI.Sprite | undefined;
    tokenContainer.addChild(sprite);

    // Load portrait image if available
    if (creature.spriteUrl) {
      this.loadPortraitImage(creature.spriteUrl, size, tokenContainer, creature);
    }

    // Create health bar background
    const healthBarBg = new PIXI.Graphics();
    healthBarBg.beginFill(0x000000, 0.8);
    healthBarBg.drawRoundedRect(-size * 0.4, -size / 2 - 14, size * 0.8, 8, 4);
    healthBarBg.endFill();
    healthBarBg.lineStyle(1, 0x444444, 1);
    healthBarBg.drawRoundedRect(-size * 0.4, -size / 2 - 14, size * 0.8, 8, 4);
    tokenContainer.addChild(healthBarBg);

    // Create health bar
    const healthBar = this.createEnhancedHealthBar(creature, size);
    tokenContainer.addChild(healthBar);

    // Create name text with better styling
    const nameText = new PIXI.Text({
      text: creature.name,
      style: {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: 11,
        fontWeight: 'bold',
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 3 },
        align: 'center',
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 4,
          blur: 2,
          color: 0x000000,
          distance: 2,
        },
      },
    });
    nameText.anchor.set(0.5, 1);
    nameText.y = -size / 2 - 18;
    tokenContainer.addChild(nameText);

    // Create condition icons container
    const conditionIcons = new PIXI.Container();
    conditionIcons.y = size / 2 + 8;
    tokenContainer.addChild(conditionIcons);

    // Create condition particles container
    const conditionParticles = new PIXI.Container();
    tokenContainer.addChild(conditionParticles);

    // Update condition icons
    this.updateConditionIcons(conditionIcons, creature.conditions, size);

    // Add to main container (before floating numbers)
    this.container.addChildAt(tokenContainer, this.container.children.length - 1);

    // Store base Y position for idle animation
    const baseY = tokenContainer.y;

    return {
      creature,
      container: tokenContainer,
      sprite,
      portraitSprite,
      borderRing,
      glowRing,
      healthBar,
      healthBarBg,
      nameText,
      conditionIcons,
      conditionParticles,
      state: {
        isSelected: false,
        isTargeted: false,
        isMoving: false,
        animationProgress: 0,
      },
      // Animation state
      idlePhase: Math.random() * Math.PI * 2, // Random start phase
      baseY,
      selectionPulsePhase: 0,
      borderRotation: 0,
      glowIntensity: 0,
      flashTimer: 0,
      flashColor: null,
      spawnProgress: 0,
      deathProgress: 0,
      isSpawning: true, // Start with spawn animation
      isDying: false,
      conditionParticleList: [],
    };
  }

  /**
   * Create glow ring behind token
   */
  private createGlowRing(creature: Creature, size: number): PIXI.Graphics {
    const graphics = new PIXI.Graphics();
    const color = this.getCreatureColor(creature);

    // Soft glow effect (multiple rings with decreasing alpha)
    for (let i = 3; i >= 0; i--) {
      const ringSize = size / 2 + 6 + i * 4;
      const alpha = 0.1 - i * 0.02;
      graphics.beginFill(color, alpha);
      graphics.drawCircle(0, 0, ringSize);
      graphics.endFill();
    }

    graphics.alpha = 0; // Hidden by default, shown on selection
    return graphics;
  }

  /**
   * Create animated border ring
   */
  private createAnimatedBorder(creature: Creature, size: number): PIXI.Graphics {
    const graphics = new PIXI.Graphics();
    const color = this.getCreatureColor(creature);

    // Main border ring
    graphics.lineStyle(3, color, 0.9);
    graphics.drawCircle(0, 0, size / 2 + 2);

    // Decorative dashes (animated)
    const dashCount = 12;
    for (let i = 0; i < dashCount; i++) {
      const angle = (i / dashCount) * Math.PI * 2;
      const innerRadius = size / 2 + 4;
      const outerRadius = size / 2 + 8;

      if (i % 2 === 0) {
        graphics.lineStyle(2, 0xf59e0b, 0.8); // Gold accent
      } else {
        graphics.lineStyle(2, color, 0.5);
      }

      graphics.moveTo(
        Math.cos(angle) * innerRadius,
        Math.sin(angle) * innerRadius
      );
      graphics.lineTo(
        Math.cos(angle) * outerRadius,
        Math.sin(angle) * outerRadius
      );
    }

    return graphics;
  }

  /**
   * Load portrait image for token
   */
  private async loadPortraitImage(
    url: string,
    size: number,
    container: PIXI.Container,
    creature: Creature
  ): Promise<void> {
    try {
      const texture = await PIXI.Assets.load(url);
      const portrait = new PIXI.Sprite(texture);

      // Set size to fit within circle
      const portraitSize = size * 0.85;
      portrait.width = portraitSize;
      portrait.height = portraitSize;
      portrait.anchor.set(0.5);

      // Create circular mask
      const mask = new PIXI.Graphics();
      mask.beginFill(0xffffff);
      mask.drawCircle(0, 0, portraitSize / 2);
      mask.endFill();

      portrait.mask = mask;
      container.addChild(mask);
      container.addChild(portrait);

      // Store reference
      const tokenData = this.tokens.get(creature.id);
      if (tokenData) {
        tokenData.portraitSprite = portrait;
        // Hide the placeholder sprite
        tokenData.sprite.alpha = 0;
      }
    } catch (error) {
      console.warn('Failed to load portrait:', url, error);
      // Keep placeholder visible
    }
  }

  /**
   * Get creature color based on type
   */
  private getCreatureColor(creature: Creature): number {
    if (creature.tokenColor) {
      return parseInt(creature.tokenColor.replace('#', '0x'));
    }
    return TOKEN_TYPE_COLORS[creature.type];
  }

  /**
   * Create an enhanced placeholder circular token with gradient and rich styling
   */
  private createEnhancedPlaceholderToken(creature: Creature, size: number): PIXI.Graphics {
    const graphics = new PIXI.Graphics();

    // Get gradient colors based on creature type
    const gradientKey = creature.type === 'character' ? 'player' :
                       creature.type === 'monster' ? 'enemy' : 'npc';
    const [lightColor, darkColor] = this.gradientColors[gradientKey];

    // Base circle with dark color
    graphics.beginFill(darkColor, 1);
    graphics.drawCircle(0, 0, size / 2);
    graphics.endFill();

    // Lighter inner circle for gradient effect
    graphics.beginFill(lightColor, 0.7);
    graphics.drawCircle(0, -size * 0.05, size / 2 - 4);
    graphics.endFill();

    // Highlight on top-left for 3D effect
    graphics.beginFill(0xffffff, 0.25);
    graphics.drawEllipse(-size / 5, -size / 5, size / 4, size / 5);
    graphics.endFill();

    // Small specular highlight
    graphics.beginFill(0xffffff, 0.5);
    graphics.drawCircle(-size / 4, -size / 4, size / 10);
    graphics.endFill();

    // Inner shadow at bottom
    graphics.beginFill(0x000000, 0.2);
    graphics.drawEllipse(0, size / 5, size / 3, size / 8);
    graphics.endFill();

    // First letter of name with enhanced styling
    const initial = new PIXI.Text({
      text: creature.name.charAt(0).toUpperCase(),
      style: {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: size * 0.45,
        fontWeight: 'bold',
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 3 },
        dropShadow: {
          alpha: 0.6,
          angle: Math.PI / 4,
          blur: 3,
          color: 0x000000,
          distance: 2,
        },
      },
    });
    initial.anchor.set(0.5);
    graphics.addChild(initial);

    return graphics;
  }

  /**
   * Create enhanced health bar with gradient and animations
   */
  private createEnhancedHealthBar(creature: Creature, tokenSize: number): PIXI.Graphics {
    const graphics = new PIXI.Graphics();
    const width = tokenSize * 0.8 - 4;
    const height = 6;
    const hpPercent = creature.currentHitPoints / creature.maxHitPoints;
    const x = -tokenSize * 0.4 + 2;
    const y = -tokenSize / 2 - 12;

    // Health fill with gradient effect
    if (hpPercent > 0) {
      const healthColor = hpPercent > 0.5 ? 0x22c55e :
                         hpPercent > 0.25 ? 0xf59e0b : 0xef4444;
      const darkHealthColor = hpPercent > 0.5 ? 0x16a34a :
                             hpPercent > 0.25 ? 0xd97706 : 0xb91c1c;

      // Dark base
      graphics.beginFill(darkHealthColor);
      graphics.drawRoundedRect(x, y, width * Math.max(0, hpPercent), height, 2);
      graphics.endFill();

      // Lighter top for gradient effect
      graphics.beginFill(healthColor, 0.9);
      graphics.drawRoundedRect(x, y, width * Math.max(0, hpPercent), height / 2, 2);
      graphics.endFill();

      // Shine effect
      graphics.beginFill(0xffffff, 0.3);
      graphics.drawRoundedRect(x + 2, y + 1, Math.max(0, width * hpPercent - 4), 2, 1);
      graphics.endFill();
    }

    // Temp HP indicator (cyan bar)
    if (creature.tempHitPoints > 0) {
      const tempPercent = Math.min(1, creature.tempHitPoints / creature.maxHitPoints);
      graphics.beginFill(0x06b6d4, 0.9);
      graphics.drawRoundedRect(x, y - 4, width * tempPercent, 3, 1);
      graphics.endFill();
      // Shine
      graphics.beginFill(0xffffff, 0.4);
      graphics.drawRoundedRect(x + 1, y - 4, Math.max(0, width * tempPercent - 2), 1, 1);
      graphics.endFill();
    }

    return graphics;
  }

  /**
   * Create a placeholder circular token (legacy - kept for compatibility)
   */
  private createPlaceholderToken(creature: Creature, size: number): PIXI.Graphics {
    return this.createEnhancedPlaceholderToken(creature, size);
  }

  /**
   * Create health bar graphics (legacy - uses enhanced version)
   */
  private createHealthBar(creature: Creature, tokenSize: number): PIXI.Graphics {
    return this.createEnhancedHealthBar(creature, tokenSize);
  }

  /**
   * Show floating damage number
   */
  public showFloatingDamage(creatureId: string, amount: number, isCritical: boolean = false): void {
    const tokenData = this.tokens.get(creatureId);
    if (!tokenData) return;

    const container = new PIXI.Container();
    container.x = tokenData.container.x;
    container.y = tokenData.container.y - this.getTokenSize(tokenData.creature.size) / 2 - 20;

    // Create damage text
    const text = new PIXI.Text({
      text: `-${amount}`,
      style: {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: isCritical ? 28 : 20,
        fontWeight: 'bold',
        fill: isCritical ? 0xffd700 : 0xef4444, // Gold for crit, red for normal
        stroke: { color: 0x000000, width: 4 },
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 2,
          blur: 4,
          color: isCritical ? 0xff6600 : 0x8b0000,
          distance: 3,
        },
      },
    });
    text.anchor.set(0.5);

    // Add "CRIT!" text for critical hits
    if (isCritical) {
      const critText = new PIXI.Text({
        text: 'CRIT!',
        style: {
          fontFamily: 'Cinzel, Georgia, serif',
          fontSize: 14,
          fontWeight: 'bold',
          fill: 0xffd700,
          stroke: { color: 0x000000, width: 3 },
        },
      });
      critText.anchor.set(0.5);
      critText.y = -20;
      container.addChild(critText);
    }

    container.addChild(text);
    this.floatingNumbersContainer.addChild(container);

    this.floatingNumbers.push({
      container,
      startY: container.y,
      progress: 0,
      duration: isCritical ? this.floatingNumberDuration * 1.5 : this.floatingNumberDuration,
    });
  }

  /**
   * Show floating healing number
   */
  public showFloatingHealing(creatureId: string, amount: number): void {
    const tokenData = this.tokens.get(creatureId);
    if (!tokenData) return;

    const container = new PIXI.Container();
    container.x = tokenData.container.x;
    container.y = tokenData.container.y - this.getTokenSize(tokenData.creature.size) / 2 - 20;

    // Create healing text
    const text = new PIXI.Text({
      text: `+${amount}`,
      style: {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 20,
        fontWeight: 'bold',
        fill: 0x22c55e, // Green
        stroke: { color: 0x000000, width: 4 },
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 2,
          blur: 4,
          color: 0x166534,
          distance: 3,
        },
      },
    });
    text.anchor.set(0.5);
    container.addChild(text);
    this.floatingNumbersContainer.addChild(container);

    this.floatingNumbers.push({
      container,
      startY: container.y,
      progress: 0,
      duration: this.floatingNumberDuration,
    });
  }

  /**
   * Spawn condition particles for visual effects
   */
  private spawnConditionParticles(tokenData: TokenData): void {
    const conditions = tokenData.creature.conditions;
    if (conditions.length === 0) return;

    const size = this.getTokenSize(tokenData.creature.size);

    // Particle colors for different conditions
    const conditionParticleColors: Record<string, number> = {
      POISONED: 0x32cd32,
      BURNING: 0xff4500,
      FROZEN: 0x87ceeb,
      BLESSED: 0xffd700,
      CURSED: 0x800080,
      FRIGHTENED: 0x9400d3,
      CONCENTRATING: 0x8b5cf6,
    };

    for (const condition of conditions) {
      const color = conditionParticleColors[condition] || 0xffffff;

      // Spawn a few particles per condition
      if (Math.random() < 0.1) { // Spawn rate
        const particle: Particle = {
          graphics: new PIXI.Graphics(),
          x: (Math.random() - 0.5) * size,
          y: (Math.random() - 0.5) * size,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 1 - 0.5,
          life: 1,
          maxLife: 60 + Math.random() * 30,
          size: 2 + Math.random() * 2,
          color,
          alpha: 0.8,
        };

        particle.graphics.beginFill(color, particle.alpha);
        particle.graphics.drawCircle(0, 0, particle.size);
        particle.graphics.endFill();
        particle.graphics.x = particle.x;
        particle.graphics.y = particle.y;

        tokenData.conditionParticles.addChild(particle.graphics);
        tokenData.conditionParticleList.push(particle);
      }
    }
  }

  /**
   * Update condition particles
   */
  private updateConditionParticles(tokenData: TokenData): void {
    const particlesToRemove: Particle[] = [];

    for (const particle of tokenData.conditionParticleList) {
      particle.life--;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy *= 0.98; // Slow down
      particle.alpha = particle.life / particle.maxLife;

      particle.graphics.x = particle.x;
      particle.graphics.y = particle.y;
      particle.graphics.alpha = particle.alpha;

      if (particle.life <= 0) {
        particlesToRemove.push(particle);
      }
    }

    // Remove dead particles
    for (const particle of particlesToRemove) {
      tokenData.conditionParticles.removeChild(particle.graphics);
      particle.graphics.destroy();
      const index = tokenData.conditionParticleList.indexOf(particle);
      if (index > -1) {
        tokenData.conditionParticleList.splice(index, 1);
      }
    }
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
    // Update floating numbers
    this.updateFloatingNumbers();

    for (const tokenData of this.tokens.values()) {
      // Skip animation updates for dying tokens that are complete
      if (tokenData.isDying && tokenData.deathProgress >= 1) {
        continue;
      }

      // Spawn animation
      if (tokenData.isSpawning) {
        tokenData.spawnProgress += 1 / this.spawnDuration;
        if (tokenData.spawnProgress >= 1) {
          tokenData.spawnProgress = 1;
          tokenData.isSpawning = false;
          tokenData.container.scale.set(1);
          tokenData.container.alpha = tokenData.creature.isVisible ? 1 : 0.3;
        } else {
          // Bounce easing: overshoot then settle
          const t = tokenData.spawnProgress;
          const bounce = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
          const scale = bounce * 1.2;
          tokenData.container.scale.set(Math.min(scale, 1.2));
          tokenData.container.alpha = bounce * (tokenData.creature.isVisible ? 1 : 0.3);
        }
        continue; // Skip other animations during spawn
      }

      // Death animation
      if (tokenData.isDying) {
        tokenData.deathProgress += 1 / this.deathDuration;
        if (tokenData.deathProgress >= 1) {
          tokenData.deathProgress = 1;
          tokenData.container.alpha = 0;
          tokenData.container.scale.set(0);
        } else {
          const t = tokenData.deathProgress;
          tokenData.container.alpha = (1 - t) * (tokenData.creature.isVisible ? 1 : 0.3);
          tokenData.container.scale.set(1 - t * 0.5);
          tokenData.container.rotation = t * 0.5; // Slight rotation
        }
        continue; // Skip other animations during death
      }

      // Movement animation
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
          // Update baseY for idle animation
          tokenData.baseY = targetY;
        }
      }

      // Idle float animation (only when not moving)
      if (!tokenData.state.isMoving) {
        tokenData.idlePhase += this.idleFloatSpeed;
        const floatOffset = Math.sin(tokenData.idlePhase) * this.idleFloatAmplitude;
        tokenData.container.y = tokenData.baseY + floatOffset;
      }

      // Animated border rotation
      tokenData.borderRotation += this.borderRotationSpeed;
      tokenData.borderRing.rotation = tokenData.borderRotation;

      // Selection animations
      if (tokenData.state.isSelected) {
        tokenData.selectionPulsePhase += this.selectionPulseSpeed;
        const pulseScale = 1 + Math.sin(tokenData.selectionPulsePhase) * 0.05;
        tokenData.sprite.scale.set(pulseScale);

        // Update glow ring visibility and intensity
        tokenData.glowIntensity = Math.min(tokenData.glowIntensity + 0.1, 1);
        tokenData.glowRing.alpha = 0.6 + Math.sin(tokenData.selectionPulsePhase * 2) * 0.3;

        // Update selection ring glow
        const ring = tokenData.container.getChildByName('selectionRing') as PIXI.Graphics;
        if (ring) {
          const glowAlpha = 0.6 + Math.sin(tokenData.selectionPulsePhase) * 0.4;
          ring.alpha = glowAlpha;
        }
      } else {
        // Fade out glow when not selected
        tokenData.glowIntensity = Math.max(tokenData.glowIntensity - 0.1, 0);
        tokenData.glowRing.alpha = tokenData.glowIntensity * 0.5;

        // Reset scale when not selected
        tokenData.sprite.scale.set(1);
      }

      // Flash animation (damage/healing)
      if (tokenData.flashTimer > 0) {
        tokenData.flashTimer--;
        const flashIntensity = tokenData.flashTimer / this.flashDuration;

        if (tokenData.flashColor !== null) {
          // Apply tint
          tokenData.sprite.tint = this.blendColors(0xffffff, tokenData.flashColor, flashIntensity);
        }

        if (tokenData.flashTimer <= 0) {
          // Reset tint
          tokenData.sprite.tint = 0xffffff;
          tokenData.flashColor = null;
        }
      }

      // Update condition particles
      this.spawnConditionParticles(tokenData);
      this.updateConditionParticles(tokenData);
    }
  }

  /**
   * Update floating damage/healing numbers
   */
  private updateFloatingNumbers(): void {
    const numbersToRemove: FloatingNumber[] = [];

    for (const floatingNum of this.floatingNumbers) {
      floatingNum.progress++;
      const t = floatingNum.progress / floatingNum.duration;

      // Float upward with easing
      const floatDistance = 40; // pixels to float up
      const easeOut = 1 - Math.pow(1 - t, 3);
      floatingNum.container.y = floatingNum.startY - (floatDistance * easeOut);

      // Fade out in the last 30%
      if (t > 0.7) {
        floatingNum.container.alpha = 1 - ((t - 0.7) / 0.3);
      }

      // Scale animation (pop in, then shrink slightly)
      if (t < 0.1) {
        const scaleT = t / 0.1;
        floatingNum.container.scale.set(0.5 + scaleT * 0.7); // 0.5 -> 1.2
      } else if (t < 0.2) {
        const scaleT = (t - 0.1) / 0.1;
        floatingNum.container.scale.set(1.2 - scaleT * 0.2); // 1.2 -> 1.0
      }

      // Remove when complete
      if (floatingNum.progress >= floatingNum.duration) {
        numbersToRemove.push(floatingNum);
      }
    }

    // Clean up completed floating numbers
    for (const num of numbersToRemove) {
      this.floatingNumbersContainer.removeChild(num.container);
      num.container.destroy({ children: true });
      const index = this.floatingNumbers.indexOf(num);
      if (index > -1) {
        this.floatingNumbers.splice(index, 1);
      }
    }
  }

  /**
   * Blend two colors
   */
  private blendColors(color1: number, color2: number, ratio: number): number {
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
   * Play damage flash on a token
   */
  public playDamageFlash(creatureId: string): void {
    const tokenData = this.tokens.get(creatureId);
    if (tokenData && !tokenData.isDying) {
      tokenData.flashTimer = this.flashDuration;
      tokenData.flashColor = 0xff0000; // Red
    }
  }

  /**
   * Play healing flash on a token
   */
  public playHealingFlash(creatureId: string): void {
    const tokenData = this.tokens.get(creatureId);
    if (tokenData && !tokenData.isDying) {
      tokenData.flashTimer = Math.round(this.flashDuration * 1.3); // Slightly longer
      tokenData.flashColor = 0x00ff00; // Green
    }
  }

  /**
   * Play death animation on a token
   */
  public playDeathAnimation(creatureId: string): Promise<void> {
    return new Promise((resolve) => {
      const tokenData = this.tokens.get(creatureId);
      if (tokenData) {
        tokenData.isDying = true;
        tokenData.deathProgress = 0;

        // Resolve after animation completes
        setTimeout(() => {
          resolve();
        }, (this.deathDuration / 60) * 1000);
      } else {
        resolve();
      }
    });
  }

  /**
   * Play spawn animation (restarts if already on board)
   */
  public playSpawnAnimation(creatureId: string): void {
    const tokenData = this.tokens.get(creatureId);
    if (tokenData) {
      tokenData.isSpawning = true;
      tokenData.spawnProgress = 0;
      tokenData.container.scale.set(0);
      tokenData.container.alpha = 0;
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
