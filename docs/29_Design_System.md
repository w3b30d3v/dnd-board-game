# Document 29: Design System & Visual Specifications

## Overview

This design system defines the visual language for the D&D Digital Board Game platform. It provides exact values for colors, typography, spacing, shadows, animations, and component styling that Claude Code must use when generating UI.

**Design Philosophy**: Dark fantasy aesthetic inspired by candlelit taverns, ancient tomes, and magical artifacts. The UI should feel like an enchanted interface - mysterious yet readable, dramatic yet functional.

---

## 1. Color Palette

### 1.1 Core Colors

```css
:root {
  /* Primary - Gold/Amber (Magic, Action, Important) */
  --primary-50: #FFFBEB;
  --primary-100: #FEF3C7;
  --primary-200: #FDE68A;
  --primary-300: #FCD34D;
  --primary-400: #FBBF24;
  --primary-500: #F59E0B;  /* Main primary */
  --primary-600: #D97706;
  --primary-700: #B45309;
  --primary-800: #92400E;
  --primary-900: #78350F;

  /* Secondary - Deep Purple (Mystery, Magic) */
  --secondary-50: #F5F3FF;
  --secondary-100: #EDE9FE;
  --secondary-200: #DDD6FE;
  --secondary-300: #C4B5FD;
  --secondary-400: #A78BFA;
  --secondary-500: #8B5CF6;  /* Main secondary */
  --secondary-600: #7C3AED;
  --secondary-700: #6D28D9;
  --secondary-800: #5B21B6;
  --secondary-900: #4C1D95;

  /* Background - Dark slate/charcoal */
  --bg-primary: #0F0D13;     /* Darkest - main background */
  --bg-secondary: #1A1720;   /* Cards, panels */
  --bg-tertiary: #252231;    /* Elevated elements */
  --bg-hover: #2D2A3A;       /* Hover states */
  --bg-active: #383451;      /* Active/selected states */

  /* Surface - For cards and containers */
  --surface-dark: #1E1B26;
  --surface-medium: #2A2735;
  --surface-light: #363342;

  /* Text */
  --text-primary: #F4F4F5;    /* Main text - off-white */
  --text-secondary: #A1A1AA;  /* Secondary text - gray */
  --text-muted: #71717A;      /* Muted/disabled text */
  --text-inverse: #18181B;    /* Text on light backgrounds */

  /* Borders */
  --border-subtle: #27272A;
  --border-default: #3F3F46;
  --border-strong: #52525B;
  --border-gold: #B45309;     /* Accent borders */
}
```

### 1.2 Semantic Colors

```css
:root {
  /* Status Colors */
  --success: #22C55E;         /* Healing, buffs, success */
  --success-bg: #14532D;
  --warning: #EAB308;         /* Caution, low resources */
  --warning-bg: #713F12;
  --error: #EF4444;           /* Damage, danger, errors */
  --error-bg: #7F1D1D;
  --info: #3B82F6;            /* Information, links */
  --info-bg: #1E3A5F;

  /* Damage Type Colors */
  --damage-fire: #F97316;
  --damage-cold: #06B6D4;
  --damage-lightning: #FACC15;
  --damage-acid: #84CC16;
  --damage-poison: #A3E635;
  --damage-necrotic: #6B21A8;
  --damage-radiant: #FEF08A;
  --damage-force: #EC4899;
  --damage-psychic: #D946EF;
  --damage-thunder: #8B5CF6;
  --damage-bludgeoning: #78716C;
  --damage-piercing: #A8A29E;
  --damage-slashing: #D6D3D1;

  /* Class Colors */
  --class-barbarian: #E11D48;
  --class-bard: #D946EF;
  --class-cleric: #F4F4F5;
  --class-druid: #22C55E;
  --class-fighter: #92400E;
  --class-monk: #06B6D4;
  --class-paladin: #FDE68A;
  --class-ranger: #16A34A;
  --class-rogue: #3F3F46;
  --class-sorcerer: #DC2626;
  --class-warlock: #7C3AED;
  --class-wizard: #2563EB;

  /* Health Bar */
  --health-full: #22C55E;
  --health-high: #84CC16;
  --health-medium: #EAB308;
  --health-low: #F97316;
  --health-critical: #EF4444;
  --health-bg: #1C1917;
}
```

### 1.3 Gradients

```css
:root {
  /* Background gradients */
  --gradient-dark: linear-gradient(180deg, #0F0D13 0%, #1A1720 100%);
  --gradient-card: linear-gradient(135deg, #1E1B26 0%, #252231 100%);
  --gradient-gold: linear-gradient(135deg, #B45309 0%, #F59E0B 50%, #FCD34D 100%);
  --gradient-magic: linear-gradient(135deg, #6D28D9 0%, #8B5CF6 50%, #A78BFA 100%);
  
  /* Button gradients */
  --gradient-button-primary: linear-gradient(180deg, #F59E0B 0%, #D97706 100%);
  --gradient-button-secondary: linear-gradient(180deg, #8B5CF6 0%, #6D28D9 100%);
  
  /* Overlay gradients */
  --gradient-fade-up: linear-gradient(0deg, rgba(15,13,19,1) 0%, rgba(15,13,19,0) 100%);
  --gradient-fade-down: linear-gradient(180deg, rgba(15,13,19,1) 0%, rgba(15,13,19,0) 100%);
  --gradient-vignette: radial-gradient(ellipse at center, transparent 0%, rgba(15,13,19,0.8) 100%);
}
```

---

## 2. Typography

### 2.1 Font Families

```css
:root {
  /* Display - for headers, titles, dramatic text */
  --font-display: 'Cinzel', 'Times New Roman', serif;
  
  /* Body - for readable content */
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Mono - for dice rolls, stats, code */
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

**Font Loading (add to HTML head):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 2.2 Type Scale

```css
:root {
  /* Font sizes */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */
  --text-6xl: 3.75rem;     /* 60px */

  /* Line heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Letter spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;
}
```

### 2.3 Typography Classes

```css
/* Display Headers - Use Cinzel */
.heading-hero {
  font-family: var(--font-display);
  font-size: var(--text-6xl);
  font-weight: 700;
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.heading-1 {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: 600;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-wide);
}

.heading-2 {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-normal);
}

.heading-3 {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 500;
  line-height: var(--leading-snug);
}

/* Body Text - Use Inter */
.body-large {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
}

.body-base {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}

.body-small {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

/* Labels & Captions */
.label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.caption {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Stats & Numbers - Use Mono */
.stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: 700;
}

.dice-result {
  font-family: var(--font-mono);
  font-size: var(--text-4xl);
  font-weight: 700;
}
```

---

## 3. Spacing System

### 3.1 Base Spacing Scale

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
}
```

### 3.2 Component Spacing

```css
:root {
  /* Padding inside components */
  --padding-button: var(--space-3) var(--space-5);
  --padding-button-sm: var(--space-2) var(--space-3);
  --padding-button-lg: var(--space-4) var(--space-8);
  --padding-card: var(--space-6);
  --padding-card-compact: var(--space-4);
  --padding-input: var(--space-3) var(--space-4);
  --padding-modal: var(--space-8);

  /* Gaps between items */
  --gap-xs: var(--space-1);
  --gap-sm: var(--space-2);
  --gap-md: var(--space-4);
  --gap-lg: var(--space-6);
  --gap-xl: var(--space-8);

  /* Section spacing */
  --section-gap: var(--space-16);
}
```

---

## 4. Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;    /* 4px - subtle rounding */
  --radius-md: 0.5rem;     /* 8px - buttons, inputs */
  --radius-lg: 0.75rem;    /* 12px - cards */
  --radius-xl: 1rem;       /* 16px - modals */
  --radius-2xl: 1.5rem;    /* 24px - large containers */
  --radius-full: 9999px;   /* Pills, avatars */
}
```

---

## 5. Shadows & Elevation

```css
:root {
  /* Subtle shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
  
  /* Glow effects */
  --glow-gold: 0 0 20px rgba(245, 158, 11, 0.3);
  --glow-gold-strong: 0 0 30px rgba(245, 158, 11, 0.5);
  --glow-purple: 0 0 20px rgba(139, 92, 246, 0.3);
  --glow-purple-strong: 0 0 30px rgba(139, 92, 246, 0.5);
  --glow-health: 0 0 10px rgba(34, 197, 94, 0.4);
  --glow-damage: 0 0 10px rgba(239, 68, 68, 0.4);

  /* Inner shadows */
  --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.4);
  --shadow-inner-lg: inset 0 4px 8px rgba(0, 0, 0, 0.5);
}
```

---

## 6. Animations & Transitions

### 6.1 Timing Functions

```css
:root {
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
}
```

### 6.2 Duration

```css
:root {
  --duration-instant: 50ms;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-slower: 700ms;
}
```

### 6.3 Common Transitions

```css
/* Button hover */
.transition-button {
  transition: all var(--duration-fast) var(--ease-default);
}

/* Card hover */
.transition-card {
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out);
}

/* Fade in/out */
.transition-fade {
  transition: opacity var(--duration-normal) var(--ease-default);
}

/* Scale effects */
.transition-scale {
  transition: transform var(--duration-fast) var(--ease-bounce);
}
```

### 6.4 Keyframe Animations

```css
/* Dice roll */
@keyframes dice-roll {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(90deg) scale(1.1); }
  50% { transform: rotate(180deg) scale(1); }
  75% { transform: rotate(270deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}

/* Pulse glow for active/selected */
@keyframes pulse-glow {
  0%, 100% { box-shadow: var(--glow-gold); }
  50% { box-shadow: var(--glow-gold-strong); }
}

/* Float animation for tokens */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* Shimmer for loading */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Damage flash */
@keyframes damage-flash {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.5) saturate(1.5); }
}

/* Healing pulse */
@keyframes heal-pulse {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

/* Slide in from bottom */
@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Fade in */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Scale in */
@keyframes scale-in {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

---

## 7. Component Specifications

### 7.1 Buttons

```tsx
// Primary Button (Gold) - Main actions
<button className="
  bg-gradient-to-b from-primary-500 to-primary-600
  hover:from-primary-400 hover:to-primary-500
  active:from-primary-600 active:to-primary-700
  text-bg-primary font-semibold
  px-5 py-3 rounded-md
  shadow-md hover:shadow-lg
  transition-all duration-150
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Roll Attack
</button>

// Secondary Button (Purple) - Secondary actions
<button className="
  bg-gradient-to-b from-secondary-500 to-secondary-600
  hover:from-secondary-400 hover:to-secondary-500
  text-white font-semibold
  px-5 py-3 rounded-md
  shadow-md hover:shadow-lg
  transition-all duration-150
">
  Cast Spell
</button>

// Ghost Button - Tertiary actions
<button className="
  bg-transparent
  border border-border-default
  hover:bg-bg-hover hover:border-border-strong
  text-text-primary font-medium
  px-5 py-3 rounded-md
  transition-all duration-150
">
  Cancel
</button>

// Danger Button - Destructive actions
<button className="
  bg-error hover:bg-red-600
  text-white font-semibold
  px-5 py-3 rounded-md
  transition-all duration-150
">
  Delete Character
</button>

// Icon Button
<button className="
  w-10 h-10
  flex items-center justify-center
  bg-bg-secondary hover:bg-bg-hover
  rounded-full
  transition-all duration-150
">
  <Icon className="w-5 h-5 text-text-secondary" />
</button>
```

### 7.2 Cards

```tsx
// Standard Card
<div className="
  bg-surface-dark
  border border-border-subtle
  rounded-lg
  p-6
  shadow-lg
">
  {/* Card content */}
</div>

// Interactive Card (hover effect)
<div className="
  bg-surface-dark
  border border-border-subtle
  hover:border-primary-600
  rounded-lg
  p-6
  shadow-lg hover:shadow-xl
  transform hover:-translate-y-1
  transition-all duration-300
  cursor-pointer
">
  {/* Card content */}
</div>

// Character Card
<div className="
  bg-gradient-to-br from-surface-dark to-surface-medium
  border-2 border-border-gold
  rounded-xl
  overflow-hidden
  shadow-xl
">
  <div className="aspect-[3/4] relative">
    <img src={portrait} className="object-cover w-full h-full" />
    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-bg-primary to-transparent p-4">
      <h3 className="font-display text-xl text-text-primary">{name}</h3>
      <p className="text-text-secondary text-sm">{race} {class}</p>
    </div>
  </div>
  <div className="p-4">
    {/* Stats */}
  </div>
</div>
```

### 7.3 Inputs

```tsx
// Text Input
<div className="space-y-2">
  <label className="label text-text-secondary">Character Name</label>
  <input
    type="text"
    className="
      w-full
      bg-bg-secondary
      border border-border-default
      focus:border-primary-500 focus:ring-1 focus:ring-primary-500
      rounded-md
      px-4 py-3
      text-text-primary
      placeholder:text-text-muted
      transition-colors duration-150
      outline-none
    "
    placeholder="Enter name..."
  />
</div>

// Select
<select className="
  w-full
  bg-bg-secondary
  border border-border-default
  focus:border-primary-500
  rounded-md
  px-4 py-3
  text-text-primary
  appearance-none
  cursor-pointer
">
  <option>Select race...</option>
</select>

// Textarea
<textarea className="
  w-full
  bg-bg-secondary
  border border-border-default
  focus:border-primary-500
  rounded-md
  px-4 py-3
  text-text-primary
  resize-none
  min-h-[120px]
" />
```

### 7.4 Health Bar

```tsx
<div className="relative h-6 bg-health-bg rounded-full overflow-hidden">
  <div
    className="
      absolute inset-y-0 left-0
      bg-gradient-to-r from-health-full to-health-high
      transition-all duration-500 ease-out
    "
    style={{ width: `${(currentHP / maxHP) * 100}%` }}
  />
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="font-mono font-bold text-sm text-white drop-shadow">
      {currentHP} / {maxHP}
    </span>
  </div>
</div>
```

### 7.5 Stat Block

```tsx
// Ability Score Display
<div className="
  flex flex-col items-center
  bg-surface-dark
  border-2 border-border-gold
  rounded-lg
  p-3
  min-w-[80px]
">
  <span className="label text-primary-400">STR</span>
  <span className="stat-value text-text-primary">16</span>
  <span className="
    font-mono text-lg font-bold
    text-primary-400
    bg-bg-primary
    px-2 py-0.5 rounded
    -mb-5
  ">
    +3
  </span>
</div>
```

### 7.6 Dice Roll Display

```tsx
<div className="
  flex flex-col items-center
  bg-bg-secondary
  rounded-xl
  p-6
  shadow-xl
">
  <span className="label text-text-muted mb-2">Attack Roll</span>
  <div className="
    dice-result
    text-primary-400
    animate-[dice-roll_0.5s_ease-out]
  ">
    18
  </div>
  <div className="flex items-center gap-2 mt-2 text-text-secondary">
    <span className="font-mono">1d20</span>
    <span>+</span>
    <span className="font-mono">5</span>
    <span>=</span>
    <span className="font-mono text-success">23</span>
  </div>
</div>
```

### 7.7 Modal

```tsx
<div className="
  fixed inset-0 z-50
  flex items-center justify-center
  bg-black/70
  backdrop-blur-sm
  animate-[fade-in_0.2s_ease-out]
">
  <div className="
    bg-surface-dark
    border border-border-default
    rounded-xl
    shadow-2xl
    max-w-lg w-full mx-4
    animate-[scale-in_0.3s_ease-out]
  ">
    <div className="border-b border-border-subtle px-6 py-4">
      <h2 className="heading-2 text-text-primary">Modal Title</h2>
    </div>
    <div className="p-6">
      {/* Content */}
    </div>
    <div className="border-t border-border-subtle px-6 py-4 flex justify-end gap-3">
      <button className="ghost-button">Cancel</button>
      <button className="primary-button">Confirm</button>
    </div>
  </div>
</div>
```

### 7.8 Toast Notification

```tsx
// Success Toast
<div className="
  fixed bottom-4 right-4
  flex items-center gap-3
  bg-success-bg
  border border-success
  text-success
  px-4 py-3
  rounded-lg
  shadow-lg
  animate-[slide-up_0.3s_ease-out]
">
  <CheckIcon className="w-5 h-5" />
  <span>Character saved successfully!</span>
</div>

// Error Toast
<div className="
  ... 
  bg-error-bg border-error text-error
">
  <XIcon className="w-5 h-5" />
  <span>Failed to save character</span>
</div>
```

---

## 8. Game-Specific UI

### 8.1 Token (Board Piece)

```tsx
<div className="
  relative
  w-16 h-16
  rounded-full
  overflow-hidden
  border-2 border-primary-500
  shadow-lg
  animate-[float_3s_ease-in-out_infinite]
  cursor-pointer
  hover:scale-110
  transition-transform duration-200
">
  <img src={tokenImage} className="w-full h-full object-cover" />
  {/* Health indicator ring */}
  <svg className="absolute inset-0 w-full h-full -rotate-90">
    <circle
      cx="32" cy="32" r="30"
      fill="none"
      stroke="var(--health-full)"
      strokeWidth="4"
      strokeDasharray={`${(hp / maxHp) * 188} 188`}
    />
  </svg>
</div>
```

### 8.2 Initiative Tracker

```tsx
<div className="
  flex gap-2
  bg-bg-secondary
  border border-border-subtle
  rounded-full
  px-4 py-2
">
  {turnOrder.map((creature, i) => (
    <div
      key={creature.id}
      className={`
        w-10 h-10 rounded-full overflow-hidden
        border-2
        ${i === 0 ? 'border-primary-500 ring-2 ring-primary-500/50' : 'border-border-default'}
        transition-all duration-300
      `}
    >
      <img src={creature.portrait} className="w-full h-full object-cover" />
    </div>
  ))}
</div>
```

### 8.3 Action Bar

```tsx
<div className="
  fixed bottom-4 left-1/2 -translate-x-1/2
  flex items-center gap-2
  bg-surface-dark/95
  backdrop-blur-md
  border border-border-gold
  rounded-2xl
  px-4 py-3
  shadow-xl
">
  <ActionButton icon={SwordIcon} label="Attack" shortcut="A" />
  <ActionButton icon={SparklesIcon} label="Cast Spell" shortcut="S" />
  <ActionButton icon={RunIcon} label="Move" shortcut="M" />
  <ActionButton icon={ShieldIcon} label="Dodge" shortcut="D" />
  <div className="w-px h-8 bg-border-default mx-2" />
  <ActionButton icon={CheckIcon} label="End Turn" shortcut="E" primary />
</div>

// Action Button Component
<button className="
  flex flex-col items-center
  px-4 py-2
  rounded-xl
  hover:bg-bg-hover
  transition-colors duration-150
  group
">
  <Icon className="w-6 h-6 text-text-secondary group-hover:text-primary-400" />
  <span className="text-xs text-text-muted mt-1">{label}</span>
  <kbd className="
    text-[10px] text-text-muted
    bg-bg-tertiary
    px-1.5 py-0.5
    rounded
    mt-0.5
  ">
    {shortcut}
  </kbd>
</button>
```

### 8.4 Combat Log

```tsx
<div className="
  bg-bg-secondary/80
  backdrop-blur-sm
  border border-border-subtle
  rounded-lg
  max-h-64
  overflow-y-auto
  p-4
  space-y-2
">
  {/* Damage entry */}
  <div className="flex items-center gap-2 text-sm">
    <span className="text-text-primary font-medium">Aragorn</span>
    <span className="text-text-muted">hits</span>
    <span className="text-error font-medium">Goblin</span>
    <span className="text-text-muted">for</span>
    <span className="font-mono font-bold text-error">12</span>
    <span className="text-damage-slashing text-xs">slashing</span>
  </div>
  
  {/* Healing entry */}
  <div className="flex items-center gap-2 text-sm">
    <span className="text-text-primary font-medium">Gandalf</span>
    <span className="text-text-muted">heals</span>
    <span className="text-success font-medium">Frodo</span>
    <span className="text-text-muted">for</span>
    <span className="font-mono font-bold text-success">8</span>
    <span className="text-xs">HP</span>
  </div>
  
  {/* Miss entry */}
  <div className="flex items-center gap-2 text-sm text-text-muted">
    <span className="font-medium">Goblin</span>
    <span>misses</span>
    <span className="font-medium">Aragorn</span>
    <span className="font-mono">(8 vs AC 18)</span>
  </div>
</div>
```

### 8.5 Spell Card

```tsx
<div className="
  bg-gradient-to-br from-secondary-900/50 to-surface-dark
  border border-secondary-600
  rounded-xl
  p-4
  max-w-sm
  shadow-xl
">
  <div className="flex justify-between items-start mb-3">
    <h3 className="font-display text-lg text-secondary-300">Fireball</h3>
    <span className="
      bg-secondary-700
      text-secondary-200
      text-xs font-bold
      px-2 py-1
      rounded
    ">
      3rd Level
    </span>
  </div>
  
  <div className="flex gap-4 text-xs text-text-muted mb-3">
    <span>⏱️ 1 Action</span>
    <span>📏 150 ft</span>
    <span>🎯 20 ft sphere</span>
  </div>
  
  <p className="body-small text-text-secondary mb-4">
    A bright streak flashes from your pointing finger to a point you choose...
  </p>
  
  <div className="
    bg-bg-primary
    rounded-lg
    p-3
    font-mono text-sm
  ">
    <span className="text-damage-fire">8d6 fire damage</span>
    <span className="text-text-muted"> (DEX save half)</span>
  </div>
</div>
```

---

## 9. Page Layouts

### 9.1 Dashboard Layout

```tsx
<div className="min-h-screen bg-bg-primary">
  {/* Top Navigation */}
  <nav className="
    sticky top-0 z-40
    bg-bg-secondary/95
    backdrop-blur-md
    border-b border-border-subtle
    px-6 py-4
  ">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <Logo />
      <NavLinks />
      <UserMenu />
    </div>
  </nav>

  {/* Main Content */}
  <main className="max-w-7xl mx-auto px-6 py-8">
    {/* Page Header */}
    <header className="mb-8">
      <h1 className="heading-1 text-text-primary">My Characters</h1>
      <p className="body-base text-text-secondary mt-2">
        Manage your adventurers and create new heroes
      </p>
    </header>

    {/* Content Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Character cards */}
    </div>
  </main>
</div>
```

### 9.2 Game Board Layout

```tsx
<div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
  {/* Top Bar - Initiative & Info */}
  <header className="
    flex-shrink-0
    bg-bg-secondary/90
    backdrop-blur-md
    border-b border-border-subtle
    px-4 py-2
  ">
    <InitiativeTracker />
  </header>

  {/* Main Game Area */}
  <div className="flex-1 flex overflow-hidden">
    {/* Left Panel - Character Info */}
    <aside className="
      hidden lg:flex
      flex-col
      w-80
      bg-bg-secondary
      border-r border-border-subtle
      overflow-y-auto
    ">
      <CharacterPanel />
    </aside>

    {/* Center - Game Board */}
    <main className="flex-1 relative">
      <canvas id="game-board" className="w-full h-full" />
      {/* Floating Action Bar */}
      <ActionBar />
    </main>

    {/* Right Panel - Combat Log */}
    <aside className="
      hidden xl:flex
      flex-col
      w-80
      bg-bg-secondary
      border-l border-border-subtle
    ">
      <CombatLog />
    </aside>
  </div>
</div>
```

---

## 10. Responsive Breakpoints

```css
/* Tailwind default breakpoints */
:root {
  --screen-sm: 640px;   /* Mobile landscape */
  --screen-md: 768px;   /* Tablet portrait */
  --screen-lg: 1024px;  /* Tablet landscape / Small desktop */
  --screen-xl: 1280px;  /* Desktop */
  --screen-2xl: 1536px; /* Large desktop */
}
```

### Mobile-First Considerations

```tsx
// Hide on mobile, show on desktop
<div className="hidden lg:block">Desktop only</div>

// Show on mobile, hide on desktop
<div className="lg:hidden">Mobile only</div>

// Touch-friendly targets (min 48x48)
<button className="min-w-[48px] min-h-[48px]">Tap</button>

// Responsive text
<h1 className="text-2xl md:text-4xl lg:text-5xl">Responsive Heading</h1>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
```

---

## 11. Icons

Use **Lucide React** for all icons:

```bash
npm install lucide-react
```

```tsx
import {
  Sword,           // Attack
  Shield,          // Defense/AC
  Heart,           // Health
  Sparkles,        // Magic/Spells
  Flame,           // Fire damage
  Snowflake,       // Cold damage
  Zap,             // Lightning damage
  Skull,           // Necrotic/Death
  Sun,             // Radiant
  Brain,           // Psychic/Intelligence
  Eye,             // Perception/Vision
  Footprints,      // Movement
  Clock,           // Time/Duration
  Target,          // Targeting
  Dice1,           // Dice rolls
  Users,           // Party
  Map,             // Maps
  BookOpen,        // Spellbook
  Scroll,          // Scrolls/Items
  Crown,           // Legendary
  AlertTriangle,   // Warning
  Check,           // Success
  X,               // Close/Cancel
  ChevronRight,    // Navigation
  Settings,        // Settings
  LogOut,          // Logout
} from 'lucide-react';
```

---

## 12. Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        secondary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        bg: {
          primary: '#0F0D13',
          secondary: '#1A1720',
          tertiary: '#252231',
          hover: '#2D2A3A',
          active: '#383451',
        },
        surface: {
          dark: '#1E1B26',
          medium: '#2A2735',
          light: '#363342',
        },
        border: {
          subtle: '#27272A',
          default: '#3F3F46',
          strong: '#52525B',
          gold: '#B45309',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'dice-roll': 'dice-roll 0.5s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'damage-flash': 'damage-flash 0.3s ease-out',
        'heal-pulse': 'heal-pulse 1s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
```

---

## 13. Implementation Checklist for Claude Code

When building UI components, ensure:

- [ ] Uses design tokens (CSS variables) not hardcoded values
- [ ] Follows color palette exactly
- [ ] Uses correct font families (Cinzel for headers, Inter for body)
- [ ] Includes hover/focus/active states
- [ ] Has appropriate transitions/animations
- [ ] Is responsive (mobile-first)
- [ ] Touch targets are minimum 48x48px on mobile
- [ ] Uses semantic HTML
- [ ] Includes ARIA labels where needed
- [ ] Dark theme is the default (no light mode needed)

---

## 14. Visual References

For visual inspiration, reference these existing products:

1. **D&D Beyond** - Character sheets, spell cards, monster stat blocks
2. **Baldur's Gate 3** - Combat UI, health bars, action bars
3. **Solasta** - Tactical grid, initiative tracker
4. **Slay the Spire** - Card UI, turn-based combat feedback
5. **Disco Elysium** - Dialogue UI, narrative presentation

The goal is a **dark, cinematic, fantasy aesthetic** that feels premium and immersive while remaining highly functional for tactical gameplay.

---

# END OF DESIGN SYSTEM
