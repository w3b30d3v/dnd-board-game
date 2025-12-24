'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

export type CelebrationType =
  | 'critical_hit'
  | 'victory'
  | 'defeat'
  | 'level_up'
  | 'natural_20'
  | 'natural_1'
  | 'killing_blow'
  | 'saving_throw_success'
  | 'death_save_success';

interface CelebrationSequenceProps {
  type: CelebrationType;
  data?: {
    damage?: number;
    characterName?: string;
    newLevel?: number;
    targetName?: string;
    roll?: number;
  };
  onComplete?: () => void;
  autoPlay?: boolean;
}

interface ParticleConfig {
  count: number;
  colors: string[];
  size: [number, number];
  duration: number;
  spread: number;
}

// ============================================================================
// PARTICLE GENERATOR
// ============================================================================

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  velocity: number;
  rotation: number;
  delay: number;
}

function generateParticles(config: ParticleConfig, origin: { x: number; y: number }): Particle[] {
  return Array.from({ length: config.count }, (_, i) => ({
    id: i,
    x: origin.x,
    y: origin.y,
    color: config.colors[Math.floor(Math.random() * config.colors.length)],
    size: config.size[0] + Math.random() * (config.size[1] - config.size[0]),
    angle: (Math.random() - 0.5) * config.spread * (Math.PI / 180),
    velocity: 200 + Math.random() * 300,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.2,
  }));
}

const ParticleExplosion: React.FC<{
  particles: Particle[];
  duration: number;
}> = ({ particles, duration }) => {
  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute pointer-events-none"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
          initial={{
            x: 0,
            y: 0,
            scale: 1,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            x: Math.sin(particle.angle) * particle.velocity,
            y: Math.cos(particle.angle) * particle.velocity + 100, // gravity
            scale: 0,
            rotate: particle.rotation,
            opacity: 0,
          }}
          transition={{
            duration: duration / 1000,
            delay: particle.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </>
  );
};

// ============================================================================
// CRITICAL HIT CELEBRATION
// ============================================================================

export const CriticalHitCelebration: React.FC<{
  damage?: number;
  onComplete?: () => void;
}> = ({ damage, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showText, setShowText] = useState(false);
  const [showDamage, setShowDamage] = useState(false);

  useEffect(() => {
    // Generate particles from center
    const config: ParticleConfig = {
      count: 50,
      colors: ['#F59E0B', '#EF4444', '#FBBF24', '#FCD34D', '#FF6B6B'],
      size: [4, 12],
      duration: 1500,
      spread: 360,
    };
    setParticles(generateParticles(config, { x: window.innerWidth / 2, y: window.innerHeight / 2 }));

    // Show text sequence
    setTimeout(() => setShowText(true), 100);
    setTimeout(() => setShowDamage(true), 500);
    setTimeout(() => onComplete?.(), 2500);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Screen flash */}
      <motion.div
        className="absolute inset-0 bg-red-500"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Radial burst lines */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-2 bg-gradient-to-r from-yellow-400 to-transparent"
            style={{
              width: '50vw',
              transformOrigin: 'left center',
              transform: `rotate(${i * 30}deg)`,
            }}
          />
        ))}
      </motion.div>

      {/* Particles */}
      <ParticleExplosion particles={particles} duration={1500} />

      {/* Critical text */}
      <AnimatePresence>
        {showText && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 100 }}
          >
            <motion.h1
              className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600"
              style={{
                fontFamily: 'Cinzel, serif',
                textShadow: '0 0 30px rgba(245, 158, 11, 0.8), 0 0 60px rgba(239, 68, 68, 0.5)',
                WebkitTextStroke: '2px rgba(255, 255, 255, 0.3)',
              }}
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: 2,
              }}
            >
              CRITICAL HIT!
            </motion.h1>

            {showDamage && damage && (
              <motion.div
                className="mt-4 text-4xl md:text-6xl font-bold text-red-500"
                initial={{ y: -50, opacity: 0, scale: 2 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 8 }}
                style={{
                  textShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
                }}
              >
                {damage} DAMAGE
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// VICTORY SEQUENCE
// ============================================================================

export const VictorySequence: React.FC<{
  characterName?: string;
  onComplete?: () => void;
}> = ({ characterName, onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Phase 0: Initial burst
    const config: ParticleConfig = {
      count: 100,
      colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#22C55E', '#4ADE80'],
      size: [6, 16],
      duration: 2000,
      spread: 360,
    };
    setParticles(generateParticles(config, { x: window.innerWidth / 2, y: window.innerHeight / 2 }));

    // Progress through phases
    setTimeout(() => setPhase(1), 300);
    setTimeout(() => setPhase(2), 1000);
    setTimeout(() => setPhase(3), 2500);
    setTimeout(() => onComplete?.(), 4000);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Background overlay */}
      <motion.div
        className="absolute inset-0"
        initial={{ background: 'transparent' }}
        animate={{
          background: phase >= 1
            ? 'radial-gradient(circle at center, rgba(34, 197, 94, 0.2) 0%, transparent 70%)'
            : 'transparent',
        }}
        transition={{ duration: 1 }}
      />

      {/* Particles */}
      <ParticleExplosion particles={particles} duration={2000} />

      {/* Confetti rain */}
      {phase >= 1 && (
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#F59E0B', '#22C55E', '#8B5CF6', '#EC4899', '#3B82F6'][i % 5],
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
              initial={{ top: -20, rotate: 0 }}
              animate={{
                top: '120%',
                rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                x: Math.sin(i) * 100,
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 1,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      {/* Victory text */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.h1
              className="text-6xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-amber-600"
              style={{
                fontFamily: 'Cinzel, serif',
                textShadow: '0 0 40px rgba(245, 158, 11, 0.8)',
              }}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 8, stiffness: 80 }}
            >
              VICTORY!
            </motion.h1>

            {phase >= 2 && characterName && (
              <motion.p
                className="mt-6 text-2xl md:text-4xl text-green-400"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {characterName} is triumphant!
              </motion.p>
            )}

            {/* Decorative swords */}
            <motion.div
              className="absolute flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              <span className="text-6xl" style={{ transform: 'rotate(-45deg)' }}>⚔️</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Light rays */}
      {phase >= 2 && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 bg-gradient-to-r from-yellow-400 via-yellow-400 to-transparent"
              style={{
                width: '100vw',
                transformOrigin: 'left center',
                transform: `rotate(${i * 45}deg)`,
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

// ============================================================================
// DEFEAT SEQUENCE
// ============================================================================

export const DefeatSequence: React.FC<{
  onComplete?: () => void;
}> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setTimeout(() => setPhase(1), 500);
    setTimeout(() => setPhase(2), 1500);
    setTimeout(() => onComplete?.(), 4000);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Darkening overlay */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 ? 0.7 : 0 }}
        transition={{ duration: 2 }}
      />

      {/* Blood vignette */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(127, 29, 29, 0.5) 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }}
        transition={{ duration: 1 }}
      />

      {/* Defeat text */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.h1
              className="text-6xl md:text-8xl font-bold text-red-900"
              style={{
                fontFamily: 'Cinzel, serif',
                textShadow: '0 0 30px rgba(127, 29, 29, 0.8)',
              }}
              initial={{ scale: 1.5, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            >
              DEFEATED
            </motion.h1>

            {phase >= 2 && (
              <motion.p
                className="mt-6 text-xl md:text-2xl text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                The darkness claims another soul...
              </motion.p>
            )}

            {/* Skull icon */}
            <motion.div
              className="mt-8 text-6xl grayscale opacity-50"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 0.5 }}
              transition={{ delay: 1 }}
            >
              💀
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Falling ash particles */}
      {phase >= 1 && (
        <div className="absolute inset-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gray-500 rounded-full"
              style={{ left: `${Math.random() * 100}%` }}
              initial={{ top: -10, opacity: 0.5 }}
              animate={{
                top: '110%',
                opacity: 0,
                x: Math.sin(i) * 50,
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                delay: Math.random() * 2,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// LEVEL UP SEQUENCE
// ============================================================================

export const LevelUpSequence: React.FC<{
  characterName?: string;
  newLevel?: number;
  onComplete?: () => void;
}> = ({ characterName, newLevel, onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate golden particles
    const config: ParticleConfig = {
      count: 80,
      colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#A78BFA', '#C4B5FD'],
      size: [4, 10],
      duration: 2500,
      spread: 360,
    };
    setParticles(generateParticles(config, { x: window.innerWidth / 2, y: window.innerHeight / 2 }));

    setTimeout(() => setPhase(1), 200);
    setTimeout(() => setPhase(2), 800);
    setTimeout(() => setPhase(3), 1800);
    setTimeout(() => onComplete?.(), 4000);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Light pillar */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-64 h-full"
        style={{
          background: 'linear-gradient(to top, rgba(139, 92, 246, 0.3), rgba(245, 158, 11, 0.5), transparent)',
        }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, scaleY: phase >= 1 ? 1 : 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {/* Particles */}
      <ParticleExplosion particles={particles} duration={2500} />

      {/* Rising sparkles */}
      {phase >= 1 && (
        <div className="absolute inset-0 flex justify-center">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: i % 2 === 0 ? '#F59E0B' : '#8B5CF6',
                left: `calc(50% + ${(Math.random() - 0.5) * 200}px)`,
                boxShadow: `0 0 10px ${i % 2 === 0 ? '#F59E0B' : '#8B5CF6'}`,
              }}
              initial={{ bottom: '30%', opacity: 1 }}
              animate={{ bottom: '100%', opacity: 0 }}
              transition={{
                duration: 2,
                delay: Math.random() * 1,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Level up text */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-yellow-400 to-purple-400"
              style={{
                fontFamily: 'Cinzel, serif',
                textShadow: '0 0 40px rgba(139, 92, 246, 0.8)',
              }}
              initial={{ y: 50, scale: 0.5, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              LEVEL UP!
            </motion.h1>

            {phase >= 2 && newLevel && (
              <motion.div
                className="mt-6 relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 8, delay: 0.2 }}
              >
                <motion.div
                  className="text-8xl md:text-9xl font-bold text-yellow-400"
                  style={{
                    textShadow: '0 0 30px rgba(245, 158, 11, 0.8)',
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: 2,
                  }}
                >
                  {newLevel}
                </motion.div>

                {/* Orbiting stars */}
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-4 h-4 text-yellow-300"
                    style={{ top: '50%', left: '50%' }}
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: i * 0.3,
                    }}
                  >
                    <span
                      className="absolute"
                      style={{
                        transform: `translateX(${60 + i * 20}px) translateY(-50%)`,
                      }}
                    >
                      ✨
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {phase >= 3 && characterName && (
              <motion.p
                className="mt-6 text-xl md:text-2xl text-purple-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {characterName} grows stronger!
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Magical ring */}
      {phase >= 2 && (
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-4 border-purple-500"
          style={{
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.5), inset 0 0 30px rgba(139, 92, 246, 0.3)',
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      )}
    </div>
  );
};

// ============================================================================
// MAIN CELEBRATION SEQUENCE COMPONENT
// ============================================================================

export const CelebrationSequence: React.FC<CelebrationSequenceProps> = ({
  type,
  data,
  onComplete,
  autoPlay = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  const handleComplete = useCallback(() => {
    setIsPlaying(false);
    onComplete?.();
  }, [onComplete]);

  if (!isPlaying) return null;

  switch (type) {
    case 'critical_hit':
    case 'natural_20':
    case 'killing_blow':
      return <CriticalHitCelebration damage={data?.damage} onComplete={handleComplete} />;

    case 'victory':
      return <VictorySequence characterName={data?.characterName} onComplete={handleComplete} />;

    case 'defeat':
    case 'natural_1':
      return <DefeatSequence onComplete={handleComplete} />;

    case 'level_up':
      return (
        <LevelUpSequence
          characterName={data?.characterName}
          newLevel={data?.newLevel}
          onComplete={handleComplete}
        />
      );

    case 'saving_throw_success':
    case 'death_save_success':
      // Simple success flash for saving throws
      return (
        <motion.div
          className="fixed inset-0 pointer-events-none z-50"
          initial={{ backgroundColor: 'rgba(34, 197, 94, 0.4)' }}
          animate={{ backgroundColor: 'transparent' }}
          transition={{ duration: 0.5 }}
          onAnimationComplete={handleComplete}
        >
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-6xl">✓</span>
          </motion.div>
        </motion.div>
      );

    default:
      return null;
  }
};

// ============================================================================
// CELEBRATION QUEUE MANAGER
// ============================================================================

interface QueuedCelebration {
  id: string;
  type: CelebrationType;
  data?: CelebrationSequenceProps['data'];
}

interface CelebrationManagerProps {
  children: React.ReactNode;
}

interface CelebrationContextType {
  playCelebration: (type: CelebrationType, data?: CelebrationSequenceProps['data']) => void;
}

const CelebrationContext = React.createContext<CelebrationContextType | null>(null);

export const CelebrationManager: React.FC<CelebrationManagerProps> = ({ children }) => {
  const [queue, setQueue] = useState<QueuedCelebration[]>([]);
  const [current, setCurrent] = useState<QueuedCelebration | null>(null);

  const playCelebration = useCallback((type: CelebrationType, data?: CelebrationSequenceProps['data']) => {
    const celebration: QueuedCelebration = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      data,
    };
    setQueue((prev) => [...prev, celebration]);
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [current, queue]);

  const handleComplete = useCallback(() => {
    setCurrent(null);
  }, []);

  return (
    <CelebrationContext.Provider value={{ playCelebration }}>
      {children}
      <AnimatePresence>
        {current && (
          <CelebrationSequence
            key={current.id}
            type={current.type}
            data={current.data}
            onComplete={handleComplete}
          />
        )}
      </AnimatePresence>
    </CelebrationContext.Provider>
  );
};

export const useCelebration = () => {
  const context = React.useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationManager');
  }
  return context;
};

export default CelebrationSequence;
