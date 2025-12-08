'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hook to access auth state and actions
 */
export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (!store.isInitialized) {
      store.initialize();
    }
  }, [store]);

  return {
    user: store.user,
    isAuthenticated: !!store.user,
    isLoading: store.isLoading,
    error: store.error,
    login: store.login,
    register: store.register,
    logout: store.logout,
    clearError: store.clearError,
  };
}

/**
 * Hook for protected routes - redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter();
  const store = useAuthStore();
  const { user, isInitialized, _hasHydrated } = store;

  // Initialize the store after hydration
  useEffect(() => {
    if (_hasHydrated && !isInitialized) {
      store.initialize();
    }
  }, [_hasHydrated, isInitialized, store]);

  // Redirect if not authenticated (after initialization)
  useEffect(() => {
    if (isInitialized && !user) {
      router.push(redirectTo);
    }
  }, [user, isInitialized, router, redirectTo]);

  return { user, isLoading: !isInitialized };
}

/**
 * Hook for guest-only routes - redirects to dashboard if authenticated
 */
export function useGuestOnly(redirectTo = '/dashboard') {
  const router = useRouter();
  const store = useAuthStore();
  const { user, isInitialized, _hasHydrated } = store;

  // Initialize the store after hydration
  useEffect(() => {
    if (_hasHydrated && !isInitialized) {
      store.initialize();
    }
  }, [_hasHydrated, isInitialized, store]);

  // Redirect if authenticated (after initialization)
  useEffect(() => {
    if (isInitialized && user) {
      router.push(redirectTo);
    }
  }, [user, isInitialized, router, redirectTo]);

  return { isLoading: !isInitialized };
}
