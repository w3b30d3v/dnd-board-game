'use client';

import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  _hasHydrated: boolean;

  // Actions
  register: (
    email: string,
    username: string,
    password: string,
    displayName?: string
  ) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  clearError: () => void;
  initialize: () => void;
  setHasHydrated: (state: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
}

type AuthPersist = (
  config: StateCreator<AuthState>,
  options: PersistOptions<AuthState, Pick<AuthState, 'user' | 'token' | 'refreshToken'>>
) => StateCreator<AuthState>;

export const useAuthStore = create<AuthState>()(
  (persist as AuthPersist)(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      register: async (email, username, password, displayName) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<AuthResponse>('/auth/register', {
            email,
            username,
            password,
            displayName,
          });

          api.setAccessToken(response.token);
          api.setRefreshToken(response.refreshToken);

          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isLoading: false,
          });

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<AuthResponse>('/auth/login', {
            email,
            password,
          });

          api.setAccessToken(response.token);
          api.setRefreshToken(response.refreshToken);

          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isLoading: false,
          });

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await api.post('/auth/logout', { refreshToken });
          }
        } catch {
          // Ignore logout errors
        }

        api.setAccessToken(null);
        api.setRefreshToken(null);
        set({
          user: null,
          token: null,
          refreshToken: null,
          error: null,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const response = await api.post<{ token: string }>('/auth/refresh', {
            refreshToken,
          });

          api.setAccessToken(response.token);
          set({ token: response.token });

          return true;
        } catch {
          // Refresh failed, logout
          await get().logout();
          return false;
        }
      },

      clearError: () => set({ error: null }),

      initialize: () => {
        const { token, refreshToken } = get();
        if (token) {
          api.setAccessToken(token);
        }
        if (refreshToken) {
          api.setRefreshToken(refreshToken);
        }
        set({ isInitialized: true });
      },

      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
    }),
    {
      name: 'auth-storage',
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
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Initialize API client with tokens after rehydration
        if (state?.token) {
          api.setAccessToken(state.token);
        }
        if (state?.refreshToken) {
          api.setRefreshToken(state.refreshToken);
        }
      },
    }
  )
);
