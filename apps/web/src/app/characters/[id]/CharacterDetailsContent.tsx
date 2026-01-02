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
type TabType = 'stats' | 'abilities' | 'personality' | 'lore' | 'trivia';

// Trivia and fun facts data
const RACE_TRIVIA: Record<string, string[]> = {
  human: [
    'Humans are the most populous race in most D&D worlds',
    'The average human lifespan is about 75-100 years',
    'Humans built the largest empires in fantasy history',
    'Human ambition has led to both the greatest achievements and worst catastrophes',
    'Humans can interbreed with many races, creating half-elves and half-orcs',
  ],
  elf: [
    'Elves can live for over 700 years',
    'Elves don\'t sleep - they enter a 4-hour meditative trance called "Reverie"',
    'The elven language, Elvish, is the basis for many magical incantations',
    'High Elves created the first magical academies',
    'Elves are immune to magical sleep effects',
  ],
  dwarf: [
    'Dwarves can live 350-400 years',
    'Dwarven ale is legendary and can knock out other races easily',
    'Dwarves have a natural resistance to poison',
    'The dwarven language uses runes that double as magical symbols',
    'Dwarves remember grudges for generations - they keep "books of grudges"',
  ],
  halfling: [
    'Halflings are naturally lucky - fate seems to favor them',
    'Most halflings live in comfortable burrow-homes called "holes"',
    'Halflings have the lowest crime rate of any race',
    'They rarely wear shoes due to their tough, hairy feet',
    'Halflings invented the concept of "second breakfast"',
  ],
  dragonborn: [
    'Dragonborn were created by dragon gods in ancient times',
    'Each dragonborn has a breath weapon matching their draconic ancestry',
    'Dragonborn have no tails, unlike true dragons',
    'Their scales can be any chromatic or metallic dragon color',
    'Dragonborn clans are more important than family names',
  ],
  tiefling: [
    'Tieflings are descendants of humans who made pacts with Asmodeus',
    'No two tieflings look exactly alike - their infernal traits vary wildly',
    'Tieflings are naturally resistant to fire damage',
    'They can see perfectly in complete darkness',
    'Despite their appearance, tieflings are not inherently evil',
  ],
  gnome: [
    'Gnomes live 350-500 years',
    'Rock Gnomes are famous inventors and tinkerers',
    'Forest Gnomes can speak with small animals',
    'Gnomes have an innate resistance to magic',
    'The gnomish language sounds like rapid chittering to other races',
  ],
  'half-elf': [
    'Half-elves combine human ambition with elven grace',
    'They live about 180 years - longer than humans but shorter than elves',
    'Half-elves are often diplomats, bridging human and elven societies',
    'They inherit the elven immunity to magical sleep',
    'Many half-elves feel like outsiders in both cultures',
  ],
  'half-orc': [
    'Half-orcs live about 75 years',
    'When reduced to 0 HP, they can stay at 1 HP once per day (Relentless Endurance)',
    'Their critical hits deal extra damage (Savage Attacks)',
    'Many half-orcs become adventurers to prove their worth',
    'They can see in darkness up to 60 feet',
  ],
};

const CLASS_TRIVIA: Record<string, string[]> = {
  barbarian: [
    'A barbarian\'s Rage makes them resistant to physical damage',
    'At high levels, barbarians become nearly impossible to kill',
    'The Path of the Totem Warrior lets barbarians channel animal spirits',
    'Barbarians can\'t cast spells while raging',
    'Their Unarmored Defense can make them tankier than armored fighters',
  ],
  bard: [
    'Bards can learn spells from ANY class spell list',
    'Bardic Inspiration dice grow from d6 to d12 as they level',
    'The College of Lore makes bards the ultimate skill monkeys',
    'Bards use music, poetry, or oration as their spellcasting focus',
    'A high-level bard knows more skills than any other class',
  ],
  cleric: [
    'Clerics are the most versatile healers in D&D',
    'Different domains give clerics vastly different abilities',
    'War Domain clerics can attack as a bonus action',
    'Clerics can turn or destroy undead with Channel Divinity',
    'At level 10, clerics can call upon their god for Divine Intervention',
  ],
  druid: [
    'Moon Druids can Wild Shape into CR 1 beasts at level 2',
    'Druids refuse to wear metal armor - it interferes with their magic',
    'High-level druids stop aging and can\'t be magically aged',
    'Druids can Wild Shape into elementals at high levels',
    'The druidic language is secret - teaching it to non-druids is forbidden',
  ],
  fighter: [
    'Fighters get more Ability Score Improvements than any other class',
    'Action Surge lets fighters take two full turns in one round',
    'Champion fighters score critical hits on 19-20 (later 18-20)',
    'Battle Masters have combat maneuvers that control the battlefield',
    'Fighters are the only class that starts with proficiency in all weapons',
  ],
  monk: [
    'Monks can use Ki to Flurry of Blows for extra attacks',
    'At level 4, monks can catch arrows and throw them back',
    'High-level monks are immune to disease and poison',
    'Monks can run on water and up walls',
    'Way of the Open Hand monks can kill with a single touch (Quivering Palm)',
  ],
  paladin: [
    'Divine Smite can deal massive damage to fiends and undead',
    'Paladins generate an aura that protects nearby allies',
    'Breaking their oath can turn a paladin into an Oathbreaker',
    'Lay on Hands can heal OR cure diseases and poisons',
    'Paladins are immune to disease at level 3',
  ],
  ranger: [
    'Rangers can choose favored enemies they\'re especially effective against',
    'Beast Master rangers gain an animal companion',
    'Gloom Stalkers are invisible to creatures using darkvision',
    'Rangers learn to cast spells at level 2',
    'At high levels, rangers can vanish completely as a bonus action',
  ],
  rogue: [
    'Sneak Attack damage grows to 10d6 at level 19',
    'Rogues can take a bonus action to Hide, Dash, or Disengage every turn',
    'Assassins automatically crit against surprised enemies',
    'At level 7, rogues can halve damage from most attacks (Evasion)',
    'Reliable Talent means rogues can\'t roll below 10 on skilled checks',
  ],
  sorcerer: [
    'Sorcerers can modify spells with Metamagic',
    'Twinned Spell lets sorcerers cast single-target spells on two targets',
    'Wild Magic sorcerers can cause random magical effects',
    'Sorcerers know fewer spells but can cast them more flexibly',
    'Draconic Bloodline sorcerers grow scales that increase their AC',
  ],
  warlock: [
    'Warlocks regain all spell slots on a short rest',
    'Eldritch Blast is considered the best cantrip in the game',
    'Pact of the Tome gives warlocks ritual casting and extra cantrips',
    'Warlocks can speak with animals, read any language, or see in magical darkness',
    'The Hexblade patron makes warlocks formidable melee combatants',
  ],
  wizard: [
    'Wizards have the largest spell list of any class',
    'They can copy spells from scrolls and other spellbooks',
    'School of Divination wizards can replace dice rolls with pre-rolled ones',
    'Wizards can make spells permanent with the Wish spell',
    'At level 18, wizards can have a spell always prepared (Spell Mastery)',
  ],
};

const BACKGROUND_TRIVIA: Record<string, string[]> = {
  acolyte: [
    'Acolytes get free healing at temples of their faith',
    'They can perform religious ceremonies',
    'Their shelter feature means temples will protect them',
    'Acolytes often know ancient languages like Celestial or Infernal',
    'Many acolytes become clerics or paladins',
  ],
  criminal: [
    'Criminals have a reliable contact in every major city',
    'The Criminal Contact feature provides underworld information',
    'Many criminals specialize as burglars, blackmailers, or hired killers',
    'Thieves\' Cant is a secret language known to criminals',
    'Some criminals are actually spies working for governments',
  ],
  folk_hero: [
    'Folk heroes are loved by common people everywhere',
    'Their heroic deed defined them before adventuring',
    'Common folk will shelter and feed them for free',
    'Folk heroes often rose up against tyranny',
    'They typically come from humble farming backgrounds',
  ],
  noble: [
    'Nobles have Position of Privilege in high society',
    'They often come with family drama and responsibilities',
    'Noble families may have ancient enemies or debts',
    'Some nobles are actually in exile from their homes',
    'The knight variant noble comes with retainers',
  ],
  sage: [
    'Sages know where to find any piece of information',
    'They often have a specialty like alchemy or astronomy',
    'Sages can access libraries and universities freely',
    'Many sages adventure to find lost knowledge',
    'The Researcher feature lets them always find lore',
  ],
  soldier: [
    'Soldiers have Military Rank recognized by their army',
    'They may have been officers, scouts, or cavalry',
    'Other soldiers will defer to their experience',
    'Some soldiers carry trophies from their battles',
    'The specialty might be archer, healer, or standard bearer',
  ],
  outlander: [
    'Outlanders never get lost and always find food',
    'They grew up far from civilization',
    'The Wanderer feature provides excellent navigation',
    'Many outlanders are tribal members or hermits',
    'They\'re often uncomfortable in cities',
  ],
  entertainer: [
    'Entertainers can always find a venue to perform',
    'Their performances provide free lodging',
    'Many entertainers are actors, dancers, or musicians',
    'The gladiator variant performs in arenas',
    'Entertainers are often well-known and recognized',
  ],
};

// Helper to capitalize words
function toTitleCase(str: string): string {
  return str.split(/[-_\s]+/).map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

// Image Carousel Component - Larger version
function ImageCarousel({ images, characterName, characterRace, characterClass }: {
  images: { url: string; label: string }[];
  characterName: string;
  characterRace?: string;
  characterClass?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  // Generate DiceBear fallback URL
  const generateFallback = (variant: string = '') => {
    const seed = `${characterRace || 'human'}-${characterClass || 'fighter'}-${characterName || 'hero'}${variant}`;
    const styleMap: Record<string, string> = {
      human: 'adventurer',
      elf: 'lorelei',
      dwarf: 'avataaars',
      halfling: 'adventurer',
      dragonborn: 'bottts',
      tiefling: 'bottts',
      gnome: 'micah',
      'half-elf': 'lorelei',
      'half-orc': 'avataaars',
    };
    const style = styleMap[(characterRace || 'human').toLowerCase()] || 'adventurer';
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1b26&size=512`;
  };

  if (images.length === 0) {
    return (
      <div className="w-full h-80 bg-bg-tertiary rounded-lg flex items-center justify-center border border-border/30">
        <ClassIcon characterClass="fighter" size={80} color="#F59E0B" />
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageError = () => {
    const url = images[currentIndex].url;
    if (!failedUrls.has(url)) {
      console.warn(`Image failed to load: ${url}, using fallback`);
      setFailedUrls(prev => new Set(prev).add(url));
    }
  };

  const getDisplayUrl = (url: string, index: number) => {
    return failedUrls.has(url) ? generateFallback(`-img-${index}`) : url;
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Main Image - Fixed aspect ratio container for consistent arrow positioning */}
      <div className="relative flex-1 min-h-0 rounded-lg overflow-hidden border-2 border-primary/50 bg-bg-tertiary shadow-lg shadow-primary/20" style={{ aspectRatio: '2/3' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="absolute inset-0 flex items-center justify-center p-4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={getDisplayUrl(images[currentIndex].url, currentIndex)}
              alt={`${characterName} - ${images[currentIndex].label}`}
              className="max-w-full max-h-full object-contain"
              onError={handleImageError}
            />
          </motion.div>
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
        <div className="flex justify-center gap-3 mt-3 flex-shrink-0">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-primary scale-110 shadow-glow ring-2 ring-primary/50'
                  : 'border-border/30 hover:border-primary/50 hover:scale-105'
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
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateMessage, setRegenerateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Handle image regeneration
  const handleRegenerateImages = async () => {
    if (!token || !characterId || isRegenerating) return;

    setIsRegenerating(true);
    setRegenerateMessage(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/media/regenerate/${characterId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate images');
      }

      // Update character with new images
      if (data.images) {
        setCharacter((prev) => {
          if (!prev) return prev;
          const fullBodyUrls: string[] = [];
          if (data.images.fullBody1) fullBodyUrls.push(data.images.fullBody1);
          if (data.images.fullBody2) fullBodyUrls.push(data.images.fullBody2);
          return {
            ...prev,
            portraitUrl: data.images.portrait || prev.portraitUrl,
            fullBodyUrls: fullBodyUrls.length > 0 ? fullBodyUrls : prev.fullBodyUrls,
            imageSource: data.source,
          };
        });
      }

      setRegenerateMessage({
        type: 'success',
        text: `Regenerated ${data.imagesGenerated || 0} image(s) successfully!`,
      });

      // Clear success message after 5 seconds
      setTimeout(() => setRegenerateMessage(null), 5000);
    } catch (err) {
      console.error('Failed to regenerate images:', err);
      setRegenerateMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to regenerate images',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

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

  // Trivia lookups
  const raceTrivia = RACE_TRIVIA[character.race.toLowerCase()] || RACE_TRIVIA.human;
  const classTrivia = CLASS_TRIVIA[character.class.toLowerCase()] || CLASS_TRIVIA.fighter;
  const backgroundTrivia = BACKGROUND_TRIVIA[character.background?.toLowerCase() || 'soldier'] || BACKGROUND_TRIVIA.soldier;

  // Tab content renderers
  const renderStatsTab = () => (
    <div className="space-y-5">
      {/* Combat Stats - Larger */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
          <span className="text-lg">⚔️</span> Combat Statistics
        </h3>
        <div className="grid grid-cols-4 gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-center p-3 rounded-lg bg-gradient-to-b from-danger/20 to-danger/5 border border-danger/40 shadow-lg shadow-danger/10"
          >
            <div className="text-2xl font-bold text-danger">{character.currentHitPoints}/{character.maxHitPoints}</div>
            <div className="text-xs text-danger/80 uppercase tracking-wider mt-1">Hit Points</div>
            <div className="text-[10px] text-text-muted mt-1">CON: {formatModifier(character.constitution)}</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-center p-3 rounded-lg bg-gradient-to-b from-info/20 to-info/5 border border-info/40 shadow-lg shadow-info/10"
          >
            <div className="text-2xl font-bold text-info">{character.armorClass}</div>
            <div className="text-xs text-info/80 uppercase tracking-wider mt-1">Armor Class</div>
            <div className="text-[10px] text-text-muted mt-1">Base 10 + DEX</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-center p-3 rounded-lg bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/40 shadow-lg shadow-primary/10"
          >
            <div className="text-2xl font-bold text-primary">{character.speed || 30} ft</div>
            <div className="text-xs text-primary/80 uppercase tracking-wider mt-1">Speed</div>
            <div className="text-[10px] text-text-muted mt-1">{toTitleCase(character.race)} base</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-center p-3 rounded-lg bg-gradient-to-b from-secondary/20 to-secondary/5 border border-secondary/40 shadow-lg shadow-secondary/10"
          >
            <div className="text-2xl font-bold text-secondary">+{character.proficiencyBonus || 2}</div>
            <div className="text-xs text-secondary/80 uppercase tracking-wider mt-1">Proficiency</div>
            <div className="text-[10px] text-text-muted mt-1">Level {character.level}</div>
          </motion.div>
        </div>
      </div>

      {/* Ability Scores - Larger with bars */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
          <span className="text-lg">📊</span> Ability Scores
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {abilities.map((ability) => (
            <motion.div
              key={ability.abbr}
              whileHover={{ scale: 1.02 }}
              className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/30"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-primary">{ability.abbr}</span>
                <span className="text-lg font-bold text-text-primary">{ability.value}</span>
              </div>
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(ability.value / 20) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-primary to-primary/50 rounded-full"
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-text-muted">{ability.name}</span>
                <span className="text-xs font-semibold text-primary">{formatModifier(ability.value)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Additional Combat Info */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
          <span className="text-lg">🎯</span> Combat Modifiers
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-bg-tertiary/50 border border-border/30">
            <div className="text-lg font-bold text-text-primary">+{character.initiative || calculateModifier(character.dexterity)}</div>
            <div className="text-xs text-text-muted">Initiative</div>
          </div>
          <div className="p-3 rounded-lg bg-bg-tertiary/50 border border-border/30">
            <div className="text-lg font-bold text-text-primary">1d{character.class.toLowerCase() === 'barbarian' ? '12' : character.class.toLowerCase() === 'wizard' || character.class.toLowerCase() === 'sorcerer' ? '6' : '8'}</div>
            <div className="text-xs text-text-muted">Hit Dice</div>
          </div>
          <div className="p-3 rounded-lg bg-bg-tertiary/50 border border-border/30">
            <div className="text-lg font-bold text-text-primary">10 ft</div>
            <div className="text-xs text-text-muted">Darkvision</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAbilitiesTab = () => (
    <div className="space-y-5">
      {/* Skills - Enhanced */}
      <div>
        <h3 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
          <span className="text-lg">🎭</span> Proficient Skills
        </h3>
        {character.skills && character.skills.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {character.skills.map((skill, idx) => (
              <motion.div
                key={skill}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-2 rounded-lg bg-success/10 border border-success/30 flex items-center gap-2"
              >
                <span className="text-success text-sm">✓</span>
                <span className="text-text-primary text-sm capitalize">{skill.replace(/_/g, ' ')}</span>
                <span className="ml-auto text-xs text-success">+{(character.proficiencyBonus || 2) + calculateModifier(character.dexterity)}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm italic">No skill proficiencies selected</p>
        )}
      </div>

      {/* Class Features - Enhanced */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
          <span className="text-lg">⚡</span> {toTitleCase(character.class)} Features
        </h3>
        <div className="space-y-2">
          {classLore.abilities.map((ability, idx) => (
            <motion.div
              key={ability}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-3 rounded-lg bg-primary/10 border border-primary/30"
            >
              <div className="font-semibold text-primary text-sm">{ability}</div>
              <div className="text-[10px] text-text-muted mt-1">Level {character.level} Feature</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Racial Traits - Enhanced */}
      <div>
        <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
          <span className="text-lg">🧬</span> {toTitleCase(character.race)} Traits
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {raceLore.traits.map((trait, idx) => (
            <motion.div
              key={trait}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center"
            >
              <span className="text-amber-300 text-sm">{trait}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Languages - Enhanced */}
      <div>
        <h3 className="text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
          <span className="text-lg">💬</span> Languages
        </h3>
        <div className="flex flex-wrap gap-2">
          {(character.languages || ['Common']).map((lang) => (
            <span
              key={lang}
              className="px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/30 text-secondary text-sm capitalize"
            >
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Spells - Enhanced */}
      {character.spellsKnown && character.spellsKnown.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
            <span className="text-lg">✨</span> Spells Known
            {character.spellcastingAbility && (
              <span className="text-xs text-text-muted">({toTitleCase(character.spellcastingAbility)})</span>
            )}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {character.spellsKnown.map((spell, idx) => (
              <motion.div
                key={spell}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30"
              >
                <span className="text-purple-300 text-sm">{spell}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPersonalityTab = () => (
    <div className="space-y-5">
      {/* Personality Trait - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
          <span className="text-lg">💭</span> Personality Trait
        </h3>
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/30 relative">
          <div className="absolute top-2 left-3 text-3xl text-primary/30">&ldquo;</div>
          <p className="text-text-secondary text-sm italic pl-6 pr-4">
            {character.appearance?.personalityTrait || 'A mysterious soul with hidden depths...'}
          </p>
          <div className="absolute bottom-2 right-3 text-3xl text-primary/30">&rdquo;</div>
        </div>
      </motion.div>

      {/* Character Values Grid - Enhanced */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-semibold text-success mb-2 flex items-center gap-2">
            <span>⭐</span> Ideal
          </h3>
          <div className="p-3 rounded-lg bg-success/10 border border-success/30 h-20 overflow-y-auto">
            <p className="text-text-secondary text-xs">
              {character.appearance?.ideal || 'To make a difference in this world'}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-info mb-2 flex items-center gap-2">
            <span>🔗</span> Bond
          </h3>
          <div className="p-3 rounded-lg bg-info/10 border border-info/30 h-20 overflow-y-auto">
            <p className="text-text-secondary text-xs">
              {character.appearance?.bond || 'Those who stand beside me in battle'}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="col-span-2"
        >
          <h3 className="text-sm font-semibold text-danger mb-2 flex items-center gap-2">
            <span>💔</span> Flaw
          </h3>
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/30">
            <p className="text-text-secondary text-xs">
              {character.appearance?.flaw || 'Pride that sometimes clouds judgment'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Backstory - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
          <span className="text-lg">📖</span> Backstory
        </h3>
        <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/30 max-h-32 overflow-y-auto">
          <p className="text-text-secondary text-xs leading-relaxed">
            {character.appearance?.backstory || `${character.name} emerged from the ${character.background || 'unknown'} life, driven by destiny to become a legendary ${character.class}. Their journey has only just begun...`}
          </p>
        </div>
      </motion.div>
    </div>
  );

  const renderLoreTab = () => (
    <div className="space-y-5">
      {/* Race Lore - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
          <span className="text-lg">🏛️</span>
          <span>{toTitleCase(character.race)} Heritage</span>
        </h3>
        <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30">
          <p className="text-text-secondary text-sm leading-relaxed mb-3">{raceLore.description}</p>
          <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/10 p-2 rounded">
            <span>🏠</span>
            <span className="italic">{raceLore.homeland}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-500/20">
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Racial Abilities</div>
            <div className="flex flex-wrap gap-2">
              {raceLore.traits.map((trait) => (
                <span key={trait} className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-xs">{trait}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Class Lore - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
          <span className="text-lg">⚔️</span>
          <span>The {toTitleCase(character.class)} Path</span>
        </h3>
        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/30">
          <p className="text-text-secondary text-sm leading-relaxed mb-3">{classLore.description}</p>
          <div className="flex items-center gap-2 text-xs text-primary/80 bg-primary/10 p-2 rounded">
            <span>🎯</span>
            <span>Combat Role: <strong>{classLore.role}</strong></span>
          </div>
          <div className="mt-3 pt-3 border-t border-primary/20">
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Key Abilities</div>
            <div className="flex flex-wrap gap-2">
              {classLore.abilities.map((ability) => (
                <span key={ability} className="px-2 py-1 rounded bg-primary/20 text-primary text-xs">{ability}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Background Lore - Enhanced */}
      {character.background && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
            <span className="text-lg">📜</span>
            <span>{toTitleCase(character.background)} Background</span>
          </h3>
          <div className="p-4 rounded-lg bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/30">
            <p className="text-text-secondary text-sm leading-relaxed mb-3">{backgroundLore.description}</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs text-secondary/80 bg-secondary/10 p-2 rounded">
                <span>✨</span>
                <div>
                  <div className="font-semibold text-secondary">Feature</div>
                  <div className="text-text-muted">{backgroundLore.feature}</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs text-secondary/80 bg-secondary/10 p-2 rounded">
                <span>💫</span>
                <div>
                  <div className="font-semibold text-secondary">Ideal</div>
                  <div className="text-text-muted">{backgroundLore.ideal}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderTriviaTab = () => (
    <div className="space-y-4">
      {/* Race Trivia - Limited to 3 facts */}
      <div>
        <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
          <span>🏛️</span>
          <span className="capitalize">{character.race} Fun Facts</span>
        </h3>
        <div className="space-y-1.5">
          {raceTrivia.slice(0, 3).map((fact, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-colors"
            >
              <span className="text-amber-400 text-xs mt-0.5">✦</span>
              <span className="text-text-secondary text-xs">{fact}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Class Trivia - Limited to 3 facts */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
          <span>⚔️</span>
          <span className="capitalize">{character.class} Secrets</span>
        </h3>
        <div className="space-y-1.5">
          {classTrivia.slice(0, 3).map((fact, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
              className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
            >
              <span className="text-primary text-xs mt-0.5">✦</span>
              <span className="text-text-secondary text-xs">{fact}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background Trivia - Limited to 3 facts */}
      {character.background && (
        <div>
          <h3 className="text-sm font-semibold text-secondary mb-2 flex items-center gap-2">
            <span>📜</span>
            <span>{toTitleCase(character.background)} Tips</span>
          </h3>
          <div className="space-y-1.5">
            {backgroundTrivia.slice(0, 3).map((fact, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                className="flex items-start gap-2 p-2 rounded-lg bg-secondary/5 border border-secondary/20 hover:bg-secondary/10 transition-colors"
              >
                <span className="text-secondary text-xs mt-0.5">✦</span>
                <span className="text-text-secondary text-xs">{fact}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Multi-layer animated background */}
      <div className="dnd-page-background" />

      {/* Bright animated gradient orbs - More vibrant */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large golden orb */}
        <motion.div
          animate={{
            x: [0, 150, 0],
            y: [0, -80, 0],
            scale: [1, 1.4, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary blur-3xl"
        />
        {/* Purple magic orb */}
        <motion.div
          animate={{
            x: [0, -120, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
            opacity: [0.12, 0.22, 0.12],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary blur-3xl"
        />
        {/* Amber warm orb */}
        <motion.div
          animate={{
            x: [0, 80, 0],
            y: [0, -60, 0],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-1/2 right-1/3 w-[350px] h-[350px] rounded-full bg-amber-500 blur-3xl"
        />
        {/* Cyan cool orb */}
        <motion.div
          animate={{
            x: [0, -60, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
            opacity: [0.08, 0.18, 0.08],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-500 blur-3xl"
        />
      </div>

      {/* Floating runes */}
      <Suspense fallback={null}>
        <FloatingRunes />
      </Suspense>

      {/* Particles - Magic variant for more sparkle */}
      <Suspense fallback={null}>
        <AmbientParticles variant="magic" />
      </Suspense>

      {/* Bright sparkle layer - More particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${i % 3 === 0 ? 'w-1.5 h-1.5 bg-primary' : i % 3 === 1 ? 'w-1 h-1 bg-amber-400' : 'w-0.5 h-0.5 bg-white'}`}
            style={{
              left: `${(i * 2.5) % 100}%`,
              top: `${(i * 7) % 100}%`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 2, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 1.5 + (i % 3),
              repeat: Infinity,
              delay: (i * 0.15) % 3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Floating light beams */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ opacity: [0.03, 0.08, 0.03], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-primary/30 via-primary/10 to-transparent"
          style={{ filter: 'blur(20px)' }}
        />
        <motion.div
          animate={{ opacity: [0.02, 0.06, 0.02], rotate: [0, -3, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-secondary/20 via-secondary/5 to-transparent"
          style={{ filter: 'blur(25px)' }}
        />
      </div>

      {/* Vignette with subtle golden glow at top */}
      <div className="dnd-vignette" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-primary/8 via-transparent to-bg-primary/60" />

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
                    <h1 className="dnd-heading-epic text-2xl">{character.name}</h1>
                    <p className="text-text-secondary text-sm mt-4">
                      {toTitleCase(character.subrace || character.race)} {toTitleCase(character.subclass || character.class)}
                    </p>
                    {character.background && (
                      <p className="text-text-muted text-xs">{toTitleCase(character.background)} Background</p>
                    )}
                  </div>

                  {/* Image Carousel */}
                  <div className="flex-1 min-h-0">
                    <ImageCarousel images={imageList} characterName={character.name} characterRace={character.race} characterClass={character.class} />
                  </div>

                  {/* Regenerate Images Button */}
                  <div className="mt-3">
                    <motion.button
                      onClick={handleRegenerateImages}
                      disabled={isRegenerating}
                      whileHover={{ scale: isRegenerating ? 1 : 1.02 }}
                      whileTap={{ scale: isRegenerating ? 1 : 0.98 }}
                      className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        isRegenerating
                          ? 'bg-bg-tertiary text-text-muted cursor-not-allowed'
                          : 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/50 text-primary hover:border-primary hover:shadow-lg hover:shadow-primary/20'
                      }`}
                    >
                      {isRegenerating ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            🎨
                          </motion.span>
                          Regenerating...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          🔄 Regenerate Images
                        </span>
                      )}
                    </motion.button>
                    {regenerateMessage && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-xs mt-2 text-center ${
                          regenerateMessage.type === 'success' ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {regenerateMessage.text}
                      </motion.p>
                    )}
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
                    <TabButton active={activeTab === 'trivia'} onClick={() => setActiveTab('trivia')}>
                      Trivia
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
                        {activeTab === 'trivia' && renderTriviaTab()}
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
