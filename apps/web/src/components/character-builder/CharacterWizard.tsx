'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { EnchantedCard } from '@/components/dnd/EnchantedCard';
import { RaceSelection } from './steps/RaceSelection';
import { ClassSelection } from './steps/ClassSelection';
import { AbilityScores } from './steps/AbilityScores';
import { BackgroundSelection } from './steps/BackgroundSelection';
import { SkillSelection } from './steps/SkillSelection';
import { SpellSelection } from './steps/SpellSelection';
import { CharacterDetails } from './steps/CharacterDetails';
import { ReviewCharacter } from './steps/ReviewCharacter';
import { useAuthStore } from '@/stores/authStore';
import { isCaster } from '@/data/classes';
import type { CharacterCreationState, CharacterData } from './types';

interface Step {
  id: string;
  label: string;
  icon: string;
  component: React.ComponentType<{
    character: CharacterCreationState;
    onUpdate: (updates: Partial<CharacterCreationState>) => void;
    onNext: () => void;
    onBack?: () => void;
  }>;
  isConditional?: boolean;
  condition?: (character: CharacterCreationState) => boolean;
}

const STEPS: Step[] = [
  { id: 'race', label: 'Race', icon: '🧬', component: RaceSelection },
  { id: 'class', label: 'Class', icon: '⚔️', component: ClassSelection },
  { id: 'abilities', label: 'Abilities', icon: '💪', component: AbilityScores },
  { id: 'background', label: 'Background', icon: '📜', component: BackgroundSelection },
  { id: 'skills', label: 'Skills', icon: '🎯', component: SkillSelection },
  {
    id: 'spells',
    label: 'Spells',
    icon: '🔮',
    component: SpellSelection,
    isConditional: true,
    condition: (character) => character.class ? isCaster(character.class) : false,
  },
  { id: 'details', label: 'Details', icon: '✨', component: CharacterDetails },
  // ReviewCharacter is handled specially - cast to satisfy type but rendered differently
  { id: 'review', label: 'Review', icon: '📋', component: ReviewCharacter as unknown as Step['component'] },
];

export function CharacterWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [character, setCharacter] = useState<CharacterCreationState>({});
  const token = useAuthStore(state => state.token);

  const updateCharacter = (updates: Partial<CharacterCreationState>) => {
    setCharacter(prev => ({ ...prev, ...updates }));
  };

  const createCharacter = async (characterData: CharacterData): Promise<void> => {
    const response = await fetch('http://localhost:4000/characters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: characterData.name,
        race: characterData.race,
        subrace: characterData.subrace,
        class: characterData.class,
        background: characterData.background,
        strength: characterData.strength,
        dexterity: characterData.dexterity,
        constitution: characterData.constitution,
        intelligence: characterData.intelligence,
        wisdom: characterData.wisdom,
        charisma: characterData.charisma,
        skills: characterData.skills || [],
        equipment: characterData.equipment || [],
        spellsKnown: characterData.spellsKnown || [],
        appearance: characterData.appearance,
        portraitUrl: characterData.portraitUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create character');
    }

    // Navigate to dashboard on success
    router.push('/dashboard?created=true');
  };

  // Filter steps based on conditions (e.g., skip spell selection for non-casters)
  const activeSteps = useMemo(() => {
    return STEPS.filter(step => {
      if (!step.isConditional) return true;
      return step.condition ? step.condition(character) : true;
    });
  }, [character]);

  const currentStepData = activeSteps[currentStep];
  const StepComponent = currentStepData?.component;

  const nextStep = () => {
    if (currentStep < activeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (index: number) => {
    if (index <= currentStep) {
      setCurrentStep(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!StepComponent) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border -translate-y-1/2 z-0" />
          <div
            className="absolute left-0 top-1/2 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(currentStep / (activeSteps.length - 1)) * 100}%` }}
          />

          {activeSteps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = index <= currentStep;

            return (
              <button
                key={step.id}
                onClick={() => isClickable && goToStep(index)}
                disabled={!isClickable}
                className={`
                  relative z-10 flex flex-col items-center transition-all duration-300
                  ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                `}
              >
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xl
                    transition-all duration-300 border-2
                    ${isCompleted
                      ? 'bg-primary border-primary text-bg-primary'
                      : isCurrent
                        ? 'bg-bg-medium border-primary text-primary shadow-glow'
                        : 'bg-bg-dark border-border text-text-muted'
                    }
                    ${isClickable && !isCurrent ? 'hover:scale-110' : ''}
                  `}
                >
                  {isCompleted ? '✓' : step.icon}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium transition-colors duration-300
                    ${isCurrent ? 'text-primary' : isCompleted ? 'text-text-primary' : 'text-text-muted'}
                  `}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <EnchantedCard className="p-6 md:p-8 animate-fade-in-up">
        {currentStepData.id === 'review' ? (
          <ReviewCharacter
            character={character}
            onUpdate={updateCharacter}
            onNext={nextStep}
            onBack={prevStep}
            onComplete={createCharacter}
          />
        ) : (
          <StepComponent
            character={character}
            onUpdate={updateCharacter}
            onNext={nextStep}
            onBack={currentStep > 0 ? prevStep : undefined}
          />
        )}
      </EnchantedCard>
    </div>
  );
}
