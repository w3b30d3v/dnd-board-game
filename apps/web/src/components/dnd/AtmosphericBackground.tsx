'use client';

import { motion } from 'framer-motion';
import { AmbientParticles } from './AmbientParticles';

type Theme = 'dungeon' | 'forest' | 'castle' | 'tavern' | 'arcane' | 'battlefield' | 'default';

interface AtmosphericBackgroundProps {
  theme?: Theme;
  intensity?: 'subtle' | 'medium' | 'dramatic';
  children: React.ReactNode;
  className?: string;
  showParticles?: boolean;
}

const themeConfig: Record<Theme, {
  gradient: string;
  particle: 'dust' | 'magic' | 'embers';
  overlayColor: string;
  fogColor: string;
}> = {
  dungeon: {
    gradient: 'from-stone-950 via-zinc-900 to-stone-950',
    particle: 'dust',
    overlayColor: 'rgba(139, 69, 19, 0.05)',
    fogColor: 'rgba(100, 100, 100, 0.1)',
  },
  forest: {
    gradient: 'from-emerald-950 via-green-900/80 to-emerald-950',
    particle: 'dust',
    overlayColor: 'rgba(34, 139, 34, 0.08)',
    fogColor: 'rgba(144, 238, 144, 0.05)',
  },
  castle: {
    gradient: 'from-slate-950 via-gray-900 to-slate-950',
    particle: 'dust',
    overlayColor: 'rgba(192, 192, 192, 0.05)',
    fogColor: 'rgba(169, 169, 169, 0.08)',
  },
  tavern: {
    gradient: 'from-amber-950 via-orange-900/70 to-amber-950',
    particle: 'embers',
    overlayColor: 'rgba(255, 165, 0, 0.08)',
    fogColor: 'rgba(255, 200, 100, 0.05)',
  },
  arcane: {
    gradient: 'from-purple-950 via-violet-900/80 to-purple-950',
    particle: 'magic',
    overlayColor: 'rgba(147, 112, 219, 0.1)',
    fogColor: 'rgba(138, 43, 226, 0.08)',
  },
  battlefield: {
    gradient: 'from-red-950 via-rose-900/70 to-red-950',
    particle: 'embers',
    overlayColor: 'rgba(178, 34, 34, 0.08)',
    fogColor: 'rgba(139, 0, 0, 0.05)',
  },
  default: {
    gradient: 'from-[#0F0D13] via-[#1E1B26] to-[#0F0D13]',
    particle: 'dust',
    overlayColor: 'rgba(245, 158, 11, 0.03)',
    fogColor: 'rgba(139, 92, 246, 0.05)',
  },
};

export function AtmosphericBackground({
  theme = 'default',
  intensity = 'medium',
  children,
  className = '',
  showParticles = true,
}: AtmosphericBackgroundProps) {
  const config = themeConfig[theme];

  const intensityMultiplier = {
    subtle: 0.5,
    medium: 1,
    dramatic: 1.5,
  }[intensity];

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Base gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${config.gradient}`} />

      {/* Animated fog/mist layer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: config.fogColor }}
        animate={{
          opacity: [0.3 * intensityMultiplier, 0.6 * intensityMultiplier, 0.3 * intensityMultiplier],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Radial glow spots */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${config.overlayColor} 0%, transparent 70%)`,
          opacity: 0.6 * intensityMultiplier,
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${config.fogColor} 0%, transparent 70%)`,
          opacity: 0.5 * intensityMultiplier,
        }}
      />

      {/* Moving light beams (god rays) */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: 0.1 * intensityMultiplier }}
      >
        <motion.div
          className="absolute top-0 left-1/4 w-32 h-full bg-gradient-to-b from-white/20 via-white/5 to-transparent"
          style={{ transform: 'skewX(-20deg)' }}
          animate={{ x: [-100, 200], opacity: [0, 0.3, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute top-0 right-1/3 w-24 h-full bg-gradient-to-b from-white/15 via-white/5 to-transparent"
          style={{ transform: 'skewX(-15deg)' }}
          animate={{ x: [100, -150], opacity: [0, 0.2, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear', delay: 5 }}
        />
      </motion.div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,${0.4 * intensityMultiplier}) 100%)`,
        }}
      />

      {/* Noise texture overlay for paper/parchment feel */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient particles */}
      {showParticles && (
        <AmbientParticles
          variant={config.particle}
          density={intensity === 'dramatic' ? 'high' : intensity === 'subtle' ? 'low' : 'medium'}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Simpler overlay component for cards/sections
interface MagicalOverlayProps {
  children: React.ReactNode;
  color?: 'gold' | 'purple' | 'blue' | 'red' | 'green';
  intensity?: 'subtle' | 'medium' | 'strong';
  className?: string;
}

const overlayColors = {
  gold: 'rgba(245, 158, 11, 0.1)',
  purple: 'rgba(139, 92, 246, 0.1)',
  blue: 'rgba(59, 130, 246, 0.1)',
  red: 'rgba(239, 68, 68, 0.1)',
  green: 'rgba(34, 197, 94, 0.1)',
};

export function MagicalOverlay({
  children,
  color = 'gold',
  intensity = 'subtle',
  className = '',
}: MagicalOverlayProps) {
  const intensityMultiplier = {
    subtle: 0.5,
    medium: 1,
    strong: 1.5,
  }[intensity];

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${overlayColors[color]} 0%, transparent 70%)`,
          opacity: intensityMultiplier,
        }}
        animate={{
          opacity: [0.3 * intensityMultiplier, 0.6 * intensityMultiplier, 0.3 * intensityMultiplier],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {children}
    </div>
  );
}

// Floating runes background decoration
export function FloatingRunes({ className = '' }: { className?: string }) {
  const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ'];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {runes.map((rune, i) => (
        <motion.span
          key={i}
          className="absolute text-primary/10 text-4xl font-bold"
          style={{
            left: `${10 + (i * 7) % 80}%`,
            top: `${5 + (i * 11) % 85}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.05, 0.15, 0.05],
            rotate: [-5, 5, -5],
          }}
          transition={{
            duration: 8 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        >
          {rune}
        </motion.span>
      ))}
    </div>
  );
}
