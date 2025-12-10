'use client';

import { useState } from 'react';
import { BACKGROUNDS, getBackgroundById } from '@/data';
import type { StepProps } from '../types';

// Background icons - visually represent each background
const BACKGROUND_ICONS: Record<string, string> = {
  acolyte: '🙏',
  criminal: '🥷',
  'folk-hero': '🦸',
  noble: '👑',
  sage: '📚',
  soldier: '⚔️',
  hermit: '🏔️',
  entertainer: '🎭',
};

export function BackgroundSelection({ character, onUpdate, onNext, onBack }: StepProps) {
  const [selectedBackground, setSelectedBackground] = useState(character.background || '');
  const [showValidation, setShowValidation] = useState(false);

  const background = getBackgroundById(selectedBackground);

  const handleBackgroundSelect = (backgroundId: string) => {
    setSelectedBackground(backgroundId);
    setShowValidation(false);
  };

  const handleContinue = () => {
    if (selectedBackground) {
      onUpdate({ background: selectedBackground });
      onNext();
    } else {
      setShowValidation(true);
    }
  };

  const showBackgroundError = showValidation && !selectedBackground;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="dnd-heading-epic text-3xl pb-2">Choose Your Background</h2>
        <p className="text-text-secondary">
          Your background reveals where you came from and your place in the world.
        </p>
      </div>

      {/* Validation Error Message */}
      {showBackgroundError && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/50 text-danger text-sm animate-pulse">
          Please select a background to continue.
        </div>
      )}

      {/* Background Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showBackgroundError ? 'ring-2 ring-danger ring-offset-2 ring-offset-bg-dark rounded-lg p-2' : ''}`}>
        {BACKGROUNDS.map((bg) => (
          <button
            key={bg.id}
            onClick={() => handleBackgroundSelect(bg.id)}
            className={`
              p-4 rounded-lg border-2 text-left transition-all duration-200
              ${selectedBackground === bg.id
                ? 'border-primary bg-primary/10 shadow-glow'
                : 'border-border bg-bg-dark hover:border-primary/50 hover:bg-bg-medium'
              }
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center border-2 border-primary/30 text-2xl">
                {BACKGROUND_ICONS[bg.id] || '📜'}
              </div>
              <h3 className="font-display font-semibold text-text-primary">{bg.name}</h3>
            </div>
            <p className="text-sm text-text-muted line-clamp-2">{bg.description}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {bg.skillProficiencies.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Background Details */}
      {background && (
        <div className="mt-8 animate-fade-in-up">
          <div className="dnd-divider mb-6" />
          <h3 className="dnd-heading-section text-xl mb-4">{background.name} Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Proficiencies & Feature */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-bg-dark border border-border">
                <h4 className="text-sm font-semibold text-primary mb-2">Skill Proficiencies</h4>
                <div className="flex flex-wrap gap-2">
                  {background.skillProficiencies.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-primary/20 text-primary rounded text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {background.toolProficiencies && background.toolProficiencies.length > 0 && (
                <div className="p-4 rounded-lg bg-bg-dark border border-border">
                  <h4 className="text-sm font-semibold text-primary mb-2">Tool Proficiencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {background.toolProficiencies.map((tool) => (
                      <span key={tool} className="px-3 py-1 bg-secondary/20 text-secondary rounded text-sm">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <h4 className="text-sm font-semibold text-primary mb-2">Feature: {background.feature.name}</h4>
                <p className="text-sm text-text-secondary">{background.feature.description}</p>
              </div>
            </div>

            {/* Right Column - Personality Suggestions */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-bg-dark border border-border">
                <h4 className="text-sm font-semibold text-text-primary mb-3">Personality Traits</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  {background.personalityTraits.slice(0, 3).map((trait, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{trait}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-bg-dark border border-border">
                <h4 className="text-sm font-semibold text-text-primary mb-3">Ideals</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  {background.ideals.slice(0, 3).map((ideal, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-secondary">•</span>
                      <span>{ideal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-bg-dark border border-border">
                <h4 className="text-sm font-semibold text-text-primary mb-3">Bonds</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  {background.bonds.slice(0, 2).map((bond, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-success">•</span>
                      <span>{bond}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-bg-dark border border-border">
                <h4 className="text-sm font-semibold text-text-primary mb-3">Flaws</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  {background.flaws.slice(0, 2).map((flaw, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-danger">•</span>
                      <span>{flaw}</span>
                    </li>
                  ))}
                </ul>
              </div>
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
          Back to Abilities
        </button>
        <button
          onClick={handleContinue}
          className="btn-adventure px-8 py-3 text-lg"
        >
          Continue to Skills
        </button>
      </div>
    </div>
  );
}
