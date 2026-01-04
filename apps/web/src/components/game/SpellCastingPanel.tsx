'use client';

/**
 * SpellCastingPanel
 * UI for selecting and casting spells during combat
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Zap,
  Shield,
  Heart,
  Flame,
  Eye,
  Moon,
  Ghost,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { type Spell, SCHOOL_COLORS, getSpellsForClass } from '@/data/spells';
import type { Creature, GridPosition } from '@/game/types';
import type { CombatAction } from '@/hooks/useCombat';

interface SpellSlots {
  level1: { used: number; max: number };
  level2: { used: number; max: number };
  level3: { used: number; max: number };
  level4: { used: number; max: number };
  level5: { used: number; max: number };
  level6: { used: number; max: number };
  level7: { used: number; max: number };
  level8: { used: number; max: number };
  level9: { used: number; max: number };
}

interface SpellCastingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  casterCreature: Creature | null;
  casterClass?: string;
  casterLevel?: number;
  spellcastingAbility?: 'INT' | 'WIS' | 'CHA';
  spellcastingMod?: number;
  spellSlots: SpellSlots;
  knownSpells?: string[]; // spell IDs the character knows
  preparedSpells?: string[]; // spell IDs the character has prepared
  onCastSpell: (spell: Spell, targetId?: string, targetPosition?: GridPosition, spellLevel?: number) => void;
  validTargets: string[];
  creatures: Creature[];
  isSelectingTarget: boolean;
  selectedTargetId: string | null;
  onSelectTarget: (targetId: string | null) => void;
  concentration?: { spellId: string; spellName: string } | null;
}

// School icons
const SCHOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  abjuration: Shield,
  conjuration: Sparkles,
  divination: Eye,
  enchantment: Moon,
  evocation: Flame,
  illusion: Ghost,
  necromancy: Ghost,
  transmutation: RefreshCw,
};

// Parse range string to number (in feet)
function parseRange(range: string): number {
  if (range.toLowerCase() === 'self') return 0;
  if (range.toLowerCase() === 'touch') return 5;
  const match = range.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 60;
}

// Get damage dice from description (simplified)
function getDamageFromDescription(desc: string): { dice: string; type: string } | null {
  const damageMatch = desc.match(/(\d+d\d+(?:\s*\+\s*\d+)?)\s+(acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder)/i);
  if (damageMatch) {
    return { dice: damageMatch[1], type: damageMatch[2].toUpperCase() };
  }
  return null;
}

// Check if spell requires attack roll (may be used for advanced features)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isSpellAttack(spell: Spell): boolean {
  return spell.description.toLowerCase().includes('spell attack') ||
         spell.description.toLowerCase().includes('attack roll');
}

// Check if spell requires saving throw
function getSpellSave(spell: Spell): { ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA' } | null {
  const saveMatch = spell.description.match(/(strength|dexterity|constitution|intelligence|wisdom|charisma)\s+sav/i);
  if (saveMatch) {
    const abilityMap: Record<string, 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'> = {
      strength: 'STR',
      dexterity: 'DEX',
      constitution: 'CON',
      intelligence: 'INT',
      wisdom: 'WIS',
      charisma: 'CHA',
    };
    return { ability: abilityMap[saveMatch[1].toLowerCase()] };
  }
  return null;
}

// Check if spell is healing
function isHealingSpell(spell: Spell): boolean {
  return spell.description.toLowerCase().includes('regain') ||
         spell.description.toLowerCase().includes('heal') ||
         spell.name.toLowerCase().includes('cure') ||
         spell.name.toLowerCase().includes('heal');
}

// Check if spell targets self
function isSelfTargeted(spell: Spell): boolean {
  return spell.range.toLowerCase() === 'self';
}

// Get AoE info from spell
function getAoEInfo(spell: Spell): { shape: 'SPHERE' | 'CUBE' | 'CONE' | 'LINE'; size: number } | null {
  const coneMatch = spell.range.match(/(\d+)-foot\s+cone/i) || spell.description.match(/(\d+)-foot\s+cone/i);
  if (coneMatch) return { shape: 'CONE', size: parseInt(coneMatch[1], 10) };

  const cubeMatch = spell.description.match(/(\d+)-foot\s+cube/i);
  if (cubeMatch) return { shape: 'CUBE', size: parseInt(cubeMatch[1], 10) };

  const sphereMatch = spell.description.match(/(\d+)-foot[- ]radius\s+sphere/i);
  if (sphereMatch) return { shape: 'SPHERE', size: parseInt(sphereMatch[1], 10) };

  const lineMatch = spell.description.match(/(\d+)-foot[- ]long.*line/i);
  if (lineMatch) return { shape: 'LINE', size: parseInt(lineMatch[1], 10) };

  return null;
}

export function SpellCastingPanel({
  isOpen,
  onClose,
  casterCreature,
  casterClass = 'wizard',
  casterLevel = 1,
  spellcastingAbility: _spellcastingAbility = 'INT',
  spellcastingMod = 2,
  spellSlots,
  knownSpells,
  preparedSpells,
  onCastSpell,
  validTargets,
  creatures,
  isSelectingTarget,
  selectedTargetId,
  onSelectTarget,
  concentration,
}: SpellCastingPanelProps) {
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(0); // 0 = cantrip, 1-9 = spell level
  const [upcastLevel, setUpcastLevel] = useState<number | null>(null);
  const [showSpellDetails, setShowSpellDetails] = useState<string | null>(null);

  // Get available spells for caster's class
  const availableSpells = useMemo(() => {
    const classSpells = getSpellsForClass(casterClass);

    // Filter by known/prepared if provided
    if (knownSpells && knownSpells.length > 0) {
      return classSpells.filter(s => knownSpells.includes(s.id));
    }
    if (preparedSpells && preparedSpells.length > 0) {
      return classSpells.filter(s => s.level === 0 || preparedSpells.includes(s.id));
    }

    // Default: show all class spells up to character's max spell level
    const maxLevel = Math.min(9, Math.ceil(casterLevel / 2));
    return classSpells.filter(s => s.level <= maxLevel);
  }, [casterClass, casterLevel, knownSpells, preparedSpells]);

  // Group spells by level
  const spellsByLevel = useMemo(() => {
    const grouped: Record<number, Spell[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [] };
    for (const spell of availableSpells) {
      grouped[spell.level].push(spell);
    }
    return grouped;
  }, [availableSpells]);

  // Spell save DC
  const spellSaveDC = 8 + spellcastingMod + Math.floor((casterLevel - 1) / 4) + 2; // +2 for proficiency at level 1

  // Check if can cast spell at level
  const canCastAtLevel = useCallback((level: number): boolean => {
    if (level === 0) return true; // Cantrips always available

    const slotKey = `level${level}` as keyof SpellSlots;
    const slot = spellSlots[slotKey];
    return slot && slot.used < slot.max;
  }, [spellSlots]);

  // Get available upcast levels
  const getUpcastLevels = useCallback((spell: Spell): number[] => {
    if (spell.level === 0) return [];

    const levels: number[] = [];
    for (let i = spell.level; i <= 9; i++) {
      if (canCastAtLevel(i)) {
        levels.push(i);
      }
    }
    return levels;
  }, [canCastAtLevel]);

  // Handle spell selection
  const handleSelectSpell = useCallback((spell: Spell) => {
    setSelectedSpell(spell);
    setUpcastLevel(spell.level > 0 ? spell.level : null);

    // If self-targeted, cast immediately
    if (isSelfTargeted(spell)) {
      onCastSpell(spell, casterCreature?.id, undefined, spell.level);
      setSelectedSpell(null);
      onClose();
    }
  }, [casterCreature?.id, onCastSpell, onClose]);

  // Handle casting
  const handleCast = useCallback(() => {
    if (!selectedSpell) return;

    const castLevel = upcastLevel ?? selectedSpell.level;
    onCastSpell(selectedSpell, selectedTargetId || undefined, undefined, castLevel);
    setSelectedSpell(null);
    setUpcastLevel(null);
    onClose();
  }, [selectedSpell, upcastLevel, selectedTargetId, onCastSpell, onClose]);

  // Convert spell to combat action for display
  const spellToAction = useCallback((spell: Spell): CombatAction => {
    const damage = getDamageFromDescription(spell.description);
    const save = getSpellSave(spell);
    const aoe = getAoEInfo(spell);

    return {
      type: 'spell',
      name: spell.name,
      description: spell.description,
      range: parseRange(spell.range),
      damage: damage?.dice,
      damageType: damage?.type as CombatAction['damageType'],
      savingThrow: save ? { ability: save.ability, dc: spellSaveDC } : undefined,
      areaOfEffect: aoe ? { shape: aoe.shape, size: aoe.size } : undefined,
      requiresTarget: !isSelfTargeted(spell),
      isSpell: true,
      spellLevel: spell.level,
    };
  }, [spellSaveDC]);

  // Get spell slot display
  const getSlotDisplay = useCallback((level: number): string => {
    if (level === 0) return 'At Will';
    const slotKey = `level${level}` as keyof SpellSlots;
    const slot = spellSlots[slotKey];
    if (!slot) return '0/0';
    return `${slot.max - slot.used}/${slot.max}`;
  }, [spellSlots]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (!isSelectingTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-[#1a1625] to-[#0d0a14] rounded-xl border border-purple-500/30 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-purple-900/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Spellcasting</h2>
                <p className="text-sm text-gray-400">
                  {casterCreature?.name} | Spell Save DC: {spellSaveDC} | Attack Bonus: +{spellcastingMod + Math.ceil(casterLevel / 4) + 1}
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

          {/* Concentration Warning */}
          {concentration && (
            <div className="px-6 py-2 bg-yellow-900/30 border-b border-yellow-500/30">
              <p className="text-sm text-yellow-300 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Concentrating on: <span className="font-semibold">{concentration.spellName}</span>
                <span className="text-yellow-400/70">(casting another concentration spell will end this)</span>
              </p>
            </div>
          )}

          <div className="flex h-[calc(90vh-120px)]">
            {/* Spell Level Tabs */}
            <div className="w-24 border-r border-purple-500/20 bg-black/30 overflow-y-auto">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
                const hasSpells = spellsByLevel[level].length > 0;
                const canCast = canCastAtLevel(level);

                if (!hasSpells) return null;

                return (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    disabled={!canCast && level > 0}
                    className={`w-full px-3 py-4 text-left transition-colors border-l-2 ${
                      selectedLevel === level
                        ? 'bg-purple-500/20 border-purple-400 text-white'
                        : canCast || level === 0
                        ? 'border-transparent text-gray-400 hover:bg-purple-500/10 hover:text-gray-200'
                        : 'border-transparent text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <span className="block text-sm font-medium">
                      {level === 0 ? 'Cantrips' : `Level ${level}`}
                    </span>
                    <span className={`block text-xs ${canCast || level === 0 ? 'text-purple-400' : 'text-gray-600'}`}>
                      {getSlotDisplay(level)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Spell List */}
            <div className="flex-1 overflow-y-auto p-4">
              {isSelectingTarget && selectedSpell ? (
                // Target Selection View
                <div className="space-y-4">
                  <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Select Target for {selectedSpell.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">{selectedSpell.description}</p>

                    {/* Upcast Selection */}
                    {selectedSpell.level > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm text-gray-400">Cast at level:</span>
                        {getUpcastLevels(selectedSpell).map((level) => (
                          <button
                            key={level}
                            onClick={() => setUpcastLevel(level)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                              upcastLevel === level
                                ? 'bg-purple-500 text-white'
                                : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Target List */}
                  <div className="grid grid-cols-2 gap-2">
                    {creatures
                      .filter((c) => {
                        if (c.currentHitPoints <= 0) return false;
                        if (isHealingSpell(selectedSpell)) {
                          return c.type === 'character' || c.id === casterCreature?.id;
                        }
                        return validTargets.includes(c.id);
                      })
                      .map((creature) => (
                        <button
                          key={creature.id}
                          onClick={() => {
                            onSelectTarget(creature.id);
                          }}
                          className={`p-3 rounded-lg border transition-all ${
                            selectedTargetId === creature.id
                              ? 'bg-purple-500/30 border-purple-400 shadow-lg shadow-purple-500/20'
                              : 'bg-white/5 border-white/10 hover:bg-purple-500/20 hover:border-purple-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                                creature.type === 'character' ? 'bg-blue-500/30 text-blue-300' : 'bg-red-500/30 text-red-300'
                              }`}
                            >
                              {creature.name[0]}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-white">{creature.name}</p>
                              <p className="text-xs text-gray-400">
                                HP: {creature.currentHitPoints}/{creature.maxHitPoints} | AC: {creature.armorClass}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setSelectedSpell(null);
                        onSelectTarget(null);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCast}
                      disabled={!selectedTargetId}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                        selectedTargetId
                          ? 'bg-purple-500 text-white hover:bg-purple-400'
                          : 'bg-purple-500/30 text-purple-300 cursor-not-allowed'
                      }`}
                    >
                      Cast {selectedSpell.name}
                    </button>
                  </div>
                </div>
              ) : (
                // Spell List View
                <div className="grid grid-cols-2 gap-3">
                  {spellsByLevel[selectedLevel].map((spell) => {
                    const SchoolIcon = SCHOOL_ICONS[spell.school] || Sparkles;
                    const schoolColor = SCHOOL_COLORS[spell.school] || '#8B5CF6';
                    const canCast = canCastAtLevel(spell.level);
                    const action = spellToAction(spell);

                    return (
                      <motion.div
                        key={spell.id}
                        whileHover={{ scale: canCast ? 1.02 : 1 }}
                        className={`relative rounded-lg border overflow-hidden transition-all ${
                          canCast
                            ? 'bg-gradient-to-br from-purple-900/30 to-black/50 border-purple-500/30 cursor-pointer hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20'
                            : 'bg-gray-900/50 border-gray-700/30 opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => canCast && handleSelectSpell(spell)}
                      >
                        {/* School Color Bar */}
                        <div
                          className="h-1"
                          style={{ backgroundColor: schoolColor }}
                        />

                        <div className="p-4">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span style={{ color: schoolColor }}>
                                <SchoolIcon className="w-5 h-5" />
                              </span>
                              <h3 className="font-semibold text-white">{spell.name}</h3>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowSpellDetails(showSpellDetails === spell.id ? null : spell.id);
                              }}
                              className="p-1 text-gray-400 hover:text-white transition-colors"
                            >
                              {showSpellDetails === spell.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          {/* Quick Info */}
                          <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-2">
                            <span className="px-2 py-0.5 rounded bg-purple-500/20">{spell.castingTime}</span>
                            <span className="px-2 py-0.5 rounded bg-blue-500/20">{spell.range}</span>
                            {spell.concentration && (
                              <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
                                <Zap className="w-3 h-3 inline mr-1" />
                                Conc.
                              </span>
                            )}
                            {action.damage && (
                              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                                {action.damage} {action.damageType?.toLowerCase()}
                              </span>
                            )}
                            {action.savingThrow && (
                              <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300">
                                {action.savingThrow.ability} Save
                              </span>
                            )}
                            {isHealingSpell(spell) && (
                              <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-300">
                                <Heart className="w-3 h-3 inline mr-1" />
                                Healing
                              </span>
                            )}
                          </div>

                          {/* Components */}
                          <div className="flex gap-1 text-xs text-gray-500 mb-2">
                            {spell.components.verbal && <span className="px-1.5 py-0.5 rounded bg-white/5">V</span>}
                            {spell.components.somatic && <span className="px-1.5 py-0.5 rounded bg-white/5">S</span>}
                            {spell.components.material && (
                              <span className="px-1.5 py-0.5 rounded bg-white/5" title={spell.components.materialDesc}>M</span>
                            )}
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {showSpellDetails === spell.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 pt-2 border-t border-purple-500/20"
                              >
                                <p className="text-sm text-gray-300 leading-relaxed">
                                  {spell.description}
                                </p>
                                {spell.components.materialDesc && (
                                  <p className="text-xs text-gray-500 mt-2 italic">
                                    Material: {spell.components.materialDesc}
                                  </p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}

                  {spellsByLevel[selectedLevel].length === 0 && (
                    <div className="col-span-2 text-center py-12 text-gray-500">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No {selectedLevel === 0 ? 'cantrips' : `level ${selectedLevel} spells`} available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SpellCastingPanel;
