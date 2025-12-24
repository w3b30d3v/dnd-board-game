'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Quest, QuestType, QuestObjective, QuestReward, NPC } from '@dnd/shared';
import { EnchantedCard } from '@/components/dnd/EnchantedCard';

interface QuestEditorProps {
  quest: Quest;
  npcs?: NPC[];
  onSave: (updates: Partial<Quest>) => Promise<void>;
  onClose: () => void;
}

const QUEST_TYPE_OPTIONS: { value: QuestType; label: string; color: string; description: string }[] = [
  { value: 'main', label: 'Main Quest', color: 'text-primary', description: 'Core story progression' },
  { value: 'side', label: 'Side Quest', color: 'text-secondary', description: 'Optional adventures' },
  { value: 'personal', label: 'Personal Quest', color: 'text-cyan-400', description: 'Character-specific' },
];

const OBJECTIVE_TYPES = [
  { value: 'kill', label: 'Kill/Defeat', icon: '⚔️' },
  { value: 'collect', label: 'Collect Items', icon: '📦' },
  { value: 'talk', label: 'Talk to NPC', icon: '💬' },
  { value: 'explore', label: 'Explore Location', icon: '🗺️' },
  { value: 'escort', label: 'Escort/Protect', icon: '🛡️' },
  { value: 'custom', label: 'Custom', icon: '✏️' },
];

const REWARD_TYPES = [
  { value: 'xp', label: 'Experience', icon: '⭐' },
  { value: 'gold', label: 'Gold', icon: '💰' },
  { value: 'item', label: 'Item', icon: '🎁' },
  { value: 'reputation', label: 'Reputation', icon: '📈' },
];

type EditorTab = 'basic' | 'objectives' | 'rewards' | 'flow';

export function QuestEditor({ quest, npcs = [], onSave, onClose }: QuestEditorProps) {
  const [name, setName] = useState(quest.name);
  const [description, setDescription] = useState(quest.description || '');
  const [type, setType] = useState<QuestType>(quest.type || 'side');
  const [questGiverId, setQuestGiverId] = useState(quest.questGiverId || '');
  const [recommendedLevel, setRecommendedLevel] = useState(quest.recommendedLevel || 1);
  const [objectives, setObjectives] = useState<QuestObjective[]>(quest.objectives || []);
  const [rewards, setRewards] = useState<QuestReward[]>(quest.rewards || []);

  const [activeTab, setActiveTab] = useState<EditorTab>('basic');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const addObjective = () => {
    const newObjective: QuestObjective = {
      id: `objective_${Date.now()}`,
      description: 'New objective',
      type: 'custom',
      current: 0,
      required: 1,
      completed: false,
      hidden: false,
    };
    setObjectives([...objectives, newObjective]);
    setHasChanges(true);
  };

  const removeObjective = (id: string) => {
    setObjectives(objectives.filter((o) => o.id !== id));
    setHasChanges(true);
  };

  const updateObjective = (id: string, updates: Partial<QuestObjective>) => {
    setObjectives(objectives.map((o) => (o.id === id ? { ...o, ...updates } : o)));
    setHasChanges(true);
  };

  const moveObjective = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= objectives.length) return;
    const newObjectives = [...objectives];
    [newObjectives[index], newObjectives[newIndex]] = [newObjectives[newIndex], newObjectives[index]];
    setObjectives(newObjectives);
    setHasChanges(true);
  };

  const addReward = () => {
    const newReward: QuestReward = {
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

  const updateReward = (id: string, updates: Partial<QuestReward>) => {
    setRewards(rewards.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    setHasChanges(true);
  };

  const getCompletionProgress = (): number => {
    if (objectives.length === 0) return 0;
    const completed = objectives.filter((o) => o.completed).length;
    return Math.round((completed / objectives.length) * 100);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      name,
      description: description || undefined,
      type,
      questGiverId: questGiverId || undefined,
      recommendedLevel,
      objectives,
      rewards,
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
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              type === 'main' ? 'bg-primary/20' :
              type === 'side' ? 'bg-secondary/20' : 'bg-cyan-500/20'
            }`}>
              <span className="text-2xl">📜</span>
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
                placeholder="Quest Name"
              />
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm capitalize ${QUEST_TYPE_OPTIONS.find((t) => t.value === type)?.color}`}>
                  {type} Quest
                </span>
                <span className="text-text-muted">•</span>
                <span className="text-sm text-text-muted">Level {recommendedLevel}+</span>
                <span className="text-text-muted">•</span>
                <span className="text-sm text-success">{getCompletionProgress()}% complete</span>
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
              {saving ? 'Saving...' : 'Save Quest'}
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['basic', 'objectives', 'rewards', 'flow'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/50'
              }`}
            >
              {tab}
              {tab === 'objectives' && objectives.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 rounded-full">{objectives.length}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-text-muted mb-1">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value);
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 rounded bg-bg-elevated border border-border text-text-primary text-sm resize-none focus:border-secondary focus:outline-none"
                        rows={5}
                        placeholder="Describe the quest, its background, and what players need to accomplish..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-text-muted mb-1">Quest Giver</label>
                      <select
                        value={questGiverId}
                        onChange={(e) => {
                          setQuestGiverId(e.target.value);
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 rounded bg-bg-elevated border border-border text-text-primary text-sm focus:border-secondary focus:outline-none"
                      >
                        <option value="">No quest giver</option>
                        {npcs.map((npc) => (
                          <option key={npc.id} value={npc.id}>{npc.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-text-muted mb-1">Recommended Level</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={recommendedLevel}
                        onChange={(e) => {
                          setRecommendedLevel(parseInt(e.target.value) || 1);
                          setHasChanges(true);
                        }}
                        className="w-24 px-3 py-2 rounded bg-bg-elevated border border-border text-text-primary text-sm focus:border-secondary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-muted mb-3">Quest Type</label>
                    <div className="space-y-2">
                      {QUEST_TYPE_OPTIONS.map((option) => (
                        <motion.button
                          key={option.value}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            setType(option.value);
                            setHasChanges(true);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            type === option.value
                              ? 'bg-bg-elevated border-primary/50'
                              : 'bg-bg-primary border-border hover:border-border/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`font-medium ${option.color}`}>{option.label}</span>
                          </div>
                          <span className="text-xs text-text-muted">{option.description}</span>
                        </motion.button>
                      ))}
                    </div>

                    <EnchantedCard className="p-3 mt-4">
                      <h4 className="text-sm font-medium text-text-primary mb-2">Quest Summary</h4>
                      <div className="space-y-1 text-xs text-text-muted">
                        <div className="flex justify-between">
                          <span>Objectives</span>
                          <span>{objectives.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed</span>
                          <span className="text-success">{objectives.filter((o) => o.completed).length}</span>
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

            {activeTab === 'objectives' && (
              <motion.div
                key="objectives"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-text-muted">Quest Objectives</h3>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addObjective}
                    className="px-3 py-1.5 text-xs text-primary border border-primary/50 rounded hover:bg-primary/10 transition-colors"
                  >
                    + Add Objective
                  </motion.button>
                </div>

                {objectives.length === 0 ? (
                  <EnchantedCard className="p-6 text-center">
                    <p className="text-text-muted mb-3">No objectives defined. Add objectives to track quest progress.</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={addObjective}
                      className="btn-magic text-sm"
                    >
                      Add First Objective
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
                        className={`p-4 bg-bg-elevated rounded-lg border ${
                          objective.completed ? 'border-success/50' : 'border-border'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveObjective(index, 'up')}
                              disabled={index === 0}
                              className="text-xs text-text-muted hover:text-text-primary disabled:opacity-30"
                            >
                              ▲
                            </button>
                            <span className="text-xs text-text-muted">{index + 1}</span>
                            <button
                              onClick={() => moveObjective(index, 'down')}
                              disabled={index === objectives.length - 1}
                              className="text-xs text-text-muted hover:text-text-primary disabled:opacity-30"
                            >
                              ▼
                            </button>
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <select
                                value={objective.type}
                                onChange={(e) => updateObjective(objective.id, { type: e.target.value as QuestObjective['type'] })}
                                className="px-2 py-1 rounded bg-bg-primary border border-border text-xs"
                              >
                                {OBJECTIVE_TYPES.map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.icon} {t.label}
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
                            </div>

                            <div className="flex items-center gap-4">
                              {(objective.type === 'kill' || objective.type === 'collect') && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-text-muted">Progress:</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={objective.current || 0}
                                    onChange={(e) => updateObjective(objective.id, { current: parseInt(e.target.value) || 0 })}
                                    className="w-12 px-1 py-0.5 rounded bg-bg-primary border border-border text-center"
                                  />
                                  <span className="text-text-muted">/</span>
                                  <input
                                    type="number"
                                    min={1}
                                    value={objective.required || 1}
                                    onChange={(e) => updateObjective(objective.id, { required: parseInt(e.target.value) || 1 })}
                                    className="w-12 px-1 py-0.5 rounded bg-bg-primary border border-border text-center"
                                  />
                                </div>
                              )}

                              <label className="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={objective.hidden || false}
                                  onChange={(e) => updateObjective(objective.id, { hidden: e.target.checked })}
                                  className="rounded"
                                />
                                <span className="text-text-muted">Hidden</span>
                              </label>

                              <label className="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={objective.completed || false}
                                  onChange={(e) => updateObjective(objective.id, { completed: e.target.checked })}
                                  className="rounded"
                                />
                                <span className={objective.completed ? 'text-success' : 'text-text-muted'}>Complete</span>
                              </label>
                            </div>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeObjective(objective.id)}
                            className="text-danger hover:text-danger/80"
                          >
                            ✕
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Quick Templates */}
                <div>
                  <h4 className="text-xs text-text-muted mb-2">Quick Templates</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { type: 'kill', desc: 'Defeat the boss', req: 1 },
                      { type: 'collect', desc: 'Gather 5 items', req: 5 },
                      { type: 'talk', desc: 'Speak with the contact', req: 1 },
                      { type: 'explore', desc: 'Discover the hidden location', req: 1 },
                    ].map((template, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const newObj: QuestObjective = {
                            id: `objective_${Date.now()}`,
                            type: template.type as QuestObjective['type'],
                            description: template.desc,
                            current: 0,
                            required: template.req,
                            completed: false,
                            hidden: false,
                          };
                          setObjectives([...objectives, newObj]);
                          setHasChanges(true);
                        }}
                        className="px-3 py-1.5 text-xs bg-bg-elevated border border-border rounded hover:border-primary transition-colors"
                      >
                        {template.desc}
                      </motion.button>
                    ))}
                  </div>
                </div>
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
                  <h3 className="text-sm font-medium text-text-muted">Quest Rewards</h3>
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
                    <p className="text-text-muted mb-3">No rewards configured for this quest.</p>
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
                          onChange={(e) => updateReward(reward.id, { type: e.target.value as QuestReward['type'] })}
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
                            placeholder="Item name..."
                          />
                        )}

                        {reward.type === 'reputation' && (
                          <>
                            <input
                              type="text"
                              value={reward.faction || ''}
                              onChange={(e) => updateReward(reward.id, { faction: e.target.value })}
                              className="flex-1 px-2 py-1.5 rounded bg-bg-primary border border-border text-sm text-text-primary focus:border-secondary focus:outline-none"
                              placeholder="Faction name..."
                            />
                            <input
                              type="number"
                              value={reward.amount || 0}
                              onChange={(e) => updateReward(reward.id, { amount: parseInt(e.target.value) || 0 })}
                              className="w-20 px-2 py-1.5 rounded bg-bg-primary border border-border text-sm text-text-primary text-center focus:border-secondary focus:outline-none"
                              placeholder="+/-"
                            />
                          </>
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

                {/* Reward Suggestions */}
                <EnchantedCard className="p-4">
                  <h4 className="text-sm font-medium text-text-primary mb-3">Suggested Rewards by Level</h4>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="text-center p-3 bg-bg-primary rounded">
                      <p className="text-text-muted mb-1">Level 1-4</p>
                      <p className="text-primary font-medium">75-300 XP</p>
                      <p className="text-warning">10-50 GP</p>
                    </div>
                    <div className="text-center p-3 bg-bg-primary rounded">
                      <p className="text-text-muted mb-1">Level 5-10</p>
                      <p className="text-primary font-medium">500-2000 XP</p>
                      <p className="text-warning">100-500 GP</p>
                    </div>
                    <div className="text-center p-3 bg-bg-primary rounded">
                      <p className="text-text-muted mb-1">Level 11+</p>
                      <p className="text-primary font-medium">3000+ XP</p>
                      <p className="text-warning">1000+ GP</p>
                    </div>
                  </div>
                </EnchantedCard>
              </motion.div>
            )}

            {activeTab === 'flow' && (
              <motion.div
                key="flow"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <EnchantedCard className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
                    <span className="text-3xl">🔀</span>
                  </div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">Quest Flow Editor</h3>
                  <p className="text-sm text-text-muted mb-4">
                    Create branching quest paths, prerequisites, and complex quest chains.
                    This visual flow editor will be available in a future update.
                  </p>
                  <p className="text-xs text-text-muted">
                    For now, you can use the objectives tab to create linear quest progression.
                  </p>
                </EnchantedCard>

                {/* Quest Progress Preview */}
                <div>
                  <h4 className="text-sm font-medium text-text-muted mb-3">Current Progress</h4>
                  <div className="space-y-2">
                    {objectives.length === 0 ? (
                      <p className="text-sm text-text-muted">No objectives to display</p>
                    ) : (
                      objectives.map((obj, index) => (
                        <div
                          key={obj.id}
                          className={`flex items-center gap-3 p-2 rounded ${
                            obj.completed ? 'bg-success/10' : 'bg-bg-elevated'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            obj.completed ? 'bg-success text-white' : 'bg-bg-primary text-text-muted'
                          }`}>
                            {obj.completed ? '✓' : index + 1}
                          </span>
                          <span className={`text-sm ${obj.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                            {obj.description}
                          </span>
                          {obj.hidden && (
                            <span className="text-xs text-text-muted">(hidden)</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default QuestEditor;
