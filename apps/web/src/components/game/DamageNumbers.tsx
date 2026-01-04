'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type DamageType =
  | 'physical'
  | 'fire'
  | 'cold'
  | 'lightning'
  | 'poison'
  | 'acid'
  | 'necrotic'
  | 'radiant'
  | 'force'
  | 'psychic'
  | 'thunder';

export interface DamageEvent {
  id: string;
  x: number;
  y: number;
  amount: number;
  type: 'damage' | 'heal' | 'critical' | 'miss' | 'blocked';
  damageType?: DamageType;
}

interface DamageNumbersProps {
  className?: string;
}

// Color mapping for damage types
const DAMAGE_COLORS: Record<DamageType | 'heal' | 'miss' | 'blocked', string> = {
  physical: '#FFFFFF',
  fire: '#FF4500',
  cold: '#00BFFF',
  lightning: '#FFD700',
  poison: '#32CD32',
  acid: '#ADFF2F',
  necrotic: '#8B008B',
  radiant: '#FFD700',
  force: '#DA70D6',
  psychic: '#FF69B4',
  thunder: '#4169E1',
  heal: '#00FF7F',
  miss: '#808080',
  blocked: '#4169E1',
};

// Global event emitter for damage numbers
type DamageListener = (event: DamageEvent) => void;
const listeners: Set<DamageListener> = new Set();

export function emitDamageNumber(event: Omit<DamageEvent, 'id'>): void {
  const fullEvent: DamageEvent = {
    ...event,
    id: `dmg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  listeners.forEach(listener => listener(fullEvent));
}

export function DamageNumbers({ className }: DamageNumbersProps) {
  const [numbers, setNumbers] = useState<DamageEvent[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to damage events
  useEffect(() => {
    const handleDamage = (event: DamageEvent) => {
      setNumbers(prev => [...prev, event]);

      // Remove after animation
      setTimeout(() => {
        setNumbers(prev => prev.filter(n => n.id !== event.id));
      }, 1500);
    };

    listeners.add(handleDamage);
    return () => {
      listeners.delete(handleDamage);
    };
  }, []);

  // Get display text and color for damage event
  const getDisplayInfo = useCallback((event: DamageEvent) => {
    let text = '';
    let color = DAMAGE_COLORS.physical;
    let scale = 1;

    switch (event.type) {
      case 'damage':
        text = `-${event.amount}`;
        color = DAMAGE_COLORS[event.damageType || 'physical'];
        break;
      case 'heal':
        text = `+${event.amount}`;
        color = DAMAGE_COLORS.heal;
        break;
      case 'critical':
        text = `${event.amount}!`;
        color = '#FFD700';
        scale = 1.3;
        break;
      case 'miss':
        text = 'MISS';
        color = DAMAGE_COLORS.miss;
        scale = 0.9;
        break;
      case 'blocked':
        text = 'BLOCKED';
        color = DAMAGE_COLORS.blocked;
        break;
    }

    return { text, color, scale };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-50 overflow-hidden ${className}`}
    >
      <AnimatePresence>
        {numbers.map(event => {
          const { text, color, scale } = getDisplayInfo(event);
          const isCritical = event.type === 'critical';

          return (
            <motion.div
              key={event.id}
              initial={{
                x: event.x,
                y: event.y,
                opacity: 0,
                scale: 0.5,
              }}
              animate={{
                x: event.x + (Math.random() - 0.5) * 30,
                y: event.y - 60,
                opacity: 1,
                scale: scale,
              }}
              exit={{
                opacity: 0,
                y: event.y - 100,
                scale: 0.8,
              }}
              transition={{
                duration: 1.2,
                ease: 'easeOut',
              }}
              className="absolute"
              style={{
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span
                className={`
                  font-cinzel font-bold whitespace-nowrap
                  ${isCritical ? 'text-3xl' : 'text-2xl'}
                `}
                style={{
                  color,
                  textShadow: `
                    2px 2px 0 #000,
                    -2px -2px 0 #000,
                    2px -2px 0 #000,
                    -2px 2px 0 #000,
                    0 0 10px ${color},
                    0 0 20px ${color}
                  `,
                }}
              >
                {text}
              </span>

              {/* Critical hit particles */}
              {isCritical && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{ background: color }}
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{
                        x: Math.cos((i * Math.PI * 2) / 8) * 40,
                        y: Math.sin((i * Math.PI * 2) / 8) * 40,
                        opacity: 0,
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default DamageNumbers;
