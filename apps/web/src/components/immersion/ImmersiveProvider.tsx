'use client';

import { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { DynamicMusicManager, useDynamicMusic, MusicMood } from './DynamicMusicManager';
import { AmbienceSFXSystem, useAmbience, useSFX, AmbienceType, SFXType } from './AmbienceSFXSystem';
import { VFXManager, useVFX } from './VFXEffects';

// Game state types
export type GamePhase = 'exploration' | 'combat' | 'social' | 'rest' | 'cutscene' | 'menu';
export type CombatIntensity = 'low' | 'medium' | 'high' | 'boss';

interface ImmersiveContextValue {
  // Game state
  gamePhase: GamePhase;
  setGamePhase: (phase: GamePhase) => void;
  combatIntensity: CombatIntensity;
  setCombatIntensity: (intensity: CombatIntensity) => void;

  // Quick actions
  playDamage: (amount: number, position: { x: number; y: number }, isCritical?: boolean) => void;
  playHeal: (amount: number, position: { x: number; y: number }) => void;
  playCriticalHit: (position: { x: number; y: number }) => void;
  playSpellCast: (spellType: 'fire' | 'ice' | 'lightning' | 'heal' | 'buff' | 'debuff') => void;
  playMeleeAttack: (hit: boolean, position: { x: number; y: number }) => void;
  playRangedAttack: (hit: boolean, position: { x: number; y: number }) => void;
  playDiceRoll: (result: 'success' | 'fail' | 'critical' | 'fumble') => void;
  playLevelUp: (position: { x: number; y: number }) => void;
  playDeath: (position: { x: number; y: number }) => void;
  playVictory: () => void;

  // Location-based
  enterLocation: (locationType: AmbienceType) => void;

  // Master controls
  masterVolume: number;
  setMasterVolume: (volume: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const ImmersiveContext = createContext<ImmersiveContextValue | null>(null);

// Map game phases to music moods
const phaseMoodMap: Record<GamePhase, MusicMood> = {
  exploration: 'exploration',
  combat: 'combat',
  social: 'tavern',
  rest: 'peaceful',
  cutscene: 'epic',
  menu: 'peaceful',
};

// Map combat intensity to music intensity (0-1)
const intensityMap: Record<CombatIntensity, number> = {
  low: 0.3,
  medium: 0.6,
  high: 0.85,
  boss: 1.0,
};

function ImmersiveController({ children }: { children: ReactNode }) {
  const [gamePhase, setGamePhaseState] = useState<GamePhase>('menu');
  const [combatIntensity, setCombatIntensityState] = useState<CombatIntensity>('low');
  const [masterVolume, setMasterVolumeState] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  const music = useDynamicMusic();
  const ambience = useAmbience();
  const sfx = useSFX();
  const vfx = useVFX();

  // Update music when game phase changes
  const setGamePhase = useCallback((phase: GamePhase) => {
    setGamePhaseState(phase);
    const mood = phaseMoodMap[phase];
    music.setMood(mood);

    // Set appropriate intensity
    if (phase === 'combat') {
      music.setIntensity(intensityMap[combatIntensity]);
    } else if (phase === 'exploration') {
      music.setIntensity(0.4);
    } else {
      music.setIntensity(0.3);
    }
  }, [music, combatIntensity]);

  // Update intensity during combat
  const setCombatIntensity = useCallback((intensity: CombatIntensity) => {
    setCombatIntensityState(intensity);
    if (gamePhase === 'combat') {
      music.setIntensity(intensityMap[intensity]);
      if (intensity === 'boss') {
        music.setMood('boss');
      }
    }
  }, [music, gamePhase]);

  // Play damage with VFX + SFX
  const playDamage = useCallback((amount: number, position: { x: number; y: number }, isCritical = false) => {
    if (isCritical) {
      vfx.playEffect({ type: 'critical_hit', position, value: amount });
      sfx.playSFX('critical_hit');
    } else {
      vfx.playEffect({ type: 'slash', position, value: amount });
      sfx.playSFX('damage_taken');
    }
  }, [vfx, sfx]);

  // Play heal with VFX + SFX
  const playHeal = useCallback((amount: number, position: { x: number; y: number }) => {
    vfx.playEffect({ type: 'healing', position, value: amount });
    sfx.playSFX('spell_heal');
  }, [vfx, sfx]);

  // Critical hit celebration
  const playCriticalHit = useCallback((position: { x: number; y: number }) => {
    vfx.playEffect({ type: 'critical_hit', position });
    sfx.playSFX('critical_hit');
    sfx.playSFX('dice_critical');
  }, [vfx, sfx]);

  // Spell cast with appropriate effects
  const playSpellCast = useCallback((spellType: 'fire' | 'ice' | 'lightning' | 'heal' | 'buff' | 'debuff') => {
    sfx.playSFX('spell_cast');
    const sfxMap: Record<string, SFXType> = {
      fire: 'spell_fire',
      ice: 'spell_ice',
      lightning: 'spell_lightning',
      heal: 'spell_heal',
      buff: 'spell_buff',
      debuff: 'spell_debuff',
    };
    sfx.playSFX(sfxMap[spellType]);
  }, [sfx]);

  // Melee attack
  const playMeleeAttack = useCallback((hit: boolean, position: { x: number; y: number }) => {
    sfx.playSFX('sword_swing');
    if (hit) {
      sfx.playSFX('sword_hit');
      vfx.playEffect({ type: 'slash', position });
    } else {
      sfx.playSFX('miss');
    }
  }, [sfx, vfx]);

  // Ranged attack
  const playRangedAttack = useCallback((hit: boolean, position: { x: number; y: number }) => {
    sfx.playSFX('bow_draw');
    setTimeout(() => sfx.playSFX('arrow_fire'), 200);
    if (hit) {
      setTimeout(() => {
        sfx.playSFX('arrow_hit');
        vfx.playEffect({ type: 'pierce', position });
      }, 400);
    }
  }, [sfx, vfx]);

  // Dice roll results
  const playDiceRoll = useCallback((result: 'success' | 'fail' | 'critical' | 'fumble') => {
    sfx.playSFX('dice_roll');
    setTimeout(() => {
      if (result === 'critical') {
        sfx.playSFX('dice_critical');
      } else if (result === 'success') {
        sfx.playSFX('dice_success');
      } else {
        sfx.playSFX('dice_fail');
      }
    }, 800);
  }, [sfx]);

  // Level up celebration
  const playLevelUp = useCallback((position: { x: number; y: number }) => {
    vfx.playEffect({ type: 'level_up', position });
    sfx.playSFX('level_up');
  }, [vfx, sfx]);

  // Death effect
  const playDeath = useCallback((position: { x: number; y: number }) => {
    vfx.playEffect({ type: 'death', position });
    sfx.playSFX('death');
  }, [vfx, sfx]);

  // Victory celebration
  const playVictory = useCallback(() => {
    vfx.playEffect({ type: 'victory', position: { x: window.innerWidth / 2, y: window.innerHeight / 2 } });
    music.setMood('victory');
  }, [vfx, music]);

  // Enter a new location
  const enterLocation = useCallback((locationType: AmbienceType) => {
    ambience.setAmbience(locationType);
    sfx.playSFX('footstep_stone');
  }, [ambience, sfx]);

  // Volume controls
  const setMasterVolume = useCallback((volume: number) => {
    setMasterVolumeState(volume);
    music.setVolume(volume);
  }, [music]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    music.setVolume(isMuted ? masterVolume : 0);
  }, [isMuted, masterVolume, music]);

  const value: ImmersiveContextValue = {
    gamePhase,
    setGamePhase,
    combatIntensity,
    setCombatIntensity,
    playDamage,
    playHeal,
    playCriticalHit,
    playSpellCast,
    playMeleeAttack,
    playRangedAttack,
    playDiceRoll,
    playLevelUp,
    playDeath,
    playVictory,
    enterLocation,
    masterVolume,
    setMasterVolume,
    isMuted,
    toggleMute,
  };

  return (
    <ImmersiveContext.Provider value={value}>
      {children}
    </ImmersiveContext.Provider>
  );
}

export function ImmersiveProvider({ children }: { children: ReactNode }) {
  return (
    <DynamicMusicManager>
      <AmbienceSFXSystem>
        <ImmersiveController>
          {children}
        </ImmersiveController>
        <VFXManager />
      </AmbienceSFXSystem>
    </DynamicMusicManager>
  );
}

export function useImmersive() {
  const context = useContext(ImmersiveContext);
  if (!context) {
    throw new Error('useImmersive must be used within an ImmersiveProvider');
  }
  return context;
}

export default ImmersiveProvider;
