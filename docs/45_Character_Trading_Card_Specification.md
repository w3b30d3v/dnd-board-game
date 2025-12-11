# Document 45: Character Trading Card Specification

## Overview

This document specifies the design and implementation of the **Character Trading Card** - a collectible card modal that players can use to showcase their D&D characters with AI-generated artwork. The card is designed for on-screen viewing with a larger format optimized for displaying character images.

---

## Implementation Status

**✅ IMPLEMENTED** - The trading card modal is fully functional in `apps/web/src/app/dashboard/DashboardContent.tsx`

---

## Card Dimensions

| Property | Value |
|----------|-------|
| **Screen Size** | 320px × 520px |
| **Aspect Ratio** | ~8:13 |
| **Border Radius** | 16px |
| **Image Area** | 240px height (optimized for full image display) |

---

## Card Layout (Top to Bottom)

### 1. Header Section
- **Character Name**: Center-aligned, Cinzel font, 16px (text-base), gold (#F59E0B), uppercase, tracking-wider
- **Rarity Stars**: 1-5 stars below name (14px), filled stars are gold with glow, empty stars are zinc-700
- **Background**: Subtle gold gradient fade (15% opacity)

### 2. Ornate Bar
- Gold gradient bar (dark gold → bright gold → dark gold)
- Height: 4px
- Border radius: 2px
- Box shadow for glow effect

### 3. Character Image
- **Size**: 240px height, full width minus margins (mx-4)
- **Border**: 3px solid gold (#F59E0B) with glow
- **Border Radius**: 8px
- **Object Fit**: `object-contain` (shows full image without cropping)
- **Background**: Radial gradient from #1a1520 to #0f0d13
- **Navigation**: Left/right arrows (8×8 circles, visible only when multiple images)
- **Image Label**: Shows current image type (Portrait, Heroic Pose, Action Pose)
- **Counter**: "1 / 3" indicator (only shown when multiple images)
- **Images**: Portrait (1:1), Heroic Pose (2:3), Action Pose (2:3)

### 4. Character Subtitle
- Format: "Race • Class • Level X"
- Crimson Text font, 14px (text-sm), zinc-300
- Capitalized text

### 5. Main Stats (4 boxes)
- Grid layout, 4 columns with gap-2
- Rounded corners with colored borders matching each stat
- Each stat box has:
  - Colored icon (text-xl) with glow effect and brightness filter
  - Large value number (text-lg, Cinzel font, colored per stat with glow)
  - Label below (text-[9px], uppercase, tracking-wider, colored)
  - Background gradient from stat color (10% opacity) to black

| Stat | Icon | Icon Color | Value Color | Border Color |
|------|------|------------|-------------|--------------|
| **PWR** (Power) | ⚔ | #FF6B6B | #FCA5A5 | rgba(239, 68, 68, 0.4) |
| **DEF** (Defense) | 🛡 | #7DD3FC | #BAE6FD | rgba(56, 189, 248, 0.4) |
| **MAG** (Magic) | ✨ | #C4B5FD | #DDD6FE | rgba(167, 139, 250, 0.4) |
| **HP** (Hit Points) | ❤ | #86EFAC | #BBF7D0 | rgba(74, 222, 128, 0.4) |

### 6. Ability Scores (6 boxes)
- Horizontal row of 6 boxes with justify-between
- Gold borders (rgba(245, 158, 11, 0.5))
- Black background (rgba(0, 0, 0, 0.4))
- Labels: text-[8px], font-bold, gold (#F59E0B)
- Values: text-sm, Cinzel font, warm gold (#FCD34D) with glow

| Ability | Full Name |
|---------|-----------|
| STR | Strength |
| DEX | Dexterity |
| CON | Constitution |
| INT | Intelligence |
| WIS | Wisdom |
| CHA | Charisma |

### 7. Motto/Quote
- Crimson Text font, italic, 14px (text-sm)
- zinc-300 color
- Line clamp to 2 lines max
- Displays character's personality trait or default quote

### 8. D&D Logo
- Positioned at bottom (8px from border)
- "D&D" in Cinzel font (not Decorative)
- D letters: 14px, gold (#F59E0B)
- Ampersand: 18px, warm gold (#FCD34D) with glow
- Text shadow for depth

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
| Character Name | Cinzel | 16px (text-base) | 700 | Uppercase, tracking-wider |
| Rarity Stars | System | 14px (text-sm) | - | - |
| Subtitle | Crimson Text | 14px (text-sm) | 400 | Capitalize |
| Stat Icon | System | 20px (text-xl) | - | - |
| Stat Value | Cinzel | 18px (text-lg) | 700 | Normal |
| Stat Label | System | 9px (text-[9px]) | 600 | Uppercase, tracking-wider |
| Ability Name | System | 8px (text-[8px]) | 700 | Uppercase |
| Ability Value | Cinzel | 14px (text-sm) | 700 | Normal |
| Motto | Crimson Text | 14px (text-sm) | 400 | Italic |
| D&D Logo D | Cinzel | 14px | 700 | Normal |
| D&D Logo & | Cinzel | 18px | 400 | Normal |

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

## Print Functionality (Future Enhancement)

Print functionality is planned for a future release. When implemented:
- Navigation arrows and image counter will be hidden
- Card will be sized to standard trading card dimensions (2.5" × 3.5")
- Users can select which image to print before printing

---

## React Component Structure

The CharacterCardModal is implemented as a function component within DashboardContent.tsx:

```tsx
interface CharacterCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
}

function CharacterCardModal({ isOpen, onClose, character }: CharacterCardModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Build image list from portrait and fullBodyUrls
  const imageList = [...];

  // Calculate stats
  const abilities = character.abilityScores || {...};
  const power = Math.max(abilities.strength, abilities.dexterity) + proficiencyBonus;
  const defense = character.armorClass;
  const magicBonus = Math.floor((magicMod - 10) / 2) + proficiencyBonus;
  const hp = character.maxHitPoints;

  // Calculate rarity based on race/class
  const rareRaces = ['tiefling', 'dragonborn', 'aasimar', 'drow', 'genasi'];
  const rareClasses = ['warlock', 'sorcerer', 'paladin', 'monk'];
  let rarity = 1;
  if (rareRaces.includes(character.race.toLowerCase())) rarity += 2;
  if (rareClasses.includes(character.class.toLowerCase())) rarity += 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 ...">
          {/* Card content */}
        </motion.div>
      )}
    </AnimatePresence>
  );
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
| `docs/45_Character_Trading_Card_Specification.md` | This specification |
| `apps/web/src/app/dashboard/DashboardContent.tsx` | Contains CharacterCardModal component |

---

## Implementation Checklist

- [x] Design specification written
- [x] React component implemented (CharacterCardModal in DashboardContent.tsx)
- [x] Integration with dashboard character list
- [x] AI-generated image display (NanoBanana integration)
- [x] Image carousel with navigation arrows
- [x] Rarity system based on race/class
- [x] All stat displays working
- [ ] Print functionality (future enhancement)
- [ ] Export to PNG/PDF feature (future enhancement)
- [ ] Standalone CharacterTradingCard component (optional refactor)
