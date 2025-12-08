'use client';

import { useState, useMemo } from 'react';
import { getClassById, getBackgroundById, SKILLS } from '@/data';
import { calculateModifier, formatModifier } from '@/data/skills';
import type { StepProps, AbilityName } from '../types';

export function SkillSelection({ character, onUpdate, onNext, onBack }: StepProps) {
  const classData = getClassById(character.class || '');
  const background = getBackgroundById(character.background || '');

  // Background gives automatic skill proficiencies
  const backgroundSkills = useMemo(() => {
    return background?.skillProficiencies.map(s => s.toLowerCase().replace(' ', '-')) || [];
  }, [background]);

  // Class skill choices
  const classSkillChoices = classData?.skillChoices.options || [];
  const numClassSkills = classData?.skillChoices.count || 2;

  // Filter to only class skills that aren't already from background
  const availableClassSkills = useMemo(() => {
    return classSkillChoices.filter(skill => !backgroundSkills.includes(skill));
  }, [classSkillChoices, backgroundSkills]);

  const [selectedSkills, setSelectedSkills] = useState<string[]>(() => {
    // Initialize from character skills, but only keep those that are class skill choices
    // (exclude background skills which are tracked separately)
    if (character.skills) {
      const bgSkills = background?.skillProficiencies.map(s => s.toLowerCase().replace(' ', '-')) || [];
      const classChoices = classData?.skillChoices.options || [];
      const available = classChoices.filter(skill => !bgSkills.includes(skill));
      return character.skills.filter(skill => available.includes(skill));
    }
    return [];
  });

  const [showValidation, setShowValidation] = useState(false);

  const handleSkillToggle = (skillId: string) => {
    setShowValidation(false);
    setSelectedSkills(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(s => s !== skillId);
      } else if (prev.length < numClassSkills) {
        return [...prev, skillId];
      }
      return prev;
    });
  };

  const handleContinue = () => {
    if (selectedSkills.length === numClassSkills) {
      // Combine background skills with selected class skills
      const allSkills = [...backgroundSkills, ...selectedSkills];
      onUpdate({ skills: allSkills });
      onNext();
    } else {
      setShowValidation(true);
    }
  };

  const showSkillsError = showValidation && selectedSkills.length !== numClassSkills;
  const remainingSkills = numClassSkills - selectedSkills.length;

  const getAbilityScore = (ability: AbilityName): number => {
    return character[ability] || 10;
  };

  const canContinue = selectedSkills.length === numClassSkills;

  // Group skills by ability
  const skillsByAbility = useMemo(() => {
    const groups: Record<string, typeof SKILLS> = {};
    SKILLS.forEach(skill => {
      if (!groups[skill.ability]) {
        groups[skill.ability] = [];
      }
      groups[skill.ability].push(skill);
    });
    return groups;
  }, []);

  const abilityOrder: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="dnd-heading-epic text-3xl pb-2">Choose Your Skills</h2>
        <p className="text-text-secondary">
          Select {numClassSkills} skill{numClassSkills !== 1 ? 's' : ''} from your class options.
        </p>
      </div>

      {/* Background Skills */}
      {backgroundSkills.length > 0 && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
          <h3 className="text-sm font-semibold text-primary mb-2">
            Skills from {background?.name} Background (Automatic)
          </h3>
          <div className="flex flex-wrap gap-2">
            {backgroundSkills.map(skillId => {
              const skill = SKILLS.find(s => s.id === skillId);
              if (!skill) return null;
              const abilityMod = calculateModifier(getAbilityScore(skill.ability as AbilityName));
              const profBonus = 2; // Level 1 proficiency bonus
              const total = abilityMod + profBonus;
              return (
                <div
                  key={skillId}
                  className="flex items-center gap-2 px-3 py-2 bg-primary/20 rounded-lg"
                >
                  <span className="text-primary font-medium">{skill.name}</span>
                  <span className="text-xs text-text-muted">({skill.ability.substring(0, 3).toUpperCase()})</span>
                  <span className={`text-sm font-bold ${total >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatModifier(total)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Validation Error Message */}
      {showSkillsError && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/50 text-danger text-sm animate-pulse">
          Please select {remainingSkills} more skill{remainingSkills !== 1 ? 's' : ''} to continue.
        </div>
      )}

      {/* Class Skill Selection */}
      <div className={`p-4 rounded-lg bg-bg-dark border ${showSkillsError ? 'border-danger ring-2 ring-danger ring-offset-2 ring-offset-bg-dark' : 'border-border'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Choose {numClassSkills} {classData?.name} Skills
          </h3>
          <span className={`text-sm ${canContinue ? 'text-success' : showSkillsError ? 'text-danger font-medium' : 'text-text-muted'}`}>
            {selectedSkills.length} / {numClassSkills} selected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableClassSkills.map(skillId => {
            const skill = SKILLS.find(s => s.id === skillId);
            if (!skill) return null;
            const isSelected = selectedSkills.includes(skillId);
            const abilityMod = calculateModifier(getAbilityScore(skill.ability as AbilityName));
            const profBonus = 2;
            const total = abilityMod + (isSelected ? profBonus : 0);

            return (
              <button
                key={skillId}
                onClick={() => handleSkillToggle(skillId)}
                disabled={!isSelected && selectedSkills.length >= numClassSkills}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all duration-200
                  ${isSelected
                    ? 'border-secondary bg-secondary/10 shadow-glow-purple'
                    : 'border-border bg-bg-medium hover:border-secondary/50'
                  }
                  ${!isSelected && selectedSkills.length >= numClassSkills
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-text-primary">{skill.name}</span>
                    <span className="text-xs text-text-muted ml-2">
                      ({skill.ability.substring(0, 3).toUpperCase()})
                    </span>
                  </div>
                  <div className={`text-lg font-bold ${total >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatModifier(total)}
                  </div>
                </div>
                <p className="text-xs text-text-muted mt-1">{skill.description}</p>
                {isSelected && (
                  <div className="mt-2 text-xs text-secondary">
                    +{profBonus} proficiency bonus applied
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* All Skills Overview */}
      <div className="mt-8">
        <div className="dnd-divider mb-6" />
        <h3 className="dnd-heading-section text-xl mb-4">Skills Overview</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {abilityOrder.map(ability => {
            const abilitySkills = skillsByAbility[ability] || [];
            const score = getAbilityScore(ability);
            const mod = calculateModifier(score);

            return (
              <div key={ability} className="p-4 rounded-lg bg-bg-dark border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-text-primary capitalize">{ability}</h4>
                  <div className="text-right">
                    <span className="text-text-muted text-sm">{score}</span>
                    <span className={`ml-2 font-bold ${mod >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatModifier(mod)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {abilitySkills.map(skill => {
                    const isProficient = backgroundSkills.includes(skill.id) || selectedSkills.includes(skill.id);
                    const total = mod + (isProficient ? 2 : 0);
                    return (
                      <div key={skill.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isProficient ? 'bg-primary' : 'bg-bg-medium'}`} />
                          <span className={isProficient ? 'text-text-primary' : 'text-text-muted'}>
                            {skill.name}
                          </span>
                        </div>
                        <span className={`font-medium ${total >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatModifier(total)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="btn-stone px-6 py-3"
        >
          Back to Background
        </button>
        <button
          onClick={handleContinue}
          className="btn-adventure px-8 py-3 text-lg"
        >
          Continue to Details
        </button>
      </div>
    </div>
  );
}
