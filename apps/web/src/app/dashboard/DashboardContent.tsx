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

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useRequireAuth('/login');
  const { logout, token } = useAuthStore(state => ({ logout: state.logout, token: state.token }));
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [showCreatedMessage, setShowCreatedMessage] = useState(false);

  // Check if we just created a character
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
        const response = await fetch('http://localhost:4000/characters', {
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
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                >
                  ✨
                </motion.div>
                Character created successfully! Your hero is ready for adventure.
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
                  {characters.map((char, index) => (
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
                            {/* Class Icon */}
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                              <ClassIcon characterClass={char.class} size={24} color="#F59E0B" />
                            </div>
                            <div>
                              <h3 className="font-display font-semibold text-lg text-text-primary">
                                {char.name}
                              </h3>
                              <p className="text-sm text-text-secondary">
                                Level {char.level} {char.race} {char.class}
                              </p>
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
                  ))}
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
    </div>
  );
}
