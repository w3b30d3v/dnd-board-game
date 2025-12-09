'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon, ShieldIcon, D20Icon } from './DnDIcons';

interface AnimatedStatProps {
  value: number;
  label: string;
  icon?: 'hp' | 'ac' | 'initiative' | 'speed' | 'custom';
  customIcon?: React.ReactNode;
  color?: 'gold' | 'red' | 'blue' | 'green' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const colorClasses = {
  gold: {
    bg: 'from-amber-500/20 to-amber-600/30',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/30',
  },
  red: {
    bg: 'from-red-500/20 to-red-600/30',
    border: 'border-red-500/50',
    text: 'text-red-400',
    glow: 'shadow-red-500/30',
  },
  blue: {
    bg: 'from-blue-500/20 to-blue-600/30',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/30',
  },
  green: {
    bg: 'from-green-500/20 to-green-600/30',
    border: 'border-green-500/50',
    text: 'text-green-400',
    glow: 'shadow-green-500/30',
  },
  purple: {
    bg: 'from-purple-500/20 to-purple-600/30',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/30',
  },
};

const sizeClasses = {
  sm: {
    container: 'w-16 h-16',
    icon: 16,
    value: 'text-xl',
    label: 'text-[10px]',
  },
  md: {
    container: 'w-20 h-20',
    icon: 20,
    value: 'text-2xl',
    label: 'text-xs',
  },
  lg: {
    container: 'w-24 h-24',
    icon: 24,
    value: 'text-3xl',
    label: 'text-sm',
  },
};

export function AnimatedStat({
  value,
  label,
  icon = 'custom',
  customIcon,
  color = 'gold',
  size = 'md',
  animate = true,
  className = '',
}: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);
  const colors = colorClasses[color];
  const sizes = sizeClasses[size];

  // Animate count up
  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const duration = 1000; // 1 second
    const increment = value / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, animate]);

  const renderIcon = () => {
    const iconColor = colors.text.replace('text-', '').replace('-400', '');

    if (customIcon) return customIcon;

    switch (icon) {
      case 'hp':
        return <HeartIcon size={sizes.icon} color={`var(--color-${iconColor}, currentColor)`} className={colors.text} />;
      case 'ac':
        return <ShieldIcon size={sizes.icon} color={`var(--color-${iconColor}, currentColor)`} className={colors.text} />;
      case 'initiative':
        return <D20Icon size={sizes.icon} color={`var(--color-${iconColor}, currentColor)`} className={colors.text} />;
      case 'speed':
        return (
          <svg width={sizes.icon} height={sizes.icon} viewBox="0 0 24 24" fill="none" className={colors.text}>
            <path d="M13 4L7 14h5l-1 6 6-10h-5l1-6z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.3" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, type: 'spring' }}
      className={`
        ${sizes.container} relative flex flex-col items-center justify-center
        bg-gradient-to-br ${colors.bg}
        border ${colors.border}
        rounded-lg shadow-lg ${colors.glow}
        ${className}
      `}
    >
      {/* Icon at top */}
      <div className="absolute -top-2">
        {renderIcon()}
      </div>

      {/* Value */}
      <motion.span
        key={displayValue}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className={`${sizes.value} font-bold ${colors.text} mt-2`}
      >
        {displayValue}
      </motion.span>

      {/* Label */}
      <span className={`${sizes.label} text-text-muted uppercase tracking-wider`}>
        {label}
      </span>

      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-lg bg-gradient-to-t from-transparent to-white/5 pointer-events-none`} />
    </motion.div>
  );
}

// Ability Score Display Component
interface AbilityScoreDisplayProps {
  ability: string;
  score: number;
  modifier: number;
  animate?: boolean;
  className?: string;
}

export function AbilityScoreDisplay({
  ability,
  score,
  modifier,
  animate = true,
  className = '',
}: AbilityScoreDisplayProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);

  // Color based on score tier
  const getScoreColor = (s: number) => {
    if (s >= 18) return 'gold';
    if (s >= 16) return 'purple';
    if (s >= 14) return 'blue';
    if (s >= 12) return 'green';
    return 'red';
  };

  const color = getScoreColor(score);
  const colors = colorClasses[color];

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }

    let start = 0;
    const duration = 800;
    const increment = score / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [score, animate]);

  const modifierString = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: 'spring' }}
      className={`
        relative flex flex-col items-center p-3
        bg-gradient-to-br ${colors.bg}
        border-2 ${colors.border}
        rounded-lg shadow-md
        ${className}
      `}
    >
      {/* Ability name */}
      <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">
        {ability.substring(0, 3)}
      </span>

      {/* Score */}
      <motion.span
        key={displayScore}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        className={`text-2xl font-bold ${colors.text}`}
      >
        {displayScore}
      </motion.span>

      {/* Modifier */}
      <span className={`text-sm font-medium ${modifier >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {modifierString}
      </span>

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary/40 rounded-tl" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary/40 rounded-tr" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary/40 rounded-bl" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary/40 rounded-br" />
    </motion.div>
  );
}

// Stats Row Component for grouping multiple stats
interface StatsRowProps {
  children: React.ReactNode;
  className?: string;
}

export function StatsRow({ children, className = '' }: StatsRowProps) {
  return (
    <div className={`flex flex-wrap gap-4 justify-center ${className}`}>
      {children}
    </div>
  );
}
