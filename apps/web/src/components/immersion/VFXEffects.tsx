'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Effect types
export type EffectType =
  | 'fireball' | 'fire_bolt' | 'lightning' | 'ice_ray' | 'necrotic' | 'radiant'
  | 'slash' | 'pierce' | 'bludgeon'
  | 'critical_hit' | 'healing' | 'shield' | 'poison'
  | 'level_up' | 'death' | 'victory';

export interface VFXConfig {
  type: EffectType;
  position?: { x: number; y: number };
  target?: { x: number; y: number };
  value?: number | string;
  duration?: number;
  onComplete?: () => void;
}

interface ActiveEffect extends VFXConfig {
  id: string;
  startTime: number;
}

// Damage number component
function DamageNumber({
  value,
  position,
  type,
  onComplete,
}: {
  value: number | string;
  position: { x: number; y: number };
  type: 'damage' | 'heal' | 'critical';
  onComplete?: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: type === 'critical' ? 0.5 : 0.8 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: -60,
        scale: type === 'critical' ? [0.5, 1.5, 1.2] : 1,
      }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="absolute pointer-events-none z-50"
      style={{ left: position.x, top: position.y }}
    >
      <span
        className={`font-bold text-2xl ${
          type === 'critical'
            ? 'text-4xl text-yellow-400 drop-shadow-[0_0_10px_rgba(255,200,0,0.8)]'
            : type === 'heal'
            ? 'text-green-400 drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]'
            : 'text-red-400 drop-shadow-[0_0_5px_rgba(255,0,0,0.5)]'
        }`}
      >
        {type === 'heal' ? '+' : '-'}{value}
      </span>
    </motion.div>
  );
}

// Particle burst component
function ParticleBurst({
  position,
  color,
  count = 20,
  spread = 100,
  duration = 1000,
  onComplete,
}: {
  position: { x: number; y: number };
  color: string;
  count?: number;
  spread?: number;
  duration?: number;
  onComplete?: () => void;
}) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (i / count) * Math.PI * 2,
    distance: spread * (0.5 + Math.random() * 0.5),
    size: 4 + Math.random() * 6,
    delay: Math.random() * 0.1,
  }));

  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: position.x, top: position.y }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: 0,
            scale: 0.5,
          }}
          transition={{
            duration: duration / 1000,
            delay: p.delay,
            ease: 'easeOut',
          }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
          }}
        />
      ))}
    </div>
  );
}

// Screen flash component
function ScreenFlash({
  color,
  duration = 300,
  onComplete,
}: {
  color: string;
  duration?: number;
  onComplete?: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 0 }}
      transition={{ duration: duration / 1000 }}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ backgroundColor: color }}
    />
  );
}

// Screen shake hook
function useScreenShake() {
  const [shake, setShake] = useState({ x: 0, y: 0 });

  const triggerShake = useCallback((intensity: number = 10, duration: number = 500) => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        const decay = 1 - elapsed / duration;
        setShake({
          x: (Math.random() - 0.5) * intensity * decay,
          y: (Math.random() - 0.5) * intensity * decay,
        });
        requestAnimationFrame(animate);
      } else {
        setShake({ x: 0, y: 0 });
      }
    };
    animate();
  }, []);

  return { shake, triggerShake };
}

// Fireball effect
function FireballEffect({
  position,
  onComplete,
}: {
  position: { x: number; y: number };
  onComplete?: () => void;
}) {
  const [phase, setPhase] = useState<'flash' | 'explosion' | 'smoke'>('flash');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('explosion'), 100),
      setTimeout(() => setPhase('smoke'), 600),
      setTimeout(() => onComplete?.(), 1500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="absolute pointer-events-none" style={{ left: position.x, top: position.y }}>
      {/* Initial flash */}
      {phase === 'flash' && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full"
          style={{
            background: 'radial-gradient(circle, #fff 0%, #ff6600 50%, transparent 70%)',
          }}
        />
      )}

      {/* Explosion particles */}
      {phase === 'explosion' && (
        <ParticleBurst
          position={{ x: 0, y: 0 }}
          color="#ff4500"
          count={50}
          spread={80}
          duration={800}
        />
      )}

      {/* Smoke */}
      {phase === 'smoke' && (
        <motion.div
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 2, y: -50 }}
          transition={{ duration: 1 }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gray-600/50 blur-xl"
        />
      )}
    </div>
  );
}

// Lightning effect
function LightningEffect({
  position,
  target,
  onComplete,
}: {
  position: { x: number; y: number };
  target?: { x: number; y: number };
  onComplete?: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const endX = target?.x ?? position.x;
  const endY = target?.y ?? position.y - 100;

  return (
    <svg
      className="absolute pointer-events-none overflow-visible"
      style={{ left: position.x, top: position.y }}
      width="200"
      height="200"
    >
      <motion.path
        d={`M 0 0 L ${(endX - position.x) * 0.3} ${(endY - position.y) * 0.3} L ${(endX - position.x) * 0.5} ${(endY - position.y) * 0.6} L ${endX - position.x} ${endY - position.y}`}
        stroke="#00ffff"
        strokeWidth="4"
        fill="none"
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: 1, opacity: [1, 1, 0] }}
        transition={{ duration: 0.3 }}
        style={{
          filter: 'drop-shadow(0 0 10px #00ffff) drop-shadow(0 0 20px #0088ff)',
        }}
      />
      <motion.path
        d={`M 0 0 L ${(endX - position.x) * 0.3} ${(endY - position.y) * 0.3} L ${(endX - position.x) * 0.5} ${(endY - position.y) * 0.6} L ${endX - position.x} ${endY - position.y}`}
        stroke="#ffffff"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: 1, opacity: [1, 1, 0] }}
        transition={{ duration: 0.3 }}
      />
    </svg>
  );
}

// Critical hit effect
function CriticalHitEffect({
  position,
  value,
  onComplete,
}: {
  position: { x: number; y: number };
  value?: number | string;
  onComplete?: () => void;
}) {
  const [phase, setPhase] = useState<'freeze' | 'impact' | 'number'>('freeze');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('impact'), 300),
      setTimeout(() => setPhase('number'), 500),
      setTimeout(() => onComplete?.(), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <>
      {/* Screen dim during freeze */}
      {phase === 'freeze' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="fixed inset-0 bg-black pointer-events-none z-40"
        />
      )}

      {/* Impact flash */}
      {phase === 'impact' && (
        <ScreenFlash color="rgba(255, 200, 0, 0.5)" duration={200} />
      )}

      {/* CRITICAL text */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: phase === 'freeze' ? [0, 1.5, 1.2] : 1.2,
          opacity: phase === 'number' ? [1, 1, 0] : 1,
        }}
        transition={{ duration: phase === 'freeze' ? 0.3 : 1 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
      >
        <span
          className="text-6xl font-black text-yellow-400"
          style={{
            textShadow: '0 0 20px rgba(255, 200, 0, 0.8), 0 0 40px rgba(255, 100, 0, 0.6)',
            WebkitTextStroke: '2px #ff6600',
          }}
        >
          CRITICAL!
        </span>
      </motion.div>

      {/* Particle explosion */}
      {phase === 'impact' && (
        <ParticleBurst
          position={position}
          color="#ffd700"
          count={60}
          spread={150}
          duration={1000}
        />
      )}

      {/* Damage number */}
      {phase === 'number' && value && (
        <DamageNumber
          value={value}
          position={position}
          type="critical"
        />
      )}
    </>
  );
}

// Healing effect
function HealingEffect({
  position,
  value,
  onComplete,
}: {
  position: { x: number; y: number };
  value?: number | string;
  onComplete?: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 60,
    delay: Math.random() * 0.3,
  }));

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: position.x, top: position.y }}
    >
      {/* Rising particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: 20, opacity: 0, x: p.x }}
          animate={{ y: -60, opacity: [0, 1, 0], x: p.x }}
          transition={{ duration: 1.2, delay: p.delay }}
          className="absolute w-2 h-2 rounded-full bg-green-400"
          style={{ boxShadow: '0 0 10px #22c55e' }}
        />
      ))}

      {/* Heal number */}
      {value && (
        <DamageNumber value={value} position={{ x: 0, y: 0 }} type="heal" />
      )}
    </div>
  );
}

// Level up effect
function LevelUpEffect({ onComplete }: { onComplete?: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <>
      {/* Golden overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 2 }}
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(circle at center, rgba(255, 200, 0, 0.4), transparent)',
        }}
      />

      {/* Level up text */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.5, times: [0, 0.3, 0.7, 1] }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
      >
        <div className="text-center">
          <span
            className="block text-5xl font-black text-yellow-400"
            style={{
              textShadow: '0 0 30px rgba(255, 200, 0, 0.8)',
            }}
          >
            LEVEL UP!
          </span>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mt-2"
          />
        </div>
      </motion.div>

      {/* Particle burst */}
      <ParticleBurst
        position={{ x: window.innerWidth / 2, y: window.innerHeight / 2 }}
        color="#ffd700"
        count={80}
        spread={200}
        duration={2000}
      />
    </>
  );
}

// Victory effect
function VictoryEffect({ onComplete }: { onComplete?: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <>
      {/* Golden overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0.2] }}
        transition={{ duration: 3 }}
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: 'linear-gradient(to top, rgba(255, 200, 0, 0.3), transparent)',
        }}
      />

      {/* Victory text */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="fixed left-1/2 top-1/3 -translate-x-1/2 pointer-events-none z-50"
      >
        <span
          className="text-7xl font-black text-yellow-400"
          style={{
            textShadow: '0 0 40px rgba(255, 200, 0, 0.8), 0 4px 0 #b8860b',
          }}
        >
          VICTORY!
        </span>
      </motion.div>

      {/* Confetti particles */}
      <div className="fixed inset-0 pointer-events-none z-45 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * window.innerWidth,
              y: -20,
              rotate: 0,
            }}
            animate={{
              y: window.innerHeight + 20,
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              ease: 'linear',
            }}
            className="absolute w-3 h-3"
            style={{
              backgroundColor: ['#ffd700', '#ff6b6b', '#4ecdc4', '#a855f7', '#22c55e'][
                Math.floor(Math.random() * 5)
              ],
            }}
          />
        ))}
      </div>
    </>
  );
}

// Main VFX Manager component
interface VFXManagerProps {
  className?: string;
}

export function VFXManager({ className = '' }: VFXManagerProps) {
  const [effects, setEffects] = useState<ActiveEffect[]>([]);
  const { shake, triggerShake } = useScreenShake();
  const nextIdRef = useRef(0);

  const playEffect = useCallback((config: VFXConfig) => {
    const id = `effect_${nextIdRef.current++}`;
    const effect: ActiveEffect = {
      ...config,
      id,
      startTime: Date.now(),
    };

    setEffects((prev) => [...prev, effect]);

    // Trigger screen shake for certain effects
    if (['fireball', 'critical_hit', 'bludgeon'].includes(config.type)) {
      triggerShake(config.type === 'critical_hit' ? 15 : 8);
    }
  }, [triggerShake]);

  const removeEffect = useCallback((id: string) => {
    setEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Expose playEffect globally for easy access
  useEffect(() => {
    (window as unknown as { playVFX: typeof playEffect }).playVFX = playEffect;
    return () => {
      delete (window as unknown as { playVFX?: typeof playEffect }).playVFX;
    };
  }, [playEffect]);

  const renderEffect = (effect: ActiveEffect) => {
    const onComplete = () => {
      removeEffect(effect.id);
      effect.onComplete?.();
    };

    const position = effect.position || { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    switch (effect.type) {
      case 'fireball':
        return <FireballEffect key={effect.id} position={position} onComplete={onComplete} />;
      case 'lightning':
        return <LightningEffect key={effect.id} position={position} target={effect.target} onComplete={onComplete} />;
      case 'critical_hit':
        return <CriticalHitEffect key={effect.id} position={position} value={effect.value} onComplete={onComplete} />;
      case 'healing':
        return <HealingEffect key={effect.id} position={position} value={effect.value} onComplete={onComplete} />;
      case 'level_up':
        return <LevelUpEffect key={effect.id} onComplete={onComplete} />;
      case 'victory':
        return <VictoryEffect key={effect.id} onComplete={onComplete} />;
      case 'slash':
      case 'pierce':
      case 'bludgeon':
        return (
          <DamageNumber
            key={effect.id}
            value={effect.value || 0}
            position={position}
            type="damage"
            onComplete={onComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`fixed inset-0 pointer-events-none z-50 overflow-hidden ${className}`}
      style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}
    >
      <AnimatePresence>
        {effects.map(renderEffect)}
      </AnimatePresence>
    </motion.div>
  );
}

// Hook for playing VFX
export function useVFX() {
  const playEffect = useCallback((config: VFXConfig) => {
    const playVFX = (window as unknown as { playVFX?: (config: VFXConfig) => void }).playVFX;
    if (playVFX) {
      playVFX(config);
    }
  }, []);

  return { playEffect };
}

export default VFXManager;
