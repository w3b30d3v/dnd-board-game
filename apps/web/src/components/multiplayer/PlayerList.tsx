'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '@dnd/shared';

interface PlayerListProps {
  players: Player[];
  currentUserId?: string;
  hostUserId?: string;
  showReadyStatus?: boolean;
}

export function PlayerList({
  players,
  currentUserId,
  hostUserId,
  showReadyStatus = true,
}: PlayerListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
        Players ({players.length})
      </h3>
      <ul className="space-y-2">
        <AnimatePresence mode="popLayout">
          {players.map((player, index) => (
            <motion.li
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={`
                flex items-center justify-between p-3 rounded-lg
                ${player.userId === currentUserId ? 'bg-primary/10 border border-primary/30' : 'bg-bg-elevated'}
                ${!player.isConnected ? 'opacity-50' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                {/* Connection indicator */}
                <div
                  className={`w-2 h-2 rounded-full ${
                    player.isConnected ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />

                {/* Player info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">
                      {player.displayName}
                    </span>
                    {player.userId === hostUserId && (
                      <span className="px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded">
                        Host
                      </span>
                    )}
                    {player.isDM && (
                      <span className="px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">
                        DM
                      </span>
                    )}
                    {player.userId === currentUserId && (
                      <span className="text-xs text-text-muted">(You)</span>
                    )}
                  </div>
                  {player.characterName && (
                    <span className="text-sm text-text-secondary">
                      Playing as {player.characterName}
                    </span>
                  )}
                </div>
              </div>

              {/* Ready status - shown for all players including DM */}
              {showReadyStatus && (
                <div
                  className={`
                    px-2 py-1 text-xs rounded
                    ${player.isReady
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                    }
                  `}
                >
                  {player.isReady ? 'Ready' : 'Not Ready'}
                </div>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
