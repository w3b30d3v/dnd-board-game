'use client';

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { Howl, Howler } from 'howler';

// ============================================================================
// TYPES
// ============================================================================

export type AmbienceType =
  | 'forest'
  | 'dungeon'
  | 'cave'
  | 'tavern'
  | 'castle'
  | 'village'
  | 'city'
  | 'ocean'
  | 'swamp'
  | 'mountain'
  | 'desert'
  | 'temple'
  | 'battlefield'
  | 'crypt'
  | 'storm'
  | 'rain'
  | 'wind'
  | 'fire'
  | 'water'
  | 'none';

export type SFXType =
  // UI Sounds
  | 'button_click'
  | 'button_hover'
  | 'menu_open'
  | 'menu_close'
  | 'notification'
  | 'error'
  | 'success'
  // Combat Sounds
  | 'sword_swing'
  | 'sword_hit'
  | 'sword_miss'
  | 'bow_draw'
  | 'arrow_fire'
  | 'arrow_hit'
  | 'shield_block'
  | 'armor_hit'
  | 'critical_hit'
  | 'miss'
  | 'damage_taken'
  | 'death'
  // Magic Sounds
  | 'spell_cast'
  | 'spell_fire'
  | 'spell_ice'
  | 'spell_lightning'
  | 'spell_heal'
  | 'spell_buff'
  | 'spell_debuff'
  | 'magic_impact'
  | 'portal'
  | 'teleport'
  // Character Sounds
  | 'footstep_stone'
  | 'footstep_grass'
  | 'footstep_wood'
  | 'footstep_water'
  | 'jump'
  | 'land'
  | 'level_up'
  | 'item_pickup'
  | 'gold_coins'
  | 'potion_drink'
  | 'equipment_equip'
  | 'door_open'
  | 'door_close'
  | 'chest_open'
  // Dice Sounds
  | 'dice_roll'
  | 'dice_pickup'
  | 'dice_drop'
  | 'dice_success'
  | 'dice_fail'
  | 'dice_critical'
  // Creature Sounds
  | 'monster_growl'
  | 'monster_roar'
  | 'dragon_roar'
  | 'goblin_laugh'
  | 'skeleton_rattle'
  | 'ghost_moan';

interface AmbienceTrack {
  id: string;
  type: AmbienceType;
  url: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

interface SFXSound {
  id: string;
  type: SFXType;
  urls: string[]; // Multiple variations
  volume: number;
  pitchVariation?: number; // Random pitch variation
  maxConcurrent?: number;
}

// ============================================================================
// DEFAULT SOUND LIBRARIES (placeholder URLs)
// ============================================================================

const DEFAULT_AMBIENCE_LIBRARY: Record<AmbienceType, AmbienceTrack> = {
  forest: {
    id: 'forest-ambience',
    type: 'forest',
    url: '/audio/ambience/forest.mp3',
    volume: 0.4,
    fadeIn: 3000,
    fadeOut: 3000,
  },
  dungeon: {
    id: 'dungeon-ambience',
    type: 'dungeon',
    url: '/audio/ambience/dungeon.mp3',
    volume: 0.35,
    fadeIn: 3000,
    fadeOut: 3000,
  },
  cave: {
    id: 'cave-ambience',
    type: 'cave',
    url: '/audio/ambience/cave.mp3',
    volume: 0.3,
    fadeIn: 2500,
    fadeOut: 2500,
  },
  tavern: {
    id: 'tavern-ambience',
    type: 'tavern',
    url: '/audio/ambience/tavern.mp3',
    volume: 0.45,
    fadeIn: 2000,
    fadeOut: 2000,
  },
  castle: {
    id: 'castle-ambience',
    type: 'castle',
    url: '/audio/ambience/castle.mp3',
    volume: 0.3,
    fadeIn: 3000,
    fadeOut: 3000,
  },
  village: {
    id: 'village-ambience',
    type: 'village',
    url: '/audio/ambience/village.mp3',
    volume: 0.4,
    fadeIn: 2500,
    fadeOut: 2500,
  },
  city: {
    id: 'city-ambience',
    type: 'city',
    url: '/audio/ambience/city.mp3',
    volume: 0.45,
    fadeIn: 2000,
    fadeOut: 2000,
  },
  ocean: {
    id: 'ocean-ambience',
    type: 'ocean',
    url: '/audio/ambience/ocean.mp3',
    volume: 0.5,
    fadeIn: 3000,
    fadeOut: 3000,
  },
  swamp: {
    id: 'swamp-ambience',
    type: 'swamp',
    url: '/audio/ambience/swamp.mp3',
    volume: 0.4,
    fadeIn: 3000,
    fadeOut: 3000,
  },
  mountain: {
    id: 'mountain-ambience',
    type: 'mountain',
    url: '/audio/ambience/mountain.mp3',
    volume: 0.35,
    fadeIn: 4000,
    fadeOut: 4000,
  },
  desert: {
    id: 'desert-ambience',
    type: 'desert',
    url: '/audio/ambience/desert.mp3',
    volume: 0.3,
    fadeIn: 3000,
    fadeOut: 3000,
  },
  temple: {
    id: 'temple-ambience',
    type: 'temple',
    url: '/audio/ambience/temple.mp3',
    volume: 0.3,
    fadeIn: 4000,
    fadeOut: 4000,
  },
  battlefield: {
    id: 'battlefield-ambience',
    type: 'battlefield',
    url: '/audio/ambience/battlefield.mp3',
    volume: 0.5,
    fadeIn: 1500,
    fadeOut: 2000,
  },
  crypt: {
    id: 'crypt-ambience',
    type: 'crypt',
    url: '/audio/ambience/crypt.mp3',
    volume: 0.35,
    fadeIn: 3000,
    fadeOut: 3000,
  },
  storm: {
    id: 'storm-ambience',
    type: 'storm',
    url: '/audio/ambience/storm.mp3',
    volume: 0.6,
    fadeIn: 2000,
    fadeOut: 4000,
  },
  rain: {
    id: 'rain-ambience',
    type: 'rain',
    url: '/audio/ambience/rain.mp3',
    volume: 0.45,
    fadeIn: 2500,
    fadeOut: 3000,
  },
  wind: {
    id: 'wind-ambience',
    type: 'wind',
    url: '/audio/ambience/wind.mp3',
    volume: 0.35,
    fadeIn: 3000,
    fadeOut: 3000,
  },
  fire: {
    id: 'fire-ambience',
    type: 'fire',
    url: '/audio/ambience/fire.mp3',
    volume: 0.4,
    fadeIn: 2000,
    fadeOut: 2000,
  },
  water: {
    id: 'water-ambience',
    type: 'water',
    url: '/audio/ambience/water.mp3',
    volume: 0.35,
    fadeIn: 2500,
    fadeOut: 2500,
  },
  none: {
    id: 'none',
    type: 'none',
    url: '',
    volume: 0,
    fadeIn: 0,
    fadeOut: 1000,
  },
};

const DEFAULT_SFX_LIBRARY: Record<SFXType, SFXSound> = {
  // UI Sounds
  button_click: {
    id: 'button-click',
    type: 'button_click',
    urls: ['/audio/sfx/ui/button-click.mp3'],
    volume: 0.5,
  },
  button_hover: {
    id: 'button-hover',
    type: 'button_hover',
    urls: ['/audio/sfx/ui/button-hover.mp3'],
    volume: 0.3,
  },
  menu_open: {
    id: 'menu-open',
    type: 'menu_open',
    urls: ['/audio/sfx/ui/menu-open.mp3'],
    volume: 0.4,
  },
  menu_close: {
    id: 'menu-close',
    type: 'menu_close',
    urls: ['/audio/sfx/ui/menu-close.mp3'],
    volume: 0.4,
  },
  notification: {
    id: 'notification',
    type: 'notification',
    urls: ['/audio/sfx/ui/notification.mp3'],
    volume: 0.5,
  },
  error: {
    id: 'error',
    type: 'error',
    urls: ['/audio/sfx/ui/error.mp3'],
    volume: 0.5,
  },
  success: {
    id: 'success',
    type: 'success',
    urls: ['/audio/sfx/ui/success.mp3'],
    volume: 0.5,
  },

  // Combat Sounds
  sword_swing: {
    id: 'sword-swing',
    type: 'sword_swing',
    urls: ['/audio/sfx/combat/sword-swing-1.mp3', '/audio/sfx/combat/sword-swing-2.mp3'],
    volume: 0.6,
    pitchVariation: 0.1,
  },
  sword_hit: {
    id: 'sword-hit',
    type: 'sword_hit',
    urls: ['/audio/sfx/combat/sword-hit-1.mp3', '/audio/sfx/combat/sword-hit-2.mp3'],
    volume: 0.7,
    pitchVariation: 0.1,
  },
  sword_miss: {
    id: 'sword-miss',
    type: 'sword_miss',
    urls: ['/audio/sfx/combat/sword-miss.mp3'],
    volume: 0.5,
    pitchVariation: 0.15,
  },
  bow_draw: {
    id: 'bow-draw',
    type: 'bow_draw',
    urls: ['/audio/sfx/combat/bow-draw.mp3'],
    volume: 0.5,
  },
  arrow_fire: {
    id: 'arrow-fire',
    type: 'arrow_fire',
    urls: ['/audio/sfx/combat/arrow-fire.mp3'],
    volume: 0.6,
    pitchVariation: 0.05,
  },
  arrow_hit: {
    id: 'arrow-hit',
    type: 'arrow_hit',
    urls: ['/audio/sfx/combat/arrow-hit.mp3'],
    volume: 0.6,
  },
  shield_block: {
    id: 'shield-block',
    type: 'shield_block',
    urls: ['/audio/sfx/combat/shield-block.mp3'],
    volume: 0.7,
    pitchVariation: 0.1,
  },
  armor_hit: {
    id: 'armor-hit',
    type: 'armor_hit',
    urls: ['/audio/sfx/combat/armor-hit.mp3'],
    volume: 0.6,
    pitchVariation: 0.1,
  },
  critical_hit: {
    id: 'critical-hit',
    type: 'critical_hit',
    urls: ['/audio/sfx/combat/critical-hit.mp3'],
    volume: 0.8,
  },
  miss: {
    id: 'miss',
    type: 'miss',
    urls: ['/audio/sfx/combat/miss.mp3'],
    volume: 0.4,
  },
  damage_taken: {
    id: 'damage-taken',
    type: 'damage_taken',
    urls: ['/audio/sfx/combat/damage-taken-1.mp3', '/audio/sfx/combat/damage-taken-2.mp3'],
    volume: 0.6,
    pitchVariation: 0.1,
  },
  death: {
    id: 'death',
    type: 'death',
    urls: ['/audio/sfx/combat/death.mp3'],
    volume: 0.7,
  },

  // Magic Sounds
  spell_cast: {
    id: 'spell-cast',
    type: 'spell_cast',
    urls: ['/audio/sfx/magic/spell-cast.mp3'],
    volume: 0.6,
  },
  spell_fire: {
    id: 'spell-fire',
    type: 'spell_fire',
    urls: ['/audio/sfx/magic/spell-fire.mp3'],
    volume: 0.7,
  },
  spell_ice: {
    id: 'spell-ice',
    type: 'spell_ice',
    urls: ['/audio/sfx/magic/spell-ice.mp3'],
    volume: 0.6,
  },
  spell_lightning: {
    id: 'spell-lightning',
    type: 'spell_lightning',
    urls: ['/audio/sfx/magic/spell-lightning.mp3'],
    volume: 0.75,
  },
  spell_heal: {
    id: 'spell-heal',
    type: 'spell_heal',
    urls: ['/audio/sfx/magic/spell-heal.mp3'],
    volume: 0.6,
  },
  spell_buff: {
    id: 'spell-buff',
    type: 'spell_buff',
    urls: ['/audio/sfx/magic/spell-buff.mp3'],
    volume: 0.5,
  },
  spell_debuff: {
    id: 'spell-debuff',
    type: 'spell_debuff',
    urls: ['/audio/sfx/magic/spell-debuff.mp3'],
    volume: 0.5,
  },
  magic_impact: {
    id: 'magic-impact',
    type: 'magic_impact',
    urls: ['/audio/sfx/magic/magic-impact.mp3'],
    volume: 0.7,
  },
  portal: {
    id: 'portal',
    type: 'portal',
    urls: ['/audio/sfx/magic/portal.mp3'],
    volume: 0.6,
  },
  teleport: {
    id: 'teleport',
    type: 'teleport',
    urls: ['/audio/sfx/magic/teleport.mp3'],
    volume: 0.6,
  },

  // Character Sounds
  footstep_stone: {
    id: 'footstep-stone',
    type: 'footstep_stone',
    urls: ['/audio/sfx/character/footstep-stone-1.mp3', '/audio/sfx/character/footstep-stone-2.mp3'],
    volume: 0.3,
    pitchVariation: 0.15,
    maxConcurrent: 2,
  },
  footstep_grass: {
    id: 'footstep-grass',
    type: 'footstep_grass',
    urls: ['/audio/sfx/character/footstep-grass-1.mp3', '/audio/sfx/character/footstep-grass-2.mp3'],
    volume: 0.25,
    pitchVariation: 0.15,
    maxConcurrent: 2,
  },
  footstep_wood: {
    id: 'footstep-wood',
    type: 'footstep_wood',
    urls: ['/audio/sfx/character/footstep-wood-1.mp3', '/audio/sfx/character/footstep-wood-2.mp3'],
    volume: 0.35,
    pitchVariation: 0.15,
    maxConcurrent: 2,
  },
  footstep_water: {
    id: 'footstep-water',
    type: 'footstep_water',
    urls: ['/audio/sfx/character/footstep-water-1.mp3', '/audio/sfx/character/footstep-water-2.mp3'],
    volume: 0.4,
    pitchVariation: 0.1,
    maxConcurrent: 2,
  },
  jump: {
    id: 'jump',
    type: 'jump',
    urls: ['/audio/sfx/character/jump.mp3'],
    volume: 0.4,
  },
  land: {
    id: 'land',
    type: 'land',
    urls: ['/audio/sfx/character/land.mp3'],
    volume: 0.5,
  },
  level_up: {
    id: 'level-up',
    type: 'level_up',
    urls: ['/audio/sfx/character/level-up.mp3'],
    volume: 0.7,
  },
  item_pickup: {
    id: 'item-pickup',
    type: 'item_pickup',
    urls: ['/audio/sfx/character/item-pickup.mp3'],
    volume: 0.5,
  },
  gold_coins: {
    id: 'gold-coins',
    type: 'gold_coins',
    urls: ['/audio/sfx/character/gold-coins.mp3'],
    volume: 0.5,
  },
  potion_drink: {
    id: 'potion-drink',
    type: 'potion_drink',
    urls: ['/audio/sfx/character/potion-drink.mp3'],
    volume: 0.5,
  },
  equipment_equip: {
    id: 'equipment-equip',
    type: 'equipment_equip',
    urls: ['/audio/sfx/character/equipment-equip.mp3'],
    volume: 0.5,
  },
  door_open: {
    id: 'door-open',
    type: 'door_open',
    urls: ['/audio/sfx/character/door-open.mp3'],
    volume: 0.5,
  },
  door_close: {
    id: 'door-close',
    type: 'door_close',
    urls: ['/audio/sfx/character/door-close.mp3'],
    volume: 0.5,
  },
  chest_open: {
    id: 'chest-open',
    type: 'chest_open',
    urls: ['/audio/sfx/character/chest-open.mp3'],
    volume: 0.6,
  },

  // Dice Sounds
  dice_roll: {
    id: 'dice-roll',
    type: 'dice_roll',
    urls: ['/audio/sfx/dice/dice-roll-1.mp3', '/audio/sfx/dice/dice-roll-2.mp3', '/audio/sfx/dice/dice-roll-3.mp3'],
    volume: 0.6,
    pitchVariation: 0.05,
  },
  dice_pickup: {
    id: 'dice-pickup',
    type: 'dice_pickup',
    urls: ['/audio/sfx/dice/dice-pickup.mp3'],
    volume: 0.4,
  },
  dice_drop: {
    id: 'dice-drop',
    type: 'dice_drop',
    urls: ['/audio/sfx/dice/dice-drop.mp3'],
    volume: 0.5,
  },
  dice_success: {
    id: 'dice-success',
    type: 'dice_success',
    urls: ['/audio/sfx/dice/dice-success.mp3'],
    volume: 0.6,
  },
  dice_fail: {
    id: 'dice-fail',
    type: 'dice_fail',
    urls: ['/audio/sfx/dice/dice-fail.mp3'],
    volume: 0.5,
  },
  dice_critical: {
    id: 'dice-critical',
    type: 'dice_critical',
    urls: ['/audio/sfx/dice/dice-critical.mp3'],
    volume: 0.8,
  },

  // Creature Sounds
  monster_growl: {
    id: 'monster-growl',
    type: 'monster_growl',
    urls: ['/audio/sfx/creatures/monster-growl.mp3'],
    volume: 0.6,
    pitchVariation: 0.2,
  },
  monster_roar: {
    id: 'monster-roar',
    type: 'monster_roar',
    urls: ['/audio/sfx/creatures/monster-roar.mp3'],
    volume: 0.7,
  },
  dragon_roar: {
    id: 'dragon-roar',
    type: 'dragon_roar',
    urls: ['/audio/sfx/creatures/dragon-roar.mp3'],
    volume: 0.8,
  },
  goblin_laugh: {
    id: 'goblin-laugh',
    type: 'goblin_laugh',
    urls: ['/audio/sfx/creatures/goblin-laugh.mp3'],
    volume: 0.5,
  },
  skeleton_rattle: {
    id: 'skeleton-rattle',
    type: 'skeleton_rattle',
    urls: ['/audio/sfx/creatures/skeleton-rattle.mp3'],
    volume: 0.5,
    pitchVariation: 0.1,
  },
  ghost_moan: {
    id: 'ghost-moan',
    type: 'ghost_moan',
    urls: ['/audio/sfx/creatures/ghost-moan.mp3'],
    volume: 0.5,
  },
};

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface AmbienceState {
  currentAmbience: AmbienceType;
  secondaryAmbience: AmbienceType | null;
  volume: number;
  isMuted: boolean;
}

interface AmbienceContextType extends AmbienceState {
  setAmbience: (type: AmbienceType, transitionTime?: number) => void;
  setSecondaryAmbience: (type: AmbienceType | null, volume?: number) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
}

interface SFXContextType {
  volume: number;
  isMuted: boolean;
  playSFX: (type: SFXType, options?: { volume?: number; pan?: number }) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  preload: (types: SFXType[]) => void;
}

// ============================================================================
// CONTEXTS
// ============================================================================

const AmbienceContext = createContext<AmbienceContextType | null>(null);
const SFXContext = createContext<SFXContextType | null>(null);

// ============================================================================
// AMBIENCE PROVIDER
// ============================================================================

interface AmbienceProviderProps {
  children: React.ReactNode;
  initialAmbience?: AmbienceType;
  initialVolume?: number;
  ambienceLibrary?: Record<AmbienceType, AmbienceTrack>;
}

export const AmbienceProvider: React.FC<AmbienceProviderProps> = ({
  children,
  initialAmbience = 'none',
  initialVolume = 0.5,
  ambienceLibrary = DEFAULT_AMBIENCE_LIBRARY,
}) => {
  const [state, setState] = useState<AmbienceState>({
    currentAmbience: initialAmbience,
    secondaryAmbience: null,
    volume: initialVolume,
    isMuted: false,
  });

  const primaryHowlRef = useRef<Howl | null>(null);
  const secondaryHowlRef = useRef<Howl | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      primaryHowlRef.current?.unload();
      secondaryHowlRef.current?.unload();
    };
  }, []);

  const setAmbience = useCallback((type: AmbienceType, transitionTime: number = 3000) => {
    if (type === state.currentAmbience) return;

    const track = ambienceLibrary[type];

    // Fade out current ambience
    if (primaryHowlRef.current) {
      const current = primaryHowlRef.current;
      current.fade(current.volume(), 0, transitionTime);
      setTimeout(() => {
        current.stop();
        current.unload();
      }, transitionTime);
    }

    // Load and play new ambience
    if (type !== 'none' && track.url) {
      const howl = new Howl({
        src: [track.url],
        loop: true,
        volume: 0,
        onload: () => {
          howl.play();
          howl.fade(0, state.isMuted ? 0 : track.volume * state.volume, track.fadeIn);
        },
        onloaderror: (_id: number, error: unknown) => {
          console.warn(`Failed to load ambience ${type}:`, error);
        },
      });
      primaryHowlRef.current = howl;
    } else {
      primaryHowlRef.current = null;
    }

    setState(prev => ({ ...prev, currentAmbience: type }));
  }, [state.currentAmbience, state.volume, state.isMuted, ambienceLibrary]);

  const setSecondaryAmbience = useCallback((type: AmbienceType | null, volume: number = 0.3) => {
    // Fade out current secondary ambience
    if (secondaryHowlRef.current) {
      const current = secondaryHowlRef.current;
      current.fade(current.volume(), 0, 2000);
      setTimeout(() => {
        current.stop();
        current.unload();
      }, 2000);
    }

    if (type && type !== 'none') {
      const track = ambienceLibrary[type];
      const howl = new Howl({
        src: [track.url],
        loop: true,
        volume: 0,
        onload: () => {
          howl.play();
          howl.fade(0, state.isMuted ? 0 : volume * state.volume, track.fadeIn);
        },
      });
      secondaryHowlRef.current = howl;
    } else {
      secondaryHowlRef.current = null;
    }

    setState(prev => ({ ...prev, secondaryAmbience: type }));
  }, [state.volume, state.isMuted, ambienceLibrary]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState(prev => ({ ...prev, volume: clampedVolume }));

    // Update Howl volumes
    if (primaryHowlRef.current && !state.isMuted) {
      const track = ambienceLibrary[state.currentAmbience];
      primaryHowlRef.current.volume(track.volume * clampedVolume);
    }
    if (secondaryHowlRef.current && !state.isMuted) {
      secondaryHowlRef.current.volume(0.3 * clampedVolume);
    }
  }, [state.currentAmbience, state.isMuted, ambienceLibrary]);

  const mute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: true }));
    primaryHowlRef.current?.volume(0);
    secondaryHowlRef.current?.volume(0);
  }, []);

  const unmute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: false }));
    if (primaryHowlRef.current) {
      const track = ambienceLibrary[state.currentAmbience];
      primaryHowlRef.current.volume(track.volume * state.volume);
    }
    if (secondaryHowlRef.current) {
      secondaryHowlRef.current.volume(0.3 * state.volume);
    }
  }, [state.currentAmbience, state.volume, ambienceLibrary]);

  const contextValue: AmbienceContextType = {
    ...state,
    setAmbience,
    setSecondaryAmbience,
    setVolume,
    mute,
    unmute,
  };

  return (
    <AmbienceContext.Provider value={contextValue}>
      {children}
    </AmbienceContext.Provider>
  );
};

// ============================================================================
// SFX PROVIDER
// ============================================================================

interface SFXProviderProps {
  children: React.ReactNode;
  initialVolume?: number;
  sfxLibrary?: Record<SFXType, SFXSound>;
}

export const SFXProvider: React.FC<SFXProviderProps> = ({
  children,
  initialVolume = 0.7,
  sfxLibrary = DEFAULT_SFX_LIBRARY,
}) => {
  const [state, setState] = useState({
    volume: initialVolume,
    isMuted: false,
  });

  // Cache preloaded sounds
  const soundCacheRef = useRef<Map<string, Howl>>(new Map());
  const playingCountRef = useRef<Map<string, number>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundCacheRef.current.forEach((howl) => howl.unload());
    };
  }, []);

  const playSFX = useCallback((type: SFXType, options?: { volume?: number; pan?: number }) => {
    if (state.isMuted) return;

    const sound = sfxLibrary[type];
    if (!sound) {
      console.warn(`Unknown SFX type: ${type}`);
      return;
    }

    // Check concurrent limit
    const currentCount = playingCountRef.current.get(sound.id) || 0;
    if (sound.maxConcurrent && currentCount >= sound.maxConcurrent) {
      return;
    }

    // Pick a random variation
    const url = sound.urls[Math.floor(Math.random() * sound.urls.length)];

    // Calculate volume with options
    const baseVolume = (options?.volume ?? 1) * sound.volume * state.volume;

    // Calculate pitch variation
    const pitchVariation = sound.pitchVariation || 0;
    const rate = 1 + (Math.random() - 0.5) * 2 * pitchVariation;

    // Check cache first
    const cacheKey = `${sound.id}-${url}`;
    let howl = soundCacheRef.current.get(cacheKey);

    if (howl) {
      // Play from cache
      const soundId = howl.play();
      howl.volume(baseVolume, soundId);
      howl.rate(rate, soundId);
      if (options?.pan !== undefined) {
        howl.stereo(options.pan, soundId);
      }
    } else {
      // Create new sound
      howl = new Howl({
        src: [url],
        volume: baseVolume,
        rate,
        onplay: () => {
          playingCountRef.current.set(sound.id, (playingCountRef.current.get(sound.id) || 0) + 1);
        },
        onend: () => {
          const count = playingCountRef.current.get(sound.id) || 0;
          playingCountRef.current.set(sound.id, Math.max(0, count - 1));
        },
        onloaderror: (_id: number, error: unknown) => {
          console.warn(`Failed to load SFX ${type}:`, error);
        },
      });

      // Cache it
      soundCacheRef.current.set(cacheKey, howl);

      const soundId = howl.play();
      if (options?.pan !== undefined) {
        howl.stereo(options.pan, soundId);
      }
    }
  }, [state.isMuted, state.volume, sfxLibrary]);

  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const mute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: true }));
  }, []);

  const unmute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: false }));
  }, []);

  const preload = useCallback((types: SFXType[]) => {
    types.forEach((type) => {
      const sound = sfxLibrary[type];
      if (!sound) return;

      sound.urls.forEach((url) => {
        const cacheKey = `${sound.id}-${url}`;
        if (!soundCacheRef.current.has(cacheKey)) {
          const howl = new Howl({
            src: [url],
            preload: true,
          });
          soundCacheRef.current.set(cacheKey, howl);
        }
      });
    });
  }, [sfxLibrary]);

  const contextValue: SFXContextType = {
    ...state,
    playSFX,
    setVolume,
    mute,
    unmute,
    preload,
  };

  return (
    <SFXContext.Provider value={contextValue}>
      {children}
    </SFXContext.Provider>
  );
};

// ============================================================================
// COMBINED PROVIDER
// ============================================================================

interface AmbienceSFXSystemProps {
  children: React.ReactNode;
  initialAmbience?: AmbienceType;
  ambienceVolume?: number;
  sfxVolume?: number;
}

export const AmbienceSFXSystem: React.FC<AmbienceSFXSystemProps> = ({
  children,
  initialAmbience = 'none',
  ambienceVolume = 0.5,
  sfxVolume = 0.7,
}) => {
  return (
    <AmbienceProvider initialAmbience={initialAmbience} initialVolume={ambienceVolume}>
      <SFXProvider initialVolume={sfxVolume}>
        {children}
      </SFXProvider>
    </AmbienceProvider>
  );
};

// ============================================================================
// HOOKS
// ============================================================================

export const useAmbience = (): AmbienceContextType => {
  const context = useContext(AmbienceContext);
  if (!context) {
    throw new Error('useAmbience must be used within an AmbienceProvider');
  }
  return context;
};

export const useSFX = (): SFXContextType => {
  const context = useContext(SFXContext);
  if (!context) {
    throw new Error('useSFX must be used within an SFXProvider');
  }
  return context;
};

// ============================================================================
// AUDIO SETTINGS COMPONENT
// ============================================================================

interface AudioSettingsProps {
  className?: string;
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({ className = '' }) => {
  const ambience = useAmbience();
  const sfx = useSFX();

  const ambienceTypes: AmbienceType[] = [
    'none', 'forest', 'dungeon', 'cave', 'tavern', 'castle',
    'village', 'city', 'ocean', 'swamp', 'mountain', 'desert',
    'temple', 'battlefield', 'crypt', 'storm', 'rain', 'wind', 'fire', 'water'
  ];

  return (
    <div className={`p-4 bg-gray-900/80 rounded-lg space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-amber-400">Audio Settings</h3>

      {/* Global Mute */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (ambience.isMuted) {
              ambience.unmute();
              sfx.unmute();
            } else {
              ambience.mute();
              sfx.mute();
            }
          }}
          className={`px-4 py-2 rounded ${
            ambience.isMuted
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          } text-white transition-colors`}
        >
          {ambience.isMuted ? '🔇 Unmute All' : '🔊 Mute All'}
        </button>
      </div>

      {/* Ambience Volume */}
      <div>
        <label className="text-sm text-gray-400 block mb-1">Ambience Volume</label>
        <input
          type="range"
          min="0"
          max="100"
          value={ambience.volume * 100}
          onChange={(e) => ambience.setVolume(Number(e.target.value) / 100)}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </div>

      {/* SFX Volume */}
      <div>
        <label className="text-sm text-gray-400 block mb-1">SFX Volume</label>
        <input
          type="range"
          min="0"
          max="100"
          value={sfx.volume * 100}
          onChange={(e) => sfx.setVolume(Number(e.target.value) / 100)}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      </div>

      {/* Ambience Selector */}
      <div>
        <label className="text-sm text-gray-400 block mb-1">Ambience</label>
        <select
          value={ambience.currentAmbience}
          onChange={(e) => ambience.setAmbience(e.target.value as AmbienceType)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
        >
          {ambienceTypes.map((type) => (
            <option key={type} value={type} className="capitalize">
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Test SFX */}
      <div>
        <label className="text-sm text-gray-400 block mb-1">Test SFX</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => sfx.playSFX('button_click')}
            className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
          >
            Click
          </button>
          <button
            onClick={() => sfx.playSFX('sword_swing')}
            className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
          >
            Sword
          </button>
          <button
            onClick={() => sfx.playSFX('spell_fire')}
            className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
          >
            Fire
          </button>
          <button
            onClick={() => sfx.playSFX('dice_roll')}
            className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
          >
            Dice
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmbienceSFXSystem;
