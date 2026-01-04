'use client';

/**
 * AbilityCheckPrompt
 * DM tool for prompting ability checks and saving throws
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Zap,
  Heart,
  Brain,
  Eye,
  Sparkles,
  Shield,
  X,
  Dice6,
  Users,
  User,
} from 'lucide-react';
import type { Creature } from '@/game/types';

// Ability types
type Ability = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

// Ability display info
const ABILITIES: Array<{
  id: Ability;
  name: string;
  fullName: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  skills: string[];
}> = [
  {
    id: 'STR',
    name: 'STR',
    fullName: 'Strength',
    icon: Dumbbell,
    color: '#EF4444',
    skills: ['Athletics'],
  },
  {
    id: 'DEX',
    name: 'DEX',
    fullName: 'Dexterity',
    icon: Zap,
    color: '#22C55E',
    skills: ['Acrobatics', 'Sleight of Hand', 'Stealth'],
  },
  {
    id: 'CON',
    name: 'CON',
    fullName: 'Constitution',
    icon: Heart,
    color: '#F59E0B',
    skills: [], // No skills
  },
  {
    id: 'INT',
    name: 'INT',
    fullName: 'Intelligence',
    icon: Brain,
    color: '#3B82F6',
    skills: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'],
  },
  {
    id: 'WIS',
    name: 'WIS',
    fullName: 'Wisdom',
    icon: Eye,
    color: '#8B5CF6',
    skills: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'],
  },
  {
    id: 'CHA',
    name: 'CHA',
    fullName: 'Charisma',
    icon: Sparkles,
    color: '#EC4899',
    skills: ['Deception', 'Intimidation', 'Performance', 'Persuasion'],
  },
];

// Common DCs
const COMMON_DCS = [
  { value: 5, label: 'Very Easy' },
  { value: 10, label: 'Easy' },
  { value: 15, label: 'Medium' },
  { value: 20, label: 'Hard' },
  { value: 25, label: 'Very Hard' },
  { value: 30, label: 'Nearly Impossible' },
];

export type CheckType = 'ability' | 'skill' | 'saving_throw';

export interface CheckRequest {
  type: CheckType;
  ability: Ability;
  skill?: string;
  dc: number;
  description: string;
  targetCreatureIds: string[];
  advantage?: boolean;
  disadvantage?: boolean;
}

interface AbilityCheckPromptProps {
  isOpen: boolean;
  onClose: () => void;
  creatures: Creature[];
  selectedCreatureIds?: string[];
  onRequestCheck: (request: CheckRequest) => void;
}

export function AbilityCheckPrompt({
  isOpen,
  onClose,
  creatures,
  selectedCreatureIds = [],
  onRequestCheck,
}: AbilityCheckPromptProps) {
  const [checkType, setCheckType] = useState<CheckType>('ability');
  const [selectedAbility, setSelectedAbility] = useState<Ability>('STR');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [dc, setDc] = useState(15);
  const [description, setDescription] = useState('');
  const [targetIds, setTargetIds] = useState<string[]>(selectedCreatureIds);
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Get available skills for selected ability
  const availableSkills = ABILITIES.find((a) => a.id === selectedAbility)?.skills || [];

  // Toggle creature selection
  const toggleCreature = useCallback((creatureId: string) => {
    setTargetIds((prev) =>
      prev.includes(creatureId)
        ? prev.filter((id) => id !== creatureId)
        : [...prev, creatureId]
    );
  }, []);

  // Select all creatures
  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setTargetIds([]);
    } else {
      setTargetIds(creatures.filter((c) => c.type === 'character').map((c) => c.id));
    }
    setSelectAll(!selectAll);
  }, [selectAll, creatures]);

  // Submit check request
  const handleSubmit = useCallback(() => {
    if (targetIds.length === 0) return;

    onRequestCheck({
      type: checkType,
      ability: selectedAbility,
      skill: checkType === 'skill' ? selectedSkill || undefined : undefined,
      dc,
      description,
      targetCreatureIds: targetIds,
      advantage: advantage && !disadvantage ? true : undefined,
      disadvantage: disadvantage && !advantage ? true : undefined,
    });

    // Reset form
    setDescription('');
    setTargetIds([]);
    setAdvantage(false);
    setDisadvantage(false);
    onClose();
  }, [checkType, selectedAbility, selectedSkill, dc, description, targetIds, advantage, disadvantage, onRequestCheck, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl max-h-[90vh] bg-gradient-to-b from-[#1E1B26] to-[#0d0a14] rounded-xl border border-blue-500/30 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-blue-500/20 bg-blue-900/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Dice6 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Request Check</h2>
                <p className="text-sm text-gray-400">
                  Prompt players for ability checks or saving throws
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
            {/* Check Type Selection */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Check Type</label>
              <div className="flex gap-2">
                {[
                  { id: 'ability', label: 'Ability Check', icon: Brain },
                  { id: 'skill', label: 'Skill Check', icon: Eye },
                  { id: 'saving_throw', label: 'Saving Throw', icon: Shield },
                ].map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setCheckType(type.id as CheckType);
                        setSelectedSkill(null);
                      }}
                      className={`flex-1 p-3 rounded-lg border transition-colors flex flex-col items-center gap-1 ${
                        checkType === type.id
                          ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ability Selection */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Ability</label>
              <div className="grid grid-cols-6 gap-2">
                {ABILITIES.map((ability) => {
                  const Icon = ability.icon;
                  return (
                    <button
                      key={ability.id}
                      onClick={() => {
                        setSelectedAbility(ability.id);
                        setSelectedSkill(null);
                      }}
                      className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-1 ${
                        selectedAbility === ability.id
                          ? 'border-2'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      style={{
                        borderColor: selectedAbility === ability.id ? ability.color : undefined,
                        backgroundColor: selectedAbility === ability.id ? `${ability.color}20` : undefined,
                      }}
                    >
                      <span style={{ color: ability.color }}><Icon className="w-5 h-5" /></span>
                      <span className="text-xs text-white font-medium">{ability.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skill Selection (for skill checks) */}
            {checkType === 'skill' && availableSkills.length > 0 && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Skill</label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => setSelectedSkill(skill)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedSkill === skill
                          ? 'bg-blue-500/30 border border-blue-500 text-blue-400'
                          : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* DC Selection */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Difficulty Class (DC)</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={dc}
                  onChange={(e) => setDc(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                  className="w-20 px-3 py-2 bg-[#2A2735] border border-white/10 rounded-lg text-white text-center text-xl font-bold focus:outline-none focus:border-blue-500"
                />
                <div className="flex-1 flex gap-1 flex-wrap">
                  {COMMON_DCS.map((commonDc) => (
                    <button
                      key={commonDc.value}
                      onClick={() => setDc(commonDc.value)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        dc === commonDc.value
                          ? 'bg-blue-500/30 text-blue-400'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {commonDc.value} ({commonDc.label})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advantage/Disadvantage */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Modifiers</label>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setAdvantage(!advantage);
                    if (!advantage) setDisadvantage(false);
                  }}
                  className={`flex-1 p-3 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                    advantage
                      ? 'bg-green-500/20 border-green-500 text-green-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">⬆</span>
                  <span className="text-sm">Advantage</span>
                </button>
                <button
                  onClick={() => {
                    setDisadvantage(!disadvantage);
                    if (!disadvantage) setAdvantage(false);
                  }}
                  className={`flex-1 p-3 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                    disadvantage
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">⬇</span>
                  <span className="text-sm">Disadvantage</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this check for?"
                className="w-full px-3 py-2 bg-[#2A2735] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                rows={2}
              />
            </div>

            {/* Target Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">Who makes this check?</label>
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Users className="w-3 h-3" />
                  {selectAll ? 'Deselect All' : 'Select All Players'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {creatures
                  .filter((c) => c.type === 'character')
                  .map((creature) => (
                    <button
                      key={creature.id}
                      onClick={() => toggleCreature(creature.id)}
                      className={`p-3 rounded-lg border transition-colors flex items-center gap-3 ${
                        targetIds.includes(creature.id)
                          ? 'bg-blue-500/20 border-blue-500'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-white text-sm">{creature.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={targetIds.length === 0}
              className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Dice6 className="w-5 h-5" />
              Request {checkType === 'saving_throw' ? 'Save' : 'Check'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AbilityCheckPrompt;
