'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type EncounterDifficulty = 'easy' | 'medium' | 'hard' | 'deadly';
export type EncounterType = 'combat' | 'social' | 'exploration' | 'puzzle';

export interface Monster {
  id: string;
  name: string;
  cr: number;
  count: number;
  xp: number;
}

export interface EncounterReward {
  type: 'gold' | 'item' | 'xp' | 'other';
  value: string;
  amount?: number;
}

export interface EncounterData {
  id: string;
  name: string;
  description: string;
  type: EncounterType;
  difficulty: EncounterDifficulty;
  monsters: Monster[];
  rewards: EncounterReward[];
  environment?: string;
  triggers?: string[];
  locationId?: string;
}

export interface EncounterEditorProps {
  initialData?: Partial<EncounterData>;
  campaignId?: string;
  onSave?: (data: EncounterData) => void;
  onCancel?: () => void;
  className?: string;
}

// Common monsters for quick add
const COMMON_MONSTERS = [
  { name: 'Goblin', cr: 0.25, xp: 50 },
  { name: 'Skeleton', cr: 0.25, xp: 50 },
  { name: 'Zombie', cr: 0.25, xp: 50 },
  { name: 'Orc', cr: 0.5, xp: 100 },
  { name: 'Hobgoblin', cr: 0.5, xp: 100 },
  { name: 'Gnoll', cr: 0.5, xp: 100 },
  { name: 'Bugbear', cr: 1, xp: 200 },
  { name: 'Dire Wolf', cr: 1, xp: 200 },
  { name: 'Ogre', cr: 2, xp: 450 },
  { name: 'Owlbear', cr: 3, xp: 700 },
  { name: 'Troll', cr: 5, xp: 1800 },
  { name: 'Young Dragon', cr: 7, xp: 2900 },
];

// XP thresholds by level (for 4 players)
const XP_THRESHOLDS: Record<number, Record<EncounterDifficulty, number>> = {
  1: { easy: 100, medium: 200, hard: 300, deadly: 400 },
  2: { easy: 150, medium: 300, hard: 450, deadly: 600 },
  3: { easy: 225, medium: 450, hard: 675, deadly: 1000 },
  4: { easy: 350, medium: 625, hard: 875, deadly: 1250 },
  5: { easy: 500, medium: 1000, hard: 1500, deadly: 2000 },
  // Add more levels as needed
};

export function EncounterEditor({
  initialData,
  campaignId: _campaignId,
  onSave,
  onCancel,
  className,
}: EncounterEditorProps) {
  const [data, setData] = useState<Partial<EncounterData>>({
    id: initialData?.id || `encounter_${Date.now()}`,
    name: initialData?.name || '',
    description: initialData?.description || '',
    type: initialData?.type || 'combat',
    difficulty: initialData?.difficulty || 'medium',
    monsters: initialData?.monsters || [],
    rewards: initialData?.rewards || [],
    environment: initialData?.environment || '',
    triggers: initialData?.triggers || [],
  });

  const [partyLevel, setPartyLevel] = useState(3);
  const [partySize, setPartySize] = useState(4);
  const [showMonsterPicker, setShowMonsterPicker] = useState(false);
  const [customMonster, setCustomMonster] = useState({ name: '', cr: 1, count: 1 });

  // Calculate total XP
  const totalXP = data.monsters?.reduce((acc, m) => acc + m.xp * m.count, 0) || 0;

  // Calculate difficulty based on XP
  const calculateDifficulty = useCallback((): EncounterDifficulty => {
    const thresholds = XP_THRESHOLDS[partyLevel] || XP_THRESHOLDS[5];
    const adjustedThresholds = {
      easy: thresholds.easy * (partySize / 4),
      medium: thresholds.medium * (partySize / 4),
      hard: thresholds.hard * (partySize / 4),
      deadly: thresholds.deadly * (partySize / 4),
    };

    if (totalXP >= adjustedThresholds.deadly) return 'deadly';
    if (totalXP >= adjustedThresholds.hard) return 'hard';
    if (totalXP >= adjustedThresholds.medium) return 'medium';
    return 'easy';
  }, [totalXP, partyLevel, partySize]);

  const calculatedDifficulty = calculateDifficulty();

  const addMonster = useCallback((monster: { name: string; cr: number; xp: number }, count = 1) => {
    setData((prev) => ({
      ...prev,
      monsters: [
        ...(prev.monsters || []),
        {
          id: `monster_${Date.now()}`,
          name: monster.name,
          cr: monster.cr,
          xp: monster.xp,
          count,
        },
      ],
    }));
  }, []);

  const updateMonsterCount = useCallback((id: string, count: number) => {
    if (count <= 0) {
      setData((prev) => ({
        ...prev,
        monsters: prev.monsters?.filter((m) => m.id !== id) || [],
      }));
    } else {
      setData((prev) => ({
        ...prev,
        monsters: prev.monsters?.map((m) => (m.id === id ? { ...m, count } : m)) || [],
      }));
    }
  }, []);

  const removeMonster = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      monsters: prev.monsters?.filter((m) => m.id !== id) || [],
    }));
  }, []);

  const addReward = useCallback(() => {
    setData((prev) => ({
      ...prev,
      rewards: [
        ...(prev.rewards || []),
        { type: 'gold', value: '50 gold pieces', amount: 50 },
      ],
    }));
  }, []);

  const updateReward = useCallback((index: number, reward: EncounterReward) => {
    setData((prev) => ({
      ...prev,
      rewards: prev.rewards?.map((r, i) => (i === index ? reward : r)) || [],
    }));
  }, []);

  const removeReward = useCallback((index: number) => {
    setData((prev) => ({
      ...prev,
      rewards: prev.rewards?.filter((_, i) => i !== index) || [],
    }));
  }, []);

  const handleSave = useCallback(() => {
    if (!data.name) return;
    onSave?.({
      ...data,
      difficulty: calculatedDifficulty,
    } as EncounterData);
  }, [data, calculatedDifficulty, onSave]);

  const difficultyColors: Record<EncounterDifficulty, string> = {
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    deadly: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className={`bg-bg-card border border-border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-cinzel font-bold text-text-primary">Encounter Editor</h3>
            <p className="text-xs text-text-muted">Build balanced combat encounters</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Encounter Name</label>
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Goblin Ambush"
              className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Description</label>
            <textarea
              value={data.description || ''}
              onChange={(e) => setData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the encounter setup, tactics, and narrative..."
              className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50 h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Encounter Type</label>
              <select
                value={data.type || 'combat'}
                onChange={(e) => setData((prev) => ({ ...prev, type: e.target.value as EncounterType }))}
                className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
              >
                <option value="combat">Combat</option>
                <option value="social">Social</option>
                <option value="exploration">Exploration</option>
                <option value="puzzle">Puzzle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">Environment</label>
              <input
                type="text"
                value={data.environment || ''}
                onChange={(e) => setData((prev) => ({ ...prev, environment: e.target.value }))}
                placeholder="e.g., Dark Forest"
                className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Party Settings */}
        <div className="p-3 bg-bg-elevated rounded-lg">
          <h4 className="text-sm font-medium text-text-primary mb-3">Party Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">Party Level</label>
              <input
                type="number"
                min={1}
                max={20}
                value={partyLevel}
                onChange={(e) => setPartyLevel(Number(e.target.value))}
                className="w-full px-2 py-1 bg-bg-card border border-border rounded text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Party Size</label>
              <input
                type="number"
                min={1}
                max={10}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="w-full px-2 py-1 bg-bg-card border border-border rounded text-sm text-text-primary"
              />
            </div>
          </div>
        </div>

        {/* Monsters */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-text-primary">Monsters</h4>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowMonsterPicker(true)}
              className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm"
            >
              + Add Monster
            </motion.button>
          </div>

          {data.monsters && data.monsters.length > 0 ? (
            <div className="space-y-2">
              {data.monsters.map((monster) => (
                <div
                  key={monster.id}
                  className="flex items-center gap-3 p-2 bg-bg-elevated rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{monster.name}</p>
                    <p className="text-xs text-text-muted">CR {monster.cr} &bull; {monster.xp} XP each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateMonsterCount(monster.id, monster.count - 1)}
                      className="w-6 h-6 rounded bg-bg-card text-text-secondary hover:text-text-primary"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm text-text-primary">{monster.count}</span>
                    <button
                      onClick={() => updateMonsterCount(monster.id, monster.count + 1)}
                      className="w-6 h-6 rounded bg-bg-card text-text-secondary hover:text-text-primary"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeMonster(monster.id)}
                      className="p-1 text-text-muted hover:text-red-400"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-4">No monsters added yet</p>
          )}

          {/* Difficulty indicator */}
          <div className="mt-4 p-3 rounded-lg border bg-bg-elevated">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total XP: <span className="text-text-primary font-medium">{totalXP}</span></p>
                <p className="text-xs text-text-muted">Adjusted for {partySize} level {partyLevel} players</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${difficultyColors[calculatedDifficulty]}`}>
                {calculatedDifficulty.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-text-primary">Rewards</h4>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={addReward}
              className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm"
            >
              + Add Reward
            </motion.button>
          </div>

          {data.rewards && data.rewards.length > 0 ? (
            <div className="space-y-2">
              {data.rewards.map((reward, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-bg-elevated rounded-lg">
                  <select
                    value={reward.type}
                    onChange={(e) => updateReward(index, { ...reward, type: e.target.value as EncounterReward['type'] })}
                    className="px-2 py-1 bg-bg-card border border-border rounded text-sm text-text-primary"
                  >
                    <option value="gold">Gold</option>
                    <option value="item">Item</option>
                    <option value="xp">XP</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="text"
                    value={reward.value}
                    onChange={(e) => updateReward(index, { ...reward, value: e.target.value })}
                    className="flex-1 px-2 py-1 bg-bg-card border border-border rounded text-sm text-text-primary"
                    placeholder="Reward description..."
                  />
                  <button
                    onClick={() => removeReward(index)}
                    className="p-1 text-text-muted hover:text-red-400"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-4">No rewards added yet</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border flex justify-end gap-3">
        {onCancel && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="px-4 py-2 bg-bg-elevated text-text-secondary rounded-lg"
          >
            Cancel
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={!data.name}
          className="px-4 py-2 bg-primary text-bg-dark rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Encounter
        </motion.button>
      </div>

      {/* Monster picker modal */}
      <AnimatePresence>
        {showMonsterPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setShowMonsterPicker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-bg-card border border-border rounded-lg p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-medium text-text-primary mb-4">Add Monster</h3>

              {/* Common monsters */}
              <div className="mb-4">
                <p className="text-xs text-text-muted mb-2">Quick Add</p>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {COMMON_MONSTERS.map((monster) => (
                    <motion.button
                      key={monster.name}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        addMonster(monster);
                        setShowMonsterPicker(false);
                      }}
                      className="p-2 bg-bg-elevated rounded-lg text-left hover:bg-border"
                    >
                      <p className="text-xs font-medium text-text-primary">{monster.name}</p>
                      <p className="text-[10px] text-text-muted">CR {monster.cr}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom monster */}
              <div className="border-t border-border pt-4">
                <p className="text-xs text-text-muted mb-2">Custom Monster</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customMonster.name}
                    onChange={(e) => setCustomMonster((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Monster name"
                    className="w-full px-2 py-1.5 bg-bg-elevated border border-border rounded text-sm text-text-primary"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customMonster.cr}
                      onChange={(e) => setCustomMonster((prev) => ({ ...prev, cr: Number(e.target.value) }))}
                      placeholder="CR"
                      className="w-20 px-2 py-1.5 bg-bg-elevated border border-border rounded text-sm text-text-primary"
                    />
                    <input
                      type="number"
                      value={customMonster.count}
                      onChange={(e) => setCustomMonster((prev) => ({ ...prev, count: Number(e.target.value) }))}
                      placeholder="Count"
                      className="w-20 px-2 py-1.5 bg-bg-elevated border border-border rounded text-sm text-text-primary"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (customMonster.name) {
                          addMonster(
                            { name: customMonster.name, cr: customMonster.cr, xp: Math.floor(customMonster.cr * 200) },
                            customMonster.count
                          );
                          setCustomMonster({ name: '', cr: 1, count: 1 });
                          setShowMonsterPicker(false);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-primary text-bg-dark rounded text-sm font-medium"
                    >
                      Add
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EncounterEditor;
