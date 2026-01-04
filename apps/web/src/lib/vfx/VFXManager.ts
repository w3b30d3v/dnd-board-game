// VFXManager - Visual Effects Manager
// Manages particle effects, screen effects, and combat animations

export type VFXType =
  | 'fire'
  | 'ice'
  | 'lightning'
  | 'necrotic'
  | 'radiant'
  | 'poison'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'slash'
  | 'pierce'
  | 'bludgeon'
  | 'critical'
  | 'miss'
  | 'death'
  | 'levelup'
  | 'teleport';

export interface VFXOptions {
  x: number;
  y: number;
  duration?: number;
  scale?: number;
  color?: string;
  intensity?: number;
  onComplete?: () => void;
}

export interface DamageNumberOptions {
  x: number;
  y: number;
  amount: number;
  type: 'damage' | 'heal' | 'critical' | 'miss';
  damageType?: string;
}

export interface ScreenShakeOptions {
  intensity?: number;
  duration?: number;
  frequency?: number;
}

export interface ScreenFlashOptions {
  color?: string;
  duration?: number;
  opacity?: number;
}

// Effect color palettes
const EFFECT_COLORS: Record<VFXType, string[]> = {
  fire: ['#FF4500', '#FF6B35', '#FFA500', '#FFD700'],
  ice: ['#00BFFF', '#87CEEB', '#ADD8E6', '#FFFFFF'],
  lightning: ['#FFD700', '#FFFFFF', '#87CEFA', '#4169E1'],
  necrotic: ['#4B0082', '#8B008B', '#9932CC', '#2F4F4F'],
  radiant: ['#FFD700', '#FFFACD', '#FFFFFF', '#FFF8DC'],
  poison: ['#32CD32', '#00FF00', '#7CFC00', '#ADFF2F'],
  heal: ['#00FF7F', '#7CFC00', '#ADFF2F', '#98FB98'],
  buff: ['#4169E1', '#6495ED', '#87CEEB', '#B0E0E6'],
  debuff: ['#8B0000', '#B22222', '#CD5C5C', '#F08080'],
  slash: ['#C0C0C0', '#D3D3D3', '#DCDCDC', '#F5F5F5'],
  pierce: ['#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3'],
  bludgeon: ['#8B4513', '#A0522D', '#CD853F', '#DEB887'],
  critical: ['#FFD700', '#FF4500', '#FF6347', '#FFFFFF'],
  miss: ['#808080', '#A9A9A9', '#696969', '#778899'],
  death: ['#2F4F4F', '#000000', '#1C1C1C', '#363636'],
  levelup: ['#FFD700', '#FFA500', '#FF6347', '#FF69B4'],
  teleport: ['#9400D3', '#8A2BE2', '#9932CC', '#BA55D3'],
};

// Damage type to VFX mapping
const DAMAGE_TYPE_VFX: Record<string, VFXType> = {
  fire: 'fire',
  cold: 'ice',
  lightning: 'lightning',
  necrotic: 'necrotic',
  radiant: 'radiant',
  poison: 'poison',
  acid: 'poison',
  slashing: 'slash',
  piercing: 'pierce',
  bludgeoning: 'bludgeon',
  force: 'radiant',
  psychic: 'necrotic',
  thunder: 'lightning',
};

class VFXManagerClass {
  private container: HTMLElement | null = null;
  private activeEffects: Set<HTMLElement> = new Set();
  private screenShakeActive: boolean = false;

  /**
   * Initialize VFX manager with a container element
   */
  init(container: HTMLElement): void {
    this.container = container;
    console.log('[VFXManager] Initialized');
  }

  /**
   * Set the container element
   */
  setContainer(container: HTMLElement): void {
    this.container = container;
  }

  /**
   * Play a visual effect at a position
   */
  play(type: VFXType, options: VFXOptions): void {
    if (!this.container) {
      console.warn('[VFXManager] No container set');
      return;
    }

    const effect = this.createEffectElement(type, options);
    this.container.appendChild(effect);
    this.activeEffects.add(effect);

    // Cleanup after animation
    const duration = options.duration || 1000;
    setTimeout(() => {
      this.removeEffect(effect);
      options.onComplete?.();
    }, duration);
  }

  /**
   * Create effect DOM element with animations
   */
  private createEffectElement(type: VFXType, options: VFXOptions): HTMLElement {
    const container = document.createElement('div');
    container.className = 'vfx-effect';
    container.style.cssText = `
      position: absolute;
      left: ${options.x}px;
      top: ${options.y}px;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 1000;
    `;

    const colors = EFFECT_COLORS[type];
    const scale = options.scale || 1;
    const duration = options.duration || 1000;

    // Create particles based on effect type
    const particleCount = this.getParticleCount(type, options.intensity);
    for (let i = 0; i < particleCount; i++) {
      const particle = this.createParticle(type, colors, scale, duration, i);
      container.appendChild(particle);
    }

    return container;
  }

  /**
   * Get particle count based on effect type and intensity
   */
  private getParticleCount(type: VFXType, intensity?: number): number {
    const base = {
      fire: 20,
      ice: 15,
      lightning: 8,
      necrotic: 12,
      radiant: 25,
      poison: 15,
      heal: 20,
      buff: 15,
      debuff: 10,
      slash: 5,
      pierce: 3,
      bludgeon: 8,
      critical: 30,
      miss: 3,
      death: 25,
      levelup: 40,
      teleport: 20,
    };
    return Math.round((base[type] || 10) * (intensity || 1));
  }

  /**
   * Create a single particle element
   */
  private createParticle(
    type: VFXType,
    colors: string[],
    scale: number,
    duration: number,
    index: number
  ): HTMLElement {
    const particle = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = (Math.random() * 8 + 4) * scale;
    const angle = (Math.PI * 2 * index) / 20 + Math.random() * 0.5;
    const distance = (Math.random() * 60 + 20) * scale;
    const delay = Math.random() * (duration * 0.3);

    // Different animation patterns based on type
    let animation = '';
    switch (type) {
      case 'fire':
        animation = this.getFireAnimation(angle, distance, duration);
        break;
      case 'ice':
        animation = this.getIceAnimation(angle, distance, duration);
        break;
      case 'lightning':
        animation = this.getLightningAnimation(duration);
        break;
      case 'heal':
      case 'buff':
        animation = this.getRiseAnimation(distance, duration);
        break;
      case 'death':
        animation = this.getFallAnimation(distance, duration);
        break;
      case 'levelup':
        animation = this.getSpiralAnimation(angle, distance, duration);
        break;
      default:
        animation = this.getBurstAnimation(angle, distance, duration);
    }

    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${type === 'lightning' ? '0' : '50%'};
      box-shadow: 0 0 ${size}px ${color};
      animation: ${animation};
      animation-delay: ${delay}ms;
      opacity: 0;
    `;

    return particle;
  }

  /**
   * Fire animation - rises and flickers
   */
  private getFireAnimation(angle: number, distance: number, duration: number): string {
    const x = Math.cos(angle) * distance * 0.5;
    const y = -Math.abs(Math.sin(angle) * distance) - distance;
    return `vfx-fire ${duration}ms ease-out forwards`;
  }

  /**
   * Ice animation - crystalline expansion
   */
  private getIceAnimation(angle: number, distance: number, duration: number): string {
    return `vfx-ice ${duration}ms ease-out forwards`;
  }

  /**
   * Lightning animation - flickering flash
   */
  private getLightningAnimation(duration: number): string {
    return `vfx-lightning ${duration * 0.3}ms steps(2) ${Math.floor(duration / (duration * 0.3))}`;
  }

  /**
   * Rising animation for heals/buffs
   */
  private getRiseAnimation(distance: number, duration: number): string {
    return `vfx-rise ${duration}ms ease-out forwards`;
  }

  /**
   * Falling animation for death effects
   */
  private getFallAnimation(distance: number, duration: number): string {
    return `vfx-fall ${duration}ms ease-in forwards`;
  }

  /**
   * Spiral animation for level ups
   */
  private getSpiralAnimation(angle: number, distance: number, duration: number): string {
    return `vfx-spiral ${duration}ms ease-out forwards`;
  }

  /**
   * Burst animation - generic outward explosion
   */
  private getBurstAnimation(angle: number, distance: number, duration: number): string {
    return `vfx-burst ${duration}ms ease-out forwards`;
  }

  /**
   * Play damage number effect
   */
  showDamageNumber(options: DamageNumberOptions): void {
    if (!this.container) return;

    const number = document.createElement('div');
    const { x, y, amount, type, damageType } = options;

    let color = '#FFFFFF';
    let prefix = '';
    let fontSize = '24px';

    switch (type) {
      case 'damage':
        color = EFFECT_COLORS[DAMAGE_TYPE_VFX[damageType || ''] || 'slash'][0];
        prefix = '-';
        break;
      case 'heal':
        color = '#00FF7F';
        prefix = '+';
        break;
      case 'critical':
        color = '#FFD700';
        prefix = '-';
        fontSize = '32px';
        break;
      case 'miss':
        color = '#808080';
        prefix = '';
        break;
    }

    const text = type === 'miss' ? 'MISS' : `${prefix}${amount}`;

    number.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      transform: translate(-50%, -50%);
      font-family: 'Cinzel', serif;
      font-size: ${fontSize};
      font-weight: bold;
      color: ${color};
      text-shadow:
        2px 2px 0 #000,
        -2px -2px 0 #000,
        2px -2px 0 #000,
        -2px 2px 0 #000,
        0 0 10px ${color};
      pointer-events: none;
      z-index: 1001;
      animation: damage-number 1.5s ease-out forwards;
    `;
    number.textContent = text;

    this.container.appendChild(number);
    this.activeEffects.add(number);

    setTimeout(() => {
      this.removeEffect(number);
    }, 1500);
  }

  /**
   * Trigger screen shake effect
   */
  screenShake(options: ScreenShakeOptions = {}): void {
    if (!this.container || this.screenShakeActive) return;

    const { intensity = 10, duration = 500, frequency = 50 } = options;
    this.screenShakeActive = true;

    const originalTransform = this.container.style.transform;
    const shakeInterval = setInterval(() => {
      const x = (Math.random() - 0.5) * intensity * 2;
      const y = (Math.random() - 0.5) * intensity * 2;
      this.container!.style.transform = `translate(${x}px, ${y}px)`;
    }, frequency);

    setTimeout(() => {
      clearInterval(shakeInterval);
      this.container!.style.transform = originalTransform;
      this.screenShakeActive = false;
    }, duration);
  }

  /**
   * Trigger screen flash effect
   */
  screenFlash(options: ScreenFlashOptions = {}): void {
    if (!this.container) return;

    const { color = '#FFFFFF', duration = 200, opacity = 0.5 } = options;

    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: ${color};
      opacity: 0;
      pointer-events: none;
      z-index: 9999;
      animation: screen-flash ${duration}ms ease-out forwards;
    `;

    // Create keyframes for this specific flash
    const style = document.createElement('style');
    style.textContent = `
      @keyframes screen-flash {
        0% { opacity: ${opacity}; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(flash);

    setTimeout(() => {
      flash.remove();
      style.remove();
    }, duration);
  }

  /**
   * Play effect for a damage type
   */
  playDamageEffect(damageType: string, options: VFXOptions): void {
    const vfxType = DAMAGE_TYPE_VFX[damageType.toLowerCase()] || 'slash';
    this.play(vfxType, options);
  }

  /**
   * Play combat hit effect
   */
  playHitEffect(options: VFXOptions & { critical?: boolean; damageType?: string }): void {
    const { critical, damageType, ...vfxOptions } = options;

    if (critical) {
      this.play('critical', { ...vfxOptions, intensity: 1.5 });
      this.screenShake({ intensity: 15, duration: 300 });
      this.screenFlash({ color: '#FFD700', duration: 150, opacity: 0.3 });
    } else if (damageType) {
      this.playDamageEffect(damageType, vfxOptions);
      this.screenShake({ intensity: 5, duration: 100 });
    } else {
      this.play('slash', vfxOptions);
    }
  }

  /**
   * Play spell cast effect
   */
  playSpellEffect(spellSchool: string, options: VFXOptions): void {
    const schoolToVFX: Record<string, VFXType> = {
      evocation: 'fire',
      necromancy: 'necrotic',
      conjuration: 'teleport',
      abjuration: 'buff',
      divination: 'radiant',
      enchantment: 'debuff',
      illusion: 'teleport',
      transmutation: 'buff',
    };

    const vfxType = schoolToVFX[spellSchool.toLowerCase()] || 'radiant';
    this.play(vfxType, { ...options, intensity: 1.2 });
  }

  /**
   * Remove an effect element
   */
  private removeEffect(element: HTMLElement): void {
    if (this.activeEffects.has(element)) {
      this.activeEffects.delete(element);
      element.remove();
    }
  }

  /**
   * Clear all active effects
   */
  clearAll(): void {
    this.activeEffects.forEach(effect => effect.remove());
    this.activeEffects.clear();
  }

  /**
   * Get CSS for VFX animations (should be added to global styles)
   */
  static getStyles(): string {
    return `
      @keyframes vfx-burst {
        0% {
          opacity: 1;
          transform: translate(0, 0) scale(0);
        }
        50% {
          opacity: 1;
          transform: translate(var(--dx, 30px), var(--dy, -30px)) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate(calc(var(--dx, 30px) * 2), calc(var(--dy, -30px) * 2)) scale(0.5);
        }
      }

      @keyframes vfx-fire {
        0% {
          opacity: 1;
          transform: translate(0, 0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate(var(--dx, 0), -80px) scale(0.3);
        }
      }

      @keyframes vfx-ice {
        0% {
          opacity: 1;
          transform: scale(0) rotate(0deg);
        }
        50% {
          opacity: 1;
          transform: scale(1.2) rotate(180deg);
        }
        100% {
          opacity: 0;
          transform: scale(0.5) rotate(360deg);
        }
      }

      @keyframes vfx-lightning {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
      }

      @keyframes vfx-rise {
        0% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translateY(-60px) scale(0.5);
        }
      }

      @keyframes vfx-fall {
        0% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translateY(60px) scale(0.3);
        }
      }

      @keyframes vfx-spiral {
        0% {
          opacity: 1;
          transform: translateY(0) rotate(0deg) scale(1);
        }
        100% {
          opacity: 0;
          transform: translateY(-100px) rotate(720deg) scale(0);
        }
      }

      @keyframes damage-number {
        0% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(0.5);
        }
        20% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.2);
        }
        40% {
          transform: translate(-50%, -50%) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, calc(-50% - 50px)) scale(0.8);
        }
      }
    `;
  }
}

// Singleton instance
export const VFXManager = new VFXManagerClass();

export default VFXManager;
