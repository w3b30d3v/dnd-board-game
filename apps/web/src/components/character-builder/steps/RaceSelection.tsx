'use client';

import { useState } from 'react';
import { RACES, getRaceById } from '@/data';
import type { StepProps } from '../types';

export function RaceSelection({ character, onUpdate, onNext }: StepProps) {
  const [selectedRace, setSelectedRace] = useState(character.race || '');
  const [selectedSubrace, setSelectedSubrace] = useState(character.subrace || '');
  const [showValidation, setShowValidation] = useState(false);

  const race = getRaceById(selectedRace);
  const hasSubraces = race?.subraces && race.subraces.length > 0;

  const handleRaceSelect = (raceId: string) => {
    setSelectedRace(raceId);
    setSelectedSubrace('');
    setShowValidation(false);
  };

  const handleContinue = () => {
    if (selectedRace && (!hasSubraces || selectedSubrace)) {
      onUpdate({
        race: selectedRace,
        subrace: selectedSubrace || undefined,
      });
      onNext();
    } else {
      setShowValidation(true);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canContinue = selectedRace && (!hasSubraces || selectedSubrace);
  const showRaceError = showValidation && !selectedRace;
  const showSubraceError = showValidation && selectedRace && hasSubraces && !selectedSubrace;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="dnd-heading-epic text-3xl pb-2">Choose Your Race</h2>
        <p className="text-text-secondary">
          Your race determines your character&apos;s physical traits, abilities, and place in the world.
        </p>
      </div>

      {/* Validation Error Message */}
      {showRaceError && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/50 text-danger text-sm animate-pulse">
          Please select a race to continue.
        </div>
      )}

      {/* Race Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${showRaceError ? 'ring-2 ring-danger ring-offset-2 ring-offset-bg-dark rounded-lg p-2' : ''}`}>
        {RACES.map((r) => (
          <button
            key={r.id}
            onClick={() => handleRaceSelect(r.id)}
            className={`
              p-4 rounded-lg border-2 text-left transition-all duration-200
              ${selectedRace === r.id
                ? 'border-primary bg-primary/10 shadow-glow'
                : 'border-border bg-bg-dark hover:border-primary/50 hover:bg-bg-medium'
              }
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
                <span className="text-lg">
                  {r.id === 'human' && '👤'}
                  {r.id === 'elf' && '🧝'}
                  {r.id === 'dwarf' && '⛏️'}
                  {r.id === 'halfling' && '🍀'}
                  {r.id === 'dragonborn' && '🐉'}
                  {r.id === 'gnome' && '🔧'}
                  {r.id === 'half-elf' && '🌟'}
                  {r.id === 'half-orc' && '💪'}
                  {r.id === 'tiefling' && '😈'}
                </span>
              </div>
              <h3 className="font-display font-semibold text-text-primary">{r.name}</h3>
            </div>
            <p className="text-sm text-text-muted line-clamp-2">{r.description}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {Object.entries(r.abilityBonuses).map(([ability, bonus]) => (
                <span
                  key={ability}
                  className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded"
                >
                  +{bonus} {ability.substring(0, 3).toUpperCase()}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Subrace Selection */}
      {race && hasSubraces && (
        <div className="mt-8 animate-fade-in-up">
          <div className="dnd-divider mb-6" />
          <h3 className="dnd-heading-section text-xl mb-4">Choose Your Subrace</h3>
          {showSubraceError && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/50 text-danger text-sm animate-pulse">
              Please select a subrace to continue.
            </div>
          )}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${showSubraceError ? 'ring-2 ring-danger ring-offset-2 ring-offset-bg-dark rounded-lg p-2' : ''}`}>
            {race.subraces!.map((subrace) => (
              <button
                key={subrace.id}
                onClick={() => { setSelectedSubrace(subrace.id); setShowValidation(false); }}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all duration-200
                  ${selectedSubrace === subrace.id
                    ? 'border-secondary bg-secondary/10 shadow-glow-purple'
                    : 'border-border bg-bg-dark hover:border-secondary/50 hover:bg-bg-medium'
                  }
                `}
              >
                <h4 className="font-display font-semibold text-text-primary mb-2">{subrace.name}</h4>
                <p className="text-sm text-text-muted line-clamp-2">{subrace.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {Object.entries(subrace.abilityBonuses).map(([ability, bonus]) => (
                    <span
                      key={ability}
                      className="text-xs px-2 py-0.5 bg-secondary/20 text-secondary rounded"
                    >
                      +{bonus} {ability.substring(0, 3).toUpperCase()}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Race Details */}
      {race && (
        <div className="mt-8 animate-fade-in-up">
          <div className="dnd-divider mb-6" />
          <h3 className="dnd-heading-section text-xl mb-4">{race.name} Traits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Speed:</span>
                <span className="text-text-primary font-medium">{race.speed} ft.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Size:</span>
                <span className="text-text-primary font-medium">{race.size}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Languages:</span>
                <span className="text-text-primary font-medium">{race.languages.join(', ')}</span>
              </div>
            </div>
            <div className="space-y-2">
              {race.traits.map((trait) => (
                <div key={trait.name} className="text-sm">
                  <span className="text-primary font-medium">{trait.name}:</span>{' '}
                  <span className="text-text-secondary">{trait.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleContinue}
          className="btn-adventure px-8 py-3 text-lg"
        >
          Continue to Class
        </button>
      </div>
    </div>
  );
}
