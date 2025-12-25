'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type QuestType = 'main' | 'side' | 'personal';
export type ObjectiveStatus = 'incomplete' | 'complete' | 'failed' | 'optional';

export interface QuestObjective {
  id: string;
  description: string;
  status: ObjectiveStatus;
  isOptional: boolean;
  xpReward?: number;
}

export interface QuestReward {
  type: 'gold' | 'item' | 'xp' | 'reputation' | 'other';
  value: string;
  amount?: number;
}

export interface QuestPrerequisite {
  type: 'quest' | 'level' | 'item' | 'reputation' | 'other';
  value: string;
  questId?: string;
}

export interface QuestData {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  prerequisites: QuestPrerequisite[];
  questGiverId?: string;
  questGiverName?: string;
  recommendedLevel?: number;
  hook?: string; // How players discover the quest
  resolution?: string; // How the quest ends
  failureConditions?: string[];
}

export interface QuestEditorProps {
  initialData?: Partial<QuestData>;
  campaignId?: string;
  availableNPCs?: Array<{ id: string; name: string }>;
  availableQuests?: Array<{ id: string; name: string }>;
  onSave?: (data: QuestData) => void;
  onCancel?: () => void;
  className?: string;
}

export function QuestEditor({
  initialData,
  campaignId: _campaignId,
  availableNPCs = [],
  availableQuests = [],
  onSave,
  onCancel,
  className,
}: QuestEditorProps) {
  const [data, setData] = useState<Partial<QuestData>>({
    id: initialData?.id || `quest_${Date.now()}`,
    name: initialData?.name || '',
    description: initialData?.description || '',
    type: initialData?.type || 'side',
    objectives: initialData?.objectives || [],
    rewards: initialData?.rewards || [],
    prerequisites: initialData?.prerequisites || [],
    questGiverId: initialData?.questGiverId || '',
    questGiverName: initialData?.questGiverName || '',
    recommendedLevel: initialData?.recommendedLevel || 1,
    hook: initialData?.hook || '',
    resolution: initialData?.resolution || '',
    failureConditions: initialData?.failureConditions || [],
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'objectives' | 'rewards'>('basic');

  // Objective management
  const addObjective = useCallback(() => {
    setData((prev) => ({
      ...prev,
      objectives: [
        ...(prev.objectives || []),
        {
          id: `obj_${Date.now()}`,
          description: '',
          status: 'incomplete',
          isOptional: false,
        },
      ],
    }));
  }, []);

  const updateObjective = useCallback((id: string, updates: Partial<QuestObjective>) => {
    setData((prev) => ({
      ...prev,
      objectives: prev.objectives?.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      ) || [],
    }));
  }, []);

  const removeObjective = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      objectives: prev.objectives?.filter((obj) => obj.id !== id) || [],
    }));
  }, []);

  // Reward management
  const addReward = useCallback(() => {
    setData((prev) => ({
      ...prev,
      rewards: [
        ...(prev.rewards || []),
        { type: 'gold', value: '100 gold pieces', amount: 100 },
      ],
    }));
  }, []);

  const updateReward = useCallback((index: number, reward: QuestReward) => {
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

  // Prerequisite management
  const addPrerequisite = useCallback(() => {
    setData((prev) => ({
      ...prev,
      prerequisites: [
        ...(prev.prerequisites || []),
        { type: 'level', value: '1' },
      ],
    }));
  }, []);

  const updatePrerequisite = useCallback((index: number, prereq: QuestPrerequisite) => {
    setData((prev) => ({
      ...prev,
      prerequisites: prev.prerequisites?.map((p, i) => (i === index ? prereq : p)) || [],
    }));
  }, []);

  const removePrerequisite = useCallback((index: number) => {
    setData((prev) => ({
      ...prev,
      prerequisites: prev.prerequisites?.filter((_, i) => i !== index) || [],
    }));
  }, []);

  const handleSave = useCallback(() => {
    if (!data.name || !data.objectives?.length) return;
    onSave?.(data as QuestData);
  }, [data, onSave]);

  const totalXP = data.objectives?.reduce((acc, obj) => acc + (obj.xpReward || 0), 0) || 0;
  const totalGold = data.rewards?.reduce((acc, r) => r.type === 'gold' ? acc + (r.amount || 0) : acc, 0) || 0;

  const typeColors: Record<QuestType, string> = {
    main: 'bg-primary/20 text-primary border-primary/30',
    side: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    personal: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className={`bg-bg-card border border-border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-cinzel font-bold text-text-primary">Quest Editor</h3>
            <p className="text-xs text-text-muted">Design epic adventures</p>
          </div>
          {data.type && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${typeColors[data.type]}`}>
              {data.type.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['basic', 'objectives', 'rewards'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'basic' && (
            <motion.div
              key="basic"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Name */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Quest Name</label>
                <input
                  type="text"
                  value={data.name || ''}
                  onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., The Lost Artifact"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Quest Type</label>
                <div className="flex gap-2">
                  {(['main', 'side', 'personal'] as QuestType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setData((prev) => ({ ...prev, type }))}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors border ${
                        data.type === type
                          ? typeColors[type]
                          : 'bg-bg-elevated text-text-secondary hover:bg-border border-border'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Description</label>
                <textarea
                  value={data.description || ''}
                  onChange={(e) => setData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="What is this quest about? What's the story?"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50 h-24 resize-none"
                />
              </div>

              {/* Quest Giver & Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Quest Giver</label>
                  {availableNPCs.length > 0 ? (
                    <select
                      value={data.questGiverId || ''}
                      onChange={(e) => {
                        const npc = availableNPCs.find((n) => n.id === e.target.value);
                        setData((prev) => ({
                          ...prev,
                          questGiverId: e.target.value,
                          questGiverName: npc?.name || '',
                        }));
                      }}
                      className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                    >
                      <option value="">Select NPC...</option>
                      {availableNPCs.map((npc) => (
                        <option key={npc.id} value={npc.id}>{npc.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={data.questGiverName || ''}
                      onChange={(e) => setData((prev) => ({ ...prev, questGiverName: e.target.value }))}
                      placeholder="NPC name..."
                      className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Recommended Level</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={data.recommendedLevel || 1}
                    onChange={(e) => setData((prev) => ({ ...prev, recommendedLevel: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Hook */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Quest Hook</label>
                <textarea
                  value={data.hook || ''}
                  onChange={(e) => setData((prev) => ({ ...prev, hook: e.target.value }))}
                  placeholder="How do players discover this quest?"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50 h-16 resize-none"
                />
              </div>

              {/* Prerequisites */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-text-secondary">Prerequisites</label>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addPrerequisite}
                    className="px-2 py-1 bg-primary/20 text-primary rounded text-xs"
                  >
                    + Add
                  </motion.button>
                </div>
                {data.prerequisites && data.prerequisites.length > 0 ? (
                  <div className="space-y-2">
                    {data.prerequisites.map((prereq, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={prereq.type}
                          onChange={(e) => updatePrerequisite(index, { ...prereq, type: e.target.value as QuestPrerequisite['type'] })}
                          className="px-2 py-1 bg-bg-elevated border border-border rounded text-sm text-text-primary"
                        >
                          <option value="level">Level</option>
                          <option value="quest">Quest</option>
                          <option value="item">Item</option>
                          <option value="reputation">Reputation</option>
                          <option value="other">Other</option>
                        </select>
                        {prereq.type === 'quest' && availableQuests.length > 0 ? (
                          <select
                            value={prereq.questId || ''}
                            onChange={(e) => {
                              const quest = availableQuests.find((q) => q.id === e.target.value);
                              updatePrerequisite(index, { ...prereq, questId: e.target.value, value: quest?.name || '' });
                            }}
                            className="flex-1 px-2 py-1 bg-bg-elevated border border-border rounded text-sm text-text-primary"
                          >
                            <option value="">Select quest...</option>
                            {availableQuests.map((q) => (
                              <option key={q.id} value={q.id}>{q.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={prereq.value}
                            onChange={(e) => updatePrerequisite(index, { ...prereq, value: e.target.value })}
                            placeholder={prereq.type === 'level' ? 'Min level' : 'Requirement...'}
                            className="flex-1 px-2 py-1 bg-bg-elevated border border-border rounded text-sm text-text-primary"
                          />
                        )}
                        <button
                          onClick={() => removePrerequisite(index)}
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
                  <p className="text-xs text-text-muted">No prerequisites</p>
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
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  {data.objectives?.length || 0} objective{(data.objectives?.length || 0) !== 1 ? 's' : ''}
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addObjective}
                  className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-sm"
                >
                  + Add Objective
                </motion.button>
              </div>

              {data.objectives && data.objectives.length > 0 ? (
                <div className="space-y-3">
                  {data.objectives.map((obj, index) => (
                    <motion.div
                      key={obj.id}
                      layout
                      className="p-3 bg-bg-elevated rounded-lg border border-border"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-bg-card text-text-muted text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={obj.description}
                            onChange={(e) => updateObjective(obj.id, { description: e.target.value })}
                            placeholder="Objective description..."
                            className="w-full px-2 py-1 bg-bg-card border border-border rounded text-sm text-text-primary"
                          />
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs text-text-muted">
                              <input
                                type="checkbox"
                                checked={obj.isOptional}
                                onChange={(e) => updateObjective(obj.id, { isOptional: e.target.checked })}
                                className="w-3 h-3 rounded"
                              />
                              Optional
                            </label>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-text-muted">XP:</span>
                              <input
                                type="number"
                                min={0}
                                value={obj.xpReward || 0}
                                onChange={(e) => updateObjective(obj.id, { xpReward: Number(e.target.value) })}
                                className="w-16 px-1 py-0.5 bg-bg-card border border-border rounded text-xs text-text-primary"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeObjective(obj.id)}
                          className="p-1 text-text-muted hover:text-red-400"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-muted mb-2">No objectives yet</p>
                  <p className="text-xs text-text-muted">Add objectives to define what players need to accomplish</p>
                </div>
              )}

              {/* Resolution */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Resolution</label>
                <textarea
                  value={data.resolution || ''}
                  onChange={(e) => setData((prev) => ({ ...prev, resolution: e.target.value }))}
                  placeholder="What happens when the quest is completed?"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50 h-16 resize-none"
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Quest Rewards</p>
                  <p className="text-xs text-text-muted">
                    Total: {totalXP} XP, {totalGold} gold
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addReward}
                  className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-sm"
                >
                  + Add Reward
                </motion.button>
              </div>

              {data.rewards && data.rewards.length > 0 ? (
                <div className="space-y-2">
                  {data.rewards.map((reward, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-bg-elevated rounded-lg">
                      <select
                        value={reward.type}
                        onChange={(e) => updateReward(index, { ...reward, type: e.target.value as QuestReward['type'] })}
                        className="px-2 py-1.5 bg-bg-card border border-border rounded text-sm text-text-primary"
                      >
                        <option value="gold">Gold</option>
                        <option value="xp">XP</option>
                        <option value="item">Item</option>
                        <option value="reputation">Reputation</option>
                        <option value="other">Other</option>
                      </select>
                      {(reward.type === 'gold' || reward.type === 'xp') && (
                        <input
                          type="number"
                          min={0}
                          value={reward.amount || 0}
                          onChange={(e) => updateReward(index, { ...reward, amount: Number(e.target.value), value: `${e.target.value} ${reward.type}` })}
                          className="w-24 px-2 py-1.5 bg-bg-card border border-border rounded text-sm text-text-primary"
                        />
                      )}
                      <input
                        type="text"
                        value={reward.value}
                        onChange={(e) => updateReward(index, { ...reward, value: e.target.value })}
                        placeholder="Reward description..."
                        className="flex-1 px-2 py-1.5 bg-bg-card border border-border rounded text-sm text-text-primary"
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
                <div className="text-center py-8">
                  <p className="text-text-muted mb-2">No rewards yet</p>
                  <p className="text-xs text-text-muted">Add rewards to motivate your players</p>
                </div>
              )}

              {/* Summary */}
              <div className="p-3 bg-bg-elevated rounded-lg border border-primary/30">
                <h4 className="text-sm font-medium text-text-primary mb-2">Reward Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-text-muted">Total XP:</span>
                    <span className="ml-2 text-text-primary font-medium">{totalXP}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Total Gold:</span>
                    <span className="ml-2 text-text-primary font-medium">{totalGold}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Items:</span>
                    <span className="ml-2 text-text-primary font-medium">
                      {data.rewards?.filter((r) => r.type === 'item').length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Other:</span>
                    <span className="ml-2 text-text-primary font-medium">
                      {data.rewards?.filter((r) => r.type === 'other' || r.type === 'reputation').length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
          disabled={!data.name || !data.objectives?.length}
          className="px-4 py-2 bg-primary text-bg-dark rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Quest
        </motion.button>
      </div>
    </div>
  );
}

export default QuestEditor;
