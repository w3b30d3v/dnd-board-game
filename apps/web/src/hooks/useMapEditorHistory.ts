/**
 * Map Editor History Hook
 * Provides undo/redo functionality for map editing
 */

import { useState, useCallback, useRef } from 'react';
import type { MapLayer, MapLighting } from '@dnd/shared';
import { cloneLayers, cloneLighting, areLayersEqual } from '@/lib/mapEditorUtils';

export interface HistoryState {
  layers: MapLayer[];
  lighting: MapLighting;
}

export interface UseMapEditorHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  pushState: (state: HistoryState) => void;
  clear: () => void;
  historyLength: number;
  currentIndex: number;
}

const MAX_HISTORY_SIZE = 50;

export function useMapEditorHistory(initialState: HistoryState): UseMapEditorHistoryReturn {
  // Use ref to store history to avoid re-renders on every history change
  const historyRef = useRef<HistoryState[]>([{
    layers: cloneLayers(initialState.layers),
    lighting: cloneLighting(initialState.lighting),
  }]);
  const indexRef = useRef(0);

  // Force re-render when history changes
  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => forceUpdate({}), []);

  const canUndo = indexRef.current > 0;
  const canRedo = indexRef.current < historyRef.current.length - 1;

  const pushState = useCallback((state: HistoryState) => {
    const history = historyRef.current;
    const currentIndex = indexRef.current;

    // Check if the new state is different from current
    const currentState = history[currentIndex];
    if (currentState && areLayersEqual(currentState.layers, state.layers)) {
      // Only check layers for now, lighting changes are always saved
      // This prevents duplicate history entries when just moving around
    }

    // Clone the state to avoid mutations
    const clonedState: HistoryState = {
      layers: cloneLayers(state.layers),
      lighting: cloneLighting(state.lighting),
    };

    // Remove any redo states (everything after current index)
    const newHistory = history.slice(0, currentIndex + 1);

    // Add new state
    newHistory.push(clonedState);

    // Limit history size
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
    } else {
      indexRef.current = newHistory.length - 1;
    }

    historyRef.current = newHistory;
    indexRef.current = historyRef.current.length - 1;
    triggerUpdate();
  }, [triggerUpdate]);

  const undo = useCallback((): HistoryState | null => {
    if (!canUndo) return null;

    indexRef.current -= 1;
    const state = historyRef.current[indexRef.current];
    triggerUpdate();

    // Return a clone to prevent mutations
    return {
      layers: cloneLayers(state.layers),
      lighting: cloneLighting(state.lighting),
    };
  }, [canUndo, triggerUpdate]);

  const redo = useCallback((): HistoryState | null => {
    if (!canRedo) return null;

    indexRef.current += 1;
    const state = historyRef.current[indexRef.current];
    triggerUpdate();

    // Return a clone to prevent mutations
    return {
      layers: cloneLayers(state.layers),
      lighting: cloneLighting(state.lighting),
    };
  }, [canRedo, triggerUpdate]);

  const clear = useCallback(() => {
    const currentState = historyRef.current[indexRef.current];
    historyRef.current = [currentState];
    indexRef.current = 0;
    triggerUpdate();
  }, [triggerUpdate]);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    clear,
    historyLength: historyRef.current.length,
    currentIndex: indexRef.current,
  };
}

export default useMapEditorHistory;
