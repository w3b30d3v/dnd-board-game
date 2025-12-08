# Document 33: Complete Animation Specification

## Purpose
This document provides **exact animation specifications** for every component in the D&D Digital Board Game. Claude Code MUST reference this when implementing any animated element.

---

## Global Animation System

### Timing Functions (Cubic Bezier)

```typescript
export const EASINGS = {
  // Standard UI transitions
  smooth: [0.4, 0, 0.2, 1],        // Material Design standard
  smoothOut: [0, 0, 0.2, 1],       // Deceleration
  smoothIn: [0.4, 0, 1, 1],        // Acceleration
  
  // Dramatic game events
  dramatic: [0.16, 1, 0.3, 1],     // Combat results, crits
  heroic: [0.68, -0.6, 0.32, 1.6], // Victory, level up
  
  // Bouncy interactions
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.175, 0.885, 0.32, 1.275],
  
  // Combat specific
  strike: [0.55, 0.055, 0.675, 0.19],  // Weapon attacks
  impact: [0.25, 0.46, 0.45, 0.94],    // Hit reactions
  
  // Spring physics (Framer Motion)
  spring: { type: "spring", damping: 25, stiffness: 300 },
  springBouncy: { type: "spring", damping: 15, stiffness: 400 },
  springStiff: { type: "spring", damping: 30, stiffness: 500 },
  springLoose: { type: "spring", damping: 10, stiffness: 200 },
} as const;
```

### Duration Scale

```typescript
export const DURATIONS = {
  // Instant feedback
  instant: 0.05,      // 50ms - micro feedback
  fastest: 0.1,       // 100ms - button press
  fast: 0.15,         // 150ms - hover states
  
  // Standard transitions
  quick: 0.2,         // 200ms - quick transitions
  normal: 0.3,        // 300ms - standard animations
  medium: 0.4,        // 400ms - modal transitions
  
  // Dramatic animations
  slow: 0.5,          // 500ms - important reveals
  dramatic: 0.8,      // 800ms - combat results
  cinematic: 1.2,     // 1200ms - critical hits
  epic: 2.0,          // 2000ms - level up, death
  
  // Loops (seconds per cycle)
  pulseLoop: 2,       // Glowing elements
  floatLoop: 3,       // Floating elements
  shimmerLoop: 3,     // Shimmer effects
  ambientLoop: 8,     // Background movement
} as const;
```

### Stagger Configuration

```typescript
export const STAGGER = {
  fast: 0.03,         // Rapid sequential (particles)
  quick: 0.05,        // Quick sequential (list items)
  normal: 0.08,       // Standard stagger (cards)
  slow: 0.12,         // Dramatic stagger (important elements)
  dramatic: 0.2,      // Very dramatic (combat log)
} as const;
```

---

## Page Transitions

### Full Page Transitions

```typescript
// Route change animation
export const pageTransition = {
  initial: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(10px)",
    y: 20
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASINGS.dramatic,
      staggerChildren: 0.08
    }
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    filter: "blur(5px)",
    transition: {
      duration: 0.3,
      ease: EASINGS.smooth
    }
  }
};
```

### Section Transitions

```typescript
// Sections within a page
export const sectionTransition = {
  initial: { opacity: 0, y: 40 },
  whileInView: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: EASINGS.smooth
    }
  },
  viewport: { once: true, margin: "-100px" }
};
```

---

## Navigation Components

### Top Navigation Bar

```typescript
// NavBar container
export const navBar = {
  initial: { y: -72, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.4, ease: EASINGS.smooth }
  }
};

// Logo animation (continuous glow pulse)
export const logoGlow = {
  animate: {
    boxShadow: [
      "0 0 20px rgba(245, 158, 11, 0.3)",
      "0 0 40px rgba(245, 158, 11, 0.6)",
      "0 0 20px rgba(245, 158, 11, 0.3)"
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Nav link hover (underline slide)
export const navLinkUnderline = {
  initial: { scaleX: 0, originX: 0 },
  whileHover: { 
    scaleX: 1,
    transition: { duration: 0.2, ease: EASINGS.smooth }
  }
};

// Active nav indicator
export const navActiveIndicator = {
  layoutId: "nav-active",
  transition: EASINGS.spring
};
```

### Mobile Navigation

```typescript
// Bottom nav slide up
export const mobileNav = {
  initial: { y: 80 },
  animate: { 
    y: 0,
    transition: { duration: 0.3, ease: EASINGS.smooth }
  }
};

// Nav icon bounce on select
export const mobileNavIcon = {
  whileTap: { scale: 0.85 },
  animate: (isActive: boolean) => ({
    scale: isActive ? 1.1 : 1,
    y: isActive ? -4 : 0,
    transition: EASINGS.spring
  })
};
```

---

## Button Components

### Primary Button (Gold)

```typescript
export const buttonPrimary = {
  // Rest state
  initial: {
    background: "linear-gradient(135deg, #F59E0B, #D97706)",
    boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)"
  },
  
  // Hover
  whileHover: {
    scale: 1.02,
    boxShadow: "0 8px 25px rgba(245, 158, 11, 0.5)",
    transition: { duration: 0.2 }
  },
  
  // Press
  whileTap: {
    scale: 0.98,
    boxShadow: "0 2px 10px rgba(245, 158, 11, 0.3)",
    transition: { duration: 0.1 }
  },
  
  // Disabled
  disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    filter: "grayscale(50%)"
  }
};

// Shine effect on hover
export const buttonShine = {
  initial: { x: "-100%", opacity: 0 },
  whileHover: {
    x: "200%",
    opacity: 0.3,
    transition: { duration: 0.6, ease: "linear" }
  }
};
```

### Magic Button (Purple - for spells)

```typescript
export const buttonMagic = {
  initial: {
    background: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)"
  },
  whileHover: {
    scale: 1.02,
    boxShadow: [
      "0 8px 25px rgba(139, 92, 246, 0.5)",
      "0 8px 30px rgba(139, 92, 246, 0.7)",
      "0 8px 25px rgba(139, 92, 246, 0.5)"
    ],
    transition: {
      boxShadow: { duration: 1, repeat: Infinity },
      scale: { duration: 0.2 }
    }
  },
  whileTap: { scale: 0.98 }
};

// Sparkle particles on hover
export const buttonSparkles = {
  // Spawn 8 particles
  particles: 8,
  config: {
    x: { random: [-30, 30] },
    y: { random: [-40, -10] },
    scale: [0, 1, 0],
    opacity: [0, 1, 0],
    rotation: { random: [0, 360] },
    duration: 0.8
  }
};
```

### Danger Button (Red)

```typescript
export const buttonDanger = {
  initial: {
    background: "linear-gradient(135deg, #EF4444, #DC2626)",
    boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)"
  },
  whileHover: {
    scale: 1.02,
    boxShadow: "0 8px 25px rgba(239, 68, 68, 0.5)",
    x: [0, -2, 2, -2, 2, 0], // Subtle shake
    transition: {
      x: { duration: 0.4, ease: "easeInOut" },
      scale: { duration: 0.2 }
    }
  },
  whileTap: { scale: 0.98 }
};
```

### Icon Button

```typescript
export const buttonIcon = {
  whileHover: {
    scale: 1.1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    transition: { duration: 0.15 }
  },
  whileTap: { scale: 0.9 }
};

// Icon rotation on hover (for settings, refresh, etc.)
export const iconRotate = {
  whileHover: {
    rotate: 180,
    transition: { duration: 0.3 }
  }
};
```

---

## Card Components

### Character Card

```typescript
export const characterCard = {
  // Container
  container: {
    initial: { 
      opacity: 0, 
      y: 50,
      rotateX: -10
    },
    animate: { 
      opacity: 1, 
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.5,
        ease: EASINGS.dramatic
      }
    },
    whileHover: {
      y: -8,
      boxShadow: "0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(245, 158, 11, 0.2)",
      transition: { duration: 0.3 }
    }
  },
  
  // 3D tilt effect (use mouse position)
  tilt: {
    maxRotation: 10, // degrees
    perspective: 1000,
    scale: 1.02,
    transition: { duration: 0.1 }
  },
  
  // Portrait
  portrait: {
    initial: { scale: 1 },
    whileHover: {
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  },
  
  // Level badge shimmer
  levelBadge: {
    animate: {
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "linear"
      }
    }
  },
  
  // Health bar
  healthBar: {
    animate: (hp: number, maxHp: number) => ({
      width: `${(hp / maxHp) * 100}%`,
      backgroundColor: hp / maxHp > 0.5 ? "#22C55E" : hp / maxHp > 0.25 ? "#EAB308" : "#EF4444",
      transition: { duration: 0.8, ease: EASINGS.smooth }
    })
  },
  
  // Health pulse when low
  healthPulse: {
    animate: (hp: number, maxHp: number) => (hp / maxHp <= 0.25 ? {
      boxShadow: [
        "0 0 10px rgba(239, 68, 68, 0.5)",
        "0 0 20px rgba(239, 68, 68, 0.8)",
        "0 0 10px rgba(239, 68, 68, 0.5)"
      ],
      transition: { duration: 1, repeat: Infinity }
    } : {})
  },
  
  // Damage flash
  damageFlash: {
    animate: {
      filter: ["brightness(1)", "brightness(1.5) saturate(1.5)", "brightness(1)"],
      backgroundColor: ["transparent", "rgba(239, 68, 68, 0.3)", "transparent"],
      transition: { duration: 0.3 }
    }
  },
  
  // Heal flash
  healFlash: {
    animate: {
      filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"],
      backgroundColor: ["transparent", "rgba(34, 197, 94, 0.3)", "transparent"],
      transition: { duration: 0.4 }
    }
  }
};
```

### Spell Card

```typescript
export const spellCard = {
  container: {
    initial: { opacity: 0, scale: 0.9, rotateY: -15 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      rotateY: 0,
      transition: { duration: 0.4, ease: EASINGS.smooth }
    },
    whileHover: {
      y: -12,
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2 }
    }
  },
  
  // School-based glow colors
  schoolGlow: {
    evocation: "rgba(239, 68, 68, 0.4)",      // Red
    necromancy: "rgba(139, 92, 246, 0.4)",    // Purple
    conjuration: "rgba(59, 130, 246, 0.4)",   // Blue
    abjuration: "rgba(234, 179, 8, 0.4)",     // Yellow
    transmutation: "rgba(34, 197, 94, 0.4)",  // Green
    divination: "rgba(14, 165, 233, 0.4)",    // Cyan
    enchantment: "rgba(236, 72, 153, 0.4)",   // Pink
    illusion: "rgba(168, 85, 247, 0.4)"       // Violet
  },
  
  // Hover particles
  particles: {
    count: 15,
    colors: ["#F59E0B", "#8B5CF6", "#EF4444"],
    config: {
      y: { start: 0, end: -60 },
      x: { random: [-20, 20] },
      opacity: [0, 1, 0],
      scale: [0.5, 1, 0.5],
      duration: 1.5,
      repeat: Infinity,
      stagger: 0.1
    }
  },
  
  // Cast animation (when selected)
  castAnimation: {
    animate: {
      scale: [1, 1.05, 0.95, 1],
      rotate: [0, -5, 5, 0],
      transition: { duration: 0.3 }
    }
  }
};
```

### Item Card

```typescript
export const itemCard = {
  container: {
    initial: { opacity: 0, x: -20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    },
    whileHover: {
      x: 4,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      transition: { duration: 0.15 }
    }
  },
  
  // Rarity glow
  rarityGlow: {
    common: "none",
    uncommon: "0 0 10px rgba(34, 197, 94, 0.3)",
    rare: "0 0 15px rgba(59, 130, 246, 0.4)",
    veryRare: "0 0 20px rgba(139, 92, 246, 0.5)",
    legendary: "0 0 25px rgba(245, 158, 11, 0.6)",
    artifact: "0 0 30px rgba(239, 68, 68, 0.7)"
  },
  
  // Equip animation
  equip: {
    animate: {
      scale: [1, 1.1, 1],
      boxShadow: [
        "0 0 0 rgba(245, 158, 11, 0)",
        "0 0 30px rgba(245, 158, 11, 0.8)",
        "0 0 0 rgba(245, 158, 11, 0)"
      ],
      transition: { duration: 0.4 }
    }
  }
};
```

### Monster Card

```typescript
export const monsterCard = {
  container: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: EASINGS.spring
    },
    whileHover: {
      scale: 1.02,
      boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(239, 68, 68, 0.2)",
      transition: { duration: 0.2 }
    }
  },
  
  // Threat indicator pulse
  threatPulse: {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: { duration: 1.5, repeat: Infinity }
    }
  },
  
  // CR badge
  crBadge: {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: { delay: 0.2, ...EASINGS.spring }
    }
  }
};
```

---

## Dice Rolling System

### Pre-Roll Anticipation

```typescript
export const diceAnticipation = {
  container: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.1, 1.05],
      rotate: [0, -5, 5, -3, 3, 0],
      transition: {
        duration: 0.5,
        times: [0, 0.3, 1]
      }
    }
  },
  
  // Glow buildup
  glow: {
    animate: {
      boxShadow: [
        "0 0 10px rgba(245, 158, 11, 0.2)",
        "0 0 30px rgba(245, 158, 11, 0.6)",
        "0 0 50px rgba(245, 158, 11, 0.8)"
      ],
      transition: { duration: 0.5 }
    }
  }
};
```

### Roll Animation

```typescript
export const diceRoll = {
  // 3D tumble
  tumble: {
    animate: {
      rotateX: [0, 360, 720, 1080, 1440, 1800, 2160],
      rotateY: [0, 180, 540, 720, 1080, 1260, 1440],
      rotateZ: [0, 90, 270, 360, 540, 630, 720],
      y: [0, -100, -50, -80, -30, -50, 0],
      x: [0, 20, -15, 10, -5, 3, 0],
      transition: {
        duration: 1.5,
        ease: EASINGS.bounce,
        times: [0, 0.2, 0.4, 0.5, 0.7, 0.85, 1]
      }
    }
  },
  
  // 2D alternative (sprite sheet)
  spriteRoll: {
    frames: 24,
    duration: 1.5,
    ease: "steps(24)"
  }
};
```

### Result Reveal

```typescript
export const diceResult = {
  // Standard result
  standard: {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: [0, 1.3, 1],
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: EASINGS.bounce
      }
    }
  },
  
  // Natural 20 (Critical)
  critical: {
    container: {
      animate: {
        scale: [1, 1.5, 1.2],
        transition: { duration: 0.6 }
      }
    },
    glow: {
      animate: {
        boxShadow: [
          "0 0 0 rgba(245, 158, 11, 0)",
          "0 0 100px rgba(245, 158, 11, 1)",
          "0 0 60px rgba(245, 158, 11, 0.8)"
        ],
        transition: { duration: 0.8 }
      }
    },
    screenShake: {
      animate: {
        x: [0, -10, 10, -10, 10, -5, 5, 0],
        y: [0, -5, 5, -5, 5, -2, 2, 0],
        transition: { duration: 0.5 }
      }
    },
    particles: {
      count: 30,
      colors: ["#F59E0B", "#FBBF24", "#FDE68A"],
      config: {
        type: "explosion",
        radius: 150,
        duration: 1,
        gravity: 0.5
      }
    },
    text: {
      initial: { scale: 0, y: 50 },
      animate: {
        scale: [0, 1.5, 1],
        y: [50, -20, 0],
        transition: { duration: 0.5, delay: 0.3 }
      },
      content: "CRITICAL HIT!"
    }
  },
  
  // Natural 1 (Fumble)
  fumble: {
    container: {
      animate: {
        scale: [1, 0.9, 1],
        filter: ["brightness(1)", "brightness(0.5)", "brightness(0.8)"],
        transition: { duration: 0.4 }
      }
    },
    crack: {
      initial: { opacity: 0, scale: 1.5 },
      animate: {
        opacity: [0, 1, 0.8],
        scale: [1.5, 1, 1],
        transition: { duration: 0.3 }
      }
    },
    smoke: {
      count: 10,
      colors: ["#374151", "#4B5563", "#1F2937"],
      config: {
        y: { start: 0, end: -30 },
        opacity: [0, 0.5, 0],
        scale: [0.5, 1.5, 2],
        duration: 1.5
      }
    }
  }
};
```

### Roll Results Display

```typescript
export const rollBreakdown = {
  container: {
    initial: { opacity: 0, height: 0 },
    animate: {
      opacity: 1,
      height: "auto",
      transition: { duration: 0.3 }
    }
  },
  
  // Individual dice in breakdown
  dieResult: {
    initial: { scale: 0, opacity: 0 },
    animate: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: { delay: i * 0.1 }
    })
  },
  
  // Modifier
  modifier: {
    initial: { x: -20, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: { delay: 0.3 }
    }
  },
  
  // Total
  total: {
    initial: { scale: 0 },
    animate: {
      scale: [0, 1.2, 1],
      transition: { delay: 0.5, duration: 0.4 }
    }
  }
};
```

---

## Combat System Animations

### Initiative Tracker

```typescript
export const initiativeTracker = {
  container: {
    initial: { x: -100, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4 }
    }
  },
  
  // Turn indicator
  turnIndicator: {
    layoutId: "turn-indicator",
    animate: {
      boxShadow: [
        "0 0 10px rgba(245, 158, 11, 0.5)",
        "0 0 20px rgba(245, 158, 11, 0.8)",
        "0 0 10px rgba(245, 158, 11, 0.5)"
      ],
      transition: { duration: 1.5, repeat: Infinity }
    }
  },
  
  // Creature entry slide
  creatureEntry: {
    initial: { x: -50, opacity: 0 },
    animate: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: { delay: i * 0.08, duration: 0.3 }
    })
  },
  
  // Active creature highlight
  activeTurn: {
    animate: {
      scale: 1.05,
      backgroundColor: "rgba(245, 158, 11, 0.2)",
      transition: { duration: 0.3 }
    }
  },
  
  // Turn change transition
  turnChange: {
    exit: { x: -30, opacity: 0 },
    enter: {
      x: [30, 0],
      opacity: [0, 1],
      transition: { duration: 0.3 }
    }
  },
  
  // Round counter
  roundCounter: {
    animate: {
      scale: [1, 1.2, 1],
      transition: { duration: 0.3 }
    }
  }
};
```

### Attack Animation

```typescript
export const attackAnimation = {
  // Melee attack
  melee: {
    lunge: {
      animate: (targetX: number, targetY: number) => ({
        x: [0, targetX * 0.7, 0],
        y: [0, targetY * 0.7, 0],
        transition: { duration: 0.4, ease: EASINGS.strike }
      })
    },
    weaponArc: {
      animate: {
        rotate: [0, -45, 180, 90],
        scale: [0, 1, 1, 0],
        opacity: [0, 1, 1, 0],
        transition: { duration: 0.3 }
      }
    }
  },
  
  // Ranged attack
  ranged: {
    projectile: {
      animate: (start: Point, end: Point) => ({
        x: [start.x, end.x],
        y: [start.y, end.y],
        rotate: Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI),
        transition: { duration: 0.3, ease: "linear" }
      })
    },
    trail: {
      animate: {
        opacity: [1, 0],
        scaleX: [1, 0],
        transition: { duration: 0.2 }
      }
    }
  },
  
  // Hit impact
  hit: {
    target: {
      animate: {
        x: [0, -5, 5, -3, 3, 0],
        filter: ["brightness(1)", "brightness(2)", "brightness(1)"],
        transition: { duration: 0.3 }
      }
    },
    damageNumber: {
      initial: { y: 0, opacity: 0, scale: 0.5 },
      animate: {
        y: -60,
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.5, 1.2, 1],
        transition: { duration: 1, ease: EASINGS.smooth }
      }
    },
    blood: {
      count: 8,
      colors: ["#DC2626", "#B91C1C", "#7F1D1D"],
      config: {
        spread: 45,
        distance: 40,
        duration: 0.5
      }
    }
  },
  
  // Miss
  miss: {
    target: {
      animate: {
        x: [0, 10, 0],
        transition: { duration: 0.2 }
      }
    },
    text: {
      initial: { y: 0, opacity: 0 },
      animate: {
        y: -40,
        opacity: [0, 1, 0],
        transition: { duration: 0.8 }
      },
      content: "MISS"
    }
  }
};
```

### Spell Casting Animation

```typescript
export const spellAnimation = {
  // Cast buildup
  castBuildup: {
    caster: {
      animate: {
        scale: [1, 1.1, 1.05],
        filter: ["brightness(1)", "brightness(1.3)", "brightness(1.2)"],
        transition: { duration: 0.5 }
      }
    },
    gatherEnergy: {
      animate: {
        scale: [0, 1.5, 1],
        opacity: [0, 0.8, 0.6],
        transition: { duration: 0.5 }
      }
    },
    particles: {
      count: 20,
      config: {
        type: "inward",
        radius: 100,
        duration: 0.5
      }
    }
  },
  
  // Projectile spells
  projectile: {
    fireBolt: {
      travel: { duration: 0.4 },
      trail: { color: "#F97316", length: 30 },
      impact: { scale: 2, duration: 0.3 }
    },
    magicMissile: {
      count: 3,
      stagger: 0.15,
      travel: { duration: 0.3, ease: "easeIn" },
      curve: true, // Homing curve
      trail: { color: "#8B5CF6", length: 20 }
    },
    rayOfFrost: {
      travel: { duration: 0.25 },
      trail: { color: "#06B6D4", length: 50 },
      freeze: { duration: 0.3 }
    }
  },
  
  // AoE spells
  aoe: {
    fireball: {
      travel: {
        duration: 0.6,
        arc: true,
        height: 50
      },
      explosion: {
        initial: { scale: 0, opacity: 0 },
        animate: {
          scale: [0, 3, 2.5],
          opacity: [0, 1, 0],
          transition: { duration: 0.8 }
        }
      },
      screenShake: { intensity: 15, duration: 0.3 },
      particles: {
        count: 40,
        colors: ["#F97316", "#DC2626", "#FBBF24"],
        config: { type: "explosion", radius: 120 }
      }
    },
    lightningBolt: {
      segments: 8,
      animate: {
        opacity: [0, 1, 1, 0],
        filter: ["brightness(1)", "brightness(3)", "brightness(1)"],
        transition: { duration: 0.15 }
      },
      flash: {
        animate: {
          backgroundColor: ["transparent", "rgba(255,255,255,0.3)", "transparent"],
          transition: { duration: 0.1 }
        }
      }
    }
  },
  
  // Healing spells
  healing: {
    cureWounds: {
      glow: {
        animate: {
          boxShadow: [
            "0 0 0 rgba(34, 197, 94, 0)",
            "0 0 50px rgba(34, 197, 94, 0.8)",
            "0 0 20px rgba(34, 197, 94, 0.4)"
          ],
          transition: { duration: 0.8 }
        }
      },
      particles: {
        count: 15,
        colors: ["#22C55E", "#4ADE80", "#86EFAC"],
        config: {
          type: "rise",
          duration: 1
        }
      },
      healNumber: {
        initial: { y: 0, opacity: 0 },
        animate: {
          y: -50,
          opacity: [0, 1, 0],
          scale: [1, 1.3, 1],
          transition: { duration: 1 }
        },
        color: "#22C55E"
      }
    }
  },
  
  // Buff spells
  buff: {
    shield: {
      ring: {
        initial: { scale: 0, opacity: 0 },
        animate: {
          scale: [0, 1.5, 1],
          opacity: [0, 0.8, 0.5],
          transition: { duration: 0.4 }
        }
      },
      shimmer: {
        animate: {
          rotate: [0, 360],
          transition: { duration: 4, repeat: Infinity, ease: "linear" }
        }
      }
    },
    bless: {
      glow: {
        animate: {
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.1, 1],
          transition: { duration: 2, repeat: Infinity }
        }
      },
      color: "#FBBF24"
    }
  }
};
```

### Death & Dying

```typescript
export const deathAnimation = {
  // Dropping to 0 HP
  knockout: {
    animate: {
      scale: [1, 0.8],
      rotate: [0, -15],
      filter: ["brightness(1)", "brightness(0.5)"],
      transition: { duration: 0.5 }
    }
  },
  
  // Death save UI
  deathSave: {
    container: {
      initial: { scale: 0, opacity: 0 },
      animate: {
        scale: 1,
        opacity: 1,
        transition: EASINGS.spring
      }
    },
    skull: {
      animate: {
        scale: [1, 1.1, 1],
        opacity: [0.8, 1, 0.8],
        transition: { duration: 2, repeat: Infinity }
      }
    },
    success: {
      animate: {
        scale: [0, 1.5, 1],
        color: "#22C55E",
        transition: { duration: 0.3 }
      }
    },
    failure: {
      animate: {
        scale: [0, 1.5, 1],
        color: "#EF4444",
        transition: { duration: 0.3 }
      }
    }
  },
  
  // Actual death
  death: {
    fadeOut: {
      animate: {
        opacity: [1, 0],
        scale: [1, 0.5],
        filter: ["brightness(1)", "brightness(0.3)"],
        transition: { duration: 1.5 }
      }
    },
    soulRise: {
      particles: {
        count: 20,
        colors: ["#E5E7EB", "#D1D5DB", "#9CA3AF"],
        config: {
          y: { start: 0, end: -100 },
          opacity: [0, 0.8, 0],
          scale: [0.5, 1, 0.3],
          duration: 2
        }
      }
    },
    collapse: {
      animate: {
        rotateX: [0, 90],
        y: [0, 20],
        transition: { duration: 0.5 }
      }
    }
  },
  
  // Stabilize
  stabilize: {
    animate: {
      filter: ["brightness(0.5)", "brightness(1)"],
      scale: [0.8, 1],
      transition: { duration: 0.5 }
    },
    glow: {
      animate: {
        boxShadow: [
          "0 0 0 rgba(34, 197, 94, 0)",
          "0 0 30px rgba(34, 197, 94, 0.6)",
          "0 0 10px rgba(34, 197, 94, 0.3)"
        ],
        transition: { duration: 0.8 }
      }
    }
  }
};
```

### Conditions

```typescript
export const conditionAnimation = {
  // Apply condition
  apply: {
    icon: {
      initial: { scale: 0, rotate: -180 },
      animate: {
        scale: [0, 1.3, 1],
        rotate: 0,
        transition: { duration: 0.4, ease: EASINGS.bounce }
      }
    },
    flash: (conditionColor: string) => ({
      animate: {
        backgroundColor: [`transparent`, conditionColor + "40", `transparent`],
        transition: { duration: 0.3 }
      }
    })
  },
  
  // Active condition effects
  active: {
    poisoned: {
      animate: {
        filter: ["hue-rotate(0deg)", "hue-rotate(40deg)", "hue-rotate(0deg)"],
        transition: { duration: 2, repeat: Infinity }
      },
      particles: { color: "#22C55E", type: "bubble" }
    },
    burning: {
      animate: {
        filter: ["brightness(1)", "brightness(1.1)", "brightness(1)"],
        transition: { duration: 0.5, repeat: Infinity }
      },
      particles: { color: "#F97316", type: "rise" }
    },
    frozen: {
      animate: {
        filter: ["brightness(1) saturate(0.7)", "brightness(1.1) saturate(0.7)"],
        transition: { duration: 1, repeat: Infinity }
      },
      overlay: { color: "rgba(56, 189, 248, 0.3)" }
    },
    stunned: {
      animate: {
        rotate: [-2, 2, -2],
        transition: { duration: 0.3, repeat: Infinity }
      },
      stars: { count: 3, orbit: true }
    },
    invisible: {
      animate: {
        opacity: [0.3, 0.5, 0.3],
        transition: { duration: 1.5, repeat: Infinity }
      }
    }
  },
  
  // Remove condition
  remove: {
    icon: {
      exit: {
        scale: [1, 1.5, 0],
        opacity: [1, 1, 0],
        transition: { duration: 0.3 }
      }
    },
    burst: {
      particles: 8,
      config: { type: "burst", duration: 0.4 }
    }
  }
};
```

---

## Game Board Animations

### Token Movement

```typescript
export const tokenAnimation = {
  // Idle float
  idle: {
    animate: {
      y: [0, -4, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  
  // Selection
  select: {
    ring: {
      animate: {
        scale: [1, 1.2, 1],
        opacity: [0.8, 1, 0.8],
        transition: { duration: 1, repeat: Infinity }
      }
    },
    glow: {
      animate: {
        boxShadow: [
          "0 0 10px rgba(245, 158, 11, 0.5)",
          "0 0 25px rgba(245, 158, 11, 0.8)",
          "0 0 10px rgba(245, 158, 11, 0.5)"
        ],
        transition: { duration: 1.5, repeat: Infinity }
      }
    }
  },
  
  // Movement
  move: {
    path: (waypoints: Point[]) => ({
      animate: {
        x: waypoints.map(p => p.x),
        y: waypoints.map(p => p.y),
        transition: {
          duration: waypoints.length * 0.15,
          ease: "linear",
          times: waypoints.map((_, i) => i / (waypoints.length - 1))
        }
      }
    }),
    footsteps: {
      interval: 150, // ms between footsteps
      particle: { opacity: [0.5, 0], scale: [1, 0.5], duration: 0.5 }
    }
  },
  
  // Teleport
  teleport: {
    out: {
      animate: {
        scale: [1, 0],
        opacity: [1, 0],
        rotate: [0, 180],
        transition: { duration: 0.3 }
      }
    },
    in: {
      animate: {
        scale: [0, 1.2, 1],
        opacity: [0, 1],
        rotate: [-180, 0],
        transition: { duration: 0.4, ease: EASINGS.bounce }
      }
    },
    particles: {
      out: { type: "implode", color: "#8B5CF6" },
      in: { type: "explode", color: "#8B5CF6" }
    }
  },
  
  // Spawn
  spawn: {
    initial: { scale: 0, opacity: 0, y: -30 },
    animate: {
      scale: [0, 1.2, 1],
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: EASINGS.bounce }
    }
  },
  
  // Hover (enemy indication)
  enemyHover: {
    animate: {
      boxShadow: [
        "0 0 0 rgba(239, 68, 68, 0)",
        "0 0 20px rgba(239, 68, 68, 0.6)",
        "0 0 0 rgba(239, 68, 68, 0)"
      ],
      transition: { duration: 0.3 }
    }
  }
};
```

### Tile Highlights

```typescript
export const tileHighlight = {
  // Movement range
  movementRange: {
    animate: {
      opacity: [0.2, 0.4, 0.2],
      transition: { duration: 1.5, repeat: Infinity }
    },
    color: "rgba(34, 197, 94, 0.3)"
  },
  
  // Attack range
  attackRange: {
    animate: {
      opacity: [0.3, 0.5, 0.3],
      transition: { duration: 1, repeat: Infinity }
    },
    color: "rgba(239, 68, 68, 0.3)"
  },
  
  // Spell targeting
  spellTarget: {
    animate: {
      opacity: [0.3, 0.6, 0.3],
      scale: [1, 1.05, 1],
      transition: { duration: 0.8, repeat: Infinity }
    },
    color: "rgba(139, 92, 246, 0.4)"
  },
  
  // AoE preview
  aoePreview: {
    animate: {
      opacity: [0.4, 0.7, 0.4],
      transition: { duration: 0.6, repeat: Infinity }
    },
    border: {
      animate: {
        strokeDashoffset: [0, -20],
        transition: { duration: 1, repeat: Infinity, ease: "linear" }
      }
    }
  },
  
  // Hover tile
  hoverTile: {
    animate: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      transition: { duration: 0.1 }
    }
  },
  
  // Path preview
  pathPreview: {
    animate: (i: number) => ({
      opacity: [0, 0.6, 0.3],
      scale: [0.8, 1, 0.9],
      transition: { delay: i * 0.05, duration: 0.3 }
    })
  }
};
```

### Fog of War

```typescript
export const fogOfWar = {
  // Reveal animation
  reveal: {
    animate: {
      opacity: [1, 0],
      scale: [1, 1.1],
      filter: ["blur(0px)", "blur(10px)"],
      transition: { duration: 0.5, ease: EASINGS.smooth }
    }
  },
  
  // Conceal animation
  conceal: {
    animate: {
      opacity: [0, 1],
      scale: [1.1, 1],
      transition: { duration: 0.8, ease: EASINGS.smooth }
    }
  },
  
  // Edge particles
  edgeParticles: {
    count: 15,
    colors: ["#1F2937", "#374151", "#111827"],
    config: {
      along: "edge",
      opacity: [0, 0.5, 0],
      duration: 2,
      repeat: Infinity
    }
  },
  
  // Dim light overlay
  dimLight: {
    animate: {
      opacity: [0.4, 0.5, 0.4],
      transition: { duration: 3, repeat: Infinity }
    }
  }
};
```

---

## Modal & Dialog Animations

### Standard Modal

```typescript
export const modal = {
  overlay: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      backdropFilter: "blur(8px)",
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.15 }
    }
  },
  
  container: {
    initial: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20 
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: EASINGS.spring
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: 10,
      transition: { duration: 0.15 }
    }
  },
  
  content: {
    animate: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  },
  
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.2 }
    }
  }
};
```

### Confirmation Dialog

```typescript
export const confirmDialog = {
  ...modal,
  
  // Danger variant
  danger: {
    container: {
      initial: { opacity: 0, scale: 0.9 },
      animate: {
        opacity: 1,
        scale: 1,
        boxShadow: "0 0 50px rgba(239, 68, 68, 0.3)",
        transition: EASINGS.spring
      }
    },
    shake: {
      animate: {
        x: [0, -5, 5, -5, 5, 0],
        transition: { duration: 0.4 }
      }
    }
  }
};
```

### Tooltip

```typescript
export const tooltip = {
  initial: { 
    opacity: 0, 
    scale: 0.95,
    y: -5 
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { duration: 0.15 }
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};
```

### Dropdown Menu

```typescript
export const dropdown = {
  container: {
    initial: { opacity: 0, scale: 0.95, y: -10 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        staggerChildren: 0.03
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -5,
      transition: { duration: 0.1 }
    }
  },
  
  item: {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    whileHover: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      x: 4,
      transition: { duration: 0.1 }
    }
  }
};
```

---

## Toast & Notification Animations

```typescript
export const toast = {
  container: {
    initial: { 
      opacity: 0, 
      y: 50, 
      scale: 0.9 
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: EASINGS.spring
    },
    exit: { 
      opacity: 0, 
      x: 100,
      transition: { duration: 0.2 }
    }
  },
  
  // Progress bar for auto-dismiss
  progress: {
    initial: { scaleX: 1 },
    animate: (duration: number) => ({
      scaleX: 0,
      transition: { duration, ease: "linear" }
    })
  },
  
  // Success variant
  success: {
    icon: {
      initial: { scale: 0, rotate: -180 },
      animate: { 
        scale: 1, 
        rotate: 0,
        transition: { delay: 0.1, ...EASINGS.spring }
      }
    },
    color: "#22C55E"
  },
  
  // Error variant
  error: {
    icon: {
      initial: { scale: 0 },
      animate: {
        scale: [0, 1.2, 1],
        transition: { duration: 0.3 }
      }
    },
    shake: {
      animate: {
        x: [0, -5, 5, -5, 5, 0],
        transition: { delay: 0.2, duration: 0.3 }
      }
    },
    color: "#EF4444"
  },
  
  // Warning variant
  warning: {
    icon: {
      animate: {
        scale: [1, 1.1, 1],
        transition: { duration: 1, repeat: 2 }
      }
    },
    color: "#F59E0B"
  },
  
  // Info variant
  info: {
    color: "#3B82F6"
  }
};
```

---

## Loading States

### Skeleton Loaders

```typescript
export const skeleton = {
  shimmer: {
    animate: {
      backgroundPosition: ["-200% 0", "200% 0"],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "linear"
      }
    },
    background: `linear-gradient(
      90deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.1) 50%,
      rgba(255,255,255,0) 100%
    )`
  }
};
```

### Spinner

```typescript
export const spinner = {
  ring: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  },
  
  dots: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.15,
          repeat: Infinity
        }
      }
    },
    dot: {
      animate: {
        y: [0, -10, 0],
        transition: { duration: 0.5 }
      }
    }
  },
  
  // D20 spinner
  d20: {
    animate: {
      rotateY: [0, 360],
      rotateX: [0, 360],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }
    }
  }
};
```

### Progress Bar

```typescript
export const progressBar = {
  container: {
    initial: { opacity: 0 },
    animate: { opacity: 1 }
  },
  
  fill: {
    initial: { width: 0 },
    animate: (percent: number) => ({
      width: `${percent}%`,
      transition: { duration: 0.5, ease: EASINGS.smooth }
    })
  },
  
  // Striped animated variant
  striped: {
    animate: {
      backgroundPosition: ["0 0", "40px 0"],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  }
};
```

---

## Form Elements

### Input Fields

```typescript
export const input = {
  container: {
    initial: { borderColor: "rgba(255,255,255,0.1)" },
    whileFocus: {
      borderColor: "#F59E0B",
      boxShadow: "0 0 0 3px rgba(245, 158, 11, 0.2)",
      transition: { duration: 0.2 }
    }
  },
  
  label: {
    initial: { y: 0, scale: 1, color: "#9CA3AF" },
    focus: {
      y: -24,
      scale: 0.85,
      color: "#F59E0B",
      transition: { duration: 0.2 }
    }
  },
  
  error: {
    initial: { opacity: 0, y: -10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2 }
    },
    shake: {
      x: [0, -5, 5, -5, 5, 0],
      transition: { duration: 0.3 }
    }
  }
};
```

### Checkbox & Toggle

```typescript
export const checkbox = {
  box: {
    whileTap: { scale: 0.9 },
    checked: {
      backgroundColor: "#F59E0B",
      borderColor: "#F59E0B",
      transition: { duration: 0.15 }
    }
  },
  
  checkmark: {
    initial: { pathLength: 0 },
    checked: {
      pathLength: 1,
      transition: { duration: 0.2, delay: 0.1 }
    }
  }
};

export const toggle = {
  track: {
    checked: {
      backgroundColor: "#F59E0B",
      transition: { duration: 0.2 }
    }
  },
  
  thumb: {
    checked: {
      x: 20, // Adjust based on size
      transition: EASINGS.spring
    }
  }
};
```

### Select / Dropdown

```typescript
export const select = {
  trigger: {
    whileHover: {
      borderColor: "rgba(255,255,255,0.3)",
      transition: { duration: 0.15 }
    },
    whileFocus: {
      borderColor: "#F59E0B",
      boxShadow: "0 0 0 3px rgba(245, 158, 11, 0.2)"
    }
  },
  
  chevron: {
    open: {
      rotate: 180,
      transition: { duration: 0.2 }
    }
  },
  
  options: {
    initial: { opacity: 0, y: -10, height: 0 },
    animate: {
      opacity: 1,
      y: 0,
      height: "auto",
      transition: {
        duration: 0.2,
        staggerChildren: 0.03
      }
    }
  }
};
```

---

## Lobby & Social Animations

### Player Slot

```typescript
export const playerSlot = {
  empty: {
    animate: {
      borderColor: [
        "rgba(255,255,255,0.1)",
        "rgba(255,255,255,0.2)",
        "rgba(255,255,255,0.1)"
      ],
      transition: { duration: 2, repeat: Infinity }
    }
  },
  
  joining: {
    animate: {
      borderColor: "#F59E0B",
      boxShadow: [
        "0 0 0 rgba(245, 158, 11, 0)",
        "0 0 20px rgba(245, 158, 11, 0.5)",
        "0 0 0 rgba(245, 158, 11, 0)"
      ],
      transition: { duration: 1, repeat: Infinity }
    }
  },
  
  filled: {
    initial: { scale: 0.9, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: EASINGS.spring
    }
  },
  
  ready: {
    animate: {
      boxShadow: "0 0 20px rgba(34, 197, 94, 0.5)",
      borderColor: "#22C55E"
    }
  }
};
```

### Ready Check

```typescript
export const readyCheck = {
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      boxShadow: [
        "0 0 20px rgba(245, 158, 11, 0.3)",
        "0 0 40px rgba(245, 158, 11, 0.6)",
        "0 0 20px rgba(245, 158, 11, 0.3)"
      ],
      transition: { duration: 1, repeat: Infinity }
    }
  },
  
  countdown: {
    animate: {
      scale: [1.2, 1],
      transition: { duration: 1 }
    }
  },
  
  allReady: {
    animate: {
      scale: [1, 1.1, 1],
      backgroundColor: "#22C55E",
      transition: { duration: 0.5 }
    }
  }
};
```

### Chat Message

```typescript
export const chatMessage = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2 }
  },
  
  // Own message (right aligned)
  own: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 }
  },
  
  // System message
  system: {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
      opacity: 0.7,
      scale: 1,
      transition: { duration: 0.3 }
    }
  }
};
```

---

## Victory & Level Up

### Victory Screen

```typescript
export const victory = {
  container: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2
      }
    }
  },
  
  title: {
    initial: { y: -50, opacity: 0, scale: 0.5 },
    animate: {
      y: 0,
      opacity: 1,
      scale: [0.5, 1.2, 1],
      transition: { duration: 0.8, ease: EASINGS.heroic }
    }
  },
  
  confetti: {
    count: 100,
    colors: ["#F59E0B", "#22C55E", "#3B82F6", "#EF4444", "#8B5CF6"],
    config: {
      type: "cannon",
      spread: 60,
      duration: 3,
      gravity: 0.8
    }
  },
  
  rewards: {
    container: {
      initial: { y: 50, opacity: 0 },
      animate: {
        y: 0,
        opacity: 1,
        transition: { delay: 0.5, duration: 0.5 }
      }
    },
    item: {
      initial: { scale: 0, rotate: -180 },
      animate: (i: number) => ({
        scale: 1,
        rotate: 0,
        transition: { delay: 0.7 + i * 0.15, ...EASINGS.spring }
      })
    }
  },
  
  xpBar: {
    fill: {
      initial: { width: 0 },
      animate: (percent: number) => ({
        width: `${percent}%`,
        transition: { delay: 1, duration: 1.5, ease: EASINGS.smooth }
      })
    }
  }
};
```

### Level Up

```typescript
export const levelUp = {
  overlay: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      backgroundColor: "rgba(245, 158, 11, 0.2)",
      transition: { duration: 0.3 }
    }
  },
  
  burst: {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: [0, 3, 2],
      opacity: [0, 1, 0],
      transition: { duration: 1.2 }
    }
  },
  
  text: {
    initial: { y: 50, opacity: 0, scale: 0 },
    animate: {
      y: 0,
      opacity: 1,
      scale: [0, 1.3, 1],
      transition: { duration: 0.6, ease: EASINGS.heroic }
    },
    content: "LEVEL UP!"
  },
  
  newLevel: {
    initial: { scale: 0 },
    animate: {
      scale: [0, 1.5, 1],
      transition: { delay: 0.4, duration: 0.5 }
    }
  },
  
  rays: {
    count: 12,
    animate: {
      rotate: [0, 360],
      scale: [0, 1, 0.8],
      opacity: [0, 1, 0],
      transition: { duration: 2, ease: "easeOut" }
    }
  },
  
  particles: {
    count: 50,
    colors: ["#F59E0B", "#FBBF24", "#FDE68A"],
    config: {
      type: "fountain",
      height: 200,
      spread: 40,
      duration: 2
    }
  }
};
```

---

## Inventory Animations

### Item Grid

```typescript
export const inventoryGrid = {
  container: {
    animate: {
      transition: {
        staggerChildren: 0.02
      }
    }
  },
  
  slot: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.2 }
    },
    whileHover: {
      scale: 1.05,
      zIndex: 10,
      transition: { duration: 0.1 }
    }
  },
  
  emptySlot: {
    whileHover: {
      backgroundColor: "rgba(255,255,255,0.05)",
      transition: { duration: 0.1 }
    }
  }
};
```

### Drag & Drop

```typescript
export const itemDrag = {
  dragging: {
    scale: 1.1,
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
    cursor: "grabbing",
    zIndex: 100
  },
  
  dropTarget: {
    valid: {
      backgroundColor: "rgba(34, 197, 94, 0.2)",
      borderColor: "#22C55E",
      scale: 1.05
    },
    invalid: {
      backgroundColor: "rgba(239, 68, 68, 0.2)",
      borderColor: "#EF4444"
    }
  },
  
  drop: {
    animate: {
      scale: [1.1, 0.95, 1],
      transition: { duration: 0.2 }
    }
  }
};
```

### Item Pickup (Loot)

```typescript
export const itemPickup = {
  spawn: {
    initial: { y: -30, opacity: 0, scale: 0 },
    animate: {
      y: 0,
      opacity: 1,
      scale: [0, 1.2, 1],
      transition: { duration: 0.4, ease: EASINGS.bounce }
    }
  },
  
  hover: {
    animate: {
      y: [0, -5, 0],
      transition: { duration: 1, repeat: Infinity }
    }
  },
  
  glow: {
    common: "none",
    uncommon: { boxShadow: "0 0 15px rgba(34, 197, 94, 0.5)" },
    rare: { boxShadow: "0 0 20px rgba(59, 130, 246, 0.6)" },
    veryRare: { boxShadow: "0 0 25px rgba(139, 92, 246, 0.7)" },
    legendary: {
      animate: {
        boxShadow: [
          "0 0 20px rgba(245, 158, 11, 0.5)",
          "0 0 40px rgba(245, 158, 11, 0.8)",
          "0 0 20px rgba(245, 158, 11, 0.5)"
        ],
        transition: { duration: 1.5, repeat: Infinity }
      }
    }
  },
  
  collect: {
    animate: {
      scale: [1, 1.5, 0],
      y: [0, -30, -60],
      opacity: [1, 1, 0],
      transition: { duration: 0.4 }
    }
  }
};
```

---

## Particle System Configurations

### Fire Particles

```typescript
export const fireParticles = {
  particles: {
    number: { value: 50 },
    color: { value: ["#F97316", "#DC2626", "#FBBF24"] },
    shape: { type: "circle" },
    opacity: {
      value: { min: 0.3, max: 0.8 },
      animation: { enable: true, speed: 1, minimumValue: 0 }
    },
    size: {
      value: { min: 2, max: 8 },
      animation: { enable: true, speed: 3, minimumValue: 1 }
    },
    move: {
      enable: true,
      direction: "top",
      speed: { min: 3, max: 8 },
      random: true,
      outModes: { default: "destroy" }
    },
    life: {
      duration: { value: 1 },
      count: 1
    }
  },
  emitters: {
    position: { x: 50, y: 100 },
    rate: { quantity: 5, delay: 0.1 }
  }
};
```

### Magic Sparkles

```typescript
export const magicSparkles = {
  particles: {
    number: { value: 30 },
    color: { value: ["#8B5CF6", "#A855F7", "#C084FC"] },
    shape: { type: "star", options: { star: { sides: 4 } } },
    opacity: {
      value: { min: 0.5, max: 1 },
      animation: { enable: true, speed: 2 }
    },
    size: {
      value: { min: 1, max: 4 },
      animation: { enable: true, speed: 2 }
    },
    move: {
      enable: true,
      direction: "none",
      speed: { min: 0.5, max: 2 },
      random: true
    },
    twinkle: {
      particles: { enable: true, frequency: 0.5, opacity: 1 }
    }
  }
};
```

### Blood/Damage Particles

```typescript
export const damageParticles = {
  particles: {
    number: { value: 15 },
    color: { value: ["#DC2626", "#B91C1C", "#7F1D1D"] },
    shape: { type: "circle" },
    opacity: { value: 0.8 },
    size: { value: { min: 2, max: 6 } },
    move: {
      enable: true,
      direction: "none",
      speed: { min: 5, max: 15 },
      decay: 0.1,
      gravity: { enable: true, acceleration: 15 },
      outModes: { default: "destroy" }
    },
    life: {
      duration: { value: 0.5 },
      count: 1
    }
  },
  emitters: {
    startCount: 15,
    rate: { quantity: 0, delay: 0 },
    life: { count: 1 }
  }
};
```

### Healing Particles

```typescript
export const healingParticles = {
  particles: {
    number: { value: 20 },
    color: { value: ["#22C55E", "#4ADE80", "#86EFAC"] },
    shape: { 
      type: "char",
      options: { char: { value: ["+", "✚"], font: "Arial" } }
    },
    opacity: {
      value: { min: 0.5, max: 1 },
      animation: { enable: true, speed: 1 }
    },
    size: { value: { min: 8, max: 16 } },
    move: {
      enable: true,
      direction: "top",
      speed: { min: 1, max: 3 },
      outModes: { default: "destroy" }
    },
    rotate: {
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 5 }
    }
  }
};
```

---

## Sound Effect Triggers

```typescript
// Sound effects paired with animations
export const SOUND_TRIGGERS = {
  // UI
  buttonHover: { sound: "ui_hover", volume: 0.3 },
  buttonClick: { sound: "ui_click", volume: 0.5 },
  modalOpen: { sound: "ui_whoosh", volume: 0.4 },
  modalClose: { sound: "ui_close", volume: 0.3 },
  notification: { sound: "ui_notification", volume: 0.6 },
  error: { sound: "ui_error", volume: 0.5 },
  success: { sound: "ui_success", volume: 0.6 },
  
  // Cards
  cardHover: { sound: "card_hover", volume: 0.2 },
  cardSelect: { sound: "card_select", volume: 0.4 },
  cardPlay: { sound: "card_play", volume: 0.5 },
  
  // Dice
  diceShake: { sound: "dice_shake", volume: 0.5 },
  diceRoll: { sound: "dice_roll", volume: 0.6 },
  diceLand: { sound: "dice_land", volume: 0.7 },
  diceCritical: { sound: "dice_critical", volume: 0.8 },
  diceFumble: { sound: "dice_fumble", volume: 0.6 },
  
  // Combat
  attackSwing: { sound: "combat_swing", volume: 0.6 },
  attackHit: { sound: "combat_hit", volume: 0.7 },
  attackMiss: { sound: "combat_miss", volume: 0.4 },
  spellCast: { sound: "spell_cast", volume: 0.6 },
  damage: { sound: "combat_damage", volume: 0.5 },
  death: { sound: "combat_death", volume: 0.7 },
  heal: { sound: "combat_heal", volume: 0.5 },
  
  // Movement
  footstep: { sound: "move_step", volume: 0.2 },
  tokenSelect: { sound: "token_select", volume: 0.4 },
  
  // Rewards
  levelUp: { sound: "reward_levelup", volume: 0.8 },
  itemPickup: { sound: "reward_item", volume: 0.5 },
  victory: { sound: "reward_victory", volume: 0.9 }
};
```

---

## Implementation Example

```tsx
// Full component example with all animations
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import { characterCard, SOUND_TRIGGERS } from '@/animations';

export function CharacterCard({ character, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const { play } = useSound();
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * 10, y: -x * 10 });
  };
  
  return (
    <motion.div
      className="character-card"
      variants={characterCard.container}
      initial="initial"
      animate="animate"
      whileHover="whileHover"
      onHoverStart={() => {
        setIsHovered(true);
        play(SOUND_TRIGGERS.cardHover);
      }}
      onHoverEnd={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={() => {
        play(SOUND_TRIGGERS.cardSelect);
        onSelect(character);
      }}
      style={{
        rotateX: tilt.x,
        rotateY: tilt.y,
        transformStyle: "preserve-3d",
        perspective: 1000
      }}
    >
      <motion.div 
        className="portrait"
        variants={characterCard.portrait}
      >
        <img src={character.portrait} alt={character.name} />
      </motion.div>
      
      <motion.div
        className="level-badge"
        variants={characterCard.levelBadge}
        animate="animate"
      >
        Lvl {character.level}
      </motion.div>
      
      <div className="health-bar-container">
        <motion.div
          className="health-bar"
          variants={characterCard.healthBar}
          animate={characterCard.healthBar.animate(character.hp, character.maxHp)}
        />
        <motion.div
          className="health-pulse"
          variants={characterCard.healthPulse}
          animate={characterCard.healthPulse.animate(character.hp, character.maxHp)}
        />
      </div>
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="particle-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Particles options={magicSparkles} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

---

## Checklist for Implementation

For EVERY animated component, verify:

1. ☐ Framer Motion `variants` object defined
2. ☐ `initial`, `animate`, `exit` states specified
3. ☐ Hover state (`whileHover`) if interactive
4. ☐ Tap state (`whileTap`) if clickable
5. ☐ Sound effect trigger attached
6. ☐ `AnimatePresence` wrapping if conditional render
7. ☐ Stagger configured for lists
8. ☐ Spring physics used where appropriate
9. ☐ Reduced motion respected (`useReducedMotion`)
10. ☐ Mobile touch feedback added
11. ☐ Loading skeleton if async data
12. ☐ Error state animation if applicable

---

**END OF DOCUMENT 33**
