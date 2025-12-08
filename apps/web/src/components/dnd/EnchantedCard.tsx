'use client';

import { ReactNode } from 'react';
import { OrnateCorners } from './OrnateCorners';

type CardVariant = 'default' | 'magical' | 'legendary' | 'danger' | 'divine';

interface EnchantedCardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  showCorners?: boolean;
  hover?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'enchanted-card',
  magical: 'enchanted-card enchanted-card--magical',
  legendary: 'enchanted-card enchanted-card--legendary',
  danger: 'enchanted-card border-red-500/30',
  divine: 'enchanted-card',
};

const cornerVariants: Record<CardVariant, 'gold' | 'purple' | 'silver'> = {
  default: 'gold',
  magical: 'purple',
  legendary: 'gold',
  danger: 'gold',
  divine: 'gold',
};

export function EnchantedCard({
  children,
  variant = 'default',
  className = '',
  showCorners = false,
  hover = true,
}: EnchantedCardProps) {
  return (
    <div
      className={`
        ${variantClasses[variant]}
        ${hover ? 'magic-hover' : ''}
        relative p-6
        ${className}
      `}
    >
      {showCorners && <OrnateCorners variant={cornerVariants[variant]} />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
