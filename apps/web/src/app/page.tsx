'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { EnchantedCard } from '@/components/dnd/EnchantedCard';
import { OrnateCorners } from '@/components/dnd/OrnateCorners';
import { D20Icon, SwordIcon, ShieldIcon } from '@/components/dnd/DnDIcons';
import { HERO_IMAGES } from '@/data/staticImages';

// Dynamic import for particles to avoid SSR issues
const AmbientParticles = dynamic(
  () => import('@/components/dnd/AmbientParticles').then((mod) => mod.AmbientParticles),
  { ssr: false }
);

const FloatingRunes = dynamic(
  () => import('@/components/dnd/AtmosphericBackground').then((mod) => mod.FloatingRunes),
  { ssr: false }
);

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const featureCardVariants = {
  initial: { opacity: 0, y: 40, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }
  },
};

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Multi-layer background */}
      <div className="dnd-page-background" />

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-primary blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-secondary blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
            opacity: [0.06, 0.12, 0.06],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          className="absolute top-1/2 right-1/3 w-[400px] h-[400px] rounded-full bg-amber-500 blur-3xl"
        />
      </div>

      {/* Floating runes */}
      <Suspense fallback={null}>
        <FloatingRunes />
      </Suspense>

      {/* Particles */}
      <Suspense fallback={null}>
        <AmbientParticles variant="magic" />
      </Suspense>

      {/* Sparkle particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${i % 3 === 0 ? 'w-1.5 h-1.5 bg-primary' : i % 3 === 1 ? 'w-1 h-1 bg-amber-400' : 'w-0.5 h-0.5 bg-white'}`}
            style={{
              left: `${(i * 3.3) % 100}%`,
              top: `${(i * 7.7) % 100}%`,
            }}
            animate={{
              opacity: [0, 0.7, 0],
              scale: [0, 1.5, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 2 + (i % 3),
              repeat: Infinity,
              delay: (i * 0.2) % 4,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div className="dnd-vignette" />

      {/* Main content */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="text-center space-y-8 max-w-5xl"
        >
          {/* Animated D20 Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
            className="flex justify-center mb-4"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                y: [0, -5, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <D20Icon size={80} color="#F59E0B" />
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
              />
            </motion.div>
          </motion.div>

          {/* Epic Title */}
          <motion.div
            variants={fadeInUp}
            className="relative inline-block"
          >
            <motion.h1
              className="dnd-heading-epic text-5xl md:text-6xl lg:text-7xl pb-4"
              animate={{
                textShadow: [
                  '0 0 20px rgba(245, 158, 11, 0.3)',
                  '0 0 40px rgba(245, 158, 11, 0.5)',
                  '0 0 20px rgba(245, 158, 11, 0.3)',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              D&D Digital Board Game
            </motion.h1>
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed"
          >
            Experience the magic of tabletop gaming in a stunning digital world.
            <span className="block mt-3 dnd-flavor text-lg">
              &quot;Roll for initiative, brave adventurer. Your destiny awaits...&quot;
            </span>
          </motion.p>

          {/* Stats Banner */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap justify-center gap-8 py-6"
          >
            {[
              { label: 'RAW 5e Rules', value: '100%', icon: '📜' },
              { label: 'Character Options', value: '12+', icon: '⚔️' },
              { label: 'AI Portraits', value: 'Yes', icon: '🎨' },
              { label: 'Campaign Studio', value: 'Live', icon: '✨' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Call to Action Buttons */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
          >
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                className="btn-adventure text-lg px-8 py-4 flex items-center gap-3"
              >
                <SwordIcon size={24} color="currentColor" />
                Begin Your Journey
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="btn-stone text-lg px-8 py-4 flex items-center gap-3"
              >
                <ShieldIcon size={24} color="currentColor" />
                Return to the Realm
              </motion.button>
            </Link>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
          >
            <motion.div variants={featureCardVariants}>
              <EnchantedCard hover showCorners className="h-full">
                <div className="text-center p-2">
                  <motion.div
                    className="text-5xl mb-4"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    ⚔️
                  </motion.div>
                  <h3 className="dnd-heading-section text-lg mb-3">RAW 5e Rules</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Authentic D&D 5th Edition mechanics implemented exactly as written.
                    Every rule, every modifier, every saving throw.
                  </p>
                </div>
              </EnchantedCard>
            </motion.div>

            <motion.div variants={featureCardVariants}>
              <EnchantedCard variant="magical" hover showCorners className="h-full">
                <div className="text-center p-2">
                  <motion.div
                    className="text-5xl mb-4"
                    animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    🎨
                  </motion.div>
                  <h3 className="dnd-heading-section text-lg mb-3" style={{ color: '#A78BFA' }}>
                    AI Character Art
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Generate stunning character portraits and full-body artwork
                    powered by advanced AI image generation.
                  </p>
                </div>
              </EnchantedCard>
            </motion.div>

            <motion.div variants={featureCardVariants}>
              <EnchantedCard variant="legendary" hover showCorners className="h-full">
                <div className="text-center p-2">
                  <motion.div
                    className="text-5xl mb-4"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🎭
                  </motion.div>
                  <h3 className="dnd-heading-section text-lg mb-3">Full Character Builder</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Create heroes with all 9 races, 12 classes, and 8 backgrounds.
                    Complete with personality, backstory, and trading cards.
                  </p>
                </div>
              </EnchantedCard>
            </motion.div>
          </motion.div>

          {/* Additional Features Row */}
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6"
          >
            <motion.div variants={featureCardVariants}>
              <EnchantedCard hover className="h-full">
                <div className="flex items-start gap-4 p-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-4xl"
                  >
                    ✨
                  </motion.div>
                  <div>
                    <h3 className="dnd-heading-section text-base mb-2">Campaign Studio</h3>
                    <p className="text-text-secondary text-sm">
                      AI-assisted campaign creation with live preview,
                      auto-save, and export functionality.
                    </p>
                  </div>
                </div>
              </EnchantedCard>
            </motion.div>

            <motion.div variants={featureCardVariants}>
              <EnchantedCard hover className="h-full">
                <div className="flex items-start gap-4 p-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="text-4xl"
                  >
                    🎲
                  </motion.div>
                  <div>
                    <h3 className="dnd-heading-section text-base mb-2">Dice Rolling</h3>
                    <p className="text-text-secondary text-sm">
                      Animated dice with physics and advantage/disadvantage.
                    </p>
                  </div>
                </div>
              </EnchantedCard>
            </motion.div>

            <motion.div variants={featureCardVariants}>
              <EnchantedCard hover className="h-full">
                <div className="flex items-start gap-4 p-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-4xl"
                  >
                    🎙️
                  </motion.div>
                  <div>
                    <h3 className="dnd-heading-section text-base mb-2">Voice Narration</h3>
                    <p className="text-text-secondary text-sm">
                      AI-powered voice narration with multiple voice profiles.
                    </p>
                  </div>
                </div>
              </EnchantedCard>
            </motion.div>

            <motion.div variants={featureCardVariants}>
              <EnchantedCard hover className="h-full">
                <div className="flex items-start gap-4 p-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-4xl"
                  >
                    📜
                  </motion.div>
                  <div>
                    <h3 className="dnd-heading-section text-base mb-2">Trading Cards</h3>
                    <p className="text-text-secondary text-sm">
                      Print collectible character cards with AI artwork.
                    </p>
                  </div>
                </div>
              </EnchantedCard>
            </motion.div>
          </motion.div>

          {/* AI-Generated Hero Showcase */}
          <motion.div
            variants={fadeInUp}
            className="mt-16"
          >
            <h2 className="dnd-heading-section text-2xl mb-8 text-center">
              Enter a World of Adventure
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { src: HERO_IMAGES.epic_battle, title: 'Epic Battles', desc: 'Engage in tactical combat with stunning visuals' },
                { src: HERO_IMAGES.tavern_gathering, title: 'Gather Your Party', desc: 'Assemble adventurers for your quest' },
                { src: HERO_IMAGES.dungeon_entrance, title: 'Explore Dungeons', desc: 'Delve into mysterious depths' },
              ].map((hero, idx) => (
                <motion.div
                  key={hero.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + idx * 0.2 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="group"
                >
                  <EnchantedCard hover showCorners className="overflow-hidden">
                    <div className="relative aspect-video overflow-hidden rounded-lg">
                      <Image
                        src={hero.src}
                        alt={hero.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <motion.div
                        className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="dnd-heading-section text-lg mb-1">{hero.title}</h3>
                        <p className="text-text-secondary text-sm">{hero.desc}</p>
                      </div>
                    </div>
                  </EnchantedCard>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Status Badge */}
          <motion.div
            variants={fadeInUp}
            className="mt-12 relative"
          >
            <div className="dnd-divider" />
            <motion.div
              className="enchanted-card inline-block px-8 py-4"
              whileHover={{ scale: 1.02 }}
            >
              <OrnateCorners variant="gold" />
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <D20Icon size={20} color="#F59E0B" />
                </motion.div>
                <p className="text-sm text-primary font-medium">
                  All Phases Complete — Full D&D 5e Digital Experience
                </p>
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-success"
                >
                  ✓
                </motion.span>
              </div>
            </motion.div>
          </motion.div>

          {/* Available Now Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-text-muted text-sm">
              Now Available: Character Builder • AI Portraits • Campaign Studio • Video Cutscenes • Voice Narration • VFX Effects • Dynamic Music • Content Editors • Multiplayer
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
