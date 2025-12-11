'use client';

import { useParams } from 'next/navigation';
// Note: useRouter not needed since we use Link components for navigation
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

function calculateModifier(score: number): number {
  const mod = Math.floor((score - 10) / 2);
  return mod;
}

function formatModifier(score: number): string {
  const mod = calculateModifier(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Image Carousel Component
function ImageCarousel({ images, characterName }: { images: { url: string; label: string }[]; characterName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full h-80 bg-bg-tertiary rounded-lg flex items-center justify-center border border-border/30">
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
      <div className="relative w-full h-80 md:h-96 rounded-lg overflow-hidden border-2 border-primary/50 bg-bg-tertiary">
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
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold hover:scale-110 transition-transform"
              style={{
                background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.3) 0%, rgba(0, 0, 0, 0.9) 100%)',
                border: '2px solid #F59E0B',
                color: '#FFD700',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
              }}
            >
              &lsaquo;
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold hover:scale-110 transition-transform"
              style={{
                background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.3) 0%, rgba(0, 0, 0, 0.9) 100%)',
                border: '2px solid #F59E0B',
                color: '#FFD700',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
              }}
            >
              &rsaquo;
            </button>
          </>
        )}

        {/* Image Label */}
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-semibold"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#D4A84B',
            border: '1px solid rgba(212, 168, 75, 0.5)',
          }}
        >
          {images[currentIndex].label}
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div
            className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-semibold"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#D4A84B',
              border: '1px solid rgba(212, 168, 75, 0.5)',
            }}
          >
            {currentIndex + 1}/{images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
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

export default function CharacterDetailsContent() {
  const params = useParams();
  const { user, isLoading } = useRequireAuth('/login');
  const { token } = useAuthStore((state) => ({ token: state.token }));
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen relative overflow-hidden">
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
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass border-b border-border/50 backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/dashboard" className="group flex items-center gap-2">
                <motion.div
                  whileHover={{ rotate: 20 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <D20Icon size={28} color="#F59E0B" />
                </motion.div>
                <span className="dnd-heading-epic text-2xl pb-0 logo-glow-pulse">D&D Board</span>
              </Link>

              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-stone text-sm px-4 py-2 flex items-center gap-2"
                >
                  <span>&larr;</span> Back to Dashboard
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Character Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="dnd-heading-epic text-4xl pb-2">{character.name}</h1>
            <p className="text-text-secondary text-lg capitalize">
              Level {character.level} {character.subrace || character.race} {character.subclass || character.class}
              {character.background && ` - ${character.background}`}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
              <EnchantedCard showCorners className="p-4">
                <h2 className="dnd-heading-section text-lg mb-4 flex items-center gap-2">
                  <span className="text-primary">Portrait Gallery</span>
                </h2>
                <ImageCarousel images={imageList} characterName={character.name} />
                {character.imageSource && (
                  <p className="text-xs text-text-muted mt-3 text-center">
                    Generated with {character.imageSource === 'nanobanana' ? 'AI (NanoBanana)' : 'DiceBear'}
                  </p>
                )}
              </EnchantedCard>
            </motion.div>

            {/* Right Column - Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Core Stats */}
              <EnchantedCard showCorners className="p-4">
                <h2 className="dnd-heading-section text-lg mb-4">Combat Stats</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-danger/10 border border-danger/30">
                    <div className="text-2xl font-bold text-danger">{character.currentHitPoints}/{character.maxHitPoints}</div>
                    <div className="text-xs text-text-muted uppercase">Hit Points</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-info/10 border border-info/30">
                    <div className="text-2xl font-bold text-info">{character.armorClass}</div>
                    <div className="text-xs text-text-muted uppercase">Armor Class</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="text-2xl font-bold text-primary">{character.speed || 30} ft</div>
                    <div className="text-xs text-text-muted uppercase">Speed</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/10 border border-secondary/30">
                    <div className="text-2xl font-bold text-secondary">+{character.proficiencyBonus || 2}</div>
                    <div className="text-xs text-text-muted uppercase">Proficiency</div>
                  </div>
                </div>
              </EnchantedCard>

              {/* Ability Scores */}
              <EnchantedCard showCorners className="p-4">
                <h2 className="dnd-heading-section text-lg mb-4">Ability Scores</h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {abilities.map((ability) => (
                    <div
                      key={ability.abbr}
                      className="text-center p-3 rounded-lg bg-primary/5 border border-primary/30 hover:border-primary/60 transition-colors"
                    >
                      <div className="text-xs font-bold text-primary mb-1">{ability.abbr}</div>
                      <div className="text-2xl font-bold text-text-primary">{ability.value}</div>
                      <div className="text-sm text-text-secondary">{formatModifier(ability.value)}</div>
                    </div>
                  ))}
                </div>
              </EnchantedCard>

              {/* Skills */}
              {character.skills && character.skills.length > 0 && (
                <EnchantedCard showCorners className="p-4">
                  <h2 className="dnd-heading-section text-lg mb-4">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {character.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full bg-success/10 border border-success/30 text-success text-sm capitalize"
                      >
                        {skill.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </EnchantedCard>
              )}

              {/* Languages */}
              {character.languages && character.languages.length > 0 && (
                <EnchantedCard showCorners className="p-4">
                  <h2 className="dnd-heading-section text-lg mb-4">Languages</h2>
                  <div className="flex flex-wrap gap-2">
                    {character.languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-secondary text-sm capitalize"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </EnchantedCard>
              )}

              {/* Spells (if any) */}
              {character.spellsKnown && character.spellsKnown.length > 0 && (
                <EnchantedCard variant="magical" showCorners className="p-4">
                  <h2 className="dnd-heading-section text-lg mb-4" style={{ color: '#A78BFA' }}>
                    Spells Known
                  </h2>
                  {character.spellcastingAbility && (
                    <p className="text-sm text-text-muted mb-3 capitalize">
                      Spellcasting Ability: {character.spellcastingAbility}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {character.spellsKnown.map((spell) => (
                      <span
                        key={spell}
                        className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm"
                      >
                        {spell}
                      </span>
                    ))}
                  </div>
                </EnchantedCard>
              )}

              {/* Appearance & Personality */}
              {character.appearance && (
                <EnchantedCard showCorners className="p-4">
                  <h2 className="dnd-heading-section text-lg mb-4">Appearance & Personality</h2>
                  <div className="space-y-4">
                    {/* Physical Appearance */}
                    {(character.appearance.hairColor || character.appearance.eyeColor || character.appearance.skinColor || character.appearance.height || character.appearance.weight) && (
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-2">Physical Traits</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {character.appearance.hairColor && (
                            <div><span className="text-text-muted">Hair:</span> <span className="capitalize">{character.appearance.hairColor}</span></div>
                          )}
                          {character.appearance.eyeColor && (
                            <div><span className="text-text-muted">Eyes:</span> <span className="capitalize">{character.appearance.eyeColor}</span></div>
                          )}
                          {character.appearance.skinColor && (
                            <div><span className="text-text-muted">Skin:</span> <span className="capitalize">{character.appearance.skinColor}</span></div>
                          )}
                          {character.appearance.height && (
                            <div><span className="text-text-muted">Height:</span> {character.appearance.height}</div>
                          )}
                          {character.appearance.weight && (
                            <div><span className="text-text-muted">Weight:</span> {character.appearance.weight}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {character.appearance.distinguishingFeatures && (
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-1">Distinguishing Features</h3>
                        <p className="text-text-secondary text-sm">{character.appearance.distinguishingFeatures}</p>
                      </div>
                    )}

                    {character.appearance.personalityTrait && (
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-1">Personality Trait</h3>
                        <p className="text-text-secondary text-sm italic">&ldquo;{character.appearance.personalityTrait}&rdquo;</p>
                      </div>
                    )}

                    {character.appearance.ideal && (
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-1">Ideal</h3>
                        <p className="text-text-secondary text-sm">{character.appearance.ideal}</p>
                      </div>
                    )}

                    {character.appearance.bond && (
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-1">Bond</h3>
                        <p className="text-text-secondary text-sm">{character.appearance.bond}</p>
                      </div>
                    )}

                    {character.appearance.flaw && (
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-1">Flaw</h3>
                        <p className="text-text-secondary text-sm">{character.appearance.flaw}</p>
                      </div>
                    )}

                    {character.appearance.backstory && (
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-1">Backstory</h3>
                        <p className="text-text-secondary text-sm whitespace-pre-line">{character.appearance.backstory}</p>
                      </div>
                    )}
                  </div>
                </EnchantedCard>
              )}

              {/* Character Info */}
              <EnchantedCard className="p-4">
                <h2 className="dnd-heading-section text-lg mb-4">Character Info</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-muted">Created:</span>{' '}
                    {new Date(character.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div>
                    <span className="text-text-muted">Status:</span>{' '}
                    <span className="capitalize">{character.status}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Initiative:</span> +{character.initiative || calculateModifier(character.dexterity)}
                  </div>
                  <div>
                    <span className="text-text-muted">Experience:</span> 0 XP
                  </div>
                </div>
              </EnchantedCard>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
