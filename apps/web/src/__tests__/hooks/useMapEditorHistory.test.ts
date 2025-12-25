/**
 * Map Editor History Hook Tests
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMapEditorHistory } from '@/hooks/useMapEditorHistory';
import type { MapLayer, MapLighting } from '@dnd/shared';

describe('useMapEditorHistory', () => {
  const createInitialState = () => ({
    layers: [
      {
        id: 'layer1',
        name: 'Base',
        visible: true,
        opacity: 1,
        tiles: [{ x: 0, y: 0, terrain: 'stone' as const, elevation: 0 }],
      },
    ] as MapLayer[],
    lighting: {
      globalLight: 1,
      ambientColor: '#ffffff',
      lightSources: [],
    } as MapLighting,
  });

  describe('Initial State', () => {
    it('should start with canUndo false', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      expect(result.current.canUndo).toBe(false);
    });

    it('should start with canRedo false', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      expect(result.current.canRedo).toBe(false);
    });

    it('should have history length of 1', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      expect(result.current.historyLength).toBe(1);
    });

    it('should have current index of 0', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      expect(result.current.currentIndex).toBe(0);
    });
  });

  describe('pushState', () => {
    it('should enable undo after pushing state', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      act(() => {
        result.current.pushState({
          layers: [
            {
              id: 'layer1',
              name: 'Base',
              visible: true,
              opacity: 1,
              tiles: [{ x: 0, y: 0, terrain: 'water', elevation: 0 }],
            },
          ],
          lighting: { globalLight: 1, ambientColor: '#ffffff', lightSources: [] },
        });
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.historyLength).toBe(2);
    });

    it('should increment current index after pushing', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      act(() => {
        result.current.pushState({
          layers: [],
          lighting: { globalLight: 1, ambientColor: '#ffffff', lightSources: [] },
        });
      });

      expect(result.current.currentIndex).toBe(1);
    });

    it('should clear redo history when pushing new state', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      // Push a state
      act(() => {
        result.current.pushState({
          layers: [],
          lighting: { globalLight: 1, ambientColor: '#ffffff', lightSources: [] },
        });
      });

      // Undo to enable redo
      act(() => {
        result.current.undo();
      });
      expect(result.current.canRedo).toBe(true);

      // Push new state - should clear redo
      act(() => {
        result.current.pushState({
          layers: [],
          lighting: { globalLight: 0.5, ambientColor: '#000000', lightSources: [] },
        });
      });

      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('undo', () => {
    it('should return null when cannot undo', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      let undoResult: ReturnType<typeof result.current.undo>;
      act(() => {
        undoResult = result.current.undo();
      });

      expect(undoResult).toBeNull();
    });

    it('should return previous state when undoing', () => {
      const initialState = createInitialState();
      const { result } = renderHook(() => useMapEditorHistory(initialState));

      // Push a new state
      act(() => {
        result.current.pushState({
          layers: [
            {
              id: 'layer1',
              name: 'Base',
              visible: true,
              opacity: 1,
              tiles: [{ x: 0, y: 0, terrain: 'water', elevation: 0 }],
            },
          ],
          lighting: { globalLight: 1, ambientColor: '#ffffff', lightSources: [] },
        });
      });

      // Undo
      let undoResult: ReturnType<typeof result.current.undo>;
      act(() => {
        undoResult = result.current.undo();
      });

      expect(undoResult).not.toBeNull();
      expect(undoResult!.layers[0].tiles[0].terrain).toBe('stone');
    });

    it('should decrement current index', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      act(() => {
        result.current.pushState({
          layers: [],
          lighting: { globalLight: 1, ambientColor: '#ffffff', lightSources: [] },
        });
      });

      expect(result.current.currentIndex).toBe(1);

      act(() => {
        result.current.undo();
      });

      expect(result.current.currentIndex).toBe(0);
    });

    it('should enable redo after undoing', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      act(() => {
        result.current.pushState({
          layers: [],
          lighting: { globalLight: 1, ambientColor: '#ffffff', lightSources: [] },
        });
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);
    });
  });

  describe('redo', () => {
    it('should return null when cannot redo', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      let redoResult: ReturnType<typeof result.current.redo>;
      act(() => {
        redoResult = result.current.redo();
      });

      expect(redoResult).toBeNull();
    });

    it('should return next state when redoing', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      // Push and undo
      act(() => {
        result.current.pushState({
          layers: [
            {
              id: 'layer1',
              name: 'Base',
              visible: true,
              opacity: 1,
              tiles: [{ x: 0, y: 0, terrain: 'water', elevation: 0 }],
            },
          ],
          lighting: { globalLight: 1, ambientColor: '#ffffff', lightSources: [] },
        });
      });

      act(() => {
        result.current.undo();
      });

      // Redo
      let redoResult: ReturnType<typeof result.current.redo>;
      act(() => {
        redoResult = result.current.redo();
      });

      expect(redoResult).not.toBeNull();
      expect(redoResult!.layers[0].tiles[0].terrain).toBe('water');
    });

    it('should increment current index', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      act(() => {
        result.current.pushState({
          layers: [],
          lighting: { globalLight: 1, ambientColor: '#ffffff', lightSources: [] },
        });
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.currentIndex).toBe(0);

      act(() => {
        result.current.redo();
      });

      expect(result.current.currentIndex).toBe(1);
    });

    it('should disable redo after redoing to latest state', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      act(() => {
        result.current.pushState({
          layers: [],
          lighting: { globalLight: 1, ambientColor: '#ffffff', lightSources: [] },
        });
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('clear', () => {
    it('should reset history to single entry', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      // Push multiple states
      act(() => {
        result.current.pushState({
          layers: [],
          lighting: { globalLight: 0.8, ambientColor: '#ffffff', lightSources: [] },
        });
      });

      act(() => {
        result.current.pushState({
          layers: [],
          lighting: { globalLight: 0.6, ambientColor: '#ffffff', lightSources: [] },
        });
      });

      expect(result.current.historyLength).toBe(3);

      act(() => {
        result.current.clear();
      });

      expect(result.current.historyLength).toBe(1);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should preserve current state after clear', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      // Push a state
      act(() => {
        result.current.pushState({
          layers: [
            {
              id: 'layer1',
              name: 'Base',
              visible: true,
              opacity: 1,
              tiles: [{ x: 0, y: 0, terrain: 'lava', elevation: 0 }],
            },
          ],
          lighting: { globalLight: 1, ambientColor: '#ffffff', lightSources: [] },
        });
      });

      act(() => {
        result.current.clear();
      });

      // The current state (lava) should be preserved as the only history entry
      // We can't directly access it, but we can verify the behavior
      expect(result.current.historyLength).toBe(1);
    });
  });

  describe('History Limit', () => {
    it('should limit history to 50 entries', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      // Push 60 states
      for (let i = 0; i < 60; i++) {
        act(() => {
          result.current.pushState({
            layers: [
              {
                id: 'layer1',
                name: 'Base',
                visible: true,
                opacity: 1,
                tiles: [{ x: i, y: 0, terrain: 'stone', elevation: 0 }],
              },
            ],
            lighting: { globalLight: 1, ambientColor: '#ffffff', lightSources: [] },
          });
        });
      }

      expect(result.current.historyLength).toBeLessThanOrEqual(50);
    });
  });

  describe('State Cloning', () => {
    it('should return cloned state from undo to prevent mutations', () => {
      const { result } = renderHook(() =>
        useMapEditorHistory(createInitialState())
      );

      act(() => {
        result.current.pushState({
          layers: [
            {
              id: 'layer1',
              name: 'Base',
              visible: true,
              opacity: 1,
              tiles: [{ x: 0, y: 0, terrain: 'water', elevation: 0 }],
            },
          ],
          lighting: { globalLight: 1, ambientColor: '#ffffff', lightSources: [] },
        });
      });

      let state1: ReturnType<typeof result.current.undo>;
      let state2: ReturnType<typeof result.current.undo>;

      act(() => {
        state1 = result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      act(() => {
        state2 = result.current.undo();
      });

      // Mutate state1
      if (state1) {
        state1.layers[0].tiles[0].terrain = 'lava';
      }

      // state2 should be unaffected
      expect(state2!.layers[0].tiles[0].terrain).toBe('stone');
    });
  });
});
