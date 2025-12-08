# D&D Digital Board Game - UI Component Specification
## For Claude Code Implementation

Version: 2.0
Purpose: Exact specifications for building immersive, animated UI components

---

## 1. TECHNOLOGY STACK FOR UI

```
Frontend Framework: Next.js 14+ (App Router)
Styling: Tailwind CSS + CSS Modules for complex animations
Animation: Framer Motion 10+
3D/WebGL: Three.js + React Three Fiber (for board renderer)
Particles: tsparticles (for magic effects)
Audio: Howler.js
Video: React Player
Icons: Lucide React + Custom SVG icons
Fonts: 
  - Display: Cinzel (Google Fonts)
  - Body: Inter (Google Fonts)  
  - Stats/Dice: JetBrains Mono (Google Fonts)
```

---

## 2. GLOBAL ANIMATION PRINCIPLES

### Timing Functions
```typescript
// framer-motion-config.ts
export const easings = {
  // For UI elements (buttons, cards)
  smooth: [0.4, 0, 0.2, 1],
  
  // For dramatic reveals (modals, pages)
  dramatic: [0.16, 1, 0.3, 1],
  
  // For bouncy feedback (dice, damage numbers)
  bounce: [0.68, -0.55, 0.265, 1.55],
  
  // For elastic effects (health bars, spell effects)
  elastic: [0.175, 0.885, 0.32, 1.275],
  
  // For combat actions
  strike: [0.55, 0.055, 0.675, 0.19],
};

export const durations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  dramatic: 0.8,
  cinematic: 1.2,
};
```

### Motion Variants
```typescript
// Standard fade + slide for most components
export const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: easings.smooth }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 }
  }
};

// Scale bounce for interactive elements
export const scaleBounce = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2, ease: easings.bounce } },
  tap: { scale: 0.95 },
};

// Glow pulse for magical/active elements
export const glowPulse = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(245, 158, 11, 0.3)',
      '0 0 40px rgba(245, 158, 11, 0.6)',
      '0 0 20px rgba(245, 158, 11, 0.3)',
    ],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
  }
};
```

---

## 3. PAGE TRANSITIONS

Every page change should feel cinematic:

```typescript
// PageTransition.tsx
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    filter: 'blur(10px)',
  },
  enter: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.1,
    }
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    filter: 'blur(5px)',
    transition: { duration: 0.3 }
  }
};

// Wrap all pages in this
export function PageTransition({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
```

---

## 4. NAVIGATION BAR

### Visual Specification
- **Height**: 72px
- **Background**: `rgba(26, 23, 32, 0.85)` with `backdrop-filter: blur(20px)`
- **Border**: 1px solid `rgba(245, 158, 11, 0.1)` (subtle gold tint)
- **Shadow**: `0 4px 30px rgba(0, 0, 0, 0.5)`

### Logo Animation
```typescript
// Logo pulses subtly, scales on hover
const logoVariants = {
  idle: {
    filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.3))',
  },
  hover: {
    scale: 1.1,
    filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.8))',
    transition: { duration: 0.3 }
  }
};
```

### Nav Link Animation
```typescript
// Underline slides in from left, text glows
const navLinkVariants = {
  rest: { 
    color: '#A1A1AA',
  },
  hover: {
    color: '#F59E0B',
    transition: { duration: 0.2 }
  },
  active: {
    color: '#F59E0B',
  }
};

// Underline bar
const underlineVariants = {
  rest: { scaleX: 0, originX: 0 },
  hover: { scaleX: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  active: { scaleX: 1 }
};
```

---

## 5. CHARACTER CARD

### Visual Specification
- **Size**: 320px × 420px
- **Border Radius**: 20px
- **Border**: 2px solid with gradient `linear-gradient(135deg, #B45309, #F59E0B, #B45309)`
- **Background**: `linear-gradient(145deg, #1E1B26 0%, #252231 50%, #1A1720 100%)`
- **Shadow (rest)**: `0 10px 40px rgba(0, 0, 0, 0.5)`
- **Shadow (hover)**: `0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(245, 158, 11, 0.2)`

### Portrait Area
- **Aspect Ratio**: 4:3
- **Contains**: Character portrait image (AI-generated or placeholder)
- **Overlay**: Gradient from transparent to card background at bottom
- **Vignette**: Subtle dark vignette around edges

### Animation Specification
```typescript
const characterCardVariants = {
  rest: {
    y: 0,
    rotateX: 0,
    rotateY: 0,
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
  },
  hover: {
    y: -12,
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6), 0 0 50px rgba(245, 158, 11, 0.15)',
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

// 3D tilt effect on mouse move
const handleMouseMove = (e, ref) => {
  const rect = ref.current.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  
  return {
    rotateY: x * 10, // Max 10 degrees
    rotateX: -y * 10,
  };
};
```

### Level Badge Animation
```typescript
// Shimmers periodically
const levelBadgeVariants = {
  animate: {
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};
// Background: linear-gradient(90deg, #F59E0B, #FBBF24, #F59E0B)
// Background-size: 200% 100%
```

### Health Bar Animation
```typescript
// Health changes animate smoothly with color transition
const healthBarVariants = {
  initial: { width: '100%' },
  animate: (percentage) => ({
    width: `${percentage}%`,
    backgroundColor: 
      percentage > 50 ? '#22C55E' :
      percentage > 25 ? '#EAB308' : '#EF4444',
    transition: {
      width: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
      backgroundColor: { duration: 0.3 }
    }
  })
};

// When damage is taken, flash red
const damageFlash = {
  animate: {
    backgroundColor: ['#EF4444', 'currentColor'],
    transition: { duration: 0.3 }
  }
};
```

---

## 6. BUTTON COMPONENTS

### Primary Button (Gold)
```typescript
// Visual
// Background: linear-gradient(180deg, #F59E0B 0%, #D97706 100%)
// Border: none
// Border-radius: 12px
// Padding: 14px 28px
// Font: 600 weight, tracking-wide
// Shadow: 0 4px 20px rgba(245, 158, 11, 0.4)

const primaryButtonVariants = {
  rest: {
    scale: 1,
    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 8px 30px rgba(245, 158, 11, 0.5)',
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.98,
    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)',
  },
  disabled: {
    opacity: 0.5,
    scale: 1,
  }
};

// Shine effect on hover
// Pseudo-element that slides across
const shineEffect = {
  rest: { x: '-100%', opacity: 0 },
  hover: { 
    x: '100%', 
    opacity: 0.3,
    transition: { duration: 0.6, ease: 'easeInOut' }
  }
};
```

### Magic/Spell Button (Purple)
```typescript
// Same structure but purple palette
// Plus: particle effect on hover (small sparkles)
// Background: linear-gradient(180deg, #8B5CF6 0%, #7C3AED 100%)
// Shadow glow: 0 0 30px rgba(139, 92, 246, 0.4)

// Sparkle particles config
const sparkleConfig = {
  particles: {
    number: { value: 6 },
    size: { value: 3 },
    move: { speed: 2, direction: 'top' },
    opacity: { value: 0.8, animation: { enable: true } },
    color: { value: ['#A78BFA', '#C4B5FD', '#FFFFFF'] },
  }
};
```

### Danger Button (Red)
```typescript
// Background: linear-gradient(180deg, #EF4444 0%, #DC2626 100%)
// Used for: Leave game, Delete, Hostile actions
```

---

## 7. MODAL/DIALOG

### Overlay
- **Background**: `rgba(0, 0, 0, 0.85)`
- **Backdrop filter**: `blur(8px)`

### Modal Container
- **Background**: `linear-gradient(180deg, #1E1B26 0%, #0F0D13 100%)`
- **Border**: 1px solid `rgba(245, 158, 11, 0.2)`
- **Border-radius**: 24px
- **Shadow**: `0 25px 80px rgba(0, 0, 0, 0.8)`

### Animation
```typescript
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2, delay: 0.1 }
  }
};

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9,
    y: 40,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 }
  }
};
```

---

## 8. DICE ROLL ANIMATION

This is a CRITICAL component for immersion.

### Visual
- 3D dice model (Three.js) OR high-quality 2D sprite animation
- Dice tumble realistically with physics
- Result number glows and scales up dramatically
- Critical hits (nat 20) trigger special celebration effect
- Critical fails (nat 1) trigger dramatic failure effect

### Animation Sequence
```typescript
const diceRollSequence = {
  // Phase 1: Anticipation (0.3s)
  anticipation: {
    scale: [1, 1.1, 0.9],
    rotate: [0, -10, 10],
    transition: { duration: 0.3 }
  },
  
  // Phase 2: Roll (1-2s)
  rolling: {
    rotate: [0, 720, 1440, 2160], // Multiple full rotations
    x: [0, 50, -30, 20, 0],
    y: [0, -100, -50, -80, 0],
    transition: { 
      duration: 1.5,
      ease: [0.25, 0.1, 0.25, 1],
    }
  },
  
  // Phase 3: Result (0.5s)
  result: {
    scale: [0.5, 1.3, 1],
    transition: {
      duration: 0.5,
      ease: [0.68, -0.55, 0.265, 1.55], // Bounce
    }
  }
};

// Result number animation
const resultVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 10,
      stiffness: 200,
    }
  }
};

// Critical hit celebration
const criticalHitEffect = {
  // Screen shake
  // Golden particle explosion
  // "CRITICAL HIT!" text with dramatic entrance
  // Sound effect: triumphant brass + dice clatter
};

// Natural 1 effect  
const criticalFailEffect = {
  // Dice cracks/shatters animation
  // Dark smoke particles
  // Dramatic low tone sound
};
```

### Sound Design
```typescript
// Audio cues (Howler.js)
const diceAudio = {
  shake: '/audio/dice-shake.mp3',      // During anticipation
  roll: '/audio/dice-roll-table.mp3',   // During roll
  land: '/audio/dice-land.mp3',         // When result shows
  critical: '/audio/critical-hit.mp3',  // Nat 20
  fail: '/audio/critical-fail.mp3',     // Nat 1
};
```

---

## 9. COMBAT LOG

### Visual
- Semi-transparent panel on right side
- Entries slide in from right
- Different colors for damage types
- Icons for action types

### Entry Animation
```typescript
const logEntryVariants = {
  hidden: { 
    opacity: 0, 
    x: 50,
    height: 0,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    height: 'auto',
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    }
  }
};

// Damage numbers pop
const damageNumberVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: [0, 1.5, 1],
    opacity: 1,
    transition: { duration: 0.4 }
  }
};
```

---

## 10. SPELL CARD

### Visual Specification
- **Size**: 260px × 380px
- **Background**: Gradient based on spell school
  - Evocation: Orange/Red gradient
  - Necromancy: Purple/Black gradient
  - Abjuration: Blue/White gradient
  - etc.
- **Border**: 2px solid, color matches school
- **Top accent**: 4px colored bar

### Hover Effect
```typescript
const spellCardVariants = {
  rest: {
    y: 0,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
  },
  hover: {
    y: -16,
    boxShadow: '0 30px 60px rgba(139, 92, 246, 0.3)',
    transition: { duration: 0.3 }
  }
};

// Magical particles float up on hover
const magicParticleConfig = {
  particles: {
    number: { value: 20 },
    size: { value: { min: 1, max: 3 } },
    move: { 
      direction: 'top',
      speed: { min: 1, max: 3 },
    },
    opacity: { 
      value: { min: 0.3, max: 0.8 },
      animation: { enable: true }
    },
    color: { value: '#A78BFA' }, // Matches spell school
  }
};
```

---

## 11. GAME BOARD (CRITICAL COMPONENT)

### Technology
- **Renderer**: PixiJS 7+ OR Three.js with React Three Fiber
- **Grid System**: Custom tile-based renderer
- **Camera**: Smooth pan/zoom with inertia

### Tile Visuals
- Each tile type has distinct texture
- Tiles have subtle ambient animation (torch flicker, water shimmer)
- Hover highlights with glow effect
- Selected tiles pulse

### Token Animation
```typescript
// Character tokens float slightly
const tokenIdleAnimation = {
  y: [0, -4, 0],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  }
};

// Movement animation
const tokenMoveAnimation = (path: Point[]) => ({
  // Smooth movement along path
  // Slight bounce on each tile
  // Footstep particles
});

// Attack animation
const tokenAttackAnimation = {
  // Lunge toward target
  // Weapon swing arc
  // Return to position
  // Duration: 0.6s
};

// Damage taken
const tokenDamageAnimation = {
  // Flash red
  // Shake
  // Damage number floats up
};

// Death animation
const tokenDeathAnimation = {
  // Fade out
  // Collapse animation
  // Soul particles rise
};
```

### Fog of War
- Smooth reveal animation as characters move
- Particles at the edge of revealed areas
- Previously seen but not currently visible areas are dimmed

### Spell Effects
```typescript
// Fireball
const fireballEffect = {
  // Projectile travels from caster to target
  // Explosion particle system at impact
  // Screen shake (subtle)
  // Affected tiles flash orange
  // Damage numbers appear on all targets
};

// Magic Missile
const magicMissileEffect = {
  // 3 glowing projectiles
  // Each curves toward its target
  // Impact sparkle
};

// Healing
const healingEffect = {
  // Green/gold particles rise from target
  // Gentle glow pulse
  // HP bar animates up
};
```

---

## 12. LOADING STATES

### Skeleton Loaders
- Shimmer effect across placeholder shapes
- Matches layout of actual content

```typescript
const shimmerVariants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    }
  }
};
// Background: linear-gradient(90deg, #1E1B26 0%, #2D2A3A 50%, #1E1B26 100%)
// Background-size: 200% 100%
```

### Page Loading
- D20 dice spinning animation
- Or: Character silhouette with pulsing glow
- Loading tips/lore displayed below

---

## 13. TOAST NOTIFICATIONS

### Visual
- Slide in from bottom-right
- Icon + message + optional action
- Auto-dismiss with progress bar

### Animation
```typescript
const toastVariants = {
  hidden: { 
    opacity: 0, 
    y: 50, 
    scale: 0.9,
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
    }
  },
  exit: { 
    opacity: 0, 
    x: 100,
    transition: { duration: 0.2 }
  }
};
```

---

## 14. MICROINTERACTIONS

These small details make the UI feel alive:

### Cursor
- Custom cursor that changes based on context
- Sword cursor when hovering attackable enemies
- Wand cursor when casting spells
- Hand cursor for interactive elements

### Sound Effects
- Button hover: subtle woosh
- Button click: satisfying click
- Card hover: paper shuffle
- Modal open: magical whoosh
- Error: low thud
- Success: chime

### Haptic Feedback (mobile)
- Light vibration on button press
- Stronger vibration on dice roll result
- Pattern vibration for critical hits

---

## 15. RESPONSIVE BEHAVIOR

### Breakpoints
```typescript
const breakpoints = {
  mobile: 640,    // < 640px
  tablet: 1024,   // 640-1024px  
  desktop: 1280,  // 1024-1280px
  wide: 1536,     // > 1536px
};
```

### Mobile Adaptations
- Bottom navigation instead of top
- Full-screen modals
- Simplified game board controls
- Touch-optimized hit areas (min 48px)
- Gesture support (pinch to zoom, swipe to pan)

---

## 16. ACCESSIBILITY

### Motion
- Respect `prefers-reduced-motion`
- Provide option to disable animations
- Essential feedback still visible without animation

### Colors
- All text meets WCAG AA contrast (4.5:1)
- Don't rely solely on color for information
- Provide colorblind-friendly palette option

### Screen Readers
- All interactive elements have labels
- Live regions for dynamic content (combat log)
- Focus management in modals

---

## 17. IMPLEMENTATION CHECKLIST FOR CLAUDE CODE

When building each component:

1. [ ] Import Framer Motion
2. [ ] Define variants object with all states
3. [ ] Apply motion.div with variants
4. [ ] Add whileHover, whileTap for interactive elements
5. [ ] Use AnimatePresence for enter/exit
6. [ ] Add sound effects where specified
7. [ ] Test reduced-motion preference
8. [ ] Ensure touch targets are 48px minimum
9. [ ] Add loading/skeleton states
10. [ ] Test on mobile viewport

---

## 18. EXAMPLE COMPONENT IMPLEMENTATION

```tsx
// CharacterCard.tsx
'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Image from 'next/image';

const cardVariants = {
  rest: {
    y: 0,
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
  },
  hover: {
    y: -12,
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6), 0 0 50px rgba(245, 158, 11, 0.15)',
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    }
  },
  tap: { scale: 0.98 }
};

const healthVariants = {
  animate: (percent: number) => ({
    width: `${percent}%`,
    backgroundColor: percent > 50 ? '#22C55E' : percent > 25 ? '#EAB308' : '#EF4444',
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  })
};

interface CharacterCardProps {
  name: string;
  race: string;
  class: string;
  level: number;
  currentHp: number;
  maxHp: number;
  portraitUrl: string;
}

export function CharacterCard({ 
  name, race, class: charClass, level, currentHp, maxHp, portraitUrl 
}: CharacterCardProps) {
  const healthPercent = (currentHp / maxHp) * 100;
  
  return (
    <motion.div
      className="relative w-80 rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(145deg, #1E1B26 0%, #252231 50%, #1A1720 100%)',
        border: '2px solid',
        borderImage: 'linear-gradient(135deg, #B45309, #F59E0B, #B45309) 1',
      }}
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      {/* Portrait */}
      <div className="relative aspect-[4/3] bg-surface-medium">
        <Image
          src={portraitUrl}
          alt={name}
          fill
          className="object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1E1B26] to-transparent" />
        
        {/* Level badge */}
        <motion.div
          className="absolute top-3 right-3 px-3 py-1 rounded-full font-bold text-sm"
          style={{
            background: 'linear-gradient(90deg, #F59E0B, #FBBF24, #F59E0B)',
            backgroundSize: '200% 100%',
            color: '#0F0D13',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Lvl {level}
        </motion.div>
      </div>
      
      {/* Info */}
      <div className="p-5">
        <h3 className="font-cinzel text-xl text-text-primary mb-1">{name}</h3>
        <p className="text-text-secondary text-sm">{race} {charClass}</p>
        
        {/* Health bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-muted">HP</span>
            <span className="font-mono text-text-primary">{currentHp}/{maxHp}</span>
          </div>
          <div className="h-2 bg-[#1C1917] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              variants={healthVariants}
              animate="animate"
              custom={healthPercent}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

---

# END OF UI COMPONENT SPECIFICATION
