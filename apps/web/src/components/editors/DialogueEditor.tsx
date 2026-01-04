'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId?: string;
  condition?: string;
  consequence?: string;
}

export interface DialogueNode {
  id: string;
  type: 'npc' | 'player_choice' | 'narration' | 'skill_check' | 'branch';
  speakerName?: string;
  text: string;
  choices?: DialogueChoice[];
  nextNodeId?: string;
  voiceProfile?: string;
  emotion?: string;
  skillCheck?: {
    skill: string;
    dc: number;
    successNodeId?: string;
    failNodeId?: string;
  };
}

export interface DialogueData {
  id: string;
  name: string;
  description: string;
  npcId?: string;
  startNodeId: string;
  nodes: DialogueNode[];
  tags: string[];
}

export interface DialogueEditorProps {
  initialData?: Partial<DialogueData>;
  campaignId?: string;
  onSave?: (data: DialogueData) => void;
  onCancel?: () => void;
  className?: string;
}

const NODE_TYPES = [
  { id: 'npc', name: 'NPC Line', icon: '💬', color: 'from-blue-500 to-cyan-500' },
  { id: 'player_choice', name: 'Player Choice', icon: '🎯', color: 'from-green-500 to-emerald-500' },
  { id: 'narration', name: 'Narration', icon: '📖', color: 'from-purple-500 to-pink-500' },
  { id: 'skill_check', name: 'Skill Check', icon: '🎲', color: 'from-yellow-500 to-orange-500' },
];

const SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival',
];

const EMOTIONS = [
  'neutral', 'happy', 'angry', 'sad', 'fearful', 'surprised', 'disgusted', 'contempt',
];

export function DialogueEditor({
  initialData,
  campaignId: _campaignId,
  onSave,
  onCancel,
  className,
}: DialogueEditorProps) {
  const [data, setData] = useState<Partial<DialogueData>>({
    id: initialData?.id || `dialogue_${Date.now()}`,
    name: initialData?.name || '',
    description: initialData?.description || '',
    npcId: initialData?.npcId,
    startNodeId: initialData?.startNodeId || '',
    nodes: initialData?.nodes || [],
    tags: initialData?.tags || [],
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'nodes' | 'flow'>('overview');

  const selectedNode = data.nodes?.find(n => n.id === selectedNodeId);

  // Add a new node
  const addNode = useCallback((type: DialogueNode['type']) => {
    const newNode: DialogueNode = {
      id: `node_${Date.now()}`,
      type,
      text: '',
      speakerName: type === 'npc' ? 'NPC' : undefined,
      choices: type === 'player_choice' ? [] : undefined,
      skillCheck: type === 'skill_check' ? { skill: 'Persuasion', dc: 10 } : undefined,
    };

    setData(prev => ({
      ...prev,
      nodes: [...(prev.nodes || []), newNode],
      startNodeId: prev.startNodeId || newNode.id,
    }));
    setSelectedNodeId(newNode.id);
  }, []);

  // Update a node
  const updateNode = useCallback((nodeId: string, updates: Partial<DialogueNode>) => {
    setData(prev => ({
      ...prev,
      nodes: prev.nodes?.map(n => n.id === nodeId ? { ...n, ...updates } : n) || [],
    }));
  }, []);

  // Delete a node
  const deleteNode = useCallback((nodeId: string) => {
    setData(prev => ({
      ...prev,
      nodes: prev.nodes?.filter(n => n.id !== nodeId) || [],
      startNodeId: prev.startNodeId === nodeId
        ? prev.nodes?.find(n => n.id !== nodeId)?.id || ''
        : prev.startNodeId,
    }));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  // Add a choice to a player_choice node
  const addChoice = useCallback((nodeId: string) => {
    const newChoice: DialogueChoice = {
      id: `choice_${Date.now()}`,
      text: 'New choice...',
    };

    setData(prev => ({
      ...prev,
      nodes: prev.nodes?.map(n =>
        n.id === nodeId
          ? { ...n, choices: [...(n.choices || []), newChoice] }
          : n
      ) || [],
    }));
  }, []);

  // Update a choice
  const updateChoice = useCallback((nodeId: string, choiceId: string, updates: Partial<DialogueChoice>) => {
    setData(prev => ({
      ...prev,
      nodes: prev.nodes?.map(n =>
        n.id === nodeId
          ? {
              ...n,
              choices: n.choices?.map(c => c.id === choiceId ? { ...c, ...updates } : c)
            }
          : n
      ) || [],
    }));
  }, []);

  // Delete a choice
  const deleteChoice = useCallback((nodeId: string, choiceId: string) => {
    setData(prev => ({
      ...prev,
      nodes: prev.nodes?.map(n =>
        n.id === nodeId
          ? { ...n, choices: n.choices?.filter(c => c.id !== choiceId) }
          : n
      ) || [],
    }));
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    if (!data.name || !data.nodes?.length) return;
    onSave?.(data as DialogueData);
  }, [data, onSave]);

  const nodeTypeConfig = NODE_TYPES.find(t => t.id === selectedNode?.type);

  return (
    <div className={`bg-bg-card border border-border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-cinzel font-bold text-text-primary">Dialogue Editor</h3>
            <p className="text-xs text-text-muted">Create branching conversations</p>
          </div>
          <span className="px-2 py-1 bg-bg-elevated rounded text-xs text-text-muted">
            {data.nodes?.length || 0} nodes
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['overview', 'nodes', 'flow'] as const).map((tab) => (
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
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Name */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Dialogue Name</label>
                <input
                  type="text"
                  value={data.name || ''}
                  onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Tavern Keeper Introduction"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Description</label>
                <textarea
                  value={data.description || ''}
                  onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="When and why this dialogue triggers..."
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50 h-20 resize-none"
                />
              </div>

              {/* Start Node */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Starting Node</label>
                <select
                  value={data.startNodeId || ''}
                  onChange={(e) => setData(prev => ({ ...prev, startNodeId: e.target.value }))}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                >
                  <option value="">Select a node...</option>
                  {data.nodes?.map(node => (
                    <option key={node.id} value={node.id}>
                      {node.speakerName || node.type}: {node.text.substring(0, 40)}...
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}

          {activeTab === 'nodes' && (
            <motion.div
              key="nodes"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Add Node Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {NODE_TYPES.map(type => (
                  <motion.button
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addNode(type.id as DialogueNode['type'])}
                    className={`p-3 rounded-lg bg-gradient-to-r ${type.color} text-white text-sm font-medium flex items-center gap-2`}
                  >
                    <span>{type.icon}</span>
                    <span>{type.name}</span>
                  </motion.button>
                ))}
              </div>

              {/* Node List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.nodes?.map(node => {
                  const config = NODE_TYPES.find(t => t.id === node.type);
                  return (
                    <motion.button
                      key={node.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedNodeId === node.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-bg-elevated hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>{config?.icon}</span>
                        <span className="text-sm font-medium text-text-primary">
                          {node.speakerName || config?.name}
                        </span>
                        {node.id === data.startNodeId && (
                          <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px]">
                            START
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted truncate">
                        {node.text || 'Empty...'}
                      </p>
                    </motion.button>
                  );
                })}

                {!data.nodes?.length && (
                  <p className="text-center py-8 text-text-muted text-sm">
                    No dialogue nodes yet. Add one above!
                  </p>
                )}
              </div>

              {/* Selected Node Editor */}
              {selectedNode && (
                <div className="p-4 bg-bg-elevated rounded-lg border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <span>{nodeTypeConfig?.icon}</span>
                      Edit {nodeTypeConfig?.name}
                    </h4>
                    <button
                      onClick={() => deleteNode(selectedNode.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Speaker Name (for NPC type) */}
                  {selectedNode.type === 'npc' && (
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Speaker Name</label>
                      <input
                        type="text"
                        value={selectedNode.speakerName || ''}
                        onChange={(e) => updateNode(selectedNode.id, { speakerName: e.target.value })}
                        className="w-full px-2 py-1.5 bg-bg-dark border border-border rounded text-sm text-text-primary"
                      />
                    </div>
                  )}

                  {/* Text Content */}
                  <div>
                    <label className="block text-xs text-text-muted mb-1">
                      {selectedNode.type === 'narration' ? 'Narration Text' : 'Dialogue Text'}
                    </label>
                    <textarea
                      value={selectedNode.text || ''}
                      onChange={(e) => updateNode(selectedNode.id, { text: e.target.value })}
                      className="w-full px-2 py-1.5 bg-bg-dark border border-border rounded text-sm text-text-primary h-20 resize-none"
                    />
                  </div>

                  {/* Emotion */}
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Emotion</label>
                    <select
                      value={selectedNode.emotion || 'neutral'}
                      onChange={(e) => updateNode(selectedNode.id, { emotion: e.target.value })}
                      className="w-full px-2 py-1.5 bg-bg-dark border border-border rounded text-sm text-text-primary"
                    >
                      {EMOTIONS.map(emotion => (
                        <option key={emotion} value={emotion}>
                          {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Skill Check Configuration */}
                  {selectedNode.type === 'skill_check' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-text-muted mb-1">Skill</label>
                        <select
                          value={selectedNode.skillCheck?.skill || 'Persuasion'}
                          onChange={(e) => updateNode(selectedNode.id, {
                            skillCheck: { ...selectedNode.skillCheck!, skill: e.target.value }
                          })}
                          className="w-full px-2 py-1.5 bg-bg-dark border border-border rounded text-sm text-text-primary"
                        >
                          {SKILLS.map(skill => (
                            <option key={skill} value={skill}>{skill}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">DC</label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={selectedNode.skillCheck?.dc || 10}
                          onChange={(e) => updateNode(selectedNode.id, {
                            skillCheck: { ...selectedNode.skillCheck!, dc: parseInt(e.target.value) || 10 }
                          })}
                          className="w-full px-2 py-1.5 bg-bg-dark border border-border rounded text-sm text-text-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* Player Choices */}
                  {selectedNode.type === 'player_choice' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-text-muted">Player Choices</label>
                        <button
                          onClick={() => addChoice(selectedNode.id)}
                          className="text-xs text-primary hover:text-primary/80"
                        >
                          + Add Choice
                        </button>
                      </div>
                      {selectedNode.choices?.map((choice, index) => (
                        <div key={choice.id} className="flex gap-2">
                          <span className="text-xs text-text-muted mt-2">{index + 1}.</span>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={choice.text}
                              onChange={(e) => updateChoice(selectedNode.id, choice.id, { text: e.target.value })}
                              className="w-full px-2 py-1 bg-bg-dark border border-border rounded text-sm text-text-primary"
                            />
                          </div>
                          <button
                            onClick={() => deleteChoice(selectedNode.id, choice.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Next Node (for linear nodes) */}
                  {selectedNode.type !== 'player_choice' && selectedNode.type !== 'skill_check' && (
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Next Node</label>
                      <select
                        value={selectedNode.nextNodeId || ''}
                        onChange={(e) => updateNode(selectedNode.id, { nextNodeId: e.target.value || undefined })}
                        className="w-full px-2 py-1.5 bg-bg-dark border border-border rounded text-sm text-text-primary"
                      >
                        <option value="">(End Dialogue)</option>
                        {data.nodes?.filter(n => n.id !== selectedNode.id).map(node => (
                          <option key={node.id} value={node.id}>
                            {node.speakerName || NODE_TYPES.find(t => t.id === node.type)?.name}: {node.text.substring(0, 30)}...
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'flow' && (
            <motion.div
              key="flow"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Visual flow preview */}
              <div className="bg-bg-elevated rounded-lg p-4 min-h-[200px] border border-border">
                <p className="text-xs text-text-muted mb-4">Dialogue Flow Preview</p>

                {data.nodes?.length ? (
                  <div className="space-y-3">
                    {data.nodes.map((node, index) => {
                      const config = NODE_TYPES.find(t => t.id === node.type);
                      const isStart = node.id === data.startNodeId;

                      return (
                        <div key={node.id} className="flex items-start gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            isStart ? 'bg-green-500 text-white' : 'bg-bg-dark text-text-muted'
                          }`}>
                            {isStart ? '▶' : index + 1}
                          </div>
                          <div className={`flex-1 p-2 rounded border ${
                            isStart ? 'border-green-500/50 bg-green-500/10' : 'border-border bg-bg-dark'
                          }`}>
                            <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
                              <span>{config?.icon}</span>
                              <span>{node.speakerName || config?.name}</span>
                            </div>
                            <p className="text-sm text-text-primary">{node.text || '(empty)'}</p>
                            {node.choices && node.choices.length > 0 && (
                              <div className="mt-2 pl-2 border-l-2 border-border space-y-1">
                                {node.choices.map((choice, i) => (
                                  <p key={choice.id} className="text-xs text-text-secondary">
                                    {i + 1}. {choice.text}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-text-muted text-sm">
                    Add nodes in the Nodes tab to see the flow
                  </div>
                )}
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
          disabled={!data.name || !data.nodes?.length}
          className="px-4 py-2 bg-primary text-bg-dark rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Dialogue
        </motion.button>
      </div>
    </div>
  );
}

export default DialogueEditor;
