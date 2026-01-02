'use client';

import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';

export type DiceAnimationFrequency = 'always' | 'combat-only' | 'important-only' | 'never';

export interface UserPreferences {
  // Theme
  theme: 'dark' | 'light' | 'system';

  // Audio
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;

  // Notifications
  notificationsEnabled: boolean;

  // Animations
  animationsReduced: boolean;

  // Dice Animations
  diceAnimationFrequency: DiceAnimationFrequency;
  diceAnimationSpeed: 'slow' | 'normal' | 'fast';
  diceCelebrationEnabled: boolean; // Critical hit / fumble celebrations
}

interface PreferencesState {
  preferences: UserPreferences;
  _hasHydrated: boolean;

  // Actions
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  setPreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  setHasHydrated: (state: boolean) => void;

  // Dice-specific helpers
  shouldShowDiceAnimation: (context: 'combat' | 'exploration' | 'important') => boolean;
  getDiceAnimationDuration: () => number;
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 70,
  musicVolume: 50,
  notificationsEnabled: true,
  animationsReduced: false,
  diceAnimationFrequency: 'always',
  diceAnimationSpeed: 'normal',
  diceCelebrationEnabled: true,
};

type PreferencesPersist = (
  config: StateCreator<PreferencesState>,
  options: PersistOptions<PreferencesState, Pick<PreferencesState, 'preferences'>>
) => StateCreator<PreferencesState>;

export const usePreferencesStore = create<PreferencesState>()(
  (persist as PreferencesPersist)(
    (set, get) => ({
      preferences: { ...defaultPreferences },
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      setPreference: (key, value) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [key]: value,
          },
        }));
      },

      setPreferences: (updates) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...updates,
          },
        }));
      },

      resetPreferences: () => {
        set({ preferences: { ...defaultPreferences } });
      },

      shouldShowDiceAnimation: (context) => {
        const { preferences } = get();

        // If animations are reduced globally, skip dice animations
        if (preferences.animationsReduced) {
          return false;
        }

        switch (preferences.diceAnimationFrequency) {
          case 'always':
            return true;
          case 'combat-only':
            return context === 'combat' || context === 'important';
          case 'important-only':
            return context === 'important';
          case 'never':
            return false;
          default:
            return true;
        }
      },

      getDiceAnimationDuration: () => {
        const { preferences } = get();

        switch (preferences.diceAnimationSpeed) {
          case 'slow':
            return 2500;
          case 'normal':
            return 1500;
          case 'fast':
            return 800;
          default:
            return 1500;
        }
      },
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => {
        // Return a no-op storage during SSR
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        preferences: state.preferences,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Hook for easy dice animation check
export function useShouldAnimateDice(context: 'combat' | 'exploration' | 'important' = 'exploration') {
  const shouldShowDiceAnimation = usePreferencesStore((state) => state.shouldShowDiceAnimation);
  const _hasHydrated = usePreferencesStore((state) => state._hasHydrated);

  // Default to showing animation if not hydrated yet
  if (!_hasHydrated) return true;

  return shouldShowDiceAnimation(context);
}
