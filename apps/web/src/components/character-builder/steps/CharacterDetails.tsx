'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRaceById, getClassById, getBackgroundById } from '@/data';
import { api } from '@/lib/api';
import type { StepProps } from '../types';

// Character images from portrait generation
interface CharacterImages {
  portrait: string;
  fullBody1: string | null;
  fullBody2: string | null;
}

// Character Card Modal Component with 3-image carousel
interface CharacterCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: {
    name: string;
    race: string;
    class: string;
    background: string;
    images: CharacterImages;
    personalityTrait: string;
    ideal: string;
    bond: string;
    flaw: string;
  };
}

function CharacterCardModal({ isOpen, onClose, character }: CharacterCardModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen) return null;

  // Build array of available images
  const imageList: { url: string; label: string }[] = [
    { url: character.images.portrait, label: 'Portrait' },
  ];
  if (character.images.fullBody1) {
    imageList.push({ url: character.images.fullBody1, label: 'Heroic Pose' });
  }
  if (character.images.fullBody2) {
    imageList.push({ url: character.images.fullBody2, label: 'Action Pose' });
  }

  const currentImage = imageList[currentImageIndex] || imageList[0];
  const hasMultipleImages = imageList.length > 1;

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Character Card - Trading Card Style */}
            <div className="relative bg-gradient-to-b from-[#2A2735] to-[#1E1B26] rounded-xl overflow-hidden border-4 border-primary/60 shadow-2xl">
              {/* Card Header with Name */}
              <div className="bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 px-4 py-3 border-b border-primary/40">
                <h2 className="text-xl font-bold text-center text-primary drop-shadow-lg font-cinzel">
                  {character.name || 'Unnamed Hero'}
                </h2>
                <p className="text-xs text-center text-text-secondary mt-1">
                  {character.race} {character.class}
                </p>
              </div>

              {/* Image Carousel Section */}
              <div className="relative aspect-[3/4] bg-bg-dark">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={currentImage.url}
                    alt={`${character.name || 'Character'} - ${currentImage.label}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>

                {/* Gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#1E1B26] to-transparent pointer-events-none" />

                {/* Navigation Arrows - only show if multiple images */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={goToPrevious}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors border border-white/20"
                      aria-label="Previous image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={goToNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors border border-white/20"
                      aria-label="Next image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Image Label */}
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs font-medium border border-white/20">
                  {currentImage.label}
                </div>

                {/* Dot Indicators */}
                {hasMultipleImages && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {imageList.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          index === currentImageIndex
                            ? 'bg-primary'
                            : 'bg-white/40 hover:bg-white/60'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Stats Section */}
              <div className="p-4 space-y-3">
                {/* Background */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted uppercase tracking-wider">Background:</span>
                  <span className="text-sm text-primary font-medium">{character.background}</span>
                </div>

                {/* Personality Traits */}
                {character.personalityTrait && (
                  <div className="bg-bg-dark/50 rounded-lg p-3 border border-border/50">
                    <h4 className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Personality</h4>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{character.personalityTrait}</p>
                  </div>
                )}

                {character.ideal && (
                  <div className="bg-bg-dark/50 rounded-lg p-3 border border-border/50">
                    <h4 className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1">Ideal</h4>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{character.ideal}</p>
                  </div>
                )}

                {character.bond && (
                  <div className="bg-bg-dark/50 rounded-lg p-3 border border-border/50">
                    <h4 className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">Bond</h4>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{character.bond}</p>
                  </div>
                )}

                {character.flaw && (
                  <div className="bg-bg-dark/50 rounded-lg p-3 border border-danger/30">
                    <h4 className="text-xs text-danger font-semibold uppercase tracking-wider mb-1">Flaw</h4>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{character.flaw}</p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="px-4 pb-4">
                <button
                  onClick={onClose}
                  className="w-full py-2 rounded-lg bg-primary/20 text-primary font-medium hover:bg-primary/30 transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/80 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/80 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary/80 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/80 rounded-br-lg" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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

// Generate a unique portrait seed based on character attributes
const generatePortraitSeed = (race: string, className: string, name: string): string => {
  return `${race}-${className}-${name}-${Date.now()}`;
};

// Portrait styles mapped by race for variety
const PORTRAIT_STYLES: Record<string, string[]> = {
  human: ['adventurer', 'avataaars', 'lorelei', 'notionists'],
  elf: ['lorelei', 'adventurer', 'avataaars', 'micah'],
  dwarf: ['adventurer', 'avataaars', 'bottts', 'notionists'],
  halfling: ['fun-emoji', 'lorelei', 'avataaars', 'adventurer'],
  dragonborn: ['bottts', 'shapes', 'adventurer', 'avataaars'],
  gnome: ['fun-emoji', 'lorelei', 'avataaars', 'micah'],
  'half-elf': ['lorelei', 'adventurer', 'avataaars', 'notionists'],
  'half-orc': ['adventurer', 'avataaars', 'bottts', 'notionists'],
  tiefling: ['bottts', 'shapes', 'adventurer', 'avataaars'],
};

export function CharacterDetails({ character, onUpdate, onNext, onBack }: StepProps) {
  const [name, setName] = useState(character.name || '');
  const [personalityTrait, setPersonalityTrait] = useState('');
  const [ideal, setIdeal] = useState('');
  const [bond, setBond] = useState('');
  const [flaw, setFlaw] = useState('');
  const [backstory, setBackstory] = useState('');
  const [portraitSeed, setPortraitSeed] = useState(() =>
    character.portraitUrl || generatePortraitSeed(character.race || 'human', character.class || 'fighter', '')
  );
  const [portraitStyle, setPortraitStyle] = useState<string>('adventurer');
  const [showValidation, setShowValidation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  // Track if current portrait is generated (to hide DiceBear-specific buttons)
  const [isGeneratedPortrait, setIsGeneratedPortrait] = useState(false);
  // Store all 3 character images for the card modal
  const [characterImages, setCharacterImages] = useState<CharacterImages>({
    portrait: '',
    fullBody1: null,
    fullBody2: null,
  });
  // Character card modal state
  const [showCharacterCard, setShowCharacterCard] = useState(false);
  // Generation limit tracking
  const [generationLimitInfo, setGenerationLimitInfo] = useState<{ remaining: number; limit: number } | null>(null);

  const race = getRaceById(character.race || '');
  const classData = getClassById(character.class || '');
  const background = getBackgroundById(character.background || '');

  // Get the portrait URL using DiceBear API or return generated URL
  const getPortraitUrl = useCallback((seed: string, style: string): string => {
    // If the seed is already a full URL (from generation), return it directly
    if (seed.startsWith('http://') || seed.startsWith('https://')) {
      return seed;
    }
    // DiceBear is a free avatar generation API
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1b26&size=200`;
  }, []);

  const handleRegeneratePortrait = useCallback(() => {
    const newSeed = generatePortraitSeed(
      character.race || 'human',
      character.class || 'fighter',
      name || 'hero'
    );
    setPortraitSeed(newSeed);
    // Reset generated portrait state when switching to DiceBear
    setIsGeneratedPortrait(false);
    setCharacterImages({ portrait: '', fullBody1: null, fullBody2: null });
  }, [character.race, character.class, name]);

  const handleChangeStyle = useCallback(() => {
    const styles = PORTRAIT_STYLES[character.race || 'human'] || PORTRAIT_STYLES.human;
    const currentIndex = styles.indexOf(portraitStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    setPortraitStyle(styles[nextIndex]!);
    // Reset generated portrait state when switching styles
    setIsGeneratedPortrait(false);
    setCharacterImages({ portrait: '', fullBody1: null, fullBody2: null });
  }, [character.race, portraitStyle]);

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

  const handleRandomBackstory = useCallback(() => {
    const currentTrait = personalityTrait || getRandomItem([...(background?.personalityTraits || []), ...GENERIC_PERSONALITY_TRAITS]);
    const currentIdeal = ideal || getRandomItem([...(background?.ideals || []), ...GENERIC_IDEALS]);
    const currentBond = bond || getRandomItem([...(background?.bonds || []), ...GENERIC_BONDS]);
    const currentFlaw = flaw || getRandomItem([...(background?.flaws || []), ...GENERIC_FLAWS]);

    const generated = generateBackstory(
      race?.name || 'adventurer',
      classData?.name || 'hero',
      background?.name || 'traveler',
      currentTrait,
      currentIdeal,
      currentBond,
      currentFlaw
    );
    setBackstory(generated);
  }, [race, classData, background, personalityTrait, ideal, bond, flaw, getRandomItem]);

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

  // Generate all 3 character images using NanoBanana API
  const handleGeneratePortrait = useCallback(async () => {
    setIsGeneratingPortrait(true);
    try {
      // Use the new endpoint that generates all 3 images at once
      const response = await api.post<{
        success: boolean;
        images?: { portrait: string; fullBody1: string; fullBody2: string };
        source?: string;
        error?: string;
        limitReached?: boolean;
        generated?: number;
        remaining?: number;
        limit?: number;
      }>('/media/generate/character-images', {
        character: {
          race: character.race,
          class: character.class,
          background: character.background,
          name: name || undefined,
        },
        quality: 'standard',
      });

      // Update limit info
      if (response.remaining !== undefined && response.limit !== undefined) {
        setGenerationLimitInfo({ remaining: response.remaining, limit: response.limit });
      }

      if (response.limitReached) {
        alert(`You have reached the limit of ${response.limit} generated characters. Each character uses 3 images.`);
        return;
      }

      if (response.success && response.images) {
        // Update portrait seed to show the portrait image
        setPortraitSeed(response.images.portrait);

        // Store all 3 images for the card modal
        setCharacterImages({
          portrait: response.images.portrait,
          fullBody1: response.images.fullBody1 || null,
          fullBody2: response.images.fullBody2 || null,
        });

        // Mark as generated to hide DiceBear buttons
        if (response.source === 'nanobanana') {
          setIsGeneratedPortrait(true);
          setPortraitStyle('generated');
        } else {
          // DiceBear fallback was used
          setIsGeneratedPortrait(false);
        }
      }
    } catch (error: any) {
      console.warn('Portrait generation failed:', error);
      if (error?.message?.includes('limit')) {
        alert(error.message);
      }
      // Keep existing portrait
    } finally {
      setIsGeneratingPortrait(false);
    }
  }, [character.race, character.class, character.background, name]);

  const handleContinue = () => {
    if (name.trim()) {
      onUpdate({
        name: name.trim(),
        portraitUrl: getPortraitUrl(portraitSeed, portraitStyle),
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canContinue = name.trim().length > 0;
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

      {/* Character Summary with Portrait */}
      <div className="p-4 rounded-lg bg-bg-dark border border-border">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Portrait Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <button
                type="button"
                onClick={() => isGeneratedPortrait && setShowCharacterCard(true)}
                className={`w-32 h-32 rounded-lg bg-bg-medium border-2 overflow-hidden shadow-glow transition-all ${
                  isGeneratedPortrait
                    ? 'border-primary cursor-pointer hover:border-primary/80 hover:shadow-lg hover:scale-105'
                    : 'border-primary/50'
                }`}
                title={isGeneratedPortrait ? 'Click to view character card' : undefined}
              >
                <img
                  src={getPortraitUrl(portraitSeed, portraitStyle)}
                  alt="Character portrait"
                  className="w-full h-full object-cover"
                />
              </button>
              {isGeneratingPortrait ? (
                <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-white mt-2">Generating...</span>
                </div>
              ) : isGeneratedPortrait ? (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                  <span className="text-xs text-white text-center px-2">Click to view<br/>character card</span>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                  <span className="text-xs text-white">Click below to change</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3 flex-wrap justify-center">
              {/* Only show New and Style buttons for DiceBear (non-generated) portraits */}
              {!isGeneratedPortrait && (
                <>
                  <button
                    type="button"
                    onClick={handleRegeneratePortrait}
                    className="text-xs px-3 py-1.5 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors flex items-center gap-1"
                    title="Generate a new random portrait"
                  >
                    <span>🎲</span> New
                  </button>
                  <button
                    type="button"
                    onClick={handleChangeStyle}
                    className="text-xs px-3 py-1.5 rounded bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors flex items-center gap-1"
                    title="Change portrait style"
                  >
                    <span>🎨</span> Style
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleGeneratePortrait}
                disabled={isGeneratingPortrait}
                className="text-xs px-3 py-1.5 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors flex items-center gap-1 disabled:opacity-50"
                title="Generate portrait"
              >
                <span>{isGeneratingPortrait ? '⏳' : '✨'}</span> {isGeneratingPortrait ? 'Generating...' : (isGeneratedPortrait ? 'Regenerate' : 'Generate Portrait')}
              </button>
              {/* Show reset button when generated portrait is active */}
              {isGeneratedPortrait && (
                <button
                  type="button"
                  onClick={handleRegeneratePortrait}
                  className="text-xs px-3 py-1.5 rounded bg-border/50 text-text-secondary hover:bg-border transition-colors flex items-center gap-1"
                  title="Switch back to DiceBear avatar"
                >
                  <span>↩</span> Reset
                </button>
              )}
            </div>
            <p className="text-xs text-text-muted mt-2 text-center">
              {isGeneratedPortrait ? 'Generated - Click to expand' : `${portraitStyle} style`}
            </p>
            {/* Show generation limit */}
            {generationLimitInfo && (
              <p className="text-xs text-text-muted mt-1 text-center">
                {generationLimitInfo.remaining > 0 ? (
                  <span>{generationLimitInfo.remaining} of {generationLimitInfo.limit} characters remaining</span>
                ) : (
                  <span className="text-danger">Character limit reached</span>
                )}
              </p>
            )}
          </div>

          {/* Character Info */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Character Summary</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
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
          <div className="flex gap-2">
            <button
              onClick={handleRandomizeAll}
              className="btn-stone text-sm px-4 py-2 flex items-center gap-2"
              type="button"
              title="Quick random generation (offline)"
            >
              <span>🎲</span> Quick Random
            </button>
            <button
              onClick={handleGenerateAllFromAPI}
              disabled={isGenerating}
              className="btn-magic text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
              type="button"
              title="Generate race/class-specific content"
            >
              <span>{isGenerating ? '⏳' : '✨'}</span> {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
        <p className="text-sm text-text-muted mb-4">
          These details help bring your character to life. Use the generate buttons for random options.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personality Trait */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-text-primary">
                Personality Trait
              </label>
              <button
                onClick={handleRandomPersonalityTrait}
                className="text-xs px-2 py-1 rounded bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors flex items-center gap-1"
                type="button"
              >
                <span>🎲</span> Generate
              </button>
            </div>
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-text-primary">
                Ideal
              </label>
              <button
                onClick={handleRandomIdeal}
                className="text-xs px-2 py-1 rounded bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors flex items-center gap-1"
                type="button"
              >
                <span>🎲</span> Generate
              </button>
            </div>
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-text-primary">
                Bond
              </label>
              <button
                onClick={handleRandomBond}
                className="text-xs px-2 py-1 rounded bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors flex items-center gap-1"
                type="button"
              >
                <span>🎲</span> Generate
              </button>
            </div>
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-text-primary">
                Flaw
              </label>
              <button
                onClick={handleRandomFlaw}
                className="text-xs px-2 py-1 rounded bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors flex items-center gap-1"
                type="button"
              >
                <span>🎲</span> Generate
              </button>
            </div>
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
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-text-primary">
            Backstory (Optional)
          </label>
          <button
            onClick={handleRandomBackstory}
            className="text-xs px-2 py-1 rounded bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors flex items-center gap-1"
            type="button"
          >
            <span>🎲</span> Generate Backstory
          </button>
        </div>
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

      {/* Character Card Modal */}
      <CharacterCardModal
        isOpen={showCharacterCard}
        onClose={() => setShowCharacterCard(false)}
        character={{
          name: name || 'Unnamed Hero',
          race: race?.name || character.race || 'Unknown',
          class: classData?.name || character.class || 'Unknown',
          background: background?.name || character.background || 'Unknown',
          images: {
            portrait: characterImages.portrait || getPortraitUrl(portraitSeed, portraitStyle),
            fullBody1: characterImages.fullBody1,
            fullBody2: characterImages.fullBody2,
          },
          personalityTrait,
          ideal,
          bond,
          flaw,
        }}
      />
    </div>
  );
}
