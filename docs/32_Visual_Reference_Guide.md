# D&D Digital Board Game - Visual Reference & Immersion Guide

## Purpose
This document provides **visual references** and **feel guidelines** for Claude Code to understand the intended aesthetic and user experience quality.

---

## 1. VISUAL INSPIRATION

### Games to Reference for Aesthetic

**Baldur's Gate 3** (Larian Studios)
- Dark, atmospheric UI
- Rich character portraits
- Cinematic camera work
- Spell effects with particle systems
- Reference for: Combat UI, character sheets, inventory

**D&D Beyond**
- Clean information hierarchy
- Gold accents on dark backgrounds
- Familiar D&D iconography
- Reference for: Character builder, rules display

**Slay the Spire**
- Card-based ability presentation
- Clear visual feedback
- Satisfying animations on actions
- Reference for: Spell cards, action selection

**Disco Elysium**
- Painterly character art
- Atmospheric text presentation
- Strong typographic hierarchy
- Reference for: Dialogue, narrative beats

**Diablo IV**
- Dark fantasy aesthetic
- Impactful ability effects
- Satisfying loot/reward reveals
- Reference for: Combat feedback, rewards

### UI References
- Apple TV+ UI (smooth animations, glass effects)
- Netflix (cards, hover states, micro-interactions)
- Spotify (dark theme, accent colors, transitions)

---

## 2. THE FEEL WE'RE CREATING

### Core Emotional Goals

1. **Epic & Heroic**
   - Players should feel like legendary heroes
   - Every action should have weight and impact
   - Success should feel triumphant

2. **Mysterious & Magical**
   - The UI itself should feel enchanted
   - Subtle magical elements everywhere (particles, glows)
   - Discovery should feel rewarding

3. **Cinematic & Polished**
   - Like watching a movie where you're the star
   - Smooth transitions between everything
   - No jarring or sudden changes

4. **Tactile & Responsive**
   - Every interaction should have feedback
   - Buttons should feel "pushable"
   - Cards should feel like real cards

### What to AVOID

❌ Generic, flat, "web app" feel
❌ Instant/jarring transitions
❌ Silent, feedback-less interactions
❌ Cluttered, busy interfaces
❌ Bright, washed-out colors
❌ Small, cramped touch targets
❌ Static, lifeless UI elements

---

## 3. SPECIFIC VISUAL REQUIREMENTS

### Every Screen Must Have:

1. **Animated Background**
   - Subtle particle effects OR
   - Gradient shifts OR
   - Ambient movement
   
2. **Depth & Layers**
   - Use shadows generously
   - Backdrop blur for overlays
   - Cards should "float"

3. **Golden Accents**
   - Primary actions = gold
   - Important information = gold highlights
   - Success states = gold glow

4. **Dark Foundation**
   - Background: Near-black (#0F0D13)
   - Surfaces: Dark purple-gray (#1E1B26)
   - Never pure white text (use #F4F4F5)

### Every Interaction Must Have:

1. **Visual Feedback**
   - Hover: Scale up slightly, glow
   - Click/Tap: Scale down briefly
   - Success: Burst of particles or glow

2. **Audio Feedback** (when audio enabled)
   - Hover: Subtle woosh
   - Click: Satisfying click
   - Success: Magical chime

3. **Motion**
   - Spring physics for bouncy elements
   - Ease-out for entrances
   - Quick ease-in for exits

---

## 4. COMPONENT-SPECIFIC DIRECTION

### Character Cards
```
FEEL: Like a trading card you want to collect
- Holographic-style border glow on hover
- 3D tilt following mouse cursor
- Portrait should feel "alive" (subtle movement)
- Level badge should shimmer
```

### Dice Rolls
```
FEEL: The suspense of a real dice roll
- Build anticipation with shake animation
- Tumble animation should feel physics-based
- Result should SLAM into place
- Critical hits need CELEBRATION (particles, sound, screen effect)
```

### Spell Cards
```
FEEL: Ancient, powerful grimoire pages
- Colored by spell school
- Magical particles on hover
- Casting should feel like unleashing power
- Damage numbers should be dramatic
```

### Combat Log
```
FEEL: Like watching an exciting battle unfold
- Entries slide in cinematically
- Damage should POP with color
- Crits should have special treatment
- Deaths should be dramatic
```

### Health Bars
```
FEEL: Visceral, life-or-death tension
- Smooth, satisfying fill animation
- Color transitions as health drops
- Critical health should PULSE urgently
- Damage should flash red momentarily
```

### Modals/Dialogs
```
FEEL: Important moment demanding attention
- Backdrop blur (not just darken)
- Spring animation entrance
- Content should stagger in
- Close should be quick and clean
```

### Navigation
```
FEEL: Seamless, magical transportation
- Page transitions should feel like portals
- Active state should glow
- Hover should have magnetic feel
```

---

## 5. ANIMATION TIMING GUIDE

### Fast Interactions (User-initiated)
- Button press feedback: 100ms
- Hover state change: 150ms
- Small element movement: 200ms

### Medium Transitions
- Card hover lift: 300ms
- Modal entrance: 400ms
- Page content stagger: 50ms between items

### Slow/Dramatic
- Page transitions: 500ms
- Dice roll: 1500ms (with build-up)
- Victory/reward reveals: 800ms
- Cinematic moments: 1200ms

### Looping/Ambient
- Floating particles: 10-15s per cycle
- Glow pulses: 2-3s per cycle
- Idle animations: 3-5s per cycle

---

## 6. COLOR PSYCHOLOGY

### Gold (#F59E0B, #FBBF24)
- Use for: Primary actions, success, rewards, important
- Emotion: Triumphant, valuable, heroic
- Examples: Attack button, gold loot, level up

### Purple (#8B5CF6, #A78BFA)
- Use for: Magic, mystery, spell-related
- Emotion: Arcane, powerful, otherworldly
- Examples: Spells, magical effects, XP

### Red (#EF4444, #DC2626)
- Use for: Danger, damage, enemies, warnings
- Emotion: Urgent, threatening, intense
- Examples: Enemy tokens, damage numbers, health low

### Green (#22C55E, #16A34A)
- Use for: Health, healing, success, nature
- Emotion: Life, safety, restoration
- Examples: Health bars, healing effects, success toasts

### Blue (#3B82F6, #2563EB)
- Use for: Information, water, cold, player allies
- Emotion: Calm, trustworthy, cool
- Examples: Player tokens, info tooltips, cold damage

---

## 7. TYPOGRAPHY HIERARCHY

### Display (Cinzel)
- Use for: Titles, names, important labels
- Character: Medieval, epic, authoritative
- Sizes: 2rem+ for major headings

### Body (Inter)
- Use for: Descriptions, instructions, UI text
- Character: Clean, readable, modern
- Sizes: 0.875rem - 1rem

### Stats (JetBrains Mono)
- Use for: Numbers, dice, stats, code
- Character: Technical, precise, gaming
- Sizes: As needed, often bold

### Example Hierarchy:
```
THORIN IRONFORGE     <- Cinzel, 1.5rem, white
Dwarf Fighter        <- Inter, 0.9rem, gray
HP: 45/52            <- JetBrains Mono, bold, white/gray
```

---

## 8. SOUND DESIGN DIRECTION

### UI Sounds
- **Click**: Soft, satisfying, like a quality button
- **Hover**: Barely audible woosh, adds texture
- **Success**: Bright chime, rewarding
- **Error**: Low thud, non-alarming but clear

### Combat Sounds
- **Sword swing**: Metallic whoosh
- **Hit**: Impact with slight delay
- **Spell cast**: Magical buildup + release
- **Critical**: Emphasized, triumphant

### Ambient
- **Menu**: Soft, mysterious fantasy ambience
- **Combat**: Tense, driving percussion
- **Victory**: Triumphant orchestral swell
- **Exploration**: Calm, wonder-filled

---

## 9. RESPONSIVE CONSIDERATIONS

### Mobile (< 768px)
- Larger touch targets (48px minimum)
- Bottom navigation
- Full-screen modals
- Simplified animations (reduce particles)
- Gesture support critical

### Tablet (768px - 1024px)
- Can show more information
- Side panels work
- Full animations

### Desktop (> 1024px)
- Rich hover states
- Keyboard shortcuts visible
- Multiple panels simultaneously
- Full particle effects

---

## 10. ACCESSIBILITY WITH STYLE

### Motion Sensitivity
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable non-essential animations */
  /* Keep functional feedback */
  /* Use opacity instead of movement */
}
```

### Color Blindness
- Don't rely on color alone
- Add icons/patterns to color coding
- Test with color blindness simulators

### Screen Readers
- All interactive elements labeled
- Meaningful alt text for images
- Live regions for dynamic content

---

## 11. QUALITY CHECKLIST

Before considering ANY component complete:

- [ ] Has entrance animation
- [ ] Has hover state (desktop)
- [ ] Has active/pressed state
- [ ] Has appropriate sound (if audio enabled)
- [ ] Works on mobile (touch, size)
- [ ] Respects reduced motion preference
- [ ] Has loading state if async
- [ ] Has error state if applicable
- [ ] Matches color palette exactly
- [ ] Uses correct fonts
- [ ] Feels "alive" (not static)

---

## 12. FINAL WORD

**The goal is not just a functional D&D game.**

**The goal is a MAGICAL EXPERIENCE that makes players feel like heroes embarking on an epic adventure every time they open the app.**

Every pixel, every animation, every sound should contribute to that fantasy.

When in doubt, ask: "Does this feel epic enough?"

If not, add more:
- Glow
- Particles
- Sound
- Weight
- Drama

---

# END OF VISUAL REFERENCE GUIDE
