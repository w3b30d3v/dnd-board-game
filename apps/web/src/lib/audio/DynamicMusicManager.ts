// DynamicMusicManager - Adaptive Music System using Howler.js
// Manages background music with stem-based mixing for dynamic intensity

import { Howl, Howler } from 'howler';

export type MusicMood =
  | 'exploration'
  | 'tension'
  | 'combat'
  | 'boss'
  | 'victory'
  | 'defeat'
  | 'mystery'
  | 'tavern'
  | 'sacred'
  | 'dread';

export type MusicStem = 'base' | 'melody' | 'percussion' | 'accent' | 'tension';

export interface MusicTrack {
  id: string;
  mood: MusicMood;
  bpm: number;
  stems: {
    [K in MusicStem]?: string;
  };
  loopStart?: number;
  loopEnd?: number;
}

// Music track definitions
const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: 'exploration_forest',
    mood: 'exploration',
    bpm: 80,
    stems: {
      base: '/audio/music/exploration/forest_base.mp3',
      melody: '/audio/music/exploration/forest_melody.mp3',
      percussion: '/audio/music/exploration/forest_perc.mp3',
    },
  },
  {
    id: 'exploration_dungeon',
    mood: 'exploration',
    bpm: 70,
    stems: {
      base: '/audio/music/exploration/dungeon_base.mp3',
      melody: '/audio/music/exploration/dungeon_melody.mp3',
      tension: '/audio/music/exploration/dungeon_tension.mp3',
    },
  },
  {
    id: 'tension_rising',
    mood: 'tension',
    bpm: 90,
    stems: {
      base: '/audio/music/tension/rising_base.mp3',
      percussion: '/audio/music/tension/rising_perc.mp3',
      tension: '/audio/music/tension/rising_tension.mp3',
    },
  },
  {
    id: 'combat_standard',
    mood: 'combat',
    bpm: 140,
    stems: {
      base: '/audio/music/combat/standard_base.mp3',
      melody: '/audio/music/combat/standard_melody.mp3',
      percussion: '/audio/music/combat/standard_perc.mp3',
      accent: '/audio/music/combat/standard_accent.mp3',
    },
  },
  {
    id: 'combat_intense',
    mood: 'combat',
    bpm: 160,
    stems: {
      base: '/audio/music/combat/intense_base.mp3',
      melody: '/audio/music/combat/intense_melody.mp3',
      percussion: '/audio/music/combat/intense_perc.mp3',
      accent: '/audio/music/combat/intense_accent.mp3',
      tension: '/audio/music/combat/intense_tension.mp3',
    },
  },
  {
    id: 'boss_epic',
    mood: 'boss',
    bpm: 150,
    stems: {
      base: '/audio/music/boss/epic_base.mp3',
      melody: '/audio/music/boss/epic_melody.mp3',
      percussion: '/audio/music/boss/epic_perc.mp3',
      accent: '/audio/music/boss/epic_accent.mp3',
      tension: '/audio/music/boss/epic_tension.mp3',
    },
  },
  {
    id: 'victory_fanfare',
    mood: 'victory',
    bpm: 120,
    stems: {
      base: '/audio/music/victory/fanfare_base.mp3',
      melody: '/audio/music/victory/fanfare_melody.mp3',
      accent: '/audio/music/victory/fanfare_accent.mp3',
    },
  },
  {
    id: 'defeat_somber',
    mood: 'defeat',
    bpm: 60,
    stems: {
      base: '/audio/music/defeat/somber_base.mp3',
      melody: '/audio/music/defeat/somber_melody.mp3',
    },
  },
  {
    id: 'tavern_jolly',
    mood: 'tavern',
    bpm: 110,
    stems: {
      base: '/audio/music/tavern/jolly_base.mp3',
      melody: '/audio/music/tavern/jolly_melody.mp3',
      percussion: '/audio/music/tavern/jolly_perc.mp3',
    },
  },
  {
    id: 'mystery_eerie',
    mood: 'mystery',
    bpm: 65,
    stems: {
      base: '/audio/music/mystery/eerie_base.mp3',
      melody: '/audio/music/mystery/eerie_melody.mp3',
      tension: '/audio/music/mystery/eerie_tension.mp3',
    },
  },
  {
    id: 'sacred_temple',
    mood: 'sacred',
    bpm: 70,
    stems: {
      base: '/audio/music/sacred/temple_base.mp3',
      melody: '/audio/music/sacred/temple_melody.mp3',
      accent: '/audio/music/sacred/temple_accent.mp3',
    },
  },
  {
    id: 'dread_horror',
    mood: 'dread',
    bpm: 55,
    stems: {
      base: '/audio/music/dread/horror_base.mp3',
      tension: '/audio/music/dread/horror_tension.mp3',
    },
  },
];

interface StemState {
  howl: Howl | null;
  targetVolume: number;
  currentVolume: number;
  soundId: number | null;
}

class DynamicMusicManagerClass {
  private currentTrack: MusicTrack | null = null;
  private stems: Map<MusicStem, StemState> = new Map();
  private masterVolume: number = 0.5;
  private intensity: number = 0.5; // 0-1, affects which stems play
  private transitionDuration: number = 2000; // ms
  private fadeInterval: NodeJS.Timeout | null = null;
  private muted: boolean = false;
  private initialized: boolean = false;
  private playing: boolean = false;

  // Intensity thresholds for stems
  private readonly STEM_THRESHOLDS: Record<MusicStem, number> = {
    base: 0,       // Always plays
    melody: 0.2,   // Light activity
    percussion: 0.4, // Some action
    accent: 0.6,   // High action
    tension: 0.8,  // Maximum tension
  };

  constructor() {
    // Initialize stem states
    const stemTypes: MusicStem[] = ['base', 'melody', 'percussion', 'accent', 'tension'];
    stemTypes.forEach(stem => {
      this.stems.set(stem, {
        howl: null,
        targetVolume: 0,
        currentVolume: 0,
        soundId: null,
      });
    });
  }

  /**
   * Initialize the music manager
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    this.loadPreferences();
    this.initialized = true;
    console.log('[DynamicMusicManager] Initialized');
  }

  /**
   * Play music by mood - picks appropriate track
   */
  async playMood(mood: MusicMood, crossfade: boolean = true): Promise<void> {
    const tracks = MUSIC_LIBRARY.filter(t => t.mood === mood);
    if (tracks.length === 0) {
      console.warn(`[DynamicMusicManager] No tracks for mood: ${mood}`);
      return;
    }

    // Pick random track from available
    const track = tracks[Math.floor(Math.random() * tracks.length)];
    await this.playTrack(track.id, crossfade);
  }

  /**
   * Play a specific track
   */
  async playTrack(trackId: string, crossfade: boolean = true): Promise<void> {
    const track = MUSIC_LIBRARY.find(t => t.id === trackId);
    if (!track) {
      console.warn(`[DynamicMusicManager] Track not found: ${trackId}`);
      return;
    }

    if (crossfade && this.currentTrack) {
      await this.crossfadeTo(track);
    } else {
      await this.loadAndPlayTrack(track);
    }
  }

  /**
   * Load and play a track
   */
  private async loadAndPlayTrack(track: MusicTrack): Promise<void> {
    // Stop current track
    this.stopAll();

    this.currentTrack = track;

    // Load all stems for this track
    const loadPromises: Promise<void>[] = [];

    for (const [stem, src] of Object.entries(track.stems)) {
      if (src) {
        loadPromises.push(this.loadStem(stem as MusicStem, src));
      }
    }

    await Promise.allSettled(loadPromises);

    // Start playback
    this.startPlayback();
  }

  /**
   * Load a single stem
   */
  private loadStem(stem: MusicStem, src: string): Promise<void> {
    return new Promise((resolve) => {
      const state = this.stems.get(stem);
      if (!state) {
        resolve();
        return;
      }

      // Cleanup old howl
      if (state.howl) {
        state.howl.unload();
      }

      const howl = new Howl({
        src: [src],
        loop: true,
        volume: 0,
        preload: true,
        onload: () => {
          state.howl = howl;
          resolve();
        },
        onloaderror: (_id, error) => {
          console.warn(`[DynamicMusicManager] Failed to load stem ${stem}:`, error);
          state.howl = null;
          resolve();
        },
      });
    });
  }

  /**
   * Start playing all loaded stems
   */
  private startPlayback(): void {
    this.playing = true;

    // Calculate target volumes based on intensity
    this.updateStemVolumes();

    // Start all stems simultaneously
    this.stems.forEach((state, _stem) => {
      if (state.howl) {
        state.soundId = state.howl.play();
        state.howl.volume(state.currentVolume * this.masterVolume, state.soundId);
      }
    });

    // Start fade update loop
    this.startFadeLoop();
  }

  /**
   * Crossfade to a new track
   */
  private async crossfadeTo(newTrack: MusicTrack): Promise<void> {
    // Fade out current stems
    this.stems.forEach(state => {
      state.targetVolume = 0;
    });

    // Wait for fade out
    await new Promise(resolve => setTimeout(resolve, this.transitionDuration));

    // Load and play new track
    await this.loadAndPlayTrack(newTrack);
  }

  /**
   * Update stem volumes based on intensity
   */
  private updateStemVolumes(): void {
    this.stems.forEach((state, stem) => {
      const threshold = this.STEM_THRESHOLDS[stem];
      // Stem plays if intensity >= threshold
      // Volume scales from threshold to 1.0
      if (this.intensity >= threshold) {
        const range = 1.0 - threshold;
        const normalizedIntensity = range > 0 ? (this.intensity - threshold) / range : 1;
        state.targetVolume = 0.5 + (normalizedIntensity * 0.5); // 0.5-1.0 range
      } else {
        state.targetVolume = 0;
      }
    });
  }

  /**
   * Start the volume fade loop
   */
  private startFadeLoop(): void {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    const fadeStep = 50; // ms
    const volumeStep = fadeStep / this.transitionDuration;

    this.fadeInterval = setInterval(() => {
      let anyChanging = false;

      this.stems.forEach((state) => {
        if (state.howl && state.soundId !== null) {
          const diff = state.targetVolume - state.currentVolume;

          if (Math.abs(diff) > 0.01) {
            anyChanging = true;
            const change = Math.sign(diff) * Math.min(Math.abs(diff), volumeStep);
            state.currentVolume += change;
            state.howl.volume(state.currentVolume * this.masterVolume, state.soundId);
          } else {
            state.currentVolume = state.targetVolume;
          }
        }
      });

      // Stop loop if nothing is changing and we're not playing
      if (!anyChanging && !this.playing) {
        this.stopFadeLoop();
      }
    }, fadeStep);
  }

  /**
   * Stop the fade loop
   */
  private stopFadeLoop(): void {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  /**
   * Set music intensity (0-1)
   * Higher intensity = more stems play
   */
  setIntensity(intensity: number): void {
    this.intensity = Math.max(0, Math.min(1, intensity));
    this.updateStemVolumes();
  }

  /**
   * Get current intensity
   */
  getIntensity(): number {
    return this.intensity;
  }

  /**
   * Gradually increase intensity
   */
  rampIntensity(targetIntensity: number, duration: number = 2000): void {
    const startIntensity = this.intensity;
    const diff = targetIntensity - startIntensity;
    const startTime = Date.now();

    const ramp = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      this.setIntensity(startIntensity + diff * progress);

      if (progress < 1) {
        requestAnimationFrame(ramp);
      }
    };

    requestAnimationFrame(ramp);
  }

  /**
   * Stop all music
   */
  stop(fadeOut: boolean = true): void {
    this.playing = false;

    if (fadeOut) {
      this.stems.forEach(state => {
        state.targetVolume = 0;
      });

      // Let fade complete then cleanup
      setTimeout(() => {
        this.stopAll();
      }, this.transitionDuration);
    } else {
      this.stopAll();
    }
  }

  /**
   * Immediately stop all stems
   */
  private stopAll(): void {
    this.stopFadeLoop();

    this.stems.forEach((state) => {
      if (state.howl) {
        state.howl.stop();
        state.howl.unload();
        state.howl = null;
      }
      state.soundId = null;
      state.currentVolume = 0;
      state.targetVolume = 0;
    });

    this.currentTrack = null;
  }

  /**
   * Pause music
   */
  pause(): void {
    this.stems.forEach((state) => {
      if (state.howl && state.soundId !== null) {
        state.howl.pause(state.soundId);
      }
    });
  }

  /**
   * Resume music
   */
  resume(): void {
    this.stems.forEach((state) => {
      if (state.howl && state.soundId !== null) {
        state.howl.play(state.soundId);
      }
    });
  }

  /**
   * Set master volume (0-1)
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));

    this.stems.forEach((state) => {
      if (state.howl && state.soundId !== null) {
        state.howl.volume(state.currentVolume * this.masterVolume, state.soundId);
      }
    });

    this.savePreferences();
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Mute/unmute music
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
   * Get current track info
   */
  getCurrentTrack(): MusicTrack | null {
    return this.currentTrack;
  }

  /**
   * Check if music is playing
   */
  isPlaying(): boolean {
    return this.playing;
  }

  /**
   * Get available moods
   */
  getAvailableMoods(): MusicMood[] {
    return [...new Set(MUSIC_LIBRARY.map(t => t.mood))];
  }

  /**
   * Get tracks by mood
   */
  getTracksByMood(mood: MusicMood): MusicTrack[] {
    return MUSIC_LIBRARY.filter(t => t.mood === mood);
  }

  /**
   * Save preferences
   */
  private savePreferences(): void {
    if (typeof window === 'undefined') return;

    const prefs = {
      masterVolume: this.masterVolume,
      muted: this.muted,
    };
    localStorage.setItem('dnd_music_preferences', JSON.stringify(prefs));
  }

  /**
   * Load preferences
   */
  private loadPreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('dnd_music_preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.masterVolume = prefs.masterVolume ?? 0.5;
        this.muted = prefs.muted ?? false;
      }
    } catch (e) {
      console.warn('[DynamicMusicManager] Failed to load preferences:', e);
    }
  }
}

// Singleton instance
export const DynamicMusicManager = new DynamicMusicManagerClass();

export default DynamicMusicManager;
