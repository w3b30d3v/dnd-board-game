'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NPC, NPCStats } from '@dnd/shared';
import { EnchantedCard } from '@/components/dnd/EnchantedCard';

interface NPCEditorProps {
  npc: NPC;
  onSave: (updates: Partial<NPC>) => Promise<void>;
  onClose: () => void;
}

const ABILITY_SCORES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

const CR_OPTIONS = [
  '0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
];

const FACTION_PRESETS = [
  'Neutral', 'Friendly', 'Hostile', 'Guild', 'Nobility', 'Clergy', 'Criminal', 'Military', 'Merchant', 'Wilderness',
];

type EditorTab = 'basic' | 'stats' | 'personality' | 'relationships';

export function NPCEditor({ npc, onSave, onClose }: NPCEditorProps) {
  const [name, setName] = useState(npc.name);
  const [title, setTitle] = useState(npc.title || '');
  const [description, setDescription] = useState(npc.description || '');
  const [portraitUrl, setPortraitUrl] = useState(npc.portraitUrl || '');
  const [personality, setPersonality] = useState(npc.personality || '');
  const [motivation, setMotivation] = useState(npc.motivation || '');
  const [secrets, setSecrets] = useState(npc.secrets || '');
  const [defaultLocation, setDefaultLocation] = useState(npc.defaultLocation || '');
  const [isHostile, setIsHostile] = useState(npc.isHostile || false);
  const [faction, setFaction] = useState(npc.faction || '');
  const [stats, setStats] = useState<NPCStats>(npc.stats || {
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    ac: 10, hp: 10, speed: 30,
  });

  const [activeTab, setActiveTab] = useState<EditorTab>('basic');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleStatChange = (key: keyof NPCStats, value: number | string) => {
    setStats((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const getModifier = (score: number): string => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      name,
      title: title || undefined,
      description: description || undefined,
      portraitUrl: portraitUrl || undefined,
      personality: personality || undefined,
      motivation: motivation || undefined,
      secrets: secrets || undefined,
      defaultLocation: defaultLocation || undefined,
      isHostile,
      faction: faction || undefined,
      stats,
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
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center overflow-hidden">
              {portraitUrl ? (
                <img src={portraitUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">👤</span>
              )}
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
                placeholder="NPC Name"
              />
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setHasChanges(true);
                }}
                className="block bg-transparent text-sm text-text-muted border-b border-transparent hover:border-border focus:border-secondary focus:outline-none"
                placeholder="Title or role..."
              />
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
              {saving ? 'Saving...' : 'Save NPC'}
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['basic', 'stats', 'personality', 'relationships'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'text-secondary border-b-2 border-secondary bg-secondary/5'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/50'
              }`}
            >
              {tab}
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
                  {/* Portrait */}
                  <EnchantedCard className="p-4">
                    <h3 className="text-sm font-medium text-text-muted mb-3">Portrait</h3>
                    <div className="aspect-square max-w-48 mx-auto rounded-lg bg-bg-elevated border border-border overflow-hidden mb-3">
                      {portraitUrl ? (
                        <img src={portraitUrl} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl text-text-muted">
                          👤
                        </div>
                      )}
                    </div>
                    <input
                      type="url"
                      value={portraitUrl}
                      onChange={(e) => {
                        setPortraitUrl(e.target.value);
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 rounded bg-bg-elevated border border-border text-text-primary text-sm focus:border-secondary focus:outline-none"
                      placeholder="Portrait URL..."
                    />
                  </EnchantedCard>

                  {/* Basic Info */}
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
                        rows={4}
                        placeholder="Physical appearance and notable features..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-text-muted mb-1">Default Location</label>
                      <input
                        type="text"
                        value={defaultLocation}
                        onChange={(e) => {
                          setDefaultLocation(e.target.value);
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 rounded bg-bg-elevated border border-border text-text-primary text-sm focus:border-secondary focus:outline-none"
                        placeholder="Where is this NPC usually found?"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-text-muted mb-1">Faction</label>
                        <select
                          value={faction}
                          onChange={(e) => {
                            setFaction(e.target.value);
                            setHasChanges(true);
                          }}
                          className="w-full px-3 py-2 rounded bg-bg-elevated border border-border text-text-primary text-sm focus:border-secondary focus:outline-none"
                        >
                          <option value="">None</option>
                          {FACTION_PRESETS.map((f) => (
                            <option key={f} value={f.toLowerCase()}>{f}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-text-muted mb-1">Disposition</label>
                        <div className="flex items-center gap-4 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={!isHostile}
                              onChange={() => {
                                setIsHostile(false);
                                setHasChanges(true);
                              }}
                              className="text-secondary"
                            />
                            <span className="text-sm text-success">Friendly</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={isHostile}
                              onChange={() => {
                                setIsHostile(true);
                                setHasChanges(true);
                              }}
                              className="text-secondary"
                            />
                            <span className="text-sm text-danger">Hostile</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Combat Stats */}
                <EnchantedCard variant="magical" className="p-4">
                  <h3 className="text-sm font-medium text-text-muted mb-4">Combat Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-bg-elevated rounded-lg">
                      <label className="block text-xs text-text-muted mb-1">AC</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={stats.ac || 10}
                        onChange={(e) => handleStatChange('ac', parseInt(e.target.value) || 10)}
                        className="w-16 text-center text-2xl font-bold text-text-primary bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="text-center p-3 bg-bg-elevated rounded-lg">
                      <label className="block text-xs text-text-muted mb-1">HP</label>
                      <input
                        type="number"
                        min={1}
                        value={stats.hp || 10}
                        onChange={(e) => handleStatChange('hp', parseInt(e.target.value) || 10)}
                        className="w-16 text-center text-2xl font-bold text-success bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="text-center p-3 bg-bg-elevated rounded-lg">
                      <label className="block text-xs text-text-muted mb-1">Speed</label>
                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={stats.speed || 30}
                        onChange={(e) => handleStatChange('speed', parseInt(e.target.value) || 30)}
                        className="w-16 text-center text-2xl font-bold text-text-primary bg-transparent focus:outline-none"
                      />
                      <span className="text-xs text-text-muted">ft</span>
                    </div>
                    <div className="text-center p-3 bg-bg-elevated rounded-lg">
                      <label className="block text-xs text-text-muted mb-1">CR</label>
                      <select
                        value={stats.cr || '1'}
                        onChange={(e) => handleStatChange('cr', e.target.value)}
                        className="text-center text-xl font-bold text-warning bg-transparent focus:outline-none"
                      >
                        {CR_OPTIONS.map((cr) => (
                          <option key={cr} value={cr}>{cr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </EnchantedCard>

                {/* Ability Scores */}
                <EnchantedCard className="p-4">
                  <h3 className="text-sm font-medium text-text-muted mb-4">Ability Scores</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {ABILITY_SCORES.map((ability) => {
                      const score = stats[ability] || 10;
                      return (
                        <div
                          key={ability}
                          className="text-center p-3 bg-bg-elevated rounded-lg border border-border"
                        >
                          <label className="block text-xs text-text-muted uppercase mb-1">
                            {ability}
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={score}
                            onChange={(e) => handleStatChange(ability, parseInt(e.target.value) || 10)}
                            className="w-12 text-center text-xl font-bold text-text-primary bg-transparent focus:outline-none"
                          />
                          <p className="text-sm text-secondary">{getModifier(score)}</p>
                        </div>
                      );
                    })}
                  </div>
                </EnchantedCard>

                {/* Quick Stat Templates */}
                <div>
                  <h3 className="text-sm font-medium text-text-muted mb-3">Quick Templates</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Commoner', stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, ac: 10, hp: 4, speed: 30, cr: '0' } },
                      { label: 'Guard', stats: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10, ac: 16, hp: 11, speed: 30, cr: '1/8' } },
                      { label: 'Knight', stats: { str: 16, dex: 11, con: 14, int: 11, wis: 11, cha: 15, ac: 18, hp: 52, speed: 30, cr: '3' } },
                      { label: 'Mage', stats: { str: 9, dex: 14, con: 11, int: 17, wis: 12, cha: 11, ac: 12, hp: 40, speed: 30, cr: '6' } },
                      { label: 'Noble', stats: { str: 11, dex: 12, con: 11, int: 12, wis: 14, cha: 16, ac: 15, hp: 9, speed: 30, cr: '1/8' } },
                    ].map(({ label, stats: templateStats }) => (
                      <motion.button
                        key={label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setStats(templateStats as NPCStats);
                          setHasChanges(true);
                        }}
                        className="px-3 py-1.5 text-xs bg-bg-elevated border border-border rounded hover:border-secondary transition-colors"
                      >
                        {label}
                      </motion.button>
                    ))}
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
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm text-text-muted mb-1">
                    Personality Traits
                    <span className="text-xs text-text-muted ml-2">(How do they behave?)</span>
                  </label>
                  <textarea
                    value={personality}
                    onChange={(e) => {
                      setPersonality(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 rounded bg-bg-elevated border border-border text-text-primary text-sm resize-none focus:border-secondary focus:outline-none"
                    rows={4}
                    placeholder="Gruff but kind-hearted, speaks in short sentences, loves to tell stories about their youth..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-muted mb-1">
                    Motivation
                    <span className="text-xs text-text-muted ml-2">(What drives them?)</span>
                  </label>
                  <textarea
                    value={motivation}
                    onChange={(e) => {
                      setMotivation(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 rounded bg-bg-elevated border border-border text-text-primary text-sm resize-none focus:border-secondary focus:outline-none"
                    rows={4}
                    placeholder="Seeking revenge for their family, wants to protect their village, desires wealth and power..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-muted mb-1">
                    Secrets
                    <span className="text-xs text-text-muted ml-2">(Hidden from players)</span>
                  </label>
                  <textarea
                    value={secrets}
                    onChange={(e) => {
                      setSecrets(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 rounded bg-bg-elevated border border-border text-text-primary text-sm resize-none focus:border-secondary focus:outline-none"
                    rows={4}
                    placeholder="Actually a spy for the enemy, knows the location of a hidden treasure, murdered their brother..."
                  />
                </div>

                {/* Personality Generator */}
                <EnchantedCard className="p-4">
                  <h3 className="text-sm font-medium text-text-muted mb-3">Quick Traits</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      'Friendly', 'Suspicious', 'Greedy', 'Honest',
                      'Cowardly', 'Brave', 'Wise', 'Foolish',
                      'Patient', 'Impulsive', 'Secretive', 'Boastful',
                    ].map((trait) => (
                      <motion.button
                        key={trait}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setPersonality((prev) => prev ? `${prev}, ${trait.toLowerCase()}` : trait.toLowerCase());
                          setHasChanges(true);
                        }}
                        className="px-3 py-2 text-xs bg-bg-elevated border border-border rounded hover:border-secondary transition-colors"
                      >
                        {trait}
                      </motion.button>
                    ))}
                  </div>
                </EnchantedCard>
              </motion.div>
            )}

            {activeTab === 'relationships' && (
              <motion.div
                key="relationships"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <EnchantedCard className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
                    <span className="text-3xl">🔗</span>
                  </div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">NPC Relationships</h3>
                  <p className="text-sm text-text-muted mb-4">
                    Link this NPC to other NPCs, quests, and locations in your campaign.
                    This feature will be available in a future update.
                  </p>
                  <p className="text-xs text-text-muted">
                    For now, you can describe relationships in the personality or secrets sections.
                  </p>
                </EnchantedCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default NPCEditor;
