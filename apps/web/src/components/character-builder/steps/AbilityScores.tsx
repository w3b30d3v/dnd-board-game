'use client';

import { useState } from 'react';
import { getRaceById } from '@/data';
import { STANDARD_ARRAY, SKILLS, calculateModifier, formatModifier } from '@/data/skills';
import type { StepProps, AbilityName } from '../types';

const ABILITIES: { id: AbilityName; name: string; description: string }[] = [
  { id: 'strength', name: 'Strength', description: 'Physical power, athletic training, melee combat' },
  { id: 'dexterity', name: 'Dexterity', description: 'Agility, reflexes, balance, ranged combat' },
  { id: 'constitution', name: 'Constitution', description: 'Health, stamina, vital force' },
  { id: 'intelligence', name: 'Intelligence', description: 'Mental acuity, information recall, analytical skill' },
  { id: 'wisdom', name: 'Wisdom', description: 'Awareness, intuition, insight' },
  { id: 'charisma', name: 'Charisma', description: 'Confidence, eloquence, leadership' },
];

export function AbilityScores({ character, onUpdate, onNext, onBack }: StepProps) {
  const [assignments, setAssignments] = useState<Partial<Record<AbilityName, number>>>(() => {
    // Initialize from character if available
    const initial: Partial<Record<AbilityName, number>> = {};
    if (character.strength) initial.strength = character.strength;
    if (character.dexterity) initial.dexterity = character.dexterity;
    if (character.constitution) initial.constitution = character.constitution;
    if (character.intelligence) initial.intelligence = character.intelligence;
    if (character.wisdom) initial.wisdom = character.wisdom;
    if (character.charisma) initial.charisma = character.charisma;
    return initial;
  });

  const [draggedValue, setDraggedValue] = useState<number | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const race = getRaceById(character.race || '');
  const subrace = race?.subraces?.find(s => s.id === character.subrace);

  // Get racial bonuses
  const racialBonuses: Partial<Record<AbilityName, number>> = {
    ...(race?.abilityBonuses || {}),
    ...(subrace?.abilityBonuses || {}),
  };

  // Get assigned values
  const assignedValues = Object.values(assignments).filter((v): v is number => v !== undefined);

  const handleDragStart = (value: number) => {
    setDraggedValue(value);
  };

  const handleDrop = (ability: AbilityName) => {
    if (draggedValue !== null) {
      setAssignments(prev => ({
        ...prev,
        [ability]: draggedValue,
      }));
      setDraggedValue(null);
      setShowValidation(false);
    }
  };

  const handleRemove = (ability: AbilityName) => {
    setAssignments(prev => {
      const updated = { ...prev };
      delete updated[ability];
      return updated;
    });
  };

  const handleAutoAssign = () => {
    // Simple auto-assign based on class primary ability
    const classId = character.class?.toLowerCase() || '';
    const priorityOrder: Record<string, AbilityName[]> = {
      barbarian: ['strength', 'constitution', 'dexterity', 'wisdom', 'charisma', 'intelligence'],
      bard: ['charisma', 'dexterity', 'constitution', 'wisdom', 'intelligence', 'strength'],
      cleric: ['wisdom', 'constitution', 'strength', 'charisma', 'dexterity', 'intelligence'],
      druid: ['wisdom', 'constitution', 'dexterity', 'intelligence', 'charisma', 'strength'],
      fighter: ['strength', 'constitution', 'dexterity', 'wisdom', 'charisma', 'intelligence'],
      monk: ['dexterity', 'wisdom', 'constitution', 'strength', 'charisma', 'intelligence'],
      paladin: ['strength', 'charisma', 'constitution', 'wisdom', 'dexterity', 'intelligence'],
      ranger: ['dexterity', 'wisdom', 'constitution', 'intelligence', 'strength', 'charisma'],
      rogue: ['dexterity', 'constitution', 'charisma', 'intelligence', 'wisdom', 'strength'],
      sorcerer: ['charisma', 'constitution', 'dexterity', 'wisdom', 'intelligence', 'strength'],
      warlock: ['charisma', 'constitution', 'dexterity', 'wisdom', 'intelligence', 'strength'],
      wizard: ['intelligence', 'constitution', 'dexterity', 'wisdom', 'charisma', 'strength'],
    };

    const order = priorityOrder[classId] || ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const sortedScores = [...STANDARD_ARRAY].sort((a, b) => b - a);

    const newAssignments: Partial<Record<AbilityName, number>> = {};
    order.forEach((ability, index) => {
      newAssignments[ability] = sortedScores[index];
    });

    setAssignments(newAssignments);
  };

  const handleClear = () => {
    setAssignments({});
  };

  const handleContinue = () => {
    if (Object.keys(assignments).length === 6) {
      onUpdate({
        strength: assignments.strength!,
        dexterity: assignments.dexterity!,
        constitution: assignments.constitution!,
        intelligence: assignments.intelligence!,
        wisdom: assignments.wisdom!,
        charisma: assignments.charisma!,
      });
      onNext();
    } else {
      setShowValidation(true);
    }
  };

  const allAssigned = Object.keys(assignments).length === 6;

  // Get unassigned abilities for validation highlighting
  const unassignedAbilities = ABILITIES.filter(a => assignments[a.id] === undefined).map(a => a.id);

  // Calculate point buy equivalent (for reference)
  const getFinalScore = (ability: AbilityName): number => {
    const base = assignments[ability] || 0;
    const bonus = racialBonuses[ability] || 0;
    return base + bonus;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="dnd-heading-epic text-3xl pb-2">Assign Ability Scores</h2>
        <p className="text-text-secondary">
          Drag and drop scores from the Standard Array to your abilities.
        </p>
      </div>

      {/* Standard Array Pool */}
      <div className="p-4 rounded-lg bg-bg-dark border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-primary">Standard Array</h3>
          <div className="flex gap-2">
            <button
              onClick={handleAutoAssign}
              className="text-xs px-3 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              Auto-Assign
            </button>
            <button
              onClick={handleClear}
              className="text-xs px-3 py-1 rounded bg-bg-medium text-text-muted hover:text-text-secondary transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {STANDARD_ARRAY.map((value, index) => {
            // Check if this specific instance is used
            const usedCount = assignedValues.filter(v => v === value).length;
            const instanceIndex = STANDARD_ARRAY.slice(0, index + 1).filter(s => s === value).length - 1;
            const thisInstanceUsed = instanceIndex < usedCount;

            return (
              <div
                key={`${value}-${index}`}
                draggable={!thisInstanceUsed}
                onDragStart={() => !thisInstanceUsed && handleDragStart(value)}
                className={`
                  w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg
                  ${thisInstanceUsed
                    ? 'bg-bg-medium text-text-muted cursor-not-allowed opacity-40'
                    : 'bg-primary/20 text-primary cursor-grab hover:bg-primary/30 active:cursor-grabbing'
                  }
                  transition-all duration-200
                `}
              >
                {value}
              </div>
            );
          })}
        </div>
      </div>

      {/* Racial Bonuses Info */}
      {Object.keys(racialBonuses).length > 0 && (
        <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/30">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-secondary font-medium">Racial Bonuses ({race?.name}{subrace ? ` - ${subrace.name}` : ''}):</span>
            <div className="flex gap-2">
              {Object.entries(racialBonuses).map(([ability, bonus]) => (
                <span key={ability} className="px-2 py-0.5 bg-secondary/20 rounded text-secondary text-xs">
                  +{bonus} {ability.substring(0, 3).toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Message */}
      {showValidation && unassignedAbilities.length > 0 && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/50 text-danger text-sm animate-pulse">
          Please assign scores to all abilities. Missing: {unassignedAbilities.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')}
        </div>
      )}

      {/* Ability Score Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ABILITIES.map((ability) => {
          const baseScore = assignments[ability.id];
          const racialBonus = racialBonuses[ability.id] || 0;
          const finalScore = baseScore ? baseScore + racialBonus : null;
          const modifier = finalScore ? calculateModifier(finalScore) : null;
          const showAbilityError = showValidation && !baseScore;

          return (
            <div
              key={ability.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(ability.id)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200
                ${baseScore
                  ? 'border-primary/50 bg-primary/5'
                  : showAbilityError
                    ? 'border-danger border-dashed bg-danger/5 ring-2 ring-danger ring-offset-1 ring-offset-bg-dark animate-pulse'
                    : 'border-border border-dashed bg-bg-dark hover:border-primary/30'
                }
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-display font-semibold text-text-primary">{ability.name}</h4>
                  <p className="text-xs text-text-muted">{ability.description}</p>
                </div>
                {baseScore && (
                  <button
                    onClick={() => handleRemove(ability.id)}
                    className="text-text-muted hover:text-danger text-sm p-1"
                    title="Remove"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 mt-3">
                {baseScore ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">{baseScore}</span>
                      {racialBonus > 0 && (
                        <span className="text-secondary text-sm">+{racialBonus}</span>
                      )}
                      {racialBonus > 0 && (
                        <span className="text-text-muted">=</span>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-text-primary">{finalScore}</div>
                      <div className={`text-sm font-medium ${modifier && modifier >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatModifier(modifier!)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-text-muted text-sm italic">
                    Drag a score here
                  </div>
                )}
              </div>

              {/* Related Skills */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex flex-wrap gap-1">
                  {SKILLS.filter(s => s.ability === ability.id).map((skill) => (
                    <span
                      key={skill.id}
                      className="text-xs px-2 py-0.5 bg-bg-medium rounded text-text-muted"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {allAssigned && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/30 animate-fade-in-up">
          <h4 className="text-success font-semibold mb-2">Ability Scores Complete!</h4>
          <div className="flex flex-wrap gap-4">
            {ABILITIES.map((ability) => {
              const final = getFinalScore(ability.id);
              const mod = calculateModifier(final);
              return (
                <div key={ability.id} className="text-center">
                  <div className="text-xs text-text-muted uppercase">{ability.id.substring(0, 3)}</div>
                  <div className="font-bold text-text-primary">{final}</div>
                  <div className={`text-xs ${mod >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatModifier(mod)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="btn-stone px-6 py-3"
        >
          Back to Class
        </button>
        <button
          onClick={handleContinue}
          className="btn-adventure px-8 py-3 text-lg"
        >
          Continue to Background
        </button>
      </div>
    </div>
  );
}
