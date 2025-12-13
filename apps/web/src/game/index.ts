/**
 * Game Board Module
 * Export all game-related components
 */

export { GameApplication } from './GameApplication';
export { BoardRenderer } from './BoardRenderer';
export { TokenManager } from './TokenManager';
export { FogOfWarRenderer } from './FogOfWarRenderer';
export { AoEOverlayRenderer } from './AoEOverlayRenderer';
export { InputHandler } from './InputHandler';
export { CameraController } from './CameraController';

// Combat integration
export { CombatManager } from './CombatManager';
export type {
  CombatEvent,
  CombatEventHandler,
  CreatureCombatStats,
  DiceRollEvent,
  AttackEvent,
  DamageEvent,
  HealingEvent,
  DeathEvent,
  InitiativeEvent,
  ConcentrationEvent,
} from './CombatManager';

// React integration
export { useGameCanvas } from './useGameCanvas';
export type { UseGameCanvasConfig, UseGameCanvasReturn } from './useGameCanvas';

export * from './types';
