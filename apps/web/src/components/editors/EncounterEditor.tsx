'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Encounter, EncounterDifficulty, PlacedMonster, EncounterObjective, EncounterReward, GameMap } from '@dnd/shared';
import { EnchantedCard } from '@/components/dnd/EnchantedCard';
import { SwordIcon } from '@/components/dnd/DnDIcons';

interface EncounterEditorProps {
  encounter: Encounter;
  maps?: GameMap[];
  onSave: (updates: Partial<Encounter>) => Promise<void>;
  onClose: () => void;
}

const DIFFICULTY_OPTIONS: { value: EncounterDifficulty; label: string; color: string; description: string }[] = [
  { value: 'trivial', label: 'Trivial', color: 'text-text-muted', description: 'No real threat' },
  { value: 'easy', label: 'Easy', color: 'text-success', description: 'Minor challenge' },
  { value: 'medium', label: 'Medium', color: 'text-warning', description: 'Fair fight' },
  { value: 'hard', label: 'Hard', color: 'text-orange-500', description: 'Tough battle' },
  { value: 'deadly', label: 'Deadly', color: 'text-danger', description: 'May cause deaths' },
];

const OBJECTIVE_TYPES = [
  { value: 'defeat_all', label: 'Defeat All Enemies', icon: '⚔️' },
  { value: 'defeat_target', label: 'Defeat Target', icon: '🎯' },
  { value: 'survive', label: 'Survive X Rounds', icon: '⏱️' },
  { value: 'protect', label: 'Protect Target', icon: '🛡️' },
  { value: 'reach', label: 'Reach Location', icon: '📍' },
  { value: 'custom', label: 'Custom Objective', icon: '✏️' },
];

const REWARD_TYPES = [
  { value: 'xp', label: 'Experience', icon: '⭐' },
  { value: 'gold', label: 'Gold', icon: '💰' },
  { value: 'item', label: 'Item', icon: '🎁' },
  { value: 'quest', label: 'Quest Progress', icon: '📜' },
];

// Common D&D monsters for quick add
const MONSTER_PRESETS = [
  { name: 'Goblin', cr: '1/4', hp: 7 },
  { name: 'Skeleton', cr: '1/4', hp: 13 },
  { name: 'Zombie', cr: '1/4', hp: 22 },
  { name: 'Wolf', cr: '1/4', hp: 11 },
  { name: 'Orc', cr: '1/2', hp: 15 },
  { name: 'Hobgoblin', cr: '1/2', hp: 11 },
  { name: 'Bugbear', cr: '1', hp: 27 },
  { name: 'Ogre', cr: '2', hp: 59 },
  { name: 'Owlbear', cr: '3', hp: 59 },
  { name: 'Troll', cr: '5', hp: 84 },
];

type EditorTab = 'basic' | 'monsters' | 'objectives' | 'rewards';

export function EncounterEditor({ encounter, maps = [], onSave, onClose }: EncounterEditorProps) {
  const [name, setName] = useState(encounter.name);
  const [description, setDescription] = useState(encounter.description || '');
  const [difficulty, setDifficulty] = useState<EncounterDifficulty>(encounter.difficulty || 'medium');
  const [mapId, setMapId] = useState(encounter.mapId || '');
  const [monsters, setMonsters] = useState<PlacedMonster[]>(encounter.monsters || []);
  const [objectives, setObjectives] = useState<EncounterObjective[]>(encounter.objectives || []);
  const [rewards, setRewards] = useState<EncounterReward[]>(encounter.rewards || []);
  const [recommendedLevel, setRecommendedLevel] = useState(encounter.recommendedLevel || { min: 1, max: 5 });

  const [activeTab, setActiveTab] = useState<EditorTab>('basic');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const addMonster = (preset?: typeof MONSTER_PRESETS[0]) => {
    const newMonster: PlacedMonster = {
      id: `monster_${Date.now()}`,
      monsterId: '',
      name: preset?.name || 'New Monster',
      x: 0,
      y: 0,
      hp: preset?.hp || 10,
      maxHp: preset?.hp || 10,
      conditions: [],
    };
    setMonsters([...monsters, newMonster]);
    setHasChanges(true);
  };

  const removeMonster = (id: string) => {
    setMonsters(monsters.filter((m) => m.id !== id));
    setHasChanges(true);
  };

  const updateMonster = (id: string, updates: Partial<PlacedMonster>) => {
    setMonsters(monsters.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    setHasChanges(true);
  };

  const addObjective = () => {
    const newObjective: EncounterObjective = {
      id: `objective_${Date.now()}`,
      type: 'defeat_all',
      description: 'Defeat all enemies',
      completed: false,
    };
    setObjectives([...objectives, newObjective]);
    setHasChanges(true);
  };

  const removeObjective = (id: string) => {
    setObjectives(objectives.filter((o) => o.id !== id));
    setHasChanges(true);
  };

  const updateObjective = (id: string, updates: Partial<EncounterObjective>) => {
    setObjectives(objectives.map((o) => (o.id === id ? { ...o, ...updates } : o)));
    setHasChanges(true);
  };

  const addReward = () => {
    const newReward: EncounterReward = {
      id: `reward_${Date.now()}`,
      type: 'xp',
      amount: 100,
    };
    setRewards([...rewards, newReward]);
    setHasChanges(true);
  };

  const removeReward = (id: string) => {
    setRewards(rewards.filter((r) => r.id !== id));
    setHasChanges(true);
  };

  const updateReward = (id: string, updates: Partial<EncounterReward>) => {
    setRewards(rewards.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    setHasChanges(true);
  };

  const calculateXP = (): number => {
    // Simple XP calculation based on monster count and difficulty
    const baseXP = monsters.length * 50;
    const multipliers: Record<EncounterDifficulty, number> = {
      trivial: 0.5,
      easy: 1,
      medium: 1.5,
      hard: 2,
      deadly: 3,
    };
    return Math.round(baseXP * multipliers[difficulty]);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      name,
      description: description || undefined,
      difficulty,
      mapId: mapId || undefined,
      monsters,
      objectives,
      rewards,
      recommendedLevel,
    });
    setSaving(false);
    setHasChanges(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-4xl max-h-[90vh] bg-bg-card rounded-xl border border-border overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-danger/20 flex items-center justify-center">
              <SwordIcon size={24} color="#EF4444" />
            </div>
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setHasChanges(true);
                }}
                className="bg-transparent text-xl font-cinzel font-bold text-text-primary border-b border-transparent hover:border-border focus:border-secondary focus:outline-none"
                placeholder="Encounter Name"
              />
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm ${DIFFICULTY_OPTIONS.find((d) => d.value === difficulty)?.color}`}>
                  {DIFFICULTY_OPTIONS.find((d) => d.value === difficulty)?.label}
                </span>
                <span className="text-text-muted">•</span>
                <span className="text-sm text-text-muted">{monsters.length} monsters</span>
                <span className="text-text-muted">•</span>
                <span className="text-sm text-warning">{calculateXP()} XP</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && <span className="text-xs text-warning">Unsaved</span>}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="btn-magic text-sm px-4 py-2"
            >
              {saving ? 'Saving...' : 'Save Encounter'}
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['basic', 'monsters', 'objectives', 'rewards'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'text-danger border-b-2 border-danger bg-danger/5'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/50'
              }`}
            >
              {tab}
              {tab === 'monsters' && monsters.length > 0 && (
                <span className="ml-1 text-xs bg-danger/20 text-danger px-1.5 rounded-full">{monsters.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'basic' && (
              <motion.div
                key="basic"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm text-text-muted mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 rounded bg-bg-elevated border border-border text-text-primary text-sm resize-none focus:border-secondary focus:outline-none"
                    rows={4}
                    placeholder="Describe the encounter setting, enemy tactics, and any special circumstances..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-text-muted mb-3">Difficulty</label>
                    <div className="space-y-2">
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <motion.button
                          key={option.value}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            setDifficulty(option.value);
                            setHasChanges(true);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            difficulty === option.value
                              ? 'bg-bg-elevated border-danger/50'
                              : 'bg-bg-primary border-border hover:border-border/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${option.color}`}>{option.label}</span>
                          </div>
                          <span className="text-xs text-text-muted">{option.description}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-text-muted mb-1">Map</label>
                      <select
                        value={mapId}
                        onChange={(e) => {
                          setMapId(e.target.value);
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 rounded bg-bg-elevated border border-border text-text-primary text-sm focus:border-secondary focus:outline-none"
                      >
                        <option value="">No map selected</option>
                        {maps.map((map) => (
                          <option key={map.id} value={map.id}>{map.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-text-muted mb-1">Recommended Level</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={recommendedLevel.min}
                          onChange={(e) => {
                            setRecommendedLevel({ ...recommendedLevel, min: parseInt(e.target.value) || 1 });
                            setHasChanges(true);
                          }}
                          className="w-16 px-2 py-1 rounded bg-bg-elevated border border-border text-text-primary text-center"
                        />
                        <span className="text-text-muted">to</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={recommendedLevel.max}
                          onChange={(e) => {
                            setRecommendedLevel({ ...recommendedLevel, max: parseInt(e.target.value) || 5 });
                            setHasChanges(true);
                          }}
                          className="w-16 px-2 py-1 rounded bg-bg-elevated border border-border text-text-primary text-center"
                        />
                      </div>
                    </div>

                    <EnchantedCard className="p-3">
                      <h4 className="text-sm font-medium text-text-primary mb-2">Encounter Summary</h4>
                      <div className="space-y-1 text-xs text-text-muted">
                        <div className="flex justify-between">
                          <span>Total Monsters</span>
                          <span>{monsters.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated XP</span>
                          <span className="text-warning">{calculateXP()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Objectives</span>
                          <span>{objectives.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rewards</span>
                          <span>{rewards.length}</span>
                        </div>
                      </div>
                    </EnchantedCard>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'monsters' && (
              <motion.div
                key="monsters"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Quick Add Monsters */}
                <div>
                  <h3 className="text-sm font-medium text-text-muted mb-3">Quick Add</h3>
                  <div className="flex flex-wrap gap-2">
                    {MONSTER_PRESETS.map((preset) => (
                      <motion.button
                        key={preset.name}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => addMonster(preset)}
                        className="px-3 py-1.5 text-xs bg-bg-elevated border border-border rounded hover:border-danger transition-colors"
                      >
                        {preset.name} (CR {preset.cr})
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Monster List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-text-muted">Monsters ({monsters.length})</h3>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addMonster()}
                      className="px-3 py-1.5 text-xs text-danger border border-danger/50 rounded hover:bg-danger/10 transition-colors"
                    >
                      + Add Custom
                    </motion.button>
                  </div>

                  {monsters.length === 0 ? (
                    <EnchantedCard className="p-6 text-center">
                      <p className="text-text-muted">No monsters added yet. Use quick add or create custom monsters.</p>
                    </EnchantedCard>
                  ) : (
                    <div className="space-y-2">
                      {monsters.map((monster, index) => (
                        <motion.div
                          key={monster.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg border border-border"
                        >
                          <div className="w-10 h-10 rounded bg-danger/20 flex items-center justify-center text-xl">
                            👹
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={monster.name}
                              onChange={(e) => updateMonster(monster.id, { name: e.target.value })}
                              className="bg-transparent text-sm font-medium text-text-primary focus:outline-none border-b border-transparent hover:border-border focus:border-secondary"
                            />
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-text-muted">
                                HP:
                                <input
                                  type="number"
                                  min={1}
                                  value={monster.hp || 10}
                                  onChange={(e) => updateMonster(monster.id, {
                                    hp: parseInt(e.target.value) || 10,
                                    maxHp: parseInt(e.target.value) || 10,
                                  })}
                                  className="w-12 ml-1 px-1 bg-bg-primary rounded text-center text-success"
                                />
                              </span>
                              <span className="text-xs text-text-muted">
                                Pos:
                                <input
                                  type="number"
                                  min={0}
                                  value={monster.x}
                                  onChange={(e) => updateMonster(monster.id, { x: parseInt(e.target.value) || 0 })}
                                  className="w-10 ml-1 px-1 bg-bg-primary rounded text-center"
                                />
                                ,
                                <input
                                  type="number"
                                  min={0}
                                  value={monster.y}
                                  onChange={(e) => updateMonster(monster.id, { y: parseInt(e.target.value) || 0 })}
                                  className="w-10 ml-1 px-1 bg-bg-primary rounded text-center"
                                />
                              </span>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeMonster(monster.id)}
                            className="text-danger hover:text-danger/80"
                          >
                            ✕
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'objectives' && (
              <motion.div
                key="objectives"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-text-muted">Victory Conditions</h3>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addObjective}
                    className="px-3 py-1.5 text-xs text-secondary border border-secondary/50 rounded hover:bg-secondary/10 transition-colors"
                  >
                    + Add Objective
                  </motion.button>
                </div>

                {objectives.length === 0 ? (
                  <EnchantedCard className="p-6 text-center">
                    <p className="text-text-muted mb-3">No objectives set. Default is to defeat all enemies.</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={addObjective}
                      className="btn-magic text-sm"
                    >
                      Add Objective
                    </motion.button>
                  </EnchantedCard>
                ) : (
                  <div className="space-y-3">
                    {objectives.map((objective, index) => (
                      <motion.div
                        key={objective.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-bg-elevated rounded-lg border border-border"
                      >
                        <div className="flex items-start gap-3">
                          <select
                            value={objective.type}
                            onChange={(e) => updateObjective(objective.id, { type: e.target.value as EncounterObjective['type'] })}
                            className="px-2 py-1 rounded bg-bg-primary border border-border text-sm"
                          >
                            {OBJECTIVE_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.icon} {type.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={objective.description}
                            onChange={(e) => updateObjective(objective.id, { description: e.target.value })}
                            className="flex-1 px-2 py-1 rounded bg-bg-primary border border-border text-sm text-text-primary focus:border-secondary focus:outline-none"
                            placeholder="Objective description..."
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeObjective(objective.id)}
                            className="text-danger hover:text-danger/80"
                          >
                            ✕
                          </motion.button>
                        </div>
                        {objective.type === 'survive' && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-text-muted">Survive for</span>
                            <input
                              type="number"
                              min={1}
                              value={objective.turns || 5}
                              onChange={(e) => updateObjective(objective.id, { turns: parseInt(e.target.value) || 5 })}
                              className="w-12 px-1 py-0.5 rounded bg-bg-primary border border-border text-center text-sm"
                            />
                            <span className="text-xs text-text-muted">rounds</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'rewards' && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-text-muted">Encounter Rewards</h3>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addReward}
                    className="px-3 py-1.5 text-xs text-primary border border-primary/50 rounded hover:bg-primary/10 transition-colors"
                  >
                    + Add Reward
                  </motion.button>
                </div>

                {rewards.length === 0 ? (
                  <EnchantedCard className="p-6 text-center">
                    <p className="text-text-muted mb-3">No rewards configured.</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={addReward}
                      className="btn-magic text-sm"
                    >
                      Add Reward
                    </motion.button>
                  </EnchantedCard>
                ) : (
                  <div className="space-y-3">
                    {rewards.map((reward, index) => (
                      <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg border border-border"
                      >
                        <select
                          value={reward.type}
                          onChange={(e) => updateReward(reward.id, { type: e.target.value as EncounterReward['type'] })}
                          className="px-2 py-1.5 rounded bg-bg-primary border border-border text-sm"
                        >
                          {REWARD_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </select>
                        {(reward.type === 'xp' || reward.type === 'gold') && (
                          <input
                            type="number"
                            min={0}
                            value={reward.amount || 0}
                            onChange={(e) => updateReward(reward.id, { amount: parseInt(e.target.value) || 0 })}
                            className="w-24 px-2 py-1.5 rounded bg-bg-primary border border-border text-sm text-text-primary text-center focus:border-secondary focus:outline-none"
                            placeholder="Amount"
                          />
                        )}
                        {reward.type === 'item' && (
                          <input
                            type="text"
                            value={reward.description || ''}
                            onChange={(e) => updateReward(reward.id, { description: e.target.value })}
                            className="flex-1 px-2 py-1.5 rounded bg-bg-primary border border-border text-sm text-text-primary focus:border-secondary focus:outline-none"
                            placeholder="Item name or description..."
                          />
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeReward(reward.id)}
                          className="text-danger hover:text-danger/80"
                        >
                          ✕
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Auto-calculate XP suggestion */}
                <EnchantedCard className="p-4">
                  <h4 className="text-sm font-medium text-text-primary mb-2">Suggested XP</h4>
                  <p className="text-xs text-text-muted mb-3">
                    Based on {monsters.length} monsters at {difficulty} difficulty
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-warning">{calculateXP()} XP</span>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const existingXP = rewards.find((r) => r.type === 'xp');
                        if (existingXP) {
                          updateReward(existingXP.id, { amount: calculateXP() });
                        } else {
                          setRewards([...rewards, { id: `reward_${Date.now()}`, type: 'xp', amount: calculateXP() }]);
                          setHasChanges(true);
                        }
                      }}
                      className="text-xs text-secondary hover:underline"
                    >
                      Use this value
                    </motion.button>
                  </div>
                </EnchantedCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default EncounterEditor;
