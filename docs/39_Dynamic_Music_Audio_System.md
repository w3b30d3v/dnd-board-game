# Document 39: Dynamic Music & Audio Atmosphere System

## Purpose
This document specifies the **adaptive audio system** that creates immersive soundscapes responding to gameplay events, mood changes, and narrative beats in real-time.

---

## 1. Audio System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUDIO ATMOSPHERE ENGINE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────┐    ┌────────────────┐    ┌──────────────┐  │
│  │ Game State     │───▶│ Mood Analyzer  │───▶│ Track        │  │
│  │ Events         │    │                │    │ Selector     │  │
│  └────────────────┘    └────────────────┘    └──────┬───────┘  │
│                                                      │         │
│  ┌────────────────────────────────────────────────────┘         │
│  │                                                             │
│  ▼                                                             │
│  ┌────────────────┐    ┌────────────────┐    ┌──────────────┐  │
│  │ Music Layer    │    │ Ambience Layer │    │ SFX Layer    │  │
│  │ (Stems/Full)   │    │ (Environment)  │    │ (Actions)    │  │
│  └───────┬────────┘    └───────┬────────┘    └──────┬───────┘  │
│          │                     │                     │         │
│          └─────────────────────┴─────────────────────┘         │
│                              │                                 │
│                              ▼                                 │
│                    ┌──────────────────┐                        │
│                    │   Master Mixer   │                        │
│                    │ (Crossfade/Duck) │                        │
│                    └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Music Track Categories

### 2.1 Track Types

| Category | Mood | Tempo | Instruments |
|----------|------|-------|-------------|
| Exploration | Curious, wonder | 70-90 BPM | Strings, flute, harp |
| Tension | Uneasy, danger | 80-100 BPM | Low strings, timpani |
| Combat | Intense, action | 120-160 BPM | Full orchestra, percussion |
| Boss | Epic, dramatic | 140-180 BPM | Choir, brass, full percussion |
| Victory | Triumphant | 100-120 BPM | Brass fanfare, strings |
| Defeat | Somber | 50-70 BPM | Solo cello, piano |
| Mystery | Intrigue | 60-80 BPM | Celesta, whispers, pads |
| Tavern | Lively, warm | 100-120 BPM | Lute, fiddle, drums |
| Sacred | Reverent | 50-70 BPM | Choir, organ, bells |
| Dread | Horror | 40-60 BPM | Dissonance, drones |

### 2.2 Stem-Based System

```typescript
interface MusicTrack {
  id: string;
  category: TrackCategory;
  bpm: number;
  key: string;
  stems: {
    base: string;        // Always playing (pads, low strings)
    melody: string;      // Main theme
    percussion: string;  // Drums, hits
    accent: string;      // Brass stabs, choir hits
    tension: string;     // Rising elements
  };
  transitions: {
    intro: string;
    outro: string;
    toCombar: string;
    fromCombat: string;
  };
  loopPoints: {
    start: number;  // ms
    end: number;    // ms
  };
}

// Example track definition
export const EXPLORATION_FOREST: MusicTrack = {
  id: 'exploration_forest',
  category: 'exploration',
  bpm: 85,
  key: 'D major',
  stems: {
    base: '/audio/music/forest/base.mp3',
    melody: '/audio/music/forest/melody.mp3',
    percussion: '/audio/music/forest/perc.mp3',
    accent: '/audio/music/forest/accent.mp3',
    tension: '/audio/music/forest/tension.mp3'
  },
  transitions: {
    intro: '/audio/music/forest/intro.mp3',
    outro: '/audio/music/forest/outro.mp3',
    toCombat: '/audio/music/forest/to-combat.mp3',
    fromCombat: '/audio/music/forest/from-combat.mp3'
  },
  loopPoints: { start: 0, end: 32000 }
};
```

---

## 3. Environment Ambience

### 3.1 Ambience Layers

```typescript
interface AmbiencePreset {
  id: string;
  environment: EnvironmentType;
  layers: AmbienceLayer[];
  oneShots: OneShot[];
}

interface AmbienceLayer {
  sound: string;
  volume: number;
  pan?: number;
  filter?: {
    type: 'lowpass' | 'highpass';
    frequency: number;
  };
}

interface OneShot {
  sound: string;
  probability: number;  // Per minute
  volumeRange: [number, number];
  panRange: [number, number];
}

// Forest ambience
export const FOREST_AMBIENCE: AmbiencePreset = {
  id: 'forest',
  environment: 'forest',
  layers: [
    { sound: '/audio/ambience/forest-wind.mp3', volume: 0.3 },
    { sound: '/audio/ambience/forest-birds-distant.mp3', volume: 0.2 },
    { sound: '/audio/ambience/leaves-rustle.mp3', volume: 0.15 }
  ],
  oneShots: [
    { sound: '/audio/oneshots/bird-call-1.mp3', probability: 3, volumeRange: [0.2, 0.4], panRange: [-0.8, 0.8] },
    { sound: '/audio/oneshots/bird-call-2.mp3', probability: 2, volumeRange: [0.15, 0.35], panRange: [-0.8, 0.8] },
    { sound: '/audio/oneshots/branch-crack.mp3', probability: 0.5, volumeRange: [0.1, 0.2], panRange: [-0.5, 0.5] },
    { sound: '/audio/oneshots/owl-hoot.mp3', probability: 0.3, volumeRange: [0.2, 0.3], panRange: [-1, 1] }
  ]
};

// Dungeon ambience
export const DUNGEON_AMBIENCE: AmbiencePreset = {
  id: 'dungeon',
  environment: 'dungeon',
  layers: [
    { sound: '/audio/ambience/dungeon-drone.mp3', volume: 0.25 },
    { sound: '/audio/ambience/water-drip-loop.mp3', volume: 0.15 },
    { sound: '/audio/ambience/distant-wind.mp3', volume: 0.1, filter: { type: 'lowpass', frequency: 800 } }
  ],
  oneShots: [
    { sound: '/audio/oneshots/water-drip.mp3', probability: 8, volumeRange: [0.1, 0.25], panRange: [-1, 1] },
    { sound: '/audio/oneshots/stone-crumble.mp3', probability: 1, volumeRange: [0.1, 0.2], panRange: [-0.5, 0.5] },
    { sound: '/audio/oneshots/chains-rattle.mp3', probability: 0.5, volumeRange: [0.05, 0.15], panRange: [-1, 1] },
    { sound: '/audio/oneshots/distant-scream.mp3', probability: 0.1, volumeRange: [0.05, 0.1], panRange: [-1, 1] }
  ]
};

// Tavern ambience
export const TAVERN_AMBIENCE: AmbiencePreset = {
  id: 'tavern',
  environment: 'settlement',
  layers: [
    { sound: '/audio/ambience/tavern-crowd.mp3', volume: 0.3 },
    { sound: '/audio/ambience/fire-crackle.mp3', volume: 0.2 },
    { sound: '/audio/ambience/tavern-clinks.mp3', volume: 0.15 }
  ],
  oneShots: [
    { sound: '/audio/oneshots/laugh-group.mp3', probability: 4, volumeRange: [0.15, 0.3], panRange: [-0.8, 0.8] },
    { sound: '/audio/oneshots/mug-slam.mp3', probability: 3, volumeRange: [0.1, 0.2], panRange: [-0.5, 0.5] },
    { sound: '/audio/oneshots/chair-scrape.mp3', probability: 2, volumeRange: [0.1, 0.15], panRange: [-0.8, 0.8] },
    { sound: '/audio/oneshots/door-open.mp3', probability: 0.5, volumeRange: [0.15, 0.25], panRange: [0.8, 1] }
  ]
};
```

---

## 4. Dynamic Music Manager

### 4.1 Implementation

```typescript
// apps/web/src/audio/DynamicMusicManager.ts

import { Howl, Howler } from 'howler';

interface ActiveStem {
  howl: Howl;
  volume: number;
  targetVolume: number;
}

export class DynamicMusicManager {
  private currentTrack: MusicTrack | null = null;
  private stems: Map<string, ActiveStem> = new Map();
  private gameState: GameState = 'exploration';
  private tension: number = 0; // 0-1
  private masterVolume: number = 0.5;
  
  constructor() {
    this.startTensionDecay();
  }
  
  // Set the overall game state
  setGameState(state: GameState): void {
    if (state === this.gameState) return;
    
    const previousState = this.gameState;
    this.gameState = state;
    
    // Handle state transitions
    if (state === 'combat') {
      this.transitionToCombat();
    } else if (previousState === 'combat') {
      this.transitionFromCombat();
    } else {
      this.selectTrackForState(state);
    }
  }
  
  // Add tension (from events like low HP, enemy spotted, etc.)
  addTension(amount: number): void {
    this.tension = Math.min(1, this.tension + amount);
    this.updateStemVolumes();
  }
  
  // Load and play a track with stems
  async loadTrack(track: MusicTrack): Promise<void> {
    // Fade out current
    if (this.currentTrack) {
      await this.fadeOutAllStems(2000);
    }
    
    this.currentTrack = track;
    
    // Load all stems
    const stemEntries = Object.entries(track.stems);
    for (const [name, url] of stemEntries) {
      const howl = new Howl({
        src: [url],
        loop: true,
        volume: 0,
        html5: true // Better for long audio
      });
      
      this.stems.set(name, {
        howl,
        volume: 0,
        targetVolume: this.getInitialVolume(name)
      });
    }
    
    // Sync and play all stems
    const playPromises = Array.from(this.stems.values()).map(stem => {
      return new Promise<void>(resolve => {
        stem.howl.once('play', () => resolve());
        stem.howl.play();
      });
    });
    
    await Promise.all(playPromises);
    
    // Fade in
    this.fadeInStems(2000);
  }
  
  // Update stem volumes based on game state
  private updateStemVolumes(): void {
    const stemVolumes = this.calculateStemVolumes();
    
    for (const [name, volume] of Object.entries(stemVolumes)) {
      const stem = this.stems.get(name);
      if (stem) {
        stem.targetVolume = volume * this.masterVolume;
        this.fadeToVolume(stem, 500);
      }
    }
  }
  
  private calculateStemVolumes(): Record<string, number> {
    const { gameState, tension } = this;
    
    switch (gameState) {
      case 'exploration':
        return {
          base: 0.6,
          melody: 0.4 + tension * 0.2,
          percussion: tension * 0.3,
          accent: tension * 0.2,
          tension: tension * 0.5
        };
        
      case 'combat':
        return {
          base: 0.8,
          melody: 0.7,
          percussion: 0.8,
          accent: 0.6 + tension * 0.4,
          tension: tension
        };
        
      case 'boss':
        return {
          base: 1.0,
          melody: 0.8,
          percussion: 1.0,
          accent: 0.8,
          tension: 1.0
        };
        
      case 'stealth':
        return {
          base: 0.3,
          melody: 0.1,
          percussion: 0,
          accent: tension * 0.3,
          tension: tension * 0.7
        };
        
      default:
        return {
          base: 0.5,
          melody: 0.3,
          percussion: 0.2,
          accent: 0.1,
          tension: 0
        };
    }
  }
  
  // Combat transition with stinger
  private async transitionToCombat(): Promise<void> {
    const stinger = new Howl({
      src: ['/audio/stingers/combat-start.mp3'],
      volume: 0.7
    });
    stinger.play();
    
    // Quickly fade current track
    await this.fadeOutAllStems(500);
    
    // Load combat track
    const combatTrack = this.selectCombatTrack();
    await this.loadTrack(combatTrack);
  }
  
  // Decay tension over time
  private startTensionDecay(): void {
    setInterval(() => {
      if (this.gameState !== 'combat') {
        this.tension = Math.max(0, this.tension - 0.02);
        this.updateStemVolumes();
      }
    }, 1000);
  }
  
  private fadeToVolume(stem: ActiveStem, duration: number): void {
    const startVolume = stem.volume;
    const targetVolume = stem.targetVolume;
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      stem.volume = startVolume + (targetVolume - startVolume) * progress;
      stem.howl.volume(stem.volume);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
}
```

---

## 5. Ambience Manager

```typescript
// apps/web/src/audio/AmbienceManager.ts

export class AmbienceManager {
  private layers: Map<string, Howl> = new Map();
  private oneShotTimers: number[] = [];
  private currentPreset: AmbiencePreset | null = null;
  
  async setEnvironment(environment: EnvironmentType): Promise<void> {
    const preset = AMBIENCE_PRESETS[environment];
    if (!preset || preset.id === this.currentPreset?.id) return;
    
    // Fade out current
    await this.fadeOutAll(2000);
    this.stopOneShots();
    
    // Load new preset
    this.currentPreset = preset;
    
    // Start layers
    for (const layer of preset.layers) {
      const howl = new Howl({
        src: [layer.sound],
        loop: true,
        volume: 0,
        html5: true
      });
      
      if (layer.pan) howl.stereo(layer.pan);
      
      this.layers.set(layer.sound, howl);
      howl.play();
      howl.fade(0, layer.volume, 2000);
    }
    
    // Start one-shots
    this.startOneShots(preset.oneShots);
  }
  
  private startOneShots(oneShots: OneShot[]): void {
    for (const oneShot of oneShots) {
      const intervalMs = (60 / oneShot.probability) * 1000;
      
      const timer = window.setInterval(() => {
        // Random chance based on probability
        if (Math.random() < oneShot.probability / 60) {
          this.playOneShot(oneShot);
        }
      }, 1000);
      
      this.oneShotTimers.push(timer);
    }
  }
  
  private playOneShot(oneShot: OneShot): void {
    const volume = oneShot.volumeRange[0] + 
      Math.random() * (oneShot.volumeRange[1] - oneShot.volumeRange[0]);
    
    const pan = oneShot.panRange[0] + 
      Math.random() * (oneShot.panRange[1] - oneShot.panRange[0]);
    
    const howl = new Howl({
      src: [oneShot.sound],
      volume
    });
    
    howl.stereo(pan);
    howl.play();
  }
}
```

---

## 6. SFX System

### 6.1 Sound Effect Categories

```typescript
export const SFX_LIBRARY = {
  // UI
  ui_click: '/audio/sfx/ui-click.mp3',
  ui_hover: '/audio/sfx/ui-hover.mp3',
  ui_open: '/audio/sfx/ui-open.mp3',
  ui_close: '/audio/sfx/ui-close.mp3',
  ui_error: '/audio/sfx/ui-error.mp3',
  ui_success: '/audio/sfx/ui-success.mp3',
  
  // Dice
  dice_pickup: '/audio/sfx/dice-pickup.mp3',
  dice_roll: '/audio/sfx/dice-roll.mp3',
  dice_land: '/audio/sfx/dice-land.mp3',
  dice_critical: '/audio/sfx/dice-critical.mp3',
  dice_fail: '/audio/sfx/dice-fumble.mp3',
  
  // Combat - Melee
  sword_swing: '/audio/sfx/sword-swing.mp3',
  sword_hit: '/audio/sfx/sword-hit.mp3',
  axe_swing: '/audio/sfx/axe-swing.mp3',
  axe_hit: '/audio/sfx/axe-hit.mp3',
  mace_swing: '/audio/sfx/mace-swing.mp3',
  mace_hit: '/audio/sfx/mace-hit.mp3',
  
  // Combat - Ranged
  bow_draw: '/audio/sfx/bow-draw.mp3',
  bow_release: '/audio/sfx/bow-release.mp3',
  arrow_fly: '/audio/sfx/arrow-fly.mp3',
  arrow_hit: '/audio/sfx/arrow-hit.mp3',
  
  // Combat - Impact
  hit_flesh: '/audio/sfx/hit-flesh.mp3',
  hit_armor: '/audio/sfx/hit-armor.mp3',
  hit_shield: '/audio/sfx/hit-shield.mp3',
  miss_whoosh: '/audio/sfx/miss-whoosh.mp3',
  block: '/audio/sfx/block.mp3',
  
  // Magic
  spell_cast_fire: '/audio/sfx/spell-fire.mp3',
  spell_cast_ice: '/audio/sfx/spell-ice.mp3',
  spell_cast_lightning: '/audio/sfx/spell-lightning.mp3',
  spell_cast_heal: '/audio/sfx/spell-heal.mp3',
  spell_cast_dark: '/audio/sfx/spell-dark.mp3',
  spell_cast_holy: '/audio/sfx/spell-holy.mp3',
  spell_buff: '/audio/sfx/spell-buff.mp3',
  spell_debuff: '/audio/sfx/spell-debuff.mp3',
  
  // Character
  footstep_stone: '/audio/sfx/footstep-stone.mp3',
  footstep_grass: '/audio/sfx/footstep-grass.mp3',
  footstep_wood: '/audio/sfx/footstep-wood.mp3',
  armor_move: '/audio/sfx/armor-move.mp3',
  death: '/audio/sfx/death.mp3',
  level_up: '/audio/sfx/level-up.mp3',
  
  // Environment
  door_open: '/audio/sfx/door-open.mp3',
  door_close: '/audio/sfx/door-close.mp3',
  chest_open: '/audio/sfx/chest-open.mp3',
  trap_trigger: '/audio/sfx/trap-trigger.mp3',
  gold_pickup: '/audio/sfx/gold-pickup.mp3',
  item_pickup: '/audio/sfx/item-pickup.mp3'
};
```

### 6.2 SFX Manager

```typescript
export class SFXManager {
  private sounds: Map<string, Howl> = new Map();
  private volume: number = 0.7;
  
  constructor() {
    this.preloadSounds();
  }
  
  private preloadSounds(): void {
    for (const [id, url] of Object.entries(SFX_LIBRARY)) {
      this.sounds.set(id, new Howl({
        src: [url],
        volume: this.volume,
        preload: true
      }));
    }
  }
  
  play(id: string, options?: { volume?: number; rate?: number; pan?: number }): void {
    const sound = this.sounds.get(id);
    if (!sound) return;
    
    const soundId = sound.play();
    
    if (options?.volume) sound.volume(options.volume * this.volume, soundId);
    if (options?.rate) sound.rate(options.rate, soundId);
    if (options?.pan) sound.stereo(options.pan, soundId);
  }
  
  // Play with random variation
  playVariant(baseId: string): void {
    // Add slight pitch/speed variation
    this.play(baseId, {
      rate: 0.95 + Math.random() * 0.1,
      volume: 0.9 + Math.random() * 0.2
    });
  }
}
```

---

## 7. Audio Events Integration

```typescript
// apps/web/src/audio/AudioEventHandler.ts

export class AudioEventHandler {
  private musicManager: DynamicMusicManager;
  private ambienceManager: AmbienceManager;
  private sfxManager: SFXManager;
  
  // Called when game events occur
  handleEvent(event: GameEvent): void {
    switch (event.type) {
      // State changes
      case 'COMBAT_START':
        this.musicManager.setGameState('combat');
        this.sfxManager.play('combat_start_stinger');
        break;
        
      case 'COMBAT_END':
        this.musicManager.setGameState('exploration');
        this.sfxManager.play(event.victory ? 'victory_stinger' : 'defeat_stinger');
        break;
        
      case 'BOSS_ENCOUNTER':
        this.musicManager.setGameState('boss');
        break;
        
      // Tension events
      case 'ENEMY_SPOTTED':
        this.musicManager.addTension(0.3);
        break;
        
      case 'LOW_HP':
        this.musicManager.addTension(0.4);
        break;
        
      case 'TRAP_NEARBY':
        this.musicManager.addTension(0.2);
        break;
        
      // Location changes
      case 'LOCATION_CHANGE':
        this.ambienceManager.setEnvironment(event.environment);
        this.selectMusicForLocation(event.location);
        break;
        
      // Combat SFX
      case 'ATTACK':
        this.sfxManager.play(`${event.weaponType}_swing`);
        break;
        
      case 'HIT':
        this.sfxManager.play(event.critical ? 'hit_critical' : 'hit_flesh');
        break;
        
      case 'SPELL_CAST':
        this.sfxManager.play(`spell_cast_${event.school}`);
        break;
        
      // UI SFX
      case 'DICE_ROLL':
        this.sfxManager.play('dice_roll');
        break;
        
      case 'DICE_RESULT':
        this.sfxManager.play(event.natural20 ? 'dice_critical' : 'dice_land');
        break;
    }
  }
}
```

---

## 8. Audio Settings UI

```typescript
export function AudioSettings() {
  return (
    <div className="audio-settings">
      <h3>Audio</h3>
      
      <Slider label="Master Volume" min={0} max={1} />
      <Slider label="Music" min={0} max={1} />
      <Slider label="Sound Effects" min={0} max={1} />
      <Slider label="Ambience" min={0} max={1} />
      <Slider label="Voice" min={0} max={1} />
      
      <Toggle label="Dynamic Music" description="Music adapts to gameplay" />
      <Toggle label="Combat Stingers" description="Audio cues for combat events" />
    </div>
  );
}
```

---

**END OF DOCUMENT 39**
