'use client';

import { motion } from 'framer-motion';

// Icon wrapper with optional animation
interface IconProps {
  className?: string;
  size?: number;
  animate?: boolean;
  color?: string;
}

const defaultIconProps = {
  size: 24,
  animate: false,
  color: 'currentColor',
};

// Ability Score Icons
export function StrengthIcon({ className = '', size = 24, animate = false, color = 'currentColor' }: IconProps) {
  const Icon = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Flexing arm / fist */}
      <path
        d="M7 14c0-1.5 1-3 3-3h4c2 0 3 1.5 3 3v4c0 1-0.5 2-2 2H9c-1.5 0-2-1-2-2v-4z"
        fill={color}
        fillOpacity="0.2"
      />
      <path
        d="M12 4v2m0 12v2m-6-8H4m16 0h-2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" fill="none" />
      <path
        d="M8 8l1 1m6-1l-1 1m-6 6l1-1m6 1l-1-1"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );

  return animate ? (
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {Icon}
    </motion.div>
  ) : Icon;
}

export function DexterityIcon({ className = '', size = 24, animate = false, color = 'currentColor' }: IconProps) {
  const Icon = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Lightning bolt / speed */}
      <path
        d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.2"
      />
    </svg>
  );

  return animate ? (
    <motion.div
      animate={{ x: [-2, 2, -2] }}
      transition={{ duration: 0.3, repeat: Infinity }}
    >
      {Icon}
    </motion.div>
  ) : Icon;
}

export function ConstitutionIcon({ className = '', size = 24, animate = false, color = 'currentColor' }: IconProps) {
  const Icon = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Heart / vitality */}
      <path
        d="M12 21s-8-4.5-8-11.8A5.5 5.5 0 0 1 12 5a5.5 5.5 0 0 1 8 4.2c0 7.3-8 11.8-8 11.8z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.2"
      />
      <path
        d="M12 8v6m-3-3h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  return animate ? (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
    >
      {Icon}
    </motion.div>
  ) : Icon;
}

export function IntelligenceIcon({ className = '', size = 24, animate = false, color = 'currentColor' }: IconProps) {
  const Icon = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Book / brain */}
      <path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.2"
      />
      <path
        d="M8 7h8M8 11h6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );

  return animate ? (
    <motion.div
      animate={{ rotateY: [0, 10, 0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      {Icon}
    </motion.div>
  ) : Icon;
}

export function WisdomIcon({ className = '', size = 24, animate = false, color = 'currentColor' }: IconProps) {
  const Icon = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Eye / perception */}
      <ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="5"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.2"
      />
      <circle cx="12" cy="12" r="3" fill={color} />
      <circle cx="12" cy="12" r="1" fill="#fff" />
    </svg>
  );

  return animate ? (
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
    >
      {Icon}
    </motion.div>
  ) : Icon;
}

export function CharismaIcon({ className = '', size = 24, animate = false, color = 'currentColor' }: IconProps) {
  const Icon = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Star / presence */}
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.2"
      />
    </svg>
  );

  return animate ? (
    <motion.div
      animate={{ rotate: [0, 5, 0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity }}
    >
      {Icon}
    </motion.div>
  ) : Icon;
}

// Class Icons
export function FighterIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Crossed swords */}
      <path
        d="M14.5 4L19 8.5l-8.5 8.5-3-3 8.5-8.5z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.2"
      />
      <path d="M5 20l3-3m0 0l2-2m-2 2l-2 2m4-4l2 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M19 5l-1.5 1.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function WizardIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Staff with orb */}
      <path d="M12 3v18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="6" r="3" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.3" />
      <path d="M8 21h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M10 12l2-3 2 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RogueIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Dagger */}
      <path
        d="M12 3l2 7h-4l2-7z"
        fill={color}
        fillOpacity="0.3"
        stroke={color}
        strokeWidth="2"
      />
      <path d="M10 10h4v4l-2 7-2-7v-4z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2" />
      <path d="M8 11h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ClericIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Holy symbol / cross with circle */}
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
      <path d="M12 6v12M8 10h8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function BarbarianIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Battle axe */}
      <path d="M12 4v16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M7 6c0 3 2 6 5 6s5-3 5-6c-1.5 1-3.5 2-5 2S8.5 7 7 6z"
        fill={color}
        fillOpacity="0.3"
        stroke={color}
        strokeWidth="2"
      />
      <path d="M10 20h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PaladinIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Shield with cross */}
      <path
        d="M12 3L4 7v6c0 5.5 3.5 8.5 8 10 4.5-1.5 8-4.5 8-10V7l-8-4z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.2"
      />
      <path d="M12 9v6M9 12h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function RangerIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Bow and arrow */}
      <path
        d="M18 4c-4 0-8 4-8 8s4 8 8 8"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <path d="M4 12h12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M13 9l3 3-3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BardIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Lute / musical instrument */}
      <ellipse cx="12" cy="15" rx="5" ry="6" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2" />
      <path d="M12 9V4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M9 4h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15" r="2" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function DruidIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Leaf / nature */}
      <path
        d="M12 3c-4.5 0-8 4-8 8 0 6 8 10 8 10s8-4 8-10c0-4-3.5-8-8-8z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.2"
      />
      <path d="M12 7v10M9 10c1.5 1 3 1.5 3 1.5s1.5-.5 3-1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function MonkIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Yin-yang / balance */}
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
      <path d="M12 3c0 5-4.5 9-4.5 9s4.5 4 4.5 9" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="8" r="1.5" fill={color} />
      <circle cx="12" cy="16" r="1.5" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function SorcererIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Flame / innate magic */}
      <path
        d="M12 2c-2 4-6 6-6 10 0 4 3 8 6 8s6-4 6-8c0-4-4-6-6-10z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.3"
      />
      <path d="M12 12c-1 1-2 2-2 4 0 1.5 1 3 2 3s2-1.5 2-3c0-2-1-3-2-4z" fill={color} />
    </svg>
  );
}

export function WarlockIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Eldritch eye / pact */}
      <path
        d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.2"
      />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.5" />
      <path d="M12 5v-2m0 16v2M5 12H3m18 0h-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// UI/Game Icons
export function SwordIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M14.5 4L19 8.5 8.5 19l-4-4L14.5 4z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.2"
      />
      <path d="M5 19l-2 2m2-2l2 2m10-16l2-2m-2 2l2 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ShieldIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2L4 5v6c0 5.5 3.5 10.5 8 12 4.5-1.5 8-6.5 8-12V5l-8-3z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.2"
      />
    </svg>
  );
}

export function HeartIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21s-8-4.5-8-11.8A5.5 5.5 0 0 1 12 4a5.5 5.5 0 0 1 8 5.2c0 7.3-8 11.8-8 11.8z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.3"
      />
    </svg>
  );
}

export function D20Icon({ className = '', size = 24, animate = false, color = 'currentColor' }: IconProps) {
  const Icon = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2L3 7v10l9 5 9-5V7l-9-5z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.2"
      />
      <path d="M12 2v20M3 7l9 5 9-5M3 17l9-5 9 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <text x="12" y="14" textAnchor="middle" fill={color} fontSize="6" fontWeight="bold">20</text>
    </svg>
  );

  return animate ? (
    <motion.div
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    >
      {Icon}
    </motion.div>
  ) : Icon;
}

export function SpellIcon({ className = '', size = 24, animate = false, color = 'currentColor' }: IconProps) {
  const Icon = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Magic sparkle */}
      <path
        d="M12 2v4m0 12v4M2 12h4m12 0h4M5.6 5.6l2.8 2.8m7.2 7.2l2.8 2.8M5.6 18.4l2.8-2.8m7.2-7.2l2.8-2.8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3" fill={color} fillOpacity="0.5" stroke={color} strokeWidth="2" />
    </svg>
  );

  return animate ? (
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {Icon}
    </motion.div>
  ) : Icon;
}

export function CoinIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.3" />
      <path d="M12 6v12M8 9h8M8 15h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ScrollIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 3c0 1-1 2-2 2v14c1 0 2 1 2 2h14c0-1 1-2 2-2V5c-1 0-2-1-2-2H5z"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.1"
      />
      <path d="M8 8h8M8 12h6M8 16h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Map icons to ability names
export const AbilityIcons: Record<string, React.FC<IconProps>> = {
  strength: StrengthIcon,
  str: StrengthIcon,
  dexterity: DexterityIcon,
  dex: DexterityIcon,
  constitution: ConstitutionIcon,
  con: ConstitutionIcon,
  intelligence: IntelligenceIcon,
  int: IntelligenceIcon,
  wisdom: WisdomIcon,
  wis: WisdomIcon,
  charisma: CharismaIcon,
  cha: CharismaIcon,
};

// Map icons to class names
export const ClassIcons: Record<string, React.FC<IconProps>> = {
  fighter: FighterIcon,
  wizard: WizardIcon,
  rogue: RogueIcon,
  cleric: ClericIcon,
  barbarian: BarbarianIcon,
  paladin: PaladinIcon,
  ranger: RangerIcon,
  bard: BardIcon,
  druid: DruidIcon,
  monk: MonkIcon,
  sorcerer: SorcererIcon,
  warlock: WarlockIcon,
};

// Helper component to render ability icon by name
export function AbilityIcon({ ability, ...props }: { ability: string } & IconProps) {
  const Icon = AbilityIcons[ability.toLowerCase()];
  if (!Icon) return null;
  return <Icon {...props} />;
}

// Helper component to render class icon by name
export function ClassIcon({ characterClass, ...props }: { characterClass: string } & IconProps) {
  const Icon = ClassIcons[characterClass.toLowerCase()];
  if (!Icon) return null;
  return <Icon {...props} />;
}
