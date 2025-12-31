'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { SessionParticipant } from '@/stores/gameSessionStore';

interface PlayerPanelProps {
  participants: SessionParticipant[];
  isDM: boolean;
  selectedCreature: string | null;
  onSelectCreature: (id: string | null) => void;
}

const conditionColors: Record<string, string> = {
  blinded: 'bg-gray-500',
  charmed: 'bg-pink-500',
  deafened: 'bg-gray-400',
  exhaustion: 'bg-orange-500',
  frightened: 'bg-purple-500',
  grappled: 'bg-yellow-600',
  incapacitated: 'bg-red-700',
  invisible: 'bg-blue-200',
  paralyzed: 'bg-yellow-500',
  petrified: 'bg-stone-500',
  poisoned: 'bg-green-600',
  prone: 'bg-brown-500',
  restrained: 'bg-amber-600',
  stunned: 'bg-yellow-400',
  unconscious: 'bg-red-800',
};

export function PlayerPanel({
  participants,
  isDM,
  selectedCreature,
  onSelectCreature,
}: PlayerPanelProps) {
  const dm = participants.find((p) => p.role === 'dm');
  const players = participants.filter((p) => p.role === 'player');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <h2 className="font-cinzel text-primary text-sm">Party</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* DM Section */}
        {dm && (
          <div>
            <div className="text-xs text-text-muted mb-2">Dungeon Master</div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-elevated">
              <div className="relative">
                {dm.user?.avatarUrl ? (
                  <img
                    src={dm.user.avatarUrl}
                    alt={dm.user.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-cinzel text-sm">
                      {dm.user?.displayName?.charAt(0) || 'D'}
                    </span>
                  </div>
                )}
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg-elevated ${
                    dm.isConnected ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-primary truncate">
                  {dm.user?.displayName || 'Unknown DM'}
                </div>
                <div className="text-xs text-primary">Dungeon Master</div>
              </div>
            </div>
          </div>
        )}

        {/* Players Section */}
        <div>
          <div className="text-xs text-text-muted mb-2">
            Players ({players.length})
          </div>
          <AnimatePresence>
            {players.length === 0 ? (
              <div className="text-center py-4 text-text-muted text-xs">
                No players have joined yet
              </div>
            ) : (
              <div className="space-y-2">
                {players.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PlayerCard
                      participant={player}
                      isSelected={selectedCreature === player.character?.id}
                      onSelect={() =>
                        onSelectCreature(
                          selectedCreature === player.character?.id
                            ? null
                            : player.character?.id || null
                        )
                      }
                      isDM={isDM}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

interface PlayerCardProps {
  participant: SessionParticipant;
  isSelected: boolean;
  onSelect: () => void;
  isDM: boolean;
}

function PlayerCard({ participant, isSelected, onSelect, isDM: _isDM }: PlayerCardProps) {
  const { user, character, isConnected, conditions, inspiration } = participant;

  // Calculate HP percentage for health bar
  const hpPercent = character
    ? ((participant.currentHp ?? character.currentHitPoints) / character.maxHitPoints) * 100
    : 100;

  // HP color based on percentage
  const hpColor =
    hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left p-2 rounded-lg transition-colors ${
        isSelected
          ? 'bg-primary/20 border border-primary'
          : 'bg-bg-elevated hover:bg-border border border-transparent'
      }`}
    >
      {/* Player Info Row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative">
          {character?.portraitUrl ? (
            <img
              src={character.portraitUrl}
              alt={character.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-bg-dark flex items-center justify-center border-2 border-border">
              <span className="text-text-muted text-sm">
                {character?.name?.charAt(0) || user?.displayName?.charAt(0) || '?'}
              </span>
            </div>
          )}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg-elevated ${
              isConnected ? 'bg-green-500' : 'bg-gray-500'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm text-text-primary truncate">
              {character?.name || user?.displayName || 'Unknown'}
            </span>
            {inspiration && (
              <span className="text-yellow-400" title="Has Inspiration">
                ✨
              </span>
            )}
          </div>
          {character && (
            <div className="text-xs text-text-muted">
              {character.race} {character.class} {character.level}
            </div>
          )}
        </div>
      </div>

      {/* Character Stats (if has character) */}
      {character && (
        <div className="space-y-2">
          {/* HP Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-muted">HP</span>
              <span className="text-text-primary">
                {participant.currentHp ?? character.currentHitPoints} / {character.maxHitPoints}
                {(participant.tempHp || character.tempHitPoints) > 0 && (
                  <span className="text-blue-400 ml-1">
                    (+{participant.tempHp || character.tempHitPoints})
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 bg-bg-dark rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${hpColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, hpPercent)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-text-muted">AC</span>
              <span className="text-text-primary">{character.armorClass}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-text-muted">Speed</span>
              <span className="text-text-primary">{character.speed}ft</span>
            </div>
          </div>

          {/* Conditions */}
          {conditions && conditions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {conditions.map((condition) => (
                <span
                  key={condition}
                  className={`px-1.5 py-0.5 text-[10px] rounded ${
                    conditionColors[condition] || 'bg-gray-500'
                  } text-white capitalize`}
                  title={condition}
                >
                  {condition}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No character message */}
      {!character && (
        <div className="text-xs text-text-muted italic">No character assigned</div>
      )}
    </motion.button>
  );
}
