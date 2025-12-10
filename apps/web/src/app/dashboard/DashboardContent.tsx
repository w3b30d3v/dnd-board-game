'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { EnchantedCard } from '@/components/dnd/EnchantedCard';
import {
  SwordIcon,
  ScrollIcon,
  D20Icon,
  HeartIcon,
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
  abilityScores?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  appearance?: {
    personalityTrait?: string;
    ideal?: string;
    bond?: string;
    flaw?: string;
    backstory?: string;
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

// Card animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

// Character card hover animation
const characterCardVariants = {
  idle: { scale: 1, rotateY: 0 },
  hover: {
    scale: 1.02,
    rotateY: 2,
    transition: { duration: 0.3 }
  },
};

// Character Trading Card Modal - Matches mockup/16_character_trading_card.html exactly
interface CharacterCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
}

function CharacterCardModal({ isOpen, onClose, character }: CharacterCardModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen || !character) return null;

  // Build array of available images
  const imageList: { url: string; label: string }[] = [];
  if (character.portraitUrl) {
    imageList.push({ url: character.portraitUrl, label: 'Portrait' });
  }
  if (character.fullBodyUrls && character.fullBodyUrls.length > 0) {
    character.fullBodyUrls.forEach((url, index) => {
      if (url) {
        const labels = ['Heroic Pose', 'Action Pose'];
        imageList.push({ url, label: labels[index] || `Full Body ${index + 1}` });
      }
    });
  }

  const hasImages = imageList.length > 0;
  const currentImage = hasImages ? (imageList[currentImageIndex] || imageList[0]) : null;
  const hasMultipleImages = imageList.length > 1;
  const isGenerating = character.status === 'generating';

  // Calculate derived stats
  const abilities = character.abilityScores || {
    strength: 10, dexterity: 10, constitution: 10,
    intelligence: 10, wisdom: 10, charisma: 10
  };
  const proficiencyBonus = Math.floor((character.level - 1) / 4) + 2;
  const power = Math.max(abilities.strength, abilities.dexterity) + proficiencyBonus;
  const defense = character.armorClass || 10;
  const magicMod = Math.max(abilities.intelligence, abilities.wisdom, abilities.charisma);
  const magicBonus = Math.floor((magicMod - 10) / 2) + proficiencyBonus;
  const hp = character.maxHitPoints || 10;

  // Calculate rarity (1-5 stars based on level)
  const rarity = Math.min(5, Math.ceil(character.level / 4));

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
            onClick={(e) => e.stopPropagation()}
          >
            {/* Trading Card Container - 2.5" x 3.5" ratio (250x350px) */}
            <div
              className="relative overflow-hidden"
              style={{
                width: '280px',
                height: '392px',
                background: 'linear-gradient(160deg, #2a2735 0%, #1e1b26 50%, #151218 100%)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 60px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Gold Frame Border */}
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  border: '3px solid',
                  borderImage: 'linear-gradient(180deg, #F59E0B 0%, #D97706 50%, #92400E 100%) 1',
                  borderRadius: '12px',
                }}
              />

              {/* Header with Name and Rarity Stars */}
              <div className="flex flex-col items-center justify-center px-3 py-2" style={{ background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)' }}>
                <h2
                  className="text-sm font-bold text-primary uppercase tracking-wide text-center truncate w-full"
                  style={{ fontFamily: 'Cinzel, serif', textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)' }}
                >
                  {character.name || 'Unnamed Hero'}
                </h2>
                {/* Rarity Stars */}
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-xs ${star <= rarity ? 'text-primary' : 'text-zinc-700'}`}
                      style={{ textShadow: star <= rarity ? '0 0 4px rgba(245, 158, 11, 0.5)' : 'none' }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              {/* Ornate Gold Bar */}
              <div
                className="mx-3 mb-2 rounded"
                style={{
                  height: '6px',
                  background: 'linear-gradient(90deg, transparent 0%, #92400E 10%, #F59E0B 30%, #FCD34D 50%, #F59E0B 70%, #92400E 90%, transparent 100%)',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                }}
              />

              {/* Image Section */}
              <div
                className="mx-3 relative overflow-hidden"
                style={{
                  height: '120px',
                  borderRadius: '6px',
                  border: '2px solid #F59E0B',
                  background: '#0f0d13',
                  boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 10px rgba(245, 158, 11, 0.3)',
                }}
              >
                {hasImages && currentImage ? (
                  <>
                    <img
                      src={currentImage.url}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Navigation Arrows */}
                    {hasMultipleImages && (
                      <>
                        <button
                          onClick={goToPrevious}
                          className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-primary text-xs hover:bg-primary/30 transition-colors"
                          style={{ background: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(245, 158, 11, 0.5)' }}
                        >
                          ‹
                        </button>
                        <button
                          onClick={goToNext}
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-primary text-xs hover:bg-primary/30 transition-colors"
                          style={{ background: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(245, 158, 11, 0.5)' }}
                        >
                          ›
                        </button>
                      </>
                    )}
                    {/* Image Counter */}
                    <div
                      className="absolute bottom-1 right-1 px-2 py-0.5 rounded-full text-white text-xs"
                      style={{ background: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '9px' }}
                    >
                      {currentImageIndex + 1}/{imageList.length}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {isGenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          className="text-3xl"
                        >
                          🎨
                        </motion.div>
                        <p className="text-text-muted text-xs mt-1">Generating...</p>
                      </>
                    ) : (
                      <ClassIcon characterClass={character.class} size={48} color="#F59E0B" />
                    )}
                  </div>
                )}
              </div>

              {/* Character Subtitle */}
              <p className="text-center text-xs text-zinc-400 py-1 capitalize">
                {character.race} • {character.class} • Lv.{character.level}
              </p>

              {/* Big Stats Grid (PWR, DEF, MAG, HP) */}
              <div
                className="mx-3 grid grid-cols-4 gap-1 p-1 rounded-md"
                style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)' }}
              >
                {/* Power */}
                <div className="text-center p-1 rounded" style={{ background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div className="text-lg" style={{ color: '#FF6B6B', textShadow: '0 0 10px #FF6B6B, 0 0 16px #FF6B6B', filter: 'brightness(1.5)' }}>⚔</div>
                  <div className="text-sm font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#FCA5A5', textShadow: '0 0 8px rgba(239, 68, 68, 0.4)' }}>{power}</div>
                  <div className="text-[8px] uppercase tracking-wider" style={{ color: '#EF4444' }}>PWR</div>
                </div>
                {/* Defense */}
                <div className="text-center p-1 rounded" style={{ background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div className="text-lg" style={{ color: '#7DD3FC', textShadow: '0 0 10px #7DD3FC, 0 0 16px #7DD3FC', filter: 'brightness(1.5)' }}>🛡</div>
                  <div className="text-sm font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#BAE6FD', textShadow: '0 0 8px rgba(56, 189, 248, 0.4)' }}>{defense}</div>
                  <div className="text-[8px] uppercase tracking-wider" style={{ color: '#38BDF8' }}>DEF</div>
                </div>
                {/* Magic */}
                <div className="text-center p-1 rounded" style={{ background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div className="text-lg" style={{ color: '#C4B5FD', textShadow: '0 0 10px #C4B5FD, 0 0 16px #C4B5FD', filter: 'brightness(1.5)' }}>✨</div>
                  <div className="text-sm font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#DDD6FE', textShadow: '0 0 8px rgba(167, 139, 250, 0.4)' }}>+{magicBonus}</div>
                  <div className="text-[8px] uppercase tracking-wider" style={{ color: '#A78BFA' }}>MAG</div>
                </div>
                {/* HP */}
                <div className="text-center p-1 rounded" style={{ background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div className="text-lg" style={{ color: '#86EFAC', textShadow: '0 0 10px #86EFAC, 0 0 16px #86EFAC', filter: 'brightness(1.5)' }}>❤</div>
                  <div className="text-sm font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#BBF7D0', textShadow: '0 0 8px rgba(74, 222, 128, 0.4)' }}>{hp}</div>
                  <div className="text-[8px] uppercase tracking-wider" style={{ color: '#4ADE80' }}>HP</div>
                </div>
              </div>

              {/* Ability Scores Row */}
              <div
                className="mx-3 mt-1 flex justify-around p-1 rounded-md"
                style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
              >
                {[
                  { name: 'STR', value: abilities.strength },
                  { name: 'DEX', value: abilities.dexterity },
                  { name: 'CON', value: abilities.constitution },
                  { name: 'INT', value: abilities.intelligence },
                  { name: 'WIS', value: abilities.wisdom },
                  { name: 'CHA', value: abilities.charisma },
                ].map((ability) => (
                  <div
                    key={ability.name}
                    className="text-center px-1 py-0.5 rounded min-w-[28px]"
                    style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(245, 158, 11, 0.4)' }}
                  >
                    <div className="text-[7px] font-semibold text-primary">{ability.name}</div>
                    <div className="text-[10px] font-bold" style={{ color: '#FCD34D', textShadow: '0 0 4px rgba(252, 211, 77, 0.3)' }}>{ability.value}</div>
                  </div>
                ))}
              </div>

              {/* Motto/Quote */}
              <div className="px-4 pt-1 text-center">
                <p
                  className="text-xs italic text-zinc-300 truncate"
                  style={{ fontFamily: 'Crimson Text, Georgia, serif' }}
                >
                  {character.appearance?.personalityTrait
                    ? `"${character.appearance.personalityTrait.substring(0, 50)}${character.appearance.personalityTrait.length > 50 ? '...' : ''}"`
                    : '"Adventure awaits the bold."'}
                </p>
              </div>

              {/* D&D Logo */}
              <div className="absolute bottom-1 left-0 right-0 flex justify-center items-center">
                <div className="flex items-center">
                  <span style={{ fontFamily: 'Cinzel Decorative, serif', fontSize: '12px', fontWeight: 700, color: '#F59E0B', textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)' }}>D</span>
                  <span style={{ fontFamily: 'Cinzel Decorative, serif', fontSize: '16px', color: '#F59E0B', margin: '0 1px', textShadow: '0 0 10px rgba(245, 158, 11, 0.5), 0 1px 4px rgba(0, 0, 0, 0.5)' }}>&</span>
                  <span style={{ fontFamily: 'Cinzel Decorative, serif', fontSize: '12px', fontWeight: 700, color: '#F59E0B', textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)' }}>D</span>
                </div>
              </div>

              {/* Close button - floating */}
              <button
                onClick={onClose}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-20 text-xs"
              >
                ✕
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useRequireAuth('/login');
  const { logout, token } = useAuthStore(state => ({ logout: state.logout, token: state.token }));
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [showCreatedMessage, setShowCreatedMessage] = useState(false);
  const [generatingCharacterId, setGeneratingCharacterId] = useState<string | null>(null);
  const [showCharacterCard, setShowCharacterCard] = useState<string | null>(null);

  // Handle image generation for newly created character
  useEffect(() => {
    const characterId = searchParams?.get('characterId');
    const shouldGenerateImages = searchParams?.get('generateImages') === 'true';

    if (characterId && shouldGenerateImages && token) {
      // Clear URL params
      router.replace('/dashboard', { scroll: false });

      // Set generating state
      setGeneratingCharacterId(characterId);
      setShowCreatedMessage(true);

      // Trigger image generation
      const generateImages = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const response = await fetch(`${apiUrl}/characters/${characterId}/generate-images`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();
            // Update the character in state with new images
            setCharacters(prev => prev.map(char =>
              char.id === characterId
                ? {
                    ...char,
                    status: 'complete',
                    portraitUrl: result.character?.portraitUrl,
                    fullBodyUrls: result.character?.fullBodyUrls,
                    imageSource: result.source,
                  }
                : char
            ));
          }
        } catch (error) {
          console.error('Failed to generate images:', error);
        } finally {
          setGeneratingCharacterId(null);
          setTimeout(() => setShowCreatedMessage(false), 3000);
        }
      };

      generateImages();
    }
  }, [searchParams, token, router]);

  // Check if we just created a character (legacy support)
  useEffect(() => {
    if (searchParams?.get('created') === 'true') {
      setShowCreatedMessage(true);
      router.replace('/dashboard', { scroll: false });
      setTimeout(() => setShowCreatedMessage(false), 5000);
    }
  }, [searchParams, router]);

  // Fetch characters
  useEffect(() => {
    const fetchCharacters = async () => {
      if (!token) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/characters`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCharacters(data.characters || []);
        }
      } catch (error) {
        console.error('Failed to fetch characters:', error);
      } finally {
        setLoadingCharacters(false);
      }
    };

    if (user) {
      fetchCharacters();
    }
  }, [token, user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading || !user) {
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Multi-layer background */}
      <div className="dnd-page-background" />

      {/* Enhanced background layers */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl bg-primary/5"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl bg-secondary/5"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Floating runes in background */}
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
              <Link href="/" className="group flex items-center gap-2">
                <motion.div
                  whileHover={{ rotate: 20 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <D20Icon size={28} color="#F59E0B" />
                </motion.div>
                <span className="dnd-heading-epic text-2xl pb-0 logo-glow-pulse">
                  D&D Board
                </span>
              </Link>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-text-muted">Welcome back,</p>
                  <p className="font-medium text-primary">{user.displayName}</p>
                </div>

                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-bg-primary font-bold shadow-glow cursor-pointer"
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </motion.div>

                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-stone text-sm px-4 py-2"
                >
                  Logout
                </motion.button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="dnd-heading-epic text-4xl pb-4">
              Your Quest Board
            </h1>
            <p className="text-text-secondary dnd-flavor">
              &quot;What adventure calls to you today, brave {user.displayName}?&quot;
            </p>
          </motion.div>

          {/* Success Message */}
          <AnimatePresence>
            {showCreatedMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="col-span-full mb-4 p-4 rounded-lg bg-success/10 border border-success/30 text-success flex items-center gap-3"
              >
                {generatingCharacterId ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      🎨
                    </motion.div>
                    Character created! Generating AI artwork... This may take a moment.
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: 3 }}
                    >
                      ✨
                    </motion.div>
                    Character created successfully! Your hero is ready for adventure.
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Characters Card */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <EnchantedCard showCorners hover className="h-full">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30"
                  >
                    <SwordIcon size={28} color="#F59E0B" />
                  </motion.div>
                  <div>
                    <h3 className="dnd-heading-section text-lg mb-0 border-none pb-0">
                      My Heroes
                    </h3>
                    <p className="text-sm text-text-muted">
                      {loadingCharacters ? 'Loading...' : `${characters.length} character${characters.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <p className="text-text-secondary text-sm mb-4">
                  Create and manage your D&D 5e characters with the full character builder.
                </p>
                <Link href="/characters/create">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-adventure w-full text-center"
                  >
                    Create Character
                  </motion.button>
                </Link>
              </EnchantedCard>
            </motion.div>

            {/* Campaigns Card */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <EnchantedCard variant="magical" showCorners hover className="h-full">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: -12, scale: 1.1 }}
                    className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center border border-secondary/30"
                  >
                    <ScrollIcon size={28} color="#8B5CF6" />
                  </motion.div>
                  <div>
                    <h3 className="dnd-heading-section text-lg mb-0 border-none pb-0" style={{ color: '#A78BFA' }}>
                      Campaigns
                    </h3>
                    <p className="text-sm text-text-muted">0 campaigns</p>
                  </div>
                </div>
                <p className="text-text-secondary text-sm mb-4">
                  Join existing campaigns or create your own adventure as a Dungeon Master.
                </p>
                <button className="btn-magic w-full opacity-60" disabled>
                  Coming in Phase 6
                </button>
              </EnchantedCard>
            </motion.div>

            {/* Quick Play Card */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              <EnchantedCard variant="legendary" showCorners hover className="h-full">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: 20, scale: 1.1 }}
                    className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/30 to-amber-500/10 flex items-center justify-center border border-amber-500/30"
                  >
                    <D20Icon size={28} color="#F59E0B" />
                  </motion.div>
                  <div>
                    <h3 className="dnd-heading-section text-lg mb-0 border-none pb-0">
                      Quick Play
                    </h3>
                    <p className="text-sm text-text-muted">Jump right in</p>
                  </div>
                </div>
                <p className="text-text-secondary text-sm mb-4">
                  Start a quick game session with pre-made characters and scenarios.
                </p>
                <button className="btn-stone w-full opacity-60" disabled>
                  Coming in Phase 5
                </button>
              </EnchantedCard>
            </motion.div>
          </div>

          {/* Character List Section */}
          <AnimatePresence>
            {characters.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12"
              >
                <div className="dnd-divider mb-8" />
                <div className="flex items-center justify-between mb-6">
                  <h2 className="dnd-heading-section text-xl">
                    Your Heroes
                  </h2>
                  <Link href="/characters/create">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-stone text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <span className="text-primary">+</span> New Character
                    </motion.button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {characters.map((char, index) => {
                    const isGenerating = generatingCharacterId === char.id || char.status === 'generating';
                    const hasImages = char.status === 'complete' && char.portraitUrl;

                    return (
                      <motion.div
                        key={char.id}
                        variants={characterCardVariants}
                        initial="idle"
                        whileHover="hover"
                        custom={index}
                        style={{ perspective: 1000 }}
                      >
                        <EnchantedCard hover className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {/* Character Portrait or Class Icon */}
                              <div className="relative">
                                {hasImages && char.portraitUrl ? (
                                  <button
                                    onClick={() => setShowCharacterCard(char.id)}
                                    className="w-12 h-12 rounded-lg overflow-hidden border-2 border-primary/50 hover:border-primary transition-colors cursor-pointer"
                                    title="View character card"
                                  >
                                    <img
                                      src={char.portraitUrl}
                                      alt={char.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                                    {isGenerating ? (
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                        className="text-xl"
                                      >
                                        🎨
                                      </motion.div>
                                    ) : (
                                      <ClassIcon characterClass={char.class} size={24} color="#F59E0B" />
                                    )}
                                  </div>
                                )}
                                {/* Status badge */}
                                {isGenerating && (
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-warning flex items-center justify-center">
                                    <motion.div
                                      animate={{ scale: [1, 1.3, 1] }}
                                      transition={{ duration: 1, repeat: Infinity }}
                                      className="w-2 h-2 rounded-full bg-white"
                                    />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className="font-display font-semibold text-lg text-text-primary">
                                  {char.name}
                                </h3>
                                <p className="text-sm text-text-secondary">
                                  Level {char.level} {char.race} {char.class}
                                </p>
                                {isGenerating && (
                                  <p className="text-xs text-warning mt-1">Generating images...</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <HeartIcon size={16} color="#EF4444" />
                              <span className="text-lg font-bold text-danger">
                                {char.currentHitPoints}/{char.maxHitPoints}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setShowCharacterCard(char.id)}
                              className="btn-adventure text-xs px-3 py-1 w-full"
                            >
                              View Card
                            </motion.button>
                          </div>
                        </EnchantedCard>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Account Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <div className="dnd-divider mb-8" />
            <h2 className="dnd-heading-section text-xl mb-6 flex items-center gap-3">
              <ScrollIcon size={24} color="#F59E0B" />
              Hero&apos;s Chronicle
            </h2>
            <EnchantedCard className="relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-[10px]">@</span>
                    Email
                  </p>
                  <p className="text-text-primary">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-[10px]">#</span>
                    Username
                  </p>
                  <p className="text-primary">@{user.username}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-[10px]">✦</span>
                    Display Name
                  </p>
                  <p className="text-text-primary">{user.displayName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-[10px]">📅</span>
                    Adventure Began
                  </p>
                  <p className="text-text-primary">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </EnchantedCard>
          </motion.div>
        </main>
      </div>

      {/* Character Card Modal */}
      <CharacterCardModal
        isOpen={!!showCharacterCard}
        onClose={() => setShowCharacterCard(null)}
        character={characters.find(c => c.id === showCharacterCard) || null}
      />
    </div>
  );
}
