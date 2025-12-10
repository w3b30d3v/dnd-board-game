# Document 45: Character Trading Card Specification

## Overview

This document specifies the design and implementation of the **Character Trading Card** - a printable, collectible card that players can use to showcase their D&D characters. The card follows standard trading card dimensions (2.5" × 3.5") matching MTG/Pokemon cards.

---

## Design Mockup

**Reference File:** `docs/mockups/16_character_trading_card.html`

Open this file in a browser to see the exact look and feel of the card.

---

## Card Dimensions

| Property | Value |
|----------|-------|
| **Physical Size** | 2.5" × 3.5" (63.5mm × 88.9mm) |
| **Screen Size** | 250px × 350px (at 100dpi) |
| **Print Resolution** | 750px × 1050px (at 300dpi) |
| **Aspect Ratio** | 5:7 |
| **Border Radius** | 10px |

---

## Card Layout (Top to Bottom)

### 1. Header Section
- **Character Name**: Center-aligned, Cinzel font, 12px, gold (#F59E0B), uppercase
- **Rarity Stars**: 1-5 stars below name, filled stars are gold, empty stars are gray (#3f3f46)
- **Background**: Subtle gold gradient fade

### 2. Ornate Bar
- Gold gradient bar (dark gold → bright gold → dark gold)
- Height: 6px
- Adds visual separation and D&D flair

### 3. Character Image
- **Size**: 120px height, full width minus margins
- **Border**: 2px solid gold (#F59E0B) with glow
- **Navigation**: Left/right arrows (hidden on print)
- **Counter**: "1/3" indicator (hidden on print)
- **Images**: Portrait, Heroic Pose, Action Pose

### 4. Character Subtitle
- Format: "Race • Class • Lv.X"
- Gray text (#a1a1aa), 10px

### 5. Main Stats (4 boxes)
- Grid layout, 4 columns
- Each stat box has:
  - Colored icon with glow effect
  - Large value number (colored per stat)
  - Label below

| Stat | Icon | Color | Description |
|------|------|-------|-------------|
| **PWR** (Power) | ⚔ | Red (#FF6B6B) | Attack power |
| **DEF** (Defense) | 🛡 | Cyan (#7DD3FC) | Armor Class |
| **MAG** (Magic) | ✨ | Purple (#C4B5FD) | Spellcasting modifier |
| **HP** (Hit Points) | ❤ | Green (#86EFAC) | Health |

### 6. Ability Scores (6 boxes)
- Horizontal row of 6 small boxes
- Gold borders, gold labels
- Values in warm gold (#FCD34D)

| Ability | Full Name |
|---------|-----------|
| STR | Strength |
| DEX | Dexterity |
| CON | Constitution |
| INT | Intelligence |
| WIS | Wisdom |
| CHA | Charisma |

### 7. Motto/Quote
- Italic text, 9px, light gray
- Single line with ellipsis if too long
- Personal character quote or motto

### 8. D&D Logo
- Positioned at very bottom (3px from border)
- "D&D" in Cinzel Decorative font
- Gold with glow effect

---

## Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Gold | #F59E0B | Borders, accents, name |
| Warm Gold | #FCD34D | Values, highlights |
| Dark Gold | #92400E | Gradient edges |

### Stat Colors
| Stat | Icon Color | Value Color | Glow |
|------|------------|-------------|------|
| Power | #FF6B6B | #FCA5A5 | rgba(239, 68, 68, 0.4) |
| Defense | #7DD3FC | #BAE6FD | rgba(56, 189, 248, 0.4) |
| Magic | #C4B5FD | #DDD6FE | rgba(167, 139, 250, 0.4) |
| HP | #86EFAC | #BBF7D0 | rgba(74, 222, 128, 0.4) |

### Background Colors
| Name | Hex | Usage |
|------|-----|-------|
| Card BG Start | #2a2735 | Top of card gradient |
| Card BG Mid | #1e1b26 | Middle of card |
| Card BG End | #151218 | Bottom of card |
| Box BG | rgba(0,0,0,0.3-0.6) | Stat boxes |

---

## Typography

| Element | Font | Size | Weight | Style |
|---------|------|------|--------|-------|
| Character Name | Cinzel | 12px | 700 | Uppercase |
| Rarity Stars | System | 10px | - | - |
| Subtitle | Crimson Text | 10px | 400 | Normal |
| Stat Value | Cinzel | 14px | 700 | Normal |
| Stat Label | System | 6px | 600 | Uppercase |
| Ability Name | System | 7px | 600 | Normal |
| Ability Value | System | 10px | 700 | Normal |
| Motto | Crimson Text | 9px | 400 | Italic |
| D&D Logo | Cinzel Decorative | 12-16px | 700 | Normal |

---

## Stat Calculations

### Power (PWR)
```typescript
const power = Math.max(
  character.abilityScores.strength,
  character.abilityScores.dexterity
) + character.proficiencyBonus;
```

### Defense (DEF)
```typescript
const defense = character.armorClass; // AC value
```

### Magic (MAG)
```typescript
const spellcastingAbility = getSpellcastingAbility(character.class);
const magic = spellcastingAbility
  ? getAbilityModifier(character.abilityScores[spellcastingAbility]) + character.proficiencyBonus
  : 0;
```

### Hit Points (HP)
```typescript
const hp = character.maxHitPoints;
```

---

## Rarity System

Rarity is determined by race/class combination uniqueness:

| Stars | Rarity | Examples |
|-------|--------|----------|
| ★☆☆☆☆ | Common | Human Fighter, Elf Ranger |
| ★★☆☆☆ | Uncommon | Dwarf Cleric, Half-Elf Bard |
| ★★★☆☆ | Rare | Tiefling Warlock, Dragonborn Paladin |
| ★★★★☆ | Epic | Drow Wizard, Aasimar Sorcerer |
| ★★★★★ | Legendary | Exotic race/class combinations |

### Rarity Calculation
```typescript
function calculateRarity(race: string, characterClass: string): number {
  const rareRaces = ['Tiefling', 'Dragonborn', 'Aasimar', 'Drow', 'Genasi'];
  const rareClasses = ['Warlock', 'Sorcerer', 'Paladin', 'Monk'];

  let rarity = 1; // Base common

  if (rareRaces.includes(race)) rarity += 2;
  if (rareClasses.includes(characterClass)) rarity += 1;

  // Specific legendary combinations
  if (race === 'Aasimar' && characterClass === 'Paladin') rarity = 5;
  if (race === 'Drow' && characterClass === 'Wizard') rarity = 5;

  return Math.min(rarity, 5);
}
```

---

## Print Functionality

### Print Styles
When printing, the following elements are hidden:
- Navigation arrows
- Image counter (1/3)
- Page title and info section

### CSS Print Rules
```css
@media print {
  .image-nav-arrows,
  .nav-arrow,
  .image-counter {
    display: none !important;
  }

  .card-container {
    width: 2.5in;
    height: 3.5in;
  }
}
```

### Image Selection for Print
Users can use the arrow buttons to select which of the 3 character images appears on the printed card before printing.

---

## React Component Structure

```tsx
interface CharacterCardProps {
  character: {
    name: string;
    race: string;
    class: string;
    level: number;
    abilityScores: {
      strength: number;
      dexterity: number;
      constitution: number;
      intelligence: number;
      wisdom: number;
      charisma: number;
    };
    armorClass: number;
    maxHitPoints: number;
    motto?: string;
    images: {
      portrait: string;
      heroicPose?: string;
      actionPose?: string;
    };
  };
  onPrint?: () => void;
}

function CharacterTradingCard({ character, onPrint }: CharacterCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const rarity = calculateRarity(character.race, character.class);

  // ... implementation
}
```

---

## Animation Requirements

### Interactive Elements (Screen Only)
- **Arrow Hover**: Background glow, border brightens
- **Arrow Click**: Scale down to 0.95
- **Image Transition**: Fade out (150ms) → change → fade in (150ms)

### Static for Print
All animations are disabled in print mode.

---

## Accessibility

- Arrow buttons have aria-labels
- Sufficient color contrast for all text
- Stars use actual star characters (not just color)

---

## File Locations

| File | Purpose |
|------|---------|
| `docs/mockups/16_character_trading_card.html` | Reference mockup |
| `docs/45_Character_Trading_Card_Specification.md` | This specification |
| `apps/web/src/components/character/CharacterTradingCard.tsx` | React component (to implement) |

---

## Implementation Checklist

- [x] Design mockup created
- [x] Specification document written
- [ ] React component implemented
- [ ] Print functionality tested
- [ ] Integration with character builder
- [ ] Export to PNG/PDF feature
