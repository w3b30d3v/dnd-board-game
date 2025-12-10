'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getClassById } from '@/data/classes';
import { getSpellsForClass, getCantrips, getFirstLevelSpells, SCHOOL_COLORS, SCHOOL_ICONS, type Spell } from '@/data/spells';
import type { StepProps } from '../types';

// Spell card component
function SpellCard({
  spell,
  isSelected,
  onToggle,
  disabled,
}: {
  spell: Spell;
  isSelected: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const schoolColor = SCHOOL_COLORS[spell.school] || '#F59E0B';
  const schoolIcon = SCHOOL_ICONS[spell.school] || '✨';

  return (
    <motion.button
      onClick={onToggle}
      disabled={disabled && !isSelected}
      className={`
        w-full text-left p-3 rounded-lg border-2 transition-all
        ${isSelected
          ? 'border-primary bg-primary/10 shadow-glow'
          : disabled
            ? 'border-border/50 bg-bg-dark/50 opacity-50 cursor-not-allowed'
            : 'border-border bg-bg-dark hover:border-primary/50 hover:bg-bg-medium'
        }
      `}
      whileHover={!disabled || isSelected ? { scale: 1.01 } : {}}
      whileTap={!disabled || isSelected ? { scale: 0.99 } : {}}
    >
      <div className="flex items-start gap-3">
        {/* School Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: `${schoolColor}20`, borderColor: schoolColor, borderWidth: 1 }}
        >
          {schoolIcon}
        </div>

        {/* Spell Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-text-primary truncate">{spell.name}</h4>
            {isSelected && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-primary text-sm"
              >
                ✓
              </motion.span>
            )}
          </div>
          <p className="text-xs text-text-muted capitalize">
            {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} • {spell.school}
          </p>
          <p className="text-xs text-text-secondary mt-1 line-clamp-2">{spell.description}</p>
        </div>
      </div>

      {/* Spell Details */}
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-0.5 rounded bg-bg-medium text-text-muted">
          {spell.castingTime}
        </span>
        <span className="px-2 py-0.5 rounded bg-bg-medium text-text-muted">
          {spell.range}
        </span>
        {spell.concentration && (
          <span className="px-2 py-0.5 rounded bg-secondary/20 text-secondary">
            Concentration
          </span>
        )}
      </div>
    </motion.button>
  );
}

export function SpellSelection({ character, onUpdate, onNext, onBack }: StepProps) {
  const [selectedCantrips, setSelectedCantrips] = useState<string[]>(
    character.spellsKnown?.filter(id => {
      const spells = getSpellsForClass(character.class || '');
      const spell = spells.find(s => s.id === id);
      return spell?.level === 0;
    }) || []
  );
  const [selectedSpells, setSelectedSpells] = useState<string[]>(
    character.spellsKnown?.filter(id => {
      const spells = getSpellsForClass(character.class || '');
      const spell = spells.find(s => s.id === id);
      return spell && spell.level > 0;
    }) || []
  );

  const classData = getClassById(character.class || '');
  const spellcasting = classData?.spellcasting;

  // Get available spells for this class
  const availableSpells = useMemo(() => {
    return getSpellsForClass(character.class || '');
  }, [character.class]);

  const cantrips = useMemo(() => getCantrips(availableSpells), [availableSpells]);
  const firstLevelSpells = useMemo(() => getFirstLevelSpells(availableSpells), [availableSpells]);

  // Determine limits
  const cantripsAllowed = spellcasting?.cantripsKnown || 0;
  const spellsAllowed = spellcasting?.spellsKnown || 0;

  // Check if class prepares spells (clerics, druids, paladins) vs knows spells
  const preparesSpells = ['cleric', 'druid', 'paladin', 'wizard'].includes(character.class || '');

  const handleToggleCantrip = (spellId: string) => {
    setSelectedCantrips(prev => {
      if (prev.includes(spellId)) {
        return prev.filter(id => id !== spellId);
      }
      if (prev.length >= cantripsAllowed) {
        return prev; // Already at max
      }
      return [...prev, spellId];
    });
  };

  const handleToggleSpell = (spellId: string) => {
    setSelectedSpells(prev => {
      if (prev.includes(spellId)) {
        return prev.filter(id => id !== spellId);
      }
      if (prev.length >= spellsAllowed) {
        return prev; // Already at max
      }
      return [...prev, spellId];
    });
  };

  const handleContinue = () => {
    const allSpells = [...selectedCantrips, ...selectedSpells];
    onUpdate({ spellsKnown: allSpells });
    onNext();
  };

  // For classes that prepare spells, we just need to select cantrips at level 1
  const needsSpellSelection = spellsAllowed > 0 && !preparesSpells;
  const canContinue = selectedCantrips.length >= cantripsAllowed || cantripsAllowed === 0;

  if (!spellcasting) {
    // Non-caster class - skip this step (shouldn't reach here due to wizard logic)
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="dnd-heading-epic text-3xl pb-2">Spellcasting</h2>
          <p className="text-text-secondary">
            {classData?.name} does not have spellcasting at level 1.
          </p>
        </div>
        <div className="flex justify-between pt-6">
          <button onClick={onBack} className="btn-stone px-6 py-3">
            Back
          </button>
          <button onClick={onNext} className="btn-adventure px-8 py-3">
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="dnd-heading-epic text-3xl pb-2">Choose Your Spells</h2>
        <p className="text-text-secondary">
          As a {classData?.name}, you have access to magical abilities. Select your starting spells.
        </p>
      </div>

      {/* Cantrips Section */}
      {cantripsAllowed > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="dnd-heading-section text-xl mb-0 border-none pb-0">
              Cantrips
            </h3>
            <span className={`text-sm font-medium ${selectedCantrips.length >= cantripsAllowed ? 'text-success' : 'text-text-muted'}`}>
              {selectedCantrips.length} / {cantripsAllowed} selected
            </span>
          </div>
          <p className="text-sm text-text-muted">
            Cantrips are minor spells you can cast at will without using spell slots.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {cantrips.map((spell) => (
                <motion.div
                  key={spell.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <SpellCard
                    spell={spell}
                    isSelected={selectedCantrips.includes(spell.id)}
                    onToggle={() => handleToggleCantrip(spell.id)}
                    disabled={selectedCantrips.length >= cantripsAllowed && !selectedCantrips.includes(spell.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 1st Level Spells Section */}
      {needsSpellSelection && spellsAllowed > 0 && (
        <>
          <div className="dnd-divider my-6" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="dnd-heading-section text-xl mb-0 border-none pb-0">
                1st Level Spells
              </h3>
              <span className={`text-sm font-medium ${selectedSpells.length >= spellsAllowed ? 'text-success' : 'text-text-muted'}`}>
                {selectedSpells.length} / {spellsAllowed} selected
              </span>
            </div>
            <p className="text-sm text-text-muted">
              These spells require spell slots to cast. You start with {spellcasting.spellSlots?.[1] || 2} 1st-level spell slots.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {firstLevelSpells.map((spell) => (
                  <motion.div
                    key={spell.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <SpellCard
                      spell={spell}
                      isSelected={selectedSpells.includes(spell.id)}
                      onToggle={() => handleToggleSpell(spell.id)}
                      disabled={selectedSpells.length >= spellsAllowed && !selectedSpells.includes(spell.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}

      {/* For classes that prepare spells */}
      {preparesSpells && firstLevelSpells.length > 0 && (
        <>
          <div className="dnd-divider my-6" />

          <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/30">
            <h4 className="font-semibold text-secondary mb-2">Prepared Spells</h4>
            <p className="text-sm text-text-secondary">
              As a {classData?.name}, you prepare spells each day from your full spell list rather than learning specific spells.
              After a long rest, you can change which spells you have prepared.
            </p>
            <p className="text-sm text-text-muted mt-2">
              At level 1, you can prepare {Math.max(1, (character.wisdom || 10) - 10 + 1)} spells (your {spellcasting.ability} modifier + your level, minimum 1).
            </p>
          </div>
        </>
      )}

      {/* Validation Message */}
      {cantripsAllowed > 0 && selectedCantrips.length < cantripsAllowed && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
          Please select {cantripsAllowed - selectedCantrips.length} more cantrip{cantripsAllowed - selectedCantrips.length > 1 ? 's' : ''} to continue.
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="btn-stone px-6 py-3">
          Back to Skills
        </button>
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`btn-adventure px-8 py-3 text-lg ${!canContinue ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue to Details
        </button>
      </div>
    </div>
  );
}
