'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CreatureTemplate {
  id: string;
  name: string;
  cr: number;
  hp: number;
  ac: number;
  type: 'aberration' | 'beast' | 'celestial' | 'construct' | 'dragon' | 'elemental' | 'fey' | 'fiend' | 'giant' | 'humanoid' | 'monstrosity' | 'ooze' | 'plant' | 'undead';
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  imageUrl?: string;
}

export interface SpawnedCreature extends CreatureTemplate {
  spawnId: string;
  x: number;
  y: number;
  currentHp: number;
  initiative?: number;
  conditions: string[];
}

interface EncounterSpawnerProps {
  creatures: CreatureTemplate[];
  onSpawn: (creature: CreatureTemplate, position: { x: number; y: number }) => void;
  onRemove?: (spawnId: string) => void;
  spawnedCreatures: SpawnedCreature[];
  isPlacementMode: boolean;
  onTogglePlacementMode: () => void;
  selectedCreature?: CreatureTemplate | null;
  onSelectCreature: (creature: CreatureTemplate | null) => void;
  partyLevel?: number;
  partySize?: number;
}

const CR_COLORS: Record<string, string> = {
  trivial: 'text-gray-400',
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-orange-400',
  deadly: 'text-red-400',
};

const SIZE_ICONS: Record<string, string> = {
  tiny: '•',
  small: '○',
  medium: '●',
  large: '◉',
  huge: '◎',
  gargantuan: '⬤',
};

const TYPE_ICONS: Record<string, string> = {
  aberration: '👁️',
  beast: '🐺',
  celestial: '😇',
  construct: '🤖',
  dragon: '🐉',
  elemental: '🔥',
  fey: '🧚',
  fiend: '😈',
  giant: '🗿',
  humanoid: '🧑',
  monstrosity: '👹',
  ooze: '💧',
  plant: '🌿',
  undead: '💀',
};

// XP by CR for difficulty calculation
const XP_BY_CR: Record<number, number> = {
  0: 10, 0.125: 25, 0.25: 50, 0.5: 100,
  1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800,
  6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
  11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000,
  16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000,
  21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000,
  26: 90000, 27: 105000, 28: 120000, 29: 135000, 30: 155000,
};

// Thresholds by level
const XP_THRESHOLDS: Record<number, { easy: number; medium: number; hard: number; deadly: number }> = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

export function EncounterSpawner({
  creatures,
  onSpawn: _onSpawn,
  onRemove,
  spawnedCreatures,
  isPlacementMode,
  onTogglePlacementMode,
  selectedCreature,
  onSelectCreature,
  partyLevel = 5,
  partySize = 4,
}: EncounterSpawnerProps) {
  // Note: _onSpawn is called from map click handler (external integration point)
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [crFilter, setCrFilter] = useState<[number, number]>([0, 30]);

  // Calculate encounter difficulty
  const totalXP = spawnedCreatures.reduce((sum, c) => sum + (XP_BY_CR[c.cr] || 0), 0);

  // Apply multiplier based on number of monsters
  const count = spawnedCreatures.length;
  let multiplier = 1;
  if (count === 2) multiplier = 1.5;
  else if (count >= 3 && count <= 6) multiplier = 2;
  else if (count >= 7 && count <= 10) multiplier = 2.5;
  else if (count >= 11 && count <= 14) multiplier = 3;
  else if (count >= 15) multiplier = 4;

  const adjustedXP = totalXP * multiplier;
  const thresholds = XP_THRESHOLDS[partyLevel] || XP_THRESHOLDS[5];
  const partyThresholds = {
    easy: thresholds.easy * partySize,
    medium: thresholds.medium * partySize,
    hard: thresholds.hard * partySize,
    deadly: thresholds.deadly * partySize,
  };

  const difficulty =
    adjustedXP >= partyThresholds.deadly
      ? 'deadly'
      : adjustedXP >= partyThresholds.hard
      ? 'hard'
      : adjustedXP >= partyThresholds.medium
      ? 'medium'
      : adjustedXP >= partyThresholds.easy
      ? 'easy'
      : 'trivial';

  // Filter creatures
  const filteredCreatures = creatures.filter((c) => {
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (typeFilter && c.type !== typeFilter) return false;
    if (c.cr < crFilter[0] || c.cr > crFilter[1]) return false;
    return true;
  });

  return (
    <div className="bg-bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-bg-elevated border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">👹</span>
            <h3 className="font-medium text-text-primary text-sm">Encounter Builder</h3>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onTogglePlacementMode}
            className={`px-3 py-1 rounded text-xs font-medium ${
              isPlacementMode
                ? 'bg-primary text-bg-dark'
                : 'bg-bg-card text-text-secondary border border-border hover:bg-border'
            }`}
          >
            {isPlacementMode ? '✓ Placing...' : 'Place Mode'}
          </motion.button>
        </div>
      </div>

      {/* Difficulty Display */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary">Encounter Difficulty</span>
          <span className={`text-sm font-medium ${CR_COLORS[difficulty]}`}>
            {difficulty.toUpperCase()}
          </span>
        </div>
        <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
          <div className="flex h-full">
            <div className="bg-green-500" style={{ width: `${(partyThresholds.easy / partyThresholds.deadly) * 100}%` }} />
            <div className="bg-yellow-500" style={{ width: `${((partyThresholds.medium - partyThresholds.easy) / partyThresholds.deadly) * 100}%` }} />
            <div className="bg-orange-500" style={{ width: `${((partyThresholds.hard - partyThresholds.medium) / partyThresholds.deadly) * 100}%` }} />
            <div className="bg-red-500 flex-1" />
          </div>
        </div>
        <div className="flex justify-between text-xs text-text-muted mt-1">
          <span>Easy</span>
          <span>Medium</span>
          <span>Hard</span>
          <span>Deadly</span>
        </div>
        <div className="mt-2 text-center">
          <span className="text-sm text-text-primary">
            {Math.round(adjustedXP).toLocaleString()} XP
          </span>
          <span className="text-xs text-text-muted ml-1">
            (Base: {totalXP.toLocaleString()} × {multiplier})
          </span>
        </div>
      </div>

      {/* Spawned Creatures */}
      {spawnedCreatures.length > 0 && (
        <div className="p-3 border-b border-border">
          <p className="text-xs text-text-secondary mb-2">Spawned ({spawnedCreatures.length})</p>
          <div className="flex flex-wrap gap-1">
            {spawnedCreatures.map((creature) => (
              <div
                key={creature.spawnId}
                className="flex items-center gap-1 px-2 py-1 bg-bg-elevated rounded text-xs"
              >
                <span>{TYPE_ICONS[creature.type]}</span>
                <span className="text-text-primary">{creature.name}</span>
                <span className="text-text-muted">CR {creature.cr}</span>
                {onRemove && (
                  <button
                    onClick={() => onRemove(creature.spawnId)}
                    className="ml-1 text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="p-3 border-b border-border space-y-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search creatures..."
          className="w-full px-3 py-2 bg-bg-elevated rounded border border-border text-sm text-text-primary placeholder-text-muted focus:border-primary focus:outline-none"
        />
        <div className="flex gap-2">
          <select
            value={typeFilter || ''}
            onChange={(e) => setTypeFilter(e.target.value || null)}
            className="flex-1 px-2 py-1 bg-bg-elevated rounded border border-border text-sm text-text-primary"
          >
            <option value="">All Types</option>
            {Object.keys(TYPE_ICONS).map((type) => (
              <option key={type} value={type}>
                {TYPE_ICONS[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={`${crFilter[0]}-${crFilter[1]}`}
            onChange={(e) => {
              const [min, max] = e.target.value.split('-').map(Number);
              setCrFilter([min, max]);
            }}
            className="px-2 py-1 bg-bg-elevated rounded border border-border text-sm text-text-primary"
          >
            <option value="0-30">All CR</option>
            <option value="0-1">CR 0-1</option>
            <option value="2-4">CR 2-4</option>
            <option value="5-10">CR 5-10</option>
            <option value="11-17">CR 11-17</option>
            <option value="18-30">CR 18-30</option>
          </select>
        </div>
      </div>

      {/* Creature List */}
      <div className="max-h-64 overflow-y-auto p-2">
        <AnimatePresence mode="popLayout">
          {filteredCreatures.length === 0 ? (
            <p className="text-center text-text-muted text-sm py-4">
              No creatures match filters
            </p>
          ) : (
            filteredCreatures.map((creature) => (
              <motion.div
                key={creature.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={() => onSelectCreature(selectedCreature?.id === creature.id ? null : creature)}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  selectedCreature?.id === creature.id
                    ? 'bg-primary/20 border border-primary/50'
                    : 'hover:bg-bg-elevated'
                }`}
              >
                <span className="text-lg">{TYPE_ICONS[creature.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary font-medium truncate">
                      {creature.name}
                    </span>
                    <span className="text-xs text-text-muted">{SIZE_ICONS[creature.size]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>CR {creature.cr}</span>
                    <span>HP {creature.hp}</span>
                    <span>AC {creature.ac}</span>
                  </div>
                </div>
                {isPlacementMode && selectedCreature?.id === creature.id && (
                  <span className="text-xs text-primary">Click map to place</span>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Selected Creature Preview */}
      {selectedCreature && (
        <div className="p-3 border-t border-border bg-bg-elevated">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{TYPE_ICONS[selectedCreature.type]}</span>
            <div>
              <p className="font-medium text-text-primary">{selectedCreature.name}</p>
              <p className="text-xs text-text-secondary">
                {selectedCreature.size} {selectedCreature.type}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-bg-card rounded p-2">
              <span className="block text-lg font-bold text-red-400">{selectedCreature.cr}</span>
              <span className="text-xs text-text-muted">CR</span>
            </div>
            <div className="bg-bg-card rounded p-2">
              <span className="block text-lg font-bold text-green-400">{selectedCreature.hp}</span>
              <span className="text-xs text-text-muted">HP</span>
            </div>
            <div className="bg-bg-card rounded p-2">
              <span className="block text-lg font-bold text-blue-400">{selectedCreature.ac}</span>
              <span className="text-xs text-text-muted">AC</span>
            </div>
          </div>
          {!isPlacementMode && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onTogglePlacementMode}
              className="w-full mt-2 px-3 py-2 bg-primary text-bg-dark rounded text-sm font-medium"
            >
              Enter Placement Mode
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

export default EncounterSpawner;
