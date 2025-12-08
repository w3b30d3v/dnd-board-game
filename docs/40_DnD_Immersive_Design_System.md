# Document 40: D&D Immersive Design System

## The Problem With Current Designs

Current designs look like "a dark-mode app with gold accents." They're missing:
- **Texture** - Real D&D feels like aged parchment, worn leather, carved stone
- **Depth** - Layers upon layers of visual richness
- **Magic** - Glowing runes, floating particles, ethereal effects
- **Weight** - Heavy borders, embossed elements, dimensional shadows
- **Life** - Subtle animations everywhere, nothing is static

## The D&D Visual Philosophy

Every screen should feel like you're:
1. **Looking at an enchanted artifact** - Not using an app
2. **In a candlelit tavern** - Warm, flickering, atmospheric
3. **Holding an ancient tome** - Textured, weathered, valuable
4. **Surrounded by magic** - Particles, glows, subtle movements

---

# PART 1: FOUNDATIONAL TEXTURES

## 1.1 Background Layers (Every Page)

Every page needs MULTIPLE background layers, not just a solid color:

```css
/* BASE LAYER - Never use flat colors */
.app-background {
  /* Layer 1: Deep base */
  background-color: #0a0810;
  
  /* Layer 2: Subtle noise texture */
  background-image: 
    url('/textures/noise-subtle.png'),
    /* Layer 3: Vignette from edges */
    radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%),
    /* Layer 4: Subtle stone/parchment texture */
    url('/textures/dark-stone.jpg');
  
  background-blend-mode: overlay, normal, soft-light;
  background-size: 200px 200px, cover, cover;
}

/* Animated magical atmosphere */
.app-background::before {
  content: '';
  position: fixed;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.03) 0%, transparent 50%);
  animation: atmosphere-shift 20s ease-in-out infinite;
  pointer-events: none;
}

@keyframes atmosphere-shift {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## 1.2 Texture Assets Required

Create/obtain these textures (or generate via CSS patterns):

```typescript
const REQUIRED_TEXTURES = {
  // Backgrounds
  'dark-stone.jpg': 'Subtle dark stone texture, barely visible',
  'parchment-dark.jpg': 'Aged parchment, very dark, for panels',
  'leather-worn.jpg': 'Worn leather texture for cards',
  'wood-grain-dark.jpg': 'Dark wood for containers',
  
  // Overlays
  'noise-subtle.png': '128x128 noise, 2% opacity when used',
  'vignette.png': 'Radial dark edges',
  'scratches.png': 'Subtle scratches/wear marks',
  'dust-particles.png': 'For floating particle effects',
  
  // Decorative
  'border-celtic.svg': 'Celtic knot border pattern',
  'corner-flourish.svg': 'Ornate corner decorations',
  'divider-pointed.svg': 'Pointed decorative divider',
  'frame-ornate.svg': 'Full ornate frame for important items',
};
```

## 1.3 CSS Texture Fallbacks (No Images Needed)

```css
/* Noise texture via SVG data URI */
.noise-texture {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
  opacity: 0.03;
}

/* Parchment texture via gradients */
.parchment-texture {
  background: 
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(139, 92, 246, 0.01) 2px,
      rgba(139, 92, 246, 0.01) 4px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(245, 158, 11, 0.01) 2px,
      rgba(245, 158, 11, 0.01) 4px
    ),
    linear-gradient(
      135deg,
      rgba(30, 27, 38, 1) 0%,
      rgba(26, 23, 32, 1) 50%,
      rgba(30, 27, 38, 1) 100%
    );
}

/* Stone texture via gradients */
.stone-texture {
  background:
    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.02) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(0,0,0,0.1) 0%, transparent 50%),
    linear-gradient(135deg, #1a1720 0%, #0f0d13 100%);
}
```

---

# PART 2: BORDERS & FRAMES

## 2.1 The D&D Border System

Never use plain `border: 1px solid`. Always use layered, dimensional borders:

```css
/* STANDARD CARD BORDER */
.dnd-border {
  position: relative;
  border: 1px solid rgba(180, 83, 9, 0.3); /* Subtle gold base */
  
  /* Inner glow */
  box-shadow: 
    inset 0 0 20px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  
  /* Outer dimension */
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border: 1px solid rgba(180, 83, 9, 0.1);
    border-radius: inherit;
    pointer-events: none;
  }
}

/* ORNATE BORDER - For important elements */
.dnd-border-ornate {
  position: relative;
  border: 2px solid;
  border-image: linear-gradient(
    135deg,
    #78350F 0%,
    #F59E0B 25%,
    #FCD34D 50%,
    #F59E0B 75%,
    #78350F 100%
  ) 1;
  
  /* Corner accents */
  &::before, &::after {
    content: '◆';
    position: absolute;
    color: #F59E0B;
    font-size: 0.75rem;
    text-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
  }
  &::before { top: -0.375rem; left: -0.375rem; }
  &::after { bottom: -0.375rem; right: -0.375rem; }
}

/* GLOWING BORDER - For magical/active elements */
.dnd-border-glow {
  border: 1px solid rgba(139, 92, 246, 0.5);
  box-shadow:
    0 0 10px rgba(139, 92, 246, 0.3),
    0 0 20px rgba(139, 92, 246, 0.1),
    inset 0 0 10px rgba(139, 92, 246, 0.1);
  animation: border-pulse 3s ease-in-out infinite;
}

@keyframes border-pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.1); }
  50% { box-shadow: 0 0 15px rgba(139, 92, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.2); }
}
```

## 2.2 Corner Decorations

```tsx
// Ornate corner component
function OrnateCorners({ variant = 'gold' }: { variant?: 'gold' | 'purple' | 'silver' }) {
  const colors = {
    gold: '#F59E0B',
    purple: '#8B5CF6',
    silver: '#A1A1AA'
  };
  
  return (
    <>
      {/* Top Left */}
      <svg className="corner corner-tl" width="24" height="24" viewBox="0 0 24 24">
        <path 
          d="M2 22 L2 8 Q2 2 8 2 L22 2" 
          fill="none" 
          stroke={colors[variant]} 
          strokeWidth="1.5"
          filter="url(#glow)"
        />
        <circle cx="2" cy="22" r="2" fill={colors[variant]} />
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
      </svg>
      {/* ... other corners */}
    </>
  );
}
```

---

# PART 3: CARDS & PANELS

## 3.1 The Enchanted Card

Every card should look like a magical artifact:

```css
.enchanted-card {
  position: relative;
  background: 
    /* Subtle inner texture */
    radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.03) 0%, transparent 50%),
    /* Base gradient */
    linear-gradient(180deg, 
      rgba(30, 27, 38, 0.95) 0%, 
      rgba(26, 23, 32, 0.98) 100%
    );
  
  /* Dimensional border */
  border: 1px solid rgba(180, 83, 9, 0.2);
  border-top-color: rgba(180, 83, 9, 0.3);
  border-bottom-color: rgba(180, 83, 9, 0.1);
  
  border-radius: 12px;
  
  /* The shadow layers create depth */
  box-shadow:
    /* Outer shadow - makes it float */
    0 4px 24px rgba(0, 0, 0, 0.4),
    0 8px 48px rgba(0, 0, 0, 0.2),
    /* Inner highlight - top edge catch light */
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    /* Inner shadow - creates depth */
    inset 0 -2px 8px rgba(0, 0, 0, 0.2);
  
  /* Subtle backdrop for extra richness */
  backdrop-filter: blur(8px);
  
  overflow: hidden;
}

/* Top glow effect */
.enchanted-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(245, 158, 11, 0.3) 50%,
    transparent 100%
  );
}

/* Hover state - more magical */
.enchanted-card:hover {
  border-color: rgba(180, 83, 9, 0.4);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 12px 64px rgba(0, 0, 0, 0.25),
    0 0 30px rgba(245, 158, 11, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -2px 8px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
  transition: all 0.3s ease;
}
```

## 3.2 Card Variants

```tsx
const CARD_VARIANTS = {
  default: {
    background: 'linear-gradient(180deg, rgba(30,27,38,0.95), rgba(26,23,32,0.98))',
    borderColor: 'rgba(180, 83, 9, 0.2)',
    glowColor: 'rgba(245, 158, 11, 0.1)'
  },
  
  magical: {
    background: 'linear-gradient(180deg, rgba(91,33,182,0.1), rgba(26,23,32,0.98))',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    glowColor: 'rgba(139, 92, 246, 0.2)'
  },
  
  legendary: {
    background: `
      radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
      linear-gradient(180deg, rgba(120,53,15,0.2), rgba(26,23,32,0.98))
    `,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    glowColor: 'rgba(245, 158, 11, 0.3)'
  },
  
  danger: {
    background: 'linear-gradient(180deg, rgba(127,29,29,0.2), rgba(26,23,32,0.98))',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    glowColor: 'rgba(239, 68, 68, 0.2)'
  },

  divine: {
    background: `
      radial-gradient(circle at 50% -20%, rgba(254, 240, 138, 0.15) 0%, transparent 50%),
      linear-gradient(180deg, rgba(30,27,38,0.9), rgba(26,23,32,0.98))
    `,
    borderColor: 'rgba(254, 240, 138, 0.3)',
    glowColor: 'rgba(254, 240, 138, 0.2)'
  }
};
```

---

# PART 4: TYPOGRAPHY WITH CHARACTER

## 4.1 Enchanted Headings

Never use plain text for headings:

```css
/* Main headings - The Epic Title */
.dnd-heading-epic {
  font-family: 'Cinzel Decorative', 'Cinzel', serif;
  font-weight: 700;
  color: #F4F4F5;
  text-shadow:
    /* Main shadow for depth */
    0 2px 4px rgba(0, 0, 0, 0.8),
    /* Subtle gold underglow */
    0 0 30px rgba(245, 158, 11, 0.2),
    /* Text edge highlight */
    0 -1px 0 rgba(255, 255, 255, 0.1);
  letter-spacing: 0.05em;
  
  /* Gradient text for extra richness */
  background: linear-gradient(
    180deg,
    #FFFFFF 0%,
    #F4F4F5 40%,
    #D4D4D8 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  /* Add underline flourish */
  position: relative;
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(245, 158, 11, 0.5) 20%,
      rgba(245, 158, 11, 0.8) 50%,
      rgba(245, 158, 11, 0.5) 80%,
      transparent 100%
    );
  }
}

/* Section headings - Elegant but readable */
.dnd-heading-section {
  font-family: 'Cinzel', serif;
  font-weight: 600;
  color: #F59E0B;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.02em;
  border-bottom: 1px solid rgba(245, 158, 11, 0.2);
  padding-bottom: 0.5rem;
}

/* Rune-styled numbers */
.dnd-number {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  color: #FBBF24;
  text-shadow: 
    0 0 10px rgba(251, 191, 36, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Mystical flavor text */
.dnd-flavor {
  font-family: 'Crimson Text', 'Georgia', serif;
  font-style: italic;
  color: #A1A1AA;
  border-left: 2px solid rgba(139, 92, 246, 0.3);
  padding-left: 1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
```

## 4.2 Animated Text Effects

```css
/* Glowing text - for magical items, spell names */
.text-glow {
  animation: text-glow-pulse 2s ease-in-out infinite;
}

@keyframes text-glow-pulse {
  0%, 100% { text-shadow: 0 0 10px currentColor, 0 0 20px currentColor; }
  50% { text-shadow: 0 0 15px currentColor, 0 0 30px currentColor, 0 0 40px currentColor; }
}

/* Reveal text - for dramatic moments */
.text-reveal {
  background: linear-gradient(
    90deg,
    #F59E0B 0%,
    #FBBF24 50%,
    #F59E0B 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: text-reveal 3s ease-in-out infinite;
}

@keyframes text-reveal {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}
```

---

# PART 5: BUTTONS THAT FEEL POWERFUL

## 5.1 Primary Action Button (Call to Adventure)

```css
.btn-adventure {
  position: relative;
  padding: 1rem 2.5rem;
  font-family: 'Cinzel', serif;
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #0F0D13;
  
  /* Rich gradient background */
  background: linear-gradient(
    180deg,
    #FCD34D 0%,
    #F59E0B 30%,
    #D97706 70%,
    #B45309 100%
  );
  
  /* Dimensional border */
  border: none;
  border-radius: 8px;
  
  /* The magic is in the shadows */
  box-shadow:
    /* Outer glow */
    0 0 20px rgba(245, 158, 11, 0.4),
    /* Drop shadow */
    0 4px 16px rgba(0, 0, 0, 0.4),
    /* Inner top highlight */
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    /* Inner bottom shadow */
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

/* Animated shine effect */
.btn-adventure::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 70%
  );
  transform: rotate(45deg) translateX(-100%);
  transition: transform 0.6s ease;
}

.btn-adventure:hover::before {
  transform: rotate(45deg) translateX(100%);
}

.btn-adventure:hover {
  transform: translateY(-2px);
  box-shadow:
    0 0 30px rgba(245, 158, 11, 0.6),
    0 8px 24px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
}

.btn-adventure:active {
  transform: translateY(1px);
  box-shadow:
    0 0 15px rgba(245, 158, 11, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(0, 0, 0, 0.2);
}
```

## 5.2 Secondary Button (Stone Tablet Feel)

```css
.btn-stone {
  position: relative;
  padding: 0.875rem 2rem;
  font-family: 'Cinzel', serif;
  font-weight: 500;
  color: #F4F4F5;
  
  /* Stone-like gradient */
  background: linear-gradient(
    180deg,
    #3F3F46 0%,
    #27272A 50%,
    #18181B 100%
  );
  
  border: 1px solid rgba(180, 83, 9, 0.3);
  border-radius: 6px;
  
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-stone:hover {
  border-color: rgba(180, 83, 9, 0.5);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(245, 158, 11, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  background: linear-gradient(
    180deg,
    #52525B 0%,
    #3F3F46 50%,
    #27272A 100%
  );
}
```

## 5.3 Magical Action Button

```css
.btn-magic {
  position: relative;
  padding: 0.875rem 2rem;
  font-family: 'Cinzel', serif;
  font-weight: 500;
  color: #F4F4F5;
  background: linear-gradient(
    180deg,
    rgba(139, 92, 246, 0.3) 0%,
    rgba(91, 33, 182, 0.4) 100%
  );
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 6px;
  overflow: hidden;
  
  box-shadow:
    0 0 20px rgba(139, 92, 246, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Animated magic particles inside button */
.btn-magic::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(139, 92, 246, 0.3) 1px, transparent 1px);
  background-size: 20px 20px;
  animation: magic-particles 20s linear infinite;
  opacity: 0.5;
}

@keyframes magic-particles {
  0% { background-position: 0 0; }
  100% { background-position: 400px 400px; }
}
```

---

# PART 6: AMBIENT PARTICLES & EFFECTS

## 6.1 Floating Dust Particles (Every Page)

```tsx
// components/AmbientParticles.tsx
import { useCallback } from 'react';
import Particles from 'react-particles';
import { loadFull } from 'tsparticles';

export function AmbientParticles({ variant = 'dust' }: { variant?: 'dust' | 'magic' | 'embers' }) {
  const particlesInit = useCallback(async (engine: any) => {
    await loadFull(engine);
  }, []);

  const configs = {
    dust: {
      particles: {
        number: { value: 30, density: { enable: true, area: 800 } },
        color: { value: '#F59E0B' },
        opacity: { value: 0.2, random: { enable: true, minimumValue: 0.05 } },
        size: { value: 2, random: { enable: true, minimumValue: 0.5 } },
        move: {
          enable: true,
          speed: 0.3,
          direction: 'top' as const,
          random: true,
          straight: false,
          outModes: { default: 'out' as const }
        }
      }
    },
    magic: {
      particles: {
        number: { value: 20 },
        color: { value: ['#8B5CF6', '#A78BFA', '#C4B5FD'] },
        opacity: { value: 0.4, random: true },
        size: { value: 3, random: true },
        move: {
          enable: true,
          speed: 1,
          direction: 'none' as const,
          random: true,
          outModes: { default: 'bounce' as const }
        },
        twinkle: {
          particles: { enable: true, frequency: 0.05, opacity: 1 }
        }
      }
    },
    embers: {
      particles: {
        number: { value: 40 },
        color: { value: ['#F97316', '#FBBF24', '#EF4444'] },
        opacity: { value: 0.6, random: true },
        size: { value: 2, random: true },
        move: {
          enable: true,
          speed: 2,
          direction: 'top' as const,
          random: true
        },
        life: {
          duration: { value: 2 },
          count: 1
        }
      }
    }
  };

  return (
    <Particles
      className="ambient-particles"
      init={particlesInit}
      options={{
        fullScreen: false,
        background: { color: 'transparent' },
        fpsLimit: 30,
        ...configs[variant]
      }}
    />
  );
}
```

## 6.2 Torch Flicker Effect

```css
/* Apply to any element that should flicker like firelight */
.torch-flicker {
  animation: torch-flicker 0.1s infinite;
}

@keyframes torch-flicker {
  0%, 100% { opacity: 1; filter: brightness(1); }
  25% { opacity: 0.98; filter: brightness(0.98); }
  50% { opacity: 0.95; filter: brightness(1.02); }
  75% { opacity: 0.97; filter: brightness(0.99); }
}

/* Firelight color shift on nearby elements */
.firelight-ambient {
  animation: firelight 4s ease-in-out infinite;
}

@keyframes firelight {
  0%, 100% { 
    filter: hue-rotate(0deg) brightness(1);
    box-shadow: 0 0 30px rgba(245, 158, 11, 0.1);
  }
  33% { 
    filter: hue-rotate(-5deg) brightness(1.02);
    box-shadow: 0 0 35px rgba(249, 115, 22, 0.15);
  }
  66% { 
    filter: hue-rotate(5deg) brightness(0.98);
    box-shadow: 0 0 25px rgba(234, 88, 12, 0.1);
  }
}
```

## 6.3 Magical Rune Glow

```tsx
// Animated glowing rune that appears on magical elements
function GlowingRune({ symbol = '᚛', color = '#8B5CF6' }) {
  return (
    <span 
      className="glowing-rune"
      style={{
        color,
        textShadow: `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}`,
        animation: 'rune-pulse 2s ease-in-out infinite',
        fontFamily: 'serif',
        fontSize: '1.5em'
      }}
    >
      {symbol}
    </span>
  );
}
```

---

# PART 7: INTERACTIVE ELEMENTS

## 7.1 Hoverable Items with Magic

```css
/* Any clickable card/item */
.magic-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.magic-hover:hover {
  transform: translateY(-4px) scale(1.02);
  
  /* Add magical glow on hover */
  &::after {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(
      45deg,
      rgba(245, 158, 11, 0.2) 0%,
      rgba(139, 92, 246, 0.2) 50%,
      rgba(245, 158, 11, 0.2) 100%
    );
    border-radius: inherit;
    z-index: -1;
    animation: magic-border-rotate 3s linear infinite;
    filter: blur(8px);
  }
}

@keyframes magic-border-rotate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

## 7.2 Selection/Active States

```css
/* When something is selected - show it's empowered */
.item-selected {
  border-color: #F59E0B !important;
  box-shadow:
    0 0 0 2px rgba(245, 158, 11, 0.3),
    0 0 30px rgba(245, 158, 11, 0.2),
    inset 0 0 20px rgba(245, 158, 11, 0.05);
  
  /* Animated selection ring */
  &::before {
    content: '';
    position: absolute;
    inset: -4px;
    border: 2px solid transparent;
    border-radius: inherit;
    background: linear-gradient(90deg, #F59E0B, #8B5CF6, #F59E0B) border-box;
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    animation: selection-rotate 2s linear infinite;
  }
}

@keyframes selection-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

# PART 8: PAGE TRANSITIONS

## 8.1 Mystical Page Transition

```tsx
// components/PageTransition.tsx
import { motion, AnimatePresence } from 'framer-motion';

export function PageTransition({ children, key }: { children: React.ReactNode; key: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Magical overlay during transition */}
        <motion.div
          className="transition-overlay"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(15,13,19,1) 70%)',
            transformOrigin: 'top',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

## 8.2 Component Entry Animations

```tsx
// Every component should animate in
export const entryVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
    filter: 'blur(4px)'
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// For lists - stagger children
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

// Usage:
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={entryVariants}>
      <Card {...item} />
    </motion.div>
  ))}
</motion.div>
```

---

# PART 9: COMPLETE PAGE TEMPLATE

## 9.1 Standard D&D Page Structure

```tsx
// Every page should follow this structure
export function DNDPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="dnd-page">
      {/* Layer 1: Textured background */}
      <div className="page-background" />
      
      {/* Layer 2: Ambient particles */}
      <AmbientParticles variant="dust" />
      
      {/* Layer 3: Vignette overlay */}
      <div className="page-vignette" />
      
      {/* Layer 4: Content */}
      <motion.main 
        className="page-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Ornate header */}
        <header className="page-header">
          <OrnateCorners variant="gold" />
          <h1 className="dnd-heading-epic">{title}</h1>
        </header>
        
        {/* Main content area */}
        <div className="page-body">
          {children}
        </div>
      </motion.main>
      
      {/* Layer 5: Ambient audio (optional) */}
      <AmbientAudio scene="tavern" />
    </div>
  );
}
```

```css
.dnd-page {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.page-background {
  position: fixed;
  inset: 0;
  background: 
    /* Noise */
    url('/textures/noise.png'),
    /* Vignette */
    radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%),
    /* Base gradient */
    radial-gradient(circle at 30% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 40%),
    radial-gradient(circle at 70% 80%, rgba(245, 158, 11, 0.05) 0%, transparent 40%),
    /* Base color */
    #0a0810;
  z-index: 0;
}

.page-vignette {
  position: fixed;
  inset: 0;
  box-shadow: inset 0 0 150px 50px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  z-index: 1;
}

.page-content {
  position: relative;
  z-index: 2;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  position: relative;
  text-align: center;
  padding: 2rem;
  margin-bottom: 2rem;
}
```

---

# PART 10: COMPLETE INTERACTIVE PROTOTYPE

The following is a complete HTML file demonstrating ALL these principles:

```html
<!-- See the companion file: 40_immersive_prototype.html -->
```

---

## Summary: The D&D Immersion Checklist

For EVERY screen, verify:

- [ ] **Background has 3+ layers** (texture, gradient, vignette)
- [ ] **Floating particles are present** (dust, embers, or magic)
- [ ] **Borders are dimensional** (multiple shadows, gradient borders)
- [ ] **Cards have depth** (inner glow, outer shadow, texture)
- [ ] **Headings use Cinzel font** with text shadows
- [ ] **Gold accents appear** on interactive elements
- [ ] **Hover states add magical glow**
- [ ] **Elements animate in** (fade + slide + scale)
- [ ] **Nothing is static** (subtle animations everywhere)
- [ ] **Audio ambience plays** (optional but powerful)

**If a screen doesn't feel like you're looking at a magical artifact in a candlelit room, it's not done.**

---

**END OF DOCUMENT 40**
