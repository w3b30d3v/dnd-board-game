'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { EnchantedCard } from '@/components/dnd/EnchantedCard';
import {
  D20Icon,
  ClassIcon,
} from '@/components/dnd/DnDIcons';

interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  maxHitPoints: number;
  currentHitPoints: number;
  armorClass: number;
  createdAt: string;
  status: 'draft' | 'generating' | 'complete';
  portraitUrl?: string;
  fullBodyUrls?: string[];
  imageSource?: string;
  background?: string;
  subrace?: string;
  subclass?: string;
  speed?: number;
  initiative?: number;
  proficiencyBonus?: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  skills?: string[];
  savingThrows?: string[];
  languages?: string[];
  tools?: string[];
  weapons?: string[];
  armor?: string[];
  equipment?: unknown[];
  spellsKnown?: string[];
  spellsPrepared?: string[];
  spellcastingAbility?: string;
  appearance?: {
    personalityTrait?: string;
    ideal?: string;
    bond?: string;
    flaw?: string;
    backstory?: string;
    hairColor?: string;
    eyeColor?: string;
    skinColor?: string;
    height?: string;
    weight?: string;
    distinguishingFeatures?: string;
  };
}

// Dynamic imports for heavy components
const AmbientParticles = dynamic(
  () => import('@/components/dnd/AmbientParticles').then((mod) => mod.AmbientParticles),
  { ssr: false }
);

const FloatingRunes = dynamic(
  () => import('@/components/dnd/AtmosphericBackground').then((mod) => mod.FloatingRunes),
  { ssr: false }
);

// Race lore data
const RACE_LORE: Record<string, { description: string; traits: string[]; homeland: string }> = {
  human: {
    description: 'Humans are the most adaptable and ambitious people among the common races. Whatever drives them, humans are the innovators, the achievers, and the pioneers of the worlds.',
    traits: ['Versatile', 'Ambitious', 'Adaptable', 'Diverse cultures'],
    homeland: 'Found across all lands, from bustling cities to frontier settlements',
  },
  elf: {
    description: 'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it. They live in places of ethereal beauty, in the midst of ancient forests.',
    traits: ['Darkvision', 'Fey Ancestry', 'Trance', 'Keen Senses'],
    homeland: 'Ancient forests and hidden glades touched by the Feywild',
  },
  dwarf: {
    description: 'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal. They are loyal to clan and tradition.',
    traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning', 'Tool Proficiency'],
    homeland: 'Mountain strongholds and underground kingdoms',
  },
  halfling: {
    description: 'The diminutive halflings survive in a world full of larger creatures by avoiding notice or, barring that, avoiding offense. They are practical and down-to-earth.',
    traits: ['Lucky', 'Brave', 'Halfling Nimbleness', 'Naturally Stealthy'],
    homeland: 'Comfortable burrows in rolling hills and quiet shires',
  },
  dragonborn: {
    description: 'Born of dragons, dragonborn walk proudly through a world that greets them with fearful incomprehension. They value skill and excellence in all endeavors.',
    traits: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance', 'Proud Heritage'],
    homeland: 'Dragon-touched lands and ancient clan territories',
  },
  tiefling: {
    description: 'Tieflings are derived from human bloodlines touched by the power of the Nine Hells. They are not evil by nature, but their appearance marks them as different.',
    traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy', 'Fiendish Charm'],
    homeland: 'Often wanderers, finding acceptance in cosmopolitan cities',
  },
  gnome: {
    description: 'A gnome\'s energy and enthusiasm for living shines through every inch of their tiny body. They approach every aspect of life with boundless curiosity.',
    traits: ['Darkvision', 'Gnome Cunning', 'Natural Illusionist', 'Speak with Small Beasts'],
    homeland: 'Hidden burrows, tinker workshops, and magical academies',
  },
  'half-elf': {
    description: 'Half-elves combine what some say are the best qualities of their elf and human parents: human curiosity and ambition tempered by elven refined senses.',
    traits: ['Darkvision', 'Fey Ancestry', 'Skill Versatility', 'Charismatic'],
    homeland: 'Bridges between human cities and elven forests',
  },
  'half-orc': {
    description: 'Half-orcs\' grayish skin, sloping foreheads, jutting jaws, and prominent teeth mark them as part orc. They are fierce warriors who channel their rage into battle.',
    traits: ['Darkvision', 'Menacing', 'Relentless Endurance', 'Savage Attacks'],
    homeland: 'Frontier lands between orc territories and civilized realms',
  },
};

// Class lore data
const CLASS_LORE: Record<string, { description: string; abilities: string[]; role: string }> = {
  barbarian: {
    description: 'A fierce warrior who can enter a battle rage, drawing on primal instincts to fuel supernatural feats of combat prowess.',
    abilities: ['Rage', 'Unarmored Defense', 'Reckless Attack', 'Danger Sense'],
    role: 'Front-line damage dealer and tank',
  },
  bard: {
    description: 'An inspiring magician whose power echoes the music of creation. Bards weave magic through words and music to inspire allies and confound foes.',
    abilities: ['Spellcasting', 'Bardic Inspiration', 'Jack of All Trades', 'Song of Rest'],
    role: 'Support caster and face of the party',
  },
  cleric: {
    description: 'A priestly champion who wields divine magic in service of a higher power. Clerics are intermediaries between the mortal world and the divine.',
    abilities: ['Spellcasting', 'Divine Domain', 'Channel Divinity', 'Turn Undead'],
    role: 'Healer and divine support',
  },
  druid: {
    description: 'A priest of the Old Faith, wielding the powers of nature and adopting animal forms. Druids revere nature above all.',
    abilities: ['Spellcasting', 'Wild Shape', 'Druidic', 'Natural Recovery'],
    role: 'Versatile caster and shapeshifter',
  },
  fighter: {
    description: 'A master of martial combat, skilled with a variety of weapons and armor. Fighters are the quintessential warriors.',
    abilities: ['Fighting Style', 'Second Wind', 'Action Surge', 'Extra Attack'],
    role: 'Versatile front-line combatant',
  },
  monk: {
    description: 'A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection.',
    abilities: ['Martial Arts', 'Ki', 'Unarmored Defense', 'Deflect Missiles'],
    role: 'Mobile striker and skirmisher',
  },
  paladin: {
    description: 'A holy warrior bound to a sacred oath, combining martial prowess with divine magic to smite evil.',
    abilities: ['Divine Sense', 'Lay on Hands', 'Divine Smite', 'Aura of Protection'],
    role: 'Armored healer and front-line tank',
  },
  ranger: {
    description: 'A warrior who uses martial prowess and nature magic to combat threats on the edges of civilization.',
    abilities: ['Favored Enemy', 'Natural Explorer', 'Spellcasting', 'Hunter\'s Mark'],
    role: 'Scout and ranged damage dealer',
  },
  rogue: {
    description: 'A scoundrel who uses stealth and trickery to overcome obstacles and enemies, striking with deadly precision.',
    abilities: ['Sneak Attack', 'Thieves\' Cant', 'Cunning Action', 'Expertise'],
    role: 'Skill expert and precision striker',
  },
  sorcerer: {
    description: 'A spellcaster who draws on inherent magic from a gift or bloodline, bending the fabric of reality with raw arcane power.',
    abilities: ['Spellcasting', 'Sorcerous Origin', 'Font of Magic', 'Metamagic'],
    role: 'Powerful offensive caster',
  },
  warlock: {
    description: 'A wielder of magic derived from a bargain with an extraplanar entity, gaining eldritch powers in exchange for service.',
    abilities: ['Pact Magic', 'Eldritch Invocations', 'Pact Boon', 'Eldritch Blast'],
    role: 'Versatile caster with unique abilities',
  },
  wizard: {
    description: 'A scholarly magic-user capable of manipulating the structures of reality through careful study and mastery of arcane secrets.',
    abilities: ['Spellcasting', 'Arcane Recovery', 'Spellbook', 'Arcane Tradition'],
    role: 'Versatile prepared caster',
  },
};

// Background lore data
const BACKGROUND_LORE: Record<string, { description: string; feature: string; ideal: string }> = {
  acolyte: {
    description: 'You have spent your life in service to a temple, learning sacred rites and providing sacrifices to the gods.',
    feature: 'Shelter of the Faithful - Temples provide free healing and care',
    ideal: 'Faith, tradition, and devotion guide your path',
  },
  criminal: {
    description: 'You have a history of breaking the law and have spent time among other criminals.',
    feature: 'Criminal Contact - Reliable contact in the criminal underworld',
    ideal: 'Freedom, chains, or honor among thieves',
  },
  folk_hero: {
    description: 'You come from a humble background, but you are destined for so much more.',
    feature: 'Rustic Hospitality - Common folk will shelter and aid you',
    ideal: 'The people deserve a champion',
  },
  noble: {
    description: 'You understand wealth, power, and privilege. You carry a noble title.',
    feature: 'Position of Privilege - Welcome in high society',
    ideal: 'Responsibility, power, or noblesse oblige',
  },
  sage: {
    description: 'You spent years learning the lore of the multiverse in a library or university.',
    feature: 'Researcher - Know where to find information',
    ideal: 'Knowledge is the path to power and self-improvement',
  },
  soldier: {
    description: 'War has been your life for as long as you care to remember.',
    feature: 'Military Rank - Soldiers defer to your authority',
    ideal: 'Duty, honor, and the greater good',
  },
  outlander: {
    description: 'You grew up in the wilds, far from civilization and the comforts of town.',
    feature: 'Wanderer - Excellent memory for maps and terrain',
    ideal: 'Nature\'s beauty must be preserved',
  },
  entertainer: {
    description: 'You thrive in front of an audience, knowing how to entrance and inspire them.',
    feature: 'By Popular Demand - Always find a place to perform',
    ideal: 'The world is your stage',
  },
};

function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function formatModifier(score: number): string {
  const mod = calculateModifier(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Tab types
type TabType = 'stats' | 'abilities' | 'personality' | 'lore';

// Image Carousel Component
function ImageCarousel({ images, characterName }: { images: { url: string; label: string }[]; characterName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full h-64 bg-bg-tertiary rounded-lg flex items-center justify-center border border-border/30">
        <ClassIcon characterClass="fighter" size={64} color="#F59E0B" />
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative">
      {/* Main Image */}
      <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-primary/50 bg-bg-tertiary">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex].url}
            alt={`${characterName} - ${images[currentIndex].label}`}
            className="w-full h-full object-contain"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold hover:scale-110 transition-transform"
              style={{
                background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.3) 0%, rgba(0, 0, 0, 0.9) 100%)',
                border: '2px solid #F59E0B',
                color: '#FFD700',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)',
              }}
            >
              &lsaquo;
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold hover:scale-110 transition-transform"
              style={{
                background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.3) 0%, rgba(0, 0, 0, 0.9) 100%)',
                border: '2px solid #F59E0B',
                color: '#FFD700',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)',
              }}
            >
              &rsaquo;
            </button>
          </>
        )}

      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-primary scale-105 shadow-glow'
                  : 'border-border/30 hover:border-primary/50'
              }`}
            >
              <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Tab Button Component
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${
        active
          ? 'bg-primary/20 text-primary border-b-2 border-primary'
          : 'bg-transparent text-text-muted hover:text-text-primary hover:bg-bg-tertiary/50'
      }`}
    >
      {children}
    </motion.button>
  );
}

export default function CharacterDetailsContent() {
  const params = useParams();
  const { user, isLoading } = useRequireAuth('/login');
  const { token } = useAuthStore((state) => ({ token: state.token }));
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('stats');

  const characterId = params?.id as string;

  useEffect(() => {
    const fetchCharacter = async () => {
      if (!token || !characterId) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/characters/${characterId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Character not found');
          } else {
            setError('Failed to load character');
          }
          return;
        }

        const data = await response.json();
        setCharacter(data);
      } catch (err) {
        console.error('Failed to fetch character:', err);
        setError('Failed to load character');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCharacter();
    }
  }, [token, characterId, user]);

  // Build image list
  const imageList: { url: string; label: string }[] = [];
  if (character?.portraitUrl) {
    imageList.push({ url: character.portraitUrl, label: 'Portrait' });
  }
  if (character?.fullBodyUrls && character.fullBodyUrls.length > 0) {
    character.fullBodyUrls.forEach((url, index) => {
      if (url) {
        const labels = ['Heroic Pose', 'Action Pose'];
        imageList.push({ url, label: labels[index] || `Full Body ${index + 1}` });
      }
    });
  }

  if (isLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="dnd-page-background" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <D20Icon size={48} color="#F59E0B" animate />
        </motion.div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="dnd-page-background" />
        <div className="dnd-vignette" />
        <EnchantedCard className="p-8 text-center max-w-md">
          <h2 className="dnd-heading-section text-xl mb-4">
            {error || 'Character not found'}
          </h2>
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-adventure"
            >
              Return to Dashboard
            </motion.button>
          </Link>
        </EnchantedCard>
      </div>
    );
  }

  const abilities = [
    { name: 'Strength', abbr: 'STR', value: character.strength },
    { name: 'Dexterity', abbr: 'DEX', value: character.dexterity },
    { name: 'Constitution', abbr: 'CON', value: character.constitution },
    { name: 'Intelligence', abbr: 'INT', value: character.intelligence },
    { name: 'Wisdom', abbr: 'WIS', value: character.wisdom },
    { name: 'Charisma', abbr: 'CHA', value: character.charisma },
  ];

  const raceLore = RACE_LORE[character.race.toLowerCase()] || RACE_LORE.human;
  const classLore = CLASS_LORE[character.class.toLowerCase()] || CLASS_LORE.fighter;
  const backgroundLore = BACKGROUND_LORE[character.background?.toLowerCase() || 'soldier'] || BACKGROUND_LORE.soldier;

  // Tab content renderers
  const renderStatsTab = () => (
    <div className="space-y-4">
      {/* Combat Stats */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-2">Combat Stats</h3>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-lg bg-danger/10 border border-danger/30">
            <div className="text-lg font-bold text-danger">{character.currentHitPoints}/{character.maxHitPoints}</div>
            <div className="text-[10px] text-text-muted uppercase">HP</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-info/10 border border-info/30">
            <div className="text-lg font-bold text-info">{character.armorClass}</div>
            <div className="text-[10px] text-text-muted uppercase">AC</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-primary/10 border border-primary/30">
            <div className="text-lg font-bold text-primary">{character.speed || 30}</div>
            <div className="text-[10px] text-text-muted uppercase">Speed</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-secondary/10 border border-secondary/30">
            <div className="text-lg font-bold text-secondary">+{character.proficiencyBonus || 2}</div>
            <div className="text-[10px] text-text-muted uppercase">Prof</div>
          </div>
        </div>
      </div>

      {/* Ability Scores */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-2">Ability Scores</h3>
        <div className="grid grid-cols-6 gap-1">
          {abilities.map((ability) => (
            <div
              key={ability.abbr}
              className="text-center p-2 rounded-lg bg-primary/5 border border-primary/30"
            >
              <div className="text-[10px] font-bold text-primary">{ability.abbr}</div>
              <div className="text-lg font-bold text-text-primary">{ability.value}</div>
              <div className="text-xs text-text-secondary">{formatModifier(ability.value)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="p-2 rounded bg-bg-tertiary/50">
          <span className="text-text-muted text-xs">Initiative:</span>
          <span className="ml-1 font-semibold">+{character.initiative || calculateModifier(character.dexterity)}</span>
        </div>
        <div className="p-2 rounded bg-bg-tertiary/50">
          <span className="text-text-muted text-xs">Experience:</span>
          <span className="ml-1 font-semibold">0 XP</span>
        </div>
      </div>
    </div>
  );

  const renderAbilitiesTab = () => (
    <div className="space-y-4">
      {/* Skills */}
      {character.skills && character.skills.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-primary mb-2">Proficient Skills</h3>
          <div className="flex flex-wrap gap-1">
            {character.skills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-full bg-success/10 border border-success/30 text-success text-xs capitalize"
              >
                {skill.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {character.languages && character.languages.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-primary mb-2">Languages</h3>
          <div className="flex flex-wrap gap-1">
            {character.languages.map((lang) => (
              <span
                key={lang}
                className="px-2 py-0.5 rounded-full bg-secondary/10 border border-secondary/30 text-secondary text-xs capitalize"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Spells */}
      {character.spellsKnown && character.spellsKnown.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-purple-400 mb-2">
            Spells Known {character.spellcastingAbility && <span className="text-xs text-text-muted">({character.spellcastingAbility})</span>}
          </h3>
          <div className="flex flex-wrap gap-1">
            {character.spellsKnown.map((spell) => (
              <span
                key={spell}
                className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs"
              >
                {spell}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Class Features */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-2">Class Features</h3>
        <div className="flex flex-wrap gap-1">
          {classLore.abilities.map((ability) => (
            <span
              key={ability}
              className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs"
            >
              {ability}
            </span>
          ))}
        </div>
      </div>

      {/* Racial Traits */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-2">Racial Traits</h3>
        <div className="flex flex-wrap gap-1">
          {raceLore.traits.map((trait) => (
            <span
              key={trait}
              className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPersonalityTab = () => (
    <div className="space-y-3 text-sm">
      {/* Physical Appearance */}
      {character.appearance && (character.appearance.hairColor || character.appearance.eyeColor || character.appearance.skinColor) && (
        <div>
          <h3 className="text-xs font-semibold text-primary mb-1">Physical Traits</h3>
          <div className="grid grid-cols-3 gap-1 text-xs">
            {character.appearance.hairColor && (
              <div className="p-1.5 rounded bg-bg-tertiary/50">
                <span className="text-text-muted">Hair:</span> <span className="capitalize">{character.appearance.hairColor}</span>
              </div>
            )}
            {character.appearance.eyeColor && (
              <div className="p-1.5 rounded bg-bg-tertiary/50">
                <span className="text-text-muted">Eyes:</span> <span className="capitalize">{character.appearance.eyeColor}</span>
              </div>
            )}
            {character.appearance.skinColor && (
              <div className="p-1.5 rounded bg-bg-tertiary/50">
                <span className="text-text-muted">Skin:</span> <span className="capitalize">{character.appearance.skinColor}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {character.appearance?.personalityTrait && (
        <div>
          <h3 className="text-xs font-semibold text-primary mb-1">Personality</h3>
          <p className="text-text-secondary text-xs italic bg-bg-tertiary/30 p-2 rounded">&ldquo;{character.appearance.personalityTrait}&rdquo;</p>
        </div>
      )}

      {character.appearance?.ideal && (
        <div>
          <h3 className="text-xs font-semibold text-primary mb-1">Ideal</h3>
          <p className="text-text-secondary text-xs bg-bg-tertiary/30 p-2 rounded">{character.appearance.ideal}</p>
        </div>
      )}

      {character.appearance?.bond && (
        <div>
          <h3 className="text-xs font-semibold text-primary mb-1">Bond</h3>
          <p className="text-text-secondary text-xs bg-bg-tertiary/30 p-2 rounded">{character.appearance.bond}</p>
        </div>
      )}

      {character.appearance?.flaw && (
        <div>
          <h3 className="text-xs font-semibold text-primary mb-1">Flaw</h3>
          <p className="text-text-secondary text-xs bg-bg-tertiary/30 p-2 rounded">{character.appearance.flaw}</p>
        </div>
      )}

      {character.appearance?.backstory && (
        <div>
          <h3 className="text-xs font-semibold text-primary mb-1">Backstory</h3>
          <p className="text-text-secondary text-xs bg-bg-tertiary/30 p-2 rounded max-h-24 overflow-y-auto">{character.appearance.backstory}</p>
        </div>
      )}
    </div>
  );

  const renderLoreTab = () => (
    <div className="space-y-4 text-sm">
      {/* Race Lore */}
      <div>
        <h3 className="text-xs font-semibold text-amber-400 mb-1 capitalize">{character.race} Heritage</h3>
        <p className="text-text-secondary text-xs bg-amber-500/5 border border-amber-500/20 p-2 rounded">{raceLore.description}</p>
        <p className="text-[10px] text-text-muted mt-1 italic">{raceLore.homeland}</p>
      </div>

      {/* Class Lore */}
      <div>
        <h3 className="text-xs font-semibold text-primary mb-1 capitalize">{character.class} Path</h3>
        <p className="text-text-secondary text-xs bg-primary/5 border border-primary/20 p-2 rounded">{classLore.description}</p>
        <p className="text-[10px] text-text-muted mt-1 italic">Role: {classLore.role}</p>
      </div>

      {/* Background Lore */}
      {character.background && (
        <div>
          <h3 className="text-xs font-semibold text-secondary mb-1 capitalize">{character.background.replace(/_/g, ' ')} Background</h3>
          <p className="text-text-secondary text-xs bg-secondary/5 border border-secondary/20 p-2 rounded">{backgroundLore.description}</p>
          <p className="text-[10px] text-text-muted mt-1 italic">{backgroundLore.feature}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Multi-layer background */}
      <div className="dnd-page-background" />

      {/* Floating runes */}
      <Suspense fallback={null}>
        <FloatingRunes />
      </Suspense>

      {/* Particles */}
      <Suspense fallback={null}>
        <AmbientParticles variant="dust" />
      </Suspense>

      {/* Vignette */}
      <div className="dnd-vignette" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass border-b border-border/50 backdrop-blur-md flex-shrink-0"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14">
              <Link href="/dashboard" className="group flex items-center gap-2">
                <motion.div
                  whileHover={{ rotate: 20 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <D20Icon size={24} color="#F59E0B" />
                </motion.div>
                <span className="dnd-heading-epic text-xl pb-0 logo-glow-pulse">D&D Board</span>
              </Link>

              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-stone text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <span>&larr;</span> Back
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.header>

        {/* Main Content - Fixed height, no scroll */}
        <main className="flex-1 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-full">
              {/* Left Column - Character Info & Image */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2 flex flex-col"
              >
                <EnchantedCard showCorners className="p-4 flex-1 flex flex-col">
                  {/* Character Header */}
                  <div className="text-center mb-3">
                    <h1 className="dnd-heading-epic text-2xl pb-1">{character.name}</h1>
                    <p className="text-text-secondary text-sm capitalize">
                      Level {character.level} {character.subrace || character.race} {character.subclass || character.class}
                    </p>
                    {character.background && (
                      <p className="text-text-muted text-xs capitalize">{character.background.replace(/_/g, ' ')} Background</p>
                    )}
                  </div>

                  {/* Image Carousel */}
                  <div className="flex-1 min-h-0">
                    <ImageCarousel images={imageList} characterName={character.name} />
                  </div>

                  {/* Created Date */}
                  <p className="text-[10px] text-text-muted mt-2 text-center">
                    Created {new Date(character.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </EnchantedCard>
              </motion.div>

              {/* Right Column - Tabbed Content */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-3 flex flex-col"
              >
                <EnchantedCard showCorners className="p-4 flex-1 flex flex-col">
                  {/* Tab Headers */}
                  <div className="flex gap-1 mb-4 border-b border-border/30 pb-1">
                    <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>
                      Stats
                    </TabButton>
                    <TabButton active={activeTab === 'abilities'} onClick={() => setActiveTab('abilities')}>
                      Abilities
                    </TabButton>
                    <TabButton active={activeTab === 'personality'} onClick={() => setActiveTab('personality')}>
                      Personality
                    </TabButton>
                    <TabButton active={activeTab === 'lore'} onClick={() => setActiveTab('lore')}>
                      Lore
                    </TabButton>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {activeTab === 'stats' && renderStatsTab()}
                        {activeTab === 'abilities' && renderAbilitiesTab()}
                        {activeTab === 'personality' && renderPersonalityTab()}
                        {activeTab === 'lore' && renderLoreTab()}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </EnchantedCard>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
