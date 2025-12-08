# D&D Digital Board Game - Asset Requirements Document

Version: 1.0
Purpose: Complete inventory of visual, audio, and video assets required for immersive gameplay

---

## 1. ASSET SOURCES STRATEGY

### Primary Sources (Free/Open Source)
```
Icons:
- Lucide React (MIT License) - UI icons
- Game-icons.net (CC BY 3.0) - Fantasy/RPG icons
- Heroicons (MIT) - Additional UI

Images:
- Unsplash (Free) - Atmospheric backgrounds
- Pexels (Free) - Textures and backgrounds
- OpenGameArt.org (Various CC) - Game sprites and tiles

Fonts:
- Google Fonts (Free) - Cinzel, Inter, JetBrains Mono

Audio:
- Freesound.org (CC0/CC BY) - Sound effects
- OpenGameArt.org - Music loops
- Mixkit (Free) - UI sounds

3D Models:
- Sketchfab (CC) - Dice, tokens
- Kenney.nl (CC0) - Game assets
```

### AI Generation (For Unique Assets)
```
Character Portraits: 
- Generate via Stable Diffusion / Midjourney / DALL-E
- Style: Fantasy illustration, painterly
- Consistent style across all characters

Location Art:
- AI-generated backgrounds
- Style: Dark fantasy, atmospheric

Item Icons:
- Can use game-icons.net or AI-generate custom
```

### Placeholder Strategy
```
During development, use:
- Colored rectangles with labels
- Lorem Picsum for random images
- DiceBear for avatar placeholders
- Simple geometric shapes for icons
```

---

## 2. UI ASSETS

### 2.1 Logo & Branding
| Asset | Format | Size | Description |
|-------|--------|------|-------------|
| logo-full.svg | SVG | - | Full logo with text |
| logo-icon.svg | SVG | - | D icon only |
| logo-icon.png | PNG | 512×512 | App icon |
| favicon.ico | ICO | 32×32 | Browser favicon |
| og-image.png | PNG | 1200×630 | Social share image |

### 2.2 Backgrounds
| Asset | Format | Size | Description |
|-------|--------|------|-------------|
| bg-hero.jpg | JPG | 1920×1080 | Landing page hero |
| bg-dashboard.jpg | JPG | 1920×1080 | Dashboard ambient |
| bg-parchment.png | PNG | Tileable | Parchment texture |
| bg-leather.png | PNG | Tileable | Leather texture |
| bg-stone.png | PNG | Tileable | Stone texture |
| bg-wood.png | PNG | Tileable | Wood texture |
| noise-overlay.png | PNG | 256×256 | Film grain overlay |
| vignette.png | PNG | 1920×1080 | Edge darkening |

### 2.3 UI Elements
| Asset | Format | Size | Description |
|-------|--------|------|-------------|
| border-gold.svg | SVG | - | Gold ornate border |
| border-silver.svg | SVG | - | Silver border |
| corner-ornament.svg | SVG | - | Corner decorations |
| divider-horizontal.svg | SVG | - | Section dividers |
| button-bg-primary.svg | SVG | - | Button background |
| card-frame.svg | SVG | - | Card border frame |
| tooltip-bg.svg | SVG | - | Tooltip background |
| modal-frame.svg | SVG | - | Modal border |

### 2.4 Icons (Beyond Lucide)
| Asset | Format | Size | Description |
|-------|--------|------|-------------|
| icon-sword.svg | SVG | 24×24 | Melee attack |
| icon-bow.svg | SVG | 24×24 | Ranged attack |
| icon-spell.svg | SVG | 24×24 | Cast spell |
| icon-shield.svg | SVG | 24×24 | Defense/AC |
| icon-heart.svg | SVG | 24×24 | Health |
| icon-mana.svg | SVG | 24×24 | Spell slots |
| icon-movement.svg | SVG | 24×24 | Movement |
| icon-action.svg | SVG | 24×24 | Action |
| icon-bonus.svg | SVG | 24×24 | Bonus action |
| icon-reaction.svg | SVG | 24×24 | Reaction |
| icon-d20.svg | SVG | 24×24 | D20 die |
| icon-d12.svg | SVG | 24×24 | D12 die |
| icon-d10.svg | SVG | 24×24 | D10 die |
| icon-d8.svg | SVG | 24×24 | D8 die |
| icon-d6.svg | SVG | 24×24 | D6 die |
| icon-d4.svg | SVG | 24×24 | D4 die |

### 2.5 Damage Type Icons
| Asset | Format | Description |
|-------|--------|-------------|
| damage-fire.svg | SVG | Fire damage |
| damage-cold.svg | SVG | Cold damage |
| damage-lightning.svg | SVG | Lightning damage |
| damage-thunder.svg | SVG | Thunder damage |
| damage-acid.svg | SVG | Acid damage |
| damage-poison.svg | SVG | Poison damage |
| damage-necrotic.svg | SVG | Necrotic damage |
| damage-radiant.svg | SVG | Radiant damage |
| damage-force.svg | SVG | Force damage |
| damage-psychic.svg | SVG | Psychic damage |
| damage-slashing.svg | SVG | Slashing damage |
| damage-piercing.svg | SVG | Piercing damage |
| damage-bludgeoning.svg | SVG | Bludgeoning damage |

### 2.6 Condition Icons
| Asset | Format | Description |
|-------|--------|-------------|
| condition-blinded.svg | SVG | Blinded |
| condition-charmed.svg | SVG | Charmed |
| condition-deafened.svg | SVG | Deafened |
| condition-frightened.svg | SVG | Frightened |
| condition-grappled.svg | SVG | Grappled |
| condition-incapacitated.svg | SVG | Incapacitated |
| condition-invisible.svg | SVG | Invisible |
| condition-paralyzed.svg | SVG | Paralyzed |
| condition-petrified.svg | SVG | Petrified |
| condition-poisoned.svg | SVG | Poisoned |
| condition-prone.svg | SVG | Prone |
| condition-restrained.svg | SVG | Restrained |
| condition-stunned.svg | SVG | Stunned |
| condition-unconscious.svg | SVG | Unconscious |
| condition-exhaustion.svg | SVG | Exhaustion |
| condition-concentration.svg | SVG | Concentration |

---

## 3. CHARACTER ASSETS

### 3.1 Race Portraits (Default/Placeholder)
| Asset | Format | Size | Description |
|-------|--------|------|-------------|
| race-dwarf-m.png | PNG | 512×512 | Male Dwarf |
| race-dwarf-f.png | PNG | 512×512 | Female Dwarf |
| race-elf-m.png | PNG | 512×512 | Male Elf |
| race-elf-f.png | PNG | 512×512 | Female Elf |
| race-human-m.png | PNG | 512×512 | Male Human |
| race-human-f.png | PNG | 512×512 | Female Human |
| race-halfling-m.png | PNG | 512×512 | Male Halfling |
| race-halfling-f.png | PNG | 512×512 | Female Halfling |
| race-dragonborn-m.png | PNG | 512×512 | Male Dragonborn |
| race-dragonborn-f.png | PNG | 512×512 | Female Dragonborn |
| race-tiefling-m.png | PNG | 512×512 | Male Tiefling |
| race-tiefling-f.png | PNG | 512×512 | Female Tiefling |
| race-gnome-m.png | PNG | 512×512 | Male Gnome |
| race-gnome-f.png | PNG | 512×512 | Female Gnome |
| race-half-elf-m.png | PNG | 512×512 | Male Half-Elf |
| race-half-elf-f.png | PNG | 512×512 | Female Half-Elf |
| race-half-orc-m.png | PNG | 512×512 | Male Half-Orc |
| race-half-orc-f.png | PNG | 512×512 | Female Half-Orc |

**Art Direction:**
- Style: Painterly fantasy illustration
- Lighting: Dramatic, warm key light
- Background: Neutral gradient or transparent
- Expression: Determined/heroic
- Framing: Head and shoulders, slight 3/4 angle

### 3.2 Class Icons
| Asset | Format | Size | Description |
|-------|--------|------|-------------|
| class-barbarian.svg | SVG | 64×64 | Barbarian class |
| class-bard.svg | SVG | 64×64 | Bard class |
| class-cleric.svg | SVG | 64×64 | Cleric class |
| class-druid.svg | SVG | 64×64 | Druid class |
| class-fighter.svg | SVG | 64×64 | Fighter class |
| class-monk.svg | SVG | 64×64 | Monk class |
| class-paladin.svg | SVG | 64×64 | Paladin class |
| class-ranger.svg | SVG | 64×64 | Ranger class |
| class-rogue.svg | SVG | 64×64 | Rogue class |
| class-sorcerer.svg | SVG | 64×64 | Sorcerer class |
| class-warlock.svg | SVG | 64×64 | Warlock class |
| class-wizard.svg | SVG | 64×64 | Wizard class |

### 3.3 Token Sprites (For Game Board)
| Asset | Format | Size | Description |
|-------|--------|------|-------------|
| token-frame-player.png | PNG | 128×128 | Blue ring frame |
| token-frame-ally.png | PNG | 128×128 | Green ring frame |
| token-frame-enemy.png | PNG | 128×128 | Red ring frame |
| token-frame-neutral.png | PNG | 128×128 | Yellow ring frame |
| token-selected.png | PNG | 128×128 | Golden selection glow |
| token-targeted.png | PNG | 128×128 | Red target indicator |

---

## 4. MONSTER ASSETS

### 4.1 Common Monsters (Tutorial Campaign)
| Asset | Format | Size | Description |
|-------|--------|------|-------------|
| monster-goblin.png | PNG | 512×512 | Goblin portrait |
| monster-goblin-token.png | PNG | 128×128 | Goblin board token |
| monster-wolf.png | PNG | 512×512 | Wolf portrait |
| monster-wolf-token.png | PNG | 128×128 | Wolf board token |
| monster-skeleton.png | PNG | 512×512 | Skeleton portrait |
| monster-skeleton-token.png | PNG | 128×128 | Skeleton board token |
| monster-zombie.png | PNG | 512×512 | Zombie portrait |
| monster-zombie-token.png | PNG | 128×128 | Zombie board token |
| monster-orc.png | PNG | 512×512 | Orc portrait |
| monster-orc-token.png | PNG | 128×128 | Orc board token |
| monster-kobold.png | PNG | 512×512 | Kobold portrait |
| monster-kobold-token.png | PNG | 128×128 | Kobold board token |

### 4.2 Boss Monsters
| Asset | Format | Size | Description |
|-------|--------|------|-------------|
| boss-goblin-chief.png | PNG | 1024×1024 | Goblin Chief (large) |
| boss-goblin-chief-token.png | PNG | 192×192 | Boss token (larger) |

---

## 5. MAP & ENVIRONMENT ASSETS

### 5.1 Tile Sets (64×64 base, provide @2x)
| Asset | Format | Description |
|-------|--------|-------------|
| tile-stone-floor.png | PNG | Dungeon stone floor |
| tile-stone-wall.png | PNG | Stone wall (top-down) |
| tile-wood-floor.png | PNG | Wooden floor |
| tile-grass.png | PNG | Outdoor grass |
| tile-dirt.png | PNG | Dirt path |
| tile-water.png | PNG | Water (animated?) |
| tile-lava.png | PNG | Lava (animated) |
| tile-ice.png | PNG | Ice/frozen |
| tile-sand.png | PNG | Desert sand |
| tile-cobble.png | PNG | Cobblestone |

### 5.2 Wall Tiles
| Asset | Format | Description |
|-------|--------|-------------|
| wall-stone-n.png | PNG | North-facing wall |
| wall-stone-e.png | PNG | East-facing wall |
| wall-stone-s.png | PNG | South-facing wall |
| wall-stone-w.png | PNG | West-facing wall |
| wall-stone-corner.png | PNG | Corner pieces |
| wall-cave.png | PNG | Cave wall variants |

### 5.3 Props/Objects
| Asset | Format | Size | Description |
|-------|--------|------|-------------|
| prop-chest-closed.png | PNG | 64×64 | Treasure chest |
| prop-chest-open.png | PNG | 64×64 | Open chest |
| prop-barrel.png | PNG | 64×64 | Barrel |
| prop-crate.png | PNG | 64×64 | Wooden crate |
| prop-table.png | PNG | 128×64 | Table |
| prop-chair.png | PNG | 64×64 | Chair |
| prop-bed.png | PNG | 128×64 | Bed |
| prop-torch.png | PNG | 32×64 | Wall torch |
| prop-campfire.png | PNG | 64×64 | Campfire |
| prop-door-closed.png | PNG | 64×64 | Closed door |
| prop-door-open.png | PNG | 64×64 | Open door |
| prop-stairs-up.png | PNG | 64×64 | Stairs going up |
| prop-stairs-down.png | PNG | 64×64 | Stairs going down |
| prop-trap-spikes.png | PNG | 64×64 | Spike trap |
| prop-statue.png | PNG | 64×128 | Stone statue |
| prop-altar.png | PNG | 64×64 | Altar |
| prop-bookshelf.png | PNG | 64×128 | Bookshelf |

### 5.4 Environmental Effects
| Asset | Format | Description |
|-------|--------|-------------|
| effect-fog.png | PNG | Fog of war overlay |
| effect-dim-light.png | PNG | Dim light overlay |
| effect-darkness.png | PNG | Darkness overlay |
| effect-difficult-terrain.png | PNG | Difficult terrain indicator |

---

## 6. SPELL EFFECT ASSETS

### 6.1 Spell Visuals (Sprite Sheets or Video)
| Asset | Format | Description |
|-------|--------|-------------|
| spell-fireball.webm | WebM | Fireball explosion |
| spell-magic-missile.webm | WebM | 3 homing projectiles |
| spell-lightning-bolt.webm | WebM | Lightning line |
| spell-heal.webm | WebM | Green sparkles rising |
| spell-shield.webm | WebM | Blue barrier appear |
| spell-fire-bolt.webm | WebM | Fire projectile |
| spell-ray-frost.webm | WebM | Ice ray |
| spell-sacred-flame.webm | WebM | Radiant pillar |
| spell-eldritch-blast.webm | WebM | Purple beam |

### 6.2 Particle Effects (TSParticles Configs)
| Effect | Description |
|--------|-------------|
| particles-fire.json | Fire/ember particles |
| particles-ice.json | Snowflake/frost particles |
| particles-lightning.json | Electric sparks |
| particles-holy.json | Golden light motes |
| particles-dark.json | Purple/black wisps |
| particles-heal.json | Green rising sparkles |
| particles-blood.json | Red droplets (damage) |
| particles-magic.json | Generic arcane sparkles |

### 6.3 Impact Effects
| Asset | Format | Description |
|-------|--------|-------------|
| impact-slash.webm | WebM | Melee slash impact |
| impact-pierce.webm | WebM | Piercing hit |
| impact-blunt.webm | WebM | Bludgeoning impact |
| impact-critical.webm | WebM | Critical hit burst |
| impact-miss.webm | WebM | Subtle miss indicator |

---

## 7. DICE ASSETS

### 7.1 3D Models (For Three.js)
| Asset | Format | Description |
|-------|--------|-------------|
| dice-d20.glb | GLTF | D20 3D model |
| dice-d12.glb | GLTF | D12 3D model |
| dice-d10.glb | GLTF | D10 3D model |
| dice-d8.glb | GLTF | D8 3D model |
| dice-d6.glb | GLTF | D6 3D model |
| dice-d4.glb | GLTF | D4 3D model |

### 7.2 2D Alternatives (Sprite Sheets)
| Asset | Format | Description |
|-------|--------|-------------|
| dice-d20-sheet.png | PNG | D20 animation frames |
| dice-roll-animation.webm | WebM | Generic dice roll video |

---

## 8. AUDIO ASSETS

### 8.1 UI Sounds
| Asset | Format | Duration | Description |
|-------|--------|----------|-------------|
| ui-click.mp3 | MP3 | 0.1s | Button click |
| ui-hover.mp3 | MP3 | 0.1s | Button hover |
| ui-open.mp3 | MP3 | 0.3s | Panel/modal open |
| ui-close.mp3 | MP3 | 0.2s | Panel/modal close |
| ui-error.mp3 | MP3 | 0.3s | Error/invalid action |
| ui-success.mp3 | MP3 | 0.4s | Success/complete |
| ui-notification.mp3 | MP3 | 0.3s | Toast notification |
| ui-navigate.mp3 | MP3 | 0.2s | Page navigation |

### 8.2 Dice Sounds
| Asset | Format | Duration | Description |
|-------|--------|----------|-------------|
| dice-shake.mp3 | MP3 | 0.5s | Dice shaking |
| dice-roll.mp3 | MP3 | 1.5s | Dice rolling on table |
| dice-land.mp3 | MP3 | 0.3s | Dice landing |
| dice-critical.mp3 | MP3 | 1.0s | Natural 20 fanfare |
| dice-fail.mp3 | MP3 | 0.8s | Natural 1 sound |

### 8.3 Combat Sounds
| Asset | Format | Duration | Description |
|-------|--------|----------|-------------|
| combat-sword-swing.mp3 | MP3 | 0.4s | Melee attack |
| combat-sword-hit.mp3 | MP3 | 0.3s | Melee hit |
| combat-arrow-shoot.mp3 | MP3 | 0.3s | Bow fire |
| combat-arrow-hit.mp3 | MP3 | 0.2s | Arrow impact |
| combat-spell-cast.mp3 | MP3 | 0.5s | Generic spell cast |
| combat-damage.mp3 | MP3 | 0.3s | Taking damage |
| combat-death.mp3 | MP3 | 0.8s | Death/defeat |
| combat-heal.mp3 | MP3 | 0.5s | Healing received |
| combat-block.mp3 | MP3 | 0.3s | Shield block |
| combat-miss.mp3 | MP3 | 0.2s | Attack miss whoosh |

### 8.4 Spell-Specific Sounds
| Asset | Format | Duration | Description |
|-------|--------|----------|-------------|
| spell-fire.mp3 | MP3 | 0.8s | Fire spell |
| spell-ice.mp3 | MP3 | 0.6s | Ice/cold spell |
| spell-lightning.mp3 | MP3 | 0.5s | Lightning spell |
| spell-holy.mp3 | MP3 | 0.7s | Radiant spell |
| spell-dark.mp3 | MP3 | 0.6s | Necrotic spell |
| spell-force.mp3 | MP3 | 0.4s | Force damage |

### 8.5 Ambient/Environment
| Asset | Format | Duration | Description |
|-------|--------|----------|-------------|
| ambient-dungeon.mp3 | MP3 | Loop | Cave/dungeon ambient |
| ambient-forest.mp3 | MP3 | Loop | Forest ambient |
| ambient-tavern.mp3 | MP3 | Loop | Tavern background |
| ambient-battle.mp3 | MP3 | Loop | Combat tension |
| ambient-rain.mp3 | MP3 | Loop | Rain sounds |
| ambient-wind.mp3 | MP3 | Loop | Wind |

### 8.6 Music
| Asset | Format | Duration | Description |
|-------|--------|----------|-------------|
| music-menu.mp3 | MP3 | Loop | Main menu theme |
| music-exploration.mp3 | MP3 | Loop | Calm exploration |
| music-combat.mp3 | MP3 | Loop | Battle music |
| music-boss.mp3 | MP3 | Loop | Boss fight music |
| music-victory.mp3 | MP3 | 10s | Victory fanfare |
| music-defeat.mp3 | MP3 | 8s | Defeat music |
| music-tavern.mp3 | MP3 | Loop | Cozy tavern music |

---

## 9. VIDEO/CUTSCENE ASSETS

### 9.1 UI Videos
| Asset | Format | Resolution | Description |
|-------|--------|------------|-------------|
| video-intro.webm | WebM | 1920×1080 | Game intro/logo |
| video-loading.webm | WebM | 400×400 | Loading animation |

### 9.2 Cutscene Templates
| Asset | Format | Description |
|-------|--------|-------------|
| cutscene-bg-cave.mp4 | MP4 | Cave background (parallax) |
| cutscene-bg-forest.mp4 | MP4 | Forest background |
| cutscene-bg-castle.mp4 | MP4 | Castle interior |

---

## 10. ASSET ORGANIZATION

### Folder Structure
```
/public/assets/
├── /audio/
│   ├── /ui/
│   ├── /combat/
│   ├── /spells/
│   ├── /ambient/
│   └── /music/
├── /images/
│   ├── /ui/
│   ├── /backgrounds/
│   ├── /characters/
│   │   ├── /portraits/
│   │   └── /tokens/
│   ├── /monsters/
│   │   ├── /portraits/
│   │   └── /tokens/
│   ├── /icons/
│   │   ├── /classes/
│   │   ├── /damage-types/
│   │   ├── /conditions/
│   │   └── /ui/
│   ├── /maps/
│   │   ├── /tiles/
│   │   ├── /walls/
│   │   └── /props/
│   └── /effects/
├── /video/
│   ├── /spells/
│   ├── /impacts/
│   └── /cutscenes/
├── /models/
│   └── /dice/
└── /particles/
```

---

## 11. ASSET SPECIFICATIONS FOR AI GENERATION

When generating assets via AI, use these prompts:

### Character Portraits
```
Style: Fantasy character portrait, digital painting style
Lighting: Dramatic rim lighting, warm key light from upper left
Background: Dark gradient, subtle magical particles
Composition: Head and shoulders, slight 3/4 angle facing right
Quality: High detail on face, soft focus on edges
Colors: Rich, saturated fantasy palette
Mood: Heroic, determined
```

### Monster Portraits
```
Style: Fantasy creature portrait, dramatic illustration
Lighting: Harsh lighting, deep shadows for menace
Background: Dark, ominous, contextual to creature
Composition: Upper body, dynamic pose showing threat
Quality: High detail, textured skin/scales/fur
Colors: Desaturated with accent colors
Mood: Threatening, fierce
```

### Location Art
```
Style: Fantasy environment concept art
Lighting: Atmospheric, volumetric light rays
Composition: Wide establishing shot or point of interest
Quality: Painterly, not photorealistic
Colors: Mood-appropriate palette (warm for taverns, cool for dungeons)
Details: Environmental storytelling elements
```

---

## 12. PLACEHOLDER IMPLEMENTATION

For rapid development before final assets:

```typescript
// assetPlaceholders.ts

export const placeholders = {
  // Character portraits - use DiceBear
  characterPortrait: (seed: string) => 
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`,
  
  // Monster portraits - use colored rectangles
  monsterPortrait: (type: string) =>
    `https://placehold.co/512x512/1E1B26/EF4444?text=${type}`,
  
  // Map tiles - use simple colored tiles
  mapTile: (type: string) => {
    const colors = {
      floor: '#2A2735',
      wall: '#1E1B26',
      water: '#0369A1',
      lava: '#DC2626',
    };
    return colors[type] || '#2A2735';
  },
  
  // Icons - use Lucide React names
  icons: {
    sword: 'Sword',
    shield: 'Shield',
    heart: 'Heart',
    // etc.
  }
};
```

---

## 13. ASSET LOADING STRATEGY

```typescript
// Preload critical assets
const criticalAssets = [
  '/audio/ui-click.mp3',
  '/audio/dice-roll.mp3',
  '/images/ui/logo.svg',
];

// Lazy load per-scene assets
const sceneAssets = {
  combat: ['/audio/music-combat.mp3', '/video/spells/*'],
  character: ['/images/characters/*'],
  map: ['/images/maps/tiles/*'],
};

// Use Next.js Image for optimized images
// Use dynamic imports for heavy assets
```

---

## 14. ACCESSIBILITY CONSIDERATIONS

- All images must have alt text
- Audio must have visual alternatives
- Videos must have captions option
- Icons must have aria-labels
- Don't rely solely on color

---

# END OF ASSET REQUIREMENTS DOCUMENT
