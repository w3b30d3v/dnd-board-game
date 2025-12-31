'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Creature } from '@/game/types';

interface InitiativeEntry {
  creatureId: string;
  initiative: number;
  tieBreaker: number;
}

interface InitiativeTrackerProps {
  initiativeOrder: InitiativeEntry[];
  currentTurn: number | null;
  creatures: Creature[];
}

export function InitiativeTracker({
  initiativeOrder,
  currentTurn,
  creatures,
}: InitiativeTrackerProps) {
  if (!initiativeOrder || initiativeOrder.length === 0) {
    return null;
  }

  // Create a map of creatures for quick lookup
  const creatureMap = new Map(creatures.map((c) => [c.id, c]));

  // Sort by initiative (already sorted from backend, but ensure)
  const sortedOrder = [...initiativeOrder].sort((a, b) => {
    if (b.initiative !== a.initiative) return b.initiative - a.initiative;
    return b.tieBreaker - a.tieBreaker;
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-bg-card/90 backdrop-blur rounded-lg border border-border shadow-lg w-48"
    >
      {/* Header */}
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-cinzel text-primary">Initiative</span>
        <span className="text-xs text-text-muted">
          Turn {currentTurn !== null ? currentTurn + 1 : '-'}
        </span>
      </div>

      {/* Initiative List */}
      <div className="max-h-64 overflow-y-auto">
        <AnimatePresence>
          {sortedOrder.map((entry, index) => {
            const creature = creatureMap.get(entry.creatureId);
            const isActive = currentTurn === index;
            const isDead = creature && creature.currentHitPoints <= 0;

            return (
              <motion.div
                key={entry.creatureId}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: index * 0.03 }}
                className={`flex items-center gap-2 p-2 ${
                  isActive
                    ? 'bg-primary/20 border-l-2 border-primary'
                    : 'border-l-2 border-transparent'
                } ${isDead ? 'opacity-50' : ''}`}
              >
                {/* Initiative Number */}
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                    isActive ? 'bg-primary text-bg-dark' : 'bg-bg-elevated text-text-muted'
                  }`}
                >
                  {entry.initiative}
                </div>

                {/* Creature Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {/* Token Color Dot */}
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: creature?.tokenColor || '#888' }}
                    />
                    <span
                      className={`text-xs truncate ${
                        isActive ? 'text-text-primary font-medium' : 'text-text-secondary'
                      } ${isDead ? 'line-through' : ''}`}
                    >
                      {creature?.name || entry.creatureId}
                    </span>
                  </div>

                  {/* HP Bar (small) */}
                  {creature && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 h-1 bg-bg-dark rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            creature.currentHitPoints / creature.maxHitPoints > 0.5
                              ? 'bg-green-500'
                              : creature.currentHitPoints / creature.maxHitPoints > 0.25
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.max(0, Math.min(100, (creature.currentHitPoints / creature.maxHitPoints) * 100))}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-text-muted">
                        {creature.currentHitPoints}/{creature.maxHitPoints}
                      </span>
                    </div>
                  )}
                </div>

                {/* Creature Type Icon */}
                <div className="w-4 h-4 flex items-center justify-center" title={creature?.type}>
                  {creature?.type === 'character' && (
                    <svg
                      className="w-3 h-3 text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                  {creature?.type === 'monster' && (
                    <svg
                      className="w-3 h-3 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  )}
                  {creature?.type === 'npc' && (
                    <svg
                      className="w-3 h-3 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Current Turn Highlight Effect */}
      {currentTurn !== null && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-lg border-2 border-primary/50"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
