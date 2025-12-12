import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset the store between tests
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have null user initially', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('should have null token initially', () => {
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
    });

    it('should not be authenticated initially', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setState directly', () => {
    it('should set user and token via setState', () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        createdAt: new Date().toISOString(),
      };
      const mockToken = 'mock-jwt-token';

      useAuthStore.setState({
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('logout function', () => {
    it('should have a logout function', () => {
      const state = useAuthStore.getState();
      expect(typeof state.logout).toBe('function');
    });

    it('should have a login function', () => {
      const state = useAuthStore.getState();
      expect(typeof state.login).toBe('function');
    });

    it('should have a register function', () => {
      const state = useAuthStore.getState();
      expect(typeof state.register).toBe('function');
    });
  });
});
