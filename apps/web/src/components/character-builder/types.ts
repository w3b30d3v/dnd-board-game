// Ability name type
export type AbilityName = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

// Character creation state types
export interface CharacterCreationState {
  // Step 1: Race
  race?: string;
  subrace?: string;

  // Step 2: Class
  class?: string;
  subclass?: string;

  // Step 3: Ability Scores
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;

  // Step 4: Background
  background?: string;

  // Step 5: Skills (from class + background)
  skills?: string[];

  // Step 6: Spells (for casters)
  spellsKnown?: string[];

  // Step 7: Equipment
  equipment?: string[];

  // Step 8: Details
  name?: string;
  portraitUrl?: string;
  appearance?: Record<string, string>;
}

// Character data for API submission
export interface CharacterData extends CharacterCreationState {
  name: string;
  race: string;
  class: string;
  background: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface StepProps {
  character: CharacterCreationState;
  onUpdate: (updates: Partial<CharacterCreationState>) => void;
  onNext: () => void;
  onBack?: () => void;
}
