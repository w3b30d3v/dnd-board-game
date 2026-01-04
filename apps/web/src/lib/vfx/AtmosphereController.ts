// AtmosphereController - Ambient Atmosphere Effects
// Manages background particles, lighting, and environmental effects

export type AtmospherePreset =
  | 'tavern'
  | 'dungeon'
  | 'forest'
  | 'cave'
  | 'combat'
  | 'magic'
  | 'sacred'
  | 'dread'
  | 'underwater'
  | 'storm'
  | 'snow'
  | 'desert'
  | 'neutral';

export interface ParticleConfig {
  type: 'dust' | 'ember' | 'sparkle' | 'fog' | 'snow' | 'rain' | 'bubble' | 'ash';
  count: number;
  color: string[];
  size: { min: number; max: number };
  speed: { min: number; max: number };
  opacity: { min: number; max: number };
  direction?: 'up' | 'down' | 'random';
  glow?: boolean;
}

export interface AtmosphereConfig {
  name: AtmospherePreset;
  backgroundColor?: string;
  vignette?: { color: string; intensity: number };
  particles: ParticleConfig[];
  ambientLight?: { color: string; intensity: number };
  fog?: { color: string; density: number };
}

// Atmosphere presets
const ATMOSPHERE_PRESETS: Record<AtmospherePreset, AtmosphereConfig> = {
  tavern: {
    name: 'tavern',
    backgroundColor: 'linear-gradient(180deg, #1a0f0a 0%, #2d1810 100%)',
    vignette: { color: '#000000', intensity: 0.3 },
    particles: [
      {
        type: 'dust',
        count: 30,
        color: ['#FFD700', '#FFA500'],
        size: { min: 2, max: 4 },
        speed: { min: 0.2, max: 0.5 },
        opacity: { min: 0.3, max: 0.6 },
        direction: 'random',
      },
      {
        type: 'ember',
        count: 10,
        color: ['#FF4500', '#FF6347'],
        size: { min: 2, max: 3 },
        speed: { min: 0.3, max: 0.8 },
        opacity: { min: 0.5, max: 0.8 },
        direction: 'up',
        glow: true,
      },
    ],
    ambientLight: { color: '#FF8C00', intensity: 0.3 },
  },

  dungeon: {
    name: 'dungeon',
    backgroundColor: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a25 100%)',
    vignette: { color: '#000000', intensity: 0.5 },
    particles: [
      {
        type: 'dust',
        count: 20,
        color: ['#4a4a5a', '#3a3a4a'],
        size: { min: 1, max: 3 },
        speed: { min: 0.1, max: 0.3 },
        opacity: { min: 0.2, max: 0.4 },
        direction: 'random',
      },
      {
        type: 'fog',
        count: 5,
        color: ['#2a2a3a'],
        size: { min: 100, max: 200 },
        speed: { min: 0.05, max: 0.1 },
        opacity: { min: 0.1, max: 0.2 },
        direction: 'random',
      },
    ],
    ambientLight: { color: '#4a4a7a', intensity: 0.2 },
    fog: { color: '#1a1a25', density: 0.3 },
  },

  forest: {
    name: 'forest',
    backgroundColor: 'linear-gradient(180deg, #0f1a0f 0%, #1a2a1a 100%)',
    vignette: { color: '#000000', intensity: 0.2 },
    particles: [
      {
        type: 'sparkle',
        count: 25,
        color: ['#90EE90', '#98FB98', '#00FF7F'],
        size: { min: 2, max: 4 },
        speed: { min: 0.1, max: 0.4 },
        opacity: { min: 0.3, max: 0.7 },
        direction: 'random',
        glow: true,
      },
      {
        type: 'dust',
        count: 15,
        color: ['#228B22', '#2E8B57'],
        size: { min: 1, max: 2 },
        speed: { min: 0.05, max: 0.15 },
        opacity: { min: 0.2, max: 0.4 },
        direction: 'down',
      },
    ],
    ambientLight: { color: '#228B22', intensity: 0.2 },
  },

  cave: {
    name: 'cave',
    backgroundColor: 'linear-gradient(180deg, #0a0a0a 0%, #1a1515 100%)',
    vignette: { color: '#000000', intensity: 0.6 },
    particles: [
      {
        type: 'dust',
        count: 10,
        color: ['#3a3a3a', '#4a4a4a'],
        size: { min: 1, max: 2 },
        speed: { min: 0.05, max: 0.15 },
        opacity: { min: 0.1, max: 0.3 },
        direction: 'random',
      },
    ],
    ambientLight: { color: '#333333', intensity: 0.1 },
    fog: { color: '#0a0a0a', density: 0.5 },
  },

  combat: {
    name: 'combat',
    backgroundColor: 'linear-gradient(180deg, #1a0a0a 0%, #2a1515 100%)',
    vignette: { color: '#8B0000', intensity: 0.3 },
    particles: [
      {
        type: 'ember',
        count: 15,
        color: ['#FF4500', '#FF6347', '#DC143C'],
        size: { min: 2, max: 4 },
        speed: { min: 0.5, max: 1.0 },
        opacity: { min: 0.5, max: 0.8 },
        direction: 'up',
        glow: true,
      },
      {
        type: 'ash',
        count: 10,
        color: ['#2a2a2a', '#3a3a3a'],
        size: { min: 1, max: 3 },
        speed: { min: 0.2, max: 0.5 },
        opacity: { min: 0.3, max: 0.5 },
        direction: 'random',
      },
    ],
    ambientLight: { color: '#DC143C', intensity: 0.2 },
  },

  magic: {
    name: 'magic',
    backgroundColor: 'linear-gradient(180deg, #0f0a1a 0%, #1a1530 100%)',
    vignette: { color: '#4B0082', intensity: 0.2 },
    particles: [
      {
        type: 'sparkle',
        count: 40,
        color: ['#9400D3', '#8A2BE2', '#9932CC', '#BA55D3', '#DA70D6'],
        size: { min: 2, max: 5 },
        speed: { min: 0.2, max: 0.6 },
        opacity: { min: 0.4, max: 0.9 },
        direction: 'random',
        glow: true,
      },
    ],
    ambientLight: { color: '#9400D3', intensity: 0.3 },
  },

  sacred: {
    name: 'sacred',
    backgroundColor: 'linear-gradient(180deg, #1a1a0f 0%, #2a2a1a 100%)',
    vignette: { color: '#FFD700', intensity: 0.1 },
    particles: [
      {
        type: 'sparkle',
        count: 30,
        color: ['#FFD700', '#FFFACD', '#FFF8DC'],
        size: { min: 2, max: 4 },
        speed: { min: 0.1, max: 0.3 },
        opacity: { min: 0.4, max: 0.8 },
        direction: 'up',
        glow: true,
      },
      {
        type: 'dust',
        count: 15,
        color: ['#FFD700'],
        size: { min: 1, max: 2 },
        speed: { min: 0.05, max: 0.15 },
        opacity: { min: 0.2, max: 0.4 },
        direction: 'random',
      },
    ],
    ambientLight: { color: '#FFD700', intensity: 0.25 },
  },

  dread: {
    name: 'dread',
    backgroundColor: 'linear-gradient(180deg, #050505 0%, #0f0a0f 100%)',
    vignette: { color: '#000000', intensity: 0.7 },
    particles: [
      {
        type: 'fog',
        count: 8,
        color: ['#1a0a1a', '#0f050f'],
        size: { min: 150, max: 300 },
        speed: { min: 0.02, max: 0.08 },
        opacity: { min: 0.2, max: 0.4 },
        direction: 'random',
      },
      {
        type: 'ash',
        count: 10,
        color: ['#2a1a2a', '#1a0a1a'],
        size: { min: 2, max: 4 },
        speed: { min: 0.1, max: 0.3 },
        opacity: { min: 0.2, max: 0.4 },
        direction: 'down',
      },
    ],
    ambientLight: { color: '#4B0082', intensity: 0.1 },
    fog: { color: '#0a0a0f', density: 0.6 },
  },

  underwater: {
    name: 'underwater',
    backgroundColor: 'linear-gradient(180deg, #001a33 0%, #003366 100%)',
    vignette: { color: '#000033', intensity: 0.3 },
    particles: [
      {
        type: 'bubble',
        count: 25,
        color: ['#87CEEB', '#ADD8E6', '#B0E0E6'],
        size: { min: 3, max: 8 },
        speed: { min: 0.3, max: 0.8 },
        opacity: { min: 0.3, max: 0.6 },
        direction: 'up',
      },
      {
        type: 'sparkle',
        count: 15,
        color: ['#00CED1', '#20B2AA'],
        size: { min: 1, max: 3 },
        speed: { min: 0.1, max: 0.3 },
        opacity: { min: 0.2, max: 0.5 },
        direction: 'random',
        glow: true,
      },
    ],
    ambientLight: { color: '#00CED1', intensity: 0.2 },
    fog: { color: '#001a33', density: 0.4 },
  },

  storm: {
    name: 'storm',
    backgroundColor: 'linear-gradient(180deg, #1a1a2a 0%, #2a2a3a 100%)',
    vignette: { color: '#000000', intensity: 0.4 },
    particles: [
      {
        type: 'rain',
        count: 100,
        color: ['#87CEEB', '#B0C4DE'],
        size: { min: 1, max: 2 },
        speed: { min: 5, max: 10 },
        opacity: { min: 0.3, max: 0.6 },
        direction: 'down',
      },
    ],
    ambientLight: { color: '#4682B4', intensity: 0.15 },
  },

  snow: {
    name: 'snow',
    backgroundColor: 'linear-gradient(180deg, #1a1a2a 0%, #2a2a3a 100%)',
    vignette: { color: '#000033', intensity: 0.2 },
    particles: [
      {
        type: 'snow',
        count: 50,
        color: ['#FFFFFF', '#F0F8FF', '#F5F5F5'],
        size: { min: 2, max: 5 },
        speed: { min: 0.5, max: 1.5 },
        opacity: { min: 0.5, max: 0.9 },
        direction: 'down',
      },
    ],
    ambientLight: { color: '#B0C4DE', intensity: 0.3 },
  },

  desert: {
    name: 'desert',
    backgroundColor: 'linear-gradient(180deg, #3a2a1a 0%, #5a4a3a 100%)',
    vignette: { color: '#2a1a0a', intensity: 0.2 },
    particles: [
      {
        type: 'dust',
        count: 30,
        color: ['#D2B48C', '#DEB887', '#F5DEB3'],
        size: { min: 1, max: 3 },
        speed: { min: 0.3, max: 0.8 },
        opacity: { min: 0.2, max: 0.5 },
        direction: 'random',
      },
    ],
    ambientLight: { color: '#FFD700', intensity: 0.4 },
  },

  neutral: {
    name: 'neutral',
    backgroundColor: 'linear-gradient(180deg, #0F0D13 0%, #1E1B26 100%)',
    vignette: { color: '#000000', intensity: 0.1 },
    particles: [
      {
        type: 'dust',
        count: 15,
        color: ['#4a4a5a'],
        size: { min: 1, max: 2 },
        speed: { min: 0.05, max: 0.15 },
        opacity: { min: 0.1, max: 0.3 },
        direction: 'random',
      },
    ],
  },
};

interface Particle {
  element: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  config: ParticleConfig;
}

class AtmosphereControllerClass {
  private container: HTMLElement | null = null;
  private currentPreset: AtmospherePreset = 'neutral';
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private vignetteElement: HTMLElement | null = null;
  private fogElement: HTMLElement | null = null;
  private transitionDuration: number = 2000;

  /**
   * Initialize the atmosphere controller
   */
  init(container: HTMLElement): void {
    this.container = container;
    this.createOverlayElements();
    console.log('[AtmosphereController] Initialized');
  }

  /**
   * Create vignette and fog overlay elements
   */
  private createOverlayElements(): void {
    if (!this.container) return;

    // Vignette overlay
    this.vignetteElement = document.createElement('div');
    this.vignetteElement.className = 'atmosphere-vignette';
    this.vignetteElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
      opacity: 0;
      transition: opacity ${this.transitionDuration}ms ease;
    `;
    document.body.appendChild(this.vignetteElement);

    // Fog overlay
    this.fogElement = document.createElement('div');
    this.fogElement.className = 'atmosphere-fog';
    this.fogElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 99;
      opacity: 0;
      transition: opacity ${this.transitionDuration}ms ease;
    `;
    document.body.appendChild(this.fogElement);
  }

  /**
   * Set atmosphere preset
   */
  setPreset(preset: AtmospherePreset): void {
    if (!this.container) return;

    const config = ATMOSPHERE_PRESETS[preset];
    if (!config) {
      console.warn(`[AtmosphereController] Unknown preset: ${preset}`);
      return;
    }

    this.currentPreset = preset;

    // Clear existing particles
    this.clearParticles();

    // Apply background
    if (config.backgroundColor) {
      this.container.style.background = config.backgroundColor;
    }

    // Apply vignette
    if (this.vignetteElement && config.vignette) {
      this.vignetteElement.style.background = `radial-gradient(ellipse at center, transparent 0%, ${config.vignette.color} 100%)`;
      this.vignetteElement.style.opacity = String(config.vignette.intensity);
    }

    // Apply fog
    if (this.fogElement && config.fog) {
      this.fogElement.style.background = config.fog.color;
      this.fogElement.style.opacity = String(config.fog.density);
    }

    // Create particles
    config.particles.forEach(particleConfig => {
      this.createParticles(particleConfig);
    });

    // Start animation loop
    this.startAnimation();
  }

  /**
   * Create particles for a config
   */
  private createParticles(config: ParticleConfig): void {
    if (!this.container) return;

    for (let i = 0; i < config.count; i++) {
      const particle = this.createParticle(config);
      this.particles.push(particle);
      this.container.appendChild(particle.element);
    }
  }

  /**
   * Create a single particle
   */
  private createParticle(config: ParticleConfig): Particle {
    const element = document.createElement('div');
    const size = config.size.min + Math.random() * (config.size.max - config.size.min);
    const opacity = config.opacity.min + Math.random() * (config.opacity.max - config.opacity.min);
    const color = config.color[Math.floor(Math.random() * config.color.length)];

    // Random starting position
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;

    // Velocity based on direction
    const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
    let vx = 0;
    let vy = 0;

    switch (config.direction) {
      case 'up':
        vy = -speed;
        vx = (Math.random() - 0.5) * speed * 0.3;
        break;
      case 'down':
        vy = speed;
        vx = (Math.random() - 0.5) * speed * 0.3;
        break;
      case 'random':
      default:
        vx = (Math.random() - 0.5) * speed;
        vy = (Math.random() - 0.5) * speed;
    }

    // Style based on type
    let style = '';
    switch (config.type) {
      case 'fog':
        style = `
          width: ${size}px;
          height: ${size}px;
          background: radial-gradient(circle, ${color} 0%, transparent 70%);
          filter: blur(${size * 0.3}px);
        `;
        break;
      case 'bubble':
        style = `
          width: ${size}px;
          height: ${size}px;
          background: transparent;
          border: 1px solid ${color};
          border-radius: 50%;
        `;
        break;
      case 'rain':
        style = `
          width: 1px;
          height: ${size * 10}px;
          background: linear-gradient(to bottom, transparent, ${color});
        `;
        break;
      default:
        style = `
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50%;
          ${config.glow ? `box-shadow: 0 0 ${size * 2}px ${color};` : ''}
        `;
    }

    element.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 98;
      opacity: ${opacity};
      left: ${x}px;
      top: ${y}px;
      ${style}
    `;

    return { element, x, y, vx, vy, size, opacity, config };
  }

  /**
   * Start animation loop
   */
  private startAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    const animate = () => {
      this.updateParticles();
      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * Update particle positions
   */
  private updateParticles(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Wrap around screen
      if (particle.x < -particle.size) particle.x = width + particle.size;
      if (particle.x > width + particle.size) particle.x = -particle.size;
      if (particle.y < -particle.size) particle.y = height + particle.size;
      if (particle.y > height + particle.size) particle.y = -particle.size;

      particle.element.style.left = `${particle.x}px`;
      particle.element.style.top = `${particle.y}px`;
    });
  }

  /**
   * Clear all particles
   */
  private clearParticles(): void {
    this.particles.forEach(p => p.element.remove());
    this.particles = [];
  }

  /**
   * Transition to new preset smoothly
   */
  async transition(preset: AtmospherePreset): Promise<void> {
    // Fade out current
    if (this.vignetteElement) {
      this.vignetteElement.style.opacity = '0';
    }
    if (this.fogElement) {
      this.fogElement.style.opacity = '0';
    }

    // Fade out particles
    this.particles.forEach(p => {
      p.element.style.transition = `opacity ${this.transitionDuration / 2}ms ease`;
      p.element.style.opacity = '0';
    });

    await new Promise(resolve => setTimeout(resolve, this.transitionDuration / 2));

    // Set new preset
    this.setPreset(preset);
  }

  /**
   * Get current preset
   */
  getCurrentPreset(): AtmospherePreset {
    return this.currentPreset;
  }

  /**
   * Get available presets
   */
  getAvailablePresets(): AtmospherePreset[] {
    return Object.keys(ATMOSPHERE_PRESETS) as AtmospherePreset[];
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    this.clearParticles();

    this.vignetteElement?.remove();
    this.fogElement?.remove();
  }
}

// Singleton instance
export const AtmosphereController = new AtmosphereControllerClass();

export default AtmosphereController;
