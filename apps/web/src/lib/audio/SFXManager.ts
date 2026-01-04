// SFXManager - Sound Effects Manager using Howler.js
// Manages all game sound effects with preloading and playback control

import { Howl, Howler } from 'howler';

export type SFXCategory =
  | 'ui'
  | 'dice'
  | 'combat'
  | 'magic'
  | 'environment'
  | 'character'
  | 'notification';

export interface SFXSound {
  id: string;
  category: SFXCategory;
  src: string[];
  volume?: number;
  rate?: number;
  sprite?: Record<string, [number, number]>;
}

export interface PlayOptions {
  volume?: number;
  rate?: number;
  pan?: number;
  loop?: boolean;
  onEnd?: () => void;
}

// Sound effect definitions
const SFX_LIBRARY: SFXSound[] = [
  // UI Sounds
  { id: 'ui_click', category: 'ui', src: ['/audio/sfx/ui/click.mp3', '/audio/sfx/ui/click.ogg'], volume: 0.5 },
  { id: 'ui_hover', category: 'ui', src: ['/audio/sfx/ui/hover.mp3', '/audio/sfx/ui/hover.ogg'], volume: 0.3 },
  { id: 'ui_open', category: 'ui', src: ['/audio/sfx/ui/open.mp3', '/audio/sfx/ui/open.ogg'], volume: 0.5 },
  { id: 'ui_close', category: 'ui', src: ['/audio/sfx/ui/close.mp3', '/audio/sfx/ui/close.ogg'], volume: 0.5 },
  { id: 'ui_success', category: 'ui', src: ['/audio/sfx/ui/success.mp3', '/audio/sfx/ui/success.ogg'], volume: 0.6 },
  { id: 'ui_error', category: 'ui', src: ['/audio/sfx/ui/error.mp3', '/audio/sfx/ui/error.ogg'], volume: 0.5 },
  { id: 'ui_notification', category: 'ui', src: ['/audio/sfx/ui/notification.mp3', '/audio/sfx/ui/notification.ogg'], volume: 0.5 },

  // Dice Sounds
  { id: 'dice_pickup', category: 'dice', src: ['/audio/sfx/dice/pickup.mp3', '/audio/sfx/dice/pickup.ogg'], volume: 0.6 },
  { id: 'dice_roll', category: 'dice', src: ['/audio/sfx/dice/roll.mp3', '/audio/sfx/dice/roll.ogg'], volume: 0.7 },
  { id: 'dice_land', category: 'dice', src: ['/audio/sfx/dice/land.mp3', '/audio/sfx/dice/land.ogg'], volume: 0.6 },
  { id: 'dice_critical', category: 'dice', src: ['/audio/sfx/dice/critical.mp3', '/audio/sfx/dice/critical.ogg'], volume: 0.8 },
  { id: 'dice_fumble', category: 'dice', src: ['/audio/sfx/dice/fumble.mp3', '/audio/sfx/dice/fumble.ogg'], volume: 0.7 },

  // Combat Sounds
  { id: 'combat_sword_hit', category: 'combat', src: ['/audio/sfx/combat/sword_hit.mp3', '/audio/sfx/combat/sword_hit.ogg'], volume: 0.7 },
  { id: 'combat_sword_miss', category: 'combat', src: ['/audio/sfx/combat/sword_miss.mp3', '/audio/sfx/combat/sword_miss.ogg'], volume: 0.5 },
  { id: 'combat_bow_shoot', category: 'combat', src: ['/audio/sfx/combat/bow_shoot.mp3', '/audio/sfx/combat/bow_shoot.ogg'], volume: 0.6 },
  { id: 'combat_arrow_hit', category: 'combat', src: ['/audio/sfx/combat/arrow_hit.mp3', '/audio/sfx/combat/arrow_hit.ogg'], volume: 0.6 },
  { id: 'combat_blunt_hit', category: 'combat', src: ['/audio/sfx/combat/blunt_hit.mp3', '/audio/sfx/combat/blunt_hit.ogg'], volume: 0.7 },
  { id: 'combat_block', category: 'combat', src: ['/audio/sfx/combat/block.mp3', '/audio/sfx/combat/block.ogg'], volume: 0.6 },
  { id: 'combat_critical', category: 'combat', src: ['/audio/sfx/combat/critical.mp3', '/audio/sfx/combat/critical.ogg'], volume: 0.8 },
  { id: 'combat_death', category: 'combat', src: ['/audio/sfx/combat/death.mp3', '/audio/sfx/combat/death.ogg'], volume: 0.7 },

  // Magic Sounds
  { id: 'magic_fire', category: 'magic', src: ['/audio/sfx/magic/fire.mp3', '/audio/sfx/magic/fire.ogg'], volume: 0.7 },
  { id: 'magic_ice', category: 'magic', src: ['/audio/sfx/magic/ice.mp3', '/audio/sfx/magic/ice.ogg'], volume: 0.7 },
  { id: 'magic_lightning', category: 'magic', src: ['/audio/sfx/magic/lightning.mp3', '/audio/sfx/magic/lightning.ogg'], volume: 0.8 },
  { id: 'magic_heal', category: 'magic', src: ['/audio/sfx/magic/heal.mp3', '/audio/sfx/magic/heal.ogg'], volume: 0.6 },
  { id: 'magic_buff', category: 'magic', src: ['/audio/sfx/magic/buff.mp3', '/audio/sfx/magic/buff.ogg'], volume: 0.5 },
  { id: 'magic_debuff', category: 'magic', src: ['/audio/sfx/magic/debuff.mp3', '/audio/sfx/magic/debuff.ogg'], volume: 0.5 },
  { id: 'magic_teleport', category: 'magic', src: ['/audio/sfx/magic/teleport.mp3', '/audio/sfx/magic/teleport.ogg'], volume: 0.6 },
  { id: 'magic_summon', category: 'magic', src: ['/audio/sfx/magic/summon.mp3', '/audio/sfx/magic/summon.ogg'], volume: 0.7 },
  { id: 'magic_necrotic', category: 'magic', src: ['/audio/sfx/magic/necrotic.mp3', '/audio/sfx/magic/necrotic.ogg'], volume: 0.7 },
  { id: 'magic_radiant', category: 'magic', src: ['/audio/sfx/magic/radiant.mp3', '/audio/sfx/magic/radiant.ogg'], volume: 0.7 },

  // Environment Sounds
  { id: 'env_door_open', category: 'environment', src: ['/audio/sfx/env/door_open.mp3', '/audio/sfx/env/door_open.ogg'], volume: 0.6 },
  { id: 'env_door_close', category: 'environment', src: ['/audio/sfx/env/door_close.mp3', '/audio/sfx/env/door_close.ogg'], volume: 0.6 },
  { id: 'env_chest_open', category: 'environment', src: ['/audio/sfx/env/chest_open.mp3', '/audio/sfx/env/chest_open.ogg'], volume: 0.6 },
  { id: 'env_trap_trigger', category: 'environment', src: ['/audio/sfx/env/trap.mp3', '/audio/sfx/env/trap.ogg'], volume: 0.7 },
  { id: 'env_coins', category: 'environment', src: ['/audio/sfx/env/coins.mp3', '/audio/sfx/env/coins.ogg'], volume: 0.5 },
  { id: 'env_item_pickup', category: 'environment', src: ['/audio/sfx/env/pickup.mp3', '/audio/sfx/env/pickup.ogg'], volume: 0.5 },

  // Character Sounds
  { id: 'char_footstep', category: 'character', src: ['/audio/sfx/char/footstep.mp3', '/audio/sfx/char/footstep.ogg'], volume: 0.4 },
  { id: 'char_jump', category: 'character', src: ['/audio/sfx/char/jump.mp3', '/audio/sfx/char/jump.ogg'], volume: 0.5 },
  { id: 'char_hurt', category: 'character', src: ['/audio/sfx/char/hurt.mp3', '/audio/sfx/char/hurt.ogg'], volume: 0.6 },
  { id: 'char_levelup', category: 'character', src: ['/audio/sfx/char/levelup.mp3', '/audio/sfx/char/levelup.ogg'], volume: 0.8 },

  // Notification Sounds
  { id: 'notify_turn', category: 'notification', src: ['/audio/sfx/notify/turn.mp3', '/audio/sfx/notify/turn.ogg'], volume: 0.6 },
  { id: 'notify_message', category: 'notification', src: ['/audio/sfx/notify/message.mp3', '/audio/sfx/notify/message.ogg'], volume: 0.5 },
  { id: 'notify_join', category: 'notification', src: ['/audio/sfx/notify/join.mp3', '/audio/sfx/notify/join.ogg'], volume: 0.5 },
  { id: 'notify_leave', category: 'notification', src: ['/audio/sfx/notify/leave.mp3', '/audio/sfx/notify/leave.ogg'], volume: 0.5 },
];

class SFXManagerClass {
  private sounds: Map<string, Howl> = new Map();
  private categoryVolumes: Map<SFXCategory, number> = new Map();
  private masterVolume: number = 1.0;
  private muted: boolean = false;
  private initialized: boolean = false;

  constructor() {
    // Initialize category volumes
    this.categoryVolumes.set('ui', 1.0);
    this.categoryVolumes.set('dice', 1.0);
    this.categoryVolumes.set('combat', 1.0);
    this.categoryVolumes.set('magic', 1.0);
    this.categoryVolumes.set('environment', 1.0);
    this.categoryVolumes.set('character', 1.0);
    this.categoryVolumes.set('notification', 1.0);
  }

  /**
   * Initialize and preload all sound effects
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Load saved preferences
    this.loadPreferences();

    // Preload all sounds
    const loadPromises = SFX_LIBRARY.map(sfx => this.loadSound(sfx));
    await Promise.allSettled(loadPromises);

    this.initialized = true;
    console.log('[SFXManager] Initialized with', this.sounds.size, 'sounds');
  }

  /**
   * Load a single sound
   */
  private loadSound(sfx: SFXSound): Promise<void> {
    return new Promise((resolve) => {
      const howl = new Howl({
        src: sfx.src,
        volume: (sfx.volume || 1.0) * this.masterVolume,
        rate: sfx.rate || 1.0,
        sprite: sfx.sprite,
        preload: true,
        onload: () => {
          this.sounds.set(sfx.id, howl);
          resolve();
        },
        onloaderror: (_id, error) => {
          console.warn(`[SFXManager] Failed to load ${sfx.id}:`, error);
          resolve(); // Don't fail, just continue
        },
      });
    });
  }

  /**
   * Play a sound effect
   */
  play(id: string, options: PlayOptions = {}): number | null {
    if (this.muted) return null;

    const howl = this.sounds.get(id);
    if (!howl) {
      // Try to create a placeholder sound for missing files
      console.warn(`[SFXManager] Sound not found: ${id}`);
      return null;
    }

    const sfxDef = SFX_LIBRARY.find(s => s.id === id);
    const categoryVol = this.categoryVolumes.get(sfxDef?.category || 'ui') || 1.0;
    const baseVol = sfxDef?.volume || 1.0;
    const finalVolume = (options.volume ?? 1.0) * baseVol * categoryVol * this.masterVolume;

    const soundId = howl.play();

    if (soundId !== null) {
      howl.volume(finalVolume, soundId);

      if (options.rate !== undefined) {
        howl.rate(options.rate, soundId);
      }

      if (options.pan !== undefined) {
        howl.stereo(options.pan, soundId);
      }

      if (options.loop !== undefined) {
        howl.loop(options.loop, soundId);
      }

      if (options.onEnd) {
        howl.once('end', options.onEnd, soundId);
      }
    }

    return soundId;
  }

  /**
   * Play a random variation of a sound (for variety)
   */
  playRandom(idPrefix: string, options: PlayOptions = {}): number | null {
    const matchingSounds = Array.from(this.sounds.keys())
      .filter(id => id.startsWith(idPrefix));

    if (matchingSounds.length === 0) {
      return this.play(idPrefix, options);
    }

    const randomId = matchingSounds[Math.floor(Math.random() * matchingSounds.length)];
    return this.play(randomId, options);
  }

  /**
   * Stop a specific sound
   */
  stop(id: string, soundId?: number): void {
    const howl = this.sounds.get(id);
    if (howl) {
      if (soundId !== undefined) {
        howl.stop(soundId);
      } else {
        howl.stop();
      }
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    Howler.stop();
  }

  /**
   * Set master volume (0-1)
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
    this.savePreferences();
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Set category volume (0-1)
   */
  setCategoryVolume(category: SFXCategory, volume: number): void {
    this.categoryVolumes.set(category, Math.max(0, Math.min(1, volume)));
    this.savePreferences();
  }

  /**
   * Get category volume
   */
  getCategoryVolume(category: SFXCategory): number {
    return this.categoryVolumes.get(category) || 1.0;
  }

  /**
   * Mute/unmute all sounds
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    Howler.mute(muted);
    this.savePreferences();
  }

  /**
   * Check if muted
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    if (typeof window === 'undefined') return;

    const prefs = {
      masterVolume: this.masterVolume,
      muted: this.muted,
      categoryVolumes: Object.fromEntries(this.categoryVolumes),
    };
    localStorage.setItem('dnd_sfx_preferences', JSON.stringify(prefs));
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('dnd_sfx_preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.masterVolume = prefs.masterVolume ?? 1.0;
        this.muted = prefs.muted ?? false;
        if (prefs.categoryVolumes) {
          Object.entries(prefs.categoryVolumes).forEach(([cat, vol]) => {
            this.categoryVolumes.set(cat as SFXCategory, vol as number);
          });
        }
      }
    } catch (e) {
      console.warn('[SFXManager] Failed to load preferences:', e);
    }
  }

  /**
   * Get list of available sounds
   */
  getAvailableSounds(): string[] {
    return Array.from(this.sounds.keys());
  }

  /**
   * Check if a sound is loaded
   */
  isLoaded(id: string): boolean {
    return this.sounds.has(id);
  }
}

// Singleton instance
export const SFXManager = new SFXManagerClass();

// Convenience functions for common sounds
export const playSFX = {
  // UI
  click: () => SFXManager.play('ui_click'),
  hover: () => SFXManager.play('ui_hover'),
  open: () => SFXManager.play('ui_open'),
  close: () => SFXManager.play('ui_close'),
  success: () => SFXManager.play('ui_success'),
  error: () => SFXManager.play('ui_error'),
  notification: () => SFXManager.play('ui_notification'),

  // Dice
  dicePickup: () => SFXManager.play('dice_pickup'),
  diceRoll: () => SFXManager.play('dice_roll'),
  diceLand: () => SFXManager.play('dice_land'),
  diceCritical: () => SFXManager.play('dice_critical'),
  diceFumble: () => SFXManager.play('dice_fumble'),

  // Combat
  swordHit: () => SFXManager.play('combat_sword_hit'),
  swordMiss: () => SFXManager.play('combat_sword_miss'),
  bowShoot: () => SFXManager.play('combat_bow_shoot'),
  arrowHit: () => SFXManager.play('combat_arrow_hit'),
  bluntHit: () => SFXManager.play('combat_blunt_hit'),
  block: () => SFXManager.play('combat_block'),
  criticalHit: () => SFXManager.play('combat_critical'),
  death: () => SFXManager.play('combat_death'),

  // Magic
  fire: () => SFXManager.play('magic_fire'),
  ice: () => SFXManager.play('magic_ice'),
  lightning: () => SFXManager.play('magic_lightning'),
  heal: () => SFXManager.play('magic_heal'),
  buff: () => SFXManager.play('magic_buff'),
  debuff: () => SFXManager.play('magic_debuff'),
  teleport: () => SFXManager.play('magic_teleport'),
  summon: () => SFXManager.play('magic_summon'),
  necrotic: () => SFXManager.play('magic_necrotic'),
  radiant: () => SFXManager.play('magic_radiant'),

  // Environment
  doorOpen: () => SFXManager.play('env_door_open'),
  doorClose: () => SFXManager.play('env_door_close'),
  chestOpen: () => SFXManager.play('env_chest_open'),
  trapTrigger: () => SFXManager.play('env_trap_trigger'),
  coins: () => SFXManager.play('env_coins'),
  itemPickup: () => SFXManager.play('env_item_pickup'),

  // Character
  footstep: () => SFXManager.play('char_footstep'),
  jump: () => SFXManager.play('char_jump'),
  hurt: () => SFXManager.play('char_hurt'),
  levelUp: () => SFXManager.play('char_levelup'),

  // Notifications
  yourTurn: () => SFXManager.play('notify_turn'),
  message: () => SFXManager.play('notify_message'),
  playerJoin: () => SFXManager.play('notify_join'),
  playerLeave: () => SFXManager.play('notify_leave'),
};

export default SFXManager;
