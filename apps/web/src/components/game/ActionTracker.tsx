'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export interface ActionState {
  action: boolean;
  bonusAction: boolean;
  reaction: boolean;
  movement: {
    used: number;
    total: number;
  };
  freeInteraction: boolean;
}

interface ActionTrackerProps {
  state: ActionState;
  onUseAction?: () => void;
  onUseBonusAction?: () => void;
  onUseReaction?: () => void;
  onUseMovement?: (feet: number) => void;
  onUseFreeInteraction?: () => void;
  onEndTurn?: () => void;
  onResetTurn?: () => void;
  isCurrentTurn?: boolean;
  characterName?: string;
}

export function ActionTracker({
  state,
  onUseAction,
  onUseBonusAction,
  onUseReaction,
  onUseMovement,
  onUseFreeInteraction,
  onEndTurn,
  onResetTurn,
  isCurrentTurn = true,
  characterName = 'Your Turn',
}: ActionTrackerProps) {
  const movementRemaining = state.movement.total - state.movement.used;
  const movementPercent = (movementRemaining / state.movement.total) * 100;

  return (
    <div className={`bg-bg-card rounded-lg border ${isCurrentTurn ? 'border-primary/50' : 'border-border'} overflow-hidden`}>
      {/* Header */}
      <div className={`px-3 py-2 ${isCurrentTurn ? 'bg-primary/10' : 'bg-bg-elevated'} border-b border-border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCurrentTurn && (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-primary"
              >
                ⚡
              </motion.span>
            )}
            <h3 className="font-medium text-text-primary text-sm">{characterName}</h3>
          </div>
          {isCurrentTurn && onEndTurn && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEndTurn}
              className="px-3 py-1 bg-primary text-bg-dark rounded text-xs font-medium"
            >
              End Turn
            </motion.button>
          )}
        </div>
      </div>

      {/* Actions Grid */}
      <div className="p-3 space-y-3">
        {/* Main Actions */}
        <div className="grid grid-cols-3 gap-2">
          {/* Action */}
          <ActionButton
            label="Action"
            icon="⚔️"
            available={state.action}
            onClick={onUseAction}
            color="red"
          />
          {/* Bonus Action */}
          <ActionButton
            label="Bonus"
            icon="⚡"
            available={state.bonusAction}
            onClick={onUseBonusAction}
            color="yellow"
          />
          {/* Reaction */}
          <ActionButton
            label="Reaction"
            icon="🛡️"
            available={state.reaction}
            onClick={onUseReaction}
            color="blue"
          />
        </div>

        {/* Movement Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Movement</span>
            <span className={movementRemaining > 0 ? 'text-green-400' : 'text-text-muted'}>
              {movementRemaining} / {state.movement.total} ft
            </span>
          </div>
          <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${movementPercent}%` }}
              className={`h-full ${
                movementPercent > 50
                  ? 'bg-green-500'
                  : movementPercent > 25
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            />
          </div>
          {/* Quick movement buttons */}
          <div className="flex gap-1 mt-1">
            {[5, 10, 15].map((feet) => (
              <button
                key={feet}
                onClick={() => onUseMovement?.(feet)}
                disabled={movementRemaining < feet}
                className="flex-1 px-2 py-1 text-xs bg-bg-elevated rounded hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +{feet}ft
              </button>
            ))}
            <button
              onClick={() => onUseMovement?.(movementRemaining)}
              disabled={movementRemaining <= 0}
              className="flex-1 px-2 py-1 text-xs bg-bg-elevated rounded hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed"
            >
              All
            </button>
          </div>
        </div>

        {/* Free Interaction */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">Free Object Interaction</span>
          <button
            onClick={onUseFreeInteraction}
            disabled={!state.freeInteraction}
            className={`px-2 py-1 text-xs rounded ${
              state.freeInteraction
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30'
                : 'bg-bg-elevated text-text-muted line-through'
            }`}
          >
            {state.freeInteraction ? '✓ Available' : 'Used'}
          </button>
        </div>

        {/* Action Suggestions */}
        {isCurrentTurn && state.action && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-text-muted mb-2">Available Actions:</p>
            <div className="flex flex-wrap gap-1">
              {['Attack', 'Cast Spell', 'Dash', 'Disengage', 'Dodge', 'Help', 'Hide', 'Ready', 'Search', 'Use Object'].map(
                (action) => (
                  <span
                    key={action}
                    className="px-2 py-0.5 text-xs bg-bg-elevated rounded text-text-secondary hover:text-text-primary hover:bg-border cursor-pointer"
                  >
                    {action}
                  </span>
                )
              )}
            </div>
          </div>
        )}

        {/* Reset Button (DM Only) */}
        {onResetTurn && (
          <button
            onClick={onResetTurn}
            className="w-full px-3 py-1 text-xs text-text-muted hover:text-text-primary bg-bg-elevated rounded hover:bg-border transition-colors"
          >
            Reset Turn
          </button>
        )}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  icon: string;
  available: boolean;
  onClick?: () => void;
  color: 'red' | 'yellow' | 'blue' | 'green' | 'purple';
}

function ActionButton({ label, icon, available, onClick, color }: ActionButtonProps) {
  const colorClasses = {
    red: available
      ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
      : 'bg-bg-elevated text-text-muted border-border',
    yellow: available
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'
      : 'bg-bg-elevated text-text-muted border-border',
    blue: available
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30'
      : 'bg-bg-elevated text-text-muted border-border',
    green: available
      ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
      : 'bg-bg-elevated text-text-muted border-border',
    purple: available
      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30'
      : 'bg-bg-elevated text-text-muted border-border',
  };

  return (
    <motion.button
      whileHover={available ? { scale: 1.05 } : undefined}
      whileTap={available ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={!available}
      className={`flex flex-col items-center p-2 rounded border transition-colors ${colorClasses[color]} ${
        !available ? 'line-through opacity-60' : ''
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs mt-1">{label}</span>
      {available && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
        />
      )}
    </motion.button>
  );
}

// Hook to manage action economy state
export function useActionEconomy(baseSpeed: number = 30) {
  const [state, setState] = useState<ActionState>({
    action: true,
    bonusAction: true,
    reaction: true,
    movement: { used: 0, total: baseSpeed },
    freeInteraction: true,
  });

  const useAction = useCallback(() => {
    setState((prev) => ({ ...prev, action: false }));
  }, []);

  const useBonusAction = useCallback(() => {
    setState((prev) => ({ ...prev, bonusAction: false }));
  }, []);

  const useReaction = useCallback(() => {
    setState((prev) => ({ ...prev, reaction: false }));
  }, []);

  const useMovement = useCallback((feet: number) => {
    setState((prev) => ({
      ...prev,
      movement: {
        ...prev.movement,
        used: Math.min(prev.movement.total, prev.movement.used + feet),
      },
    }));
  }, []);

  const useFreeInteraction = useCallback(() => {
    setState((prev) => ({ ...prev, freeInteraction: false }));
  }, []);

  const dash = useCallback(() => {
    // Dash doubles movement for this turn
    setState((prev) => ({
      ...prev,
      action: false,
      movement: {
        ...prev.movement,
        total: prev.movement.total + baseSpeed,
      },
    }));
  }, [baseSpeed]);

  const resetTurn = useCallback(() => {
    setState({
      action: true,
      bonusAction: true,
      reaction: true,
      movement: { used: 0, total: baseSpeed },
      freeInteraction: true,
    });
  }, [baseSpeed]);

  // Reset reaction at start of your turn
  const refreshReaction = useCallback(() => {
    setState((prev) => ({ ...prev, reaction: true }));
  }, []);

  const canAct = state.action || state.bonusAction;
  const canMove = state.movement.used < state.movement.total;
  const remainingMovement = state.movement.total - state.movement.used;

  return {
    state,
    useAction,
    useBonusAction,
    useReaction,
    useMovement,
    useFreeInteraction,
    dash,
    resetTurn,
    refreshReaction,
    canAct,
    canMove,
    remainingMovement,
  };
}

export default ActionTracker;
