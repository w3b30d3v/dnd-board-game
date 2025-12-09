'use client';

import { useState } from 'react';
import { getRaceById, getClassById, getBackgroundById, SKILLS } from '@/data';
import { calculateModifier, formatModifier } from '@/data/skills';
import type { StepProps, AbilityName, CharacterData } from '../types';

interface ReviewCharacterProps extends StepProps {
  onComplete: (character: CharacterData) => Promise<void>;
}

export function ReviewCharacter({ character, onBack, onComplete }: ReviewCharacterProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const race = getRaceById(character.race || '');
  const subrace = race?.subraces?.find(s => s.id === character.subrace);
  const classData = getClassById(character.class || '');
  const background = getBackgroundById(character.background || '');

  // Calculate racial bonuses
  const racialBonuses: Partial<Record<AbilityName, number>> = {
    ...(race?.abilityBonuses || {}),
    ...(subrace?.abilityBonuses || {}),
  };

  // Get final ability scores
  const getFinalScore = (ability: AbilityName): number => {
    const base = character[ability] || 10;
    const bonus = racialBonuses[ability] || 0;
    return base + bonus;
  };

  // Calculate derived stats
  const conMod = calculateModifier(getFinalScore('constitution'));
  const dexMod = calculateModifier(getFinalScore('dexterity'));
  const hitDice = classData?.hitDice || 8;
  const maxHP = hitDice + conMod;
  const armorClass = 10 + dexMod;
  const initiative = dexMod;
  const proficiencyBonus = 2;
  const speed = race?.speed || 30;

  // Spellcasting info
  const spellcastingAbility = classData?.spellcasting?.ability;
  const spellcastingMod = spellcastingAbility
    ? calculateModifier(getFinalScore(spellcastingAbility as AbilityName))
    : 0;
  const spellSaveDC = spellcastingAbility ? 8 + proficiencyBonus + spellcastingMod : null;
  const spellAttackBonus = spellcastingAbility ? proficiencyBonus + spellcastingMod : null;

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // Cast to CharacterData - by this step all required fields should be filled
      await onComplete(character as CharacterData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
      setIsCreating(false);
    }
  };

  const abilities: { id: AbilityName; name: string }[] = [
    { id: 'strength', name: 'STR' },
    { id: 'dexterity', name: 'DEX' },
    { id: 'constitution', name: 'CON' },
    { id: 'intelligence', name: 'INT' },
    { id: 'wisdom', name: 'WIS' },
    { id: 'charisma', name: 'CHA' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="dnd-heading-epic text-3xl pb-2">Review Your Hero</h2>
        <p className="text-text-secondary">
          Review your character and begin your adventure!
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger">
          {error}
        </div>
      )}

      {/* Character Header */}
      <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/30">
        <div className="flex items-start gap-6">
          {/* Character Portrait */}
          {character.portraitUrl && (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-bg-medium border-2 border-primary/50 overflow-hidden shadow-glow flex-shrink-0">
              <img
                src={character.portraitUrl}
                alt={`${character.name} portrait`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 flex items-start justify-between">
            <div>
              <h3 className="text-3xl font-display font-bold text-primary">{character.name}</h3>
              <p className="text-lg text-text-secondary mt-1">
                {race?.name}{subrace ? ` (${subrace.name})` : ''} {classData?.name}
              </p>
              <p className="text-sm text-text-muted mt-1">
                {background?.name} Background
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-text-muted">Level</div>
              <div className="text-4xl font-bold text-primary">1</div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-danger/10 border border-danger/30 text-center">
          <div className="text-sm text-danger font-medium">Hit Points</div>
          <div className="text-3xl font-bold text-text-primary">{maxHP}</div>
          <div className="text-xs text-text-muted">1d{hitDice} + {conMod}</div>
        </div>
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
          <div className="text-sm text-primary font-medium">Armor Class</div>
          <div className="text-3xl font-bold text-text-primary">{armorClass}</div>
          <div className="text-xs text-text-muted">Base (no armor)</div>
        </div>
        <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/30 text-center">
          <div className="text-sm text-secondary font-medium">Initiative</div>
          <div className="text-3xl font-bold text-text-primary">{formatModifier(initiative)}</div>
          <div className="text-xs text-text-muted">DEX modifier</div>
        </div>
        <div className="p-4 rounded-lg bg-bg-dark border border-border text-center">
          <div className="text-sm text-text-muted font-medium">Speed</div>
          <div className="text-3xl font-bold text-text-primary">{speed}</div>
          <div className="text-xs text-text-muted">feet</div>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="p-4 rounded-lg bg-bg-dark border border-border">
        <h4 className="text-sm font-semibold text-primary mb-4">Ability Scores</h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {abilities.map(({ id, name }) => {
            const final = getFinalScore(id);
            const mod = calculateModifier(final);
            return (
              <div key={id} className="p-3 rounded-lg bg-bg-medium text-center">
                <div className="text-xs text-text-muted font-medium">{name}</div>
                <div className="text-2xl font-bold text-text-primary">{final}</div>
                <div className={`text-sm font-medium ${mod >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatModifier(mod)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div className="p-4 rounded-lg bg-bg-dark border border-border">
        <h4 className="text-sm font-semibold text-primary mb-4">Proficient Skills</h4>
        <div className="flex flex-wrap gap-2">
          {(character.skills || []).map((skillId) => {
            const skill = SKILLS.find(s => s.id === skillId);
            if (!skill) return null;
            const abilityMod = calculateModifier(getFinalScore(skill.ability as AbilityName));
            const total = abilityMod + proficiencyBonus;
            return (
              <div
                key={skillId}
                className="flex items-center gap-2 px-3 py-2 bg-primary/20 rounded-lg"
              >
                <span className="text-text-primary font-medium">{skill.name}</span>
                <span className={`font-bold ${total >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatModifier(total)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spellcasting (if applicable) */}
      {classData?.spellcasting && (
        <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/30">
          <h4 className="text-sm font-semibold text-secondary mb-4">Spellcasting</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-text-muted">Ability</div>
              <div className="text-lg font-bold text-text-primary capitalize">
                {classData.spellcasting.ability}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Spell Save DC</div>
              <div className="text-lg font-bold text-secondary">{spellSaveDC}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Spell Attack</div>
              <div className="text-lg font-bold text-secondary">{formatModifier(spellAttackBonus!)}</div>
            </div>
          </div>
          {classData.spellcasting.cantripsKnown && classData.spellcasting.cantripsKnown > 0 && (
            <div className="mt-3 text-sm text-text-secondary text-center">
              You know {classData.spellcasting.cantripsKnown} cantrips at 1st level
            </div>
          )}
        </div>
      )}

      {/* Proficiencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-bg-dark border border-border">
          <h4 className="text-sm font-semibold text-primary mb-3">Armor Proficiencies</h4>
          <p className="text-sm text-text-secondary">
            {classData?.armorProficiencies.length
              ? classData.armorProficiencies.join(', ')
              : 'None'}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-bg-dark border border-border">
          <h4 className="text-sm font-semibold text-primary mb-3">Weapon Proficiencies</h4>
          <p className="text-sm text-text-secondary">
            {classData?.weaponProficiencies.join(', ')}
          </p>
        </div>
      </div>

      {/* Saving Throws */}
      <div className="p-4 rounded-lg bg-bg-dark border border-border">
        <h4 className="text-sm font-semibold text-primary mb-3">Saving Throw Proficiencies</h4>
        <div className="flex flex-wrap gap-2">
          {classData?.savingThrows.map((save) => {
            const mod = calculateModifier(getFinalScore(save as AbilityName));
            const total = mod + proficiencyBonus;
            return (
              <div
                key={save}
                className="flex items-center gap-2 px-3 py-2 bg-success/20 rounded-lg"
              >
                <span className="text-text-primary font-medium uppercase">{save.substring(0, 3)}</span>
                <span className={`font-bold ${total >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatModifier(total)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Class Features */}
      {classData && (
        <div className="p-4 rounded-lg bg-bg-dark border border-border">
          <h4 className="text-sm font-semibold text-primary mb-3">Level 1 Features</h4>
          <div className="space-y-3">
            {classData.features
              .filter(f => f.level === 1)
              .map((feature) => (
                <div key={feature.name}>
                  <span className="text-text-primary font-medium">{feature.name}</span>
                  <p className="text-sm text-text-muted mt-1">{feature.description}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Racial Traits */}
      {race && (
        <div className="p-4 rounded-lg bg-bg-dark border border-border">
          <h4 className="text-sm font-semibold text-primary mb-3">{race.name} Traits</h4>
          <div className="space-y-3">
            {race.traits.map((trait) => (
              <div key={trait.name}>
                <span className="text-text-primary font-medium">{trait.name}</span>
                <p className="text-sm text-text-muted mt-1">{trait.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      <div className="p-4 rounded-lg bg-bg-dark border border-border">
        <h4 className="text-sm font-semibold text-primary mb-3">Languages</h4>
        <p className="text-sm text-text-secondary">{race?.languages.join(', ')}</p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          disabled={isCreating}
          className="btn-stone px-6 py-3"
        >
          Back to Details
        </button>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className={`
            btn-adventure px-8 py-3 text-lg
            ${isCreating ? 'opacity-75 cursor-wait' : ''}
          `}
        >
          {isCreating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </span>
          ) : (
            'Create Character'
          )}
        </button>
      </div>
    </div>
  );
}
