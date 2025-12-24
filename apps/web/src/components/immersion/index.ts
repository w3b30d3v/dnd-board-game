// Player Immersion Components for D&D Board Game

// Dynamic Scene Generator
export {
  DynamicScene,
  type SettingType,
  type TimeOfDay,
  type WeatherType,
  type MoodType,
  type ParsedScene,
  type ParallaxLayer
} from './DynamicScene';

// VFX Effects Library
export {
  VFXManager,
  useVFX,
  type EffectType,
  type VFXConfig
} from './VFXEffects';

// Celebration Sequences
export {
  CelebrationSequence,
  CelebrationManager,
  useCelebration,
  CriticalHitCelebration,
  VictorySequence,
  DefeatSequence,
  LevelUpSequence,
  type CelebrationType
} from './CelebrationSequences';

// Dynamic Music Manager
export {
  DynamicMusicManager,
  useDynamicMusic,
  MusicControls,
  type MusicMood,
  type MusicLayer
} from './DynamicMusicManager';

// Ambience & SFX System
export {
  AmbienceSFXSystem,
  AmbienceProvider,
  SFXProvider,
  useAmbience,
  useSFX,
  AudioSettings,
  type AmbienceType,
  type SFXType
} from './AmbienceSFXSystem';
