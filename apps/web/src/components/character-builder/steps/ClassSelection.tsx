'use client';

import { useState } from 'react';
import { CLASSES, getClassById } from '@/data';
import { getClassImage } from '@/data/staticImages';
import type { StepProps } from '../types';

export function ClassSelection({ character, onUpdate, onNext, onBack }: StepProps) {
  const [selectedClass, setSelectedClass] = useState(character.class || '');
  const [showValidation, setShowValidation] = useState(false);

  const classData = getClassById(selectedClass);

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    setShowValidation(false);
  };

  const handleContinue = () => {
    if (selectedClass) {
      onUpdate({ class: selectedClass });
      onNext();
    } else {
      setShowValidation(true);
    }
  };

  const showClassError = showValidation && !selectedClass;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="dnd-heading-epic text-3xl pb-2">Choose Your Class</h2>
        <p className="text-text-secondary">
          Your class defines your combat abilities, skills, and role in the party.
        </p>
      </div>

      {/* Validation Error Message */}
      {showClassError && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/50 text-danger text-sm animate-pulse">
          Please select a class to continue.
        </div>
      )}

      {/* Class Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${showClassError ? 'ring-2 ring-danger ring-offset-2 ring-offset-bg-dark rounded-lg p-2' : ''}`}>
        {CLASSES.map((c) => (
          <button
            key={c.id}
            onClick={() => handleClassSelect(c.id)}
            className={`
              p-4 rounded-lg border-2 text-left transition-all duration-200
              ${selectedClass === c.id
                ? 'border-primary bg-primary/10 shadow-glow'
                : 'border-border bg-bg-dark hover:border-primary/50 hover:bg-bg-medium'
              }
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 overflow-hidden border-2 border-primary/30">
                <img
                  src={getClassImage(c.id)}
                  alt={c.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-display font-semibold text-text-primary">{c.name}</h3>
                <span className="text-xs text-primary">d{c.hitDice} Hit Die</span>
              </div>
            </div>
            <p className="text-sm text-text-muted line-clamp-2">{c.description}</p>
            <div className="mt-3">
              <span className="text-xs text-text-muted">Primary: </span>
              <span className="text-xs text-primary">{c.primaryAbility}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Class Details */}
      {classData && (
        <div className="mt-8 animate-fade-in-up">
          <div className="dnd-divider mb-6" />
          <h3 className="dnd-heading-section text-xl mb-4">{classData.name} Features</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-bg-dark border border-border">
                <h4 className="text-sm font-semibold text-primary mb-2">Hit Points</h4>
                <p className="text-sm text-text-secondary">
                  <span className="text-text-primary font-medium">Hit Dice:</span> 1d{classData.hitDice} per level
                </p>
                <p className="text-sm text-text-secondary">
                  <span className="text-text-primary font-medium">At 1st Level:</span> {classData.hitDice} + Constitution modifier
                </p>
              </div>

              <div className="p-4 rounded-lg bg-bg-dark border border-border">
                <h4 className="text-sm font-semibold text-primary mb-2">Proficiencies</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-text-muted">Armor: </span>
                    <span className="text-text-secondary">
                      {classData.armorProficiencies.length > 0
                        ? classData.armorProficiencies.join(', ')
                        : 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Weapons: </span>
                    <span className="text-text-secondary">
                      {classData.weaponProficiencies.join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Saving Throws: </span>
                    <span className="text-text-secondary">
                      {classData.savingThrows.map(s => s.toUpperCase()).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Features */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-bg-dark border border-border">
                <h4 className="text-sm font-semibold text-primary mb-2">Level 1 Features</h4>
                <div className="space-y-3">
                  {classData.features
                    .filter(f => f.level === 1)
                    .map((feature) => (
                      <div key={feature.name}>
                        <span className="text-text-primary font-medium text-sm">{feature.name}</span>
                        <p className="text-xs text-text-muted mt-1">{feature.description}</p>
                      </div>
                    ))}
                </div>
              </div>

              {classData.spellcasting && (
                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/30">
                  <h4 className="text-sm font-semibold text-secondary mb-2">Spellcasting</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-text-secondary">
                      <span className="text-text-muted">Ability: </span>
                      {classData.spellcasting.ability.charAt(0).toUpperCase() + classData.spellcasting.ability.slice(1)}
                    </p>
                    {classData.spellcasting.cantripsKnown && classData.spellcasting.cantripsKnown > 0 && (
                      <p className="text-text-secondary">
                        <span className="text-text-muted">Cantrips at 1st Level: </span>
                        {classData.spellcasting.cantripsKnown}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="btn-stone px-6 py-3"
        >
          Back to Race
        </button>
        <button
          onClick={handleContinue}
          className="btn-adventure px-8 py-3 text-lg"
        >
          Continue to Abilities
        </button>
      </div>
    </div>
  );
}
