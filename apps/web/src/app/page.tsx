'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HERO_IMAGES } from '@/data/staticImages';

// Dynamic import for particles to avoid SSR issues
const AmbientParticles = dynamic(
  () => import('@/components/dnd/AmbientParticles').then((mod) => mod.AmbientParticles),
  { ssr: false }
);

// Hero slides data - D&D Beyond style carousel
const heroSlides = [
  {
    id: 1,
    title: 'Your Legend Awaits',
    subtitle: 'Create heroes, forge destinies, conquer dungeons',
    cta: 'Start Your Adventure',
    ctaLink: '/register',
    secondaryCta: 'Sign In',
    secondaryLink: '/login',
    bgGradient: 'from-amber-900/80 via-bg-dark/90 to-bg-dark',
    accentColor: 'primary',
  },
  {
    id: 2,
    title: 'AI-Powered Campaigns',
    subtitle: 'Let AI craft your perfect adventure with Campaign Studio',
    cta: 'Explore Campaign Studio',
    ctaLink: '/register',
    secondaryCta: 'Learn More',
    secondaryLink: '#features',
    bgGradient: 'from-purple-900/80 via-bg-dark/90 to-bg-dark',
    accentColor: 'secondary',
  },
  {
    id: 3,
    title: 'Build Your Hero',
    subtitle: 'Full D&D 5e character creation with AI-generated portraits',
    cta: 'Create Character',
    ctaLink: '/register',
    secondaryCta: 'View Races & Classes',
    secondaryLink: '#classes',
    bgGradient: 'from-red-900/80 via-bg-dark/90 to-bg-dark',
    accentColor: 'primary',
  },
];

// Feature sections
const features = [
  {
    title: 'Character Builder',
    description: 'Create stunning heroes with 9 races, 12 classes, and AI-generated portraits',
    image: HERO_IMAGES.epic_battle,
    link: '/characters/create',
    cta: 'Build a Character',
    badge: 'PLAY NOW',
  },
  {
    title: 'Campaign Studio',
    description: 'AI-powered campaign creation with maps, NPCs, encounters, and quests',
    image: HERO_IMAGES.dungeon_entrance,
    link: '/dm/campaign-studio',
    cta: 'Create Campaign',
    badge: 'AI POWERED',
  },
  {
    title: 'Virtual Tabletop',
    description: 'Real-time multiplayer with fog of war, tokens, and combat tracking',
    image: HERO_IMAGES.tavern_gathering,
    link: '/register',
    cta: 'Start Playing',
    badge: 'MULTIPLAYER',
  },
];

// Class showcase
const classShowcase = [
  { name: 'Fighter', icon: '⚔️', color: 'from-red-500 to-orange-600' },
  { name: 'Wizard', icon: '🔮', color: 'from-blue-500 to-purple-600' },
  { name: 'Rogue', icon: '🗡️', color: 'from-gray-500 to-gray-700' },
  { name: 'Cleric', icon: '✨', color: 'from-yellow-400 to-amber-600' },
  { name: 'Ranger', icon: '🏹', color: 'from-green-500 to-emerald-700' },
  { name: 'Paladin', icon: '🛡️', color: 'from-amber-400 to-yellow-600' },
  { name: 'Barbarian', icon: '💪', color: 'from-red-600 to-red-800' },
  { name: 'Sorcerer', icon: '⚡', color: 'from-purple-500 to-pink-600' },
  { name: 'Warlock', icon: '👁️', color: 'from-purple-700 to-indigo-900' },
  { name: 'Bard', icon: '🎵', color: 'from-pink-400 to-rose-600' },
  { name: 'Druid', icon: '🌿', color: 'from-green-600 to-teal-700' },
  { name: 'Monk', icon: '👊', color: 'from-amber-600 to-orange-700' },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const slide = heroSlides[currentSlide];

  return (
    <div className="min-h-screen bg-bg-dark">
      {/* ============ HERO SECTION - Full Screen ============ */}
      <section className="relative h-screen min-h-[700px] overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className={`absolute inset-0 bg-gradient-to-b ${slide.bgGradient} z-10`} />

          {/* Animated background image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <Image
                src={HERO_IMAGES.epic_battle}
                alt="D&D Adventure"
                fill
                className="object-cover"
                priority
              />
            </motion.div>
          </AnimatePresence>

          {/* Overlay gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/60 to-transparent z-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-dark/80 via-transparent to-bg-dark/80 z-20" />
        </div>

        {/* Particles */}
        <Suspense fallback={null}>
          <div className="absolute inset-0 z-30 pointer-events-none">
            <AmbientParticles variant="magic" />
          </div>
        </Suspense>

        {/* Navigation */}
        <nav className="relative z-40 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-4xl"
              >
                🎲
              </motion.span>
              <span className="text-2xl font-cinzel font-bold text-primary">
                D&D Digital
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 text-text-primary hover:text-primary transition-colors font-medium"
                >
                  Sign In
                </motion.button>
              </Link>
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-primary text-bg-dark font-bold rounded-lg"
                >
                  Play Free
                </motion.button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-30 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl"
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6"
                >
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary uppercase tracking-wider">
                    Now Available
                  </span>
                </motion.div>

                {/* Title */}
                <h1 className="text-5xl md:text-7xl font-cinzel font-bold text-white mb-6 leading-tight">
                  {slide.title}
                </h1>

                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-text-secondary mb-10 max-w-2xl">
                  {slide.subtitle}
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap gap-4">
                  <Link href={slide.ctaLink}>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(245, 158, 11, 0.6)' }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-gradient-to-r from-primary to-amber-500 text-bg-dark font-bold text-lg rounded-lg flex items-center gap-3"
                    >
                      {slide.cta}
                      <span className="text-xl">→</span>
                    </motion.button>
                  </Link>
                  <Link href={slide.secondaryLink}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-medium text-lg rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                    >
                      {slide.secondaryCta}
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel indicators */}
            <div className="absolute bottom-12 left-6 flex items-center gap-3">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentSlide(idx);
                    setIsAutoPlaying(false);
                  }}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentSlide ? 'w-12 bg-primary' : 'w-6 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 text-white/50"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* ============ FEATURES SECTION ============ */}
      <section id="features" className="relative py-24 bg-bg-dark">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-cinzel font-bold text-white mb-4">
              Play Your Way
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Everything you need for epic D&D adventures, all in one place
            </p>
          </motion.div>

          {/* Feature cards - Large visual blocks like D&D Beyond */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group"
              >
                <Link href={feature.link}>
                  <div className="relative h-[400px] rounded-2xl overflow-hidden cursor-pointer">
                    {/* Background image */}
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/50 to-transparent" />

                    {/* Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-primary text-bg-dark text-xs font-bold rounded-full uppercase">
                        {feature.badge}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-2xl font-cinzel font-bold text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-text-secondary mb-4">
                        {feature.description}
                      </p>
                      <motion.div
                        className="flex items-center gap-2 text-primary font-medium"
                        whileHover={{ x: 5 }}
                      >
                        {feature.cta}
                        <span>→</span>
                      </motion.div>
                    </div>

                    {/* Hover glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="absolute inset-0 border-2 border-primary/50 rounded-2xl" />
                      <div className="absolute inset-0 bg-primary/5" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CLASS SHOWCASE ============ */}
      <section id="classes" className="relative py-24 bg-gradient-to-b from-bg-dark to-bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-cinzel font-bold text-white mb-4">
              Choose Your Class
            </h2>
            <p className="text-xl text-text-secondary">
              12 iconic D&D classes, each with unique abilities and playstyles
            </p>
          </motion.div>

          {/* Class grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {classShowcase.map((cls, idx) => (
              <motion.div
                key={cls.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.1, y: -5 }}
                className="relative group cursor-pointer"
              >
                <div className={`aspect-square rounded-xl bg-gradient-to-br ${cls.color} p-1`}>
                  <div className="w-full h-full rounded-lg bg-bg-dark/80 flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl">{cls.icon}</span>
                    <span className="text-sm font-medium text-white">{cls.name}</span>
                  </div>
                </div>
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${cls.color} opacity-0 group-hover:opacity-30 blur-xl transition-opacity -z-10`} />
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-primary text-bg-dark font-bold text-lg rounded-lg"
              >
                Start Building Your Hero
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============ STATS BANNER ============ */}
      <section className="relative py-16 bg-bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '100%', label: 'RAW 5e Rules', icon: '📜' },
              { value: '12', label: 'Player Classes', icon: '⚔️' },
              { value: '9', label: 'Playable Races', icon: '🧝' },
              { value: 'AI', label: 'Generated Art', icon: '🎨' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-4xl md:text-5xl font-cinzel font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-text-secondary">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative py-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGES.dungeon_entrance}
            alt="Adventure awaits"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/80 to-bg-dark" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-cinzel font-bold text-white mb-6">
              Ready to Roll?
            </h2>
            <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
              Join thousands of adventurers. Create your character, build campaigns,
              and experience D&D like never before.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(245, 158, 11, 0.6)' }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 bg-gradient-to-r from-primary to-amber-500 text-bg-dark font-bold text-xl rounded-lg"
                >
                  Play Free Now
                </motion.button>
              </Link>
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 bg-white/10 text-white font-medium text-xl rounded-lg border border-white/20"
                >
                  Sign In
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎲</span>
              <span className="text-xl font-cinzel font-bold text-primary">D&D Digital</span>
            </div>
            <p className="text-text-muted text-sm">
              Built with ❤️ for tabletop gamers. Not affiliated with Wizards of the Coast.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-text-secondary hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="text-text-secondary hover:text-primary transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
