'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type NPCRole = 'ally' | 'enemy' | 'neutral' | 'quest_giver' | 'merchant' | 'companion';

export interface NPCPersonality {
  traits: string[];
  ideal: string;
  bond: string;
  flaw: string;
}

export interface NPCData {
  id: string;
  name: string;
  race: string;
  class?: string;
  role: NPCRole;
  description: string;
  personality: NPCPersonality;
  motivation?: string;
  secrets?: string;
  voiceProfile?: string;
  portraitUrl?: string;
  locationId?: string;
  dialogueId?: string;
  isHostile: boolean;
  faction?: string;
}

export interface NPCEditorProps {
  initialData?: Partial<NPCData>;
  campaignId?: string;
  onSave?: (data: NPCData) => void;
  onCancel?: () => void;
  onGeneratePortrait?: (npcId: string) => void;
  className?: string;
}

const RACES = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Gnome', 'Half-Elf', 'Half-Orc',
  'Tiefling', 'Dragonborn', 'Orc', 'Goblin', 'Kobold', 'Other'
];

const CLASSES = [
  'Fighter', 'Wizard', 'Rogue', 'Cleric', 'Ranger', 'Paladin',
  'Barbarian', 'Bard', 'Druid', 'Monk', 'Sorcerer', 'Warlock',
  'Commoner', 'Noble', 'Guard', 'Merchant', 'None'
];

const VOICE_PROFILES = [
  { id: 'narrator', name: 'Narrator', description: 'Authoritative, storyteller voice' },
  { id: 'hero', name: 'Hero', description: 'Confident, noble voice' },
  { id: 'villain', name: 'Villain', description: 'Menacing, deep voice' },
  { id: 'wise', name: 'Wise Elder', description: 'Calm, thoughtful voice' },
  { id: 'jovial', name: 'Jovial', description: 'Cheerful, friendly voice' },
  { id: 'mysterious', name: 'Mysterious', description: 'Whispered, enigmatic voice' },
  { id: 'gruff', name: 'Gruff', description: 'Rough, hardened voice' },
  { id: 'noble', name: 'Noble', description: 'Refined, aristocratic voice' },
];

const PERSONALITY_TRAITS = [
  'Brave', 'Cautious', 'Curious', 'Cynical', 'Friendly', 'Greedy',
  'Honest', 'Humble', 'Loyal', 'Proud', 'Secretive', 'Suspicious',
  'Trusting', 'Wise', 'Witty', 'Stubborn', 'Kind', 'Cruel'
];

export function NPCEditor({
  initialData,
  campaignId: _campaignId,
  onSave,
  onCancel,
  onGeneratePortrait,
  className,
}: NPCEditorProps) {
  const [data, setData] = useState<Partial<NPCData>>({
    id: initialData?.id || `npc_${Date.now()}`,
    name: initialData?.name || '',
    race: initialData?.race || 'Human',
    class: initialData?.class || '',
    role: initialData?.role || 'neutral',
    description: initialData?.description || '',
    personality: initialData?.personality || {
      traits: [],
      ideal: '',
      bond: '',
      flaw: '',
    },
    motivation: initialData?.motivation || '',
    secrets: initialData?.secrets || '',
    voiceProfile: initialData?.voiceProfile || '',
    portraitUrl: initialData?.portraitUrl || '',
    isHostile: initialData?.isHostile || false,
    faction: initialData?.faction || '',
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'personality' | 'voice'>('basic');

  const updatePersonality = useCallback((field: keyof NPCPersonality, value: string | string[]) => {
    setData((prev) => ({
      ...prev,
      personality: {
        ...prev.personality!,
        [field]: value,
      },
    }));
  }, []);

  const toggleTrait = useCallback((trait: string) => {
    setData((prev) => {
      const currentTraits = prev.personality?.traits || [];
      const newTraits = currentTraits.includes(trait)
        ? currentTraits.filter((t) => t !== trait)
        : [...currentTraits, trait].slice(0, 4); // Max 4 traits
      return {
        ...prev,
        personality: {
          ...prev.personality!,
          traits: newTraits,
        },
      };
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!data.name) return;
    onSave?.(data as NPCData);
  }, [data, onSave]);

  const roleColors: Record<NPCRole, string> = {
    ally: 'bg-green-500/20 text-green-400',
    enemy: 'bg-red-500/20 text-red-400',
    neutral: 'bg-gray-500/20 text-gray-400',
    quest_giver: 'bg-yellow-500/20 text-yellow-400',
    merchant: 'bg-blue-500/20 text-blue-400',
    companion: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className={`bg-bg-card border border-border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-cinzel font-bold text-text-primary">NPC Editor</h3>
            <p className="text-xs text-text-muted">Create memorable characters</p>
          </div>
          {data.portraitUrl && (
            <img
              src={data.portraitUrl}
              alt={data.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-border"
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['basic', 'personality', 'voice'] as const).map((tab) => (
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
                <label className="block text-sm text-text-secondary mb-1">Name</label>
                <input
                  type="text"
                  value={data.name || ''}
                  onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Thorin Ironforge"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Race & Class */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Race</label>
                  <select
                    value={data.race || 'Human'}
                    onChange={(e) => setData((prev) => ({ ...prev, race: e.target.value }))}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                  >
                    {RACES.map((race) => (
                      <option key={race} value={race}>{race}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Class/Occupation</label>
                  <select
                    value={data.class || ''}
                    onChange={(e) => setData((prev) => ({ ...prev, class: e.target.value }))}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                  >
                    <option value="">Select...</option>
                    {CLASSES.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ally', 'neutral', 'enemy', 'quest_giver', 'merchant', 'companion'] as NPCRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => setData((prev) => ({ ...prev, role }))}
                      className={`py-2 px-3 rounded-lg text-xs font-medium capitalize transition-colors ${
                        data.role === role
                          ? roleColors[role] + ' border border-current'
                          : 'bg-bg-elevated text-text-secondary hover:bg-border'
                      }`}
                    >
                      {role.replace('_', ' ')}
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
                  placeholder="Physical appearance and notable features..."
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50 h-20 resize-none"
                />
              </div>

              {/* Faction & Hostile */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Faction</label>
                  <input
                    type="text"
                    value={data.faction || ''}
                    onChange={(e) => setData((prev) => ({ ...prev, faction: e.target.value }))}
                    placeholder="e.g., Thieves Guild"
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.isHostile || false}
                      onChange={(e) => setData((prev) => ({ ...prev, isHostile: e.target.checked }))}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm text-text-secondary">Hostile by default</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'personality' && (
            <motion.div
              key="personality"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Personality Traits */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Personality Traits <span className="text-text-muted">(select up to 4)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PERSONALITY_TRAITS.map((trait) => (
                    <button
                      key={trait}
                      onClick={() => toggleTrait(trait)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        data.personality?.traits.includes(trait)
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-bg-elevated text-text-secondary hover:bg-border'
                      }`}
                    >
                      {trait}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ideal */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Ideal</label>
                <input
                  type="text"
                  value={data.personality?.ideal || ''}
                  onChange={(e) => updatePersonality('ideal', e.target.value)}
                  placeholder="What does this NPC believe in above all else?"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Bond */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Bond</label>
                <input
                  type="text"
                  value={data.personality?.bond || ''}
                  onChange={(e) => updatePersonality('bond', e.target.value)}
                  placeholder="What person, place, or thing is most important to them?"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Flaw */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Flaw</label>
                <input
                  type="text"
                  value={data.personality?.flaw || ''}
                  onChange={(e) => updatePersonality('flaw', e.target.value)}
                  placeholder="What weakness could be exploited?"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Motivation */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Motivation</label>
                <textarea
                  value={data.motivation || ''}
                  onChange={(e) => setData((prev) => ({ ...prev, motivation: e.target.value }))}
                  placeholder="What drives this NPC? What do they want?"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary/50 h-16 resize-none"
                />
              </div>

              {/* Secrets (DM Only) */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Secrets <span className="text-red-400 text-xs">(DM Only)</span>
                </label>
                <textarea
                  value={data.secrets || ''}
                  onChange={(e) => setData((prev) => ({ ...prev, secrets: e.target.value }))}
                  placeholder="Hidden information about this NPC..."
                  className="w-full px-3 py-2 bg-bg-elevated border border-red-500/30 rounded-lg text-text-primary focus:outline-none focus:border-red-500/50 h-16 resize-none"
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'voice' && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Voice Profile */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Voice Profile</label>
                <div className="grid grid-cols-2 gap-2">
                  {VOICE_PROFILES.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setData((prev) => ({ ...prev, voiceProfile: profile.id }))}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        data.voiceProfile === profile.id
                          ? 'bg-primary/10 border border-primary/50'
                          : 'bg-bg-elevated border border-border hover:border-primary/30'
                      }`}
                    >
                      <p className="text-sm font-medium text-text-primary">{profile.name}</p>
                      <p className="text-xs text-text-muted">{profile.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Portrait */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Portrait</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg bg-bg-elevated border border-border overflow-hidden flex items-center justify-center">
                    {data.portraitUrl ? (
                      <img
                        src={data.portraitUrl}
                        alt={data.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={data.portraitUrl || ''}
                      onChange={(e) => setData((prev) => ({ ...prev, portraitUrl: e.target.value }))}
                      placeholder="Portrait URL..."
                      className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-primary/50"
                    />
                    {onGeneratePortrait && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onGeneratePortrait(data.id!)}
                        className="w-full px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm"
                      >
                        Generate AI Portrait
                      </motion.button>
                    )}
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
          disabled={!data.name}
          className="px-4 py-2 bg-primary text-bg-dark rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save NPC
        </motion.button>
      </div>
    </div>
  );
}

export default NPCEditor;
