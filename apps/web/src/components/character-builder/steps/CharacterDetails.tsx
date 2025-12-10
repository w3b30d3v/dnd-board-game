'use client';

import { useState, useCallback } from 'react';
import { getRaceById, getClassById, getBackgroundById } from '@/data';
import { api } from '@/lib/api';
import type { StepProps } from '../types';


// Generic personality traits (clean language)
const GENERIC_PERSONALITY_TRAITS = [
  "I always try to see the best in people.",
  "I'm fiercely loyal to those who earn my trust.",
  "I prefer actions over words.",
  "I'm curious about everything and everyone.",
  "I find humor in most situations.",
  "I'm a natural leader who takes charge in difficult situations.",
  "I'm quiet and observant, preferring to listen before speaking.",
  "I'm passionate about my beliefs and defend them vigorously.",
  "I'm generous to a fault, often giving more than I can afford.",
  "I'm cautious and methodical in my approach to problems.",
  "I have an unshakeable sense of justice.",
  "I'm adaptable and thrive in changing circumstances.",
];

const GENERIC_IDEALS = [
  "Honor: I always keep my word and act with integrity.",
  "Freedom: Every being deserves the right to choose their own path.",
  "Knowledge: Understanding the world makes it a better place.",
  "Protection: The strong must defend those who cannot defend themselves.",
  "Balance: Harmony between opposing forces is essential.",
  "Growth: We must always strive to better ourselves.",
  "Community: Together we are stronger than apart.",
  "Justice: Wrongdoing must be corrected and prevented.",
  "Compassion: Kindness and empathy guide my actions.",
  "Courage: Fear must never dictate my choices.",
];

const GENERIC_BONDS = [
  "I will protect my family at any cost.",
  "A mentor shaped who I am today, and I owe them everything.",
  "I seek to redeem myself for a past failure.",
  "I carry a memento from someone dear who is no longer with me.",
  "My homeland calls to me, and I long to return someday.",
  "I made a promise that I intend to keep, no matter what.",
  "A friend sacrificed much for me, and I will honor that debt.",
  "I seek to prove myself worthy of a legacy.",
  "There is someone I must find who holds the key to my past.",
  "I am bound by duty to complete an important task.",
];

const GENERIC_FLAWS = [
  "I struggle to trust others, even those who have proven themselves.",
  "I can be stubborn when I believe I'm right.",
  "I sometimes act before thinking things through.",
  "I have difficulty asking for help when I need it.",
  "I hold grudges longer than I should.",
  "I'm easily distracted by interesting new discoveries.",
  "I have a tendency to overcommit to too many things.",
  "I'm overly critical of myself and my abilities.",
  "I sometimes put my goals ahead of others' feelings.",
  "I can be overprotective of those I care about.",
];

// Backstory templates that incorporate character details
const generateBackstory = (
  race: string,
  className: string,
  background: string,
  trait: string,
  ideal: string,
  bond: string,
  flaw: string
): string => {
  const backstoryTemplates = [
    `Born into a ${race} community, {name} showed early signs of the aptitude that would lead them to become a ${className}. The ${background} life shaped their worldview, teaching them that ${ideal.toLowerCase().split(':')[1]?.trim() || 'honor matters'}. ${trait} This drive came from a deep bond: ${bond.toLowerCase()} However, they carry a personal challenge - ${flaw.toLowerCase()}`,

    `The path of a ${className} called to this ${race} from an early age. Growing up as a ${background}, they learned valuable lessons about the world. ${trait} Their guiding principle has always been clear: ${ideal.toLowerCase().split(':')[1]?.trim() || 'doing what is right'}. What drives them forward is simple: ${bond.toLowerCase()} Yet they acknowledge their weakness - ${flaw.toLowerCase()}`,

    `From humble beginnings, this ${race} ${className} emerged from a ${background} background with determination in their heart. ${trait} The world taught them an important truth: ${ideal.toLowerCase().split(':')[1]?.trim() || 'perseverance leads to success'}. Their motivation remains strong: ${bond.toLowerCase()} Though they sometimes struggle with ${flaw.toLowerCase().replace('i ', 'their tendency to ')}`,

    `Adventure called this ${race} away from their ${background} origins and set them on the path of a ${className}. ${trait} Life has reinforced their core belief: ${ideal.toLowerCase().split(':')[1]?.trim() || 'actions speak louder than words'}. At their core, ${bond.toLowerCase()} The journey has not been without challenges, as ${flaw.toLowerCase()}`,
  ];

  return backstoryTemplates[Math.floor(Math.random() * backstoryTemplates.length)];
};

export function CharacterDetails({ character, onUpdate, onNext, onBack }: StepProps) {
  const [name, setName] = useState(character.name || '');
  const [personalityTrait, setPersonalityTrait] = useState('');
  const [ideal, setIdeal] = useState('');
  const [bond, setBond] = useState('');
  const [flaw, setFlaw] = useState('');
  const [backstory, setBackstory] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const race = getRaceById(character.race || '');
  const classData = getClassById(character.class || '');
  const background = getBackgroundById(character.background || '');

  // Random generation functions
  const getRandomItem = useCallback(<T,>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
  }, []);

  const handleRandomPersonalityTrait = useCallback(() => {
    const options = [...(background?.personalityTraits || []), ...GENERIC_PERSONALITY_TRAITS];
    setPersonalityTrait(getRandomItem(options));
  }, [background, getRandomItem]);

  const handleRandomIdeal = useCallback(() => {
    const options = [...(background?.ideals || []), ...GENERIC_IDEALS];
    setIdeal(getRandomItem(options));
  }, [background, getRandomItem]);

  const handleRandomBond = useCallback(() => {
    const options = [...(background?.bonds || []), ...GENERIC_BONDS];
    setBond(getRandomItem(options));
  }, [background, getRandomItem]);

  const handleRandomFlaw = useCallback(() => {
    const options = [...(background?.flaws || []), ...GENERIC_FLAWS];
    setFlaw(getRandomItem(options));
  }, [background, getRandomItem]);

  const handleRandomizeAll = useCallback(() => {
    handleRandomPersonalityTrait();
    handleRandomIdeal();
    handleRandomBond();
    handleRandomFlaw();
    // Delay backstory generation to use the newly set values
    setTimeout(() => {
      const newTrait = getRandomItem([...(background?.personalityTraits || []), ...GENERIC_PERSONALITY_TRAITS]);
      const newIdeal = getRandomItem([...(background?.ideals || []), ...GENERIC_IDEALS]);
      const newBond = getRandomItem([...(background?.bonds || []), ...GENERIC_BONDS]);
      const newFlaw = getRandomItem([...(background?.flaws || []), ...GENERIC_FLAWS]);

      const generated = generateBackstory(
        race?.name || 'adventurer',
        classData?.name || 'hero',
        background?.name || 'traveler',
        newTrait,
        newIdeal,
        newBond,
        newFlaw
      );
      setBackstory(generated);
    }, 0);
  }, [handleRandomPersonalityTrait, handleRandomIdeal, handleRandomBond, handleRandomFlaw, race, classData, background, getRandomItem]);

  // API-based personality generation (uses backend with race/class/background-specific templates)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const generateFromAPI = useCallback(async (field: string): Promise<string | null> => {
    try {
      const response = await api.post<{ success: boolean; content?: string }>('/media/generate/personality', {
        field,
        race: character.race,
        class: character.class,
        background: character.background,
        name: name || undefined,
      });
      if (response.success) {
        return response.content || null;
      }
    } catch (error) {
      console.warn('API generation failed, using local fallback:', error);
    }
    return null;
  }, [character.race, character.class, character.background, name]);

  // Generate all personality fields from API
  const handleGenerateAllFromAPI = useCallback(async () => {
    setIsGenerating(true);
    try {
      const response = await api.post<{
        success: boolean;
        personalityTrait?: string;
        ideal?: string;
        bond?: string;
        flaw?: string;
        backstory?: string;
      }>('/media/generate/personality/all', {
        race: character.race,
        class: character.class,
        background: character.background,
        name: name || undefined,
      });
      if (response.success) {
        setPersonalityTrait(response.personalityTrait || '');
        setIdeal(response.ideal || '');
        setBond(response.bond || '');
        setFlaw(response.flaw || '');
        setBackstory(response.backstory || '');
      } else {
        // Fallback to local generation
        handleRandomizeAll();
      }
    } catch (error) {
      console.warn('API generation failed, using local fallback:', error);
      handleRandomizeAll();
    } finally {
      setIsGenerating(false);
    }
  }, [character.race, character.class, character.background, name, handleRandomizeAll]);

  const handleContinue = () => {
    if (name.trim()) {
      onUpdate({
        name: name.trim(),
        appearance: {
          personalityTrait,
          ideal,
          bond,
          flaw,
          backstory,
        },
      });
      onNext();
    } else {
      setShowValidation(true);
    }
  };
  const showNameError = showValidation && !name.trim();

  // Name suggestions based on race
  const getNameSuggestions = (): string[] => {
    const suggestions: Record<string, string[]> = {
      human: ['Marcus', 'Elena', 'Aldric', 'Lyra', 'Theron', 'Isolde'],
      elf: ['Aerendyl', 'Caelynn', 'Thalanil', 'Seraphina', 'Galadrien', 'Vaeril'],
      dwarf: ['Thorin', 'Brunhilde', 'Dolgrim', 'Helga', 'Barendd', 'Dagnal'],
      halfling: ['Milo', 'Rosie', 'Finnian', 'Lidda', 'Corrin', 'Seraphina'],
      dragonborn: ['Kriv', 'Biri', 'Arjhan', 'Kava', 'Medrash', 'Sora'],
      gnome: ['Gimble', 'Nyx', 'Zook', 'Breena', 'Namfoodle', 'Carlin'],
      'half-elf': ['Taelar', 'Arianna', 'Kyrian', 'Mialee', 'Shaelan', 'Elysia'],
      'half-orc': ['Grok', 'Shel', 'Thokk', 'Yeva', 'Dench', 'Emen'],
      tiefling: ['Morthos', 'Rieta', 'Akmenos', 'Bryseis', 'Therai', 'Kallista'],
    };
    return suggestions[character.race || ''] || suggestions.human;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="dnd-heading-epic text-3xl pb-2">Character Details</h2>
        <p className="text-text-secondary">
          Give your hero a name and define their personality.
        </p>
      </div>

      {/* Character Summary */}
      <div className="p-4 rounded-lg bg-bg-dark border border-border">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Character Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-text-muted">Race: </span>
            <span className="text-primary font-medium">{race?.name}</span>
          </div>
          <div>
            <span className="text-text-muted">Class: </span>
            <span className="text-primary font-medium">{classData?.name}</span>
          </div>
          <div>
            <span className="text-text-muted">Background: </span>
            <span className="text-primary font-medium">{background?.name}</span>
          </div>
        </div>
      </div>

      {/* Character Name */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Character Name <span className="text-danger">*</span>
          </label>
          {showNameError && (
            <div className="mb-2 p-2 rounded-lg bg-danger/10 border border-danger/50 text-danger text-sm animate-pulse">
              Please enter a name for your character.
            </div>
          )}
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setShowValidation(false); }}
            placeholder="Enter your character's name..."
            className={`w-full px-4 py-3 rounded-lg bg-bg-dark border-2 text-text-primary placeholder-text-muted focus:border-primary focus:outline-none transition-colors ${
              showNameError
                ? 'border-danger ring-2 ring-danger ring-offset-1 ring-offset-bg-dark'
                : 'border-border'
            }`}
            maxLength={50}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-text-muted">Suggestions:</span>
            {getNameSuggestions().map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setName(suggestion)}
                className="text-xs px-2 py-1 rounded bg-bg-medium text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Personality Section */}
      <div className="mt-8">
        <div className="dnd-divider mb-6" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="dnd-heading-section text-xl mb-0 border-none pb-0">Personality (Optional)</h3>
          <button
            onClick={handleGenerateAllFromAPI}
            disabled={isGenerating}
            className="btn-magic text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
            type="button"
            title="Generate all personality fields"
          >
            <span>{isGenerating ? '⏳' : '✨'}</span> {isGenerating ? 'Generating...' : 'Generate All'}
          </button>
        </div>
        <p className="text-sm text-text-muted mb-4">
          These details help bring your character to life. Click Generate All or select from the options below.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personality Trait */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Personality Trait
            </label>
            <select
              value={personalityTrait}
              onChange={(e) => setPersonalityTrait(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bg-dark border-2 border-border text-text-primary focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">Select or write your own...</option>
              {background?.personalityTraits.map((trait, index) => (
                <option key={index} value={trait}>
                  {trait.length > 60 ? trait.substring(0, 60) + '...' : trait}
                </option>
              ))}
            </select>
            {personalityTrait ? (
              <div className="mt-2 p-2 rounded bg-bg-medium text-sm text-text-secondary">
                {personalityTrait}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Or write your own..."
                onChange={(e) => setPersonalityTrait(e.target.value)}
                className="w-full mt-2 px-4 py-2 rounded-lg bg-bg-medium border border-border text-text-secondary placeholder-text-muted focus:border-primary focus:outline-none transition-colors text-sm"
              />
            )}
          </div>

          {/* Ideal */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Ideal
            </label>
            <select
              value={ideal}
              onChange={(e) => setIdeal(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bg-dark border-2 border-border text-text-primary focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">Select or write your own...</option>
              {background?.ideals.map((i, index) => (
                <option key={index} value={i}>
                  {i.length > 60 ? i.substring(0, 60) + '...' : i}
                </option>
              ))}
            </select>
            {ideal ? (
              <div className="mt-2 p-2 rounded bg-bg-medium text-sm text-text-secondary">
                {ideal}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Or write your own..."
                onChange={(e) => setIdeal(e.target.value)}
                className="w-full mt-2 px-4 py-2 rounded-lg bg-bg-medium border border-border text-text-secondary placeholder-text-muted focus:border-primary focus:outline-none transition-colors text-sm"
              />
            )}
          </div>

          {/* Bond */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Bond
            </label>
            <select
              value={bond}
              onChange={(e) => setBond(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bg-dark border-2 border-border text-text-primary focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">Select or write your own...</option>
              {background?.bonds.map((b, index) => (
                <option key={index} value={b}>
                  {b.length > 60 ? b.substring(0, 60) + '...' : b}
                </option>
              ))}
            </select>
            {bond ? (
              <div className="mt-2 p-2 rounded bg-bg-medium text-sm text-text-secondary">
                {bond}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Or write your own..."
                onChange={(e) => setBond(e.target.value)}
                className="w-full mt-2 px-4 py-2 rounded-lg bg-bg-medium border border-border text-text-secondary placeholder-text-muted focus:border-primary focus:outline-none transition-colors text-sm"
              />
            )}
          </div>

          {/* Flaw */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Flaw
            </label>
            <select
              value={flaw}
              onChange={(e) => setFlaw(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bg-dark border-2 border-border text-text-primary focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">Select or write your own...</option>
              {background?.flaws.map((f, index) => (
                <option key={index} value={f}>
                  {f.length > 60 ? f.substring(0, 60) + '...' : f}
                </option>
              ))}
            </select>
            {flaw ? (
              <div className="mt-2 p-2 rounded bg-bg-medium text-sm text-text-secondary">
                {flaw}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Or write your own..."
                onChange={(e) => setFlaw(e.target.value)}
                className="w-full mt-2 px-4 py-2 rounded-lg bg-bg-medium border border-border text-text-secondary placeholder-text-muted focus:border-primary focus:outline-none transition-colors text-sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* Backstory */}
      <div className="mt-6">
        <label className="block text-sm font-semibold text-text-primary mb-2">
          Backstory (Optional)
        </label>
        <textarea
          value={backstory}
          onChange={(e) => setBackstory(e.target.value)}
          placeholder="Write a brief backstory for your character... Where did they come from? What drives them?"
          rows={4}
          className="w-full px-4 py-3 rounded-lg bg-bg-dark border-2 border-border text-text-primary placeholder-text-muted focus:border-primary focus:outline-none transition-colors resize-none"
          maxLength={2000}
        />
        <div className="text-xs text-text-muted mt-1 text-right">
          {backstory.length} / 2000
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="btn-stone px-6 py-3"
        >
          Back to Skills
        </button>
        <button
          onClick={handleContinue}
          className="btn-adventure px-8 py-3 text-lg"
        >
          Review Character
        </button>
      </div>
    </div>
  );
}
