'use client';

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { Howl, Howler } from 'howler';

// ============================================================================
// TYPES
// ============================================================================

export type MusicMood =
  | 'peaceful'
  | 'exploration'
  | 'tension'
  | 'combat'
  | 'boss'
  | 'victory'
  | 'defeat'
  | 'mystery'
  | 'tavern'
  | 'dungeon'
  | 'epic';

export interface MusicLayer {
  id: string;
  url: string;
  volume: number;
  mood: MusicMood[];
  loop: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

interface MusicTrack {
  id: string;
  name: string;
  mood: MusicMood;
  layers: MusicLayer[];
  bpm?: number;
  duration?: number;
}

interface DynamicMusicState {
  currentMood: MusicMood;
  intensity: number; // 0-1, affects layer mixing
  volume: number; // Master volume 0-1
  isPlaying: boolean;
  currentTrack: MusicTrack | null;
  isMuted: boolean;
}

interface DynamicMusicContextType extends DynamicMusicState {
  setMood: (mood: MusicMood, transitionTime?: number) => void;
  setIntensity: (intensity: number) => void;
  setVolume: (volume: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  mute: () => void;
  unmute: () => void;
  playOneShot: (url: string, volume?: number) => void;
  crossfadeTo: (trackId: string, duration?: number) => void;
}

// ============================================================================
// DEFAULT MUSIC LIBRARY (placeholder URLs)
// ============================================================================

const DEFAULT_MUSIC_LIBRARY: Record<MusicMood, MusicTrack> = {
  peaceful: {
    id: 'peaceful-ambient',
    name: 'Peaceful Ambient',
    mood: 'peaceful',
    layers: [
      {
        id: 'peaceful-base',
        url: '/audio/music/peaceful-base.mp3',
        volume: 0.6,
        mood: ['peaceful', 'exploration'],
        loop: true,
        fadeIn: 2000,
        fadeOut: 2000,
      },
      {
        id: 'peaceful-melody',
        url: '/audio/music/peaceful-melody.mp3',
        volume: 0.4,
        mood: ['peaceful'],
        loop: true,
        fadeIn: 3000,
        fadeOut: 2000,
      },
    ],
    bpm: 60,
  },
  exploration: {
    id: 'exploration-adventure',
    name: 'Adventure Theme',
    mood: 'exploration',
    layers: [
      {
        id: 'exploration-base',
        url: '/audio/music/exploration-base.mp3',
        volume: 0.5,
        mood: ['exploration', 'peaceful'],
        loop: true,
        fadeIn: 2000,
        fadeOut: 2000,
      },
      {
        id: 'exploration-strings',
        url: '/audio/music/exploration-strings.mp3',
        volume: 0.4,
        mood: ['exploration'],
        loop: true,
        fadeIn: 2000,
        fadeOut: 2000,
      },
    ],
    bpm: 80,
  },
  tension: {
    id: 'tension-suspense',
    name: 'Suspense',
    mood: 'tension',
    layers: [
      {
        id: 'tension-drone',
        url: '/audio/music/tension-drone.mp3',
        volume: 0.6,
        mood: ['tension', 'mystery', 'dungeon'],
        loop: true,
        fadeIn: 1500,
        fadeOut: 1500,
      },
      {
        id: 'tension-pulse',
        url: '/audio/music/tension-pulse.mp3',
        volume: 0.3,
        mood: ['tension'],
        loop: true,
        fadeIn: 1000,
        fadeOut: 1000,
      },
    ],
    bpm: 90,
  },
  combat: {
    id: 'combat-battle',
    name: 'Battle Theme',
    mood: 'combat',
    layers: [
      {
        id: 'combat-drums',
        url: '/audio/music/combat-drums.mp3',
        volume: 0.7,
        mood: ['combat', 'boss'],
        loop: true,
        fadeIn: 500,
        fadeOut: 1000,
      },
      {
        id: 'combat-orchestra',
        url: '/audio/music/combat-orchestra.mp3',
        volume: 0.5,
        mood: ['combat'],
        loop: true,
        fadeIn: 1000,
        fadeOut: 1500,
      },
      {
        id: 'combat-choir',
        url: '/audio/music/combat-choir.mp3',
        volume: 0.4,
        mood: ['combat', 'boss'],
        loop: true,
        fadeIn: 1500,
        fadeOut: 1500,
      },
    ],
    bpm: 140,
  },
  boss: {
    id: 'boss-epic',
    name: 'Boss Battle',
    mood: 'boss',
    layers: [
      {
        id: 'boss-percussion',
        url: '/audio/music/boss-percussion.mp3',
        volume: 0.8,
        mood: ['boss'],
        loop: true,
        fadeIn: 300,
        fadeOut: 1000,
      },
      {
        id: 'boss-orchestra',
        url: '/audio/music/boss-orchestra.mp3',
        volume: 0.6,
        mood: ['boss'],
        loop: true,
        fadeIn: 500,
        fadeOut: 1500,
      },
      {
        id: 'boss-choir',
        url: '/audio/music/boss-choir.mp3',
        volume: 0.5,
        mood: ['boss', 'epic'],
        loop: true,
        fadeIn: 1000,
        fadeOut: 2000,
      },
    ],
    bpm: 160,
  },
  victory: {
    id: 'victory-fanfare',
    name: 'Victory Fanfare',
    mood: 'victory',
    layers: [
      {
        id: 'victory-main',
        url: '/audio/music/victory-fanfare.mp3',
        volume: 0.8,
        mood: ['victory'],
        loop: false,
        fadeIn: 0,
        fadeOut: 2000,
      },
    ],
    bpm: 120,
    duration: 15000, // 15 second fanfare
  },
  defeat: {
    id: 'defeat-somber',
    name: 'Defeat Theme',
    mood: 'defeat',
    layers: [
      {
        id: 'defeat-main',
        url: '/audio/music/defeat-somber.mp3',
        volume: 0.6,
        mood: ['defeat'],
        loop: false,
        fadeIn: 1000,
        fadeOut: 3000,
      },
    ],
    bpm: 50,
    duration: 20000,
  },
  mystery: {
    id: 'mystery-ambient',
    name: 'Mystery',
    mood: 'mystery',
    layers: [
      {
        id: 'mystery-pad',
        url: '/audio/music/mystery-pad.mp3',
        volume: 0.5,
        mood: ['mystery', 'dungeon'],
        loop: true,
        fadeIn: 3000,
        fadeOut: 3000,
      },
      {
        id: 'mystery-melody',
        url: '/audio/music/mystery-melody.mp3',
        volume: 0.3,
        mood: ['mystery'],
        loop: true,
        fadeIn: 4000,
        fadeOut: 3000,
      },
    ],
    bpm: 70,
  },
  tavern: {
    id: 'tavern-folk',
    name: 'Tavern Folk',
    mood: 'tavern',
    layers: [
      {
        id: 'tavern-lute',
        url: '/audio/music/tavern-lute.mp3',
        volume: 0.6,
        mood: ['tavern'],
        loop: true,
        fadeIn: 2000,
        fadeOut: 2000,
      },
      {
        id: 'tavern-crowd',
        url: '/audio/music/tavern-crowd.mp3',
        volume: 0.3,
        mood: ['tavern'],
        loop: true,
        fadeIn: 1000,
        fadeOut: 1000,
      },
    ],
    bpm: 100,
  },
  dungeon: {
    id: 'dungeon-dark',
    name: 'Dungeon Dark',
    mood: 'dungeon',
    layers: [
      {
        id: 'dungeon-drone',
        url: '/audio/music/dungeon-drone.mp3',
        volume: 0.5,
        mood: ['dungeon', 'mystery', 'tension'],
        loop: true,
        fadeIn: 3000,
        fadeOut: 3000,
      },
      {
        id: 'dungeon-drips',
        url: '/audio/music/dungeon-drips.mp3',
        volume: 0.2,
        mood: ['dungeon'],
        loop: true,
        fadeIn: 2000,
        fadeOut: 2000,
      },
    ],
    bpm: 60,
  },
  epic: {
    id: 'epic-theme',
    name: 'Epic Theme',
    mood: 'epic',
    layers: [
      {
        id: 'epic-orchestra',
        url: '/audio/music/epic-orchestra.mp3',
        volume: 0.7,
        mood: ['epic', 'boss'],
        loop: true,
        fadeIn: 2000,
        fadeOut: 2000,
      },
      {
        id: 'epic-choir',
        url: '/audio/music/epic-choir.mp3',
        volume: 0.5,
        mood: ['epic'],
        loop: true,
        fadeIn: 3000,
        fadeOut: 2000,
      },
      {
        id: 'epic-brass',
        url: '/audio/music/epic-brass.mp3',
        volume: 0.4,
        mood: ['epic'],
        loop: true,
        fadeIn: 2000,
        fadeOut: 2000,
      },
    ],
    bpm: 130,
  },
};

// ============================================================================
// CONTEXT
// ============================================================================

const DynamicMusicContext = createContext<DynamicMusicContextType | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface DynamicMusicManagerProps {
  children: React.ReactNode;
  initialMood?: MusicMood;
  initialVolume?: number;
  autoPlay?: boolean;
  musicLibrary?: Record<MusicMood, MusicTrack>;
}

export const DynamicMusicManager: React.FC<DynamicMusicManagerProps> = ({
  children,
  initialMood = 'peaceful',
  initialVolume = 0.5,
  autoPlay = false,
  musicLibrary = DEFAULT_MUSIC_LIBRARY,
}) => {
  const [state, setState] = useState<DynamicMusicState>({
    currentMood: initialMood,
    intensity: 0.5,
    volume: initialVolume,
    isPlaying: false,
    currentTrack: null,
    isMuted: false,
  });

  // Track active Howl instances per layer
  const activeLayersRef = useRef<Map<string, Howl>>(new Map());
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeLayersRef.current.forEach((howl) => {
        howl.unload();
      });
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // Set global volume
  useEffect(() => {
    Howler.volume(state.isMuted ? 0 : state.volume);
  }, [state.volume, state.isMuted]);

  // Load and play a specific mood's music
  const loadMoodMusic = useCallback((mood: MusicMood, transitionTime: number = 2000) => {
    const track = musicLibrary[mood];
    if (!track) return;

    // Fade out current layers
    activeLayersRef.current.forEach((howl, layerId) => {
      const layer = state.currentTrack?.layers.find(l => l.id === layerId);
      const fadeOutTime = layer?.fadeOut ?? transitionTime;
      howl.fade(howl.volume(), 0, fadeOutTime);
      setTimeout(() => {
        howl.stop();
        howl.unload();
        activeLayersRef.current.delete(layerId);
      }, fadeOutTime);
    });

    // Load new layers after a brief overlap
    transitionTimeoutRef.current = setTimeout(() => {
      track.layers.forEach((layer) => {
        // Skip layers that aren't for this mood based on intensity
        const shouldPlay = layer.mood.includes(mood);
        if (!shouldPlay) return;

        const howl = new Howl({
          src: [layer.url],
          loop: layer.loop,
          volume: 0,
          onload: () => {
            howl.play();
            const targetVolume = layer.volume * state.intensity;
            howl.fade(0, targetVolume, layer.fadeIn ?? transitionTime);
          },
          onloaderror: (_id: number, error: unknown) => {
            console.warn(`Failed to load music layer ${layer.id}:`, error);
          },
        });

        activeLayersRef.current.set(layer.id, howl);
      });

      setState(prev => ({
        ...prev,
        currentMood: mood,
        currentTrack: track,
        isPlaying: true,
      }));
    }, transitionTime * 0.3); // Small overlap for smooth transition
  }, [musicLibrary, state.currentTrack, state.intensity]);

  // Update layer volumes based on intensity
  const updateLayerVolumes = useCallback((intensity: number) => {
    activeLayersRef.current.forEach((howl, layerId) => {
      const layer = state.currentTrack?.layers.find(l => l.id === layerId);
      if (layer) {
        const targetVolume = layer.volume * intensity;
        howl.fade(howl.volume(), targetVolume, 500);
      }
    });
  }, [state.currentTrack]);

  const setMood = useCallback((mood: MusicMood, transitionTime: number = 2000) => {
    if (mood === state.currentMood && state.isPlaying) return;
    loadMoodMusic(mood, transitionTime);
  }, [state.currentMood, state.isPlaying, loadMoodMusic]);

  const setIntensity = useCallback((intensity: number) => {
    const clampedIntensity = Math.max(0, Math.min(1, intensity));
    setState(prev => ({ ...prev, intensity: clampedIntensity }));
    updateLayerVolumes(clampedIntensity);
  }, [updateLayerVolumes]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState(prev => ({ ...prev, volume: clampedVolume }));
  }, []);

  const play = useCallback(() => {
    if (state.isPlaying) return;
    if (state.currentTrack) {
      activeLayersRef.current.forEach((howl) => howl.play());
    } else {
      loadMoodMusic(state.currentMood);
    }
    setState(prev => ({ ...prev, isPlaying: true }));
  }, [state.isPlaying, state.currentTrack, state.currentMood, loadMoodMusic]);

  const pause = useCallback(() => {
    activeLayersRef.current.forEach((howl) => howl.pause());
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const stop = useCallback(() => {
    activeLayersRef.current.forEach((howl) => {
      howl.stop();
      howl.unload();
    });
    activeLayersRef.current.clear();
    setState(prev => ({ ...prev, isPlaying: false, currentTrack: null }));
  }, []);

  const mute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: true }));
  }, []);

  const unmute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: false }));
  }, []);

  const playOneShot = useCallback((url: string, volume: number = 0.5) => {
    const howl = new Howl({
      src: [url],
      volume: state.isMuted ? 0 : volume * state.volume,
      onend: () => howl.unload(),
    });
    howl.play();
  }, [state.isMuted, state.volume]);

  const crossfadeTo = useCallback((trackId: string, duration: number = 2000) => {
    const mood = Object.keys(musicLibrary).find(
      (m) => musicLibrary[m as MusicMood].id === trackId
    ) as MusicMood | undefined;
    if (mood) {
      setMood(mood, duration);
    }
  }, [musicLibrary, setMood]);

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay) {
      play();
    }
  }, [autoPlay, play]);

  const contextValue: DynamicMusicContextType = {
    ...state,
    setMood,
    setIntensity,
    setVolume,
    play,
    pause,
    stop,
    mute,
    unmute,
    playOneShot,
    crossfadeTo,
  };

  return (
    <DynamicMusicContext.Provider value={contextValue}>
      {children}
    </DynamicMusicContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useDynamicMusic = (): DynamicMusicContextType => {
  const context = useContext(DynamicMusicContext);
  if (!context) {
    throw new Error('useDynamicMusic must be used within a DynamicMusicManager');
  }
  return context;
};

// ============================================================================
// MUSIC CONTROL UI COMPONENT
// ============================================================================

interface MusicControlsProps {
  className?: string;
  showMoodSelector?: boolean;
}

export const MusicControls: React.FC<MusicControlsProps> = ({
  className = '',
  showMoodSelector = false,
}) => {
  const {
    currentMood,
    intensity,
    volume,
    isPlaying,
    isMuted,
    setMood,
    setIntensity,
    setVolume,
    play,
    pause,
    mute,
    unmute,
  } = useDynamicMusic();

  const moods: MusicMood[] = [
    'peaceful', 'exploration', 'tension', 'combat', 'boss',
    'victory', 'defeat', 'mystery', 'tavern', 'dungeon', 'epic'
  ];

  return (
    <div className={`flex flex-col gap-3 p-4 bg-gray-900/80 rounded-lg ${className}`}>
      {/* Play/Pause and Mute */}
      <div className="flex items-center gap-2">
        <button
          onClick={isPlaying ? pause : play}
          className="p-2 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button
          onClick={isMuted ? unmute : mute}
          className="p-2 rounded bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <span className="text-sm text-gray-400 ml-2 capitalize">{currentMood}</span>
      </div>

      {/* Volume Slider */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-16">Volume</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume * 100}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <span className="text-xs text-gray-400 w-8">{Math.round(volume * 100)}%</span>
      </div>

      {/* Intensity Slider */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-16">Intensity</span>
        <input
          type="range"
          min="0"
          max="100"
          value={intensity * 100}
          onChange={(e) => setIntensity(Number(e.target.value) / 100)}
          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <span className="text-xs text-gray-400 w-8">{Math.round(intensity * 100)}%</span>
      </div>

      {/* Mood Selector */}
      {showMoodSelector && (
        <div className="flex flex-wrap gap-1 mt-2">
          {moods.map((mood) => (
            <button
              key={mood}
              onClick={() => setMood(mood)}
              className={`px-2 py-1 text-xs rounded capitalize transition-colors ${
                currentMood === mood
                  ? 'bg-amber-500 text-black'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DynamicMusicManager;
