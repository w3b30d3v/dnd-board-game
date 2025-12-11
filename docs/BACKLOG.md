# Development Backlog

This document tracks features that are planned but depend on future phases.

---

## Character Level-Up System (Phase 3-6 Dependent)

**Priority:** High
**Dependencies:** Game Sessions (Phase 3), Rules Engine (Phase 4), Campaign Builder (Phase 6)

### Overview
Implement a complete XP-based leveling system where characters gain experience from completing encounters and campaigns, automatically leveling up when XP thresholds are reached.

### Database Changes Required

```prisma
model Character {
  // Add to existing model
  experiencePoints   Int      @default(0)

  // Track level-up choices
  levelUpChoices     Json?    // Stores ASI choices, feat selections, etc.
}

model GameSession {
  // Track XP awarded in sessions
  xpAwarded          Int      @default(0)
}
```

### XP Thresholds (D&D 5e RAW)

| Level | XP Required | Level | XP Required |
|-------|-------------|-------|-------------|
| 1 | 0 | 11 | 85,000 |
| 2 | 300 | 12 | 100,000 |
| 3 | 900 | 13 | 120,000 |
| 4 | 2,700 | 14 | 140,000 |
| 5 | 6,500 | 15 | 165,000 |
| 6 | 14,000 | 16 | 195,000 |
| 7 | 23,000 | 17 | 225,000 |
| 8 | 34,000 | 18 | 265,000 |
| 9 | 48,000 | 19 | 305,000 |
| 10 | 64,000 | 20 | 355,000 |

### API Endpoints Required

```typescript
// Award XP to character (called after encounter completion)
POST /characters/:id/award-xp
Body: { xp: number, source: string }
Response: { newXP: number, leveledUp: boolean, newLevel?: number }

// Level up character (if XP threshold reached)
POST /characters/:id/level-up
Body: {
  hpMethod: 'roll' | 'average',
  asiChoice?: { ability: string, increase: number }[], // At levels 4,8,12,16,19
  featChoice?: string, // If taking feat instead of ASI
  spellsLearned?: string[], // For casters
  subclassChoice?: string // At level 3
}
Response: { character: Character, changes: LevelUpChanges }

// Get level-up options for character
GET /characters/:id/level-up-options
Response: {
  canLevelUp: boolean,
  currentXP: number,
  xpToNextLevel: number,
  options: {
    hasASI: boolean,
    newFeatures: ClassFeature[],
    newSpellSlots?: SpellSlots,
    subclassRequired?: boolean
  }
}
```

### UI Components Required

1. **Level-Up Notification**
   - Toast/modal when XP threshold reached
   - "Level Up!" button with celebration animation

2. **Level-Up Wizard Modal**
   - Step 1: HP increase (roll or take average)
   - Step 2: ASI / Feat selection (if applicable)
   - Step 3: New spells (for casters)
   - Step 4: Subclass selection (at level 3)
   - Step 5: Review & confirm

3. **Level-Up Celebration Screen**
   - See mockup: `mockups/12_levelup_celebration_prototype.html`
   - Particle effects, stats comparison, new features showcase

### Campaign Integration

When an encounter is completed:
1. Rules Engine calculates XP based on monster CR and party size
2. XP is distributed to all participating characters
3. Check each character's XP against threshold
4. If threshold reached, flag character for level-up
5. Show level-up prompt on next dashboard visit

### Stats That Change on Level-Up

| Stat | Change | Calculation |
|------|--------|-------------|
| Level | +1 | Direct increment |
| Max HP | +Hit Die + CON mod | Class-specific (d6-d12) |
| Proficiency Bonus | +1 every 4 levels | floor((level-1)/4) + 2 |
| Spell Slots | Class-specific | Per PHB tables |
| Class Features | Level-specific | Per class description |
| ASI | At 4, 8, 12, 16, 19 | +2 to one or +1 to two abilities |

### Hit Die by Class

| Class | Hit Die | Average |
|-------|---------|---------|
| Barbarian | d12 | 7 |
| Fighter, Paladin, Ranger | d10 | 6 |
| Bard, Cleric, Druid, Monk, Rogue, Warlock | d8 | 5 |
| Sorcerer, Wizard | d6 | 4 |

### Implementation Order

1. **Phase 3 (Game Board):** Add XP tracking to game sessions
2. **Phase 4 (Rules Engine):** Calculate XP from encounters
3. **Phase 5 (Multiplayer):** Distribute XP to party members
4. **Phase 6 (Campaign):** Track campaign-wide progression

---

## Manual Level Edit (Can Implement Now - Phase 2)

**Priority:** Medium
**Dependencies:** None

A simpler feature that allows manual level adjustment for testing:

- Add "Edit Level" button to character card
- Simple modal with level selector (1-20)
- Auto-calculate HP based on class and CON
- No XP tracking, just direct level set

This can be implemented immediately and doesn't conflict with the full system.

---

## Other Backlog Items

### Multiclassing Support
- Allow characters to take levels in multiple classes
- Track level distribution per class
- Calculate combined features and spell slots

### Milestone Leveling Option
- Alternative to XP-based leveling
- DM manually triggers level-ups at story milestones
- Toggle in campaign settings

### Character Retirement
- Archive characters at level 20 or by choice
- "Hall of Fame" display for retired characters
- Export character sheet as PDF
