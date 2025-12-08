# Document 37: Real-Time Visual Effects Library

## Purpose
This document provides a **complete library of visual effects** for spells, abilities, environmental hazards, and combat. Each effect includes exact implementation code using Canvas, WebGL, CSS, and particle systems.

---

## 1. VFX System Architecture

### 1.1 Effect Categories

```typescript
type EffectCategory = 
  | 'spell_projectile'      // Moving effects (magic missile, fire bolt)
  | 'spell_area'            // AoE effects (fireball explosion, ice storm)
  | 'spell_buff'            // Character auras (shield, bless)
  | 'spell_debuff'          // Negative effects (poison, curse)
  | 'combat_impact'         // Hit effects (slash, pierce, bludgeon)
  | 'combat_critical'       // Critical hit celebrations
  | 'environmental'         // Traps, hazards, terrain
  | 'ui_feedback'           // Damage numbers, status changes
  | 'atmospheric'           // Ambient effects (dust, fog, magic)
  | 'transition';           // Scene changes, reveals
```

### 1.2 Core Effect Interface

```typescript
interface VFXEffect {
  id: string;
  category: EffectCategory;
  duration: number;          // milliseconds, -1 for infinite
  loop: boolean;
  layers: EffectLayer[];
  audio?: AudioCue;
  screenShake?: ShakeConfig;
  flashColor?: string;
}

interface EffectLayer {
  type: 'particles' | 'sprite' | 'shader' | 'css' | 'canvas';
  config: LayerConfig;
  timing: {
    delay: number;
    duration: number;
    easing: string;
  };
}

interface ShakeConfig {
  intensity: number;
  duration: number;
  frequency: number;
}

interface AudioCue {
  sound: string;
  volume: number;
  delay?: number;
}
```

---

## 2. Spell Effects by Damage Type

### 2.1 Fire Effects

#### Fireball (20ft radius explosion)
```typescript
export const FIREBALL_EFFECT: VFXEffect = {
  id: 'fireball',
  category: 'spell_area',
  duration: 2000,
  loop: false,
  
  layers: [
    // Layer 1: Initial flash
    {
      type: 'css',
      config: {
        className: 'fireball-flash',
        keyframes: `
          0% { 
            transform: scale(0); 
            opacity: 1;
            background: radial-gradient(circle, #fff 0%, #ff6600 50%, transparent 70%);
          }
          50% { transform: scale(2); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        `,
      },
      timing: { delay: 0, duration: 300, easing: 'ease-out' }
    },
    
    // Layer 2: Fire particles explosion
    {
      type: 'particles',
      config: {
        preset: 'explosion',
        particles: {
          number: { value: 100 },
          color: { value: ['#ff4500', '#ff6600', '#ffcc00', '#ff0000'] },
          opacity: { value: 1, animation: { enable: true, speed: 2, minimumValue: 0 } },
          size: { value: { min: 5, max: 20 } },
          move: {
            enable: true,
            speed: 20,
            direction: 'none',
            outModes: 'destroy',
            gravity: { enable: true, acceleration: 2 }
          },
          life: { duration: { value: 1 } }
        },
        emitters: {
          position: { x: 50, y: 50 },
          rate: { quantity: 100, delay: 0 },
          life: { count: 1 }
        }
      },
      timing: { delay: 0, duration: 1500, easing: 'linear' }
    },
    
    // Layer 3: Smoke aftermath
    {
      type: 'particles',
      config: {
        particles: {
          number: { value: 30 },
          color: { value: '#333' },
          opacity: { value: 0.5, animation: { enable: true, speed: 0.5, minimumValue: 0 } },
          size: { value: { min: 30, max: 80 } },
          move: { enable: true, speed: 2, direction: 'top' }
        }
      },
      timing: { delay: 500, duration: 2000, easing: 'ease-out' }
    },
    
    // Layer 4: Ground scorch mark (persists)
    {
      type: 'sprite',
      config: {
        src: '/vfx/scorch-mark.png',
        scale: { start: 0, end: 1 },
        opacity: { start: 0.8, end: 0.3 },
        persist: true,
        persistDuration: 10000
      },
      timing: { delay: 300, duration: 500, easing: 'ease-out' }
    }
  ],
  
  audio: { sound: '/audio/sfx/fireball-explosion.mp3', volume: 0.8 },
  screenShake: { intensity: 15, duration: 400, frequency: 30 },
  flashColor: 'rgba(255, 100, 0, 0.3)'
};

#### Fire Bolt (ranged projectile)
export const FIRE_BOLT_EFFECT: VFXEffect = {
  id: 'fire_bolt',
  category: 'spell_projectile',
  duration: 800,
  loop: false,
  
  layers: [
    // Projectile with trail
    {
      type: 'canvas',
      config: {
        draw: (ctx, progress, start, end) => {
          const x = lerp(start.x, end.x, progress);
          const y = lerp(start.y, end.y, progress);
          
          // Glow gradient
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
          gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
          gradient.addColorStop(0.3, 'rgba(255, 150, 0, 0.8)');
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, 30, 0, Math.PI * 2);
          ctx.fill();
          
          // Bright core
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      timing: { delay: 0, duration: 500, easing: 'ease-in' }
    },
    
    // Trail particles
    {
      type: 'particles',
      config: {
        followPath: true,
        particles: {
          number: { value: 20 },
          color: { value: ['#ff4500', '#ffcc00'] },
          size: { value: { min: 2, max: 6 } },
          opacity: { value: 1, animation: { enable: true, speed: 3, minimumValue: 0 } },
          move: { enable: false }
        }
      },
      timing: { delay: 0, duration: 500, easing: 'linear' }
    },
    
    // Impact burst
    {
      type: 'css',
      config: {
        className: 'fire-impact',
        position: 'end',
        keyframes: `
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        `
      },
      timing: { delay: 500, duration: 300, easing: 'ease-out' }
    }
  ],
  
  audio: { sound: '/audio/sfx/fire-bolt.mp3', volume: 0.6 }
};
```

### 2.2 Lightning Effects

```typescript
export const LIGHTNING_BOLT_EFFECT: VFXEffect = {
  id: 'lightning_bolt',
  category: 'spell_area',
  duration: 600,
  loop: false,
  
  layers: [
    // Pre-flash anticipation
    {
      type: 'css',
      config: {
        className: 'lightning-preflash',
        fullscreen: true,
        keyframes: `
          0%, 100% { background: transparent; }
          50% { background: rgba(200, 220, 255, 0.1); }
        `
      },
      timing: { delay: 0, duration: 100, easing: 'linear' }
    },
    
    // Main lightning bolt (procedural)
    {
      type: 'canvas',
      config: {
        draw: (ctx, progress, start, end) => {
          if (progress < 0.1 || progress > 0.4) return;
          
          // Generate jagged path
          const segments = generateLightningPath(start, end, 8);
          
          // Multiple strokes for glow effect
          const strokes = [
            { width: 8, color: 'rgba(255, 255, 255, 0.3)', blur: 20 },
            { width: 4, color: 'rgba(200, 220, 255, 0.6)', blur: 10 },
            { width: 2, color: '#fff', blur: 0 }
          ];
          
          strokes.forEach(stroke => {
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.shadowBlur = stroke.blur;
            ctx.shadowColor = '#88ccff';
            
            ctx.beginPath();
            ctx.moveTo(segments[0].x, segments[0].y);
            segments.forEach(pt => ctx.lineTo(pt.x, pt.y));
            ctx.stroke();
          });
          
          // Random branches
          segments.forEach((pt, i) => {
            if (Math.random() > 0.7 && i > 0 && i < segments.length - 1) {
              drawLightningBranch(ctx, pt, 30 + Math.random() * 50);
            }
          });
        }
      },
      timing: { delay: 100, duration: 200, easing: 'linear' }
    },
    
    // Bright flash
    {
      type: 'css',
      config: {
        className: 'lightning-flash',
        fullscreen: true,
        keyframes: `
          0% { background: rgba(255, 255, 255, 0.9); }
          100% { background: transparent; }
        `
      },
      timing: { delay: 100, duration: 100, easing: 'ease-out' }
    },
    
    // Electric sparks at impact
    {
      type: 'particles',
      config: {
        particles: {
          number: { value: 30 },
          color: { value: ['#fff', '#88ccff', '#aaddff'] },
          size: { value: { min: 1, max: 3 } },
          move: { enable: true, speed: 10, direction: 'none', random: true },
          life: { duration: { value: 0.3 } }
        }
      },
      timing: { delay: 100, duration: 500, easing: 'linear' }
    }
  ],
  
  audio: { sound: '/audio/sfx/lightning-crack.mp3', volume: 0.9 },
  screenShake: { intensity: 10, duration: 200, frequency: 50 },
  flashColor: 'rgba(200, 220, 255, 0.5)'
};

// Helper function
function generateLightningPath(start: Point, end: Point, segments: number): Point[] {
  const points: Point[] = [start];
  const dx = (end.x - start.x) / segments;
  const dy = (end.y - start.y) / segments;
  
  for (let i = 1; i < segments; i++) {
    const offset = (Math.random() - 0.5) * 40;
    points.push({
      x: start.x + dx * i + offset,
      y: start.y + dy * i + offset * 0.5
    });
  }
  points.push(end);
  return points;
}
```

### 2.3 Cold/Ice Effects

```typescript
export const CONE_OF_COLD_EFFECT: VFXEffect = {
  id: 'cone_of_cold',
  category: 'spell_area',
  duration: 1500,
  loop: false,
  
  layers: [
    // Ice crystals burst in cone
    {
      type: 'particles',
      config: {
        particles: {
          number: { value: 80 },
          color: { value: ['#a8d8ea', '#cce5ff', '#ffffff', '#88ccff'] },
          shape: { type: 'polygon', polygon: { sides: 6 } },
          size: { value: { min: 5, max: 15 } },
          opacity: { value: 0.8 },
          rotate: {
            value: { min: 0, max: 360 },
            animation: { enable: true, speed: 10 }
          },
          move: {
            enable: true,
            speed: 15,
            direction: 'none',
            outModes: 'destroy'
          }
        },
        emitters: {
          direction: 'none',
          angle: { min: -30, max: 30 },
          position: { x: 0, y: 50 }
        }
      },
      timing: { delay: 0, duration: 800, easing: 'ease-out' }
    },
    
    // Frost mist cone
    {
      type: 'css',
      config: {
        className: 'frost-mist',
        clipPath: 'polygon(0% 50%, 100% 0%, 100% 100%)',
        keyframes: `
          0% { opacity: 0; background: radial-gradient(ellipse, rgba(200,230,255,0.6), transparent); }
          30% { opacity: 0.8; }
          100% { opacity: 0; transform: scale(1.2); }
        `
      },
      timing: { delay: 0, duration: 1000, easing: 'ease-out' }
    },
    
    // Ground frost spreading
    {
      type: 'canvas',
      config: {
        draw: (ctx, progress) => {
          drawFrostPattern(ctx, Math.min(progress * 2, 1));
        }
      },
      timing: { delay: 200, duration: 1000, easing: 'ease-out' }
    }
  ],
  
  audio: { sound: '/audio/sfx/ice-blast.mp3', volume: 0.7 }
};
```

### 2.4 Necrotic Effects

```typescript
export const NECROTIC_EFFECT: VFXEffect = {
  id: 'necrotic',
  category: 'spell_debuff',
  duration: 1200,
  loop: false,
  
  layers: [
    // Dark energy tendrils
    {
      type: 'canvas',
      config: {
        draw: (ctx, progress, target) => {
          const numTendrils = 5;
          for (let i = 0; i < numTendrils; i++) {
            const angle = (i / numTendrils) * Math.PI * 2 + progress * 2;
            const length = 50 * (1 - progress * 0.5);
            
            ctx.strokeStyle = `rgba(100, 0, 150, ${0.6 - progress * 0.4})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(target.x, target.y);
            
            for (let t = 0; t < 1; t += 0.1) {
              const x = target.x + Math.cos(angle) * length * t + 
                        Math.sin(t * 10 + progress * 5) * 10;
              const y = target.y + Math.sin(angle) * length * t +
                        Math.cos(t * 10 + progress * 5) * 10;
              ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        }
      },
      timing: { delay: 0, duration: 1000, easing: 'ease-out' }
    },
    
    // Soul drain particles (move inward)
    {
      type: 'particles',
      config: {
        particles: {
          number: { value: 40 },
          color: { value: ['#4a0080', '#800080', '#2d0050'] },
          opacity: { value: 0.8, animation: { enable: true, speed: 1, minimumValue: 0 } },
          size: { value: { min: 3, max: 8 } },
          move: {
            enable: true,
            speed: 3,
            direction: 'inside',
            attract: { enable: true, rotateX: 600, rotateY: 1200 }
          }
        }
      },
      timing: { delay: 200, duration: 1000, easing: 'ease-in' }
    },
    
    // Dark aura flash
    {
      type: 'css',
      config: {
        className: 'necrotic-flash',
        keyframes: `
          0% { box-shadow: 0 0 0 0 rgba(100, 0, 150, 0.8); }
          50% { box-shadow: 0 0 30px 20px rgba(100, 0, 150, 0.4); }
          100% { box-shadow: 0 0 0 0 rgba(100, 0, 150, 0); }
        `
      },
      timing: { delay: 0, duration: 600, easing: 'ease-out' }
    }
  ],
  
  audio: { sound: '/audio/sfx/necrotic-drain.mp3', volume: 0.6 }
};
```

### 2.5 Radiant Effects

```typescript
export const RADIANT_EFFECT: VFXEffect = {
  id: 'radiant',
  category: 'spell_area',
  duration: 1500,
  loop: false,
  
  layers: [
    // Divine light beam from above
    {
      type: 'canvas',
      config: {
        draw: (ctx, progress, target) => {
          const beamHeight = 500;
          const beamWidth = 60 + progress * 40;
          const opacity = Math.sin(progress * Math.PI);
          
          // Outer glow beam
          const gradient = ctx.createLinearGradient(
            target.x, target.y - beamHeight,
            target.x, target.y + 50
          );
          gradient.addColorStop(0, 'rgba(255, 255, 200, 0)');
          gradient.addColorStop(0.3, `rgba(255, 255, 200, ${opacity * 0.3})`);
          gradient.addColorStop(0.7, `rgba(255, 215, 0, ${opacity * 0.6})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, ${opacity})`);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(target.x - beamWidth / 2, target.y - beamHeight);
          ctx.lineTo(target.x + beamWidth / 2, target.y - beamHeight);
          ctx.lineTo(target.x + beamWidth / 4, target.y + 50);
          ctx.lineTo(target.x - beamWidth / 4, target.y + 50);
          ctx.closePath();
          ctx.fill();
          
          // Inner bright core
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.beginPath();
          ctx.moveTo(target.x - beamWidth / 6, target.y - beamHeight);
          ctx.lineTo(target.x + beamWidth / 6, target.y - beamHeight);
          ctx.lineTo(target.x + beamWidth / 8, target.y + 30);
          ctx.lineTo(target.x - beamWidth / 8, target.y + 30);
          ctx.closePath();
          ctx.fill();
        }
      },
      timing: { delay: 0, duration: 1200, easing: 'ease-in-out' }
    },
    
    // Holy sparkles
    {
      type: 'particles',
      config: {
        particles: {
          number: { value: 50 },
          color: { value: ['#fff', '#ffd700', '#fffacd'] },
          shape: { type: 'star', star: { sides: 4 } },
          opacity: { value: 1, animation: { enable: true, speed: 2, minimumValue: 0 } },
          size: { value: { min: 2, max: 8 }, animation: { enable: true, speed: 5, minimumValue: 1 } },
          move: { enable: true, speed: 2, direction: 'none', random: true }
        }
      },
      timing: { delay: 200, duration: 1200, easing: 'linear' }
    },
    
    // Ground impact glow
    {
      type: 'css',
      config: {
        className: 'radiant-impact',
        keyframes: `
          0% { transform: scale(0); box-shadow: 0 0 0 0 rgba(255,215,0,1); }
          50% { transform: scale(1); box-shadow: 0 0 50px 30px rgba(255,215,0,0.5); }
          100% { transform: scale(1.5); box-shadow: 0 0 0 0 rgba(255,215,0,0); }
        `
      },
      timing: { delay: 400, duration: 800, easing: 'ease-out' }
    }
  ],
  
  audio: { sound: '/audio/sfx/divine-light.mp3', volume: 0.7 },
  flashColor: 'rgba(255, 255, 200, 0.4)'
};
```

---

## 3. Combat Impact Effects

### 3.1 Physical Damage Types

```typescript
// Slashing (swords, axes)
export const SLASH_EFFECT: VFXEffect = {
  id: 'slash',
  category: 'combat_impact',
  duration: 400,
  loop: false,
  
  layers: [
    {
      type: 'canvas',
      config: {
        draw: (ctx, progress, target, direction) => {
          const arcLength = Math.PI * 0.6;
          const radius = 60;
          const startAngle = direction - arcLength / 2;
          const currentArc = arcLength * Math.min(progress * 3, 1);
          const fade = progress > 0.3 ? 1 - (progress - 0.3) / 0.7 : 1;
          
          // Outer glow
          ctx.strokeStyle = `rgba(255, 255, 255, ${fade * 0.3})`;
          ctx.lineWidth = 15;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(target.x, target.y, radius, startAngle, startAngle + currentArc);
          ctx.stroke();
          
          // Inner bright line
          ctx.strokeStyle = `rgba(255, 255, 255, ${fade})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(target.x, target.y, radius, startAngle, startAngle + currentArc);
          ctx.stroke();
        }
      },
      timing: { delay: 0, duration: 300, easing: 'ease-out' }
    }
  ],
  audio: { sound: '/audio/sfx/sword-slash.mp3', volume: 0.6 }
};

// Piercing (arrows, daggers)
export const PIERCE_EFFECT: VFXEffect = {
  id: 'pierce',
  category: 'combat_impact',
  duration: 300,
  loop: false,
  
  layers: [
    {
      type: 'canvas',
      config: {
        draw: (ctx, progress, start, end) => {
          const fade = progress > 0.5 ? 1 - (progress - 0.5) * 2 : 1;
          const length = 80 * Math.min(progress * 4, 1);
          
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const nx = dx / dist;
          const ny = dy / dist;
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${fade})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(end.x - nx * length, end.y - ny * length);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
      },
      timing: { delay: 0, duration: 200, easing: 'ease-out' }
    },
    {
      type: 'particles',
      config: {
        particles: {
          number: { value: 8 },
          color: { value: '#fff' },
          size: { value: { min: 1, max: 3 } },
          move: { enable: true, speed: 10, direction: 'none', random: true },
          life: { duration: { value: 0.2 } }
        }
      },
      timing: { delay: 150, duration: 200, easing: 'linear' }
    }
  ],
  audio: { sound: '/audio/sfx/arrow-impact.mp3', volume: 0.5 }
};

// Bludgeoning (maces, hammers)
export const BLUDGEON_EFFECT: VFXEffect = {
  id: 'bludgeon',
  category: 'combat_impact',
  duration: 500,
  loop: false,
  
  layers: [
    {
      type: 'css',
      config: {
        className: 'bludgeon-shockwave',
        keyframes: `
          0% { transform: scale(0); border: 4px solid rgba(255,255,255,0.8); border-radius: 50%; }
          100% { transform: scale(2); border: 1px solid rgba(255,255,255,0); border-radius: 50%; }
        `
      },
      timing: { delay: 0, duration: 300, easing: 'ease-out' }
    },
    {
      type: 'particles',
      config: {
        particles: {
          number: { value: 20 },
          color: { value: ['#8b7355', '#a0522d', '#696969'] },
          shape: { type: 'polygon', polygon: { sides: 5 } },
          size: { value: { min: 3, max: 10 } },
          rotate: { value: { min: 0, max: 360 }, animation: { enable: true, speed: 20 } },
          move: {
            enable: true,
            speed: 12,
            direction: 'none',
            gravity: { enable: true, acceleration: 8 }
          },
          life: { duration: { value: 0.8 } }
        }
      },
      timing: { delay: 0, duration: 500, easing: 'linear' }
    }
  ],
  audio: { sound: '/audio/sfx/heavy-impact.mp3', volume: 0.7 },
  screenShake: { intensity: 8, duration: 200, frequency: 40 }
};
```

### 3.2 Critical Hit Effect

```typescript
export const CRITICAL_HIT_EFFECT: VFXEffect = {
  id: 'critical_hit',
  category: 'combat_critical',
  duration: 2000,
  loop: false,
  
  layers: [
    // Slow-mo dimming
    {
      type: 'css',
      config: {
        className: 'critical-slowmo',
        fullscreen: true,
        keyframes: `
          0% { backdrop-filter: brightness(1) saturate(1); }
          20% { backdrop-filter: brightness(0.5) saturate(0.5); }
          80% { backdrop-filter: brightness(0.5) saturate(0.5); }
          100% { backdrop-filter: brightness(1) saturate(1); }
        `
      },
      timing: { delay: 0, duration: 1500, easing: 'ease-in-out' }
    },
    
    // Impact flash
    {
      type: 'css',
      config: {
        className: 'critical-flash',
        fullscreen: true,
        keyframes: `
          0% { background: transparent; }
          10% { background: rgba(255, 200, 0, 0.6); }
          30% { background: transparent; }
        `
      },
      timing: { delay: 200, duration: 500, easing: 'linear' }
    },
    
    // Manga-style radial lines
    {
      type: 'canvas',
      config: {
        draw: (ctx, progress, target) => {
          const numLines = 24;
          const maxLength = 300;
          const lineProgress = Math.min(progress * 3, 1);
          const fade = progress > 0.3 ? 1 - (progress - 0.3) / 0.7 : 1;
          
          for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            const length = maxLength * lineProgress * (0.7 + Math.random() * 0.3);
            
            ctx.strokeStyle = `rgba(255, 220, 100, ${fade * 0.8})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(target.x + Math.cos(angle) * 30, target.y + Math.sin(angle) * 30);
            ctx.lineTo(target.x + Math.cos(angle) * length, target.y + Math.sin(angle) * length);
            ctx.stroke();
          }
        }
      },
      timing: { delay: 200, duration: 800, easing: 'ease-out' }
    },
    
    // "CRITICAL!" text
    {
      type: 'css',
      config: {
        className: 'critical-text',
        content: 'CRITICAL!',
        keyframes: `
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          30% { transform: scale(1.3) rotate(5deg); opacity: 1; }
          50% { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg) translateY(-50px); opacity: 0; }
        `,
        style: {
          fontFamily: 'Cinzel, serif',
          fontSize: '3rem',
          fontWeight: 'bold',
          color: '#ffd700',
          textShadow: '0 0 20px #ff6600, 0 0 40px #ff3300',
          WebkitTextStroke: '2px #8b0000'
        }
      },
      timing: { delay: 300, duration: 1500, easing: 'ease-out' }
    },
    
    // Particle explosion
    {
      type: 'particles',
      config: {
        preset: 'explosion',
        particles: {
          number: { value: 60 },
          color: { value: ['#ffd700', '#ff6600', '#fff', '#ff3300'] },
          size: { value: { min: 3, max: 12 } },
          move: { enable: true, speed: 25, direction: 'none', outModes: 'destroy' },
          life: { duration: { value: 1.5 } }
        }
      },
      timing: { delay: 200, duration: 1500, easing: 'linear' }
    }
  ],
  
  audio: { sound: '/audio/sfx/critical-hit.mp3', volume: 1.0 },
  screenShake: { intensity: 20, duration: 500, frequency: 25 },
  flashColor: 'rgba(255, 200, 0, 0.5)'
};
```

---

## 4. Buff/Debuff Auras

### 4.1 Shield Aura (Looping)
```typescript
export const SHIELD_AURA: VFXEffect = {
  id: 'shield_aura',
  category: 'spell_buff',
  duration: -1,
  loop: true,
  
  layers: [
    {
      type: 'canvas',
      config: {
        draw: (ctx, time, target) => {
          const radius = 50;
          const pulseScale = 1 + Math.sin(time * 3) * 0.05;
          const rotation = time * 0.5;
          
          ctx.save();
          ctx.translate(target.x, target.y);
          ctx.rotate(rotation);
          ctx.scale(pulseScale, pulseScale);
          
          // Hexagonal shield
          ctx.strokeStyle = 'rgba(100, 180, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
          
          // Inner glow
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
          gradient.addColorStop(0, 'rgba(100, 180, 255, 0.1)');
          gradient.addColorStop(0.7, 'rgba(100, 180, 255, 0.05)');
          gradient.addColorStop(1, 'rgba(100, 180, 255, 0.2)');
          ctx.fillStyle = gradient;
          ctx.fill();
          
          ctx.restore();
        }
      },
      timing: { delay: 0, duration: 1000, easing: 'linear' }
    },
    {
      type: 'particles',
      config: {
        particles: {
          number: { value: 6 },
          color: { value: '#64b4ff' },
          shape: { type: 'char', char: { value: ['ᚦ', 'ᚨ', 'ᚱ', 'ᛋ'] } },
          size: { value: 12 },
          opacity: { value: 0.6, animation: { enable: true, speed: 0.5, minimumValue: 0.3 } },
          move: {
            enable: true,
            speed: 0.5,
            path: { enable: true, generator: 'orbitPath', options: { radius: 60 } }
          }
        }
      },
      timing: { delay: 0, duration: 1000, easing: 'linear' }
    }
  ]
};
```

### 4.2 Poison Effect (Looping)
```typescript
export const POISON_EFFECT: VFXEffect = {
  id: 'poison',
  category: 'spell_debuff',
  duration: -1,
  loop: true,
  
  layers: [
    {
      type: 'css',
      config: {
        className: 'poison-aura',
        keyframes: `
          0%, 100% { box-shadow: 0 0 20px 10px rgba(100,200,0,0.3); filter: hue-rotate(0deg); }
          50% { box-shadow: 0 0 30px 15px rgba(150,255,0,0.4); filter: hue-rotate(10deg); }
        `
      },
      timing: { delay: 0, duration: 2000, easing: 'ease-in-out' }
    },
    {
      type: 'particles',
      config: {
        particles: {
          number: { value: 10 },
          color: { value: ['#64c800', '#96ff00', '#32cd32'] },
          size: { value: { min: 3, max: 8 } },
          opacity: { value: 0.6 },
          move: { enable: true, speed: 1, direction: 'top', random: true },
          life: { duration: { value: 2 } }
        }
      },
      timing: { delay: 0, duration: 1000, easing: 'linear' }
    }
  ]
};
```

---

## 5. VFX Manager Implementation

```typescript
// apps/web/src/vfx/VFXManager.ts

export class VFXManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private activeEffects: Map<string, ActiveEffect> = new Map();
  private audioManager: AudioManager;
  
  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'vfx-canvas';
    this.canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1000;';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    this.audioManager = new AudioManager();
    this.resizeCanvas();
    this.startRenderLoop();
  }
  
  async playEffect(effectId: string, position: Point, options?: EffectOptions): Promise<void> {
    const effect = EFFECT_LIBRARY[effectId];
    if (!effect) return;
    
    const instanceId = `${effectId}_${Date.now()}`;
    
    // Audio
    if (effect.audio) {
      this.audioManager.play(effect.audio.sound, { volume: effect.audio.volume });
    }
    
    // Screen effects
    if (effect.screenShake) this.triggerScreenShake(effect.screenShake);
    if (effect.flashColor) this.triggerFlash(effect.flashColor);
    
    // Track effect
    this.activeEffects.set(instanceId, {
      id: instanceId,
      effect,
      position,
      startTime: performance.now(),
      options
    });
    
    // Auto-remove non-looping effects
    if (!effect.loop && effect.duration > 0) {
      setTimeout(() => this.activeEffects.delete(instanceId), effect.duration);
    }
  }
  
  stopEffect(instanceId: string): void {
    this.activeEffects.delete(instanceId);
  }
  
  private startRenderLoop(): void {
    const render = (time: number) => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      for (const [id, active] of this.activeEffects) {
        const elapsed = time - active.startTime;
        const duration = active.effect.duration > 0 ? active.effect.duration : 1000;
        const progress = active.effect.loop ? (elapsed % duration) / duration : Math.min(elapsed / duration, 1);
        
        this.renderEffect(active, progress, time / 1000);
      }
      
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }
  
  private renderEffect(active: ActiveEffect, progress: number, time: number): void {
    for (const layer of active.effect.layers) {
      if (layer.type === 'canvas' && layer.config.draw) {
        layer.config.draw(this.ctx, progress, active.position, active.options?.target);
      }
    }
  }
  
  private triggerScreenShake(config: ShakeConfig): void {
    document.body.dispatchEvent(new CustomEvent('screenShake', { detail: config }));
  }
  
  private triggerFlash(color: string): void {
    document.body.dispatchEvent(new CustomEvent('screenFlash', { detail: color }));
  }
}

// Effect library
export const EFFECT_LIBRARY: Record<string, VFXEffect> = {
  fireball: FIREBALL_EFFECT,
  fire_bolt: FIRE_BOLT_EFFECT,
  lightning_bolt: LIGHTNING_BOLT_EFFECT,
  cone_of_cold: CONE_OF_COLD_EFFECT,
  necrotic: NECROTIC_EFFECT,
  radiant: RADIANT_EFFECT,
  slash: SLASH_EFFECT,
  pierce: PIERCE_EFFECT,
  bludgeon: BLUDGEON_EFFECT,
  critical_hit: CRITICAL_HIT_EFFECT,
  shield_aura: SHIELD_AURA,
  poison: POISON_EFFECT
};
```

---

## 6. Usage Example

```typescript
// In combat resolver
async function resolveSpellCast(spell: Spell, caster: Character, targets: Character[]) {
  const vfx = useVFX();
  
  // Play effect at each target
  for (const target of targets) {
    await vfx.playEffect(spell.effectId, target.position);
    
    // Damage number
    if (target.damageTaken > 0) {
      vfx.showDamageNumber(target.position, target.damageTaken, spell.damageType);
    }
  }
}
```

---

**END OF DOCUMENT 37**
