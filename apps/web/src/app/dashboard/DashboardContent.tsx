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
  createdAt: string;
  status: 'draft' | 'generating' | 'complete';
  portraitUrl?: string;
  fullBodyUrls?: string[];
  imageSource?: string;
  background?: string;
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

// Character Card Modal Component
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

  if (imageList.length === 0) return null;

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
                <p className="text-xs text-center text-text-secondary mt-1 capitalize">
                  Level {character.level} {character.race} {character.class}
                </p>
              </div>

              {/* Image Carousel Section */}
              <div className="relative aspect-[3/4] bg-bg-dark">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={currentImage?.url}
                    alt={`${character.name || 'Character'} - ${currentImage?.label}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>

                {/* Gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#1E1B26] to-transparent pointer-events-none" />

                {/* Navigation Arrows */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={goToPrevious}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors border border-white/20"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={goToNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors border border-white/20"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Image Label */}
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs font-medium border border-white/20">
                  {currentImage?.label}
                </div>

                {/* AI Source Badge */}
                {character.imageSource === 'nanobanana' && (
                  <div className="absolute top-3 right-3 px-2 py-1 rounded bg-primary/80 text-white text-xs font-medium">
                    AI Generated
                  </div>
                )}

                {/* Dot Indicators */}
                {hasMultipleImages && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {imageList.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-primary' : 'bg-white/40 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Stats Section */}
              <div className="p-4 space-y-3">
                {character.background && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted uppercase tracking-wider">Background:</span>
                    <span className="text-sm text-primary font-medium capitalize">{character.background}</span>
                  </div>
                )}

                {character.appearance?.personalityTrait && (
                  <div className="bg-bg-dark/50 rounded-lg p-3 border border-border/50">
                    <h4 className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Personality</h4>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{character.appearance.personalityTrait}</p>
                  </div>
                )}

                {character.appearance?.ideal && (
                  <div className="bg-bg-dark/50 rounded-lg p-3 border border-border/50">
                    <h4 className="text-xs text-secondary font-semibold uppercase tracking-wider mb-1">Ideal</h4>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{character.appearance.ideal}</p>
                  </div>
                )}

                {character.appearance?.bond && (
                  <div className="bg-bg-dark/50 rounded-lg p-3 border border-border/50">
                    <h4 className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">Bond</h4>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{character.appearance.bond}</p>
                  </div>
                )}

                {character.appearance?.flaw && (
                  <div className="bg-bg-dark/50 rounded-lg p-3 border border-danger/30">
                    <h4 className="text-xs text-danger font-semibold uppercase tracking-wider mb-1">Flaw</h4>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{character.appearance.flaw}</p>
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
                          <div className="mt-3 flex gap-2">
                            {hasImages && (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowCharacterCard(char.id)}
                                className="btn-adventure text-xs px-3 py-1 flex-1"
                              >
                                View Card
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="btn-stone text-xs px-3 py-1 flex-1"
                              disabled
                            >
                              View Sheet
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
